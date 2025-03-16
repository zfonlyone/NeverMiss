import React from 'react';
import { Stack } from 'expo-router';
import SettingsScreen from '../screens/SettingsScreen';

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: '设置',
          headerShown: true,
        }}
      />
      <SettingsScreen />
    </>
  );
} 