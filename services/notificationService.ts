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

// Configure notifications
export async function configureNotifications(): Promise<boolean> {
  try {
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
    
    // Register background tasks
    await registerBackgroundTask();
    
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
      case 'months':
        notificationDate.setMonth(notificationDate.getMonth() - task.reminderOffset);
        break;
    }
    
    // Don't schedule if the notification time is in the past
    if (notificationDate <= new Date()) {
      console.log(`Notification time for task "${task.title}" is in the past, skipping`);
      return null;
    }
    
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ 提醒: ${task.title}`,
        body: task.description || '您的任务即将到期！',
        data: { taskId: task.id, cycleId: cycle.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#FF0000',
        badge: 1,
        ...(Platform.OS === 'android' && { 
          channelId: 'reminders',
          vibrate: [0, 500, 200, 500, 200, 500],
          lights: true,
          lightColor: '#FF0000',
        }),
      },
      trigger: notificationDate,
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
    // Cancel all notifications
    await cancelAllNotifications();
    
    // Unregister background tasks
    await unregisterBackgroundTask();
    
    console.log('Notifications cleaned up');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

export interface TestNotificationInput {
  id: number;
  title: string;
  body: string;
  date: Date;
}

// Schedule a test notification
export async function scheduleTestNotification(
  input: TestNotificationInput
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `测试通知 #${input.id}: ${input.title}`,
        body: input.body,
        data: { testId: input.id },
      },
      trigger: input.date,
    });
    
    console.log(`已安排测试通知，ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('安排测试通知时出错:', error);
    return null;
  }
} 