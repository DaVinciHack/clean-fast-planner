/**
 * fix-modules-ready.js
 * 
 * This script ensures all fix scripts are applied after all modules are loaded
 * It addresses the race condition where fix scripts run before the objects they're
 * trying to patch are available.
 */

console.log('🔄 Module ready state monitor activated');

// Function to check if all required modules are loaded and ready
function checkModulesReady() {
  console.log('🔄 Checking module ready state...');
  
  const requiredObjects = [
    { name: 'waypointManager', path: 'window.waypointManager' },
    { name: 'ComprehensiveFuelCalculator', path: 'window.ComprehensiveFuelCalculator' },
    { name: 'StopCardCalculator', path: 'window.StopCardCalculator' },
    { name: 'mapManager', path: 'window.mapManager' }
  ];
  
  const missingObjects = [];
  const readyObjects = [];
  
  // Check each required object
  requiredObjects.forEach(obj => {
    try {
      // Use eval to check if the object exists in its path
      const exists = eval(obj.path) !== undefined;
      
      if (exists) {
        readyObjects.push(obj.name);
      } else {
        missingObjects.push(obj.name);
      }
    } catch (e) {
      missingObjects.push(obj.name);
    }
  });
  
  if (missingObjects.length === 0) {
    console.log('✅ All required modules are ready!');
    console.log('🧩 Ready objects: ' + readyObjects.join(', '));
    
    // Trigger the fix scripts now that all modules are ready
    console.log('🔧 Applying fixes now that modules are ready...');
    
    // Instead of relying on global functions, we'll directly apply the fixes in-line
    // This ensures we don't need to rely on function exports
    
    // Apply WaypointManager fixes
    console.log('🔧 Applying WaypointManager fixes...');
    try {
      if (window.waypointManager) {
        // Store the original method to extend it
        const originalAddWaypoint = window.waypointManager.addWaypoint;
        
        // Only patch if not already patched
        if (!originalAddWaypoint.toString().includes('NAVIGATION_WAYPOINT')) {
          // Override the addWaypoint method to use proper type enum
          window.waypointManager.addWaypoint = function(coords, name, options = {}) {
            console.log('🛠️ Enhanced addWaypoint called with options:', options);
            
            // Determine if this is a waypoint by checking options OR the global flag
            const isWaypointOption = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
            const isWaypointGlobal = window.isWaypointModeActive === true;
            const isWaypoint = isWaypointOption || isWaypointGlobal;
            
            // Use explicit point type enum instead of boolean flag
            const pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
            
            console.log(`🛠️ Adding ${pointType} at coordinates: ${coords} with name: ${name || 'Unnamed'}`);
            
            // Extend options with our enhanced type
            const enhancedOptions = {
              ...options,
              isWaypoint: isWaypoint,            // Keep for compatibility
              type: isWaypoint ? 'WAYPOINT' : 'STOP', // Keep for compatibility
              pointType: pointType               // New explicit type enum
            };
            
            // Call the original method with our enhanced options
            return originalAddWaypoint.call(this, coords, name, enhancedOptions);
          };
          
          console.log('✅ Successfully patched waypointManager.addWaypoint');
        } else {
          console.log('✅ waypointManager.addWaypoint already patched');
        }
        
        // Same approach for addWaypointAtIndex
        const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
        if (!originalAddWaypointAtIndex.toString().includes('NAVIGATION_WAYPOINT')) {
          window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
            console.log('🛠️ Enhanced addWaypointAtIndex called with options:', options);
            
            // Same logic as above
            const isWaypointOption = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
            const isWaypointGlobal = window.isWaypointModeActive === true;
            const isWaypoint = isWaypointOption || isWaypointGlobal;
            
            const pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
            
            console.log(`🛠️ Adding ${pointType} at index ${index}, coordinates: ${coords} with name: ${name || 'Unnamed'}`);
            
            const enhancedOptions = {
              ...options,
              isWaypoint: isWaypoint,
              type: isWaypoint ? 'WAYPOINT' : 'STOP',
              pointType: pointType
            };
            
            return originalAddWaypointAtIndex.call(this, coords, name, index, enhancedOptions);
          };
          
          console.log('✅ Successfully patched waypointManager.addWaypointAtIndex');
        } else {
          console.log('✅ waypointManager.addWaypointAtIndex already patched');
        }
      } else {
        console.error('❌ waypointManager not available to patch');
      }
    } catch (error) {
      console.error('❌ Error applying WaypointManager fixes:', error);
    }
    
    // Apply StopCardCalculator fixes
    console.log('🔧 Applying StopCardCalculator fixes...');
    try {
      // Determine which object we're patching
      let calculatorObj;
      if (window.StopCardCalculator) {
        calculatorObj = window.StopCardCalculator;
      } else if (window.ComprehensiveFuelCalculator) {
        calculatorObj = window.ComprehensiveFuelCalculator;
      }
      
      if (calculatorObj && calculatorObj.calculateStopCards) {
        // Check if already patched
        if (!calculatorObj.calculateStopCards.toString().includes('filter(wp => wp.pointType')) {
          // Store the original function
          window.originalCalculateStopCards = calculatorObj.calculateStopCards;
          
          // Override the function
          calculatorObj.calculateStopCards = function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
            console.log('🛠️ Enhanced StopCardCalculator called with waypoints:', waypoints?.length);
            
            // Filter out navigation waypoints
            const landingStops = waypoints.filter(wp => 
              wp.pointType === 'LANDING_STOP' || // New type
              (!wp.pointType && !wp.isWaypoint) // Backward compatibility
            );
            
            console.log(`🛠️ Filtered out waypoints: ${waypoints.length - landingStops.length} navigation waypoints removed, ${landingStops.length} landing stops remain`);
            
            // Call the original function with only landing stops
            return window.originalCalculateStopCards.call(calculatorObj, landingStops, routeStats, selectedAircraft, weather, options);
          };
          
          console.log('✅ Successfully patched StopCardCalculator');
        } else {
          console.log('✅ StopCardCalculator already patched');
        }
      } else {
        console.error('❌ No StopCardCalculator available to patch');
      }
    } catch (error) {
      console.error('❌ Error applying StopCardCalculator fixes:', error);
    }
    
    return true;
  } else {
    console.log('⏳ Waiting for modules to be ready...');
    console.log('🧩 Ready objects: ' + readyObjects.join(', '));
    console.log('⌛ Missing objects: ' + missingObjects.join(', '));
    return false;
  }
}

// Set up retry mechanism to keep checking until modules are ready
let attempts = 0;
const maxAttempts = 20; // Try more times since modules might take a while to load
const retryInterval = 1000; // Check every second

function tryToApplyFixes() {
  attempts++;
  console.log(`🔄 Attempt ${attempts}/${maxAttempts} to check module ready state`);
  
  if (checkModulesReady()) {
    console.log('✅ Successfully verified modules are ready and applied fixes');
    
    // Add a visible indicator that fixes are active
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
    indicator.style.color = 'black';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '12px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '9999';
    indicator.textContent = 'Waypoint/Stop Fix Active';
    document.body.appendChild(indicator);
    
    // Create debug logging function available globally
    window.debugWaypointStopFix = function() {
      console.log('🔍 Debugging Waypoint vs Stop Fix:');
      
      // Log status of key objects
      console.log('window.waypointManager:', window.waypointManager ? 'Available' : 'Missing');
      console.log('window.ComprehensiveFuelCalculator:', window.ComprehensiveFuelCalculator ? 'Available' : 'Missing');
      console.log('window.StopCardCalculator:', window.StopCardCalculator ? 'Available' : 'Missing');
      
      // Check if the fix methods are installed
      if (window.waypointManager) {
        const originalAddWaypoint = window.waypointManager.addWaypoint.toString();
        
        console.log('waypointManager.addWaypoint patched:', 
          originalAddWaypoint.includes('NAVIGATION_WAYPOINT') ? 'Yes' : 'No');
      }
      
      if (window.ComprehensiveFuelCalculator) {
        const calcFunc = window.ComprehensiveFuelCalculator.calculateAllFuelData.toString();
        console.log('ComprehensiveFuelCalculator patched:', 
          calcFunc.includes('filter(wp => wp.pointType') ? 'Yes' : 'No');
      }
      
      // Log the current waypoints
      if (window.waypointManager) {
        const waypoints = window.waypointManager.getWaypoints();
        console.log('Current waypoints:', waypoints);
        
        // Check if any waypoints have the proper type enum
        const hasProperType = waypoints.some(wp => wp.pointType === 'NAVIGATION_WAYPOINT' || wp.pointType === 'LANDING_STOP');
        console.log('Waypoints have proper type enum:', hasProperType ? 'Yes' : 'No');
      }
      
      // Verify global flags
      console.log('window.isWaypointModeActive:', window.isWaypointModeActive);
      
      return 'Debug info logged to console';
    };
    
    console.log('🔍 Added debug function: window.debugWaypointStopFix()');
  } else if (attempts < maxAttempts) {
    // Try again after delay
    setTimeout(tryToApplyFixes, retryInterval);
  } else {
    console.error('❌ Failed to verify modules are ready after maximum attempts');
    
    // Show error indicator
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '12px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '9999';
    indicator.textContent = 'Waypoint/Stop Fix Failed to Load';
    document.body.appendChild(indicator);
  }
}

// Wait for DOM to be ready before starting checks
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOM loaded, starting module ready checks');
    setTimeout(tryToApplyFixes, 2000); // Start with a delay to ensure initialization
  });
} else {
  console.log('🔄 DOM already loaded, starting module ready checks');
  setTimeout(tryToApplyFixes, 2000); // Start with a delay to ensure initialization
}

// Also create a global function to manually apply fixes
window.manuallyApplyWaypointStopFix = function() {
  console.log('🔧 Manually applying waypoint/stop fixes...');
  attempts = 0; // Reset attempts
  tryToApplyFixes();
  return 'Manual fix application started';
};

console.log('🔄 Module ready monitor initialized - will apply fixes when objects are available');
console.log('🔧 You can also call window.manuallyApplyWaypointStopFix() to manually apply fixes');
