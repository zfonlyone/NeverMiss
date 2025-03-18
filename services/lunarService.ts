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
  parseLunarDate
}; 