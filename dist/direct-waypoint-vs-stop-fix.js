/**
 * direct-waypoint-vs-stop-fix.js
 * 
 * A comprehensive fix for the waypoint vs. stop distinction issue.
 * This script applies multiple fixes to ensure proper separation between 
 * navigation waypoints and landing stops.
 */

console.log('🛠️ Loading waypoint vs. stop comprehensive fix...');

/**
 * FIX 1: Enhance WaypointManager to use explicit point type enum
 */
function enhanceWaypointManager() {
  console.log('🛠️ Enhancing WaypointManager with proper point type enum...');
  
  if (!window.waypointManager) {
    console.error('🛠️ Cannot apply fix: window.waypointManager is not available');
    return false;
  }
  
  // Store original methods to extend them
  const originalAddWaypoint = window.waypointManager.addWaypoint;
  const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
  const originalCreateWaypointMarker = window.waypointManager.createWaypointMarker;
  
  // 1. Override the addWaypoint method to use proper type enum
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
  
  // 2. Override the addWaypointAtIndex method to use proper type enum
  window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
    console.log('🛠️ Enhanced addWaypointAtIndex called with options:', options);
    
    // Determine if this is a waypoint by checking options OR the global flag
    const isWaypointOption = options && (options.isWaypoint === true || options.type === 'WAYPOINT');
    const isWaypointGlobal = window.isWaypointModeActive === true;
    const isWaypoint = isWaypointOption || isWaypointGlobal;
    
    // Use explicit point type enum instead of boolean flag
    const pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
    
    console.log(`🛠️ Adding ${pointType} at index ${index}, coordinates: ${coords} with name: ${name || 'Unnamed'}`);
    
    // Extend options with our enhanced type
    const enhancedOptions = {
      ...options,
      isWaypoint: isWaypoint,            // Keep for compatibility
      type: isWaypoint ? 'WAYPOINT' : 'STOP', // Keep for compatibility
      pointType: pointType               // New explicit type enum
    };
    
    // Call the original method with our enhanced options
    return originalAddWaypointAtIndex.call(this, coords, name, index, enhancedOptions);
  };
  
  // 3. Fix existing waypoints in the route
  function fixExistingWaypoints() {
    console.log('🛠️ Fixing existing waypoints to ensure proper point types...');
    
    const waypoints = window.waypointManager.getWaypoints();
    
    if (!waypoints || waypoints.length === 0) {
      console.log('🛠️ No existing waypoints to fix');
      return;
    }
    
    console.log(`🛠️ Found ${waypoints.length} existing waypoints to check`);
    
    // Process each waypoint to ensure it has proper pointType
    waypoints.forEach((waypoint, index) => {
      // Check if waypoint already has pointType
      if (!waypoint.pointType) {
        const isWaypoint = waypoint.isWaypoint === true || waypoint.type === 'WAYPOINT';
        waypoint.pointType = isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP';
        console.log(`🛠️ Added pointType to waypoint ${index}: ${waypoint.pointType}`);
      }
    });
    
    console.log('🛠️ Finished fixing existing waypoints');
    
    return waypoints;
  }
  
  // Fix existing waypoints
  fixExistingWaypoints();
  
  console.log('🛠️ Successfully enhanced WaypointManager with proper point type enum');
  return true;
}

/**
 * FIX 2: Update the ComprehensiveFuelCalculator to filter out navigation waypoints
 */
function enhanceComprehensiveFuelCalculator() {
  console.log('🛠️ Enhancing ComprehensiveFuelCalculator to filter navigation waypoints...');
  
  // First check if ComprehensiveFuelCalculator is available
  if (!window.ComprehensiveFuelCalculator) {
    console.error('🛠️ Cannot apply fix: window.ComprehensiveFuelCalculator is not available');
    return false;
  }
  
  // Store the original calculateAllFuelData method
  const originalCalculateAllFuelData = window.ComprehensiveFuelCalculator.calculateAllFuelData;
  
  // Override the calculateAllFuelData method to filter waypoints
  window.ComprehensiveFuelCalculator.calculateAllFuelData = function(waypoints, selectedAircraft, flightSettings, weather, routeStats) {
    console.log('🛠️ Enhanced ComprehensiveFuelCalculator called with:', {
      waypointsLength: waypoints?.length,
      hasAircraft: !!selectedAircraft,
      hasFlightSettings: !!flightSettings,
      hasWeather: !!weather
    });
    
    if (!waypoints || waypoints.length < 2) {
      console.log('🛠️ Not enough waypoints to calculate, proceeding with original method');
      return originalCalculateAllFuelData.call(this, waypoints, selectedAircraft, flightSettings, weather, routeStats);
    }
    
    // CRITICAL FIX: Filter out navigation waypoints for calculations
    const landingStops = waypoints.filter(wp => {
      const isLandingStop = 
        wp.pointType === 'LANDING_STOP' || // New explicit type
        (!wp.pointType && !wp.isWaypoint); // Fallback for backward compatibility
      
      return isLandingStop;
    });
    
    console.log(`🛠️ Filtered out navigation waypoints for fuel calculations:
      - Original waypoints: ${waypoints.length}
      - Landing stops only: ${landingStops.length}
      - Navigation waypoints removed: ${waypoints.length - landingStops.length}`);
    
    // If all waypoints are navigation waypoints (no landing stops), we need to keep at least start and end
    if (landingStops.length < 2 && waypoints.length >= 2) {
      console.log('🛠️ Route only contains navigation waypoints, using first and last as landing stops');
      
      // Use first and last waypoints as landing stops
      landingStops.push({...waypoints[0], pointType: 'LANDING_STOP', isWaypoint: false, type: 'STOP'});
      
      if (waypoints.length > 1) {
        landingStops.push({...waypoints[waypoints.length - 1], pointType: 'LANDING_STOP', isWaypoint: false, type: 'STOP'});
      }
      
      console.log(`🛠️ Added first and last waypoints as landing stops: ${landingStops.length} stops`);
    }
    
    // Call the original method with only landing stops for calculations
    // but keep using the original waypoints for drawing the route
    const result = originalCalculateAllFuelData.call(this, landingStops, selectedAircraft, flightSettings, weather, routeStats);
    
    // Enhanced result with additional information
    if (result) {
      result.fullWaypoints = waypoints;
      result.landingStops = landingStops;
      
      // Add debug info to the result
      result.waypointInfo = {
        totalWaypoints: waypoints.length,
        landingStops: landingStops.length,
        navigationWaypoints: waypoints.length - landingStops.length
      };
      
      console.log('🛠️ Enhanced result with waypoint info:', result.waypointInfo);
    }
    
    return result;
  };
  
  console.log('🛠️ Successfully enhanced ComprehensiveFuelCalculator to filter navigation waypoints');
  return true;
}

/**
 * FIX 3: Update StopCardCalculator to filter out navigation waypoints
 */
function enhanceStopCardCalculator() {
  console.log('🛠️ Enhancing StopCardCalculator to filter navigation waypoints...');
  
  // Check if StopCardCalculator is available
  if (!window.StopCardCalculator) {
    console.error('🛠️ Cannot apply fix: window.StopCardCalculator is not available');
    return false;
  }
  
  // Store the original calculateStopCards method
  const originalCalculateStopCards = window.StopCardCalculator.calculateStopCards;
  
  // Override the calculateStopCards method to filter waypoints
  window.StopCardCalculator.calculateStopCards = function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
    console.log('🛠️ Enhanced StopCardCalculator called with waypoints:', waypoints?.length);
    
    if (!waypoints || waypoints.length < 2) {
      console.log('🛠️ Not enough waypoints to calculate, proceeding with original method');
      return originalCalculateStopCards.call(this, waypoints, routeStats, selectedAircraft, weather, options);
    }
    
    // CRITICAL FIX: Filter out navigation waypoints
    const landingStops = waypoints.filter(wp => {
      const isLandingStop = 
        wp.pointType === 'LANDING_STOP' || // New explicit type
        (!wp.pointType && !wp.isWaypoint); // Fallback for backward compatibility
      
      return isLandingStop;
    });
    
    console.log(`🛠️ Filtered out waypoints: ${waypoints.length - landingStops.length} navigation waypoints removed, ${landingStops.length} landing stops remain`);
    
    // If all waypoints are navigation waypoints (no landing stops), we need to keep at least start and end
    if (landingStops.length < 2 && waypoints.length >= 2) {
      console.log('🛠️ Route only contains navigation waypoints, using first and last as landing stops');
      
      // Use first and last waypoints as landing stops
      landingStops.push({...waypoints[0], pointType: 'LANDING_STOP', isWaypoint: false, type: 'STOP'});
      
      if (waypoints.length > 1) {
        landingStops.push({...waypoints[waypoints.length - 1], pointType: 'LANDING_STOP', isWaypoint: false, type: 'STOP'});
      }
      
      console.log(`🛠️ Added first and last waypoints as landing stops: ${landingStops.length} stops`);
    }
    
    // Call the original method with only landing stops
    return originalCalculateStopCards.call(this, landingStops, routeStats, selectedAircraft, weather, options);
  };
  
  console.log('🛠️ Successfully enhanced StopCardCalculator to filter navigation waypoints');
  return true;
}

/**
 * Setup the waypoint mode tracking to ensure the global flag is consistently set
 */
function setupWaypointModeTracking() {
  console.log('🛠️ Setting up waypoint mode tracking...');
  
  // Create a more reliable global flag setter
  window.setWaypointMode = function(active) {
    console.log(`🛠️ Setting global waypoint mode to: ${active ? 'ACTIVE' : 'INACTIVE'}`);
    window.isWaypointModeActive = active;
    
    // Update the UI status to confirm mode
    if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `${active ? 'Navigation Waypoint' : 'Landing Stop'} mode activated.`,
        active ? 'info' : 'success',
        5000 // Show for 5 seconds
      );
    }
    
    // Add a visual indicator to the body so CSS can target it
    if (document.body) {
      if (active) {
        document.body.setAttribute('data-waypoint-mode', 'active');
      } else {
        document.body.removeAttribute('data-waypoint-mode');
      }
    }
    
    return active;
  };
  
  // Monitor DOM for waypoint mode buttons and attach listeners
  const observeDOM = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const waypointButtons = document.querySelectorAll('[data-waypoint-mode-button], button.waypointModeActive');
          waypointButtons.forEach(button => {
            if (!button.hasAttribute('data-waypoint-listener')) {
              button.setAttribute('data-waypoint-listener', 'true');
              button.addEventListener('click', () => {
                const isActive = button.classList.contains('active');
                window.setWaypointMode(isActive);
                console.log(`🛠️ Waypoint mode button clicked, mode now: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  };
  
  // Start observing DOM changes
  setTimeout(observeDOM, 1000);
  
  console.log('🛠️ Waypoint mode tracking setup complete');
  return true;
}

/**
 * Add CSS styles to visually distinguish between waypoints and stops
 */
function addWaypointStyles() {
  console.log('🛠️ Adding waypoint vs. stop visual styles...');
  
  if (document.getElementById('waypoint-type-styles')) {
    console.log('🛠️ Waypoint styles already exist');
    return true;
  }
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'waypoint-type-styles';
  styleSheet.innerHTML = `
    /* Style for navigation waypoints in route list */
    .waypoint-item[data-point-type="NAVIGATION_WAYPOINT"],
    .waypoint-item.navigation-point {
      background-color: rgba(255, 204, 0, 0.1);
      border-left: 3px solid #FFCC00;
    }
    
    /* Style for landing stops in route list */
    .waypoint-item[data-point-type="LANDING_STOP"],
    .waypoint-item.landing-stop {
      background-color: rgba(255, 65, 54, 0.05);
      border-left: 3px solid #FF4136;
    }
    
    /* Icons for different point types */
    .waypoint-item[data-point-type="NAVIGATION_WAYPOINT"] .waypoint-icon:before,
    .waypoint-item.navigation-point .waypoint-icon:before {
      content: "✈️";
    }
    
    .waypoint-item[data-point-type="LANDING_STOP"] .waypoint-icon:before,
    .waypoint-item.landing-stop .waypoint-icon:before {
      content: "🛬";
    }
    
    /* Make waypointModeActive button more visible when active */
    button[data-waypoint-mode-button].active,
    .waypoint-mode-toggle.active,
    button.waypointModeActive.active {
      background-color: #FFCC00 !important;
      color: #333 !important;
      font-weight: bold !important;
      box-shadow: 0 0 5px rgba(255, 204, 0, 0.7) !important;
    }
    
    /* Full app waypoint mode indicator */
    body[data-waypoint-mode="active"] .route-stats-card {
      border-top: 2px solid #FFCC00;
    }
    
    body[data-waypoint-mode="active"] .route-stats-header::after {
      content: "WAYPOINT MODE";
      position: absolute;
      top: 5px;
      right: 10px;
      font-size: 10px;
      background-color: #FFCC00;
      color: #333;
      padding: 2px 5px;
      border-radius: 3px;
      font-weight: bold;
    }
    
    /* Make waypoint markers look distinct with yellow color */
    .mapboxgl-marker[data-marker-type="waypoint"] {
      filter: drop-shadow(0 0 2px rgba(255, 204, 0, 0.9));
    }
    
    /* Add a subtle glow to stop markers with red color */
    .mapboxgl-marker[data-marker-type="stop"] {
      filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
    }
    
    /* Style the popups differently based on type */
    .waypoint-popup .mapboxgl-popup-content {
      border-left: 3px solid #FFCC00;
    }
    
    .stop-popup .mapboxgl-popup-content {
      border-left: 3px solid #FF4136;
    }
  `;
  
  document.head.appendChild(styleSheet);
  console.log('🛠️ Added waypoint styles to document');
  return true;
}

/**
 * Main function to apply all fixes
 */
function applyAllFixes() {
  console.log('🛠️ Applying all waypoint vs. stop distinction fixes...');
  
  // Fix 1: Enhance WaypointManager
  const waypointManagerFixed = enhanceWaypointManager();
  
  // Fix 2: Enhance ComprehensiveFuelCalculator
  const fuelCalculatorFixed = enhanceComprehensiveFuelCalculator();
  
  // Fix 3: Enhance StopCardCalculator
  const stopCardCalculatorFixed = enhanceStopCardCalculator();
  
  // Fix 4: Setup waypoint mode tracking
  const waypointModeTrackingSetup = setupWaypointModeTracking();
  
  // Fix 5: Add visual styles
  const stylesAdded = addWaypointStyles();
  
  // Report results
  console.log('🛠️ Fix application results:', {
    waypointManagerFixed,
    fuelCalculatorFixed,
    stopCardCalculatorFixed,
    waypointModeTrackingSetup,
    stylesAdded
  });
  
  const allFixesApplied = waypointManagerFixed && 
                          fuelCalculatorFixed && 
                          stopCardCalculatorFixed && 
                          waypointModeTrackingSetup && 
                          stylesAdded;
  
  if (allFixesApplied) {
    console.log('✅ All waypoint vs. stop distinction fixes have been successfully applied!');
    window.LoadingIndicator?.updateStatusIndicator(
      'Waypoint vs. Landing Stop fixes successfully applied!',
      'success',
      5000
    );
    
    // Update the fix status in the debug monitor
    if (window.updateFixStatus) {
      window.updateFixStatus('READY', 'Waypoint/Stop fix applied successfully');
    }
  } else {
    console.error('❌ Some fixes could not be applied. See logs for details.');
    window.LoadingIndicator?.updateStatusIndicator(
      'Some waypoint fixes could not be applied. Check console for details.',
      'error',
      8000
    );
    
    // Update the fix status in the debug monitor
    if (window.updateFixStatus) {
      window.updateFixStatus('PARTIAL', 'Some fixes could not be applied');
    }
  }
  
  return allFixesApplied;
}

// Export functions for direct use
window.applyWaypointVsStopFixes = applyAllFixes;
window.enhanceWaypointManager = enhanceWaypointManager;
window.enhanceComprehensiveFuelCalculator = enhanceComprehensiveFuelCalculator;
window.enhanceStopCardCalculator = enhanceStopCardCalculator;
window.setupWaypointModeTracking = setupWaypointModeTracking;
window.addWaypointStyles = addWaypointStyles;

// Create a debug function to analyze the current waypoints
window.analyzeWaypoints = function() {
  if (!window.waypointManager) {
    console.error('waypointManager not found');
    return { error: 'waypointManager not found' };
  }
  
  const waypoints = window.waypointManager.getWaypoints();
  const analysis = {
    totalPoints: waypoints.length,
    navigationWaypoints: 0,
    landingStops: 0,
    unknown: 0,
    detailed: [],
    pointTypes: {}
  };
  
  waypoints.forEach((wp, idx) => {
    // Determine type using all available flags
    let pointType;
    if (wp.pointType) {
      pointType = wp.pointType;
    } else if (wp.isWaypoint === true) {
      pointType = 'NAVIGATION_WAYPOINT (implied)';
    } else if (wp.type === 'WAYPOINT') {
      pointType = 'NAVIGATION_WAYPOINT (from type)';
    } else if (wp.isWaypoint === false) {
      pointType = 'LANDING_STOP (implied)';
    } else if (wp.type === 'STOP') {
      pointType = 'LANDING_STOP (from type)';
    } else {
      pointType = 'UNKNOWN';
    }
    
    // Count by type
    if (pointType.includes('NAVIGATION_WAYPOINT')) {
      analysis.navigationWaypoints++;
    } else if (pointType.includes('LANDING_STOP')) {
      analysis.landingStops++;
    } else {
      analysis.unknown++;
    }
    
    // Add to type counts for reporting
    if (!analysis.pointTypes[pointType]) {
      analysis.pointTypes[pointType] = 0;
    }
    analysis.pointTypes[pointType]++;
    
    // Add detailed info
    analysis.detailed.push({
      index: idx,
      name: wp.name,
      pointType,
      explicitPointType: wp.pointType,
      isWaypoint: wp.isWaypoint === true ? 'YES' : 'NO',
      type: wp.type || 'UNKNOWN',
      coordinates: [wp.coords[0].toFixed(4), wp.coords[1].toFixed(4)]
    });
  });
  
  console.log('Waypoint Analysis:', analysis);
  
  // Check consistency of waypoint mode
  analysis.waypointModeInfo = {
    globalFlag: window.isWaypointModeActive === true ? 'ACTIVE' : 'INACTIVE',
    handlerEnabled: window.waypointHandler?.isEnabled() ? 'ENABLED' : 'DISABLED',
    bodyAttribute: document.body.hasAttribute('data-waypoint-mode') ? 'SET' : 'NOT SET',
    classList: document.body.classList.contains('waypoint-mode-active') ? 'ACTIVE CLASS' : 'NO CLASS'
  };
  
  return analysis;
};

// Run the fixes after a short delay
setTimeout(applyAllFixes, 500);

console.log('🛠️ Waypoint vs. stop distinction fix script loaded and ready');
