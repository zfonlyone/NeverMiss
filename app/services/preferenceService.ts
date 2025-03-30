import AsyncStorage from '@react-native-async-storage/async-storage';

// 偏好设置的存储键前缀
const PREFERENCE_KEY_PREFIX = '@NeverMiss:preference:';

/**
 * 保存偏好设置
 * @param key 偏好设置的键
 * @param value 偏好设置的值
 */
export const savePreference = async <T>(key: string, value: T): Promise<void> => {
  try {
    const storageKey = `${PREFERENCE_KEY_PREFIX}${key}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.error(`保存偏好设置 ${key} 时出错:`, error);
    throw error;
  }
};

/**
 * 获取偏好设置
 * @param key 偏好设置的键
 * @param defaultValue 默认值，如果偏好设置不存在
 * @returns 偏好设置的值
 */
export const getPreference = async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
  try {
    const storageKey = `${PREFERENCE_KEY_PREFIX}${key}`;
    const value = await AsyncStorage.getItem(storageKey);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`获取偏好设置 ${key} 时出错:`, error);
    return defaultValue;
  }
};

/**
 * 删除偏好设置
 * @param key 要删除的偏好设置的键
 */
export const removePreference = async (key: string): Promise<void> => {
  try {
    const storageKey = `${PREFERENCE_KEY_PREFIX}${key}`;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`删除偏好设置 ${key} 时出错:`, error);
    throw error;
  }
};

/**
 * 保存通知偏好设置
 * @param key 通知偏好设置的键
 * @param value 通知偏好设置的值
 */
export const saveNotificationPreference = async <T>(key: string, value: T): Promise<void> => {
  return savePreference(`notification:${key}`, value);
};

/**
 * 获取通知偏好设置
 * @param key 通知偏好设置的键
 * @param defaultValue 默认值，如果偏好设置不存在
 * @returns 通知偏好设置的值
 */
export const getNotificationPreference = async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
  return getPreference(`notification:${key}`, defaultValue);
};

// 默认导出对象，包含所有导出的函数
export default {
  savePreference,
  getPreference,
  removePreference,
  saveNotificationPreference,
  getNotificationPreference
}; 