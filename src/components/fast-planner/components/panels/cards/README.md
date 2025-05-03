# Right Panel Card Components

This directory contains the individual card components that are displayed in the right panel of the Fast Planner application.

## Implementation Details

### Component Structure

1. **RightPanelContainer.jsx**
   - Manages which card is visible
   - Handles the tab selection system
   - Controls the sliding animations between cards
   - Uses a single DOM element with animations to switch between cards

2. **BaseCard.jsx**
   - Base component for all card types
   - Ensures consistent styling and structure
   - Handles proper ID propagation for animation management

3. **Implemented Cards:**
   - `MainCard.jsx` - Main controls including region selection and aircraft configuration
   - `SettingsCard.jsx` - Flight settings controls
   - `PerformanceCard.jsx` - Performance calculations including S92 dropdown calculator
   - `WeatherCard.jsx` - Weather settings and conditions
   - `FinanceCard.jsx` - Finance calculations and billing details
   - `EvacuationCard.jsx` - Evacuation planning tools

## Animation System

The cards use a smooth sliding animation system:
- When a new tab is selected, the current card slides out to the right
- The new card then slides in from the right
- The animation uses cubic-bezier timing for natural easing, slowing down dramatically at the end
- Animation classes are defined in FastPlannerStyles.css and animationFixes.css

## State Management

Each card accesses only the contexts it needs:
- `RegionContext` - For region selection
- `AircraftContext` - For aircraft selection and configuration
- `RouteContext` - For route data and calculations
- `MapContext` - For map view state

## Implementation Next Steps

1. Complete the S92 dropdown graph implementation in the Performance Card
2. Add error boundaries around each card for robustness
3. Implement any additional aircraft-specific performance calculators
4. Add comprehensive propTypes validation for all components

## File Structure

```
cards/
├── BaseCard.jsx            - Base component for consistent styling
├── MainCard.jsx            - Main controls and region selection
├── SettingsCard.jsx        - Flight settings controls
├── PerformanceCard.jsx     - Performance calculations
├── WeatherCard.jsx         - Weather settings
├── FinanceCard.jsx         - Finance calculations
├── EvacuationCard.jsx      - Evacuation planning
├── index.js                - Exports all card components
└── performance/            - Aircraft-specific performance tools
    └── S92PerformanceCard.jsx - S92 helicopter calculator
```
