# Fast Planner Debugging Guide

This guide provides solutions to common issues and debugging tips for the Fast Planner application.

## Common Issues and Solutions

### 1. Aircraft Not Appearing in Dropdown

**Symptoms:**
- Aircraft types dropdown shows "No aircraft available in this region"
- Console logs show aircraft are loaded but UI doesn't display them

**Solutions:**
- Use the "Force Refresh Aircraft" button (top right corner) to trigger a manual refresh
- Check the AircraftContext.jsx onAircraftFiltered callback to ensure it's processing the data correctly
- Verify that aircraftsByType is being populated with the correct structure
- Clear your browser cache and reload the page

### 2. Platform Manager Reference Error

**Symptoms:**
- Error in console: "Cannot read properties of null (reading 'loadPlatformsFromFoundry')"
- Platforms/rigs not loading on map

**Solutions:**
- If using the new implementation (context=new), use the "Emergency Fix" button (bottom right)
- If using the original implementation (context=original), the automatic fix script should repair the reference
- Manually fix in browser console by running:
  ```javascript
  // For original component
  window.platformManagerRef.current.mapManager = window.mapManagerRef.current;
  
  // For new implementation contexts
  window.platformManager.mapManager = window.mapManager;
  ```

### 3. Map Not Loading or Initializing

**Symptoms:**
- Blank map or "Map is not initialized" errors
- Map controls not responding

**Solutions:**
- Check network requests for missing map tiles or script errors
- Verify that MapBox token is valid
- Increase the initialization timeout in MapManager.js
- Force reload the map by using the debug panel's map status information

## Debugging Tools

### 1. URL Parameters

The application supports different implementation modes via URL parameters:
- Default (new implementation): `http://localhost:8080/`
- Original implementation: `http://localhost:8080/?context=original`
- Region Context only: `http://localhost:8080/?context=region`
- All contexts implementation: `http://localhost:8080/?context=all`

### 2. Debug Panel

Access the debug panel using the "Show Debug" button in the bottom right corner. The panel provides:
- Map status (initialized, loaded, has map instance)
- Region status (current region, mapManager reference)
- Platform status (initialization, visibility, platform count)
- Current region details

### 3. Loading Status Display

The loading status display in the top right corner shows the current loading status of:
- Map initialization
- Region loading
- Aircraft data loading
- Platforms/rigs loading

### 4. Console Debugging

We've added extensive console logging throughout the application. Check for:
- Initialization messages (look for "Starting...", "Loading..." messages)
- Error messages (look for "Error:", "Failed:", "Cannot:" messages)
- Component lifecycle messages (context creation, updates, etc.)

### 5. Emergency Fix Button

Use the "Emergency Fix" button (bottom right, red button) to:
- Check if platformManager is properly initialized
- Fix missing references between managers
- Reset global flags to force data reloading
- Force UI refresh

## Advanced Debugging

### Inspecting Context Values

To inspect the current state of context values in the browser console:

```javascript
// Get region context values
console.log(window.__REGION_CONTEXT__);

// Get aircraft context values
console.log(window.__AIRCRAFT_CONTEXT__);

// Get map context values
console.log(window.__MAP_CONTEXT__);
```

### Forcing Data Reload

To force a full data reload from Foundry:

```javascript
// Clear cached data flags
window.staticDataLoaded = false;
window.platformsLoaded = false;
window.aircraftLoaded = false;

// Force component update
window.forceReactUpdate();
```

### Manager Access

You can access the various managers directly in the console:

```javascript
// For original component
const mapManager = window.mapManagerRef.current;
const platformManager = window.platformManagerRef.current;
const regionManager = window.regionManagerRef.current;
const aircraftManager = window.aircraftManagerRef.current;

// For new implementation
const mapManager = window.mapManager;
const platformManager = window.platformManager;
```

## Getting Help

If you continue to experience issues:
1. Capture the console log from the browser dev tools
2. Take screenshots of any visible errors
3. Note which URL/context you're using
4. Document the steps to reproduce the issue

This information will help diagnose and fix the problem more quickly.
