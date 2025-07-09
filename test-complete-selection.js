// Test complete aircraft selection flow
console.log('Testing complete aircraft selection...');

// Select a specific aircraft to test the full flow
const regDropdown = document.querySelector('#aircraft-registration, .aircraft-registration-dropdown');

if (regDropdown && regDropdown.options.length > 1) {
  console.log('Available aircraft:');
  Array.from(regDropdown.options).slice(1, 4).forEach((opt, i) => {
    console.log(`${i + 1}. ${opt.value} - ${opt.text}`);
  });
  
  // Select the first S92 aircraft
  const firstAircraft = regDropdown.options[1]; // Skip "-- Select Aircraft --"
  console.log(`Selecting: ${firstAircraft.value}`);
  
  regDropdown.value = firstAircraft.value;
  
  // Trigger change event
  const changeEvent = new Event('change', { bubbles: true });
  regDropdown.dispatchEvent(changeEvent);
  
  console.log('Aircraft selection change event dispatched');
  
  // Check if the selection took effect
  setTimeout(() => {
    
    // Look for selected aircraft display
    const selectedDisplay = document.querySelector('.selected-aircraft-display, .aircraft-display');
    if (selectedDisplay) {
      console.log('Selected aircraft display:', selectedDisplay.textContent);
    }
    
    // Check if window has the selected aircraft
    if (window.currentSelectedAircraft) {
      console.log('Window selected aircraft:', {
        registration: window.currentSelectedAircraft.registration,
        modelType: window.currentSelectedAircraft.modelType,
        region: window.currentSelectedAircraft.region
      });
    }
    
    // Check the AppHeader logs for selectedAircraft status
    console.log('Check AppHeader logs above for selectedAircraft: true/false');
    
  }, 1000);
  
} else {
  console.log('❌ Registration dropdown not found or empty');
}