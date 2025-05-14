#!/bin/bash

# apply-waypoint-vs-stop-fix.sh
# This script applies the waypoint vs. stop distinction fix to the Fast Planner application

# Exit on error
set -e

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="${BASE_DIR}/src/components/fast-planner"

echo "Base directory: ${BASE_DIR}"
echo "App directory: ${APP_DIR}"

# Check if APP_DIR exists
if [ ! -d "${APP_DIR}" ]; then
  echo "Error: Directory ${APP_DIR} does not exist"
  exit 1
fi

# Check if FastPlannerApp.jsx exists
if [ ! -f "${APP_DIR}/FastPlannerApp.jsx" ]; then
  echo "Error: ${APP_DIR}/FastPlannerApp.jsx does not exist"
  exit 1
fi

# Backup the current state
BACKUP_FILE="${APP_DIR}/FastPlannerApp.jsx.waypoint-stop-fix-backup-$(date +%Y%m%d%H%M%S)"
cp "${APP_DIR}/FastPlannerApp.jsx" "${BACKUP_FILE}"
echo "Created backup at ${BACKUP_FILE}"

# Make sure the fixes directory exists
if [ ! -d "${APP_DIR}/fixes" ]; then
  mkdir -p "${APP_DIR}/fixes"
  echo "Created fixes directory at ${APP_DIR}/fixes"
fi

# Apply our fixes to import at the top of FastPlannerApp.jsx
echo "Updating imports in FastPlannerApp.jsx..."

# Find the import statement block for the waypoint functionality fixes
IMPORT_BLOCK=$(grep -n "// Import waypoint functionality fixes" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$IMPORT_BLOCK" ]; then
  echo "No existing waypoint functionality imports found, adding new import block..."
  
  # Look for the first import statement
  FIRST_IMPORT=$(grep -n "import " "${APP_DIR}/FastPlannerApp.jsx" | head -1 | cut -d: -f1)
  
  if [ -z "$FIRST_IMPORT" ]; then
    echo "Error: Could not find any import statements in FastPlannerApp.jsx"
    exit 1
  fi
  
  # Add a new import block after the last import statement
  LAST_IMPORT=$(grep -n "import " "${APP_DIR}/FastPlannerApp.jsx" | tail -1 | cut -d: -f1)
  
  # Add our new import block
  sed -i '' "${LAST_IMPORT}a\\
// Import waypoint functionality fixes (NO STYLE CHANGES)\\
import './fixes/fix-waypoint-vs-stop-type.js';\\
import './fixes/fix-stop-cards.js';\\
" "${APP_DIR}/FastPlannerApp.jsx"
  
  echo "Added new import block after line ${LAST_IMPORT}"
else
  # Update the existing import block
  echo "Found existing import block at line ${IMPORT_BLOCK}, updating..."
  
  # Count the number of lines in the existing import block
  IMPORT_BLOCK_LINES=$(grep -A10 "// Import waypoint functionality fixes" "${APP_DIR}/FastPlannerApp.jsx" | grep -c "import ")
  
  # Calculate the end of the import block
  IMPORT_BLOCK_END=$((IMPORT_BLOCK + IMPORT_BLOCK_LINES))
  
  # Replace the existing import block
  sed -i '' "${IMPORT_BLOCK},${IMPORT_BLOCK_END}c\\
// Import waypoint functionality fixes (NO STYLE CHANGES)\\
import './fixes/fix-waypoint-functionality.js';\\
import './fixes/fix-route-drag.js';\\
import './fixes/WaypointDebugger.js';\\
// Import new waypoint vs. landing stop distinction fixes\\
import './fixes/fix-waypoint-vs-stop-type.js';\\
import './fixes/fix-stop-cards.js';\\
" "${APP_DIR}/FastPlannerApp.jsx"
  
  echo "Updated import block from line ${IMPORT_BLOCK} to ${IMPORT_BLOCK_END}"
fi

echo "Updated imports successfully"

# Install our fix files
echo "Installing fix files..."

# Copy the fix files to the app's fixes directory
cp "${SCRIPT_DIR}/fix-waypoint-vs-stop-type.js" "${APP_DIR}/fixes/" || {
  echo "Error copying fix-waypoint-vs-stop-type.js. Creating it directly."
  cat > "${APP_DIR}/fixes/fix-waypoint-vs-stop-type.js" << 'EOF'
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
          
          // Create a marker with appropriate color based on type
          const marker = new window.mapboxgl.Marker({
            color: isWaypoint ? "#FFCC00" : "#FF4136", // Yellow for waypoints, red for stops
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
              popup.setLngLat(marker.getLngLat()).addTo(map);
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
              /* Make waypoint markers look distinct with yellow color */
              .mapboxgl-marker[data-marker-type="waypoint"] {
                filter: drop-shadow(0 0 2px rgba(255, 204, 0, 0.9));
              }
              
              /* Add a subtle glow to stop markers with red color */
              .mapboxgl-marker[data-marker-type="stop"] {
                filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
              }
              
              /* Style the popups differently based on type */
              .waypoint-popup .mapboxgl-popup-content {
                border-left: 3px solid #FFCC00;
              }
              
              .stop-popup .mapboxgl-popup-content {
                border-left: 3px solid #FF4136;
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
EOF
}

cp "${SCRIPT_DIR}/fix-stop-cards.js" "${APP_DIR}/fixes/" || {
  echo "Error copying fix-stop-cards.js. Creating it directly."
  cat > "${APP_DIR}/fixes/fix-stop-cards.js" << 'EOF'
/**
 * Fix to modify StopCardCalculator to properly distinguish between navigation waypoints and landing stops
 */

// Now modify the StopCardCalculator to filter out navigation waypoints
function fixStopCardCalculator() {
  // Create a global reference to the original calculator function that we can patch
  window.originalCalculateStopCards = null;
  
  // Function to patch StopCardCalculator once it's loaded
  const patchCalculator = () => {
    // Check if StopCardCalculator is available
    if (!window.StopCardCalculator && 
        !window.ComprehensiveFuelCalculator &&
        typeof StopCardCalculator === 'undefined') {
      console.error('🛠️ StopCardCalculator not found on window or as module');
      return false;
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
      const landingStops = waypoints.filter(wp => 
        wp.pointType === 'LANDING_STOP' || // New type
        (!wp.pointType && !wp.isWaypoint) // Backward compatibility
      );

      console.log(`🛠️ Filtered out waypoints: ${waypoints.length - landingStops.length} navigation waypoints removed, ${landingStops.length} landing stops remain`);

      // Call the original function with only landing stops
      return window.originalCalculateStopCards.call(calculatorObj, landingStops, routeStats, selectedAircraft, weather, options);
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
  return attemptPatch();
}

// Run the StopCardCalculator fix
setTimeout(fixStopCardCalculator, 1000);

// Fix RouteStatsCard to properly display the count of stops vs waypoints
function fixRouteStatsCard() {
  console.log('🛠️ Setting up RouteStatsCard fix...');

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
EOF
}

echo "Successfully installed fix files"

# Add global CSS for waypoint styling
echo "Adding global CSS styles for waypoints..."

# Check if the CSS file exists, create it if it doesn't
if [ ! -f "${APP_DIR}/waypoint-styles.css" ]; then
  cat > "${APP_DIR}/waypoint-styles.css" << 'EOF'
/* Waypoint vs Landing Stop Styles */

/* Style for navigation waypoints markers */
.mapboxgl-marker[data-marker-type="waypoint"] {
  filter: drop-shadow(0 0 2px rgba(255, 204, 0, 0.9));
}

/* Style for landing stop markers */
.mapboxgl-marker[data-marker-type="stop"] {
  filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
}

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

/* Style popups */
.waypoint-popup .mapboxgl-popup-content {
  border-left: 3px solid #FFCC00;
}

.stop-popup .mapboxgl-popup-content {
  border-left: 3px solid #FF4136;
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
EOF

  echo "Created waypoint-styles.css"
fi

# Add import for the CSS styles if it doesn't exist
CSS_IMPORT=$(grep -n "import.*waypoint-styles.css" "${APP_DIR}/FastPlannerApp.jsx" | cut -d: -f1)

if [ -z "$CSS_IMPORT" ]; then
  # Find the import section
  LAST_IMPORT=$(grep -n "import " "${APP_DIR}/FastPlannerApp.jsx" | tail -1 | cut -d: -f1)
  
  # Add import for waypoint styles
  sed -i '' "${LAST_IMPORT}a\\
import './waypoint-styles.css';\\
" "${APP_DIR}/FastPlannerApp.jsx"
  
  echo "Added import for waypoint-styles.css after line ${LAST_IMPORT}"
else
  echo "Waypoint styles CSS import already exists at line ${CSS_IMPORT}"
fi

echo "✅ Installation complete!"
echo "🔄 The changes should hot reload automatically."
echo "✈️ Navigation waypoints and 🛬 landing stops should now be properly distinguished in the application."
