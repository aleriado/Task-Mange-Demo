import React, { useEffect, useRef } from 'react';
import type { Category, DateRange } from '../types';
import styles from './TaskModal.module.css';

interface TaskModalProps {
  isOpen: boolean;
  draftRange?: DateRange;
  initialName?: string;
  initialCategory?: Category;
  isEditing?: boolean;
  onClose: () => void;
  onSubmit: (name: string, category: Category) => void;
}

const CATEGORIES: Category[] = ["To Do", "In Progress", "Review", "Completed"];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  draftRange,
  initialName = '',
  initialCategory = "To Do",
  isEditing = false,
  onClose,
  onSubmit
}) => {
  const [name, setName] = React.useState(initialName);
  const [category, setCategory] = React.useState<Category>(initialCategory);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCategory(initialCategory);
      // Focus input after modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialName, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), category);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const rangeText = draftRange
    ? `${draftRange.start} to ${draftRange.end}`
    : '';

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>
          {isEditing ? '✏️ Edit Task' : '➕ Create New Task'}
        </h2>
        
        {draftRange && (
          <div className={styles.rangeInfo}>
            Date Range: {rangeText}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="task-name" className={styles.label}>
              Task Name <span className={styles.required}>*</span>
            </label>
            <input
              id="task-name"
              ref={nameInputRef}
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name..."
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="task-category" className={styles.label}>
              Category <span className={styles.required}>*</span>
            </label>
            <select
              id="task-category"
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!name.trim()}
            >
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

