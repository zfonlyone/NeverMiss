import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getAppInfo } from '../services/database';
import { APP_INFO } from '../config/version';

export default function IndexScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [appInfo, setAppInfo] = useState<{ appVersion: string; author: string; databaseVersion: number; }>({ 
    appVersion: APP_INFO.VERSION, 
    author: APP_INFO.AUTHOR, 
    databaseVersion: APP_INFO.DATABASE_VERSION 
  });

  useEffect(() => {
    const loadAppInfo = async () => {
      const info = await getAppInfo();
      setAppInfo(info);
    };
    loadAppInfo();
  }, []);

  const navigateTo = (screen: string) => {
    router.push(screen);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: colors.text }
        ]}>{APP_INFO.NAME}</Text>
        <Text style={[
          styles.subtitle,
          { color: colors.subText }
        ]}>{t.app.tagline}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.menuContainer}>
          {/* 任务管理 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.card }
            ]}
            onPress={() => navigateTo('/tasks')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="list" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: colors.text }
              ]}>{t.menu.taskManagement}</Text>
              <Text style={[
                styles.menuDescription,
                { color: colors.subText }
              ]}>{t.menu.taskManagementDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>

          {/* 新建任务 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.card }
            ]}
            onPress={() => navigateTo('/new-task')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="add-circle" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: colors.text }
              ]}>{t.menu.newTask}</Text>
              <Text style={[
                styles.menuDescription,
                { color: colors.subText }
              ]}>{t.menu.newTaskDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>

          {/* 统计分析 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.card }
            ]}
            onPress={() => navigateTo('/statistics')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="bar-chart" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: colors.text }
              ]}>{t.menu.statistics}</Text>
              <Text style={[
                styles.menuDescription,
                { color: colors.subText }
              ]}>{t.menu.statisticsDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>

          {/* 设置 */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.card }
            ]}
            onPress={() => navigateTo('/settings')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#9c27b0' }]}>
              <Ionicons name="settings" size={24} color="#ffffff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[
                styles.menuTitle,
                { color: colors.text }
              ]}>{t.menu.settings}</Text>
              <Text style={[
                styles.menuDescription,
                { color: colors.subText }
              ]}>{t.menu.settingsDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[
            styles.infoTitle,
            { color: colors.text }
          ]}>{t.app.about}</Text>
          <Text style={[
            styles.infoText,
            { color: colors.subText }
          ]}>
            {t.app.description}
          </Text>
          <View style={[styles.versionContainer, { borderTopColor: colors.border }]}>
            <Text style={[
              styles.versionText,
              { color: colors.subText }
            ]}>
              {t.settings.version} {appInfo.appVersion}
            </Text>
            <Text style={[
              styles.versionText,
              { color: colors.subText }
            ]}>
              By {appInfo.author}
            </Text>
          </View>
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
  versionContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
    marginHorizontal: 16,
  },
  versionText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});
