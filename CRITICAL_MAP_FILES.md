# CRITICAL MAP FILES - WORKING VERSION

## 🚨 NEVER MODIFY THESE FILES WHEN UPDATING TO NEW VERSION 🚨

These files contain the WORKING cursor and dragging logic from commit 8e9aeba07f700dc7e5ca57bcdba6e7fd83d3cf85.

### Core Map Files (KEEP FROM WORKING VERSION):
- `src/components/fast-planner/modules/MapManager.js` - Contains working cursor logic (lines 962-979)
- `src/components/fast-planner/modules/WaypointManager.js` - Route dragging functionality
- `src/components/fast-planner/modules/MapInteractionHandler.js` - Touch/iPad interaction handling

### Supporting Files (KEEP FROM WORKING VERSION):
- `src/components/fast-planner/modules/WaypointHandler.js`
- `src/components/fast-planner/modules/InteractionController.js`
- `src/components/fast-planner/modules/waypoints/WaypointInsertionManager.js`
- `src/components/fast-planner/modules/waypoints/WaypointModeHandler.js`
- `src/components/fast-planner/modules/waypoints/WaypointUtils.js`

### CSS Files (KEEP FROM WORKING VERSION):
- `src/components/fast-planner/FastPlannerStyles.css` - Contains iPad touch support CSS
- `src/components/fast-planner/waypoint-styles.css` - Route line styling

### Hook Files (KEEP FROM WORKING VERSION):
- `src/components/fast-planner/hooks/useManagers.js` - Manager initialization without conflicts

## Strategy for Updates:
1. BACKUP these files before any version update
2. Update other files from new version
3. RESTORE these files after update
4. Test map functionality immediately

## Working Cursor Logic Location:
MapManager.js lines 962-979 contains the precise cursor logic that works:
- Sets cursor to 'pointer' when over route lines
- Properly resets cursor while checking platform hover states
- Handles dragging state transitions correctly