/**
 * NeverMiss App
 * @author zfonlyone
 * 
 * Main application entry point
 */

import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initStorage } from './services/storageService';
import { configureNotifications } from './services/notificationService';

// Keep splash screen visible while resources are loading
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      await initStorage();
      await configureNotifications();
    };
    
    initApp();
  }, []);

  return (
    <SafeAreaProvider>
      <Slot />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
} 