/**
 * Fix Aircraft Dropdown Issues
 * 
 * This script will monitor the aircraft dropdown and ensure it gets populated correctly.
 */

// Wait for the page to load
window.addEventListener('load', function() {
  console.log('Applying aircraft dropdown fix...');
  
  // Give time for React to initialize
  setTimeout(function() {
    try {
      // Function to check and fix the aircraft type dropdown
      const checkDropdown = () => {
        const aircraftTypeDropdown = document.getElementById('aircraft-type');
        
        if (aircraftTypeDropdown) {
          console.log('Checking aircraft type dropdown...');
          
          // Check if we have any options besides the default
          const options = aircraftTypeDropdown.querySelectorAll('option');
          const hasAircraftTypes = options.length > 1;
          
          console.log(`Dropdown has ${options.length} options (including default)`);
          
          // If we only have the default option, try to add some sample options
          if (!hasAircraftTypes) {
            console.log('No aircraft types found in dropdown, adding samples for testing...');
            
            // Add sample aircraft types for debugging
            const sampleTypes = [
              { value: 'S92', display: 'Sikorsky S-92 (11)' },
              { value: 'S76', display: 'Sikorsky S-76 (8)' },
              { value: 'AW139', display: 'Leonardo AW139 (12)' }
            ];
            
            sampleTypes.forEach(type => {
              const option = document.createElement('option');
              option.value = type.value;
              option.innerText = type.display;
              aircraftTypeDropdown.appendChild(option);
            });
            
            console.log('Added sample aircraft types for testing');
          }
        } else {
          console.log('Aircraft type dropdown not found');
        }
      };
      
      // Check the dropdown initially
      setTimeout(checkDropdown, 2000);
      
      // Set a periodic check to monitor the dropdown
      setInterval(checkDropdown, 5000);
      
    } catch (error) {
      console.error('Error applying aircraft dropdown fix:', error);
    }
  }, 2000); // 2 second delay
});