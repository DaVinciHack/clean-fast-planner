# Code Analysis - WaypointManager.js

## File Overview
- **Size**: 2049 lines (way over the 500 line target!)
- **Last Modified**: May 21, 2025
- **Purpose**: Manages waypoints, route creation, and map interactions

## Main Methods Identified

### Core Waypoint Operations
- `addWaypoint()` - Main method for adding waypoints (very large, handles snapping)
- `addWaypointAtIndex()` - Adds waypoints at specific positions
- `removeWaypoint()` - Removes waypoints
- `updateWaypointNameAfterDrag()` - Updates names after dragging
- `updateMarkerPopup()` - Updates marker popups
- `clearRoute()` - Clears all waypoints

### Route Management
- `updateRoute()` - Main route update method (VERY large, handles all route drawing)
- `createArrowsAlongLine()` - Creates direction arrows on routes
- `setupRouteDragging()` - Sets up drag interactions (also very large)

### Utility Methods
- `isNavigationWaypoint()` - Checks waypoint type
- `getWaypointsByType()` - Filters waypoints
- `countWaypointsByType()` - Counts waypoint types
- `findPathInsertIndex()` - Finds insertion point for new waypoints
- `createWaypointMarker()` - Creates map markers

## Issues Identified

1. **File Size**: 2049 lines is 4x the target of 500 lines
2. **Method Complexity**: Some methods are hundreds of lines long
3. **Mixed Responsibilities**: Handles UI, data management, and map interactions
4. **Inline Classes**: Contains inline marker classes
5. **Heavy Map Manipulation**: Direct Mapbox GL manipulation throughout

## Refactoring Opportunities

1. **Extract Map Interactions**: Move all map drawing/layer management to separate module
2. **Extract Marker Management**: Separate module for marker creation/updates
3. **Extract Route Drawing**: Dedicated module for route visualization
4. **Extract Drag Handling**: Separate module for drag interactions
5. **Extract Waypoint Validation**: Separate validation and snapping logic

## Possible Module Structure
- `WaypointManager.js` - Core waypoint data management (~300 lines)
- `WaypointMapRenderer.js` - Map rendering and layers (~400 lines)
- `WaypointMarkers.js` - Marker creation and management (~300 lines)
- `WaypointDragHandler.js` - Drag interactions (~400 lines)
- `WaypointRouteDrawer.js` - Route line and arrow drawing (~400 lines)
- `WaypointSnapUtil.js` - Snapping and validation utilities (~200 lines)
