import { startForegroundNotificationService, stopForegroundNotificationService } from '../services/notificationService';
import { saveNotificationPreference, getNotificationPreference } from '../services/preferenceService';

/**
 * 控制通知栏常驻功能
 * @param enabled 是否启用常驻通知
 */
export const togglePersistentNotification = async (enabled: boolean) => {
  try {
    if (enabled) {
      await startForegroundNotificationService();
    } else {
      await stopForegroundNotificationService();
    }
    
    // 保存用户偏好设置
    await saveNotificationPreference('persistentNotification', enabled);
    
    return true;
  } catch (error) {
    console.error('Error toggling persistent notification:', error);
    return false;
  }
};

// 启动时检查并启用通知栏常驻
export const initializePersistentNotification = async () => {
  const enabled = await getNotificationPreference('persistentNotification', false);
  if (enabled) {
    await startForegroundNotificationService();
  }
}; 