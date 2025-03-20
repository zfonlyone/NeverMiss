import { v4 as uuidv4 } from 'uuid';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekOfMonth' | 'custom';
export type RecurrenceUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type ReminderUnit = 'minutes' | 'hours' | 'days';
export type TaskStatus = 'active' | 'inactive';
export type CycleStatus = 'pending' | 'completed' | 'failed';
export type DateType = 'solar' | 'lunar';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
export type WeekType = 'big' | 'small'; // 大周/小周
export type WeekOfMonth = 1 | 2 | 3 | 4 | 5; // 1 = first week, 5 = last week
export type SpecialDateType = 'holiday' | 'solarTerm' | 'custom';

export interface SpecialDate {
  id: string;
  name: string;
  type: SpecialDateType;
  month: number;
  day: number;
  isLunar?: boolean;
}

export interface RecurrencePattern {
  type: RecurrenceType;
  value: number;
  unit?: RecurrenceUnit;
  weekDay?: WeekDay;
  weekDays?: WeekDay[]; // 支持多选周几
  weekType?: WeekType;
  monthDay?: number; // 每月第几天
  yearDay?: number; // 每年第几天
  month?: number; // 指定月份 (1-12)
  weekOfMonth?: WeekOfMonth; // 第几周
  isLeapMonth?: boolean; // 农历闰月
  specialDate?: SpecialDate; // 特殊日期如节假日、节气
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
  isLunar: boolean; // 是否使用农历
  isRecurring: boolean; // 是否是循环任务
  reminderDays: number; // 提前提醒天数
  reminderHours: number; // 提前提醒小时
  reminderMinutes: number; // 提前提醒分钟
  isActive: boolean;
  autoRestart: boolean;
  syncToCalendar: boolean;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
  currentCycle?: TaskCycle;
  lastCompletedDate?: string;
  tags?: string[];
  backgroundColor?: string;
  specialDate?: SpecialDate; // 特殊日期
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
  isLunar: boolean;
  isRecurring: boolean;
  reminderDays: number;
  reminderHours: number;
  reminderMinutes: number;
  isActive?: boolean;
  autoRestart?: boolean;
  syncToCalendar?: boolean;
  startDate: string;
  dueDate: string;
  tags?: string[];
  backgroundColor?: string;
  specialDate?: SpecialDate;
}

export interface UpdateTaskInput {
  title: string;
  description?: string;
  recurrencePattern: RecurrencePattern;
  reminderOffset: number;
  reminderUnit: ReminderUnit;
  reminderTime: ReminderTime;
  dateType: DateType;
  isLunar: boolean;
  isRecurring: boolean;
  reminderDays: number;
  reminderHours: number;
  reminderMinutes: number;
  isActive?: boolean;
  autoRestart?: boolean;
  syncToCalendar?: boolean;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  backgroundColor?: string;
  specialDate?: SpecialDate;
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
  recurrenceUnit?: RecurrenceUnit,
  tags: string[] = [],
  backgroundColor?: string
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
    isLunar: dateType === 'lunar',
    isRecurring: recurrenceType !== 'custom' || (recurrenceType === 'custom' && recurrenceValue > 0),
    reminderDays: reminderUnit === 'days' ? reminderOffset : 0,
    reminderHours: reminderUnit === 'hours' ? reminderOffset : 0,
    reminderMinutes: reminderUnit === 'minutes' ? reminderOffset : 0,
    isActive: true,
    autoRestart,
    syncToCalendar: false,
    createdAt: now,
    updatedAt: now,
    tags,
    backgroundColor,
  };
}

export function validateTask(task: Partial<Task>): string[] {
  const errors: string[] = [];
  
  if (!task.title || task.title.trim() === '') {
    errors.push('任务标题不能为空');
  }
  
  if (!task.recurrencePattern) {
    errors.push('重复模式不能为空');
    return errors;
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
  
  if (task.isRecurring && !task.recurrencePattern.type) {
    errors.push('循环任务必须指定重复类型');
  }
  
  // 验证提醒天数、小时、分钟
  if (
    (task.reminderDays !== undefined && task.reminderDays < 0) ||
    (task.reminderHours !== undefined && task.reminderHours < 0) ||
    (task.reminderMinutes !== undefined && task.reminderMinutes < 0)
  ) {
    errors.push('提醒时间设置必须大于等于0');
  }
  
  return errors;
} 