import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initStorage } from '../services/storageService';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
        },
        headerShown: false, // 默认隐藏标题栏，在各个页面中单独控制
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'NeverMiss',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
