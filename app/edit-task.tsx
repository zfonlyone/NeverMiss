/**
 * Edit Task Screen for NeverMiss
 * @author zfonlyone
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import TaskFormInline from '../components/TaskFormInline';
import { getTask } from '../services/taskService';
import { Task } from '../models/Task';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function EditTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const taskId = typeof params.taskId === 'string' ? parseInt(params.taskId) : undefined;
  
  const { t } = useLanguage();
  const { colors } = useTheme();
  
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) {
        Alert.alert(t.common.error, t.task.taskIdNotFound);
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        const loadedTask = await getTask(taskId);
        
        if (!loadedTask) {
          Alert.alert(t.common.error, t.task.taskNotFound);
          router.back();
          return;
        }
        
        setTask(loadedTask);
      } catch (error) {
        console.error('加载任务失败:', error);
        Alert.alert(t.common.error, t.task.loadTaskFailed);
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId, t]);

  const handleSave = async () => {
    // 保存成功后返回任务列表页面
    try {
      setIsLoading(true);
      // 任务保存由TaskFormInline内部处理，这里只需要处理导航
      router.replace('/');
    } catch (error) {
      console.error('保存任务失败:', error);
      Alert.alert(t.common.error, t.task.saveTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 取消后返回
    router.back();
  };

  if (isLoading) {
    return (
      <View style={[
        styles.container,
        styles.centered,
        { backgroundColor: colors.background }
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <Stack.Screen
        options={{
          title: t.task.editTask,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      />
      {task && (
        <TaskFormInline
          task={task}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 