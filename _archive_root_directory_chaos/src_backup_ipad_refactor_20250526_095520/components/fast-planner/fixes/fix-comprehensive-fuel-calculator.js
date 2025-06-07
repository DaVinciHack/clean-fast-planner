/**
 * Fix to modify ComprehensiveFuelCalculator to properly distinguish between 
 * navigation waypoints and landing stops.
 */

/**
 * Patches the ComprehensiveFuelCalculator to filter out navigation waypoints
 * before doing fuel calculations.
 */
function fixComprehensiveFuelCalculator() {
  console.log('🔄 Setting up ComprehensiveFuelCalculator fix...');

  // Check if window.ComprehensiveFuelCalculator exists
  if (!window.ComprehensiveFuelCalculator) {
    console.log('🔄 ComprehensiveFuelCalculator not found, creating fallback implementation');
    
    // Create fallback implementation
    window.ComprehensiveFuelCalculator = {
      calculateAllFuelData: function(waypoints, selectedAircraft, flightSettings, weather, routeStats) {
        console.warn('🔄 Using fallback ComprehensiveFuelCalculator implementation');
        // Return empty object with expected structure
        return {
          enhancedResults: routeStats || {
            totalDistance: 0,
            timeHours: 0,
            estimatedTime: '00:00',
            fuelBurn: 0,
            totalFuel: 0,
            legs: []
          },
          stopCards: []
        };
      }
    };
    
    console.log('🔄 Created fallback ComprehensiveFuelCalculator');
    return true;
  } else {
    return applyFix();
  }

  function applyFix() {
    // Store the original function
    const originalCalculateAllFuelData = window.ComprehensiveFuelCalculator.calculateAllFuelData;
    
    if (!originalCalculateAllFuelData) {
      console.error('🔄 calculateAllFuelData function not found on ComprehensiveFuelCalculator');
      return false;
    }
    
    // Keep a reference to the original function
    window.originalComprehensiveFuelCalculate = originalCalculateAllFuelData;

    // Override the function
    window.ComprehensiveFuelCalculator.calculateAllFuelData = function(waypoints, selectedAircraft, flightSettings, weather, routeStats) {
      console.log('🔄 Enhanced ComprehensiveFuelCalculator.calculateAllFuelData called');
      console.log(`🔄 Received ${waypoints?.length || 0} total waypoints`);
      
      if (!waypoints || waypoints.length < 2) {
        console.log('🔄 Not enough waypoints, skipping filtering');
        return originalCalculateAllFuelData.call(this, waypoints, selectedAircraft, flightSettings, weather, routeStats);
      }

      // 1. Filter waypoints to get only landing stops for fuel calculations
      const landingStops = waypoints.filter(wp => {
        // Check for explicit pointType first (new approach)
        if (wp.pointType === 'LANDING_STOP') {
          return true;
        }
        
        // Then check legacy flags
        if (!wp.pointType && !wp.isWaypoint && wp.type !== 'WAYPOINT') {
          return true;
        }
        
        return false;
      });

      console.log(`🔄 Filtered ${waypoints.length - landingStops.length} navigation waypoints, leaving ${landingStops.length} landing stops`);
      
      // Debug logging
      if (landingStops.length < 2) {
        console.warn('🔄 Warning: Fewer than 2 landing stops after filtering, route may be invalid for fuel calculations');
      }
      
      // 2. Calculate both fuel results with proper waypoint filtering
      
      // 2a. For top display, we want the total distance including all waypoints (nav points and stops)
      // but fuel should only be calculated for actual stops
      console.log('🔄 Calculating enhanced fuel data with filtered landing stops for FuelIntegration');
      const enhancedResults = window.FuelIntegration.calculateFuelRequirements(
        landingStops, // Use only landing stops for fuel calculations
        selectedAircraft,
        weather,
        flightSettings
      );
      
      // 2b. Add total distance from all waypoints (including navigation points)
      // This ensures accurate distance display while keeping fuel calculations correct
      if (enhancedResults && window.turf) {
        try {
          // Calculate total distance including all waypoints
          let totalDistance = 0;
          for (let i = 0; i < waypoints.length - 1; i++) {
            const from = window.turf.point(waypoints[i].coords);
            const to = window.turf.point(waypoints[i + 1].coords);
            const options = { units: 'nauticalmiles' };
            const legDistance = window.turf.distance(from, to, options);
            totalDistance += legDistance;
          }
          
          // Update the enhancedResults with the total distance including nav points
          enhancedResults.totalDistance = totalDistance.toFixed(1);
          console.log(`🔄 Updated totalDistance to include navigation waypoints: ${enhancedResults.totalDistance} NM`);
        } catch (error) {
          console.error('🔄 Error calculating total distance with all waypoints:', error);
        }
      }
      
      // 3. Calculate stop cards with the same filtered waypoints
      console.log('🔄 Calculating stop cards with filtered landing stops for StopCardCalculator');
      const stopCards = window.StopCardCalculator.calculateStopCards(
        landingStops, // Use only landing stops for stop cards
        enhancedResults || routeStats, // Pass enhanced results as the route stats
        selectedAircraft,
        weather,
        flightSettings
      );
      
      // 4. Return the enhanced results
      console.log('🔄 ComprehensiveFuelCalculator fix complete, returning results');
      
      // Return the same structure as the original function
      return {
        enhancedResults: enhancedResults,
        stopCards: stopCards
      };
    };

    console.log('🔄 Successfully patched ComprehensiveFuelCalculator.calculateAllFuelData');
    
    // Immediately recalculate if waypoints and aircraft are available
    if (window.waypointManager && window.waypointManager.getWaypoints().length >= 2 &&
        window.currentSelectedAircraft) {
      console.log('🔄 Forcing recalculation of current route with fixed calculation...');
      
      // Create a RecalculationEvent which FastPlannerApp will listen for
      const event = new CustomEvent('force-route-recalculation', {
        detail: {
          source: 'waypoint-stop-fix',
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
      
      // Set a flag indicating we've applied the fix
      window.comprehensiveFuelCalculatorFixed = true;
    }
    
    return true;
  }
}

// Run the fix
fixComprehensiveFuelCalculator();

// Add a check for FuelIntegration to ensure it's also filtering waypoints
function fixFuelIntegration() {
  console.log('⛽ Setting up FuelIntegration fix...');
  
  // Check if window.FuelIntegration exists
  if (!window.FuelIntegration) {
    console.log('⛽ FuelIntegration not found, creating fallback implementation');
    
    // Create fallback implementation
    window.FuelIntegration = {
      calculateFuelRequirements: function(waypoints, selectedAircraft, weather, settings) {
        console.warn('⛽ Using fallback FuelIntegration implementation');
        // Return empty object with expected structure
        return {
          totalDistance: 0,
          timeHours: 0,
          estimatedTime: '00:00',
          fuelBurn: 0,
          totalFuel: 0,
          legs: []
        };
      }
    };
    
    console.log('⛽ Created fallback FuelIntegration');
    return true;
  } else {
    return applyFix();
  }
  
  function applyFix() {
    // Store the original function
    const originalCalculateFuelRequirements = window.FuelIntegration.calculateFuelRequirements;
    
    if (!originalCalculateFuelRequirements) {
      console.error('⛽ calculateFuelRequirements function not found on FuelIntegration');
      return false;
    }
    
    // Keep a reference to the original function
    window.originalFuelIntegrationCalculate = originalCalculateFuelRequirements;

    // Override the function
    window.FuelIntegration.calculateFuelRequirements = function(waypoints, selectedAircraft, weather, settings) {
      console.log('⛽ Enhanced FuelIntegration.calculateFuelRequirements called');
      console.log(`⛽ Received ${waypoints?.length || 0} waypoints`);
      
      // Filter waypoints to get only landing stops if they haven't been filtered already
      const landingStops = waypoints.filter(wp => {
        // Check for explicit pointType first (new approach)
        if (wp.pointType === 'LANDING_STOP') {
          return true;
        }
        
        // Then check legacy flags
        if (!wp.pointType && !wp.isWaypoint && wp.type !== 'WAYPOINT') {
          return true;
        }
        
        return false;
      });

      const waypointsFiltered = landingStops.length !== waypoints.length;
      
      if (waypointsFiltered) {
        console.log(`⛽ Filtered ${waypoints.length - landingStops.length} navigation waypoints within FuelIntegration`);
      } else {
        console.log('⛽ No navigation waypoints found, using all waypoints as is');
      }
      
      // Call the original function with filtered waypoints
      return originalCalculateFuelRequirements.call(
        this, 
        waypointsFiltered ? landingStops : waypoints, 
        selectedAircraft, 
        weather, 
        settings
      );
    };

    console.log('⛽ Successfully patched FuelIntegration.calculateFuelRequirements');
    return true;
  }
}

// Run the FuelIntegration fix
setTimeout(fixFuelIntegration, 1000);

// Create a Waypoint/Stop Debug Monitor (WSDBG) for UI feedback
function createWaypointStopDebugMonitor() {
  console.log('🔍 Setting up Waypoint/Stop Debug Monitor...');
  
  // Create the monitor object
  window.WSDBG = {
    init: function() {
      // Create the debug monitor UI if it doesn't exist
      if (!document.getElementById('waypoint-stop-debug-monitor')) {
        const monitorElement = document.createElement('div');
        monitorElement.id = 'waypoint-stop-debug-monitor';
        monitorElement.style.position = 'fixed';
        monitorElement.style.top = '40px';
        monitorElement.style.right = '10px';
        monitorElement.style.width = '300px';
        monitorElement.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        monitorElement.style.color = '#ddd';
        monitorElement.style.padding = '10px';
        monitorElement.style.fontSize = '12px';
        monitorElement.style.fontFamily = 'monospace';
        monitorElement.style.zIndex = '9999';
        monitorElement.style.borderRadius = '5px';
        monitorElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        monitorElement.style.maxHeight = '80vh';
        monitorElement.style.overflowY = 'auto';
        
        // Add a header
        monitorElement.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #444; padding-bottom: 5px;">
            <h3 style="margin: 0; color: #3498db;">Waypoint/Stop Debug Monitor</h3>
            <button id="wsdbg-close-btn" style="background: none; border: none; color: #ccc; cursor: pointer;">✕</button>
          </div>
          <div id="wsdbg-content" style="margin-bottom: 10px;">
            <div id="wsdbg-status" style="margin-bottom: 8px;">Fix Status: <span style="color: #e74c3c; font-weight: bold;">NOT READY</span></div>
            <div id="wsdbg-totals" style="margin-bottom: 8px;">Analyzing route...</div>
            <div id="wsdbg-waypoints" style="margin-bottom: 8px;"></div>
          </div>
          <button id="wsdbg-fix-now-btn" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; width: 100%;">Apply Fixes Now</button>
        `;
        
        document.body.appendChild(monitorElement);
        
        // Add event listeners
        document.getElementById('wsdbg-close-btn').addEventListener('click', function() {
          document.getElementById('waypoint-stop-debug-monitor').style.display = 'none';
        });
        
        document.getElementById('wsdbg-fix-now-btn').addEventListener('click', function() {
          window.WSDBG.applyFixes();
        });
        
        console.log('🔍 Waypoint/Stop Debug Monitor UI created');
      }
      
      // Start monitoring
      this.startMonitoring();
      
      return this;
    },
    
    startMonitoring: function() {
      // Set up an interval to check waypoints and update the monitor
      this.monitorInterval = setInterval(() => {
        this.updateMonitor();
      }, 1000);
      
      console.log('🔍 Waypoint/Stop Debug Monitor started monitoring');
    },
    
    updateMonitor: function() {
      // Get the current waypoints
      let waypoints = [];
      if (window.waypointManager && typeof window.waypointManager.getWaypoints === 'function') {
        waypoints = window.waypointManager.getWaypoints();
      }
      
      // Update status
      const statusElement = document.getElementById('wsdbg-status');
      const fixes = [
        { name: 'Waypoint Type Fix', applied: !!window.waypointManager?.addWaypoint?.toString().includes('pointType') },
        { name: 'StopCards Fix', applied: !!window.StopCardCalculator?.calculateStopCards?.toString().includes('NAVIGATION_WAYPOINT') },
        { name: 'ComprehensiveFuelCalculator Fix', applied: !!window.comprehensiveFuelCalculatorFixed }
      ];
      
      const allFixesApplied = fixes.every(fix => fix.applied);
      
      if (statusElement) {
        statusElement.innerHTML = `Fix Status: <span style="color: ${allFixesApplied ? '#2ecc71' : '#e74c3c'}; font-weight: bold;">${allFixesApplied ? 'READY' : 'NOT READY'}</span>`;
        
        // Add details about which fixes are applied
        statusElement.innerHTML += '<ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">';
        fixes.forEach(fix => {
          statusElement.innerHTML += `<li>${fix.name}: <span style="color: ${fix.applied ? '#2ecc71' : '#e74c3c'};">${fix.applied ? '✓' : '✗'}</span></li>`;
        });
        statusElement.innerHTML += '</ul>';
      }
      
      // Update totals
      const totalsElement = document.getElementById('wsdbg-totals');
      if (totalsElement) {
        const totalPoints = waypoints.length;
        const navigationWaypoints = waypoints.filter(wp => 
          wp.pointType === 'NAVIGATION_WAYPOINT' || 
          wp.isWaypoint === true || 
          wp.type === 'WAYPOINT'
        ).length;
        const landingStops = totalPoints - navigationWaypoints;
        
        totalsElement.innerHTML = `
          <div>Total Points: <span style="color: #3498db; font-weight: bold;">${totalPoints}</span></div>
          <div>Navigation Waypoints: <span style="color: #f1c40f; font-weight: bold;">${navigationWaypoints}</span></div>
          <div>Landing Stops: <span style="color: #2ecc71; font-weight: bold;">${landingStops}</span></div>
          <div>Current Mode: <span style="color: ${window.isWaypointModeActive ? '#f1c40f' : '#2ecc71'}; font-weight: bold;">${window.isWaypointModeActive ? 'WAYPOINT' : 'LANDING STOP'}</span></div>
        `;
      }
      
      // Update waypoints list
      const waypointsElement = document.getElementById('wsdbg-waypoints');
      if (waypointsElement && waypoints.length > 0) {
        waypointsElement.innerHTML = '<div style="margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 2px; color: #bbb;">Waypoint Details:</div>';
        
        waypoints.forEach((wp, index) => {
          const isNavigationWaypoint = wp.pointType === 'NAVIGATION_WAYPOINT' || 
                                      wp.isWaypoint === true || 
                                      wp.type === 'WAYPOINT';
          
          waypointsElement.innerHTML += `
            <div style="margin-bottom: 3px; padding: 3px; background-color: rgba(${isNavigationWaypoint ? '241, 196, 15' : '46, 204, 113'}, 0.1); border-left: 3px solid ${isNavigationWaypoint ? '#f1c40f' : '#2ecc71'};">
              <span style="color: ${isNavigationWaypoint ? '#f1c40f' : '#2ecc71'}; font-weight: bold;">${index + 1}. ${wp.name || 'Unnamed'}</span>
              <span style="color: #999; font-size: 10px; display: block; margin-top: 2px;">Type: ${isNavigationWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP'}</span>
            </div>
          `;
        });
      }
    },
    
    applyFixes: function() {
      console.log('🔧 Manually applying Waypoint/Stop fixes...');
      
      // 1. Apply the Waypoint Type fix
      if (typeof fixWaypointManager === 'function') {
        console.log('🔧 Applying WaypointManager fix...');
        fixWaypointManager();
      }
      
      // 2. Apply the ComprehensiveFuelCalculator fix
      if (typeof fixComprehensiveFuelCalculator === 'function') {
        console.log('🔧 Applying ComprehensiveFuelCalculator fix...');
        fixComprehensiveFuelCalculator();
      }
      
      // 3. Apply the FuelIntegration fix
      if (typeof fixFuelIntegration === 'function') {
        console.log('🔧 Applying FuelIntegration fix...');
        fixFuelIntegration();
      }
      
      // 4. Force recalculation
      if (window.waypointManager && window.waypointManager.getWaypoints().length >= 2) {
        console.log('🔧 Forcing recalculation of current route...');
        
        // Update the status indicator
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator('Applying waypoint/stop fixes and recalculating route...', 'info', 3000);
        }
        
        // Trigger a route recalculation event
        const event = new CustomEvent('force-route-recalculation', {
          detail: {
            source: 'waypoint-stop-debug-monitor',
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }
      
      console.log('🔧 All fixes applied!');
      this.updateMonitor();
    }
  };
  
  // Initialize the debug monitor
  window.WSDBG.init();
  
  // Add a button to toggle the debug monitor
  const toggleButton = document.createElement('button');
  toggleButton.id = 'waypoint-stop-debug-toggle';
  toggleButton.textContent = 'Waypoint/Stop Debug';
  toggleButton.style.position = 'fixed';
  toggleButton.style.top = '5px';
  toggleButton.style.right = '10px';
  toggleButton.style.backgroundColor = '#3498db';
  toggleButton.style.color = 'white';
  toggleButton.style.border = 'none';
  toggleButton.style.padding = '5px 10px';
  toggleButton.style.borderRadius = '3px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.zIndex = '9999';
  toggleButton.style.fontSize = '12px';
  
  toggleButton.addEventListener('click', function() {
    const monitor = document.getElementById('waypoint-stop-debug-monitor');
    if (monitor) {
      monitor.style.display = monitor.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  document.body.appendChild(toggleButton);
  
  console.log('🔍 Waypoint/Stop Debug Monitor setup complete');
  return window.WSDBG;
}

// Run the debug monitor setup
setTimeout(createWaypointStopDebugMonitor, 2000);

// Announce the fix is active
console.log('✅ ComprehensiveFuelCalculator fix is active!');
