import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { registerBackgroundTasks, unregisterBackgroundTasks } from './backgroundTaskService';

// Configure notifications
export async function configureNotifications(): Promise<boolean> {
  try {
    // Set notification handler
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
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task Reminders',
        description: 'Notifications for task reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
        sound: true,
      });
    }
    
    // Request permissions
    const permissionResult = await requestNotificationPermissions();
    
    // Register background tasks
    await registerBackgroundTasks();
    
    return permissionResult;
  } catch (error) {
    console.error('Error configuring notifications:', error);
    return false;
  }
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Check if physical device
    if (!Device.isDevice) {
      console.warn('Notifications not available on simulator/emulator');
      return false;
    }
    
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Check if granted
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Schedule task notification
export async function scheduleTaskNotification(
  task: Task,
  cycle: TaskCycle
): Promise<string | null> {
  try {
    // Calculate notification time
    const notificationDate = new Date(cycle.cycleStartDateTime);
    notificationDate.setMinutes(notificationDate.getMinutes() - task.reminderOffset);
    
    // Don't schedule if the notification time is in the past
    if (notificationDate <= new Date()) {
      console.log(`Notification time for task "${task.name}" is in the past, skipping`);
      return null;
    }
    
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${task.name}`,
        body: `Your task is due soon!`,
        data: { taskId: task.id, cycleId: cycle.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#2196F3',
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: notificationDate,
    });
    
    console.log(`Scheduled notification for task "${task.name}" with ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling task notification:', error);
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
    await unregisterBackgroundTasks();
    
    console.log('Notifications cleaned up');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
} 