import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import { Task } from '../models/Task';
import { getAllTasks, deleteTask } from '../services/taskService';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await getAllTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('错误', '加载任务失败');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = () => {
    setShowTaskDetail(false);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setShowTaskDetail(false);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('错误', '删除任务失败');
    }
  };

  const handleSaveTask = async () => {
    setShowTaskForm(false);
    await loadTasks();
  };

  return (
    <View style={styles.container}>
      <TaskList
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onRefresh={loadTasks}
      />

      {showTaskForm && (
        <TaskForm
          task={selectedTask}
          onSave={handleSaveTask}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      {showTaskDetail && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setShowTaskDetail(false)}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 