import { v4 as uuidv4 } from 'uuid';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type RecurrenceUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type ReminderUnit = 'minutes' | 'hours' | 'days';
export type TaskStatus = 'active' | 'inactive';
export type CycleStatus = 'pending' | 'completed' | 'failed';
export type DateType = 'solar' | 'lunar';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
export type WeekType = 'big' | 'small'; // 大周/小周

export interface RecurrencePattern {
  type: RecurrenceType;
  value: number;
  unit?: RecurrenceUnit;
  weekDay?: WeekDay;
  weekType?: WeekType;
  monthDay?: number; // 每月第几天
  yearDay?: number; // 每年第几天
}

export interface TaskCycle {
  id: number;
  taskId: number;
  startDate: string;
  dueDate: string;
  dateType: DateType;
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
  recurrencePattern: RecurrencePattern;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  dateType: DateType;
  isActive: boolean;
  autoRestart: boolean;
  syncToCalendar: boolean;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
  currentCycle?: TaskCycle;
  lastCompletedDate?: string;
}

export interface TaskWithCycles extends Task {
  cycles: TaskCycle[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  recurrencePattern: RecurrencePattern;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  dateType: DateType;
  isActive?: boolean;
  autoRestart?: boolean;
  syncToCalendar?: boolean;
  startDate: string;
  dueDate: string;
}

export interface UpdateTaskInput {
  title: string;
  description?: string;
  recurrencePattern: RecurrencePattern;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  dateType: DateType;
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
  dateType: DateType = 'solar',
  recurrenceUnit?: RecurrenceUnit
): Omit<Task, 'id'> {
  const now = new Date().toISOString();
  
  return {
    title,
    description: '',
    recurrencePattern: {
      type: recurrenceType,
      value: recurrenceValue,
      unit: recurrenceType === 'custom' ? recurrenceUnit : undefined,
    },
    reminderOffset,
    reminderUnit,
    reminderTime,
    dateType,
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
  
  if (task.recurrencePattern.value === undefined || task.recurrencePattern.value <= 0) {
    errors.push('重复值必须大于0');
  }
  
  if (task.recurrencePattern.type === 'custom' && !task.recurrencePattern.unit) {
    errors.push('自定义重复类型必须指定重复单位');
  }
  
  if (task.reminderOffset === undefined || task.reminderOffset < 0) {
    errors.push('提醒时间必须大于等于0');
  }
  
  return errors;
} 