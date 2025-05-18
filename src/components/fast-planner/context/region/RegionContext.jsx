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
  mapInteractionHandlerRef, // Added mapInteractionHandlerRef
  waypointManagerRef // Explicitly add waypointManagerRef to the props
}) => {
  // Core region state
  const [regions, setRegions] = useState(regionsData);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionChangeInProgress, setRegionChangeInProgress] = useState(false);
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
    // More thorough check for map availability
    try {
      if (!mapManagerRef || !mapManagerRef.current) {
        console.warn("RegionContext: MapManager ref is not available");
        return false;
      }

      const map = mapManagerRef.current.getMap();
      if (!map) {
        console.warn("RegionContext: Map instance not available");
        return false;
      }
      
      // Check for multiple critical map functions
      const isReady = (
        typeof map.on === 'function' && 
        typeof map.fitBounds === 'function' && 
        typeof map.getZoom === 'function'
      );
      
      if (isReady) {
        // Test a real map operation to confirm it's ready
        try {
          const currentZoom = map.getZoom();
          console.log(`RegionContext: Map is ready with zoom level: ${currentZoom}`);
        } catch (e) {
          console.warn("RegionContext: Map operation test failed, not fully ready");
          return false;
        }
        
        // Only update state if there's a change to avoid unnecessary re-renders
        if (!mapReadyLastState.current || !mapReady) {
          console.log("RegionContext: Map is now ready for operations");
          mapReadyLastState.current = true;
          setMapReady(true);
          
          // If we have a pending region, apply it now
          if (pendingRegionChangeRef.current) {
            console.log(`RegionContext: Applying pending region now that map is ready: ${pendingRegionChangeRef.current.name}`);
            setCurrentRegion(pendingRegionChangeRef.current);
            pendingRegionChangeRef.current = null;
          }
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
    } catch (error) {
      console.error("RegionContext: Error in checkMapReady:", error);
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
      
      try {
        const map = mapManagerRef.current?.getMap();
        const isReady = map && typeof map.on === 'function' && typeof map.fitBounds === 'function';
        
        if (isReady) {
          console.log("RegionContext: Map is ready in checkForMapReady");
          mapReadyCheckedRef.current = true;
          setMapReady(true);
          
          // Handle pending region change, but don't call fitBounds directly
          // This avoids errors if anything goes wrong
          if (pendingRegionChangeRef.current) {
            const region = pendingRegionChangeRef.current;
            console.log(`RegionContext: Applying pending region: ${region.name}`);
            
            // Simply update currentRegion - the useEffect will handle the transition
            setCurrentRegion(region);
            
            // Clear the pending reference
            pendingRegionChangeRef.current = null;
          }
          return true;
        }
      } catch (error) {
        console.warn("RegionContext: Error checking map ready status:", error);
      }
      
      // Increment attempt counter if we're not ready yet
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
          try {
            console.log("RegionContext: Map loaded callback triggered");
            mapReadyCheckedRef.current = true;
            setMapReady(true);
            
            // Handle pending region change, but don't call fitBounds directly
            if (pendingRegionChangeRef.current) {
              const region = pendingRegionChangeRef.current;
              console.log(`RegionContext: Applying pending region in callback: ${region.name}`);
              
              // Simply update currentRegion - the useEffect will handle the transition
              setCurrentRegion(region);
              
              // Clear the pending reference
              pendingRegionChangeRef.current = null;
            }
          } catch (error) {
            console.error("RegionContext: Error in mapLoadedCallback:", error);
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
      // Filter to only handle errors we care about
      // Ignore errors from other sources to avoid false positives
      if (error && error.message && (
          error.message.includes('getLayer') || 
          error.message.includes('removeEventListener') ||
          error.message.includes('Map') ||
          error.message.includes('RegionContext')
      )) {
        console.error("RegionContext: Caught map-related error:", error);
        
        // Prevent infinite loops due to errors
        mapReadyCheckedRef.current = true;
        initAttemptsRef.current = MAX_INIT_ATTEMPTS;
        
        // If we encounter a map error, consider map ready but log it
        if (!mapReady) {
          console.warn("RegionContext: Setting mapReady=true to recover from error state");
          setMapReady(true);
        }
      }
    };
    
    // Add our error handler
    window.addEventListener('error', handleError);
    
    // Cleanup 
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [mapReady]);

  /**
   * Initialize regions
   */
  useEffect(() => {
    // Skip if regions aren't loaded yet
    if (!regions || regions.length === 0) {
      setRegions(regionsData);
      return;
    }

    // Skip if we already have a current region
    if (currentRegion) {
      return;
    }

    console.log('RegionContext: Initializing default region');
    
    // Determine default region - either saved or Gulf of Mexico
    let defaultRegionId = 'gulf-of-mexico';
    let savedRegionId = null;
    
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      savedRegionId = appSettingsManagerRef.current.getRegion();
      if (savedRegionId) { 
        console.log(`RegionContext: Found saved region: ${savedRegionId}`);
      }
    }
    
    // First set the Gulf of Mexico as the initial region
    const gulfRegion = regions.find(r => r.id === 'gulf-of-mexico');
    if (gulfRegion) {
      console.log('RegionContext: Setting Gulf of Mexico as initial region');
      setCurrentRegion(gulfRegion);
      
      // If there's a saved region different from Gulf, schedule its application after a delay
      if (savedRegionId && savedRegionId !== 'gulf-of-mexico') {
        const savedRegion = regions.find(r => r.id === savedRegionId);
        if (savedRegion) {
          console.log(`RegionContext: Will transition to saved region: ${savedRegion.name} after short delay`);
          
          // Set a timeout to apply the saved region after a short delay
          // This creates the nice fly-to effect from Gulf to the saved region
          setTimeout(() => {
            if (!mapReady) {
              console.log(`RegionContext: Map not ready yet, storing ${savedRegion.name} as pending`);
              pendingRegionChangeRef.current = savedRegion;
            } else {
              console.log(`RegionContext: Transitioning to saved region: ${savedRegion.name}`);
              setCurrentRegion(savedRegion);
            }
          }, 1000); // 1 second delay to ensure the Gulf displays first
        }
      } else if (!mapReady) {
        // If Gulf is the default and map isn't ready, set it as pending
        pendingRegionChangeRef.current = gulfRegion;
      }
    } else {
      // Fallback in case Gulf region isn't available
      const defaultRegion = regions.find(r => r.id === savedRegionId) || regions[0];
      if (defaultRegion) {
        console.log(`RegionContext: Setting ${defaultRegion.name} as fallback default region`);
        setCurrentRegion(defaultRegion);
        if (!mapReady) {
          pendingRegionChangeRef.current = defaultRegion;
        }
      }
    }
  }, [regions, currentRegion, appSettingsManagerRef, mapReady]);

  /**
   * Direct method to fly to a region's bounds
   * This can be called anywhere, anytime to force map navigation
   */
  const directFlyToRegion = useCallback((region) => {
    console.log(`RegionContext [EMERGENCY FLY]: Directly flying to ${region.name}`);
    
    if (!mapManagerRef || !mapManagerRef.current) {
      console.warn("RegionContext [EMERGENCY FLY]: MapManager ref not available");
      return false;
    }
    
    try {
      const map = mapManagerRef.current.getMap();
      if (!map || typeof map.fitBounds !== 'function') {
        console.warn("RegionContext [EMERGENCY FLY]: Map or fitBounds not available");
        return false;
      }
      
      // Force map to fly to the region bounds with no conditions
      map.fitBounds(region.bounds, {
        padding: 50,
        maxZoom: region.zoom || 6,
        animate: true,
        duration: 3000,
        essential: true
      });
      
      console.log(`RegionContext [EMERGENCY FLY]: Forced flight to ${region.name}`);
      return true;
    } catch (error) {
      console.error("RegionContext [EMERGENCY FLY]: Error flying to region:", error);
      return false;
    }
  }, [mapManagerRef]);
  
  // Add emergency fly method to window for access from console
  useEffect(() => {
    window.emergencyFlyToRegion = (regionId) => {
      const regionObject = regions.find(r => r.id === regionId);
      if (regionObject) {
        return directFlyToRegion(regionObject);
      }
      return false;
    };
    
    // Also add ability to fly to current region
    window.emergencyFlyToCurrentRegion = () => {
      if (currentRegion) {
        return directFlyToRegion(currentRegion);
      }
      return false;
    };
    
    return () => {
      delete window.emergencyFlyToRegion;
      delete window.emergencyFlyToCurrentRegion;
    };
  }, [regions, currentRegion, directFlyToRegion]);

  /**
   * Effect to update map view when currentRegion changes
   */
  useEffect(() => {
    if (!currentRegion) return;
    
    // Update global flags
    window.staticDataLoaded = false;
    window.platformsLoaded = false;
    window.aircraftLoaded = false;
    
    // Save region to app settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.setRegion(currentRegion.id);
    }
    
    // Dispatch region change event
    const regionChangedEvent = new CustomEvent('region-changed', { detail: { region: currentRegion } });
    window.dispatchEvent(regionChangedEvent);
    
    // Create a direct map fly function that bypasses other checks
    const flyToRegionBounds = () => {
      console.log(`RegionContext [DIRECT FLY]: Flying to bounds for region: ${currentRegion.name}`);
      
      try {
        if (!mapManagerRef || !mapManagerRef.current) {
          console.warn(`RegionContext [DIRECT FLY]: mapManagerRef not available`);
          return false;
        }
        
        const map = mapManagerRef.current.getMap();
        if (!map || typeof map.fitBounds !== 'function') {
          console.warn(`RegionContext [DIRECT FLY]: Map or fitBounds not available`);
          return false;
        }
        
        // Force a direct flyTo with no conditions
        map.fitBounds(currentRegion.bounds, { 
          padding: 50, 
          maxZoom: currentRegion.zoom || 6,
          animate: true,
          duration: 3000,  // 3 seconds for smooth animation
          essential: true,
          linear: false    // Use default ease-out effect
        });
        
        console.log(`RegionContext [DIRECT FLY]: Forced flight to ${currentRegion.name} bounds`);
        return true;
      } catch (error) { 
        console.error(`RegionContext [DIRECT FLY]: Error applying region bounds:`, error);
        return false;
      }
    };
    
    // Try immediate fly if map is ready
    if (mapReady) {
      const success = directFlyToRegion(currentRegion);
      if (!success) {
        console.warn(`RegionContext: Initial fly to ${currentRegion.name} failed, will retry`);
      }
    } else {
      console.log(`RegionContext: Map not ready, will try flying to region when map loads`);
    }
    
    // Schedule additional attempts with increasing delays to ensure the map moves
    // This is a safety measure in case the first attempt fails
    const attemptFlyWithDelay = (attempt = 1) => {
      const maxAttempts = 5;
      const delay = attempt * 1000; // Increasing delay with each attempt
      
      setTimeout(() => {
        // Check if we successfully flew to the region
        if (directFlyToRegion(currentRegion) || attempt >= maxAttempts) {
          return;
        }
        
        // Try again with increased delay
        attemptFlyWithDelay(attempt + 1);
      }, delay);
    };
    
    // Start the delayed attempts
    attemptFlyWithDelay();
    
  }, [currentRegion, mapManagerRef, appSettingsManagerRef, mapReady, directFlyToRegion]);

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
   * Change the current region with enhanced safety and sequencing
   */
  const changeRegion = useCallback((regionId) => {
    // Skip if this region is already active
    if (currentRegion && currentRegion.id === regionId) {
      console.log(`RegionContext: Already in region ${regionId}, skipping change`);
      return;
    }
    
    console.log(`RegionContext: Starting DIRECT region change to ${regionId}`);
    
    // Find the region object first
    const regionObject = regions.find(region => region.id === regionId);
    if (!regionObject) {
      console.error(`Region with ID ${regionId} not found`);
      return;
    }
    
    // Set loading state and global flags
    setRegionLoading(true);
    setRegionChangeInProgress(true);
    window.regionState = window.regionState || {};
    window.regionState.isChangingRegion = true;
    
    // Set the current region first - this is essential
    setCurrentRegion(regionObject);
    
    // If the map is ready, directly fly to the region as well
    if (mapReady) {
      // Try a direct fly to the region bounds to ensure it works
      setTimeout(() => {
        directFlyToRegion(regionObject);
      }, 100);
    } else {
      // If map isn't ready, set as pending region
      pendingRegionChangeRef.current = regionObject;
    }
    
    // Schedule cleanup and reset in a separate microtask to avoid blocking
    setTimeout(() => {
      // Try to clear waypoints and route data
      if (typeof waypointManagerRef !== 'undefined' && waypointManagerRef && waypointManagerRef.current) {
        try {
          // Clear internal arrays directly
          const markers = waypointManagerRef.current.markers || [];
          markers.forEach(marker => {
            try { marker.remove(); } catch (e) { /* Ignore errors */ }
          });
          waypointManagerRef.current.markers = [];
          waypointManagerRef.current.waypoints = [];
          
          // Trigger callbacks to update UI state
          if (typeof waypointManagerRef.current.triggerCallback === 'function') {
            waypointManagerRef.current.triggerCallback('onChange', []);
            waypointManagerRef.current.triggerCallback('onRouteUpdated', { waypoints: [], coordinates: [] });
          }
        } catch (error) {
          console.error(`RegionContext: Error clearing waypoints:`, error);
        }
      }
      
      // Set skipNextClear flag on platform manager
      if (typeof platformManagerRef !== 'undefined' && platformManagerRef && platformManagerRef.current) {
        platformManagerRef.current.skipNextClear = true;
      }
      
      // Schedule reset of state flags after a delay
      setTimeout(() => {
        setRegionChangeInProgress(false);
        window.regionState.isChangingRegion = false;
        
        // Re-initialize map interaction handler after region is fully loaded
        if (typeof mapInteractionHandlerRef !== 'undefined' && mapInteractionHandlerRef && 
            mapInteractionHandlerRef.current && typeof mapInteractionHandlerRef.current.initialize === 'function') {
          setTimeout(() => {
            try {
              console.log('RegionContext: Reinitializing map interaction handler');
              mapInteractionHandlerRef.current.initialize();
            } catch (error) {
              console.error('RegionContext: Error initializing map interaction:', error);
            }
          }, 1500);
        }
      }, 1000);
    }, 0);
  }, [regions, currentRegion, mapManagerRef, waypointManagerRef, platformManagerRef, mapInteractionHandlerRef]);

  const value = React.useMemo(() => ({
    regions,
    currentRegion,
    regionLoading,
    changeRegion,
    mapReady,
    directFlyToRegion // Add the direct fly method to the context value
  }), [regions, currentRegion, regionLoading, changeRegion, mapReady, directFlyToRegion]);

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
