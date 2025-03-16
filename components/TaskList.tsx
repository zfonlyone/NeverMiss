import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../models/Task';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  onAddTask?: () => void;
  isLoading?: boolean;
}

export default function TaskList({ tasks, onTaskPress, onRefresh, onAddTask, isLoading = false }: TaskListProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    
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
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          },
        ]}
        onPress={() => onTaskPress(item)}
      >
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
          {item.currentCycle && (
            <View style={[
              styles.statusBadge,
              item.currentCycle.isCompleted 
                ? styles.completedBadge 
                : item.currentCycle.isOverdue 
                  ? styles.overdueBadge 
                  : styles.pendingBadge
            ]}>
              <Text style={styles.statusText}>
                {item.currentCycle.isCompleted 
                  ? '已完成' 
                  : item.currentCycle.isOverdue 
                    ? '已逾期' 
                    : '进行中'}
              </Text>
            </View>
          )}
        </View>
        
        {item.description && (
          <Text
            style={[
              styles.taskDescription,
              { color: isDarkMode ? '#cccccc' : '#666666' },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        
        {item.currentCycle && (
          <View style={styles.taskFooter}>
            <View style={styles.taskDateContainer}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={isDarkMode ? '#aaaaaa' : '#888888'} 
              />
              <Text 
                style={[
                  styles.taskDate,
                  { color: isDarkMode ? '#aaaaaa' : '#888888' }
                ]}
              >
                截止日期: {format(new Date(item.currentCycle.dueDate), 'yyyy-MM-dd')}
              </Text>
            </View>
            
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? '#aaaaaa' : '#888888'} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={[styles.emptyText, { color: isDarkMode ? '#ffffff' : '#666666' }]}>
            加载任务中...
          </Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="calendar-outline" 
            size={64} 
            color={isDarkMode ? '#555555' : '#cccccc'} 
          />
          <Text style={[styles.emptyText, { color: isDarkMode ? '#ffffff' : '#666666' }]}>
            没有任务
          </Text>
          <Text style={[styles.emptySubText, { color: isDarkMode ? '#aaaaaa' : '#999999' }]}>
            点击右下角的 + 按钮添加新任务
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
              tintColor={isDarkMode ? '#ffffff' : '#2196F3'}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {onAddTask && (
        <TouchableOpacity
          style={styles.fab}
          onPress={onAddTask}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  taskItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: '#2196F3',
  },
  overdueBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 