import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_INFO, getFullVersion } from '../../config/version';

export interface Settings {
  appVersion: string;
  useLunarCalendar: boolean;
}

export interface AppInfo {
  databaseVersion: number;
  appVersion: string;
  author: string;
}

// 获取应用信息
export async function getAppInfo(): Promise<AppInfo> {
  const { dbVersion } = await getDatabaseVersion();
  return {
    databaseVersion: dbVersion,
    appVersion: getFullVersion(),
    author: APP_INFO.AUTHOR
  };
}

// 获取数据库版本
export async function getDatabaseVersion(): Promise<{
  dbVersion: number;
  appVersion: string;
}> {
  try {
    const version = await AsyncStorage.getItem('nevermiss_db_version');
    
    return {
      dbVersion: version ? parseInt(version) : 0,
      appVersion: getFullVersion()
    };
  } catch (error) {
    console.error('获取数据库版本时出错:', error);
    throw error;
  }
}

// 初始化数据库函数
export async function initDatabase() {
  try {
    // 检查是否已初始化
    const version = await AsyncStorage.getItem('nevermiss_db_version');
    
    if (!version) {
      // 首次初始化
      await AsyncStorage.setItem('nevermiss_db_version', APP_INFO.DATABASE_VERSION.toString());
      console.log('数据库初始化成功');
    } else {
      const currentVersion = parseInt(version);
      if (currentVersion < APP_INFO.DATABASE_VERSION) {
        // 执行数据库迁移
        await migrateDatabase(currentVersion, APP_INFO.DATABASE_VERSION);
        await AsyncStorage.setItem('nevermiss_db_version', APP_INFO.DATABASE_VERSION.toString());
        console.log(`数据库已从版本 ${currentVersion} 迁移到版本 ${APP_INFO.DATABASE_VERSION}`);
      } else {
        console.log(`数据库已初始化，版本: ${version}`);
      }
    }
  } catch (error) {
    console.error('初始化数据库时出错:', error);
    throw error;
  }
}

// 数据库迁移函数
async function migrateDatabase(fromVersion: number, toVersion: number) {
  try {
    for (let version = fromVersion + 1; version <= toVersion; version++) {
      switch (version) {
        case 2:
          await migrateToVersion2();
          break;
        case 3:
          await migrateToVersion3();
          break;
      }
    }
  } catch (error) {
    console.error('数据库迁移时出错:', error);
    throw error;
  }
}

// 迁移到版本2
async function migrateToVersion2() {
  try {
    // 获取所有数据
    const tasksJson = await AsyncStorage.getItem('nevermiss_tasks');
    const cyclesJson = await AsyncStorage.getItem('nevermiss_task_cycles');
    const historyJson = await AsyncStorage.getItem('nevermiss_task_history');

    // 添加版本信息
    const appVersion = APP_INFO.VERSION;
    
    // 更新任务数据
    if (tasksJson) {
      const tasks = JSON.parse(tasksJson);
      const updatedTasks = tasks.map((task: any) => ({
        ...task,
        appVersion,
        dbVersion: 2
      }));
      await AsyncStorage.setItem('nevermiss_tasks', JSON.stringify(updatedTasks));
    }

    // 更新周期数据
    if (cyclesJson) {
      const cycles = JSON.parse(cyclesJson);
      const updatedCycles = cycles.map((cycle: any) => ({
        ...cycle,
        appVersion,
        dbVersion: 2
      }));
      await AsyncStorage.setItem('nevermiss_task_cycles', JSON.stringify(updatedCycles));
    }

    // 更新历史数据
    if (historyJson) {
      const history = JSON.parse(historyJson);
      const updatedHistory = history.map((record: any) => ({
        ...record,
        appVersion,
        dbVersion: 2
      }));
      await AsyncStorage.setItem('nevermiss_task_history', JSON.stringify(updatedHistory));
    }

    console.log('成功迁移到数据库版本2');
  } catch (error) {
    console.error('迁移到版本2时出错:', error);
    throw error;
  }
}

// 迁移到版本3
async function migrateToVersion3() {
  try {
    // 初始化默认设置
    const settings: Settings = {
      appVersion: getFullVersion(),
      useLunarCalendar: false
    };
    await AsyncStorage.setItem('nevermiss_settings', JSON.stringify(settings));
    console.log('成功迁移到数据库版本3');
  } catch (error) {
    console.error('迁移到版本3时出错:', error);
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
  appVersion: string;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
  settings: Settings;
}> => {
  try {
    const { dbVersion, appVersion } = await getDatabaseVersion();
    const settings = await getSettings();
    
    const tasksJson = await AsyncStorage.getItem('nevermiss_tasks') || '[]';
    const tasks = JSON.parse(tasksJson);
    
    const cyclesJson = await AsyncStorage.getItem('nevermiss_task_cycles') || '[]';
    const cycles = JSON.parse(cyclesJson);
    
    const historyJson = await AsyncStorage.getItem('nevermiss_task_history') || '[]';
    const history = JSON.parse(historyJson);
    
    return {
      version: dbVersion,
      appVersion,
      tasksCount: tasks.length,
      cyclesCount: cycles.length,
      historyCount: history.length,
      settings
    };
  } catch (error) {
    console.error('获取数据库信息时出错:', error);
    throw error;
  }
};

// 获取设置
export async function getSettings(): Promise<Settings> {
  try {
    const settingsJson = await AsyncStorage.getItem('nevermiss_settings');
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    // 返回默认设置
    return {
      appVersion: getFullVersion(),
      useLunarCalendar: false
    };
  } catch (error) {
    console.error('获取设置时出错:', error);
    throw error;
  }
}

// 更新设置
export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem('nevermiss_settings', JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('更新设置时出错:', error);
    throw error;
  }
}

// Export all functions
export default {
  initDatabase,
  clearDatabase,
  resetDatabase,
  getDatabaseVersion,
  getDatabaseInfo,
  getSettings,
  updateSettings,
  getAppInfo
}; 