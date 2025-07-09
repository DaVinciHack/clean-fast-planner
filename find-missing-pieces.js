// FIND MISSING PIECES - AIRCRAFT DROPDOWN DIAGNOSIS
// Paste this in browser console to identify what's broken

console.log('%c=== FINDING MISSING PIECES ===', 'background: blue; color: white; font-size: 14px; padding: 3px;');

// CHECK 1: Is React mounted?
const reactMounted = document.getElementById('root')?.children?.length > 0;
console.log('React mounted:', reactMounted ? '✅ YES' : '❌ NO');

// CHECK 2: Are dropdowns rendered?
const typeDropdown = document.getElementById('aircraft-type');
const regDropdown = document.getElementById('aircraft-registration');
console.log('Type dropdown exists:', typeDropdown ? '✅ YES' : '❌ NO');
console.log('Registration dropdown exists:', regDropdown ? '✅ YES' : '❌ NO');

// CHECK 3: Do dropdowns have data?
if (typeDropdown) {
  console.log('Type dropdown options:', typeDropdown.options.length);
  console.log('Type dropdown first option:', typeDropdown.options[0]?.text || 'none');
}

if (regDropdown) {
  console.log('Registration dropdown options:', regDropdown.options.length);
  console.log('Registration dropdown first option:', regDropdown.options[0]?.text || 'none');
}

// CHECK 4: Aircraft manager state
const manager = window.appManagers?.aircraftManagerRef?.current;
console.log('Aircraft manager exists:', manager ? '✅ YES' : '❌ NO');
if (manager) {
  console.log('Aircraft list length:', manager.aircraftList?.length || 0);
  console.log('Filtered aircraft length:', manager.filteredAircraft?.length || 0);
}

// CHECK 5: Authentication
console.log('Authenticated:', window.isFoundryAuthenticated ? '✅ YES' : '❌ NO');

// CHECK 6: OSDK Client
console.log('OSDK client exists:', window.client ? '✅ YES' : '❌ NO');

// SUMMARY: What's missing?
console.log('\n%c=== MISSING PIECES SUMMARY ===', 'background: red; color: white; font-weight: bold;');

if (!reactMounted) {
  console.log('❌ MISSING: React app not mounted');
}
if (!typeDropdown) {
  console.log('❌ MISSING: Aircraft type dropdown not rendered');
}
if (!regDropdown) {
  console.log('❌ MISSING: Aircraft registration dropdown not rendered');
}
if (typeDropdown && typeDropdown.options.length <= 1) {
  console.log('❌ MISSING: Aircraft types data not loaded');
}
if (!manager) {
  console.log('❌ MISSING: Aircraft manager not initialized');
}
if (manager && (!manager.aircraftList || manager.aircraftList.length === 0)) {
  console.log('❌ MISSING: Aircraft data not loaded from OSDK');
}
if (!window.isFoundryAuthenticated) {
  console.log('❌ MISSING: Foundry authentication');
}
if (!window.client) {
  console.log('❌ MISSING: OSDK client');
}