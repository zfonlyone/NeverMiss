import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabaseInfo, resetDatabase } from '../services/database';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface DatabaseInfo {
  version: number;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}

export default function SettingsScreen() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { themeMode, isDarkMode, setThemeMode, colors } = useTheme();
  const { language, t, changeLanguage } = useLanguage();

  const loadDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      const info = await getDatabaseInfo();
      setDbInfo(info);
    } catch (error) {
      console.error('Error loading database info:', error);
      Alert.alert(t.common.error, t.settings.loadDatabaseFailed);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const handleResetDatabase = () => {
    Alert.alert(
      t.settings.resetData,
      t.settings.resetDataConfirmation,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.settings.reset,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await resetDatabase();
              await loadDatabaseInfo();
              Alert.alert(t.common.success, t.settings.resetDataSuccess);
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert(t.common.error, t.settings.resetDataFailed);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const openGitHubRepo = () => {
    Linking.openURL('https://github.com/zfonlyone/NeverMiss').catch((err) => {
      console.error('Error opening URL:', err);
      Alert.alert(t.common.error, t.settings.cannotOpenUrl);
    });
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* 主题设置 */}
      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {t.settings.themeSettings}
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="sync" size={24} color={colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.settings.themeAuto}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                {t.settings.themeAutoDesc}
              </Text>
            </View>
          </View>
          <Switch 
            value={themeMode === 'auto'} 
            onValueChange={(value) => {
              if (value) setThemeMode('auto');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="sunny" size={24} color={colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.settings.themeLight}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                {t.settings.themeLightDesc}
              </Text>
            </View>
          </View>
          <Switch 
            value={themeMode === 'light'} 
            onValueChange={(value) => {
              if (value) setThemeMode('light');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={24} color={colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.settings.themeDark}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                {t.settings.themeDarkDesc}
              </Text>
            </View>
          </View>
          <Switch 
            value={themeMode === 'dark'} 
            onValueChange={(value) => {
              if (value) setThemeMode('dark');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* 语言设置 */}
      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {t.settings.languageSettings}
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.languageIcon, { color: colors.primary }]}>中</Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                中文
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                使用中文显示应用界面
              </Text>
            </View>
          </View>
          <Switch 
            value={language === 'zh'} 
            onValueChange={(value) => {
              if (value) changeLanguage('zh');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.languageIcon, { color: colors.primary }]}>En</Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                English
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                Display app interface in English
              </Text>
            </View>
          </View>
          <Switch 
            value={language === 'en'} 
            onValueChange={(value) => {
              if (value) changeLanguage('en');
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* 权限管理 */}
      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {t.settings.permissionSettings}
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.permissions.notificationPermissionTitle}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                {t.settings.notificationPermissionDesc}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { backgroundColor: colors.primary }
            ]}
          >
            <Text style={styles.permissionButtonText}>{t.settings.permissionGranted}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="calendar" size={24} color={colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.permissions.calendarPermissionTitle}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                {t.settings.calendarPermissionDesc}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { backgroundColor: colors.primary }
            ]}
          >
            <Text style={styles.permissionButtonText}>{t.settings.permissionGranted}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 数据库信息 */}
      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {t.settings.databaseInfo}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : dbInfo ? (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subText },
                ]}
              >
                {t.settings.version}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text },
                ]}
              >
                {dbInfo.version}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subText },
                ]}
              >
                {t.settings.tasksCount}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text },
                ]}
              >
                {dbInfo.tasksCount}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subText },
                ]}
              >
                {t.settings.cyclesCount}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text },
                ]}
              >
                {dbInfo.cyclesCount}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.subText },
                ]}
              >
                {t.settings.historyCount}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.text },
                ]}
              >
                {dbInfo.historyCount}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* 数据管理 */}
      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {t.settings.dataManagement}
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
          <Text style={styles.buttonText}>{t.settings.resetData}</Text>
        </TouchableOpacity>
      </View>

      {/* 关于 */}
      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 12, margin: 16 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {t.settings.about}
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="logo-github" size={24} color={colors.primary} style={styles.settingIcon} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.settings.projectInfo}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subText }]}>
                https://github.com/zfonlyone/NeverMiss
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={openGitHubRepo}>
            <Ionicons name="open-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 72,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  languageIcon: {
    width: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  settingDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  infoContainer: {
    backgroundColor: 'transparent',
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
  permissionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 