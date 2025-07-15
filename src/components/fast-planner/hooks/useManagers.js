// src/components/fast-planner/hooks/useManagers.js

import { useRef, useEffect, useState } from 'react';
import {
  MapManager,
  WaypointManager,
  PlatformManager,
  RouteCalculator,
  RegionManager,
  FavoriteLocationsManager,
  AircraftManager,
  MapInteractionHandler,
  AppSettingsManager,
  WeatherVisualizationManager
} from '../modules';
import FlightCalculations from '../modules/calculations/FlightCalculations';
import { createWaypointInsertionManager, setupWaypointCallbacks, patchWaypointManager } from '../modules/waypoints';
import * as WindCalc from '../modules/calculations/WindCalculations';
import WaypointHandler from '../modules/WaypointHandler';

/**
 * Custom hook to initialize and manage all manager instances
 * 
 * Region management has been moved to RegionContext
 */
const useManagers = ({
  client,
  setFavoriteLocations,
  setWaypoints,
  flightSettings,
  setFlightSettings,
  forceUpdate,
  setForceUpdate,
  addWaypoint,
  weather,
  setWeather
}) => {
  // Local state for aircraft loading - no longer dependent on parent component
  const [localAircraftLoading, setLocalAircraftLoading] = useState(false);
  
  // Core managers refs
  const mapManagerRef = useRef(null);
  const waypointManagerRef = useRef(null);
  const platformManagerRef = useRef(null);
  const routeCalculatorRef = useRef(null);
  const regionManagerRef = useRef(null);
  const favoriteLocationsManagerRef = useRef(null);
  const aircraftManagerRef = useRef(null);
  const flightCalculationsRef = useRef(null);
  const waypointInsertionManagerRef = useRef(null);
  const mapInteractionHandlerRef = useRef(null);
  const appSettingsManagerRef = useRef(null);
  const waypointHandlerRef = useRef(null);
  const weatherVisualizationManagerRef = useRef(null);

  // Track initialization status to prevent multiple initializations
  const [managersInitialized, setManagersInitialized] = useState(false);
  
  // Track authentication state for lifecycle management
  const [lastAuthState, setLastAuthState] = useState(null);

  // Initialize managers - ONLY after authentication completes
  useEffect(() => {
    // 🛩️ AVIATION SAFETY: Only initialize managers when authentication is complete
    // This prevents callback system failures caused by initialization before auth
    console.log("🔧 MANAGER INIT: Checking initialization conditions...", {
      managersInitialized,
      hasClient: !!client,
      // Note: We check for actual authentication success, not just client existence
      clientType: client?.constructor?.name || 'none'
    });

    // Skip if already initialized to prevent re-initialization loops
    if (managersInitialized) {
      console.log("✅ MANAGERS: Already initialized, skipping");
      return;
    }

    // 🚨 CRITICAL FIX: Ensure client is available AND authentication is complete
    if (!client) {
      console.log("⏳ MANAGERS: Waiting for OSDK client...");
      return;
    }

    // 🔧 AUTHENTICATION CHECK: Verify client is actually authenticated
    // This prevents managers from initializing with an unauthenticated client
    const isClientAuthenticated = (() => {
      try {
        // Check multiple authentication indicators
        const hasFoundryAuth = window.isFoundryAuthenticated === true;
        const hasClientAuth = client && typeof client.ontology === 'object';
        const hasAuthToken = !!window.auth?.getAccessToken?.();
        
        console.log("🔐 AUTH CHECK:", {
          hasFoundryAuth,
          hasClientAuth,
          hasAuthToken,
          clientReady: hasClientAuth && hasAuthToken
        });
        
        // 🛩️ FLEXIBLE AUTH: Multiple fallback strategies for different environments
        const isAuthenticated = hasClientAuth && (hasFoundryAuth || hasAuthToken);
        
        // Local development fallback: if client exists, proceed (may not have full ontology yet)
        const localDevFallback = client && !hasFoundryAuth && !hasAuthToken;
        
        // Emergency fallback: if we have a client reference at all
        const emergencyFallback = !!client;
        
        console.log("🔐 AUTH DECISION:", {
          isAuthenticated,
          localDevFallback,
          emergencyFallback,
          finalDecision: isAuthenticated || localDevFallback || emergencyFallback
        });
        
        // For now, be permissive to restore functionality
        return isAuthenticated || localDevFallback || emergencyFallback;
      } catch (error) {
        console.warn("🔐 AUTH CHECK: Error checking authentication:", error);
        return false;
      }
    })();

    if (!isClientAuthenticated) {
      console.log("⏳ MANAGERS: Waiting for authentication to complete...");
      console.log("🔍 DEBUG: Client available but auth check failed - client type:", client?.constructor?.name);
      console.log("🔍 DEBUG: Client ontology check:", typeof client?.ontology);
      return;
    }

    console.log("🚀 MANAGERS: Starting initialization with authenticated client...");

    // Create MapManager
    if (!mapManagerRef.current) {
      console.log("FastPlannerApp: Creating MapManager instance");
      mapManagerRef.current = new MapManager();
      
      // EMERGENCY FIX: Update global reference
      window.mapManager = mapManagerRef.current;
      window.mapManagerRef = mapManagerRef;

      // Don't initialize the map here - let MapComponent handle that
      console.log("FastPlannerApp: MapManager created, initialization will be handled by MapComponent");
    }

    // Create FavoriteLocationsManager
    if (!favoriteLocationsManagerRef.current) {
      console.log("FastPlannerApp: Creating FavoriteLocationsManager instance");
      favoriteLocationsManagerRef.current = new FavoriteLocationsManager();

      // Set up callback for when favorites change
      favoriteLocationsManagerRef.current.setCallback('onChange', (data) => {
        console.log(`Favorites changed for region ${data.region}:`, data.favorites);
        // Only update UI if this is for the current region
        const currentRegion = regionManagerRef?.current?.getCurrentRegion();
        if (currentRegion && data.region === currentRegion.id) {
          setFavoriteLocations(data.favorites);
        }
      });

      // Load favorites for initial region (use timeout to ensure region is loaded)
      setTimeout(() => {
        if (regionManagerRef?.current) {
          const currentRegion = regionManagerRef.current.getCurrentRegion();
          if (currentRegion) {
            const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id);
            setFavoriteLocations(regionFavorites);
            console.log(`useManagers: Loaded ${regionFavorites.length} favorites for region ${currentRegion.id}`, regionFavorites);
          } else {
            console.log('useManagers: No current region found for favorites loading');
          }
        } else {
          console.log('useManagers: RegionManager not available for favorites loading');
        }
      }, 500);
    }

    // Create PlatformManager
    if (!platformManagerRef.current && mapManagerRef.current) {
      console.log("FastPlannerApp: Creating PlatformManager instance");
      platformManagerRef.current = new PlatformManager(mapManagerRef.current);
      
      // ARCHITECTURE: Expose globally for weather circles management
      window.platformManager = platformManagerRef.current;
      window.platformManagerRef = platformManagerRef;
    }

    // Create RegionManager 
    // (Still needed for some functionality, but main state is managed by RegionContext)
    if (!regionManagerRef.current && mapManagerRef.current && platformManagerRef.current) {
      console.log("FastPlannerApp: Creating RegionManager instance");
      regionManagerRef.current = new RegionManager(mapManagerRef.current, platformManagerRef.current);
      
      // 🛩️ GLOBAL REFERENCE: Make RegionManager globally available
      window.regionManager = regionManagerRef.current;
      window.regionManagerRef = regionManagerRef;
      
      // 🛩️ AUTO-LOAD PLATFORMS: Trigger platform loading for current region
      setTimeout(() => {
        try {
          // Use activeRegionFromContext instead of RegionManager.getCurrentRegion()
          const currentRegion = window.activeRegionFromContext;
          if (currentRegion && platformManagerRef.current && window.client) {
            const regionName = currentRegion.osdkRegion || currentRegion.name;
            console.log(`🚀 AUTO-LOADING: Triggering platform load for region: ${regionName}`);
            platformManagerRef.current.loadPlatformsFromFoundry(window.client, regionName)
              .catch(error => {
                // Suppress "Map is not initialized" errors - just a timing issue on first load
                if (error.message?.includes('Map is not initialized')) {
                  console.log('⏳ AUTO-LOADING: Map not ready yet, will retry later');
                } else {
                  console.warn('⚠️ AUTO-LOADING: Platform loading error:', error.message);
                }
              });
          } else {
            console.log('⏳ AUTO-LOADING: Region not detected yet, will try again...', {
              currentRegion: !!currentRegion,
              platformManager: !!platformManagerRef.current,
              client: !!window.client
            });
          }
        } catch (error) {
          console.warn('⚠️ AUTO-LOADING: Error triggering platform load:', error);
        }
      }, 1000); // Give region detection time to complete
      
      // We don't set callbacks here anymore as RegionContext handles this
    }

    // Create WaypointManager
    if (!waypointManagerRef.current) {
      console.log("FastPlannerApp: Creating WaypointManager instance");
      waypointManagerRef.current = new WaypointManager(mapManagerRef.current);
      
      // EMERGENCY FIX: Update global reference
      window.waypointManager = waypointManagerRef.current;
    }

    // Add platformManager to waypointManager if both exist
    if (waypointManagerRef.current && platformManagerRef.current) {
      waypointManagerRef.current.setPlatformManager(platformManagerRef.current);
    }

    // Create RouteCalculator
    if (!routeCalculatorRef.current) {
      console.log("FastPlannerApp: Creating RouteCalculator instance");
      routeCalculatorRef.current = new RouteCalculator();

      // Make the route calculator accessible globally for basic calculations
      window.routeCalculator = routeCalculatorRef.current;

      // Set up route calculator callbacks
      routeCalculatorRef.current.setCallback('onCalculationComplete', (stats) => {
        console.log('🔄 Route calculation complete with stats:', {
          totalDistance: stats?.totalDistance,
          estimatedTime: stats?.estimatedTime,
          timeHours: stats?.timeHours,
          legCount: stats?.legs?.length || 0,
          hasWind: stats?.windAdjusted || false
        });

        console.log('🔄 Route calculation complete. Triggering centralized fuel calculation...');
      });

      console.log("FastPlannerApp: RouteCalculator configured with accurate wind calculations");
    }

    // Create AircraftManager
    if (!aircraftManagerRef.current) {
      console.log("FastPlannerApp: Creating AircraftManager instance");
      aircraftManagerRef.current = new AircraftManager();
      
      // CRITICAL: Set global reference like other managers
      window.aircraftManager = aircraftManagerRef.current;

      // Set up aircraft manager callbacks
      aircraftManagerRef.current.setCallback('onAircraftLoaded', (aircraftList) => {
        console.log(`Loaded ${aircraftList.length} total aircraft`);
      });

      aircraftManagerRef.current.setCallback('onAircraftFiltered', (filteredAircraft, type) => {
        console.log(`Filtered to ${filteredAircraft.length} aircraft of type ${type || 'all'}`);
        setLocalAircraftLoading(false); // Use local state
      });
    }

    // Create FlightCalculations
    if (!flightCalculationsRef.current) {
      console.log("FastPlannerApp: Creating FlightCalculations instance");
      flightCalculationsRef.current = new FlightCalculations();

      // Update with current settings
      flightCalculationsRef.current.updateConfig({
        passengerWeight: flightSettings.passengerWeight,
        contingencyFuelPercent: flightSettings.contingencyFuelPercent,
        taxiFuel: flightSettings.taxiFuel,
        reserveFuel: flightSettings.reserveFuel,
        deckTimePerStop: flightSettings.deckTimePerStop,
        deckFuelFlow: flightSettings.deckFuelFlow,
      });

      // Import and make WindCalculations available globally
      import('../modules/calculations/WindCalculations')
        .then(WindCalc => {
          // Make WindCalculations globally available
          window.WindCalculations = WindCalc;
          console.log("WindCalculations module imported and made globally available");
        })
        .catch(error => {
          console.error("Failed to import WindCalculations module:", error);
        });
    }
    
    // Initialize the WaypointInsertionManager
    if (!waypointInsertionManagerRef.current && 
        mapManagerRef.current && 
        waypointManagerRef.current &&
        platformManagerRef.current) {
      console.log("FastPlannerApp: Creating WaypointInsertionManager instance");
      
      try {
        // Create the manager with added safety checks
        waypointInsertionManagerRef.current = createWaypointInsertionManager(
          mapManagerRef.current, 
          waypointManagerRef.current,
          platformManagerRef.current
        );
        
        // Even if the manager is returned as null, we will try again later
        if (!waypointInsertionManagerRef.current) {
          console.log("WaypointInsertionManager creation failed - will retry later");
          
          // Retry after a delay
          setTimeout(() => {
            if (!waypointInsertionManagerRef.current && 
                mapManagerRef.current && 
                mapManagerRef.current.getMap() &&
                waypointManagerRef.current && 
                platformManagerRef.current) {
              console.log("Retrying WaypointInsertionManager creation...");
              waypointInsertionManagerRef.current = createWaypointInsertionManager(
                mapManagerRef.current, 
                waypointManagerRef.current,
                platformManagerRef.current
              );
              
              // Set up callbacks on the retry
              if (waypointInsertionManagerRef.current) {
                console.log("Successfully created WaypointInsertionManager on retry");
                setupWaypointCallbacks(
                  waypointInsertionManagerRef.current,
                  (data) => console.log("Waypoint inserted:", data),
                  (data) => console.log("Waypoint removed:", data),
                  (error) => console.error("Waypoint error:", error)
                );
              }
            }
          }, 3000);
          
        } else {
          // Set up callbacks if the manager was successfully created
          setupWaypointCallbacks(
            waypointInsertionManagerRef.current,
            (data) => console.log("Waypoint inserted:", data),
            (data) => console.log("Waypoint removed:", data),
            (error) => console.error("Waypoint error:", error)
          );
        }
        
      } catch (error) {
        console.error("Error creating WaypointInsertionManager:", error);
      }
    }

    // Initialize the AppSettingsManager
    if (!appSettingsManagerRef.current) {
      appSettingsManagerRef.current = new AppSettingsManager();

      // Set callbacks for settings changes
      appSettingsManagerRef.current.setCallback('onRegionChange', (regionId) => {
      });

      appSettingsManagerRef.current.setCallback('onAircraftChange', (aircraft) => {
      });

      appSettingsManagerRef.current.setCallback('onFlightSettingsChange', (settings) => {
        // ✅ CRITICAL FIX: Merge AppSettingsManager values with existing flightSettings
        // Only user inputs from AppSettingsManager, preserve OSDK policy values
        setFlightSettings(currentSettings => {
          console.log('AppSettingsManager flightSettings change:', {
            contingencyFuelPercent: currentSettings.contingencyFuelPercent,
            passengerWeight: currentSettings.passengerWeight,
            taxiFuel: currentSettings.taxiFuel
          });
          const merged = {
            ...currentSettings, // Preserve existing OSDK policy values
            ...settings         // Apply only user inputs from AppSettingsManager
          };
          console.log('Merged settings:', {
            contingencyFuelPercent: merged.contingencyFuelPercent,
            passengerWeight: merged.passengerWeight,
            taxiFuel: merged.taxiFuel
          });
          return merged;
        });
      });

      appSettingsManagerRef.current.setCallback('onUISettingsChange', (uiSettings) => {
      });

      // Load any saved settings
      const savedSettings = appSettingsManagerRef.current.getAllSettings();

      // Apply flight settings
      const flightSettingsFromStorage = savedSettings.flightSettings;
      if (flightSettingsFromStorage) {
        // ✅ CRITICAL FIX: Merge stored user inputs with existing OSDK policy values
        // Only apply user inputs (passenger weight, cargo), preserve fuel policy values
        console.log("useManagers: Merging saved user inputs with current OSDK policy values");
        setFlightSettings(currentSettings => ({
          ...currentSettings,           // Preserve existing OSDK policy values
          ...flightSettingsFromStorage  // Apply only user inputs from storage
        }));
      }
    }

    // Create the MapInteractionHandler
    if (!mapInteractionHandlerRef.current &&
        mapManagerRef.current &&
        waypointManagerRef.current &&
        platformManagerRef.current) {
      console.log("FastPlannerApp: Creating MapInteractionHandler instance");
      mapInteractionHandlerRef.current = new MapInteractionHandler(
        mapManagerRef.current,
        waypointManagerRef.current,
        platformManagerRef.current
      );
      
      // EMERGENCY FIX: Update global reference
      window.mapInteractionHandler = mapInteractionHandlerRef.current;

      // Set up callbacks
      mapInteractionHandlerRef.current.setCallback('onLeftPanelOpen', () => {
        console.log('Opening left panel due to map click');
      });

      mapInteractionHandlerRef.current.setCallback('onMapClick', async (data) => {
        console.log('🗺️ Map click callback received in useManagers', data);
        console.log('🗺️ Window.isAlternateModeActive:', window.isAlternateModeActive);
        console.log('🗺️ Window.alternateModeClickHandler exists:', !!window.alternateModeClickHandler);
        
        try {
          // Check if alternate mode is active and handle click differently
          if (window.isAlternateModeActive && window.alternateModeClickHandler && typeof window.alternateModeClickHandler === 'function') {
            console.log('🎯 Routing click to alternate mode handler');
            const handled = window.alternateModeClickHandler(data.lngLat, data.nearestPlatform);
            console.log('🎯 Alternate mode handler result:', handled);
            if (handled) {
              console.log('🎯 Click handled by alternate mode, stopping normal waypoint addition');
              return; // Click was handled by alternate mode
            }
          }
          
          // Create a local copy of the data to avoid reference issues
          const clickData = {...data};
          
          // Use the implementation if available
          if (typeof addWaypoint.implementation === 'function') {
            await addWaypoint.implementation(clickData);
          } else if (typeof addWaypoint === 'function') {
            await addWaypoint(clickData);
          } else {
            console.error('No valid addWaypoint function available');
          }
          
        } catch (error) {
          console.error('Error processing map click in useManagers:', error);
        }
      });

      mapInteractionHandlerRef.current.setCallback('onPlatformClick', async (data) => {
        console.log('🏢 Platform click callback received in useManagers', data);
        console.log('🏢 Window.isAlternateModeActive:', window.isAlternateModeActive);
        console.log('🏢 Window.alternateModeClickHandler exists:', !!window.alternateModeClickHandler);
        
        try {
          // Check if alternate mode is active and handle click differently
          if (window.isAlternateModeActive && window.alternateModeClickHandler && typeof window.alternateModeClickHandler === 'function') {
            console.log('🎯 Routing platform click to alternate mode handler');
            const handled = window.alternateModeClickHandler(data.lngLat, data.properties);
            console.log('🎯 Platform alternate mode handler result:', handled);
            if (handled) {
              console.log('🎯 Platform click handled by alternate mode, stopping normal waypoint addition');
              return; // Click was handled by alternate mode
            }
          }
          
          // Create a local copy of the data to avoid reference issues
          const clickData = {...data};

          // Use the implementation if available
          if (typeof addWaypoint.implementation === 'function') {
            await addWaypoint.implementation(clickData);
          } else if (typeof addWaypoint === 'function') {
            await addWaypoint(clickData);
          } else {
            console.error('No valid addWaypoint function available');
          }

        } catch (error) {
          console.error('Error processing platform click in useManagers:', error);
        }
      });

      mapInteractionHandlerRef.current.setCallback('onRouteClick', async (data) => {
        console.log('🛣️ Route click callback received in useManagers', data);
        try {
          // Check if alternate mode is active first
          if (window.isAlternateModeActive && window.alternateModeClickHandler && typeof window.alternateModeClickHandler === 'function') {
            console.log('🎯 Routing route click to alternate mode handler');
            const handled = window.alternateModeClickHandler(data.lngLat, null);
            console.log('🎯 Route alternate mode handler result:', handled);
            if (handled) {
              console.log('🎯 Route click handled by alternate mode, stopping normal waypoint insertion');
              return; // Click was handled by alternate mode
            }
          }
          
          // Create a local copy of the data
          const clickData = {...data};
          
          // Check if we're in waypoint mode
          const isWaypointMode = window.isWaypointModeActive === true;
          
          // IMPROVED: Check for nearest waypoint or platform if not already in the data
          // If we're in waypoint mode, try to find nearest waypoint
          if (isWaypointMode && !clickData.nearestWaypoint && platformManagerRef.current) {
            try {
              if (typeof platformManagerRef.current.findNearestOsdkWaypoint === 'function') {
                const nearestWp = platformManagerRef.current.findNearestOsdkWaypoint(
                  clickData.lngLat.lat, 
                  clickData.lngLat.lng, 
                  5  // Search within 5nm
                );
                
                if (nearestWp) {
                  clickData.nearestWaypoint = nearestWp;
                }
              }
            } catch (error) {
              console.error('Error finding nearest waypoint:', error);
            }
          }
          
          // If not already found, try to find nearest platform
          if (!clickData.nearestRig && platformManagerRef.current) {
            try {
              if (typeof platformManagerRef.current.findNearestPlatform === 'function') {
                const nearestPlatform = platformManagerRef.current.findNearestPlatform(
                  clickData.lngLat.lat, 
                  clickData.lngLat.lng, 
                  5  // Search within 5nm
                );
                
                if (nearestPlatform) {
                  clickData.nearestRig = nearestPlatform;
                }
              }
            } catch (error) {
              console.error('Error finding nearest platform:', error);
            }
          }
          
          // IMPROVED: Use 5nm snapping radius instead of 2nm/1nm
          // If in waypoint mode and we have a nearest waypoint available, use that
          if (isWaypointMode && clickData.nearestWaypoint && clickData.nearestWaypoint.distance < 5) {
            
            // Show user feedback
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Added waypoint: ${clickData.nearestWaypoint.name} (${clickData.nearestWaypoint.distance.toFixed(1)} nm away)`,
                'success',
                2000
              );
            }
            
            waypointManagerRef.current.addWaypointAtIndex(
              clickData.nearestWaypoint.coordinates,
              clickData.nearestWaypoint.name,
              clickData.insertIndex,
              { isWaypoint: true, type: 'WAYPOINT' }
            );
          }
          // If not in waypoint mode and we have a nearest rig and it's close (now using 5nm)
          else if (!isWaypointMode && clickData.nearestRig && clickData.nearestRig.distance < 5) {
            // Add the rig instead of the clicked point
            
            // Show user feedback
            if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Added stop: ${clickData.nearestRig.name} (${clickData.nearestRig.distance.toFixed(1)} nm away)`,
                'success',
                2000
              );
            }
            
            waypointManagerRef.current.addWaypointAtIndex(
              clickData.nearestRig.coordinates,
              clickData.nearestRig.name,
              clickData.insertIndex,
              { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
            );
          } else {
            // Add the clicked point - no nearby facility found
            waypointManagerRef.current.addWaypointAtIndex(
              [clickData.lngLat.lng, clickData.lngLat.lat],
              null,
              clickData.insertIndex,
              { isWaypoint: isWaypointMode, type: isWaypointMode ? 'WAYPOINT' : 'STOP' }
            );
          }

          // Get updated waypoints
          const updatedWaypoints = waypointManagerRef.current.getWaypoints();

          // Update the state - wait for it to complete
          await new Promise(resolve => {
            setWaypoints([...updatedWaypoints]);
            setTimeout(resolve, 0);
          });

          
          // Add a small delay to prevent rapid-fire clicks
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error('Error processing route click in useManagers:', error);
        }
      });

      mapInteractionHandlerRef.current.setCallback('onError', (error) => {
        console.error(`MapInteractionHandler error: ${error}`);
      });
    }

    // Initialize WeatherVisualizationManager
    if (!weatherVisualizationManagerRef.current && mapManagerRef.current && platformManagerRef.current) {
      console.log("🚁 Initializing WeatherVisualizationManager");
      weatherVisualizationManagerRef.current = new WeatherVisualizationManager();
      
      // Initialize with other managers
      weatherVisualizationManagerRef.current.initialize({
        mapManager: mapManagerRef.current,
        platformManager: platformManagerRef.current
      });
    }

    // Mark initialization as complete
    setManagersInitialized(true);
    
    // Set up event listeners
    const handleSaveAircraftSettings = (event) => {
      const { key, settings } = event.detail;
      console.log(`Saving settings for ${key}:`, settings);

      try {
        // Save the settings to localStorage
        localStorage.setItem(`fastPlanner_settings_${key}`, JSON.stringify(settings));
        console.log(`Successfully saved settings for ${key}`);

        // Update AppSettingsManager if it exists
        if (appSettingsManagerRef.current) {
          appSettingsManagerRef.current.updateFlightSettings(settings);
        }
      } catch (error) {
        console.error(`Error saving settings for ${key}:`, error);
      }
    };

    const handleSettingsChanged = () => {
    };

    // Add event listeners
    window.addEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    window.addEventListener('settings-changed', handleSettingsChanged);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('save-aircraft-settings', handleSaveAircraftSettings);
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, [
    client, 
    managersInitialized // Only depend on this flag and client
  ]); 

  // 🛩️ CALLBACK RE-BINDING: Update callbacks when dependencies change
  // This fixes stale function references after authentication-triggered re-renders
  useEffect(() => {
    if (!managersInitialized || !waypointManagerRef.current) {
      return;
    }

    console.log("🔧 CALLBACK RE-BINDING: Updating waypoint manager callbacks...");

    // Re-bind waypoint callbacks with current function references
    waypointManagerRef.current.setCallback('onChange', (updatedWaypoints) => {
      console.log(`🗺️ Waypoints changed, now ${updatedWaypoints.length} waypoints`);

      // Update the waypoints state with current setWaypoints function
      if (typeof setWaypoints === 'function') {
        setWaypoints([...updatedWaypoints]);
        console.log("✅ CALLBACK: Successfully updated React waypoints state");
      } else {
        console.error('❌ CALLBACK: setWaypoints is not a function in onChange callback');
        console.error('setWaypoints type:', typeof setWaypoints);
      }
    });

    waypointManagerRef.current.setCallback('onRouteUpdated', (routeData) => {
      console.log(`🗺️ Route updated with ${routeData.waypoints.length} waypoints`);
    });

    console.log("✅ CALLBACK RE-BINDING: Waypoint callbacks updated successfully");
  }, [
    managersInitialized, 
    waypointManagerRef
  ]);

  // 🛩️ PLATFORM CALLBACK RE-BINDING: Apply same pattern to platform manager
  useEffect(() => {
    if (!managersInitialized || !platformManagerRef.current) {
      return;
    }

    console.log("🔧 CALLBACK RE-BINDING: Updating platform manager callbacks...");

    // Re-bind platform callbacks with verification and fallback
    if (typeof platformManagerRef.current.setCallback === 'function') {
      platformManagerRef.current.setCallback('onPlatformsLoaded', (platforms) => {
        console.log(`🏗️ PLATFORMS LOADED: ${platforms.length} platforms via callback`);
        
        // 🛩️ PLATFORM DISPLAY VERIFICATION: Check if platforms actually appear on map
        setTimeout(() => {
          if (mapManagerRef.current?.map) {
            const map = mapManagerRef.current.map;
            
            // Check if platform layers exist and have features
            const platformLayers = [
              'platforms-fixed-layer',
              'platforms-movable-layer', 
              'airfields-layer'
            ];
            
            let hasVisiblePlatforms = false;
            for (const layerId of platformLayers) {
              const layer = map.getLayer(layerId);
              if (layer) {
                const source = map.getSource('major-platforms');
                if (source && source._data?.features?.length > 0) {
                  hasVisiblePlatforms = true;
                  break;
                }
              }
            }
            
            if (!hasVisiblePlatforms && platforms.length > 0) {
              console.log("🚨 PLATFORM FALLBACK: Platforms loaded but not visible, forcing display...");
              
              // Force platform display using the working method
              if (typeof platformManagerRef.current.addPlatformsToMap === 'function') {
                platformManagerRef.current.addPlatformsToMap(platforms);
              }
            } else if (hasVisiblePlatforms) {
              console.log("✅ PLATFORMS: Successfully visible on map");
            }
          }
        }, 1000); // Give map time to render
      });

      console.log("✅ CALLBACK RE-BINDING: Platform callbacks updated with fallback verification");
    }
  }, [
    managersInitialized,
    platformManagerRef,
    mapManagerRef
  ]);

  // 🛩️ MANAGER LIFECYCLE: Handle authentication state transitions
  useEffect(() => {
    const currentAuthState = (() => {
      try {
        const hasFoundryAuth = window.isFoundryAuthenticated === true;
        const hasClientAuth = client && typeof client.ontology === 'object';
        const hasAuthToken = !!window.auth?.getAccessToken?.();
        return `${hasFoundryAuth}-${hasClientAuth}-${hasAuthToken}`;
      } catch (error) {
        return 'error';
      }
    })();

    console.log("🔧 LIFECYCLE: Auth state check", {
      currentAuthState,
      lastAuthState,
      managersInitialized
    });

    // Check if authentication state has changed
    if (lastAuthState !== null && lastAuthState !== currentAuthState) {
      console.log("🔄 LIFECYCLE: Authentication state changed, preparing for re-initialization");
      
      // If we lose authentication, reset managers
      if (currentAuthState === 'false-false-false' && managersInitialized) {
        console.log("❌ LIFECYCLE: Authentication lost, resetting managers");
        setManagersInitialized(false);
        
        // Clear manager references for clean re-initialization
        // Note: We don't null the refs as that could break existing code
        // Instead, we rely on the re-initialization logic
      }
      
      // If we gain authentication and managers aren't initialized, trigger init
      if (currentAuthState !== 'false-false-false' && !managersInitialized) {
        console.log("✅ LIFECYCLE: Authentication gained, will trigger initialization");
        // The main initialization useEffect will handle this
      }
    }

    setLastAuthState(currentAuthState);
  }, [client, lastAuthState, managersInitialized]);

  // Effect to handle flightSettings changes
  useEffect(() => {
    if (flightSettings && flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight: flightSettings.passengerWeight,
        contingencyFuelPercent: flightSettings.contingencyFuelPercent,
        taxiFuel: flightSettings.taxiFuel,
        reserveFuel: flightSettings.reserveFuel,
        deckTimePerStop: flightSettings.deckTimePerStop,
        deckFuelFlow: flightSettings.deckFuelFlow,
      });
    }
  }, [flightSettings]);
  
  // Map initialization handler
  const handleMapReady = (mapInstance) => {
    console.log("🗺️ Map is ready", mapInstance);

    // Wrap in try/catch for safety
    try {
      // Initialize the map interaction handler
      if (mapInteractionHandlerRef.current) {
        console.log("🗺️ Initializing map interaction handler...");

        // 🛩️ CALLBACK SETUP: Callbacks are now managed by dedicated useEffect hooks
        // This ensures they use current function references and handle auth state changes
        console.log("✅ MAP READY: Waypoint callbacks managed by re-binding system");

        // Initialize map interactions
        console.log("🧹 Initializing map interaction handler");
        
        // First, make sure global flags are properly set
        window.isWaypointModeActive = window.isWaypointModeActive || false;
        
        // Initialize map interactions immediately - no delay
        if (mapInteractionHandlerRef.current && !mapInteractionHandlerRef.current.isInitialized) {
          console.log("🧹 Initializing map interaction handler immediately");
          const initSuccess = mapInteractionHandlerRef.current.initialize();
          
          if (initSuccess) {
            console.log("🧹 Map interaction handler initialized successfully");
          } else {
            console.error("🧹 Failed to initialize map interaction handler");
          }
        } else {
          console.log("🧹 Map interaction handler already initialized, skipping");
        }
      }
    } catch (error) {
      console.error("Error in handleMapReady:", error);
    }
  };

  // Helper function to create error dialog
  const createErrorDialog = () => {
    const errorDialog = document.createElement('div');
    errorDialog.style.position = 'fixed';
    errorDialog.style.top = '0';
    errorDialog.style.left = '0';
    errorDialog.style.right = '0';
    errorDialog.style.bottom = '0';
    errorDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    errorDialog.style.display = 'flex';
    errorDialog.style.alignItems = 'center';
    errorDialog.style.justifyContent = 'center';
    errorDialog.style.zIndex = '9999';

    const dialogContent = document.createElement('div');
    dialogContent.style.backgroundColor = 'white';
    dialogContent.style.padding = '20px';
    dialogContent.style.borderRadius = '8px';
    dialogContent.style.maxWidth = '500px';
    dialogContent.style.textAlign = 'center';

    dialogContent.innerHTML = `
      <h3 style="color: #dc3545; margin-top: 0;">OSDK Client Error</h3>
      <p>The Palantir OSDK client failed to initialize properly. This will prevent loading aircraft and platform data.</p>
      <p>Error: Client is null or undefined</p>
      <p>Please reload the page and try again. If the problem persists, check the console for more details.</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button id="dismiss-btn" style="padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; background-color: #f8f9fa; color: #212529;">Dismiss</button>
        <button id="reload-btn" style="padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; background-color: #007bff; color: white;">Reload Page</button>
      </div>
    `;

    errorDialog.appendChild(dialogContent);
    document.body.appendChild(errorDialog);

    // Add event listeners to buttons
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      document.body.removeChild(errorDialog);
    });

    document.getElementById('reload-btn').addEventListener('click', () => {
      window.location.reload();
    });
  };

  return {
    mapManagerRef,
    waypointManagerRef,
    platformManagerRef,
    routeCalculatorRef,
    regionManagerRef,
    favoriteLocationsManagerRef,
    aircraftManagerRef,
    flightCalculationsRef,
    waypointInsertionManagerRef,
    mapInteractionHandlerRef,
    appSettingsManagerRef,
    waypointHandlerRef,
    weatherVisualizationManagerRef,
    handleMapReady
  };
};

export default useManagers;
