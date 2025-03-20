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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTasks } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCompletedTasks, getOverdueTasks } from '../services/taskService';
import { Task } from '../models/Task';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function StatisticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  });
  const [completedTasksList, setCompletedTasksList] = useState<Task[]>([]);
  const [overdueTasksList, setOverdueTasksList] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'completed' | 'overdue'>('completed');
  
  const { t, language } = useLanguage();
  const { colors } = useTheme();

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const tasks = await getTasks();
      const completed = await getCompletedTasks();
      const overdue = await getOverdueTasks();
      
      // 计算统计数据
      const totalTasks = tasks.length;
      const completedTasks = completed.length;
      const overdueTasks = overdue.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      setStats({
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
      });
      
      setCompletedTasksList(completed);
      setOverdueTasksList(overdue);
    } catch (error) {
      console.error('加载统计数据时出错:', error);
    } finally {
      setIsLoading(false);
    }
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
          { backgroundColor: activeTab === 'completed' ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {activeTab === 'completed' ? t.task.statusCompleted : t.task.statusOverdue}
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
              {activeTab === 'completed' 
                ? `${t.statistics.completedDate}: ${formatDate(item.currentCycle.completedDate || new Date().toISOString())}` 
                : `${t.task.dueDate}: ${formatDate(item.currentCycle.dueDate)}`
              }
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t.menu.statistics,
          headerShown: true,
          headerBackTitle: t.menu.home,
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
                  ]}>{stats.totalTasks}</Text>
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
                  ]}>{stats.completedTasks}</Text>
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
                  ]}>{stats.overdueTasks}</Text>
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
                      { width: `${stats.completionRate}%`, backgroundColor: colors.primary }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.completionRateText,
                  { color: colors.text }
                ]}>{stats.completionRate.toFixed(1)}%</Text>
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
                {stats.completionRate < 50 
                  ? t.statistics.tipLow
                  : stats.completionRate < 80
                    ? t.statistics.tipMedium
                    : t.statistics.tipHigh
                }
              </Text>
            </View>
            
            {/* 任务列表标签页 */}
            <View style={[
              styles.tabContainer,
              { backgroundColor: colors.card }
            ]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'completed' && [
                    styles.activeTab,
                    { borderBottomColor: colors.primary }
                  ]
                ]}
                onPress={() => setActiveTab('completed')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'completed' ? colors.primary : colors.subText }
                ]}>
                  {t.statistics.completedTasks} ({stats.completedTasks})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'overdue' && [
                    styles.activeTab,
                    { borderBottomColor: colors.primary }
                  ]
                ]}
                onPress={() => setActiveTab('overdue')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'overdue' ? colors.primary : colors.subText }
                ]}>
                  {t.statistics.overdueTasks} ({stats.overdueTasks})
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* 任务列表 */}
            <View style={styles.tasksContainer}>
              {activeTab === 'completed' ? (
                completedTasksList.length > 0 ? (
                  completedTasksList.map((task, index) => (
                    <React.Fragment key={`completed-${task.id}`}>
                      {renderTaskItem({ item: task })}
                    </React.Fragment>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons 
                      name="checkmark-circle-outline" 
                      size={60} 
                      color={colors.border} 
                    />
                    <Text style={[
                      styles.emptyText,
                      { color: colors.text }
                    ]}>
                      {t.statistics.noCompletedTasks}
                    </Text>
                  </View>
                )
              ) : (
                overdueTasksList.length > 0 ? (
                  overdueTasksList.map((task, index) => (
                    <React.Fragment key={`overdue-${task.id}`}>
                      {renderTaskItem({ item: task })}
                    </React.Fragment>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons 
                      name="alert-circle-outline" 
                      size={60} 
                      color={colors.border} 
                    />
                    <Text style={[
                      styles.emptyText,
                      { color: colors.text }
                    ]}>
                      {t.statistics.noOverdueTasks}
                    </Text>
                  </View>
                )
              )}
            </View>
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tasksContainer: {
    marginBottom: 24,
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
}); 