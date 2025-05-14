/**
 * OSDK Compatibility Check
 * This script is loaded in the index.html file and checks if the OSDK client is properly loading
 * on web deployments.
 */

(function() {
  console.log('========== WEB DEPLOYMENT OSDK CHECK STARTING ==========');
  
  // Check if window.OSDKCheck exists
  if (window.OSDKCheck) {
    console.log('OSDK Check already running, skipping...');
    return;
  }
  
  // Create the OSDKCheck object
  window.OSDKCheck = {
    started: Date.now(),
    errors: [],
    checks: []
  };
  
  // Add a check result
  function addCheck(name, result, message, details = null) {
    window.OSDKCheck.checks.push({
      name,
      result,
      message,
      details,
      time: Date.now()
    });
    
    if (result) {
      console.log(`✅ ${name}: ${message}`);
      if (details) console.log(details);
    } else {
      console.error(`❌ ${name}: ${message}`);
      if (details) console.error(details);
      window.OSDKCheck.errors.push({ name, message, details, time: Date.now() });
    }
  }
  
  // Create visual indicator
  function createIndicator() {
    // Create element if it doesn't exist
    if (!document.getElementById('osdk-compat-indicator')) {
      const indicator = document.createElement('div');
      indicator.id = 'osdk-compat-indicator';
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.left = '10px';
      indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      indicator.style.color = 'white';
      indicator.style.padding = '10px';
      indicator.style.borderRadius = '5px';
      indicator.style.zIndex = '9999';
      indicator.style.display = 'flex';
      indicator.style.flexDirection = 'column';
      indicator.style.gap = '5px';
      indicator.style.maxWidth = '300px';
      indicator.style.maxHeight = '200px';
      indicator.style.overflow = 'auto';
      indicator.style.fontSize = '12px';
      indicator.style.fontFamily = 'monospace';
      
      // Title
      const title = document.createElement('div');
      title.style.fontWeight = 'bold';
      title.style.fontSize = '14px';
      title.textContent = 'OSDK Compatibility Check';
      
      // Status
      const status = document.createElement('div');
      status.id = 'osdk-compat-status';
      status.textContent = 'Running checks...';
      
      // Errors list
      const errors = document.createElement('div');
      errors.id = 'osdk-compat-errors';
      
      // Close button
      const close = document.createElement('button');
      close.textContent = '✕';
      close.style.position = 'absolute';
      close.style.top = '5px';
      close.style.right = '5px';
      close.style.background = 'none';
      close.style.border = 'none';
      close.style.color = 'white';
      close.style.cursor = 'pointer';
      close.onclick = function() {
        indicator.style.display = 'none';
      };
      
      // Add elements to indicator
      indicator.appendChild(title);
      indicator.appendChild(status);
      indicator.appendChild(errors);
      indicator.appendChild(close);
      
      // Add to document
      document.body.appendChild(indicator);
    }
  }
  
  // Update indicator with check results
  function updateIndicator() {
    const indicator = document.getElementById('osdk-compat-indicator');
    if (!indicator) return;
    
    const status = document.getElementById('osdk-compat-status');
    const errorsList = document.getElementById('osdk-compat-errors');
    
    if (window.OSDKCheck.errors.length > 0) {
      status.textContent = `❌ ${window.OSDKCheck.errors.length} issues found`;
      status.style.color = 'red';
      
      // Clear errors list
      errorsList.innerHTML = '';
      
      // Add each error
      window.OSDKCheck.errors.forEach(error => {
        const errorItem = document.createElement('div');
        errorItem.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';
        errorItem.style.paddingTop = '5px';
        errorItem.style.marginTop = '5px';
        errorItem.textContent = `${error.name}: ${error.message}`;
        errorsList.appendChild(errorItem);
      });
    } else {
      status.textContent = '✅ All checks passed';
      status.style.color = '#4caf50';
      errorsList.innerHTML = '';
    }
  }
  
  // Run checks
  function runChecks() {
    try {
      createIndicator();
      
      // Check if required scripts are loaded
      addCheck('Script Loading', 
        typeof window.OSDKCheck === 'object', 
        'OSDK check script loaded successfully');
      
      // Schedule future checks for when the app has loaded
      setTimeout(function() {
        try {
          // Check if client import exists
          if (typeof require === 'function') {
            try {
              const result = require('@osdk/client');
              addCheck('OSDK Client Module',
                !!result,
                result ? 'OSDK client module loaded successfully' : 'OSDK client module failed to load',
                { moduleExists: !!result });
            } catch (e) {
              addCheck('OSDK Client Module',
                false,
                'Error requiring @osdk/client module',
                { error: e.message });
            }
          } else {
            // Check if global variables exist
            const clientCheck = window.OSDKClient !== undefined;
            addCheck('OSDK Client Global',
              clientCheck,
              clientCheck ? 'OSDK client is available globally' : 'OSDK client is not available globally');
          }
          
          // Check if app is authenticated
          const authCheck = window.isFoundryAuthenticated === true;
          addCheck('Authentication State',
            authCheck,
            authCheck ? 'Application is authenticated with Foundry' : 'Application is not authenticated with Foundry');
          
          // Check if username is available
          const userCheck = !!window.foundryUserName;
          addCheck('User Information',
            userCheck,
            userCheck ? `User information available: ${window.foundryUserName}` : 'User information not available');
          
          // Update the indicator
          updateIndicator();
          
          // If checks passed and enough time has elapsed, hide the indicator
          if (window.OSDKCheck.errors.length === 0 && (Date.now() - window.OSDKCheck.started > 10000)) {
            const indicator = document.getElementById('osdk-compat-indicator');
            if (indicator) {
              indicator.style.display = 'none';
            }
          }
        } catch (e) {
          console.error('Error running delayed OSDK checks:', e);
        }
      }, 5000); // Wait 5 seconds for the app to load
      
      // Run a second check after 15 seconds
      setTimeout(function() {
        try {
          // Check if client.ts was imported correctly
          const clientAccessible = window.osdkClientAccessible === true;
          addCheck('OSDK Client Access',
            clientAccessible,
            clientAccessible ? 'OSDK client was successfully accessed' : 'OSDK client was not accessed',
            { status: window.osdkClientStatus || 'unknown' });
          
          // Check if aircraft were loaded
          const aircraftLoaded = window.aircraftLoaded === true;
          addCheck('Aircraft Loading',
            aircraftLoaded,
            aircraftLoaded ? 'Aircraft were successfully loaded' : 'Aircraft were not loaded',
            { count: window.aircraftCount || 0 });
          
          // Update the indicator
          updateIndicator();
        } catch (e) {
          console.error('Error running final OSDK checks:', e);
        }
      }, 15000); // Wait 15 seconds for aircraft to load
      
    } catch (e) {
      console.error('Error in OSDK compatibility check:', e);
    }
  }
  
  // Run checks on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runChecks);
  } else {
    runChecks();
  }
})();
