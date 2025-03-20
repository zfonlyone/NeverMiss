/**
 * Special Date Service for NeverMiss
 * 
 * This service handles special dates including holidays and solar terms
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lunar, Solar } from 'lunar-javascript';
import { SpecialDate, SpecialDateType } from '../models/Task';

// Storage keys
const STORAGE_KEYS = {
  HOLIDAYS: 'nevermiss_holidays',
  SOLAR_TERMS: 'nevermiss_solar_terms',
  CUSTOM_DATES: 'nevermiss_custom_dates',
};

/**
 * Default Chinese holidays (both lunar and solar)
 */
const DEFAULT_HOLIDAYS: SpecialDate[] = [
  // Lunar holidays
  { id: 'spring_festival', name: '春节', type: 'holiday', month: 1, day: 1, isLunar: true },
  { id: 'lantern_festival', name: '元宵节', type: 'holiday', month: 1, day: 15, isLunar: true },
  { id: 'dragon_boat', name: '端午节', type: 'holiday', month: 5, day: 5, isLunar: true },
  { id: 'mid_autumn', name: '中秋节', type: 'holiday', month: 8, day: 15, isLunar: true },
  { id: 'double_ninth', name: '重阳节', type: 'holiday', month: 9, day: 9, isLunar: true },
  { id: 'laba_festival', name: '腊八节', type: 'holiday', month: 12, day: 8, isLunar: true },
  
  // Solar holidays
  { id: 'new_year', name: '元旦', type: 'holiday', month: 1, day: 1, isLunar: false },
  { id: 'womens_day', name: '妇女节', type: 'holiday', month: 3, day: 8, isLunar: false },
  { id: 'labor_day', name: '劳动节', type: 'holiday', month: 5, day: 1, isLunar: false },
  { id: 'childrens_day', name: '儿童节', type: 'holiday', month: 6, day: 1, isLunar: false },
  { id: 'cpc_founding', name: '建党节', type: 'holiday', month: 7, day: 1, isLunar: false },
  { id: 'army_day', name: '建军节', type: 'holiday', month: 8, day: 1, isLunar: false },
  { id: 'teachers_day', name: '教师节', type: 'holiday', month: 9, day: 10, isLunar: false },
  { id: 'national_day', name: '国庆节', type: 'holiday', month: 10, day: 1, isLunar: false },
];

/**
 * Default solar terms
 * Note: The actual dates vary slightly each year, these are approximations
 */
const DEFAULT_SOLAR_TERMS: SpecialDate[] = [
  { id: 'lichun', name: '立春', type: 'solarTerm', month: 2, day: 4, isLunar: false },
  { id: 'yushui', name: '雨水', type: 'solarTerm', month: 2, day: 19, isLunar: false },
  { id: 'jingzhe', name: '惊蛰', type: 'solarTerm', month: 3, day: 6, isLunar: false },
  { id: 'chunfen', name: '春分', type: 'solarTerm', month: 3, day: 21, isLunar: false },
  { id: 'qingming', name: '清明', type: 'solarTerm', month: 4, day: 5, isLunar: false },
  { id: 'guyu', name: '谷雨', type: 'solarTerm', month: 4, day: 20, isLunar: false },
  { id: 'lixia', name: '立夏', type: 'solarTerm', month: 5, day: 6, isLunar: false },
  { id: 'xiaoman', name: '小满', type: 'solarTerm', month: 5, day: 21, isLunar: false },
  { id: 'mangzhong', name: '芒种', type: 'solarTerm', month: 6, day: 6, isLunar: false },
  { id: 'xiazhi', name: '夏至', type: 'solarTerm', month: 6, day: 21, isLunar: false },
  { id: 'xiaoshu', name: '小暑', type: 'solarTerm', month: 7, day: 7, isLunar: false },
  { id: 'dashu', name: '大暑', type: 'solarTerm', month: 7, day: 23, isLunar: false },
  { id: 'liqiu', name: '立秋', type: 'solarTerm', month: 8, day: 8, isLunar: false },
  { id: 'chushu', name: '处暑', type: 'solarTerm', month: 8, day: 23, isLunar: false },
  { id: 'bailu', name: '白露', type: 'solarTerm', month: 9, day: 8, isLunar: false },
  { id: 'qiufen', name: '秋分', type: 'solarTerm', month: 9, day: 23, isLunar: false },
  { id: 'hanlu', name: '寒露', type: 'solarTerm', month: 10, day: 8, isLunar: false },
  { id: 'shuangjiang', name: '霜降', type: 'solarTerm', month: 10, day: 24, isLunar: false },
  { id: 'lidong', name: '立冬', type: 'solarTerm', month: 11, day: 7, isLunar: false },
  { id: 'xiaoxue', name: '小雪', type: 'solarTerm', month: 11, day: 22, isLunar: false },
  { id: 'daxue', name: '大雪', type: 'solarTerm', month: 12, day: 7, isLunar: false },
  { id: 'dongzhi', name: '冬至', type: 'solarTerm', month: 12, day: 22, isLunar: false },
  { id: 'xiaohan', name: '小寒', type: 'solarTerm', month: 1, day: 6, isLunar: false },
  { id: 'dahan', name: '大寒', type: 'solarTerm', month: 1, day: 20, isLunar: false },
];

/**
 * Initialize the default special dates in storage if they don't exist
 */
export async function initializeSpecialDates(): Promise<void> {
  try {
    // Check if holidays exist
    const holidaysData = await AsyncStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    if (!holidaysData) {
      await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(DEFAULT_HOLIDAYS));
    }

    // Check if solar terms exist
    const solarTermsData = await AsyncStorage.getItem(STORAGE_KEYS.SOLAR_TERMS);
    if (!solarTermsData) {
      await AsyncStorage.setItem(STORAGE_KEYS.SOLAR_TERMS, JSON.stringify(DEFAULT_SOLAR_TERMS));
    }

    // Initialize empty custom dates if they don't exist
    const customDatesData = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_DATES);
    if (!customDatesData) {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_DATES, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing special dates:', error);
    throw error;
  }
}

/**
 * Get all special dates of a specific type
 * @param type The type of special dates to retrieve
 * @returns Array of special dates
 */
export async function getSpecialDates(type: SpecialDateType): Promise<SpecialDate[]> {
  try {
    let storageKey = '';
    switch (type) {
      case 'holiday':
        storageKey = STORAGE_KEYS.HOLIDAYS;
        break;
      case 'solarTerm':
        storageKey = STORAGE_KEYS.SOLAR_TERMS;
        break;
      case 'custom':
        storageKey = STORAGE_KEYS.CUSTOM_DATES;
        break;
      default:
        throw new Error(`Unknown special date type: ${type}`);
    }

    const data = await AsyncStorage.getItem(storageKey);
    if (!data) {
      // Initialize if not exists
      await initializeSpecialDates();
      return type === 'holiday' ? DEFAULT_HOLIDAYS : 
             type === 'solarTerm' ? DEFAULT_SOLAR_TERMS : [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`Error getting special dates of type ${type}:`, error);
    return [];
  }
}

/**
 * Get all special dates (holidays, solar terms, and custom dates)
 * @returns All special dates
 */
export async function getAllSpecialDates(): Promise<SpecialDate[]> {
  try {
    const holidays = await getSpecialDates('holiday');
    const solarTerms = await getSpecialDates('solarTerm');
    const customDates = await getSpecialDates('custom');
    
    return [...holidays, ...solarTerms, ...customDates];
  } catch (error) {
    console.error('Error getting all special dates:', error);
    return [];
  }
}

/**
 * Add a custom special date
 * @param name Name of the special date
 * @param month Month (1-12)
 * @param day Day of the month
 * @param isLunar Whether it's a lunar date
 * @returns The newly created special date
 */
export async function addCustomSpecialDate(
  name: string,
  month: number,
  day: number,
  isLunar: boolean = false
): Promise<SpecialDate> {
  try {
    const customDates = await getSpecialDates('custom');

    const newDate: SpecialDate = {
      id: `custom_${Date.now()}`,
      name,
      type: 'custom',
      month,
      day,
      isLunar
    };

    const updatedDates = [...customDates, newDate];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_DATES, JSON.stringify(updatedDates));

    return newDate;
  } catch (error) {
    console.error('Error adding custom special date:', error);
    throw error;
  }
}

/**
 * Remove a custom special date
 * @param id ID of the custom special date to remove
 */
export async function removeCustomSpecialDate(id: string): Promise<void> {
  try {
    const customDates = await getSpecialDates('custom');
    const updatedDates = customDates.filter(date => date.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_DATES, JSON.stringify(updatedDates));
  } catch (error) {
    console.error('Error removing custom special date:', error);
    throw error;
  }
}

/**
 * Get the real date for a special date in a specific year
 * This is particularly useful for solar terms which can vary by 1-2 days each year
 * @param specialDate The special date
 * @param year The year to calculate for
 * @returns Date object representing the actual date
 */
export function getSpecialDateForYear(specialDate: SpecialDate, year: number): Date {
  if (specialDate.isLunar) {
    // For lunar dates, convert to solar date for the specified year
    const lunar = Lunar.fromYmd(year, specialDate.month, specialDate.day);
    return lunar.getSolar().toDate();
  } else if (specialDate.type === 'solarTerm') {
    // For solar terms, we should use the actual date for the year
    // This is a simplification - in a real app, you would use a more precise algorithm
    // or an API to get the actual solar term dates for a specific year
    const approxDate = new Date(year, specialDate.month - 1, specialDate.day);
    return approxDate;
  } else {
    // For regular solar dates
    return new Date(year, specialDate.month - 1, specialDate.day);
  }
}

/**
 * Reset special dates to defaults
 */
export async function resetSpecialDatesToDefaults(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(DEFAULT_HOLIDAYS));
    await AsyncStorage.setItem(STORAGE_KEYS.SOLAR_TERMS, JSON.stringify(DEFAULT_SOLAR_TERMS));
    
    // Keep custom dates as they are user-created
  } catch (error) {
    console.error('Error resetting special dates to defaults:', error);
    throw error;
  }
}

export default {
  initializeSpecialDates,
  getSpecialDates,
  getAllSpecialDates,
  addCustomSpecialDate,
  removeCustomSpecialDate,
  getSpecialDateForYear,
  resetSpecialDatesToDefaults
}; 