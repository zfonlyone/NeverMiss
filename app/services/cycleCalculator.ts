import {
  Task,
  TaskCycle,
  RecurrenceType,
  DateType,
  RecurrencePattern,
  WeekDay,
  WeekOfMonth,
  CompositeRecurrencePattern
} from '../models/Task';
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays } from 'date-fns';
import lunarService from './lunarService';
import { saveTaskCycle } from './storageService';
import { scheduleTaskNotification } from './notificationService';

// 任务周期计算器接口
export interface CycleCalculator {
  calculateStartDate(dueDate: string, pattern: RecurrencePattern, dateType?: DateType): string;
  calculateDueDate(startDate: string, pattern: RecurrencePattern, dateType?: DateType): string;
  getNextCycle(task: Task, completionDate?: string): Promise<TaskCycle>;
}

// 实现任务周期计算器
export class TaskCycleCalculator implements CycleCalculator {
  // 根据截止日期计算开始日期
  calculateStartDate(dueDate: string, pattern: RecurrencePattern, dateType: DateType = 'solar'): string {
    try {
      console.log(`从截止日期计算开始日期: ${dueDate}, 重复模式=${JSON.stringify(pattern)}`);
      
      let due: Date;
      if (dateType === 'lunar') {
        const lunarDate = lunarService.parseLunarDate(dueDate);
        due = lunarService.convertToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
      } else {
        due = new Date(dueDate);
      }
      
      let startDate: Date;
      
      switch (pattern.type) {
        case 'daily':
          // 每天或每隔几天的任务，开始日期为截止日期减去指定天数
          startDate = new Date(due);
          startDate.setDate(startDate.getDate() - pattern.value);
          break;
          
        case 'weekly':
          if (pattern.weekDay !== undefined) {
            // 指定每周几的任务，开始日期为上一周的同一天
            startDate = new Date(due);
            startDate.setDate(startDate.getDate() - 7);
          } else {
            // 每隔几周的任务，开始日期为截止日期减去指定周数
            startDate = new Date(due);
            startDate.setDate(startDate.getDate() - (pattern.value * 7));
          }
          break;
          
        case 'monthly':
          if (pattern.monthDay !== undefined) {
            // 每月指定日期的任务，开始日期为上个月的同一天
            startDate = new Date(due);
            startDate.setMonth(startDate.getMonth() - 1);
          } else {
            // 每隔几个月的任务，开始日期为截止日期减去指定月数
            startDate = new Date(due);
            startDate.setMonth(startDate.getMonth() - pattern.value);
          }
          break;
          
        case 'yearly':
          // 每年的任务，开始日期为去年的同一天
          startDate = new Date(due);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
          
        case 'composite':
          // 处理组合循环模式
          startDate = this.calculateCompositeStartDate(due, pattern as CompositeRecurrencePattern);
          break;
          
        case 'custom':
          switch (pattern.unit) {
            case 'days':
              startDate = new Date(due);
              startDate.setDate(startDate.getDate() - pattern.value);
              break;
            case 'weeks':
              startDate = new Date(due);
              startDate.setDate(startDate.getDate() - (pattern.value * 7));
              break;
            case 'months':
              startDate = new Date(due);
              startDate.setMonth(startDate.getMonth() - pattern.value);
              break;
            case 'years':
              startDate = new Date(due);
              startDate.setFullYear(startDate.getFullYear() - pattern.value);
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
      
      console.log(`计算的开始日期: ${startDate.toISOString()}`);
      return startDate.toISOString();
    } catch (error) {
      console.error('从截止日期计算开始日期出错:', error);
      // 出错时返回当前日期
      return new Date().toISOString();
    }
  }
  
  // 计算组合循环模式的开始日期
  private calculateCompositeStartDate(dueDate: Date, pattern: CompositeRecurrencePattern): Date {
    // 从截止日期复制一个新日期对象
    const startDate = new Date(dueDate);
    
    // 应用年份偏移
    if (pattern.yearEnabled && pattern.year) {
      startDate.setFullYear(startDate.getFullYear() - pattern.year);
    }
    
    // 应用月份偏移
    if (pattern.monthEnabled && pattern.month) {
      startDate.setMonth(startDate.getMonth() - pattern.month);
    }
    
    // 应用天数偏移（根据启用的选项）
    let daysOffset = 0;
    
    // 计算总天数偏移
    if (pattern.weekOfMonthEnabled && pattern.weekDayEnabled) {
      // 特定的月中星期几，复杂计算，简化为上个月同一天
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      // 使用天数直接偏移
      if (pattern.yearDayEnabled && pattern.yearDay) {
        daysOffset = pattern.yearDay;
      } else if (pattern.monthDayEnabled && pattern.monthDay) {
        daysOffset = pattern.monthDay;
      }
      
      if (daysOffset > 0) {
        startDate.setDate(startDate.getDate() - daysOffset);
      }
    }
    
    return startDate;
  }
  
  // 根据开始日期计算截止日期
  calculateDueDate(startDate: string, pattern: RecurrencePattern, dateType: DateType = 'solar'): string {
    try {
      console.log(`计算截止日期: 开始日期=${startDate}, 重复模式=${JSON.stringify(pattern)}, 日期类型=${dateType}`);
      
      let start: Date;
      if (dateType === 'lunar') {
        const lunarDate = lunarService.parseLunarDate(startDate);
        console.log(`解析农历日期: ${JSON.stringify(lunarDate)}`);
        start = lunarService.convertToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
      } else {
        start = new Date(startDate);
      }
      
      let dueDate: Date;
      
      switch (pattern.type) {
        case 'daily':
          dueDate = addDays(start, pattern.value);
          console.log(`每天循环: 间隔=${pattern.value}天, 结果=${dueDate.toISOString()}`);
          break;
          
        case 'weekly':
          if (pattern.weekDay !== undefined) {
            // 找到下一个指定的星期几
            dueDate = new Date(start);
            const targetDay = pattern.weekDay;
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
            console.log(`每周特定星期: 结果=${dueDate.toISOString()}`);
          } else {
            // 每隔几周
            dueDate = addDays(start, pattern.value * 7);
            console.log(`每隔多周: 间隔=${pattern.value}周, 结果=${dueDate.toISOString()}`);
          }
          break;
          
        case 'monthly':
          if (pattern.monthDay !== undefined) {
            // 下个月的指定日期
            dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + 1);
            
            // 确保日期有效（例如，2月30日会被转换为2月的最后一天）
            const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
            dueDate.setDate(Math.min(pattern.monthDay, lastDayOfMonth));
            
            console.log(`每月特定日期: 日期=${pattern.monthDay}, 结果=${dueDate.toISOString()}`);
          } else {
            // 每隔几个月
            dueDate = addMonths(start, pattern.value);
            console.log(`每隔多月: 间隔=${pattern.value}月, 结果=${dueDate.toISOString()}`);
          }
          break;
          
        case 'yearly':
          dueDate = addYears(start, pattern.value);
          console.log(`每年: 间隔=${pattern.value}年, 结果=${dueDate.toISOString()}`);
          break;
          
        case 'weekOfMonth':
          // 处理每月第几周星期几
          if (!pattern.month || pattern.weekOfMonth === undefined || pattern.weekDay === undefined) {
            throw new Error('weekOfMonth 类型必须指定 month、weekOfMonth 和 weekDay');
          }
          
          // 使用辅助函数计算
          const weekDate = this.getDateOfWeekDayInMonth(
            start.getFullYear(),
            pattern.month - 1, // JavaScript 月份从 0 开始
            pattern.weekOfMonth,
            pattern.weekDay
          );
          
          // 如果计算出的日期早于开始日期，则选择下一年的同一日期
          if (weekDate < start) {
            const nextYear = this.getDateOfWeekDayInMonth(
              start.getFullYear() + 1,
              pattern.month - 1,
              pattern.weekOfMonth,
              pattern.weekDay
            );
            dueDate = nextYear;
          } else {
            dueDate = weekDate;
          }
          
          console.log(`每月第几周星期几: 结果=${dueDate.toISOString()}`);
          break;
          
        case 'composite':
          // 处理组合循环模式
          dueDate = this.calculateCompositeDueDate(start, pattern as CompositeRecurrencePattern);
          console.log(`组合模式: 结果=${dueDate.toISOString()}`);
          break;
          
        case 'custom':
          switch (pattern.unit) {
            case 'days':
              dueDate = addDays(start, pattern.value);
              console.log(`自定义天数: 值=${pattern.value}, 结果=${dueDate.toISOString()}`);
              break;
            case 'weeks':
              dueDate = addDays(start, pattern.value * 7);
              console.log(`自定义周数: 值=${pattern.value}, 结果=${dueDate.toISOString()}`);
              break;
            case 'months':
              dueDate = addMonths(start, pattern.value);
              console.log(`自定义月数: 值=${pattern.value}, 结果=${dueDate.toISOString()}`);
              break;
            case 'years':
              dueDate = addYears(start, pattern.value);
              console.log(`自定义年数: 值=${pattern.value}, 结果=${dueDate.toISOString()}`);
              break;
            default:
              throw new Error(`不支持的循环单位: ${pattern.unit}`);
          }
          break;
          
        default:
          throw new Error(`不支持的循环类型: ${pattern.type}`);
      }
      
      console.log(`最终计算结果 - 开始日期: ${startDate}, 截止日期: ${dueDate.toISOString()}`);
      return dueDate.toISOString();
      
    } catch (error) {
      console.error('计算截止日期时出错:', error);
      // 出错时使用默认截止日期（一周后）
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      return defaultDueDate.toISOString();
    }
  }
  
  // 计算组合循环模式的截止日期
  private calculateCompositeDueDate(startDate: Date, pattern: CompositeRecurrencePattern): Date {
    // 从开始日期复制一个新日期对象
    const dueDate = new Date(startDate);
    
    // 应用年份偏移
    if (pattern.yearEnabled && pattern.year) {
      dueDate.setFullYear(dueDate.getFullYear() + pattern.year);
    }
    
    // 应用月份偏移
    if (pattern.monthEnabled && pattern.month) {
      dueDate.setMonth(dueDate.getMonth() + pattern.month);
    }
    
    // 应用天数偏移（根据启用的选项）
    let daysOffset = 0;
    
    // 计算总天数偏移
    if (pattern.weekOfMonthEnabled && pattern.weekDayEnabled) {
      // 特定的月中星期几，复杂计算
      if (pattern.weekOfMonth && pattern.weekDay !== undefined) {
        // 获取下个月的指定星期几的日期
        const nextMonth = new Date(dueDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const weekDayDate = this.getDateOfWeekDayInMonth(
          nextMonth.getFullYear(),
          nextMonth.getMonth(),
          pattern.weekOfMonth,
          pattern.weekDay
        );
        
        return weekDayDate;
      }
    } else {
      // 使用天数直接偏移
      if (pattern.yearDayEnabled && pattern.yearDay) {
        daysOffset = pattern.yearDay;
      } else if (pattern.monthDayEnabled && pattern.monthDay) {
        daysOffset = pattern.monthDay;
      }
      
      if (daysOffset > 0) {
        dueDate.setDate(dueDate.getDate() + daysOffset);
      }
    }
    
    return dueDate;
  }
  
  // 获取指定月份中第几周的星期几的日期
  private getDateOfWeekDayInMonth(year: number, month: number, weekOfMonth: WeekOfMonth, weekDay: WeekDay): Date {
    // JavaScript 中的星期几从 0 (周日) 到 6 (周六)
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayWeekDay = firstDayOfMonth.getDay();
    
    // 计算第一个符合条件的日期（本月第一个指定的weekDay）
    let dayOfMonth = 1 + (7 + weekDay - firstDayWeekDay) % 7;
    
    // 如果是月份的第一周，并且第一个符合条件的日期在第一周之外，需要调整
    if (weekOfMonth === 1 && dayOfMonth > 7) {
      dayOfMonth = dayOfMonth - 7;
    } else {
      // 计算指定的第几周
      dayOfMonth = dayOfMonth + (weekOfMonth - 1) * 7;
    }
    
    // 处理倒数的情况
    if (weekOfMonth === 5) {
      // 先计算下个月的第一天
      const nextMonth = new Date(year, month + 1, 1);
      
      // 然后回退找到最后一个符合weekDay的日期
      const lastDayOfMonth = new Date(nextMonth);
      lastDayOfMonth.setDate(0);
      
      const lastDayWeekDay = lastDayOfMonth.getDay();
      const daysToSubtract = (lastDayWeekDay - weekDay + 7) % 7;
      
      dayOfMonth = lastDayOfMonth.getDate() - daysToSubtract;
    }
    
    // 创建最终日期
    const result = new Date(year, month, dayOfMonth);
    
    return result;
  }
  
  // 为任务创建下一个周期
  async getNextCycle(task: Task, completionDate: string = new Date().toISOString()): Promise<TaskCycle> {
    // 使用当前日期作为新周期的开始日期
    const today = new Date().toISOString();
    console.log(`为任务 ID ${task.id} 创建下一个周期，使用当前日期作为开始日期`);
    
    // 根据开始日期和循环模式计算截止日期
    const dueDate = this.calculateDueDate(today, task.recurrencePattern, task.dateType);
    
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
  
  // 创建任务周期（辅助函数）
  async createTaskCycleWithDates(
    task: Task,
    startDate: string,
    dueDate: string
  ): Promise<TaskCycle> {
    // 创建新的周期
    const newCycle: TaskCycle = {
      id: 0, // 将由saveTaskCycle分配
      taskId: task.id,
      startDate: startDate,
      dueDate: dueDate,
      dateType: task.dateType,
      isCompleted: false,
      isOverdue: false,
      createdAt: new Date().toISOString()
    };
    
    // 保存新周期
    const savedCycle = await saveTaskCycle(newCycle);
    console.log(`为任务 ${task.id} 创建了新周期: ${savedCycle.id}, 开始: ${startDate}, 截止: ${dueDate}`);
    
    // 安排通知
    try {
      await scheduleTaskNotification(task, savedCycle);
    } catch (notificationError) {
      console.error('设置通知时出错:', notificationError);
      // 继续执行，不中断周期创建
    }
    
    return savedCycle;
  }
}

// 创建全局周期计算器实例
export const cycleCalculator = new TaskCycleCalculator(); 