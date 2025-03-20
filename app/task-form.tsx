import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import TaskFormScreen from './screens/TaskFormScreen';

export default function TaskFormRoute() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const taskId = params.taskId ? Number(params.taskId) : undefined;

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <Stack.Screen
        options={{
          title: taskId ? t.task.editTask : t.task.newTask,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: 'bold'
          },
        }}
      />
      <TaskFormScreen taskId={taskId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 