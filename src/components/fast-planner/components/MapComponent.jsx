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
          const mapInstance = await mapManager.initializeMap('fast-planner-map');
          mapInitializedRef.current = true; // Mark as initialized
          console.log('MapComponent initMap: Map instance created, calling onReady.');
          
          setLoading(false); // Hide loading overlay
          
          // Call the onMapReady callback provided by the parent
          if (onMapReady) {
            onMapReady(mapInstance); // Pass the newly created map instance
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
  // Handle showing/hiding the loading overlay
  useEffect(() => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      if (loading) {
        loadingOverlay.textContent = loadingMessage;
        loadingOverlay.style.display = 'flex';
      } else {
        loadingOverlay.style.display = 'none';
      }
    }
  }, [loading, loadingMessage]);
  
  return (
    <>
      <div 
        id="fast-planner-map" 
        className={className || "fast-planner-map"} 
        ref={mapContainerRef}
      ></div>
      
      {/* Loading overlay */}
      <div id="loading-overlay" className="loading-overlay">
        {loadingMessage}
      </div>
    </>
  );
};

export default MapComponent;
