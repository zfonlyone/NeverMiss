import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../models/Task';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  onAddTask?: () => void;
  isLoading?: boolean;
}

export default function TaskList({ tasks, onTaskPress, onRefresh, onAddTask, isLoading = false }: TaskListProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const { t } = useLanguage();
  const { colors } = useTheme();

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
    // 计算剩余天数
    const daysLeft = item.currentCycle 
      ? Math.ceil((new Date(item.currentCycle.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // 获取状态文本
    const getStatusText = () => {
      if (!item.currentCycle) return '';
      if (item.currentCycle.isCompleted) return t.task.statusCompleted;
      if (item.currentCycle.isOverdue) return t.task.statusOverdue;
      if (!item.isActive) return t.task.taskDisabled;
      return daysLeft <= 0 ? t.task.statusOverdue : t.task.daysLeft.replace('{days}', daysLeft.toString());
    };

    // 获取状态徽章样式
    const getStatusBadgeStyle = () => {
      if (!item.currentCycle) return styles.disabledBadge;
      if (item.currentCycle.isCompleted) return styles.completedBadge;
      if (item.currentCycle.isOverdue) return styles.overdueBadge;
      if (!item.isActive) return styles.disabledBadge;
      return daysLeft <= 3 ? styles.warningBadge : styles.pendingBadge;
    };

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          {
            backgroundColor: colors.card,
          },
        ]}
        onPress={() => onTaskPress(item)}
      >
        <View style={styles.taskHeader}>
          <Text
            style={[
              styles.taskTitle,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={[
            styles.statusBadge,
            getStatusBadgeStyle()
          ]}>
            <Text style={styles.statusText}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text
            style={[
              styles.taskDescription,
              { color: colors.subText },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        
        <View style={styles.taskFooter}>
          {item.currentCycle && (
            <View style={styles.taskDateContainer}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={colors.subText} 
              />
              <Text 
                style={[
                  styles.taskDate,
                  { color: colors.subText }
                ]}
              >
                {t.task.dueDate}: {format(new Date(item.currentCycle.dueDate), 'yyyy-MM-dd')}
              </Text>
            </View>
          )}
          
          <View style={styles.taskDateContainer}>
            <Ionicons 
              name="alarm" 
              size={14} 
              color={colors.subText} 
            />
            <Text 
              style={[
                styles.taskDate,
                { color: colors.subText }
              ]}
            >
              {`${item.reminderTime.hour.toString().padStart(2, '0')}:${item.reminderTime.minute.toString().padStart(2, '0')}`}
            </Text>
          </View>
          
          {item.lastCompletedDate && (
            <View style={styles.taskDateContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={14} 
                color={colors.subText} 
              />
              <Text 
                style={[
                  styles.taskDate,
                  { color: colors.subText }
                ]}
              >
                {format(new Date(item.lastCompletedDate), 'MM-dd')}
              </Text>
            </View>
          )}
          
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.subText} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t.common.loading}
          </Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="calendar-outline" 
            size={64} 
            color={colors.border} 
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t.task.noTasks}
          </Text>
          <Text style={[styles.emptySubText, { color: colors.subText }]}>
            {t.task.addTaskHint}
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
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {onAddTask && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
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
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  overdueBadge: {
    backgroundColor: '#F44336',
  },
  disabledBadge: {
    backgroundColor: '#999999',
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
    marginRight: 10,
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