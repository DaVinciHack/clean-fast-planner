// fix-route-input.js
// This script fixes the route input issue

console.log('Initializing route input fix script...');

function fixRouteInput() {
  // Try to find the FastPlannerApp component state handlers
  // Directly patch the handleRouteInputChange function
  if (window.FastPlannerApp && window.FastPlannerApp._routeInput) {
    console.log('Found FastPlannerApp component with _routeInput state');
    
    // Save the original handler
    const originalHandler = window.FastPlannerApp.handleRouteInputChange;
    
    // Create a new handler that logs and ensures state is updated
    window.FastPlannerApp.handleRouteInputChange = function(value) {
      console.log('handleRouteInputChange called with:', value);
      
      // Call original handler if it exists
      if (typeof originalHandler === 'function') {
        originalHandler.call(window.FastPlannerApp, value);
      }
      
      // Force state update (extra safety)
      if (window.FastPlannerApp._setRouteInput) {
        console.log('Directly calling _setRouteInput with:', value);
        window.FastPlannerApp._setRouteInput(value);
      }
    };
    
    console.log('Route input handler patched successfully');
    return true;
  }
  
  console.log('Component state not found. Try another approach...');
  
  // Alternative approach: Override the route-input onChange and input events
  const routeInput = document.querySelector('.route-input');
  if (!routeInput) {
    console.log('Route input element not found. Will retry in 1 second...');
    setTimeout(fixRouteInput, 1000);
    return;
  }
  
  console.log('Found route input element. Attaching direct event handler...');
  
  // Create a variable to track if the React handler was called
  let reactHandlerCalled = false;
  
  // Monitor input event to see if React's handler is working
  routeInput.addEventListener('input', (e) => {
    // Set a flag to indicate that an input event was detected
    window._inputDetected = true;
    
    // Set a timeout to check if React processed the event
    setTimeout(() => {
      if (!reactHandlerCalled) {
        console.log('React handler not called on input event. Direct patching needed.');
        applyDirectFix();
      }
      reactHandlerCalled = false;
    }, 50);
  });
  
  // Function to apply a direct fix by patching the React props
  function applyDirectFix() {
    console.log('Applying direct fix to route input...');
    
    // Get React instance using __reactFiber$ or similar property
    const reactKey = Object.keys(routeInput).find(key => 
      key.startsWith('__reactProps$') || 
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$')
    );
    
    if (!reactKey || !reactKey.startsWith('__reactProps$')) {
      console.error('Could not find React props on the input element');
      return;
    }
    
    console.log('Found React props key:', reactKey);
    
    // Get original handlers
    const originalOnChange = routeInput[reactKey].onChange;
    
    // Create a wrapper function that ensures both the original handler runs
    // and the input value is updated
    const enhancedOnChange = function(e) {
      console.log('Enhanced onChange called with:', e.target.value);
      
      // Call original handler
      if (typeof originalOnChange === 'function') {
        originalOnChange(e);
        reactHandlerCalled = true;
      }
      
      // Ensure value is updated directly as a fallback
      setTimeout(() => {
        if (routeInput.value !== e.target.value) {
          console.log('Forcing input value update:', e.target.value);
          routeInput.value = e.target.value;
        }
      }, 0);
    };
    
    // Replace the handler
    routeInput[reactKey].onChange = enhancedOnChange;
    
    console.log('React onChange handler patched successfully');
  }
  
  // Add a utility function to test input
  window.testRouteInput = function(value) {
    const input = document.querySelector('.route-input');
    if (input) {
      console.log('Setting test value:', value);
      input.value = value;
      
      // Dispatch input event
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
      
      // Dispatch change event
      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);
    } else {
      console.error('Route input not found');
    }
  };
  
  console.log('Fix setup complete. Use window.testRouteInput("test") to test.');
}

// Start the fix process when document is loaded
if (document.readyState === 'complete') {
  fixRouteInput();
} else {
  window.addEventListener('load', fixRouteInput);
}

// Expose the fix function globally for manual triggering
window.applyRouteInputFix = fixRouteInput;

console.log('Route input fix script loaded. Use window.applyRouteInputFix() to manually trigger the fix.');
