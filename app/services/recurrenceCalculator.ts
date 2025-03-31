import { RecurrencePattern, AdvancedRecurrencePattern, RecurrenceType, WeekDay, DateType } from '../models/Task';
import lunarService from './lunarService';

/**
 * 循环日期计算服务
 * 用于处理循环任务的日期计算逻辑
 */
export class RecurrenceCalculator {
  /**
   * 根据开始日期计算截止日期
   * @param startDate 开始日期
   * @param pattern 循环模式
   * @param useAdvancedRecurrence 是否使用高级循环模式
   * @param advancedPattern 高级循环模式详情
   * @param dateType 日期类型（公历/农历）
   * @returns 计算后的截止日期
   */
  calculateDueDate(
    startDate: Date,
    pattern: RecurrencePattern, 
    useAdvancedRecurrence: boolean,
    advancedPattern: AdvancedRecurrencePattern,
    dateType: DateType = 'solar'
  ): Date {
    try {
      let start: Date;

      // 检查输入的startDate是否有效
      if (!startDate || isNaN(startDate.getTime())) {
        console.warn('输入的开始日期无效，使用当前日期');
        start = new Date();
      } else if (dateType === 'lunar') {
        try {
          const lunarDate = lunarService.parseLunarDate(startDate.toISOString());
          start = lunarService.convertToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
          
          // 确保转换后的日期有效
          if (isNaN(start.getTime())) {
            console.warn('农历转公历后的日期无效，使用当前日期');
            start = new Date();
          }
        } catch (error) {
          console.error('农历日期转换错误:', error);
          start = new Date();
        }
      } else {
        start = new Date(startDate);
      }
      
      let dueDate: Date;
      
      if (useAdvancedRecurrence) {
        // 高级模式下的日期计算
        const {
          selectedDateType,
          yearValue,
          monthValue,
          weekValue,
          dayValue,
          weekDay,
          useSpecialDate,
          specialDateType,
          countDirection
        } = advancedPattern;
        
        // 基于基础单位计算
        switch(selectedDateType) {
          case 'day':
            // 简单天数增加
            dueDate = new Date(start);
            dueDate.setDate(dueDate.getDate() + dayValue);
            break;
            
          case 'week':
            dueDate = new Date(start);
            if (useSpecialDate) {
              // 特殊日期处理 - 例如找到下一个周末或工作日
              switch(specialDateType) {
                case 'weekend':
                  // 找到下一个周末 (周六或周日)
                  while (dueDate.getDay() !== 0 && dueDate.getDay() !== 6) {
                    dueDate.setDate(dueDate.getDate() + 1);
                  }
                  // 如果找到的是周六，并且想要下一个完整周末，再加一天到周日
                  if (dueDate.getDay() === 6) {
                    dueDate.setDate(dueDate.getDate() + 1);
                  }
                  break;
                case 'workday':
                  // 找到下一个工作日 (周一至周五)
                  while (dueDate.getDay() === 0 || dueDate.getDay() === 6) {
                    dueDate.setDate(dueDate.getDate() + 1);
                  }
                  break;
                case 'holiday':
                  // 简化处理节假日（实际应该有一个节假日列表）
                  dueDate.setDate(dueDate.getDate() + 7);
                  break;
                case 'solarTerm':
                  // 简化处理节气日（实际应该有一个节气日列表）
                  dueDate.setDate(dueDate.getDate() + 15);
                  break;
              }
            } else {
              // 普通周处理
              // 找到下一个指定的星期几
              const currentDay = dueDate.getDay();
              let daysToAdd = (weekDay - currentDay + 7) % 7;
              if (daysToAdd === 0) daysToAdd = 7; // 如果是同一天，加7天
              
              // 加上周数
              daysToAdd += (weekValue - 1) * 7;
              
              dueDate.setDate(dueDate.getDate() + daysToAdd);
            }
            break;
            
          case 'month':
            dueDate = new Date(start);
            if (useSpecialDate) {
              // 特殊日期处理
              // 这里简化处理，实际可能需要更复杂的逻辑
              dueDate.setMonth(dueDate.getMonth() + 1);
            } else {
              // 判断是否是倒数计算
              if (countDirection === 'backward') {
                // 倒数计算 - 例如每月倒数第N天
                // 这里简化处理，真实情况需要更复杂的计算
                const currentDate = dueDate.getDate();
                const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
                const targetDate = lastDayOfMonth - dayValue;
                
                // 移动到下个月
                dueDate.setMonth(dueDate.getMonth() + monthValue);
                
                // 调整到正确的倒数日期
                const nextLastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
                dueDate.setDate(Math.max(1, nextLastDayOfMonth - dayValue));
              } else {
                // 正常月份递增
                dueDate.setMonth(dueDate.getMonth() + monthValue);
                
                // 确保日期有效（比如避免2月31日这种情况）
                const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
                if (dueDate.getDate() > lastDayOfMonth) {
                  dueDate.setDate(lastDayOfMonth);
                }
                
                // 应用具体日期
                if (dayValue > 0 && dayValue <= lastDayOfMonth) {
                  dueDate.setDate(dayValue);
                }
              }
            }
            break;
            
          case 'year':
            dueDate = new Date(start);
            dueDate.setFullYear(dueDate.getFullYear() + yearValue);
            
            if (!useSpecialDate) {
              // 设置具体月份
              if (monthValue > 0 && monthValue <= 12) {
                dueDate.setMonth(monthValue - 1); // 月份从0开始
                
                // 确保日期有效
                const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
                
                // 判断是否是倒数计算
                if (countDirection === 'backward') {
                  dueDate.setDate(Math.max(1, lastDayOfMonth - dayValue));
                } else if (dayValue > 0 && dayValue <= lastDayOfMonth) {
                  dueDate.setDate(dayValue);
                }
              }
            }
            break;
            
          default:
            dueDate = new Date(start);
            dueDate.setDate(dueDate.getDate() + 1);
        }
      } else {
        // 简单模式下的日期计算
        const { type, value = 1, weekDay } = pattern;
        dueDate = new Date(start);
        
        switch(type) {
          case 'daily':
            dueDate.setDate(dueDate.getDate() + value);
            break;
            
          case 'weekly':
            if (weekDay !== undefined) {
              // 找下一个指定的星期几
              const currentDay = dueDate.getDay();
              const targetDay = weekDay;
              let daysToAdd = (targetDay - currentDay + 7) % 7;
              if (daysToAdd === 0) daysToAdd = 7; // 如果是同一天，加7天
              daysToAdd += (value - 1) * 7; // 加上额外的周数
              dueDate.setDate(dueDate.getDate() + daysToAdd);
            } else {
              // 每几周
              dueDate.setDate(dueDate.getDate() + (value * 7));
            }
            break;
            
          case 'monthly':
            dueDate.setMonth(dueDate.getMonth() + value);
            // 处理月末问题，例如1月31日加一个月应该是2月28/29日
            const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
            if (dueDate.getDate() > lastDayOfMonth) {
              dueDate.setDate(lastDayOfMonth);
            }
            break;
            
          case 'yearly':
            dueDate.setFullYear(dueDate.getFullYear() + value);
            // 处理2月29日问题
            if (dueDate.getMonth() === 1 && dueDate.getDate() === 29) {
              if (!this.isLeapYear(dueDate.getFullYear())) {
                dueDate.setDate(28);
              }
            }
            break;
            
          default:
            dueDate.setDate(dueDate.getDate() + 1);
        }
      }
      
      // 在返回之前检查计算得到的日期是否有效
      if (!dueDate || isNaN(dueDate.getTime())) {
        console.warn('计算得到的截止日期无效，使用开始日期加一天');
        dueDate = new Date(start);
        dueDate.setDate(dueDate.getDate() + 1);
      }
      
      return dueDate;
    } catch (error) {
      console.error('计算截止日期错误:', error);
      // 出错时默认返回一周后
      const fallbackDate = new Date();
      if (startDate && !isNaN(startDate.getTime())) {
        fallbackDate.setTime(startDate.getTime());
      }
      fallbackDate.setDate(fallbackDate.getDate() + 7);
      return fallbackDate;
    }
  }

  /**
   * 根据截止日期计算开始日期
   * @param dueDate 截止日期
   * @param pattern 循环模式
   * @param useAdvancedRecurrence 是否使用高级循环模式
   * @param advancedPattern 高级循环模式详情
   * @param dateType 日期类型（公历/农历）
   * @returns 计算后的开始日期
   */
  calculateStartDate(
    dueDate: Date,
    pattern: RecurrencePattern, 
    useAdvancedRecurrence: boolean,
    advancedPattern: AdvancedRecurrencePattern,
    dateType: DateType = 'solar'
  ): Date {
    try {
      let due: Date;

      // 检查输入的dueDate是否有效
      if (!dueDate || isNaN(dueDate.getTime())) {
        console.warn('输入的截止日期无效，使用当前日期');
        due = new Date();
      } else if (dateType === 'lunar') {
        try {
          const lunarDate = lunarService.parseLunarDate(dueDate.toISOString());
          due = lunarService.convertToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
          
          // 确保转换后的日期有效
          if (isNaN(due.getTime())) {
            console.warn('农历转公历后的日期无效，使用当前日期');
            due = new Date();
          }
        } catch (error) {
          console.error('农历日期转换错误:', error);
          due = new Date();
        }
      } else {
        due = new Date(dueDate);
      }
      
      let startDate: Date;
      
      if (useAdvancedRecurrence) {
        // 高级模式下的日期计算
        const {
          selectedDateType,
          yearValue,
          monthValue,
          weekValue,
          dayValue,
          weekDay,
          useSpecialDate,
          specialDateType,
          countDirection
        } = advancedPattern;
        
        // 基于基础单位计算
        switch(selectedDateType) {
          case 'day':
            // 简单天数减少
            startDate = new Date(due);
            startDate.setDate(startDate.getDate() - dayValue);
            break;
            
          case 'week':
            startDate = new Date(due);
            if (useSpecialDate) {
              // 特殊日期处理
              switch(specialDateType) {
                case 'weekend':
                  // 找到上一个周末
                  while (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
                    startDate.setDate(startDate.getDate() - 1);
                  }
                  break;
                case 'workday':
                  // 找到上一个工作日
                  while (startDate.getDay() === 0 || startDate.getDay() === 6) {
                    startDate.setDate(startDate.getDate() - 1);
                  }
                  break;
                default:
                  // 简化处理其他特殊日期
                  startDate.setDate(startDate.getDate() - 7);
              }
            } else {
              // 普通周处理，往前找指定星期几
              // 先回到上一周
              startDate.setDate(startDate.getDate() - (7 * weekValue));
              
              // 然后调整到指定的星期几
              const currentDay = startDate.getDay();
              if (currentDay !== weekDay) {
                // 向后调整到指定星期几
                let daysToAdd = (weekDay - currentDay + 7) % 7;
                startDate.setDate(startDate.getDate() + daysToAdd);
                
                // 如果调整后的日期大于等于截止日期，再往前推一周
                if (startDate >= due) {
                  startDate.setDate(startDate.getDate() - 7);
                }
              }
            }
            break;
            
          case 'month':
            startDate = new Date(due);
            startDate.setMonth(startDate.getMonth() - monthValue);
            
            if (!useSpecialDate) {
              // 处理倒数计算
              if (countDirection === 'backward') {
                const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                startDate.setDate(Math.max(1, lastDayOfMonth - dayValue));
              } else if (dayValue > 0) {
                // 设置为月份中的指定日期
                const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                startDate.setDate(Math.min(dayValue, lastDayOfMonth));
              }
            }
            break;
            
          case 'year':
            startDate = new Date(due);
            startDate.setFullYear(startDate.getFullYear() - yearValue);
            
            if (!useSpecialDate) {
              // 设置具体月份
              if (monthValue > 0 && monthValue <= 12) {
                startDate.setMonth(monthValue - 1); // 月份从0开始
                
                // 确保日期有效
                const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                
                // 判断是否是倒数计算
                if (countDirection === 'backward') {
                  startDate.setDate(Math.max(1, lastDayOfMonth - dayValue));
                } else if (dayValue > 0 && dayValue <= lastDayOfMonth) {
                  startDate.setDate(dayValue);
                }
              }
            }
            break;
            
          default:
            startDate = new Date(due);
            startDate.setDate(startDate.getDate() - 1);
        }
      } else {
        // 简单模式下的日期计算
        const { type, value = 1, weekDay } = pattern;
        startDate = new Date(due);
        
        switch(type) {
          case 'daily':
            // 每天或每隔几天的任务，开始日期为截止日期减去指定天数
            startDate.setDate(startDate.getDate() - value);
            break;
            
          case 'weekly':
            if (weekDay !== undefined) {
              // 先往前推一周
              startDate.setDate(startDate.getDate() - 7);
              
              // 然后调整到指定的星期几
              const currentDay = startDate.getDay();
              if (currentDay !== weekDay) {
                // 向后调整到指定星期几
                let daysToAdd = (weekDay - currentDay + 7) % 7;
                startDate.setDate(startDate.getDate() + daysToAdd);
                
                // 如果调整后的日期大于等于截止日期，再往前推一周
                if (startDate >= due) {
                  startDate.setDate(startDate.getDate() - 7);
                }
              }
              
              // 额外减去周数
              if (value > 1) {
                startDate.setDate(startDate.getDate() - ((value - 1) * 7));
              }
            } else {
              // 每隔几周的任务，开始日期为截止日期减去指定周数
              startDate.setDate(startDate.getDate() - (value * 7));
            }
            break;
            
          case 'monthly':
            // 每隔几个月的任务，开始日期为截止日期减去指定月数
            startDate.setMonth(startDate.getMonth() - value);
            // 处理月末问题
            const originalDay = due.getDate();
            const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
            if (originalDay > lastDayOfMonth) {
              startDate.setDate(lastDayOfMonth);
            }
            break;
            
          case 'yearly':
            // 每年的任务，开始日期为去年的同一天
            startDate.setFullYear(startDate.getFullYear() - value);
            // 处理2月29日问题
            if (startDate.getMonth() === 1 && startDate.getDate() === 29) {
              if (!this.isLeapYear(startDate.getFullYear())) {
                startDate.setDate(28);
              }
            }
            break;
            
          default:
            // 默认情况下，开始日期为截止日期前一天
            startDate.setDate(startDate.getDate() - 1);
        }
      }
      
      // 在返回之前检查计算得到的日期是否有效
      if (!startDate || isNaN(startDate.getTime())) {
        console.warn('计算得到的开始日期无效，使用截止日期减一天');
        startDate = new Date(due);
        startDate.setDate(startDate.getDate() - 1);
      }
      
      return startDate;
    } catch (error) {
      console.error('计算开始日期错误:', error);
      // 出错时默认返回当前日期
      const fallbackDate = new Date();
      if (dueDate && !isNaN(dueDate.getTime())) {
        fallbackDate.setTime(dueDate.getTime());
        fallbackDate.setDate(fallbackDate.getDate() - 1);
      }
      return fallbackDate;
    }
  }
  
  /**
   * 判断是否是闰年
   * @param year 年份
   * @returns 是否是闰年
   */
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }
}

// 导出单例实例
export const recurrenceCalculator = new RecurrenceCalculator(); 

// 添加默认导出
export default recurrenceCalculator; 