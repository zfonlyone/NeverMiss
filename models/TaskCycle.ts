import { RecurrenceType, RecurrenceUnit } from './Task';

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

export interface TaskCycleWithTask extends TaskCycle {
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  autoRestart: boolean;
}

export function createTaskCycle(
  taskId: number,
  startDate: string,
  dueDate: string
): TaskCycle {
  return {
    id: 0, // 数据库会自动生成
    taskId,
    startDate,
    dueDate,
    isCompleted: false,
    isOverdue: false,
    createdAt: new Date().toISOString(),
  };
}

export function completeTaskCycle(cycle: TaskCycle): TaskCycle {
  return {
    ...cycle,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
}

export function failTaskCycle(cycle: TaskCycle): TaskCycle {
  return {
    ...cycle,
    status: 'failed',
    failedAt: new Date().toISOString(),
  };
} 