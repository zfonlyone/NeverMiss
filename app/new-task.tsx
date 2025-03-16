import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import TaskForm from '../components/TaskForm';

export default function NewTaskScreen() {
  const router = useRouter();

  const handleSave = async () => {
    // 保存成功后返回任务列表页面
    router.replace('/tasks');
  };

  const handleClose = () => {
    // 取消后返回首页
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '新建任务',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <TaskForm
          task={undefined}
          onSave={handleSave}
          onClose={handleClose}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 