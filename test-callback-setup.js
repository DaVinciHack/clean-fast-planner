// AIRCRAFT CALLBACK SETUP TEST SCRIPT
// Copy and paste this entire script into the browser console to verify if forced callback setup is working

console.log('🔧 TESTING AIRCRAFT CALLBACK SETUP - Starting verification...');

// Test 1: Check if the forced callback setup logs appear
console.log('\n=== TEST 1: CHECKING FOR FORCED CALLBACK LOGS ===');
console.log('Look for these specific logs in the console:');
console.log('- "🔧 USEAIRCRAFT: Setting up manager ref and callbacks"');
console.log('- "🔧 FORCE CALLBACK SETUP"');
console.log('- "🔧 FORCING CALLBACK WITH EXISTING DATA"');

// Test 2: Check aircraftManager state
console.log('\n=== TEST 2: AIRCRAFT MANAGER STATE ===');
if (window.aircraftManager) {
  console.log('✅ Aircraft manager exists');
  console.log('Aircraft data count:', window.aircraftManager.filteredAircraft?.length || 0);
  console.log('Aircraft types available:', window.aircraftManager.filteredAircraft ? 
    [...new Set(window.aircraftManager.filteredAircraft.map(a => a.modelType))].sort() : 'No data');
  
  // Check if manager has callbacks
  console.log('Manager callbacks exist:', !!window.aircraftManager.callbacks);
  if (window.aircraftManager.callbacks?.onAircraftFiltered) {
    console.log('onAircraftFiltered callback code length:', window.aircraftManager.callbacks.onAircraftFiltered.toString().length);
    console.log('Callback preview:', window.aircraftManager.callbacks.onAircraftFiltered.toString().substring(0, 200) + '...');
  }
} else {
  console.log('❌ No aircraft manager found');
}

// Test 3: Check useAircraft hook state
console.log('\n=== TEST 3: USEAIRCRAFT HOOK STATE ===');
if (window.debugUseAircraftReturn) {
  console.log('✅ useAircraft debug data exists');
  console.log('Aircraft types count:', window.debugUseAircraftReturn.aircraftTypesLength);
  console.log('Aircraft by type keys:', window.debugUseAircraftReturn.aircraftsByTypeKeys);
  console.log('Loading state:', window.debugUseAircraftReturn.aircraftLoading);
  console.log('Last update:', window.debugUseAircraftReturn.timestamp);
} else {
  console.log('❌ No useAircraft debug data found');
}

// Test 4: Check DOM dropdowns
console.log('\n=== TEST 4: DOM DROPDOWN STATE ===');
const typeDropdown = document.getElementById('aircraft-type');
const regDropdown = document.getElementById('aircraft-registration');

if (typeDropdown) {
  console.log('✅ Type dropdown found');
  console.log('Type dropdown options count:', typeDropdown.options.length);
  console.log('Type dropdown options:', Array.from(typeDropdown.options).map(opt => opt.value));
} else {
  console.log('❌ Type dropdown not found');
}

if (regDropdown) {
  console.log('✅ Registration dropdown found');
  console.log('Registration dropdown options count:', regDropdown.options.length);
} else {
  console.log('❌ Registration dropdown not found');
}

// Test 5: Manual callback trigger test
console.log('\n=== TEST 5: MANUAL CALLBACK TRIGGER TEST ===');
if (window.aircraftManager && window.aircraftManager.filteredAircraft?.length > 0) {
  console.log('Attempting to manually trigger callback...');
  
  try {
    // Create the expected callback format from useAircraft hook
    const testCallback = (filteredAircraft, type) => {
      console.log('🧪 TEST CALLBACK TRIGGERED:', {
        aircraftCount: filteredAircraft.length,
        type: type,
        sampleAircraft: filteredAircraft[0]?.modelType
      });
      
      // Simulate what useAircraft should do
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
      
      console.log('🧪 ORGANIZED DATA:', {
        types: availableTypes.sort(),
        byTypeKeys: Object.keys(byType),
        sampleByType: Object.keys(byType).reduce((acc, key) => {
          acc[key] = byType[key].length;
          return acc;
        }, {})
      });
    };
    
    // Test the callback with current data
    testCallback(window.aircraftManager.filteredAircraft, null);
    
    console.log('✅ Manual callback test completed - check above for organized data');
  } catch (error) {
    console.error('❌ Manual callback test failed:', error);
  }
} else {
  console.log('❌ Cannot test callback - no aircraft data available');
}

// Test 6: Check for forced setup timeout
console.log('\n=== TEST 6: FORCED SETUP VERIFICATION ===');
console.log('Checking if forced callback setup from setTimeout(100ms) executed...');

// Look for the specific patterns that should exist if the code worked
const hasManagerRef = !!window.aircraftManager;
const hasCallbacks = !!window.aircraftManager?.callbacks;
const hasCorrectCallback = window.aircraftManager?.callbacks?.onAircraftFiltered?.toString().includes('setAircraftTypes');

console.log('Manager exists:', hasManagerRef);
console.log('Callbacks exist:', hasCallbacks);
console.log('Callback contains React setters:', hasCorrectCallback);

if (!hasCorrectCallback) {
  console.log('❌ FORCED CALLBACK SETUP DID NOT WORK');
  console.log('Current callback appears to be the wrong one (from useManagers, not useAircraft)');
} else {
  console.log('✅ FORCED CALLBACK SETUP APPEARS TO HAVE WORKED');
}

// Test 7: React component state inspection
console.log('\n=== TEST 7: REACT COMPONENT STATE ===');
try {
  // Try to find React fiber to inspect actual component state
  const rootElement = document.getElementById('root');
  if (rootElement && rootElement._reactInternalFiber) {
    console.log('React fiber found - can inspect component state');
  } else if (rootElement && rootElement._reactInternalInstance) {
    console.log('React instance found - can inspect component state');
  } else {
    console.log('React dev tools or fiber not accessible from console');
  }
} catch (error) {
  console.log('Cannot access React internals:', error.message);
}

console.log('\n=== SUMMARY ===');
console.log('🔧 Test completed. Key findings:');
console.log('1. Check console logs above for "🔧 FORCE CALLBACK SETUP" messages');
console.log('2. Manager data:', window.aircraftManager?.filteredAircraft?.length || 0, 'aircraft');
console.log('3. useAircraft state:', window.debugUseAircraftReturn?.aircraftTypesLength || 0, 'types');
console.log('4. Dropdown options:', document.getElementById('aircraft-type')?.options?.length || 0);
console.log('5. Callback setup success:', !!(window.aircraftManager?.callbacks?.onAircraftFiltered?.toString().includes('setAircraftTypes')));

console.log('\n🔧 AIRCRAFT CALLBACK SETUP TEST COMPLETE');