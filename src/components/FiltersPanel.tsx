import React from 'react';
import type { Category, FilterState } from '../types';
import styles from './FiltersPanel.module.css';

interface FiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const CATEGORIES: Category[] = ["To Do", "In Progress", "Review", "Completed"];

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value
    });
  };

  const handleCategoryToggle = (category: Category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleTimeRangeChange = (weeks: 0 | 1 | 2 | 3) => {
    onFiltersChange({
      ...filters,
      timeRangeWeeks: weeks
    });
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Filters</h2>
      
      <div className={styles.section}>
        <label className={styles.label}>Search by Name</label>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search tasks..."
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Categories</label>
        <div className={styles.checkboxGroup}>
          {CATEGORIES.map(category => (
            <label key={category} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className={styles.checkbox}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
        {filters.categories.length === 0 && (
          <div className={styles.hint}>All categories shown</div>
        )}
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Time Range</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="timeRange"
              checked={filters.timeRangeWeeks === 0}
              onChange={() => handleTimeRangeChange(0)}
              className={styles.radio}
            />
            <span>All</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="timeRange"
              checked={filters.timeRangeWeeks === 1}
              onChange={() => handleTimeRangeChange(1)}
              className={styles.radio}
            />
            <span>Within 1 week</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="timeRange"
              checked={filters.timeRangeWeeks === 2}
              onChange={() => handleTimeRangeChange(2)}
              className={styles.radio}
            />
            <span>Within 2 weeks</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="timeRange"
              checked={filters.timeRangeWeeks === 3}
              onChange={() => handleTimeRangeChange(3)}
              className={styles.radio}
            />
            <span>Within 3 weeks</span>
          </label>
        </div>
      </div>
    </div>
  );
};

