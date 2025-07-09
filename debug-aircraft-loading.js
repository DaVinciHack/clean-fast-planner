/**
 * Aircraft Loading Diagnostic Script
 * Compare local vs online aircraft loading behavior
 */

console.log('🔍 AIRCRAFT LOADING DIAGNOSTICS STARTING...');

// Test 1: Check if managers are available
function testManagerAvailability() {
  console.log('\n=== TEST 1: Manager Availability ===');
  
  // Check for window managers (global access)
  const windowManagers = window.appManagers || window.managers;
  console.log('🔧 Window managers:', windowManagers ? 'AVAILABLE' : 'NOT AVAILABLE');
  
  if (windowManagers) {
    console.log('🔧 Aircraft Manager:', windowManagers.aircraftManager ? 'AVAILABLE' : 'MISSING');
    console.log('🔧 Map Manager:', windowManagers.mapManager ? 'AVAILABLE' : 'MISSING');
    console.log('🔧 Platform Manager:', windowManagers.platformManager ? 'AVAILABLE' : 'MISSING');
  }
  
  // Check for React state in components
  const fastPlannerApp = document.querySelector('[data-testid="fast-planner-app"]') || 
                         document.querySelector('.fast-planner-container') ||
                         document.querySelector('#fast-planner-root');
  
  console.log('🔧 FastPlannerApp DOM:', fastPlannerApp ? 'FOUND' : 'NOT FOUND');
}

// Test 2: Check OSDK client status
function testOSDKClient() {
  console.log('\n=== TEST 2: OSDK Client Status ===');
  
  const client = window.client;
  console.log('🔧 OSDK Client:', client ? 'AVAILABLE' : 'NOT AVAILABLE');
  
  if (client) {
    console.log('🔧 Client ready:', client.ready ? 'YES' : 'NO');
    console.log('🔧 Client initialized:', client.initialized ? 'YES' : 'NO');
    
    // Test client capabilities
    try {
      const hasObjects = typeof client.ontology?.objects === 'object';
      console.log('🔧 Client objects API:', hasObjects ? 'AVAILABLE' : 'MISSING');
    } catch (e) {
      console.log('🔧 Client objects API: ERROR -', e.message);
    }
  }
}

// Test 3: Check aircraft data loading
async function testAircraftDataLoading() {
  console.log('\n=== TEST 3: Aircraft Data Loading ===');
  
  const windowManagers = window.appManagers || window.managers;
  
  if (!windowManagers?.aircraftManager) {
    console.log('❌ Aircraft manager not available - cannot test');
    return;
  }
  
  const aircraftManager = windowManagers.aircraftManager;
  
  // Check current aircraft state
  console.log('🔧 Current aircraft list length:', aircraftManager.aircraftList?.length || 0);
  console.log('🔧 Current filtered aircraft length:', aircraftManager.filteredAircraft?.length || 0);
  console.log('🔧 All aircraft loaded flag:', aircraftManager.allAircraftLoaded);
  
  // Check aircraft by region
  console.log('🔧 Aircraft by region:', Object.keys(aircraftManager.aircraftByRegion || {}));
  console.log('🔧 Types by region:', Object.keys(aircraftManager.typesByRegion || {}));
  
  // Try to trigger aircraft loading manually
  try {
    console.log('🔧 Attempting manual aircraft load...');
    await aircraftManager.loadAllAircraft();
    console.log('✅ Manual aircraft load completed');
    console.log('🔧 After manual load - aircraft count:', aircraftManager.aircraftList?.length || 0);
  } catch (error) {
    console.log('❌ Manual aircraft load failed:', error.message);
  }
}

// Test 4: Check React component state
function testReactComponentState() {
  console.log('\n=== TEST 4: React Component State ===');
  
  // Try to access React internals (development only)
  const reactRoot = document.querySelector('#root');
  
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('🔧 React dev tools available');
    // Note: This is for development debugging only
  } else {
    console.log('🔧 React dev tools not available (production build)');
  }
  
  // Check for aircraft state in localStorage or sessionStorage
  const savedAircraftData = localStorage.getItem('aircraftData') || sessionStorage.getItem('aircraftData');
  console.log('🔧 Saved aircraft data:', savedAircraftData ? 'FOUND' : 'NOT FOUND');
  
  // Check for any global aircraft state
  console.log('🔧 Window aircraft state:', window.aircraftState ? 'AVAILABLE' : 'NOT AVAILABLE');
}

// Test 5: Network and API checks
async function testNetworkAndAPI() {
  console.log('\n=== TEST 5: Network and API Status ===');
  
  // Check network connectivity
  console.log('🔧 Navigator online:', navigator.onLine ? 'YES' : 'NO');
  
  // Check for any pending network requests
  const performanceEntries = performance.getEntriesByType('navigation');
  if (performanceEntries.length > 0) {
    const navigation = performanceEntries[0];
    console.log('🔧 Page load time:', Math.round(navigation.loadEventEnd - navigation.fetchStart), 'ms');
  }
  
  // Check for fetch or XHR errors in console
  const errors = window.consoleErrors || [];
  const networkErrors = errors.filter(error => 
    error.toLowerCase().includes('fetch') || 
    error.toLowerCase().includes('network') ||
    error.toLowerCase().includes('cors')
  );
  console.log('🔧 Network-related errors:', networkErrors.length);
  
  if (networkErrors.length > 0) {
    console.log('🔧 Network errors:', networkErrors.slice(0, 3));
  }
}

// Main diagnostic function
async function runAircraftDiagnostics() {
  console.log('🚀 Starting Aircraft Loading Diagnostics...');
  console.log('🌍 Environment:', window.location.hostname);
  console.log('🕐 Timestamp:', new Date().toISOString());
  
  testManagerAvailability();
  testOSDKClient();
  await testAircraftDataLoading();
  testReactComponentState();
  await testNetworkAndAPI();
  
  console.log('\n=== DIAGNOSTICS COMPLETE ===');
  console.log('📋 Copy this output and compare between local and online environments');
}

// Auto-run diagnostics after a short delay to allow page to load
setTimeout(runAircraftDiagnostics, 2000);

// Also expose function for manual execution
window.runAircraftDiagnostics = runAircraftDiagnostics;

console.log('🔍 Aircraft diagnostics loaded. Auto-running in 2 seconds...');
console.log('🔍 Manual execution: window.runAircraftDiagnostics()');