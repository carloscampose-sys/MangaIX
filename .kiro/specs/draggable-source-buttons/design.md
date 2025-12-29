# Design Document: Draggable Source Buttons

## Overview

This design implements drag-and-drop functionality for source buttons using the Swapy library. The implementation allows users to reorder source buttons (TuManga, ManhwaWeb, Ikigai) in the search interface, with the new order persisted to local storage. The solution is minimal and focused, integrating Swapy into the existing source button rendering without major architectural changes.

## Architecture

The implementation follows a layered approach:

1. **Swapy Integration Layer**: Initializes and manages Swapy instances for the source button container
2. **State Management Layer**: Manages the current source order in React state and local storage
3. **UI Layer**: Renders draggable source buttons with visual feedback
4. **Persistence Layer**: Handles reading/writing source order to local storage

### Component Interaction Flow

```
App.jsx (Home Page)
  ↓
Source Button Container (flex div with Swapy)
  ├─ Source Button 1 (draggable)
  ├─ Source Button 2 (draggable)
  └─ Source Button 3 (draggable)
  ↓
Local Storage (persists order)
```

## Components and Interfaces

### 1. Source Order State Management

**Location**: `src/App.jsx` (MainApp component)

**New State Variables**:
```javascript
const [sourceOrder, setSourceOrder] = useState([]);
```

**Initialization Logic**:
- On component mount, load source order from local storage
- If no saved order exists, use default order from `getActiveSources()`
- Store the order as an array of source IDs: `['tumanga', 'manhwaweb', 'ikigai']`

### 2. Swapy Integration Hook

**Location**: `src/hooks/useSwapy.js` (new file)

**Purpose**: Encapsulate Swapy initialization and cleanup logic

**Interface**:
```javascript
export function useSwapy(containerId, onOrderChange) {
  // Initialize Swapy on mount
  // Listen for drag events
  // Call onOrderChange with new order
  // Cleanup on unmount
}
```

**Behavior**:
- Initializes Swapy with the container element
- Listens for `swapEnd` events
- Extracts new order from Swapy's internal state
- Calls callback with new order
- Cleans up Swapy instance on unmount

### 3. Local Storage Service

**Location**: `src/services/sourceOrderService.js` (new file)

**Functions**:
```javascript
export function saveSourceOrder(order) {
  // Save order array to localStorage['sourceOrder']
}

export function loadSourceOrder() {
  // Load order from localStorage['sourceOrder']
  // Return default order if not found
}

export function resetSourceOrder() {
  // Clear sourceOrder from localStorage
}
```

### 4. Source Button Container Modifications

**Location**: `src/App.jsx` (in the home page section)

**Changes**:
- Wrap source buttons in a container with `id="source-buttons-container"`
- Add `data-swapable` attribute to each source button
- Add unique `id` to each button: `source-{sourceId}`
- Apply Swapy CSS classes for visual feedback
- Reorder buttons based on `sourceOrder` state

**HTML Structure**:
```jsx
<div id="source-buttons-container" className="flex justify-center gap-2 sm:gap-3 mb-4">
  {sourceOrder.map(sourceId => {
    const source = getSourceById(sourceId);
    return (
      <button
        key={source.id}
        id={`source-${source.id}`}
        data-swapable
        // ... existing button props
      >
        {/* button content */}
      </button>
    );
  })}
</div>
```

## Data Models

### Source Order Model

```javascript
// Stored in localStorage as JSON string
{
  "sourceOrder": ["tumanga", "manhwaweb", "ikigai"]
}

// In-memory representation
const sourceOrder = ['tumanga', 'manhwaweb', 'ikigai'];
```

### Swapy Configuration

```javascript
{
  containerId: 'source-buttons-container',
  animation: 'smooth', // Smooth transitions during drag
  threshold: 0.5,      // Swap when 50% overlapped
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Source Order Persistence

**For any** source order that a user creates by dragging, saving that order to local storage and then reloading the page should result in the same source order being displayed.

**Validates: Requirements 3.1, 3.2**

### Property 2: Source Functionality After Reordering

**For any** source button that is reordered, clicking that button should select the correct source and enable search functionality with that source.

**Validates: Requirements 5.1, 5.2**

### Property 3: Default Order on Fresh Load

**For any** fresh browser session with no saved source order, the source buttons should display in the default order (TuManga, ManhwaWeb, Ikigai).

**Validates: Requirements 3.3**

### Property 4: Drag Visual Feedback

**For any** drag operation in progress, the dragged button should have visually distinct styling (reduced opacity or different appearance) compared to non-dragged buttons.

**Validates: Requirements 4.1, 4.2**

### Property 5: All Sources Remain Accessible

**For any** source order configuration, all three sources (TuManga, ManhwaWeb, Ikigai) should remain visible and clickable in the source button container.

**Validates: Requirements 2.1, 5.3**

## Error Handling

### Local Storage Errors

**Scenario**: Local storage is full or unavailable
- **Handling**: Catch errors in `saveSourceOrder()`, log to console, show toast notification
- **Fallback**: Continue with in-memory order, don't break the app

### Swapy Initialization Errors

**Scenario**: Container element not found or Swapy fails to initialize
- **Handling**: Wrap initialization in try-catch, log error
- **Fallback**: Render buttons in default order, disable drag functionality

### Invalid Stored Order

**Scenario**: Stored order contains invalid source IDs or is corrupted
- **Handling**: Validate stored order against active sources
- **Fallback**: Reset to default order

## Testing Strategy

### Unit Tests

**Test File**: `src/hooks/useSwapy.test.js`

1. **Test**: useSwapy initializes Swapy with correct container
   - Mock Swapy library
   - Verify initialization called with correct ID
   - Verify cleanup on unmount

2. **Test**: useSwapy calls onOrderChange with new order
   - Simulate swapEnd event
   - Verify callback receives correct order

**Test File**: `src/services/sourceOrderService.test.js`

1. **Test**: saveSourceOrder stores order in localStorage
   - Call saveSourceOrder with test order
   - Verify localStorage contains correct JSON

2. **Test**: loadSourceOrder retrieves order from localStorage
   - Set localStorage with test order
   - Call loadSourceOrder
   - Verify returned order matches

3. **Test**: loadSourceOrder returns default order when empty
   - Clear localStorage
   - Call loadSourceOrder
   - Verify default order returned

### Property-Based Tests

**Test File**: `src/components/SourceButtons.test.jsx`

**Property 1: Source Order Persistence**
- Generate random source orders
- Save to localStorage
- Reload component
- Verify order matches

**Property 2: Source Functionality After Reordering**
- Generate random source orders
- Render buttons in new order
- Click each button
- Verify correct source selected

**Property 3: Default Order on Fresh Load**
- Clear localStorage
- Render component
- Verify order equals default

**Property 4: Drag Visual Feedback**
- Simulate drag start
- Verify dragged button has visual feedback class
- Simulate drag end
- Verify visual feedback removed

**Property 5: All Sources Remain Accessible**
- Generate any source order
- Verify all three sources present in DOM
- Verify all buttons clickable

### Integration Tests

1. **Test**: Full drag-and-drop flow
   - Render source buttons
   - Simulate drag operation
   - Verify order changed
   - Verify localStorage updated
   - Reload page
   - Verify order persisted

2. **Test**: Source selection after reordering
   - Reorder buttons
   - Click different sources
   - Verify search works with each source

## Implementation Notes

### Swapy Library Choice

Swapy is chosen because:
- Lightweight and minimal (~5KB)
- No jQuery dependency
- Works well with React
- Simple API for drag-and-drop
- Good browser support

### Performance Considerations

- Swapy only initializes on the source button container (small DOM area)
- No performance impact on search or other functionality
- Local storage operations are synchronous but fast (small data)
- Drag operations are GPU-accelerated by browser

### Browser Compatibility

- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation: if Swapy fails, buttons still work (just not draggable)
- Touch support: Swapy supports touch events for mobile

### Accessibility

- Draggable buttons should have `aria-grabbed` attribute
- Keyboard support: Consider adding keyboard shortcuts for reordering (future enhancement)
- Screen readers: Announce when drag starts/ends

