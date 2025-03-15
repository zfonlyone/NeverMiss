import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../models/Task';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onRefresh: () => void;
}

export default function TaskList({ tasks, onTaskPress, onRefresh }: TaskListProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const colorScheme = useColorScheme();

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const getStatusColor = (task: Task) => {
    if (!task.currentCycle) return '#999999';
    if (task.currentCycle.isCompleted) return '#4CAF50';
    if (task.currentCycle.isOverdue) return '#F44336';
    if (!task.isActive) return '#999999';
    return '#2196F3';
  };

  const getStatusIcon = (task: Task) => {
    if (!task.currentCycle) return 'help-circle';
    if (task.currentCycle.isCompleted) return 'checkmark-circle';
    if (task.currentCycle.isOverdue) return 'alert-circle';
    if (!task.isActive) return 'pause-circle';
    return 'time';
  };

  const renderItem = ({ item }: { item: Task }) => {
    const isDarkMode = colorScheme === 'dark';
    const isOverdue = item.currentCycle && new Date(item.currentCycle.dueDate) < new Date();

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          {
            backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
            borderColor: isDarkMode ? '#2c2c2e' : '#e5e5e5',
          },
        ]}
        onPress={() => onTaskPress(item)}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Ionicons
              name={getStatusIcon(item)}
              size={24}
              color={getStatusColor(item)}
            />
          </View>
          {item.description && (
            <Text
              style={[
                styles.taskDescription,
                { color: isDarkMode ? '#8e8e93' : '#666666' },
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
          {item.currentCycle && (
            <Text
              style={[
                styles.taskDueDate,
                {
                  color: isOverdue
                    ? '#ff3b30'
                    : isDarkMode
                    ? '#8e8e93'
                    : '#666666',
                },
              ]}
            >
              Due: {format(new Date(item.currentCycle.dueDate), 'PPp')}
            </Text>
          )}
          <View style={styles.taskFooter}>
            <Text
              style={[
                styles.taskInfo,
                { color: isDarkMode ? '#999999' : '#888888' },
              ]}
            >
              {item.currentCycle
                ? `下次截止：${new Date(item.currentCycle.dueDate).toLocaleString()}`
                : '无进行中的周期'}
            </Text>
            <Text
              style={[
                styles.taskRecurrence,
                { color: isDarkMode ? '#999999' : '#888888' },
              ]}
            >
              {item.recurrenceType === 'daily'
                ? '每天'
                : item.recurrenceType === 'weekly'
                ? '每周'
                : item.recurrenceType === 'monthly'
                ? '每月'
                : `每${item.recurrenceValue}${
                    item.recurrenceUnit === 'days'
                      ? '天'
                      : item.recurrenceUnit === 'weeks'
                      ? '周'
                      : '月'
                  }`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#f5f5f5' },
      ]}
      data={tasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="list"
            size={48}
            color={colorScheme === 'dark' ? '#666666' : '#cccccc'}
          />
          <Text
            style={[
              styles.emptyText,
              { color: colorScheme === 'dark' ? '#666666' : '#999999' },
            ]}
          >
            暂无任务
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  taskItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    fontSize: 12,
  },
  taskRecurrence: {
    fontSize: 12,
  },
  taskDueDate: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
}); 