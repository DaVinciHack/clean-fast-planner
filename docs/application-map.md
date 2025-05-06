# Fast Planner Application Map & Refactoring Strategy

## Project Overview

The Fast Planner is a React application connecting to Palantir's OSDK (Ontology Software Development Kit) that provides flight planning functionality for managing routes between oil rigs, airports, and platforms. The project is currently in a refactoring phase, transitioning from a large monolithic component to a more modular architecture.

## Current Project Structure

### Entry Points

There are two main entry points to the application:

1. **Original Implementation (ModularFastPlannerComponent.jsx)**
   - Accessed via: `http://localhost:8080/`
   - Over 2,500 lines of code in a single file
   - Contains all functionality in one monolithic component
   - Should be preserved as a working reference

2. **Refactored Implementation (FastPlannerApp.jsx)**
   - Accessed via: `http://localhost:8080/?context=new`
   - Around 1,000 lines of code with functionality split among multiple files
   - Uses the same underlying modules but with better separation of concerns

The switching between implementations happens in `FastPlannerPage.jsx`, which detects URL parameters and renders the appropriate component.

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
- **RightPanel** - Controls and statistics panel
- **RouteStatsCard** - Displays route statistics

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

## Refactoring Strategy

### Clear Separation - For Better Development Workflow

To ensure we avoid confusion between the original and refactored versions:

1. **Visual Indicators**:
   - Add a prominent banner in both versions indicating which version is being used
   - Use different color schemes or subtle UI differences between versions

2. **Code Organization**:
   - Keep all original files in the root directory
   - Move all refactored files to a clear subfolder structure

3. **Version Control Strategy**:
   - Create separate branches for each feature refactoring
   - Only merge completed and tested features to main

### Refactoring Guidelines

To maintain manageable file sizes (under 500 lines) and improve code organization:

1. **Component Decomposition**:
   - Break large components into smaller, focused components
   - Each component should have a single responsibility
   - Follow these separation criteria:
     - UI sections (panels, cards, forms)
     - Logical functionality groups (aircraft selection, route editing)
     - Data management (loading, filtering, calculations)
   - When refactoring, ensure state management flows properly between components
   - Avoid direct DOM manipulation in React components - use state and props instead
   - For interactive elements like dropdowns with complex behavior, make sure state flows through parent components

2. **Context Usage**:
   - Move shared state to context providers
   - Components should access only the context they need
   - Avoid prop drilling by using context

3. **Hooks Extraction**:
   - Move complex state logic to custom hooks
   - Create hooks for specific functionality (e.g., useAircraft, useRouteCalculation)
   - Keep hook files under 200 lines

### Step-by-Step Refactoring Plan

To avoid breaking functionality during refactoring:

1. **Identification Phase**:
   - Identify sections of code that can be isolated
   - Document dependencies between functions and state

2. **Extraction Phase**:
   - Extract one component/feature at a time
   - Test thoroughly after each extraction
   - Maintain state management consistency

3. **Integration Phase**:
   - Connect extracted components through context or props
   - Verify all interactions work correctly
   - Update documentation

## Next Steps in Refactoring

Based on the current state, here are the next components to refactor:

1. ~~**Modular RightPanel Architecture**:~~ ✅ COMPLETED
   - ~~Create a card-based structure for RightPanel to replace the current large component~~
   - ~~Implement a container component (RightPanelContainer.jsx) to manage layout and coordinate visible cards~~
   - ~~Create individual card components:~~
     - ~~MainCard.jsx - For main controls and region selection~~
     - ~~SettingsCard.jsx - For flight settings~~
     - ~~PerformanceCard.jsx - For performance calculations~~
     - ~~WeatherCard.jsx - For weather settings~~
     - ~~FinanceCard.jsx - For finance calculations~~
     - ~~EvacuationCard.jsx - For evacuation planning~~
   - ~~Implement tab/accordion system with sliding animations~~
   - ~~Each card maintains its own local state~~
   - ~~CSS transitions for smooth sliding animations~~

2. ~~**S92 Performance Calculator Implementation**:~~ ✅ COMPLETED
   - ~~Implement the S92DropdownCalculator component from the provided code~~
   - ~~Integrate it with the PerformanceCard component~~
   - ~~Add necessary context connections for aircraft data~~

3. **Route StopCards Enhancement**:
   - ✅ Implemented compact, elegant card styling
   - ✅ Added smooth FLIP animations for reordering
   - ✅ Created custom blue-themed SVG icons
   - ✅ Eliminated scrolling by dynamically expanding card container
   - ⏳ Optimize calculations to match aircraft data and flight settings

4. **Aircraft Integration**:
   - Extract AircraftSelection from MainCard.jsx
   - Add to a new file in components/aircraft/AircraftSelection.jsx
   - Create an AircraftContext to manage aircraft state
   - Properly connect aircraft performance data to route calculations

5. **LeftPanel Component Extraction**:
   - Extract WaypointEditor from LeftPanel.jsx
   - Add to components/waypoints/WaypointEditor.jsx
   - Connect to RouteContext

## Documentation Strategy

To maintain clear knowledge of project structure:

1. **Living Documentation**:
   - Create and maintain this application map document
   - Update with each significant change
   - Include diagrams of component relationships

2. **Component Documentation**:
   - Add JSDoc comments to each component and function
   - Document props, state, and effects
   - Include examples of usage

3. **Knowledge Base Management**:
   - Use a dedicated tool for project documentation (see recommended tools below)
   - Link documentation to code for easier navigation
   - Regularly review and update documentation

## Recommended Knowledge Base Tools

Based on research, here are recommended tools for maintaining project knowledge:

1. **Documentation-Specific Tools**:
   - **Notion** - Flexible workspace combining docs, wikis, and project management
   - **Confluence** - Robust documentation platform with Jira integration
   - **GitBook** - Developer-focused documentation platform

2. **Code Documentation Tools**:
   - **JSDoc** - Documentation generator for JavaScript
   - **Storybook** - Component library and documentation

3. **Code Organization Tools**:
   - **GitHub Projects** - Track tasks and organize work
   - **Code Maps** - Visual representations of code structure

## Reference vs. Refactored Components

### Reference (Do Not Modify)
- `/src/components/fast-planner/ModularFastPlannerComponent.jsx` - Original implementation
- Any file with `.bak` extension - Original backup files

### Refactored (Active Development)
- `/src/components/fast-planner/FastPlannerApp.jsx` - New implementation entry point
- `/src/components/fast-planner/components/` - UI components
- `/src/components/fast-planner/context/` - Context providers
- `/src/components/fast-planner/hooks/` - Custom hooks
- `/src/components/fast-planner/modules/` - Manager modules

## Using This Map

Reference this document when:
1. Starting work on a new feature
2. Deciding where to place new code
3. Understanding the project architecture
4. Onboarding new team members

Update this document when:
1. Adding new components or modules
2. Changing data flow or architecture
3. Completing a refactoring milestone
4. Finding improvements to the documentation itself

## Conclusion

This refactoring approach emphasizes incremental progress with clear separation between the original and refactored code. By focusing on one component at a time and maintaining comprehensive documentation, we can successfully transition to a more maintainable codebase while preserving functionality.