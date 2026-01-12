export type Category = "To Do" | "In Progress" | "Review" | "Completed";

export interface Task {
  id: string;
  name: string;
  category: Category;
  start: string; // ISO date "YYYY-MM-DD"
  end: string;   // ISO date inclusive "YYYY-MM-DD"
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SelectionState {
  start?: string;
  end?: string;
  isSelecting: boolean;
}

export interface ModalState {
  open: boolean;
  draftRange?: DateRange;
  editingTaskId?: string;
}

export interface FilterState {
  search: string;
  categories: Category[];
  timeRangeWeeks: 0 | 1 | 2 | 3; // 0 = All
}

export interface AppState {
  tasks: Task[];
  selection: SelectionState;
  modal: ModalState;
  filters: FilterState;
  currentMonth: Date;
}

