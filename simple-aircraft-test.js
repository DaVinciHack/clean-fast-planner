// Simple aircraft test - identify the exact difference
console.log('=== SIMPLE AIRCRAFT TEST ===');
console.log('Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'PRODUCTION');

// Test aircraft manager
const am = window.appManagers?.aircraftManagerRef?.current;
console.log('Aircraft Manager Available:', !!am);

if (am) {
  console.log('Aircraft List Length:', am.aircraftList?.length || 0);
  console.log('Filtered Aircraft Length:', am.filteredAircraft?.length || 0);
  console.log('All Aircraft Loaded:', am.allAircraftLoaded);
  
  // Test the callback
  const originalCallback = am.callbacks.onAircraftFiltered;
  console.log('Original Callback Type:', typeof originalCallback);
  console.log('Original Callback String:', originalCallback.toString().substring(0, 200));
  
  // Test if callback actually updates DOM
  let domUpdateCount = 0;
  const observer = new MutationObserver(() => {
    domUpdateCount++;
  });
  
  const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
  if (typeDropdown) {
    observer.observe(typeDropdown, { childList: true });
  }
  
  // Trigger callback
  am.triggerCallback('onAircraftFiltered', am.filteredAircraft, null);
  
  // Check after 500ms
  setTimeout(() => {
    console.log('DOM Updates After Callback:', domUpdateCount);
    console.log('Type Dropdown Options:', typeDropdown?.options?.length || 0);
    observer.disconnect();
  }, 500);
}

// Test if this is development vs production
console.log('Development Mode:', typeof window.__vite_plugin_react_preamble_installed__ !== 'undefined');
console.log('React Dev Tools:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined');

// Test bundle file name
const script = document.querySelector('script[src*="index-"]');
console.log('Bundle File:', script?.src || 'NOT_FOUND');