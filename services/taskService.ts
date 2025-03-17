import {
  Task,
  TaskCycle,
  CreateTaskInput,
  UpdateTaskInput,
  RecurrenceType,
  RecurrenceUnit,
  CycleStatus
} from '../models/Task';
import { scheduleTaskNotification } from './notificationService';
import { addTaskToCalendar, removeTaskFromCalendar, updateTaskInCalendar } from './calendarService';
import { 
  saveTask, 
  getTasks, 
  getTaskById, 
  deleteTask as deleteTaskFromStorage,
  saveTaskCycle,
  getTaskCyclesByTaskId,
  getTaskCycles,
  saveTaskHistory
} from './storageService';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface TaskCycleWithTask extends TaskCycle {
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  autoRestart: boolean;
}

/**
 * Create a new task
 * @param taskInput The task data to create
 * @returns The created task with ID
 */
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // 创建任务
    const now = new Date().toISOString();
    const newTask: Task = {
      id: 0, // 将由 saveTask 分配
      title: input.title,
      description: input.description || '',
      recurrenceType: input.recurrenceType,
      recurrenceValue: input.recurrenceValue,
      recurrenceUnit: input.recurrenceUnit,
      reminderOffset: input.reminderOffset,
      reminderUnit: input.reminderUnit,
      reminderTime: input.reminderTime,
      isActive: input.isActive !== undefined ? input.isActive : true,
      autoRestart: input.autoRestart !== undefined ? input.autoRestart : true,
      syncToCalendar: input.syncToCalendar !== undefined ? input.syncToCalendar : false,
      createdAt: now,
      updatedAt: now,
    };
    
    // 保存任务
    const savedTask = await saveTask(newTask);
    
    // 创建第一个任务周期
    const cycle: TaskCycle = {
      id: 0, // 将由 saveTaskCycle 分配
      taskId: savedTask.id,
      startDate: input.startDate,
      dueDate: input.dueDate,
      isCompleted: false,
      isOverdue: false,
      createdAt: now,
    };
    
    const savedCycle = await saveTaskCycle(cycle);
    savedTask.currentCycle = savedCycle;
    
    // 如果需要同步到日历，创建日历事件
    if (savedTask.syncToCalendar && savedCycle) {
      try {
        const eventId = await addTaskToCalendar(savedTask, savedCycle);
        // 更新任务的日历事件ID
        savedTask.calendarEventId = eventId;
        await saveTask(savedTask);
      } catch (error) {
        console.error('同步任务到日历时出错:', error);
        // 继续执行，不中断任务创建流程
      }
    }
    
    return savedTask;
  } catch (error) {
    console.error('创建任务时出错:', error);
    throw error;
  }
};

/**
 * Create a task cycle
 */
export const createTaskCycle = async (
  taskId: number,
  startDate: string,
  recurrenceType: RecurrenceType,
  recurrenceValue: number,
  recurrenceUnit?: RecurrenceUnit
): Promise<TaskCycle> => {
  if (!taskId) {
    throw new Error('Task ID is required');
  }
  
  try {
    const now = new Date().toISOString();
    const startDateTime = new Date(startDate);
    const dueDate = calculateDueDate(startDateTime, recurrenceType, recurrenceValue, recurrenceUnit);
    
    // 创建新的周期
    const cycle: TaskCycle = {
      id: 0, // 将由 saveTaskCycle 分配
      taskId: taskId,
      startDate: startDateTime.toISOString(),
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      isOverdue: false,
      createdAt: now,
    };
    
    // 保存周期
    const savedCycle = await saveTaskCycle(cycle);
    return savedCycle;
  } catch (error) {
    console.error('Error creating task cycle:', error);
    throw error;
  }
};

/**
 * Calculate the due date based on recurrence settings
 */
const calculateDueDate = (
  startDate: Date,
  recurrenceType: RecurrenceType,
  recurrenceValue: number,
  recurrenceUnit?: RecurrenceUnit
): Date => {
  const dueDate = new Date(startDate);
  
  switch (recurrenceType) {
    case 'daily':
      dueDate.setDate(dueDate.getDate() + recurrenceValue);
      break;
    case 'weekly':
      dueDate.setDate(dueDate.getDate() + (recurrenceValue * 7));
      break;
    case 'monthly':
      dueDate.setMonth(dueDate.getMonth() + recurrenceValue);
      break;
    case 'custom':
      if (recurrenceUnit === 'days') {
        dueDate.setDate(dueDate.getDate() + recurrenceValue);
      } else if (recurrenceUnit === 'weeks') {
        dueDate.setDate(dueDate.getDate() + (recurrenceValue * 7));
      } else if (recurrenceUnit === 'months') {
        dueDate.setMonth(dueDate.getMonth() + recurrenceValue);
      }
      break;
  }
  
  return dueDate;
};

/**
 * Update an existing task
 * @param taskInput The task data to update
 * @returns The updated task
 */
export const updateTask = async (id: number, input: UpdateTaskInput): Promise<Task> => {
  try {
    // 获取现有任务
    const existingTask = await getTaskById(id);
    
    if (!existingTask) {
      throw new Error(`任务 ID ${id} 不存在`);
    }
    
    // 检查日历同步状态变化
    const calendarSyncChanged = input.syncToCalendar !== undefined && 
                               input.syncToCalendar !== existingTask.syncToCalendar;
    
    // 更新任务
    const updatedTask: Task = {
      ...existingTask,
      title: input.title,
      description: input.description || existingTask.description,
      recurrenceType: input.recurrenceType,
      recurrenceValue: input.recurrenceValue,
      recurrenceUnit: input.recurrenceUnit,
      reminderOffset: input.reminderOffset,
      reminderUnit: input.reminderUnit,
      reminderTime: input.reminderTime,
      isActive: input.isActive !== undefined ? input.isActive : existingTask.isActive,
      autoRestart: input.autoRestart !== undefined ? input.autoRestart : existingTask.autoRestart,
      syncToCalendar: input.syncToCalendar !== undefined ? input.syncToCalendar : existingTask.syncToCalendar,
      updatedAt: new Date().toISOString(),
    };
    
    // 如果提供了新的开始日期和截止日期，更新当前周期
    let updatedCycle = existingTask.currentCycle;
    if (input.startDate && input.dueDate && existingTask.currentCycle) {
      updatedCycle = {
        ...existingTask.currentCycle,
        startDate: input.startDate,
        dueDate: input.dueDate,
      };
      
      updatedCycle = await saveTaskCycle(updatedCycle);
    }
    
    // 处理日历同步
    if (updatedTask.syncToCalendar) {
      if (updatedCycle) {
        try {
          // 如果已有日历事件ID，更新事件
          if (existingTask.calendarEventId) {
            await updateTaskInCalendar(existingTask.calendarEventId, updatedTask, updatedCycle);
          } 
          // 如果是新启用同步或没有日历事件ID，创建新事件
          else if (calendarSyncChanged || !existingTask.calendarEventId) {
            const eventId = await addTaskToCalendar(updatedTask, updatedCycle);
            updatedTask.calendarEventId = eventId;
          }
        } catch (error) {
          console.error('同步任务到日历时出错:', error);
          // 继续执行，不中断任务更新流程
        }
      }
    } 
    // 如果取消了日历同步，删除日历事件
    else if (calendarSyncChanged && existingTask.calendarEventId) {
      try {
        await removeTaskFromCalendar(existingTask.calendarEventId);
        updatedTask.calendarEventId = undefined;
      } catch (error) {
        console.error('从日历中删除任务时出错:', error);
        // 继续执行，不中断任务更新流程
      }
    }
    
    // 保存更新后的任务
    const savedTask = await saveTask(updatedTask);
    savedTask.currentCycle = updatedCycle;
    
    return savedTask;
  } catch (error) {
    console.error(`更新任务 ${id} 时出错:`, error);
    throw error;
  }
};

/**
 * Delete a task and all its cycles
 * @param taskId The task ID to delete
 */
export const deleteTask = async (id: number): Promise<boolean> => {
  try {
    return await deleteTaskFromStorage(id);
    } catch (error) {
    console.error(`删除任务 ID ${id} 时出错:`, error);
    throw error;
  }
};

/**
 * Get all tasks with their current cycles
 * @param includeCompleted Whether to include completed tasks
 * @param includeOverdue Whether to include overdue tasks
 * @returns Array of tasks with current cycles
 */
export const getAllTasks = async (includeCompleted: boolean = false, includeOverdue: boolean = false): Promise<Task[]> => {
  try {
    const tasks = await getTasks();
    
    // 为每个任务加载当前周期
    for (const task of tasks) {
      const cycles = await getTaskCyclesByTaskId(task.id);
      if (cycles.length > 0) {
        // 找到最新的周期作为当前周期
        const currentCycle = cycles.sort((a, b) => 
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        )[0];
        task.currentCycle = currentCycle;
      }
    }
    
    // 根据参数过滤任务
    return tasks.filter(task => {
      // 如果没有当前周期，保留任务
      if (!task.currentCycle) return true;
      
      // 如果不包含已完成任务且当前任务已完成，则过滤掉
      if (!includeCompleted && task.currentCycle.isCompleted) return false;
      
      // 如果不包含逾期任务且当前任务已逾期且未完成，则过滤掉
      if (!includeOverdue && task.currentCycle.isOverdue && !task.currentCycle.isCompleted) return false;
      
      // 其他情况保留任务
      return true;
    });
  } catch (error) {
    console.error('获取所有任务时出错:', error);
    throw error;
  }
};

/**
 * Get a task by ID with its current cycle
 * @param taskId The task ID
 * @returns The task or null if not found
 */
export const getTask = async (id: number): Promise<Task | null> => {
  try {
    const task = await getTaskById(id);
    
    if (task) {
      // 加载任务周期
      const cycles = await getTaskCyclesByTaskId(task.id);
      if (cycles.length > 0) {
        // 找到最新的周期作为当前周期
        const currentCycle = cycles.sort((a, b) => 
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        )[0];
        task.currentCycle = currentCycle;
      }
    }
    
    return task;
  } catch (error) {
    console.error(`获取任务 ID ${id} 时出错:`, error);
    throw error;
  }
};

/**
 * Get the current cycle for a task
 * @param taskId The task ID
 * @returns The current cycle or null if not found
 */
export const getCurrentCycleForTask = async (taskId: number): Promise<TaskCycle | null> => {
  try {
    const cycles = await getTaskCyclesByTaskId(taskId);
    if (cycles.length === 0) {
      return null;
    }
    
    // 找到最新的周期
    return cycles.sort((a, b) => 
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    )[0];
  } catch (error) {
    console.error('Error getting current cycle for task:', error);
    throw error;
  }
};

export const calculateNextCycleDates = (
  task: Task,
  currentStartDate: string,
  currentDueDate: string
): { startDate: string; dueDate: string } => {
  const startDate = new Date(currentStartDate);
  const dueDate = new Date(currentDueDate);
  const duration = dueDate.getTime() - startDate.getTime();

  let newStartDate: Date;
  let newDueDate: Date;
  
  switch (task.recurrenceType) {
    case 'daily':
      newStartDate = addDays(startDate, task.recurrenceValue);
      newDueDate = new Date(newStartDate.getTime() + duration);
      break;
      
    case 'weekly':
      newStartDate = addWeeks(startDate, task.recurrenceValue);
      newDueDate = new Date(newStartDate.getTime() + duration);
      break;
      
    case 'monthly':
      newStartDate = addMonths(startDate, task.recurrenceValue);
      newDueDate = new Date(newStartDate.getTime() + duration);
      break;
      
    case 'custom':
      if (task.recurrenceUnit === 'days') {
        newStartDate = addDays(startDate, task.recurrenceValue);
      } else if (task.recurrenceUnit === 'weeks') {
        newStartDate = addWeeks(startDate, task.recurrenceValue);
      } else if (task.recurrenceUnit === 'months') {
        newStartDate = addMonths(startDate, task.recurrenceValue);
      } else {
        // 默认为天
        newStartDate = addDays(startDate, task.recurrenceValue);
      }
      newDueDate = new Date(newStartDate.getTime() + duration);
      break;
      
    default:
      newStartDate = addDays(startDate, 1);
      newDueDate = new Date(newStartDate.getTime() + duration);
  }

  return {
    startDate: format(newStartDate, 'yyyy-MM-dd'),
    dueDate: format(newDueDate, 'yyyy-MM-dd'),
  };
};

export const completeTaskCycle = async (cycleId: number): Promise<void> => {
  try {
    // 获取所有周期
    const allCycles = await getTaskCycles();
    const cycle = allCycles.find(c => c.id === cycleId);
    
    if (!cycle) {
      throw new Error('Cycle not found');
    }
    
    // 获取任务信息
    const task = await getTaskById(cycle.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    // 更新周期为已完成
    const now = new Date().toISOString();
    const updatedCycle: TaskCycle = {
      ...cycle,
      isCompleted: true,
      completedDate: now
    };
    
    await saveTaskCycle(updatedCycle);
    
    // 更新任务的上次完成时间
    const updatedTask: Task = {
      ...task,
      lastCompletedDate: now,
      updatedAt: now
    };
    
    await saveTask(updatedTask);
    
    // 添加任务完成历史记录
    await saveTaskHistory({
      taskId: task.id,
      cycleId: cycle.id,
      action: 'completed',
      timestamp: now
    });
    
    // 如果启用了自动重置，创建下一个周期
    if (task.autoRestart) {
      // 检查是否在截止日期之前完成
      const currentDate = new Date();
      const dueDate = new Date(cycle.dueDate);
      
      if (currentDate < dueDate) {
        // 在截止日期之前完成，使用当前时间作为新周期的开始时间
        const newStartDate = new Date();
        let newDueDate: Date;
        
        // 根据任务的循环周期类型计算新的截止日期
        switch (task.recurrenceType) {
          case 'daily':
            newDueDate = addDays(newStartDate, task.recurrenceValue);
            break;
            
          case 'weekly':
            newDueDate = addWeeks(newStartDate, task.recurrenceValue);
            break;
            
          case 'monthly':
            newDueDate = addMonths(newStartDate, task.recurrenceValue);
            break;
            
          case 'custom':
            if (task.recurrenceUnit === 'days') {
              newDueDate = addDays(newStartDate, task.recurrenceValue);
            } else if (task.recurrenceUnit === 'weeks') {
              newDueDate = addWeeks(newStartDate, task.recurrenceValue);
            } else if (task.recurrenceUnit === 'months') {
              newDueDate = addMonths(newStartDate, task.recurrenceValue);
            } else {
              // 默认为天
              newDueDate = addDays(newStartDate, task.recurrenceValue);
            }
            break;
            
          default:
            newDueDate = addDays(newStartDate, 1);
        }
        
        // 创建新周期
        const newCycle: TaskCycle = {
          id: 0, // 将由 saveTaskCycle 分配
          taskId: cycle.taskId,
          startDate: newStartDate.toISOString(),
          dueDate: newDueDate.toISOString(),
          isCompleted: false,
          isOverdue: false,
          createdAt: now
        };
        
        const savedCycle = await saveTaskCycle(newCycle);
        
        // 添加周期重启历史记录
        await saveTaskHistory({
          taskId: task.id,
          cycleId: savedCycle.id,
          action: 'restarted',
          timestamp: now
        });
      } else {
        // 在截止日期之后完成，使用原有的计算方式
        const { startDate, dueDate } = calculateNextCycleDates(
          task,
          cycle.startDate,
          cycle.dueDate
        );
        
        const newCycle: TaskCycle = {
          id: 0, // 将由 saveTaskCycle 分配
          taskId: cycle.taskId,
          startDate: startDate,
          dueDate: dueDate,
          isCompleted: false,
          isOverdue: false,
          createdAt: now
        };
        
        const savedCycle = await saveTaskCycle(newCycle);
        
        // 添加周期重启历史记录
        await saveTaskHistory({
          taskId: task.id,
          cycleId: savedCycle.id,
          action: 'restarted',
          timestamp: now
        });
      }
    }
  } catch (error) {
    console.error('Error completing task cycle:', error);
    throw error;
  }
};

/**
 * Check for overdue tasks and update their status
 * @returns Object with counts of checked and overdue tasks
 */
export const checkAndUpdateOverdueTasks = async (): Promise<{ checkedCount: number; overdueCount: number }> => {
  try {
    console.log('Checking for overdue tasks...');
    
    // Get all tasks
    const tasks = await getAllTasks(true, true);
    
    console.log(`Found ${tasks.length} tasks to check`);
    
    let overdueCount = 0;
    
    // Check each task
    for (const task of tasks) {
      // Skip if no current cycle
      if (!task.currentCycle) {
        console.log(`No current cycle found for task ${task.id} (${task.title})`);
        continue;
      }
      
      // Check if the cycle is overdue
      const now = new Date();
      const dueDate = new Date(task.currentCycle.dueDate);
      
      // 即使任务被禁用，也要检查是否逾期，但只有活动任务才会计入逾期统计
      if (now > dueDate && !task.currentCycle.isCompleted && !task.currentCycle.isOverdue) {
        console.log(`Task ${task.id} (${task.title}) is overdue`);
        
        // Mark the cycle as overdue
        const updatedCycle: TaskCycle = {
          ...task.currentCycle,
          isOverdue: true
        };
        
        await saveTaskCycle(updatedCycle);
        
        // 添加任务逾期历史记录
        await saveTaskHistory({
          taskId: task.id,
          cycleId: task.currentCycle.id,
          action: 'overdue',
          timestamp: new Date().toISOString()
        });
        
        // 只有活动任务才计入逾期统计
        if (task.isActive) {
          overdueCount++;
        }
      }
    }
    
    console.log(`Found ${overdueCount} overdue active tasks`);
    
    return {
      checkedCount: tasks.length,
      overdueCount
    };
  } catch (error) {
    console.error('Error checking for overdue tasks:', error);
    return {
      checkedCount: 0,
      overdueCount: 0
    };
  }
};

export const cancelTask = async (taskId: number): Promise<void> => {
  try {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  // 如果任务已同步到日历，先删除日历事件
  if (task.syncToCalendar && task.calendarEventId) {
    try {
      await removeTaskFromCalendar(task.calendarEventId);
    } catch (error) {
      console.error('Failed to remove calendar event:', error);
    }
  }

    // 更新任务为非活动状态
    const updatedTask: Task = {
      ...task,
      isActive: false,
      updatedAt: new Date().toISOString()
    };
    
    await saveTask(updatedTask);
  } catch (error) {
    console.error(`Error canceling task ${taskId}:`, error);
    throw error;
  }
};

/**
 * Get completed tasks
 * @returns Array of completed tasks
 */
export const getCompletedTasks = async (): Promise<Task[]> => {
  try {
    const allTasks = await getAllTasks(true, true);
    return allTasks.filter(task => 
      task.currentCycle && task.currentCycle.isCompleted
    );
  } catch (error) {
    console.error('获取已完成任务时出错:', error);
    throw error;
  }
};

/**
 * Get overdue tasks
 * @returns Array of overdue tasks
 */
export const getOverdueTasks = async (): Promise<Task[]> => {
  try {
    const allTasks = await getAllTasks(true, true);
    return allTasks.filter(task => 
      task.currentCycle && task.currentCycle.isOverdue && !task.currentCycle.isCompleted
    );
  } catch (error) {
    console.error('获取逾期任务时出错:', error);
    throw error;
  }
}; 