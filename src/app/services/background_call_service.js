import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const BACKGROUND_CALL_TASK = 'background-call-task';
const CALL_TRIGGER_KEY = 'call_trigger_time';
const CALL_STOPPING_KEY = 'call_stopping';

class BackgroundCallService {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
    this.callDuration = 10000; // 10 seconds
    this.isInitialized = false;
    this.appStateListener = null;
    this.isStopping = false; // Add flag to track stopping state
    this.setupBackgroundTask();
    this.setupAppStateListener();
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
      console.log('Background Call Service - App State:', nextAppState);
      
      // If we're playing a call and app goes to background, ensure audio continues
      if (this.isPlaying && this.sound && nextAppState.match(/inactive|background/)) {
        console.log('Ensuring call audio continues in background...');
        
        // Reconfigure audio mode for background (simplified)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // Ensure sound is still playing
        try {
          const status = await this.sound.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            console.log('Resuming call audio in background...');
            await this.sound.playAsync();
            console.log('Call audio resumed successfully in background');
          } else if (status.isLoaded && status.isPlaying) {
            console.log('Call audio is already playing in background');
          }
        } catch (statusError) {
          console.warn('Error checking sound status:', statusError.message);
        }
        
        // Set up a more aggressive keep-alive for background
        if (!this.backgroundKeepAliveInterval) {
          this.backgroundKeepAliveInterval = setInterval(async () => {
            if (this.isPlaying && this.sound && !this.isStopping) {
              try {
                const status = await this.sound.getStatusAsync();
                if (status.isLoaded && !status.isPlaying) {
                  console.log('Background keep-alive: resuming call audio...');
                  await this.sound.playAsync();
                }
              } catch (error) {
                console.log('Background keep-alive error:', error.message);
              }
            }
          }, 1000); // Check every second when in background
        }
      } else if (nextAppState === 'active' && this.backgroundKeepAliveInterval) {
        // Clear background keep-alive when app comes to foreground
        clearInterval(this.backgroundKeepAliveInterval);
        this.backgroundKeepAliveInterval = null;
        console.log('Cleared background keep-alive interval');
      }
    } catch (error) {
      console.warn('Error handling app state change in call service:', error.message);
    }
  }

  async setupBackgroundTask() {
    try {
      // Check if task is already defined
      if (TaskManager.isTaskDefined(BACKGROUND_CALL_TASK)) {
        console.log('Background call task already defined');
        return;
      }

      // Register background task
      TaskManager.defineTask(BACKGROUND_CALL_TASK, async () => {
        try {
          const shouldRing = await this.shouldTriggerCall();
          if (shouldRing) {
            await this.triggerBackgroundCall();
            return BackgroundTask.BackgroundTaskResult.NewData;
          }
          return BackgroundTask.BackgroundTaskResult.NoData;
        } catch (error) {
          console.error('Background task error:', error);
          return BackgroundTask.BackgroundTaskResult.Failed;
        }
      });

      // Register background task with error handling
      try {
        await BackgroundTask.registerTaskAsync(BACKGROUND_CALL_TASK, {
          minimumInterval: 15, // Minimum 15 seconds
        });
        this.isInitialized = true;
        console.log('Background call task registered successfully');
      } catch (registerError) {
        console.warn('Background task registration failed (this is normal in Expo Go):', registerError.message);
        // This is expected in Expo Go, but will work in development builds
      }
    } catch (error) {
      console.warn('Error setting up background task (this is normal in Expo Go):', error.message);
      // Don't throw error, just log warning
    }
  }

  async shouldTriggerCall() {
    try {
      const triggerTime = await AsyncStorage.getItem(CALL_TRIGGER_KEY);
      if (!triggerTime) return false;

      const now = Date.now();
      const trigger = parseInt(triggerTime);
      
      // Check if it's time to trigger the call
      if (now >= trigger) {
        // Clear the trigger
        await AsyncStorage.removeItem(CALL_TRIGGER_KEY);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking call trigger:', error);
      return false;
    }
  }

  async scheduleCall(delaySeconds = 10) {
    try {
      const triggerTime = Date.now() + (delaySeconds * 1000);
      await AsyncStorage.setItem(CALL_TRIGGER_KEY, triggerTime.toString());
      
      console.log(`Call scheduled for ${new Date(triggerTime).toLocaleTimeString()}`);
      
      // Show immediate notification
      await this.showCallNotification('Call Scheduled', `Incoming call in ${delaySeconds} seconds`);
      
      return true;
    } catch (error) {
      console.error('Error scheduling call:', error);
      return false;
    }
  }

  async triggerBackgroundCall() {
    try {
      console.log('Triggering background call...');
      
      // Show high-priority notification
      await this.showCallNotification(
        'Incoming Call',
        'You have an incoming call!',
        true
      );

      // Play ringtone (this will work even when app is closed)
      await this.playCallRingtone();
      
      return true;
    } catch (error) {
      console.error('Error triggering background call:', error);
      return false;
    }
  }

  async playCallRingtone() {
    try {
      // Configure audio to stay active in background (simplified)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Try multiple approaches for maximum reliability
      let sound;
      
      // Approach 1: Try using a simple beep sound (most reliable)
      try {
        const { sound: beepSound } = await Audio.Sound.createAsync(
          this.createSimpleBeep(),
          {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
            staysActiveInBackground: true,
            progressUpdateIntervalMillis: 100,
          }
        );
        sound = beepSound;
        console.log('Using simple beep ringtone');
      } catch (beepError) {
        console.log('Beep ringtone failed, trying generated ringtone');
        
        // Approach 2: Try generated ringtone
        try {
          const ringtoneConfig = this.createLongRingtone();
          const { sound: generatedSound } = await Audio.Sound.createAsync(ringtoneConfig, {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
            staysActiveInBackground: true,
            progressUpdateIntervalMillis: 100,
          });
          sound = generatedSound;
          console.log('Using generated ringtone');
        } catch (generatedError) {
          console.log('Generated ringtone failed, using fallback');
          // Approach 3: Use the most basic fallback
          const { sound: fallbackSound } = await Audio.Sound.createAsync(
            this.createSimpleRingtone(),
            { shouldPlay: true, volume: 0.5, isLooping: true }
          );
          sound = fallbackSound;
        }
      }

      this.sound = sound;
      this.isPlaying = true;

      // Set up status update listener to handle background/foreground
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.isPlaying = false;
        }
        // If audio stops unexpectedly, try to resume immediately (only if not stopping)
        if (status.isLoaded && !status.isPlaying && this.isPlaying && !this.isStopping) {
          console.log('Call audio stopped unexpectedly, attempting to resume...');
          // Use setTimeout to avoid immediate retry
          setTimeout(() => {
            if (this.isPlaying && this.sound && !this.isStopping) {
              this.sound.playAsync().catch((error) => {
                console.log('Could not resume call audio:', error.message);
              });
            }
          }, 100);
        }
      });

      // Keep audio alive by periodically checking and resuming if needed
      this.audioKeepAliveInterval = setInterval(async () => {
        if (this.isPlaying && this.sound && !this.isStopping) {
          try {
            const status = await this.sound.getStatusAsync();
            if (status.isLoaded && !status.isPlaying) {
              console.log('Keeping call audio alive...');
              await this.sound.playAsync();
            }
          } catch (error) {
            console.log('Error in audio keep-alive:', error.message);
          }
        }
      }, 2000); // Check every 2 seconds

      // Stop after call duration
      setTimeout(async () => {
        if (this.sound && this.isPlaying) {
          console.log('Call duration completed, stopping ringtone');
          if (this.audioKeepAliveInterval) {
            clearInterval(this.audioKeepAliveInterval);
            this.audioKeepAliveInterval = null;
          }
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
          this.isPlaying = false;
        }
      }, this.callDuration);

      console.log('Call ringtone started successfully');
    } catch (error) {
      console.error('Error playing call ringtone:', error);
      // Final fallback
      await this.playFallbackBeep();
    }
  }

  createLongRingtone() {
    // Create a longer ringtone (5 seconds) that's more likely to persist in background
    const sampleRate = 22050;
    const duration = 5000; // 5 seconds
    const frequency = 800;
    
    const samples = Math.floor(sampleRate * duration / 1000);
    const audioData = new Float32Array(samples);
    
    // Generate a more complex pattern that's less likely to be interrupted
    for (let i = 0; i < samples; i++) {
      const time = i / sampleRate;
      // Create a pattern with multiple frequencies
      const wave1 = Math.sin(2 * Math.PI * frequency * time) * 0.3;
      const wave2 = Math.sin(2 * Math.PI * (frequency * 1.5) * time) * 0.1;
      audioData[i] = wave1 + wave2;
    }
    
    // Create a simple WAV header
    const wavHeader = this.createSimpleWavHeader(samples, sampleRate);
    const audioBuffer = new Uint8Array(wavHeader.length + samples * 2);
    
    // Copy header
    audioBuffer.set(wavHeader, 0);
    
    // Convert float samples to 16-bit PCM
    const view = new DataView(audioBuffer.buffer, wavHeader.length);
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, sample * 32767, true);
    }
    
    // Convert to base64 using a safer method
    const base64 = this.arrayBufferToBase64(audioBuffer.buffer);
    return { uri: `data:audio/wav;base64,${base64}` };
  }

  createSimpleBeep() {
    // Create a very simple beep that's most likely to work in background
    const sampleRate = 22050;
    const duration = 1000; // 1 second
    const frequency = 800;
    
    const samples = Math.floor(sampleRate * duration / 1000);
    const audioData = new Float32Array(samples);
    
    // Generate simple sine wave
    for (let i = 0; i < samples; i++) {
      audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    }
    
    // Create a simple WAV header
    const wavHeader = this.createSimpleWavHeader(samples, sampleRate);
    const audioBuffer = new Uint8Array(wavHeader.length + samples * 2);
    
    // Copy header
    audioBuffer.set(wavHeader, 0);
    
    // Convert float samples to 16-bit PCM
    const view = new DataView(audioBuffer.buffer, wavHeader.length);
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, sample * 32767, true);
    }
    
    // Convert to base64 using a safer method
    const base64 = this.arrayBufferToBase64(audioBuffer.buffer);
    return { uri: `data:audio/wav;base64,${base64}` };
  }

  createSimpleRingtone() {
    // Create a simple beep sound that won't cause stack overflow
    const sampleRate = 22050; // Lower sample rate to reduce complexity
    const duration = 1000; // 1 second
    const frequency = 800; // 800Hz tone
    
    const samples = Math.floor(sampleRate * duration / 1000);
    const audioData = new Float32Array(samples);
    
    // Generate simple sine wave
    for (let i = 0; i < samples; i++) {
      audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    }
    
    // Create a simple WAV header
    const wavHeader = this.createSimpleWavHeader(samples, sampleRate);
    const audioBuffer = new Uint8Array(wavHeader.length + samples * 2); // 16-bit samples
    
    // Copy header
    audioBuffer.set(wavHeader, 0);
    
    // Convert float samples to 16-bit PCM
    const view = new DataView(audioBuffer.buffer, wavHeader.length);
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, sample * 32767, true);
    }
    
    // Convert to base64 using a safer method
    const base64 = this.arrayBufferToBase64(audioBuffer.buffer);
    return { uri: `data:audio/wav;base64,${base64}` };
  }

  createSimpleWavHeader(samples, sampleRate) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
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

  async playFallbackBeep() {
    try {
      // Create a very simple beep using a basic tone
      const { sound } = await Audio.Sound.createAsync(
        this.createSimpleRingtone(), // Use the same method as main ringtone
        { shouldPlay: true, volume: 0.5, isLooping: true }
      );
      
      this.sound = sound;
      this.isPlaying = true;
      
      setTimeout(() => {
        if (this.sound) {
          this.sound.unloadAsync();
          this.isPlaying = false;
        }
      }, this.callDuration);
      
      console.log('Fallback beep started');
    } catch (error) {
      console.error('Error playing fallback beep:', error);
    }
  }

  async showCallNotification(title, body, highPriority = false) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: highPriority ? 'default' : true,
          priority: highPriority ? 
            Notifications.AndroidNotificationPriority.MAX : 
            Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'call' },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing call notification:', error);
    }
  }

  async stopCall() {
    try {
      console.log('Stopping call...');
      
      // Set the stopping flag immediately to prevent other services from interfering
      this.isStopping = true;
      
      // Stop the sound immediately
      if (this.sound && this.isPlaying) {
        console.log('Stopping sound...');
        try {
          await this.sound.stopAsync();
        } catch (e) {
          console.log('Error stopping sound:', e.message);
        }
        try {
          await this.sound.unloadAsync();
        } catch (e) {
          console.log('Error unloading sound:', e.message);
        }
        this.isPlaying = false;
        this.sound = null;
      }
      
      // Clear the regular keep-alive interval immediately
      if (this.audioKeepAliveInterval) {
        console.log('Clearing audio keep-alive interval...');
        clearInterval(this.audioKeepAliveInterval);
        this.audioKeepAliveInterval = null;
      }
      
      // Clear the background keep-alive interval immediately
      if (this.backgroundKeepAliveInterval) {
        console.log('Clearing background keep-alive interval...');
        clearInterval(this.backgroundKeepAliveInterval);
        this.backgroundKeepAliveInterval = null;
      }
      
      // Clear any scheduled calls
      try {
        await AsyncStorage.removeItem(CALL_TRIGGER_KEY);
        await AsyncStorage.removeItem(CALL_STOPPING_KEY);
      } catch (e) {
        console.log('Error clearing storage:', e.message);
      }
      
      // Reset the stopping flag after a short delay to ensure everything is stopped
      setTimeout(() => {
        this.isStopping = false;
        console.log('Call stop process completed');
      }, 1000);
      
      console.log('Call stopped successfully');
    } catch (error) {
      console.error('Error stopping call:', error);
      // Force stop as fallback
      await this.forceStopCall();
    }
  }

  async forceStopCall() {
    try {
      console.log('Force stopping call...');
      
      // Force stop everything
      this.isPlaying = false;
      this.isStopping = false; // Ensure stopping flag is reset
      
      if (this.sound) {
        try {
          await this.sound.stopAsync();
        } catch (e) {
          console.log('Error stopping sound:', e.message);
        }
        try {
          await this.sound.unloadAsync();
        } catch (e) {
          console.log('Error unloading sound:', e.message);
        }
        this.sound = null;
      }
      
      // Clear all intervals
      if (this.audioKeepAliveInterval) {
        clearInterval(this.audioKeepAliveInterval);
        this.audioKeepAliveInterval = null;
      }
      
      if (this.backgroundKeepAliveInterval) {
        clearInterval(this.backgroundKeepAliveInterval);
        this.backgroundKeepAliveInterval = null;
      }
      
      // Clear scheduled calls
      try {
        await AsyncStorage.removeItem(CALL_TRIGGER_KEY);
      } catch (e) {
        console.log('Error clearing scheduled call:', e.message);
      }
      
      console.log('Call force stopped');
    } catch (error) {
      console.error('Error in force stop call:', error);
    }
  }

  async forceStopAnyAudio() {
    try {
      console.log('Force stopping any playing audio...');
      
      // Set stopping flag
      this.isStopping = true;
      
      // Force stop the sound object if it exists
      if (this.sound) {
        try {
          const status = await this.sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            console.log('Force stopping playing sound...');
            await this.sound.stopAsync();
          }
          await this.sound.unloadAsync();
        } catch (e) {
          console.log('Error force stopping sound:', e.message);
        }
        this.sound = null;
      }
      
      // Reset flags
      this.isPlaying = false;
      
      // Clear all intervals
      if (this.audioKeepAliveInterval) {
        clearInterval(this.audioKeepAliveInterval);
        this.audioKeepAliveInterval = null;
      }
      
      if (this.backgroundKeepAliveInterval) {
        clearInterval(this.backgroundKeepAliveInterval);
        this.backgroundKeepAliveInterval = null;
      }
      
      // Stop notification service
      try {
        const notificationService = require('./notification_service').default;
        await notificationService.stopSound();
      } catch (e) {
        console.log('Error stopping notification service:', e.message);
      }
      
      console.log('Force stop completed');
      
      // Keep stopping flag active for a while
      setTimeout(() => {
        this.isStopping = false;
        console.log('Force stop process completed');
      }, 3000);
      
    } catch (error) {
      console.error('Error in force stop any audio:', error);
    }
  }

  async disableAllAudio() {
    try {
      console.log('Disabling all audio functionality...');
      
      // Set stopping flag
      this.isStopping = true;
      
      // Stop all current audio
      await this.forceStopCall();
      
      // Stop notification service
      try {
        const notificationService = require('./notification_service').default;
        await notificationService.stopSound();
      } catch (e) {
        console.log('Error stopping notification service:', e.message);
      }
      
      // Disable all audio functionality for 5 seconds
      setTimeout(() => {
        this.isStopping = false;
        console.log('Audio functionality re-enabled');
      }, 5000);
      
      console.log('All audio functionality disabled for 5 seconds');
    } catch (error) {
      console.error('Error disabling audio:', error);
    }
  }

  async stopAllAudio() {
    try {
      console.log('Stopping all audio...');
      
      // Immediately set stopping flag to prevent any new audio
      this.isStopping = true;
      
      // Force stop call audio with aggressive cleanup
      await this.forceStopCall();
      
      // Stop notification service audio
      try {
        const notificationService = require('./notification_service').default;
        await notificationService.stopSound();
      } catch (e) {
        console.log('Error stopping notification audio:', e.message);
      }
      
      // Additional cleanup to ensure no audio can restart
      this.isPlaying = false;
      this.sound = null;
      
      // Clear any remaining intervals
      if (this.audioKeepAliveInterval) {
        clearInterval(this.audioKeepAliveInterval);
        this.audioKeepAliveInterval = null;
      }
      
      if (this.backgroundKeepAliveInterval) {
        clearInterval(this.backgroundKeepAliveInterval);
        this.backgroundKeepAliveInterval = null;
      }
      
      // Clear storage
      try {
        await AsyncStorage.removeItem(CALL_TRIGGER_KEY);
        await AsyncStorage.removeItem(CALL_STOPPING_KEY);
      } catch (e) {
        console.log('Error clearing storage:', e.message);
      }
      
      console.log('All audio stopped aggressively');
      
      // Keep stopping flag active for a bit longer to prevent any restart
      setTimeout(() => {
        this.isStopping = false;
        console.log('Audio stop process fully completed');
      }, 2000);
      
    } catch (error) {
      console.error('Error stopping all audio:', error);
      // Even if there's an error, force the stopping state
      this.isStopping = true;
      this.isPlaying = false;
      this.sound = null;
    }
  }

  // Manual trigger for testing
  async triggerTestCall() {
    try {
      await this.triggerBackgroundCall();
      return true;
    } catch (error) {
      console.error('Error triggering test call:', error);
      return false;
    }
  }

  // Check if call is currently active
  async isCallActive() {
    try {
      // Check if we have a sound object and it's actually playing
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        return status.isLoaded && status.isPlaying;
      }
      return false;
    } catch (error) {
      console.log('Error checking call status:', error.message);
      // Fallback to flag-based check
      return this.isPlaying && this.sound !== null;
    }
  }

  // Check if call is currently being stopped
  isCallStopping() {
    return this.isStopping;
  }

  // Cleanup
  cleanup() {
    this.stopCall();
    try {
      if (this.appStateListener) {
        this.appStateListener.remove();
      }
      if (this.backgroundKeepAliveInterval) {
        clearInterval(this.backgroundKeepAliveInterval);
        this.backgroundKeepAliveInterval = null;
      }
    } catch (error) {
      console.warn('Error removing app state listener:', error.message);
    }
    if (this.isInitialized) {
      BackgroundTask.unregisterTaskAsync(BACKGROUND_CALL_TASK).catch(() => {
        // Ignore cleanup errors
      });
    }
  }
}

export default new BackgroundCallService(); 