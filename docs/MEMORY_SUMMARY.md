# Fast Planner V3 Memory Summary

## Context and History

The Fast Planner is a React application connecting to Palantir's OSDK (Ontology Software Development Kit) that provides flight planning functionality for managing routes between oil rigs, airports, and platforms. The project has undergone significant refactoring from a monolithic structure to a more modular, maintainable architecture.

## Key Components

### Core Modules
- **MapManager**: Handles map display and interactions
- **WaypointManager**: Manages route waypoints and coordinates
- **PlatformManager**: Loads and displays rig/platform data
- **AircraftManager**: Loads and filters aircraft data
- **RouteCalculator**: Calculates route statistics
- **RegionManager**: Manages different geographical regions
- **FavoriteLocationsManager**: Handles saved favorite locations
- **MapInteractionHandler**: Manages user interactions with the map
- **AppSettingsManager**: Handles application settings and preferences
- **FlightCalculations**: Performs flight-specific calculations

### Main UI Components
- **FastPlannerApp.jsx**: Main application component
- **LeftPanel**: Route editor panel
- **RightPanel**: Controls and statistics panel
- **MapComponent**: Renders the map
- **RouteStatsCard**: Displays route statistics

### Context Providers
- **RegionContext**: Manages region selection and data
- **AircraftContext**: Handles aircraft selection and data
- **RouteContext**: Maintains route data and calculations
- **MapContext**: Manages map view state

## Recent Fixes and Improvements

### Wind Input System Fix
- Fixed synchronization between MainCard and WeatherCard wind inputs
- Added proper normalization for wind direction (0-359 range)
- Enhanced state management in updateWeatherSettings function
- Added documentation for wind input system in docs/WIND_INPUT_SYSTEM.md
- Created verification script to check wind input functionality

### Project Cleanup
- Fixed hardcoded localhost:8080 references with dynamic URL generation
- Removed duplicate implementations (consolidated to FastPlannerApp)
- Removed unused HTML/CSS/JS files from public/fast-planner/
- Created backup of removed files in _backup/
- Added documentation and verification scripts for cleanup
- Established git tags for tracking cleanup progress

## Current Status

The application is now running with a clean project structure. The wind input functionality works correctly across both input locations. The application can be deployed to any domain since hardcoded localhost references have been removed.

## Next Steps

### Phase 1: Enhanced Calculations
- Improve fuel burn calculations
- Implement passenger (pax) calculations
- Create visualization for fuel and passenger data

### Phase 2: Foundry Integration
- Implement route export to Palantir Flight Planner
- Add weather data integration via OSDK

## Git Tags

- **wind-input-fix-v3**: Contains all the wind input fixes
- **cleanup-phase1-complete**: After fixing hardcoded values
- **cleanup-phase2-complete**: After removing unused files
- **cleanup-complete**: Final state after all cleanup

## Documentation

- **docs/WIND_INPUT_SYSTEM.md**: Details on the wind input system
- **docs/CLEANUP_PLAN.md**: Overall cleanup strategy
- **docs/CLEANUP_FILES_PLAN.md**: File cleanup details
- **docs/CLEANUP_SUMMARY.md**: Summary of completed cleanup
- **docs/PROJECT_STATUS_AND_ROADMAP.md**: Current status and future plans

## How to Use These Resources

When working with the Fast Planner V3 application:
1. Refer to PROJECT_STATUS_AND_ROADMAP.md for current status and future plans
2. Use the git tags to return to known working states if needed
3. Check the documentation for specific systems (like wind inputs)
4. Use the verification scripts to ensure functionality after changes
5. Follow the development guidelines for code organization and testing
