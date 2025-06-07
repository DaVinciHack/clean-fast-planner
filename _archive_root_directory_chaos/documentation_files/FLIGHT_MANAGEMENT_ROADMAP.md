# Flight Management Roadmap - Next Phase

## ✅ COMPLETED - Phase 1: Save Flights with Waypoints
- Fixed waypoint classification issue
- Navigation waypoints (like TOTVU) now correctly saved as waypoints, not locations
- Palantir `createFlightWithWaypoints` function working correctly
- Locations array only contains landing stops (rigs/airports)
- DisplayWaypoints correctly contains navigation waypoints

## 🚧 CURRENT PHASE - Phase 2: Complete Flight Management System

### Priority 1: UI Controls for Waypoint Behavior
**Objective**: Add checkbox to control whether Palantir adds additional waypoints
- [ ] Add "Use only provided waypoints" checkbox to SaveFlightCard
- [ ] Wire checkbox to `useOnlyProvidedWaypoints` parameter
- [ ] Default behavior: Allow Palantir to add auto-generated waypoints
- [ ] When checked: Only use waypoints we explicitly provide

### Priority 2: Restore Flight Save + Automation
**Objective**: Re-enable automatic weather automation after flight save
- [ ] Fix automation trigger in SaveFlightCard/RightPanel after successful flight creation
- [ ] Ensure automation uses correct flight ID from save response
- [ ] Test full save-to-automation workflow
- [ ] Handle automation errors gracefully (flight saved but automation failed)

### Priority 3: Load Flights from Palantir
**Objective**: Load existing flights back into Fast Planner for editing
- [ ] Create LoadFlightsCard UI for selecting/loading flights
- [ ] Implement flight search/list functionality from Palantir
- [ ] Parse loaded flight data back into Fast Planner format
- [ ] Populate waypoints, routes, aircraft selection from loaded flight
- [ ] Handle both main route and alternate legs

### Priority 4: Display Alternate Legs & Best Alternates
**Objective**: Show complete flight plan including alternates
- [ ] Display alternate legs in route visualization
- [ ] Show "best alternate" recommendations from automation
- [ ] UI components for alternate route display
- [ ] Map visualization of both main and alternate routes

### Priority 5: Edit Loaded Flights
**Objective**: Full flight editing capability
- [ ] Modify waypoints/route of loaded flights
- [ ] Update flight details (crew, aircraft, timing)
- [ ] Save changes back to Palantir using update function
- [ ] Validate changes and re-run automation if needed

## 🔧 TECHNICAL ARCHITECTURE

### Key Components to Develop/Enhance:
1. **SaveFlightCard**: Add waypoint control checkbox
2. **LoadFlightsCard**: Complete flight loading interface  
3. **FlightLoader**: New service for loading flights from Palantir
4. **AlternateRouteDisplay**: UI for showing alternate legs
5. **AutomationService**: Reconnect to save workflow
6. **FlightEditor**: Edit loaded flights and save updates

### API Functions to Implement:
1. `loadFlightsFromPalantir()` - Get flight list
2. `loadSpecificFlight(flightId)` - Load individual flight data
3. `updateExistingFlight(flightData)` - Save flight modifications
4. `getFlightAlternates(flightId)` - Get alternate recommendations

### Data Flow:
```
Save: Fast Planner → createFlightWithWaypoints → Palantir → Automation
Load: Palantir → loadFlight → Fast Planner → Display/Edit → updateFlight → Palantir
```

## 🎯 SUCCESS CRITERIA
- [x] Save flight with waypoints ✅ DONE
- [ ] Control waypoint generation via checkbox
- [ ] Auto-run automation after flight save
- [ ] Load any Palantir flight into Fast Planner
- [ ] Display main route + alternates visually
- [ ] Edit and re-save loaded flights
- [ ] Full round-trip: Save → Load → Edit → Save workflow

## 📋 IMMEDIATE NEXT STEPS
1. Add "Use only provided waypoints" checkbox to SaveFlightCard
2. Restore automation trigger in flight save workflow
3. Begin LoadFlightsCard implementation
4. Test flight loading with simple flight first

## 🚨 NOTES
- Edit function in Palantir currently not working properly - investigate later
- Maintain aviation software principles: no shortcuts, real data only
- Take one step at a time with thorough testing
