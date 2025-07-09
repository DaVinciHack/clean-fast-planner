// AIRCRAFT DROPDOWN DIAGNOSTIC SCRIPT
// Copy and paste this entire script into the browser console

console.log('%c=== AIRCRAFT DROPDOWN DIAGNOSTIC ===', 'background: red; color: white; font-size: 16px; padding: 5px;');

// 1. CHECK IF REACT APP LOADED
console.log('\n1. CHECKING REACT APP STATUS:');
const rootElement = document.getElementById('root');
if (rootElement && rootElement.children.length > 0) {
  console.log('✅ React app appears to be mounted');
  console.log('   Root element has', rootElement.children.length, 'child elements');
} else {
  console.log('❌ React app NOT mounted - root element empty');
  console.log('   This explains why dropdowns are missing');
}

// 2. CHECK FOR JAVASCRIPT ERRORS
console.log('\n2. CHECKING FOR ERRORS:');
console.log('   (Look above for any red error messages)');

// 3. FIND DROPDOWN ELEMENTS
console.log('\n3. LOOKING FOR DROPDOWN ELEMENTS:');
const typeDropdown = document.getElementById('aircraft-type');
const regDropdown = document.getElementById('aircraft-registration');

if (typeDropdown) {
  console.log('✅ Aircraft Type dropdown found');
  console.log('   Options count:', typeDropdown.options.length);
  console.log('   Current value:', typeDropdown.value);
  
  if (typeDropdown.options.length > 1) {
    console.log('   Available options:');
    Array.from(typeDropdown.options).forEach((opt, i) => {
      console.log(`     ${i}: "${opt.value}" = "${opt.text}"`);
    });
  } else {
    console.log('   ❌ Only has placeholder option - NO AIRCRAFT TYPES LOADED');
  }
} else {
  console.log('❌ Aircraft Type dropdown NOT found');
}

if (regDropdown) {
  console.log('✅ Aircraft Registration dropdown found');
  console.log('   Options count:', regDropdown.options.length);
  console.log('   Current value:', regDropdown.value);
  console.log('   Disabled:', regDropdown.disabled);
  
  if (regDropdown.options.length > 1) {
    console.log('   Available options:');
    Array.from(regDropdown.options).slice(0, 10).forEach((opt, i) => {
      console.log(`     ${i}: "${opt.value}" = "${opt.text}"`);
    });
    if (regDropdown.options.length > 10) {
      console.log(`     ... and ${regDropdown.options.length - 10} more`);
    }
  } else {
    console.log('   ❌ Only has placeholder option - NO AIRCRAFT REGISTRATIONS LOADED');
  }
} else {
  console.log('❌ Aircraft Registration dropdown NOT found');
}

// 4. CHECK AIRCRAFT MANAGER
console.log('\n4. CHECKING AIRCRAFT MANAGER:');
if (window.appManagers) {
  console.log('✅ window.appManagers exists');
  
  if (window.appManagers.aircraftManagerRef && window.appManagers.aircraftManagerRef.current) {
    const manager = window.appManagers.aircraftManagerRef.current;
    console.log('✅ Aircraft manager found');
    console.log('   Aircraft list length:', manager.aircraftList ? manager.aircraftList.length : 'undefined');
    console.log('   Filtered aircraft length:', manager.filteredAircraft ? manager.filteredAircraft.length : 'undefined');
    console.log('   All aircraft loaded:', manager.allAircraftLoaded);
    
    if (manager.filteredAircraft && manager.filteredAircraft.length > 0) {
      console.log('   Sample aircraft:', manager.filteredAircraft[0]);
    }
  } else {
    console.log('❌ Aircraft manager NOT found in appManagers');
  }
} else {
  console.log('❌ window.appManagers does not exist');
}

// 5. CHECK AUTHENTICATION
console.log('\n5. CHECKING AUTHENTICATION:');
if (window.isFoundryAuthenticated) {
  console.log('✅ Authenticated to Foundry');
  console.log('   User:', window.foundryUserName || 'Unknown');
} else {
  console.log('❌ NOT authenticated to Foundry');
  console.log('   This could prevent aircraft data from loading');
}

// 6. CHECK CLIENT
console.log('\n6. CHECKING OSDK CLIENT:');
if (window.client) {
  console.log('✅ OSDK client exists');
} else {
  console.log('❌ OSDK client missing');
}

// 7. LOOK FOR MAINCARD COMPONENT
console.log('\n7. LOOKING FOR MAINCARD COMPONENT:');
const mainCardElements = document.querySelectorAll('[class*="main"], .main-card, .aircraft-type-dropdown');
if (mainCardElements.length > 0) {
  console.log('✅ Found', mainCardElements.length, 'potential MainCard elements');
  mainCardElements.forEach((el, i) => {
    console.log(`   ${i}: ${el.className || el.tagName}`);
  });
} else {
  console.log('❌ No MainCard elements found');
}

// 8. CHECK FOR LOADING STATES
console.log('\n8. CHECKING LOADING STATES:');
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
if (loadingElements.length > 0) {
  console.log('⚠️ Found loading elements - app might still be loading');
  loadingElements.forEach((el, i) => {
    console.log(`   ${i}: ${el.className} - visible: ${getComputedStyle(el).display !== 'none'}`);
  });
} else {
  console.log('✅ No loading elements found');
}

// 9. MANUAL DROPDOWN TEST
console.log('\n9. MANUAL DROPDOWN TEST:');
if (typeDropdown && regDropdown) {
  console.log('Setting up dropdown change listener...');
  
  typeDropdown.addEventListener('change', function(e) {
    console.log('🎯 TYPE DROPDOWN CHANGED TO:', e.target.value);
    setTimeout(() => {
      console.log('🎯 REG DROPDOWN NOW HAS:', regDropdown.options.length, 'options');
      if (regDropdown.options.length > 1) {
        console.log('🎯 REG OPTIONS:', Array.from(regDropdown.options).slice(0, 5).map(o => o.text));
      }
    }, 500);
  });
  
  console.log('✅ Change listener added - now try selecting an aircraft type');
} else {
  console.log('❌ Cannot set up test - dropdowns missing');
}

console.log('\n=== DIAGNOSTIC COMPLETE ===');
console.log('Now try selecting an aircraft type if dropdowns are present');