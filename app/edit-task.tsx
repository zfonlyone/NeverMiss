/**
 * Edit Task Screen for NeverMiss
 * @author zfonlyone
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import TaskFormInline from '../components/TaskFormInline';
import { getTask } from '../models/services/taskService';
import { Task } from '../models/Task';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    async function loadTask() {
      if (!id) {
        setError(t.task.taskIdNotFound);
        setIsLoading(false);
        return;
      }

      try {
        const taskId = parseInt(id as string);
        const loadedTask = await getTask(taskId);
        
        if (loadedTask) {
          setTask(loadedTask);
        } else {
          setError(t.task.taskNotFound);
        }
      } catch (error) {
        console.error('Error loading task:', error);
        setError(t.task.loadTaskFailed);
      } finally {
        setIsLoading(false);
      }
    }

    loadTask();
  }, [id, t]);

  const handleSave = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: t.task.editTask,
          headerShown: true,
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.card },
        }}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t.common.loading}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : task ? (
        <TaskFormInline
          task={task}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 