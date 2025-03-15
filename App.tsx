import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while resources are loading
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  return (
    <SafeAreaProvider>
      <Slot />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
} 