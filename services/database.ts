import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DATABASE_VERSION = 1;

// 获取数据库版本
export async function getDatabaseVersion(): Promise<number> {
  return DATABASE_VERSION;
}

// 初始化数据库函数
export async function initDatabase() {
  try {
    // 检查是否已初始化
    const version = await AsyncStorage.getItem('nevermiss_db_version');
    
    if (!version) {
      // 首次初始化
      await AsyncStorage.setItem('nevermiss_db_version', DATABASE_VERSION.toString());
      console.log('数据库初始化成功');
    } else {
      console.log(`数据库已初始化，版本: ${version}`);
      // 这里可以添加版本迁移逻辑
    }
  } catch (error) {
    console.error('初始化数据库时出错:', error);
    throw error;
  }
}

// 清除数据库
export const clearDatabase = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const nevermissKeys = keys.filter(key => key.startsWith('nevermiss_'));
    
    if (nevermissKeys.length > 0) {
      await AsyncStorage.multiRemove(nevermissKeys);
    }
    
    console.log('数据库清除成功');
  } catch (error) {
    console.error('清除数据库时出错:', error);
    throw error;
  }
};

// 重置数据库
export const resetDatabase = async (): Promise<void> => {
  try {
    await clearDatabase();
    await initDatabase();
    console.log('数据库重置成功');
  } catch (error) {
    console.error('重置数据库时出错:', error);
    throw error;
  }
};

// 获取数据库信息
export const getDatabaseInfo = async (): Promise<{
  version: number;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}> => {
  try {
    // 获取版本
    const version = await AsyncStorage.getItem('nevermiss_db_version') || '0';
    
    // 获取任务数量
    const tasksJson = await AsyncStorage.getItem('nevermiss_tasks') || '[]';
    const tasks = JSON.parse(tasksJson);
    
    // 获取周期数量
    const cyclesJson = await AsyncStorage.getItem('nevermiss_task_cycles') || '[]';
    const cycles = JSON.parse(cyclesJson);
    
    // 获取历史记录数量
    const historyJson = await AsyncStorage.getItem('nevermiss_task_history') || '[]';
    const history = JSON.parse(historyJson);
    
    return {
      version: parseInt(version, 10),
      tasksCount: tasks.length,
      cyclesCount: cycles.length,
      historyCount: history.length,
    };
  } catch (error) {
    console.error('获取数据库信息时出错:', error);
    throw error;
  }
};

// 导出函数
export default {
  initDatabase,
  clearDatabase,
  resetDatabase,
  getDatabaseVersion,
  getDatabaseInfo
}; 