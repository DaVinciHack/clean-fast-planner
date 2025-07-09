// Check MainCard state directly
console.log('Checking MainCard state...');

// Wait for potential React updates
setTimeout(() => {
  
  // Look for MainCard debug output in console
  console.log('Looking for MainCard aircraft debug...');
  
  // Trigger the callback again and monitor console
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  
  if (aircraftManager) {
    console.log('Triggering callback to check state flow...');
    
    // Override console.log temporarily to catch MainCard debug
    const originalLog = console.log;
    let mainCardLogs = [];
    
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('MainCard Aircraft Debug')) {
        mainCardLogs.push(message);
      }
      originalLog.apply(console, args);
    };
    
    // Trigger callback
    aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
    
    // Restore console.log after a delay
    setTimeout(() => {
      console.log = originalLog;
      console.log('MainCard debug logs captured:', mainCardLogs);
      
      // Also check aircraft dropdowns again
      const selects = document.querySelectorAll('select');
      console.log('Current selects after callback:');
      selects.forEach((select, i) => {
        console.log(`Select ${i + 1}:`, {
          className: select.className,
          options: select.options.length,
          hasAircraftOptions: Array.from(select.options).some(opt => 
            opt.text.includes('S92') || opt.text.includes('H175')
          )
        });
      });
      
    }, 1000);
    
  }
  
}, 500);