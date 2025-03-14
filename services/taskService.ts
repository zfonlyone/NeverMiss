import * as SQLite from 'expo-sqlite';
import { Task, TaskCycle } from '../models/Task';
import { scheduleTaskNotification } from './notificationService';

// Open database connection
const db = SQLite.openDatabase('nevermiss.db');

/**
 * Create a new task
 * @param task The task to create
 * @returns The created task with ID
 */
export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  try {
    const now = new Date().toISOString();
    
    // Insert the task
    const result = await new Promise<SQLite.SQLResultSet>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO tasks (
            title, description, start_date_time, recurrence_type, 
            recurrence_value, recurrence_unit, reminder_offset, 
            is_active, auto_restart, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            task.title,
            task.description || '',
            task.startDateTime,
            task.recurrenceType,
            task.recurrenceValue,
            task.recurrenceUnit || null,
            task.reminderOffset,
            task.isActive ? 1 : 0,
            task.autoRestart ? 1 : 0,
            now,
            now
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
    
    const taskId = result.insertId;
    
    // Create the first cycle
    const cycle = await createTaskCycle(taskId, task.startDateTime, task.recurrenceType, task.recurrenceValue, task.recurrenceUnit);
    
    // Schedule notification for the task
    await scheduleTaskNotification({
      id: taskId,
      title: task.title,
      description: task.description || '',
      dueDate: cycle.dueDate,
      reminderOffset: task.reminderOffset
    });
    
    // Return the created task
    return {
      id: taskId,
      ...task,
      createdAt: now,
      updatedAt: now,
      currentCycle: cycle
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Create a task cycle
 * @param taskId The task ID
 * @param startDate The start date
 * @param recurrenceType The recurrence type
 * @param recurrenceValue The recurrence value
 * @param recurrenceUnit The recurrence unit (for custom recurrence)
 * @returns The created task cycle
 */
export const createTaskCycle = async (
  taskId: number,
  startDate: string,
  recurrenceType: string,
  recurrenceValue: number,
  recurrenceUnit?: string
): Promise<TaskCycle> => {
  try {
    const now = new Date().toISOString();
    const startDateTime = new Date(startDate);
    const dueDate = calculateDueDate(startDateTime, recurrenceType, recurrenceValue, recurrenceUnit);
    
    // Insert the cycle
    const result = await new Promise<SQLite.SQLResultSet>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO task_cycles (
            task_id, start_date, due_date, is_completed, 
            is_overdue, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            taskId,
            startDateTime.toISOString(),
            dueDate.toISOString(),
            0, // not completed
            0, // not overdue
            now
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
    
    const cycleId = result.insertId;
    
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
  recurrenceType: string,
  recurrenceValue: number,
  recurrenceUnit?: string
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
 * @param task The task to update
 * @returns The updated task
 */
export const updateTask = async (task: Task): Promise<Task> => {
  try {
    const now = new Date().toISOString();
    
    // Update the task
    await new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE tasks SET
            title = ?, description = ?, start_date_time = ?, 
            recurrence_type = ?, recurrence_value = ?, recurrence_unit = ?,
            reminder_offset = ?, is_active = ?, auto_restart = ?, updated_at = ?
          WHERE id = ?`,
          [
            task.title,
            task.description || '',
            task.startDateTime,
            task.recurrenceType,
            task.recurrenceValue,
            task.recurrenceUnit || null,
            task.reminderOffset,
            task.isActive ? 1 : 0,
            task.autoRestart ? 1 : 0,
            now,
            task.id
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
    
    // If the task has a current cycle, update the notification
    if (task.currentCycle) {
      await scheduleTaskNotification({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.currentCycle.dueDate,
        reminderOffset: task.reminderOffset
      });
    }
    
    // Return the updated task
    return {
      ...task,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Delete a task and all its cycles
 * @param taskId The task ID to delete
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        // Delete task cycles first (foreign key constraint)
        tx.executeSql(
          'DELETE FROM task_cycles WHERE task_id = ?',
          [taskId],
          () => {
            // Then delete the task
            tx.executeSql(
              'DELETE FROM tasks WHERE id = ?',
              [taskId],
              () => resolve(),
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Get all tasks with their current cycles
 * @returns Array of tasks with current cycles
 */
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    // Get all tasks
    const tasks = await new Promise<Task[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            id, title, description, start_date_time, recurrence_type,
            recurrence_value, recurrence_unit, reminder_offset,
            is_active, auto_restart, created_at, updated_at
          FROM tasks
          ORDER BY created_at DESC`,
          [],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              tasks.push({
                id: row.id,
                title: row.title,
                description: row.description,
                startDateTime: row.start_date_time,
                recurrenceType: row.recurrence_type,
                recurrenceValue: row.recurrence_value,
                recurrenceUnit: row.recurrence_unit,
                reminderOffset: row.reminder_offset,
                isActive: Boolean(row.is_active),
                autoRestart: Boolean(row.auto_restart),
                createdAt: row.created_at,
                updatedAt: row.updated_at
              });
            }
            resolve(tasks);
          },
          (_, error) => reject(error)
        );
      });
    });
    
    // Get current cycles for each task
    for (const task of tasks) {
      task.currentCycle = await getCurrentCycleForTask(task.id);
    }
    
    return tasks;
  } catch (error) {
    console.error('Error getting all tasks:', error);
    throw error;
  }
};

/**
 * Get a task by ID with its current cycle
 * @param taskId The task ID
 * @returns The task or null if not found
 */
export const getTaskById = async (taskId: number): Promise<Task | null> => {
  try {
    // Get the task
    const task = await new Promise<Task | null>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            id, title, description, start_date_time, recurrence_type,
            recurrence_value, recurrence_unit, reminder_offset,
            is_active, auto_restart, created_at, updated_at
          FROM tasks
          WHERE id = ?`,
          [taskId],
          (_, { rows }) => {
            if (rows.length === 0) {
              resolve(null);
              return;
            }
            
            const row = rows.item(0);
            resolve({
              id: row.id,
              title: row.title,
              description: row.description,
              startDateTime: row.start_date_time,
              recurrenceType: row.recurrence_type,
              recurrenceValue: row.recurrence_value,
              recurrenceUnit: row.recurrence_unit,
              reminderOffset: row.reminder_offset,
              isActive: Boolean(row.is_active),
              autoRestart: Boolean(row.auto_restart),
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          },
          (_, error) => reject(error)
        );
      });
    });
    
    if (!task) return null;
    
    // Get the current cycle
    task.currentCycle = await getCurrentCycleForTask(taskId);
    
    return task;
  } catch (error) {
    console.error('Error getting task by ID:', error);
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
    return await new Promise<TaskCycle | null>((resolve, reject) => {
      db.transaction(tx => {
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

/**
 * Mark a task cycle as completed
 * @param cycleId The cycle ID
 * @returns The updated cycle
 */
export const completeTaskCycle = async (cycleId: number): Promise<TaskCycle> => {
  try {
    const now = new Date().toISOString();
    
    // Update the cycle
    await new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE task_cycles SET
            is_completed = ?, completed_date = ?
          WHERE id = ?`,
          [1, now, cycleId],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
    
    // Get the updated cycle
    const cycle = await new Promise<TaskCycle>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
            id, task_id, start_date, due_date, is_completed,
            is_overdue, completed_date, created_at
          FROM task_cycles
          WHERE id = ?`,
          [cycleId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject(new Error('Cycle not found'));
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
    
    // Get the task to check if we need to create a new cycle
    const task = await getTaskById(cycle.taskId);
    
    if (task && task.autoRestart) {
      // Create the next cycle
      const nextStartDate = new Date(cycle.dueDate).toISOString();
      await createTaskCycle(
        task.id,
        nextStartDate,
        task.recurrenceType,
        task.recurrenceValue,
        task.recurrenceUnit
      );
    }
    
    return cycle;
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