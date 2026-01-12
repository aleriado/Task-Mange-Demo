import React, { useState, useRef, useEffect } from 'react';
import type { TaskSegment } from '../lib/taskSegments';
import { parseISO, format, differenceInDays } from 'date-fns';
import styles from './TaskBar.module.css';

interface TaskBarProps {
  segment: TaskSegment;
  cellWidth: number;
  onMove: (taskId: string, newStartDate: string) => void;
  onResize: (taskId: string, newStart: string, newEnd: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskBar: React.FC<TaskBarProps> = ({
  segment,
  cellWidth,
  onMove,
  onResize,
  onEdit,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [showActions, setShowActions] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; date: string } | null>(null);

  const task = segment.task;
  const left = segment.startColumn * cellWidth;
  const width = segment.widthInColumns * cellWidth - 4; // 4px margin
  const TASK_BAR_HEIGHT = 28;
  const TASK_BAR_MARGIN = 2;
  const top = 2 + segment.rowIndex * (TASK_BAR_HEIGHT + TASK_BAR_MARGIN);
  
  // Calculate task duration
  const duration = differenceInDays(parseISO(task.end), parseISO(task.start)) + 1;
  const isCompleted = task.category === 'Completed';

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging && !isResizing) return;

      const calendarGrid = document.querySelector('[data-calendar-grid]');
      if (!calendarGrid) return;

      if (isResizing) {
        handleResizeMove(e);
      } else if (isDragging) {
        handleDragMove(e);
      }
    };

    const handlePointerUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(null);
        dragStartRef.current = null;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isResizing, cellWidth]);

  const findDateAtX = (x: number): string | null => {
    const calendarGrid = document.querySelector('[data-calendar-grid]');
    if (!calendarGrid) return null;

    const columnIndex = Math.max(0, Math.min(6, Math.floor(x / cellWidth)));

    // Find the week row containing this task bar
    if (barRef.current) {
      let parent = barRef.current.parentElement;
      while (parent && parent !== calendarGrid) {
        // Check if this is a week row (has 7 day cells)
        const dayCells = parent.querySelectorAll('[data-date]');
        if (dayCells.length === 7) {
          // This is a week row
          if (dayCells[columnIndex]) {
            return (dayCells[columnIndex] as HTMLElement).dataset.date || null;
          }
        }
        parent = parent.parentElement;
      }
    }

    // Fallback: find by column index in any week row
    const allWeekRows = Array.from(calendarGrid.children);
    for (const weekRow of allWeekRows) {
      const dayCells = weekRow.querySelectorAll('[data-date]');
      if (dayCells.length === 7 && dayCells[columnIndex]) {
        return (dayCells[columnIndex] as HTMLElement).dataset.date || null;
      }
    }

    return null;
  };

  const handleResizeMove = (e: PointerEvent) => {
    if (!dragStartRef.current) return;

    const calendarGrid = document.querySelector('[data-calendar-grid]');
    if (!calendarGrid) return;

    const gridRect = calendarGrid.getBoundingClientRect();
    const x = e.clientX - gridRect.left;
    const targetDate = findDateAtX(x);
    if (!targetDate) return;

    const taskStart = parseISO(task.start);
    const taskEnd = parseISO(task.end);
    const targetDateObj = parseISO(targetDate);

    if (isResizing === 'left') {
      // Resizing left handle (start date)
      if (targetDateObj > taskEnd) {
        // Clamp to end date
        onResize(task.id, format(taskEnd, 'yyyy-MM-dd'), format(taskEnd, 'yyyy-MM-dd'));
      } else {
        onResize(task.id, targetDate, format(taskEnd, 'yyyy-MM-dd'));
      }
    } else if (isResizing === 'right') {
      // Resizing right handle (end date)
      if (targetDateObj < taskStart) {
        // Clamp to start date
        onResize(task.id, format(taskStart, 'yyyy-MM-dd'), format(taskStart, 'yyyy-MM-dd'));
      } else {
        onResize(task.id, format(taskStart, 'yyyy-MM-dd'), targetDate);
      }
    }
  };

  const handleDragMove = (e: PointerEvent) => {
    const calendarGrid = document.querySelector('[data-calendar-grid]');
    if (!calendarGrid) return;

    const gridRect = calendarGrid.getBoundingClientRect();
    const x = e.clientX - gridRect.left;
    const targetDate = findDateAtX(x);
    if (!targetDate) return;

    // Calculate new start date based on target
    const newStart = targetDate;

    if (newStart !== task.start) {
      onMove(task.id, newStart);
    }
  };

  const handleBarPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).classList.contains(styles.resizeHandle)) {
      return; // Don't start drag if clicking resize handle
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      date: task.start
    };
  };

  const handleResizePointerDown = (side: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(side);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      date: side === 'left' ? task.start : task.end
    };
  };

  const handleDoubleClick = () => {
    if (onEdit) {
      onEdit(task.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowActions(!showActions);
  };

  return (
    <div
      ref={barRef}
      className={`${styles.bar} ${isCompleted ? styles.completed : ''} ${isDragging ? styles.dragging : ''}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
      }}
      data-category={task.category}
      onPointerDown={handleBarPointerDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      title={`${task.name} (${duration} day${duration > 1 ? 's' : ''})`}
    >
      <div
        className={`${styles.resizeHandle} ${styles.leftHandle}`}
        onPointerDown={handleResizePointerDown('left')}
        title="Resize start"
      />
      
      <div className={styles.barContent}>
        <div className={styles.taskInfo}>
          <span className={styles.taskName}>{task.name}</span>
          {duration > 1 && (
            <span className={styles.duration}>{duration}d</span>
          )}
        </div>
        <div className={styles.categoryIndicator} />
      </div>
      
      <div
        className={`${styles.resizeHandle} ${styles.rightHandle}`}
        onPointerDown={handleResizePointerDown('right')}
        title="Resize end"
      />

      {showActions && (
        <div className={styles.actionMenu}>
          {onEdit && (
            <button 
              className={styles.actionButton}
              onClick={() => {
                onEdit(task.id);
                setShowActions(false);
              }}
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button 
              className={styles.actionButton}
              onClick={() => {
                onDelete(task.id);
                setShowActions(false);
              }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

