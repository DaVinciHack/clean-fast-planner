/**
 * fix-waypoint-marker-size.js
 * 
 * This fix addresses issues with waypoint marker sizing and popup display:
 * 1. Makes waypoint and stop markers smaller
 * 2. Only shows popups when zoomed in enough
 * 3. Adjusts styles for better visibility
 */

(function() {
  console.log('📍 Applying fix for waypoint marker size and popup display');
  
  // Wait for the waypointManager to be available
  const checkInterval = setInterval(() => {
    if (!window.waypointManager) {
      return;
    }
    
    clearInterval(checkInterval);
    
    console.log('📍 Found waypointManager, enhancing marker display');
    
    // 1. Override createWaypointMarker to use smaller markers and control popup display
    if (typeof window.waypointManager.createWaypointMarker !== 'function') {
      console.error('📍 createWaypointMarker method not found on waypointManager');
      return;
    }
    
    const originalCreateWaypointMarker = window.waypointManager.createWaypointMarker;
    
    window.waypointManager.createWaypointMarker = function(coords, name, options = {}) {
      try {
        const map = this.mapManager.getMap();
        if (!map || !window.mapboxgl) {
          console.error('📍 Map or mapboxgl not available');
          return null;
        }
        
        // Validate coordinates
        if (!coords || coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
          console.error('📍 Invalid coordinates:', coords);
          return null;
        }
        
        // Determine waypoint type
        const isWaypoint = options.pointType === 'NAVIGATION_WAYPOINT' || 
                           options.isWaypoint === true || 
                           options.type === 'WAYPOINT' || 
                           window.isWaypointModeActive === true;
        
        // MARKER SIZE FIX: Create a much smaller marker
        const marker = new window.mapboxgl.Marker({
          color: isWaypoint ? "turquoise" : "#FF4136",
          draggable: true,
          scale: 0.1 // Make them tiny (3px) by scaling way down
        })
        .setLngLat(coords)
        .addTo(map);
        
        // Create a popup with better styling
        const popup = new window.mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 12, // Smaller offset for smaller marker
          className: isWaypoint ? 'waypoint-popup' : 'stop-popup',
          maxWidth: '220px'
        });
        
        const displayName = name || (isWaypoint ? 'Navigation Waypoint' : 'Landing Stop');
        
        // Create a label element for the marker (initially hidden by CSS)
        if (isWaypoint) {
          // Create label element
          const labelDiv = document.createElement('div');
          labelDiv.className = 'waypoint-label';
          labelDiv.textContent = displayName;
          markerElement.appendChild(labelDiv);
        }
        
        // Improve popup content with cleaner design
        const popupContent = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: ${isWaypoint ? '#825500' : '#333333'}; font-size: 11px;">${displayName}</strong>
            <span class="favorite-button" title="Add to favorites" style="cursor: pointer; font-size: 14px;" 
                  onclick="window.addToFavorites('${displayName}', [${coords[0]}, ${coords[1]}])">❤️</span>
          </div>
          <div style="font-size: 10px;">
            <span class="coord-label">Lat:</span> <span class="coord-value">${coords[1].toFixed(5)}</span><br>
            <span class="coord-label">Lon:</span> <span class="coord-value">${coords[0].toFixed(5)}</span>
          </div>
          <div style="margin-top: 3px; font-size: 8px; padding: 1px 4px; background-color: ${isWaypoint ? '#FFCC00' : '#FF4136'}; 
                     color: #333; display: inline-block; border-radius: 3px;">
            ${isWaypoint ? 'NAVIGATION WAYPOINT' : 'LANDING STOP'}
          </div>
        `;
        
        popup.setHTML(popupContent);
        
        // Add event listeners to marker element
        const markerElement = marker.getElement();
        if (markerElement) {
          // Add data attribute for CSS targeting
          markerElement.setAttribute('data-marker-type', isWaypoint ? 'waypoint' : 'stop');
          
          // POPUP DISPLAY FIX: Only show popup when zoomed in enough
          markerElement.addEventListener('mouseenter', () => {
            // Get current zoom level
            const currentZoom = map.getZoom();
            
            // Only show popup if zoomed in enough
            if (currentZoom >= 12) {
              popup.setLngLat(marker.getLngLat()).addTo(map);
            }
          });
          
          markerElement.addEventListener('mouseleave', () => {
            popup.remove();
          });
          
          // Double click to zoom to the marker
          markerElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            map.flyTo({
              center: marker.getLngLat(),
              zoom: 10,
              speed: 1.5
            });
          });
        }
        
        // Add enhanced CSS styles for markers and popups if not already added
        if (!document.getElementById('enhanced-marker-styles')) {
          const styleSheet = document.createElement('style');
          styleSheet.id = 'enhanced-marker-styles';
          styleSheet.innerHTML = `
            /* Marker styles */
            .mapboxgl-marker[data-marker-type="waypoint"] {
              filter: drop-shadow(0 0 1px rgba(255, 204, 0, 0.7));
              opacity: 0.8;
            }
            
            .mapboxgl-marker[data-marker-type="stop"] {
              filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
              opacity: 0.9;
            }
            
            /* Scale down marker SVGs */
            .mapboxgl-marker[data-marker-type="waypoint"] svg,
            .mapboxgl-marker[data-marker-type="stop"] svg {
              transform-origin: center;
              transform: scale(0.2); /* Make them tiny */
            }
            
            /* Adjust marker appearance based on zoom level */
            .mapboxgl-map[data-zoom="low"] .mapboxgl-marker svg {
              transform: scale(0.15); /* Smaller at low zoom */
            }
            
            .mapboxgl-map[data-zoom="medium"] .mapboxgl-marker svg {
              transform: scale(0.3); /* Medium at medium zoom */
            }
            
            .mapboxgl-map[data-zoom="high"] .mapboxgl-marker svg {
              transform: scale(0.5); /* Larger at high zoom */
            }
            
            /* Popup styles */
            .waypoint-popup .mapboxgl-popup-content {
              border-left: 3px solid #FFCC00;
              font-size: 10px;
              padding: 6px 8px;
            }
            
            .stop-popup .mapboxgl-popup-content {
              border-left: 3px solid #FF4136;
              font-size: 10px;
              padding: 6px 8px;
            }
            
            /* Adjust popup arrow position */
            .waypoint-popup .mapboxgl-popup-tip,
            .stop-popup .mapboxgl-popup-tip {
              width: 8px;
              height: 8px;
            }
            
            /* Pixel-perfect marker sizing for high-DPI displays */
            @media (min-resolution: 1dppx) {
              .mapboxgl-marker[data-marker-type="waypoint"] svg {
                transform: scale(0.1); /* Tiny for waypoints */
              }
              
              .mapboxgl-marker[data-marker-type="stop"] svg {
                transform: scale(0.3); /* Slightly larger for stops */
              }
              
              /* Zoom-based marker sizing */
              .mapboxgl-map[data-zoom="low"] .mapboxgl-marker[data-marker-type="waypoint"] svg {
                transform: scale(0.1); /* Tiny at low zoom */
              }
              
              .mapboxgl-map[data-zoom="medium"] .mapboxgl-marker[data-marker-type="waypoint"] svg {
                transform: scale(0.2); /* Slightly larger at medium zoom */
              }
              
              .mapboxgl-map[data-zoom="high"] .mapboxgl-marker[data-marker-type="waypoint"] svg {
                transform: scale(0.4); /* Largest at high zoom */
              }
            }
            
            /* Waypoint labels that appear at higher zoom levels */
            .waypoint-label {
              display: none; /* Hidden by default */
              position: absolute;
              bottom: 10px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(36, 43, 52, 0.8);
              color: white;
              font-size: 8px;
              padding: 2px 4px;
              border-radius: 2px;
              white-space: nowrap;
              pointer-events: none;
              border: 1px solid rgba(30, 143, 254, 0.5);
              text-align: center;
              z-index: 1;
            }
            
            /* Show labels at medium zoom */
            .mapboxgl-map[data-zoom="medium"] .waypoint-label {
              display: block;
              font-size: 8px;
            }
            
            /* Larger labels at high zoom */
            .mapboxgl-map[data-zoom="high"] .waypoint-label {
              display: block;
              font-size: 10px;
              padding: 3px 5px;
            }
            
            /* Hover effects */
            .mapboxgl-marker:hover {
              z-index: 10 !important;
              filter: brightness(1.2) !important;
            }
          `;
          
          document.head.appendChild(styleSheet);
          console.log('📍 Added enhanced marker styles to document');
        }
        
        // Add drag event handler
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const markersArray = this.markers;
          const index = markersArray.indexOf(marker);
          
          if (index !== -1 && index < this.waypoints.length) {
            console.log(`📍 Marker at index ${index} dragged to [${lngLat.lng}, ${lngLat.lat}]`);
            
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
        console.error('📍 Error creating waypoint marker:', error);
        
        // Fall back to original method if enhanced version fails
        return originalCreateWaypointMarker.call(this, coords, name, options);
      }
    };
    
    // 2. Fix existing markers if there are any
    console.log('📍 Checking for existing markers to update...');
    
    const existingMarkers = window.waypointManager.markers || [];
    if (existingMarkers.length > 0) {
      console.log(`📍 Found ${existingMarkers.length} existing markers to update`);
      
      // Add styles for existing markers
      if (!document.getElementById('existing-marker-fix')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'existing-marker-fix';
        styleSheet.innerHTML = `
          /* Target all existing markers */
          .mapboxgl-marker {
            transform-origin: center;
            opacity: 0.8;
          }
          
          /* Scale down all marker SVGs */
          .mapboxgl-marker svg {
            transform-origin: center;
            transform: scale(0.1); /* Make them tiny (3px) */
          }
          
          /* Turquoise dots for waypoints */
          .mapboxgl-marker[data-marker-type="waypoint"] {
            filter: drop-shadow(0 0 1px rgba(64, 224, 208, 0.7));
          }
          
          /* Red dots for stops */
          .mapboxgl-marker[data-marker-type="stop"] {
            filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
          }
          
          /* Zoom-based marker sizing */
          .mapboxgl-map[data-zoom="low"] .mapboxgl-marker svg {
            transform: scale(0.1); /* Tiny at low zoom */
          }
          
          .mapboxgl-map[data-zoom="medium"] .mapboxgl-marker svg {
            transform: scale(0.2); /* Medium at medium zoom */
          }
          
          .mapboxgl-map[data-zoom="high"] .mapboxgl-marker svg {
            transform: scale(0.4); /* Larger at high zoom */
          }
        `;
        
        document.head.appendChild(styleSheet);
        console.log('📍 Added fixes for existing markers');
      }
      
      // Add zoom level listener for existing markers
      const map = window.waypointManager.mapManager.getMap();
      if (map) {
        // Set initial zoom level attribute
        const initialZoom = map.getZoom();
        const zoomLevel = initialZoom < 9 ? 'low' : (initialZoom < 13 ? 'medium' : 'high');
        map.getContainer().setAttribute('data-zoom', zoomLevel);
        
        // Update zoom level attribute on zoom change
        map.on('zoomend', () => {
          const currentZoom = map.getZoom();
          console.log(`📍 Map zoom changed to: ${currentZoom}`);
          
          // Set zoom level attribute for CSS targeting
          const zoomLevel = currentZoom < 9 ? 'low' : (currentZoom < 13 ? 'medium' : 'high');
          map.getContainer().setAttribute('data-zoom', zoomLevel);
          
          // Remove any open popups when zoomed out
          if (currentZoom < 12) {
            const openPopups = document.querySelectorAll('.mapboxgl-popup');
            if (openPopups.length > 0) {
              console.log(`📍 Removing ${openPopups.length} open popups due to zoom level`);
              openPopups.forEach(popup => popup.remove());
            }
          }
        });
      }
    }
    
    console.log('✅ Successfully applied waypoint marker size and popup display fix');
  }, 1000);
  
  // Set a timeout to clear the interval if waypointManager never becomes available
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 30000);
})();
