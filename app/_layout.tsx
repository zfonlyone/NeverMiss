import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initStorage } from '../services/storageService';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// 确保启动屏幕保持可见，直到明确隐藏
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 初始化存储
        await initStorage();
        console.log('存储初始化成功');
      } catch (e) {
        console.warn('初始化应用程序时出错:', e);
      } finally {
        setAppIsReady(true);
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
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
