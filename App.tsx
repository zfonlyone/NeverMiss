/**
 * NeverMiss App
 * @author zfonlyone
 * 
 * Main application entry point
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './app/navigation/MainNavigator';
import { LanguageProvider } from './contexts/LanguageContext';
import { initializePersistentNotification } from './controllers/NotificationController';
import { configureNotifications, checkiOSPushNotificationsSupport } from './services/notificationService';
import { initializeSpecialDates } from './services/specialDateService';
import { Platform } from 'react-native';

export default function App() {
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState<boolean | null>(null);
  
  useEffect(() => {
    // 初始化应用
    const initializeApp = async () => {
      try {
        // 检查iOS环境是否支持推送通知
        if (Platform.OS === 'ios') {
          const supported = await checkiOSPushNotificationsSupport();
          setPushNotificationsSupported(supported);
          console.log(`iOS推送通知支持状态: ${supported ? '支持' : '不支持'}`);
        } else {
          setPushNotificationsSupported(true); // Android默认支持
        }
        
        // 配置通知
        await configureNotifications();
        // 初始化通知栏常驻
        await initializePersistentNotification();
        // 初始化特殊日期数据
        await initializeSpecialDates();
        
        console.log('应用初始化完成');
      } catch (error) {
        console.error('初始化应用时出错:', error);
      }
    };
    
    initializeApp();
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