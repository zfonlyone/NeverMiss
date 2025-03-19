/**
 * NeverMiss App
 * @author zfonlyone
 * 
 * Main application entry point
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './app/navigation/MainNavigator';
import { LanguageProvider } from './contexts/LanguageContext';
import { initializePersistentNotification } from './controllers/NotificationController';
import { configureNotifications } from './services/notificationService';

export default function App() {
  useEffect(() => {
    // 初始化通知
    const initializeApp = async () => {
      // 配置通知
      await configureNotifications();
      // 初始化通知栏常驻
      await initializePersistentNotification();
    };
    
    initializeApp().catch(error => {
      console.error('初始化应用时出错:', error);
    });
  }, []);
  
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