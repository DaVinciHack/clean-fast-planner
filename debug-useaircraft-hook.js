/**
 * Debug useAircraft Hook
 * Check if the callback is properly connected to React state
 */

console.log('🪝 DEBUGGING USEAIRCRAFT HOOK...');
console.log('🌍 Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE');

function debugUseAircraftHook() {
  
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  
  if (!aircraftManager) {
    console.log('❌ No aircraft manager found');
    return;
  }
  
  console.log('\n=== CURRENT CALLBACK SETUP ===');
  console.log('📞 onAircraftFiltered callback type:', typeof aircraftManager.callbacks.onAircraftFiltered);
  console.log('📞 onAircraftLoaded callback type:', typeof aircraftManager.callbacks.onAircraftLoaded);
  
  // Let's see what the actual callback functions look like
  if (aircraftManager.callbacks.onAircraftFiltered) {
    console.log('📞 onAircraftFiltered function string:', aircraftManager.callbacks.onAircraftFiltered.toString().substring(0, 200) + '...');
  }
  
  console.log('\n=== TESTING CALLBACK WITH CONSOLE OVERRIDE ===');
  
  // Override the callback to log what it receives
  const originalCallback = aircraftManager.callbacks.onAircraftFiltered;
  
  aircraftManager.callbacks.onAircraftFiltered = function(filteredAircraft, type) {
    console.log('🔥 CALLBACK INTERCEPTED:', {
      filteredAircraftCount: filteredAircraft?.length || 0,
      type: type,
      filteredAircraftSample: filteredAircraft?.slice(0, 3)?.map(a => ({
        modelType: a.modelType,
        tailNumber: a.tailNumber
      }))
    });
    
    // Call the original callback
    if (originalCallback) {
      console.log('🔄 Calling original callback...');
      try {
        originalCallback(filteredAircraft, type);
        console.log('✅ Original callback completed');
      } catch (error) {
        console.log('❌ Original callback failed:', error.message);
      }
    } else {
      console.log('❌ No original callback to call');
    }
  };
  
  console.log('✅ Callback intercepted');
  
  // Now trigger the callback
  console.log('\n=== TRIGGERING INTERCEPTED CALLBACK ===');
  aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
  
  // Wait and check UI state again
  setTimeout(() => {
    console.log('\n=== CHECKING UI STATE AFTER INTERCEPT ===');
    
    // Look for the MainCard debug output again
    const bodyText = document.body.innerText;
    console.log('📋 Checking for updated aircraft debug info...');
    
    // Try to trigger some events that might cause re-render
    console.log('\n=== TRIGGERING VARIOUS CALLBACKS ===');
    
    // Try different callback combinations
    aircraftManager.triggerCallback('onAircraftLoaded', aircraftManager.aircraftList);
    aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, 'S92');
    aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
    
    // Try filtering for specific region
    console.log('\n=== TESTING REGION FILTERING ===');
    if (aircraftManager.filterAircraftByRegion) {
      aircraftManager.filterAircraftByRegion('Gulf of Mexico');
      console.log('🌊 Filtered for Gulf of Mexico');
      aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
    }
    
    // Restore original callback
    aircraftManager.callbacks.onAircraftFiltered = originalCallback;
    console.log('🔄 Original callback restored');
    
  }, 2000);
}

// Run the debug
debugUseAircraftHook();

console.log('🪝 useAircraft hook debug running...');