import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/app/navigations/app_navigator';
import notificationService from './src/app/services/notification_service';
import backgroundCallService from './src/app/services/background_call_service';
import { AuthProvider } from './src/app/context/auth_context';

export default function App() {
  useEffect(() => {
    // Initialize services
    const initServices = async () => {
      try {
        // Request audio permissions
        await notificationService.setupNotifications();
        console.log('Notification service initialized');
        
        // Background call service is auto-initialized
        console.log('Background call service initialized');
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initServices();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
      backgroundCallService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
