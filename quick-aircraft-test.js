/**
 * Quick Aircraft Test - Run in Browser Console
 * Paste this into browser console on both local and online versions
 */

(function() {
  console.log('🚀 QUICK AIRCRAFT TEST STARTING...');
  console.log('🌍 Environment:', window.location.hostname + ':' + window.location.port);
  console.log('🕐 Time:', new Date().toLocaleTimeString());
  
  // Test 1: Basic environment
  console.log('\n=== BASIC ENVIRONMENT ===');
  console.log('Host:', window.location.hostname);
  console.log('Port:', window.location.port);
  console.log('Dev mode:', typeof window.__vite_plugin_react_preamble_installed__ !== 'undefined');
  console.log('React dev tools:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined');
  
  // Test 2: Manager availability
  console.log('\n=== MANAGERS ===');
  const managers = window.appManagers || window.managers;
  console.log('Managers available:', !!managers);
  if (managers) {
    console.log('Aircraft manager:', !!managers.aircraftManager);
    console.log('Map manager:', !!managers.mapManager);
    console.log('Platform manager:', !!managers.platformManager);
    
    if (managers.aircraftManager) {
      const am = managers.aircraftManager;
      console.log('Aircraft list length:', am.aircraftList?.length || 0);
      console.log('Filtered aircraft length:', am.filteredAircraft?.length || 0);
      console.log('All aircraft loaded:', am.allAircraftLoaded);
      console.log('Available regions:', Object.keys(am.aircraftByRegion || {}));
    }
  }
  
  // Test 3: OSDK Client
  console.log('\n=== OSDK CLIENT ===');
  const client = window.client;
  console.log('Client available:', !!client);
  if (client) {
    console.log('Client ready:', client.ready);
    console.log('Client initialized:', client.initialized);
    console.log('Client type:', typeof client);
  }
  
  // Test 4: Authentication
  console.log('\n=== AUTHENTICATION ===');
  console.log('Auth token in localStorage:', !!localStorage.getItem('authToken'));
  console.log('Auth token in sessionStorage:', !!sessionStorage.getItem('authToken'));
  console.log('OAuth state stored:', !!localStorage.getItem('oauth_state') || !!sessionStorage.getItem('oauth_state'));
  
  // Test 5: React component state (try to find aircraft data in UI)
  console.log('\n=== UI STATE ===');
  
  // Look for aircraft dropdown elements
  const aircraftDropdowns = document.querySelectorAll('select[data-testid*="aircraft"], select[class*="aircraft"], .aircraft-select, .aircraft-dropdown');
  console.log('Aircraft dropdown elements found:', aircraftDropdowns.length);
  
  if (aircraftDropdowns.length > 0) {
    aircraftDropdowns.forEach((dropdown, index) => {
      console.log(`Dropdown ${index + 1}:`, {
        options: dropdown.options?.length || 0,
        value: dropdown.value,
        disabled: dropdown.disabled
      });
    });
  }
  
  // Look for any elements with aircraft text
  const aircraftText = document.body.innerText.toLowerCase();
  const hasAircraftText = aircraftText.includes('aircraft') || aircraftText.includes('helicopter');
  console.log('Aircraft text in page:', hasAircraftText);
  
  // Test 6: Console errors
  console.log('\n=== ERRORS ===');
  if (window.consoleErrors && window.consoleErrors.length > 0) {
    console.log('Recent console errors:', window.consoleErrors.slice(-5));
  } else {
    console.log('No console errors tracked (window.consoleErrors not available)');
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('📋 Save this output for comparison');
  
  // Try to trigger aircraft loading if manager is available
  if (managers?.aircraftManager && !managers.aircraftManager.allAircraftLoaded) {
    console.log('\n🔄 Attempting to trigger aircraft loading...');
    try {
      managers.aircraftManager.loadAllAircraft().then(() => {
        console.log('✅ Aircraft loading completed');
        console.log('Aircraft count after loading:', managers.aircraftManager.aircraftList?.length || 0);
      }).catch(error => {
        console.log('❌ Aircraft loading failed:', error.message);
      });
    } catch (error) {
      console.log('❌ Aircraft loading trigger failed:', error.message);
    }
  }
})();