import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, RecurrencePattern } from '../models/Task';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTagColor, getSelectedTagColor } from '../utils/taskUtils';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  onAddTask?: () => void;
  onTaskComplete?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  isLoading?: boolean;
}

// 获取循环单位文本
const getRecurrenceUnitText = (pattern: RecurrencePattern): string => {
  switch (pattern.type) {
    case 'daily':
      return '天';
    case 'weekly':
      return '周';
    case 'monthly':
      return '月';
    case 'yearly':
      return '年';
    case 'custom':
      switch (pattern.unit) {
        case 'days':
          return '天';
        case 'weeks':
          return '周';
        case 'months':
          return '月';
        case 'years':
          return '年';
        default:
          return '';
      }
    default:
      return '';
  }
};

export default function TaskList({ 
  tasks, 
  onTaskPress, 
  onRefresh, 
  onAddTask, 
  onTaskComplete,
  onTaskDelete,
  isLoading = false 
}: TaskListProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();

  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const getStatusColor = (task: Task) => {
    if (!task.currentCycle) return '#999999';
    if (task.currentCycle.isCompleted) return '#4CAF50';
    const dueDate = new Date(task.currentCycle.dueDate);
    const isOverdue = dueDate < new Date() && !task.currentCycle.isCompleted;
    if (isOverdue) return '#F44336';
    if (!task.isActive) return '#999999';
    return '#2196F3';
  };

  const getStatusIcon = (task: Task) => {
    if (!task.currentCycle) return 'help-circle';
    if (task.currentCycle.isCompleted) return 'checkmark-circle';
    const dueDate = new Date(task.currentCycle.dueDate);
    const isOverdue = dueDate < new Date() && !task.currentCycle.isCompleted;
    if (isOverdue) return 'alert-circle';
    if (!task.isActive) return 'pause-circle';
    return 'time';
  };

  // 处理任务完成
  const handleTaskComplete = (task: Task) => {
    if (onTaskComplete) {
      onTaskComplete(task);
    }
  };

  // 处理任务删除
  const handleTaskDelete = (task: Task) => {
    if (onTaskDelete) {
      onTaskDelete(task);
    }
  };

  // 处理 FlatList 的 keyExtractor 方法
  const keyExtractor = (item: Task) => {
    return item.id ? item.id.toString() : Math.random().toString();
  };

  // 渲染单个任务项
  const renderItem = ({ item }: { item: Task }) => {
    const dueDate = new Date(item.currentCycle?.dueDate || '');
    const isCompleted = item.currentCycle?.isCompleted || false;
    const isOverdue = dueDate < new Date() && !isCompleted;
    
    // 计算剩余天数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 根据任务背景色确定文本颜色
    const backgroundColor = item.backgroundColor || colors.card;
    const textColor = getContrastColor(backgroundColor);
    // 次要文本颜色（描述、信息等）
    const subTextColor = adjustColorBrightness(textColor, textColor === '#ffffff' ? -40 : 40);
    
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleTaskComplete(item)}
        >
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.itemContent, 
            { 
              backgroundColor: backgroundColor,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderWidth: isDarkMode ? 1 : 0,
              shadowOpacity: isDarkMode ? 0.4 : 0.1,
            }
          ]} 
          onPress={() => {
            console.log('点击任务，任务ID:', item.id);
            if (onTaskPress && item.id !== undefined) {
              onTaskPress(item);
            } else {
              console.error('无法处理任务点击：ID不存在或处理器未提供', item);
            }
          }}
        >
          {/* 任务标题和状态 */}
          <View style={styles.titleRow}>
            <Text style={[
              styles.itemTitle, 
              { color: textColor }
            ]}>
              {item.title}
            </Text>
            
            {/* 状态标签 */}
            <View style={[
              styles.statusBadge,
              isOverdue ? styles.overdueBadge : 
              (daysLeft <= 3 && daysLeft > 0) ? styles.warningBadge : 
              styles.normalBadge
            ]}>
              <Text style={styles.statusText}>
                {isOverdue ? '已逾期' : 
                 daysLeft === 0 ? '今天到期' : 
                 `剩${daysLeft}天`}
              </Text>
            </View>
          </View>
          
          {/* 任务描述 */}
          {item.description && (
            <Text 
              style={[
                styles.itemDescription,
                { color: subTextColor }
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          {/* 任务标签 */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => {
                // 根据标签名称获取颜色
                const tagColor = getSelectedTagColor(tag);
                // 在深色模式下调暗颜色
                const darkModeColor = isDarkMode ? 
                  adjustColorBrightness(tagColor, -30) : 
                  tagColor;
                
                return (
                  <View key={index} style={[
                    styles.tagBadge, 
                    { backgroundColor: isDarkMode ? darkModeColor : tagColor }
                  ]}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          )}
          
          {/* 任务信息行 */}
          <View style={styles.infoRow}>
            {/* 截止日期 */}
            <View style={styles.infoItem}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={isOverdue ? colors.error : colors.primary} 
              />
              <Text 
                style={[
                  styles.infoText, 
                  { 
                    color: isOverdue ? colors.error : subTextColor
                  }
                ]}
              >
                {format(dueDate, 'yyyy-MM-dd')}
              </Text>
            </View>
            
            {/* 循环周期 */}
            {item.isRecurring && (
              <View style={styles.infoItem}>
                <Ionicons 
                  name="reload" 
                  size={14} 
                  color={colors.primary} 
                />
                <Text 
                  style={[
                    styles.infoText,
                    { color: subTextColor }
                  ]}
                >
                  {item.recurrencePattern.type === 'custom' 
                    ? `${item.recurrencePattern.value}${getRecurrenceUnitText(item.recurrencePattern)}`
                    : `${item.recurrencePattern.type}`}
                </Text>
              </View>
            )}
            
            {/* 提醒时间 */}
            {item.reminderOffset && item.reminderOffset > 0 && (
              <View style={styles.infoItem}>
                <Ionicons 
                  name="alarm" 
                  size={14} 
                  color={colors.primary} 
                />
                <Text 
                  style={[
                    styles.infoText,
                    { color: subTextColor }
                  ]}
                >
                  提前{item.reminderOffset}{item.reminderUnit === 'minutes' ? '分钟' : item.reminderUnit === 'hours' ? '小时' : '天'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleTaskDelete(item)}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            加载中...
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
            暂无任务
          </Text>
          <Text style={[styles.emptySubText, { color: colors.subText }]}>
            点击右下角按钮添加任务
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={keyExtractor}
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButton: {
    marginRight: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  itemContent: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  normalBadge: {
    backgroundColor: '#4CAF50',
  },
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  overdueBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  infoText: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// 辅助函数：调整颜色亮度
const adjustColorBrightness = (color: string, percent: number): string => {
  // 移除颜色中的#前缀
  const hex = color.replace('#', '');
  
  // 将十六进制转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // 调整亮度
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  
  // 转回十六进制
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// 根据背景颜色计算出对比度高的文本颜色
const getContrastColor = (backgroundColor: string): string => {
  // 如果背景颜色不是有效的十六进制颜色代码，返回黑色
  if (!backgroundColor || !backgroundColor.startsWith('#')) {
    return '#000000';
  }

  // 移除颜色中的#前缀
  const hex = backgroundColor.replace('#', '');
  
  // 将十六进制转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // 计算亮度 (标准亮度计算公式)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // 如果亮度高于125（中等亮度），使用黑色文本，否则使用白色文本
  return brightness > 155 ? '#000000' : '#ffffff';
}; 