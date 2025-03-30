// Import data from JSON
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabaseVersion } from './database';

interface ExportData {
  appVersion: string;
  dbVersion: number;
  data: {
    tasks: any[];
    cycles: any[];
    history: any[];
  };
}

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

// 默认导出对象
export default {
  importDataFromJSON
}; 