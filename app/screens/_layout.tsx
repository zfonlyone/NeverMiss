import React from 'react';
import { Stack } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 屏幕布局组件
 * 为所有屏幕提供统一的导航栈设置
 */
export default function ScreensLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background
        }
      }}
    />
  );
} 