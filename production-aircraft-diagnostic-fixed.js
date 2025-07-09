// PRODUCTION vs LOCAL AIRCRAFT DIAGNOSTIC SCRIPT - FIXED
// Run this in browser console to find exact disconnect

console.log('🔍 AIRCRAFT DIAGNOSTIC STARTING...');

// 1. CHECK AIRCRAFT MANAGER STATE
console.log('\n=== 1. AIRCRAFT MANAGER STATE ===');
console.log('aircraftManager exists:', !!window.aircraftManager);
if (window.aircraftManager) {
  console.log('aircraftManager.filteredAircraft:', window.aircraftManager.filteredAircraft ? window.aircraftManager.filteredAircraft.length : 'NONE');
  console.log('aircraftManager.callbacks:', window.aircraftManager.callbacks ? Object.keys(window.aircraftManager.callbacks) : 'NONE');
} else {
  console.log('❌ aircraftManager not found');
}

// 2. CHECK REACT STATE
console.log('\n=== 2. REACT STATE ===');
console.log('debugUseAircraftReturn:', window.debugUseAircraftReturn);
console.log('currentSelectedAircraft:', window.currentSelectedAircraft);

// 3. CHECK DROPDOWN VALUES
console.log('\n=== 3. DROPDOWN VALUES ===');
const typeDropdown = document.getElementById('aircraft-type');
const regDropdown = document.getElementById('aircraft-registration');
console.log('Type dropdown value:', typeDropdown ? typeDropdown.value : 'NOT FOUND');
console.log('Registration dropdown value:', regDropdown ? regDropdown.value : 'NOT FOUND');
if (typeDropdown) {
  console.log('Type dropdown options:', Array.from(typeDropdown.options).map(o => o.value));
}
if (regDropdown) {
  console.log('Registration dropdown options:', Array.from(regDropdown.options).map(o => o.value));
}

// 4. CHECK FLIGHT SETTINGS
console.log('\n=== 4. FLIGHT SETTINGS ===');
console.log('window.currentFlightSettings:', window.currentFlightSettings);

// 5. CHECK STOP CARDS
console.log('\n=== 5. STOP CARDS ===');
if (window.currentStopCards) {
  console.log('window.currentStopCards:', window.currentStopCards.length);
  if (window.currentStopCards.length > 0) {
    console.log('First stop card:', window.currentStopCards[0]);
  }
} else {
  console.log('window.currentStopCards: NONE');
}

// 6. AIRCRAFT SELECTION TEST
console.log('\n=== 6. AIRCRAFT SELECTION TEST ===');
function testAircraftSelection() {
  if (window.aircraftManager && window.aircraftManager.filteredAircraft && window.aircraftManager.filteredAircraft.length > 0) {
    const aircraft = window.aircraftManager.filteredAircraft[0];
    console.log('Test aircraft:', aircraft.registration, aircraft.modelType);
    
    // Test if React functions exist
    console.log('changeAircraftType exists:', typeof window.changeAircraftType);
    console.log('changeAircraftRegistration exists:', typeof window.changeAircraftRegistration);
    
    // Try to trigger selection
    if (typeof window.changeAircraftType === 'function') {
      console.log('🧪 TESTING: Calling changeAircraftType...');
      window.changeAircraftType(aircraft.modelType);
      
      setTimeout(function() {
        console.log('🧪 TESTING: Calling changeAircraftRegistration...');
        window.changeAircraftRegistration(aircraft.registration);
        
        setTimeout(function() {
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
    
    // Override callback to see if it being called
    if (window.aircraftManager.callbacks && window.aircraftManager.callbacks.onAircraftFiltered) {
      const originalCallback = window.aircraftManager.callbacks.onAircraftFiltered;
      
      window.aircraftManager.setCallback('onAircraftFiltered', function(aircraft, type) {
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
  'aircraftManager',
  'changeAircraftType', 
  'changeAircraftRegistration',
  'currentSelectedAircraft',
  'debugUseAircraftReturn'
];

criticalPieces.forEach(function(piece) {
  const exists = typeof window[piece] !== 'undefined';
  console.log((exists ? '✅' : '❌') + ' window.' + piece + ': ' + (exists ? 'EXISTS' : 'MISSING'));
});

// 9. PRODUCTION SPECIFIC CHECKS
console.log('\n=== 9. PRODUCTION SPECIFIC CHECKS ===');
console.log('React DevTools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
console.log('Environment:', window.location.hostname);
const scriptTag = document.querySelector('script[src*="index-"]');
console.log('Build minified:', scriptTag ? scriptTag.src.includes('min') : 'Unknown');

// Run the tests
console.log('\n🚀 RUNNING TESTS...');
testCallbackSystem();
setTimeout(function() {
  testAircraftSelection();
}, 1000);

console.log('\n✅ DIAGNOSTIC COMPLETE - Check results above');