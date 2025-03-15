import { openDatabase, SQLTransaction, SQLResultSet, SQLError } from 'expo-sqlite';
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
import db from './database';
import { addTaskToCalendar, removeTaskFromCalendar, updateTaskInCalendar } from './calendarService';

// Open database connection
const dbExpo = openDatabase('nevermiss.db');

const mapRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  recurrenceType: row.recurrenceType,
  recurrenceValue: row.recurrenceValue,
  recurrenceUnit: row.recurrenceUnit,
  reminderOffset: row.reminderOffset,
  reminderUnit: row.reminderUnit,
  reminderTime: {
    hour: row.reminderTimeHour,
    minute: row.reminderTimeMinute,
  },
  isActive: Boolean(row.isActive),
  autoRestart: Boolean(row.autoRestart),
  syncToCalendar: Boolean(row.syncToCalendar),
  calendarEventId: row.calendarEventId,
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
  currentCycle: row.currentCycleId ? {
    id: row.currentCycleId,
    taskId: row.id,
    startDate: row.cycleStartDate,
    dueDate: row.cycleDueDate,
    isCompleted: Boolean(row.isCompleted),
    isOverdue: Boolean(row.isOverdue),
    completedDate: row.cycleCompletedDate,
    createdAt: row.created_at
  } : undefined
});

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
  const taskId = await new Promise<number>((resolve, reject) => {
    dbExpo.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO tasks (
            title,
            description,
            recurrenceType,
            recurrenceValue,
            recurrenceUnit,
            reminderOffset,
            reminderUnit,
            reminderTimeHour,
            reminderTimeMinute,
            isActive,
            autoRestart,
            syncToCalendar,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            input.title,
            input.description || null,
            input.recurrenceType,
            input.recurrenceValue,
            input.recurrenceUnit || null,
            input.reminderOffset,
            input.reminderUnit,
            input.reminderTime.hour,
            input.reminderTime.minute,
            input.isActive === false ? 0 : 1,
            input.autoRestart === true ? 1 : 0,
            input.syncToCalendar === true ? 1 : 0,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
          (_, result) => {
            if (result.insertId === undefined) {
              reject(new Error('Failed to insert task'));
              return;
            }
            resolve(result.insertId);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        reject(error);
      }
    );
  });

  // Create initial cycle
  const cycle = await createTaskCycle(taskId, input.startDate, input.recurrenceType, input.recurrenceValue, input.recurrenceUnit);

  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error(`Failed to create task: could not find task with id ${taskId}`);
  }

  // 如果启用了日历同步，添加到系统日历
  if (input.syncToCalendar) {
    try {
      const eventId = await addTaskToCalendar(task, cycle);
      await new Promise<void>((resolve, reject) => {
        dbExpo.transaction(
          (tx) => {
            tx.executeSql(
              'UPDATE tasks SET calendarEventId = ? WHERE id = ?',
              [eventId, taskId],
              () => resolve(),
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (error) => reject(error)
        );
      });
      task.calendarEventId = eventId;
    } catch (error) {
      console.error('Failed to sync task to calendar:', error);
    }
  }

  return task;
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
    
    // Insert the cycle
    const result = await new Promise<SQLResultSet>((resolve, reject) => {
      dbExpo.transaction((tx: SQLTransaction) => {
        tx.executeSql(
          `INSERT INTO task_cycles (
            taskId, startDate, dueDate, isCompleted, 
            isOverdue, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            taskId,
            startDateTime.toISOString(),
            dueDate.toISOString(),
            0, // not completed
            0, // not overdue
            now
          ],
          (_: SQLTransaction, result: SQLResultSet) => {
            if (result.insertId === undefined) {
              reject(new Error('Failed to insert task cycle'));
              return;
            }
            resolve(result);
          },
          (_: SQLTransaction, error: SQLError) => {
            reject(error);
            return false;
          }
        );
      });
    });
    
    const cycleId = result.insertId;
    if (cycleId === undefined) {
      throw new Error('Failed to get task cycle ID');
    }
    
    // Return the created cycle
    return {
      id: cycleId,
      taskId,
      startDate: startDateTime.toISOString(),
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      isOverdue: false,
      createdAt: now
    };
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
export const updateTask = async (taskId: number, input: UpdateTaskInput): Promise<Task> => {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  await new Promise<void>((resolve, reject) => {
    dbExpo.transaction(
      (tx) => {
        tx.executeSql(
          `UPDATE tasks SET
            title = ?,
            description = ?,
            recurrenceType = ?,
            recurrenceValue = ?,
            recurrenceUnit = ?,
            reminderOffset = ?,
            reminderUnit = ?,
            reminderTimeHour = ?,
            reminderTimeMinute = ?,
            isActive = ?,
            autoRestart = ?,
            syncToCalendar = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            input.title,
            input.description || null,
            input.recurrenceType,
            input.recurrenceValue,
            input.recurrenceUnit || null,
            input.reminderOffset,
            input.reminderUnit,
            input.reminderTime.hour,
            input.reminderTime.minute,
            input.isActive === false ? 0 : 1,
            input.autoRestart === true ? 1 : 0,
            input.syncToCalendar === true ? 1 : 0,
            new Date().toISOString(),
            taskId,
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => reject(error)
    );
  });

  // 处理日历同步
  if (input.syncToCalendar) {
    if (task.calendarEventId) {
      // 更新现有的日历事件
      try {
        await updateTaskInCalendar(task.calendarEventId, {
          ...task,
          ...input,
        } as Task, task.currentCycle!);
      } catch (error) {
        console.error('Failed to update calendar event:', error);
      }
    } else {
      // 创建新的日历事件
      try {
        const eventId = await addTaskToCalendar({
          ...task,
          ...input,
        } as Task, task.currentCycle!);
        await new Promise<void>((resolve, reject) => {
          dbExpo.transaction(
            (tx) => {
              tx.executeSql(
                'UPDATE tasks SET calendarEventId = ? WHERE id = ?',
                [eventId, taskId],
                () => resolve(),
                (_, error) => {
                  reject(error);
                  return false;
                }
              );
            },
            (error) => reject(error)
          );
        });
      } catch (error) {
        console.error('Failed to create calendar event:', error);
      }
    }
  } else if (task.calendarEventId) {
    // 如果禁用了日历同步，删除现有的日历事件
    try {
      await removeTaskFromCalendar(task.calendarEventId);
      await new Promise<void>((resolve, reject) => {
        dbExpo.transaction(
          (tx) => {
            tx.executeSql(
              'UPDATE tasks SET calendarEventId = NULL WHERE id = ?',
              [taskId],
              () => resolve(),
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (error) => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to remove calendar event:', error);
    }
  }

  const updatedTask = await getTaskById(taskId);
  if (!updatedTask) {
    throw new Error(`Failed to update task: could not find task with id ${taskId}`);
  }
  return updatedTask;
};

/**
 * Delete a task and all its cycles
 * @param taskId The task ID to delete
 */
export const deleteTask = async (taskId: number): Promise<void> => {
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

  await new Promise<void>((resolve, reject) => {
    dbExpo.transaction(
      (tx) => {
        tx.executeSql(
          'DELETE FROM tasks WHERE id = ?',
          [taskId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => reject(error)
    );
  });
};

/**
 * Get all tasks with their current cycles
 * @returns Array of tasks with current cycles
 */
export const getAllTasks = (): Promise<Task[]> => {
  return new Promise((resolve, reject) => {
    dbExpo.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            t.*,
            c.id as currentCycleId,
            c.startDate as cycleStartDate,
            c.dueDate as cycleDueDate,
            c.isCompleted,
            c.isOverdue,
            c.completedDate as cycleCompletedDate,
            c.created_at as cycleCreatedAt
          FROM tasks t
          LEFT JOIN task_cycles c ON t.id = c.taskId AND c.isCompleted = 0
          ORDER BY t.created_at DESC;`,
          [],
          (_, { rows: { _array } }) => {
            const tasks = _array.map(mapRowToTask);
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        reject(error);
      }
    );
  });
};

/**
 * Get a task by ID with its current cycle
 * @param taskId The task ID
 * @returns The task or null if not found
 */
export const getTaskById = async (taskId: number): Promise<Task | null> => {
  try {
    const task = await new Promise<Task | null>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            t.*, 
            tc.id as currentCycleId, 
            tc.startDate as cycleStartDate, 
            tc.dueDate as cycleDueDate,
            tc.isCompleted, 
            tc.isOverdue, 
            tc.completedDate as cycleCompletedDate,
            tc.created_at as cycleCreatedAt
          FROM tasks t
          LEFT JOIN task_cycles tc ON t.id = tc.taskId
          WHERE t.id = ?
          ORDER BY tc.startDate DESC
          LIMIT 1;`,
          [taskId],
          (_, { rows }) => {
            if (rows.length === 0) {
              resolve(null);
              return;
            }
            const task = mapRowToTask(rows.item(0));
            resolve(task);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
    
    return task;
  } catch (error) {
    console.error(`Error getting task ${taskId}:`, error);
    return null;
  }
};

/**
 * Get the current cycle for a task
 * @param taskId The task ID
 * @returns The current cycle or null if not found
 */
export const getCurrentCycleForTask = async (taskId: number): Promise<TaskCycle | null> => {
  try {
    return await new Promise<TaskCycle | null>((resolve, reject) => {
      dbExpo.transaction(tx => {
        tx.executeSql(
          `SELECT 
            id, task_id, start_date, due_date, is_completed,
            is_overdue, completed_date, created_at
          FROM task_cycles
          WHERE task_id = ?
          ORDER BY due_date DESC
          LIMIT 1`,
          [taskId],
          (_, { rows }) => {
            if (rows.length === 0) {
              resolve(null);
              return;
            }
            
            const row = rows.item(0);
            resolve({
              id: row.id,
              taskId: row.task_id,
              startDate: row.start_date,
              dueDate: row.due_date,
              isCompleted: Boolean(row.is_completed),
              isOverdue: Boolean(row.is_overdue),
              completedDate: row.completed_date,
              createdAt: row.created_at
            });
          },
          (_, error) => reject(error)
        );
      });
    });
  } catch (error) {
    console.error('Error getting current cycle for task:', error);
    throw error;
  }
};

export const calculateNextCycleDates = (
  currentStartDate: string,
  currentDueDate: string,
  recurrenceType: RecurrenceType,
  recurrenceValue: number,
  recurrenceUnit?: RecurrenceUnit
): { startDate: string; dueDate: string } => {
  const startDate = new Date(currentStartDate);
  const dueDate = new Date(currentDueDate);
  const duration = dueDate.getTime() - startDate.getTime();

  let nextStartDate = new Date(startDate);
  
  switch (recurrenceType) {
    case 'daily':
      nextStartDate.setDate(nextStartDate.getDate() + 1);
      break;
    case 'weekly':
      nextStartDate.setDate(nextStartDate.getDate() + 7);
      break;
    case 'monthly':
      nextStartDate.setMonth(nextStartDate.getMonth() + 1);
      break;
    case 'custom':
      if (!recurrenceUnit) throw new Error('Recurrence unit is required for custom type');
      
      switch (recurrenceUnit) {
        case 'minutes':
          nextStartDate.setMinutes(nextStartDate.getMinutes() + recurrenceValue);
          break;
        case 'hours':
          nextStartDate.setHours(nextStartDate.getHours() + recurrenceValue);
          break;
        case 'days':
          nextStartDate.setDate(nextStartDate.getDate() + recurrenceValue);
          break;
        case 'weeks':
          nextStartDate.setDate(nextStartDate.getDate() + (recurrenceValue * 7));
          break;
        case 'months':
          nextStartDate.setMonth(nextStartDate.getMonth() + recurrenceValue);
          break;
        case 'years':
          nextStartDate.setFullYear(nextStartDate.getFullYear() + recurrenceValue);
          break;
      }
      break;
  }

  const nextDueDate = new Date(nextStartDate.getTime() + duration);

  return {
    startDate: nextStartDate.toISOString(),
    dueDate: nextDueDate.toISOString(),
  };
};

export const completeTaskCycle = async (cycleId: number): Promise<void> => {
  const now = new Date().toISOString();
  
  // Get the cycle and task details
  const cycle = await new Promise<TaskCycleWithTask>((resolve, reject) => {
    dbExpo.transaction(tx => {
      tx.executeSql(
        `SELECT tc.*, t.recurrenceType, t.recurrenceValue, t.recurrenceUnit, t.autoRestart
         FROM task_cycles tc
         JOIN tasks t ON tc.taskId = t.id
         WHERE tc.id = ?`,
        [cycleId],
        (_, { rows }) => {
          if (rows.length === 0) {
            reject(new Error('Cycle not found'));
            return;
          }
          resolve(rows.item(0));
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });

  // Complete the current cycle
  await new Promise<void>((resolve, reject) => {
    dbExpo.transaction(tx => {
      tx.executeSql(
        `UPDATE task_cycles 
         SET isCompleted = 1, completedDate = ?
         WHERE id = ?`,
        [now, cycleId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });

  // If auto-restart is enabled, create the next cycle
  if (cycle.autoRestart) {
    const { startDate, dueDate } = calculateNextCycleDates(
      cycle.startDate,
      cycle.dueDate,
      cycle.recurrenceType,
      cycle.recurrenceValue,
      cycle.recurrenceUnit
    );

    await createTaskCycle(cycle.taskId, startDate, cycle.recurrenceType, cycle.recurrenceValue, cycle.recurrenceUnit);
  }
};

/**
 * Check for overdue tasks and update their status
 * @returns Object with counts of checked and overdue tasks
 */
export const checkAndUpdateOverdueTasks = async (): Promise<{ checkedCount: number; overdueCount: number }> => {
  try {
    console.log('Checking for overdue tasks...');
    
    // Get all active tasks
    const tasks = await getAllTasks();
    const activeTasks = tasks.filter(task => task.isActive);
    
    console.log(`Found ${activeTasks.length} active tasks to check`);
    
    let overdueCount = 0;
    
    // Check each active task
    for (const task of activeTasks) {
      // Skip if no current cycle
      if (!task.currentCycle) {
        console.log(`No current cycle found for task ${task.id} (${task.title})`);
        continue;
      }
      
      // Check if the cycle is overdue
      const now = new Date();
      const dueDate = new Date(task.currentCycle.dueDate);
      
      if (now > dueDate && !task.currentCycle.isCompleted) {
        console.log(`Task ${task.id} (${task.title}) is overdue`);
        
        // Mark the cycle as overdue
        await new Promise<void>((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              'UPDATE task_cycles SET is_overdue = ? WHERE id = ?',
              [1, task.currentCycle!.id],
              () => resolve(),
              (_, error) => reject(error)
            );
          });
        });
        
        overdueCount++;
      }
    }
    
    console.log(`Found ${overdueCount} overdue tasks`);
    
    return {
      checkedCount: activeTasks.length,
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

  await new Promise<void>((resolve, reject) => {
    dbExpo.transaction(
      (tx) => {
        tx.executeSql(
          'UPDATE tasks SET isActive = 0, updated_at = ? WHERE id = ?',
          [new Date().toISOString(), taskId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => reject(error)
    );
  });
}; 