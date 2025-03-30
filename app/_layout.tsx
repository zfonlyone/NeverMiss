import React, { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initStorage } from './services/storageService';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

// 确保启动屏幕保持可见，直到明确隐藏
SplashScreen.preventAutoHideAsync().catch(() => {});

// 判断是否在ExpoGo中运行
const isInExpoGo = Constants.appOwnership === 'expo';

export default function AppLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    // 防止重复初始化
    if (initRef.current) return;
    initRef.current = true;

    async function prepare() {
      try {
        // 初始化存储
        await initStorage();
        console.log('存储初始化成功');
        
      } catch (e) {
        console.warn('初始化应用程序时出错:', e);
      } finally {
        // 延迟短暂时间设置准备状态，避免渲染冲突
        setTimeout(() => {
          setAppIsReady(true);
        }, 100);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // 应用程序准备就绪后隐藏启动屏幕
      SplashScreen.hideAsync().catch(() => {
        // 隐藏启动屏幕可能会失败，如果它已经被隐藏
        // 这不是严重错误，所以我们静默处理
      });
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1 }}></View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
