import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import { AppState } from 'react-native';

class NotificationService {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
    this.appState = AppState.currentState;
    this.appStateListener = null;
    this.setupNotifications();
    this.setupAppStateListener();
  }

  async setupNotifications() {
    try {
      // Request permissions
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.warn('Error setting up notifications (this is normal in Expo Go):', error.message);
    }
  }

  setupAppStateListener() {
    try {
      this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    } catch (error) {
      console.warn('Error setting up app state listener:', error.message);
    }
  }

  async handleAppStateChange(nextAppState) {
    try {
      console.log('App State Changed:', this.appState, '->', nextAppState);
      
      // Check if there's an active call (import the background call service)
      let isCallActive = false;
      let isCallStopping = false;
      try {
        const backgroundCallService = require('./background_call_service').default;
        isCallActive = await backgroundCallService.isCallActive(); // Now async
        isCallStopping = backgroundCallService.isCallStopping();
      } catch (error) {
        // If we can't check, assume no call is active
        isCallActive = false;
        isCallStopping = false;
      }
      
      // Don't play notification ringtones if there's an active call or if a call is being stopped
      if (isCallActive || isCallStopping) {
        console.log('Call is active or stopping, skipping notification ringtone');
        this.appState = nextAppState;
        return;
      }
      
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('App came to foreground');
        // Only play ringtone if no call is active
        if (!isCallActive && !isCallStopping) {
          await this.playRingtone('foreground');
          await this.showNotification('App Active', 'Welcome back! App is now in foreground.');
        }
      } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('App went to background');
        // Only play ringtone if no call is active
        if (!isCallActive && !isCallStopping) {
          await this.playRingtone('background');
          await this.showNotification('App Background', 'App is now running in background.');
        }
      }
      
      this.appState = nextAppState;
    } catch (error) {
      console.warn('Error handling app state change:', error.message);
    }
  }

  async playRingtone(type = 'default') {
    try {
      // Configure audio to stay active in background
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Stop any currently playing sound
      if (this.sound && this.isPlaying) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      }

      // Create different ringtones for different states using built-in sounds
      let soundConfig;
      switch (type) {
        case 'foreground':
          // Higher pitch for foreground
          soundConfig = this.createTone(800, 500);
          break;
        case 'background':
          // Lower pitch for background
          soundConfig = this.createTone(400, 800);
          break;
        default:
          // Medium pitch for default
          soundConfig = this.createTone(600, 600);
      }

      // Load and play the sound
      const { sound } = await Audio.Sound.createAsync(soundConfig, {
        shouldPlay: true,
        isLooping: false,
        volume: 0.7,
        staysActiveInBackground: true,
        progressUpdateIntervalMillis: 100,
      });

      this.sound = sound;
      this.isPlaying = true;

      // Listen for when sound finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.isPlaying = false;
        }
        // If audio stops unexpectedly, try to resume
        if (status.isLoaded && !status.isPlaying && this.isPlaying) {
          sound.playAsync().catch(() => {
            console.log('Could not resume audio in background');
          });
        }
      });

      console.log(`Playing ${type} ringtone`);
    } catch (error) {
      console.error('Error playing ringtone:', error);
      // Fallback: create a simple beep sound
      await this.playFallbackSound();
    }
  }

  createTone(frequency = 600, duration = 500) {
    // Create a simple tone using Web Audio API
    const sampleRate = 22050; // Lower sample rate to avoid stack overflow
    const samples = Math.floor(sampleRate * duration / 1000);
    const audioData = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    }
    
    // Convert to base64 WAV format
    const wavHeader = this.createWavHeader(samples, sampleRate);
    const audioBuffer = new Uint8Array(wavHeader.length + samples * 2); // 16-bit samples
    
    audioBuffer.set(wavHeader, 0);
    const view = new DataView(audioBuffer.buffer, wavHeader.length);
    
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, sample * 32767, true);
    }
    
    const base64 = this.arrayBufferToBase64(audioBuffer.buffer);
    return { uri: `data:audio/wav;base64,${base64}` };
  }

  createWavHeader(samples, sampleRate) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true); // 16-bit samples
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // 16-bit mono
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    return new Uint8Array(buffer);
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    
    // Process in chunks to avoid stack overflow
    const chunkSize = 1024;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.slice(i, Math.min(i + chunkSize, len));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    
    return btoa(binary);
  }

  async playFallbackSound() {
    try {
      // Simple beep using a basic tone
      const { sound } = await Audio.Sound.createAsync(
        this.createTone(500, 300),
        { shouldPlay: true, volume: 0.5 }
      );
      
      this.sound = sound;
      this.isPlaying = true;
      
      setTimeout(() => {
        if (this.sound) {
          this.sound.unloadAsync();
          this.isPlaying = false;
        }
      }, 300);
    } catch (error) {
      console.error('Error playing fallback sound:', error);
    }
  }

  async showNotification(title, body) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.warn('Error showing notification (this is normal in Expo Go):', error.message);
    }
  }

  async stopSound() {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.isPlaying = false;
      }
    } catch (error) {
      console.warn('Error stopping sound:', error.message);
    }
  }

  // Manual trigger for testing
  async triggerTestRingtone() {
    try {
      await this.playRingtone('default');
      await this.showNotification('Test Ringtone', 'Manual trigger test');
    } catch (error) {
      console.warn('Error triggering test ringtone:', error.message);
    }
  }

  // Cleanup
  cleanup() {
    try {
      this.stopSound();
      if (this.appStateListener) {
        this.appStateListener.remove();
      }
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  }
}

export default new NotificationService(); 