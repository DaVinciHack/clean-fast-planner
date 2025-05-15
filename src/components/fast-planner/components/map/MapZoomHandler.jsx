import { useEffect } from 'react';

/**
 * MapZoomHandler Component
 * 
 * This component adds zoom-level based handling for map elements:
 * - Sets a data-zoom-level attribute on the map container
 * - Controls waypoint and platform label visibility based on zoom level
 * - Implements dynamic sizing of waypoints and labels
 */
const MapZoomHandler = ({ mapManagerRef }) => {
  useEffect(() => {
    // Wait for map to be fully initialized
    if (!mapManagerRef?.current) return;
    
    const map = mapManagerRef.current.getMap();
    if (!map) return;
    
    const updateZoomLevelAttributes = () => {
      const currentZoom = map.getZoom();
      console.log(`Map zoom changed to: ${currentZoom}`);
      
      // Determine zoom level category with more gradations
      let zoomLevel;
      if (currentZoom < 8) {
        zoomLevel = 'low';           // Very far out
      } else if (currentZoom < 11) {
        zoomLevel = 'medium';        // Medium distance
      } else if (currentZoom < 14) {
        zoomLevel = 'high';          // Zoomed in
      } else {
        zoomLevel = 'very-high';     // Very close zoom
      }
      
      // Set data attribute on map container for CSS targeting
      const mapContainer = map.getContainer();
      if (mapContainer) {
        mapContainer.setAttribute('data-zoom-level', zoomLevel);
      }
      
      // Handle waypoint labels - NEVER modify visibility, only size properties
      // Waypoint layer visibility is managed by PlatformManager.toggleWaypointMode()
      if (map.getLayer('osdk-waypoints-layer')) {
        // Do NOT change visibility, only adjust other properties if needed
        // Leave these commented out as a reminder
        // map.setLayoutProperty(
        //   'osdk-waypoints-layer',
        //   'visibility',
        //   waypointLabelsVisible ? 'visible' : 'none'
        // );
      }
      
      if (map.getLayer('osdk-waypoints-labels')) {
        // Do NOT change visibility, only adjust other properties if needed
        // Leave these commented out as a reminder  
        // map.setLayoutProperty(
        //   'osdk-waypoints-labels',
        //   'visibility',
        //   waypointLabelsVisible ? 'visible' : 'none'
        // );
      }
      
      // Handle platforms and rig labels with variable visibility and size
      // Only handle these if the layers exist
      const platformLayers = [
        'platforms-fixed-labels',
        'platforms-movable-labels',
        'airfields-labels'
      ];
      
      platformLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          // Show platform labels at all zoom levels above 7
          const platformLabelsVisible = currentZoom >= 7;
          
          // Set visibility
          map.setLayoutProperty(
            layerId,
            'visibility',
            platformLabelsVisible ? 'visible' : 'none'
          );
          
          // Adjust text size based on zoom level
          let textSize;
          if (currentZoom < 9) {
            textSize = 9;  // Small text at medium-low zoom
          } else if (currentZoom < 12) {
            textSize = 11; // Medium text size
          } else if (currentZoom < 15) {
            textSize = 13; // Large text at high zoom
          } else {
            textSize = 15; // Very large text at very high zoom
          }
          
          // Set the text size property
          map.setLayoutProperty(
            layerId,
            'text-size',
            textSize
          );
        }
      });
    };
    
    // Set initial zoom level attributes
    updateZoomLevelAttributes();
    
    // Add event listener for zoom changes
    map.on('zoomend', updateZoomLevelAttributes);
    
    // Cleanup on unmount
    return () => {
      // Remove event listener
      if (map) {
        map.off('zoomend', updateZoomLevelAttributes);
      }
    };
  }, [mapManagerRef]);
  
  // This is a behavior component, no UI to render
  return null;
};

export default MapZoomHandler;