# OSDK Waypoints Layer Conflict Fix

## Problem
The application was experiencing a MapBox error:
```
MapBox error: Layer with id "osdk-waypoints-labels" already exists on this map
```

This error occurred because multiple components were trying to add the same MapBox layer:
1. PlatformManager._addOsdkWaypointsToMap() was adding the layer
2. emergency-waypoint-fix.js was also trying to add the same layer

## Solution
This fix updates the code to:

1. Check if a layer already exists before adding it
2. Use proper visibility updates instead of removing/recreating layers
3. Add better error handling for "already exists" errors
4. Disable the emergency fixes that might be causing layer conflicts

## Implementation Details

The fix adds a new file `fix-osdk-waypoints-layer.js` that:
- Patches the PlatformManager._addOsdkWaypointsToMap method with an improved version
- Adds specific checks to prevent duplicate layer creation
- Uses a proper strategy to update existing layers instead of recreating them
- Disables any conflicting emergency fixes

We also removed any imports of emergency-waypoint-fix.js to prevent conflicts.

## Testing
To verify the fix is working:
1. Start the application
2. Open the browser console and look for "🔧 Applying OSDK waypoints layer fix..." message
3. Toggle waypoint mode on and off - you should no longer see the "already exists" error
4. Verify that waypoints appear correctly when waypoint mode is activated
