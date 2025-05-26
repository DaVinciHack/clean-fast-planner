/**
 * Fix Original ModularFastPlannerComponent Issues
 * 
 * This script injects a safety workaround for the platformManager reference issue
 * by adding a global hook that will fix the reference when the page loads.
 */

// This file will be injected via the index.html

// Wait for the page to load
window.addEventListener('load', function() {
  console.log('Applying ModularFastPlannerComponent fix...');
  
  // Give time for React to initialize
  setTimeout(function() {
    try {
      // Check if we're on the original component
      if (window.location.search.includes('context=original')) {
        console.log('Original component detected, applying platformManager fix...');
        
        // Access window components 
        if (window.platformManagerRef && window.mapManagerRef) {
          console.log('Found platformManagerRef and mapManagerRef, fixing reference...');
          
          if (window.platformManagerRef.current && window.mapManagerRef.current) {
            // Fix the reference
            window.platformManagerRef.current.mapManager = window.mapManagerRef.current;
            console.log('Fixed platformManagerRef.current.mapManager reference!');
            
            // Add a notification
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.bottom = '10px';
            div.style.left = '10px';
            div.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
            div.style.color = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.zIndex = '9999';
            div.innerHTML = 'Platform Manager reference fixed! Reload to apply.';
            document.body.appendChild(div);
            
            // Auto-hide after 5 seconds
            setTimeout(function() {
              document.body.removeChild(div);
            }, 5000);
          } else {
            console.error('platformManagerRef.current or mapManagerRef.current is not available yet');
          }
        } else {
          console.error('platformManagerRef or mapManagerRef not found in window');
        }
      }
    } catch (error) {
      console.error('Error applying platformManager fix:', error);
    }
  }, 2000); // 2 second delay
});