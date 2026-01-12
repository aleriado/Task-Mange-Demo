import React from 'react';
import type { CalendarDay } from '../lib/dates';
import type { Task } from '../types';
import styles from './DayCell.module.css';

interface DayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  isInSelectionRange: boolean;
  tasks?: Task[];
  onPointerDown: (isoDate: string) => void;
  onPointerEnter: (isoDate: string) => void;
}

export const DayCell: React.FC<DayCellProps> = ({
  day,
  isSelected,
  isInSelectionRange,
  tasks = [],
  onPointerDown,
  onPointerEnter
}) => {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onPointerDown(day.isoDate);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.buttons === 1) {
      // Only if mouse button is pressed
      onPointerEnter(day.isoDate);
    }
  };

  // Count tasks that include this day
  const dayTasks = tasks.filter(task => {
    return task.start <= day.isoDate && task.end >= day.isoDate;
  });

  const taskCount = dayTasks.length;
  const hasCompletedTasks = dayTasks.some(task => task.category === 'Completed');
  const hasInProgressTasks = dayTasks.some(task => task.category === 'In Progress');

  return (
    <div
      className={`
        ${styles.cell}
        ${!day.isCurrentMonth ? styles.otherMonth : ''}
        ${day.isToday ? styles.today : ''}
        ${isSelected ? styles.selected : ''}
        ${isInSelectionRange ? styles.inRange : ''}
        ${taskCount > 0 ? styles.hasTasks : ''}
      `}
      data-date={day.isoDate}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      title={taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? 's' : ''}` : undefined}
    >
      <div className={styles.dayHeader}>
        <span className={styles.dayNumber}>{day.dayNumber}</span>
        {taskCount > 0 && (
          <div className={styles.taskIndicators}>
            {hasCompletedTasks && <div className={styles.indicator} data-status="completed" />}
            {hasInProgressTasks && <div className={styles.indicator} data-status="progress" />}
            {taskCount > 2 && (
              <span className={styles.taskCount}>+{taskCount - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

