import React, { useRef, useEffect, useState, useMemo } from 'react';
import { generateMonthGrid, normalizeDateRange, type WeekRow } from '../lib/dates';
import { calculateTaskSegments, groupSegmentsByWeek, type TaskSegment } from '../lib/taskSegments';
import { parseISO, format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
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
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
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
  onTaskEdit,
  onTaskDelete,
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

  // Calculate task statistics for current month
  const currentMonthTasks = useMemo(() => {
    const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');
    
    return tasks.filter(task => {
      const taskStart = parseISO(task.start);
      const taskEnd = parseISO(task.end);
      const monthStartDate = parseISO(monthStart);
      const monthEndDate = parseISO(monthEnd);
      
      // Task overlaps with current month
      return taskStart <= monthEndDate && taskEnd >= monthStartDate;
    });
  }, [tasks, month]);

  const taskStats = useMemo(() => {
    const stats = {
      total: currentMonthTasks.length,
      completed: 0,
      inProgress: 0,
      todo: 0,
      review: 0
    };
    
    currentMonthTasks.forEach((task: Task) => {
      switch (task.category) {
        case 'Completed':
          stats.completed++;
          break;
        case 'In Progress':
          stats.inProgress++;
          break;
        case 'To Do':
          stats.todo++;
          break;
        case 'Review':
          stats.review++;
          break;
      }
    });
    
    return stats;
  }, [currentMonthTasks]);

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

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <div className={styles.navigationSection}>
          <button 
            className={styles.navButton} 
            onClick={handlePreviousMonth}
            aria-label="Previous month"
          >
            ←
          </button>
          <div className={styles.monthInfo}>
            <div className={styles.monthTitle}>
              {format(month, 'MMMM yyyy')}
            </div>
            {taskStats.total > 0 && (
              <div className={styles.taskStats}>
                {taskStats.total} task{taskStats.total !== 1 ? 's' : ''}
                {taskStats.completed > 0 && (
                  <span className={styles.statBadge} data-category="completed">
                    {taskStats.completed} done
                  </span>
                )}
                {taskStats.inProgress > 0 && (
                  <span className={styles.statBadge} data-category="progress">
                    {taskStats.inProgress} in progress
                  </span>
                )}
              </div>
            )}
          </div>
          <button 
            className={styles.navButton} 
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        
        <div className={styles.actionSection}>
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
      </div>

      <div className={styles.helpText}>
        Click ✏️ to edit tasks • Click + button to add new tasks
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
                  tasks={tasks}
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
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
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

