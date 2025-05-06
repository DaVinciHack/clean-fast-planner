import React, { useEffect, useRef, useState } from 'react';

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
  
  // Initialize map on component mount - Run only once
  useEffect(() => {
    // Ensure mapManagerRef is available and map hasn't been initialized yet
    if (!mapManagerRef?.current || mapInitializedRef.current) {
      // If mapManagerRef isn't ready yet, this effect might run again when it becomes available.
      // If mapInitializedRef is true, we don't want to re-initialize.
      console.log("MapComponent useEffect: Skipping initialization (no mapManagerRef or already initialized).");
      return;
    }

    console.log("MapComponent useEffect: Starting map initialization.");
    const mapManager = mapManagerRef.current; // Capture current ref value

    const initMap = async () => {
      try {
        setLoading(true);
        setLoadingMessage('Loading map scripts...');
        console.log('MapComponent initMap: Loading map scripts...');
        await mapManager.loadScripts();
        
        setLoadingMessage('Initializing map...');
        console.log('MapComponent initMap: Initializing map...');
        if (mapContainerRef.current) {
          // Initialize map using the captured mapManager reference
          // CRITICAL: Use 'fast-planner-map' as the ID to match what other components expect
          const mapInstance = await mapManager.initializeMap('fast-planner-map');
          mapInitializedRef.current = true; // Mark as initialized
          console.log('MapComponent initMap: Map instance created, calling onReady.');
          
          setLoading(false); // Hide loading overlay
          
          // Call the onMapReady callback provided by the parent
          if (onMapReady) {
            onMapReady(mapInstance); // Pass the newly created map instance

            // SIMPLIFIED FIX: Only dispatch event if handlers haven't been initialized
            console.log("🚀 Setting up single delayed initialization for map click handlers...");
            
            // Single attempt with a delay to ensure map is ready
            setTimeout(() => {
              console.log("MapComponent: Delayed click handler initialization check");
              if (mapInstance && !window.mapHandlersInitialized) {
                // Only dispatch event if handlers haven't been initialized yet
                console.log("Handlers not yet initialized, triggering event");
                const event = new CustomEvent('reinitialize-map-handlers');
                window.dispatchEvent(event);
              } else {
                console.log("Handlers already initialized, skipping event dispatch");
              }
            }, 1000);
          } else {
             console.warn("MapComponent initMap: onMapReady callback is not defined.");
          }
        } else {
           console.error("MapComponent initMap: mapContainerRef is not available.");
           setLoadingMessage('Error: Map container not found.');
        }
      } catch (error) {
        console.error('MapComponent initMap: Failed to initialize map:', error);
        setLoadingMessage('Error loading map: ' + error.message);
        // Keep loading overlay visible to show the error
      }
    };
    
    initMap(); // Execute the async initialization function
    
    // Cleanup function: Runs only on component unmount due to empty dependency array
    return () => {
      console.log("MapComponent cleanup: Removing map instance.");
      const map = mapManager?.getMap(); // Use the captured manager reference
      if (map && typeof map.remove === 'function') {
         try {
           map.remove();
         } catch (e) {
           console.error("Error removing map during cleanup:", e);
         }
      }
      // Reset initialized flag if needed, although component is unmounting
      mapInitializedRef.current = false; 
    };
  }, []); // Empty dependency array ensures this runs only once on mount/unmount
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
