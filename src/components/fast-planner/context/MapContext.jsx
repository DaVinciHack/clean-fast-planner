import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { MapManager, PlatformManager } from '../modules';

// Create the context
const MapContext = createContext(null);

/**
 * MapProvider component
 * Manages map state and interactions
 */
export const MapProvider = ({ children, client, currentRegion }) => {
  // Map state
  const [mapReady, setMapReady] = useState(false);
  const [platformsVisible, setPlatformsVisible] = useState(true);
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [rigsLoading, setRigsLoading] = useState(false);
  const [rigsError, setRigsError] = useState(null);
  
  // Manager instances
  const [mapManagerInstance, setMapManagerInstance] = useState(null);
  const [platformManagerInstance, setPlatformManagerInstance] = useState(null);

  // Initialize map manager
  useEffect(() => {
    const mapManager = new MapManager();
    
    // Set up map manager callbacks
    mapManager.setCallback('onMapReady', () => {
      setMapReady(true);
    });
    
    setMapManagerInstance(mapManager);
    
    // Create platform manager
    const platformManager = new PlatformManager();
    
    // Set up platform manager callbacks
    platformManager.setCallback('onPlatformsLoaded', () => {
      setPlatformsLoaded(true);
      setRigsLoading(false);
    });
    
    platformManager.setCallback('onError', (error) => {
      console.error('PlatformManager error:', error);
      setRigsError(error);
      setRigsLoading(false);
    });
    
    setPlatformManagerInstance(platformManager);
  }, []);

  // Load platforms when the manager is initialized, client is available, and region changes
  useEffect(() => {
    if (platformManagerInstance && client && currentRegion && mapReady) {
      setRigsLoading(true);
      setPlatformsLoaded(false);
      platformManagerInstance.loadPlatformsFromOSDK(client, currentRegion.id);
    }
  }, [platformManagerInstance, client, currentRegion, mapReady]);

  // Toggle platforms visibility
  const togglePlatformsVisibility = useCallback(() => {
    if (mapManagerInstance) {
      const newVisibility = !platformsVisible;
      setPlatformsVisible(newVisibility);
      
      if (newVisibility) {
        mapManagerInstance.showPlatforms();
      } else {
        mapManagerInstance.hidePlatforms();
      }
    }
  }, [mapManagerInstance, platformsVisible]);

  // Load custom chart
  const loadCustomChart = useCallback((file) => {
    if (mapManagerInstance) {
      mapManagerInstance.loadCustomChartFile(file);
    }
  }, [mapManagerInstance]);

  // Manually reload platform data
  const reloadPlatformData = useCallback(() => {
    if (platformManagerInstance && client && currentRegion) {
      setRigsLoading(true);
      setPlatformsLoaded(false);
      platformManagerInstance.loadPlatformsFromOSDK(client, currentRegion.id);
    }
  }, [platformManagerInstance, client, currentRegion]);

  // Provider value object
  const value = {
    mapReady,
    platformsVisible,
    platformsLoaded,
    rigsLoading,
    rigsError,
    togglePlatformsVisibility,
    loadCustomChart,
    reloadPlatformData,
    mapManager: mapManagerInstance,
    platformManager: platformManagerInstance
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

// Custom hook for using the map context
export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

export default MapContext;