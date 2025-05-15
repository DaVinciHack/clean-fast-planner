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
  appSettingsManagerRef
}) => {
  // Core region state
  const [regions, setRegions] = useState(regionsData);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  
  // Map initialization state
  const [mapReady, setMapReady] = useState(false);
  const pendingRegionChangeRef = useRef(null);
  const initAttemptsRef = useRef(0);
  const MAX_INIT_ATTEMPTS = 5;

  /**
   * Check if map is ready for operations, with retry mechanism
   */
  const checkMapReady = useCallback(() => {
    if (!mapManagerRef || !mapManagerRef.current) {
      console.warn("RegionContext: MapManager ref is not available");
      return false;
    }

    const map = mapManagerRef.current.getMap();
    const isReady = map && typeof map.on === 'function' && typeof map.fitBounds === 'function';
    
    if (isReady) {
      if (!mapReady) {
        console.log("RegionContext: Map is now ready for operations");
        setMapReady(true);
      }
      return true;
    } else {
      console.warn("RegionContext: Map is not yet ready for operations");
      return false;
    }
  }, [mapManagerRef, mapReady]);

  /**
   * Set up map ready listener on mount
   */
  useEffect(() => {
    if (!mapManagerRef || !mapManagerRef.current) return;
    
    // Define the check function
    const checkForMapReady = () => {
      const map = mapManagerRef.current?.getMap();
      const isReady = map && typeof map.on === 'function' && typeof map.fitBounds === 'function';
      
      if (isReady) {
        setMapReady(true);
        
        // If we have a pending region change, apply it now
        if (pendingRegionChangeRef.current) {
          const region = pendingRegionChangeRef.current;
          
          // Apply the region bounds
          try {
            map.fitBounds(region.bounds, {
              padding: 50,
              maxZoom: region.zoom || 6
            });
          } catch (error) {
            console.error(`Error applying pending region change:`, error);
          }
          
          pendingRegionChangeRef.current = null;
        }
        
        return true;
      }
      
      // If still not ready, increment attempts counter
      initAttemptsRef.current += 1;
      
      if (initAttemptsRef.current < MAX_INIT_ATTEMPTS) {
        // Schedule another check after a delay
        setTimeout(checkForMapReady, 500);
        return false;
      } else {
        console.error(`Map failed to initialize after ${MAX_INIT_ATTEMPTS} attempts`);
        return false;
      }
    };
    
    // Start checking
    checkForMapReady();
    
    // Try to set up a callback with the MapManager if possible
    if (typeof mapManagerRef.current.onMapLoaded === 'function') {
      mapManagerRef.current.onMapLoaded(() => {
        setMapReady(true);
        
        // If we have a pending region change, apply it now via the map
        if (pendingRegionChangeRef.current) {
          const map = mapManagerRef.current.getMap();
          const region = pendingRegionChangeRef.current;
          
          if (map && typeof map.fitBounds === 'function') {
            try {
              map.fitBounds(region.bounds, {
                padding: 50,
                maxZoom: region.zoom || 6
              });
            } catch (error) {
              console.error(`Error applying pending region change in callback:`, error);
            }
          }
          
          pendingRegionChangeRef.current = null;
        }
      });
    }
  }, [mapManagerRef]);

  /**
   * Initialize regions
   */
  useEffect(() => {
    // If no regions yet, initialize from data
    if (!regions || regions.length === 0) {
      setRegions(regionsData);
    }
    
    // Get default region from app settings if available, otherwise use gulf-of-mexico
    let defaultRegionId = 'gulf-of-mexico';
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      const savedRegionId = appSettingsManagerRef.current.getRegion();
      if (savedRegionId) {
        defaultRegionId = savedRegionId;
      }
    }
    
    // Find the default region object
    const defaultRegion = regions.find(r => r.id === defaultRegionId) || regions[0];
    
    // If we don't have a current region set yet, set it
    if (!currentRegion && defaultRegion) {
      // Store the region in state regardless of map readiness
      setCurrentRegion(defaultRegion);
      
      // If map isn't ready yet, store for later initialization
      if (!mapReady) {
        pendingRegionChangeRef.current = defaultRegion;
      }
    }
  }, [regions, currentRegion, appSettingsManagerRef, mapReady]);

  /**
   * Effect to update map view when currentRegion changes
   */
  useEffect(() => {
    if (!currentRegion) return;
    
    // Clear data flags to ensure fresh loading for the new region
    window.staticDataLoaded = false;
    window.platformsLoaded = false;
    window.aircraftLoaded = false;
    
    // Save to app settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.setRegion(currentRegion.id);
    }
    
    // Dispatch a custom event that other components can listen for
    const regionChangedEvent = new CustomEvent('region-changed', {
      detail: { region: currentRegion }
    });
    window.dispatchEvent(regionChangedEvent);
    
    // If map is not ready yet, the region will be applied when the map loads
    // This is now handled in the MapManager's load event
    if (!mapReady) {
      console.log(`RegionContext: Map not ready, region will be applied when map loads`);
      return;
    }
    
    // Get the map instance
    const map = mapManagerRef.current?.getMap();
    if (!map || typeof map.fitBounds !== 'function') {
      console.warn(`RegionContext: Map not available, cannot update view`);
      return;
    }
    
    // Fly to the region's bounds
    try {
      map.fitBounds(currentRegion.bounds, {
        padding: 50,
        maxZoom: currentRegion.zoom || 6
      });
    } catch (error) {
      console.error(`RegionContext: Error applying region bounds:`, error);
    }
  }, [currentRegion, mapManagerRef, appSettingsManagerRef, mapReady]);

  /**
   * Load region-specific data when region changes
   */
  useEffect(() => {
    if (!currentRegion || !client) return;
    
    console.log(`RegionContext: Loading data for region: ${currentRegion.name}`);
    setRegionLoading(true);
    
    // Skip platform loading if map is not ready
    if (!mapReady) {
      console.warn(`RegionContext: Map not ready, deferring platform loading for ${currentRegion.name}`);
      return;
    }
    
    // Load platforms if platform manager exists
    if (platformManagerRef && platformManagerRef.current) {
      console.log(`RegionContext: Loading platforms for ${currentRegion.name}`);
      
      const loadPlatforms = (attempts = 0) => {
        const maxAttempts = 3;
        
        try {
          if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
            platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
              .then(() => {
                console.log(`RegionContext: Platforms loaded for ${currentRegion.name}`);
                
                // After successfully loading platforms, try to load waypoints
                if (typeof platformManagerRef.current.loadOsdkWaypointsFromFoundry === 'function') {
                  let regionQueryTerm = currentRegion.osdkRegion || currentRegion.name;
                  if (regionQueryTerm && regionQueryTerm.toLowerCase() === 'norway') {
                    regionQueryTerm = 'NORWAY';
                  }
                  console.log(`RegionContext: Loading OSDK waypoints for ${regionQueryTerm}`);
                  platformManagerRef.current.loadOsdkWaypointsFromFoundry(client, regionQueryTerm)
                    .then(() => console.log(`RegionContext: OSDK waypoints loaded for ${regionQueryTerm}`))
                    .catch(error => console.error(`Error loading OSDK waypoints for ${regionQueryTerm}:`, error))
                    .finally(() => setRegionLoading(false));
                } else {
                  console.warn('RegionContext: loadOsdkWaypointsFromFoundry not available');
                  setRegionLoading(false);
                }
              })
              .catch(error => {
                console.error(`RegionContext: Error loading platforms:`, error);
                
                // Retry if within retry attempts
                if (attempts < maxAttempts) {
                  console.log(`RegionContext: Retrying platform load (${attempts+1}/${maxAttempts})...`);
                  setTimeout(() => loadPlatforms(attempts + 1), 1000);
                } else {
                  console.error(`RegionContext: Failed to load platforms after ${maxAttempts} attempts`);
                  setRegionLoading(false);
                }
              });
          } else {
            console.error('RegionContext: PlatformManager.loadPlatformsFromFoundry is not a function');
            setRegionLoading(false);
          }
        } catch (error) {
          console.error(`RegionContext: Error calling platform loading method:`, error);
          
          // Retry if within retry attempts
          if (attempts < maxAttempts) {
            console.log(`RegionContext: Retrying platform load (${attempts+1}/${maxAttempts})...`);
            setTimeout(() => loadPlatforms(attempts + 1), 1000);
          } else {
            console.error(`RegionContext: Failed to load platforms after ${maxAttempts} attempts`);
            setRegionLoading(false);
          }
        }
      };
      
      // Start loading platforms with retry mechanism
      loadPlatforms();
      
    } else {
      console.warn('RegionContext: No platform manager available');
      setRegionLoading(false);
    }
    
    // Filter aircraft by region
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
  }, [
    currentRegion,
    client,
    platformManagerRef,
    aircraftManagerRef,
    favoriteLocationsManagerRef,
    setFavoriteLocations,
    mapReady
  ]);

  /**
   * Change the current region
   */
  const changeRegion = useCallback((regionId) => {
    setRegionLoading(true);
    
    // Find the region object
    const regionObject = regions.find(region => region.id === regionId);
    if (!regionObject) {
      console.error(`Region with ID ${regionId} not found`);
      setRegionLoading(false);
      return;
    }
    
    // Always update the region state
    setCurrentRegion(regionObject);
    
    // If map isn't ready yet, store for initialization
    if (!mapReady && mapManagerRef.current) {
      pendingRegionChangeRef.current = regionObject;
    }
    
    // Note: regionLoading will be set to false after platforms load
  }, [regions, mapReady, mapManagerRef]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    regions,
    currentRegion,
    regionLoading,
    changeRegion,
    mapReady
  }), [regions, currentRegion, regionLoading, changeRegion, mapReady]);

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
};

/**
 * Custom hook to use region context
 */
export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};

export default RegionContext;
