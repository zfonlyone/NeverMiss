/**
 * Special Date Controller for NeverMiss
 * 
 * This controller handles the business logic for special dates
 */

import specialDateService from '../services/specialDateService';
import { SpecialDate, SpecialDateType } from '../models/Task';

/**
 * Load all special dates
 * @returns Promise with an object containing all types of special dates
 */
export async function loadAllSpecialDates(): Promise<{
  holiday: SpecialDate[];
  solarTerm: SpecialDate[];
  custom: SpecialDate[];
}> {
  try {
    // Initialize if needed
    await specialDateService.initializeSpecialDates();
    
    // Load each type of special dates
    const holidays = await specialDateService.getSpecialDates('holiday');
    const solarTerms = await specialDateService.getSpecialDates('solarTerm');
    const customDates = await specialDateService.getSpecialDates('custom');
    
    return {
      holiday: holidays,
      solarTerm: solarTerms,
      custom: customDates
    };
  } catch (error) {
    console.error('Error loading special dates:', error);
    return {
      holiday: [],
      solarTerm: [],
      custom: []
    };
  }
}

/**
 * Load special dates of a specific type
 * @param type Type of special dates to load
 * @returns Promise with array of special dates
 */
export async function loadSpecialDatesByType(type: SpecialDateType): Promise<SpecialDate[]> {
  try {
    return await specialDateService.getSpecialDates(type);
  } catch (error) {
    console.error(`Error loading ${type} special dates:`, error);
    return [];
  }
}

/**
 * Add a new custom special date
 * @param name Name of the special date
 * @param month Month number (1-12)
 * @param day Day of month
 * @param isLunar Whether it's a lunar date
 * @returns Promise with the newly created special date
 */
export async function addCustomDate(
  name: string, 
  month: number, 
  day: number, 
  isLunar: boolean = false
): Promise<SpecialDate | null> {
  try {
    // Basic validation
    if (!name || name.trim() === '') {
      throw new Error('Name is required');
    }
    
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    
    if (day < 1 || day > 31) {
      throw new Error('Day must be between 1 and 31');
    }
    
    return await specialDateService.addCustomSpecialDate(name, month, day, isLunar);
  } catch (error) {
    console.error('Error adding custom date:', error);
    return null;
  }
}

/**
 * Delete a custom special date
 * @param id ID of the special date to delete
 * @returns Promise that resolves to true if successful
 */
export async function deleteCustomDate(id: string): Promise<boolean> {
  try {
    await specialDateService.removeCustomSpecialDate(id);
    return true;
  } catch (error) {
    console.error('Error deleting custom date:', error);
    return false;
  }
}

/**
 * Get the actual date for a special date in a specific year
 * @param specialDate Special date to calculate for
 * @param year Year to calculate the date in
 * @returns Date object representing the actual date
 */
export function getDateForSpecialDate(specialDate: SpecialDate, year: number): Date {
  return specialDateService.getSpecialDateForYear(specialDate, year);
}

/**
 * Reset special dates to default values
 * @returns Promise that resolves to true if successful
 */
export async function resetToDefaults(): Promise<boolean> {
  try {
    await specialDateService.resetSpecialDatesToDefaults();
    return true;
  } catch (error) {
    console.error('Error resetting special dates:', error);
    return false;
  }
}

export default {
  loadAllSpecialDates,
  loadSpecialDatesByType,
  addCustomDate,
  deleteCustomDate,
  getDateForSpecialDate,
  resetToDefaults
}; 