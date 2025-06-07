/**
 * fix-waypoint-markers.js
 * 
 * This fix addresses the issue where waypoint markers appear in the top-left corner
 * instead of at their proper position on the map.
 */

(function() {
  console.log('📍 Applying fix for waypoint markers appearing in the top-left corner...');
  
  // Wait for the waypointManager to be available
  const checkInterval = setInterval(() => {
    if (!window.waypointManager) {
      return;
    }
    
    clearInterval(checkInterval);
    
    console.log('📍 Found waypointManager, patching marker creation...');
    
    // Save reference to the original method
    const originalCreateWaypointMarker = window.waypointManager.createWaypointMarker;
    
    // Replace with our fixed version
    window.waypointManager.createWaypointMarker = function(coords, name, options = {}) {
      try {
        const map = this.mapManager.getMap();
        
        // Validate essential requirements
        if (!map) {
          console.error('Cannot create waypoint marker: Map is not initialized');
          return null;
        }
        
        if (!window.mapboxgl) {
          console.error('Cannot create waypoint marker: mapboxgl not found');
          return null;
        }
        
        // Validate coordinates
        if (!coords || coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
          console.error('Invalid coordinates format for waypoint marker:', coords);
          return null;
        }
        
        // Determine if this is a waypoint or a stop
        const isWaypoint = 
          options.pointType === 'NAVIGATION_WAYPOINT' || // First check explicit point type (preferred)
          options.isWaypoint === true ||                // Then check isWaypoint flag
          options.type === 'WAYPOINT' ||                // Then check type string
          window.isWaypointModeActive === true;         // Finally use global waypoint mode flag
        
        // CRITICAL FIX: Do NOT use scale option for small markers, as it causes position issues
        // Instead, we'll use CSS to style the markers after creation
        const marker = new window.mapboxgl.Marker({
          color: isWaypoint ? 'turquoise' : '#FF4136', // Color based on type
          draggable: true,
          // Do NOT set scale or anchor here - they can cause position issues
        })
        .setLngLat(coords)
        .addTo(map);
        
        // Get the marker element to apply styling
        const markerElement = marker.getElement();
        if (markerElement) {
          // Set the data attribute for CSS targeting
          markerElement.setAttribute('data-marker-type', isWaypoint ? 'waypoint' : 'stop');
          
          // IMPORTANT: Instead of scaling with Mapbox options, apply direct CSS
          // This prevents the transform property from being overridden
          if (isWaypoint) {
            markerElement.style.width = '5px';
            markerElement.style.height = '5px';
            markerElement.style.backgroundColor = 'turquoise';
            markerElement.style.borderRadius = '50%';
            // Do NOT set transform or position properties here
          }
        }
        
        // Create popup with enhanced styling
        const popup = new window.mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 15,
          className: isWaypoint ? 'waypoint-popup' : 'stop-popup',
          maxWidth: '240px'
        });
        
        // Format the name or use a default
        const displayName = name || (isWaypoint ? 'Navigation Waypoint' : 'Landing Stop');
        
        // Create enhanced popup content with clear styling differences
        const popupContent = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="color: ${isWaypoint ? '#825500' : '#333333'}">${displayName}</strong>
            <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 18px;" onclick="window.addToFavorites('${displayName}', [${coords[0]}, ${coords[1]}])">❤️</span>
          </div>
          <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
          <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
          <div style="margin-top: 5px; font-size: 10px; padding: 1px 4px; background-color: ${isWaypoint ? '#FFCC00' : '#FF4136'}; color: #333; display: inline-block; border-radius: 3px;">
            ${isWaypoint ? 'NAVIGATION WAYPOINT' : 'LANDING STOP'}
          </div>
        `;
        
        // Set the popup HTML content
        popup.setHTML(popupContent);
        
        // Add hover behavior for showing popup
        if (markerElement) {
          // Use click instead of hover for waypoints
          markerElement.addEventListener('click', () => {
            popup.setLngLat(marker.getLngLat()).addTo(map);
          });
        }
        
        // Set up marker drag handling
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const index = this.markers.indexOf(marker);
          if (index !== -1 && index < this.waypoints.length) {
            this.waypoints[index].coords = [lngLat.lng, lngLat.lat];
            this.updateWaypointNameAfterDrag(index, [lngLat.lng, lngLat.lat]);
            this.updateRoute();
            this.triggerCallback('onChange', this.waypoints);
          }
        });
        
        return marker;
      } catch (error) {
        console.error('Error creating waypoint marker:', error);
        // Fall back to original method if our fix fails
        return originalCreateWaypointMarker.call(this, coords, name, options);
      }
    };
    
    // Fix existing markers
    if (window.waypointManager.markers) {
      const markers = window.waypointManager.markers;
      console.log(`📍 Fixing ${markers.length} existing markers`);
      
      markers.forEach((marker, index) => {
        if (!marker || !marker.getElement) return;
        
        const element = marker.getElement();
        if (!element) return;
        
        // Get the corresponding waypoint object
        const waypoint = window.waypointManager.waypoints[index];
        if (!waypoint) return;
        
        // Determine if it's a waypoint or stop
        const isWaypoint = 
          waypoint.pointType === 'NAVIGATION_WAYPOINT' || 
          waypoint.isWaypoint === true ||
          waypoint.type === 'WAYPOINT';
        
        // Update the element attributes
        element.setAttribute('data-marker-type', isWaypoint ? 'waypoint' : 'stop');
        
        // Apply direct styling
        if (isWaypoint) {
          element.style.width = '5px';
          element.style.height = '5px';
          element.style.backgroundColor = 'turquoise';
          element.style.borderRadius = '50%';
          // Do NOT set transform or position properties
        }
      });
    }
    
    console.log('✅ Waypoint markers fix applied successfully');
  }, 1000);
  
  // Set a timeout to clear the interval if waypointManager never becomes available
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
})();
