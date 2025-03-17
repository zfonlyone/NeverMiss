/**
 * Settings Screen for NeverMiss
 * @author zfonlyone
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, useColorScheme, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { exportDataToJSON, exportDataToCSV, shareFile, importDataFromJSON, importDataFromCSV } from '../services/exportService';
import { checkPermissionsForFeature, requestPermissionsForFeature } from '../services/permissionService';
import { resetStorage, getDatabaseInfo } from '../services/storageService';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { t, language, changeLanguage } = useLanguage();
  const { themeMode, isDarkMode: themeIsDarkMode, setThemeMode, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [dbInfo, setDbInfo] = useState({ version: 0, tasksCount: 0, cyclesCount: 0, historyCount: 0 });

  useEffect(() => {
    checkPermissions();
    loadDatabaseInfo();
  }, []);

  const checkPermissions = async () => {
    const notificationResult = await checkPermissionsForFeature('notification');
    setNotificationPermission(notificationResult.granted);

    const calendarResult = await checkPermissionsForFeature('calendar');
    setCalendarPermission(calendarResult.granted);
  };

  const loadDatabaseInfo = async () => {
    try {
      const info = await getDatabaseInfo();
      setDbInfo(info);
    } catch (error) {
      console.error('获取数据库信息失败:', error);
    }
  };

  const handleRequestPermission = async (type: 'notification' | 'calendar') => {
    try {
      const granted = await requestPermissionsForFeature(type);
      if (type === 'notification') {
        setNotificationPermission(granted);
      } else if (type === 'calendar') {
        setCalendarPermission(granted);
      }

      if (!granted) {
        Alert.alert(
          '权限请求失败',
          `无法获取${type === 'notification' ? '通知' : '日历'}权限，请在系统设置中手动开启。`,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      console.error('请求权限失败:', error);
      Alert.alert('错误', '请求权限失败');
    }
  };

  const handleExportJSON = async () => {
    setIsLoading(true);
    try {
      const result = await exportDataToJSON();
      if (result.success && result.filePath) {
        const shared = await shareFile(result.filePath);
        if (!shared) {
          Alert.alert('分享失败', '无法分享导出文件');
        }
      } else {
        Alert.alert('导出失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('导出JSON失败:', error);
      Alert.alert('错误', '导出数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      const result = await exportDataToCSV();
      if (result.success && result.filePath) {
        const shared = await shareFile(result.filePath);
        if (!shared) {
          Alert.alert('分享失败', '无法分享导出文件');
        }
      } else {
        Alert.alert('导出失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('导出CSV失败:', error);
      Alert.alert('错误', '导出数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportJSON = async () => {
    setIsLoading(true);
    try {
      const result = await importDataFromJSON();
      if (result.success) {
        Alert.alert(
          '导入成功',
          `成功导入 ${result.tasksCount} 个任务和 ${result.cyclesCount} 个周期`
        );
        loadDatabaseInfo();
      } else {
        Alert.alert('导入失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('导入JSON失败:', error);
      Alert.alert('错误', '导入数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCSV = async () => {
    setIsLoading(true);
    try {
      const result = await importDataFromCSV();
      if (result.success) {
        Alert.alert(
          '导入成功',
          `成功导入 ${result.tasksCount} 个任务`
        );
        loadDatabaseInfo();
      } else {
        Alert.alert('导入失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('导入CSV失败:', error);
      Alert.alert('错误', '导入数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      '重置数据',
      '确定要删除所有数据吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await resetStorage();
              Alert.alert('成功', '数据已重置');
              loadDatabaseInfo();
            } catch (error) {
              console.error('重置数据失败:', error);
              Alert.alert('错误', '重置数据失败');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeLanguage = async (lang: Language) => {
    try {
      await changeLanguage(lang);
    } catch (error) {
      console.error('切换语言失败:', error);
      Alert.alert(t.common.error, '切换语言失败');
    }
  };

  const handleChangeTheme = async (mode: ThemeMode) => {
    try {
      await setThemeMode(mode);
    } catch (error) {
      console.error('切换主题失败:', error);
      Alert.alert(t.common.error, '切换主题失败');
    }
  };

  const handleOpenGitHub = async () => {
    const url = 'https://github.com/zfonlyone/NeverMiss';
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t.common.error, t.settings.cannotOpenUrl);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t.settings.title,
          headerShown: true,
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      <ScrollView style={styles.scrollView}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
            {t.settings.themeSettings}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              themeMode === 'auto' && styles.selectedSetting,
              { borderColor: colors.border }
            ]}
            onPress={() => handleChangeTheme('auto')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t.settings.themeAuto}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.themeAutoDesc}
              </Text>
            </View>
            {themeMode === 'auto' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              themeMode === 'light' && styles.selectedSetting,
              { borderColor: colors.border }
            ]}
            onPress={() => handleChangeTheme('light')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t.settings.themeLight}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.themeLightDesc}
              </Text>
            </View>
            {themeMode === 'light' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              themeMode === 'dark' && styles.selectedSetting,
              { borderColor: colors.border }
            ]}
            onPress={() => handleChangeTheme('dark')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t.settings.themeDark}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.themeDarkDesc}
              </Text>
            </View>
            {themeMode === 'dark' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
            {t.settings.languageSettings}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              language === 'zh' && styles.selectedSetting,
              { borderColor: colors.border }
            ]}
            onPress={() => handleChangeLanguage('zh')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>中文</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                使用中文显示应用界面
              </Text>
            </View>
            {language === 'zh' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              language === 'en' && styles.selectedSetting,
              { borderColor: colors.border }
            ]}
            onPress={() => handleChangeLanguage('en')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>English</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                Display app interface in English
              </Text>
            </View>
            {language === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
            {t.settings.permissionSettings}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.permissions.notificationPermissionTitle}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.notificationPermissionDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                { backgroundColor: notificationPermission ? colors.primary : colors.border }
              ]}
              onPress={() => handleRequestPermission('notification')}
            >
              <Text style={styles.permissionButtonText}>
                {notificationPermission ? t.settings.permissionGranted : t.settings.requestPermission}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.permissions.calendarPermissionTitle}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.calendarPermissionDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                { backgroundColor: calendarPermission ? colors.primary : colors.border }
              ]}
              onPress={() => handleRequestPermission('calendar')}
            >
              <Text style={styles.permissionButtonText}>
                {calendarPermission ? t.settings.permissionGranted : t.settings.requestPermission}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
            {t.settings.dataManagement}
          </Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subText }]}>{t.settings.version}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{dbInfo.version}</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.exportJSON}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.exportJSONDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleExportJSON}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>{t.settings.export}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.exportCSV}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.exportCSVDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleExportCSV}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>{t.settings.export}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.importJSON}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.importJSONDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleImportJSON}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>{t.settings.import}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.importCSV}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.importCSVDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleImportCSV}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>{t.settings.import}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.resetData}</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                {t.settings.resetDataDesc}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleResetData}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>{t.settings.reset}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
            {t.settings.about}
          </Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subText }]}>{t.settings.version}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subText }]}>{t.settings.author}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>@zfonlyone</Text>
          </View>

          <TouchableOpacity
            style={[styles.settingItem, { borderColor: colors.border }]}
            onPress={handleOpenGitHub}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>GitHub</Text>
              <Text style={[styles.settingDescription, { color: colors.subText }]}>
                https://github.com/zfonlyone/NeverMiss
              </Text>
            </View>
            <Ionicons name="open-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  permissionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedSetting: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 