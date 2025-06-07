# Working Version Information

## Overview

This is a verified working version of the Fast Planner application with all key functionality intact, including:

- Wind calculations properly implemented
- Time displayed on route lines
- Stop card calculations correctly adjusted for wind
- Weather inputs functioning correctly

## Key Fixes

1. Fixed the parameter order in WindCalculations.js:
   - Changed `calculateGroundSpeed(airspeed, course, windDirection, windSpeed)` to `calculateGroundSpeed(airspeed, course, windSpeed, windDirection)`

2. Made WindCalculations module globally available:
   - Added code to import the WindCalculations module and assign it to window.WindCalculations
   - This ensures the module is accessible for route and stop card calculations
   
3. Fixed Wind Input Synchronization (May 06, 2025):
   - Updated MainCard.jsx and WeatherCard.jsx to properly call onWeatherUpdate
   - Added parameter normalization for wind direction (0-359 range)
   - Enhanced updateWeatherSettings in FastPlannerApp.jsx with better state handling
   - Ensured RightPanel.jsx passes weather props to MainCard
   - Added clear documentation about wind input parameter order

## How to Return to This Working State

If you ever need to return to this known working state:

1. Make sure you are in the FastPlannerV2 directory:
   ```
   cd /Users/duncanburbury/FastPlannerV2
   ```

2. Check out the working-wind-calculations branch:
   ```
   git checkout working-wind-calculations
   ```

3. Install dependencies (only needed if node_modules is missing):
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at:
   - http://localhost:8080/ for the original version
   - http://localhost:8080/?context=new for the refactored version

## Important Notes

- Do not modify the WindCalculations.js file without thorough testing
- Always verify that wind calculations are working after any changes
- Always create a new branch before making changes to preserve this working state
- The wind input system is particularly sensitive - check both cards when making UI changes

## Verification Steps

To verify the application is working correctly:

1. Add at least two waypoints to create a route
2. Select an aircraft
3. Enter wind values in either the MainCard or WeatherCard
4. Verify that:
   - Wind values update in both cards
   - Time values appear on the route line
   - Stop cards show adjusted times
   - The console doesn't show "WindCalculations not available" errors
   
## Common Issues and Fixes

### Wind Inputs Not Syncing
- Check if RightPanel.jsx is passing weather and onWeatherUpdate props to MainCard
- Verify parameter order: updateWeatherSettings(speed, direction)
- Look for console errors about undefined values

### Route Times Not Updating with Wind
- Verify WindCalculations module is globally available
- Check for any component not properly passing weather to RouteCalculator
- Try forcing a recalculation with setForceUpdate
