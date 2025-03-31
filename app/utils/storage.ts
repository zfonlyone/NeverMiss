import AsyncStorage from '@react-native-async-storage/async-storage';

// 封装存储方法，使用 AsyncStorage 而不是 MMKV
export const getItem = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    
    // 检查值是否为简单字符串(zh/en)
    if (key === 'language' || (value.length < 3 && (value === 'zh' || value === 'en'))) {
      return value;
    }
    
    // 尝试解析JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // 如果无法解析为JSON，返回原始值
      return value;
    }
  } catch (e) {
    console.error(`获取数据时出错: ${key}`, e);
    return null;
  }
};

export const setItem = async (key: string, value: any) => {
  try {
    // 如果是简单的语言代码字符串，直接存储
    if (key === 'language' || (typeof value === 'string' && (value === 'zh' || value === 'en'))) {
      await AsyncStorage.setItem(key, value);
    } else {
      // 其他值正常JSON序列化
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    return true;
  } catch (e) {
    console.error(`存储数据时出错: ${key}`, e);
    return false;
  }
};

export const removeItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`删除数据时出错: ${key}`, e);
    return false;
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (e) {
    console.error('清除所有数据时出错', e);
    return false;
  }
}; 

/**
 * 存储键常量
 * 存储所有AsyncStorage使用的键名
 * 集中管理以避免拼写错误和冲突
 */
export const STORAGE_KEYS = {
  // 任务相关
  TASKS: 'tasks',                  // 所有任务的存储键
  TASK_CYCLES: 'task_cycles',      // 任务循环周期的存储键
  TASK_HISTORY: 'task_history',    // 任务历史记录的存储键
  TASK_STATS: 'task_stats',        // 任务统计数据的存储键
  
  // 用户偏好和设置
  SETTINGS: 'settings',            // 用户综合设置
  LANGUAGE: 'language',            // 语言设置
  THEME: 'theme',                  // 界面主题设置（亮色/暗色）
  USER_SETTINGS: 'user_settings',  // 用户个性化设置
  
  // 应用状态信息
  APP_VERSION: 'app_version',      // 应用版本号
  DB_VERSION: 'db_version',        // 数据库版本号
  APP_STATE: 'app_state',          // 应用状态信息
  LAST_SYNC: 'last_sync',          // 最后同步时间
  
  // 其他系统功能设置
  NOTIFICATION_SETTINGS: 'notification_settings', // 通知设置
  CALENDAR_SYNC: 'calendar_sync'                  // 日历同步设置
} as const; 

// 默认导出对象，包含所有导出的函数和常量
export default {
  getItem,
  setItem,
  removeItem,
  clearAll,
  STORAGE_KEYS
}; 