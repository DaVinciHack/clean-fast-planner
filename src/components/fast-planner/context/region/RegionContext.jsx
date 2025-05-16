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
  mapInteractionHandlerRef // Added mapInteractionHandlerRef
}) => {
  // Core region state
  const [regions, setRegions] = useState(regionsData);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  useEffect(() => { // Effect to keep window.isRegionLoading in sync
    window.isRegionLoading = regionLoading;
  }, [regionLoading]);
  
  // Map initialization state
  const [mapReady, setMapReady] = useState(false);
  const pendingRegionChangeRef = useRef(null);
  const initAttemptsRef = useRef(0);
  const MAX_INIT_ATTEMPTS = 5;
  
  // Additional refs for map ready checks
  const mapReadyCheckedRef = useRef(false);
  const timeoutIdRef = useRef(null);

  /**
   * Check if map is ready for operations, with retry mechanism
   * Use a ref to prevent unnecessary state updates
   */
  const mapReadyLastState = useRef(false);
  const checkMapReady = useCallback(() => {
    if (!mapManagerRef || !mapManagerRef.current) {
      console.warn("RegionContext: MapManager ref is not available");
      return false;
    }

    const map = mapManagerRef.current.getMap();
    const isReady = map && typeof map.on === 'function' && typeof map.fitBounds === 'function';
    
    if (isReady) {
      // Only update state if there's a change to avoid unnecessary re-renders
      if (!mapReadyLastState.current && !mapReady) {
        console.log("RegionContext: Map is now ready for operations");
        mapReadyLastState.current = true;
        setMapReady(true);
      }
      return true;
    } else {
      // If we previously thought map was ready, but now it's not, update state
      if (mapReadyLastState.current || mapReady) {
        console.warn("RegionContext: Map is no longer ready for operations");
        mapReadyLastState.current = false;
        setMapReady(false);
      } else {
        console.warn("RegionContext: Map is not yet ready for operations");
      }
      return false;
    }
  }, [mapManagerRef, mapReady]);

  /**
   * Set up map ready listener on mount
   */
  useEffect(() => {
    if (!mapManagerRef || !mapManagerRef.current) return;
    
    const checkForMapReady = () => {
      // Skip if we've already set map as ready or exceeded attempts
      if (mapReadyCheckedRef.current) return true;
      
      const map = mapManagerRef.current?.getMap();
      const isReady = map && typeof map.on === 'function' && typeof map.fitBounds === 'function';
      
      if (isReady) {
        mapReadyCheckedRef.current = true;
        setMapReady(true);
        
        if (pendingRegionChangeRef.current) {
          const region = pendingRegionChangeRef.current;
          try {
            map.fitBounds(region.bounds, { padding: 50, maxZoom: region.zoom || 6 });
          } catch (error) { console.error(`Error applying pending region change:`, error); }
          pendingRegionChangeRef.current = null;
        }
        return true;
      }
      
      initAttemptsRef.current += 1;
      if (initAttemptsRef.current < MAX_INIT_ATTEMPTS) {
        // Only schedule a new check if we haven't exceeded attempts
        timeoutIdRef.current = setTimeout(checkForMapReady, 500);
        return false;
      } else {
        console.error(`Map failed to initialize after ${MAX_INIT_ATTEMPTS} attempts`);
        mapReadyCheckedRef.current = true; // Mark as checked to prevent further attempts
        return false;
      }
    };
    
    // Initial check
    const initialCheckResult = checkForMapReady();
    
    // Add onMapLoaded listener (if available)
    let mapLoadedCallback = null;
    if (typeof mapManagerRef.current.onMapLoaded === 'function') {
      mapLoadedCallback = () => {
        if (!mapReadyCheckedRef.current) {
          mapReadyCheckedRef.current = true;
          setMapReady(true);
          
          if (pendingRegionChangeRef.current) {
            const map = mapManagerRef.current.getMap();
            const region = pendingRegionChangeRef.current;
            if (map && typeof map.fitBounds === 'function') {
              try {
                map.fitBounds(region.bounds, { padding: 50, maxZoom: region.zoom || 6 });
              } catch (error) { console.error(`Error applying pending region change in callback:`, error); }
            }
            pendingRegionChangeRef.current = null;
          }
        }
      };
      
      mapManagerRef.current.onMapLoaded(mapLoadedCallback);
    }
    
    // Cleanup
    return () => {
      // Clear any scheduled timeout if one was created
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Remove onMapLoaded callback if possible
      if (mapLoadedCallback && mapManagerRef.current && 
          typeof mapManagerRef.current.removeMapLoadedCallback === 'function') {
        mapManagerRef.current.removeMapLoadedCallback(mapLoadedCallback);
      }
    };
  }, [mapManagerRef]); // Only depend on mapManagerRef

  // Effect to handle initialization errors
  useEffect(() => {
    const handleError = (error) => {
      console.error("RegionContext: Error in initialization:", error);
      // Prevent infinite loops due to errors
      mapReadyCheckedRef.current = true;
      initAttemptsRef.current = MAX_INIT_ATTEMPTS;
      
      // If we encounter an error, still try to move forward
      setMapReady(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  /**
   * Initialize regions
   */
  useEffect(() => {
    if (!regions || regions.length === 0) {
      setRegions(regionsData);
    }
    let defaultRegionId = 'gulf-of-mexico';
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      const savedRegionId = appSettingsManagerRef.current.getRegion();
      if (savedRegionId) { defaultRegionId = savedRegionId; }
    }
    const defaultRegion = regions.find(r => r.id === defaultRegionId) || regions[0];
    if (!currentRegion && defaultRegion) {
      setCurrentRegion(defaultRegion);
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
    window.staticDataLoaded = false;
    window.platformsLoaded = false;
    window.aircraftLoaded = false;
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.setRegion(currentRegion.id);
    }
    const regionChangedEvent = new CustomEvent('region-changed', { detail: { region: currentRegion } });
    window.dispatchEvent(regionChangedEvent);
    if (!mapReady) {
      console.log(`RegionContext: Map not ready, region will be applied when map loads`);
      return;
    }
    const map = mapManagerRef.current?.getMap();
    if (!map || typeof map.fitBounds !== 'function') {
      console.warn(`RegionContext: Map not available, cannot update view`);
      return;
    }
    try {
      map.fitBounds(currentRegion.bounds, { padding: 50, maxZoom: currentRegion.zoom || 6 });
    } catch (error) { console.error(`RegionContext: Error applying region bounds:`, error); }
  }, [currentRegion, mapManagerRef, appSettingsManagerRef, mapReady]);

  /**
   * Load region-specific data when region changes
   */
  useEffect(() => {
    if (!currentRegion || !client) return;

    const delayMs = 250; 
    const timerId = setTimeout(() => {
      console.log(`RegionContext: Delayed loading data for region: ${currentRegion.name}`);
      setRegionLoading(true);
      
      window.regionState = window.regionState || {};
      window.regionState.isChangingRegion = true;
      
      if (!mapReady) {
        console.warn(`RegionContext: Map not ready, deferring platform loading for ${currentRegion.name}`);
        setTimeout(() => {
          window.regionState.isChangingRegion = false;
          setRegionLoading(false);
        }, 1000); 
        return; 
      }
      
      if (platformManagerRef && platformManagerRef.current) {
        console.log(`RegionContext: Loading platforms for ${currentRegion.name}`);
        const loadPlatforms = (attempts = 0) => {
          const maxAttempts = 3;
          try {
            if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
              platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
                .then(() => {
                  console.log(`RegionContext: Platforms loaded for ${currentRegion.name}`);
                  window.regionState.isChangingRegion = false;
                  if (typeof platformManagerRef.current.loadOsdkWaypointsFromFoundry === 'function') {
                    let regionQueryTerm = currentRegion.osdkRegion || currentRegion.name;
                    if (regionQueryTerm && regionQueryTerm.toLowerCase() === 'norway') {
                      regionQueryTerm = 'NORWAY';
                    }
                    console.log(`RegionContext: Loading OSDK waypoints for ${regionQueryTerm}`);
                    platformManagerRef.current.loadOsdkWaypointsFromFoundry(client, regionQueryTerm)
                      .then(() => { console.log(`RegionContext: OSDK waypoints loaded for ${regionQueryTerm}`); })
                      .catch(error => console.error(`Error loading OSDK waypoints for ${regionQueryTerm}:`, error))
                      .finally(() => {
                        setRegionLoading(false);
                        if (mapInteractionHandlerRef && mapInteractionHandlerRef.current) {
                          console.log('RegionContext: All region data loaded, re-initializing MapInteractionHandler.');
                          mapInteractionHandlerRef.current.initialize();
                        }
                      });
                  } else {
                    console.warn('RegionContext: loadOsdkWaypointsFromFoundry not available');
                    setRegionLoading(false);
                    if (mapInteractionHandlerRef && mapInteractionHandlerRef.current) {
                      console.log('RegionContext: Platform data loaded (no OSDK waypoints), re-initializing MapInteractionHandler.');
                      mapInteractionHandlerRef.current.initialize();
                    }
                  }
                })
                .catch(error => {
                  console.error(`RegionContext: Error loading platforms:`, error);
                  window.regionState.isChangingRegion = false;
                  if (attempts < maxAttempts) {
                    console.log(`RegionContext: Retrying platform load (${attempts+1}/${maxAttempts})...`);
                    setTimeout(() => loadPlatforms(attempts + 1), 1000);
                  } else {
                    console.error(`RegionContext: Failed to load platforms after ${maxAttempts} attempts`);
                    setRegionLoading(false);
                    if (mapInteractionHandlerRef && mapInteractionHandlerRef.current) {
                      console.log('RegionContext: Failed to load platforms, but still re-initializing MapInteractionHandler.');
                      mapInteractionHandlerRef.current.initialize();
                    }
                  }
                });
            } else {
              console.error('RegionContext: PlatformManager.loadPlatformsFromFoundry is not a function');
              window.regionState.isChangingRegion = false;
              setRegionLoading(false);
              if (mapInteractionHandlerRef && mapInteractionHandlerRef.current) {
                mapInteractionHandlerRef.current.initialize();
              }
            }
          } catch (error) {
            console.error(`RegionContext: Error calling platform loading method:`, error);
            window.regionState.isChangingRegion = false;
            if (attempts < maxAttempts) {
              console.log(`RegionContext: Retrying platform load (${attempts+1}/${maxAttempts})...`);
              setTimeout(() => loadPlatforms(attempts + 1), 1000);
            } else {
              console.error(`RegionContext: Failed to load platforms after ${maxAttempts} attempts`);
              setRegionLoading(false);
              if (mapInteractionHandlerRef && mapInteractionHandlerRef.current) {
                mapInteractionHandlerRef.current.initialize();
              }
            }
          }
        };
        loadPlatforms();
      } else { 
        console.warn('RegionContext: No platform manager available, or map not ready for platform loading.');
        window.regionState.isChangingRegion = false;
        setRegionLoading(false);
        if (mapReady && mapInteractionHandlerRef && mapInteractionHandlerRef.current) {
          console.log('RegionContext: No platform manager, but re-initializing MapInteractionHandler.');
          mapInteractionHandlerRef.current.initialize();
        }
      }
      
      if (aircraftManagerRef && aircraftManagerRef.current) {
        console.log(`RegionContext: Filtering aircraft for ${currentRegion.name}`);
        aircraftManagerRef.current.filterAircraft(currentRegion.id);
      }
      
      if (favoriteLocationsManagerRef && favoriteLocationsManagerRef.current && setFavoriteLocations) {
        console.log(`RegionContext: Loading favorites for ${currentRegion.name}`);
        const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id);
        setFavoriteLocations(regionFavorites);
      }
    }, delayMs);

    return () => clearTimeout(timerId); // Cleanup timer
  }, [
    currentRegion,
    client,
    platformManagerRef,
    aircraftManagerRef,
    favoriteLocationsManagerRef,
    setFavoriteLocations,
    mapReady,
    mapInteractionHandlerRef 
  ]);

  /**
   * Change the current region
   */
  const changeRegion = useCallback((regionId) => {
    console.log(`RegionContext: Changing region to ${regionId}`);
    setRegionLoading(true);
    
    window.regionState = window.regionState || {};
    window.regionState.isChangingRegion = true;
    
    const regionObject = regions.find(region => region.id === regionId);
    if (!regionObject) {
      console.error(`Region with ID ${regionId} not found`);
      setRegionLoading(false);
      window.regionState.isChangingRegion = false;
      return;
    }
    
    setCurrentRegion(regionObject);
    
    if (!mapReady && mapManagerRef.current) {
      pendingRegionChangeRef.current = regionObject;
      console.log(`RegionContext: Map not ready, region ${regionObject.name} will be applied when map loads. fitBounds will be handled by useEffect.`);
    } else if (mapReady && mapManagerRef.current && mapManagerRef.current.getMap()) {
      if (platformManagerRef.current) {
        platformManagerRef.current.skipNextClear = false; 
        console.log(`RegionContext: Set skipNextClear to false for ${regionObject.name}. fitBounds will be handled by useEffect.`);
      }
    }
  }, [regions, mapReady, mapManagerRef, platformManagerRef]);

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

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};

export default RegionContext;
