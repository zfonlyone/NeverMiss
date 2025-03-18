/**
 * Settings Screen for NeverMiss
 * @author zfonlyone
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { exportDataToJSON, exportDataToCSV, shareFile, importDataFromJSON, importDataFromCSV } from '../models/services/exportService';
import { checkPermissionsForFeature, requestPermissionsForFeature } from '../models/services/permissionService';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { getDatabaseInfo as getDatabaseInfoService, resetDatabase } from '../models/services/database';
import { APP_INFO, getFullVersion } from '../config/version';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';

interface DatabaseInfo {
  version: number;
  appVersion: string;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
  settings: {
    appVersion: string;
    useLunarCalendar: boolean;
  };
}

export default function SettingsScreen() {
  const { t, language, changeLanguage } = useLanguage();
  const { themeMode, setThemeMode, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const router = useRouter();

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
      setIsLoading(true);
      const info = await getDatabaseInfoService();
      setDbInfo(info);
    } catch (error) {
      console.error('获取数据库信息失败:', error);
      Alert.alert(t.common.error, t.settings.loadDatabaseFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      t.settings.resetData,
      t.settings.resetDataConfirmation,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.reset,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await resetDatabase();
              const info = await getDatabaseInfoService();
              setDbInfo(info);
              Alert.alert(t.common.success, t.settings.resetDataSuccess);
            } catch (error) {
              console.error('重置数据库失败:', error);
              Alert.alert(t.common.error, t.settings.resetDataFailed);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
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
          t.common.error,
          type === 'notification' 
            ? t.permissions.notificationPermissionMessage 
            : t.permissions.calendarPermissionMessage,
          [{ text: t.common.cancel }]
        );
      }
    } catch (error) {
      console.error('请求权限失败:', error);
      Alert.alert(t.common.error, t.settings.resetDataFailed);
    }
  };

  const handleExportJSON = async () => {
    setIsLoading(true);
    try {
      const result = await exportDataToJSON();
      if (result.success && result.filePath) {
        const shared = await shareFile(result.filePath);
        if (!shared) {
          Alert.alert(t.common.error, t.settings.cannotOpenUrl);
        }
      } else {
        Alert.alert(t.common.error, result.error || t.settings.resetDataFailed);
      }
    } catch (error) {
      console.error('导出JSON失败:', error);
      Alert.alert(t.common.error, t.settings.resetDataFailed);
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
          Alert.alert(t.common.error, t.settings.cannotOpenUrl);
        }
      } else {
        Alert.alert(t.common.error, result.error || t.settings.resetDataFailed);
      }
    } catch (error) {
      console.error('导出CSV失败:', error);
      Alert.alert(t.common.error, t.settings.resetDataFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportJSON = async () => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        const importResult = await importDataFromJSON(result.assets[0].uri);
        if (importResult.success) {
          Alert.alert(
            t.common.success,
            t.settings.importJSONDesc
          );
          await loadDatabaseInfo();
        } else {
          Alert.alert(t.common.error, importResult.error || t.settings.resetDataFailed);
        }
      }
    } catch (error) {
      console.error('导入JSON失败:', error);
      Alert.alert(t.common.error, t.settings.resetDataFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCSV = async () => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        const importResult = await importDataFromCSV(result.assets[0].uri);
        if (importResult.success) {
          Alert.alert(
            t.common.success,
            t.settings.importCSVDesc
          );
          await loadDatabaseInfo();
        } else {
          Alert.alert(t.common.error, importResult.error || t.settings.resetDataFailed);
        }
      }
    } catch (error) {
      console.error('导入CSV失败:', error);
      Alert.alert(t.common.error, t.settings.resetDataFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      t.settings.resetData,
      t.settings.resetDataConfirmation,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.reset,
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await resetDatabase();
              const info = await getDatabaseInfoService();
              setDbInfo(info);
              Alert.alert(t.common.success, t.settings.resetDataSuccess);
            } catch (error) {
              console.error('重置数据失败:', error);
              Alert.alert(t.common.error, t.settings.resetDataFailed);
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
      Alert.alert(t.common.error, t.settings.resetDataFailed);
    }
  };

  const handleChangeTheme = async (mode: ThemeMode) => {
    try {
      await setThemeMode(mode);
    } catch (error) {
      console.error('切换主题失败:', error);
      Alert.alert(t.common.error, t.settings.resetDataFailed);
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
            <View style={styles.settingInfo}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t.settings.themeAuto}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.themeAutoDesc}
                </Text>
              </View>
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
            <View style={styles.settingInfo}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t.settings.themeLight}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.themeLightDesc}
                </Text>
              </View>
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
            <View style={styles.settingInfo}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t.settings.themeDark}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.themeDarkDesc}
                </Text>
              </View>
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
            <View style={styles.settingInfo}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>中文</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  使用中文显示应用界面
                </Text>
              </View>
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
            <View style={styles.settingInfo}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>English</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  Display app interface in English
                </Text>
              </View>
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
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.permissions.notificationPermissionTitle}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.notificationPermissionDesc}
                </Text>
              </View>
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
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.permissions.calendarPermissionTitle}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.calendarPermissionDesc}
                </Text>
              </View>
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
            <Text style={[styles.infoValue, { color: colors.text }]}>{dbInfo?.version}</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.exportJSON}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.exportJSONDesc}
                </Text>
              </View>
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
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.exportCSV}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.exportCSVDesc}
                </Text>
              </View>
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
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.importJSON}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.importJSONDesc}
                </Text>
              </View>
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
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.importCSV}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.importCSVDesc}
                </Text>
              </View>
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
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{t.settings.resetData}</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.resetDataDesc}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleResetDatabase}
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
            <Text style={[styles.infoValue, { color: colors.text }]}>{getFullVersion()}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subText }]}>{t.settings.author}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>@{APP_INFO.AUTHOR}</Text>
          </View>

          <TouchableOpacity
            style={[styles.infoItem, { borderBottomWidth: 0 }]}
            onPress={() => {
              Linking.openURL('https://github.com/zfonlyone/nevermiss');
            }}>
            <View style={styles.settingInfo}>
              <Ionicons name="logo-github" size={24} color={colors.text} style={styles.settingIcon} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>GitHub</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  {t.settings.projectInfo}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* 开发者选项 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.border }]}>
            开发者选项
          </Text>

          {/* 测试选项 */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/test')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="code-working" size={24} color={colors.text} style={styles.settingIcon} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>导入导出测试</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  测试数据导入导出功能
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.subText} />
          </TouchableOpacity>

          {/* 农历测试选项 */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/test-lunar')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={24} color={colors.text} style={styles.settingIcon} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>农历功能测试</Text>
                <Text style={[styles.settingDescription, { color: colors.subText }]}>
                  测试农历日期转换和计算功能
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.subText} />
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
    minHeight: 70,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  settingDescription: {
    fontSize: 14,
    flexWrap: 'wrap',
  },
  permissionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
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
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    flex: 2,
  },
  selectedSetting: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  settingIcon: {
    marginRight: 10,
    width: 24,
    height: 24,
  },
}); 