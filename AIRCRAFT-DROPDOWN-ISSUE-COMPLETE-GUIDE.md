# AIRCRAFT DROPDOWN ISSUE - COMPLETE DIAGNOSIS & FIX GUIDE

## ISSUE SUMMARY
Aircraft dropdowns don't populate in production despite working locally. Type dropdown shows only placeholder, preventing cascading to registration dropdown.

## WHAT WORKS
- ✅ Aircraft manager exists: `window.aircraftManager` = true  
- ✅ Aircraft data loaded: 75 aircraft across 8 types
- ✅ Manager refs connected: `aircraftManagerRef.current === window.aircraftManager` = true
- ✅ All other managers work (mapManager, platformManager, etc.)
- ✅ Authentication and OSDK client working
- ✅ React app mounts correctly
- ✅ Dropdowns exist in DOM

## CURRENT STATE (AS OF CONTEXT END)
- Aircraft manager has data: `window.aircraftManager.filteredAircraft.length = 75`
- Aircraft types available: `['AW139', 'AW189', 'A119', 'EC135', 'S92', 'AS350', 'A109E', 'S76']`
- useAircraft hook returns empty: `aircraftTypes: []`, `aircraftsByType: {}`
- MainCard shows: `totalAircraft: 0`, `hasData: false`

## ROOT CAUSE IDENTIFIED
**The useAircraft hook's setupAircraftCallbacks() function is NOT overriding the manager's callback with React state setters.**

### Current broken callback (in manager):
```javascript
(filteredAircraft, type2) => {
  console.log(`Filtered to ${filteredAircraft.length} aircraft of type ${type2 || "all"}`);
  setLocalAircraftLoading(false);  // Only sets loading, NOT React state
}
```

### Required callback (should be set by useAircraft):
```javascript
(filteredAircraft, type) => {
  if (type) {
    setAircraftsByType(prev => ({ ...prev, [type]: filteredAircraft }));
  } else {
    const byType = {};
    const availableTypes = [];
    filteredAircraft.forEach(aircraft => {
      const modelType = aircraft.modelType || 'Unknown';
      if (!byType[modelType]) {
        byType[modelType] = [];
        availableTypes.push(modelType);
      }
      byType[modelType].push(aircraft);
    });
    setAircraftTypes(availableTypes.sort());
    setAircraftsByType(byType);
  }
  setAircraftLoading(false);
}
```

## WHAT WE'VE TRIED (ALL FAILED)
1. ❌ **Tree-shaking fixes** - Disabled minification/tree-shaking
2. ❌ **Removed duplicate AircraftContext.jsx** - Eliminated competing systems  
3. ❌ **Fixed global reference** - Added `window.aircraftManager = aircraftManagerRef.current`
4. ❌ **Callback debugging** - Confirmed callback exists but wrong one
5. ❌ **State setter preservation** - Added explicit exports to prevent removal
6. ❌ **Uncompressed builds** - Built without compression
7. ❌ **Manual callback tests** - Proved data exists and is ready

## THE SPECIFIC PROBLEM
**useAircraft hook's setupAircraftCallbacks() function is not running or not working.**

### Code location: `/src/components/fast-planner/hooks/useAircraft.js` lines 77-83
```javascript
useEffect(() => {
  if (aircraftManagerRef && aircraftManagerRef.current) {
    aircraftManagerInstanceRef.current = aircraftManagerRef.current;
    setupAircraftCallbacks();  // ← THIS IS NOT WORKING
  }
}, [aircraftManagerRef, setupAircraftCallbacks]);
```

### What setupAircraftCallbacks should do (lines 34-70):
```javascript
const setupAircraftCallbacks = useCallback(() => {
  if (!aircraftManagerInstanceRef.current) {
    console.log('Cannot set up aircraft callbacks - manager not available');
    return;
  }

  console.log('Setting up aircraft manager callbacks');
  
  aircraftManagerInstanceRef.current.setCallback('onAircraftFiltered', (filteredAircraft, type) => {
    // THIS callback should update React state but it's not being set
  });
}, []);
```

## VERIFICATION TESTS
Run these in browser console to confirm state:

```javascript
// 1. Check manager and data
console.log('Manager exists:', !!window.aircraftManager);
console.log('Aircraft count:', window.aircraftManager?.filteredAircraft?.length);

// 2. Check callback
console.log('Callback code:', window.aircraftManager?.callbacks?.onAircraftFiltered?.toString());

// 3. Check useAircraft state  
console.log('useAircraft state:', window.debugUseAircraftReturn);

// 4. Check MainCard props
const typeDropdown = document.getElementById('aircraft-type');
console.log('Dropdown options:', typeDropdown?.options?.length);
```

## THE ACTUAL FIX NEEDED
**Force useAircraft to set up its proper callback that updates React state.**

### Option 1: Debug why setupAircraftCallbacks isn't running
- Check if useEffect dependencies are triggering
- Add logging to setupAircraftCallbacks to see if it runs
- Verify aircraftManagerRef.current is available when useEffect runs

### Option 2: Force callback setup after manager creation
- Add a manual trigger after aircraftManager loads data
- Call setupAircraftCallbacks explicitly when region changes
- Override the callback in a useEffect that runs after data loads

### Option 3: Bypass hook system (quick fix)
- Directly set the callback after manager loads data
- Skip useAircraft state management, populate dropdowns directly
- Use imperative DOM updates instead of React state

## IMMEDIATE NEXT STEPS (FOR NEXT CONTEXT)
1. **Add logging to setupAircraftCallbacks** to see if it runs
2. **Check useEffect dependencies** in useAircraft hook  
3. **Force callback override** after aircraft data loads
4. **Test manual state population** as fallback

## DATA READY FOR DROPDOWNS
The aircraft data is perfectly organized and ready:
- **AW139**: 22 aircraft
- **AW189**: 4 aircraft  
- **A119**: 8 aircraft
- **EC135**: 9 aircraft
- **S92**: 9 aircraft
- **AS350**: 12 aircraft
- **A109E**: 4 aircraft
- **S76**: 7 aircraft

The issue is purely in the React state update mechanism, not data availability.

## BUILD VERSIONS CREATED
- `fastplanner-AIRCRAFT-MANAGER-GLOBAL-FIX-v36.zip` - Latest with global reference fix
- Uses uncompressed build with `minify: false` and `treeshake: false`
- All files in proper structure (index.html, .htaccess in root, assets folder)

## CONTEXT FOR NEXT SESSION
This is a 2-day issue. The aircraft manager has all the data (75 aircraft, 8 types) but useAircraft hook's callback setup is broken, so React state never gets updated, so dropdowns stay empty. The callback exists but it's the wrong one (from useManagers, not useAircraft).