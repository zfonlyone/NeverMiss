import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTasks } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCompletedTasks, getOverdueTasks, getTaskCompletionStats, getCompletedTaskHistory } from '../services/taskService';
import { Task } from '../models/Task';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TaskHistory } from '../models/TaskHistory';

interface CompletionStats {
  totalCompletions: number;
  onTimeCompletions: number;
  overdueCompletions: number;
  dailyCompletions: {[date: string]: number};
  tagCompletions: {[tag: string]: number};
}

interface TaskCompleteHistory {
  task: Task;
  history: TaskHistory;
}

export default function StatisticsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CompletionStats | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskCompleteHistory[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  
  const { t, language } = useLanguage();
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  
  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
      // 加载统计数据
      const statsData = await getTaskCompletionStats();
      setStats(statsData);
      
      // 加载任务完成历史
      const historyData = await getCompletedTaskHistory();
      
      // 根据选择的时间范围筛选
      const filteredHistory = filterHistoryByTimeRange(historyData, timeRange);
      setCompletedTasks(filteredHistory);
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据时间范围筛选历史记录
  const filterHistoryByTimeRange = (
    history: TaskCompleteHistory[],
    range: 'today' | 'week' | 'month' | 'all'
  ): TaskCompleteHistory[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return history.filter(item => {
      const completedDate = new Date(item.history.timestamp);
      
      switch (range) {
        case 'today':
          return completedDate >= today;
          
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return completedDate >= weekStart;
          
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return completedDate >= monthStart;
          
        case 'all':
        default:
          return true;
      }
    });
  };

  const formatDate = (date: string) => {
    return format(
      new Date(date), 
      language === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy', 
      { locale: language === 'zh' ? zhCN : undefined }
    );
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={[
      styles.taskItem,
      { backgroundColor: colors.card }
    ]}>
      <View style={styles.taskHeader}>
        <Text style={[
          styles.taskTitle,
          { color: colors.text }
        ]}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: '#4CAF50' }
        ]}>
          <Text style={styles.statusText}>
            {t.task.statusCompleted}
          </Text>
        </View>
      </View>
      
      {item.description ? (
        <Text style={[
          styles.taskDescription,
          { color: colors.subText }
        ]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      
      {item.currentCycle && (
        <View style={styles.taskFooter}>
          <View style={styles.taskDateContainer}>
            <Ionicons name="calendar" size={14} color={colors.subText} />
            <Text style={[
              styles.taskDate,
              { color: colors.subText }
            ]}>
              {t.statistics.completedDate}: {formatDate(item.currentCycle.completedDate || new Date().toISOString())}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // 渲染统计卡片
  const renderStatCard = (title: string, value: number | string, icon: string, color: string) => (
    <View style={[styles.statCard, {borderLeftColor: color}]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // 计算完成率
  const calculateCompletionRate = (): string => {
    if (!stats) return '0%';
    const total = stats.onTimeCompletions + stats.overdueCompletions;
    if (total === 0) return '0%';
    const rate = (stats.onTimeCompletions / total) * 100;
    return `${Math.round(rate)}%`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t.menu.statistics,
          headerShown: true,
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
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView 
        style={[
          styles.container,
          { backgroundColor: colors.background }
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[
              styles.loadingText,
              { color: colors.text }
            ]}>{t.common.loading}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[
              styles.card,
              { backgroundColor: colors.card }
            ]}>
              <Text style={[
                styles.cardTitle,
                { color: colors.text }
              ]}>{t.statistics.overview}</Text>
              
              <View style={styles.statItem}>
                <View style={[styles.iconContainer, { backgroundColor: '#2196f3' }]}>
                  <Ionicons name="list" size={24} color="#ffffff" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={[
                    styles.statLabel,
                    { color: colors.subText }
                  ]}>{t.statistics.totalTasks}</Text>
                  <Text style={[
                    styles.statValue,
                    { color: colors.text }
                  ]}>{stats?.totalCompletions || 0}</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.iconContainer, { backgroundColor: '#4caf50' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={[
                    styles.statLabel,
                    { color: colors.subText }
                  ]}>{t.statistics.completedTasks}</Text>
                  <Text style={[
                    styles.statValue,
                    { color: colors.text }
                  ]}>{stats?.onTimeCompletions || 0}</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.iconContainer, { backgroundColor: '#f44336' }]}>
                  <Ionicons name="alert-circle" size={24} color="#ffffff" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={[
                    styles.statLabel,
                    { color: colors.subText }
                  ]}>{t.statistics.overdueTasks}</Text>
                  <Text style={[
                    styles.statValue,
                    { color: colors.text }
                  ]}>{stats?.overdueCompletions || 0}</Text>
                </View>
              </View>
            </View>
            
            <View style={[
              styles.card,
              { backgroundColor: colors.card }
            ]}>
              <Text style={[
                styles.cardTitle,
                { color: colors.text }
              ]}>{t.statistics.completionRate}</Text>
              
              <View style={styles.completionRateContainer}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${calculateCompletionRate()}%`, backgroundColor: colors.primary }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.completionRateText,
                  { color: colors.text }
                ]}>{calculateCompletionRate()}</Text>
              </View>
            </View>
            
            <View style={[
              styles.card,
              { backgroundColor: colors.card }
            ]}>
              <Text style={[
                styles.cardTitle,
                { color: colors.text }
              ]}>{t.statistics.tips}</Text>
              
              <Text style={[
                styles.tipText,
                { color: colors.subText }
              ]}>
                {calculateCompletionRate() < 50 
                  ? t.statistics.tipLow
                  : calculateCompletionRate() < 80
                    ? t.statistics.tipMedium
                    : t.statistics.tipHigh
                }
              </Text>
            </View>
            
            {/* 时间范围选择器 */}
            <View style={styles.timeRangeSelector}>
              <Text style={styles.sectionTitle}>{t.statistics.completionHistory}</Text>
              <View style={styles.timeRangeButtons}>
                {[
                  { value: 'today', label: '今天' },
                  { value: 'week', label: '本周' },
                  { value: 'month', label: '本月' },
                  { value: 'all', label: '全部' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.timeRangeButton,
                      timeRange === item.value && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setTimeRange(item.value as any)}
                  >
                    <Text
                      style={[
                        styles.timeRangeButtonText,
                        timeRange === item.value && styles.timeRangeButtonTextActive
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* 任务完成历史记录 */}
            <View style={styles.historyContainer}>
              {completedTasks.length > 0 ? (
                completedTasks.map((item, index) => (
                  <React.Fragment key={`${item.task.id}-${item.history.id}`}>
                    {renderTaskItem({item: item.task})}
                  </React.Fragment>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#cccccc" />
                  <Text style={styles.emptyText}>{t.statistics.noCompletionHistory}</Text>
                </View>
              )}
            </View>
            
            {/* 标签统计 */}
            {stats && Object.keys(stats.tagCompletions).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.statistics.tagStatistics}</Text>
                <View style={styles.tagStatsContainer}>
                  {Object.entries(stats.tagCompletions).map(([tag, count]) => (
                    <View key={tag} style={styles.tagStatItem}>
                      <View style={styles.tagStatBadge}>
                        <Text style={styles.tagStatBadgeText}>{tag}</Text>
                      </View>
                      <Text style={styles.tagStatCount}>{count}次</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
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
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  completionRateContainer: {
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
  },
  completionRateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
  },
  timeRangeSelector: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2196F3',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  historyContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  taskItem: {
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  completionRateContainer: {
    alignItems: 'center',
  },
  completionRateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tagStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 12,
  },
  tagStatBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tagStatBadgeText: {
    fontSize: 12,
    color: '#2196F3',
  },
  tagStatCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 