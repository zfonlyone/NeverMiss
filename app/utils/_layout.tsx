import React from 'react';
import { Redirect } from 'expo-router';

/**
 * 该布局文件阻止utils目录被视为路由
 * 访问此目录时会重定向到首页
 */
export default function UtilsLayout() {
  // 重定向到主页
  return <Redirect href="/" />;
} 