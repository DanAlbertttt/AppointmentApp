import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import storageService from '../services/storage_service';
import authService from '../services/auth_service';
import backgroundCallService from '../services/background_call_service';
import { useAuth } from '../context/auth_context';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await storageService.getUser();
      const token = await storageService.getToken();
      
      if (!userData || !token) {
        // No user data or token, redirect to login
        await logout();
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    setLogoutLoading(true);
    try {
      // Call logout API
      await authService.logout();
      
      // Use the auth context to handle logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, clear local storage and redirect
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleTestCall = async () => {
    try {
      const success = await backgroundCallService.triggerTestCall();
      if (success) {
        Alert.alert('Test Call', 'Phone call ringtone triggered!');
      } else {
        Alert.alert('Error', 'Failed to trigger call');
      }
    } catch (error) {
      console.error('Error triggering test call:', error);
      Alert.alert('Error', 'Failed to trigger call');
    }
  };

  const handleStopCall = async () => {
    try {
      console.log('User pressed Stop Call button');
      
      // Try to use forceStopAnyAudio, fallback to forceStopCall if not available
      if (backgroundCallService.forceStopAnyAudio) {
        await backgroundCallService.forceStopAnyAudio();
      } else {
        console.log('forceStopAnyAudio not available, using forceStopCall');
        await backgroundCallService.forceStopCall();
      }
      
      // Check if there's still audio playing after force stop
      const isStillActive = await backgroundCallService.isCallActive();
      
      if (!isStillActive) {
        Alert.alert('Call Stopped', 'Call ringtone has been stopped successfully');
      } else {
        Alert.alert('Warning', 'Call may still be playing. Please try again.');
      }
    } catch (error) {
      console.error('Error stopping call:', error);
      Alert.alert('Error', 'Failed to stop call. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.name || 'Doctor'}!</Text>
        <Text style={styles.subtitle}>You are successfully logged in</Text>
      </View>

      <View style={styles.userCard}>
        <Text style={styles.cardTitle}>Doctor Information</Text>
        <View style={styles.userInfo}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.infoLabel}>Doctor ID:</Text>
          <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
        </View>
        {user?.phone && (
          <View style={styles.userInfo}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
        {user?.devices && user.devices.length > 0 && (
          <View style={styles.userInfo}>
            <Text style={styles.infoLabel}>Devices:</Text>
            <Text style={styles.infoValue}>{user.devices.length} connected</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Call Features</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>📞 Test Phone Call</Text>
          <Text style={styles.featureDescription}>
            Test phone call ringtone (works even when app is closed)
          </Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestCall}
          >
            <Text style={styles.testButtonText}>Test Call Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🛑 Stop Call</Text>
          <Text style={styles.featureDescription}>
            Stop any currently playing call ringtone
          </Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleStopCall}
          >
            <Text style={styles.testButtonText}>Stop Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#34C759',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen; 