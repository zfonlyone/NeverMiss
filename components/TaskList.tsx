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
import lunarService from '../models/services/lunarService';

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

  // 格式化日期显示
  const formatDate = (dateString: string, dateType: 'solar' | 'lunar' = 'solar') => {
    const date = new Date(dateString);
    
    if (dateType === 'lunar') {
      return lunarService.formatDate(dateString, 'lunar');
    }
    
    return format(date, 'yyyy-MM-dd');
  };
  
  // 获取农历节日等额外信息
  const getDateExtraInfo = (dateString: string, dateType: 'solar' | 'lunar' = 'solar'): string => {
    if (dateType !== 'lunar') return '';
    
    const date = new Date(dateString);
    const info = lunarService.getFullLunarInfo(date);
    
    if (info.lunarFestival) {
      return ` (${info.lunarFestival})`;
    } else if (info.solarTerm) {
      return ` (${info.solarTerm})`;
    }
    
    return '';
  };

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
                {t.task.dueDate}: {formatDate(item.currentCycle.dueDate, item.dateType)}
                {getDateExtraInfo(item.currentCycle.dueDate, item.dateType)}
              </Text>
              {item.dateType === 'lunar' && (
                <View style={styles.lunarBadge}>
                  <Text style={styles.lunarBadgeText}>农历</Text>
                </View>
              )}
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
              {`${item.reminderTime.hour}:${item.reminderTime.minute.toString().padStart(2, '0')}`} 
              ({t.task.reminderOffset}: {item.reminderOffset} {
                item.reminderUnit === 'minutes' ? t.task.minutes : 
                item.reminderUnit === 'hours' ? t.task.hours : t.task.days
              })
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.border} />
          <Text
            style={[
              styles.emptyText,
              { color: colors.text },
            ]}
          >
            {t.task.noTasks}
          </Text>
          {onAddTask && (
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={onAddTask}
            >
              <Text style={styles.addButtonText}>{t.task.addTaskHint}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  taskItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#2196F3',
  },
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  overdueBadge: {
    backgroundColor: '#F44336',
  },
  disabledBadge: {
    backgroundColor: '#9E9E9E',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lunarBadge: {
    backgroundColor: '#7C4DFF',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
  },
  lunarBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
}); 