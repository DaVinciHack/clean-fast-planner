// Simple callback test - no complex strings
console.log('Testing callback...');

const aircraftManager = window.appManagers?.aircraftManagerRef?.current;

if (aircraftManager) {
  console.log('Manager found');
  
  // Show original callback
  const original = aircraftManager.callbacks.onAircraftFiltered;
  console.log('Original callback type:', typeof original);
  
  // Create simple test callback
  aircraftManager.callbacks.onAircraftFiltered = function(aircraft, type) {
    console.log('TEST: Got', aircraft.length, 'aircraft, type:', type);
    
    // Call original
    if (original) {
      try {
        original(aircraft, type);
        console.log('Original callback OK');
      } catch (e) {
        console.log('Original callback error:', e.message);
      }
    }
  };
  
  // Test it
  aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
  
} else {
  console.log('No manager found');
}