import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import { Task } from '../models/Task';
import { getAllTasks, deleteTask } from '../services/taskService';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
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

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setShowTaskForm(true);
  };

  const handleEditTask = () => {
    setShowTaskDetail(false);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = async (shouldRefresh = false) => {
    setShowTaskForm(false);
    if (shouldRefresh) {
      await loadTasks();
    }
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
  };

  const handleDeleteTask = async (taskId: number) => {
    Alert.alert(
      '删除任务',
      '确定要删除这个任务吗？此操作不可撤销。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteTask(taskId);
              setShowTaskDetail(false);
              await loadTasks();
              Alert.alert('成功', '任务已删除');
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('错误', '删除任务失败');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TaskList
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onAddTask={handleAddTask}
        isLoading={isLoading}
      />
      
      {showTaskForm && (
        <TaskForm
          task={selectedTask}
          onClose={() => handleCloseTaskForm(false)}
          onSave={() => handleCloseTaskForm(true)}
        />
      )}
      
      {showTaskDetail && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={handleCloseTaskDetail}
          onEdit={handleEditTask}
          onDelete={() => handleDeleteTask(selectedTask.id)}
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