# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL SESSION START PROTOCOL 🚨

**ALWAYS DECLARE WHEN YOU ARE STARTING FROM A CONVERSATION SUMMARY**

If you are Claude starting from a conversation summary (not a fresh conversation), you MUST:

1. **IMMEDIATELY TELL THE USER** - Start your first message with: "⚠️ I'm starting from a conversation summary and don't have full context. Let me understand where we are..."
2. **ASK FOR CURRENT STATUS** - Ask what the user wants to do next, don't assume
3. **READ THE SUMMARY CAREFULLY** - Don't jump ahead based on incomplete information
4. **WAIT FOR DIRECTION** - Let the user guide you to the current task

**NEVER assume you know what to do next when starting from a summary. The user gets frustrated when you jump in without understanding the current state.**

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

## ✅ MAJOR SYSTEMS COMPLETED

### 🎉 IPAD ROUTE DRAGGING SYSTEM ✅ COMPLETE
**STATUS: Production Ready (July 2025)**

The iPad route dragging system is **100% complete and working perfectly** on both desktop and iPad. This was a major technical achievement that consolidated 4 competing drag systems into a unified, efficient solution.

**Key Features:**
- Unified drag system for desktop (mouse) and iPad (touch)
- Mathematical precision for point-to-segment distance calculation
- Smooth visual feedback with red dashed drag line
- Correct waypoint insertion at exact clicked position
- Optimized 30px grab area for easy route grabbing

**Files:** `MapInteractionHandler.js`, `WaypointManager.js`

---

### 🌦️ WEATHER VISUALIZATION MODULE ✅ COMPLETE
**STATUS: Fully Implemented (December 2024)**

A comprehensive weather visualization system has been built from scratch, providing real aviation weather data integration and 3D visualization capabilities.

**Module Location:** `/src/components/fast-planner/modules/weather/`
**Key Features:**
- Real weather data integration (Open-Meteo Marine API, NOAA Aviation Weather)
- Rig-specific weather reports with helideck operational status
- 3D weather visualization with Three.js cloud rendering
- Aviation-grade data structures (ICAO standards)
- No dummy data - only verified APIs

---

## 🛩️ CURRENT PROJECT STATUS

### ✅ WORKING SYSTEMS
- **Route Planning**: Core flight planning functionality
- **iPad Interface**: Touch-optimized UI and controls
- **Drag & Drop**: Route editing with segment detection
- **Aircraft Integration**: OSDK aircraft data and performance
- **Weather Visualization**: 3D weather circles and data integration
- **Fuel Calculations**: Single source of truth in `StopCardCalculator.js`
- **Map Integration**: Mapbox GL with custom layers and GeoTIFF support

### 🔧 AREAS FOR FUTURE ENHANCEMENT
- **Fuel System Optimization**: Further refinement of segment-aware calculations
- **Weather-Fuel Integration**: Enhanced real-time weather impact on fuel requirements
- **User Experience**: Additional UI polish and workflow improvements

## 🛩️ FUEL SYSTEM ARCHITECTURE

### Single Source of Truth: `StopCardCalculator.js`
The fuel system is centralized in `/src/components/fast-planner/modules/calculations/flight/StopCardCalculator.js` which serves as the single source of truth for ALL fuel calculations.

**Key Components:**
- **Weather Integration**: `WeatherFuelAnalyzer.js` analyzes weather segments for ARA and approach fuel
- **Segment Logic**: `SegmentUtils.js` handles refuel-aware fuel distribution
- **UI Integration**: `EnhancedStopCardsContainer.jsx` displays fuel calculations

### Fuel Calculation Workflow:
```
Input Sources → Weather Analysis → StopCardCalculator → UI Display
```

**Aviation Fuel Types:**
- **ARA Fuel**: Required for rig approaches in poor weather (consumed at destination)
- **Approach Fuel**: Required for airport approaches in poor weather (carried throughout)
- **Extra Fuel**: Discretionary fuel added at fuel stops

### Current Status: 
✅ **Working**: Core fuel calculations, weather analysis, segment detection  
🔧 **Optimization Opportunities**: Enhanced real-time integration, UI refinements

## ⛽ CRITICAL AVIATION FUEL LOGIC - READ BEFORE ANY FUEL CHANGES

**IMPORTANT: This section documents the precise aviation fuel logic that must be understood before making ANY fuel-related changes.**

### 🚁 ARA Fuel (Airborne Radar Approach Fuel)  
**Purpose**: Required for approaching rigs with bad weather conditions

**User Input Logic**:
- User inputs ARA fuel AT the rig that needs it (where it will be consumed)
- Input represents the amount that rig will CONSUME on approach

**Calculation & Display Logic**:
- ARA fuel is CARRIED from last refuel point (or departure if no refuel)
- Shows in ALL stop summaries BEFORE the rig that needs it
- Shows 0 in the summary AT the rig (already consumed on approach)
- Display shows `card.fuelComponentsObject?.araFuel` (calculated remaining), NOT user input

**Example**: User inputs 200 ARA for Rig3. Departure summary shows ARA:200, Stop1 shows ARA:200, Stop2 shows ARA:200, Rig3 shows ARA:0

### 🛬 Approach Fuel (Airport Approach Fuel)
**Purpose**: Required for approaching airports with bad weather conditions

**Logic**: Identical to ARA fuel but for airports instead of rigs
- User inputs AT the airport that needs it
- Carried from last refuel/departure  
- Shows in summaries BEFORE the airport
- Shows 0 AT the airport (consumed on approach)
- Display shows calculated remaining amount, not user input

### ✈️ Extra Fuel (Discretionary Fuel)
**Purpose**: Additional fuel carried "just in case" - pilot discretion

**User Input Logic**:
- Can ONLY be added at locations WHERE fuel is being added (departure or refuel stops)
- Input fields are disabled/blanked at other locations
- Represents additional fuel beyond calculated requirements

**Calculation & Display Logic**:
- Shows in ALL summaries from input point forward
- Continues until next refuel stop OR destination
- Display shows user input first: `getFuelValue(stopName, 'extraFuel') || calculated`
- Does NOT get consumed at intermediate stops (unlike ARA/approach)

**Example**: User adds 100 extra fuel at departure. All stops show Extra:100 until reaching a refuel stop.

### 🔄 Summary Display Logic
**What each stop summary represents**: "Minimum fuel needed to depart from this location and complete the flight"

**Critical Rule**: 
- ARA/Approach fuel shows REMAINING amount (calculated)
- Extra fuel shows INPUT amount (user override then calculated)
- Fuel consumed AT a location does not appear in THAT location's summary

### ⚠️ COMMON MISTAKES TO AVOID
1. **DO NOT** make ARA/approach fuel show user input in summaries
2. **DO NOT** disable extra fuel calculations - only disable inputs at non-fuel-adding locations  
3. **DO NOT** assume fuel display logic is the same for all fuel types
4. **DO NOT** change fuel calculation logic without understanding aviation requirements

## 🌦️ AVIATION WEATHER SYSTEM

### ✅ Weather Visualization Module - Complete
A comprehensive weather visualization system providing real aviation weather data and 3D visualization.

**Module Location:** `/src/components/fast-planner/modules/weather/`

**Capabilities:**
- Real weather data integration (Open-Meteo Marine API, NOAA Aviation Weather)
- Rig-specific weather reports with helideck operational status  
- 3D weather visualization with Three.js cloud rendering
- Aviation-grade ICAO data structures
- Weather impact on fuel calculations

**Safety Compliance:**
✅ Real weather data only - no simulated values  
✅ ICAO standard aviation weather parameters  
✅ Proper hazard identification and reporting  
✅ Marine weather integration for offshore operations  

### Weather-Fuel Integration Status:
✅ **Working**: Weather segment loading, rig detection, fuel impact calculations  
🔧 **Enhancement Opportunities**: Real-time API integration, enhanced UI feedback

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

### Save Flight Flow (ACTUAL)
```
User clicks "Save Flight" → SaveFlightCard (RightPanel) → RightPanel.handleSaveFlightSubmit → Automation (if enabled)
```

**Important**: `SaveFlightButton.jsx` is NOT used in the main application flow. The actual save functionality is:
1. **SaveFlightCard.jsx** - UI form in the right panel
2. **RightPanel.handleSaveFlightSubmit** - Main save logic with automation
3. Weather circles and alternate lines auto-enable logic is in RightPanel.jsx lines 331-419

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

### Recent Major Achievements

**✅ COMPLETED: Core Systems Integration**
- **Wind Input System**: Synchronized wind inputs with proper direction normalization
- **Project Architecture**: Clean modular structure with manager pattern
- **iPad Interface**: Touch-optimized UI with responsive layouts
- **Route Dragging**: Unified drag system for desktop and iPad

**✅ COMPLETED: Fuel & Weather Systems** 
- **Single Source of Truth**: All fuel calculations consolidated in `StopCardCalculator.js`
- **Weather Integration**: Real weather data with aviation-grade calculations
- **Segment-Aware Logic**: Proper fuel distribution for refuel flights
- **Aviation Safety**: No dummy data, all calculations use verified aircraft performance

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