import React, { useEffect, useState, useRef } from 'react';
import { Stack, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initStorage } from './services/storageService';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

// 确保启动屏幕保持可见，直到明确隐藏
SplashScreen.preventAutoHideAsync().catch(() => {});

// 错误边界组件
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("应用错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>出错了</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <Text style={styles.errorHint}>请尝试重启应用</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            {/* 使用Slot代替Stack更通用地处理路由 */}
            <Slot />
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  errorHint: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});
