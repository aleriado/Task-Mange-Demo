import { parseISO, format, isBefore, isAfter, startOfDay } from 'date-fns';
import type { Task } from '../types';
import type { WeekRow } from './dates';

export interface TaskSegment {
  task: Task;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  startColumn: number; // 0-6
  widthInColumns: number; // number of days
  rowIndex: number; // vertical stacking index (0 = top row)
}

/**
 * Calculate segments for a task across week rows
 * A task may span multiple weeks, so we need to break it into segments per week
 */
export function calculateTaskSegments(
  task: Task,
  weekRows: WeekRow[]
): TaskSegment[] {
  const taskStart = parseISO(task.start);
  const taskEnd = parseISO(task.end);
  
  const segments: TaskSegment[] = [];
  
  weekRows.forEach((weekRow) => {
    const weekStart = startOfDay(weekRow.startDate);
    const weekEnd = startOfDay(weekRow.endDate);
    
    // Check if task overlaps this week
    if (isAfter(taskStart, weekEnd) || isBefore(taskEnd, weekStart)) {
      return; // No overlap
    }
    
    // Calculate segment range (clamped to week boundaries)
    const segmentStartDate = isBefore(taskStart, weekStart) ? weekStart : taskStart;
    const segmentEndDate = isAfter(taskEnd, weekEnd) ? weekEnd : taskEnd;
    
    // Find column indices
    const startColumn = weekRow.days.findIndex(
      day => day.date.getTime() === segmentStartDate.getTime()
    );
    
    const endColumn = weekRow.days.findIndex(
      day => day.date.getTime() === segmentEndDate.getTime()
    );
    
    if (startColumn === -1 || endColumn === -1) {
      return; // Should not happen, but handle gracefully
    }
    
    const segmentStartISO = format(segmentStartDate, 'yyyy-MM-dd');
    const segmentEndISO = format(segmentEndDate, 'yyyy-MM-dd');
    const widthInColumns = endColumn - startColumn + 1;
    
    segments.push({
      task,
      startDate: segmentStartISO,
      endDate: segmentEndISO,
      startColumn,
      widthInColumns,
      rowIndex: 0 // Will be calculated later
    });
  });
  
  return segments;
}

/**
 * Calculate all segments for multiple tasks
 */
export function calculateAllTaskSegments(
  tasks: Task[],
  weekRows: WeekRow[]
): TaskSegment[] {
  const allSegments: TaskSegment[] = [];
  
  tasks.forEach(task => {
    const segments = calculateTaskSegments(task, weekRows);
    allSegments.push(...segments);
  });
  
  return allSegments;
}

/**
 * Check if two segments overlap (same week row)
 */
function segmentsOverlap(seg1: TaskSegment, seg2: TaskSegment): boolean {
  const seg1EndCol = seg1.startColumn + seg1.widthInColumns - 1;
  const seg2EndCol = seg2.startColumn + seg2.widthInColumns - 1;
  
  return !(seg1EndCol < seg2.startColumn || seg2EndCol < seg1.startColumn);
}

/**
 * Calculate row indices for overlapping segments (vertical stacking)
 */
export function calculateRowIndices(segments: TaskSegment[]): TaskSegment[] {
  // Sort segments by start column (left to right)
  const sorted = [...segments].sort((a, b) => a.startColumn - b.startColumn);
  
  // Track which rows are occupied at each column
  const rows: TaskSegment[][] = [];
  
  sorted.forEach(segment => {
    // Find the first available row where this segment doesn't overlap
    let rowIndex = 0;
    let placed = false;
    
    while (!placed) {
      if (rowIndex >= rows.length) {
        // Create a new row
        rows.push([]);
        placed = true;
      } else {
        // Check if this segment overlaps with any segment in this row
        const overlaps = rows[rowIndex].some(existing => 
          segmentsOverlap(segment, existing)
        );
        
        if (!overlaps) {
          placed = true;
        } else {
          rowIndex++;
        }
      }
    }
    
    // Place the segment in the row
    rows[rowIndex].push(segment);
    segment.rowIndex = rowIndex;
  });
  
  return segments;
}

/**
 * Group segments by week row for efficient rendering
 */
export function groupSegmentsByWeek(
  segments: TaskSegment[],
  weekRows: WeekRow[]
): Map<number, TaskSegment[]> {
  const grouped = new Map<number, TaskSegment[]>();
  
  weekRows.forEach((weekRow, weekIndex) => {
    const weekSegments = segments.filter(segment => {
      const segmentStart = parseISO(segment.startDate);
      const weekStart = startOfDay(weekRow.startDate);
      const weekEnd = startOfDay(weekRow.endDate);
      return segmentStart >= weekStart && segmentStart <= weekEnd;
    });
    
    if (weekSegments.length > 0) {
      // Calculate row indices for this week's segments
      const withRowIndices = calculateRowIndices(weekSegments);
      grouped.set(weekIndex, withRowIndices);
    }
  });
  
  return grouped;
}

