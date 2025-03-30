/**
 * Lunar Calendar Service for NeverMiss
 * @author zfonlyone
 */

import { DateType } from '../models/Task';
import { Lunar, Solar } from 'lunar-javascript';

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
  zodiac: string;
  yearInGanZhi?: string;
  monthInChinese?: string;
  dayInChinese?: string;
}

/**
 * 将公历日期转换为农历日期
 * @param date 公历日期
 * @returns 农历日期信息
 */
export function solarToLunar(date: Date): LunarDate {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeap: lunar.isLeap(),
    zodiac: lunar.getYearShengXiao()
  };
}

/**
 * 将农历日期转换为公历日期
 * @param year 农历年
 * @param month 农历月
 * @param day 农历日
 * @param isLeap 是否闰月
 * @returns 公历日期
 */
export function lunarToSolar(year: number, month: number, day: number, isLeap: boolean = false): Date {
  const lunar = Lunar.fromYmd(year, month, day);
  if (isLeap && !lunar.isLeap()) {
    throw new Error('Not a leap month');
  }
  return lunar.getSolar().toDate();
}

/**
 * 获取农历月份名称
 * @param month 月份数字(1-12)
 * @param isLeap 是否闰月
 * @returns 农历月份名称
 */
export function getLunarMonthName(month: number, isLeap: boolean = false): string {
  const lunar = Lunar.fromYmd(2024, month, 1);
  return (isLeap ? '闰' : '') + lunar.getMonthInChinese();
}

/**
 * 获取农历日期名称
 * @param day 日期数字(1-31)
 * @returns 农历日期名称
 */
export function getLunarDayName(day: number): string {
  const lunar = Lunar.fromYmd(2024, 1, day);
  return lunar.getDayInChinese();
}

/**
 * 获取生肖
 * @param year 农历年
 * @returns 生肖名称
 */
export function getZodiac(year: number): string {
  const lunar = Lunar.fromYmd(year, 1, 1);
  return lunar.getYearShengXiao();
}

/**
 * 获取干支纪年
 * @param year 农历年
 * @returns 干支纪年
 */
export function getGanZhi(year: number): string {
  const lunar = Lunar.fromYmd(year, 1, 1);
  return lunar.getYearInGanZhi();
}

/**
 * 获取今日农历信息
 * @returns 农历日期信息
 */
export function getTodayLunar(): LunarDate {
  return solarToLunar(new Date());
}

/**
 * 获取本月农历信息
 * @returns 本月农历信息
 */
export function getCurrentMonthLunar(): {
  year: number;
  month: number;
  isLeap: boolean;
  yearInGanZhi: string;
  yearInZodiac: string;
  monthInChinese: string;
} {
  const solar = Solar.fromDate(new Date());
  const lunar = solar.getLunar();
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    isLeap: lunar.isLeap(),
    yearInGanZhi: lunar.getYearInGanZhi(),
    yearInZodiac: lunar.getYearShengXiao(),
    monthInChinese: lunar.getMonthInChinese()
  };
}

export function convertToLunar(date: Date): string {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}

export function convertToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean = false): Date {
  const lunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
  if (isLeap && !lunar.isLeap()) {
    throw new Error('Not a leap month');
  }
  return lunar.getSolar().toDate();
}

export function formatDate(date: string, dateType: DateType): string {
  const d = new Date(date);
  if (dateType === 'lunar') {
    return convertToLunar(d);
  }
  return d.toLocaleDateString();
}

export function parseLunarDate(lunarDateString: string): { year: number; month: number; day: number; isLeap: boolean } {
  // 解析农历日期字符串，例如：二零二四年正月初一
  const yearMap: { [key: string]: string } = {
    '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
    '五': '5', '六': '6', '七': '7', '八': '8', '九': '9'
  };
  
  const monthMap: { [key: string]: number } = {
    '正': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
    '七': 7, '八': 8, '九': 9, '十': 10, '冬': 11, '腊': 12
  };
  
  const dayMap: { [key: string]: number } = {
    '初一': 1, '初二': 2, '初三': 3, '初四': 4, '初五': 5,
    '初六': 6, '初七': 7, '初八': 8, '初九': 9, '初十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '廿一': 21, '廿二': 22, '廿三': 23, '廿四': 24, '廿五': 25,
    '廿六': 26, '廿七': 27, '廿八': 28, '廿九': 29, '三十': 30
  };
  
  // 解析年份
  const yearChars = lunarDateString.match(/[零一二三四五六七八九]+年/)?.[0].replace('年', '').split('') || [];
  const year = parseInt(yearChars.map(char => yearMap[char]).join(''));
  
  // 检查是否闰月
  const isLeap = lunarDateString.includes('闰');
  
  // 解析月份
  const monthChar = lunarDateString.match(/[正二三四五六七八九十冬腊]月/)?.[0].replace('月', '');
  const month = monthChar ? monthMap[monthChar] : 1;
  
  // 解析日期
  const dayMatch = lunarDateString.match(/[初十廿三]+[一二三四五六七八九十]/)?.[0];
  const day = dayMatch ? dayMap[dayMatch] : 1;
  
  return { year, month, day, isLeap };
}

/**
 * 获取农历对象的日期
 * @param lunar 农历对象
 * @returns 日期数字
 */
export function getDay(lunar: any): number {
  if (!lunar) return 1;
  // 检查lunar对象是否有效并且有getDay方法
  if (typeof lunar.getDay === 'function') {
    return lunar.getDay();
  }
  // 如果没有getDay方法，尝试获取day属性
  if (lunar.day !== undefined) {
    return lunar.day;
  }
  // 兜底返回1
  return 1;
}

/**
 * 获取农历月份的天数
 * @param year 农历年
 * @param month 农历月
 * @returns 该月天数
 */
export function getDaysOfMonth(year: number, month: number): number {
  try {
    // 创建该月初一的农历对象
    const lunar = Lunar.fromYmd(year, month, 1);
    // 获取该月的天数
    if (typeof lunar.getDaysOfMonth === 'function') {
      return lunar.getDaysOfMonth();
    }
    // 兜底方案，使用LunarMonth获取月天数
    const LunarMonth = require('lunar-javascript').LunarMonth;
    const lunarMonth = LunarMonth.fromYm(year, month);
    return lunarMonth ? lunarMonth.getDayCount() : 30;
  } catch (error) {
    console.error('获取农历月天数出错:', error);
    // 兜底返回30天
    return 30;
  }
}

/**
 * 获取指定农历对象所在月的天数
 * @param lunar 农历对象
 * @returns 月天数
 */
export function getMonthDays(lunar: any): number {
  if (!lunar) return 30;
  
  try {
    // 优先使用对象自身的getDaysOfMonth方法
    if (typeof lunar.getDaysOfMonth === 'function') {
      return lunar.getDaysOfMonth();
    }
    
    // 退化方案：使用年月获取
    if (lunar.getYear && lunar.getMonth) {
      return getDaysOfMonth(lunar.getYear(), lunar.getMonth());
    }
    
    // 最后兜底
    return 30;
  } catch (error) {
    console.error('获取农历月天数出错:', error);
    return 30;
  }
}

/**
 * 获取年干支表示
 * @param lunar 农历对象或年份
 * @returns 干支纪年
 */
export function getYearInGanZhi(lunar: any): string {
  try {
    // 如果是一个Lunar对象
    if (typeof lunar.getYearInGanZhi === 'function') {
      return lunar.getYearInGanZhi();
    }
    
    // 如果是一个数字年份
    if (typeof lunar === 'number') {
      const lunarObj = Lunar.fromYmd(lunar, 1, 1);
      return lunarObj.getYearInGanZhi();
    }
    
    // 如果是一个包含年份的对象
    if (lunar && lunar.year) {
      const lunarObj = Lunar.fromYmd(lunar.year, 1, 1);
      return lunarObj.getYearInGanZhi();
    }
    
    // 默认返回当前年份的干支
    const currentYear = new Date().getFullYear();
    const lunarObj = Lunar.fromYmd(currentYear, 1, 1);
    return lunarObj.getYearInGanZhi();
  } catch (error) {
    console.error('获取年干支出错:', error);
    return '未知';
  }
}

/**
 * 获取月份中文表示
 * @param lunar 农历对象或月份
 * @returns 中文月份名称
 */
export function getMonthInChinese(lunar: any): string {
  try {
    // 如果是一个Lunar对象
    if (typeof lunar.getMonthInChinese === 'function') {
      return lunar.getMonthInChinese();
    }
    
    // 如果是一个数字月份
    if (typeof lunar === 'number' && lunar >= 1 && lunar <= 12) {
      const lunarObj = Lunar.fromYmd(2024, lunar, 1);
      return lunarObj.getMonthInChinese();
    }
    
    // 如果是一个包含月份的对象
    if (lunar && lunar.month && lunar.month >= 1 && lunar.month <= 12) {
      const year = lunar.year || 2024;
      const lunarObj = Lunar.fromYmd(year, lunar.month, 1);
      return lunarObj.getMonthInChinese();
    }
    
    // 默认返回
    return '未知';
  } catch (error) {
    console.error('获取月份中文表示出错:', error);
    return '未知';
  }
}

/**
 * 获取日期中文表示
 * @param lunar 农历对象或日期
 * @returns 中文日期名称
 */
export function getDayInChinese(lunar: any): string {
  try {
    // 如果是一个Lunar对象
    if (typeof lunar.getDayInChinese === 'function') {
      return lunar.getDayInChinese();
    }
    
    // 如果是一个数字日期
    if (typeof lunar === 'number' && lunar >= 1 && lunar <= 30) {
      const lunarObj = Lunar.fromYmd(2024, 1, lunar);
      return lunarObj.getDayInChinese();
    }
    
    // 如果是一个包含日期的对象
    if (lunar && lunar.day && lunar.day >= 1 && lunar.day <= 30) {
      const year = lunar.year || 2024;
      const month = lunar.month || 1;
      const lunarObj = Lunar.fromYmd(year, month, lunar.day);
      return lunarObj.getDayInChinese();
    }
    
    // 默认返回
    return '未知';
  } catch (error) {
    console.error('获取日期中文表示出错:', error);
    return '未知';
  }
}

/**
 * 直接从公历日期创建Lunar对象的安全方法
 * @param date 公历日期
 * @returns Lunar对象或null
 */
export function safeLunarFromDate(date: Date): any {
  try {
    // 先尝试标准路径：Solar.fromDate(date).getLunar()
    const solar = Solar.fromDate(date);
    if (solar && typeof solar.getLunar === 'function') {
      const lunar = solar.getLunar();
      if (lunar) return lunar;
    }
    
    // 如果失败，尝试直接使用Lunar.fromDate
    if (typeof Lunar.fromDate === 'function') {
      return Lunar.fromDate(date);
    }
    
    // 如果仍然失败，尝试手动创建
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 使用Solar创建，然后转换
    const manualSolar = Solar.fromYmd(year, month, day);
    if (manualSolar && typeof manualSolar.getLunar === 'function') {
      return manualSolar.getLunar();
    }
    
    console.warn('无法创建Lunar对象，将返回null');
    return null;
  } catch (error) {
    console.error('创建Lunar对象出错:', error);
    return null;
  }
}

/**
 * 获取完整的农历日期信息
 * @param date 公历日期
 * @returns 包含多种表示方法的农历日期信息
 */
export function getFullLunarDate(date: Date): LunarDate & {
  yearInGanZhi: string;
  monthInChinese: string;
  dayInChinese: string;
} {
  try {
    // 使用安全方法获取lunar对象
    const lunar = safeLunarFromDate(date);
    
    // 检查获取的lunar对象是否有效
    if (!lunar) {
      throw new Error('Could not create lunar object');
    }
    
    // 创建安全获取函数，防止方法不存在导致错误
    const safeGet = (obj: any, funcName: string, defaultValue: any) => {
      if (obj && typeof obj[funcName] === 'function') {
        try {
          return obj[funcName]();
        } catch (e) {
          console.warn(`Error calling ${funcName}:`, e);
          return defaultValue;
        }
      }
      return defaultValue;
    };
    
    // 使用安全方法获取各项属性
    return {
      year: safeGet(lunar, 'getYear', new Date().getFullYear()),
      month: safeGet(lunar, 'getMonth', new Date().getMonth() + 1),
      day: safeGet(lunar, 'getDay', new Date().getDate()),
      isLeap: safeGet(lunar, 'isLeap', false),
      zodiac: safeGet(lunar, 'getYearShengXiao', '未知'),
      yearInGanZhi: safeGet(lunar, 'getYearInGanZhi', '未知'),
      monthInChinese: safeGet(lunar, 'getMonthInChinese', '未知'),
      dayInChinese: safeGet(lunar, 'getDayInChinese', '未知')
    };
  } catch (error) {
    console.error('获取完整农历日期信息出错:', error);
    // 返回默认值 - 使用当前日期
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      isLeap: false,
      zodiac: '未知',
      yearInGanZhi: '未知',
      monthInChinese: '未知',
      dayInChinese: '未知'
    };
  }
}

export default {
  solarToLunar,
  lunarToSolar,
  getLunarMonthName,
  getLunarDayName,
  getZodiac,
  getGanZhi,
  getTodayLunar,
  getCurrentMonthLunar,
  convertToLunar,
  convertToSolar,
  formatDate,
  parseLunarDate,
  getDaysOfMonth,
  getDay,
  getMonthDays,
  getYearInGanZhi,
  getMonthInChinese,
  getDayInChinese,
  getFullLunarDate,
  safeLunarFromDate
}; 