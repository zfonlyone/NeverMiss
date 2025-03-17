export interface TaskHistory {
  id?: number;
  taskId: number;
  cycleId: number;
  action: string; // 'created', 'completed', 'overdue', 'restarted', etc.
  timestamp: string;
} 