import React from 'react';
import { Stack } from 'expo-router';
import HomeScreen from '../screens/HomeScreen';

export default function TasksScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: '任务管理',
          headerShown: true,
        }}
      />
      <HomeScreen />
    </>
  );
} 