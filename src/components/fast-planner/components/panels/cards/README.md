# Right Panel Card Components

This directory contains the individual card components that are displayed in the right panel of the Fast Planner application.

## Implementation Strategy

### Current Structure

1. **RightPanelContainer.jsx**
   - Manages which card is visible
   - Handles the tab selection system
   - Controls the sliding animations between cards

2. **BaseCard.jsx**
   - Base component for all card types
   - Ensures consistent styling and structure

3. **Implemented Cards:**
   - `MainCard.jsx` - Main controls including region selection and aircraft configuration
   - `SettingsCard.jsx` - Flight settings controls

### Cards To Be Implemented

1. **PerformanceCard.jsx**
   - Will contain take-off & landing performance calculations
   - Will include S92DropdownCalculator and other aircraft-specific components
   - Status: Placeholder implemented, full implementation pending

2. **WeatherCard.jsx**
   - Will contain weather settings and conditions
   - Will include wind, visibility, and ceiling controls
   - Status: Pending implementation

3. **FinanceCard.jsx**
   - Will contain flight cost calculation tools
   - Will include billing method selection and quote generation
   - Status: Pending implementation

4. **EvacuationCard.jsx**
   - Will contain evacuation planning tools
   - Will include personnel evacuation scheduling
   - Status: Pending implementation

## Animation Structure

The cards use a sliding animation system:
- When a new tab is selected, the current card slides out to the left
- The new card then slides in from the right
- These animations are controlled by the `RightPanelContainer` component

## State Management

Each card accesses only the contexts it needs:
- `RegionContext` - For region selection
- `AircraftContext` - For aircraft selection and configuration
- `RouteContext` - For route data and calculations
- `MapContext` - For map view state

## Implementation Next Steps

1. Complete the `PerformanceCard` with the S92 Dropdown Graph
2. Implement the `WeatherCard` with all weather controls
3. Implement the `FinanceCard` with cost calculation features
4. Implement the `EvacuationCard` with evacuation planning features
5. Ensure all cards use the appropriate context providers
6. Add error boundaries around each card for robustness