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

## 🛩️ WEATHER-FUEL INTEGRATION SYSTEM

### Current Implementation Status (WORKING)

The weather-fuel integration system is now fully implemented and working correctly. Here's how it operates:

#### Architecture Overview:
1. **Single Source of Truth**: `StopCardCalculator.js` is the ONLY place where fuel calculations happen
2. **Weather Analysis**: `WeatherFuelAnalyzer.js` analyzes weather segments and determines ARA/approach fuel requirements
3. **Data Flow**: Weather segments → Fuel analysis → Stop card calculations → UI display

#### Weather-Fuel Flow:
1. **Weather Segments Loading**: 
   - `useWeatherSegments` hook loads weather data for flights
   - Weather segments contain `isRig` boolean and location identifiers (`airportIcao`, `uniqueId`)

2. **Fuel Analysis**:
   - `WeatherFuelAnalyzer` processes weather segments to determine fuel requirements
   - Calculates total ARA fuel needed (for rigs with poor weather)
   - Calculates total approach fuel needed (for airports with poor weather)

3. **Fuel Consumption Logic**:
   - **ARA Fuel**: Required on departure, consumed during approach to rigs
   - **Approach Fuel**: Required on departure, consumed during approach to airports
   - **Consumption Detection**: Uses weather segments `isRig` property to identify rigs vs airports

#### Data Flow Chain:
```
FastPlannerApp (weatherSegments) 
  → RightPanel (weatherSegments)
    → MainCard (weatherSegments) 
      → EnhancedStopCardsContainer (weatherSegments)
        → StopCardCalculator (weatherSegments)
```

#### Weather Segment Matching:
Weather segments are matched to waypoints using:
- `segment.airportIcao === waypoint.name` (PRIMARY - works for ENLE)
- `segment.locationName === waypoint.name`
- `segment.location === waypoint.name`
- `segment.uniqueId === waypoint.name`

#### Fuel Calculation Results:
- **Departure Card**: Shows total fuel including ARA/approach fuel (e.g., ARA:200)
- **Intermediate Stops**: Show remaining fuel after consumption (e.g., ENLE shows ARA:0, not displayed)
- **Final Card**: Shows only reserve fuel (ARA/approach fuel consumed)

### ⚠️ KNOWN ISSUES TO ADDRESS:

1. ~~**Header Totals**: Header not using single source of truth - missing ARA/approach fuel~~ ✅ FIXED
2. **Fuel Capacity Limits**: Need to handle when required fuel > aircraft capacity
3. **Passenger Calculations**: Currently uses total fuel regardless of aircraft limits
4. **UI Limitations**: Need detailed fuel breakdown display (card rollover or dedicated fuel card)

## 🎨 VISUAL ENHANCEMENTS - NEXT IMPLEMENTATION

### Weather Visualization System (IN PROGRESS)

#### **Goal**: Add 3D weather circles and dotted alternate lines for instant visual weather assessment

#### **Implementation Plan**:

##### **1. 3D Weather Circles (Ground Level)**
- **Location**: Modify `/src/components/fast-planner/modules/WaypointManager.js`
- **Type**: MapBox `fill` layer with circular polygons
- **Z-Layer**: Sort-key `-3` (underneath everything - on the ground)
- **Colors**: Use existing `getAviationRankingColor()` from `WeatherCard.jsx`:
  ```javascript
  case 5:  '#D32F2F'  // Red - Below minimums
  case 8:  '#8E24AA'  // Purple - ARA fuel needed
  case 10: '#F57C00'  // Orange - Warning conditions  
  case 15: '#66BB6A'  // Green - Good conditions
  case 20: '#616161'  // Grey - Not applicable
  ```
- **Size**: Slightly bigger than airport pins, zoom-responsive
- **Style**: Semi-transparent, lying flat on ground under all other elements

##### **2. Dotted Alternate Lines**
- **Location**: Extend existing alternate route system in `WaypointManager.js`
- **Style**: Light grey (#CCCCCC), 1px width, dashed `[3,3]` pattern
- **Z-Layer**: Sort-key `2.8` (above main route, below main alternate)
- **Data Source**: Use weather segment coordinates or calculate from lat/lng
- **Curves**: Same curved line system as existing routes

##### **Current Z-Layer System**:
```
-3: Weather circles (NEW - ground level)
-2: Route shadows
-1: Alternate shadows  
 1: Route glow
 2: Main routes
2.5: Alternate glow
2.8: Weather alternate lines (NEW - dotted)
 3: Main alternate routes
10: Interactions
```

##### **Key Files**:
- `WaypointManager.js` - Main rendering logic
- `WeatherCard.jsx` - Color system (already implemented)
- `WeatherSegmentsService.js` - Coordinate data extraction
- Weather segments contain: `geoPoint`, `alternateGeoShape`, ranking data

##### **Implementation Steps**:
1. Start with weather circles (simpler)
2. Add dotted alternate lines
3. Adjust sizing and colors based on visual feedback
4. Ensure proper z-layer ordering (circles → lines → pins)

**Result**: Instant visual weather assessment - one glance shows weather conditions across entire route and all alternate options.

### ✅ WORKING CORRECTLY:
- Weather segment loading and matching
- Rig detection using `isRig` property
- ARA fuel consumption at rigs
- Approach fuel consumption at airports
- Stop card fuel display
- Aviation safety principles maintained

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