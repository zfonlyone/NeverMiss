/**
 * Lunar Calendar Service for NeverMiss
 * @author zfonlyone
 */

import { DateType } from '../Task';

// 农历1900-2100的润大小信息表
const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
];

// 天干
const CELESTIAL_STEM = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
// 地支
const TERRESTRIAL_BRANCH = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
// 生肖
const ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
// 农历月份
const LUNAR_MONTH = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
// 农历日期
const LUNAR_DAY = [
  '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
];

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
  zodiac: string;
}

/**
 * 计算农历年是否闰年
 * @param year 农历年
 * @returns 闰月月份，0表示不是闰年
 */
export function getLeapMonth(year: number): number {
  if (year < 1900 || year > 2100) {
    return 0;
  }
  return LUNAR_INFO[year - 1900] & 0xf;
}

/**
 * 计算农历年的总天数
 * @param year 农历年
 * @returns 总天数
 */
function getLunarYearDays(year: number): number {
  let i, sum = 348;
  for (i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

/**
 * 计算农历年闰月的天数
 * @param year 农历年
 * @returns 闰月天数，0表示该年没有闰月
 */
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

/**
 * 计算农历月的天数
 * @param year 农历年
 * @param month 农历月
 * @returns 该月天数
 */
export function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

/**
 * 获取农历月份名称
 * @param month 月份数字(1-12)
 * @param isLeap 是否闰月
 * @returns 农历月份名称
 */
export function getLunarMonthName(month: number, isLeap: boolean = false): string {
  try {
    if (month < 1 || month > 12) {
      console.warn('Invalid lunar month:', month);
      return '月';
    }
    return (isLeap ? '闰' : '') + LUNAR_MONTH[month - 1] + '月';
  } catch (error) {
    console.error('Error getting lunar month name:', error);
    return '月';
  }
}

/**
 * 获取农历日期名称
 * @param day 日期数字(1-31)
 * @returns 农历日期名称
 */
export function getLunarDayName(day: number): string {
  try {
    if (day < 1 || day > 30) {
      console.warn('Invalid lunar day:', day);
      return '日';
    }
    return LUNAR_DAY[day - 1];
  } catch (error) {
    console.error('Error getting lunar day name:', error);
    return '日';
  }
}

/**
 * 将公历日期转换为农历日期
 * @param date 公历日期
 * @returns 农历日期信息
 */
export function solarToLunar(date: Date): LunarDate {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date input');
    }

    // 计算与1900年1月31日相差的天数
    const baseDate = new Date(1900, 0, 31);
    let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000);
    
    // 用offset减去每农历年的天数，计算当前农历年
    let year = 1900;
    for (let i = 1900; i < 2101 && offset > 0; i++) {
      const daysOfYear = getLunarYearDays(i);
      offset -= daysOfYear;
      year++;
    }
    if (offset < 0) {
      offset += getLunarYearDays(--year);
    }
    
    // 计算月份
    let month = 1;
    let isLeap = false;
    const leapMonth = getLeapMonth(year);
    let daysOfMonth;
    
    while (offset > 0) {
      daysOfMonth = month === leapMonth ? getLeapMonthDays(year) : getLunarMonthDays(year, month);
      if (month === leapMonth) {
        isLeap = true;
      }
      if (offset < daysOfMonth) {
        break;
      }
      offset -= daysOfMonth;
      if (month === leapMonth) {
        if (isLeap) {
          isLeap = false;
          month++;
        }
      } else {
        month++;
      }
      if (month > 12) {
        month = 1;
      }
    }
    
    // 计算日期
    const day = offset + 1;
    
    // 计算生肖
    const zodiacIndex = (year - 4) % 12;
    const zodiac = ZODIAC[zodiacIndex];
    
    return {
      year,
      month,
      day,
      isLeap,
      zodiac
    };
  } catch (error) {
    console.error('Error in solarToLunar:', error);
    return {
      year: new Date().getFullYear(),
      month: 1,
      day: 1,
      isLeap: false,
      zodiac: ''
    };
  }
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
  try {
    // 参数验证
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) ||
        year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 30) {
      throw new Error('Invalid lunar date parameters');
    }
    
    // 计算从1900年1月31日到目标农历日期的天数
    let offset = 0;
    
    // 计算年的天数
    for (let i = 1900; i < year; i++) {
      offset += getLunarYearDays(i);
    }
    
    // 计算月的天数
    const leapMonth = getLeapMonth(year);
    for (let i = 1; i < month; i++) {
      offset += getLunarMonthDays(year, i);
      if (i === leapMonth) {
        offset += getLeapMonthDays(year);
      }
    }
    if (isLeap && month === leapMonth) {
      offset += getLunarMonthDays(year, month);
    }
    
    // 加上当月天数
    offset += day - 1;
    
    // 转换为公历日期
    const baseDate = new Date(1900, 0, 31);
    const result = new Date(baseDate.getTime() + offset * 86400000);
    
    return result;
  } catch (error) {
    console.error('Error in lunarToSolar:', error);
    return new Date();
  }
}

/**
 * 获取生肖
 * @param year 农历年
 * @returns 生肖名称
 */
export function getZodiac(year: number): string {
  try {
    if (!Number.isInteger(year)) {
      throw new Error('Invalid year');
    }
    return ZODIAC[(year - 4) % 12];
  } catch (error) {
    console.error('Error in getZodiac:', error);
    return '';
  }
}

/**
 * 获取干支纪年
 * @param year 农历年
 * @returns 干支纪年
 */
export function getGanZhi(year: number): string {
  try {
    if (!Number.isInteger(year)) {
      throw new Error('Invalid year');
    }
    const gan = CELESTIAL_STEM[(year - 4) % 10];
    const zhi = TERRESTRIAL_BRANCH[(year - 4) % 12];
    return `${gan}${zhi}`;
  } catch (error) {
    console.error('Error in getGanZhi:', error);
    return '';
  }
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
  try {
    const lunar = solarToLunar(new Date());
    if (!lunar) {
      throw new Error('Failed to get lunar date');
    }

    return {
      year: lunar.year,
      month: lunar.month,
      isLeap: lunar.isLeap,
      yearInGanZhi: getGanZhi(lunar.year),
      yearInZodiac: lunar.zodiac,
      monthInChinese: getLunarMonthName(lunar.month, lunar.isLeap)
    };
  } catch (error) {
    console.error('Error in getCurrentMonthLunar:', error);
    return {
      year: new Date().getFullYear(),
      month: 1,
      isLeap: false,
      yearInGanZhi: '',
      yearInZodiac: '',
      monthInChinese: ''
    };
  }
}

export function convertToLunar(date: Date): string {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date input');
    }

    const lunar = solarToLunar(date);
    if (!lunar) {
      throw new Error('Failed to get lunar date');
    }

    return `${lunar.year}年${lunar.isLeap ? '闰' : ''}${getLunarMonthName(lunar.month)}${getLunarDayName(lunar.day)}`;
  } catch (error) {
    console.error('Error in convertToLunar:', error);
    return '';
  }
}

export function convertToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean = false): Date {
  return lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap);
}

export function formatDate(date: string, dateType: DateType): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date string');
    }
    
    if (dateType === 'lunar') {
      return convertToLunar(d);
    }
    return d.toLocaleDateString();
  } catch (error) {
    console.error('Error in formatDate:', error);
    return '';
  }
}

/**
 * 检查指定日期是否为农历节日
 * @param month 农历月
 * @param day 农历日
 * @returns 节日名称，如果不是节日则返回空字符串
 */
export function getLunarFestival(month: number, day: number): string {
  // 主要农历节日列表
  const festivals: {[key: string]: string} = {
    '1-1': '春节',
    '1-15': '元宵节',
    '2-2': '龙抬头',
    '5-5': '端午节',
    '7-7': '七夕',
    '7-15': '中元节',
    '8-15': '中秋节',
    '9-9': '重阳节',
    '10-1': '寒衣节',
    '10-15': '下元节',
    '12-8': '腊八节',
    '12-23': '北方小年',
    '12-24': '南方小年',
    '12-30': '除夕'
  };
  
  const key = `${month}-${day}`;
  return festivals[key] || '';
}

/**
 * 获取节气信息
 * @param date 公历日期
 * @returns 节气名称，如果不是节气则返回空字符串
 */
export function getSolarTerm(date: Date): string {
  try {
    // 日期格式 MM-DD
    const dateStr = `${date.getMonth() + 1}-${date.getDate()}`;
    
    // 简化的节气表 (固定日期，忽略年份差异)
    const solarTerms: Record<string, string> = {
      '2-4': '立春',
      '2-19': '雨水',
      '3-6': '惊蛰',
      '3-21': '春分',
      '4-5': '清明',
      '4-20': '谷雨',
      '5-6': '立夏',
      '5-21': '小满',
      '6-6': '芒种',
      '6-21': '夏至',
      '7-7': '小暑',
      '7-23': '大暑',
      '8-8': '立秋',
      '8-23': '处暑',
      '9-8': '白露',
      '9-23': '秋分',
      '10-8': '寒露',
      '10-23': '霜降',
      '11-7': '立冬',
      '11-22': '小雪',
      '12-7': '大雪',
      '12-22': '冬至',
      '1-6': '小寒',
      '1-20': '大寒'
    };
    
    return solarTerms[dateStr] || '';
  } catch (error) {
    console.error('Error getting solar term:', error);
    return '';
  }
}

/**
 * 获取完整的农历信息
 * @param date 公历日期
 * @returns 完整农历信息
 */
export function getFullLunarInfo(date: Date): {
  lunarDate: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  zodiac: string;
  lunarFestival: string;
  solarTerm: string;
} {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date input');
    }

    // 转换为农历日期
    const lunar = solarToLunar(date);
    if (!lunar) {
      throw new Error('Failed to convert to lunar date');
    }
    
    // 获取节日信息
    const lunarFestival = getLunarFestival(lunar.month, lunar.day);
    
    // 获取节气信息
    const solarTerm = getSolarTerm(date);
    
    // 格式化为中文日期
    const lunarDate = `${lunar.year}年${lunar.isLeap ? '闰' : ''}${getLunarMonthName(lunar.month)}${getLunarDayName(lunar.day)}`;
    
    return {
      lunarDate,
      lunarYear: lunar.year,
      lunarMonth: lunar.month,
      lunarDay: lunar.day,
      isLeapMonth: lunar.isLeap,
      zodiac: lunar.zodiac,
      lunarFestival,
      solarTerm
    };
  } catch (error) {
    console.error('Error getting full lunar info:', error);
    const today = new Date();
    return {
      lunarDate: '',
      lunarYear: today.getFullYear(),
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false,
      zodiac: '',
      lunarFestival: '',
      solarTerm: ''
    };
  }
}

/**
 * 添加指定农历时间量到日期
 * @param date 基准日期
 * @param amount 增加的量
 * @param unit 单位 (day, month, year)
 * @returns 新日期
 */
export function addLunarTime(date: Date, amount: number, unit: 'day' | 'month' | 'year'): Date {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date input');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Amount must be an integer');
    }

    // 先转为农历
    const lunarDate = solarToLunar(date);
    
    // 根据单位增加值
    switch (unit) {
      case 'day': {
        // 使用公历日期计算，更可靠
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);
        return newDate;
      }
      
      case 'month': {
        // 增加月份，处理年份进位
        let newMonth = lunarDate.month + amount;
        let yearAdd = 0;
        
        while (newMonth > 12) {
          newMonth -= 12;
          yearAdd++;
        }
        
        while (newMonth < 1) {
          newMonth += 12;
          yearAdd--;
        }
        
        // 检查天数是否超出新月份的最大天数
        const maxDays = getLunarMonthDays(lunarDate.year + yearAdd, newMonth);
        const newDay = Math.min(lunarDate.day, maxDays);
        
        return lunarToSolar(lunarDate.year + yearAdd, newMonth, newDay, false);
      }
      
      case 'year': {
        // 增加年份
        const newYear = lunarDate.year + amount;
        return lunarToSolar(newYear, lunarDate.month, lunarDate.day, lunarDate.isLeap);
      }
      
      default:
        throw new Error(`不支持的时间单位: ${unit}`);
    }
  } catch (error) {
    console.error(`Error adding lunar time (${amount} ${unit}):`, error);
    // 备用方案：使用公历时间添加
    const newDate = new Date(date);
    switch (unit) {
      case 'day':
        newDate.setDate(newDate.getDate() + amount);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + amount);
        break;
    }
    return newDate;
  }
}

/**
 * 解析农历日期字符串
 * @param lunarDateString 农历日期字符串，例如：二零二四年正月初一
 * @returns 解析后的农历日期信息
 */
export function parseLunarDate(lunarDateString: string): { year: number; month: number; day: number; isLeap: boolean } {
  try {
    // 年份数字映射
    const yearMap: { [key: string]: string } = {
      '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
      '五': '5', '六': '6', '七': '7', '八': '8', '九': '9'
    };
    
    // 月份映射
    const monthMap: { [key: string]: number } = {
      '正': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
      '七': 7, '八': 8, '九': 9, '十': 10, '冬': 11, '腊': 12
    };
    
    // 日期映射
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
    
    if (!year || year < 1900 || year > 2100 || !month || month < 1 || month > 12 || !day || day < 1 || day > 30) {
      throw new Error('Invalid lunar date string');
    }
    
    return { year, month, day, isLeap };
  } catch (error) {
    console.error('Error parsing lunar date string:', error);
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: 1,
      day: 1,
      isLeap: false
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
  getLeapMonth,
  getLunarMonthDays,
  getLunarFestival,
  getSolarTerm,
  getFullLunarInfo,
  addLunarTime
}; 