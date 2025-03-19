/**
 * NeverMiss App
 * @author zfonlyone
 * 
 * Main application entry point
 */

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './app/navigation/MainNavigator';
import { LanguageProvider } from './hooks/useLanguage';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
} 