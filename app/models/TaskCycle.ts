import { RecurrenceType, RecurrenceUnit, DateType } from './Task';

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

export interface TaskCycleWithTask extends TaskCycle {
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  autoRestart: boolean;
}

export function createTaskCycle(
  taskId: number,
  startDate: string,
  dueDate: string,
  dateType: DateType = 'solar'
): TaskCycle {
  return {
    id: 0, // 数据库会自动生成
    taskId,
    startDate,
    dueDate,
    dateType,
    isCompleted: false,
    isOverdue: false,
    createdAt: new Date().toISOString(),
  };
}

export function completeTaskCycle(cycle: TaskCycle): TaskCycle {
  return {
    ...cycle,
    isCompleted: true,
    completedDate: new Date().toISOString(),
  };
}

export function failTaskCycle(cycle: TaskCycle): TaskCycle {
  return {
    ...cycle,
    isOverdue: true,
  };
}

export function getTaskCycleStatus(cycle: TaskCycle): 'completed' | 'overdue' | 'in_progress' {
  if (cycle.isCompleted) return 'completed';
  if (cycle.isOverdue) return 'overdue';
  return 'in_progress';
}

// 默认导出对象，包含所有导出的函数
export default {
  createTaskCycle,
  completeTaskCycle,
  failTaskCycle,
  getTaskCycleStatus
}; 