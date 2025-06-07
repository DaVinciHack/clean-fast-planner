/**
 * Fix to modify WaypointManager to properly distinguish between navigation waypoints and landing stops
 */

// Modify the WaypointManager class to use a proper type enum
function fixWaypointManager() {
  // Define our changes to register directly on the window.waypointManager if available
  const applyFixes = () => {
    console.log('🛠️ Applying waypoint vs. landing stop type fixes...');

    // Check if we can access the waypointManager on the window
    if (!window.waypointManager) {
      console.error('🛠️ Cannot apply fixes: window.waypointManager is not available');
      return false;
    }

    // Store the original method to extend it
    const originalAddWaypoint = window.waypointManager.addWaypoint;
    
    // Override the addWaypoint method to use proper type enum
    window.waypointManager.addWaypoint = function(coords, name, options = {}) {
      console.log('🛠️ Enhanced addWaypoint called with options:', options);

      // FIXED: Determine if this is a waypoint by checking options OR the global flag
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

    // Store the original addWaypointAtIndex method to extend it
    const originalAddWaypointAtIndex = window.waypointManager.addWaypointAtIndex;
    
    // Override the addWaypointAtIndex method to use proper type enum
    window.waypointManager.addWaypointAtIndex = function(coords, name, index, options = {}) {
      console.log('🛠️ Enhanced addWaypointAtIndex called with options:', options);

      // FIXED: Determine if this is a waypoint by checking options OR the global flag
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

    // Store the original createWaypointMarker method to extend it
    const originalCreateWaypointMarker = window.waypointManager.createWaypointMarker;
    
    // Override the createWaypointMarker method to use proper type enum
    window.waypointManager.createWaypointMarker = function(coords, name, options = {}) {
      console.log('🛠️ Enhanced createWaypointMarker called with options:', options);

      // Check if we have the pointType from our enhanced options
      const pointType = options.pointType || 
                      (options.isWaypoint ? 'NAVIGATION_WAYPOINT' : 'LANDING_STOP');
      
      console.log(`🛠️ Creating ${pointType} marker at ${coords} with name ${name || 'Unnamed'}`);
      
      // Extend options with our enhanced type for any future processing
      const enhancedOptions = {
        ...options,
        pointType: pointType
      };
      
      // Use different colors based on point type
      if (window.mapboxgl) {
        const isWaypoint = pointType === 'NAVIGATION_WAYPOINT';
        
        // Create a marker with appropriate color based on type - directly create marker here
        try {
          const map = this.mapManager.getMap();
          if (!map) {
            console.error('Cannot create waypoint marker: Map is not initialized');
            return null;
          }
          
          // Create a marker with appropriate color based on type - much smaller now
          const marker = new window.mapboxgl.Marker({
            color: isWaypoint ? "#FFCC00" : "#FF4136", // Yellow for waypoints, red for stops
            draggable: true,
            scale: 0.3 // Make them tiny (30% of normal size)
          })
            .setLngLat(coords)
            .addTo(map);
          
          // Add popup with coordinates and name - now with a close button and favorite button
          const popup = new window.mapboxgl.Popup({
            closeButton: true, // Add close button
            closeOnClick: false,
            offset: 15, // Smaller offset for smaller marker
            className: isWaypoint ? 'waypoint-popup' : 'stop-popup', // Different class for styling
            maxWidth: '240px'
          });
          
          const displayName = name || (isWaypoint ? 'Navigation Waypoint' : 'Landing Stop');
          
          // Enhance popup with more styling based on the type
          const popupContent = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <strong style="color: ${isWaypoint ? '#825500' : '#333333'}">${displayName}</strong>
              <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords}])">❤️</span>
            </div>
            <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
            <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
            <div style="margin-top: 5px; font-size: 10px; padding: 1px 4px; background-color: ${isWaypoint ? '#FFCC00' : '#FF4136'}; color: #333; display: inline-block; border-radius: 3px;">
              ${isWaypoint ? 'NAVIGATION WAYPOINT' : 'LANDING STOP'}
            </div>
          `;
          
          popup.setHTML(popupContent);
          
          // Show popup on hover
          const markerElement = marker.getElement();
          if (markerElement) {
            // Add a CSS class to the marker element based on type
            if (isWaypoint) {
              markerElement.classList.add('waypoint-map-marker');
              
              // Make the marker element visually distinct based on type 
              // by adding a special attribute that CSS can target
              markerElement.setAttribute('data-marker-type', 'waypoint');
            } else {
              markerElement.setAttribute('data-marker-type', 'stop');
            }
            
            markerElement.addEventListener('mouseenter', () => {
              // Only show popup if zoom level is sufficient (prevents popup on distant view)
              const currentZoom = map.getZoom();
              if (currentZoom >= 9) { // Only show labels when zoomed in enough
                popup.setLngLat(marker.getLngLat()).addTo(map);
              }
            });
            
            markerElement.addEventListener('mouseleave', () => {
              popup.remove();
            });
          }
          
          // Add a global CSS style to enhance marker display if not already added
          if (!document.getElementById('marker-type-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'marker-type-styles';
            styleSheet.innerHTML = `
              /* Make waypoint markers look distinct with yellow color and reduce their visual impact */
              .mapboxgl-marker[data-marker-type="waypoint"] {
                filter: drop-shadow(0 0 1px rgba(255, 204, 0, 0.7));
                opacity: 0.8;
              }
              
              /* Add a subtle glow to stop markers with red color */
              .mapboxgl-marker[data-marker-type="stop"] {
                filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
                opacity: 0.9;
              }
              
              /* Style the popups differently based on type */
              .waypoint-popup .mapboxgl-popup-content {
                border-left: 3px solid #FFCC00;
                font-size: 11px;
              }
              
              .stop-popup .mapboxgl-popup-content {
                border-left: 3px solid #FF4136;
                font-size: 12px;
              }
              
              /* Circle markers for higher zoom levels */
              @media (min-resolution: 1dppx) {
                .mapboxgl-marker[data-marker-type="waypoint"] svg {
                  transform: scale(0.5);
                }
                
                .mapboxgl-marker[data-marker-type="stop"] svg {
                  transform: scale(0.6);
                }
              }
            `;
            document.head.appendChild(styleSheet);
          }
          
          // Add drag end event to update route
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            const markersArray = this.markers;
            const index = markersArray.indexOf(marker);
            if (index !== -1 && index < this.waypoints.length) {
              console.log(`Marker at index ${index} dragged to [${lngLat.lng}, ${lngLat.lat}]`);
              
              // Store the old coordinates for reference
              const oldCoords = this.waypoints[index].coords;
              
              // Update the waypoint coordinates
              this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
              
              // Update name if needed
              this.updateWaypointNameAfterDrag(index, [lngLat.lng, lngLat.lat]);
              
              // Update route with new waypoint
              this.updateRoute();
              
              // Trigger onChange callback to update UI
              this.triggerCallback('onChange', this.waypoints);
            }
          });
          
          return marker;
        } catch (error) {
          console.error('Error creating enhanced waypoint marker:', error);
          // Fall back to original method if our enhanced version fails
          return originalCreateWaypointMarker.call(this, coords, name, options);
        }
      } else {
        // If mapboxgl not available, fall back to original method
        return originalCreateWaypointMarker.call(this, coords, name, options);
      }
    };

    console.log('🛠️ Successfully applied waypoint vs. landing stop type fixes');
    return true;
  };

  // Set up a retry mechanism since the waypointManager might not be available immediately
  let attempts = 0;
  const maxAttempts = 10;
  const retryInterval = 500; // ms

  const attemptFix = () => {
    attempts++;
    if (window.waypointManager) {
      return applyFixes();
    } else {
      console.log(`🛠️ Waiting for waypointManager to be available (attempt ${attempts}/${maxAttempts})...`);
      if (attempts < maxAttempts) {
        setTimeout(attemptFix, retryInterval);
      } else {
        console.error('🛠️ Failed to apply fixes: window.waypointManager not available after maximum attempts');
        return false;
      }
    }
  };

  // Start the fix process
  return attemptFix();
}

// Run the fix function
fixWaypointManager();

// Track when waypoint mode is toggled to ensure the global flag is set correctly
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
          const waypointButtons = document.querySelectorAll('[data-waypoint-mode-button]');
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
}

// Run the waypoint mode tracking setup
setupWaypointModeTracking();

// Announce the fix is active
console.log('✅ Waypoint vs. Landing Stop type distinction fix is active!');
