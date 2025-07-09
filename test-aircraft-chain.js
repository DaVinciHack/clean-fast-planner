/**
 * Aircraft Loading Chain Test
 * Tests the complete chain from OSDK → Manager → React UI
 * Paste this into browser console (works both local and online)
 */

console.log('🔗 AIRCRAFT LOADING CHAIN TEST');
console.log('🌍 Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE');
console.log('🕐 Time:', new Date().toLocaleTimeString());

async function testAircraftChain() {
  
  // STEP 1: Check if managers are available
  console.log('\n=== STEP 1: MANAGERS ===');
  const managers = window.appManagers || window.managers;
  console.log('🔧 Managers available:', !!managers);
  
  if (!managers) {
    console.log('❌ No managers found - chain broken at manager level');
    return;
  }
  
  const aircraftManager = managers.aircraftManager;
  console.log('✈️ Aircraft manager available:', !!aircraftManager);
  
  if (!aircraftManager) {
    console.log('❌ No aircraft manager - chain broken');
    return;
  }
  
  // STEP 2: Check aircraft manager state
  console.log('\n=== STEP 2: AIRCRAFT MANAGER STATE ===');
  console.log('✈️ Aircraft list length:', aircraftManager.aircraftList?.length || 0);
  console.log('✈️ Filtered aircraft length:', aircraftManager.filteredAircraft?.length || 0);
  console.log('✈️ All aircraft loaded flag:', aircraftManager.allAircraftLoaded);
  console.log('✈️ Aircraft by region:', Object.keys(aircraftManager.aircraftByRegion || {}));
  console.log('✈️ Types by region:', Object.keys(aircraftManager.typesByRegion || {}));
  
  // Check if manager has data but UI doesn't
  if (aircraftManager.aircraftList?.length > 0) {
    console.log('✅ Manager HAS aircraft data');
    
    // Sample aircraft
    const sample = aircraftManager.aircraftList[0];
    console.log('✈️ Sample aircraft:', {
      modelType: sample.modelType,
      tailNumber: sample.tailNumber,
      region: sample.region
    });
  } else {
    console.log('❌ Manager has NO aircraft data');
  }
  
  // STEP 3: Check OSDK client
  console.log('\n=== STEP 3: OSDK CLIENT ===');
  const client = window.client;
  console.log('🔌 Client available:', !!client);
  console.log('🔌 Client ready:', client?.ready);
  console.log('🔌 Client initialized:', client?.initialized);
  
  // STEP 4: Test manual aircraft loading
  console.log('\n=== STEP 4: MANUAL LOADING TEST ===');
  try {
    console.log('🔄 Attempting manual aircraft load...');
    await aircraftManager.loadAllAircraft();
    console.log('✅ Manual load completed');
    console.log('✈️ Aircraft after manual load:', aircraftManager.aircraftList?.length || 0);
  } catch (error) {
    console.log('❌ Manual load failed:', error.message);
  }
  
  // STEP 5: Check React UI elements
  console.log('\n=== STEP 5: UI ELEMENTS ===');
  
  // Look for aircraft dropdowns
  const dropdowns = document.querySelectorAll('select, .dropdown, [class*="select"]');
  console.log('🔍 Total dropdowns found:', dropdowns.length);
  
  let aircraftDropdowns = [];
  dropdowns.forEach((dropdown, index) => {
    const text = dropdown.outerHTML.toLowerCase();
    if (text.includes('aircraft') || text.includes('helicopter') || text.includes('model')) {
      aircraftDropdowns.push({
        index,
        tag: dropdown.tagName,
        className: dropdown.className,
        options: dropdown.options?.length || 0,
        children: dropdown.children?.length || 0
      });
    }
  });
  
  console.log('✈️ Aircraft-related dropdowns:', aircraftDropdowns.length);
  aircraftDropdowns.forEach(dropdown => {
    console.log('  ', dropdown);
  });
  
  // Look for "No aircraft" text
  const bodyText = document.body.innerText.toLowerCase();
  const hasNoAircraftText = bodyText.includes('no aircraft');
  console.log('🚫 "No aircraft" text found:', hasNoAircraftText);
  
  // STEP 6: Check for React state issues
  console.log('\n=== STEP 6: REACT STATE CHECK ===');
  
  // Look for React dev tools
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('⚛️ React dev tools available:', !!reactDevTools);
  
  // Check for any aircraft-related global state
  const aircraftGlobals = Object.keys(window).filter(key => 
    key.toLowerCase().includes('aircraft')
  );
  console.log('🌐 Aircraft-related globals:', aircraftGlobals);
  
  // STEP 7: Test callback system
  console.log('\n=== STEP 7: CALLBACK SYSTEM ===');
  
  if (aircraftManager.callbacks) {
    console.log('📞 Available callbacks:', Object.keys(aircraftManager.callbacks));
    console.log('📞 onAircraftFiltered callback set:', !!aircraftManager.callbacks.onAircraftFiltered);
    console.log('📞 onAircraftLoaded callback set:', !!aircraftManager.callbacks.onAircraftLoaded);
  }
  
  // Test triggering callback manually
  if (aircraftManager.filteredAircraft?.length > 0) {
    console.log('🔄 Testing manual callback trigger...');
    try {
      aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
      console.log('✅ Manual callback triggered');
    } catch (error) {
      console.log('❌ Manual callback failed:', error.message);
    }
  }
  
  console.log('\n=== AIRCRAFT CHAIN TEST COMPLETE ===');
  console.log('📋 Compare this output between local and online');
  
  // Summary
  const summary = {
    environment: window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE',
    managersAvailable: !!managers,
    aircraftManagerAvailable: !!aircraftManager,
    aircraftDataCount: aircraftManager?.aircraftList?.length || 0,
    clientReady: client?.ready || false,
    uiDropdownsFound: aircraftDropdowns.length,
    hasNoAircraftText: hasNoAircraftText
  };
  
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  
  return summary;
}

// Run the test
testAircraftChain().then(summary => {
  console.log('✅ Test completed. Summary saved to window.aircraftChainSummary');
  window.aircraftChainSummary = summary;
}).catch(error => {
  console.log('❌ Test failed:', error.message);
});

console.log('🔍 Aircraft chain test loaded and running...');