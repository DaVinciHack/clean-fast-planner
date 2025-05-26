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
    
    // Store map reference safely
    let map;
    try {
      map = mapManagerRef.current.getMap();
      
      // Exit early if map isn't available
      if (!map) {
        console.warn("MapZoomHandler: Map not available");
        return;
      }
    } catch (error) {
      console.error("MapZoomHandler: Error getting map instance:", error);
      return;
    }
    
    // Safety flag to track if we've safely set up the handlers
    let handlerSetup = false;
    
    const updateZoomLevelAttributes = () => {
      try {
        // Safety check - skip if map is no longer valid
        if (!map || !map.getZoom) return;
        
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
        
        // Handle waypoint labels with safety checks
        try {
          if (map.getLayer && map.getLayer('osdk-waypoints-layer')) {
            // Do NOT change visibility, only adjust other properties if needed
          }
          
          if (map.getLayer && map.getLayer('osdk-waypoints-labels')) {
            // Do NOT change visibility, only adjust other properties if needed
          }
        } catch (layerError) {
          console.warn("MapZoomHandler: Error handling waypoint layers:", layerError);
        }
        
        // Handle platforms and rig labels with variable visibility and size
        const platformLayers = [
          'platforms-fixed-labels',
          'platforms-movable-labels',
          'airfields-labels'
        ];
        
        platformLayers.forEach(layerId => {
          try {
            if (map.getLayer && map.getLayer(layerId)) {
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
          } catch (layerError) {
            console.warn(`MapZoomHandler: Error handling platform layer ${layerId}:`, layerError);
          }
        });
      } catch (error) {
        console.error("MapZoomHandler: Error in updateZoomLevelAttributes:", error);
      }
    };
    
    try {
      // Set initial zoom level attributes
      updateZoomLevelAttributes();
      
      // Add event listener for zoom changes
      if (map && map.on) {
        map.on('zoomend', updateZoomLevelAttributes);
        handlerSetup = true;
      }
    } catch (error) {
      console.error("MapZoomHandler: Error setting up zoom handlers:", error);
    }
    
    // Cleanup on unmount
    return () => {
      try {
        // Remove event listener, but only if we successfully set it up
        if (handlerSetup && map && map.off) {
          map.off('zoomend', updateZoomLevelAttributes);
        }
      } catch (error) {
        console.warn("MapZoomHandler: Error during cleanup:", error);
      }
    };
  }, [mapManagerRef]);
  
  // This is a behavior component, no UI to render
  return null;
};

export default MapZoomHandler;