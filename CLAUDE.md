# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL REMINDER - READ FIRST ⚠️

**DO NOT RUSH AHEAD OR MAKE ASSUMPTIONS**

Before making ANY changes to this codebase:

1. **UNDERSTAND THE CURRENT STATE FIRST** - Read and analyze existing code thoroughly
2. **ASK FOR CLARIFICATION** - Don't assume you understand complex systems like fuel calculations or weather integration
3. **EXPLAIN YOUR UNDERSTANDING** - Clearly state what you think the current workflow is before making changes
4. **GET CONFIRMATION** - Wait for user confirmation that your understanding is correct
5. **MAKE TARGETED CHANGES ONLY** - Don't rewrite entire systems or make broad changes

**REMEMBER: This codebase has complex fuel systems, weather integration, and calculation workflows that took weeks to implement. One rushed change can destroy significant work that cannot be recovered.**

## 🛡️ CORE PRINCIPLES - AVIATION SOFTWARE

**This is aviation software - lives depend on accurate data. NO SHORTCUTS.**

### Mandatory Development Standards:

1. **No quick fixes or workarounds** - Only proper structural improvements to the code
2. **No runtime injections** that create technical debt
3. **No dummy or mock data** that could be mistaken for real flight values
4. **No fallbacks** that could be interpreted as actual flight data
5. **Clean, maintainable code** that accurately represents real-world aviation data
6. **One step at a time** with thorough testing at each stage
7. **No potentially misleading numbers** - all calculations must be precise and verified
8. **Use MCP tools** for development and analysis

### Safety-First Approach:
- Every fuel calculation must be accurate
- Every flight time must account for real conditions
- Every weather integration must use verified data
- Test extensively before any changes go live

## Development Commands

```bash
# Development server (runs on port 8080)
npm run dev

# Production build with TypeScript checking
npm run build

# Production build without TypeScript checking (faster)
npm run build:skip-ts

# Preview production build
npm run preview
```

## Architecture Overview

FastPlanner is a React/Vite flight planning application with Palantir Foundry OSDK integration. The application follows a **Manager Pattern** with **Context Providers** and **Custom Hooks** for state management.

### Application Flow
```
main.tsx → App.jsx → FastPlannerPage.jsx → FastPlannerApp.jsx → FastPlannerCore
```

**FastPlannerApp.jsx** (1,713 lines) is the main orchestration component that:
- Manages top-level state (flightSettings, waypoints, stopCards, routeStats)
- Initializes managers via `useManagers()` hook
- Handles OSDK authentication and data loading
- Provides state to `FastPlannerCore` via props

## Fuel System Architecture - ONE SOURCE OF TRUTH

**PRIMARY FUEL CALCULATION ENGINE:** `StopCardCalculator.js`
- Located: `/src/components/fast-planner/modules/calculations/flight/StopCardCalculator.js`
- **This is the single source of truth for ALL fuel calculations**
- Handles both main route and alternate route fuel calculations
- Integrates weather-based fuel requirements (ARA and approach fuel)

### Complete Fuel Workflow:
```
Input Sources → Weather Analysis → StopCardCalculator → UI Display

1. INPUT SOURCES:
   ├── Aircraft Data (OSDK) → selectedAircraft  
   ├── Route Waypoints → waypoints[]
   ├── Fuel Policy (OSDK) → fuelPolicy
   ├── Weather Segments → weatherSegments[]
   └── Flight Settings → flightSettings

2. WEATHER FUEL ANALYSIS:
   ├── WeatherFuelAnalyzer.analyzeWeatherForFuel()
   │   ├── Processes weatherSegments using Palantir ranking logic
   │   ├── ARA fuel (rigs): ranking2 === 8 or 5
   │   ├── Approach fuel (airports): ranking2 === 10 or 5  
   │   └── Returns { araFuel, approachFuel }
   └── Sets weatherFuel state in FastPlannerApp

3. FUEL CALCULATION:
   ├── StopCardCalculator.calculateStopCards()
   │   ├── Filters navigation waypoints vs landing stops
   │   ├── Calculates trip fuel per leg (with wind effects)
   │   ├── Applies fuel components:
   │   │   ├── Taxi fuel (departure only)
   │   │   ├── Contingency fuel (percentage of trip)
   │   │   ├── Reserve fuel (policy-based conversion)
   │   │   ├── Deck fuel (intermediate stops)
   │   │   ├── ARA fuel (consumed per rig)
   │   │   └── Approach fuel (carried throughout route)
   │   └── Returns stopCards[] with complete fuel breakdown

4. UI DISPLAY:
   ├── EnhancedStopCardsContainer.jsx → PRIMARY component, calls StopCardCalculator directly
   ├── RightPanel cards → Shows fuel summaries
   └── Route display → Shows fuel-adjusted times
```

### Current Active Fuel Files:
- **`StopCardCalculator.js`** - Primary calculation engine (single source of truth)
- **`WeatherFuelAnalyzer.js`** - Weather-based fuel analysis  
- **`PassengerCalculator.js`** - Passenger capacity calculations
- **`EnhancedStopCardsContainer.jsx`** - PRIMARY fuel display component (actively used)
- **`StopCardsContainer.jsx`** - Legacy fuel display component (may not be actively used)

### ⚠️ ARCHIVED/DISABLED Fuel Files - DO NOT USE:
```
/_archived_fuel_systems/disabled_files/
├── MasterFuelManager.js.disabled
├── ComprehensiveFuelCalculator.js.disabled  
├── EnhancedFuelCalculator.js.disabled
├── EnhancedFuelManager.js.disabled
└── TripFuelCalculator.js.disabled

Other inactive files:
├── FuelCalculationManager.js (exists but not actively used)
├── FuelContext.jsx (exists but minimal usage)
└── WeatherStopCardFuelDistributor.js (not actively used)
```

**IMPORTANT:** Any references to "MasterFuel" or fuel system migration in documentation are outdated and should be ignored.

## 🚨 CURRENT DEBUGGING: Weather-Fuel Integration Issue

**Problem:** ARA fuel not appearing in stop cards despite weather data being available.

**Key Component:** `EnhancedStopCardsContainer.jsx` - This is the PRIMARY component actually used for displaying stop cards.

**Debug Flow:**
```
Props → EnhancedStopCardsContainer → StopCardCalculator → Fuel Display

Expected:
1. Weather segments with ranking2 === 8 or 5 for rigs requiring ARA
2. WeatherFuelAnalyzer processes segments → returns araFuel amount
3. EnhancedStopCardsContainer passes araFuel to StopCardCalculator via options
4. ARA fuel appears on cards BEFORE reaching the rig
```

**Console Debug Commands:**
```javascript
// Check weather flow in Enhanced Container
console.log('Enhanced Container Weather:', {
  weatherSegments: window.currentFlightData?.weatherSegments,
  weatherAnalysis: window.currentWeatherAnalysis,
  props: window.lastEnhancedProps
});

// Check fuel component breakdown
console.log('Fuel Components:', window.stopCards?.[0]?.fuelComponentsObject);
```

### Key Architectural Patterns

**Manager Pattern**: Business logic is encapsulated in manager classes stored in `useRef` for persistence:
- `MapManager`, `WaypointManager`, `PlatformManager` 
- `AircraftManager`, `RouteCalculator`, `FuelCalculationManager`
- Located in `/src/components/fast-planner/modules/`

**Custom Hooks**: Complex state logic extracted into 9 specialized hooks:
- `useManagers()` - Initialize all manager instances
- `useAircraft()` - Aircraft selection and fuel policies
- `useWaypoints()` - Waypoint operations and mode handling
- Located in `/src/components/fast-planner/hooks/`

**Context Providers**: Cross-cutting concerns managed via contexts:
- `AuthContext` - OSDK authentication
- `RegionContext` - Region-based data loading and filtering
- Additional contexts in `/src/components/fast-planner/context/`

### Core UI Structure
```
FastPlannerCore
├── AppHeader (iPad-friendly header)
├── MapComponent (Full-width Mapbox GL map)
├── LeftPanel (Route input, waypoints, controls)
└── RightPanel (Aircraft, settings, stop cards, weather)
```

## Key Integration Points

**Palantir Foundry OSDK**: 
- Authentication via OAuth in `AuthContext.tsx`
- Client initialization in `client.ts`
- Aircraft/platform data fetching throughout the app
- Custom SDK located at `@flight-app/sdk`

**Mapbox GL Maps**:
- Interactive mapping with custom layers
- Gulf Coast GeoTIFF overlay support
- Manager-based interaction handling

**External Data Sources**:
- Region-based filtering of aircraft and platforms
- Weather data integration for fuel calculations
- Favorite locations management

## Development Workflow

### Making Changes
1. **State modifications**: Start in `FastPlannerApp.jsx`, use existing update functions
2. **New features**: Create custom hooks for complex logic, add managers to `/modules/`
3. **UI components**: Follow the card pattern in `/components/panels/cards/`
4. **Map features**: Extend managers and add corresponding hooks

### Working with Managers
Managers are initialized once and persist throughout the app lifecycle. Access them via the `useManagers()` hook:

```javascript
const { mapManager, waypointManager, aircraftManager } = useManagers();
```

### Regional Data Loading
The app uses region-based filtering for performance. When region changes:
1. Event is dispatched via `RegionContext`
2. Managers reload their data for the new region
3. UI components re-render with filtered data

### Code Organization
- **Core logic**: `/src/components/fast-planner/modules/`
- **UI components**: `/src/components/fast-planner/components/`
- **State management**: `/src/components/fast-planner/hooks/` and `/context/`
- **Calculations**: `/modules/calculations/` (flight, fuel, weather)
- **PDF generation**: `/modules/pdf/` (flight reports)

## Precision Code Editing

This codebase uses a precision editing approach:
- Make targeted changes to specific code sections
- Preserve functional adjacent code
- Create backups before editing critical files
- Use incremental refactoring with small, focused changes

## Build Configuration

**Vite Setup**:
- Runs on port 8080 with strict port enforcement
- Base path `/planner/` for subdirectory deployment
- Source maps enabled for debugging
- Manual chunks for OSDK and React vendors

**TypeScript**: Configured for React with strict checking. Use `build:skip-ts` for faster builds during development.

## Important Files to Understand

- `FastPlannerApp.jsx` - Main state orchestration
- `useManagers.js` - Manager initialization and lifecycle
- `AuthContext.tsx` - OSDK authentication flow
- `RegionContext.jsx` - Region-based data loading
- Component index files for understanding module exports

## Project History and Context

FastPlanner is a React application connecting to Palantir's OSDK that provides flight planning functionality for managing routes between oil rigs, airports, and platforms. The project has undergone significant refactoring from a monolithic structure to the current modular architecture.

### Recent Major Improvements

**🚧 IN PROGRESS: Weather-Fuel Integration**
- **Single Source of Truth**: All fuel calculations consolidated into `StopCardCalculator.js` ✅
- **Weather-Fuel Analysis**: `WeatherFuelAnalyzer.js` analyzes weather segments for ARA and approach fuel ✅
- **Proper ARA Fuel Logic**: ARA fuel distributed to cards before rigs, consumed at each rig ✅
- **Proper Approach Fuel Logic**: Approach fuel carried throughout remaining route after first needed ✅
- **Aviation Safety Standards**: No dummy data, all calculations use real aircraft performance data ✅
- **🚨 CURRENT ISSUE**: Weather analysis not reaching fuel calculations in EnhancedStopCardsContainer

**✅ COMPLETED: Wind Input System**
- Fixed synchronization between MainCard and WeatherCard wind inputs
- Added proper normalization for wind direction (0-359 range)
- Enhanced state management in updateWeatherSettings function
- All flight times account for wind effects with consistent display across route lines, stop cards, and summary cards

**✅ COMPLETED: Project Cleanup**
- Fixed hardcoded localhost:8080 references with dynamic URL generation
- Removed duplicate implementations and unused files
- Archived old fuel systems (`MasterFuelManager`, etc.) to prevent confusion
- Established clean project structure with proper documentation

**✅ COMPLETED: iPad-Friendly Design**
- Headers and panels optimized for tablet use with appropriate touch targets and responsive layouts

## Important Git Tags

- **wind-input-fix-v3**: Contains all the wind input fixes
- **cleanup-phase1-complete**: After fixing hardcoded values
- **cleanup-phase2-complete**: After removing unused files
- **cleanup-complete**: Final state after all cleanup

## Documentation Resources

Key documentation files in `/docs/`:
- `PROJECT_STATUS_AND_ROADMAP.md` - Current status and future plans
- `WIND_INPUT_SYSTEM.md` - Details on the wind input system
- `MEMORY_SUMMARY.md` - Project history and context
- Various `CLEANUP_*.md` files - Documentation of cleanup efforts