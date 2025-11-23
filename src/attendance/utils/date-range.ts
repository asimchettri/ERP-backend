// src/utils/date-range.ts

export interface DateRange {
  startDate: Date;
  endDate: Date;
}


  /**
   * Get the date range for a specific month and year
   *
   * @param month - Month in MM format (01-12) or undefined for current month
   * @param year - Year in YYYY format or undefined for current year
   * @returns DateRange object with startDate and endDate
   *
   * Example: getMonthRange("03", "2024") returns March 1-31, 2024
   */
 
export function getMonthRange(month?: string, year?: string): DateRange {
  
  const now = new Date();
  
  // Parse month and year, using current values as defaults
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth(); 
  const targetYear = year ? parseInt(year) : now.getFullYear();
  
  // Create start date (first day of month at 00:00:00)
  const startDate = new Date(targetYear, targetMonth, 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Create end date (last day of month at 23:59:59.999)
  const endDate = new Date(targetYear, targetMonth + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}




/**
 * Get a human-readable month name from month number
 * 
 * @param monthNumber - Month number (1-12)
 * @returns Month name as string
 * 
 * Example: getMonthName(3) returns "March"
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[monthNumber - 1] || 'Unknown';
}




/**
 * Format a date range as a human-readable string
 * 
 * @param dateRange - DateRange object
 * @returns Formatted string representation
 * 
 * Example: "March 2024 (2024-03-01 to 2024-03-31)"
 */
export function formatDateRange(dateRange: DateRange): string {
  const monthName = getMonthName(dateRange.startDate.getMonth() + 1);
  const year = dateRange.startDate.getFullYear();
  const startDateStr = dateRange.startDate.toISOString().split('T')[0];
  const endDateStr = dateRange.endDate.toISOString().split('T')[0];
  
  return `${monthName} ${year} (${startDateStr} to ${endDateStr})`;
}





/**
 * Calculate the number of days between two dates
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days (inclusive)
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDifference = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1; // +1 for inclusive count
}




/**
 * Check if a date falls within a date range
 * 
 * @param date - Date to check
 * @param dateRange - DateRange to check against
 * @returns True if date is within range
 */
export function isDateInRange(date: Date, dateRange: DateRange): boolean {
  return date >= dateRange.startDate && date <= dateRange.endDate;
}





/**
 * Get an array of all dates within a date range
 * 
 * @param dateRange - DateRange to get dates for
 * @returns Array of Date objects
 */
export function getDatesInRange(dateRange: DateRange): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(dateRange.startDate);
  
  while (currentDate <= dateRange.endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}