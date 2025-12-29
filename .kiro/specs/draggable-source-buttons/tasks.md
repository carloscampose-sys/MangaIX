# Implementation Plan: Draggable Source Buttons

## Overview

This plan breaks down the implementation of drag-and-drop source button reordering into discrete, manageable tasks. Each task builds on previous ones, starting with dependency installation, then creating supporting services, integrating Swapy, and finally testing the complete functionality.

## Tasks

- [x] 1. Install Swapy dependency
  - Install Swapy via pnpm: `pnpm install swapy`
  - Verify installation in package.json
  - Verify Swapy can be imported in the project
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create source order service
  - [x] 2.1 Create `src/services/sourceOrderService.js`
    - Implement `saveSourceOrder(order)` function
    - Implement `loadSourceOrder()` function
    - Implement `resetSourceOrder()` function
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 2.2 Write unit tests for sourceOrderService
    - **Property 1: Source Order Persistence**
    - **Validates: Requirements 3.1, 3.2**
    - Test saveSourceOrder stores to localStorage
    - Test loadSourceOrder retrieves from localStorage
    - Test loadSourceOrder returns default on empty

- [ ] 3. Create Swapy integration hook
  - [x] 3.1 Create `src/hooks/useSwapy.js`
    - Implement `useSwapy(containerId, onOrderChange)` hook
    - Initialize Swapy on mount with container element
    - Listen for `swapEnd` events
    - Extract new order from Swapy state
    - Call onOrderChange callback with new order
    - Cleanup Swapy instance on unmount
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write unit tests for useSwapy hook
    - **Property 4: Drag Visual Feedback**
    - **Validates: Requirements 4.1, 4.2**
    - Mock Swapy library
    - Test initialization with correct container
    - Test swapEnd event triggers callback
    - Test cleanup on unmount

- [ ] 4. Modify App.jsx to add source order state
  - [x] 4.1 Add sourceOrder state to MainApp component
    - Initialize sourceOrder state with empty array
    - Load source order from localStorage on mount
    - Set default order if localStorage is empty
    - _Requirements: 3.2, 3.3_

  - [x] 4.2 Add useEffect to initialize source order
    - Load saved order from localStorage on component mount
    - If no saved order, use default from getActiveSources()
    - Set sourceOrder state with loaded/default order

- [ ] 5. Integrate Swapy into source button rendering
  - [x] 5.1 Modify source button container in App.jsx
    - Add `id="source-buttons-container"` to container div
    - Add `data-swapable` attribute to each source button
    - Add unique `id={`source-${source.id}`}` to each button
    - Reorder buttons based on sourceOrder state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2_

  - [x] 5.2 Initialize useSwapy hook in App.jsx
    - Call useSwapy hook with container ID and callback
    - Implement onOrderChange callback to:
      - Update sourceOrder state
      - Save new order to localStorage
      - Show toast notification
    - _Requirements: 2.1, 2.2, 2.3, 3.1_

- [ ] 6. Add visual feedback for dragging
  - [x] 6.1 Add CSS classes for drag states
    - Add opacity/styling for dragged button
    - Add highlight/border for drop target
    - Add smooth transitions for visual feedback
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Apply Swapy CSS classes to buttons
    - Apply `swapable` class to source buttons
    - Apply `swapping` class during drag
    - Verify visual feedback appears during drag

- [ ] 7. Test source functionality after reordering
  - [ ] 7.1 Verify source selection works after reordering
    - Reorder buttons manually
    - Click each source button
    - Verify correct source is selected
    - Verify search works with selected source
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.2 Write property test for source functionality
    - **Property 2: Source Functionality After Reordering**
    - **Validates: Requirements 5.1, 5.2**
    - Generate random source orders
    - Render buttons in new order
    - Click each button
    - Verify correct source selected

- [ ] 8. Test persistence across page reloads
  - [ ] 8.1 Verify order persists after reload
    - Reorder buttons
    - Reload page
    - Verify order matches previous session
    - _Requirements: 3.2, 5.3_

  - [ ]* 8.2 Write property test for persistence
    - **Property 1: Source Order Persistence**
    - **Validates: Requirements 3.1, 3.2**
    - Save random order to localStorage
    - Reload component
    - Verify order matches

- [ ] 9. Test default order on fresh load
  - [ ] 9.1 Verify default order displays on fresh load
    - Clear localStorage
    - Reload page
    - Verify buttons display in default order (TuManga, ManhwaWeb, Ikigai)
    - _Requirements: 3.3_

  - [ ]* 9.2 Write property test for default order
    - **Property 3: Default Order on Fresh Load**
    - **Validates: Requirements 3.3**
    - Clear localStorage
    - Render component
    - Verify order equals default

- [ ] 10. Test all sources remain accessible
  - [ ] 10.1 Verify all sources visible in any order
    - Reorder buttons multiple times
    - Verify all three sources always visible
    - Verify all buttons clickable
    - _Requirements: 5.3, 6.1, 6.2_

  - [ ]* 10.2 Write property test for accessibility
    - **Property 5: All Sources Remain Accessible**
    - **Validates: Requirements 5.3, 6.1, 6.2**
    - Generate any source order
    - Verify all three sources present in DOM
    - Verify all buttons clickable

- [ ] 11. Test drag doesn't interfere with search
  - [ ] 11.1 Verify search functionality during/after dragging
    - Reorder buttons
    - Perform search
    - Verify search works correctly
    - Verify filters still work
    - _Requirements: 2.5, 6.3, 6.4_

  - [ ] 11.2 Verify no drag on search input
    - Attempt to drag search input
    - Verify no drag operation initiated
    - Verify search input remains functional

- [ ] 12. Error handling and edge cases
  - [ ] 12.1 Handle localStorage errors
    - Test when localStorage is full
    - Test when localStorage is unavailable
    - Verify app continues to work
    - Verify error logged to console
    - _Requirements: 3.1_

  - [ ] 12.2 Handle invalid stored order
    - Corrupt localStorage data
    - Reload page
    - Verify default order displayed
    - Verify no console errors

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ensure no console errors
  - Ask the user if questions arise

- [ ] 14. Final integration test
  - [ ] 14.1 Complete user flow test
    - Reorder buttons multiple times
    - Reload page
    - Verify order persisted
    - Click sources and perform searches
    - Verify all functionality works
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2, 5.3_

- [ ] 15. Final checkpoint - All features working
  - Verify drag-and-drop works smoothly
  - Verify visual feedback appears during drag
  - Verify order persists across reloads
  - Verify all sources remain functional
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All tests should pass before moving to the next major section

