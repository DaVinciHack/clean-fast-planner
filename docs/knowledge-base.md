# Fast Planner Knowledge Base

## Project Overview
The Fast Planner is a React application connecting to Palantir's OSDK that provides flight planning functionality for managing routes between oil rigs, airports, and platforms. The project is currently in a refactoring phase to improve code organization and maintainability.

## Project Environments
- Original version: http://localhost:8080/
- Refactored version: http://localhost:8080/?context=new

## Components Reference

### Core Modules
These modules handle the business logic and data flow.

| Module Name | Purpose | Status | Key Files |
|-------------|---------|--------|-----------|
| MapManager | Handles map display and interactions | In Use | `modules/MapManager.js` |
| WaypointManager | Manages route waypoints and coordinates | In Use | `modules/WaypointManager.js` |
| PlatformManager | Loads and displays rig/platform data | In Use | `modules/PlatformManager.js` |
| AircraftManager | Loads and filters aircraft data | In Use | `modules/AircraftManager.js` |
| RouteCalculator | Calculates route statistics | In Use | `modules/RouteCalculator.js` |
| RegionManager | Manages different geographical regions | In Use | `modules/RegionManager.js` |
| FavoriteLocationsManager | Handles saved favorite locations | In Use | `modules/FavoriteLocationsManager.js` |
| MapInteractionHandler | Manages user interactions with the map | In Use | `modules/MapInteractionHandler.js` |
| AppSettingsManager | Handles application settings and preferences | In Use | `modules/AppSettingsManager.js` |
| FlightCalculations | Performs flight-specific calculations | In Use | `modules/calculations/FlightCalculations.js` |

### UI Components
These components handle the visual presentation and user interactions.

| Component | Purpose | Status | Source File | Refactored File |
|-----------|---------|--------|-------------|-----------------|
| MapComponent | Renders the map | Refactored | ModularFastPlannerComponent.jsx | `/components/map/MapComponent.jsx` |
| LeftPanel | Route editor panel | Refactored | ModularFastPlannerComponent.jsx | `/components/panels/LeftPanel.jsx` |
| RightPanel | Controls and statistics panel | Refactored | ModularFastPlannerComponent.jsx | `/components/panels/RightPanel.jsx` |
| RightPanelContainer | Container for card components | Implemented | N/A | `/components/panels/RightPanelContainer.jsx` |
| MainCard | Main controls and region selection | Implemented | RightPanel.jsx | `/components/panels/cards/MainCard.jsx` |
| SettingsCard | Flight settings controls | Implemented | RightPanel.jsx | `/components/panels/cards/SettingsCard.jsx` |
| PerformanceCard | Performance calculations | Implemented | RightPanel.jsx | `/components/panels/cards/PerformanceCard.jsx` |
| WeatherCard | Weather settings controls | Implemented | RightPanel.jsx | `/components/panels/cards/WeatherCard.jsx` |
| FinanceCard | Finance calculations | Implemented | RightPanel.jsx | `/components/panels/cards/FinanceCard.jsx` |
| EvacuationCard | Evacuation planning | Implemented | RightPanel.jsx | `/components/panels/cards/EvacuationCard.jsx` |
| StopCard | Displays single stop information | Implemented | N/A | `/components/flight/stops/StopCard.jsx` |
| StopCardsContainer | Manages route stop cards with animations | Implemented | N/A | `/components/flight/stops/StopCardsContainer.jsx` |

### Context Providers
These provide state management and data sharing between components.

| Context | Purpose | Status | File |
|---------|---------|--------|------|
| RegionContext | Manages region selection and data | Implemented | `/context/RegionContext.jsx` |
| AircraftContext | Handles aircraft selection and data | Implemented | `/context/AircraftContext.jsx` |
| RouteContext | Maintains route data and calculations | Implemented | `/context/RouteContext.jsx` |
| MapContext | Manages map view state | Implemented | `/context/MapContext.jsx` |

## Data Flow
1. Authentication with Foundry happens via OAuth (handled by AuthContext)
2. The application loads platform data for the selected region
3. Aircraft data is loaded and filtered by region and type
4. Users create routes by clicking on the map or selecting locations
5. Route statistics are calculated based on selected aircraft and waypoints

## Current Work & Progress

### Completed Tasks
- Set up basic project structure with module system
- Implemented core manager classes
- Created initial UI components
- Established context providers
- Implemented basic route functionality
- Created version switcher in FastPlannerPage
- Refactored RightPanel into card-based architecture
- Implemented smooth card animations
- Created separate card components for different functionality
- Implemented comprehensive wind effect handling throughout UI
- Fixed route line display to properly update with wind-adjusted times
- Created two-step redraw process to ensure display consistency

### In Progress
- Implementing S92 dropdown calculator
- Extracting AircraftSelection component from MainCard
- Refining route calculation logic
- Improving event handling between components

### Next Steps
- Extract WaypointEditor component
- Implement comprehensive testing
- Add error boundaries around components
- Improve loading indicators
- Add fuel consumption display to route line
- Add passenger capacity information to route line
- Improve handling of long routes with many waypoints

## Developer Notes

### Aircraft Module Behavior
The AircraftManager follows this sequence:
1. Loads all aircraft from Foundry
2. Filters aircraft by current region
3. Groups aircraft by type
4. Further filters when an aircraft type is selected

### Route Calculation Process
Route calculations are performed in these steps:
1. WaypointManager provides waypoint coordinates
2. Distance between waypoints is calculated
3. Aircraft performance data is applied
4. Fuel requirements are calculated based on flight settings
5. Passenger capacity is determined based on fuel load and aircraft capacity

### Wind Effect Handling
The application accurately calculates and displays wind effects on flight time and fuel consumption:

1. **Wind Calculation Flow**:
   - The `WindCalculations.js` module calculates headwind/tailwind components for each route leg
   - `RouteCalculator.js` integrates these calculations into time and fuel estimates
   - `FastPlannerApp.jsx` handles weather state updates and triggers route recalculations
   - `WaypointManager.js` updates route displays with wind-adjusted times

2. **Key Components**:
   - `updateWeatherSettings()` in FastPlannerApp.jsx triggers a two-step redraw process
   - `onCalculationComplete` callback updates all UI components with consistent data
   - `createArrowsAlongLine()` in WaypointManager.js formats the route line labels

3. **Implementation Details**:
   - Route display uses a clearing step followed by a redraw to ensure data freshness
   - Times are displayed with consistent formatting across all UI components
   - Wind-adjusted times are displayed without redundant indicators on route lines
   - Global state management ensures all components access the same calculation results

All flight time calculations incorporate wind effects automatically, with no need for fallback data or safety corrections.

#### Route Stop Cards System
The StopCards system provides a visual representation of each stop in the route with the following features:

| Feature | Description |
|---------|-------------|
| Leg Data Display | Shows distance, time, fuel, and passenger data for each leg |
| FLIP Animations | Smooth animations when route waypoints are reordered |
| SVG Icons | Custom blue SVG icons for each metric in the cards |
| Card Highlighting | Visual feedback for active and newly added stops |
| Responsive Design | Cards adapt to available space without scrolling |

The system consists of:
- `StopCard.jsx` - Individual stop card component showing leg data
- `StopCardsContainer.jsx` - Container that manages cards and animations
- `StopIcons.jsx` - SVG icons used in the cards
- `StopCards.css` - Styling for the card system

## Common Issues & Solutions

**Issue**: Map not displaying after load
**Solution**: Check if MapManager's initialization is complete before trying to add layers

**Issue**: Aircraft filtering not working
**Solution**: Ensure region is properly loaded and AircraftManager has the correct region ID

**Issue**: Route calculations show incorrect values
**Solution**: Verify that the latest flight settings are being passed to the RouteCalculator

**Issue**: Aircraft selection dropdowns not resetting after selection
**Solution**: This was fixed in commit 6102f3b. The approach uses React state management in FastPlannerApp.jsx to properly reset dropdown values while maintaining the selected aircraft state. Direct DOM manipulation was removed from MainCard.jsx to avoid conflicts with React's virtual DOM.

**Issue**: Route line not updating when wind settings change
**Solution**: This was fixed in commit e983c7d. The solution implements a two-step redraw process that first clears the route display with `updateRoute(null)` and then redraws with the updated stats after a short delay. This ensures all cached route data is properly refreshed.

**Issue**: Wind correction times inconsistent across UI components
**Solution**: This was also fixed in commit e983c7d. The fix ensures all UI components access the same calculation results by using global state management and passing the complete `routeStats` object to all components that need it.

## References & Resources

### Documentation
- [Palantir OSDK Documentation](https://foundry-docs.palantir.com/docs/osdk/)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [React Context API Guide](https://reactjs.org/docs/context.html)

### Project Links
- [Project Repository](https://github.com/your-org/Fast-Planner-Clean)
- [Issue Tracker](https://github.com/your-org/Fast-Planner-Clean/issues)
- [Deployment Pipeline](https://jenkins.your-org.com/job/fast-planner/)

### Team Contacts
- Duncan (Project Lead) - duncan@example.com
- Flight Operations Team - flight-ops@example.com
- OSDK Support Team - osdk-support@example.com

## Template Instructions
This knowledge base template can be maintained in any of the recommended tools like Notion, Confluence, or GitBook. Update sections as work progresses to keep this document accurate and helpful for all developers on the project.