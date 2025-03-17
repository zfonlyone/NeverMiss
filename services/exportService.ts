/**
 * Export Service for NeverMiss
 * @author zfonlyone
 * 
 * This service handles data import and export functionality
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { getAllTasks } from './taskService';
import { saveTask, saveTaskCycle, getTaskCycles } from './storageService';
import { checkSharingAvailability } from './permissionService';
import { Alert, Platform } from 'react-native';
import { getDatabaseVersion } from './database';
import Constants from 'expo-constants';

// 导出数据格式
export interface ExportData {
  appVersion: string;
  dbVersion: number;
  exportTimestamp: string;
  platform: string;
  data: {
    tasks: Task[];
    cycles: TaskCycle[];
    history: any[];
  };
}

// 导出结果
export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// 导入结果
export interface ImportResult {
  success: boolean;
  tasksCount?: number;
  cyclesCount?: number;
  error?: string;
}

// Export data to JSON
export const exportDataToJSON = async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    // 检查是否可以分享
    const canShare = await checkSharingAvailability();
    if (!canShare) {
      return { success: false, error: '设备不支持分享功能' };
    }

    // 获取版本信息
    const { dbVersion, appVersion } = await getDatabaseVersion();

    // 获取所有数据
    const tasksJson = await AsyncStorage.getItem('nevermiss_tasks');
    const cyclesJson = await AsyncStorage.getItem('nevermiss_task_cycles');
    const historyJson = await AsyncStorage.getItem('nevermiss_task_history');

    const tasks = tasksJson ? JSON.parse(tasksJson) : [];
    const cycles = cyclesJson ? JSON.parse(cyclesJson) : [];
    const history = historyJson ? JSON.parse(historyJson) : [];

    // 构建导出数据
    const exportData: ExportData = {
      appVersion,
      dbVersion,
      exportTimestamp: new Date().toISOString(),
      platform: Platform.OS,
      data: {
        tasks,
        cycles,
        history
      }
    };

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `nevermiss_backup_${timestamp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    return { success: true, filePath };
  } catch (error) {
    console.error('导出数据失败:', error);
    return { success: false, error: '导出数据时发生错误' };
  }
};

// Export data to CSV
export const exportDataToCSV = async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    // 检查是否可以分享
    const canShare = await checkSharingAvailability();
    if (!canShare) {
      return { success: false, error: '设备不支持分享功能' };
    }

    // 获取版本信息
    const { dbVersion, appVersion } = await getDatabaseVersion();

    // 获取任务数据
    const tasksJson = await AsyncStorage.getItem('nevermiss_tasks');
    const tasks = tasksJson ? JSON.parse(tasksJson) : [];

    // 构建CSV内容
    let csvContent = 'App Version,DB Version,Task ID,Title,Description,Recurrence Type,Recurrence Value,Reminder Offset,Is Active,Created At\n';
    
    tasks.forEach((task: Task) => {
      csvContent += `${appVersion},${dbVersion},${task.id},"${task.title}","${task.description || ''}",${task.recurrenceType},${task.recurrenceValue},${task.reminderOffset},${task.isActive},${task.createdAt}\n`;
    });

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `nevermiss_tasks_${timestamp}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, csvContent);

    return { success: true, filePath };
  } catch (error) {
    console.error('导出CSV失败:', error);
    return { success: false, error: '导出CSV时发生错误' };
  }
};

// Share exported file
export const shareFile = async (filePath: string): Promise<boolean> => {
  try {
    await Sharing.shareAsync(filePath, {
      mimeType: filePath.endsWith('.json') ? 'application/json' : 'text/csv',
      dialogTitle: '分享备份文件'
    });
    return true;
  } catch (error) {
    console.error('分享文件失败:', error);
    return false;
  }
};

// Import data from JSON
export const importDataFromJSON = async (uri: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 读取文件内容
    const fileContent = await FileSystem.readAsStringAsync(uri);
    const importData: ExportData = JSON.parse(fileContent);

    // 验证数据格式
    if (!importData.appVersion || !importData.dbVersion || !importData.data) {
      return { success: false, error: '无效的备份文件格式' };
    }

    // 获取当前版本
    const { dbVersion: currentDbVersion, appVersion: currentAppVersion } = await getDatabaseVersion();

    // 检查版本兼容性
    if (importData.dbVersion > currentDbVersion) {
      return { 
        success: false, 
        error: `备份文件的数据库版本(${importData.dbVersion})高于当前版本(${currentDbVersion})，无法导入` 
      };
    }

    // 保存数据
    await AsyncStorage.setItem('nevermiss_tasks', JSON.stringify(importData.data.tasks));
    await AsyncStorage.setItem('nevermiss_task_cycles', JSON.stringify(importData.data.cycles));
    await AsyncStorage.setItem('nevermiss_task_history', JSON.stringify(importData.data.history));

    return { success: true };
  } catch (error) {
    console.error('导入数据失败:', error);
    return { success: false, error: '导入数据时发生错误' };
  }
};

// Import data from CSV
export const importDataFromCSV = async (uri: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 读取文件内容
    const fileContent = await FileSystem.readAsStringAsync(uri);
    
    // 解析CSV
    const lines = fileContent.split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'CSV文件为空' };
    }

    // 验证标题行
    const headers = lines[0].split(',');
    if (!headers.includes('App Version') || !headers.includes('DB Version')) {
      return { success: false, error: '无效的CSV文件格式' };
    }

    // 获取当前版本
    const { dbVersion: currentDbVersion } = await getDatabaseVersion();

    // 解析任务数据
    const tasks: Task[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const importDbVersion = parseInt(values[1]);
      
      // 检查版本兼容性
      if (importDbVersion > currentDbVersion) {
        return { 
          success: false, 
          error: `CSV文件的数据库版本(${importDbVersion})高于当前版本(${currentDbVersion})，无法导入` 
        };
      }

      // 构建任务对象
      const task: Task = {
        id: parseInt(values[2]),
        title: values[3].replace(/^"|"$/g, ''),
        description: values[4].replace(/^"|"$/g, ''),
        recurrenceType: values[5] as any,
        recurrenceValue: parseInt(values[6]),
        reminderOffset: parseInt(values[7]),
        reminderUnit: 'minutes',
        reminderTime: {
          hour: 9,
          minute: 0
        },
        isActive: values[8].toLowerCase() === 'true',
        autoRestart: true,
        syncToCalendar: false,
        createdAt: values[9],
        updatedAt: new Date().toISOString(),
      };

      tasks.push(task);
    }

    // 保存任务数据
    await AsyncStorage.setItem('nevermiss_tasks', JSON.stringify(tasks));

    return { success: true };
  } catch (error) {
    console.error('导入CSV失败:', error);
    return { success: false, error: '导入CSV时发生错误' };
  }
}; 