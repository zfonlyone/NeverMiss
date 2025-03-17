/**
 * Permission Service for NeverMiss
 * @author zfonlyone
 * 
 * This service handles permission checks for various app features
 */

import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Permission types
export type PermissionType = 'notification' | 'calendar' | 'storage' | 'sharing';

// Permission status
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// Permission result
export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

/**
 * Check notification permissions
 */
export const checkNotificationPermission = async (): Promise<PermissionResult> => {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    return {
      status: status as PermissionStatus,
      canAskAgain
    };
  } catch (error) {
    console.error('检查通知权限时出错:', error);
    return { status: 'denied', canAskAgain: false };
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<PermissionResult> => {
  try {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
    return {
      status: status as PermissionStatus,
      canAskAgain
    };
  } catch (error) {
    console.error('请求通知权限时出错:', error);
    return { status: 'denied', canAskAgain: false };
  }
};

/**
 * Check calendar permissions
 */
export const checkCalendarPermission = async (): Promise<PermissionResult> => {
  try {
    const { status, canAskAgain } = await Calendar.getCalendarPermissionsAsync();
    return {
      status: status as PermissionStatus,
      canAskAgain
    };
  } catch (error) {
    console.error('检查日历权限时出错:', error);
    return { status: 'denied', canAskAgain: false };
  }
};

/**
 * Request calendar permissions
 */
export const requestCalendarPermission = async (): Promise<PermissionResult> => {
  try {
    const { status, canAskAgain } = await Calendar.requestCalendarPermissionsAsync();
    return {
      status: status as PermissionStatus,
      canAskAgain
    };
  } catch (error) {
    console.error('请求日历权限时出错:', error);
    return { status: 'denied', canAskAgain: false };
  }
};

/**
 * Check if sharing is available
 */
export const checkSharingAvailability = async (): Promise<boolean> => {
  try {
    return await Sharing.isAvailableAsync();
  } catch (error) {
    console.error('检查分享功能时出错:', error);
    return false;
  }
};

/**
 * Check all required permissions for a feature
 */
export const checkPermissionsForFeature = async (
  feature: 'notification' | 'calendar' | 'export' | 'import'
): Promise<{
  granted: boolean;
  missingPermissions: PermissionType[];
}> => {
  const result = {
    granted: true,
    missingPermissions: [] as PermissionType[]
  };

  switch (feature) {
    case 'notification':
      const notificationPermission = await checkNotificationPermission();
      if (notificationPermission.status !== 'granted') {
        result.granted = false;
        result.missingPermissions.push('notification');
      }
      break;
    
    case 'calendar':
      const calendarPermission = await checkCalendarPermission();
      if (calendarPermission.status !== 'granted') {
        result.granted = false;
        result.missingPermissions.push('calendar');
      }
      break;
    
    case 'export':
      const sharingAvailable = await checkSharingAvailability();
      if (!sharingAvailable) {
        result.granted = false;
        result.missingPermissions.push('sharing');
      }
      break;
    
    case 'import':
      // Document picker doesn't require explicit permissions
      break;
  }

  return result;
};

/**
 * Request all required permissions for a feature
 */
export const requestPermissionsForFeature = async (
  feature: 'notification' | 'calendar' | 'export' | 'import'
): Promise<boolean> => {
  switch (feature) {
    case 'notification':
      const notificationPermission = await requestNotificationPermission();
      return notificationPermission.status === 'granted';
    
    case 'calendar':
      const calendarPermission = await requestCalendarPermission();
      return calendarPermission.status === 'granted';
    
    case 'export':
    case 'import':
      // These features don't require explicit permission requests
      return true;
  }
}; 