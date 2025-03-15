import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../services/database';

export default function Layout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize the database
        await initDatabase();
        console.log('Database initialized successfully');
      } catch (e) {
        console.warn('Error initializing app:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen once the app is ready
      SplashScreen.hideAsync().catch(() => {
        // Hiding the splash screen may fail if it was already hidden
        // Failure is silent as it's not a critical error
      });
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#000000' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: isDarkMode ? '#000000' : '#f5f5f5',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'NeverMiss',
        }}
      />
    </Stack>
  );
}
