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
import { initializeSpecialDates } from './services/specialDateService';
import { recalculateAllTaskDates } from './services/taskService';

export default function App() {
  useEffect(() => {
    // 初始化应用
    const initializeApp = async () => {
      try {
        // 配置通知
        await configureNotifications();
        // 初始化通知栏常驻
        await initializePersistentNotification();
        // 初始化特殊日期数据
        await initializeSpecialDates();
        // 重新计算所有任务日期
        await recalculateAllTaskDates(true);
        
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