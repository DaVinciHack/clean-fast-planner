// Production Aircraft Fix - Bypass broken React state
console.log('🔧 APPLYING PRODUCTION AIRCRAFT FIX...');

function applyAircraftFix() {
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  
  if (!aircraftManager) {
    console.log('❌ No aircraft manager found');
    return;
  }
  
  console.log('✅ Aircraft manager found, applying fix...');
  
  // Get the original callback
  const originalCallback = aircraftManager.callbacks.onAircraftFiltered;
  
  // Replace with our fixed version that manually updates DOM
  aircraftManager.callbacks.onAircraftFiltered = function(filteredAircraft, type) {
    console.log(`🔧 FIXED CALLBACK: ${filteredAircraft.length} aircraft, type: ${type || 'all'}`);
    
    // Call original first (for any other logic)
    originalCallback(filteredAircraft, type);
    
    // Then manually fix the DOM
    if (!type && filteredAircraft.length > 0) {
      console.log('🔧 Manually updating aircraft dropdowns...');
      
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
      
      // Update type dropdown
      const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
      if (typeDropdown) {
        // Clear existing options except first
        while (typeDropdown.options.length > 1) {
          typeDropdown.remove(typeDropdown.options.length - 1);
        }
        
        // Add aircraft types
        availableTypes.sort().forEach(aircraftType => {
          const option = document.createElement('option');
          option.value = aircraftType;
          option.text = aircraftType;
          typeDropdown.add(option);
        });
        
        console.log(`✅ Type dropdown updated: ${typeDropdown.options.length} options`);
        
        // Store the aircraft data globally so registration dropdown can access it
        window.aircraftByTypeFixed = byType;
        window.availableTypesFixed = availableTypes.sort();
        
        // Set up event listener for type changes
        typeDropdown.onchange = function() {
          const selectedType = this.value;
          console.log(`🔧 Type changed to: ${selectedType}`);
          
          // Update registration dropdown
          const regDropdown = document.querySelector('#aircraft-registration, .aircraft-registration-dropdown');
          if (regDropdown && selectedType && selectedType !== 'select') {
            // Clear registration options
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
            
            console.log(`✅ Registration dropdown updated: ${aircraftOfType.length} aircraft`);
          }
        };
        
      } else {
        console.log('❌ Type dropdown not found');
      }
    }
  };
  
  // Trigger the fix immediately
  console.log('🔧 Triggering initial aircraft fix...');
  aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
  
  console.log('✅ Production aircraft fix applied!');
  
  // Store the fix function globally for re-use
  window.applyAircraftFix = applyAircraftFix;
}

// Apply the fix
applyAircraftFix();

console.log('🔧 Aircraft fix loaded. Use window.applyAircraftFix() to reapply if needed.');