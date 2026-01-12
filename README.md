# Month View Task Planner

A simplified Google Calendar-like month view task planner built with React, TypeScript, and Vite.

## Features

### ✅ Implemented

1. **Month View Calendar**
   - Clean 7-column grid (Sunday-Saturday)
   - Shows current month with leading/trailing days from adjacent months (greyed out)
   - Highlights today's date
   - Responsive layout

2. **Task Creation via Drag Selection**
   - Click and drag across day cells to select a date range
   - Visual feedback with translucent highlight during selection
   - Modal opens on mouse up with:
     - Task name input (required)
     - Category dropdown (required, default: "To Do")
     - Create/Cancel buttons
   - Supports both forward and backward drag (normalizes range automatically)

3. **Task Movement via Drag and Drop**
   - Drag existing task bars to move them to different dates
   - Task retains its duration
   - Snaps to the drop day
   - Works across week boundaries

4. **Task Resize via Edge Handles**
   - Each task bar has left and right resize handles
   - Drag left handle to change start date
   - Drag right handle to change end date
   - Live visual feedback while resizing
   - Prevents invalid ranges (start cannot be after end; clamps to minimum 1-day duration)

5. **Categories**
   - Four categories: To Do, In Progress, Review, Completed
   - Color-coded task bars:
     - To Do: Blue (#4a90e2)
     - In Progress: Orange (#f5a623)
     - Review: Purple (#bd10e0)
     - Completed: Teal (#50e3c2)
   - Category selection required when creating tasks

6. **Filtering & Search**
   - **Search by name**: Live, case-insensitive search
   - **Category filters**: Multi-select checkboxes (all shown if none selected)
   - **Time-based filters**: Radio buttons for:
     - All (default)
     - Within 1 week
     - Within 2 weeks
     - Within 3 weeks
   - Filters are cumulative (AND logic)

7. **Task Rendering**
   - Tasks span multiple days as horizontal bars
   - Bars wrap correctly across week rows
   - Text truncation with ellipsis for long task names
   - Tooltips on hover (via title attribute)

8. **Persistence**
   - Tasks saved to localStorage automatically
   - Restored on page load

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173` (or the next available port).

## Project Structure

```
src/
├── components/
│   ├── CalendarMonth.tsx      # Main calendar grid component
│   ├── CalendarMonth.module.css
│   ├── DayCell.tsx            # Individual day cell component
│   ├── DayCell.module.css
│   ├── TaskBar.tsx            # Task bar with drag/resize handles
│   ├── TaskBar.module.css
│   ├── TaskModal.tsx          # Modal for creating tasks
│   ├── TaskModal.module.css
│   ├── FiltersPanel.tsx       # Left sidebar with filters
│   └── FiltersPanel.module.css
├── lib/
│   ├── dates.ts               # Date utilities (month grid generation)
│   └── taskSegments.ts        # Task segment calculation for rendering
├── types.ts                   # TypeScript type definitions
├── App.tsx                    # Main app component with state management
├── App.module.css
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## Design Choices & Tradeoffs

### State Management
- Used `useReducer` for centralized state management
- Simpler than Context API for this scope
- Could be extended with Context if needed for deeper component trees

### Date Handling
- Used `date-fns` for date utilities (allowed per requirements)
- Provides reliable date manipulation without heavy dependencies
- ISO date strings ("YYYY-MM-DD") used internally for consistency

### Drag & Drop Implementation
- **Custom pointer events** instead of external DnD libraries
- More control and lighter weight
- Tradeoff: More manual event handling, but acceptable for this use case
- Task bars use pointer events for move/resize
- Day cells use pointer events for selection

### Task Rendering
- Tasks split into segments per week row
- Each segment rendered as absolutely-positioned bar
- Simple vertical stacking (one bar per row height)
- Could be enhanced with multi-row stacking for overlapping tasks

### Filtering Strategy
- Filters applied cumulatively (AND logic)
- All filters combined before rendering
- Category filter: if none selected, shows all categories (treats as "show all")

### Styling
- CSS Modules for component-scoped styles
- No CSS-in-JS to keep bundle size small
- Simple, clean design with consistent spacing

### Browser Support
- Modern browsers with Pointer Events API support
- Touch devices should work (using pointer events, not mouse-only)

## Known Limitations & Future Enhancements

1. **Task Overlapping**: Currently tasks can overlap visually. Could add vertical stacking logic.
2. **Month Navigation**: No UI for changing months (would need prev/next buttons)
3. **Task Editing**: No inline editing of task name/category (would need click handler)
4. **Keyboard Navigation**: Limited keyboard support (modal supports Enter/Esc)
5. **Mobile Optimization**: Could be enhanced for smaller screens

## Technical Decisions

- **No external calendar libraries**: Built month grid from scratch
- **No heavy DnD libraries**: Custom pointer event implementation
- **TypeScript strict mode**: Type safety throughout
- **Functional components with hooks**: Modern React patterns
- **CSS Modules**: Scoped styling without runtime overhead

## Development Notes

- Task IDs generated using timestamp + random number
- Cell width calculated dynamically based on container width
- Task segments recalculated on month/task changes
- Selection state managed globally to handle pointer events outside component

## License

MIT

