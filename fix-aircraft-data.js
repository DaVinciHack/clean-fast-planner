// Fix aircraft data by using filtered aircraft directly
console.log('Fixing aircraft data...');

const aircraftManager = window.appManagers?.aircraftManagerRef?.current;

if (aircraftManager) {
  console.log('=== USING FILTERED AIRCRAFT DIRECTLY ===');
  
  const filteredAircraft = aircraftManager.filteredAircraft;
  console.log('Filtered aircraft count:', filteredAircraft.length);
  
  if (filteredAircraft.length > 0) {
    // Sample the filtered aircraft
    console.log('Sample filtered aircraft:');
    filteredAircraft.slice(0, 3).forEach(aircraft => {
      console.log(`- ${aircraft.modelType} (${aircraft.registration || aircraft.tailNumber})`);
    });
    
    // Process them like useAircraft should
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
    
    console.log('Processed types:', availableTypes.sort());
    console.log('Aircraft by type:', Object.keys(byType).map(type => 
      `${type}: ${byType[type].length}`
    ));
    
    // Now override the callback to use this processed data
    const originalCallback = aircraftManager.callbacks.onAircraftFiltered;
    
    aircraftManager.callbacks.onAircraftFiltered = function(aircraft, type) {
      console.log('FIXED CALLBACK: Processing aircraft data...');
      
      if (!type) {
        // Use our pre-processed data
        console.log('Setting aircraft types to:', availableTypes.sort());
        console.log('Setting aircraft by type with keys:', Object.keys(byType));
        
        // Call the original but with our corrected processing
        console.log('Filtered to', aircraft.length, 'aircraft of type', type || 'all');
        
        // The original should set loading to false and update React state
        // But we need to ensure it gets the right data
      }
      
      // Call the original
      originalCallback(aircraft, type);
    };
    
    // Trigger with the filtered aircraft
    console.log('Triggering callback with filtered aircraft...');
    aircraftManager.triggerCallback('onAircraftFiltered', filteredAircraft, null);
    
    // Check the result
    setTimeout(() => {
      const dropdown = document.querySelector('.aircraft-type-dropdown');
      console.log('Dropdown after fix:', {
        optionCount: dropdown?.options?.length || 0,
        options: Array.from(dropdown?.options || []).map(opt => opt.text)
      });
      
      if (dropdown && dropdown.options.length > 2) {
        console.log('✅ SUCCESS! Aircraft dropdown populated');
      } else {
        console.log('❌ Still not working. React state issue deeper than expected.');
        
        // Try forcing a manual dropdown update
        console.log('Attempting manual dropdown update...');
        
        if (dropdown) {
          // Clear existing options except first
          while (dropdown.options.length > 1) {
            dropdown.remove(dropdown.options.length - 1);
          }
          
          // Add aircraft types manually
          availableTypes.sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.text = type;
            dropdown.add(option);
          });
          
          console.log('Manual dropdown update completed:', dropdown.options.length);
        }
      }
      
      // Restore original callback
      aircraftManager.callbacks.onAircraftFiltered = originalCallback;
      
    }, 1000);
    
  } else {
    console.log('No filtered aircraft found');
  }
  
} else {
  console.log('No aircraft manager found');
}