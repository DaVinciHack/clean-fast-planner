// Check for React state conflicts
console.log('Checking for React state conflicts...');

// Check the aircraftLoaded global
console.log('window.aircraftLoaded:', window.aircraftLoaded);
console.log('window.regionState:', window.regionState);

// Check if there are multiple aircraft state sources
const aircraftManager = window.appManagers?.aircraftManagerRef?.current;

if (aircraftManager) {
  console.log('Aircraft Manager State:');
  console.log('- aircraftList:', aircraftManager.aircraftList?.length);
  console.log('- filteredAircraft:', aircraftManager.filteredAircraft?.length);
  console.log('- allAircraftLoaded:', aircraftManager.allAircraftLoaded);
  
  // Check if there's a region mismatch
  console.log('- aircraftByRegion keys:', Object.keys(aircraftManager.aircraftByRegion || {}));
  console.log('- typesByRegion keys:', Object.keys(aircraftManager.typesByRegion || {}));
  
  // Try to force a region-specific filter
  console.log('Testing Gulf of Mexico filtering...');
  
  if (aircraftManager.aircraftByRegion && aircraftManager.aircraftByRegion['GULF OF MEXICO']) {
    const gulfAircraft = aircraftManager.aircraftByRegion['GULF OF MEXICO'];
    console.log('Gulf aircraft count:', gulfAircraft.length);
    
    // Try triggering callback with Gulf aircraft specifically
    console.log('Triggering callback with Gulf aircraft...');
    aircraftManager.triggerCallback('onAircraftFiltered', gulfAircraft, null);
    
    setTimeout(() => {
      const dropdown = document.querySelector('.aircraft-type-dropdown');
      console.log('Dropdown after Gulf filter:', {
        optionCount: dropdown?.options?.length || 0,
        options: Array.from(dropdown?.options || []).map(opt => opt.text)
      });
    }, 500);
  }
}

// Check if there's a timing issue with React hooks
// Maybe the component isn't fully mounted when callbacks fire
console.log('Checking component mount status...');

// Look for any React error boundaries or mounting issues
const errorElements = document.querySelectorAll('[data-error], .error, .react-error');
console.log('Error elements found:', errorElements.length);

// Check if MainCard component is actually rendered
const mainCardElements = document.querySelectorAll('[class*="main"], [class*="card"], .main-card');
console.log('MainCard-like elements:', mainCardElements.length);
mainCardElements.forEach((el, i) => {
  console.log(`Element ${i + 1}:`, {
    className: el.className,
    hasSelects: el.querySelectorAll('select').length,
    id: el.id
  });
});

// Try to find the actual component that should have aircraft dropdowns
const selectContainers = [];
document.querySelectorAll('select').forEach(select => {
  const container = select.closest('[class*="card"], [class*="main"], [class*="aircraft"]');
  if (container && !selectContainers.includes(container)) {
    selectContainers.push(container);
  }
});

console.log('Select containers found:', selectContainers.length);
selectContainers.forEach((container, i) => {
  const selects = container.querySelectorAll('select');
  console.log(`Container ${i + 1}:`, {
    className: container.className,
    selectCount: selects.length,
    selectDetails: Array.from(selects).map(s => ({
      className: s.className,
      options: s.options.length
    }))
  });
});