// Check useAircraft hook state directly
console.log('Checking useAircraft state...');

// Try to access React internal state
function checkReactState() {
  
  // Look for React fiber on the root element
  const root = document.querySelector('#root');
  let reactFiber = null;
  
  // Try different React internal properties
  if (root._reactInternalFiber) {
    reactFiber = root._reactInternalFiber;
  } else if (root._reactInternalInstance) {
    reactFiber = root._reactInternalInstance;
  } else if (root.__reactInternalInstance) {
    reactFiber = root.__reactInternalInstance;
  }
  
  console.log('React fiber found:', !!reactFiber);
  
  // Since we can't easily access React state, let's try a different approach
  // Override the setState calls in the aircraft manager callback
  
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  if (!aircraftManager) {
    console.log('No aircraft manager');
    return;
  }
  
  // Get the original callback
  const originalCallback = aircraftManager.callbacks.onAircraftFiltered;
  
  // Create a wrapper that logs state changes
  aircraftManager.callbacks.onAircraftFiltered = function(filteredAircraft, type) {
    console.log('CALLBACK START:', {
      aircraftCount: filteredAircraft.length,
      type: type
    });
    
    // Process the data like useAircraft should
    if (!type) {
      const byType = {};
      const availableTypes = [];
      
      filteredAircraft.forEach(aircraft => {
        const modelType = aircraft.modelType || 'Unknown';
        if (!byType[modelType]) {
          byType[modelType] = [];
          availableTypes.push(modelType);
        }
        byType[modelType].push(aircraft);
      });
      
      console.log('PROCESSED DATA:', {
        types: availableTypes.sort(),
        typeCount: availableTypes.length,
        sampleByType: Object.keys(byType).slice(0, 3).map(type => 
          `${type}: ${byType[type].length} aircraft`
        )
      });
    }
    
    // Call original and monitor what happens
    console.log('Calling original callback...');
    const result = originalCallback(filteredAircraft, type);
    console.log('Original callback returned:', typeof result);
    
    // Check if any DOM changes occurred
    setTimeout(() => {
      console.log('Checking DOM after callback...');
      
      const typeDropdown = document.querySelector('.aircraft-type-dropdown');
      if (typeDropdown) {
        console.log('Type dropdown after callback:', {
          optionCount: typeDropdown.options.length,
          options: Array.from(typeDropdown.options).map(opt => opt.text)
        });
      }
      
      // Look for any React state in window
      const reactKeys = Object.keys(window).filter(key => 
        key.toLowerCase().includes('react') || 
        key.toLowerCase().includes('aircraft') ||
        key.toLowerCase().includes('state')
      );
      console.log('Potential React state keys:', reactKeys);
      
    }, 100);
  };
  
  // Trigger the test
  console.log('Triggering test callback...');
  aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
  
  // Restore after test
  setTimeout(() => {
    aircraftManager.callbacks.onAircraftFiltered = originalCallback;
    console.log('Original callback restored');
  }, 2000);
}

checkReactState();