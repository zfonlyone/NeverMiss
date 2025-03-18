import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';
import { Task } from '../models/Task';
import { getAllTasks, deleteTask } from '../models/services/taskService';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const loadedTasks = await getAllTasks(false, false);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert(t.common.error, t.task.loadTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleAddTask = () => {
    router.push('/new-task');
  };

  const handleEditTask = () => {
    setShowTaskDetail(false);
    if (selectedTask) {
      router.push({
        pathname: '/edit-task',
        params: { taskId: selectedTask.id }
      });
    }
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
  };

  const handleDeleteTask = async (taskId: number) => {
    Alert.alert(
      t.common.delete,
      t.task.deleteConfirmation,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteTask(taskId);
              setShowTaskDetail(false);
              await loadTasks();
              Alert.alert(t.common.success, t.task.deleteSuccess);
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert(t.common.error, t.task.deleteFailed);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <TaskList
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onAddTask={handleAddTask}
        onRefresh={loadTasks}
        isLoading={isLoading}
      />
      
      {showTaskDetail && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={handleCloseTaskDetail}
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
  },
}); 