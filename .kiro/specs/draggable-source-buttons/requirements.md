# Requirements Document: Draggable Source Buttons

## Introduction

This feature enables users to customize the order of source buttons (TuManga, ManhwaWeb, Ikigai) in the search interface. Users can drag and drop these buttons to rearrange them according to their preferences, with the new order persisted to local storage for future sessions.

## Glossary

- **Source Button**: A clickable button representing a manga/manhwa source (TuManga, ManhwaWeb, Ikigai)
- **Drag and Drop**: The interaction where users click and hold a button, move it to a new position, and release it
- **Local Storage**: Browser's persistent storage mechanism for saving user preferences
- **Source Order**: The sequence in which source buttons are displayed in the search interface
- **Swapy**: A lightweight drag-and-drop library for reordering elements

## Requirements

### Requirement 1: Install and Configure Swapy

**User Story:** As a developer, I want to install Swapy as a dependency, so that I can use it to implement drag-and-drop functionality for source buttons.

#### Acceptance Criteria

1. WHEN the project is set up, THE system SHALL install Swapy via pnpm
2. WHEN Swapy is installed, THE package.json SHALL include Swapy as a dependency
3. WHEN the application loads, THE Swapy library SHALL be available for import in React components

### Requirement 2: Make Source Buttons Draggable

**User Story:** As a user, I want to drag source buttons to reorder them, so that I can customize the order of sources in the search interface.

#### Acceptance Criteria

1. WHEN a user hovers over a source button, THE button SHALL display a visual indicator (cursor change, opacity change, or drag handle) showing it's draggable
2. WHEN a user drags a source button to a new position, THE button SHALL move to that position in real-time
3. WHEN a user releases a dragged button, THE button SHALL snap into its new position
4. WHEN a user drags a button, OTHER buttons SHALL shift to accommodate the new position
5. WHEN dragging is in progress, THE search functionality SHALL remain accessible (no blocking)

### Requirement 3: Persist Source Order to Local Storage

**User Story:** As a user, I want my custom source button order to be saved, so that my preferences persist across browser sessions.

#### Acceptance Criteria

1. WHEN a user finishes dragging a source button to a new position, THE new order SHALL be saved to local storage immediately
2. WHEN the application loads, THE source buttons SHALL be displayed in the order saved in local storage
3. WHEN local storage contains no saved order, THE source buttons SHALL display in the default order (TuManga, ManhwaWeb, Ikigai)
4. WHEN a user clears browser data, THE source order SHALL reset to the default order on next load

### Requirement 4: Provide Visual Feedback During Dragging

**User Story:** As a user, I want clear visual feedback while dragging, so that I understand what's happening and where the button will be placed.

#### Acceptance Criteria

1. WHEN a user starts dragging a source button, THE dragged button SHALL have reduced opacity or a different visual style
2. WHEN a user drags over other buttons, THOSE buttons SHALL show a visual indicator (highlight, border, or spacing change) showing where the button will be placed
3. WHEN a user completes the drag, ALL visual feedback indicators SHALL return to normal state
4. WHEN dragging is cancelled or completed, THE interface SHALL smoothly transition back to normal appearance

### Requirement 5: Maintain Functionality During and After Reordering

**User Story:** As a user, I want source buttons to remain fully functional after reordering, so that I can immediately use the new arrangement.

#### Acceptance Criteria

1. WHEN a user clicks a source button after reordering, THE source SHALL be selected and search functionality SHALL work normally
2. WHEN a user reorders buttons and then performs a search, THE selected source SHALL be the one they clicked
3. WHEN the page is refreshed after reordering, THE new button order SHALL persist and remain functional
4. WHEN a user switches between sources after reordering, ALL filters and search state SHALL work correctly with each source

### Requirement 6: Restrict Dragging to Source Button Area Only

**User Story:** As a developer, I want dragging to be limited to the source button section, so that it doesn't interfere with other UI interactions.

#### Acceptance Criteria

1. WHEN a user attempts to drag elements outside the source button area, THE drag operation SHALL not be initiated
2. WHEN a user drags a source button, OTHER UI elements (search input, filter button, etc.) SHALL not be affected
3. WHEN dragging is active in the source button area, THE search input and other controls SHALL remain fully functional
4. WHEN a user interacts with the search form, NO drag operations SHALL be triggered

