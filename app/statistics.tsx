import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTasks } from '../services/storageService';
import { Task } from '../models/Task';

export default function StatisticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  });
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const tasks = await getTasks();
      
      // 计算统计数据
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => 
        task.currentCycle && task.currentCycle.isCompleted
      ).length;
      const overdueTasks = tasks.filter(task => 
        task.currentCycle && task.currentCycle.isOverdue && !task.currentCycle.isCompleted
      ).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      setStats({
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
      });
    } catch (error) {
      console.error('加载统计数据时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '统计分析',
          headerShown: true,
        }}
      />
      <ScrollView 
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={[
              styles.loadingText,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>加载统计数据...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[
              styles.card,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}>
              <Text style={[
                styles.cardTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>任务概览</Text>
              
              <View style={styles.statItem}>
                <View style={[styles.iconContainer, { backgroundColor: '#2196f3' }]}>
                  <Ionicons name="list" size={24} color="#ffffff" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={[
                    styles.statLabel,
                    { color: isDarkMode ? '#aaaaaa' : '#666666' }
                  ]}>总任务数</Text>
                  <Text style={[
                    styles.statValue,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
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
                    { color: isDarkMode ? '#aaaaaa' : '#666666' }
                  ]}>已完成任务</Text>
                  <Text style={[
                    styles.statValue,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
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
                    { color: isDarkMode ? '#aaaaaa' : '#666666' }
                  ]}>逾期任务</Text>
                  <Text style={[
                    styles.statValue,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>{stats.overdueTasks}</Text>
                </View>
              </View>
            </View>
            
            <View style={[
              styles.card,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}>
              <Text style={[
                styles.cardTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>完成率</Text>
              
              <View style={styles.completionRateContainer}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${stats.completionRate}%` }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.completionRateText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>{stats.completionRate.toFixed(1)}%</Text>
              </View>
            </View>
            
            <View style={[
              styles.card,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}>
              <Text style={[
                styles.cardTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>提示</Text>
              
              <Text style={[
                styles.tipText,
                { color: isDarkMode ? '#aaaaaa' : '#666666' }
              ]}>
                {stats.completionRate < 50 
                  ? '您的任务完成率较低，建议合理安排时间，提高任务完成效率。'
                  : stats.completionRate < 80
                    ? '您的任务完成情况良好，继续保持！'
                    : '太棒了！您的任务完成率非常高，继续保持这种高效率！'
                }
              </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  completionRateContainer: {
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  completionRateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 