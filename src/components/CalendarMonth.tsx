import React, { useRef, useEffect, useState } from 'react';
import { generateMonthGrid, normalizeDateRange, type WeekRow } from '../lib/dates';
import { calculateTaskSegments, groupSegmentsByWeek, type TaskSegment } from '../lib/taskSegments';
import { parseISO, format, addMonths, subMonths } from 'date-fns';
import type { Task, SelectionState } from '../types';
import { DayCell } from './DayCell';
import { TaskBar } from './TaskBar';
import { DatePickerModal } from './DatePickerModal';
import styles from './CalendarMonth.module.css';

interface CalendarMonthProps {
  month: Date;
  tasks: Task[];
  selection: SelectionState;
  cellWidth: number;
  onSelectionStart: (isoDate: string) => void;
  onSelectionUpdate: (isoDate: string) => void;
  onSelectionEnd: () => void;
  onTaskMove: (taskId: string, newStartDate: string) => void;
  onTaskResize: (taskId: string, newStart: string, newEnd: string) => void;
  onMonthChange: (newMonth: Date) => void;
}

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
  month,
  tasks,
  selection,
  cellWidth,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionEnd,
  onTaskMove,
  onTaskResize,
  onMonthChange
}) => {
  const [weekRows, setWeekRows] = useState<WeekRow[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellWidthState, setCellWidthState] = useState(cellWidth);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    const rows = generateMonthGrid(month);
    setWeekRows(rows);

    // Calculate cell width based on container
    if (gridRef.current) {
      const containerWidth = gridRef.current.offsetWidth;
      const calculatedWidth = containerWidth / 7;
      setCellWidthState(calculatedWidth);
    }
  }, [month]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (selection.isSelecting) {
        onSelectionEnd();
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [selection.isSelecting, onSelectionEnd]);

  // Calculate task segments
  const taskSegments: TaskSegment[] = [];
  tasks.forEach(task => {
    const segments = calculateTaskSegments(task, weekRows);
    taskSegments.push(...segments);
  });

  // Group segments by week and calculate row indices for stacking
  const segmentsByWeek = groupSegmentsByWeek(taskSegments, weekRows);

  // Helper to check if a date is in selection range
  const isDateInSelectionRange = (isoDate: string): boolean => {
    if (!selection.start || !selection.end) return false;
    const normalized = normalizeDateRange(selection.start, selection.end);
    const date = parseISO(isoDate);
    const start = parseISO(normalized.start);
    const end = parseISO(normalized.end);
    return date >= start && date <= end;
  };

  const isDateSelected = (isoDate: string): boolean => {
    return selection.start === isoDate;
  };

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePreviousMonth = () => {
    onMonthChange(subMonths(month, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(month, 1));
  };

  const handleRandomDate = () => {
    setIsDatePickerOpen(true);
  };

  const handleDatePickerClose = () => {
    setIsDatePickerOpen(false);
  };

  const handleDateSelect = (selectedDate: Date) => {
    onMonthChange(selectedDate);
  };

  const handleTodayClick = () => {
    onMonthChange(new Date());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePreviousMonth();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNextMonth();
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      setIsDatePickerOpen(true);
    } else if (event.key === 't' || event.key === 'T') {
      event.preventDefault();
      handleTodayClick();
    }
  };

  return (
    <div 
      className={styles.calendarContainer} 
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Calendar navigation"
    >
      <div className={styles.header}>
        <button 
          className={styles.navButton} 
          onClick={handlePreviousMonth}
          aria-label="Previous month"
        >
          ←
        </button>
        <div className={styles.monthTitle}>
          {format(month, 'MMMM yyyy')}
        </div>
        <button 
          className={styles.navButton} 
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          →
        </button>
        <button 
          className={styles.datePickerButton} 
          onClick={handleRandomDate}
          aria-label="Open date picker"
        >
          📅
        </button>
        <button 
          className={styles.todayButton} 
          onClick={handleTodayClick}
          aria-label="Go to today"
        >
          Today
        </button>
      </div>

      <div className={styles.helpText}>
        Use ← → arrow keys, R for date picker, T for today
      </div>

      <div className={styles.weekHeaders}>
        {weekDayHeaders.map(day => (
          <div key={day} className={styles.weekHeader}>
            {day}
          </div>
        ))}
      </div>

      <div ref={gridRef} className={styles.grid} data-calendar-grid>
        {weekRows.map((weekRow, weekIndex) => (
          <div key={weekIndex} className={styles.weekRow}>
            {weekRow.days.map((day, dayIndex) => (
              <div
                key={day.isoDate}
                className={styles.dayCellWrapper}
                style={{ width: `${cellWidthState}px` }}
                data-column={dayIndex}
                data-date={day.isoDate}
              >
                <DayCell
                  day={day}
                  isSelected={isDateSelected(day.isoDate)}
                  isInSelectionRange={isDateInSelectionRange(day.isoDate)}
                  onPointerDown={onSelectionStart}
                  onPointerEnter={onSelectionUpdate}
                />
              </div>
            ))}
            {/* Render task bars for this week row */}
            <div className={styles.taskBarsContainer}>
              {segmentsByWeek.get(weekIndex)?.map(segment => (
                <TaskBar
                  key={`${segment.task.id}-${weekIndex}-${segment.startDate}-${segment.endDate}`}
                  segment={segment}
                  cellWidth={cellWidthState}
                  onMove={onTaskMove}
                  onResize={onTaskResize}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <DatePickerModal
        isOpen={isDatePickerOpen}
        currentDate={month}
        onDateSelect={handleDateSelect}
        onClose={handleDatePickerClose}
      />
    </div>
  );
};

