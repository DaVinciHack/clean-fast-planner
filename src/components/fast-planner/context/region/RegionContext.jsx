import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import regionsData from '../../modules/data/regions';

/**
 * Region Context
 * 
 * Centralized management for region-related state and functionality
 * Handles region selection, map navigation, and region-specific data loading
 */

// Create context
const RegionContext = createContext();

/**
 * RegionProvider Component
 * 
 * Provides region state and functionality to the component tree
 */
export const RegionProvider = ({ 
  children,
  mapManagerRef, 
  platformManagerRef,
  client,
  aircraftManagerRef,
  favoriteLocationsManagerRef,
  setFavoriteLocations,
  appSettingsManagerRef,
  mapInteractionHandlerRef,
  waypointManagerRef
}) => {
  // Core region state
  const [regions, setRegions] = useState(regionsData);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Refs for managing state and transitions
  const pendingRegionRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  
  // Effect to keep window.isRegionLoading in sync
  useEffect(() => {
    window.isRegionLoading = regionLoading;
  }, [regionLoading]);
  
  /**
   * Check if map is ready for operations
   */
  const checkMapReady = useCallback(() => {
    try {
      if (!mapManagerRef || !mapManagerRef.current) {
        return false;
      }
      
      const map = mapManagerRef.current.getMap();
      if (!map) {
        return false;
      }
      
      // Simple check for essential functions
      const isReady = (
        typeof map.on === 'function' && 
        typeof map.fitBounds === 'function'
      );
      
      if (isReady && !mapReady) {
        console.log("RegionContext: Map is now ready");
        setMapReady(true);
        
        // Apply pending region change if there is one
        if (pendingRegionRef.current) {
          console.log(`RegionContext: Applying pending region ${pendingRegionRef.current.name}`);
          setCurrentRegion(pendingRegionRef.current);
          pendingRegionRef.current = null;
        }
      }
      
      return isReady;
    } catch (error) {
      console.warn("RegionContext: Error checking map ready:", error);
      return false;
    }
  }, [mapManagerRef, mapReady]);
  
  // Set up listener for map ready
  useEffect(() => {
    if (!mapManagerRef || !mapManagerRef.current) return;
    
    // Helper function to check map status
    const checkAndSetMapReady = () => {
      try {
        const map = mapManagerRef.current.getMap();
        if (map && typeof map.on === 'function') {
          setMapReady(true);
          return true;
        }
      } catch (e) {}
      return false;
    };
    
    // Set up map loaded callback if available
    if (typeof mapManagerRef.current.onMapLoaded === 'function') {
      mapManagerRef.current.onMapLoaded(() => {
        if (checkAndSetMapReady() && pendingRegionRef.current) {
          // Apply pending region now that map is ready
          setCurrentRegion(pendingRegionRef.current);
          pendingRegionRef.current = null;
        }
      });
    }
    
    // Initial check
    checkAndSetMapReady();
    
    // Schedule periodic checks as a fallback
    const intervalId = setInterval(() => {
      if (checkAndSetMapReady()) {
        clearInterval(intervalId);
      }
    }, 500);
    
    return () => clearInterval(intervalId);
  }, [mapManagerRef]);
  
  /**
   * Initialize regions on first load
   */
  useEffect(() => {
    if (!isFirstLoadRef.current || currentRegion) return;
    
    console.log('RegionContext: Initializing default region');
    
    // Determine default region - either saved or Gulf of Mexico
    let defaultRegionId = 'gulf-of-mexico';
    
    // Try to get saved region
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      const savedRegionId = appSettingsManagerRef.current.getRegion();
      if (savedRegionId) {
        console.log(`RegionContext: Found saved region: ${savedRegionId}`);
        defaultRegionId = savedRegionId;
      }
    }
    
    // Find the region object
    const regionObject = regions.find(r => r.id === defaultRegionId) || 
                         regions.find(r => r.id === 'gulf-of-mexico') || 
                         regions[0];
    
    if (regionObject) {
      console.log(`RegionContext: Setting initial region to ${regionObject.name}`);
      
      // If map is ready, set region directly
      if (mapReady) {
        setCurrentRegion(regionObject);
      } else {
        // Otherwise, store as pending
        console.log(`RegionContext: Map not ready, storing ${regionObject.name} as pending`);
        pendingRegionRef.current = regionObject;
      }
      
      isFirstLoadRef.current = false;
    }
  }, [regions, currentRegion, appSettingsManagerRef, mapReady]);
  
  /**
   * Direct method to fly to a region's bounds
   */
  const flyToRegion = useCallback((region) => {
    if (!mapManagerRef || !mapManagerRef.current) {
      return false;
    }
    
    try {
      const map = mapManagerRef.current.getMap();
      if (!map || typeof map.fitBounds !== 'function') {
        return false;
      }
      
      console.log(`RegionContext: Flying to ${region.name}`);
      
      map.fitBounds(region.bounds, {
        padding: 50,
        maxZoom: region.zoom || 6,
        animate: true,
        duration: 2000,
        essential: true
      });
      
      return true;
    } catch (error) {
      console.error(`RegionContext: Error flying to region: ${error}`);
      return false;
    }
  }, [mapManagerRef]);
  
  /**
   * Effect to update map view when currentRegion changes
   */
  useEffect(() => {
    if (!currentRegion) return;
    
    console.log(`RegionContext: Current region changed to ${currentRegion.name}`);
    
    // Update global flags
    window.staticDataLoaded = false;
    window.platformsLoaded = false;
    window.aircraftLoaded = false;
    
    // Save region to app settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.setRegion(currentRegion.id);
    }
    
    // Dispatch region change event
    const regionChangedEvent = new CustomEvent('region-changed', { 
      detail: { region: currentRegion } 
    });
    window.dispatchEvent(regionChangedEvent);
    
    // Fly to region if map is ready
    if (mapReady) {
      flyToRegion(currentRegion);
    }
    
  }, [currentRegion, flyToRegion, appSettingsManagerRef, mapReady]);
  
  /**
   * Load region-specific data when region changes
   */
  useEffect(() => {
    if (!currentRegion || !client) return;
    
    const loadRegionData = () => {
      console.log(`RegionContext: Loading data for region: ${currentRegion.name}`);
      setRegionLoading(true);
      
      window.regionState = window.regionState || {};
      window.regionState.isChangingRegion = true;
      
      if (!mapReady) {
        console.warn(`RegionContext: Map not ready, deferring data loading`);
        setTimeout(() => {
          window.regionState.isChangingRegion = false;
          setRegionLoading(false);
        }, 500);
        return;
      }
      
      // Clear existing waypoints
      if (waypointManagerRef && waypointManagerRef.current) {
        try {
          // Clear markers
          if (Array.isArray(waypointManagerRef.current.markers)) {
            waypointManagerRef.current.markers.forEach(marker => {
              try { marker.remove(); } catch (e) {}
            });
          }
          
          // Reset arrays
          waypointManagerRef.current.markers = [];
          waypointManagerRef.current.waypoints = [];
          
          // Trigger callbacks
          if (typeof waypointManagerRef.current.triggerCallback === 'function') {
            waypointManagerRef.current.triggerCallback('onChange', []);
            waypointManagerRef.current.triggerCallback('onRouteUpdated', { 
              waypoints: [], coordinates: [] 
            });
          }
        } catch (error) {
          console.warn(`RegionContext: Error clearing waypoints: ${error.message}`);
        }
      }
      
      // Load platforms if available
      if (platformManagerRef && platformManagerRef.current) {
        // Set skipNextClear flag
        platformManagerRef.current.skipNextClear = true;
        
        // Load platforms for region
        if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
          platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
            .then(() => {
              console.log(`RegionContext: Platforms loaded for ${currentRegion.name}`);
              
              // Load waypoints if available
              if (typeof platformManagerRef.current.loadOsdkWaypointsFromFoundry === 'function') {
                let regionQueryTerm = currentRegion.osdkRegion || currentRegion.name;
                if (regionQueryTerm && regionQueryTerm.toLowerCase() === 'norway') {
                  regionQueryTerm = 'NORWAY';
                }
                
                platformManagerRef.current.loadOsdkWaypointsFromFoundry(client, regionQueryTerm)
                  .then(() => console.log(`RegionContext: Waypoints loaded for ${regionQueryTerm}`))
                  .catch(error => console.error(`Error loading waypoints: ${error.message}`))
                  .finally(finalizeLoading);
              } else {
                finalizeLoading();
              }
            })
            .catch(error => {
              console.error(`RegionContext: Error loading platforms: ${error.message}`);
              finalizeLoading();
            });
        } else {
          console.warn('RegionContext: Platform loading not available');
          finalizeLoading();
        }
      } else {
        finalizeLoading();
      }
      
      // Update aircraft for this region
      if (aircraftManagerRef && aircraftManagerRef.current) {
        console.log(`RegionContext: Filtering aircraft for ${currentRegion.name}`);
        aircraftManagerRef.current.filterAircraft(currentRegion.id);
      }
      
      // Load favorites for this region
      if (favoriteLocationsManagerRef && favoriteLocationsManagerRef.current && setFavoriteLocations) {
        console.log(`RegionContext: Loading favorites for ${currentRegion.name}`);
        const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id);
        setFavoriteLocations(regionFavorites);
      }
    };
    
    const finalizeLoading = () => {
      // Reset flags
      window.regionState.isChangingRegion = false;
      setRegionLoading(false);
      
      // Reinitialize map interaction
      if (mapInteractionHandlerRef && mapInteractionHandlerRef.current && 
          typeof mapInteractionHandlerRef.current.initialize === 'function') {
        console.log('RegionContext: Reinitializing map interaction handler');
        setTimeout(() => {
          try {
            mapInteractionHandlerRef.current.initialize();
          } catch (error) {
            console.error(`RegionContext: Error initializing map interaction: ${error.message}`);
          }
        }, 500);
      }
    };
    
    // Start loading with small delay
    const timerId = setTimeout(loadRegionData, 250);
    return () => clearTimeout(timerId);
    
  }, [
    currentRegion, client, mapReady,
    waypointManagerRef, platformManagerRef, aircraftManagerRef,
    favoriteLocationsManagerRef, setFavoriteLocations, mapInteractionHandlerRef
  ]);
  
  /**
   * Change the current region
   */
  const changeRegion = useCallback((regionId) => {
    // Skip if already in this region
    if (currentRegion && currentRegion.id === regionId) {
      console.log(`RegionContext: Already in region ${regionId}`);
      return;
    }
    
    // Find the region object
    const regionObject = regions.find(region => region.id === regionId);
    if (!regionObject) {
      console.error(`RegionContext: Region with ID ${regionId} not found`);
      return;
    }
    
    console.log(`RegionContext: Changing to region ${regionObject.name}`);
    
    // Set loading state
    setRegionLoading(true);
    window.regionState = window.regionState || {};
    window.regionState.isChangingRegion = true;
    
    // Set current region - this will trigger the effects that handle loading data and flying to region
    setCurrentRegion(regionObject);
  }, [regions, currentRegion]);
  
  // Create context value
  const value = {
    regions,
    currentRegion,
    regionLoading,
    changeRegion,
    mapReady,
    flyToRegion
  };
  
  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
};

// Custom hook to use region context
export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};

export default RegionContext;
