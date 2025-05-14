# Fast Planner Application Map - Updated May 6, 2025

## Project Overview

The Fast Planner is a React application connecting to Palantir's OSDK (Ontology Software Development Kit) that provides flight planning functionality for managing routes between oil rigs, airports, and platforms. The project has undergone significant refactoring from a monolithic structure to a more modular architecture.

## Current Project Structure

### Entry Point

After the latest cleanup, the application now has a single consolidated entry point:

**Refactored Implementation (FastPlannerApp.jsx)**
- Accessed via: `http://localhost:8080/` (or any domain)
- Uses modular architecture with functionality split among multiple files
- Implements dynamic redirect URL generation for flexible deployment

The legacy implementations have been moved to `src/_old_components/` for reference but are no longer used in the application.

### Core Architecture

The application follows a manager-based architecture with these key components:

#### Managers (Module Classes)
Located in `/src/components/fast-planner/modules/`:

- **MapManager** - Handles map display and interactions
- **WaypointManager** - Manages route waypoints and coordinates
- **PlatformManager** - Loads and displays rig/platform data
- **AircraftManager** - Loads and filters aircraft data
- **RouteCalculator** - Calculates route statistics (distance, fuel, time)
- **RegionManager** - Manages different geographical regions
- **FavoriteLocationsManager** - Handles saved favorite locations
- **MapInteractionHandler** - Manages user interactions with the map
- **AppSettingsManager** - Handles application settings and preferences
- **FlightCalculations** - Performs flight-specific calculations

#### UI Components
Located in `/src/components/fast-planner/components/`:

- **MapComponent** - Renders the map
- **LeftPanel** - Route editor panel
- **RightPanel** - Controls and statistics panel (now using card-based architecture)
- **RouteStatsCard** - Displays route statistics

#### RightPanel Cards
Located in `/src/components/fast-planner/components/panels/cards/`:

- **MainCard** - Main controls, region selection, aircraft selection, weather inputs
- **SettingsCard** - Flight settings and calculation parameters
- **PerformanceCard** - Performance calculations including S92 dropdown
- **WeatherCard** - Weather settings with wind inputs
- **FinanceCard** - Finance calculations
- **EvacuationCard** - Evacuation planning

#### Context Providers
Located in `/src/components/fast-planner/context/`:

- **RegionContext** - Manages region selection and data
- **AircraftContext** - Handles aircraft selection and data
- **RouteContext** - Maintains route data and calculations
- **MapContext** - Manages map view state

### Data Flow

1. Authentication with Foundry happens via OAuth (handled by AuthContext)
2. The application loads platform data for the selected region
3. Aircraft data is loaded and filtered by region and type
4. Users create routes by clicking on the map or selecting locations
5. Route statistics are calculated based on selected aircraft and waypoints
6. Wind data entered in either MainCard or WeatherCard affects route calculations

## Current Status

### Completed Work

#### Modular Architecture ✅
- Successfully migrated from monolithic to modular component structure
- Implemented manager modules for different functionalities
- Created focused UI components with clear responsibilities

#### Wind Input System ✅
- Fixed synchronization between MainCard and WeatherCard
- Added wind direction normalization to 0-359 range
- Enhanced updateWeatherSettings function for proper state management
- Thoroughly documented wind input system

#### Project Cleanup ✅
- Removed unused/duplicate files
- Fixed hardcoded localhost references
- Added comprehensive documentation
- Created verification scripts and git tags

#### RightPanel Architecture ✅
- Implemented card-based panel with tabs
- Created individual card components for different functionalities
- Added smooth animations for card transitions

#### S92 Performance Calculator ✅
- Integrated S92 dropdown calculations with PerformanceCard
- Added interactive inputs for weight, temperature, and wind conditions
- Implemented visualization with charts

## Next Steps in Development

### 1. Enhanced Calculations - CURRENT PRIORITY

#### Fuel Calculations
- Improve accuracy of fuel burn calculations
- Implement contingency fuel calculations
- Add visualization for fuel requirements

#### Passenger (Pax) Calculations
- Create passenger weight and capacity calculations
- Implement dynamic capacity based on fuel load
- Add visualization for passenger distribution

### 2. Component Refactoring

#### Aircraft Selection Component
- Extract from MainCard.jsx to components/aircraft/AircraftSelection.jsx
- Create dedicated AircraftContext for state management
- Improve filtering and selection UI

#### WaypointEditor Component
- Extract from LeftPanel.jsx to components/waypoints/WaypointEditor.jsx
- Connect to RouteContext for state management
- Enhance waypoint editing interface

### 3. Foundry Integration

### Integration with Palantir

#### Save Flight Functionality ✅
- Successfully implemented flight saving to Palantir Foundry
- Fixed API parameter formats to use simple string IDs (not $primaryKey objects)
- Added comprehensive error handling and validation
- Integrated with createNewFlightFp2 OSDK action

The Save Flight functionality creates new flights in Palantir Foundry using the following components:
- **SaveFlightButton.jsx** - UI component that triggers the save operation
- **SaveFlightModal.jsx** - Collects additional flight information (ETD, crew)
- **PalantirFlightService.js** - Handles API interactions and parameter formatting

Key implementation details:
1. Aircraft ID must be provided as a simple string (numeric ID like "190")
2. All API calls include the $returnEdits: true option
3. Crew member IDs are sent as simple strings, not objects with $primaryKey
4. Parameter format matches the server-side implementation requirements

#### Weather Integration
- Connect to weather data sources via OSDK
- Implement weather visualization on map
- Add weather-based route optimization

## Development Guidelines

### Code Organization
- Keep components focused and single-responsibility
- Use React contexts for state management
- Implement proper error handling
- Document all public functions and interfaces
- Maintain consistent naming conventions

### Testing Strategy
- Verify wind inputs work correctly after any changes
- Test route calculations with different aircraft and conditions
- Ensure authentication works with dynamic redirect URL

### Version Control
- Use the created git tags to reference important milestones:
  - `wind-input-fix-v3` - Contains all wind input fixes
  - `cleanup-phase1-complete` - After fixing hardcoded values
  - `cleanup-phase2-complete` - After removing unused files
  - `cleanup-complete` - Final state after all cleanup
  - `documentation-updated` - After organizing documentation

## Reference Documentation

### Implementation Documents
- `/docs/WIND_INPUT_SYSTEM.md` - Detailed documentation of the wind input system
- `/docs/PROJECT_STATUS_AND_ROADMAP.md` - Current status and future plans
- `/docs/MEMORY_SUMMARY.md` - Quick reference for project context

### Cleanup Documentation
- `/docs/CLEANUP_PLAN.md` - Overall cleanup strategy
- `/docs/CLEANUP_FILES_PLAN.md` - File cleanup details
- `/docs/CLEANUP_SUMMARY.md` - Summary of completed cleanup

## Using This Map

Reference this document when:
1. Starting work on a new feature
2. Deciding where to place new code
3. Understanding the project architecture
4. Onboarding new team members

Update this document when:
1. Adding new components or modules
2. Changing data flow or architecture
3. Completing a development milestone
4. Finding improvements to the documentation itself

## Conclusion

The Fast Planner has successfully been refactored from a monolithic structure to a modular architecture. The application now has better separation of concerns, improved maintainability, and the flexibility to be deployed to any environment. The focus now shifts to enhancing the calculations for fuel and passengers, followed by deeper integration with Palantir Foundry services.