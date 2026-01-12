import React from 'react';
import type { CalendarDay } from '../lib/dates';
import styles from './DayCell.module.css';

interface DayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  isInSelectionRange: boolean;
  onPointerDown: (isoDate: string) => void;
  onPointerEnter: (isoDate: string) => void;
}

export const DayCell: React.FC<DayCellProps> = ({
  day,
  isSelected,
  isInSelectionRange,
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

  return (
    <div
      className={`
        ${styles.cell}
        ${!day.isCurrentMonth ? styles.otherMonth : ''}
        ${day.isToday ? styles.today : ''}
        ${isSelected ? styles.selected : ''}
        ${isInSelectionRange ? styles.inRange : ''}
      `}
      data-date={day.isoDate}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
    >
      <span className={styles.dayNumber}>{day.dayNumber}</span>
    </div>
  );
};

