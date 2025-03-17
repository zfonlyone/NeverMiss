/**
 * Calendar Service for NeverMiss
 * @author zfonlyone
 * 
 * This service handles calendar integration
 */

import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { checkCalendarPermission, requestCalendarPermission } from './permissionService';

// 获取或创建应用专属的日历
async function getOrCreateCalendar() {
  try {
    // 检查日历权限
    const permissionResult = await requestCalendarPermission();
    if (permissionResult.status !== 'granted') {
      throw new Error('需要日历权限来同步任务');
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const neverMissCalendar = calendars.find(
      (cal) => cal.title === 'NeverMiss 任务'
    );

    if (neverMissCalendar) {
      return neverMissCalendar;
    }

    // 创建新的日历
    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'NeverMiss 任务',
      color: '#2196F3',
      entityType: Calendar.EntityTypes.EVENT,
      name: 'nevermiss_tasks',
      ownerAccount: 'default',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
      source: {
        name: Platform.OS === 'ios' ? 'NeverMiss' : 'com.nevermiss',
        type: Platform.OS === 'ios' ? 'local' : 'com.nevermiss',
      },
    });

    return { id: newCalendarId, title: 'NeverMiss 任务' };
  } catch (error) {
    console.error('获取或创建日历时出错:', error);
    throw error;
  }
}

// 添加任务到系统日历
export async function addTaskToCalendar(
  task: Task,
  cycle: TaskCycle
): Promise<string> {
  try {
    // 检查日历权限
    const permissionResult = await checkCalendarPermission();
    if (permissionResult.status !== 'granted') {
      throw new Error('没有日历权限，无法添加任务到日历');
    }
    
    const calendar = await getOrCreateCalendar();
    
    // 计算提醒时间
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.dueDate);
    const reminderDate = new Date(startDate);
    reminderDate.setMinutes(reminderDate.getMinutes() - task.reminderOffset);

    // 创建日历事件
    const eventId = await Calendar.createEventAsync(calendar.id, {
      title: `[NeverMiss] ${task.title}`,
      notes: task.description,
      startDate,
      endDate,
      alarms: [
        {
          relativeOffset: -task.reminderOffset, // 提前多少分钟提醒
          method: Calendar.AlarmMethod.ALERT,
        },
      ],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      availability: Calendar.Availability.BUSY,
    });

    return eventId;
  } catch (error) {
    console.error('添加任务到日历时出错:', error);
    throw error;
  }
}

// 从系统日历中删除任务
export async function removeTaskFromCalendar(eventId: string): Promise<void> {
  try {
    // 检查日历权限
    const permissionResult = await checkCalendarPermission();
    if (permissionResult.status !== 'granted') {
      throw new Error('没有日历权限，无法从日历中删除任务');
    }
    
    await Calendar.deleteEventAsync(eventId);
  } catch (error) {
    console.error('从日历中删除任务时出错:', error);
    throw error;
  }
}

// 更新系统日历中的任务
export async function updateTaskInCalendar(
  eventId: string,
  task: Task,
  cycle: TaskCycle
): Promise<void> {
  try {
    // 检查日历权限
    const permissionResult = await checkCalendarPermission();
    if (permissionResult.status !== 'granted') {
      throw new Error('没有日历权限，无法更新日历中的任务');
    }
    
    const calendar = await getOrCreateCalendar();
    
    // 计算提醒时间
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.dueDate);
    
    // 更新日历事件
    await Calendar.updateEventAsync(eventId, {
      title: `[NeverMiss] ${task.title}`,
      notes: task.description,
      startDate,
      endDate,
      alarms: [
        {
          relativeOffset: -task.reminderOffset,
          method: Calendar.AlarmMethod.ALERT,
        },
      ],
    });
  } catch (error) {
    console.error('更新日历中的任务时出错:', error);
    throw error;
  }
} 