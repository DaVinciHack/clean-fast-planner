/**
 * Check Aircraft Manager Ref Script
 * Tests the actual aircraftManagerRef.current
 */

console.log('🔍 CHECKING AIRCRAFT MANAGER REF...');
console.log('🌍 Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE');

function checkAircraftRef() {
  console.log('\n=== AIRCRAFT MANAGER REF CHECK ===');
  
  const appManagers = window.appManagers;
  console.log('📍 appManagers available:', !!appManagers);
  
  if (!appManagers) {
    console.log('❌ No appManagers found');
    return;
  }
  
  console.log('📍 aircraftManagerRef available:', !!appManagers.aircraftManagerRef);
  
  if (!appManagers.aircraftManagerRef) {
    console.log('❌ No aircraftManagerRef found');
    return;
  }
  
  // Check the ref current value
  const aircraftManagerRef = appManagers.aircraftManagerRef;
  console.log('📍 aircraftManagerRef type:', typeof aircraftManagerRef);
  console.log('📍 aircraftManagerRef.current available:', !!aircraftManagerRef.current);
  
  if (!aircraftManagerRef.current) {
    console.log('❌ aircraftManagerRef.current is null/undefined');
    console.log('📍 Ref object keys:', Object.keys(aircraftManagerRef));
    return;
  }
  
  // Check the actual aircraft manager
  const aircraftManager = aircraftManagerRef.current;
  console.log('\n=== AIRCRAFT MANAGER DETAILS ===');
  console.log('✈️ Aircraft manager type:', typeof aircraftManager);
  console.log('✈️ Aircraft manager constructor:', aircraftManager.constructor?.name);
  
  // Check aircraft data
  console.log('\n=== AIRCRAFT DATA ===');
  console.log('✈️ aircraftList length:', aircraftManager.aircraftList?.length || 0);
  console.log('✈️ filteredAircraft length:', aircraftManager.filteredAircraft?.length || 0);
  console.log('✈️ allAircraftLoaded:', aircraftManager.allAircraftLoaded);
  console.log('✈️ aircraftByRegion keys:', Object.keys(aircraftManager.aircraftByRegion || {}));
  console.log('✈️ typesByRegion keys:', Object.keys(aircraftManager.typesByRegion || {}));
  
  // Check Gulf of Mexico specifically
  if (aircraftManager.aircraftByRegion && aircraftManager.aircraftByRegion['Gulf of Mexico']) {
    const gulfAircraft = aircraftManager.aircraftByRegion['Gulf of Mexico'];
    console.log('🌊 Gulf of Mexico aircraft count:', gulfAircraft.length);
    
    if (gulfAircraft.length > 0) {
      console.log('🌊 First Gulf aircraft:', {
        modelType: gulfAircraft[0].modelType,
        tailNumber: gulfAircraft[0].tailNumber,
        id: gulfAircraft[0].id
      });
    }
  }
  
  // Check types by region for Gulf
  if (aircraftManager.typesByRegion && aircraftManager.typesByRegion['Gulf of Mexico']) {
    const gulfTypes = aircraftManager.typesByRegion['Gulf of Mexico'];
    console.log('🌊 Gulf of Mexico aircraft types:', gulfTypes);
  }
  
  // Check callbacks
  console.log('\n=== CALLBACKS ===');
  if (aircraftManager.callbacks) {
    console.log('📞 Available callbacks:', Object.keys(aircraftManager.callbacks));
    console.log('📞 onAircraftFiltered callback:', !!aircraftManager.callbacks.onAircraftFiltered);
    console.log('📞 onAircraftLoaded callback:', !!aircraftManager.callbacks.onAircraftLoaded);
  }
  
  // Try manual aircraft loading if no data
  if (aircraftManager.aircraftList?.length === 0) {
    console.log('\n=== MANUAL LOADING TEST ===');
    console.log('🔄 No aircraft data found, attempting manual load...');
    
    aircraftManager.loadAllAircraft().then(() => {
      console.log('✅ Manual load completed');
      console.log('✈️ Aircraft count after load:', aircraftManager.aircraftList?.length || 0);
      
      // Try filtering for Gulf of Mexico
      aircraftManager.filterAircraftByRegion('Gulf of Mexico');
      console.log('✈️ Filtered aircraft count:', aircraftManager.filteredAircraft?.length || 0);
      
    }).catch(error => {
      console.log('❌ Manual load failed:', error.message);
    });
  }
  
  // Test triggering callbacks manually  
  if (aircraftManager.filteredAircraft?.length > 0 && aircraftManager.callbacks.onAircraftFiltered) {
    console.log('\n=== MANUAL CALLBACK TEST ===');
    console.log('🔄 Testing manual callback trigger...');
    try {
      aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
      console.log('✅ Manual callback triggered');
    } catch (error) {
      console.log('❌ Manual callback failed:', error.message);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  const summary = {
    environment: window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE',
    refAvailable: !!aircraftManagerRef.current,
    aircraftCount: aircraftManager?.aircraftList?.length || 0,
    filteredCount: aircraftManager?.filteredAircraft?.length || 0,
    allLoaded: aircraftManager?.allAircraftLoaded || false,
    gulfAircraftCount: aircraftManager?.aircraftByRegion?.['Gulf of Mexico']?.length || 0,
    callbacksSet: !!(aircraftManager?.callbacks?.onAircraftFiltered)
  };
  
  console.log(JSON.stringify(summary, null, 2));
  window.aircraftRefSummary = summary;
  
  return summary;
}

// Run the check
checkAircraftRef();

console.log('🔍 Aircraft ref check complete. Results in window.aircraftRefSummary');