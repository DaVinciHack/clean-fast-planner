#!/bin/bash

# apply-waypoint-marker-fix.sh
# Apply the waypoint marker positioning fix to the Fast Planner

echo "🚀 Applying waypoint marker positioning fix..."

# Check if main FastPlannerApp.jsx file exists
if [ ! -f ./src/components/fast-planner/FastPlannerApp.jsx ]; then
  echo "❌ ERROR: FastPlannerApp.jsx not found in expected location"
  exit 1
fi

# Check if the waypoint-styles.css file exists
if [ ! -f ./src/components/fast-planner/waypoint-styles.css ]; then
  echo "⚠️ WARNING: waypoint-styles.css not found, creating it from scratch"
  # Create a minimal version of waypoint-styles.css
  cat > ./src/components/fast-planner/waypoint-styles.css << 'EOL'
/* Waypoint vs Landing Stop Styles */

/* Style for navigation waypoints markers */
.mapboxgl-marker[data-marker-type="waypoint"] {
  filter: drop-shadow(0 0 2px rgba(255, 204, 0, 0.9));
}

/* Style for landing stop markers */
.mapboxgl-marker[data-marker-type="stop"] {
  filter: drop-shadow(0 0 1px rgba(255, 65, 54, 0.7));
}

/* Make waypoint markers stay in the right place */
.mapboxgl-marker[data-marker-type="waypoint"] {
  will-change: auto !important;
}

/* Style waypoint markers as small white dots with turquoise border */
.mapboxgl-marker[data-marker-type="waypoint"] svg {
  fill: white !important;
  stroke: turquoise !important;
  stroke-width: 1px !important;
}

/* Add white star in center of waypoint markers */
.mapboxgl-marker[data-marker-type="waypoint"]::after {
  content: "✦";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 6px;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
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
EOL
fi

# Check if the fixes directory exists
if [ ! -d ./src/components/fast-planner/fixes ]; then
  echo "Creating fixes directory"
  mkdir -p ./src/components/fast-planner/fixes
fi

# Create fix-waypoint-markers.js
echo "Creating fix-waypoint-markers.js"
cat > ./src/components/fast-planner/fixes/fix-waypoint-markers.js << 'EOL'
/**
 * fix-waypoint-markers.js
 * 
 * This fix addresses issues with waypoint markers not staying in place,
 * particularly for navigation waypoints added in waypoint mode.
 */

(function() {
  console.log('🌟 Applying fix for waypoint marker styling');
  
  // Add a style element with the CSS fixes
  const styleElement = document.createElement('style');
  styleElement.id = 'waypoint-markers-fix-styles';
  styleElement.innerHTML = `
    /* Make waypoints appear as small white dots with turquoise outline */
    .mapboxgl-marker[data-marker-type="waypoint"] svg {
      fill: white !important;
      stroke: turquoise !important;
      stroke-width: 1px !important;
    }
    
    /* Ensure the marker stays in the correct position */
    .mapboxgl-marker {
      will-change: auto !important;
    }
    
    /* Fix for markers to maintain proper positioning */
    .mapboxgl-marker[data-marker-type="waypoint"] {
      position: absolute !important;
      z-index: 10;
      /* DO NOT set transform: none as it breaks positioning */
    }
    
    /* Make waypoint markers show up properly */
    .mapboxgl-marker[data-marker-type="waypoint"] .mapboxgl-marker-anchor-center {
      position: absolute !important;
    }
  `;
  
  // Add the style element to the document head
  document.head.appendChild(styleElement);
  
  console.log('✅ Applied waypoint marker styling fix');
})();
EOL

# Create waypoint-marker-position-fix.js
echo "Creating waypoint-marker-position-fix.js"
cat > ./src/components/fast-planner/fixes/waypoint-marker-position-fix.js << 'EOL'
/**
 * Fix for waypoint marker positioning in MapBox
 * This script is directly injected into the page to fix waypoint marker positioning issues
 */

(function() {
  /**
   * Fix waypoint marker positioning issue
   * This function runs periodically to look for waypoint markers
   * that may be in the wrong position (e.g., top-left corner).
   */
  function fixWaypointMarkers() {
    // Log that the fix is running
    console.log('🔍 Checking for waypoint markers in the wrong position...');
    
    // Find all waypoint markers
    const waypoints = document.querySelectorAll('.mapboxgl-marker[data-marker-type="waypoint"]');
    
    if (waypoints.length === 0) {
      console.log('No waypoint markers found.');
      return;
    }
    
    console.log(`Found ${waypoints.length} waypoint markers.`);
    
    // Check each waypoint
    waypoints.forEach((waypoint, index) => {
      // Get waypoint position
      const rect = waypoint.getBoundingClientRect();
      
      // Check if position looks wrong (e.g., in top-left corner)
      if (rect.top < 50 && rect.left < 50) {
        console.log(`Waypoint ${index} appears to be in the wrong position. Attempting to fix...`);
        
        // Try to get the marker instance and update its position
        const marker = waypoint._marker;
        if (marker && typeof marker.setLngLat === 'function' && typeof marker.getLngLat === 'function') {
          const lngLat = marker.getLngLat();
          
          // Force update the position
          marker.setLngLat(lngLat);
          
          console.log('Applied position fix to waypoint marker');
        }
      }
    });
  }
  
  /**
   * Fix for MapBox GL Marker class
   * This patches the MapBox GL Marker class to ensure
   * that waypoint markers stay in the correct position.
   */
  function patchMapboxMarkers() {
    // Check if mapboxgl is available
    if (!window.mapboxgl || !window.mapboxgl.Marker) {
      console.log('MapBox GL not available. Will try again later.');
      return false;
    }
    
    console.log('Patching MapBox GL Marker class...');
    
    try {
      // Store the original setLngLat method
      const originalSetLngLat = window.mapboxgl.Marker.prototype.setLngLat;
      
      // Create a patched version that ensures proper styling
      window.mapboxgl.Marker.prototype.setLngLat = function(lngLat) {
        // Call the original method
        const result = originalSetLngLat.call(this, lngLat);
        
        // Post-processing for waypoint markers
        const el = this.getElement();
        if (el && el.getAttribute('data-marker-type') === 'waypoint') {
          // Make sure the marker stays active
          el.style.willChange = 'auto';
          
          // Ensure the marker is properly positioned
          if (this._map) {
            const pos = this._map.project(this._lngLat);
            this._pos = pos;
            
            // Log position (for debugging)
            // console.log(`Updated waypoint marker position: [${lngLat.lng}, ${lngLat.lat}] -> [${pos.x}, ${pos.y}]`);
          }
        }
        
        return result;
      };
      
      console.log('Successfully patched MapBox GL Marker class.');
      return true;
    } catch (error) {
      console.error('Error patching MapBox GL Marker class:', error);
      return false;
    }
  }
  
  /**
   * Add global CSS fixes
   */
  function addGlobalCSSFixes() {
    const style = document.createElement('style');
    style.id = 'mapbox-waypoint-fixes';
    style.innerHTML = `
      /* Make waypoint markers stay in the right place */
      .mapboxgl-marker[data-marker-type="waypoint"] {
        will-change: auto !important;
      }
      
      /* Style waypoint markers as small white dots with turquoise border */
      .mapboxgl-marker[data-marker-type="waypoint"] svg {
        fill: white !important;
        stroke: turquoise !important;
        stroke-width: 1px !important;
      }
      
      /* Add white star in center of waypoint markers */
      .mapboxgl-marker[data-marker-type="waypoint"]::after {
        content: "✦";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 6px;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add the CSS fixes
  addGlobalCSSFixes();
  
  // Try to patch the marker class
  let patchSuccessful = patchMapboxMarkers();
  
  // If not successful, try again when mapboxgl is loaded
  if (!patchSuccessful) {
    const patchInterval = setInterval(() => {
      patchSuccessful = patchMapboxMarkers();
      if (patchSuccessful) {
        clearInterval(patchInterval);
      }
    }, 1000);
    
    // Clear after 30 seconds
    setTimeout(() => {
      clearInterval(patchInterval);
    }, 30000);
  }
  
  // Set up periodic fix checks
  const fixInterval = setInterval(fixWaypointMarkers, 2000);
  
  // Clear after 3 minutes
  setTimeout(() => {
    clearInterval(fixInterval);
  }, 180000);
  
  // Run once immediately
  setTimeout(fixWaypointMarkers, 1000);
  
  // Run again after a few seconds (when map might be fully loaded)
  setTimeout(fixWaypointMarkers, 5000);
  
  console.log('🚀 Waypoint marker positioning fix installed.');
})();
EOL

# Create fix-waypoint-corner-bug.js
echo "Creating fix-waypoint-corner-bug.js"
cat > ./src/components/fast-planner/fixes/fix-waypoint-corner-bug.js << 'EOL'
/**
 * fix-waypoint-corner-bug.js
 * 
 * This script specifically addresses the bug where waypoint markers
 * appear in the top-left corner of the screen instead of on the map
 * where they should be.
 */

(function() {
  console.log('🌟 Applying waypoint corner bug fix');
  
  // We'll use mutation observers to watch for waypoint markers being added to the DOM
  // When they appear in the wrong place, we'll fix them
  
  // Create a mutation observer to watch for new markers
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Only process added nodes
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check each added node
        mutation.addedNodes.forEach(function(node) {
          // Only process element nodes
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          
          // Check if this is a mapboxgl-marker
          if (node.classList && node.classList.contains('mapboxgl-marker')) {
            // Check if this is a waypoint marker
            if (node.getAttribute('data-marker-type') === 'waypoint') {
              fixWaypointMarker(node);
            } else if (!node.hasAttribute('data-marker-type')) {
              // If it doesn't have a data-marker-type yet, it might get one soon
              // Schedule a check for it
              setTimeout(() => {
                if (node.getAttribute('data-marker-type') === 'waypoint') {
                  fixWaypointMarker(node);
                }
              }, 100);
            }
          }
          
          // Check children recursively (for nested elements)
          if (node.querySelectorAll) {
            const waypointMarkers = node.querySelectorAll('.mapboxgl-marker[data-marker-type="waypoint"]');
            waypointMarkers.forEach(fixWaypointMarker);
          }
        });
      }
    });
  });
  
  // Function to fix a waypoint marker that's in the wrong position
  function fixWaypointMarker(marker) {
    // First check if it's in the wrong position (near the top-left corner)
    const rect = marker.getBoundingClientRect();
    
    if (rect.top < 50 && rect.left < 50) {
      console.log('Found waypoint marker in the wrong position - fixing it');
      
      // Mark it as fixed
      marker.setAttribute('data-fixed', 'true');
      
      // Get the marker's MapBox instance
      let mapboxMarker = marker._marker;
      
      if (!mapboxMarker) {
        // Try to find it from the global state
        if (window.waypointManager && window.waypointManager.markers) {
          // Find the marker in the waypointManager's markers array
          window.waypointManager.markers.forEach(m => {
            if (m.getElement() === marker) {
              mapboxMarker = m;
            }
          });
        }
      }
      
      if (mapboxMarker) {
        // Get the marker's coordinates
        const lngLat = mapboxMarker.getLngLat();
        
        // Force update the marker's position by setting its LngLat
        mapboxMarker.setLngLat(lngLat);
        
        // Apply CSS fixes
        marker.style.display = 'block';
        marker.style.willChange = 'auto';
        
        if (marker.querySelector('svg')) {
          // Fix the SVG styling
          const svg = marker.querySelector('svg');
          svg.style.fill = 'white';
          svg.style.stroke = 'turquoise';
          svg.style.strokeWidth = '1px';
        }
        
        console.log('Fixed waypoint marker position');
      } else {
        console.log('Could not find mapbox marker instance');
      }
    }
  }
  
  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Run an initial check for existing waypoint markers
  function checkExistingMarkers() {
    const waypointMarkers = document.querySelectorAll('.mapboxgl-marker[data-marker-type="waypoint"]');
    
    if (waypointMarkers.length > 0) {
      console.log(`Found ${waypointMarkers.length} existing waypoint markers to check`);
      waypointMarkers.forEach(fixWaypointMarker);
    }
  }
  
  // Run now
  checkExistingMarkers();
  
  // Run after a short delay too
  setTimeout(checkExistingMarkers, 1000);
  
  // And run periodically for a little while
  const intervalId = setInterval(checkExistingMarkers, 2000);
  setTimeout(() => {
    clearInterval(intervalId);
    console.log('Waypoint corner bug fix: Stopped periodic checks');
  }, 30000);
  
  console.log('✅ Waypoint corner bug fix applied');
})();
EOL

# Backup the original file
BACKUP_FILE="./src/components/fast-planner/FastPlannerApp.jsx.waypoint-marker-fix-backup-$(date +%Y%m%d%H%M%S)"
cp ./src/components/fast-planner/FastPlannerApp.jsx $BACKUP_FILE
echo "✅ Created backup of FastPlannerApp.jsx at $BACKUP_FILE"

# Apply the fix (add import of the fix scripts)
if ! grep -q "fix-waypoint-markers.js" ./src/components/fast-planner/FastPlannerApp.jsx; then
  # Add the import line after existing panel-interaction-fix.css import
  sed -i '' "s|import './fixes/panel-interaction-fix.css'; // Keep CSS fixes|import './fixes/panel-interaction-fix.css'; // Keep CSS fixes\nimport './fixes/fix-waypoint-markers.js'; // Fix for waypoint marker styling|" ./src/components/fast-planner/FastPlannerApp.jsx
  echo "✅ Added fix script import to FastPlannerApp.jsx"
else
  echo "ℹ️ Fix script import already exists in FastPlannerApp.jsx"
fi

# Add the positioning fix import
if ! grep -q "waypoint-marker-position-fix.js" ./src/components/fast-planner/FastPlannerApp.jsx; then
  # Add the import line after existing fix-waypoint-markers.js import
  sed -i '' "s|import './fixes/fix-waypoint-markers.js'; // Fix for waypoint marker|import './fixes/fix-waypoint-markers.js'; // Fix for waypoint marker styling\nimport './fixes/waypoint-marker-position-fix.js'; // Fix for waypoint marker positioning|" ./src/components/fast-planner/FastPlannerApp.jsx
  echo "✅ Added position fix script import to FastPlannerApp.jsx"
else
  echo "ℹ️ Position fix script import already exists in FastPlannerApp.jsx"
fi

# Add the corner bug fix import
if ! grep -q "fix-waypoint-corner-bug.js" ./src/components/fast-planner/FastPlannerApp.jsx; then
  # Add the import line after existing waypoint-marker-position-fix.js import
  sed -i '' "s|import './fixes/waypoint-marker-position-fix.js'; // Fix for waypoint marker positioning|import './fixes/waypoint-marker-position-fix.js'; // Fix for waypoint marker positioning\nimport './fixes/fix-waypoint-corner-bug.js'; // Fix for waypoint marker in top-left corner|" ./src/components/fast-planner/FastPlannerApp.jsx
  echo "✅ Added corner bug fix script import to FastPlannerApp.jsx"
else
  echo "ℹ️ Corner bug fix script import already exists in FastPlannerApp.jsx"
fi

# Make sure the waypoint-styles.css import is present
if ! grep -q "import './waypoint-styles.css';" ./src/components/fast-planner/FastPlannerApp.jsx; then
  # Add the import line after existing modules/waypoints/waypoint-styles.css import
  sed -i '' "s|import './modules/waypoints/waypoint-styles.css';|import './modules/waypoints/waypoint-styles.css';\nimport './waypoint-styles.css'; // Main waypoint styling|" ./src/components/fast-planner/FastPlannerApp.jsx
  echo "✅ Added waypoint-styles.css import to FastPlannerApp.jsx"
else
  echo "ℹ️ waypoint-styles.css import already exists in FastPlannerApp.jsx"
fi

echo "🎉 Waypoint marker positioning fix has been applied successfully!"
echo "Restart the application to see the changes."
