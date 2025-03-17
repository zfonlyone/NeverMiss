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
  version: string;
  timestamp: string;
  author: string;
  data: {
    tasks: Task[];
    cycles: TaskCycle[];
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
export async function exportDataToJSON(): Promise<ExportResult> {
  try {
    // 检查分享功能是否可用
    const isAvailable = await checkSharingAvailability();
    if (!isAvailable) {
      return {
        success: false,
        error: '此设备不支持分享功能'
      };
    }
    
    // 获取所有任务
    const tasks = await getAllTasks();
    
    // 获取所有周期
    const cycles = await getTaskCycles();
    
    // 获取数据库版本
    const dbVersion = await getDatabaseVersion();
    
    // 获取应用版本
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    
    // 创建导出对象
    const exportData: ExportData = {
      appVersion,
      dbVersion,
      version: '1.1',
      timestamp: new Date().toISOString(),
      author: 'zfonlyone',
      data: {
        tasks,
        cycles
      },
    };
    
    // 转换为 JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // 创建文件
    const fileName = `nevermiss_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, jsonData);
    
    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('导出数据时出错:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// Export data to CSV
export async function exportDataToCSV(): Promise<ExportResult> {
  try {
    // 检查分享功能是否可用
    const isAvailable = await checkSharingAvailability();
    if (!isAvailable) {
      return {
        success: false,
        error: '此设备不支持分享功能'
      };
    }
    
    // 获取所有任务
    const tasks = await getAllTasks();
    
    // 创建 CSV 头
    let csvData = 'Task ID,Title,Description,Recurrence Type,Recurrence Value,Recurrence Unit,Reminder Offset,Reminder Unit,Reminder Hour,Reminder Minute,Is Active,Auto Restart,Sync To Calendar,Created At,Updated At\n';
    
    // 添加任务数据
    tasks.forEach((task) => {
      csvData += `${task.id},"${task.title.replace(/"/g, '""')}","${(task.description || '').replace(/"/g, '""')}",${task.recurrenceType},${task.recurrenceValue},${task.recurrenceUnit || ''},${task.reminderOffset},${task.reminderUnit},${task.reminderTime.hour},${task.reminderTime.minute},${task.isActive},${task.autoRestart},${task.syncToCalendar},${task.createdAt},${task.updatedAt}\n`;
    });
    
    // 创建文件
    const fileName = `nevermiss_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, csvData);
    
    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('导出数据到 CSV 时出错:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// Share exported file
export async function shareFile(filePath: string): Promise<boolean> {
  try {
    // 检查分享功能是否可用
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      throw new Error('此设备不支持分享功能');
    }
    
    // 分享文件
    await Sharing.shareAsync(filePath);
    return true;
  } catch (error) {
    console.error('分享文件时出错:', error);
    return false;
  }
}

// Import data from JSON
export async function importDataFromJSON(): Promise<ImportResult> {
  try {
    // 选择文档
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      return {
        success: false,
        error: '文档选择已取消'
      };
    }
    
    // 读取文件
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    
    // 解析 JSON
    const importData = JSON.parse(fileContent) as ExportData;
    
    // 验证导入数据
    if (!importData.version || !importData.data) {
      return {
        success: false,
        error: '导入文件格式无效'
      };
    }
    
    // 导入任务和周期
    const { tasks, cycles } = importData.data;
    
    // 保存任务
    for (const task of tasks) {
      await saveTask(task);
    }
    
    // 保存周期
    for (const cycle of cycles) {
      await saveTaskCycle(cycle);
    }
    
    return {
      success: true,
      tasksCount: tasks.length,
      cyclesCount: cycles.length
    };
  } catch (error) {
    console.error('导入数据时出错:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// Import data from CSV
export async function importDataFromCSV(): Promise<ImportResult> {
  try {
    // 选择文档
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      return {
        success: false,
        error: '文档选择已取消'
      };
    }
    
    // 读取文件
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    
    // 解析 CSV
    const lines = fileContent.split('\n');
    const header = lines[0].split(',');
    
    // 验证 CSV 格式
    if (lines.length < 2 || !header.includes('Task ID') || !header.includes('Title')) {
      return {
        success: false,
        error: 'CSV 文件格式无效'
      };
    }
    
    // 解析任务数据
    const tasks: Task[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      if (values.length < header.length) continue;
      
      const task: Task = {
        id: parseInt(values[0]),
        title: values[1].replace(/^"|"$/g, ''),
        description: values[2].replace(/^"|"$/g, ''),
        recurrenceType: values[3] as any,
        recurrenceValue: parseInt(values[4]),
        recurrenceUnit: values[5] ? values[5] as any : undefined,
        reminderOffset: parseInt(values[6]),
        reminderUnit: values[7] as any,
        reminderTime: {
          hour: parseInt(values[8]),
          minute: parseInt(values[9])
        },
        isActive: values[10] === 'true',
        autoRestart: values[11] === 'true',
        syncToCalendar: values[12] === 'true',
        createdAt: values[13],
        updatedAt: values[14],
      };
      
      tasks.push(task);
    }
    
    // 保存任务
    for (const task of tasks) {
      await saveTask(task);
    }
    
    return {
      success: true,
      tasksCount: tasks.length,
      cyclesCount: 0
    };
  } catch (error) {
    console.error('导入 CSV 数据时出错:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 解析 CSV 行，处理引号内的逗号
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
} 