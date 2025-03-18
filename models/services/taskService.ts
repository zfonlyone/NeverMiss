import {
  Task,
  TaskCycle,
  CreateTaskInput,
  UpdateTaskInput,
  RecurrenceType,
  RecurrenceUnit,
  CycleStatus,
  DateType,
  RecurrencePattern,
  WeekDay,
  WeekType,
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
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import lunarService from './lunarService';

interface TaskCycleWithTask extends TaskCycle {
  recurrencePattern: RecurrencePattern;
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
      recurrencePattern: input.recurrencePattern,
      reminderOffset: input.reminderOffset,
      reminderUnit: input.reminderUnit,
      reminderTime: input.reminderTime,
      dateType: input.dateType || 'solar',
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
      dateType: input.dateType || 'solar',
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
 * Calculate the due date based on the start date and recurrence pattern
 * 根据开始日期和重复模式计算截止日期
 */
const calculateDueDate = (startDate: string, recurrencePattern: RecurrencePattern, dateType: DateType = 'solar'): string => {
  let start = new Date(startDate);

  // 如果是农历日期类型，需要特殊处理
  if (dateType === 'lunar') {
    switch (recurrencePattern.type) {
      case 'daily':
        // 增加农历天数
        return lunarService.addLunarTime(start, recurrencePattern.value, 'day').toISOString();
        
      case 'weekly':
        if (recurrencePattern.weekDay !== undefined) {
          // 找到下一个指定的星期几 (公历星期几)
          let dueDate = start;
          const targetDay = recurrencePattern.weekDay;
          while (dueDate.getDay() !== targetDay) {
            dueDate = addDays(dueDate, 1);
          }
          return dueDate.toISOString();
        } else {
          // 每隔几个农历周
          return lunarService.addLunarTime(start, recurrencePattern.value * 7, 'day').toISOString();
        }
        
      case 'monthly':
        if (recurrencePattern.monthDay !== undefined) {
          // 下个农历月的指定日期
          const lunarDate = lunarService.solarToLunar(start);
          // 先切换到下个月
          const nextMonth = lunarService.addLunarTime(start, 1, 'month');
          // 获取下个月的农历信息
          const nextMonthLunar = lunarService.solarToLunar(nextMonth);
          // 检查指定的日期是否在下个月的天数范围内
          const monthDays = lunarService.getLunarMonthDays(nextMonthLunar.year, nextMonthLunar.month, nextMonthLunar.isLeap);
          const targetDay = Math.min(recurrencePattern.monthDay, monthDays);
          // 返回指定日期
          return lunarService.lunarToSolar(nextMonthLunar.year, nextMonthLunar.month, targetDay, nextMonthLunar.isLeap).toISOString();
        } else {
          // 每隔几个农历月
          return lunarService.addLunarTime(start, recurrencePattern.value, 'month').toISOString();
        }
        
      case 'custom':
        switch (recurrencePattern.unit) {
          case 'days':
            return lunarService.addLunarTime(start, recurrencePattern.value, 'day').toISOString();
          case 'weeks':
            return lunarService.addLunarTime(start, recurrencePattern.value * 7, 'day').toISOString();
          case 'months':
            return lunarService.addLunarTime(start, recurrencePattern.value, 'month').toISOString();
          default:
            throw new Error(`不支持的重复单位: ${recurrencePattern.unit}`);
        }
        
      default:
        throw new Error(`不支持的重复类型: ${recurrencePattern.type}`);
    }
  } else {
    // 对于公历日期，继续使用现有逻辑
    switch (recurrencePattern.type) {
      case 'daily':
        return addDays(start, recurrencePattern.value).toISOString();
        
      case 'weekly':
        if (recurrencePattern.weekDay !== undefined) {
          // 找到下一个指定的星期几
          let dueDate = start;
          const targetDay = recurrencePattern.weekDay;
          while (dueDate.getDay() !== targetDay) {
            dueDate = addDays(dueDate, 1);
          }
          return dueDate.toISOString();
        } else {
          // 每隔几周
          return addDays(start, recurrencePattern.value * 7).toISOString();
        }
        
      case 'monthly':
        if (recurrencePattern.monthDay !== undefined) {
          // 下个月的指定日期
          const dueDate = new Date(start);
          dueDate.setMonth(dueDate.getMonth() + 1);
          dueDate.setDate(Math.min(recurrencePattern.monthDay, new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate()));
          return dueDate.toISOString();
        } else {
          // 每隔几个月
          const dueDate = new Date(start);
          dueDate.setMonth(dueDate.getMonth() + recurrencePattern.value);
          return dueDate.toISOString();
        }
        
      case 'custom':
        switch (recurrencePattern.unit) {
          case 'days':
            return addDays(start, recurrencePattern.value).toISOString();
          case 'weeks':
            return addDays(start, recurrencePattern.value * 7).toISOString();
          case 'months':
            const dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + recurrencePattern.value);
            return dueDate.toISOString();
          default:
            throw new Error(`不支持的重复单位: ${recurrencePattern.unit}`);
        }
        
      default:
        throw new Error(`不支持的重复类型: ${recurrencePattern.type}`);
    }
  }
};

/**
 * Create a task cycle
 */
export const createTaskCycle = async (
  taskId: number,
  startDate: string,
  pattern: RecurrencePattern,
  dateType: DateType = 'solar'
): Promise<TaskCycle> => {
  if (!taskId) {
    throw new Error('Task ID is required');
  }
  
  try {
    const now = new Date().toISOString();
    const dueDate = calculateDueDate(startDate, pattern, dateType);
    
    // 创建新的周期
    const cycle: TaskCycle = {
      id: 0, // 将由 saveTaskCycle 分配
      taskId: taskId,
      startDate: startDate,
      dueDate: dueDate,
      dateType,
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
      recurrencePattern: input.recurrencePattern,
      reminderOffset: input.reminderOffset,
      reminderUnit: input.reminderUnit,
      reminderTime: input.reminderTime,
      dateType: input.dateType,
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
        dateType: input.dateType,
      };
      
      updatedCycle = await saveTaskCycle(updatedCycle);
    }
    
    // 保存更新后的任务
    const savedTask = await saveTask(updatedTask);
    savedTask.currentCycle = updatedCycle;
    
    // 处理日历同步
    if (calendarSyncChanged) {
      if (input.syncToCalendar && updatedCycle) {
        // 添加到日历
        try {
          const eventId = await addTaskToCalendar(savedTask, updatedCycle);
          savedTask.calendarEventId = eventId;
          await saveTask(savedTask);
        } catch (error) {
          console.error('同步任务到日历时出错:', error);
        }
      } else if (savedTask.calendarEventId) {
        // 从日历中移除
        try {
          await removeTaskFromCalendar(savedTask.calendarEventId);
          savedTask.calendarEventId = undefined;
          await saveTask(savedTask);
        } catch (error) {
          console.error('从日历中移除任务时出错:', error);
        }
      }
    } else if (savedTask.syncToCalendar && updatedCycle && savedTask.calendarEventId) {
      // 更新日历事件
      try {
        await updateTaskInCalendar(savedTask.calendarEventId, savedTask, updatedCycle);
      } catch (error) {
        console.error('更新日历事件时出错:', error);
      }
    }
    
    return savedTask;
  } catch (error) {
    console.error('更新任务时出错:', error);
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

/**
 * Calculate the next cycle dates based on the current cycle
 * 根据当前周期计算下一个周期的日期
 */
const getNextCycleDates = (task: Task, currentCycle: TaskCycle): { startDate: string; dueDate: string } => {
  // 计算当前周期的持续时间
  const duration = new Date(currentCycle.dueDate).getTime() - new Date(currentCycle.startDate).getTime();
  let newStartDate: Date;
  let newDueDate: Date;
  
  // 获取当前周期的结束日期作为下一个周期的开始
  const startDate = new Date(currentCycle.dueDate);
  
  // 如果使用农历日期，则需要特殊处理
  if (task.dateType === 'lunar') {
    switch (task.recurrencePattern.type) {
      case 'daily':
        // 增加农历天数
        newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value, 'day');
        break;
        
      case 'weekly':
        if (task.recurrencePattern.weekDay !== undefined) {
          // 找到下一个指定的星期几 (公历)
          newStartDate = startDate;
          const targetDay = task.recurrencePattern.weekDay;
          while (newStartDate.getDay() !== targetDay) {
            newStartDate = addDays(newStartDate, 1);
          }
        } else {
          // 每隔几个农历周
          newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value * 7, 'day');
        }
        break;
        
      case 'monthly':
        if (task.recurrencePattern.monthDay !== undefined) {
          // 下个农历月的指定日期
          const lunarDate = lunarService.solarToLunar(startDate);
          // 先切换到下个月
          newStartDate = lunarService.addLunarTime(startDate, 1, 'month');
          // 获取下个月的农历信息
          const nextMonthLunar = lunarService.solarToLunar(newStartDate);
          // 检查指定的日期是否在下个月的天数范围内
          const monthDays = lunarService.getLunarMonthDays(nextMonthLunar.year, nextMonthLunar.month, nextMonthLunar.isLeap);
          const targetDay = Math.min(task.recurrencePattern.monthDay, monthDays);
          // 设置指定日期
          newStartDate = lunarService.lunarToSolar(nextMonthLunar.year, nextMonthLunar.month, targetDay, nextMonthLunar.isLeap);
        } else {
          // 每隔几个农历月
          newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value, 'month');
        }
        break;
        
      case 'custom':
        switch (task.recurrencePattern.unit) {
          case 'days':
            newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value, 'day');
            break;
          case 'weeks':
            newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value * 7, 'day');
            break;
          case 'months':
            newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value, 'month');
            break;
          default:
            // 默认为农历天
            newStartDate = lunarService.addLunarTime(startDate, task.recurrencePattern.value, 'day');
        }
        break;
        
      default:
        // 默认增加一个农历日
        newStartDate = lunarService.addLunarTime(startDate, 1, 'day');
    }
    
    // 计算新的结束日期 (保持与原来相同的持续时间)
    newDueDate = new Date(newStartDate.getTime() + duration);
  } else {
    // 对于公历日期，继续使用现有逻辑
    switch (task.recurrencePattern.type) {
      case 'daily':
        newStartDate = addDays(startDate, task.recurrencePattern.value);
        break;
        
      case 'weekly':
        if (task.recurrencePattern.weekDay !== undefined) {
          // 找到下一个指定的星期几
          newStartDate = startDate;
          const targetDay = task.recurrencePattern.weekDay;
          while (newStartDate.getDay() !== targetDay) {
            newStartDate = addDays(newStartDate, 1);
          }
        } else {
          // 每隔几周
          newStartDate = addDays(startDate, task.recurrencePattern.value * 7);
        }
        break;
        
      case 'monthly':
        if (task.recurrencePattern.monthDay !== undefined) {
          // 下个月的指定日期
          newStartDate = new Date(startDate);
          newStartDate.setMonth(newStartDate.getMonth() + 1);
          // 确保日期有效（处理31号的情况）
          const maxDay = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0).getDate();
          newStartDate.setDate(Math.min(task.recurrencePattern.monthDay, maxDay));
        } else {
          // 每隔几个月
          newStartDate = new Date(startDate);
          newStartDate.setMonth(newStartDate.getMonth() + task.recurrencePattern.value);
        }
        break;
        
      case 'custom':
        switch (task.recurrencePattern.unit) {
          case 'days':
            newStartDate = addDays(startDate, task.recurrencePattern.value);
            break;
          case 'weeks':
            newStartDate = addDays(startDate, task.recurrencePattern.value * 7);
            break;
          case 'months':
            newStartDate = new Date(startDate);
            newStartDate.setMonth(newStartDate.getMonth() + task.recurrencePattern.value);
            break;
          default:
            // 默认为天
            newStartDate = addDays(startDate, task.recurrencePattern.value);
        }
        break;
        
      default:
        newStartDate = addDays(startDate, 1);
    }
    
    // 计算新的结束日期
    newDueDate = new Date(newStartDate.getTime() + duration);
  }

  return {
    startDate: newStartDate.toISOString(),
    dueDate: newDueDate.toISOString(),
  };
};

/**
 * Complete a task cycle
 */
export const completeTaskCycle = async (taskId: number, cycleId: number): Promise<TaskCycle> => {
  try {
    // Get the task and cycle
    const task = await getTaskById(taskId);
    const cycles = await getTaskCyclesByTaskId(taskId);
    const currentCycle = cycles.find(c => c.id === cycleId);
    
    if (!task || !currentCycle) {
      throw new Error('Task or cycle not found');
    }
    
    // 记录当前时间作为完成时间
    const completedDate = new Date().toISOString();
    
    // Mark the current cycle as completed
    currentCycle.isCompleted = true;
    currentCycle.completedDate = completedDate;
    await saveTaskCycle(currentCycle);
    
    // Save task history
    await saveTaskHistory({
      id: 0,
      taskId,
      cycleId,
      action: 'complete',
      timestamp: completedDate
    });
    
    // Update task's last completed date
    task.lastCompletedDate = completedDate;
    await saveTask(task);
    
    // If auto restart is enabled, create next cycle
    if (task.autoRestart) {
      // 根据不同情况确定下个周期的开始日期
      let nextCycleStartDate: string;
      
      // 已完成任务：以完成日期为起点
      nextCycleStartDate = completedDate;
      
      // 创建下一个任务周期
      const nextCycle = await createTaskCycle(
        taskId,
        nextCycleStartDate,
        task.recurrencePattern,
        currentCycle.dateType
      );
      
      // Update task's current cycle
      task.currentCycle = nextCycle;
      await saveTask(task);
      
      // If sync to calendar is enabled, create calendar event for next cycle
      if (task.syncToCalendar) {
        try {
          const eventId = await addTaskToCalendar(task, nextCycle);
          task.calendarEventId = eventId;
          await saveTask(task);
        } catch (error) {
          console.error('Error syncing task to calendar:', error);
        }
      }
    }
    
    return currentCycle;
  } catch (error) {
    console.error('Error completing task cycle:', error);
    throw error;
  }
};

/**
 * Skip a task cycle
 */
export const skipTaskCycle = async (taskId: number, cycleId: number): Promise<TaskCycle> => {
  try {
    // Get the task and cycle
    const task = await getTaskById(taskId);
    const cycles = await getTaskCyclesByTaskId(taskId);
    const currentCycle = cycles.find(c => c.id === cycleId);
    
    if (!task || !currentCycle) {
      throw new Error('Task or cycle not found');
    }
    
    // 当前时间
    const now = new Date().toISOString();
    
    // 保存任务历史
    await saveTaskHistory({
      id: 0,
      taskId,
      cycleId,
      action: 'skip',
      timestamp: now
    });
    
    // 确定下一个周期的开始日期
    let nextCycleStartDate: string;
    
    // 逾期任务：以截止日期为起点
    if (new Date(currentCycle.dueDate) < new Date(now)) {
      nextCycleStartDate = currentCycle.dueDate;
    } else {
      // 未逾期任务：以当前日期为起点
      nextCycleStartDate = now;
    }
    
    // 创建下一个周期
    const nextCycle = await createTaskCycle(
      taskId,
      nextCycleStartDate,
      task.recurrencePattern,
      currentCycle.dateType
    );
    
    // 更新任务的当前周期
    task.currentCycle = nextCycle;
    await saveTask(task);
    
    // 如果启用了日历同步，为下一个周期创建日历事件
    if (task.syncToCalendar) {
      try {
        const eventId = await addTaskToCalendar(task, nextCycle);
        task.calendarEventId = eventId;
        await saveTask(task);
      } catch (error) {
        console.error('Error syncing task to calendar:', error);
      }
    }
    
    return nextCycle;
  } catch (error) {
    console.error('Error skipping task cycle:', error);
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