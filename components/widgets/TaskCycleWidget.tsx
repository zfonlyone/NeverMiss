/**
 * TaskCycleWidget Component for NeverMiss
 * 
 * 任务周期管理小组件，用于显示和管理任务周期
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { Task, TaskCycle } from '../../models/Task';
import { TaskHistory } from '../../models/TaskHistory';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface TaskCycleWidgetProps {
  task: Task;
  onCycleCompleted?: (cycle: TaskCycle) => void;
  onCycleSkipped?: (cycle: TaskCycle) => void;
  loading?: boolean;
  cycles?: TaskCycle[];
  history?: TaskHistory[];
  showHistory?: boolean;
}

const TaskCycleWidget: React.FC<TaskCycleWidgetProps> = ({
  task,
  onCycleCompleted,
  onCycleSkipped,
  loading = false,
  cycles = [],
  history = [],
  showHistory = false,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const [taskCycles, setTaskCycles] = useState<TaskCycle[]>(cycles);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (cycles && cycles.length > 0) {
      setTaskCycles(cycles);
    }
  }, [cycles]);
  
  const formatCycleDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
  };
  
  const getCycleStatusText = (cycle: TaskCycle) => {
    if (cycle.isCompleted) {
      return "已完成"; // 暂时硬编码，后续可添加到语言文件
    }
    if (cycle.isOverdue) {
      return "已逾期"; // 暂时硬编码，后续可添加到语言文件
    }
    return "待处理"; // 暂时硬编码，后续可添加到语言文件
  };
  
  const getCycleStatusColor = (cycle: TaskCycle) => {
    if (cycle.isCompleted) {
      return "#4CAF50"; // 绿色 - success
    }
    if (cycle.isOverdue) {
      return "#F44336"; // 红色 - error
    }
    return colors.primary;
  };
  
  const handleComplete = (cycle: TaskCycle) => {
    Alert.alert(
      "完成任务", // 暂时硬编码，后续可添加到语言文件
      "确定要将此任务标记为完成吗？", // 暂时硬编码，后续可添加到语言文件
      [
        { text: t.common.cancel, style: 'cancel' },
        { 
          text: "确定", // 暂时硬编码，后续可添加到语言文件
          onPress: () => onCycleCompleted && onCycleCompleted(cycle),
          style: 'default'
        },
      ]
    );
  };
  
  const handleSkip = (cycle: TaskCycle) => {
    Alert.alert(
      "跳过任务", // 暂时硬编码，后续可添加到语言文件
      "确定要跳过此任务并创建下一个周期吗？", // 暂时硬编码，后续可添加到语言文件
      [
        { text: t.common.cancel, style: 'cancel' },
        { 
          text: "确定", // 暂时硬编码，后续可添加到语言文件
          onPress: () => onCycleSkipped && onCycleSkipped(cycle),
          style: 'default'
        },
      ]
    );
  };
  
  const renderCycleItem = ({ item }: { item: TaskCycle }) => {
    const isCurrentCycle = task.currentCycle?.id === item.id;
    
    return (
      <View style={[
        styles.cycleItem, 
        isCurrentCycle && styles.currentCycleItem,
        { 
          backgroundColor: isCurrentCycle ? colors.primary + '20' : colors.card,
          borderColor: colors.border 
        }
      ]}>
        <View style={styles.cycleHeader}>
          <View style={styles.cycleInfo}>
            <Text style={[styles.cycleTitle, { color: colors.text }]}>
              {isCurrentCycle ? "当前周期" : "历史周期"} {/* 暂时硬编码，后续可添加到语言文件 */}
            </Text>
            <View style={styles.cycleDates}>
              <Text style={[styles.cycleDate, { color: colors.text }]}>
                {"开始时间"}: {formatCycleDate(item.startDate)} {/* 暂时硬编码，后续可添加到语言文件 */}
              </Text>
              <Text style={[styles.cycleDate, { color: colors.text }]}>
                {"结束时间"}: {formatCycleDate(item.dueDate)} {/* 暂时硬编码，后续可添加到语言文件 */}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.cycleStatus, 
            { backgroundColor: getCycleStatusColor(item) + '30' }
          ]}>
            <Text style={[
              styles.cycleStatusText, 
              { color: getCycleStatusColor(item) }
            ]}>
              {getCycleStatusText(item)}
            </Text>
          </View>
        </View>
        
        {isCurrentCycle && !item.isCompleted && (
          <View style={styles.cycleActions}>
            <TouchableOpacity
              style={[styles.cycleAction, { backgroundColor: colors.primary }]}
              onPress={() => handleComplete(item)}
              disabled={loading}
            >
              <Text style={styles.cycleActionText}>{"完成"}</Text> {/* 暂时硬编码，后续可添加到语言文件 */}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.cycleAction, { backgroundColor: colors.border }]}
              onPress={() => handleSkip(item)}
              disabled={loading}
            >
              <Text style={[styles.cycleActionText, { color: colors.text }]}>
                {"跳过"} {/* 暂时硬编码，后续可添加到语言文件 */}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {item.isCompleted && item.completedDate && (
          <Text style={[styles.completedText, { color: "#4CAF50" }]}>
            {"完成于"}: {formatCycleDate(item.completedDate)} {/* 暂时硬编码，后续可添加到语言文件 */}
          </Text>
        )}
      </View>
    );
  };
  
  const renderHistoryItem = ({ item }: { item: TaskHistory }) => {
    return (
      <View style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.historyAction}>
          <Ionicons 
            name={
              item.action === 'complete' ? 'checkmark-circle' : 
              item.action === 'skip' ? 'arrow-forward-circle' :
              'information-circle'
            } 
            size={18} 
            color={
              item.action === 'complete' ? "#4CAF50" :
              item.action === 'skip' ? colors.primary :
              colors.text
            }
          />
          <Text style={[styles.historyActionText, { color: colors.text }]}>
            {item.action === 'complete' ? "已完成" :
             item.action === 'skip' ? "已跳过" :
             item.action}
          </Text>
        </View>
        <Text style={[styles.historyDate, { color: colors.text }]}>
          {formatCycleDate(item.timestamp)}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.header, { borderBottomColor: colors.border }]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {"任务周期"} {/* 暂时硬编码，后续可添加到语言文件 */}
        </Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color={colors.text}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={taskCycles}
              renderItem={renderCycleItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.cyclesList}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {"暂无任务周期"} {/* 暂时硬编码，后续可添加到语言文件 */}
                </Text>
              }
            />
          )}
          
          {showHistory && history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {"历史记录"} {/* 暂时硬编码，后续可添加到语言文件 */}
              </Text>
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id?.toString() || item.timestamp}
                contentContainerStyle={styles.historyList}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default TaskCycleWidget;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    paddingVertical: 12,
  },
  cyclesList: {
    paddingHorizontal: 16,
  },
  cycleItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  currentCycleItem: {
    borderWidth: 1,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cycleInfo: {
    flex: 1,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cycleDates: {
    marginTop: 4,
  },
  cycleDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  cycleStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cycleStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cycleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cycleAction: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cycleActionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completedText: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  loader: {
    marginVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  historySection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  historyList: {
    paddingHorizontal: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  historyAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyActionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  historyDate: {
    fontSize: 12,
  },
}); 