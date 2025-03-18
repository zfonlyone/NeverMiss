/**
 * New Task Screen for NeverMiss
 * @author zfonlyone
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import TaskFormInline from '../components/TaskFormInline';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function NewTaskScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const handleSave = async () => {
    // 保存成功后返回任务列表页面
    router.replace('/');
  };

  const handleCancel = () => {
    // 取消后返回首页
    router.back();
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <Stack.Screen
        options={{
          title: t.task.newTask,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      />
      <TaskFormInline
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 