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
  // 🔍 GUARANTEED LOG: This should appear in ANY build
  console.log('🚨 DUNCAN DEBUG TEST: RegionProvider function called!');
  console.log('🚨 DUNCAN DEBUG TEST: URL is:', window.location.href);

  // 🔍 CRITICAL DEBUG: Log RegionProvider initialization
  console.log('🔍 OSDK DEBUG: RegionProvider initializing', {
    clientExists: !!client,
    platformManagerRef: !!platformManagerRef,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });

  // Core region state
  const [regions, setRegions] = useState(regionsData);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionChangeInProgress, setRegionChangeInProgress] = useState(false);
  
  // 🔍 CRITICAL DEBUG: Log state changes
  console.log('🔍 OSDK DEBUG: RegionProvider state', {
    regionsCount: regions?.length,
    regionsData: regionsData?.length,
    currentRegionName: currentRegion?.name,
    clientExists: !!client,
    url: window.location.href
  });
  
  // Add a flag to track if initial region setup is complete
  const initialRegionSetupDone = useRef(false);
  
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
    // 🚨 SIMPLIFIED MAP CHECK: Just check if map exists, don't be too strict
    console.log('🔍 OSDK DEBUG: checkMapReady called - using simplified check', {
      mapManagerRef: !!mapManagerRef,
      mapManagerRefCurrent: !!mapManagerRef?.current,
      url: window.location.href
    });
    
    try {
      // Check if map is actually loaded using the proper method
      if (mapManagerRef && mapManagerRef.current && mapManagerRef.current.isMapLoaded) {
        const isLoaded = mapManagerRef.current.isMapLoaded();
        console.log("🔍 OSDK DEBUG: MapManager isMapLoaded():", isLoaded);
        if (isLoaded) {
          console.log("🔍 OSDK DEBUG: MapManager reports map is loaded - considering ready");
          // Set the mapReady state to trigger useEffect that loads platforms
          if (!mapReadyLastState.current || !mapReady) {
            console.log("🔍 OSDK DEBUG: Setting mapReady state to true");
            mapReadyLastState.current = true;
            setMapReady(true);
          }
          return true;
        }
      }
      
      // Check for global map instances as backup
      if (window.mapManager && window.mapManager.isMapLoaded && window.mapManager.isMapLoaded()) {
        console.log("🔍 OSDK DEBUG: Global map manager reports loaded - considering ready");
        // Set the mapReady state to trigger useEffect that loads platforms
        if (!mapReadyLastState.current || !mapReady) {
          console.log("🔍 OSDK DEBUG: Setting mapReady state to true (global backup)");
          mapReadyLastState.current = true;
          setMapReady(true);
        }
        return true;
      }
      
      console.log("🔍 OSDK DEBUG: Map not loaded or not available");
      return false;
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
    console.log('🔍 OSDK DEBUG: Region initialization effect triggered', {
      regionsCount: regions?.length,
      currentRegion: currentRegion?.name,
      initialSetupDone: initialRegionSetupDone.current,
      url: window.location.href
    });

    // Skip if regions aren't loaded yet
    if (!regions || regions.length === 0) {
      console.log('🔍 OSDK DEBUG: No regions loaded, setting regionsData');
      setRegions(regionsData);
      return;
    }

    // Skip if we already have a current region
    if (currentRegion) {
      console.log('🔍 OSDK DEBUG: Current region already set:', currentRegion.name);
      return;
    }
    
    // Skip if we're done with initial setup and this is a subsequent region change
    if (initialRegionSetupDone.current) {
      console.log('🔍 OSDK DEBUG: Initial setup already done, skipping');
      return;
    }

    console.log('🔍 OSDK DEBUG: Starting region initialization...');
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
    
    // Mark initialization as done to prevent this effect from running again on subsequent region changes
    initialRegionSetupDone.current = true;
    
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
      
      // Force map to fly to the region bounds with map state awareness
      const currentMapState = window.mapManager?.getMapState();
      const targetPitch = currentMapState?.isStarlightMode ? 60 : 0;
      
      map.fitBounds(region.bounds, {
        padding: 50,
        maxZoom: region.zoom || 6,
        animate: true,
        duration: 3000,
        essential: true,
        pitch: targetPitch  // Preserve current map mode
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
        
        // Force a direct flyTo with map state awareness
        const currentMapState = window.mapManager?.getMapState();
        const targetPitch = currentMapState?.isStarlightMode ? 60 : 0;
        
        map.fitBounds(currentRegion.bounds, { 
          padding: 50, 
          maxZoom: currentRegion.zoom || 6,
          animate: true,
          duration: 3000,  // 3 seconds for smooth animation
          essential: true,
          linear: false,   // Use default ease-out effect
          pitch: targetPitch  // Preserve current map mode
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
    console.log(`🔍 OSDK DEBUG: Region effect triggered`, {
      currentRegion: currentRegion?.name,
      clientExists: !!client,
      url: window.location.href
    });
    
    // 🚨 FORCED DEBUG: Add global tracking
    window.regionEffectRuns = (window.regionEffectRuns || 0) + 1;
    console.log(`🚨 REGION EFFECT DEBUG: This useEffect has run ${window.regionEffectRuns} times`);

    if (!currentRegion || !client) {
      console.log(`🔍 OSDK DEBUG: Skipping region load`, {
        currentRegion: !!currentRegion,
        client: !!client
      });
      return;
    }

    const delayMs = 250; 
    const timerId = setTimeout(() => {
      console.log(`🔍 OSDK DEBUG: Starting delayed region load for: ${currentRegion.name}`);
      console.log(`RegionContext: Delayed loading data for region: ${currentRegion.name}`);
      setRegionLoading(true);
      
      window.regionState = window.regionState || {};
      window.regionState.isChangingRegion = true;
      
      // 🛡️ SAFETY: Always reset flags after maximum timeout to prevent permanent blocking
      const safetyTimeoutId = setTimeout(() => {
        console.warn(`%c SAFETY RESET: Forcing region flags reset after timeout`, 'background: red; color: white; font-weight: bold;');
        setRegionChangeInProgress(false);
        window.regionState.isChangingRegion = false;
        window.REGION_CHANGE_IN_PROGRESS = false;
        setRegionLoading(false);
      }, 15000); // 15 second safety timeout
      
      // Store safety timeout globally so it can be cleared
      window.regionSafetyTimeoutId = safetyTimeoutId;
      
      if (!mapReady) {
        console.log(`🔍 OSDK DEBUG: Map not ready, waiting longer for map initialization for ${currentRegion.name}`);
        console.warn(`RegionContext: Map not ready, waiting 2 seconds for map to initialize before loading platforms`);
        
        // Wait longer for map to be ready, then retry
        setTimeout(() => {
          if (mapManagerRef && mapManagerRef.current) {
            try {
              const map = mapManagerRef.current.getMap();
              if (map && typeof map.getZoom === 'function') {
                console.log(`🔍 OSDK DEBUG: Map is now ready after delay, but skipping duplicate platform loading`);
                // 🚨 CONSOLIDATION FIX: Skip delayed platform loading to prevent race condition
                // Platform loading will be handled by the main region effect
                window.regionState.isChangingRegion = false;
                setRegionLoading(false);
              } else {
                console.error(`🔍 OSDK DEBUG: Map still not ready after 2 second delay`);
                window.regionState.isChangingRegion = false;
                setRegionLoading(false);
              }
            } catch (error) {
              console.error(`🔍 OSDK DEBUG: Error checking map readiness after delay:`, error);
              window.regionState.isChangingRegion = false;
              setRegionLoading(false);
            }
          }
        }, 2000); // Wait 2 seconds for map to be ready
        return; 
      }
      
      console.log(`🔍 OSDK DEBUG: Map is ready, proceeding with platform loading for ${currentRegion.name}`);
      
      // 🚨 FORCED DEBUG: Check platform loading conditions
      console.log(`🚨 PLATFORM LOADING DEBUG:`, {
        platformManagerRef: !!platformManagerRef,
        platformManagerRefCurrent: !!platformManagerRef?.current,
        loadFunction: typeof platformManagerRef?.current?.loadPlatformsFromFoundry
      });
      
      if (platformManagerRef && platformManagerRef.current) {
        console.log(`🔍 OSDK DEBUG: Platform loading section reached for ${currentRegion.name}`);
        console.log(`RegionContext: Loading platforms for ${currentRegion.name}`);
        const loadPlatforms = (attempts = 0) => {
          const maxAttempts = 3;
          console.log(`🔍 OSDK DEBUG: loadPlatforms called (attempt ${attempts + 1}/${maxAttempts})`);
          try {
            if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
              // 🚨 CONSOLIDATION FIX: Add loading guard to prevent duplicate calls
              const loadingKey = `platform_loading_${currentRegion.osdkRegion}`;
              if (window[loadingKey]) {
                console.log(`🔍 OSDK DEBUG: Platform loading already in progress for ${currentRegion.osdkRegion}, skipping duplicate call`);
                return;
              }
              
              console.log(`🔍 OSDK DEBUG: About to call loadPlatformsFromFoundry for region: ${currentRegion.osdkRegion}`);
              console.log(`🔍 OSDK DEBUG: Client available:`, !!client);
              console.log(`🔍 OSDK DEBUG: Current URL:`, window.location.href);
              
              window[loadingKey] = true; // Set loading flag
              platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
                .then(() => {
                  console.log(`RegionContext: Platforms loaded for ${currentRegion.name}`);
                  window[loadingKey] = false; // Clear loading flag
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
                  window[loadingKey] = false; // Clear loading flag on error
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
              const loadingKey = `platform_loading_${currentRegion.osdkRegion}`;
              window[loadingKey] = false; // Clear loading flag
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
      
      // 🚨 AIRCRAFT LOADING: Load from OSDK FIRST, then filter
      if (aircraftManagerRef && aircraftManagerRef.current) {
        console.log(`🚨 IMMEDIATE: Loading aircraft from OSDK first for ${currentRegion.name}`);
        
        // Load aircraft from OSDK immediately, BEFORE filtering
        aircraftManagerRef.current.loadAircraftFromOSDK(client)
          .then(() => {
            console.log(`🚨 IMMEDIATE: Aircraft loaded from OSDK, now filtering for ${currentRegion.name}`);
            
            // Add a small delay to ensure useAircraft callbacks are established
            setTimeout(() => {
              try {
                console.log(`RegionContext: Executing delayed aircraft filter for ${currentRegion.name}`);
                
                // Check if aircraft manager has the onAircraftFiltered callback set up
                if (aircraftManagerRef.current.callbacks && aircraftManagerRef.current.callbacks.onAircraftFiltered) {
                  console.log(`RegionContext: Aircraft callbacks are ready, proceeding with filter`);
                  aircraftManagerRef.current.filterAircraft(currentRegion.id);
                } else {
                  console.warn(`RegionContext: Aircraft callbacks not ready yet, retrying in 500ms`);
                  // Retry once more if callbacks aren't ready
                  setTimeout(() => {
                    if (aircraftManagerRef.current) {
                      console.log(`RegionContext: Retry aircraft filter for ${currentRegion.name}`);
                      aircraftManagerRef.current.filterAircraft(currentRegion.id);
                    }
                  }, 500);
                }
              } catch (error) {
                console.error(`RegionContext: Error filtering aircraft:`, error);
              }
            }, 500); // Increased delay to ensure callback setup completes
          })
          .catch(error => {
            console.error(`🚨 IMMEDIATE: Error loading aircraft from OSDK:`, error);
          });
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
    
    // DIAGNOSTIC: Add state logging
    console.log(`%c REGION DIAGNOSTIC: Current region is ${currentRegion?.name || 'null'}, changing to ${regionObject.name}`, 'background: #ffcc00; color: black; font-weight: bold');
    
    // Capture the current map state before making any changes
    let fromRegion = currentRegion;
    let initialCenter = null;
    let initialZoom = null;
    
    try {
      const map = mapManagerRef?.current?.getMap();
      if (map) {
        // Store current map position to avoid flicker
        if (typeof map.getCenter === 'function') {
          initialCenter = map.getCenter();
        }
        if (typeof map.getZoom === 'function') {
          initialZoom = map.getZoom();
        }
        console.log(`RegionContext: Captured map position before region change: ${initialCenter?.lng},${initialCenter?.lat} Z${initialZoom}`);
      }
    } catch (error) {
      console.warn(`RegionContext: Error capturing initial map state: ${error.message}`);
    }
    
    // Set loading state and global flags
    setRegionLoading(true);
    setRegionChangeInProgress(true);
    window.regionState = window.regionState || {};
    window.regionState.isChangingRegion = true;
    
    // CRITICAL: Set a global diagnostic flag to trace region changes
    window.REGION_CHANGE_IN_PROGRESS = true;
    window.REGION_CHANGE_FROM = currentRegion?.name || 'null';
    window.REGION_CHANGE_TO = regionObject.name;
    window.REGION_CHANGE_TIME = new Date().toISOString();
    
    // Since we've already set initialRegionSetupDone to true,
    // we can safely set the current region and it won't trigger the Gulf of Mexico initialization
    setCurrentRegion(regionObject);
    
    // If the map is ready, directly fly to the region as well
    if (mapReady) {
      // Immediately fly to the region instead of waiting - reduces chance of flicker
      try {
        const map = mapManagerRef?.current?.getMap();
        if (map && typeof map.fitBounds === 'function' && initialCenter) {
          console.log(`%c REGION DIAGNOSTIC: Flying directly to ${regionObject.name} bounds`, 'background: #ffcc00; color: black;');
          
          // Skip any intermediate positions and go directly to target with map state awareness
          const currentMapState = window.mapManager?.getMapState();
          const targetPitch = currentMapState?.isStarlightMode ? 60 : 0;
          
          map.fitBounds(regionObject.bounds, { 
            padding: 50, 
            maxZoom: regionObject.zoom || 6,
            animate: true,
            duration: 3000,
            essential: true,
            pitch: targetPitch  // Preserve current map mode
          });
        } else {
          // Fall back to directFlyToRegion
          console.log(`%c REGION DIAGNOSTIC: Using directFlyToRegion fallback`, 'background: #ffcc00; color: black;');
          directFlyToRegion(regionObject);
        }
      } catch (error) {
        console.error(`RegionContext: Error flying to region: ${error.message}`);
        directFlyToRegion(regionObject);
      }
    } else {
      // If map isn't ready, set as pending region
      console.log(`%c REGION DIAGNOSTIC: Map not ready, storing pending region: ${regionObject.name}`, 'background: #ffcc00; color: black;');
      pendingRegionChangeRef.current = regionObject;
    }
    
    // Schedule cleanup and reset in a separate microtask to avoid blocking
    setTimeout(() => {
      console.log(`%c REGION DIAGNOSTIC: Starting cleanup after region change`, 'background: #ffcc00; color: black;');
      
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
        console.log(`%c REGION DIAGNOSTIC: Final cleanup - reset flags`, 'background: #ffcc00; color: black;');
        
        // 🛡️ Clear safety timeout since normal cleanup is happening
        if (window.regionSafetyTimeoutId) {
          clearTimeout(window.regionSafetyTimeoutId);
          window.regionSafetyTimeoutId = null;
        }
        
        setRegionChangeInProgress(false);
        window.regionState.isChangingRegion = false;
        window.REGION_CHANGE_IN_PROGRESS = false;
        
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
  }, [regions, currentRegion, mapReady, mapManagerRef, waypointManagerRef, platformManagerRef, mapInteractionHandlerRef, directFlyToRegion]);

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
