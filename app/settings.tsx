/**
 * Settings Screen for NeverMiss
 * @author zfonlyone
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { exportDataToJSON, exportDataToCSV, shareFile, importDataFromJSON, importDataFromCSV } from '../services/exportService';
import { checkPermissionsForFeature, requestPermissionsForFeature } from '../services/permissionService';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { getDatabaseInfo as getDatabaseInfoService, resetDatabase } from '../services/database';
import { APP_INFO, getFullVersion } from '../config/version';
import * as DocumentPicker from 'expo-document-picker';
import SettingsScreen from './screens/SettingsScreen';

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

export default SettingsScreen; 