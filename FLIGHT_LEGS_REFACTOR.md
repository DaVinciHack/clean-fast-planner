# Flight Legs Refactoring Plan

## Background

The Fast Planner application currently treats all points (stops and waypoints) the same way, which makes it difficult to distinguish between main stops and intermediate waypoints. This has caused issues when loading saved flights from Palantir OSDK, as all waypoints are treated as stops.

## Goal

Refactor the Fast Planner application to properly handle flight legs, stops, and waypoints to match the correct flight structure:

- **Flight**: A collection of legs with metadata
- **Leg**: A segment between two stops with optional waypoints
- **Stop**: A main point (airport, rig, etc.) that starts or ends a leg
- **Waypoint**: An intermediate navigational point within a leg

## Implementation Plan

### Phase 1: Data Models

1. Create proper data models for Flight, Leg, Stop, and Waypoint
2. Define clear interfaces and methods for each model

### Phase 2: Route Management

1. Refactor WaypointManager to RouteManager
2. Implement proper handling of legs, stops, and waypoints
3. Add functionality to differentiate between stops and waypoints

### Phase 3: UI Updates

1. Update LeftPanel to properly display legs, stops, and waypoints
2. Add a toggle for switching between stop and waypoint mode
3. Implement proper visual distinction between stops and waypoints

### Phase 4: OSDK Integration

1. Update load/save functionality to properly handle the leg structure
2. Ensure waypoints are preserved when loading flights from Palantir

## Implementation Guidelines

- Keep files small and modular
- Never use mock data (only real data from OSDK)
- Test each change carefully before proceeding to the next step
- Document the changes as we go
