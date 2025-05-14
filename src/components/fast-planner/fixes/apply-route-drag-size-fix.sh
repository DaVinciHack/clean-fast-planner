#!/bin/bash

# apply-route-drag-size-fix.sh
# This script applies both the enhanced route drag fix and waypoint marker size fix

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.waypoint-drag-size-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Create the fix-waypoint-marker-size.js file
echo "Creating fix-waypoint-marker-size.js..."
cat > "${SCRIPT_DIR}/fix-waypoint-marker-size.js" << 'EOF'
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
          color: isWaypoint ? "#FFCC00" : "#FF4136",
          draggable: true,
          scale: 0.25 // Make them tiny (25% of normal size)
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
            if (currentZoom >= 9) {
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
              transform: scale(0.6);
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
                transform: scale(0.4);
              }
              
              .mapboxgl-marker[data-marker-type="stop"] svg {
                transform: scale(0.5);
              }
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
            transform: scale(0.5);
          }
        `;
        
        document.head.appendChild(styleSheet);
        console.log('📍 Added fixes for existing markers');
      }
      
      // Add zoom level listener for existing markers
      const map = window.waypointManager.mapManager.getMap();
      if (map) {
        map.on('zoomend', () => {
          const currentZoom = map.getZoom();
          console.log(`📍 Map zoom changed to: ${currentZoom}`);
          
          // Remove any open popups when zoomed out
          if (currentZoom < 9) {
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
EOF

# Create the enhanced route drag fix file
echo "Creating enhanced-fix-route-drag.js..."
cat > "${SCRIPT_DIR}/enhanced-fix-route-drag.js" << 'EOF'
/**
 * enhanced-fix-route-drag.js
 * 
 * Enhanced fix for the route dragging issue where waypoints are incorrectly
 * added to the end of the waypoint list instead of at the proper position.
 * 
 * This fix completely replaces fix-route-drag.js with an improved implementation.
 */

(function() {
  console.log('🔄 Applying enhanced fix for route dragging and waypoint insertion');
  
  // Wait for all required objects to be available before applying fixes
  const checkInterval = setInterval(() => {
    if (!window.mapInteractionHandler || !window.waypointManager) {
      return;
    }
    
    clearInterval(checkInterval);
    console.log('🔄 Found required managers, applying enhanced route drag fix');
    
    // 1. Fix for WaypointManager.findPathInsertIndex method
    // This is critical for correctly determining where to insert new waypoints
    if (typeof window.waypointManager.findPathInsertIndex !== 'function') {
      console.error('🔄 findPathInsertIndex method not found on waypointManager');
      return;
    }
    
    const originalFindPathInsertIndex = window.waypointManager.findPathInsertIndex;
    
    // Override with enhanced version that does better logging and validation
    window.waypointManager.findPathInsertIndex = function(clickedPoint) {
      console.log(`🔄 Finding insert index for clicked point at [${clickedPoint.lng}, ${clickedPoint.lat}]`);
      
      // Handle cases with fewer than 2 waypoints
      if (this.waypoints.length < 2) {
        console.log('🔄 Route has fewer than 2 waypoints, appending to end');
        return this.waypoints.length;
      }
      
      let minDistance = Number.MAX_VALUE;
      let insertIndex = 1;
      let closestSegmentInfo = null;
      
      try {
        // First validate that we have all our dependencies
        if (!window.turf) {
          console.error('🔄 turf.js is not available, using default insert index');
          return Math.max(1, Math.min(this.waypoints.length - 1, Math.floor(this.waypoints.length / 2)));
        }
        
        // Iterate through segments to find the closest one
        for (let i = 0; i < this.waypoints.length - 1; i++) {
          const segment = window.turf.lineString([this.waypoints[i].coords, this.waypoints[i+1].coords]);
          const point = window.turf.point([clickedPoint.lng, clickedPoint.lat]);
          const nearestPoint = window.turf.nearestPointOnLine(segment, point, { units: 'nauticalmiles' });
          
          if (nearestPoint.properties.dist < minDistance) {
            minDistance = nearestPoint.properties.dist;
            insertIndex = i + 1;
            closestSegmentInfo = {
              segmentStart: i,
              segmentEnd: i + 1,
              nearestPoint: nearestPoint.geometry.coordinates,
              distance: nearestPoint.properties.dist
            };
          }
        }
        
        // Validate the result is sensible
        if (insertIndex < 1) {
          console.warn('🔄 Insert index was < 1, correcting to 1');
          insertIndex = 1;
        } else if (insertIndex > this.waypoints.length) {
          console.warn(`🔄 Insert index was > ${this.waypoints.length}, correcting to ${this.waypoints.length}`);
          insertIndex = this.waypoints.length;
        }
        
        console.log(`🔄 Found closest path segment between waypoints ${closestSegmentInfo.segmentStart} and ${closestSegmentInfo.segmentEnd}`);
        console.log(`🔄 Calculated insertion index: ${insertIndex}`);
        
        // Display the closest segment to make debugging easier
        console.log(`🔄 Segment [${closestSegmentInfo.segmentStart}]: ${this.waypoints[closestSegmentInfo.segmentStart].name}`);
        console.log(`🔄 Segment [${closestSegmentInfo.segmentEnd}]: ${this.waypoints[closestSegmentInfo.segmentEnd].name}`);
        
        return insertIndex;
      } catch (error) {
        console.error('🔄 Error finding path insert index:', error);
        
        // Fall back to the middle of the route as a safe default
        const defaultIndex = Math.max(1, Math.min(this.waypoints.length - 1, Math.floor(this.waypoints.length / 2)));
        console.log(`🔄 Using default insert index: ${defaultIndex}`);
        return defaultIndex;
      }
    };
    
    // 2. Fix the MapInteractionHandler.handleRouteDragComplete method
    // This is the method that actually adds the waypoint when a route is dragged
    if (typeof window.mapInteractionHandler.handleRouteDragComplete !== 'function') {
      console.error('🔄 handleRouteDragComplete method not found on mapInteractionHandler');
      return;
    }
    
    const originalHandleRouteDragComplete = window.mapInteractionHandler.handleRouteDragComplete;
    
    window.mapInteractionHandler.handleRouteDragComplete = function(insertIndex, coords, dragData = {}) {
      console.log(`🔄 Enhanced handleRouteDragComplete called with index: ${insertIndex}`);
      console.log(`🔄 Coordinates: [${coords[0]}, ${coords[1]}]`);
      console.log(`🔄 Drag data:`, dragData);
      
      // CRITICAL FIX: Get current waypoint mode and respect it
      const isWaypointMode = dragData.isWaypointMode === true || window.isWaypointModeActive === true;
      
      console.log(`🔄 Current waypoint mode: ${isWaypointMode ? 'WAYPOINT' : 'NORMAL'}`);
      
      // CRITICAL FIX: Validate insertion index is reasonable
      if (typeof insertIndex !== 'number' || insertIndex < 0) {
        console.error(`🔄 Invalid insertIndex: ${insertIndex}, will use 0 instead`);
        insertIndex = 0;
      }
      
      const waypointCount = this.waypointManager.getWaypoints().length;
      if (insertIndex > waypointCount) {
        console.error(`🔄 insertIndex (${insertIndex}) > waypointCount (${waypointCount}), will use ${waypointCount} instead`);
        insertIndex = waypointCount;
      }
      
      console.log(`🔄 Using final insertIndex: ${insertIndex}`);
      
      // CRITICAL FIX: Directly add the waypoint with the appropriate type based on mode
      try {
        if (isWaypointMode) {
          // In waypoint mode, add a navigation waypoint
          let nearestOsdkWp = null;
          if (this.platformManager && typeof this.platformManager.findNearestOsdkWaypoint === 'function') {
            nearestOsdkWp = this.platformManager.findNearestOsdkWaypoint(coords[1], coords[0], 5);
          }
          
          if (nearestOsdkWp) {
            console.log(`🔄 Snapping to OSDK Waypoint: ${nearestOsdkWp.name} at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              nearestOsdkWp.coordinates,
              nearestOsdkWp.name,
              insertIndex,
              { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
            );
          } else {
            console.log(`🔄 Adding generic waypoint at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              coords,
              `Waypoint ${insertIndex + 1}`,
              insertIndex,
              { isWaypoint: true, type: 'WAYPOINT', pointType: 'NAVIGATION_WAYPOINT' }
            );
          }
          
          // CRITICAL: Add a debug check to verify insertion worked correctly
          setTimeout(() => {
            const waypointsAfter = this.waypointManager.getWaypoints();
            console.log(`🔄 DEBUG - Current waypoints (${waypointsAfter.length}): [${waypointsAfter.map(wp => wp.name).join(', ')}]`);
            console.log(`🔄 DEBUG - Waypoint at index ${insertIndex} is now: ${waypointsAfter[insertIndex]?.name || 'undefined'}`);
          }, 100);
          
          return; // Don't call the original method
        } else {
          // In normal mode, add a landing stop
          let nearestPlatform = null;
          if (this.platformManager && typeof this.platformManager.findNearestPlatform === 'function') {
            nearestPlatform = this.platformManager.findNearestPlatform(coords[1], coords[0], 5);
          }
          
          if (nearestPlatform) {
            console.log(`🔄 Snapping to Platform: ${nearestPlatform.name} at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              nearestPlatform.coordinates,
              nearestPlatform.name,
              insertIndex,
              { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' }
            );
          } else {
            console.log(`🔄 Adding generic stop at index ${insertIndex}`);
            this.waypointManager.addWaypointAtIndex(
              coords,
              `Stop ${insertIndex + 1}`,
              insertIndex,
              { isWaypoint: false, type: 'STOP', pointType: 'LANDING_STOP' }
            );
          }
          
          // CRITICAL: Add a debug check to verify insertion worked correctly
          setTimeout(() => {
            const waypointsAfter = this.waypointManager.getWaypoints();
            console.log(`🔄 DEBUG - Current waypoints (${waypointsAfter.length}): [${waypointsAfter.map(wp => wp.name).join(', ')}]`);
            console.log(`🔄 DEBUG - Waypoint at index ${insertIndex} is now: ${waypointsAfter[insertIndex]?.name || 'undefined'}`);
          }, 100);
          
          return; // Don't call the original method
        }
      } catch (err) {
        console.error('🔄 Error in enhanced handleRouteDragComplete:', err);
        
        // Fall back to original method if there was an error
        console.log('🔄 Falling back to original method due to error');
        return originalHandleRouteDragComplete.call(this, insertIndex, coords, dragData);
      }
    };
    
    console.log('✅ Successfully applied enhanced route drag fix. Dragging the route line should now correctly add waypoints at the proper position.');
    
    // Automatically call setupRouteDragging if it wasn't already set up
    if (window.waypointManager && !window.waypointManager._routeDragHandlers) {
      console.log('🔄 Automatically calling setupRouteDragging with enhanced handlers');
      window.waypointManager.setupRouteDragging(window.mapInteractionHandler.handleRouteDragComplete.bind(window.mapInteractionHandler));
    }
  }, 1000);
})();
EOF

# Now find all instances of fix-route-drag.js in FastPlannerApp.jsx and replace with our new fixes
echo "Updating FastPlannerApp.jsx to use our enhanced fixes..."

# Find the line where fix-route-drag.js is imported
ROUTE_DRAG_LINE=$(grep -n "import './fixes/fix-route-drag.js'" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$ROUTE_DRAG_LINE" ]; then
  echo "Warning: Could not find fix-route-drag.js import line. Trying to find the imports section instead..."
  IMPORT_SECTION=$(grep -n "// Import essential fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)
  
  if [ -z "$IMPORT_SECTION" ]; then
    echo "Error: Could not find imports section. Please add the new fixes manually."
    exit 1
  fi
  
  # Add new imports at the end of the import section
  echo "Adding new imports at the end of the import section..."
  sed -i '' -e "${IMPORT_SECTION}a\\
import './fixes/enhanced-fix-route-drag.js'; // Enhanced drag fix\\
import './fixes/fix-waypoint-marker-size.js'; // Smaller markers with better popups" "${APP_DIR}/FastPlannerApp.jsx"
else
  # Replace the existing import with our enhanced version
  echo "Replacing fix-route-drag.js import with enhanced fixes..."
  sed -i '' -e "${ROUTE_DRAG_LINE}s#import './fixes/fix-route-drag.js';#import './fixes/enhanced-fix-route-drag.js'; // Enhanced drag fix\nimport './fixes/fix-waypoint-marker-size.js'; // Smaller markers with better popups#" "${APP_DIR}/FastPlannerApp.jsx"
fi

# Make the scripts executable
chmod +x "${SCRIPT_DIR}/enhanced-fix-route-drag.js"
chmod +x "${SCRIPT_DIR}/fix-waypoint-marker-size.js"

echo "✅ Successfully applied waypoint drag and size fixes!"
echo "These fixes should ensure proper waypoint insertion when dragging and make waypoint pins smaller with labels only showing when zoomed in."
