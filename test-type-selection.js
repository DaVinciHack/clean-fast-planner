// Test type selection callback
console.log('Testing type selection...');

// First, let's manually populate the type dropdown like before
const aircraftManager = window.appManagers?.aircraftManagerRef?.current;

if (aircraftManager && aircraftManager.filteredAircraft.length > 0) {
  
  // Process aircraft by type
  const byType = {};
  const availableTypes = [];
  
  aircraftManager.filteredAircraft.forEach(aircraft => {
    const modelType = aircraft.modelType || 'Unknown';
    if (!byType[modelType]) {
      byType[modelType] = [];
      availableTypes.push(modelType);
    }
    byType[modelType].push(aircraft);
  });
  
  console.log('Aircraft types available:', availableTypes.sort());
  console.log('Sample S92 aircraft:', byType['S92']?.slice(0, 2));
  
  // Store data globally
  window.testAircraftByType = byType;
  
  // Find the dropdowns
  const typeDropdown = document.querySelector('.aircraft-type-dropdown, #aircraft-type');
  const regDropdown = document.querySelector('#aircraft-registration, .aircraft-registration-dropdown');
  
  console.log('Type dropdown found:', !!typeDropdown);
  console.log('Registration dropdown found:', !!regDropdown);
  
  if (typeDropdown && regDropdown) {
    // Manually populate type dropdown first
    while (typeDropdown.options.length > 1) {
      typeDropdown.remove(typeDropdown.options.length - 1);
    }
    
    availableTypes.sort().forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.text = type;
      typeDropdown.add(option);
    });
    
    console.log('Type dropdown populated with', typeDropdown.options.length, 'options');
    
    // Test the type selection
    console.log('Testing S92 selection...');
    
    // Set the value manually
    typeDropdown.value = 'S92';
    
    // Trigger change event manually
    const changeEvent = new Event('change', { bubbles: true });
    typeDropdown.dispatchEvent(changeEvent);
    
    console.log('Change event dispatched');
    
    // Wait and check if registration dropdown updates
    setTimeout(() => {
      console.log('Registration dropdown after S92 selection:');
      console.log('- Option count:', regDropdown.options.length);
      console.log('- Options:', Array.from(regDropdown.options).map(opt => opt.text));
      
      if (regDropdown.options.length <= 2) {
        console.log('❌ Registration dropdown NOT populated by React');
        console.log('Manually populating registration dropdown...');
        
        // Clear and populate manually
        while (regDropdown.options.length > 1) {
          regDropdown.remove(regDropdown.options.length - 1);
        }
        
        const s92Aircraft = byType['S92'] || [];
        s92Aircraft.forEach(aircraft => {
          const option = document.createElement('option');
          option.value = aircraft.registration || aircraft.tailNumber;
          option.text = `${aircraft.registration || aircraft.tailNumber} (${aircraft.region || 'Unknown'})`;
          regDropdown.add(option);
        });
        
        console.log('✅ Manually populated registration dropdown:', regDropdown.options.length, 'options');
        
      } else {
        console.log('✅ Registration dropdown populated by React');
      }
      
    }, 1000);
    
  } else {
    console.log('❌ Could not find both dropdowns');
  }
  
} else {
  console.log('❌ No aircraft manager or filtered aircraft');
}