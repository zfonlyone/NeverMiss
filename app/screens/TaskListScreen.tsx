import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  BackHandler
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as TaskService from '../../services/taskService';
import { Task } from '../../models/Task';
import TaskListFilter, { FilterOptions } from '../components/TaskListFilter';
import { filterTasks, sortTasks, extractAllTags } from '../../utils/taskUtils';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { differenceInDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import TaskList from '../../components/TaskList';

export default function TaskListScreen() {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    sortBy: 'dueDate',
    sortDirection: 'asc',
    statusFilter: 'all',
    tagsFilter: [],
    showDisabled: true
  });

  // 添加返回键监听，确保返回到首页
  useEffect(() => {
    const backAction = () => {
      router.replace('/');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  // 提取所有任务中的标签
  const availableTags = useMemo(() => {
    return extractAllTags(tasks);
  }, [tasks]);

  // 根据筛选条件过滤并排序任务
  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(tasks, filterOptions);
    return sortTasks(filtered, filterOptions.sortBy, filterOptions.sortDirection);
  }, [tasks, filterOptions]);

  useEffect(() => {
    loadTasks();
  }, []);

  // 当从任务表单返回时，如果参数中有refresh=true，则刷新任务列表
  useEffect(() => {
    if (params.refresh === 'true') {
      loadTasks();
    }
  }, [params.refresh]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const fetchedTasks = await TaskService.getAllTasks(false, false);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('错误', '加载任务失败');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
  };

  const handleCreateTask = () => {
    router.push('/task-form');
  };

  const handleTaskPress = (task: Task) => {
    router.push({ pathname: '/task-form', params: { taskId: task.id.toString() } });
  };

  // 处理任务完成
  const handleTaskComplete = async (task: Task) => {
    try {
      Alert.alert(
        '完成任务',
        `确定要将任务 "${task.title}" 标记为已完成吗？`,
        [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '确定',
            onPress: async () => {
              setIsLoading(true);
              await TaskService.completeTask(task.id);
              await loadTasks(); // 重新加载任务列表
              Alert.alert('成功', `任务 "${task.title}" 已标记为完成`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('错误', '无法完成任务');
      setIsLoading(false);
    }
  };

  // 处理任务删除
  const handleTaskDelete = async (task: Task) => {
    try {
      Alert.alert(
        '删除任务',
        `确定要删除任务 "${task.title}" 吗？此操作不可恢复。`,
        [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              await TaskService.deleteTask(task.id);
              await loadTasks(); // 重新加载任务列表
              Alert.alert('成功', `任务 "${task.title}" 已删除`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('错误', '无法删除任务');
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* 添加头部导航栏 */}
      <Stack.Screen
        options={{
          title: '任务管理',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/')}
            >
              <Ionicons name="arrow-back" size={24} color={isDarkMode ? colors.text : "#000"} />
              <Text style={[styles.backButtonText, { color: isDarkMode ? colors.text : "#000" }]}>
                首页
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* 搜索、排序和筛选组件 */}
      <TaskListFilter 
        filterOptions={filterOptions}
        onFilterChange={setFilterOptions}
        availableTags={availableTags}
      />
      
      {/* 任务列表组件 */}
      <TaskList 
        tasks={filteredTasks}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onTaskDelete={handleTaskDelete}
        onRefresh={onRefresh}
        onAddTask={handleCreateTask}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
}); 