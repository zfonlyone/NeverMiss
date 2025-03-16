import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabaseInfo, resetDatabase } from '../services/database';

interface DatabaseInfo {
  version: number;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}

export default function SettingsScreen() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const loadDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      const info = await getDatabaseInfo();
      setDbInfo(info);
    } catch (error) {
      console.error('Error loading database info:', error);
      Alert.alert('错误', '加载数据库信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const handleResetDatabase = () => {
    Alert.alert(
      '重置数据库',
      '确定要重置数据库吗？此操作将删除所有数据且不可恢复。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await resetDatabase();
              await loadDatabaseInfo();
              Alert.alert('成功', '数据库已重置');
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert('错误', '重置数据库失败');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#000000' : '#f5f5f5' },
      ]}
    >
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#ffffff' : '#000000' },
          ]}
        >
          数据库信息
        </Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : dbInfo ? (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDarkMode ? '#cccccc' : '#666666' },
                ]}
              >
                版本
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDarkMode ? '#ffffff' : '#000000' },
                ]}
              >
                {dbInfo.version}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDarkMode ? '#cccccc' : '#666666' },
                ]}
              >
                任务数量
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDarkMode ? '#ffffff' : '#000000' },
                ]}
              >
                {dbInfo.tasksCount}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDarkMode ? '#cccccc' : '#666666' },
                ]}
              >
                周期数量
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDarkMode ? '#ffffff' : '#000000' },
                ]}
              >
                {dbInfo.cyclesCount}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDarkMode ? '#cccccc' : '#666666' },
                ]}
              >
                历史记录数量
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDarkMode ? '#ffffff' : '#000000' },
                ]}
              >
                {dbInfo.historyCount}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#ffffff' : '#000000' },
          ]}
        >
          数据管理
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.dangerButton,
            { opacity: isLoading ? 0.5 : 1 },
          ]}
          onPress={handleResetDatabase}
          disabled={isLoading}
        >
          <Ionicons name="trash" size={24} color="#ffffff" />
          <Text style={styles.buttonText}>重置数据库</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 