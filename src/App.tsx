import React, { useReducer, useCallback, useMemo } from 'react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import type { Task, Category, FilterState, AppState } from './types';
import { normalizeDateRange, getTimeRangeFilter, dateRangesOverlap } from './lib/dates';
import { CalendarMonth } from './components/CalendarMonth';
import { FiltersPanel } from './components/FiltersPanel';
import { TaskModal } from './components/TaskModal';
import styles from './App.module.css';

type AppAction =
  | { type: 'SELECTION_START'; isoDate: string }
  | { type: 'SELECTION_UPDATE'; isoDate: string }
  | { type: 'SELECTION_END' }
  | { type: 'MODAL_OPEN'; draftRange?: { start: string; end: string } }
  | { type: 'MODAL_CLOSE' }
  | { type: 'TASK_CREATE'; name: string; category: Category; start: string; end: string }
  | { type: 'TASK_MOVE'; taskId: string; newStartDate: string }
  | { type: 'TASK_RESIZE'; taskId: string; newStart: string; newEnd: string }
  | { type: 'FILTERS_CHANGE'; filters: FilterState }
  | { type: 'MONTH_CHANGE'; month: Date };

const initialState: AppState = {
  tasks: [],
  selection: {
    isSelecting: false
  },
  modal: {
    open: false
  },
  filters: {
    search: '',
    categories: [],
    timeRangeWeeks: 0
  },
  currentMonth: new Date()
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECTION_START':
      return {
        ...state,
        selection: {
          start: action.isoDate,
          end: action.isoDate,
          isSelecting: true
        }
      };

    case 'SELECTION_UPDATE':
      if (!state.selection.isSelecting) return state;
      return {
        ...state,
        selection: {
          ...state.selection,
          end: action.isoDate
        }
      };

    case 'SELECTION_END':
      if (!state.selection.isSelecting || !state.selection.start || !state.selection.end) {
        return {
          ...state,
          selection: { isSelecting: false }
        };
      }
      const normalized = normalizeDateRange(state.selection.start, state.selection.end);
      return {
        ...state,
        selection: { isSelecting: false },
        modal: {
          open: true,
          draftRange: normalized
        }
      };

    case 'MODAL_CLOSE':
      return {
        ...state,
        modal: { open: false },
        selection: { isSelecting: false }
      };

    case 'TASK_CREATE': {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random()}`,
        name: action.name,
        category: action.category,
        start: action.start,
        end: action.end
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
        modal: { open: false },
        selection: { isSelecting: false }
      };
    }

    case 'TASK_MOVE': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;

      const taskStart = parseISO(task.start);
      const taskEnd = parseISO(task.end);
      const duration = differenceInDays(taskEnd, taskStart);
      const newStart = parseISO(action.newStartDate);
      const newEnd = addDays(newStart, duration);

      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId
            ? { ...t, start: format(newStart, 'yyyy-MM-dd'), end: format(newEnd, 'yyyy-MM-dd') }
            : t
        )
      };
    }

    case 'TASK_RESIZE': {
      const normalized = normalizeDateRange(action.newStart, action.newEnd);
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId
            ? { ...t, start: normalized.start, end: normalized.end }
            : t
        )
      };
    }

    case 'FILTERS_CHANGE':
      return {
        ...state,
        filters: action.filters
      };

    case 'MONTH_CHANGE':
      return {
        ...state,
        currentMonth: action.month
      };

    default:
      return state;
  }
}

function filterTasks(tasks: Task[], filters: FilterState): Task[] {
  let filtered = tasks;

  // Search filter
  if (filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(task =>
      task.name.toLowerCase().includes(searchLower)
    );
  }

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter(task =>
      filters.categories.includes(task.category)
    );
  }

  // Time range filter
  if (filters.timeRangeWeeks > 0) {
    const today = new Date();
    const timeRange = getTimeRangeFilter(today, filters.timeRangeWeeks as 1 | 2 | 3);
    filtered = filtered.filter(task =>
      dateRangesOverlap(
        { start: task.start, end: task.end },
        timeRange
      )
    );
  }

  return filtered;
}

function App() {
  // Load from localStorage on mount (using lazy initializer)
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      try {
        const tasks = JSON.parse(saved) as Task[];
        return {
          ...initialState,
          tasks
        };
      } catch (e) {
        console.error('Failed to load tasks from localStorage', e);
        return initialState;
      }
    }
    return initialState;
  });

  // Save to localStorage whenever tasks change
  React.useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
  }, [state.tasks]);

  const handleSelectionStart = useCallback((isoDate: string) => {
    dispatch({ type: 'SELECTION_START', isoDate });
  }, []);

  const handleSelectionUpdate = useCallback((isoDate: string) => {
    dispatch({ type: 'SELECTION_UPDATE', isoDate });
  }, []);

  const handleSelectionEnd = useCallback(() => {
    dispatch({ type: 'SELECTION_END' });
  }, []);

  const handleModalClose = useCallback(() => {
    dispatch({ type: 'MODAL_CLOSE' });
  }, []);

  const handleTaskCreate = useCallback((name: string, category: Category) => {
    if (!state.modal.draftRange) return;
    dispatch({
      type: 'TASK_CREATE',
      name,
      category,
      start: state.modal.draftRange.start,
      end: state.modal.draftRange.end
    });
  }, [state.modal.draftRange]);

  const handleTaskMove = useCallback((taskId: string, newStartDate: string) => {
    dispatch({ type: 'TASK_MOVE', taskId, newStartDate });
  }, []);

  const handleTaskResize = useCallback((taskId: string, newStart: string, newEnd: string) => {
    dispatch({ type: 'TASK_RESIZE', taskId, newStart, newEnd });
  }, []);

  const handleFiltersChange = useCallback((filters: FilterState) => {
    dispatch({ type: 'FILTERS_CHANGE', filters });
  }, []);

  const handleMonthChange = useCallback((newMonth: Date) => {
    dispatch({ type: 'MONTH_CHANGE', month: newMonth });
  }, []);

  const filteredTasks = useMemo(
    () => filterTasks(state.tasks, state.filters),
    [state.tasks, state.filters]
  );

  const draftRange = state.modal.draftRange;

  return (
    <div className={styles.app}>
      <FiltersPanel
        filters={state.filters}
        onFiltersChange={handleFiltersChange}
      />
      <div className={styles.mainContent}>
        <CalendarMonth
          month={state.currentMonth}
          tasks={filteredTasks}
          selection={state.selection}
          cellWidth={150}
          onSelectionStart={handleSelectionStart}
          onSelectionUpdate={handleSelectionUpdate}
          onSelectionEnd={handleSelectionEnd}
          onTaskMove={handleTaskMove}
          onTaskResize={handleTaskResize}
          onMonthChange={handleMonthChange}
        />
      </div>
      {state.modal.open && (
        <TaskModal
          isOpen={state.modal.open}
          draftRange={draftRange}
          onClose={handleModalClose}
          onSubmit={handleTaskCreate}
        />
      )}
    </div>
  );
}

export default App;

