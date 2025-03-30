export interface TaskHistory {
  id?: number;
  taskId: number;
  cycleId: number;
  action: string; // 'created', 'completed', 'overdue', 'restarted', etc.
  timestamp: string;
}

/**
 * TaskHistory类，用于处理任务历史记录
 * 注意：这是为了满足Expo路由系统的默认导出要求
 */
class TaskHistoryClass {
  /**
   * 创建新的任务历史记录对象
   */
  static create(taskId: number, cycleId: number, action: string): TaskHistory {
    return {
      taskId,
      cycleId,
      action,
      timestamp: new Date().toISOString()
    };
  }
}

// 默认导出类而不是接口，以满足Expo路由系统要求
export default TaskHistoryClass; 