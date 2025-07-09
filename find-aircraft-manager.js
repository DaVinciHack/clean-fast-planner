/**
 * Find Aircraft Manager Script
 * Searches for aircraft manager in all possible locations
 */

console.log('🔍 SEARCHING FOR AIRCRAFT MANAGER...');
console.log('🌍 Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE');

function findAircraftManager() {
  const results = [];
  
  // Search all window properties
  console.log('\n=== SEARCHING WINDOW PROPERTIES ===');
  Object.keys(window).forEach(key => {
    const value = window[key];
    
    // Check if it's an object with aircraftManager
    if (value && typeof value === 'object' && value.aircraftManager) {
      results.push({
        location: `window.${key}.aircraftManager`,
        found: true,
        type: typeof value.aircraftManager,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(value.aircraftManager || {})).slice(0, 5)
      });
      console.log(`✅ Found at window.${key}.aircraftManager`);
    }
    
    // Check if it's the aircraft manager itself
    if (value && typeof value === 'object' && value.loadAllAircraft) {
      results.push({
        location: `window.${key}`,
        found: true,
        type: 'aircraftManager',
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(value)).slice(0, 5)
      });
      console.log(`✅ Found aircraftManager at window.${key}`);
    }
  });
  
  // Check common manager locations
  console.log('\n=== CHECKING COMMON LOCATIONS ===');
  const commonLocations = [
    'window.appManagers',
    'window.managers', 
    'window.fastPlannerManagers',
    'window.fastPlannerApp',
    'window.app'
  ];
  
  commonLocations.forEach(location => {
    try {
      const parts = location.split('.');
      let obj = window;
      for (let i = 1; i < parts.length; i++) {
        obj = obj[parts[i]];
        if (!obj) break;
      }
      
      if (obj) {
        console.log(`📍 ${location}:`, typeof obj);
        if (obj.aircraftManager) {
          console.log(`  ✅ Has aircraftManager:`, typeof obj.aircraftManager);
          results.push({
            location: `${location}.aircraftManager`,
            found: true,
            type: typeof obj.aircraftManager
          });
        }
        
        // List properties
        const props = Object.keys(obj).filter(k => k.toLowerCase().includes('aircraft') || k.toLowerCase().includes('manager'));
        if (props.length > 0) {
          console.log(`  📝 Relevant properties:`, props);
        }
      } else {
        console.log(`❌ ${location}: not found`);
      }
    } catch (error) {
      console.log(`❌ ${location}: error -`, error.message);
    }
  });
  
  // Check React component tree (if dev tools available)
  console.log('\n=== CHECKING REACT COMPONENTS ===');
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('⚛️ React dev tools available - checking components...');
    
    // Try to find React fiber nodes with aircraft data
    const rootElement = document.querySelector('#root');
    if (rootElement && rootElement._reactInternalFiber) {
      console.log('⚛️ React fiber found - searching...');
      // This would need more complex traversal in production
    } else {
      console.log('⚛️ React fiber not accessible (production build)');
    }
  }
  
  // Search DOM for any aircraft-related data attributes
  console.log('\n=== CHECKING DOM DATA ===');
  const elementsWithData = document.querySelectorAll('[data-aircraft], [data-manager], [data-testid*="aircraft"]');
  console.log('📄 Elements with aircraft data:', elementsWithData.length);
  
  // Check for any global variables that might have aircraft data
  console.log('\n=== CHECKING GLOBAL AIRCRAFT DATA ===');
  Object.keys(window).forEach(key => {
    const value = window[key];
    if (value && typeof value === 'object') {
      // Check if it has aircraft-like data
      if (value.aircraftList || value.filteredAircraft || (Array.isArray(value) && value.length > 0 && value[0]?.modelType)) {
        console.log(`✈️ Found aircraft data at window.${key}:`, {
          type: typeof value,
          aircraftList: value.aircraftList?.length || 0,
          filteredAircraft: value.filteredAircraft?.length || 0,
          isArray: Array.isArray(value),
          arrayLength: Array.isArray(value) ? value.length : 0
        });
        results.push({
          location: `window.${key}`,
          found: true,
          type: 'aircraftData',
          details: value
        });
      }
    }
  });
  
  // Try calling useManagers hook manually (if available)
  console.log('\n=== TRYING TO ACCESS MANAGERS ===');
  if (window.useManagers) {
    try {
      console.log('🪝 useManagers hook found - attempting to call...');
      const managers = window.useManagers();
      console.log('🪝 useManagers result:', typeof managers);
      if (managers && managers.aircraftManager) {
        console.log('✅ Found aircraftManager via useManagers hook');
        results.push({
          location: 'useManagers().aircraftManager',
          found: true,
          type: typeof managers.aircraftManager
        });
      }
    } catch (error) {
      console.log('❌ useManagers call failed:', error.message);
    }
  }
  
  console.log('\n=== SEARCH RESULTS ===');
  if (results.length === 0) {
    console.log('❌ No aircraft manager found anywhere!');
  } else {
    console.log('✅ Found aircraft manager/data at:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.location} (${result.type})`);
    });
  }
  
  // Save results globally for comparison
  window.aircraftManagerSearchResults = results;
  
  return results;
}

// Run the search
const results = findAircraftManager();

console.log('\n🔍 Search complete. Results saved to window.aircraftManagerSearchResults');
console.log('📋 Compare local vs online results to find the difference');