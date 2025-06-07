/**
 * immediate-stop-cards-fix.js
 * An immediate fix for StopCardCalculator issues
 */

// Create globally accessible StopCardCalculator without any delay
console.log('🚨 IMMEDIATE StopCards fix loading NOW');

// Create the calculator immediately
window.StopCardCalculator = {
  calculateStopCards: function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
    console.log('🚨 StopCardCalculator.calculateStopCards called with', 
      waypoints?.length || 0, 'waypoints');
    
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
      console.log('🚨 No waypoints provided to StopCardCalculator');
      return [];
    }
    
    if (!selectedAircraft) {
      console.log('🚨 No aircraft provided to StopCardCalculator');
      return [];
    }
    
    // Filter out navigation waypoints
    const landingStops = waypoints.filter(wp => 
      wp.pointType === 'LANDING_STOP' || // New type
      (!wp.pointType && !wp.isWaypoint) // Backward compatibility
    );
    
    console.log(`🚨 Found ${landingStops.length} landing stops out of ${waypoints.length} total waypoints`);
    
    // Create a basic stop card for each landing stop
    return landingStops.map((stop, index) => {
      return {
        id: stop.id || `stop_${index}`,
        name: stop.name || `Stop ${index + 1}`,
        coords: stop.coords,
        passengers: stop.passengers || 0,
        index: index,
        deckTime: 5, // Default deck time
        fuelBurn: routeStats?.fuelBurn || 0,
      };
    });
  }
};

// Create a global function for easy access
window.calculateStopCards = function(waypoints, routeStats, selectedAircraft, weather, options) {
  console.log('🚨 Global calculateStopCards called');
  
  // Ensure parameters are valid
  if (!waypoints) {
    console.warn('🚨 No waypoints provided to global calculateStopCards');
    return [];
  }
  
  if (!selectedAircraft) {
    console.warn('🚨 No aircraft provided to global calculateStopCards');
    return [];
  }
  
  // Call the calculator
  try {
    return window.StopCardCalculator.calculateStopCards(
      waypoints, 
      routeStats, 
      selectedAircraft, 
      weather, 
      options
    );
  } catch (error) {
    console.error('🚨 Error in global calculateStopCards:', error);
    return [];
  }
};

// Set window flag to indicate this fix is loaded
window.stopCardFixApplied = true;

// Announce the fix is active
console.log('✅ Immediate StopCards fix is active!');
