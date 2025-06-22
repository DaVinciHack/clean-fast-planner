# ALTERNATE MODE & SAR MODE IMPLEMENTATION PLAN

## OVERVIEW
Implementation plan for adding Alternate Mode (visual alternate selection) and SAR Mode (Search and Rescue operational area calculation) to Fast Planner V5.

## CORE PRINCIPLES ⚠️ CRITICAL
- ✅ **NO FILE BLOAT** - Create separate, focused files only
- ✅ **NO DUMMY DATA** - Only real OSDK aircraft data and existing location services
- ✅ **CLEAN INTEGRATION** - Minimal changes to existing files (imports + render only)
- ✅ **SINGLE RESPONSIBILITY** - Each file does one thing well
- ✅ **AVIATION SAFETY** - No placeholder values that could be mistaken for real flight data

## PROJECT CONTEXT
- Fast Planner V5 React/TypeScript application
- Existing infrastructure: map system, location toggles, fuel calculations, OSDK aircraft data
- Existing modes: NORMAL, WAYPOINT
- Existing features: fuel-capable location toggles, airport toggles, route calculations

## FEATURE REQUIREMENTS

### ALTERNATE MODE
**Purpose:** Visual alternate destination selection for improved flight planning

**Behavior:**
- Button next to existing Waypoint Mode button
- When active: auto-enables fuel locations and airports on map
- Smart click logic:
  - Click OFF route → sets alternate destination
  - Click ON route → sets split point, next click = alternate destination
- Updates existing alternate input field
- Triggers existing route recalculation

### SAR MODE
**Purpose:** Search and Rescue operational area calculation

**Behavior:**
- Toggle that works with Alternate Mode
- Parameter inputs: takeoff fuel, SAR equipment weight, time on task
- Calculates remaining fuel after return journey to alternate
- Displays range circle at final waypoint
- Real-time updates when alternate changes

### SAR LOCATION CREATION ⚠️ CRITICAL DEPENDENCY
**Purpose:** Create waypoints for coordinates where no physical location exists

**Problem:** Palantir OSDK cannot plan to coordinates without corresponding location objects
**Solution:** Auto-create persistent SAR waypoints when planning to empty coordinates

**Behavior:**
- When user clicks on map coordinates with no existing location
- Auto-create persistent waypoint in OSDK with SAR designation
- Mark clearly as "SAR Location" or "Search Area" with descriptive naming
- Use new OSDK actions: `addWaypoint` and `deleteWaypoint`
- Waypoints persist as flight plan reference points
- Optional manual cleanup via delete functionality

**Dependencies:**
- New OSDK actions (already added): `addWaypoint`, `deleteWaypoint`
- Integration with auto-plan functionality
- SAR waypoint management system

## IMPLEMENTATION CHECKLIST

### PHASE 1: NEW FILE CREATION - ALTERNATE MODE

#### [ ] 1. Create `/src/components/fast-planner/modes/AlternateMode.js`
**Purpose:** Standalone alternate mode logic hook
**Exports:** `useAlternateMode`
**Dependencies:** Existing location services, map utilities
**Key Functions:**
- Mode state management
- Auto-enable fuel/airport toggles
- Click handler coordination

```javascript
// Template structure:
export const useAlternateMode = () => {
  const [isAlternateMode, setIsAlternateMode] = useState(false);
  const [splitPoint, setSplitPoint] = useState(null);
  
  const toggleAlternateMode = () => {
    // Implementation
  };
  
  const handleMapClick = (clickPoint, waypoints) => {
    // Smart detection logic
  };
  
  return {
    isAlternateMode,
    toggleAlternateMode,
    handleMapClick,
    splitPoint
  };
};
```

#### [ ] 5. Enhance `/src/components/fast-planner/utilities/RouteGeometry.js`
**Purpose:** Add SAR location handling to route detection
**Enhancement:** Handle clicks to coordinates with no existing locations

```javascript
// Add to existing RouteGeometry.js:
export const findLocationAtCoordinates = (clickPoint, allLocations, tolerance = 0.01) => {
  // Check if click is near existing location
  const nearestLocation = findNearestLocation(clickPoint, allLocations);
  
  if (nearestLocation && getDistanceKm(clickPoint, nearestLocation) < tolerance) {
    return { type: 'existing', location: nearestLocation };
  }
  
  return { type: 'coordinates', coordinates: clickPoint };
};

export const needsSARWaypoint = (clickResult) => {
  return clickResult.type === 'coordinates';
};
```

#### [ ] 6. Enhance AlternateMode.js for SAR waypoint creation
**Purpose:** Add SAR waypoint creation to alternate mode logic
**Enhancement:** Auto-create waypoints when clicking empty coordinates

```javascript
// Add to AlternateMode.js:
import { createSARWaypoint, needsSARWaypoint, findLocationAtCoordinates } from '../services/SARLocationService';

const handleMapClick = async (clickPoint, waypoints, allLocations) => {
  const routeCheck = isPointOnRoute(clickPoint, waypoints);
  
  if (routeCheck.isOnRoute) {
    // Handle split point selection
    handleSplitPointSelection(routeCheck.splitPoint);
  } else {
    // Check if location exists
    const locationResult = findLocationAtCoordinates(clickPoint, allLocations);
    
    if (locationResult.type === 'existing') {
      // Use existing location
      handleAlternateDestination(locationResult.location);
    } else {
      // Create SAR waypoint for coordinates
      try {
        const sarWaypoint = await createSARWaypoint(
          locationResult.coordinates, 
          `SAR_Search_Area_${Date.now()}`
        );
        handleAlternateDestination(sarWaypoint);
        
        // Track for reference (no automatic cleanup)
        addSARWaypointToHistory(sarWaypoint);
      } catch (error) {
        console.error('Failed to create SAR waypoint:', error);
        // Show user error message
      }
    }
  }
};
```

### PHASE 2: NEW FILE CREATION - SAR MODE

#### [ ] 4. Create `/src/components/fast-planner/services/SARLocationService.js`
**Purpose:** Manage SAR waypoint creation and tracking
**Dependencies:** OSDK `addWaypoint` and `deleteWaypoint` actions
**Exports:** `createSARWaypoint`, `deleteSARWaypoint`, `listSARWaypoints`

```javascript
// Template structure:
import client from '../../../client';

export const createSARWaypoint = async (coordinates, customName = null) => {
  try {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_');
    const defaultName = `SAR_${timestamp}`;
    
    // Use new OSDK addWaypoint action
    const sarWaypoint = await client(sdk.addWaypoint).applyAction({
      name: customName || defaultName,
      latitude: coordinates.lat,
      longitude: coordinates.lon,
      locationType: 'SAR_SEARCH_AREA',
      isSARLocation: true,
      description: `Search area created for SAR operations`,
      createdAt: new Date().toISOString()
    });
    
    return sarWaypoint;
  } catch (error) {
    console.error('Failed to create SAR waypoint:', error);
    throw error;
  }
};

export const deleteSARWaypoint = async (waypointId) => {
  try {
    // Use new OSDK deleteWaypoint action
    await client(sdk.deleteWaypoint).applyAction({
      waypointId: waypointId
    });
  } catch (error) {
    console.error('Failed to delete SAR waypoint:', error);
    throw error;
  }
};

export const listSARWaypoints = async () => {
  // Get all SAR waypoints for reference/management
  try {
    const waypoints = await client(sdk.getWaypoints).applyAction({
      filter: { isSARLocation: true }
    });
    return waypoints;
  } catch (error) {
    console.error('Failed to list SAR waypoints:', error);
    return [];
  }
};
```

#### [ ] 5. Create `/src/components/fast-planner/calculations/SARCalculations.js`
**Purpose:** SAR calculation engine
**Data Sources:** OSDK aircraft data ONLY - NO dummy data
**Exports:** `calculateOperationalRadius`

```javascript
// Template structure:
export const calculateOperationalRadius = (params) => {
  const {
    takeoffFuel,        // User input
    sarWeight,          // User input  
    timeOnTask,         // User input
    selectedAircraft,   // REAL OSDK data
    routeFuel,          // Real calculation
    alternateFuel,      // Real calculation
    reserveFuel         // Real calculation
  } = params;
  
  // CRITICAL: Validate all aircraft data exists
  if (!selectedAircraft || !selectedAircraft.fuelBurnLbsHr) {
    return { error: 'No aircraft selected' };
  }
  
  // Weight validation using REAL aircraft data
  const grossWeight = selectedAircraft.emptyWeightLbs + sarWeight + takeoffFuel;
  if (grossWeight > selectedAircraft.maxTakeoffWeightLbs) {
    return { error: 'Weight limit exceeded' };
  }
  
  // Fuel calculations using REAL data
  const taskFuel = timeOnTask * selectedAircraft.fuelBurnLbsHr;
  const remainingFuel = takeoffFuel - routeFuel - alternateFuel - reserveFuel - taskFuel;
  
  if (remainingFuel <= 0) {
    return { error: 'Insufficient fuel for SAR operations' };
  }
  
  // Operational radius calculation
  const operationalRadius = (remainingFuel / selectedAircraft.fuelBurnLbsHr / 2) * selectedAircraft.cruiseSpeedKnots;
  
  return {
    operationalRadiusNM: operationalRadius,
    remainingFuelLbs: remainingFuel,
    enduranceHours: remainingFuel / selectedAircraft.fuelBurnLbsHr
  };
};
```

#### [ ] 5. Create `/src/components/fast-planner/modes/SARMode.js`
**Purpose:** Standalone SAR mode logic hook
**Dependencies:** `AlternateMode`, `SARCalculations`, OSDK aircraft data
**Exports:** `useSARMode`

```javascript
// Template structure:
export const useSARMode = (selectedAircraft, routeStats, alternateStats) => {
  const [sarEnabled, setSarEnabled] = useState(false);
  const [takeoffFuel, setTakeoffFuel] = useState(4000);
  const [sarWeight, setSarWeight] = useState(440);
  const [timeOnTask, setTimeOnTask] = useState(1.0);
  
  const sarCalculation = useMemo(() => {
    if (!sarEnabled || !selectedAircraft) return null;
    
    return calculateOperationalRadius({
      takeoffFuel,
      sarWeight,
      timeOnTask,
      selectedAircraft,      // REAL OSDK data
      routeFuel: routeStats?.totalFuelRequired || 0,
      alternateFuel: alternateStats?.fuelRequired || 0,
      reserveFuel: selectedAircraft.reserveFuelLbs || 0
    });
  }, [sarEnabled, takeoffFuel, sarWeight, timeOnTask, selectedAircraft, routeStats, alternateStats]);
  
  return {
    sarEnabled,
    setSarEnabled,
    takeoffFuel,
    setTakeoffFuel,
    sarWeight,
    setSarWeight,
    timeOnTask,
    setTimeOnTask,
    sarCalculation
  };
};
```

#### [ ] 6. Create `/src/components/fast-planner/components/panels/cards/SARCard.jsx`
**Purpose:** SAR controls card component
**Dependencies:** `useSARMode` hook
**Data:** Uses selectedAircraft prop - NO dummy data

```jsx
// Template structure:
const SARCard = ({ id, selectedAircraft, routeStats, alternateStats }) => {
  const {
    sarEnabled,
    setSarEnabled,
    takeoffFuel,
    setTakeoffFuel,
    sarWeight,
    setSarWeight,
    timeOnTask,
    setTimeOnTask,
    sarCalculation
  } = useSARMode(selectedAircraft, routeStats, alternateStats);
  
  return (
    <BaseCard title="SAR Range Calculator" id={id}>
      <div className="control-section">
        <label>
          <input 
            type="checkbox" 
            checked={sarEnabled}
            onChange={(e) => setSarEnabled(e.target.checked)}
          />
          Enable SAR Mode
        </label>
        
        {/* Aircraft display - REAL data only */}
        {selectedAircraft ? (
          <div className="aircraft-info">
            <strong>Aircraft:</strong> {selectedAircraft.registration}
            <br />
            <small>Fuel Burn: {selectedAircraft.fuelBurnLbsHr} lbs/hr</small>
          </div>
        ) : (
          <div className="warning">⚠️ No aircraft selected</div>
        )}
        
        {sarEnabled && (
          <>
            <label htmlFor="takeoff-fuel">Takeoff Fuel (lbs):</label>
            <input 
              type="number" 
              id="takeoff-fuel"
              value={takeoffFuel}
              onChange={(e) => setTakeoffFuel(Number(e.target.value))}
              min="0"
              max={selectedAircraft?.maxFuelLbs || 6000}
            />
            
            <label htmlFor="sar-weight">SAR Equipment Weight (lbs):</label>
            <input 
              type="number" 
              id="sar-weight"
              value={sarWeight}
              onChange={(e) => setSarWeight(Number(e.target.value))}
              min="0"
            />
            
            <label htmlFor="time-on-task">Time on Task (hours):</label>
            <input 
              type="number" 
              id="time-on-task"
              value={timeOnTask}
              onChange={(e) => setTimeOnTask(Number(e.target.value))}
              min="0"
              step="0.1"
            />
          </>
        )}
        
        {/* Results display */}
        {sarCalculation && (
          <div className="sar-results">
            {sarCalculation.error ? (
              <div className="error">❌ {sarCalculation.error}</div>
            ) : (
              <div className="results">
                <div><strong>Operational Radius:</strong> {sarCalculation.operationalRadiusNM.toFixed(1)} NM</div>
                <div><strong>Remaining Fuel:</strong> {sarCalculation.remainingFuelLbs.toFixed(0)} lbs</div>
                <div><strong>Endurance:</strong> {sarCalculation.enduranceHours.toFixed(1)} hours</div>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
};
```

#### [ ] 7. Create `/src/components/fast-planner/components/map/SARRangeCircle.jsx`
**Purpose:** Range circle map visualization with helicopter icon
**Dependencies:** Map/leaflet components, helicopter icon from SAR1.html
**Data:** Real calculation results only

```jsx
// Template structure:
const SARRangeCircle = ({ center, radiusNM, visible, helicopterPosition }) => {
  if (!visible || !center || !radiusNM || radiusNM <= 0) return null;
  
  const radiusMeters = radiusNM * 1852; // Convert nautical miles to meters
  
  return (
    <>
      {/* SAR Range Circle */}
      <Circle
        center={[center.lat, center.lon]}
        radius={radiusMeters}
        pathOptions={{
          fillColor: 'red',
          fillOpacity: 0.15,
          color: 'red',
          weight: 2,
          opacity: 0.8
        }}
      />
      
      {/* Helicopter Icon at operational position */}
      {helicopterPosition && (
        <Marker
          position={[helicopterPosition.lat, helicopterPosition.lon]}
          icon={helicopterIcon}
        />
      )}
    </>
  );
};

// Helicopter icon definition (from SAR1.html)
const helicopterIcon = L.divIcon({
  html: `<div class="helicopter-marker"></div>`,
  className: 'custom-helicopter-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});
```

#### [ ] 8. Add helicopter icon to project assets
**Purpose:** Include helicopter icon in project build
**Action:** Download and copy helicopter icon to project assets
**Location:** `/public/assets/icons/helicopter-4069_128.gif`

**Manual Step Required:**
1. Download helicopter icon from: `https://bristow.info/SAR/helicopter-4069_128.gif`
2. Save to: `/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/assets/icons/helicopter-4069_128.gif`

**Note:** Directory structure already created at `/public/assets/icons/`

#### [ ] 9. Create `/src/components/fast-planner/assets/HelicopterIcon.css`
**Purpose:** Helicopter icon styling using local asset
**Source:** Modified from SAR1.html to use local asset

```css
/* Helicopter marker style - using local asset */
.helicopter-marker {
  background-image: url('/assets/icons/helicopter-4069_128.gif');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.custom-helicopter-icon {
  background: transparent;
  border: none;
}
```

### PHASE 3: MINIMAL INTEGRATION

#### [ ] 8. Integration Point: Add AlternateModeButton to UI
**File to Modify:** Find where Waypoint Mode button is located
**Change Type:** Import + render only (2-3 lines)

```javascript
// Add import
import AlternateModeButton from '../controls/AlternateModeButton';

// Add to render (next to existing Waypoint Mode button)
<AlternateModeButton />
```

#### [ ] 9. Integration Point: Add SARCard to cards system
**File to Modify:** `/src/components/fast-planner/components/panels/cards/index.js`
**Change Type:** Export only (1 line)

```javascript
// Add export
export { default as SARCard } from './SARCard';
```

#### [ ] 10. Integration Point: Replace EvacuationCard with SARCard
**File to Modify:** Where EvacuationCard is currently used
**Change Type:** Import + render change (2-3 lines)

```javascript
// Replace import
import { SARCard } from './cards';

// Replace in render
<SARCard 
  id="sar-card"
  selectedAircraft={selectedAircraft}
  routeStats={routeStats}
  alternateStats={alternateStats}
/>
```

#### [ ] 11. Integration Point: Add SARRangeCircle with helicopter to map
**File to Modify:** Main map component
**Change Type:** Import + conditional render (4-5 lines)

```javascript
// Add import
import SARRangeCircle from './map/SARRangeCircle';

// Add to map render
<SARRangeCircle 
  center={finalWaypoint}
  radiusNM={sarCalculation?.operationalRadiusNM}
  visible={sarEnabled && sarCalculation && !sarCalculation.error}
  helicopterPosition={finalWaypoint} // Show helicopter at operational area
/>
```

#### [ ] 12. Integration Point: Connect map clicks to AlternateMode
**File to Modify:** Map click handler
**Change Type:** Add handler call (2-3 lines)

```javascript
// Add to existing map click handler
if (isAlternateMode) {
  alternateMode.handleMapClick(clickLatLng, waypoints);
}
```

## DATA SAFETY CHECKLIST ⚠️ CRITICAL

### ✅ AIRCRAFT DATA VALIDATION
- [ ] All aircraft properties checked for existence before use
- [ ] No hardcoded aircraft performance values
- [ ] Graceful handling when no aircraft selected
- [ ] Weight limits enforced using real MTOGW values

### ✅ FUEL CALCULATION SAFETY
- [ ] All fuel calculations use real route data
- [ ] Reserve fuel requirements enforced
- [ ] Negative fuel scenarios handled with errors
- [ ] No placeholder fuel values

### ✅ SAR WAYPOINT MANAGEMENT
- [ ] Persistent waypoints created only when no existing location
- [ ] SAR waypoints clearly marked with descriptive naming convention
- [ ] Waypoints persist as flight plan reference points
- [ ] Optional manual deletion functionality available
- [ ] Error handling for OSDK waypoint creation failures
- [ ] SAR waypoint history tracking for reference

### ✅ OSDK INTEGRATION SAFETY
- [ ] New OSDK actions (`addWaypoint`, `deleteWaypoint`) tested
- [ ] Proper error handling for OSDK failures
- [ ] Waypoint creation/deletion wrapped in try-catch
- [ ] User feedback for waypoint operation status

## TESTING CHECKLIST

### ✅ ALTERNATE MODE TESTING
- [ ] Click detection works (on-route vs off-route)
- [ ] Fuel locations and airports auto-enable
- [ ] Alternate input field updates correctly
- [ ] Route recalculation triggers properly
- [ ] Mode toggle works smoothly

### ✅ SAR VISUAL ELEMENTS
- [ ] Range circle displays correctly at operational area
- [ ] Helicopter icon appears at correct position
- [ ] Helicopter icon styling matches original SAR design
- [ ] Visual elements only show when SAR mode enabled
- [ ] Icon and circle update in real-time with calculations

### ✅ SAR WAYPOINT TESTING
- [ ] Waypoint creation works for arbitrary coordinates
- [ ] Waypoints persist properly as flight plan references
- [ ] Auto-plan functionality works with SAR waypoints
- [ ] Manual deletion works when needed
- [ ] Error scenarios handled gracefully
- [ ] SAR waypoint listing/management functions

### ✅ INTEGRATION TESTING
- [ ] No breaking changes to existing functionality
- [ ] Performance acceptable with new calculations and waypoint operations
- [ ] UI responsive and intuitive
- [ ] Works with various aircraft types from OSDK
- [ ] SAR waypoint creation doesn't interfere with normal operations

## SUCCESS CRITERIA

1. ✅ Users can visually select alternates by clicking map
2. ✅ Smart detection works reliably (on-route vs off-route)
3. ✅ SAR mode shows accurate operational areas using real data
4. ✅ Real-time updates when changing alternates
5. ✅ All calculations use real OSDK aircraft data
6. ✅ No dummy data anywhere in the system
7. ✅ Clean, maintainable code in separate files
8. ✅ Minimal changes to existing files
9. ✅ **SAR waypoints auto-created for coordinates without existing locations**
10. ✅ **Auto-plan functionality works with SAR-created waypoints**
11. ✅ **SAR waypoints persist as flight plan reference points**
12. ✅ **OSDK waypoint operations integrate smoothly**

## ROLLBACK PLAN
If issues arise, new files can be removed and imports reverted without affecting existing functionality. SAR waypoints created during testing can be manually deleted if needed.

## DEPENDENCIES
- ✅ OSDK `addWaypoint` action (already added)
- ✅ OSDK `deleteWaypoint` action (already added)  
- ✅ Existing location services and fuel capability flags
- ✅ Existing auto-plan functionality
- ✅ Existing map click handling system

## NOTES
- This implementation leverages existing infrastructure maximally
- New features are additive, not replacement
- Aviation safety is paramount - no placeholder data
- Code remains clean and maintainable
- **SAR waypoint creation enables planning to any coordinates**
- **SAR waypoints persist as valuable flight plan references**
- **Manual cleanup available when needed, but not automatic**