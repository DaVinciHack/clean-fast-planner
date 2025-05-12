# Fast Planner Knowledge Base

## Project Overview
The Fast Planner is a React application connecting to Palantir's OSDK that provides flight planning functionality for managing routes between oil rigs, airports, and platforms. The project is currently in a refactoring phase to improve code organization and maintainability.

## Project Environments
- Original version: http://localhost:8080/
- Refactored version: http://localhost:8080/?context=new

## Flight Structure and Leg System

### Flight Structure
The Fast Planner application and Palantir backend use a structured model for flights:

1. **Flight**: A collection of legs with metadata
   - Contains legs, aircraft, crew information, and timestamps
   - Has unique identifiers and ETD (estimated time of departure)
   - Supports alternate routes with split points

2. **Leg**: A segment between two stops
   - Has a departure stop (from) and a destination stop (to)
   - Contains optional waypoints between stops
   - Stores distance, time, and fuel information

3. **Stop**: A main point (airport, rig, platform)
   - Always at the beginning or end of a leg
   - Never treated as intermediate points

4. **Waypoint**: An intermediate navigation point
   - Located between two stops within a leg
   - Enhances route precision and follows specific patterns

### Flight Editing and Creation
The application provides two distinct methods for flight management:

1. **Flight Creation**:
   - Initial flight creation accepts stops only
   - The Palantir backend adds intermediate waypoints automatically
   - No direct way to specify waypoints during initial creation

2. **Flight Editing**:
   - Full support for editing both stops and waypoints
   - Requires an existing flight ID
   - Supports reordering, adding, and removing points

### Palantir OSDK Integration
The integration with Palantir's OSDK requires these key elements:

1. **Critical Fields**:
   - `stops`: Array of location codes (e.g., ["ENZV", "ENLE"])
   - `displayWaypoints`: Array of labeled waypoints (e.g., ["ENZV (Dep)", "WP1", "ENLE (Des)"])
   - `combinedWaypoints`: Array of unlabeled waypoints for processing (e.g., ["ENZV", "WP1", "ENLE"])

2. **Data Format Constraints**:
   - All IDs must be simple strings, not objects with $primaryKey
   - Location codes must be uppercase
   - Waypoints in `displayWaypoints` use a specific format with roles (Dep, Stop, Des)

3. **API Functions**:
   - `createFlightFromLocations`: Creates new flights (stops only initially)
   - `editExistingFlightV2`: Edits existing flights (supports waypoints)
   - Both require different parameter formatting

## Components Reference

### Core Modules
These modules handle the business logic and data flow.

| Module Name | Purpose | Status | Key Files |
|-------------|---------|--------|-----------|
| MapManager | Handles map display and interactions | In Use | `modules/MapManager.js` |
| WaypointManager | Manages route waypoints and coordinates | To be Replaced | `modules/WaypointManager.js` |
| RouteManager | Replaces WaypointManager with leg support | New | `modules/RouteManager.js` |
| PlatformManager | Loads and displays rig/platform data | In Use | `modules/PlatformManager.js` |
| AircraftManager | Loads and filters aircraft data | In Use | `modules/AircraftManager.js` |
| RouteCalculator | Calculates route statistics | To be Updated | `modules/RouteCalculator.js` |
| RegionManager | Manages different geographical regions | In Use | `modules/RegionManager.js` |
| FavoriteLocationsManager | Handles saved favorite locations | In Use | `modules/FavoriteLocationsManager.js` |
| MapInteractionHandler | Manages user interactions with the map | Updated | `modules/MapInteractionHandler.js` |
| AppSettingsManager | Handles application settings and preferences | In Use | `modules/AppSettingsManager.js` |
| FlightCalculations | Performs flight-specific calculations | In Use | `modules/calculations/FlightCalculations.js` |

### New Model System
The refactored system uses a proper data model system:

| Model | Purpose | File |
|-------|---------|------|
| Flight | Main container for legs and metadata | `models/FlightModel.js` |
| Leg | Segment between two stops with optional waypoints | `models/FlightModel.js` |
| Stop | Main location point (departure or destination) | `models/FlightModel.js` |
| Waypoint | Intermediate navigation point within a leg | `models/FlightModel.js` |

### UI Components
These components handle the visual presentation and user interactions.

| Component | Purpose | Status | Source File | Refactored File |
|-----------|---------|--------|-------------|-----------------|
| MapComponent | Renders the map | Refactored | ModularFastPlannerComponent.jsx | `/components/map/MapComponent.jsx` |
| LeftPanel | Route editor panel | Refactored | ModularFastPlannerComponent.jsx | `/components/panels/LeftPanel.jsx` |
| RightPanel | Controls and statistics panel | Refactored | ModularFastPlannerComponent.jsx | `/components/panels/RightPanel.jsx` |
| WaypointModeToggle | Toggles between stops and waypoints mode | New | N/A | `/components/controls/WaypointModeToggle.jsx` |
| LegsPanel | Displays legs and waypoints structure | New | N/A | `/components/route/LegsPanel.jsx` |
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

### Legs and Waypoints Refactoring
We've implemented a proper leg-based structure to replace the old WaypointManager:

1. **Completed Items**:
   - Created data models for Flight, Leg, Stop, and Waypoint
   - Implemented RouteManager to replace WaypointManager
   - Added edit mode switching between 'stops' and 'waypoints'
   - Created UI components for displaying and editing legs
   - Updated MapInteractionHandler to work with the new structure
   - Added route dragging support for adding waypoints

2. **Integration Requirements**:
   - Update FastPlannerApp.jsx to use RouteManager instead of WaypointManager
   - Update RouteCalculator to work with the leg structure
   - Update OSDK integration to properly handle legs and waypoints
   - Ensure backward compatibility with existing flights

3. **Palantir Integration Issues**:
   - The Palantir flight creation API (`createFlightFromLocations`) only accepts stops
   - Only the edit API (`editExistingFlightV2`) accepts waypoints
   - We need to create flights first, then edit them to add waypoints
   - Alternatively, modify the Palantir API to accept waypoints during creation

## Developer Notes

### Aircraft Module Behavior
The AircraftManager follows this sequence:
1. Loads all aircraft from Foundry
2. Filters aircraft by current region
3. Groups aircraft by type
4. Further filters when an aircraft type is selected

### OSDK Flight Creation
The application integrates with Palantir OSDK to save flight plans back to Foundry. The flight creation process follows these steps:

1. **Data Collection**:
   - Flight data is gathered from the UI (waypoints, aircraft, ETD, crew)
   - The SaveFlightModal.jsx component collects remaining information
   - Data is formatted to match the Palantir API requirements

2. **API Integration**:
   - The PalantirFlightService.js handles all API interactions
   - It uses the createNewFlightFp2 action from the OSDK
   - Parameters must be formatted as simple strings, not objects with $primaryKey

3. **Critical Requirements**:
   - `aircraftId` must be a numeric ID string (e.g., "190") not a tail number
   - Crew member IDs must be simple strings, not objects with $primaryKey
   - All locations must be properly formatted as uppercase strings
   - Both CreateNewFlightFp2 and SaveFlightButton use the same format

4. **Implementation Details**:
   - The SaveFlightButton.jsx component retrieves aircraft ID from selectedAircraft.assetId
   - PalantirFlightService.js formats all parameters as simple strings
   - All API calls include the $returnEdits: true option for proper responses
   - Error handling is implemented for specific validation errors

When implementing flight saving functionality, always use simple string values for all IDs, not objects with $primaryKey properties, as the Palantir API implementation expects string values directly.

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

**Issue**: Flight creation API returning 400 Bad Request errors
**Solution**: The key is to use simple string values for all IDs, not objects with $primaryKey. When using the createNewFlightFp2 action, the aircraftId must be the numeric ID (e.g., "190") as a simple string. This was fixed in May 2025 by updating the PalantirFlightService.js and SaveFlightButton.jsx components to format parameters correctly.

**Issue**: Flight waypoints not saving to Palantir
**Solution**: The current Palantir API only accepts waypoints during the edit phase, not during initial creation. The solution is to first create the flight with stops only using `createFlightFromLocations`, then immediately edit it with `editExistingFlightV2` to add the waypoints. Another approach would be to modify the Palantir API to accept waypoints during creation.

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