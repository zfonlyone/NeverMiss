import { v4 as uuidv4 } from 'uuid';

export type CycleStatus = 'pending' | 'completed' | 'failed';

export interface TaskCycle {
  id: string;
  taskId: string;
  cycleStartDateTime: string; // ISO 8601 format
  cycleEndDateTime: string; // ISO 8601 format
  status: CycleStatus;
  completedAt?: string; // ISO 8601 format, nullable
  failedAt?: string; // ISO 8601 format, nullable
}

export function createTaskCycle(
  taskId: string,
  cycleStartDateTime: string,
  cycleEndDateTime: string
): TaskCycle {
  return {
    id: uuidv4(),
    taskId,
    cycleStartDateTime,
    cycleEndDateTime,
    status: 'pending',
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