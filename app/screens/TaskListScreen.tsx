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

  const handleEditTask = (taskId: number) => {
    router.push({ pathname: '/task-form', params: { taskId } });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const days = differenceInDays(due, today);
    
    if (days === 0) {
      return '今天到期';
    } else if (days < 0) {
      return `已逾期 ${Math.abs(days)} 天`;
    } else {
      return `剩余 ${days} 天`;
    }
  };

  const formatReminderInfo = (task: Task) => {
    if (!task.reminderTime) return '';
    
    const { hour, minute } = task.reminderTime;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    let reminderOffset = '';
    if (task.reminderDays > 0) {
      reminderOffset = `提前 ${task.reminderDays} 天`;
    } else if (task.reminderHours > 0) {
      reminderOffset = `提前 ${task.reminderHours} 小时`;
    } else if (task.reminderMinutes > 0) {
      reminderOffset = `提前 ${task.reminderMinutes} 分钟`;
    }
    
    return `${time} ${reminderOffset}提醒`;
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isOverdue = item.currentCycle?.isOverdue;
    const isCompleted = item.currentCycle?.isCompleted;
    
    // 状态指示器颜色逻辑修改: 运行中蓝色，禁用黄色
    let statusColor = colors.primary; // 运行中蓝色
    if (!item.isActive) {
      statusColor = '#FFC107'; // 禁用黄色
    } else if (isOverdue) {
      statusColor = colors.error; // 逾期红色
    } else if (isCompleted) {
      statusColor = colors.success; // 完成绿色
    }

    // 使用任务的自定义背景颜色
    const backgroundColor = item.backgroundColor || colors.card;

    // 获取截止日期的倒计时
    const dueCountdown = item.currentCycle ? getDaysUntilDue(item.currentCycle.dueDate) : '';
    
    // 获取提醒信息
    const reminderInfo = formatReminderInfo(item);

    // Format the recurrence pattern for display
    const getRecurrenceText = () => {
      // 如果任务不是循环任务，则不显示循环周期信息
      if (!item.isRecurring) {
        return '';
      }
      
      const pattern = item.recurrencePattern;
      switch (pattern.type) {
        case 'daily':
          return t.task.cycleInfo.replace('{value}', pattern.value.toString()).replace('{unit}', t.task.days);
        case 'weekly':
          return t.task.cycleInfo.replace('{value}', pattern.value.toString()).replace('{unit}', t.task.weeks);
        case 'monthly':
          return t.task.cycleInfo.replace('{value}', pattern.value.toString()).replace('{unit}', t.task.months);
        case 'yearly':
          return t.task.cycleInfo.replace('{value}', pattern.value.toString()).replace('{unit}', t.task.years);
        case 'weekOfMonth':
          return t.task.monthDay + ' ' + t.task.weekDay;
        case 'custom':
          const unitMap: Record<string, string> = {
            'days': t.task.days,
            'weeks': t.task.weeks,
            'months': t.task.months,
            'years': t.task.years
          };
          return t.task.cycleInfo
            .replace('{value}', pattern.value.toString())
            .replace('{unit}', pattern.unit ? unitMap[pattern.unit] : '');
        default:
          return '';
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.taskItem, { backgroundColor }]} 
        onPress={() => handleEditTask(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{item.title}</Text>
          
          {item.description && (
            <Text style={[styles.taskDescription, { color: colors.subText }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          
          {/* 循环周期信息 */}
          {getRecurrenceText() !== '' && (
            <View style={styles.infoRow}>
              <Ionicons name="repeat" size={14} color={colors.subText} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.subText }]}>{getRecurrenceText()}</Text>
            </View>
          )}
          
          {/* 截止日期倒计时 */}
          {dueCountdown !== '' && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={14} color={colors.subText} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.subText }]}>{dueCountdown}</Text>
            </View>
          )}
          
          {/* 提醒信息 */}
          {reminderInfo !== '' && (
            <View style={styles.infoRow}>
              <Ionicons name="notifications" size={14} color={colors.subText} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.subText }]}>{reminderInfo}</Text>
            </View>
          )}
          
          {/* Display tags if available */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={[styles.tagBadge, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
                  <Text style={[styles.tagText, { color: colors.subText }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {!item.isActive && (
          <View style={[styles.disabledBadge, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
            <Text style={[styles.disabledText, { color: colors.subText }]}>{t.task.taskDisabled}</Text>
          </View>
        )}
        
        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
      </TouchableOpacity>
    );
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
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredTasks.length > 0 ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.subText }]}>
            {filterOptions.searchText || 
             filterOptions.statusFilter !== 'all' || 
             filterOptions.tagsFilter.length > 0 ? 
               t.task.noTasksMatchFilter : 
               t.task.noTasks}
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]} 
        onPress={handleCreateTask}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
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
  listContent: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  disabledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  disabledText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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