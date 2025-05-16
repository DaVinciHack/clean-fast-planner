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
    // Ensure mapManagerRef is available and map hasn't been initialized yet
    if (!mapManagerRef?.current || mapInitializedRef.current) {
      return;
    }

    const mapManager = mapManagerRef.current; // Capture current ref value

    const initMap = async () => {
      try {
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
  }, [mapManagerRef, currentRegion]); // Re-run if mapManagerRef or currentRegion changes
  
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
