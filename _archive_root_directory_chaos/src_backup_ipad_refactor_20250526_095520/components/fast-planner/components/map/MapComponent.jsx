import React, { useEffect, useRef, useState } from 'react';
import { useRegion } from '../../context/region';

/**
 * Map Component
 * 
 * Renders the MapBox map and handles map-specific event binding
 */
const MapComponent = ({ 
  mapManagerRef, 
  onMapReady, 
  className 
}) => {
  const mapContainerRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing map...');
  
  // Get region data from context
  const { currentRegion } = useRegion();
  
  // Initialize map on component mount - Run only once
  useEffect(() => {
    // DIAGNOSTIC: Log when this effect runs and why
    console.log(`%c MAP COMPONENT DIAGNOSTIC: Map initialization effect running`, 
                'background: #ff6b6b; color: white; font-weight: bold');
    
    if (window.REGION_CHANGE_IN_PROGRESS) {
      console.log(`%c MAP COMPONENT DIAGNOSTIC: ⚠️ Map initialization triggered during region change! 
        From: ${window.REGION_CHANGE_FROM} 
        To: ${window.REGION_CHANGE_TO}
        Time: ${window.REGION_CHANGE_TIME}`, 
        'background: red; color: white; font-weight: bold');
    }
    
    // Ensure mapManagerRef is available and map hasn't been initialized yet
    if (!mapManagerRef?.current || mapInitializedRef.current) {
      console.log(`%c MAP COMPONENT DIAGNOSTIC: Skipping initialization - ${!mapManagerRef?.current ? 'No mapManagerRef' : 'Already initialized'}`, 
                  'background: #ff6b6b; color: white;');
      return;
    }

    const mapManager = mapManagerRef.current; // Capture current ref value

    const initMap = async () => {
      try {
        // CRITICAL FIX: Do not reinitialize map during region changes
        if (window.REGION_CHANGE_IN_PROGRESS) {
          console.log(`%c MAP COMPONENT DIAGNOSTIC: ⚠️ Skipping map reinitialization during region change!`, 
                      'background: green; color: white; font-weight: bold');
          return;
        }
        
        setLoading(true);
        setLoadingMessage('Loading map scripts...');
        await mapManager.loadScripts();
        
        setLoadingMessage('Initializing map...');
        if (mapContainerRef.current) {
          // Get initialization options with initial region if available
          const initOptions = {};
          if (currentRegion) {
            initOptions.initialRegion = currentRegion;
          }
          
          // DIAGNOSTIC: Log initialization details
          console.log(`%c MAP COMPONENT DIAGNOSTIC: Initializing map with options:`, 
                      'background: #ff6b6b; color: white;', initOptions);
          
          // Initialize map using the captured mapManager reference with region data
          // CRITICAL: Use 'fast-planner-map' as the ID to match what other components expect
          const mapInstance = await mapManager.initializeMap('fast-planner-map', initOptions);
          mapInitializedRef.current = true; // Mark as initialized
          
          setLoading(false); // Hide loading overlay
          
          // Call the onMapReady callback provided by the parent
          if (onMapReady) {
            onMapReady(mapInstance); // Pass the newly created map instance

            // Dispatch map-ready event for other components to listen for
            const mapReadyEvent = new CustomEvent('map-ready', {
              detail: { map: mapInstance }
            });
            window.dispatchEvent(mapReadyEvent);
            
            // Set a global flag to prevent duplicate handlers
            window.mapIsReady = true;
          }
        } else {
           setLoadingMessage('Error: Map container not found.');
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setLoadingMessage('Error loading map: ' + error.message);
        // Keep loading overlay visible to show the error
      }
    };
    
    initMap(); // Execute the async initialization function
    
    // Cleanup function: Runs only on component unmount due to empty dependency array
    return () => {
      try {
        if (mapManager) {
          const map = mapManager.getMap();
          if (map) {
            // Remove any event listeners
            try {
              if (typeof map.off === 'function') {
                map.off();
              }
            } catch (e) {
              console.warn("Error removing map event listeners:", e);
            }
            
            // Then try to remove the map
            try {
              if (typeof map.remove === 'function') {
                map.remove();
              }
            } catch (e) {
              console.warn("Error removing map instance:", e);
            }
          }
        }
      } catch (error) {
        console.error("MapComponent: Error in cleanup:", error);
      }
      
      // Reset initialized flag
      mapInitializedRef.current = false;
      
      // Set a flag to indicate map is no longer ready
      window.mapIsReady = false;
    };
  }, [mapManagerRef]); // Only depends on mapManagerRef, not currentRegion
  
  // Effect to handle region changes via the mapManagerRef
  useEffect(() => {
    // Skip if no map manager or if the map isn't initialized yet
    if (!mapManagerRef?.current || !mapInitializedRef.current) return;
    
    // Skip if no currentRegion
    if (!currentRegion) return;
    
    console.log(`%c MAP COMPONENT: Region changed to ${currentRegion.name}`, 
               'background: #4CAF50; color: white; font-weight: bold');
    
    const mapManager = mapManagerRef.current;
    
    // Ensure map is ready before attempting to fly to the region
    if (mapInitializedRef.current && mapManager.isMapLoaded && mapManager.isMapLoaded()) {
      console.log(`%c MAP COMPONENT: Flying to ${currentRegion.name} bounds using mapManager.flyToRegion`, 
                 'background: #4CAF50; color: white;');
      
      // Use the new flyToRegion method to ensure smooth transition
      if (typeof mapManager.flyToRegion === 'function') {
        mapManager.flyToRegion(currentRegion);
      } else {
        console.warn('MapComponent: flyToRegion method not available');
        // Fallback using fitMapToBounds
        if (typeof mapManager.fitMapToBounds === 'function' && currentRegion.bounds) {
          mapManager.fitMapToBounds(currentRegion.bounds, {
            maxZoom: currentRegion.zoom || 6,
            animate: true
          });
        }
      }
    } else {
      console.log(`%c MAP COMPONENT: Map not fully loaded yet, region change will be handled by event listener`, 
                 'background: #FF9800; color: black;');
    }
  }, [currentRegion, mapManagerRef, mapInitializedRef]);
  
  // Disable loading overlay completely
  useEffect(() => {
    // Hide any existing loading overlay immediately
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }, []);
  
  return (
    <>
      <div 
        id="fast-planner-map" 
        className={className || "fast-planner-map"} 
        ref={mapContainerRef}
      ></div>
    </>
  );
};

export default MapComponent;


