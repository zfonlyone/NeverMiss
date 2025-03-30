/**
 * Notification Service for NeverMiss
 * @author zfonlyone
 * 
 * This service handles scheduling and managing notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { registerBackgroundTask, unregisterBackgroundTask } from './backgroundTaskService';
import { checkNotificationPermission, requestNotificationPermission } from './permissionService';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';

// 判断是否在开发构建中
const isDevBuild = Constants.appOwnership !== 'expo';

// Configure notifications
export async function configureNotifications(): Promise<boolean> {
  try {
    // 警告用户Expo Go中的通知限制
    if (!isDevBuild) {
      console.warn(
        'NeverMiss 提醒: 在 Expo Go 中通知功能受限。' +
        '为获得完整的通知功能，请使用开发构建版本。'
      );
    }
    
    // 请求通知权限
    const permissionResult = await requestNotificationPermission();
    
    if (permissionResult.status !== 'granted') {
      console.log('未获得通知权限!');
      return false;
    }

    // 配置通知处理
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    
    // Configure notification appearance for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: '#FF0000',
        enableLights: true,
        enableVibrate: true,
      });
      
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task Reminders',
        description: 'Notifications for task reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: '#FF0000',
        enableLights: true,
        enableVibrate: true,
        sound: 'default',
      });
    }
    
    // 只在开发构建中注册后台任务
    if (isDevBuild) {
      await registerBackgroundTask();
    } else {
      console.log('在Expo Go中跳过后台任务注册');
    }
    
    return true;
  } catch (error) {
    console.error('Error configuring notifications:', error);
    return false;
  }
}

// Schedule task notification
export async function scheduleTaskNotification(
  task: Task,
  cycle: TaskCycle
): Promise<string | null> {
  try {
    // Check permission first
    const permissionResult = await checkNotificationPermission();
    if (permissionResult.status !== 'granted') {
      console.log('没有通知权限，无法安排提醒');
      return null;
    }
    
    // Calculate notification time based on cycle start date and reminder offset
    const startDate = new Date(cycle.startDate);
    const notificationDate = new Date(startDate);
    
    // Apply reminder offset based on unit
    switch (task.reminderUnit) {
      case 'minutes':
        notificationDate.setMinutes(notificationDate.getMinutes() - task.reminderOffset);
        break;
      case 'hours':
        notificationDate.setHours(notificationDate.getHours() - task.reminderOffset);
        break;
      case 'days':
        notificationDate.setDate(notificationDate.getDate() - task.reminderOffset);
        break;
    }
    
    // Don't schedule if the notification time is in the past
    if (notificationDate <= new Date()) {
      console.log(`Notification time for task "${task.title}" is in the past, skipping`);
      return null;
    }
    
    // 准备通知内容
    const notificationContent: Notifications.NotificationContentInput = {
      title: `⚠️ 提醒: ${task.title}`,
      body: task.description || '您的任务即将到期！',
      data: { taskId: task.id, cycleId: cycle.id },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      color: '#FF0000',
      badge: 1,
    };
    
    // Android特定设置
    if (Platform.OS === 'android') {
      notificationContent.channelId = 'reminders';
      notificationContent.vibrate = [0, 500, 200, 500, 200, 500];
    }
    
    // 计算触发时间
    const triggerDate = notificationDate;
    
    // 使用日期触发器
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        date: triggerDate,
      },
    });
    
    console.log(`已为任务 "${task.title}" 安排通知，ID: ${notificationId}, 时间: ${notificationDate.toLocaleString()}`);
    return notificationId;
  } catch (error) {
    console.error('安排任务通知时出错:', error);
    return null;
  }
}

/**
 * Get all scheduled notifications
 * @returns Array of scheduled notifications
 */
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications canceled');
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

// Cancel notification by identifier
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`Notification with ID ${identifier} canceled`);
  } catch (error) {
    console.error(`Error canceling notification with ID ${identifier}:`, error);
  }
}

// Add notification listener
export function addNotificationListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

// Add notification response listener
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

// Remove notification listener
export function removeNotificationListener(subscription: Notifications.Subscription): void {
  Notifications.removeNotificationSubscription(subscription);
}

// Clean up notifications
export async function cleanupNotifications(): Promise<void> {
  try {
    const allNotifications = await getAllScheduledNotifications();
    
    // 删除过期的通知
    for (const notification of allNotifications) {
      const trigger = notification.trigger as any;
      if (trigger && trigger.date && new Date(trigger.date) < new Date()) {
        await cancelNotification(notification.identifier);
      }
    }
    
    console.log('Notifications cleaned up');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

const FOREGROUND_NOTIFICATION_ID = 'foreground-notification-id';

/**
 * 创建并启动前台通知服务
 */
export const startForegroundNotificationService = async () => {
  try {
    // 在Expo Go中跳过前台服务通知
    if (!isDevBuild) {
      console.log('在Expo Go中跳过前台服务通知');
      return true;
    }
    
    // 创建通知频道 (仅Android需要)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('foreground-service', {
        name: 'Foreground Service',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#FF231F7C',
      });
    }

    // 准备通知内容
    const notificationContent: Notifications.NotificationContentInput = {
      title: 'NeverMiss 运行中',
      body: '应用正在后台运行以确保不错过任何任务',
      data: {},
    };
    
    // Android特定设置
    if (Platform.OS === 'android') {
      notificationContent.channelId = 'foreground-service';
      notificationContent.autoCancel = false;
    }

    // 使用即时触发器
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });
    
    console.log(`持久通知已启动，ID: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('启动持久通知失败:', error);
    return false;
  }
};

/**
 * 停止前台通知服务
 */
export const stopForegroundNotificationService = async () => {
  try {
    // 取消所有通知
    await Notifications.dismissAllNotificationsAsync();
    console.log('持久通知已停止');
    return true;
  } catch (error) {
    console.error('停止持久通知失败:', error);
    return false;
  }
}; 