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

export const STORAGE_KEYS = {
  TASKS: 'tasks',
  TASK_CYCLES: 'task_cycles',
  TASK_HISTORY: 'task_history',
  SETTINGS: 'settings',
  LANGUAGE: 'language',
  THEME: 'theme',
  APP_VERSION: 'app_version',
  DB_VERSION: 'db_version',
} as const; 