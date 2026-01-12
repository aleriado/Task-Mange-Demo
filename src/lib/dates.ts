import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  parseISO,
  addDays,
  differenceInDays,
  isToday
} from 'date-fns';
import type { DateRange } from '../types';

export const WEEK_START_DAY = 0; // Sunday

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isoDate: string; // "YYYY-MM-DD"
  dayNumber: number;
  isToday: boolean;
}

export interface WeekRow {
  days: CalendarDay[];
  startDate: Date;
  endDate: Date;
}

/**
 * Generate calendar grid for a given month
 */
export function generateMonthGrid(month: Date): WeekRow[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: WEEK_START_DAY });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_START_DAY });
  
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const weeks: WeekRow[] = [];
  let currentWeek: CalendarDay[] = [];
  
  allDays.forEach((date: Date, index: number) => {
    const day: CalendarDay = {
      date,
      isCurrentMonth: date >= monthStart && date <= monthEnd,
      isoDate: format(date, 'yyyy-MM-dd'),
      dayNumber: date.getDate(),
      isToday: isToday(date)
    };
    
    currentWeek.push(day);
    
    // Every 7 days, start a new week
    if ((index + 1) % 7 === 0) {
      weeks.push({
        days: currentWeek,
        startDate: currentWeek[0].date,
        endDate: currentWeek[6].date
      });
      currentWeek = [];
    }
  });
  
  return weeks;
}

/**
 * Normalize a date range (ensure start <= end)
 */
export function normalizeDateRange(start: string, end: string): DateRange {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  
  if (startDate <= endDate) {
    return { start, end };
  }
  
  return { start: end, end: start };
}

/**
 * Calculate inclusive day count between two dates
 */
export function dayCountInclusive(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return differenceInDays(endDate, startDate) + 1;
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(
  range1: { start: string; end: string },
  range2: { start: string; end: string }
): boolean {
  const start1 = parseISO(range1.start);
  const end1 = parseISO(range1.end);
  const start2 = parseISO(range2.start);
  const end2 = parseISO(range2.end);
  
  return start1 <= end2 && start2 <= end1;
}

/**
 * Get date range for "within N weeks" filter
 */
export function getTimeRangeFilter(today: Date, weeks: 1 | 2 | 3): DateRange {
  const endDate = addDays(today, weeks * 7);
  return {
    start: format(today, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd')
  };
}

/**
 * Format date for display
 */
export function formatDateDisplay(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}

