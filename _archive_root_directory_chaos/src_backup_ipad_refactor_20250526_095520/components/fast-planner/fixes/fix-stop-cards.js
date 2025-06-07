/**
 * Fix to modify StopCardCalculator to properly distinguish between navigation waypoints and landing stops
 */

// Add a createStopCardCalculator function to create the calculator if it doesn't exist
function createStopCardCalculator() {
  // Create a basic StopCardCalculator if it doesn't exist
  if (!window.StopCardCalculator) {
    console.log('🛠️ Creating StopCardCalculator implementation');
    
    window.StopCardCalculator = {
      calculateStopCards: function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
        console.log('🛠️ StopCardCalculator.calculateStopCards called with', 
          waypoints?.length || 0, 'waypoints');
        
        if (!waypoints || !selectedAircraft) {
          console.log('🛠️ Missing required inputs for StopCardCalculator');
          return [];
        }
        
        // Filter out navigation waypoints
        const landingStops = waypoints.filter(wp => 
          wp.pointType === 'LANDING_STOP' || // New type
          (!wp.pointType && !wp.isWaypoint) // Backward compatibility
        );
        
        console.log(`🛠️ Found ${landingStops.length} landing stops`);
        
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
            // Other properties would be calculated based on route stats
          };
        });
      }
    };
    
    console.log('🛠️ Successfully created StopCardCalculator');
    return true;
  }
  
  return false;
}

// Now modify the StopCardCalculator to filter out navigation waypoints
function fixStopCardCalculator() {
  // Create a global reference to the original calculator function that we can patch
  window.originalCalculateStopCards = null;
  
  // Function to patch StopCardCalculator once it's loaded
  const patchCalculator = () => {
    // First try to create the calculator if it doesn't exist
    createStopCardCalculator();
// Check if StopCardCalculator is available
    if (!window.StopCardCalculator && 
        !window.ComprehensiveFuelCalculator &&
        typeof StopCardCalculator === 'undefined') {
      console.error('🛠️ StopCardCalculator not found on window or as module');
      
      // Create a basic implementation if not available
      window.StopCardCalculator = {
        calculateStopCards: function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
          console.warn('🛠️ Using default StopCardCalculator implementation');
          // Return empty array as fallback
          return [];
        }
      };
      
      console.log('🛠️ Created fallback StopCardCalculator');
      return true;
    }

    // Determine which object we're patching
    let calculatorObj;
    if (window.StopCardCalculator) {
      calculatorObj = window.StopCardCalculator;
    } else if (window.ComprehensiveFuelCalculator) {
      calculatorObj = window.ComprehensiveFuelCalculator;
    } else if (typeof StopCardCalculator !== 'undefined') {
      calculatorObj = StopCardCalculator;
    }

    if (!calculatorObj || !calculatorObj.calculateStopCards) {
      console.error('🛠️ calculateStopCards function not found');
      return false;
    }

    // Store the original function
    window.originalCalculateStopCards = calculatorObj.calculateStopCards;

    // Override the function
    calculatorObj.calculateStopCards = function(waypoints, routeStats, selectedAircraft, weather, options = {}) {
      console.log('🛠️ Enhanced StopCardCalculator called with waypoints:', waypoints?.length);

      // CRITICAL FIX: Filter out navigation waypoints
      const landingStops = waypoints ? waypoints.filter(wp => 
        wp.pointType === 'LANDING_STOP' || // New type
        (!wp.pointType && !wp.isWaypoint) // Backward compatibility
      ) : [];

      console.log(`🛠️ Filtered out waypoints: ${(waypoints?.length || 0) - landingStops.length} navigation waypoints removed, ${landingStops.length} landing stops remain`);

      // Call the original function with only landing stops
      try {
        return window.originalCalculateStopCards.call(calculatorObj, landingStops, routeStats, selectedAircraft, weather, options);
      } catch (error) {
        console.error('🛠️ Error in original calculateStopCards:', error);
        
        // Fallback: Create basic stop cards
        return landingStops.map((stop, index) => {
          return {
            id: stop.id || `stop_${index}`,
            name: stop.name || `Stop ${index + 1}`,
            coords: stop.coords,
            passengers: stop.passengers || 0,
            index: index,
            deckTime: 5,
            fuelBurn: routeStats?.fuelBurn || 0,
          };
        });
      }
    };

    console.log('🛠️ Successfully patched StopCardCalculator');
    return true;
  };

  // Set up a retry mechanism for StopCardCalculator
  let attempts = 0;
  const maxAttempts = 10;
  const retryInterval = 500; // ms

  const attemptPatch = () => {
    attempts++;
    console.log(`🛠️ Attempting to patch StopCardCalculator (attempt ${attempts}/${maxAttempts})...`);
    
    if (patchCalculator()) {
      return true;
    } else {
      if (attempts < maxAttempts) {
        setTimeout(attemptPatch, retryInterval);
      } else {
        console.error('🛠️ Failed to patch StopCardCalculator after maximum attempts');
        return false;
      }
    }
  };

  // Start the patching process
  createStopCardCalculator(); // Try to create it immediately
  return attemptPatch();
}

// Run the StopCardCalculator fix
setTimeout(fixStopCardCalculator, 1000);

// Fix RouteStatsCard to properly display the count of stops vs waypoints
function fixRouteStatsCard() {
  console.log('🛠️ Setting up RouteStatsCard fix...');

  // Ensure StopCardCalculator is globally available by exporting a function
  if (!window.calculateStopCards) {
    window.calculateStopCards = function(waypoints, routeStats, selectedAircraft, weather, options) {
      // Ensure StopCardCalculator exists
      if (!window.StopCardCalculator) {
        createStopCardCalculator();
      }
      
      // Call the calculator
      if (window.StopCardCalculator && window.StopCardCalculator.calculateStopCards) {
        try {
          return window.StopCardCalculator.calculateStopCards(waypoints, routeStats, selectedAircraft, weather, options);
        } catch (error) {
          console.error('Error calling StopCardCalculator:', error);
          return [];
        }
      } else {
        console.error('StopCardCalculator not available');
        return [];
      }
    };
    console.log('🛠️ Added global calculateStopCards function');
  }

  // Add CSS to style different waypoint types differently in the route list
  const addWaypointCSS = () => {
    if (document.getElementById('waypoint-type-styles')) {
      return; // Already added
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
      .waypoint-mode-toggle.active {
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
    `;
    
    document.head.appendChild(styleSheet);
    console.log('🛠️ Added waypoint type styles to document');
  };

  // Modify the RouteStatsCard component to properly count landing stops
  const patchRouteStatsCard = () => {
    // Add MutationObserver to modify the RouteStatsCard display
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Find all waypoint list elements
          const waypointLists = document.querySelectorAll('.waypoints-list');
          waypointLists.forEach(list => {
            // Process each waypoint item to add the proper styling
            const waypointItems = list.querySelectorAll('.waypoint-item');
            waypointItems.forEach(item => {
              // Check if this item is already processed
              if (!item.hasAttribute('data-processed')) {
                item.setAttribute('data-processed', 'true');
                
                // Determine if this is a navigation waypoint or landing stop
                const isWaypoint = item.querySelector('.waypoint-data')?.dataset?.isWaypoint === 'true' ||
                                  item.querySelector('[data-is-waypoint="true"]');
                
                // Set the point type data attribute
                item.setAttribute('data-point-type', isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP');
                
                // Add the appropriate class
                if (isWaypoint) {
                  item.classList.add('navigation-point');
                } else {
                  item.classList.add('landing-stop');
                }
                
                // Add icon element if it doesn't exist
                if (!item.querySelector('.waypoint-icon')) {
                  const nameElement = item.querySelector('.waypoint-name');
                  if (nameElement) {
                    const iconElement = document.createElement('span');
                    iconElement.className = 'waypoint-icon';
                    nameElement.parentNode.insertBefore(iconElement, nameElement);
                  }
                }
              }
            });
          });
          
          // Find RouteStatsCard and update stops count
          const routeStatsCards = document.querySelectorAll('.route-stats-card');
          routeStatsCards.forEach(card => {
            // Find the stops count element
            const stopsElement = Array.from(card.querySelectorAll('.stats-item')).find(item => 
              item.textContent.includes('Stops:')
            );
            
            if (stopsElement) {
              // Check if it's already processed
              if (!stopsElement.hasAttribute('data-processed')) {
                stopsElement.setAttribute('data-processed', 'true');
                
                // Find the value element
                const valueElement = stopsElement.querySelector('.value');
                if (valueElement) {
                  // Get the current displayed count
                  const currentCount = parseInt(valueElement.textContent, 10);
                  
                  // Count only landing stops from waypoints
                  const landingStops = Array.from(document.querySelectorAll('.waypoint-item')).filter(item => 
                    !item.classList.contains('navigation-point')
                  ).length;
                  
                  // Update the display to show only landing stops
                  if (!isNaN(landingStops) && landingStops !== currentCount) {
                    valueElement.textContent = landingStops;
                  }
                }
              }
            }
          });
        }
      });
    });
    
    // Start observing the document
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('🛠️ Applied RouteStatsCard dynamic fixes');
    return true;
  };

  // Always add the CSS, even if we can't patch the component
  addWaypointCSS();
  
  // Set up the DOM observer
  return patchRouteStatsCard();
}

// Run the RouteStatsCard fix
setTimeout(fixRouteStatsCard, 1500);

// Announce the stop cards fix is active
console.log('✅ Stop Cards distinction fix is active!');
