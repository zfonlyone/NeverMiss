import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme, Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 主题类型
export type ThemeMode = 'auto' | 'dark' | 'light';

// 主题上下文类型
interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  colors: {
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;
    primary: string;
    accent: string;
    error: string;
    success: string;
  };
}

// 创建上下文
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'auto',
  isDarkMode: false,
  setThemeMode: async () => {},
  colors: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#000000',
    subText: '#666666',
    border: '#dddddd',
    primary: '#2196F3',
    accent: '#FF9800',
    error: '#F44336',
    success: '#4CAF50',
  },
});

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // 加载保存的主题设置
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode) {
          setThemeModeState(savedThemeMode as ThemeMode);
          updateIsDarkMode(savedThemeMode as ThemeMode, systemColorScheme);
        }
      } catch (error) {
        console.error('加载主题设置失败:', error);
      }
    };

    loadThemeMode();
  }, [systemColorScheme]);

  // 监听系统主题变化
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'auto') {
        setIsDarkMode(colorScheme === 'dark');
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  // 更新 isDarkMode 状态
  const updateIsDarkMode = (mode: ThemeMode, systemTheme: ColorSchemeName) => {
    if (mode === 'auto') {
      setIsDarkMode(systemTheme === 'dark');
    } else {
      setIsDarkMode(mode === 'dark');
    }
  };

  // 设置主题模式
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      updateIsDarkMode(mode, systemColorScheme);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  };

  // 根据当前主题模式获取颜色
  const colors = {
    background: isDarkMode ? '#121212' : '#f5f5f5',
    card: isDarkMode ? '#1c1c1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    subText: isDarkMode ? '#aaaaaa' : '#666666',
    border: isDarkMode ? '#444444' : '#dddddd',
    primary: '#2196F3',
    accent: '#FF9800',
    error: '#F44336',
    success: '#4CAF50',
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDarkMode,
        setThemeMode,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// 使用主题的钩子
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 