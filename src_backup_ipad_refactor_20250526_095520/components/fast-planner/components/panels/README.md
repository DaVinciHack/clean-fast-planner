# Fast Planner Panels

This directory contains the panel components used in the Fast Planner application.

## Panel Types

### LeftPanel

The `LeftPanel` component displays the route editor interface, allowing users to:
- View and edit waypoints in the route
- Add new waypoints by name or coordinates
- Reorder waypoints via drag and drop
- Save favorite locations

### RightPanel & Card System

The right panel has been refactored to use a modular card-based architecture:

1. **RightPanel.jsx**
   - Main panel component that renders different cards based on selected tab
   - Uses `RightPanelContainer` to manage card visibility and animations

2. **RightPanelContainer.jsx**
   - Container component that manages which card is visible
   - Handles tab selection UI
   - Provides smooth animations between cards
   - Uses a direct DOM animation approach with a panel ref

## Animation System

The panel system uses CSS animations for smooth transitions:

- Clicking a tab causes the current card to slide out to the right
- The new card then slides in from the right
- Animations use cubic-bezier timing for natural easing
- All animations are defined in FastPlannerStyles.css and animationFixes.css

## Card Components

Individual card components are stored in the `cards/` directory:

- **MainCard** - Main controls and region selection
- **SettingsCard** - Flight settings controls
- **PerformanceCard** - Performance calculations
- **WeatherCard** - Weather settings
- **FinanceCard** - Finance calculations
- **EvacuationCard** - Evacuation planning

## Future Development

The next steps for panel development include:
1. Implementing the S92 performance calculator in PerformanceCard
2. Adding more aircraft-specific performance calculators
3. Extracting more components from panels for better code organization
4. Adding error boundaries for improved robustness
