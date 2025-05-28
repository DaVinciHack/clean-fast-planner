# Fast Planner: Alternate Stop Card Implementation

## Context
We've completed Phase 1 (Clear Route Enhancement) and Phase 2 (Split Point Logic) for the alternate route functionality. Now we need to implement the **Alternate Stop Card** - the final piece that shows calculations for the alternate leg.

## Project Location
`/Users/duncanburbury/FastPlannerMaster/FastPlannerV5`

## Core Requirements

### Visual Requirements
- **Orange circle with "A" icon** (instead of numbered circles)
- **Display alternate name** from `alternateRouteData.name` 
- **Small font text "alternate leg"** below the main name
- **Positioned at END** of stop cards list (after all regular stop cards)
- **Only appears when** `alternateRouteData` exists

### Mathematical Requirements - CRITICAL FOR AVIATION SAFETY

#### Core Calculation Logic
The alternate stop card must calculate **CUMULATIVE** fuel/time from:
1. **All legs up to split point** (normal route legs before alternate)
2. **Plus the alternate leg itself** (from split point to alternate destination)

#### Why This Matters
- This represents **minimal fuel required** for flight safety
- Flight must be able to: go to rig → go missed → reach alternate safely
- This is aviation regulatory compliance - not optional

#### Calculation Components Needed
1. **Distance Calculation**: 
   - Sum of all legs to split point + alternate leg distance
   - Use same coordinate/haversine calculations as regular stop cards

2. **Time Calculation**:
   - Apply wind effects to each segment (same as regular legs)
   - Account for aircraft cruise speed
   - Sum total flight time to alternate

3. **Fuel Calculation**:
   - Trip fuel for cumulative distance/time
   - Contingency fuel (percentage-based)
   - Reserve fuel
   - Taxi fuel
   - Deck time fuel (for intermediate stops before split point)

4. **Passenger Calculation**:
   - Based on **total fuel required** (cumulative)
   - Uses aircraft max fuel capacity - total fuel = available payload
   - Convert payload to passenger count using passenger weight

### Technical Implementation

#### Files to Work With
- `/src/components/fast-planner/components/flight/stops/StopCardsContainer.jsx` - Add alternate card logic
- `/src/components/fast-planner/components/flight/stops/StopCard.jsx` - Support alternate styling
- `/src/components/fast-planner/components/flight/stops/StopCards.css` - Orange "A" styling
- `/src/components/fast-planner/modules/calculations/flight/StopCardCalculator.js` - May need alternate calculations

#### Key Data Sources
- `alternateRouteData` - Contains alternate route info (coordinates, splitPoint, name)
- `waypoints` - Current route waypoints to determine legs before split point
- `routeStats` - Current route statistics for main legs
- `selectedAircraft` - Aircraft specs for fuel/performance calculations
- `weather` - Wind data for calculations

#### Integration Points
- Must integrate with existing `StopCardsContainer` rendering
- Should use same calculation patterns as regular stop cards
- Need to handle case where alternate data exists vs doesn't exist
- Must recalculate when flight is loaded (stand-alone verification)

### Special Considerations

#### Aviation Safety Requirements
- **No dummy data** - all calculations must be real
- **No shortcuts** - full mathematical accuracy required
- **Regulatory compliance** - this affects actual flight safety

#### Stand-Alone Application Goal
- When loading saved flights, recalculate alternate fuel independently
- Verify against Palantir automation calculations
- Ensure Fast Planner can operate independently for flight verification

#### Automation Integration
- Support both manual alternate selection (current functionality)
- Support Palantir automation-selected alternates (existing in flight data)
- Maintain compatibility with both workflows

### Development Approach
1. **Step 1**: Create alternate stop card visual component (orange A icon)
2. **Step 2**: Implement cumulative distance/time calculations
3. **Step 3**: Add wind effects and fuel calculations
4. **Step 4**: Calculate passenger capacity based on total fuel
5. **Step 5**: Test with loaded flights for stand-alone verification

### Core Principles
- No quick fixes or workarounds - only proper structural improvements
- No dummy or mock data that could be mistaken for real values  
- Clean, maintainable code that accurately represents real-world aviation data
- Take one step at a time with thorough testing
- Remember this is aviation software - no shortcuts or potentially misleading numbers

Ready to implement the alternate stop card with full mathematical accuracy for aviation safety compliance.
