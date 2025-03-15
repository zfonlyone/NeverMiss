import { v4 as uuidv4 } from 'uuid';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type RecurrenceUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type ReminderUnit = 'minutes' | 'hours' | 'days' | 'months';
export type TaskStatus = 'active' | 'inactive';
export type CycleStatus = 'pending' | 'completed' | 'failed';

export interface TaskCycle {
  id: number;
  taskId: number;
  startDate: string;
  dueDate: string;
  isCompleted: boolean;
  isOverdue: boolean;
  completedDate?: string;
  createdAt: string;
}

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  isActive: boolean;
  autoRestart: boolean;
  syncToCalendar: boolean;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
  currentCycle?: TaskCycle;
}

export interface TaskWithCycles extends Task {
  cycles: TaskCycle[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  isActive?: boolean;
  autoRestart?: boolean;
  syncToCalendar?: boolean;
  startDate: string;
  dueDate: string;
}

export interface UpdateTaskInput {
  title: string;
  description?: string;
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  isActive?: boolean;
  autoRestart?: boolean;
  syncToCalendar?: boolean;
  startDate?: string;
  dueDate?: string;
}

export function createTask(
  title: string,
  recurrenceType: RecurrenceType,
  recurrenceValue: number,
  reminderOffset: number,
  reminderUnit: ReminderUnit = 'minutes',
  reminderTime: ReminderTime = { hour: 9, minute: 0 },
  autoRestart: boolean = true,
  recurrenceUnit?: RecurrenceUnit
): Omit<Task, 'id'> {
  const now = new Date().toISOString();
  
  return {
    title,
    description: '',
    recurrenceType,
    recurrenceValue,
    recurrenceUnit: recurrenceType === 'custom' ? recurrenceUnit : undefined,
    reminderOffset,
    reminderUnit,
    reminderTime,
    isActive: true,
    autoRestart,
    syncToCalendar: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function validateTask(task: Partial<Task>): string[] {
  const errors: string[] = [];
  
  if (!task.title || task.title.trim() === '') {
    errors.push('任务标题不能为空');
  }
  
  if (task.recurrenceValue === undefined || task.recurrenceValue <= 0) {
    errors.push('重复值必须大于0');
  }
  
  if (task.recurrenceType === 'custom' && !task.recurrenceUnit) {
    errors.push('自定义重复类型必须指定重复单位');
  }
  
  if (task.reminderOffset === undefined || task.reminderOffset < 0) {
    errors.push('提醒时间必须大于等于0');
  }
  
  return errors;
} 