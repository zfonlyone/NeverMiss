import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';

export default function IndexScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const router = useRouter();

  const navigateTo = (screen: string) => {
    router.push(screen);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }
    ]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#ffffff' : '#000000' }
        ]}>NeverMiss</Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? '#cccccc' : '#666666' }
        ]}>永不错过重要任务</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.menuContainer}>
          {/* 任务管理 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}
            onPress={() => navigateTo('/tasks')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="list" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>任务管理</Text>
              <Text style={[
                styles.menuDescription,
                { color: isDarkMode ? '#aaaaaa' : '#666666' }
              ]}>查看和管理您的所有任务</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666666' : '#999999'} />
          </TouchableOpacity>

          {/* 新建任务 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}
            onPress={() => navigateTo('/new-task')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="add-circle" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>新建任务</Text>
              <Text style={[
                styles.menuDescription,
                { color: isDarkMode ? '#aaaaaa' : '#666666' }
              ]}>创建新的任务和提醒</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666666' : '#999999'} />
          </TouchableOpacity>

          {/* 统计分析 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}
            onPress={() => navigateTo('/statistics')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="bar-chart" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>统计分析</Text>
              <Text style={[
                styles.menuDescription,
                { color: isDarkMode ? '#aaaaaa' : '#666666' }
              ]}>查看任务完成情况和统计</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666666' : '#999999'} />
          </TouchableOpacity>

          {/* 设置 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
            ]}
            onPress={() => navigateTo('/settings')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#9c27b0' }]}>
              <Ionicons name="settings" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>设置</Text>
              <Text style={[
                styles.menuDescription,
                { color: isDarkMode ? '#aaaaaa' : '#666666' }
              ]}>应用设置和数据管理</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666666' : '#999999'} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[
            styles.infoTitle,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>关于 NeverMiss</Text>
          <Text style={[
            styles.infoText,
            { color: isDarkMode ? '#aaaaaa' : '#666666' }
          ]}>
            NeverMiss 是一款帮助您管理重复性任务的应用，让您永不错过重要事项。
          </Text>
          <Text style={[
            styles.versionText,
            { color: isDarkMode ? '#888888' : '#999999' }
          ]}>
            版本 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
  },
  infoContainer: {
    padding: 20,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'right',
  },
});
