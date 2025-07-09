// PRODUCTION vs LOCAL AIRCRAFT DIAGNOSTIC SCRIPT
// Run this in browser console to find exact disconnect

console.log('🔍 AIRCRAFT DIAGNOSTIC STARTING...');

// 1. CHECK AIRCRAFT MANAGER STATE
console.log('\n=== 1. AIRCRAFT MANAGER STATE ===');
console.log('aircraftManager exists:', !!window.aircraftManager);
console.log('aircraftManager.filteredAircraft:', window.aircraftManager?.filteredAircraft?.length || 'NONE');
console.log('aircraftManager.callbacks:', Object.keys(window.aircraftManager?.callbacks || {}));

// 2. CHECK REACT STATE
console.log('\n=== 2. REACT STATE ===');
console.log('debugUseAircraftReturn:', window.debugUseAircraftReturn);
console.log('currentSelectedAircraft:', window.currentSelectedAircraft);

// 3. CHECK DROPDOWN VALUES
console.log('\n=== 3. DROPDOWN VALUES ===');
const typeDropdown = document.getElementById('aircraft-type');
const regDropdown = document.getElementById('aircraft-registration');
console.log('Type dropdown value:', typeDropdown?.value);
console.log('Registration dropdown value:', regDropdown?.value);
console.log('Type dropdown options:', Array.from(typeDropdown?.options || []).map(o => o.value));
console.log('Registration dropdown options:', Array.from(regDropdown?.options || []).map(o => o.value));

// 4. CHECK FLIGHT SETTINGS
console.log('\n=== 4. FLIGHT SETTINGS ===');
console.log('window.currentFlightSettings:', window.currentFlightSettings);

// 5. CHECK STOP CARDS
console.log('\n=== 5. STOP CARDS ===');
console.log('window.currentStopCards:', window.currentStopCards?.length || 'NONE');
if (window.currentStopCards?.length > 0) {
  console.log('First stop card:', window.currentStopCards[0]);
}

// 6. AIRCRAFT SELECTION TEST
console.log('\n=== 6. AIRCRAFT SELECTION TEST ===');
function testAircraftSelection() {
  if (window.aircraftManager?.filteredAircraft?.length > 0) {
    const aircraft = window.aircraftManager.filteredAircraft[0];
    console.log('Test aircraft:', aircraft.registration, aircraft.modelType);
    
    // Test if React functions exist
    console.log('changeAircraftType exists:', typeof window.changeAircraftType);
    console.log('changeAircraftRegistration exists:', typeof window.changeAircraftRegistration);
    
    // Try to trigger selection
    if (typeof window.changeAircraftType === 'function') {
      console.log('🧪 TESTING: Calling changeAircraftType...');
      window.changeAircraftType(aircraft.modelType);
      
      setTimeout(() => {
        console.log('🧪 TESTING: Calling changeAircraftRegistration...');
        window.changeAircraftRegistration(aircraft.registration);
        
        setTimeout(() => {
          console.log('🧪 TEST RESULTS:');
          console.log('Selected aircraft after test:', window.currentSelectedAircraft);
          console.log('React state after test:', window.debugUseAircraftReturn);
        }, 500);
      }, 200);
    } else {
      console.log('❌ changeAircraftType function not available globally');
    }
  } else {
    console.log('❌ No aircraft available for testing');
  }
}

// 7. CALLBACK SYSTEM TEST
console.log('\n=== 7. CALLBACK SYSTEM TEST ===');
function testCallbackSystem() {
  if (window.aircraftManager) {
    console.log('Testing callback system...');
    
    // Override callback to see if it's being called
    const originalCallback = window.aircraftManager.callbacks?.onAircraftFiltered;
    if (originalCallback) {
      window.aircraftManager.setCallback('onAircraftFiltered', (aircraft, type) => {
        console.log('🔥 CALLBACK TRIGGERED:', aircraft.length, 'aircraft, type:', type);
        console.log('🔥 CALLBACK DATA:', aircraft.slice(0, 3));
        
        // Call original
        originalCallback(aircraft, type);
      });
      
      // Trigger filter
      window.aircraftManager.filterAircraft('Gulf of Mexico');
    } else {
      console.log('❌ No onAircraftFiltered callback found');
    }
  }
}

// 8. CHECK FOR CRITICAL MISSING PIECES
console.log('\n=== 8. MISSING PIECES CHECK ===');
const criticalPieces = [
  'window.aircraftManager',
  'window.changeAircraftType', 
  'window.changeAircraftRegistration',
  'window.currentSelectedAircraft',
  'window.debugUseAircraftReturn'
];

criticalPieces.forEach(piece => {
  const exists = eval(`typeof ${piece} !== 'undefined'`);
  console.log(`${exists ? '✅' : '❌'} ${piece}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// 9. PRODUCTION SPECIFIC CHECKS
console.log('\n=== 9. PRODUCTION SPECIFIC CHECKS ===');
console.log('React DevTools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
console.log('Environment:', window.location.hostname);
console.log('Build minified:', document.querySelector('script[src*="index-"]')?.src?.includes('min') || 'Unknown');

// Run the tests
console.log('\n🚀 RUNNING TESTS...');
testCallbackSystem();
setTimeout(() => {
  testAircraftSelection();
}, 1000);

console.log('\n✅ DIAGNOSTIC COMPLETE - Check results above');