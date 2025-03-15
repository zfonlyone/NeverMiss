import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllTasks, deleteTask } from '../services/taskService';
import { configureNotifications } from '../services/notificationService';
import { Task } from '../models/Task';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import { useFocusEffect } from '@react-navigation/native';
import { initDatabase } from '../services/database';

export default function IndexScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [operationLoading, setOperationLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const colorScheme = useColorScheme();
  const slideAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initApp = async () => {
      if (initialized) return;
      
      try {
        setLoading(true);
        // Database is already initialized in _layout.tsx
        await configureNotifications();
        console.log('Notifications configured successfully');
        await loadTasks();
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        handleError('初始化失败', error);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, [initialized]);

  const handleError = (title: string, error: any) => {
    console.error(`${title}:`, error);
    Alert.alert(
      title,
      error?.message || '发生未知错误，请重试'
    );
  };

  const loadTasks = async (showRefreshing = false) => {
    if (!initialized && !showRefreshing) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else if (!loading) {
        setLoading(true);
      }
      const loadedTasks = await getAllTasks();
      setTasks(loadedTasks);
    } catch (error) {
      handleError('加载任务失败', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    loadTasks(true);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const showFormWithAnimation = () => {
    setShowForm(true);
    Animated.spring(slideAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 7,
    }).start();
  };

  const hideFormWithAnimation = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowForm(false);
      setSelectedTask(undefined);
    });
  };

  const handleAddTask = () => {
    setSelectedTask(undefined);
    showFormWithAnimation();
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleEditTask = () => {
    if (selectedTask) {
      setShowDetail(false);
      showFormWithAnimation();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setOperationLoading(true);
      await deleteTask(taskId);
      setSelectedTask(undefined);
      setShowDetail(false);
      await loadTasks();
    } catch (error) {
      handleError('删除任务失败', error);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSaveTask = async () => {
    hideFormWithAnimation();
    await loadTasks();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>正在加载...</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000000' : '#f0f0f0' }
    ]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor={colorScheme === 'dark' ? '#ffffff' : '#2196F3'}
          />
        }
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[
              styles.emptyText,
              { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }
            ]}>
              还没有任务，点击下方按钮创建新任务
            </Text>
          </View>
        ) : (
          <TaskList
            tasks={tasks}
            onTaskPress={handleTaskPress}
            onRefresh={loadTasks}
          />
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddTask}
        testID="add-task-button"
        disabled={operationLoading}
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>

      {showForm && (
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              }],
            },
          ]}
        >
          <TaskForm
            task={selectedTask}
            onClose={hideFormWithAnimation}
            onSave={handleSaveTask}
            testID="task-form"
          />
        </Animated.View>
      )}

      {showDetail && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setShowDetail(false)}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          testID="task-detail"
          isLoading={operationLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
});
