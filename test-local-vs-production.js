/**
 * Comprehensive test to compare local vs production builds
 * Run this in both environments to find the exact difference
 */

console.log('🔍 COMPREHENSIVE LOCAL VS PRODUCTION TEST');
console.log('Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'PRODUCTION');
console.log('Port:', window.location.port);
console.log('Time:', new Date().toLocaleTimeString());

function runComprehensiveTest() {
  const results = {
    environment: window.location.hostname === 'localhost' ? 'LOCAL' : 'PRODUCTION',
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Manager availability
  console.log('\n=== TEST 1: MANAGER AVAILABILITY ===');
  const managers = window.appManagers;
  results.tests.managers = {
    available: !!managers,
    aircraftManagerRef: !!managers?.aircraftManagerRef,
    aircraftManagerCurrent: !!managers?.aircraftManagerRef?.current
  };
  
  if (managers?.aircraftManagerRef?.current) {
    const am = managers.aircraftManagerRef.current;
    results.tests.aircraftManager = {
      aircraftListLength: am.aircraftList?.length || 0,
      filteredAircraftLength: am.filteredAircraft?.length || 0,
      allAircraftLoaded: am.allAircraftLoaded,
      hasCallbacks: !!am.callbacks,
      callbackKeys: Object.keys(am.callbacks || {})
    };
  }

  // Test 2: React Hook State
  console.log('\n=== TEST 2: REACT HOOK STATE ===');
  // Try to find the useAircraft hook state by looking for common patterns
  const aircraftHookState = {
    foundInWindow: false,
    foundInComponents: false
  };
  
  // Check for any window variables that might hold hook state
  Object.keys(window).forEach(key => {
    if (key.toLowerCase().includes('aircraft') || key.toLowerCase().includes('hook')) {
      aircraftHookState[key] = typeof window[key];
    }
  });
  
  results.tests.reactHookState = aircraftHookState;

  // Test 3: DOM Elements
  console.log('\n=== TEST 3: DOM ELEMENTS ===');
  const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
  const regDropdown = document.querySelector('#aircraft-registration, .aircraft-registration-dropdown');
  
  results.tests.domElements = {
    typeDropdown: {
      found: !!typeDropdown,
      optionCount: typeDropdown?.options?.length || 0,
      value: typeDropdown?.value || '',
      options: typeDropdown ? Array.from(typeDropdown.options).map(opt => opt.text) : []
    },
    regDropdown: {
      found: !!regDropdown,
      optionCount: regDropdown?.options?.length || 0,
      value: regDropdown?.value || '',
      options: regDropdown ? Array.from(regDropdown.options).map(opt => opt.text) : []
    }
  };

  // Test 4: Callback Execution
  console.log('\n=== TEST 4: CALLBACK EXECUTION ===');
  if (managers?.aircraftManagerRef?.current) {
    const am = managers.aircraftManagerRef.current;
    
    // Store original callback
    const originalCallback = am.callbacks.onAircraftFiltered;
    let callbackExecuted = false;
    let callbackParams = null;
    
    // Override callback to monitor execution
    am.callbacks.onAircraftFiltered = function(...args) {
      callbackExecuted = true;
      callbackParams = {
        aircraftCount: args[0]?.length || 0,
        type: args[1]
      };
      console.log('📞 Callback executed with:', callbackParams);
      
      // Call original
      if (originalCallback) {
        originalCallback.apply(this, args);
      }
    };
    
    // Trigger callback
    am.triggerCallback('onAircraftFiltered', am.filteredAircraft, null);
    
    results.tests.callbackExecution = {
      executed: callbackExecuted,
      params: callbackParams
    };
    
    // Restore original
    am.callbacks.onAircraftFiltered = originalCallback;
  }

  // Test 5: Bundle Analysis
  console.log('\n=== TEST 5: BUNDLE ANALYSIS ===');
  const scripts = Array.from(document.scripts);
  const mainScript = scripts.find(s => s.src && s.src.includes('index-'));
  
  results.tests.bundleAnalysis = {
    totalScripts: scripts.length,
    mainScriptSrc: mainScript?.src || 'NOT_FOUND',
    mainScriptSize: mainScript?.src ? 'UNKNOWN' : 'NOT_FOUND',
    hasSourceMap: !!document.querySelector('script[src*=".map"]'),
    reactDevTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
  };

  // Test 6: Build Differences
  console.log('\n=== TEST 6: BUILD DIFFERENCES ===');
  results.tests.buildDifferences = {
    isDevelopment: typeof window.__vite_plugin_react_preamble_installed__ !== 'undefined',
    hasHMR: typeof window.$RefreshReg$ !== 'undefined',
    nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'undefined',
    viteEnv: 'CHECK_MANUALLY'
  };

  // Test 7: Module Loading
  console.log('\n=== TEST 7: MODULE LOADING ===');
  const moduleErrors = [];
  
  // Check for any module loading errors
  if (window.moduleLoadingErrors) {
    moduleErrors.push(...window.moduleLoadingErrors);
  }
  
  results.tests.moduleLoading = {
    errors: moduleErrors,
    errorCount: moduleErrors.length
  };

  // Output complete results
  console.log('\n=== COMPLETE TEST RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  
  // Store globally for comparison
  window.comprehensiveTestResults = results;
  
  return results;
}

// Run the comprehensive test
const results = runComprehensiveTest();

console.log('\n🔍 Test complete. Results stored in window.comprehensiveTestResults');
console.log('📋 Compare these results between LOCAL and PRODUCTION environments');