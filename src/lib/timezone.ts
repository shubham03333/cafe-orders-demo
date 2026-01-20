/**
 * Timezone utilities that use the configured system timezone
 * This file provides backward compatibility with the old IST functions
 * but now uses the dynamically configured timezone from system settings
 */

import { 
  getCurrentConfiguredDate, 
  getTodayDateString, 
  getYesterdayDateString,
  formatDateTime,
  isToday,
  isYesterday
} from './timezone-dynamic';

/**
 * Get current date in configured timezone
 * @deprecated Use getCurrentConfiguredDate() instead
 */
export async function getCurrentISTDate(): Promise<Date> {
  return await getCurrentConfiguredDate();
}

/**
 * Get today's date string in YYYY-MM-DD format in configured timezone
 * @deprecated Use getTodayDateString() instead
 */
export function getTodayISTDateString(): Promise<string> {
  return getTodayDateString();
}

/**
 * Get yesterday's date string in YYYY-MM-DD format in configured timezone
 * @deprecated Use getYesterdayDateString() instead
 */
export function getYesterdayISTDateString(): Promise<string> {
  return getYesterdayDateString();
}

/**
 * Check if it's midnight in configured timezone (between 00:00 and 00:01)
 */
export async function isMidnightIST(): Promise<boolean> {
  const date = await getCurrentConfiguredDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  return hours === 0 && minutes === 0;
}

/**
 * Format date for logging with configured timezone
 * @deprecated Use formatDateTime() instead
 */
export function formatISTDateTime(date: Date): Promise<string> {
  return formatDateTime(date);
}

/**
 * Check if a given date string is today in configured timezone
 * @deprecated Use isToday() instead
 */
export function isTodayIST(dateString: string): Promise<boolean> {
  return isToday(dateString);
}

/**
 * Check if a given date string is yesterday in configured timezone
 * @deprecated Use isYesterday() instead
 */
export function isYesterdayIST(dateString: string): Promise<boolean> {
  return isYesterday(dateString);
}
