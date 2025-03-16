import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { getAllTasks } from './taskService';
import { saveTask, saveTaskCycle } from './storageService';

// Export data to JSON
export async function exportDataToJSON(): Promise<string> {
  try {
    // 获取所有任务
    const tasks = await getAllTasks();
    
    // 获取所有周期
    const cyclesJson = await AsyncStorage.getItem('nevermiss_task_cycles') || '[]';
    const cycles = JSON.parse(cyclesJson);
    
    // 创建导出对象
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
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
    
    return filePath;
  } catch (error) {
    console.error('导出数据时出错:', error);
    throw error;
  }
}

// Export data to CSV
export async function exportDataToCSV(): Promise<string> {
  try {
    // 获取所有任务
    const tasks = await getAllTasks();
    
    // 创建 CSV 头
    let csvData = 'Task ID,Title,Description,Recurrence Type,Recurrence Value,Recurrence Unit,Reminder Offset,Reminder Unit,Is Active,Auto Restart,Created At,Updated At\n';
    
    // 添加任务数据
    tasks.forEach((task) => {
      csvData += `${task.id},"${task.title.replace(/"/g, '""')}","${(task.description || '').replace(/"/g, '""')}",${task.recurrenceType},${task.recurrenceValue},${task.recurrenceUnit || ''},${task.reminderOffset},${task.reminderUnit},${task.isActive},${task.autoRestart},${task.createdAt},${task.updatedAt}\n`;
    });
    
    // 创建文件
    const fileName = `nevermiss_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, csvData);
    
    return filePath;
  } catch (error) {
    console.error('导出数据到 CSV 时出错:', error);
    throw error;
  }
}

// Share exported file
export async function shareFile(filePath: string): Promise<void> {
  try {
    // 检查分享功能是否可用
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      throw new Error('此设备不支持分享功能');
    }
    
    // 分享文件
    await Sharing.shareAsync(filePath);
  } catch (error) {
    console.error('分享文件时出错:', error);
    throw error;
  }
}

// Import data from JSON
export async function importDataFromJSON(): Promise<void> {
  try {
    // 选择文档
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      throw new Error('文档选择已取消');
    }
    
    // 读取文件
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    
    // 解析 JSON
    const importData = JSON.parse(fileContent);
    
    // 验证导入数据
    if (!importData.version || !importData.data) {
      throw new Error('导入文件格式无效');
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
    
    console.log('数据导入成功');
  } catch (error) {
    console.error('导入数据时出错:', error);
    throw error;
  }
} 