import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { TaskHistory } from '../models/TaskHistory';

// 存储键
const STORAGE_KEYS = {
  TASKS: 'nevermiss_tasks',
  TASK_CYCLES: 'nevermiss_task_cycles',
  TASK_HISTORY: 'nevermiss_task_history',
  DATABASE_VERSION: 'nevermiss_db_version'
};

// 数据库版本
const DATABASE_VERSION = 1;

// 初始化存储
export const initStorage = async (): Promise<void> => {
  try {
    // 检查是否已初始化
    const version = await AsyncStorage.getItem(STORAGE_KEYS.DATABASE_VERSION);
    
    if (!version) {
      // 首次初始化
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.DATABASE_VERSION, DATABASE_VERSION.toString());
      console.log('存储初始化成功');
    } else {
      console.log(`存储已初始化，版本: ${version}`);
      // 这里可以添加版本迁移逻辑
    }
  } catch (error) {
    console.error('初始化存储时出错:', error);
    throw error;
  }
};

// 任务相关操作
export const saveTask = async (task: Task): Promise<Task> => {
  try {
    const tasks = await getTasks();
    
    if (task.id) {
      // 更新现有任务
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks[index] = { ...task, updatedAt: new Date().toISOString() };
      }
    } else {
      // 添加新任务
      const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id || 0)) + 1 : 1;
      const now = new Date().toISOString();
      task.id = newId;
      task.createdAt = now;
      task.updatedAt = now;
      tasks.push(task);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return task;
  } catch (error) {
    console.error('保存任务时出错:', error);
    throw error;
  }
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('获取任务时出错:', error);
    throw error;
  }
};

export const getTaskById = async (id: number): Promise<Task | null> => {
  try {
    const tasks = await getTasks();
    return tasks.find(task => task.id === id) || null;
  } catch (error) {
    console.error(`获取任务 ID ${id} 时出错:`, error);
    throw error;
  }
};

export const deleteTask = async (id: number): Promise<boolean> => {
  try {
    const tasks = await getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (filteredTasks.length < tasks.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filteredTasks));
      
      // 同时删除相关的任务周期和历史记录
      await deleteTaskCyclesByTaskId(id);
      await deleteTaskHistoryByTaskId(id);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(`删除任务 ID ${id} 时出错:`, error);
    throw error;
  }
};

// 任务周期相关操作
export const saveTaskCycle = async (cycle: TaskCycle): Promise<TaskCycle> => {
  try {
    const cycles = await getTaskCycles();
    
    if (cycle.id) {
      // 更新现有周期
      const index = cycles.findIndex(c => c.id === cycle.id);
      if (index !== -1) {
        cycles[index] = { ...cycle };
      }
    } else {
      // 添加新周期
      const newId = cycles.length > 0 ? Math.max(...cycles.map(c => c.id || 0)) + 1 : 1;
      const now = new Date().toISOString();
      cycle.id = newId;
      cycle.createdAt = now;
      cycles.push(cycle);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify(cycles));
    return cycle;
  } catch (error) {
    console.error('保存任务周期时出错:', error);
    throw error;
  }
};

export const getTaskCycles = async (): Promise<TaskCycle[]> => {
  try {
    const cyclesJson = await AsyncStorage.getItem(STORAGE_KEYS.TASK_CYCLES);
    return cyclesJson ? JSON.parse(cyclesJson) : [];
  } catch (error) {
    console.error('获取任务周期时出错:', error);
    throw error;
  }
};

export const getTaskCyclesByTaskId = async (taskId: number): Promise<TaskCycle[]> => {
  try {
    const cycles = await getTaskCycles();
    return cycles.filter(cycle => cycle.taskId === taskId);
  } catch (error) {
    console.error(`获取任务 ID ${taskId} 的周期时出错:`, error);
    throw error;
  }
};

export const deleteTaskCycle = async (id: number): Promise<boolean> => {
  try {
    const cycles = await getTaskCycles();
    const filteredCycles = cycles.filter(cycle => cycle.id !== id);
    
    if (filteredCycles.length < cycles.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify(filteredCycles));
      
      // 同时删除相关的历史记录
      await deleteTaskHistoryByCycleId(id);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(`删除任务周期 ID ${id} 时出错:`, error);
    throw error;
  }
};

export const deleteTaskCyclesByTaskId = async (taskId: number): Promise<boolean> => {
  try {
    const cycles = await getTaskCycles();
    const filteredCycles = cycles.filter(cycle => cycle.taskId !== taskId);
    
    if (filteredCycles.length < cycles.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify(filteredCycles));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`删除任务 ID ${taskId} 的周期时出错:`, error);
    throw error;
  }
};

// 任务历史相关操作
export const saveTaskHistory = async (history: TaskHistory): Promise<TaskHistory> => {
  try {
    const historyItems = await getTaskHistory();
    
    if (history.id) {
      // 更新现有历史记录
      const index = historyItems.findIndex(h => h.id === history.id);
      if (index !== -1) {
        historyItems[index] = { ...history };
      }
    } else {
      // 添加新历史记录
      const newId = historyItems.length > 0 ? Math.max(...historyItems.map(h => h.id || 0)) + 1 : 1;
      history.id = newId;
      if (!history.timestamp) {
        history.timestamp = new Date().toISOString();
      }
      historyItems.push(history);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(historyItems));
    return history;
  } catch (error) {
    console.error('保存任务历史时出错:', error);
    throw error;
  }
};

export const getTaskHistory = async (): Promise<TaskHistory[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.TASK_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('获取任务历史时出错:', error);
    throw error;
  }
};

export const getTaskHistoryByTaskId = async (taskId: number): Promise<TaskHistory[]> => {
  try {
    const history = await getTaskHistory();
    return history.filter(item => item.taskId === taskId);
  } catch (error) {
    console.error(`获取任务 ID ${taskId} 的历史时出错:`, error);
    throw error;
  }
};

export const deleteTaskHistoryByTaskId = async (taskId: number): Promise<boolean> => {
  try {
    const history = await getTaskHistory();
    const filteredHistory = history.filter(item => item.taskId !== taskId);
    
    if (filteredHistory.length < history.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(filteredHistory));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`删除任务 ID ${taskId} 的历史时出错:`, error);
    throw error;
  }
};

export const deleteTaskHistoryByCycleId = async (cycleId: number): Promise<boolean> => {
  try {
    const history = await getTaskHistory();
    const filteredHistory = history.filter(item => item.cycleId !== cycleId);
    
    if (filteredHistory.length < history.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(filteredHistory));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`删除周期 ID ${cycleId} 的历史时出错:`, error);
    throw error;
  }
};

// 数据库信息和管理
export const getDatabaseInfo = async (): Promise<{
  version: number;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}> => {
  try {
    const version = await AsyncStorage.getItem(STORAGE_KEYS.DATABASE_VERSION);
    const tasks = await getTasks();
    const cycles = await getTaskCycles();
    const history = await getTaskHistory();
    
    return {
      version: version ? parseInt(version) : 0,
      tasksCount: tasks.length,
      cyclesCount: cycles.length,
      historyCount: history.length
    };
  } catch (error) {
    console.error('获取数据库信息时出错:', error);
    throw error;
  }
};

export const resetStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify([]));
    console.log('存储已重置');
  } catch (error) {
    console.error('重置存储时出错:', error);
    throw error;
  }
};

// 导出数据
export const exportData = async (): Promise<string> => {
  try {
    const tasks = await getTasks();
    const cycles = await getTaskCycles();
    const history = await getTaskHistory();
    
    const data = {
      version: DATABASE_VERSION,
      tasks,
      cycles,
      history,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data);
  } catch (error) {
    console.error('导出数据时出错:', error);
    throw error;
  }
};

// 导入数据
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.tasks || !data.cycles || !data.history) {
      throw new Error('无效的数据格式');
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify(data.cycles));
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(data.history));
    
    console.log('数据导入成功');
    return true;
  } catch (error) {
    console.error('导入数据时出错:', error);
    throw error;
  }
}; 