import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
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
import { useRouter } from 'expo-router';

export default function TaskListScreen() {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
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

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const fetchedTasks = await TaskService.getAllTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
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

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isOverdue = item.currentCycle?.isOverdue;
    const isCompleted = item.currentCycle?.isCompleted;
    
    let statusColor = colors.primary; // Default blue
    if (isOverdue) {
      statusColor = colors.error; // Red for overdue
    } else if (isCompleted) {
      statusColor = colors.success; // Green for completed
    }

    // Use custom background color if available, otherwise use default theme card color
    const backgroundColor = item.backgroundColor || colors.card;

    // Format the recurrence pattern for display
    const getRecurrenceText = () => {
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
          <Text style={[styles.recurrenceInfo, { color: colors.subText }]}>{getRecurrenceText()}</Text>
          
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
  recurrenceInfo: {
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
}); 