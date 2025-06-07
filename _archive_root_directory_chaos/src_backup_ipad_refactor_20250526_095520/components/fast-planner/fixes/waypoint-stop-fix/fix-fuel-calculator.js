/**
 * fix-fuel-calculator.js
 * 
 * This fixes the issue with ComprehensiveFuelCalculator using all waypoints for calculations
 * instead of properly filtering out navigation-only waypoints.
 */

// Function to patch the ComprehensiveFuelCalculator module directly
function patchComprehensiveFuelCalculator() {
  console.log('🛠️ Attempting to patch ComprehensiveFuelCalculator...');
  
  // Try to get access to the calculator
  const calculator = window.ComprehensiveFuelCalculator;
  
  if (!calculator) {
    console.error('❌ ComprehensiveFuelCalculator not found on window');
    return false;
  }
  
  if (!calculator.calculateAllFuelData) {
    console.error('❌ calculateAllFuelData method not found on ComprehensiveFuelCalculator');
    return false;
  }
  
  // Save the original method
  const originalCalculateAllFuelData = calculator.calculateAllFuelData;
  
  // Check if it's already been patched
  if (calculator._waypoint_filter_patched) {
    console.log('✅ ComprehensiveFuelCalculator already patched, skipping');
    return true;
  }
  
  // Override the method with our filtered version
  calculator.calculateAllFuelData = function(waypoints, selectedAircraft, flightSettings, weather, routeStats) {
    console.log('🧪 Enhanced ComprehensiveFuelCalculator.calculateAllFuelData called');
    
    // Return early if no waypoints
    if (!waypoints || waypoints.length < 2) {
      console.log('🧪 No waypoints or insufficient waypoints, skipping filtering');
      return originalCalculateAllFuelData.call(this, waypoints, selectedAircraft, flightSettings, weather, routeStats);
    }
    
    // Create a copy of waypoints to keep all for visualization
    const allWaypoints = [...waypoints];
    
    // CRITICAL FIX: Filter waypoints to only include landing stops for calculations
    const landingStopsOnly = waypoints.filter(wp => {
      // Filter based on the new pointType enum
      if (wp.pointType === 'LANDING_STOP') {
        return true;
      }
      
      // Backward compatibility: check isWaypoint flag (false/undefined = landing stop)
      if (wp.pointType === undefined && !wp.isWaypoint) {
        return true;
      }
      
      // Otherwise, it's a navigation waypoint - exclude from calculations
      return false;
    });
    
    // Log debug info
    console.log(`🧪 Filtered waypoints: ${waypoints.length} total, ${landingStopsOnly.length} landing stops, ${waypoints.length - landingStopsOnly.length} navigation waypoints`);
    
    if (landingStopsOnly.length < 2 && waypoints.length >= 2) {
      console.warn('⚠️ WARNING: Route has only navigation waypoints (less than 2 landing stops). Calculations may not be accurate.');
      
      // Show notice to user
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Route consists mostly of navigation waypoints. Add landing stops for accurate fuel calculations.',
          'warning',
          8000
        );
      }
    }
    
    // Calculate fuel data using landing stops only for calculations
    const result = originalCalculateAllFuelData.call(this, landingStopsOnly, selectedAircraft, flightSettings, weather, routeStats);
    
    // After calculation, set a flag on the result indicating filtering was performed
    if (result && result.enhancedResults) {
      result.enhancedResults.filteredWaypoints = true;
      result.enhancedResults.totalWaypoints = waypoints.length;
      result.enhancedResults.landingStops = landingStopsOnly.length;
      result.enhancedResults.navigationWaypoints = waypoints.length - landingStopsOnly.length;
    }
    
    return result;
  };
  
  // Set a flag so we know it's been patched
  calculator._waypoint_filter_patched = true;
  
  console.log('✅ Successfully patched ComprehensiveFuelCalculator to filter navigation waypoints');
  return true;
}

// Function to verify the fix
function verifyComprehensiveFuelCalculatorFix() {
  console.log('🔍 Verifying ComprehensiveFuelCalculator patch...');
  
  const calculator = window.ComprehensiveFuelCalculator;
  
  if (!calculator) {
    console.error('❌ ComprehensiveFuelCalculator not found on window');
    return false;
  }
  
  if (!calculator._waypoint_filter_patched) {
    console.error('❌ ComprehensiveFuelCalculator patch flag not found');
    return false;
  }
  
  // Try to make a test calculation to verify
  // Create some test waypoints - one landing stop, one navigation waypoint
  const testWaypoints = [
    {
      id: 'test1',
      name: 'Test Landing Stop',
      coords: [0, 0],
      pointType: 'LANDING_STOP',
      isWaypoint: false
    },
    {
      id: 'test2',
      name: 'Test Navigation Waypoint',
      coords: [1, 1],
      pointType: 'NAVIGATION_WAYPOINT',
      isWaypoint: true
    },
    {
      id: 'test3',
      name: 'Test Landing Stop 2',
      coords: [2, 2],
      pointType: 'LANDING_STOP',
      isWaypoint: false
    }
  ];
  
  // Test aircraft
  const testAircraft = {
    registration: 'TEST',
    modelType: 'TEST',
    cruiseSpeed: 150,
    fuelBurn: 500
  };
  
  // Test settings
  const testSettings = {
    passengerWeight: 200,
    taxiFuel: 50,
    contingencyFuelPercent: 10,
    reserveFuel: 500,
    deckTimePerStop: 5,
    deckFuelFlow: 400
  };
  
  // Wrap in try/catch to avoid breaking anything
  try {
    // Calculate with our test data
    const result = calculator.calculateAllFuelData(
      testWaypoints, 
      testAircraft, 
      testSettings, 
      { windSpeed: 0, windDirection: 0 }
    );
    
    // Verify result has our added properties
    if (!result || !result.enhancedResults || !result.enhancedResults.filteredWaypoints) {
      console.error('❌ Test calculation did not show filtering flag');
      return false;
    }
    
    // Verify filtering counts
    if (result.enhancedResults.totalWaypoints !== 3 || 
        result.enhancedResults.landingStops !== 2 ||
        result.enhancedResults.navigationWaypoints !== 1) {
      console.error('❌ Test calculation shows incorrect filtering counts');
      return false;
    }
    
    console.log('✅ Verification succeeded! ComprehensiveFuelCalculator is correctly filtering navigation waypoints');
    return true;
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return false;
  }
}

// Function to also patch FuelIntegration for safety
function patchFuelIntegration() {
  console.log('🛠️ Attempting to patch FuelIntegration...');
  
  // Try to get access to the calculator
  const fuelIntegration = window.FuelIntegration;
  
  if (!fuelIntegration) {
    console.warn('⚠️ FuelIntegration not found on window, skipping');
    return false;
  }
  
  if (!fuelIntegration.calculateFuelRequirements) {
    console.warn('⚠️ calculateFuelRequirements method not found on FuelIntegration, skipping');
    return false;
  }
  
  // Save the original method
  const originalCalculateFuelRequirements = fuelIntegration.calculateFuelRequirements;
  
  // Check if it's already been patched
  if (fuelIntegration._waypoint_filter_patched) {
    console.log('✅ FuelIntegration already patched, skipping');
    return true;
  }
  
  // Override the method with our filtered version
  fuelIntegration.calculateFuelRequirements = function(waypoints, selectedAircraft, weather, options) {
    console.log('🧪 Enhanced FuelIntegration.calculateFuelRequirements called');
    
    // Return early if no waypoints
    if (!waypoints || waypoints.length < 2) {
      console.log('🧪 No waypoints or insufficient waypoints, skipping filtering');
      return originalCalculateFuelRequirements.call(this, waypoints, selectedAircraft, weather, options);
    }
    
    // CRITICAL FIX: Filter waypoints to only include landing stops for calculations
    const landingStopsOnly = waypoints.filter(wp => {
      // Filter based on the new pointType enum
      if (wp.pointType === 'LANDING_STOP') {
        return true;
      }
      
      // Backward compatibility: check isWaypoint flag (false/undefined = landing stop)
      if (wp.pointType === undefined && !wp.isWaypoint) {
        return true;
      }
      
      // Otherwise, it's a navigation waypoint - exclude from calculations
      return false;
    });
    
    // Log debug info
    console.log(`🧪 Filtered waypoints: ${waypoints.length} total, ${landingStopsOnly.length} landing stops, ${waypoints.length - landingStopsOnly.length} navigation waypoints`);
    
    // Calculate fuel data using landing stops only for calculations
    const result = originalCalculateFuelRequirements.call(this, landingStopsOnly, selectedAircraft, weather, options);
    
    return result;
  };
  
  // Set a flag so we know it's been patched
  fuelIntegration._waypoint_filter_patched = true;
  
  console.log('✅ Successfully patched FuelIntegration to filter navigation waypoints');
  return true;
}

// Function to patch the RouteCalculator
function patchRouteCalculator() {
  console.log('🛠️ Attempting to patch RouteCalculator...');
  
  // Try to get access to the calculator
  const routeCalculator = window.routeCalculator;
  
  if (!routeCalculator) {
    console.warn('⚠️ RouteCalculator not found on window, skipping');
    return false;
  }
  
  if (!routeCalculator.calculateRouteStats) {
    console.warn('⚠️ calculateRouteStats method not found on RouteCalculator, skipping');
    return false;
  }
  
  // Save the original method
  const originalCalculateRouteStats = routeCalculator.calculateRouteStats;
  
  // Check if it's already been patched
  if (routeCalculator._waypoint_filter_patched) {
    console.log('✅ RouteCalculator already patched, skipping');
    return true;
  }
  
  // IMPORTANT: For the route calculator, we use ALL waypoints for the route geometry
  // but need to handle the stop counting correctly
  routeCalculator.calculateRouteStats = function(coordinates, options = {}) {
    console.log('🧪 Enhanced RouteCalculator.calculateRouteStats called');
    
    // Call original method to get route stats
    const result = originalCalculateRouteStats.call(this, coordinates, options);
    
    // If not waypoints or result, return as-is
    if (!options.waypoints || !result) {
      return result;
    }
    
    // Count landing stops correctly for the result
    const landingStops = (options.waypoints || []).filter(wp => {
      // Filter based on the new pointType enum
      if (wp.pointType === 'LANDING_STOP') {
        return true;
      }
      
      // Backward compatibility: check isWaypoint flag (false/undefined = landing stop)
      if (wp.pointType === undefined && !wp.isWaypoint) {
        return true;
      }
      
      // Otherwise, it's a navigation waypoint - exclude from count
      return false;
    });
    
    // Modify the stopCount result
    if (result) {
      result.stopCount = landingStops.length;
      result.totalWaypoints = options.waypoints.length;
      result.landingStops = landingStops.length;
      result.navigationWaypoints = options.waypoints.length - landingStops.length;
    }
    
    return result;
  };
  
  // Set a flag so we know it's been patched
  routeCalculator._waypoint_filter_patched = true;
  
  console.log('✅ Successfully patched RouteCalculator to handle navigation waypoints');
  return true;
}

// Run all patches with retry mechanism
function applyAllPatches() {
  console.log('🔄 Starting to apply all waypoint vs. stop patches...');
  
  // Attempt to patch all components
  function attemptPatches() {
    const comprehensiveFuelCalculatorPatched = patchComprehensiveFuelCalculator();
    const fuelIntegrationPatched = patchFuelIntegration();
    const routeCalculatorPatched = patchRouteCalculator();
    
    // If all patches are successful, return true
    if (comprehensiveFuelCalculatorPatched && fuelIntegrationPatched && routeCalculatorPatched) {
      console.log('🎉 All waypoint vs. stop patches successfully applied!');
      
      // Verify the fixes
      verifyComprehensiveFuelCalculatorFix();
      
      return true;
    }
    
    // If not all patches are successful, return false
    console.log('⚠️ Not all patches were successful, will retry:');
    console.log(`  - ComprehensiveFuelCalculator: ${comprehensiveFuelCalculatorPatched ? '✅' : '❌'}`);
    console.log(`  - FuelIntegration: ${fuelIntegrationPatched ? '✅' : '❌'}`);
    console.log(`  - RouteCalculator: ${routeCalculatorPatched ? '✅' : '❌'}`);
    
    return false;
  }
  
  // Retry mechanism
  let attempts = 0;
  const maxAttempts = 10;
  const retryInterval = 1000; // ms
  
  function attemptWithRetry() {
    attempts++;
    console.log(`🔄 Attempt ${attempts}/${maxAttempts} to apply patches...`);
    
    if (attemptPatches()) {
      // If successful, update UI
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Waypoint vs. Stop fixes successfully applied', 'success', 5000);
      }
      return true;
    } else if (attempts < maxAttempts) {
      // If not successful and attempts remaining, retry
      setTimeout(attemptWithRetry, retryInterval);
    } else {
      // If max attempts reached, give up
      console.error('❌ Failed to apply all patches after maximum attempts');
      
      // Update UI with failure message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Some waypoint vs. stop fixes failed to apply. Refresh the page and try again.', 'error', 8000);
      }
      
      return false;
    }
  }
  
  // Start the retry process
  return attemptWithRetry();
}

// Make the fix function available globally
window.manuallyApplyWaypointStopFix = applyAllPatches;

// Run the patches after a short delay to ensure all modules are loaded
setTimeout(applyAllPatches, 2000);

// Announce module is active
console.log('🚀 Waypoint vs. Stop fix-fuel-calculator module loaded');
