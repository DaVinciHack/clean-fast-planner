// ensure-waypoint-usage.js
//
// This script ensures that all waypoints (both navigation and landing stops) 
// are properly used for distance and time calculations, while only landing 
// stops are used for stop cards.

// Run this after a delay to ensure all components are loaded
setTimeout(() => {
  console.log('🔄 Applying final fix to ensure all waypoints are used for route calculations...');
  
  // Create a patch function for ComprehensiveFuelCalculator
  const patchComprehensiveFuelCalculator = () => {
    if (!window.ComprehensiveFuelCalculator) {
      console.error('❌ Cannot patch: ComprehensiveFuelCalculator not found');
      return false;
    }
    
    // Store the original function
    const originalCalculateAllFuelData = window.ComprehensiveFuelCalculator.calculateAllFuelData;
    
    // Create a patched version
    window.ComprehensiveFuelCalculator.calculateAllFuelData = function(waypoints, selectedAircraft, flightSettings, weather, routeStats) {
      console.log('🔄 Patched ComprehensiveFuelCalculator running with:', {
        waypointsCount: waypoints?.length,
        hasAircraft: !!selectedAircraft
      });
      
      if (!waypoints || waypoints.length < 2 || !selectedAircraft || !flightSettings) {
        console.warn('ComprehensiveFuelCalculator: Missing required inputs for calculation.');
        return { enhancedResults: null, stopCards: [] };
      }
      
      // Identify landing stops vs navigation waypoints
      const landingStops = waypoints.filter(wp => {
        const isNavigationWaypoint = 
          wp.pointType === 'NAVIGATION_WAYPOINT' || 
          wp.isWaypoint === true || 
          wp.type === 'WAYPOINT';
        
        return !isNavigationWaypoint;
      });
      
      console.log(`🔄 Route has ${waypoints.length} total points: ${landingStops.length} landing stops and ${waypoints.length - landingStops.length} navigation waypoints`);
      
      // Ensure we have at least first and last as landing stops if needed
      let stopsToUse = landingStops;
      if (landingStops.length === 0 && waypoints.length >= 2) {
        console.log('🔄 No landing stops found, using first and last waypoints as landing stops');
        stopsToUse = [waypoints[0]];
        if (waypoints.length > 1) {
          stopsToUse.push(waypoints[waypoints.length - 1]);
        }
      }
      
      // CRITICAL: Ensure numeric settings (defensive)
      const numericSettings = {
        passengerWeight: Number(flightSettings.passengerWeight || 0),
        taxiFuel: Number(flightSettings.taxiFuel || 0),
        contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent || 0),
        reserveFuel: Number(flightSettings.reserveFuel || 0),
        deckTimePerStop: Number(flightSettings.deckTimePerStop || 0),
        deckFuelFlow: Number(flightSettings.deckFuelFlow || 0),
        cargoWeight: Number(flightSettings.cargoWeight || 0)
      };
      
      console.log('🔄 Using numeric settings:', numericSettings);
      
      // CRITICAL FIX: Use ALL waypoints for route calculations
      // This ensures route distance includes all segments
      const allWaypointsResults = window.FuelIntegration.calculateFuelRequirements(
        waypoints, // Use ALL waypoints for route distance
        selectedAircraft,
        weather,
        numericSettings
      );
      
      console.log('🔄 Calculated route using ALL waypoints:', {
        distance: allWaypointsResults?.totalDistance,
        time: allWaypointsResults?.estimatedTime
      });
      
      // Generate stop cards using only landing stops
      const stopCards = window.StopCardCalculator.calculateStopCards(
        stopsToUse, // Only landing stops for stop cards
        allWaypointsResults, // But use the route stats from all waypoints
        selectedAircraft,
        weather,
        numericSettings
      );
      
      console.log('🔄 Generated stop cards for landing stops only:', stopCards.length);
      
      // Return results
      return {
        enhancedResults: allWaypointsResults,
        stopCards: stopCards
      };
    };
    
    console.log('✅ Successfully patched ComprehensiveFuelCalculator');
    return true;
  };
  
  // Apply the patches
  const patchResult = patchComprehensiveFuelCalculator();
  
  // Show notification of success
  if (patchResult && window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
    window.LoadingIndicator.updateStatusIndicator(
      'Fixed: Navigation waypoints now included in route distance/time calculations!',
      'success',
      5000
    );
  }
}, 3000);

console.log('⏳ Final waypoint usage fix loaded and waiting to apply...');
