import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceValue: number;
  recurrenceUnit?: 'days' | 'weeks' | 'months';
  reminderOffset: number;
  isActive: boolean;
  autoRestart: boolean;
  createdAt: string;
  updatedAt: string;
  currentCycle?: TaskCycle;
}

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

export interface TaskWithCycles extends Task {
  cycles: TaskCycle[];
}

export function createTask(
  name: string,
  startDateTime: string,
  recurrenceType: RecurrenceType,
  recurrenceValue: number,
  reminderOffset: number,
  autoRestart: boolean = true,
  recurrenceUnit?: RecurrenceUnit
): Task {
  const now = new Date().toISOString();
  
  return {
    id: uuidv4(),
    name,
    startDateTime,
    recurrenceType,
    recurrenceValue,
    recurrenceUnit: recurrenceType === 'custom' ? recurrenceUnit : undefined,
    reminderOffset,
    autoRestart,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function validateTask(task: Partial<Task>): string[] {
  const errors: string[] = [];
  
  if (!task.name || task.name.trim() === '') {
    errors.push('Task name is required');
  }
  
  if (!task.startDateTime) {
    errors.push('Start date and time is required');
  }
  
  if (!task.recurrenceType) {
    errors.push('Recurrence type is required');
  }
  
  if (task.recurrenceValue === undefined || task.recurrenceValue <= 0) {
    errors.push('Recurrence value must be greater than 0');
  }
  
  if (task.recurrenceType === 'custom' && !task.recurrenceUnit) {
    errors.push('Recurrence unit is required for custom recurrence type');
  }
  
  if (task.reminderOffset === undefined || task.reminderOffset < 0) {
    errors.push('Reminder offset must be 0 or greater');
  }
  
  return errors;
} 