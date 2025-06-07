// src/components/fast-planner/fixes/input-fix.js

/**
 * @file input-fix.js
 * @description Fixes the waypoint input field issue where typing doesn't update the text.
 */

console.log('Loading input field fix...');

/**
 * Applies the fix for route input fields
 */
export function applyInputFix() {
  // Try to apply the fix after the components have mounted
  setTimeout(() => {
    console.log('Applying input field fix...');
    
    // Find all route input fields
    const routeInputs = document.querySelectorAll('.route-input');
    if (routeInputs.length === 0) {
      console.log('No route inputs found, will retry later...');
      setTimeout(applyInputFix, 1000);
      return;
    }
    
    console.log(`Found ${routeInputs.length} route input fields`);
    
    // Monitor each input field
    routeInputs.forEach((input, index) => {
      console.log(`Applying fix to input #${index + 1}:`, input);
      
      // Store original onChange handler
      let originalOnChange = null;
      
      // Find React props
      const reactPropsKey = Object.keys(input).find(key => 
        key.startsWith('__reactProps$')
      );
      
      if (reactPropsKey) {
        originalOnChange = input[reactPropsKey].onChange;
        console.log(`Found React props with onChange handler:`, !!originalOnChange);
        
        // Replace the onChange handler
        input[reactPropsKey].onChange = function(event) {
          console.log('Enhanced onChange called:', event.target.value);
          
          // Call original handler
          if (originalOnChange) {
            originalOnChange(event);
          }
          
          // Ensure the input value is updated
          setTimeout(() => {
            if (input.value !== event.target.value) {
              console.log('Fixing input value:', event.target.value);
              input.value = event.target.value;
            }
          }, 10);
        };
        
        console.log('Successfully patched onChange handler');
      } else {
        console.log('Could not find React props, trying alternate method');
        
        // Add a direct input handler as fallback
        input.addEventListener('input', function(event) {
          console.log('Direct input event:', event.target.value);
          
          // Dispatch a React synthetic change event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          
          nativeInputValueSetter.call(input, event.target.value);
          
          const changeEvent = new Event('input', { bubbles: true });
          input.dispatchEvent(changeEvent);
        });
        
        console.log('Added direct input handler');
      }
    });
    
    // Add a global test function
    window.testInputField = function(text = 'test') {
      const input = document.querySelector('.route-input');
      if (input) {
        console.log('Testing input with:', text);
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        console.error('Input field not found');
      }
    };
    
    console.log('Input fix applied. Use window.testInputField() to test.');
  }, 2000); // Wait for components to mount
}

// Apply the fix automatically
applyInputFix();

// Export a function to manually apply the fix
export default applyInputFix;
