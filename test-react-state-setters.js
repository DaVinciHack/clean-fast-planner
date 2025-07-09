/**
 * Test React State Setters
 * Direct test of React state management in production vs local
 */

console.log('🧪 TESTING REACT STATE SETTERS...');
console.log('🌍 Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE');

function testReactStateSetters() {
  
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  
  if (!aircraftManager) {
    console.log('❌ No aircraft manager found');
    return;
  }
  
  console.log('\n=== ORIGINAL CALLBACK INSPECTION ===');
  const originalCallback = aircraftManager.callbacks.onAircraftFiltered;
  console.log('📞 Original callback function:');
  console.log(originalCallback.toString());
  
  console.log('\n=== CREATING TEST CALLBACK ===');
  
  // Create our own callback to test React state directly
  aircraftManager.callbacks.onAircraftFiltered = function(filteredAircraft, type) {
    console.log('🔥 TEST CALLBACK TRIGGERED:', {
      aircraftCount: filteredAircraft?.length || 0,
      type: type,
      firstAircraft: filteredAircraft?.[0]?.modelType
    });
    
    // Try to process the data exactly like useAircraft should
    if (!type) {
      console.log('🔄 Processing aircraft by type...');
      
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
      
      console.log('✈️ Processed types:', availableTypes.sort());
      console.log('✈️ Aircraft counts by type:', Object.keys(byType).map(type => `${type}: ${byType[type].length}`));
      
      // Now try to call the original callback with this processed data
      console.log('🔄 Calling original callback...');
      try {
        originalCallback(filteredAircraft, type);
        console.log('✅ Original callback completed');
      } catch (error) {
        console.log('❌ Original callback error:', error.message);
        console.log('❌ Error stack:', error.stack);
      }
      
      // Wait and check if UI updated
      setTimeout(() => {
        console.log('\n=== CHECKING UI UPDATE AFTER CALLBACK ===');
        
        // Check for aircraft type dropdown
        const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type, select[class*="aircraft"]');
        if (typeDropdown) {
          console.log('📋 Type dropdown found:', {
            tagName: typeDropdown.tagName,
            className: typeDropdown.className,
            optionCount: typeDropdown.options?.length || 0,
            options: Array.from(typeDropdown.options || []).map(opt => opt.text).slice(0, 5)
          });
        } else {
          console.log('❌ No aircraft type dropdown found');
        }
        
        // Look for any select with aircraft options
        const allSelects = document.querySelectorAll('select');
        console.log('📋 All selects on page:', allSelects.length);
        
        allSelects.forEach((select, index) => {
          const hasAircraftOptions = Array.from(select.options).some(opt => 
            opt.text.includes('S92') || opt.text.includes('H175') || opt.text.includes('AW')
          );
          if (hasAircraftOptions || select.options.length > 2) {
            console.log(`📋 Select ${index + 1}:`, {
              className: select.className,
              id: select.id,
              optionCount: select.options.length,
              sampleOptions: Array.from(select.options).slice(0, 3).map(opt => opt.text)
            });
          }
        });
        
      }, 1000);
      
    } else {
      // Call original for type-specific filtering
      originalCallback(filteredAircraft, type);
    }
  };
  
  console.log('✅ Test callback installed');
  
  // Trigger the test
  console.log('\n=== TRIGGERING TEST ===');
  aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
  
  // Also test with specific region filtering
  setTimeout(() => {
    console.log('\n=== TESTING REGION FILTERING ===');
    if (aircraftManager.filterAircraftByRegion) {
      aircraftManager.filterAircraftByRegion('Gulf of Mexico');
    }
  }, 2000);
  
  // Restore original after test
  setTimeout(() => {
    console.log('\n=== RESTORING ORIGINAL CALLBACK ===');
    aircraftManager.callbacks.onAircraftFiltered = originalCallback;
    console.log('🔄 Original callback restored');
  }, 5000);
}

// Run the test
testReactStateSetters();

console.log('🧪 React state setters test running...');