import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import { togglePersistentNotification } from '../../controllers/NotificationController';
import { getNotificationPreference } from '../../services/preferenceService';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exportDataToJSON, exportDataToCSV, shareFile, importDataFromJSON, importDataFromCSV } from '../../services/exportService';
import { checkPermissionsForFeature, requestPermissionsForFeature } from '../../services/permissionService';
import { getDatabaseInfo as getDatabaseInfoService, resetDatabase } from '../../services/database';
import { APP_INFO, getFullVersion } from '../../config/version';
import * as DocumentPicker from 'expo-document-picker';
import { List } from 'react-native-paper';
import Constants from 'expo-constants';

interface DatabaseInfo {
  version: number;
  appVersion: string;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}

const SettingsScreen = () => {
  const { t, language, changeLanguage } = useLanguage();
  const [isPersistentNotificationEnabled, setIsPersistentNotificationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colors, setColors] = useState({ text: '#000', primary: '#007AFF' });
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  useEffect(() => {
    // 加载设置
    loadSettings();
    loadDatabaseInfo();
  }, []);
  
  const loadSettings = async () => {
    // 获取通知栏常驻设置
    const persistentNotificationEnabled = await getNotificationPreference('persistentNotification', false);
    setIsPersistentNotificationEnabled(!!persistentNotificationEnabled);
  };

  const loadDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      const info = await getDatabaseInfoService();
      setDbInfo(info);
    } catch (error) {
      console.error('获取数据库信息失败:', error);
      Alert.alert(t.common.error, t.settings.loadDatabaseFailed || '加载数据库信息失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePersistentNotificationToggle = async (value: boolean) => {
    try {
      // 更新状态
      setIsPersistentNotificationEnabled(value);
      
      // 调用控制器函数启用/禁用通知栏常驻
      const success = await togglePersistentNotification(value);
      
      if (!success) {
        // 如果失败，恢复之前的状态
        setIsPersistentNotificationEnabled(!value);
        Alert.alert(t.common.error, t.settings.notificationToggleFailed);
      }
    } catch (error) {
      console.error('切换通知栏常驻设置时出错:', error);
      // 恢复之前的状态
      setIsPersistentNotificationEnabled(!value);
      Alert.alert(t.common.error, t.settings.settingsChangeError);
    }
  };

  const handleChangeLanguage = async (lang: Language) => {
    try {
      await changeLanguage(lang);
    } catch (error) {
      console.error('切换语言失败:', error);
      Alert.alert(t.common.error, t.settings.languageChangeFailed);
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
        Alert.alert(t.common.error, result.error || t.settings.exportFailed);
      }
    } catch (error) {
      console.error('导出JSON失败:', error);
      Alert.alert(t.common.error, t.settings.exportFailed);
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
            t.settings.importSuccess
          );
          await loadDatabaseInfo();
        } else {
          Alert.alert(t.common.error, importResult.error || t.settings.importFailed);
        }
      }
    } catch (error) {
      console.error('导入JSON失败:', error);
      Alert.alert(t.common.error, t.settings.importFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      t.settings.resetData || '重置数据',
      t.settings.resetDataConfirmation || '确定要重置数据库吗？此操作将删除所有数据且不可恢复。',
      [
        { text: t.common.cancel || '取消', style: 'cancel' },
        {
          text: t.settings.reset || '重置',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await resetDatabase();
              const info = await getDatabaseInfoService();
              setDbInfo(info);
              Alert.alert(t.common.success, t.settings.resetDataSuccess || '数据库已重置');
            } catch (error) {
              console.error('重置数据库失败:', error);
              Alert.alert(t.common.error, t.settings.resetDataFailed || '重置数据库失败');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    setColors({ ...colors, primary: isDarkMode ? '#81b0ff' : '#007AFF' });
  };

  const setLanguageModalVisible = (visible: boolean) => {
    setIsLanguageModalVisible(visible);
  };

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t.common.error, t.settings.cannotOpenUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert(t.common.error, t.settings.cannotOpenUrl);
    }
  };

  // Section: Theme settings
  const renderThemeSettings = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.themeSettings}</Text>
      <List.Item
        title={t.settings.darkMode}
        description={isDarkMode ? t.common.enabled : t.common.disabled}
        left={props => <List.Icon {...props} icon="theme-light-dark" />}
        right={props => (
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
          />
        )}
      />
    </View>
  );

  // Section: Language settings
  const renderLanguageSettings = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.languageSettings}</Text>
      <List.Item
        title={t.settings.language}
        description={language === 'en' ? t.settings.englishName : t.settings.chineseName}
        left={props => <List.Icon {...props} icon="translate" />}
        onPress={() => setLanguageModalVisible(true)}
        right={props => <List.Icon {...props} icon="chevron-right" />}
      />
    </View>
  );

  // Section: Notification settings 
  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.notificationSettings}</Text>
      <List.Item
        title={t.settings.persistentNotification}
        description={t.settings.persistentNotificationDesc + 
          (Platform.OS === 'android' ? t.settings.persistentNotificationAndroidNote : '')}
        left={props => <List.Icon {...props} icon="bell" />}
        right={props => (
          <Switch
            value={isPersistentNotificationEnabled}
            onValueChange={handlePersistentNotificationToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isPersistentNotificationEnabled ? '#007AFF' : '#f4f3f4'}
          />
        )}
      />
    </View>
  );

  // Section: Data management
  const renderDataManagement = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.dataManagement}</Text>
      <List.Item
        title={t.settings.exportJSON}
        description={t.settings.exportJSONDesc}
        left={props => <List.Icon {...props} icon="export" />}
        onPress={handleExportJSON}
      />
      <List.Item
        title={t.settings.importJSON}
        description={t.settings.importJSONDesc}
        left={props => <List.Icon {...props} icon="import" />}
        onPress={handleImportJSON}
      />
      <List.Item
        title={t.settings.resetData}
        description={t.settings.resetDataDesc}
        left={props => <List.Icon {...props} icon="delete" />}
        onPress={handleResetDatabase}
      />
    </View>
  );

  // Database information display
  const renderDatabaseInfo = () => {
    if (!dbInfo) return null;
    return (
      <View style={styles.databaseInfo}>
        <Text style={[styles.dbInfoText, { color: colors.text }]}>DB v{dbInfo.version}</Text>
        <Text style={[styles.dbInfoText, { color: colors.text }]}>{t.settings.tasksCount}: {dbInfo.tasksCount}</Text>
        <Text style={[styles.dbInfoText, { color: colors.text }]}>{t.settings.cyclesCount}: {dbInfo.cyclesCount}</Text>
        <Text style={[styles.dbInfoText, { color: colors.text }]}>{t.settings.historyCount}: {dbInfo.historyCount}</Text>
      </View>
    );
  };

  // Section: About
  const renderAbout = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.about}</Text>
      <List.Item
        title={t.settings.appName}
        description={`${t.settings.version}: ${Constants.expoConfig?.version || '1.0.0'}`}
        left={props => <List.Icon {...props} icon="information" />}
      />
      <List.Item
        title={t.settings.author}
        description={t.settings.authorName}
        left={props => <List.Icon {...props} icon="account" />}
      />
      <List.Item
        title={t.settings.feedback}
        left={props => <List.Icon {...props} icon="email" />}
        onPress={() => handleOpenURL('mailto:allenliu@aliyun.com')}
      />
      <List.Item
        title={t.settings.review}
        left={props => <List.Icon {...props} icon="star" />}
        onPress={() => handleOpenURL('https://play.google.com/store/apps/details?id=com.allenliu.nevermiss')}
      />
      <List.Item
        title={t.settings.privacyPolicy}
        left={props => <List.Icon {...props} icon="shield" />}
        onPress={() => handleOpenURL('https://www.privacypolicies.com/live/f5578f9b-b599-4966-a30d-10baa8b4e4a3')}
      />
      <List.Item
        title={t.settings.termsOfService}
        left={props => <List.Icon {...props} icon="file-document" />}
        onPress={() => handleOpenURL('https://www.privacypolicies.com/live/f5578f9b-b599-4966-a30d-10baa8b4e4a3')}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t.settings.title,
          headerShown: true,
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      
      <ScrollView style={styles.settingsContainer}>
        {renderThemeSettings()}
        {renderLanguageSettings()}
        {renderNotificationSettings()}
        {renderDataManagement()}
        {renderDatabaseInfo()}
        {renderAbout()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
    paddingHorizontal: 16,
  },
  settingsContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageContent: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedLanguage: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingLeft: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
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
  databaseInfo: {
    padding: 16,
  },
  dbInfoText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen; 