/**
 * WaypointManager.js
 * 
 * Handles waypoint creation, deletion, and manipulation
 */

class WaypointManager {
  constructor(mapManager, platformManager = null) {
    this.mapManager = mapManager;
    this.platformManager = platformManager; // Store the platform manager reference
    this.waypoints = [];
    this.markers = [];
    this.callbacks = {
      onChange: null,
      onWaypointAdded: null,
      onWaypointRemoved: null,
      onRouteUpdated: null
    };
  }
  
  /**
   * Set the platform manager if not provided in constructor
   * @param {Object} platformManager - Platform manager instance
   */
  setPlatformManager(platformManager) {
    this.platformManager = platformManager;
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type (onChange, onWaypointAdded, etc.)
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Add a waypoint to the route
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - The waypoint name
   * @returns {Object} - The added waypoint
   */
  addWaypoint(coords, name) {
    const map = this.mapManager.getMap();
    if (!map) {
      console.error('Cannot add waypoint: Map is not initialized');
      return null;
    }
    
    console.log(`Adding waypoint at coordinates: ${coords} with name: ${name || 'Unnamed'}`);
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}`;
    
    // Create waypoint object
    const waypoint = {
      id: id,
      coords: coords,
      name: name || `Waypoint ${this.waypoints.length + 1}`,
      isNew: true // Mark as new for highlighting
    };
    
    // Add to waypoints array
    this.waypoints.push(waypoint);
    
    try {
      // Create marker on the map
      const marker = this.createWaypointMarker(coords, name);
      
      if (marker) {
        // Add drag end event to update route
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const index = this.markers.indexOf(marker);
          if (index !== -1 && index < this.waypoints.length) {
            console.log(`Marker at index ${index} dragged to [${lngLat.lng}, ${lngLat.lat}]`);
            
            // Store the old coordinates for reference
            const oldCoords = this.waypoints[index].coords;
            
            // Update the waypoint coordinates
            this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
            
            // Check for nearest platform to the new location and update name if found
            this.updateWaypointNameAfterDrag(index, [lngLat.lng, lngLat.lat]);
            
            // Update route with new waypoint
            this.updateRoute();
            
            // Trigger onChange callback to update UI
            this.triggerCallback('onChange', this.waypoints);
          }
        });
        
        this.markers.push(marker);
      } else {
        console.error('Failed to create waypoint marker');
      }
      
      // Update route - don't pass route stats here as they'll be calculated by the callback
      this.updateRoute(null);
      
      // Log the operation for debugging
      console.log(`Added waypoint ${waypoint.name} at the end, ID: ${id}`);
      
      // Trigger callbacks
      this.triggerCallback('onWaypointAdded', waypoint);
      this.triggerCallback('onChange', this.waypoints);
      
      return waypoint;
    } catch (error) {
      console.error('Error adding waypoint:', error);
      // Remove the waypoint if marker creation failed
      this.waypoints = this.waypoints.filter(wp => wp.id !== id);
      return null;
    }
  }
  
  /**
   * Updates a waypoint's name after it has been dragged to a new location
   * @param {number} index - The index of the waypoint
   * @param {Array} newCoords - [lng, lat] new coordinates
   */
  updateWaypointNameAfterDrag(index, newCoords) {
    // Skip if we don't have access to a platform manager
    if (!window.platformManager && !this.platformManager) {
      console.log('No platform manager available to check for nearby locations');
      return;
    }
    
    const platformMgr = window.platformManager || this.platformManager;
    
    try {
      // Use findNearestPlatform to check if we're now near a platform
      const nearestPlatform = platformMgr.findNearestPlatform(newCoords[1], newCoords[0], 2);
      
      if (nearestPlatform) {
        console.log(`Found nearest platform after drag: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)} nm)`);
        
        // Update the waypoint name with the platform name
        this.waypoints[index].name = nearestPlatform.name;
        console.log(`Updated waypoint name to: ${nearestPlatform.name}`);
      } else {
        // If not near a platform, check if the current name is a generated one
        // and update the number if needed
        const currentName = this.waypoints[index].name;
        if (currentName.startsWith('Waypoint ')) {
          this.waypoints[index].name = `Waypoint ${index + 1}`;
        }
        // If it has a custom name, leave it as is
      }
    } catch (error) {
      console.error('Error updating waypoint name after drag:', error);
    }
  }
  
  /**
   * Add a waypoint at a specific index in the route
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - The waypoint name
   * @param {number} index - The index to insert at
   * @returns {Object} - The added waypoint
   */
  addWaypointAtIndex(coords, name, index) {
    const map = this.mapManager.getMap();
    if (!map) return null;
    
    // Create a unique ID for the waypoint
    const id = `waypoint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the waypoint object
    const waypoint = {
      id: id,
      coords: coords,
      name: name || `Stop ${index + 1}`,
      isNew: true // Mark as new for highlighting
    };
    
    // Create marker on the map
    const marker = this.createWaypointMarker(coords, name);
    
    // Add drag end event to update route
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const markerIndex = this.markers.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < this.waypoints.length) {
        this.waypoints[markerIndex].coords = [lngLat.lng, lngLat.lat];
        this.updateRoute();
      }
    });
    
    // Insert at specific index
    this.waypoints.splice(index, 0, waypoint);
    this.markers.splice(index, 0, marker);
    
    // Update route - don't pass route stats here as they'll be calculated by the callback
    this.updateRoute(null);
    
    // Log the operation for debugging
    console.log(`Added waypoint ${waypoint.name} at index ${index}, ID: ${id}`);
    
    // Ensure we trigger callbacks in this order:
    // 1. First onWaypointAdded for the specific waypoint
    // 2. Then onChange for the entire waypoints array
    this.triggerCallback('onWaypointAdded', waypoint);
    this.triggerCallback('onChange', this.waypoints);
    
    return waypoint;
  }
  
  /**
   * Create a custom marker for a waypoint
   * @param {Array} coords - [lng, lat] coordinates
   * @param {string} name - The waypoint name
   * @returns {Object} - The created marker
   */
  createWaypointMarker(coords, name) {
    try {
      const map = this.mapManager.getMap();
      if (!map) {
        console.error('Cannot create waypoint marker: Map is not initialized');
        return null;
      }
      
      if (!window.mapboxgl) {
        console.error('Cannot create waypoint marker: MapboxGL is not loaded');
        return null;
      }
      
      // Ensure coordinates are valid
      if (!coords || coords.length !== 2 || 
          typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
        console.error('Invalid coordinates for waypoint marker:', coords);
        return null;
      }
      
      console.log(`Creating waypoint marker at ${coords} with name ${name || 'Unnamed'}`);
      
      // Create a smaller pin marker with a custom color
      const marker = new window.mapboxgl.Marker({
        color: "#FF4136", // Bright red color for better visibility
        draggable: true,
        scale: 0.6 // Keep them small (60% of normal size)
      })
        .setLngLat(coords)
        .addTo(map);
      
      // Add popup with coordinates and name - now with a close button and favorite button
      const popup = new window.mapboxgl.Popup({
        closeButton: true, // Add close button
        closeOnClick: false,
        offset: 15, // Smaller offset for smaller marker
        className: 'waypoint-popup',
        maxWidth: '240px'
      });
      
      const displayName = name || 'Waypoint';
      
      // Add favorite button to popup
      const popupContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <strong>${displayName}</strong>
          <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords}])">❤️</span>
        </div>
        <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
        <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
      `;
      
      popup.setHTML(popupContent);
      
      // Show popup on hover
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.addEventListener('mouseenter', () => {
          popup.setLngLat(marker.getLngLat()).addTo(map);
        });
        
        markerElement.addEventListener('mouseleave', () => {
          popup.remove();
        });
      }
      
      return marker;
    } catch (error) {
      console.error('Error creating waypoint marker:', error);
      return null;
    }
  }
  
  /**
   * Create arrow markers along a route line
   * @param {Array} coordinates - Array of [lng, lat] coordinates
   * @param {Object} routeStats - Route statistics
   * @returns {Object} - GeoJSON feature collection of arrow markers
   */
  createArrowsAlongLine(coordinates, routeStats = null) {
    if (!coordinates || coordinates.length < 2) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
    
    // CRITICAL FIX: Check if routeStats has wind adjustments first
    const hasWindAdjustments = routeStats && routeStats.windAdjusted && routeStats.windData;
    console.log(`⚓ createArrowsAlongLine - Wind adjustments: ${hasWindAdjustments ? 'YES' : 'NO'}`);
    
    // CRITICAL FIX: Always check if currentRouteStats has wind-adjusted values that we should use
    // This is important because it means the weather settings were just updated
    let useCurrentStats = false;
    if (window.currentRouteStats && window.currentRouteStats.windAdjusted && 
        (!routeStats || !routeStats.windAdjusted)) {
      console.log(`⚓ Found wind-adjusted data in window.currentRouteStats that's not in routeStats`);
      console.log(`⚓ currentRouteStats wind data:`, {
        windSpeed: window.currentRouteStats.windData?.windSpeed,
        windDirection: window.currentRouteStats.windData?.windDirection,
        timeHours: window.currentRouteStats.timeHours,
        estimatedTime: window.currentRouteStats.estimatedTime
      });
      useCurrentStats = true;
    }
    
    // If we should use currentRouteStats, update routeStats with its values
    if (useCurrentStats && window.currentRouteStats) {
      // Create a copy or use the existing routeStats object
      routeStats = routeStats || {};
      
      // Copy wind-adjusted values from currentRouteStats
      routeStats.timeHours = window.currentRouteStats.timeHours;
      routeStats.estimatedTime = window.currentRouteStats.estimatedTime;
      routeStats.windAdjusted = true;
      routeStats.windData = window.currentRouteStats.windData;
      routeStats.legs = window.currentRouteStats.legs;
      
      console.log(`⚓ Updated routeStats with wind-adjusted data from window.currentRouteStats`);
    }
    
    // CRITICAL FIX: Add a safety check to verify if routeStats contains sane time values
    // For a single leg, check if the total time makes sense for the total distance
    if (routeStats && routeStats.totalDistance) {
      const totalDistance = parseFloat(routeStats.totalDistance);
      
      // Check if time values are present and valid
      if (!routeStats.timeHours || routeStats.timeHours === 0 || 
          !routeStats.estimatedTime || routeStats.estimatedTime === '00:00') {
        console.error(`❌ Missing or zero time values in routeStats! Distance: ${totalDistance} nm`);
        
        // Try to calculate reasonable time values
        let cruiseSpeed = 135; // Default to 135 knots
        
        // Try to get cruise speed from routeStats, selectedAircraft, or currentSelectedAircraft
        if (routeStats.aircraft && routeStats.aircraft.cruiseSpeed) {
          cruiseSpeed = routeStats.aircraft.cruiseSpeed;
        } else if (window.selectedAircraft && window.selectedAircraft.cruiseSpeed) {
          cruiseSpeed = window.selectedAircraft.cruiseSpeed;
        } else if (window.currentSelectedAircraft && window.currentSelectedAircraft.cruiseSpeed) {
          cruiseSpeed = window.currentSelectedAircraft.cruiseSpeed;
        }
        
        // Now check if we can calculate with wind effects
        let calculatedTimeHours;
        
        // If we have wind data and WindCalculations, calculate with wind effects
        if (window.WindCalculations && routeStats.windData) {
          console.log(`⚓ Calculating time with wind effects for ${totalDistance} nm`);
          
          // Get the first and last waypoint to calculate course
          const firstWaypoint = coordinates[0];
          const lastWaypoint = coordinates[coordinates.length - 1];
          
          // Create lat/lon objects from coordinates
          const from = { lat: firstWaypoint[1], lon: firstWaypoint[0] };
          const to = { lat: lastWaypoint[1], lon: lastWaypoint[0] };
          
          // Calculate course between waypoints
          const course = window.WindCalculations.calculateCourse(from, to);
          
          // Calculate time with wind adjustment
          calculatedTimeHours = window.WindCalculations.calculateWindAdjustedTime(
            totalDistance,
            cruiseSpeed,
            course,
            routeStats.windData.windSpeed,
            routeStats.windData.windDirection
          );
          
          console.log(`⚓ Wind-adjusted time calculation: ${calculatedTimeHours.toFixed(2)} hours`);
        } else {
          // Calculate without wind effects
          calculatedTimeHours = totalDistance / cruiseSpeed;
          console.log(`⚓ Basic time calculation: ${calculatedTimeHours.toFixed(2)} hours`);
        }
        
        // Format time string
        const hours = Math.floor(calculatedTimeHours);
        const minutes = Math.floor((calculatedTimeHours - hours) * 60);
        const calculatedTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        console.log(`⚓ Generated calculated time: ${calculatedTimeString} (${calculatedTimeHours.toFixed(2)} hours) for display`);
        
        // Update the passed routeStats object with calculated values
        routeStats.timeHours = calculatedTimeHours;
        routeStats.estimatedTime = calculatedTimeString;
        
        // Also update window.currentRouteStats
        if (window.currentRouteStats) {
          window.currentRouteStats.timeHours = calculatedTimeHours;
          window.currentRouteStats.estimatedTime = calculatedTimeString;
          
          // Make sure wind data is properly set
          if (routeStats.windData) {
            window.currentRouteStats.windAdjusted = true;
            window.currentRouteStats.windData = { ...routeStats.windData };
          }
        } else {
          // If no window.currentRouteStats, create a minimal one
          window.currentRouteStats = {
            ...routeStats,
            timeHours: calculatedTimeHours,
            estimatedTime: calculatedTimeString
          };
        }
      } 
      // If time values exist, check if they're reasonable
      else {
        // Only do this sanity check if it's not wind-adjusted data
        // Wind effects can cause significant time differences from basic calculations
        if (!routeStats.windAdjusted) {
          const cruiseSpeed = routeStats.aircraft?.cruiseSpeed || 135; // Default S92 speed
          const expectedTimeHours = totalDistance / cruiseSpeed;
          const timeHoursDifference = Math.abs(routeStats.timeHours - expectedTimeHours);
          
          if (timeHoursDifference > 1) { // More than 1 hour difference
            console.error(`❌ Route time value is unreasonable! Got ${routeStats.timeHours.toFixed(2)} hours but expected ~${expectedTimeHours.toFixed(2)} hours based on distance ${totalDistance} nm at ${cruiseSpeed} kts`);
            
            // Don't set to null, but fix the values instead
            const fixedTimeHours = expectedTimeHours;
            const hours = Math.floor(fixedTimeHours);
            const minutes = Math.floor((fixedTimeHours - hours) * 60);
            const fixedTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            console.log(`❌ Fixing time values to: ${fixedTimeString} (${fixedTimeHours.toFixed(2)} hours) for display`);
            
            // Update the routeStats object
            routeStats.timeHours = fixedTimeHours;
            routeStats.estimatedTime = fixedTimeString;
            
            // Update window.currentRouteStats
            if (window.currentRouteStats) {
              window.currentRouteStats.timeHours = fixedTimeHours;
              window.currentRouteStats.estimatedTime = fixedTimeString;
            }
          }
        } else {
          console.log(`⚓ Using wind-adjusted time: ${routeStats.timeHours.toFixed(2)} hours for ${totalDistance} nm`);
        }
      }
    }
    
    const features = [];
    
    // Process each segment of the route
    for (let i = 0; i < coordinates.length - 1; i++) {
      const startPoint = coordinates[i];
      const endPoint = coordinates[i + 1];
      
      // Calculate distance of this segment
      const distance = window.turf.distance(
        window.turf.point(startPoint),
        window.turf.point(endPoint),
        { units: 'nauticalmiles' }
      );
      
      // Calculate bearing between points
      const bearing = window.turf.bearing(
        window.turf.point(startPoint),
        window.turf.point(endPoint)
      );
      
      // Find the midpoint of the segment
      const midpointFraction = 0.5;
      const midPoint = window.turf.along(
        window.turf.lineString([startPoint, endPoint]),
        distance * midpointFraction,
        { units: 'nauticalmiles' }
      );
      
      // Calculate leg time and fuel if aircraft data is available
      let legTime = null;
      let legFuel = null;
      
      // Try to get aircraft data from routeStats or window.currentRouteStats
      let stats = routeStats || window.currentRouteStats;
      
      // If no stats at all, create minimal stats with aircraft data
      if (!stats && window.currentSelectedAircraft) {
        console.log(`❗ Creating emergency minimal stats for leg ${i+1} display`);
        stats = {
          aircraft: window.currentSelectedAircraft,
          windAdjusted: false
        };
      }
      
      // Log available stats for debugging
      console.log(`Drawing leg ${i+1} with stats:`, {
        hasStats: !!stats,
        hasLegs: !!(stats && stats.legs),
        legCount: stats?.legs?.length || 0,
        legHasTime: !!(stats?.legs && stats?.legs[i]?.time),
        windAdjusted: stats?.windAdjusted || false
      });
      
      // CRITICAL EMERGENCY FIX: Always ensure we have a legTime value
      // We must calculate the time for each leg with proper wind adjustments
      
      if (stats && stats.legs && stats.legs[i] && stats.legs[i].time !== undefined) {
        // Best case: Use pre-calculated time from legs data (includes wind effects)
        const timeHours = stats.legs[i].time;
        
        // Format time as minutes only, rounded to the nearest minute
        const totalMinutes = Math.round(timeHours * 60);
        legTime = `${totalMinutes}m`;
        
        // Add wind indicator if needed
        if (stats.windAdjusted && stats.windData && stats.windData.windSpeed > 0) {
          // Check if leg has headwind data
          if (stats.legs[i] && stats.legs[i].headwind !== undefined) {
            const headwind = stats.legs[i].headwind;
            console.log(`🌬️ Checking wind effect for leg ${i+1}: headwind=${headwind}, windAdjusted=${stats.windAdjusted}`);
            
            if (Math.abs(headwind) > 1) {
              legTime = `${totalMinutes}m*`; // Add an asterisk to indicate wind adjusted time
              console.log(`🌬️ Added wind indicator to leg ${i+1} time: ${legTime}`);
            }
          } else {
            // If we have wind data but no specific leg headwind, still mark it as wind-adjusted
            legTime = `${totalMinutes}m*`;
            console.log(`🌬️ Added wind indicator to leg ${i+1} without headwind data: ${legTime}`);
          }
        } else {
          console.log(`Wind data missing for leg ${i+1}: windAdjusted=${stats.windAdjusted}, hasWindData=${stats.windData ? 'yes' : 'no'}`);
        }
        
        console.log(`Using leg time from legs data for leg ${i+1}: ${legTime}`);
        
        // Use the pre-calculated fuel if available
        if (stats.legs[i].fuel) {
          legFuel = Math.round(stats.legs[i].fuel);
        }
      }
      else {
        // Fallback: Calculate time with wind adjustment if possible
        console.log(`❗ No leg data for leg ${i+1}, calculating with wind effects if possible`);
        
        // Get cruise speed - try multiple sources
        let cruiseSpeed = 135; // Default S92 speed
        
        if (stats && stats.aircraft && stats.aircraft.cruiseSpeed) {
          cruiseSpeed = stats.aircraft.cruiseSpeed;
        } else if (window.currentSelectedAircraft && window.currentSelectedAircraft.cruiseSpeed) {
          cruiseSpeed = window.currentSelectedAircraft.cruiseSpeed;
        }
        
        // Determine if we can use wind calculations
        let timeHours;
        let useWindCalculation = false;
        
        // Check if we have WindCalculations module and wind data
        if (window.WindCalculations && stats && stats.windAdjusted && stats.windData) {
          console.log(`🌬️ Attempting wind calculation for leg ${i+1}`);
          
          try {
            // Create from/to points for course calculation
            const fromPoint = {
              lat: coordinates[i][1],
              lon: coordinates[i][0]
            };
            
            const toPoint = {
              lat: coordinates[i+1][1],
              lon: coordinates[i+1][0]
            };
            
            // Calculate course between points
            const course = window.WindCalculations.calculateCourse(fromPoint, toPoint);
            
            // Calculate wind-adjusted time
            timeHours = window.WindCalculations.calculateWindAdjustedTime(
              distance,
              cruiseSpeed,
              course,
              stats.windData.windSpeed,
              stats.windData.windDirection
            );
            
            console.log(`🌬️ Wind-adjusted time for leg ${i+1}: ${timeHours.toFixed(2)} hours`);
            useWindCalculation = true;
          } catch (error) {
            console.error(`🌬️ Error calculating wind-adjusted time for leg ${i+1}:`, error);
            // Fall back to basic calculation
            timeHours = distance / cruiseSpeed;
          }
        } else {
          // Basic calculation without wind
          timeHours = distance / cruiseSpeed;
        }
        
        // Format time as minutes only, rounded to the nearest minute
        const totalMinutes = Math.round(timeHours * 60);
        legTime = useWindCalculation ? `${totalMinutes}m*` : `${totalMinutes}m`;
        
        console.log(`Calculated time for leg ${i+1}: ${legTime} based on distance ${distance.toFixed(1)} nm at speed ${cruiseSpeed} kts`);
        
        // Calculate fuel for this leg
        let fuelBurn = 1100; // Default fuel burn
        
        if (stats && stats.aircraft && stats.aircraft.fuelBurn) {
          fuelBurn = stats.aircraft.fuelBurn;
        } else if (window.currentSelectedAircraft && window.currentSelectedAircraft.fuelBurn) {
          fuelBurn = window.currentSelectedAircraft.fuelBurn;
        }
        
        legFuel = Math.round(timeHours * fuelBurn);
      }
      
      // CRITICAL: Ensure we always have a leg time - final emergency fallback
      if (!legTime) {
        console.error(`❌ Critical failure - no legTime calculated for leg ${i+1}. Using emergency fallback.`);
        const emergencyTimeMinutes = Math.round((distance / 135) * 60);
        legTime = `${emergencyTimeMinutes}m`;
      }
      
      // CRITICAL FIX: All text on one line
      // Format elements
      const distanceText = `${distance.toFixed(1)} nm`;
      
      // Format the time with wind indicator if needed
      let timeText = "";
      if (legTime) {
        // If the time already has the wind marker (*), use it as is
        if (legTime.includes('*')) {
          // For wind-adjusted time, add wind-specific styling
          timeText = legTime;
          console.log(`🌬️ Using wind-adjusted time: ${timeText}`);
        } else if (stats && stats.windAdjusted && weather && weather.windSpeed > 0) {
          // If we have wind settings but legTime doesn't show it, add the asterisk
          timeText = `${legTime}*`;
          console.log(`🌬️ Adding wind indicator to time: ${timeText}`);
        } else {
          timeText = legTime;
        }
      }
      
      // We'll keep fuel hidden for now
      
      // Left/right arrow based on direction
      const startLng = startPoint[0];
      const endLng = endPoint[0];
      const goingLeftToRight = endLng > startLng;
      const leftArrow = '←';
      const rightArrow = '→';
      
      // Create label with proper arrow placement - ALL ON ONE LINE
      let labelText = '';
      
      // Add left arrow at beginning if going right to left
      if (!goingLeftToRight) {
        labelText += leftArrow + ' ';
      }
      
      // Add distance
      labelText += distanceText;
      
      // Add time if available - on same line with dot separator
      if (timeText) {
        labelText += ` • ${timeText}`;
        
        // We've removed the wind indicator display from route lines
        // Wind correction is already shown in the top card and stop cards
      }
      
      // Add right arrow at end if going left to right
      if (goingLeftToRight) {
        labelText += ' ' + rightArrow;
      }
      
      // Determine the adjusted bearing for text orientation
      // Make the text parallel to the line and ensure it's never upside down
      let adjustedBearing = bearing;
      
      // First make it parallel to the flight path by rotating 90 degrees
      adjustedBearing += 90;
      
      // Ensure text is always right-side up
      // If the text would be upside down (90° to 270°), flip it to be right-side up
      if (adjustedBearing > 90 && adjustedBearing < 270) {
        adjustedBearing = (adjustedBearing + 180) % 360;
      }
      
      // Add label feature with the adjusted bearing
      features.push({
        type: 'Feature',
        geometry: midPoint.geometry,
        properties: {
          isLabel: true,
          bearing: bearing,           // Original bearing for reference
          textBearing: adjustedBearing, // Adjusted bearing for text orientation
          text: labelText,
          legIndex: i
        }
      });
    }
    
    return {
      type: 'FeatureCollection',
      features: features
    };
  }
  
  /**
   * Remove a waypoint by ID and index
   * @param {string} id - The waypoint ID
   * @param {number} index - The waypoint index
   */
  removeWaypoint(id, index) {
    console.log(`WaypointManager: Removing waypoint with ID ${id} at index ${index}`);
    
    // If index is not provided or invalid, find it from the ID
    if (index === undefined || index < 0 || index >= this.waypoints.length) {
      console.log(`WaypointManager: Invalid index ${index}, searching by ID`);
      index = this.waypoints.findIndex(wp => wp.id === id);
      
      if (index === -1) {
        console.error(`WaypointManager: Cannot find waypoint with ID ${id}`);
        return;
      }
    }
    
    // Find the waypoint for callback before removing
    const removedWaypoint = this.waypoints[index];
    
    // Remove the marker from the map
    if (this.markers[index]) {
      console.log(`WaypointManager: Removing marker at index ${index}`);
      try {
        this.markers[index].remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    } else {
      console.warn(`WaypointManager: No marker found at index ${index}`);
    }
    
    // Remove from arrays
    this.markers.splice(index, 1);
    this.waypoints.splice(index, 1);
    
    console.log(`WaypointManager: After removal, ${this.waypoints.length} waypoints and ${this.markers.length} markers remain`);
    
    // Update route
    this.updateRoute();
    
    // Trigger callbacks
    if (removedWaypoint) {
      this.triggerCallback('onWaypointRemoved', removedWaypoint);
    }
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Update the route line on the map
   * @param {Object} routeStats - Optional route statistics to use for leg labels
   */
  updateRoute(routeStats = null) {
    const map = this.mapManager.getMap();
    if (!map) return;
    
    // Log routeStats passed to updateRoute for debugging
    if (routeStats) {
      console.log('🔄 WaypointManager.updateRoute called with routeStats:', {
        timeHours: routeStats.timeHours,
        estimatedTime: routeStats.estimatedTime,
        totalDistance: routeStats.totalDistance,
        hasLegs: routeStats.legs ? true : false,
        legCount: routeStats.legs?.length || 0,
        windAdjusted: routeStats.windAdjusted || false
      });
      
      // CRITICAL FIX: Ensure time values are available
      if (!routeStats.timeHours || routeStats.timeHours === 0 || !routeStats.estimatedTime || routeStats.estimatedTime === '00:00') {
        console.warn('⚠️ CRITICAL: Missing time values in routeStats passed to updateRoute!');
        
        if (routeStats.totalDistance && parseFloat(routeStats.totalDistance) > 0) {
          console.log('⚠️ Calculating emergency time values for route display');
          
          // Get cruiseSpeed from the aircraft or use a default
          let cruiseSpeed = 135; // Default S92 speed
          if (routeStats.aircraft && routeStats.aircraft.cruiseSpeed) {
            cruiseSpeed = routeStats.aircraft.cruiseSpeed;
          } else if (window.currentSelectedAircraft && window.currentSelectedAircraft.cruiseSpeed) {
            cruiseSpeed = window.currentSelectedAircraft.cruiseSpeed;
          }
          
          const totalDistance = parseFloat(routeStats.totalDistance);
          const timeHours = totalDistance / cruiseSpeed;
          
          // Format time
          const hours = Math.floor(timeHours);
          const minutes = Math.floor((timeHours - hours) * 60);
          const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // Update routeStats directly
          routeStats.timeHours = timeHours;
          routeStats.estimatedTime = estimatedTime;
          
          console.log('⚠️ Fixed routeStats time values:', {
            timeHours,
            estimatedTime
          });
          
          // Also update window.currentRouteStats
          if (window.currentRouteStats) {
            window.currentRouteStats.timeHours = timeHours;
            window.currentRouteStats.estimatedTime = estimatedTime;
          } else {
            window.currentRouteStats = {
              ...routeStats
            };
          }
        }
      }
    } else {
      console.log('🔄 WaypointManager.updateRoute called without routeStats');
      
      // Try to use window.currentRouteStats if available
      if (window.currentRouteStats) {
        console.log('🔄 Using window.currentRouteStats for route display');
        routeStats = window.currentRouteStats;
      }
    }
    
    // Remove existing route, glow, and arrows if they exist
    if (map.getSource('route')) {
      if (map.getLayer('route-glow')) {
        map.removeLayer('route-glow');
      }
      if (map.getLayer('route')) {
        map.removeLayer('route');
      }
      map.removeSource('route');
    }
    
    // Remove existing arrows and labels if they exist
    if (map.getSource('route-arrows')) {
      if (map.getLayer('route-arrows')) {
        map.removeLayer('route-arrows');
      }
      if (map.getLayer('leg-labels')) {
        map.removeLayer('leg-labels');
      }
      map.removeSource('route-arrows');
    }
    
    // If we have at least 2 waypoints, draw the route
    if (this.waypoints.length >= 2) {
      const coordinates = this.waypoints.map(wp => wp.coords);
      
      map.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
          }
        }
      });
      
      // Add main route line (make it wider for easier interaction)
      map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round',
          'line-sort-key': 1 // Ensure it appears above the glow but below symbols
        },
        'paint': {
          'line-color': '#007bff', // Bright blue for the main route
          'line-width': 6,         // Wider line for easier grabbing
          'line-opacity': 0.8      // Slightly transparent
        }
      });
      
      // Add a "glow" effect around the route to make it more visible
      map.addLayer({
        'id': 'route-glow',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible',
          'line-sort-key': 0 // Ensure it appears below the main line
        },
        'paint': {
          'line-color': '#ffffff',  // White glow
          'line-width': 10,         // Wider than the main route
          'line-opacity': 0.15,     // Very transparent
          'line-blur': 3            // Blur effect for glow
        },
        'filter': ['==', '$type', 'LineString']
      }, 'route'); // Insert below the main route
      
      // CRITICAL FIX: Prefer the passed routeStats over any global state
      // This ensures the leg times and other data are consistent with the current calculation
      const stats = routeStats || window.currentRouteStats;
      
      // Store current stats for debugging
      window.currentRouteStats = stats;
      
      // Log the stats being used for createArrowsAlongLine
      console.log('🔄 Using route stats for arrows:', {
        timeHours: stats?.timeHours,
        estimatedTime: stats?.estimatedTime,
        legs: stats?.legs?.length || 0
      });
      
      // Create a GeoJSON source for the route arrows and leg labels
      const arrowsData = this.createArrowsAlongLine(coordinates, stats);
      
      // Add a source for the arrows and labels
      map.addSource('route-arrows', {
        'type': 'geojson',
        'data': arrowsData
      });
      
      // Use a custom arrow image or create one
      // First check if we've already loaded the arrow image
      if (!map.hasImage('arrow-icon')) {
        // Create a canvas to draw the arrow
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple arrow
        ctx.clearRect(0, 0, size, size);
        
        // Draw an arrow shape
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(size/2, 0);       // Top center
        ctx.lineTo(size, size);      // Bottom right
        ctx.lineTo(size/2, size*0.7); // Middle bottom
        ctx.lineTo(0, size);         // Bottom left
        ctx.closePath();
        ctx.fill();
        
        // Add the image to the map
        map.addImage('arrow-icon', { 
          data: ctx.getImageData(0, 0, size, size).data, 
          width: size, 
          height: size 
        });
      }
      
      // Since we now include arrows in the text labels, we'll disable the separate arrow markers
      // We'll keep the layer definition but make it invisible in case we want to revert this change
      map.addLayer({
        'id': 'route-arrows',
        'type': 'symbol',
        'source': 'route-arrows',
        'layout': {
          'symbol-placement': 'point',
          'icon-image': 'arrow-icon', // Custom arrow icon
          'icon-size': 0.5,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-sort-key': 2, // Ensure arrows appear above the line
          'visibility': 'none'  // Hide the arrows since they're now in the labels
        },
        'paint': {
          'icon-opacity': 0
        },
        'filter': ['!', ['has', 'isLabel']] // Only show arrows, not labels
      });
      
      // Add a layer for the leg labels with direct text property
      map.addLayer({
        'id': 'leg-labels',
        'type': 'symbol',
        'source': 'route-arrows',
        'layout': {
          'symbol-placement': 'point',
          'text-field': ['get', 'text'], // Use direct text field
          'text-size': 11,               // Smaller text
          'text-font': ['Arial Unicode MS Bold'],
          'text-offset': [0, -0.5],      // Original offset
          'text-anchor': 'center',
          'text-rotate': ['get', 'textBearing'], // Use the adjusted bearing for proper orientation
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-max-width': 30,          // Wider to keep everything on one line
          'text-line-height': 1.0,       // Tighter line height
          'symbol-sort-key': 3           // Ensure labels appear above everything
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',  // Original halo color
          'text-halo-width': 3,          // Original halo width
          'text-opacity': 0.9            // Original opacity
        },
        'filter': ['has', 'isLabel']     // Only show labels, not arrows
      });
      
      // Trigger route updated callback with coordinates
      const routeData = {
        waypoints: this.waypoints,
        coordinates: coordinates
      };
      this.triggerCallback('onRouteUpdated', routeData);
      
      // Always calculate basic distance even when no aircraft is selected
      // This ensures distance is displayed regardless of aircraft selection
      if (window.routeCalculator) {
        window.routeCalculator.calculateDistanceOnly(coordinates);
      }
    }
  }
  
  /**
   * Clear all waypoints and the route
   */
  clearRoute() {
    const map = this.mapManager.getMap();
    
    // Remove all markers
    this.markers.forEach(marker => {
      marker.remove();
    });
    
    this.markers = [];
    this.waypoints = [];
    
    // Remove route, glow, and arrows from map
    if (map) {
      // Remove route layers and source
      if (map.getSource('route')) {
        if (map.getLayer('route-glow')) {
          map.removeLayer('route-glow');
        }
        if (map.getLayer('route')) {
          map.removeLayer('route');
        }
        map.removeSource('route');
      }
      
      // Remove arrow layers, leg labels, and source
      if (map.getSource('route-arrows')) {
        if (map.getLayer('route-arrows')) {
          map.removeLayer('route-arrows');
        }
        if (map.getLayer('leg-labels')) {
          map.removeLayer('leg-labels');
        }
        map.removeSource('route-arrows');
      }
    }
    
    // Trigger callbacks
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Reorder waypoints based on drag and drop
   * @param {string} draggedId - The ID of the waypoint being dragged
   * @param {string} dropTargetId - The ID of the waypoint being dropped onto
   */
  reorderWaypoints(draggedId, dropTargetId) {
    const draggedIndex = this.waypoints.findIndex(wp => wp.id === draggedId);
    const dropTargetIndex = this.waypoints.findIndex(wp => wp.id === dropTargetId);
    
    if (draggedIndex === -1 || dropTargetIndex === -1) {
      console.error('Invalid waypoint IDs for reordering');
      return;
    }
    
    // Get the waypoint and marker being moved
    const movedWaypoint = this.waypoints[draggedIndex];
    const movedMarker = this.markers[draggedIndex];
    
    // Remove from current position
    this.waypoints.splice(draggedIndex, 1);
    this.markers.splice(draggedIndex, 1);
    
    // Insert at new position
    this.waypoints.splice(dropTargetIndex, 0, movedWaypoint);
    this.markers.splice(dropTargetIndex, 0, movedMarker);
    
    // Update route
    this.updateRoute();
    
    // Trigger callbacks
    console.log(`Reordered waypoint ${movedWaypoint.name} from index ${draggedIndex} to ${dropTargetIndex}`);
    this.triggerCallback('onChange', this.waypoints);
  }
  
  /**
   * Find the insertion index for a new waypoint when clicking on a path
   * @param {Object} clickedPoint - The clicked point {lng, lat}
   * @returns {number} - The index to insert at
   */
  findPathInsertIndex(clickedPoint) {
    if (this.waypoints.length < 2) return this.waypoints.length;
    
    let minDistance = Number.MAX_VALUE;
    let insertIndex = 1;
    
    try {
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const segment = window.turf.lineString([
          this.waypoints[i].coords,
          this.waypoints[i + 1].coords
        ]);
        
        const point = window.turf.point([clickedPoint.lng, clickedPoint.lat]);
        const nearestPoint = window.turf.nearestPointOnLine(segment, point, { units: 'nauticalmiles' });
        
        if (nearestPoint.properties.dist < minDistance) {
          minDistance = nearestPoint.properties.dist;
          insertIndex = i + 1;
        }
      }
    } catch (error) {
      console.error('Error finding path insert index:', error);
      // Default to adding at the end if there's an error
      return this.waypoints.length;
    }
    
    return insertIndex;
  }
  
  /**
   * Get all waypoints
   * @returns {Array} - Array of waypoint objects
   */
  getWaypoints() {
    return this.waypoints;
  }
  
  /**
   * Get a waypoint by ID
   * @param {string} id - The waypoint ID
   * @returns {Object|null} - The waypoint or null if not found
   */
  getWaypointById(id) {
    return this.waypoints.find(wp => wp.id === id) || null;
  }
  
  /**
   * Update a waypoint's name
   * @param {string} id - The waypoint ID
   * @param {string} name - The new name
   */
  updateWaypointName(id, name) {
    const waypoint = this.getWaypointById(id);
    if (waypoint) {
      waypoint.name = name;
      this.triggerCallback('onChange', this.waypoints);
    }
  }

  /**
   * Set up route dragging functionality
   * @param {Function} onRoutePointAdded - Callback when a new point is added via drag
   */
  setupRouteDragging(onRoutePointAdded) {
    const map = this.mapManager.getMap();
    if (!map) return;

    console.log('Setting up route dragging functionality');

    let isDragging = false;
    let draggedLineCoordinates = [];
    let originalLineCoordinates = [];
    let dragStartPoint = null;
    let closestPointIndex = -1;
    let dragLineSource = null;

    // Function to add the temporary drag line
    const addDragLine = (coordinates) => {
      try {
        if (map.getSource('drag-line')) {
          map.removeLayer('drag-line');
          map.removeSource('drag-line');
        }
        
        map.addSource('drag-line', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': coordinates
            }
          }
        });
        
        map.addLayer({
          'id': 'drag-line',
          'type': 'line',
          'source': 'drag-line',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#ff0000', // Red for the dragging line
            'line-width': 4,
            'line-dasharray': [2, 1] // Dashed line for the temp route
          }
        });

        dragLineSource = map.getSource('drag-line');
      } catch (error) {
        console.error('Error adding drag line:', error);
      }
    };

    // Helper to find closest point on the line and the segment it belongs to
    const findClosestPointOnLine = (mouseLngLat, mousePoint) => {
      try {
        if (!map.getSource('route')) return null;
        
        // First check if the mouse is over a route feature using rendered features
        // This is more accurate than calculating distance and works better for user interaction
        const routeFeatures = map.queryRenderedFeatures(mousePoint, { layers: ['route'] });
        const isMouseOverRoute = routeFeatures && routeFeatures.length > 0;
        
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return null;
        
        const coordinates = routeSource._data.geometry.coordinates;
        if (!coordinates || coordinates.length < 2) return null;
        
        let minDistance = Infinity;
        let closestPoint = null;
        let segmentIndex = -1;
        
        // Check each segment of the line
        for (let i = 0; i < coordinates.length - 1; i++) {
          const line = window.turf.lineString([coordinates[i], coordinates[i + 1]]);
          const point = window.turf.point([mouseLngLat.lng, mouseLngLat.lat]);
          const snapped = window.turf.nearestPointOnLine(line, point);
          
          if (snapped.properties.dist < minDistance) {
            minDistance = snapped.properties.dist;
            closestPoint = snapped.geometry.coordinates;
            segmentIndex = i;
          }
        }
        
        // Convert distance to nautical miles for easy comparison
        const distanceNM = window.turf.distance(
          window.turf.point([mouseLngLat.lng, mouseLngLat.lat]),
          window.turf.point(closestPoint),
          { units: 'nauticalmiles' }
        );
        
        // If mouse is directly over the route (pixel-perfect), return regardless of distance
        // Otherwise use a more generous distance threshold (0.5 nautical miles)
        const maxDistanceThreshold = 0.5; // More generous distance in nautical miles
        
        if (isMouseOverRoute || distanceNM < maxDistanceThreshold) {
          return { 
            point: closestPoint, 
            index: segmentIndex,
            distance: distanceNM,
            isDirectlyOver: isMouseOverRoute
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error finding closest point on line:', error);
        return null;
      }
    };

    // Setup mousedown event for starting the drag
    map.on('mousedown', (e) => {
      // Skip if no route or if clicking on a waypoint
      if (!map.getSource('route')) return;
      
      // Don't start drag if right-click
      if (e.originalEvent.button === 2) return;
      
      // Check for platform markers and don't start drag if clicked on one
      const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
      if (platformFeatures.length > 0) return;
      
      // Find the closest point on the route line
      const mousePos = e.lngLat;
      const closestInfo = findClosestPointOnLine(mousePos, e.point);
      
      // If mouse is directly over the route or within distance threshold
      if (closestInfo) {
        console.log('Starting route drag operation at segment:', closestInfo.index, 
                   'Distance:', closestInfo.distance.toFixed(2) + ' nm',
                   'Directly over route:', closestInfo.isDirectlyOver);
        
        // Get the original route coordinates
        const routeSource = map.getSource('route');
        if (!routeSource || !routeSource._data) return;
        originalLineCoordinates = [...routeSource._data.geometry.coordinates];
        
        // Start dragging
        isDragging = true;
        dragStartPoint = closestInfo.point;
        closestPointIndex = closestInfo.index;
        
        // Make a copy of the coordinates for dragging
        draggedLineCoordinates = [...originalLineCoordinates];
        
        // Insert a new point at the drag location, right after the closest segment start
        draggedLineCoordinates.splice(
          closestPointIndex + 1, 
          0, 
          closestInfo.point
        );
        
        // Add the temporary drag line
        addDragLine(draggedLineCoordinates);
        
        // Hide the original route and glow during dragging
        map.setLayoutProperty('route', 'visibility', 'none');
        if (map.getLayer('route-glow')) {
          map.setLayoutProperty('route-glow', 'visibility', 'none');
        }
        
        // Change cursor to grabbing
        map.getCanvas().style.cursor = 'grabbing';
        
        // Prevent default behavior
        e.preventDefault();
      }
    });

    // Set up route hover effect to make it clear it can be dragged
    map.on('mousemove', (e) => {
      if (isDragging) {
        // Update the position of the dragged point
        draggedLineCoordinates[closestPointIndex + 1] = [e.lngLat.lng, e.lngLat.lat];
        
        // Update the drag line
        if (dragLineSource) {
          dragLineSource.setData({
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': draggedLineCoordinates
            }
          });
        }
      } else {
        // Check if mouse is over the route when not dragging
        const closestInfo = findClosestPointOnLine(e.lngLat, e.point);
        
        if (closestInfo && closestInfo.isDirectlyOver) {
          // Change cursor to indicate draggable route
          map.getCanvas().style.cursor = 'pointer';
        } else if (map.getCanvas().style.cursor === 'pointer') {
          // Reset cursor if it was previously set by this handler
          // (but don't reset if it might have been set by platform hover)
          const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
          if (platformFeatures.length === 0) {
            map.getCanvas().style.cursor = '';
          }
        }
      }
    });

    // Setup mouseup for completing the drag
    map.on('mouseup', (e) => {
      if (!isDragging) return;
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Call the callback with the segment index and new point
      if (onRoutePointAdded && typeof onRoutePointAdded === 'function') {
        console.log('Route drag complete, adding new point at index:', closestPointIndex + 1);
        onRoutePointAdded(closestPointIndex + 1, [e.lngLat.lng, e.lngLat.lat]);
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
    });

    // Cancel the drag operation if the mouse leaves the map
    map.on('mouseout', () => {
      if (!isDragging) return;
      
      console.log('Mouse left map area, canceling route drag');
      
      // Clean up
      isDragging = false;
      
      // Remove the temporary drag line
      if (map.getSource('drag-line')) {
        map.removeLayer('drag-line');
        map.removeSource('drag-line');
      }
      
      // Show the original route and glow again
      map.setLayoutProperty('route', 'visibility', 'visible');
      if (map.getLayer('route-glow')) {
        map.setLayoutProperty('route-glow', 'visibility', 'visible');
      }
      
      // Reset cursor
      map.getCanvas().style.cursor = '';
      
      // Reset variables
      draggedLineCoordinates = [];
      originalLineCoordinates = [];
      dragStartPoint = null;
      closestPointIndex = -1;
      dragLineSource = null;
    });
  }
}

export default WaypointManager;