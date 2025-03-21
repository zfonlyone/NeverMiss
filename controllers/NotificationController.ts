import { startForegroundNotificationService, stopForegroundNotificationService, checkiOSPushNotificationsSupport } from '../services/notificationService';
import { saveNotificationPreference, getNotificationPreference } from '../services/preferenceService';
import { Platform } from 'react-native';

/**
 * 控制通知栏常驻功能
 * @param enabled 是否启用常驻通知
 */
export const togglePersistentNotification = async (enabled: boolean) => {
  try {
    // 检查iOS是否支持推送通知
    if (Platform.OS === 'ios') {
      const supportsPushNotifications = await checkiOSPushNotificationsSupport();
      if (!supportsPushNotifications && enabled) {
        console.log('当前iOS环境不支持Push Notifications，无法启用常驻通知');
        return false;
      }
    }
    
    let success = false;
    
    if (enabled) {
      success = await startForegroundNotificationService();
    } else {
      success = await stopForegroundNotificationService();
    }
    
    if (success) {
      // 保存用户偏好设置
      await saveNotificationPreference('persistentNotification', enabled);
      return true;
    } else {
      console.error('Failed to toggle persistent notification');
      return false;
    }
  } catch (error) {
    console.error('Error toggling persistent notification:', error);
    return false;
  }
};

// 启动时检查并启用通知栏常驻
export const initializePersistentNotification = async () => {
  try {
    // 获取用户偏好设置
    const enabled = await getNotificationPreference('persistentNotification', false);
    
    // 如果用户启用了常驻通知，检查iOS推送支持情况
    if (enabled) {
      if (Platform.OS === 'ios') {
        const supportsPushNotifications = await checkiOSPushNotificationsSupport();
        if (!supportsPushNotifications) {
          console.log('当前iOS环境不支持Push Notifications，跳过启用常驻通知');
          return false;
        }
      }
      
      await startForegroundNotificationService();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing persistent notification:', error);
    return false;
  }
}; 