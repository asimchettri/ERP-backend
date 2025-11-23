export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getMonthRange(month?: string, year?: string): DateRange {
  const now = new Date();
  const targetYear = year ? parseInt(year) : now.getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0); // Last day of the month

  return { startDate, endDate };
}

export function formatDateRange(dateRange: DateRange): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const startMonth = monthNames[dateRange.startDate.getMonth()];
  const startYear = dateRange.startDate.getFullYear();
  const startFormatted = dateRange.startDate.toISOString().split('T')[0];
  const endFormatted = dateRange.endDate.toISOString().split('T')[0];

  return `${startMonth} ${startYear} (${startFormatted} to ${endFormatted})`;
}
