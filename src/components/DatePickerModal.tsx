import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import styles from './DatePickerModal.module.css';

interface DatePickerModalProps {
  isOpen: boolean;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  currentDate,
  onDateSelect,
  onClose
}) => {
  const [viewMonth, setViewMonth] = useState(currentDate);

  if (!isOpen) return null;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    setViewMonth(subMonths(viewMonth, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(addMonths(viewMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <button className={styles.navButton} onClick={handlePrevMonth}>
            ←
          </button>
          <h3 className={styles.monthTitle}>
            {format(viewMonth, 'MMMM yyyy')}
          </h3>
          <button className={styles.navButton} onClick={handleNextMonth}>
            →
          </button>
        </div>
        
        <div className={styles.weekHeaders}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className={styles.weekHeader}>
              {day}
            </div>
          ))}
        </div>
        
        <div className={styles.calendar}>
          {days.map((day) => (
            <button
              key={day.toISOString()}
              className={`${styles.dayButton} ${
                !isSameMonth(day, viewMonth) ? styles.otherMonth : ''
              } ${isToday(day) ? styles.today : ''}`}
              onClick={() => handleDateClick(day)}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
        
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.todayButton} 
            onClick={() => handleDateClick(new Date())}
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
};