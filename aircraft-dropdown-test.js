// AIRCRAFT DROPDOWN COMPREHENSIVE TEST
// Copy and paste this entire script into browser console

console.log('%c=== AIRCRAFT DROPDOWN COMPREHENSIVE TEST ===', 'background: red; color: white; font-size: 16px; padding: 5px;');

// TEST 1: Check current state
console.log('\n1. CURRENT STATE:');
const typeDropdown = document.getElementById('aircraft-type');
const regDropdown = document.getElementById('aircraft-registration');

console.log('Type dropdown options:', typeDropdown ? typeDropdown.options.length : 'NOT FOUND');
console.log('Registration dropdown options:', regDropdown ? regDropdown.options.length : 'NOT FOUND');

if (typeDropdown) {
  console.log('Type options:', Array.from(typeDropdown.options).map(o => `"${o.value}":"${o.text}"`));
}

// TEST 2: Check aircraft manager data
console.log('\n2. AIRCRAFT MANAGER DATA:');
const manager = window.appManagers?.aircraftManagerRef?.current;
if (manager) {
  console.log('✅ Manager exists');
  console.log('Total aircraft:', manager.aircraftList?.length || 0);
  console.log('Filtered aircraft:', manager.filteredAircraft?.length || 0);
  
  if (manager.filteredAircraft?.length > 0) {
    // Organize into types like the callback should
    const types = {};
    manager.filteredAircraft.forEach(aircraft => {
      const type = aircraft.modelType || 'Unknown';
      if (!types[type]) types[type] = 0;
      types[type]++;
    });
    console.log('Available types:', types);
  }
} else {
  console.log('❌ Manager NOT found');
}

// TEST 3: Check callback
console.log('\n3. CALLBACK TEST:');
if (manager && manager.callbacks?.onAircraftFiltered) {
  console.log('✅ Callback exists');
  
  // Show actual callback code
  const callbackCode = manager.callbacks.onAircraftFiltered.toString();
  console.log('Callback code:', callbackCode);
  
  // Test if callback has React state setters
  const hasSetTypes = callbackCode.includes('setAircraftTypes');
  const hasSetByType = callbackCode.includes('setAircraftsByType');
  console.log('Has setAircraftTypes:', hasSetTypes ? '✅' : '❌');
  console.log('Has setAircraftsByType:', hasSetByType ? '✅' : '❌');
  
} else {
  console.log('❌ Callback NOT found');
}

// TEST 4: Manual callback test
console.log('\n4. MANUAL CALLBACK TEST:');
if (manager && manager.filteredAircraft?.length > 0) {
  console.log('Triggering callback manually...');
  
  // Save current state
  const beforeTypeOptions = typeDropdown ? typeDropdown.options.length : 0;
  const beforeRegOptions = regDropdown ? regDropdown.options.length : 0;
  
  // Trigger callback
  manager.callbacks.onAircraftFiltered(manager.filteredAircraft, null);
  
  // Check after 1 second
  setTimeout(() => {
    const afterTypeOptions = typeDropdown ? typeDropdown.options.length : 0;
    const afterRegOptions = regDropdown ? regDropdown.options.length : 0;
    
    console.log('BEFORE callback - Type options:', beforeTypeOptions, 'Reg options:', beforeRegOptions);
    console.log('AFTER callback - Type options:', afterTypeOptions, 'Reg options:', afterRegOptions);
    
    if (afterTypeOptions > beforeTypeOptions) {
      console.log('✅ CALLBACK WORKS! Dropdowns updated');
    } else {
      console.log('❌ CALLBACK BROKEN! No change in dropdowns');
    }
  }, 1000);
}

// TEST 5: React component state test
console.log('\n5. REACT COMPONENT STATE TEST:');

// Try to find the component that renders the dropdowns
const mainCardElements = document.querySelectorAll('[class*="main"], .aircraft-type-dropdown');
console.log('MainCard-like elements found:', mainCardElements.length);

// TEST 6: Direct DOM manipulation test
console.log('\n6. DIRECT DOM MANIPULATION TEST:');
if (typeDropdown) {
  console.log('Testing direct DOM manipulation...');
  
  // Save original options
  const originalOptions = Array.from(typeDropdown.options);
  
  // Add a test option
  const testOption = document.createElement('option');
  testOption.value = 'TEST';
  testOption.text = 'TEST TYPE';
  typeDropdown.appendChild(testOption);
  
  setTimeout(() => {
    if (typeDropdown.options.length > originalOptions.length) {
      console.log('✅ DOM manipulation works - can add options');
      // Remove test option
      typeDropdown.removeChild(testOption);
    } else {
      console.log('❌ DOM manipulation blocked - React might be overriding');
    }
  }, 500);
}

// TEST 7: Authentication and data loading test
console.log('\n7. AUTHENTICATION & DATA TEST:');
console.log('Authenticated:', window.isFoundryAuthenticated ? '✅' : '❌');
console.log('OSDK client:', window.client ? '✅' : '❌');
console.log('Aircraft manager loaded:', manager && manager.allAircraftLoaded ? '✅' : '❌');

// TEST 8: useAircraft hook test
console.log('\n8. USEAIRCRAFT HOOK TEST:');
// Look for any global debugging data we might have set
if (window.debugUseAircraftReturn) {
  console.log('✅ useAircraft debug data found:', window.debugUseAircraftReturn);
} else {
  console.log('❌ No useAircraft debug data found');
}

console.log('\n=== TEST COMPLETE ===');
console.log('Key things to check:');
console.log('1. Does callback have React state setters?');
console.log('2. Does manual callback trigger change dropdowns?');
console.log('3. Does DOM manipulation work or get overridden?');
console.log('4. Is authentication and data loading working?');