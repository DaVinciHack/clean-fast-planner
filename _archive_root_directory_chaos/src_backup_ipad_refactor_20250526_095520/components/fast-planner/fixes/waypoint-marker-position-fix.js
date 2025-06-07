/**
 * waypoint-marker-position-fix.js
 * 
 * This script fixes issues with waypoint markers appearing in incorrect positions.
 * It addresses waypoint markers jumping to the top-left corner of the screen
 * by ensuring proper styling and preserving the critical transform property.
 */

(function() {
  console.log('🔧 Applying waypoint marker position fix...');

  // Create the style element to fix marker positioning
  const styleElement = document.createElement('style');
  styleElement.id = 'waypoint-marker-position-fix';
  styleElement.textContent = `
    /* Essential fix: Make sure markers use proper positioning */
    .mapboxgl-marker {
      /* CRITICAL: Never override transform - Mapbox uses this for positioning */
      position: absolute !important;
      will-change: transform !important;
      pointer-events: auto !important;
      /* These properties are safe to override */
      margin: 0 !important;
      padding: 0 !important;
      z-index: 1 !important;
    }
    
    /* For waypoints, ensure they have the right appearance but don't break positioning */
    .mapboxgl-marker[data-marker-type="waypoint"] {
      /* Visual styling */
      background-color: turquoise !important;
      border-radius: 50% !important;
      width: 5px !important;
      height: 5px !important;
      filter: drop-shadow(0 0 2px rgba(64, 224, 208, 0.7)) !important;
    }
    
    /* Ensure SVG elements inside markers are visible and properly sized */
    .mapboxgl-marker[data-marker-type="waypoint"] svg {
      display: block !important;
    }
    
    /* Add a subtle pulse animation to make waypoints more noticeable */
    @keyframes pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }
    
    .mapboxgl-marker[data-marker-type="waypoint"] {
      animation: pulse 2s infinite;
    }
  `;
  
  // Add the style to the document
  document.head.appendChild(styleElement);
  
  // Function to find the waypointManager and patch its marker creation method
  const patchWaypointManager = () => {
    // Wait for waypointManager to be available in the global scope
    if (!window.waypointManager) {
      console.log('🔧 Waiting for waypointManager to be available...');
      setTimeout(patchWaypointManager, 1000);
      return;
    }
    
    console.log('🔧 Found waypointManager, patching marker creation...');
    
    // Save reference to the original method
    const originalCreateWaypointMarker = window.waypointManager.createWaypointMarker;
    
    // Override the method to ensure proper marker positioning
    window.waypointManager.createWaypointMarker = function(coords, name, options = {}) {
      try {
        // Call the original method to create the marker
        const marker = originalCreateWaypointMarker.call(this, coords, name, options);
        
        if (!marker) {
          console.warn('🔧 Original marker creation method returned null or undefined');
          return null;
        }
        
        // Get the marker DOM element and ensure it has the proper data attribute
        const markerElement = marker.getElement();
        if (markerElement) {
          // Determine if this is a waypoint or stop
          const isWaypoint = 
            options.pointType === 'NAVIGATION_WAYPOINT' || 
            options.isWaypoint === true || 
            options.type === 'WAYPOINT' || 
            window.isWaypointModeActive === true;
          
          // Set data attribute for CSS targeting
          markerElement.setAttribute('data-marker-type', isWaypoint ? 'waypoint' : 'stop');
          
          // Ensure any transform:none is removed
          const style = markerElement.getAttribute('style');
          if (style && style.includes('transform: none')) {
            console.log('🔧 Removing transform: none from marker style');
            markerElement.style.removeProperty('transform');
          }
          
          console.log(`🔧 Patched marker for ${isWaypoint ? 'waypoint' : 'stop'} at [${coords}]`);
        }
        
        return marker;
      } catch (error) {
        console.error('🔧 Error in patched createWaypointMarker:', error);
        // Fall back to original method if our patch fails
        return originalCreateWaypointMarker.call(this, coords, name, options);
      }
    };
    
    console.log('✅ Successfully patched waypointManager.createWaypointMarker method');
    
    // Fix any existing markers
    try {
      if (window.waypointManager.markers && window.waypointManager.markers.length > 0) {
        console.log(`🔧 Fixing ${window.waypointManager.markers.length} existing markers...`);
        
        window.waypointManager.markers.forEach((marker, index) => {
          if (!marker || !marker.getElement) return;
          
          const element = marker.getElement();
          if (!element) return;
          
          // Get the corresponding waypoint
          const waypoint = window.waypointManager.waypoints[index];
          if (!waypoint) return;
          
          // Determine if it's a waypoint or