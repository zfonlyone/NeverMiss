import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { TaskHistory } from '../models/TaskHistory';
import APP_INFO, { getFullVersion } from '../utils/version';

// 存储键
const STORAGE_KEYS = {
  TASKS: '@NeverMiss:tasks',
  TASK_CYCLES: '@NeverMiss:task_cycles',
  TASK_HISTORY: '@NeverMiss:task_history',
  DATABASE_VERSION: 'nevermiss_db_version'
};

// 防止重复初始化标志
let isInitialized = false;

// 初始化存储
export const initStorage = async (): Promise<void> => {
  // 如果已经初始化，则退出
  if (isInitialized) {
    console.log('存储已经初始化，跳过');
    return;
  }

  try {
    // 检查是否已初始化
    const version = await AsyncStorage.getItem(STORAGE_KEYS.DATABASE_VERSION);
    
    if (!version) {
      // 首次初始化
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.DATABASE_VERSION, APP_INFO.DATABASE_VERSION.toString());
      console.log(`存储初始化成功，版本: ${APP_INFO.DATABASE_VERSION}`);
    } else {
      console.log(`存储已初始化，版本: ${version}`);
      
      // 版本迁移逻辑
      const currentVersion = parseInt(version);
      if (currentVersion < APP_INFO.DATABASE_VERSION) {
        console.log(`执行从版本 ${currentVersion} 到 ${APP_INFO.DATABASE_VERSION} 的数据迁移`);
        // 这里实现版本迁移逻辑
        
        // 迁移完成后更新版本号
        await AsyncStorage.setItem(STORAGE_KEYS.DATABASE_VERSION, APP_INFO.DATABASE_VERSION.toString());
        console.log(`数据库版本已更新至 ${APP_INFO.DATABASE_VERSION}`);
      }
    }
    // 设置初始化标志
    isInitialized = true;
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
      task.dateType = task.dateType || 'solar';
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
    const tasks = tasksJson ? JSON.parse(tasksJson) : [];
    // 确保所有任务都有日期类型字段
    return tasks.map((task: Task) => ({
      ...task,
      dateType: task.dateType || 'solar',
    }));
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
        cycles[index] = {
          ...cycles[index],
          ...cycle,
          dateType: cycle.dateType || cycles[index].dateType || 'solar'
        };
      }
    } else {
      // 添加新周期
      const newId = cycles.length > 0 ? Math.max(...cycles.map(c => c.id || 0)) + 1 : 1;
      cycle = {
        ...cycle,
        id: newId,
        dateType: cycle.dateType || 'solar'
      };
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
    const cycles = cyclesJson ? JSON.parse(cyclesJson) : [];
    // 确保所有周期都有日期类型字段
    return cycles.map((cycle: TaskCycle) => ({
      ...cycle,
      dateType: cycle.dateType || 'solar',
    }));
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

/**
 * Get task history by action type
 * @param action The action type to filter by
 * @returns Array of task history with the specified action
 */
export const getTaskHistoryByAction = async (action: string): Promise<TaskHistory[]> => {
  try {
    const history = await getTaskHistory();
    return history.filter(item => item.action === action);
  } catch (error) {
    console.error(`获取动作类型 ${action} 的任务历史时出错:`, error);
    throw error;
  }
};

// 数据库信息和管理
export const getDatabaseInfo = async (): Promise<{
  version: number;
  appVersion: string;
  appFullVersion: string;
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
      version: version ? parseInt(version) : APP_INFO.DATABASE_VERSION,
      appVersion: APP_INFO.VERSION,
      appFullVersion: getFullVersion(),
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
    
    // 使用版本配置文件中的版本信息
    const data = {
      appVersion: APP_INFO.VERSION,
      appFullVersion: getFullVersion(), 
      dbVersion: APP_INFO.DATABASE_VERSION,
      version: APP_INFO.DATABASE_VERSION, // 保留旧版本字段以兼容
      buildNumber: APP_INFO.BUILD_NUMBER,
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
    
    // 检查数据库版本兼容性
    const importedDbVersion = data.dbVersion || data.version || 0;
    if (importedDbVersion < APP_INFO.MIN_DATABASE_VERSION) {
      throw new Error(`导入的数据库版本 (${importedDbVersion}) 低于最低支持版本 (${APP_INFO.MIN_DATABASE_VERSION})`);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_CYCLES, JSON.stringify(data.cycles));
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(data.history));
    await AsyncStorage.setItem(STORAGE_KEYS.DATABASE_VERSION, APP_INFO.DATABASE_VERSION.toString());
    
    console.log('数据导入成功');
    return true;
  } catch (error) {
    console.error('导入数据时出错:', error);
    throw error;
  }
};

// 默认导出对象，包含所有导出的函数
export default {
  saveTask,
  getTasks,
  getTaskById,
  deleteTask,
  saveTaskCycle,
  getTaskCyclesByTaskId,
  getTaskCycles,
  saveTaskHistory,
  getTaskHistory,
  getTaskHistoryByAction,
  deleteTaskCyclesByTaskId,
  deleteTaskHistoryByTaskId
}; 