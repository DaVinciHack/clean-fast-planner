// Auto Aircraft Fix - Runs automatically on page load and flight load
console.log('🔧 AUTO AIRCRAFT FIX STARTING...');

function autoFixAircraft() {
  console.log('🔧 Applying auto aircraft fix...');
  
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  
  if (!aircraftManager) {
    console.log('❌ No aircraft manager, retrying in 1 second...');
    setTimeout(autoFixAircraft, 1000);
    return;
  }
  
  if (!aircraftManager.filteredAircraft || aircraftManager.filteredAircraft.length === 0) {
    console.log('❌ No filtered aircraft, retrying in 1 second...');
    setTimeout(autoFixAircraft, 1000);
    return;
  }
  
  console.log('✅ Aircraft manager ready, applying fix...');
  
  // Override the callback permanently
  const originalCallback = aircraftManager.callbacks.onAircraftFiltered;
  
  aircraftManager.callbacks.onAircraftFiltered = function(filteredAircraft, type) {
    console.log(`🔧 AUTO FIX: ${filteredAircraft.length} aircraft, type: ${type || 'all'}`);
    
    // Call original first
    originalCallback(filteredAircraft, type);
    
    // Apply our fix
    if (!type && filteredAircraft.length > 0) {
      setTimeout(() => {
        applyDropdownFix(filteredAircraft);
      }, 100);
    }
  };
  
  // Apply the fix immediately
  applyDropdownFix(aircraftManager.filteredAircraft);
  
  console.log('✅ Auto aircraft fix applied');
}

function applyDropdownFix(filteredAircraft) {
  console.log('🔧 Applying dropdown fix to', filteredAircraft.length, 'aircraft');
  
  // Process aircraft by type
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
  
  // Fix type dropdown
  const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
  if (typeDropdown) {
    // Clear and populate
    while (typeDropdown.options.length > 1) {
      typeDropdown.remove(typeDropdown.options.length - 1);
    }
    
    availableTypes.sort().forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.text = type;
      typeDropdown.add(option);
    });
    
    console.log('✅ Type dropdown fixed:', typeDropdown.options.length, 'options');
    
    // Store data globally
    window.aircraftByTypeFixed = byType;
    
    // Set up type change handler
    typeDropdown.onchange = function() {
      const selectedType = this.value;
      console.log('🔧 Type changed to:', selectedType);
      
      const regDropdown = document.querySelector('#aircraft-registration, .aircraft-registration-dropdown');
      if (regDropdown && selectedType && selectedType !== 'select') {
        // Clear registration dropdown
        while (regDropdown.options.length > 1) {
          regDropdown.remove(regDropdown.options.length - 1);
        }
        
        // Add aircraft of selected type
        const aircraftOfType = window.aircraftByTypeFixed[selectedType] || [];
        aircraftOfType.forEach(aircraft => {
          const option = document.createElement('option');
          option.value = aircraft.registration || aircraft.tailNumber;
          option.text = `${aircraft.registration || aircraft.tailNumber} (${aircraft.region || 'Unknown'})`;
          regDropdown.add(option);
        });
        
        console.log('✅ Registration dropdown populated:', aircraftOfType.length, 'aircraft');
      }
    };
    
    // If a type is already selected, populate registration
    if (typeDropdown.value && typeDropdown.value !== 'select') {
      typeDropdown.onchange();
    }
  }
}

// Run immediately if page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoFixAircraft);
} else {
  autoFixAircraft();
}

// Also run when aircraft data changes
setInterval(() => {
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  if (aircraftManager && aircraftManager.filteredAircraft && aircraftManager.filteredAircraft.length > 0) {
    const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
    if (typeDropdown && typeDropdown.options.length <= 2) {
      console.log('🔧 Detected empty dropdown, reapplying fix...');
      applyDropdownFix(aircraftManager.filteredAircraft);
    }
  }
}, 2000);

console.log('🔧 Auto aircraft fix loaded');