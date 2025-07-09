// COMPREHENSIVE LOCAL VS ONLINE COMPARISON SCRIPT
// Copy and paste this entire script into browser console on BOTH local and online

console.log('🔬 STARTING COMPREHENSIVE LOCAL VS ONLINE COMPARISON');
console.log('==========================================');

const results = {
  environment: window.location.origin.includes('localhost') ? 'LOCAL' : 'ONLINE',
  timestamp: new Date().toISOString(),
  aircraftManager: {},
  reactHooks: {},
  dropdowns: {},
  callbacks: {},
  globalState: {},
  errorLog: []
};

// Test 1: Aircraft Manager State
console.log('\n=== TEST 1: AIRCRAFT MANAGER STATE ===');
try {
  if (window.aircraftManager) {
    results.aircraftManager = {
      exists: true,
      hasFilteredAircraft: !!window.aircraftManager.filteredAircraft,
      aircraftCount: window.aircraftManager.filteredAircraft?.length || 0,
      aircraftSample: window.aircraftManager.filteredAircraft?.slice(0, 2) || [],
      hasCallbacks: !!window.aircraftManager.callbacks,
      callbackNames: window.aircraftManager.callbacks ? Object.keys(window.aircraftManager.callbacks) : [],
      callbackDetails: {}
    };
    
    // Check each callback
    if (window.aircraftManager.callbacks) {
      Object.keys(window.aircraftManager.callbacks).forEach(name => {
        const callback = window.aircraftManager.callbacks[name];
        results.aircraftManager.callbackDetails[name] = {
          type: typeof callback,
          length: callback.length,
          preview: callback.toString().substring(0, 200)
        };
      });
    }
    
    console.log('✅ Aircraft Manager:', results.aircraftManager);
  } else {
    results.aircraftManager = { exists: false };
    console.log('❌ No aircraft manager found');
  }
} catch (e) {
  results.errorLog.push(`Aircraft Manager test: ${e.message}`);
  console.error('❌ Aircraft Manager test failed:', e);
}

// Test 2: React Hook State
console.log('\n=== TEST 2: REACT HOOK STATE ===');
try {
  results.reactHooks = {
    debugUseAircraftReturn: !!window.debugUseAircraftReturn,
    debugData: window.debugUseAircraftReturn || null,
    globalFunctions: {
      changeAircraftType: typeof window.changeAircraftType,
      changeAircraftRegistration: typeof window.changeAircraftRegistration,
      setAircraftType: typeof window.setAircraftType,
      setAircraftsByType: typeof window.setAircraftsByType
    }
  };
  
  console.log('✅ React Hooks:', results.reactHooks);
} catch (e) {
  results.errorLog.push(`React Hooks test: ${e.message}`);
  console.error('❌ React Hooks test failed:', e);
}

// Test 3: Dropdown State and Behavior
console.log('\n=== TEST 3: DROPDOWN STATE ===');
try {
  const typeDropdown = document.getElementById('aircraft-type');
  const regDropdown = document.getElementById('aircraft-registration');
  
  results.dropdowns = {
    typeDropdown: {
      exists: !!typeDropdown,
      optionsCount: typeDropdown?.options?.length || 0,
      options: typeDropdown ? Array.from(typeDropdown.options).map(opt => ({value: opt.value, text: opt.textContent})) : [],
      currentValue: typeDropdown?.value || null,
      hasChangeListener: typeDropdown ? typeDropdown.onchange !== null : false
    },
    regDropdown: {
      exists: !!regDropdown,
      optionsCount: regDropdown?.options?.length || 0,
      options: regDropdown ? Array.from(regDropdown.options).map(opt => ({value: opt.value, text: opt.textContent})) : [],
      currentValue: regDropdown?.value || null,
      hasChangeListener: regDropdown ? regDropdown.onchange !== null : false
    }
  };
  
  console.log('✅ Dropdowns:', results.dropdowns);
} catch (e) {
  results.errorLog.push(`Dropdowns test: ${e.message}`);
  console.error('❌ Dropdowns test failed:', e);
}

// Test 4: Global State and Variables
console.log('\n=== TEST 4: GLOBAL STATE ===');
try {
  results.globalState = {
    currentSelectedAircraft: !!window.currentSelectedAircraft,
    aircraftByType: !!window.aircraftByType,
    availableTypes: !!window.availableTypes,
    aircraftSelectionFixed: !!window.aircraftSelectionFixed,
    aircraftByTypeKeys: window.aircraftByType ? Object.keys(window.aircraftByType) : [],
    availableTypesArray: window.availableTypes || []
  };
  
  console.log('✅ Global State:', results.globalState);
} catch (e) {
  results.errorLog.push(`Global State test: ${e.message}`);
  console.error('❌ Global State test failed:', e);
}

// Test 5: React Component State (if accessible)
console.log('\n=== TEST 5: REACT COMPONENT INSPECTION ===');
try {
  // Try to find React components
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-*]');
  results.reactComponents = {
    reactElementsFound: reactElements.length,
    hasReactDevTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
  };
  
  console.log('✅ React Components:', results.reactComponents);
} catch (e) {
  results.errorLog.push(`React Components test: ${e.message}`);
  console.error('❌ React Components test failed:', e);
}

// Test 6: Simulate Aircraft Selection and Watch for Changes
console.log('\n=== TEST 6: AIRCRAFT SELECTION SIMULATION ===');
try {
  // Store initial state
  const initialState = {
    typeValue: document.getElementById('aircraft-type')?.value,
    regValue: document.getElementById('aircraft-registration')?.value,
    selectedAircraft: window.currentSelectedAircraft
  };
  
  console.log('Initial state before selection:', initialState);
  
  // Try to simulate a type selection if possible
  if (window.aircraftByType && Object.keys(window.aircraftByType).length > 0) {
    const firstType = Object.keys(window.aircraftByType)[0];
    const typeDropdown = document.getElementById('aircraft-type');
    
    if (typeDropdown) {
      console.log(`🧪 SIMULATING TYPE SELECTION: ${firstType}`);
      
      // Set the value and trigger change
      typeDropdown.value = firstType;
      typeDropdown.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Check what changed
      setTimeout(() => {
        const afterTypeState = {
          typeValue: document.getElementById('aircraft-type')?.value,
          regValue: document.getElementById('aircraft-registration')?.value,
          regOptionsCount: document.getElementById('aircraft-registration')?.options?.length || 0,
          selectedAircraft: window.currentSelectedAircraft
        };
        
        console.log('State after type selection:', afterTypeState);
        
        results.aircraftSelection = {
          initialState,
          afterTypeState,
          typeSelectionWorked: afterTypeState.regOptionsCount > initialState.regOptionsCount || 1
        };
      }, 500);
    }
  }
} catch (e) {
  results.errorLog.push(`Aircraft Selection test: ${e.message}`);
  console.error('❌ Aircraft Selection test failed:', e);
}

// Test 7: Check Console History for Clues
console.log('\n=== TEST 7: RECENT CONSOLE ACTIVITY ===');
try {
  // Look for our fix scripts
  results.consoleActivity = {
    hasAircraftCallbackLogs: false, // We'll check manually
    hasReactErrors: false // We'll check manually
  };
  
  console.log('✅ Check console history manually for:');
  console.log('   - "🔧" aircraft callback logs');
  console.log('   - React errors or warnings');
  console.log('   - "useAircraft" related logs');
} catch (e) {
  results.errorLog.push(`Console Activity test: ${e.message}`);
  console.error('❌ Console Activity test failed:', e);
}

// Final Results Summary
console.log('\n==========================================');
console.log('🔬 COMPARISON RESULTS SUMMARY');
console.log('==========================================');
console.log(`Environment: ${results.environment}`);
console.log('Full Results Object:', results);

// Create comparison data for easy copy-paste
const comparisonData = {
  environment: results.environment,
  aircraftManager: {
    exists: results.aircraftManager.exists,
    aircraftCount: results.aircraftManager.aircraftCount,
    callbackNames: results.aircraftManager.callbackNames
  },
  dropdowns: {
    typeOptionsCount: results.dropdowns.typeDropdown?.optionsCount,
    regOptionsCount: results.dropdowns.regDropdown?.optionsCount,
    typeHasOptions: results.dropdowns.typeDropdown?.optionsCount > 1,
    regHasOptions: results.dropdowns.regDropdown?.optionsCount > 1
  },
  reactHooks: {
    hasDebugData: results.reactHooks.debugUseAircraftReturn,
    aircraftTypesCount: results.reactHooks.debugData?.aircraftTypesLength || 0
  },
  globalState: {
    hasAircraftByType: results.globalState.aircraftByType,
    typesCount: results.globalState.aircraftByTypeKeys?.length || 0,
    fixApplied: results.globalState.aircraftSelectionFixed
  }
};

console.log('\n📋 COPY THIS FOR COMPARISON:');
console.log(JSON.stringify(comparisonData, null, 2));

// Store globally for manual access
window.comparisonResults = results;
window.comparisonData = comparisonData;

console.log('\n✅ Comparison complete! Run this same script on the other environment and compare results.');
console.log('💾 Results stored in: window.comparisonResults and window.comparisonData');