import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// Define the background task name
export const BACKGROUND_TASK_NAME = 'CHECK_OVERDUE_TASKS';

// 定义一个将由外部设置的全局回调函数
let checkOverdueTasksCallback: (() => Promise<{
  checkedCount: number;
  overdueCount: number;
}>) | null = null;

// 设置回调函数的方法
export const setCheckOverdueTasksCallback = (
  callback: () => Promise<{
    checkedCount: number;
    overdueCount: number;
  }>
) => {
  checkOverdueTasksCallback = callback;
};

// Register the task handler
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('[BackgroundTask] Running background task to check overdue tasks');
    
    // 检查回调函数是否已设置
    if (!checkOverdueTasksCallback) {
      console.log('[BackgroundTask] No callback function set, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // 通过回调函数调用任务检查功能
    const result = await checkOverdueTasksCallback();
    
    console.log(`[BackgroundTask] Checked ${result.checkedCount} tasks, found ${result.overdueCount} overdue`);
    
    // Return success to indicate the task completed successfully
    return result.checkedCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundTask] Error in background task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Check if background fetch is available on the device
 * @returns Promise<boolean> - Whether background fetch is available
 */
export const isBackgroundFetchAvailable = async (): Promise<boolean> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    return status !== BackgroundFetch.BackgroundFetchStatus.Restricted;
  } catch (error) {
    console.error('Error checking background fetch availability:', error);
    return false;
  }
};

/**
 * Get the current status of background fetch
 * @returns Promise<string> - The status as a string
 */
export const getBackgroundFetchStatus = async (): Promise<string> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'Available';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'Denied';
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'Restricted';
      default:
        return 'Unknown';
    }
  } catch (error) {
    console.error('Error getting background fetch status:', error);
    return 'Error';
  }
};

/**
 * Register the background task to check for overdue tasks
 * @returns Promise<boolean> - Whether the task was registered successfully
 */
export const registerBackgroundTask = async (): Promise<boolean> => {
  try {
    if (!(await isBackgroundFetchAvailable())) {
      console.log('Background fetch is not available on this device');
      return false;
    }
    
    // Unregister any existing task first to avoid duplicates
    await unregisterBackgroundTask();
    
    // Register the task with appropriate options
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    console.log('Background task registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering background task:', error);
    return false;
  }
};

/**
 * Unregister the background task
 * @returns Promise<boolean> - Whether the task was unregistered successfully
 */
export const unregisterBackgroundTask = async (): Promise<boolean> => {
  try {
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log('Background task unregistered successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unregistering background task:', error);
    return false;
  }
};

/**
 * Check the registration status of the background task
 * @returns Promise<boolean> - Whether the task is registered
 */
export const isBackgroundTaskRegistered = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  } catch (error) {
    console.error('Error checking background task registration:', error);
    return false;
  }
};

// Schedule a one-time check for overdue tasks
export const scheduleOneTimeCheck = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // On iOS, we need to use a different approach since scheduleTaskAsync is not available
      // We can manually trigger the task after a delay
      console.log('Scheduling one-time check for iOS');
      
      // Use setTimeout to trigger the task after 60 seconds
      setTimeout(async () => {
        console.log('Executing one-time check for overdue tasks');
        if (checkOverdueTasksCallback) {
          await checkOverdueTasksCallback();
        } else {
          console.log('No callback function set, skipping overdue task check');
        }
      }, 60 * 1000);
      
      return true;
    } else if (Platform.OS === 'android') {
      // On Android, we can use the WorkManager API through Expo
      console.log('Scheduling one-time check for Android');
      
      // Make sure the task is registered
      if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME))) {
        await registerBackgroundTask();
      }
      
      // Manually trigger the task after a delay
      setTimeout(async () => {
        console.log('Executing one-time check for overdue tasks');
        if (checkOverdueTasksCallback) {
          await checkOverdueTasksCallback();
        } else {
          console.log('No callback function set, skipping overdue task check');
        }
      }, 60 * 1000);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error scheduling one-time check:', error);
    return false;
  }
};

// 默认导出对象，包含所有导出的函数
export default {
  BACKGROUND_TASK_NAME,
  setCheckOverdueTasksCallback,
  isBackgroundFetchAvailable,
  getBackgroundFetchStatus,
  registerBackgroundTask,
  unregisterBackgroundTask,
  isBackgroundTaskRegistered,
  scheduleOneTimeCheck
}; 