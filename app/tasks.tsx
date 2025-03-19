import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../contexts/ThemeContext';
import TaskListScreen from './screens/TaskListScreen';

export default function TasksScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <Stack.Screen
        options={{
          title: t.menu.taskManagement,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      />
      <TaskListScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 