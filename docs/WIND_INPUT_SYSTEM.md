# Wind Input System Documentation

## Overview
The Fast Planner application allows users to input wind information in two different locations:
1. The Main Card (compact input in the aircraft configuration section)
2. The Weather Card (dedicated weather settings panel)

Both input methods update the same central weather state and must stay synchronized.

## Component Architecture

### FastPlannerApp.jsx
This is the core component that:
- Maintains the central weather state: `const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });`
- Provides the `updateWeatherSettings(windSpeed, windDirection)` function that updates the state
- Handles recalculation of routes when weather changes
- Passes the weather state and update function to child components

### RightPanel.jsx
This component:
- Receives weather state and `onWeatherUpdate` function from FastPlannerApp
- **CRITICAL**: Must pass both `weather` and `onWeatherUpdate` props to MainCard
- Passes both props to WeatherCard

### MainCard.jsx
This component:
- Displays compact wind input controls
- Uses the `weather` prop to display current values
- Calls `onWeatherUpdate(speed, direction)` when inputs change
- The order of parameters is fixed: speed first, then direction

### WeatherCard.jsx
This component:
- Displays comprehensive weather controls
- Uses the same parameter order convention as MainCard
- Calls `onWeatherUpdate(speed, direction)` with the same parameter order

## Implementation Details

### Wind Direction Convention
- The application uses meteorological convention: direction FROM which wind is blowing
- Values range from 0 to 359 degrees

### Parameter Order
- In all function calls: `(speed, direction)` - Speed is always the first parameter
- Example: `onWeatherUpdate(15, 270)` means 15 knots from 270 degrees

### Normalization
- Wind direction should be normalized to the 0-359 range using:
  ```javascript
  const normalizedDirection = ((newDirection % 360) + 360) % 360;
  ```

## Common Issues and Solutions

### Wind Inputs Not Syncing
- Check if RightPanel.jsx is passing *both* weather props to MainCard
- Verify parameter order consistency in all files
- Look for missing MainCard props in JSX

### Input Changes Not Working
- Check console for errors about undefined values or invalid updates
- Verify the `onChange` handlers are calling `onWeatherUpdate` correctly
- Ensure wind direction is being normalized properly

### Wind Not Affecting Route Calculations
- Make sure WindCalculations module is globally available
- Check that all components are passing wind information properly
- Force an update with `setForceUpdate(prev => prev + 1)`

## Testing Wind Input Changes

Always test the following after making any changes to these components:

1. Enter a wind direction value in MainCard
2. Verify it updates in WeatherCard
3. Enter a wind speed value in WeatherCard
4. Verify it updates in MainCard
5. Verify route time calculations update with new values
6. Check that stop cards reflect the new wind settings

## Code Examples

### Example: Updating Wind Direction Input
```javascript
<input
  id="wind-direction"
  type="number"
  min="0"
  max="359"
  value={weather.windDirection}
  onChange={(e) => {
    const newDirection = parseInt(e.target.value) || 0;
    // Normalize to 0-359 range
    const normalizedDirection = ((newDirection % 360) + 360) % 360;
    // Important: Pass parameters in correct order (speed, direction)
    onWeatherUpdate(weather.windSpeed, normalizedDirection);
  }}
/>
```

### Example: Updating Wind Speed Input
```javascript
<input
  id="wind-speed"
  type="number"
  min="0"
  max="100"
  value={weather.windSpeed}
  onChange={(e) => {
    const newSpeed = parseInt(e.target.value) || 0;
    // Important: Pass parameters in correct order (speed, direction)
    onWeatherUpdate(newSpeed, weather.windDirection);
  }}
/>
```

## Maintainer Notes

Wind input issues have been fixed multiple times. The most recent comprehensive fix was applied on May 6, 2025, creating a dedicated branch `wind-input-fix-may2025`.

If you encounter problems, you can:
1. Check out this branch for reference
2. Compare your changes with the working implementation
3. Use git to review the specific changes in the fix commit

Always commit your working changes immediately after verifying they function correctly.