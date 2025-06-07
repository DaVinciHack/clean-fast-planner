import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { RegionManager } from '../modules';

// Create the context
const RegionContext = createContext(null);

/**
 * RegionProvider component
 * Manages region state and provides it to all child components
 */
export const RegionProvider = ({ children, client }) => {
  // State variables
  const [regions, setRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionManagerInstance, setRegionManagerInstance] = useState(null);

  // Initialize the region manager
  useEffect(() => {
    const manager = new RegionManager();
    
    // Set up callbacks
    manager.setCallback('onRegionsLoaded', (loadedRegions) => {
      setRegions(loadedRegions);
      setRegionLoading(false);
    });
    
    manager.setCallback('onRegionSelected', (selectedRegion) => {
      setCurrentRegion(selectedRegion);
    });
    
    manager.setCallback('onError', (error) => {
      console.error('RegionManager error:', error);
      setRegionLoading(false);
    });
    
    setRegionManagerInstance(manager);
  }, []);

  // Load regions when the manager is initialized and client is available
  useEffect(() => {
    if (regionManagerInstance && client) {
      setRegionLoading(true);
      regionManagerInstance.loadRegionsFromAPI(client);
    }
  }, [regionManagerInstance, client]);

  // Handle region change
  const changeRegion = useCallback((regionId) => {
    if (regionManagerInstance) {
      setRegionLoading(true);
      regionManagerInstance.selectRegion(regionId);
    }
  }, [regionManagerInstance]);

  // Provider value object
  const value = {
    regions,
    currentRegion,
    regionLoading,
    changeRegion,
    regionManager: regionManagerInstance
  };

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
};

// Custom hook for using the region context
export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};

export default RegionContext;