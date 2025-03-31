import { v4 as uuidv4 } from 'uuid';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'composite' | 'custom' | 'weekOfMonth';
export type RecurrenceUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type ReminderUnit = 'minutes' | 'hours' | 'days';
export type TaskStatus = 'active' | 'inactive';
export type CycleStatus = 'pending' | 'completed' | 'failed';
export type DateType = 'solar' | 'lunar';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
export type WeekType = 'big' | 'small'; // 大周/小周
export type WeekOfMonth = 1 | 2 | 3 | 4 | 5; // 1 = first week, 5 = last week

export interface SpecialDate {
  type: string;
  name: string;
  date?: string;
}

export type AdvancedRecurrencePattern = {
  // 年
  yearValue: number;
  // 月
  monthValue: number;
  // 周
  weekValue: number;
  // 天
  dayValue: number;
  // 选择的日期类型: day(天), week(周), month(月), year(年)
  selectedDateType: 'day' | 'week' | 'month' | 'year';
  // 选择的计算方向: forward(正数), backward(倒数)
  countDirection: 'forward' | 'backward';
  // 周几 0-6 表示周日到周六
  weekDay: number;
  // 是否选择特殊日期
  useSpecialDate: boolean;
  // 特殊日期类型: weekend(周末), workday(工作日), holiday(节假日), solarTerm(节气日)
  specialDateType: 'weekend' | 'workday' | 'holiday' | 'solarTerm';
};

export interface RecurrencePattern {
  type: RecurrenceType;
  value?: number;
  unit?: RecurrenceUnit;
  weekDay?: WeekDay;
  weekDays?: WeekDay[]; // 支持多选周几
  weekType?: WeekType;
  monthDay?: number; // 每月第几天
  yearDay?: number; // 每年第几天
  month?: number; // 指定月份 (1-12)
  weekOfMonth?: WeekOfMonth; // 第几周
  isLeapMonth?: boolean; // 农历闰月
  isReverse?: boolean; // 是否倒数计算
  isLunar?: boolean; // 是否使用农历
  specialDate?: SpecialDate; // 特殊日期
  // 高级循环设置
  advancedPattern?: AdvancedRecurrencePattern;
}

// 复合循环模式
export interface CompositeRecurrencePattern extends RecurrencePattern {
  type: 'composite';
  // 年相关设置
  yearEnabled?: boolean;
  year?: number;
  
  // 月相关设置
  monthEnabled?: boolean;
  month?: number;
  
  // 月中第几天设置
  monthDayEnabled?: boolean;
  monthDay?: number;
  
  // 星期几设置
  weekDayEnabled?: boolean;
  weekDay?: WeekDay;
  
  // 月中第几周设置
  weekOfMonthEnabled?: boolean;
  weekOfMonth?: WeekOfMonth;
  
  // 年中第几天设置
  yearDayEnabled?: boolean;
  yearDay?: number;
  
  // 倒数设置
  isReverse?: boolean;
}

export interface TaskCycle {
  id?: number;
  taskId: number;
  startDate: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  isActive: boolean;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  useDueDateToCalculate?: boolean;
  dateType: DateType;
  isLunar: boolean;
  currentCycle?: TaskCycle;
  status?: 'pending' | 'active' | 'overdue' | 'completed';
  // 提醒设置
  reminderOffset?: number;
  reminderUnit?: 'minutes' | 'hours' | 'days';
  autoRestart: boolean;
  syncToCalendar: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  startDate: string;
  dueDate: string;
  isActive: boolean;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  useDueDateToCalculate?: boolean;
  dateType: DateType;
  isLunar: boolean;
  status?: 'pending' | 'active' | 'overdue' | 'completed';
  autoRestart: boolean;
  syncToCalendar: boolean;
  // 提醒设置
  reminderOffset?: number;
  reminderUnit?: 'minutes' | 'hours' | 'days';
  reminderTime: { hour: number, minute: number };
  reminderDays: number;
  reminderHours: number;
  reminderMinutes: number;
  tags?: string[];
  backgroundColor?: string;
  specialDate?: SpecialDate; // 特殊日期
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
  useDueDateToCalculate?: boolean; // 是否使用截止日期来计算开始日期
  tags?: string[];
  backgroundColor?: string;
  specialDate?: SpecialDate; // 特殊日期
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
      unit: recurrenceUnit,
    },
    reminderOffset,
    reminderUnit,
    reminderTime,
    dateType,
    isLunar: dateType === 'lunar',
    isRecurring: recurrenceValue > 0,
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
  
  if (!task.recurrencePattern.type) {
    errors.push('必须指定重复类型');
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

// 默认导出对象，包含所有导出的类型和函数
export default {
  createTask,
  validateTask
}; 