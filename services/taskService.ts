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
  WeekOfMonth,
} from '../models/Task';
import { TaskHistory } from '../models/TaskHistory';
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
  saveTaskHistory,
  getTaskHistory,
  getTaskHistoryByAction as getHistoryByAction
} from './storageService';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import lunarService from './lunarService';
import { setCheckOverdueTasksCallback } from './backgroundTaskService';

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
    // 验证输入数据
    if (!input.title) {
      throw new Error('任务标题不能为空');
    }
    
    // 处理日期计算
    let startDate = input.startDate;
    let dueDate = input.dueDate;
    
    // 如果使用截止日期计算
    if (input.useDueDateToCalculate && dueDate && input.isRecurring) {
      // 从截止日期计算开始日期
      startDate = calculateStartDate(dueDate, input.recurrencePattern, input.dateType);
    } 
    // 如果使用开始日期计算
    else if (!input.useDueDateToCalculate && startDate && input.isRecurring) {
      // 从开始日期计算截止日期
      dueDate = calculateDueDate(startDate, input.recurrencePattern, input.dateType);
    }
    // 默认情况：如果没有提供开始日期，使用当前日期
    else if (!startDate) {
      startDate = new Date().toISOString();
      // 如果没有提供截止日期，计算一个默认的截止日期
      if (!dueDate && input.isRecurring) {
        dueDate = calculateDueDate(startDate, input.recurrencePattern, input.dateType);
      } else if (!dueDate) {
        // 如果不是重复任务，默认截止日期为一天后
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = tomorrow.toISOString();
      }
    }
    
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
      isLunar: input.isLunar === true,
      isRecurring: input.isRecurring === true,
      reminderDays: input.reminderDays || 0,
      reminderHours: input.reminderHours || 0,
      reminderMinutes: input.reminderMinutes || 0,
      isActive: input.isActive !== undefined ? input.isActive : true,
      autoRestart: input.autoRestart !== undefined ? input.autoRestart : true,
      syncToCalendar: input.syncToCalendar !== undefined ? input.syncToCalendar : false,
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      backgroundColor: input.backgroundColor,
      specialDate: input.specialDate,
    };
    
    // 保存任务
    const savedTask = await saveTask(newTask);
    
    // 创建第一个任务周期
    const cycle: TaskCycle = {
      id: 0, // 将由 saveTaskCycle 分配
      taskId: savedTask.id,
      startDate: startDate,
      dueDate: dueDate,
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
 */
export const calculateDueDate = (startDate: string, recurrencePattern: RecurrencePattern, dateType: DateType = 'solar'): string => {
  try {
    console.log(`计算截止日期: 开始日期=${startDate}, 重复模式=${JSON.stringify(recurrencePattern)}, 日期类型=${dateType}`);
    
    let start: Date;
    if (dateType === 'lunar') {
      const lunarDate = lunarService.parseLunarDate(startDate);
      console.log(`解析农历日期: ${JSON.stringify(lunarDate)}`);
      start = lunarService.convertToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
    } else {
      start = new Date(startDate);
    }
    
    let result: string;
    
    switch (recurrencePattern.type) {
      case 'daily':
        result = addDays(start, recurrencePattern.value).toISOString();
        console.log(`每天循环: 间隔=${recurrencePattern.value}天, 结果=${result}`);
        break;
        
      case 'weekly':
        if (recurrencePattern.weekDay !== undefined) {
          // 找到下一个指定的星期几
          let dueDate = start;
          const targetDay = recurrencePattern.weekDay;
          console.log(`每周循环: 目标星期=${targetDay}, 当前星期=${dueDate.getDay()}`);
          
          // 如果当前日期就是目标星期几，则跳到下一周同一天
          if (dueDate.getDay() === targetDay) {
            dueDate = addDays(dueDate, 7);
          } else {
            // 找到当前周或下一周的目标星期几
            while (dueDate.getDay() !== targetDay) {
              dueDate = addDays(dueDate, 1);
            }
          }
          result = dueDate.toISOString();
          console.log(`每周特定星期: 结果=${result}`);
        } else {
          // 每隔几周
          result = addDays(start, recurrencePattern.value * 7).toISOString();
          console.log(`每隔多周: 间隔=${recurrencePattern.value}周, 结果=${result}`);
        }
        break;
        
      case 'monthly':
        if (recurrencePattern.monthDay !== undefined) {
          // 下个月的指定日期
          const dueDate = new Date(start);
          dueDate.setMonth(dueDate.getMonth() + 1);
          
          // 确保日期有效（例如，2月30日会被转换为3月的某一天）
          const originalMonth = dueDate.getMonth();
          dueDate.setDate(recurrencePattern.monthDay);
          
          // 如果月份变了（例如，试图将日期设为2月31日），恢复到该月的最后一天
          if (dueDate.getMonth() !== originalMonth) {
            dueDate.setMonth(originalMonth + 1);
            dueDate.setDate(0); // 设置为上个月的最后一天
          }
          
          result = dueDate.toISOString();
          console.log(`每月特定日期: 日期=${recurrencePattern.monthDay}, 结果=${result}`);
        } else {
          // 每隔几个月
          const dueDate = new Date(start);
          dueDate.setMonth(dueDate.getMonth() + recurrencePattern.value);
          
          // 处理月末问题
          const startDay = start.getDate();
          const daysInTargetMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
          if (startDay > daysInTargetMonth) {
            dueDate.setDate(daysInTargetMonth);
          }
          
          result = dueDate.toISOString();
          console.log(`每隔多月: 间隔=${recurrencePattern.value}月, 结果=${result}`);
        }
        break;
        
      case 'yearly':
        if (dateType === 'lunar') {
          result = calculateLunarYearlyDueDate(startDate, recurrencePattern);
          console.log(`农历每年: 结果=${result}`);
        } else {
          if (recurrencePattern.yearDay !== undefined) {
            // 指定年中的第几天
            const startYear = start.getFullYear();
            const startOfYear = new Date(startYear, 0, 1);
            startOfYear.setDate(recurrencePattern.yearDay);
            if (startOfYear <= start) {
              // If the specified day has already passed this year, move to next year
              startOfYear.setFullYear(startYear + 1);
            }
            result = startOfYear.toISOString();
            console.log(`每年第几天: 天=${recurrencePattern.yearDay}, 结果=${result}`);
          } else if (recurrencePattern.month !== undefined && recurrencePattern.monthDay !== undefined) {
            // 指定年中的第几月第几天（例如：每年3月15日）
            const dueDate = new Date(start);
            let yearOffset = 0;
            
            // 检查当前日期是否已经过了目标月日
            if (dueDate.getMonth() + 1 > recurrencePattern.month || 
                (dueDate.getMonth() + 1 === recurrencePattern.month && dueDate.getDate() >= recurrencePattern.monthDay)) {
              // If the specified month/day has already passed this year, move to next year
              yearOffset = 1;
            }
            
            dueDate.setFullYear(dueDate.getFullYear() + yearOffset);
            dueDate.setMonth(recurrencePattern.month - 1);
            
            // 处理月末问题（例如2月30日）
            const daysInMonth = new Date(dueDate.getFullYear(), recurrencePattern.month, 0).getDate();
            if (recurrencePattern.monthDay > daysInMonth) {
              dueDate.setDate(daysInMonth);
            } else {
              dueDate.setDate(recurrencePattern.monthDay);
            }
            
            result = dueDate.toISOString();
            console.log(`每年特定月日: 月=${recurrencePattern.month}, 日=${recurrencePattern.monthDay}, 结果=${result}`);
          } else {
            // 默认为每隔几年
            const dueDate = new Date(start);
            dueDate.setFullYear(dueDate.getFullYear() + recurrencePattern.value);
            result = dueDate.toISOString();
            console.log(`每隔多年: 间隔=${recurrencePattern.value}年, 结果=${result}`);
          }
        }
        break;
        
      case 'weekOfMonth':
        if (dateType === 'lunar') {
          result = calculateLunarWeekOfMonthDueDate(startDate, recurrencePattern);
          console.log(`农历每月第几周: 结果=${result}`);
        } else {
          // 某月第几周的星期几（例如：每月第三个星期二）
          if (recurrencePattern.month !== undefined 
              && recurrencePattern.weekOfMonth !== undefined 
              && recurrencePattern.weekDay !== undefined) {
            result = calculateWeekOfMonthDueDate(start, recurrencePattern);
            console.log(`每月第几周星期几: 月=${recurrencePattern.month}, 周=${recurrencePattern.weekOfMonth}, 星期=${recurrencePattern.weekDay}, 结果=${result}`);
          } else {
            throw new Error('weekOfMonth 类型必须指定 month、weekOfMonth 和 weekDay');
          }
        }
        break;
        
      case 'custom':
        switch (recurrencePattern.unit) {
          case 'days':
            result = addDays(start, recurrencePattern.value).toISOString();
            console.log(`自定义天数: 间隔=${recurrencePattern.value}天, 结果=${result}`);
            break;
          case 'weeks':
            result = addDays(start, recurrencePattern.value * 7).toISOString();
            console.log(`自定义周数: 间隔=${recurrencePattern.value}周, 结果=${result}`);
            break;
          case 'months':
            const dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + recurrencePattern.value);
            
            // 处理月末问题
            const startDay = start.getDate();
            const daysInTargetMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
            if (startDay > daysInTargetMonth) {
              dueDate.setDate(daysInTargetMonth);
            }
            
            result = dueDate.toISOString();
            console.log(`自定义月数: 间隔=${recurrencePattern.value}月, 结果=${result}`);
            break;
          case 'years':
            if (dateType === 'lunar') {
              result = calculateLunarYearlyCustomDueDate(startDate, recurrencePattern.value);
              console.log(`农历自定义年数: 间隔=${recurrencePattern.value}年, 结果=${result}`);
            } else {
              const dueDate = new Date(start);
              dueDate.setFullYear(dueDate.getFullYear() + recurrencePattern.value);
              result = dueDate.toISOString();
              console.log(`自定义年数: 间隔=${recurrencePattern.value}年, 结果=${result}`);
            }
            break;
          default:
            throw new Error(`不支持的重复单位: ${recurrencePattern.unit}`);
        }
        break;
        
      default:
        throw new Error(`不支持的重复类型: ${recurrencePattern.type}`);
    }
    
    console.log(`最终计算结果 - 开始日期: ${startDate}, 截止日期: ${result}`);
    return result;
  } catch (error) {
    console.error('计算截止日期出错:', error);
    // 出错时返回默认截止日期（当前日期加一天）
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 1);
    const result = fallbackDate.toISOString();
    console.log(`计算出错，使用默认截止日期: ${result}`);
    return result;
  }
};

/**
 * 计算某月第几周的星期几
 */
const calculateWeekOfMonthDueDate = (start: Date, recurrencePattern: RecurrencePattern): string => {
  const { month, weekOfMonth, weekDay } = recurrencePattern;
  if (month === undefined || weekOfMonth === undefined || weekDay === undefined) {
    throw new Error('月份、第几周和星期几都必须指定');
  }
  
  let targetYear = start.getFullYear();
  let targetMonth = month - 1;  // JavaScript months are 0-indexed
  
  // If the date has already passed this month, move to next occurrence
  if (start.getMonth() === targetMonth) {
    // Calculate the target date this month
    const currentMonthTarget = getDateOfWeekDayInMonth(targetYear, targetMonth, weekOfMonth, weekDay);
    // If already passed, move to next month or year
    if (currentMonthTarget < start) {
      targetMonth++;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
  } else if (start.getMonth() > targetMonth) {
    // Move to next year
    targetYear += 1;
  }
  
  // Get the date
  const dueDate = getDateOfWeekDayInMonth(targetYear, targetMonth, weekOfMonth, weekDay);
  return dueDate.toISOString();
};

/**
 * 获取某月第几周的星期几的具体日期
 */
const getDateOfWeekDayInMonth = (year: number, month: number, weekOfMonth: WeekOfMonth, weekDay: WeekDay): Date => {
  // 获取该月第一天
  const firstDayOfMonth = new Date(year, month, 1);
  
  // 计算该月第一个指定的星期几
  let dayOffset = weekDay - firstDayOfMonth.getDay();
  if (dayOffset < 0) dayOffset += 7;
  
  // 计算第几周
  const targetDate = new Date(year, month, 1 + dayOffset + (weekOfMonth - 1) * 7);
  
  // 处理"最后一周"的情况
  if (weekOfMonth === 5) {
    // 获取下个月第一天
    const firstDayOfNextMonth = new Date(year, month + 1, 1);
    // 倒推找到最后一个指定的星期几
    let lastWeekdayOfMonth = new Date(firstDayOfNextMonth);
    lastWeekdayOfMonth.setDate(lastWeekdayOfMonth.getDate() - 1);
    while (lastWeekdayOfMonth.getDay() !== weekDay) {
      lastWeekdayOfMonth.setDate(lastWeekdayOfMonth.getDate() - 1);
    }
    return lastWeekdayOfMonth;
  }
  
  return targetDate;
};

/**
 * 计算农历的年度重复日期
 */
const calculateLunarYearlyDueDate = (startDate: string, recurrencePattern: RecurrencePattern): string => {
  try {
    // 解析农历日期
    const lunarStart = lunarService.parseLunarDate(startDate);
    
    // 获取当前农历年
    const currentLunarDate = lunarService.getTodayLunar();
    
    // 计算下一个农历日期
    let targetYear = currentLunarDate.year;
    let targetMonth = lunarStart.month;
    let targetDay = lunarStart.day;
    let isLeapMonth = recurrencePattern.isLeapMonth || false;
    
    // 如果当前日期已经过了今年的对应日期，则推到明年
    if (currentLunarDate.month > targetMonth || 
        (currentLunarDate.month === targetMonth && currentLunarDate.day >= targetDay)) {
      targetYear++;
    }
    
    // 处理闰月情况
    if (isLeapMonth) {
      try {
        // 检查目标年份是否有该闰月
        const lunar = require('lunar-javascript').Lunar;
        const lunarYear = lunar.fromDate(new Date(targetYear, 0, 1));
        const leapMonth = lunarYear.getLeapMonth();
        
        if (leapMonth !== targetMonth) {
          console.log(`${targetYear}年没有闰${targetMonth}月，使用普通月份`);
          // 如果没有指定的闰月，则使用普通月份
          isLeapMonth = false;
        }
      } catch (error) {
        console.error('检查闰月出错:', error);
        isLeapMonth = false; // 出错时默认使用普通月份
      }
    }
    
    // 转换回公历日期
    try {
      const targetSolarDate = lunarService.lunarToSolar(targetYear, targetMonth, targetDay, isLeapMonth);
      return targetSolarDate.toISOString();
    } catch (error) {
      console.error('农历转公历出错:', error);
      // 如果有错误（例如不存在的日期），返回默认日期
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 1); // 设置为明天
      return fallbackDate.toISOString();
    }
  } catch (error) {
    console.error('计算农历年度重复日期出错:', error);
    // 最终兜底方案
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 1); // 设置为明天
    return fallbackDate.toISOString();
  }
};

/**
 * 计算农历的每月第几周星期几
 */
const calculateLunarWeekOfMonthDueDate = (startDate: string, recurrencePattern: RecurrencePattern): string => {
  try {
    if (!recurrencePattern.weekOfMonth || !recurrencePattern.weekDay) {
      throw new Error('weekOfMonth 和 weekDay 必须指定');
    }
    
    // 解析农历日期
    const lunarStart = lunarService.parseLunarDate(startDate);
    
    // 获取当前农历年月
    const currentLunarDate = lunarService.getTodayLunar();
    
    // 目标农历月
    let targetYear = currentLunarDate.year;
    let targetMonth = recurrencePattern.month || lunarStart.month;
    const isLeapMonth = recurrencePattern.isLeapMonth || false;
    
    // 验证月份
    if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      console.error('无效的农历月份:', targetMonth);
      targetMonth = currentLunarDate.month;
    }
    
    // 如果当前月份已经过了，则推到下一年
    if (currentLunarDate.month > targetMonth) {
      targetYear++;
    }
    
    try {
      // 获取该农历月的第一天
      const firstDayOfLunarMonth = lunarService.lunarToSolar(targetYear, targetMonth, 1, isLeapMonth);
      
      // 转换为公历的计算
      const solarRecurrencePattern = {
        ...recurrencePattern,
        month: firstDayOfLunarMonth.getMonth() + 1 // 公历月份是0-indexed
      };
      
      return calculateWeekOfMonthDueDate(firstDayOfLunarMonth, solarRecurrencePattern);
    } catch (error) {
      console.error('计算农历周期日期出错:', error);
      // 回退到默认日期 - 下个月今天
      const fallbackDate = new Date();
      fallbackDate.setMonth(fallbackDate.getMonth() + 1);
      return fallbackDate.toISOString();
    }
  } catch (error) {
    console.error('计算农历每月第几周星期几出错:', error);
    // 兜底方案
    const fallbackDate = new Date();
    fallbackDate.setMonth(fallbackDate.getMonth() + 1);
    return fallbackDate.toISOString();
  }
};

/**
 * 计算农历的自定义年度重复
 */
const calculateLunarYearlyCustomDueDate = (startDate: string, yearOffset: number): string => {
  try {
    // 参数验证
    if (isNaN(yearOffset) || yearOffset < 0) {
      console.error('无效的年份偏移:', yearOffset);
      yearOffset = 1; // 默认为1年
    }
    
    // 解析农历日期
    const lunarStart = lunarService.parseLunarDate(startDate);
    
    // 计算目标农历年
    const targetYear = lunarStart.year + yearOffset;
    
    // 验证年份有效性
    if (isNaN(targetYear) || targetYear < 1900 || targetYear > 2100) {
      console.error('计算的目标年份无效:', targetYear);
      // 使用兜底方案
      const fallbackDate = new Date();
      fallbackDate.setFullYear(fallbackDate.getFullYear() + yearOffset);
      return fallbackDate.toISOString();
    }
    
    // 转换回公历日期
    try {
      const targetSolarDate = lunarService.lunarToSolar(targetYear, lunarStart.month, lunarStart.day, lunarStart.isLeap);
      return targetSolarDate.toISOString();
    } catch (error) {
      console.error('农历转公历出错:', error);
      // 如果有错误（例如不存在的日期），使用兜底方案
      const fallbackDate = new Date();
      fallbackDate.setFullYear(fallbackDate.getFullYear() + yearOffset);
      return fallbackDate.toISOString();
    }
  } catch (error) {
    console.error('计算农历自定义年度重复日期出错:', error);
    // 最终兜底方案
    const fallbackDate = new Date();
    fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
    return fallbackDate.toISOString();
  }
};

/**
 * 获取任务的最后一个周期
 */
export const getLastTaskCycle = async (taskId: number): Promise<TaskCycle | null> => {
  try {
    const cycles = await getTaskCyclesByTaskId(taskId);
    if (!cycles || cycles.length === 0) {
      return null;
    }
    
    // 按创建时间降序排序，获取最新的周期
    return cycles.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  } catch (error) {
    console.error('Error getting last task cycle:', error);
    return null;
  }
};

/**
 * Create a task cycle
 */
export async function createTaskCycle(task: Task): Promise<TaskCycle> {
  try {
    if (task.recurrencePattern.type === 'weekOfMonth' && 
        (task.recurrencePattern.month === undefined || 
         task.recurrencePattern.weekOfMonth === undefined || 
         task.recurrencePattern.weekDay === undefined)) {
      throw new Error('weekOfMonth 类型必须指定 month、weekOfMonth 和 weekDay');
    }
    
    const lastCycle = await getLastTaskCycle(task.id);
    
    // 初始开始日期和到期日期
    let startDate = new Date().toISOString();
    let dueDate = startDate;
    
    try {
      if (lastCycle && task.lastCompletedDate) {
        // 如果任务已完成，则从当前日期开始计算新周期
        console.log(`任务 ID ${task.id} 已完成，基于当前日期创建新周期`);
        
        // 使用当前日期作为开始日期
        startDate = new Date().toISOString();
        
        // 计算新的到期日期
        dueDate = calculateDueDate(startDate, task.recurrencePattern, task.dateType);
      } else if (lastCycle) {
        console.log(`任务 ID ${task.id} 基于上一个周期计算新周期, 上一个周期: ${JSON.stringify({
          id: lastCycle.id,
          startDate: lastCycle.startDate,
          dueDate: lastCycle.dueDate
        })}`);
        
        // 检查是否有有效的起止日期
        if (!lastCycle.startDate || !lastCycle.dueDate) {
          throw new Error('上一个周期的起止日期不完整');
        }
        
        // 基于上一个周期的到期日期计算新的开始日期
        startDate = lastCycle.dueDate;
        
        // 计算新的到期日期
        dueDate = calculateDueDate(startDate, task.recurrencePattern, task.dateType);
      } else {
        // 首个周期，使用当前时间作为开始日期
        console.log(`任务 ID ${task.id} 没有上一个周期，使用当前时间创建第一个周期`);
        startDate = new Date().toISOString();
        
        // 计算首个周期的到期日期
        dueDate = calculateDueDate(startDate, task.recurrencePattern, task.dateType);
      }
      
      console.log(`任务 ID ${task.id} 计算出新周期: 开始日期=${startDate}, 截止日期=${dueDate}`);
    } catch (error) {
      console.error('计算日期时出错，使用默认日期:', error);
      // 使用当前日期加一天作为回退方案
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 1);
      dueDate = fallbackDate.toISOString();
    }
    
    // 创建新的任务周期
    const cycle: TaskCycle = {
      id: Date.now(),
      taskId: task.id,
      startDate: startDate,
      dueDate: dueDate,
      dateType: task.dateType,
      isCompleted: false,
      isOverdue: false,
      createdAt: new Date().toISOString()
    };
    
    // 保存新的任务周期
    await saveTaskCycle(cycle);
    
    // 安排提醒
    try {
      await scheduleTaskNotification(task, cycle);
    } catch (notificationError) {
      console.error('设置通知时出错:', notificationError);
      // 继续执行，不中断周期创建
    }
    
    console.log(`已为任务 ID ${task.id} 创建新周期 ID ${cycle.id}, 开始日期=${cycle.startDate}, 截止日期=${cycle.dueDate}`);
    return cycle;
  } catch (error) {
    console.error('Error creating task cycle:', error);
    throw error;
  }
}

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
      isLunar: input.isLunar,
      isRecurring: input.isRecurring === true,
      reminderDays: input.reminderDays || 0,
      reminderHours: input.reminderHours || 0,
      reminderMinutes: input.reminderMinutes || 0,
      isActive: input.isActive !== undefined ? input.isActive : existingTask.isActive,
      autoRestart: input.autoRestart !== undefined ? input.autoRestart : existingTask.autoRestart,
      syncToCalendar: input.syncToCalendar !== undefined ? input.syncToCalendar : existingTask.syncToCalendar,
      updatedAt: new Date().toISOString(),
      tags: input.tags || existingTask.tags,
      backgroundColor: input.backgroundColor !== undefined ? input.backgroundColor : existingTask.backgroundColor,
      specialDate: input.specialDate !== undefined ? input.specialDate : existingTask.specialDate,
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
 * Get the next cycle's start and due dates
 */
const getNextCycleDates = (task: Task, currentCycle: TaskCycle): { startDate: string; dueDate: string } => {
  const startDate = new Date(currentCycle.dueDate);
  const duration = new Date(currentCycle.dueDate).getTime() - new Date(currentCycle.startDate).getTime();
  let newStartDate: Date;
  let newDueDate: Date;
  
  switch (task.recurrencePattern.type) {
    case 'daily':
      newStartDate = addDays(startDate, task.recurrencePattern.value);
      newDueDate = new Date(newStartDate.getTime() + duration);
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
      newDueDate = new Date(newStartDate.getTime() + duration);
      break;
      
    case 'monthly':
      if (task.recurrencePattern.monthDay !== undefined) {
        // 下个月的指定日期
        newStartDate = new Date(startDate);
        newStartDate.setMonth(newStartDate.getMonth() + 1);
        newStartDate.setDate(task.recurrencePattern.monthDay);
      } else {
        // 每隔几个月
        newStartDate = new Date(startDate);
        newStartDate.setMonth(newStartDate.getMonth() + task.recurrencePattern.value);
      }
      newDueDate = new Date(newStartDate.getTime() + duration);
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

/**
 * Complete a task cycle
 */
export async function completeTaskCycle(
  task: Task,
  cycle: TaskCycle,
  skipNextCycle: boolean = false
): Promise<{ task: Task; cycle: TaskCycle; newCycle?: TaskCycle }> {
  try {
    if (task.recurrencePattern.type === 'weekOfMonth' && 
        (task.recurrencePattern.month === undefined || 
         task.recurrencePattern.weekOfMonth === undefined || 
         task.recurrencePattern.weekDay === undefined)) {
      throw new Error('weekOfMonth 类型必须指定 month、weekOfMonth 和 weekDay');
    }
    
    // 更新周期为已完成
    const now = new Date().toISOString();
    cycle.isCompleted = true;
    cycle.completedDate = now;
    cycle.isOverdue = false;
    
    // 更新任务最后完成日期
    task.lastCompletedDate = now;
    
    // 保存更改
    await saveTaskCycle(cycle);
    await saveTask(task);
    
    let newCycle: TaskCycle | undefined;
    
    // 如果任务仍然活跃且启用了自动重启，并且是重复任务，则创建下一个周期
    if (task.isActive && task.autoRestart && !skipNextCycle && task.isRecurring) {
      newCycle = await createTaskCycle(task);
      task.currentCycle = newCycle;
      await saveTask(task);
    }
    
    return { task, cycle, newCycle };
  } catch (error) {
    console.error('Error completing task cycle:', error);
    throw error;
  }
}

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
    
    // Save task history
    await saveTaskHistory({
      id: 0,
      taskId,
      cycleId,
      action: 'skip',
      timestamp: new Date().toISOString()
    });
    
    // Create next cycle
    const nextCycle = await createTaskCycle(task);
    
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
    
    // Get all tasks (包括逾期和已完成任务)
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
          id: 0,
          taskId: task.id,
          cycleId: task.currentCycle.id,
          action: 'overdue',
          timestamp: new Date().toISOString()
        });
        
        // 对所有逾期任务创建新的周期(不再检查autoRestart设置)
        // 对于未完成的逾期任务，使用截止日期作为新周期的开始日期
        const nextStartDate = task.currentCycle.dueDate;
        
        // 创建新周期，并自动更新为任务的当前周期
        const nextCycle = await createTaskCycle(task);
        
        // 更新任务的当前周期
        task.currentCycle = nextCycle;
        await saveTask(task);
        
        // 如果启用了日历同步，为新周期创建日历事件
        if (task.syncToCalendar) {
          try {
            const eventId = await addTaskToCalendar(task, nextCycle);
            task.calendarEventId = eventId;
            await saveTask(task);
          } catch (error) {
            console.error('Error syncing task to calendar:', error);
          }
        }
        
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
    // 方法1：检查当前周期是否完成
    const allTasks = await getAllTasks(true, true);
    const tasksWithCompletedCurrentCycle = allTasks.filter(task => 
      task.currentCycle && task.currentCycle.isCompleted
    );
    
    // 方法2：使用任务历史记录查找已完成的任务
    const completedHistory = await getHistoryByAction('completed');
    const completedTaskIds = new Set(completedHistory.map(history => history.taskId));
    
    // 从所有任务中查找历史记录中标记为已完成的任务
    const tasksWithCompletedHistory = allTasks.filter(task => 
      completedTaskIds.has(task.id)
    );
    
    // 合并两种方法找到的任务，去重
    const completedTasksSet = new Set([
      ...tasksWithCompletedCurrentCycle.map(task => task.id),
      ...tasksWithCompletedHistory.map(task => task.id)
    ]);
    
    // 返回所有已完成的任务
    return allTasks.filter(task => completedTasksSet.has(task.id));
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

/**
 * Get task history by action type
 * @param action The action type to filter by
 * @returns Array of task history with the specified action
 */
export const getTaskHistoryByAction = async (action: string): Promise<Array<{ task: Task; history: TaskHistory }>> => {
  try {
    // 使用存储服务中的函数获取指定动作类型的历史记录
    const filteredHistory = await getHistoryByAction(action);
    
    // 获取所有任务
    const allTasks = await getTasks();
    
    // 将历史记录与对应的任务关联起来
    const result: Array<{ task: Task; history: TaskHistory }> = [];
    for (const history of filteredHistory) {
      const task = allTasks.find(t => t.id === history.taskId);
      if (task) {
        result.push({ task, history });
      }
    }
    
    return result;
  } catch (error) {
    console.error(`获取${action}类型的任务历史时出错:`, error);
    throw error;
  }
};

/**
 * Get completed task history
 * @returns Array of task history with 'complete' action
 */
export const getCompletedTaskHistory = async (): Promise<Array<{ task: Task; history: TaskHistory }>> => {
  try {
    // 将'complete'改为'completed'以匹配completeTask中的动作类型
    const history = await getTaskHistoryByAction('completed');
    return history;
  } catch (error) {
    console.error('获取已完成任务历史时出错:', error);
    throw error;
  }
};

/**
 * Get overdue task history
 * @returns Array of task history with 'overdue' action
 */
export const getOverdueTaskHistory = async (): Promise<Array<{ task: Task; history: TaskHistory }>> => {
  return getTaskHistoryByAction('overdue');
};

// 设置回调函数，解决循环依赖问题
setCheckOverdueTasksCallback(checkAndUpdateOverdueTasks);

/**
 * 完成任务
 * @param taskId 任务ID
 * @returns Promise<Task>
 */
export async function completeTask(taskId: number): Promise<Task> {
  console.log(`完成任务: ${taskId}`);
  
  // 1. 获取任务
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error(`任务不存在: ${taskId}`);
  }
  
  // 2. 获取当前周期
  if (!task.currentCycle) {
    throw new Error(`任务ID ${taskId} 没有当前周期`);
  }
  
  // 3. 记录完成状态
  const now = new Date().toISOString();
  const completedCycle = {
    ...task.currentCycle,
    isCompleted: true,
    completedDate: now,
  };
  
  // 4. 更新任务周期
  await saveTaskCycle(completedCycle);
  
  // 5. 记录统计信息
  await saveTaskHistory({
    id: 0,
    taskId: task.id,
    cycleId: task.currentCycle.id,
    action: 'completed',
    timestamp: now
  });
  
  // 6. 更新任务的最后完成时间
  task.lastCompletedDate = now;
  
  // 7. 处理一次性任务或循环任务
  if (!task.isRecurring || 
      (task.recurrencePattern.type === 'custom' && task.recurrencePattern.value === 0)) {
    // 一次性任务完成后删除而不是禁用
    console.log(`一次性任务 ${taskId} 已完成，将删除该任务`);
    await deleteTaskFromStorage(taskId);
    return { ...task, isActive: false };
  } else if (task.autoRestart) {
    // 循环任务，创建下一个周期
    console.log(`循环任务 ${taskId} 已完成，创建下一个周期`);
    const newCycle = await createNextCycle(task, now);
    task.currentCycle = newCycle;
  }
  
  // 8. 更新任务
  await saveTask(task);
  
  return task;
}

/**
 * 创建下一个任务周期
 * @param task 任务
 * @param completedDate 完成日期，默认为当前日期
 */
export async function createNextCycle(
  task: Task,
  completedDate: string = new Date().toISOString()
): Promise<TaskCycle> {
  // 使用当前日期作为新周期的开始日期
  const today = new Date().toISOString();
  
  // 根据开始日期和循环模式计算截止日期
  let dueDate: string;
  
  try {
    const startDate = new Date(today);
    const pattern = task.recurrencePattern;
    let endDate: Date;
    
    switch (pattern.type) {
      case 'daily':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + pattern.value);
        break;
        
      case 'weekly':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + pattern.value * 7);
        break;
        
      case 'monthly':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + pattern.value);
        break;
        
      case 'yearly':
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + pattern.value);
        break;
        
      case 'custom':
        if (!pattern.unit) {
          throw new Error('自定义循环类型必须指定单位');
        }
        
        endDate = new Date(startDate);
        
        switch (pattern.unit) {
          case 'days':
            endDate.setDate(endDate.getDate() + pattern.value);
            break;
          case 'weeks':
            endDate.setDate(endDate.getDate() + pattern.value * 7);
            break;
          case 'months':
            endDate.setMonth(endDate.getMonth() + pattern.value);
            break;
          case 'years':
            endDate.setFullYear(endDate.getFullYear() + pattern.value);
            break;
          default:
            throw new Error(`不支持的循环单位: ${pattern.unit}`);
        }
        break;
        
      default:
        throw new Error(`不支持的循环类型: ${pattern.type}`);
    }
    
    dueDate = endDate.toISOString();
    
  } catch (error) {
    console.error('计算下一个周期时出错:', error);
    // 出错时使用一周后作为默认截止日期
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    dueDate = defaultDueDate.toISOString();
  }
  
  // 创建新的周期
  const newCycle: TaskCycle = {
    id: 0, // 将由saveTaskCycle分配
    taskId: task.id,
    startDate: today,
    dueDate: dueDate,
    dateType: task.dateType,
    isCompleted: false,
    isOverdue: false,
    createdAt: new Date().toISOString()
  };
  
  // 保存新周期
  const savedCycle = await saveTaskCycle(newCycle);
  console.log(`为任务 ${task.id} 创建了新周期: ${savedCycle.id}, 开始: ${today}, 截止: ${dueDate}`);
  
  // 安排通知
  try {
    await scheduleTaskNotification(task, savedCycle);
  } catch (notificationError) {
    console.error('设置通知时出错:', notificationError);
    // 继续执行，不中断周期创建
  }
  
  return savedCycle;
}

/**
 * 从截止日期计算开始日期
 * @param dueDate 截止日期
 * @param recurrencePattern 重复模式
 * @param dateType 日期类型
 * @returns 计算出的开始日期
 */
export const calculateStartDate = (dueDate: string, recurrencePattern: RecurrencePattern, dateType: DateType = 'solar'): string => {
  try {
    let due: Date;
    if (dateType === 'lunar') {
      const lunarDate = lunarService.parseLunarDate(dueDate);
      due = lunarService.convertToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
    } else {
      due = new Date(dueDate);
    }
    
    let startDate: Date;
    
    switch (recurrencePattern.type) {
      case 'daily':
        // 每天或每隔几天的任务，开始日期为截止日期减去指定天数
        startDate = new Date(due);
        startDate.setDate(startDate.getDate() - recurrencePattern.value);
        break;
        
      case 'weekly':
        if (recurrencePattern.weekDay !== undefined) {
          // 指定每周几的任务，开始日期为上一周的同一天
          startDate = new Date(due);
          startDate.setDate(startDate.getDate() - 7);
        } else {
          // 每隔几周的任务，开始日期为截止日期减去指定周数
          startDate = new Date(due);
          startDate.setDate(startDate.getDate() - (recurrencePattern.value * 7));
        }
        break;
        
      case 'monthly':
        if (recurrencePattern.monthDay !== undefined) {
          // 每月指定日期的任务，开始日期为上个月的同一天
          startDate = new Date(due);
          startDate.setMonth(startDate.getMonth() - 1);
        } else {
          // 每隔几个月的任务，开始日期为截止日期减去指定月数
          startDate = new Date(due);
          startDate.setMonth(startDate.getMonth() - recurrencePattern.value);
        }
        break;
        
      case 'yearly':
        // 每年的任务，开始日期为去年的同一天
        startDate = new Date(due);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
        
      case 'custom':
        switch (recurrencePattern.unit) {
          case 'days':
            startDate = new Date(due);
            startDate.setDate(startDate.getDate() - recurrencePattern.value);
            break;
          case 'weeks':
            startDate = new Date(due);
            startDate.setDate(startDate.getDate() - (recurrencePattern.value * 7));
            break;
          case 'months':
            startDate = new Date(due);
            startDate.setMonth(startDate.getMonth() - recurrencePattern.value);
            break;
          case 'years':
            startDate = new Date(due);
            startDate.setFullYear(startDate.getFullYear() - recurrencePattern.value);
            break;
          default:
            // 默认使用当前日期
            startDate = new Date();
        }
        break;
        
      default:
        // 默认使用当前日期
        startDate = new Date();
    }
    
    return startDate.toISOString();
  } catch (error) {
    console.error('从截止日期计算开始日期出错:', error);
    // 出错时返回当前日期
    return new Date().toISOString();
  }
};

/**
 * 重新计算所有任务的截止日期
 * 用于在应用更新后批量修正截止日期
 * @param forceUpdate 是否强制更新，即使日期没有变化
 */
export const recalculateAllTaskDates = async (forceUpdate: boolean = false): Promise<number> => {
  try {
    console.log('开始重新计算所有任务的日期...');
    const tasks = await getAllTasks(true, true);
    let updatedCount = 0;
    
    for (const task of tasks) {
      if (task.isRecurring && task.currentCycle) {
        try {
          console.log(`重新计算任务 ID ${task.id} "${task.title}" 的日期`);
          
          // 使用开始日期重新计算截止日期
          const startDate = task.currentCycle.startDate;
          const newDueDate = calculateDueDate(startDate, task.recurrencePattern, task.dateType);
          
          if (newDueDate !== task.currentCycle.dueDate || forceUpdate) {
            console.log(`任务 ID ${task.id} 的截止日期已更新: ${task.currentCycle.dueDate} -> ${newDueDate}`);
            
            // 更新周期
            const updatedCycle = {
              ...task.currentCycle,
              dueDate: newDueDate
            };
            
            await saveTaskCycle(updatedCycle);
            updatedCount++;
          }
        } catch (error) {
          console.error(`重新计算任务 ID ${task.id} 的日期时出错:`, error);
        }
      }
    }
    
    console.log(`日期重新计算完成，已更新 ${updatedCount} 个任务`);
    return updatedCount;
  } catch (error) {
    console.error('重新计算任务日期时出错:', error);
    throw error;
  }
}; 