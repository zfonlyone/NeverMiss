import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import { togglePersistentNotification } from '../../controllers/NotificationController';
import { getNotificationPreference } from '../../services/preferenceService';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exportDataToJSON, exportDataToCSV, shareFile, importDataFromJSON, importDataFromCSV } from '../../services/exportService';
import { checkPermissionsForFeature, requestPermissionsForFeature, checkNotificationPermission, checkCalendarPermission, requestNotificationPermission, requestCalendarPermission } from '../../services/permissionService';
import { getDatabaseInfo as getDatabaseInfoService, resetDatabase } from '../../services/database';
import { APP_INFO, getFullVersion } from '../../config/version';
import * as DocumentPicker from 'expo-document-picker';
import { List } from 'react-native-paper';
import Constants from 'expo-constants';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

interface DatabaseInfo {
  version: number;
  appVersion: string;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}

const SettingsScreen = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { themeMode, setThemeMode, colors, isDarkMode } = useTheme();
  const [isPersistentNotificationEnabled, setIsPersistentNotificationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('undetermined');
  const [calendarPermission, setCalendarPermission] = useState<string>('undetermined');

  useEffect(() => {
    // 加载设置
    loadSettings();
    loadDatabaseInfo();
    checkPermissions();
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
      Alert.alert(t.common.error, t.settings.loadDatabaseFailed);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkPermissions = async () => {
    const notifPermission = await checkNotificationPermission();
    setNotificationPermission(notifPermission.status);
    
    const calPermission = await checkCalendarPermission();
    setCalendarPermission(calPermission.status);
  };
  
  const handleRequestNotificationPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result.status);
  };
  
  const handleRequestCalendarPermission = async () => {
    const result = await requestCalendarPermission();
    setCalendarPermission(result.status);
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
      setIsLoading(true);
      setIsLanguageModalVisible(false);
      await changeLanguage(lang);
      setTimeout(() => setIsLoading(false), 500); // 给界面一点时间刷新
    } catch (error) {
      console.error('切换语言失败:', error);
      Alert.alert(t.common.error, t.settings.languageChangeFailed);
      setIsLoading(false);
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
        Alert.alert(t.common.error, result.error || t.settings.exportFailed);
      }
    } catch (error) {
      console.error('导出CSV失败:', error);
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
            t.settings.importSuccess
          );
          await loadDatabaseInfo();
        } else {
          Alert.alert(t.common.error, importResult.error || t.settings.importFailed);
        }
      }
    } catch (error) {
      console.error('导入CSV失败:', error);
      Alert.alert(t.common.error, t.settings.importFailed);
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
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.themeSettings}</Text>
      <List.Item
        title={t.settings.themeAuto}
        description={t.settings.themeAutoDesc}
        left={props => <List.Icon {...props} icon="brightness-auto" color={colors.text} />}
        right={props => (
          <Switch
            value={themeMode === 'auto'}
            onValueChange={(value) => {
              if (value) setThemeMode('auto');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={themeMode === 'auto' ? '#007AFF' : '#f4f3f4'}
          />
        )}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.themeLight}
        description={t.settings.themeLightDesc}
        left={props => <List.Icon {...props} icon="white-balance-sunny" color={colors.text} />}
        right={props => (
          <Switch
            value={themeMode === 'light'}
            onValueChange={(value) => {
              if (value) setThemeMode('light');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={themeMode === 'light' ? '#007AFF' : '#f4f3f4'}
          />
        )}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.themeDark}
        description={t.settings.themeDarkDesc}
        left={props => <List.Icon {...props} icon="moon-waning-crescent" color={colors.text} />}
        right={props => (
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(value) => {
              if (value) setThemeMode('dark');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={themeMode === 'dark' ? '#007AFF' : '#f4f3f4'}
          />
        )}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
    </View>
  );

  // Section: Language settings
  const renderLanguageSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.languageSettings}</Text>
      <List.Item
        title={t.settings.language}
        description={language === 'en' ? t.settings.englishName : t.settings.chineseName}
        left={props => <List.Icon {...props} icon="translate" color={colors.text} />}
        onPress={() => setLanguageModalVisible(true)}
        right={props => <List.Icon {...props} icon="chevron-right" color={colors.text} />}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
    </View>
  );

  // Section: Permission settings
  const renderPermissionSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.permissionSettings}</Text>
      <List.Item
        title={t.permissions.notificationPermissionTitle}
        description={t.settings.notificationPermissionDesc}
        left={props => <List.Icon {...props} icon="bell" color={colors.text} />}
        right={props => (
          notificationPermission === 'granted' ? (
            <View style={[styles.permissionGranted, { backgroundColor: colors.success }]}>
              <Text style={styles.permissionText}>{t.settings.permissionGranted}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.permissionRequest, { backgroundColor: colors.primary }]}
              onPress={handleRequestNotificationPermission}
            >
              <Text style={styles.permissionText}>{t.settings.permissionRequest}</Text>
            </TouchableOpacity>
          )
        )}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.permissions.calendarPermissionTitle}
        description={t.settings.calendarPermissionDesc}
        left={props => <List.Icon {...props} icon="calendar" color={colors.text} />}
        right={props => (
          calendarPermission === 'granted' ? (
            <View style={[styles.permissionGranted, { backgroundColor: colors.success }]}>
              <Text style={styles.permissionText}>{t.settings.permissionGranted}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.permissionRequest, { backgroundColor: colors.primary }]}
              onPress={handleRequestCalendarPermission}
            >
              <Text style={styles.permissionText}>{t.settings.permissionRequest}</Text>
            </TouchableOpacity>
          )
        )}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
    </View>
  );

  // Section: Notification settings 
  const renderNotificationSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.notificationSettings}</Text>
      <List.Item
        title={t.settings.persistentNotification}
        description={t.settings.persistentNotificationDesc + 
          (Platform.OS === 'android' ? t.settings.persistentNotificationAndroidNote : '')}
        left={props => <List.Icon {...props} icon="bell" color={colors.text} />}
        right={props => (
          <Switch
            value={isPersistentNotificationEnabled}
            onValueChange={handlePersistentNotificationToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isPersistentNotificationEnabled ? '#007AFF' : '#f4f3f4'}
          />
        )}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
    </View>
  );

  // Section: Data management
  const renderDataManagement = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.dataManagement}</Text>
      
      {/* 数据库信息 */}
      {dbInfo && (
        <View style={styles.dbInfoContainer}>
          <Text style={[styles.dbInfoTitle, { color: colors.text }]}>{t.settings.databaseInfo}</Text>
          <Text style={[styles.dbInfoText, { color: colors.text }]}>DB v{dbInfo.version}</Text>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        </View>
      )}
      
      <List.Item
        title={t.settings.exportJSON}
        description={t.settings.exportJSONDesc}
        left={props => <List.Icon {...props} icon="file-export" color={colors.text} />}
        onPress={handleExportJSON}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.importJSON}
        description={t.settings.importJSONDesc}
        left={props => <List.Icon {...props} icon="file-import" color={colors.text} />}
        onPress={handleImportJSON}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.exportCSV}
        description={t.settings.exportCSVDesc}
        left={props => <List.Icon {...props} icon="file-upload" color={colors.text} />}
        onPress={handleExportCSV}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.importCSV}
        description={t.settings.importCSVDesc}
        left={props => <List.Icon {...props} icon="file-download" color={colors.text} />}
        onPress={handleImportCSV}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.resetData}
        description={t.settings.resetDataDesc}
        left={props => <List.Icon {...props} icon="delete" color={colors.text} />}
        onPress={handleResetDatabase}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
    </View>
  );

  // Section: About
  const renderAbout = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.settings.about}</Text>
      <List.Item
        title={t.settings.appName}
        description={`${t.settings.version}: ${Constants.expoConfig?.version || '1.0.0'}`}
        left={props => <List.Icon {...props} icon="information" color={colors.text} />}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.author}
        description={t.settings.authorName}
        left={props => <List.Icon {...props} icon="account" color={colors.text} />}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.github}
        description={t.settings.githubLink}
        left={props => <List.Icon {...props} icon="github" color={colors.text} />}
        onPress={() => handleOpenURL('https://github.com/zfonlyone/NeverMiss')}
        titleStyle={{ color: colors.text }}
        descriptionStyle={{ color: colors.subText }}
      />
      <List.Item
        title={t.settings.feedback}
        left={props => <List.Icon {...props} icon="email" color={colors.text} />}
        onPress={() => handleOpenURL('mailto:zfonlyone@outlook.com')}
        titleStyle={{ color: colors.text }}
      />
      <List.Item
        title={t.settings.review}
        left={props => <List.Icon {...props} icon="star" color={colors.text} />}
        onPress={() => handleOpenURL('https://play.google.com/store/apps/details?id=com.allenliu.nevermiss')}
        titleStyle={{ color: colors.text }}
      />
      <List.Item
        title={t.settings.privacyPolicy}
        left={props => <List.Icon {...props} icon="shield" color={colors.text} />}
        onPress={() => handleOpenURL('https://www.privacypolicies.com/live/f5578f9b-b599-4966-a30d-10baa8b4e4a3')}
        titleStyle={{ color: colors.text }}
      />
      <List.Item
        title={t.settings.termsOfService}
        left={props => <List.Icon {...props} icon="file-document" color={colors.text} />}
        onPress={() => handleOpenURL('https://www.privacypolicies.com/live/f5578f9b-b599-4966-a30d-10baa8b4e4a3')}
        titleStyle={{ color: colors.text }}
      />
    </View>
  );

  // 语言选择模态框
  const renderLanguageModal = () => (
    <Modal
      visible={isLanguageModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsLanguageModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setIsLanguageModalVisible(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t.settings.language}</Text>
          
          <TouchableOpacity
            style={[
              styles.languageItem,
              language === 'en' && styles.selectedLanguage,
              { borderBottomColor: colors.border }
            ]}
            onPress={() => handleChangeLanguage('en')}
          >
            <View style={styles.languageContent}>
              <Text style={[styles.languageTitle, { color: colors.text }]}>English</Text>
              <Text style={[styles.languageDesc, { color: colors.subText }]}>Display app interface in English</Text>
            </View>
            {language === 'en' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.languageItem,
              language === 'zh' && styles.selectedLanguage
            ]}
            onPress={() => handleChangeLanguage('zh')}
          >
            <View style={styles.languageContent}>
              <Text style={[styles.languageTitle, { color: colors.text }]}>中文</Text>
              <Text style={[styles.languageDesc, { color: colors.subText }]}>使用中文显示应用界面</Text>
            </View>
            {language === 'zh' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => setIsLanguageModalVisible(false)}
          >
            <Text style={styles.buttonText}>{t.common.close}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t.settings.title,
          headerShown: true,
          headerBackTitle: t.menu.home,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          headerShadowVisible: false,
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      <ScrollView style={styles.settingsContainer}>
        {renderThemeSettings()}
        {renderLanguageSettings()}
        {renderPermissionSettings()}
        {renderNotificationSettings()}
        {renderDataManagement()}
        {renderAbout()}
      </ScrollView>
      
      {renderLanguageModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  dbInfoContainer: {
    marginBottom: 16,
  },
  dbInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dbInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
    marginBottom: 8,
  },
  permissionGranted: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionRequest: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default SettingsScreen; 