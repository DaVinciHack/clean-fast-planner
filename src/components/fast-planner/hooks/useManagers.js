// src/components/fast-planner/hooks/useManagers.js

import { useRef, useEffect } from 'react';
import {
  MapManager,
  WaypointManager,
  PlatformManager,
  RouteCalculator,
  RegionManager,
  FavoriteLocationsManager,
  AircraftManager,
  MapInteractionHandler,
  AppSettingsManager
} from '../modules';
import FlightCalculations from '../modules/calculations/FlightCalculations';
import { createWaypointInsertionManager, setupWaypointCallbacks, patchWaypointManager } from '../modules/waypoints';
import * as WindCalc from '../modules/calculations/WindCalculations';
import WaypointHandler from '../modules/WaypointHandler';

/**
 * Custom hook to initialize and manage all manager instances
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
  waypoints,
  currentRegion,
  setAircraftLoading,
  setCurrentRegion,
  setRegions,
  setRegionLoading,
  waypointModeActive
}) => {
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

  // Initialize managers
  useEffect(() => {
    console.log("FastPlannerApp: Initializing managers...");

    // Check if OSDK client is available
    if (!client) {
      console.error("OSDK Client Error: client is null or undefined");
      createErrorDialog();
    }

    // Create MapManager
    if (!mapManagerRef.current) {
      console.log("FastPlannerApp: Creating MapManager instance");
      mapManagerRef.current = new MapManager();
      
      // EMERGENCY FIX: Update global reference
      window.mapManager = mapManagerRef.current;

      // Directly initialize the map
      setTimeout(() => {
        console.log("FastPlannerApp: Delayed map initialization");
        mapManagerRef.current.loadScripts()
          .then(() => {
            console.log("FastPlannerApp: Scripts loaded, initializing map...");
            return mapManagerRef.current.initializeMap('fast-planner-map');
          })
          .then((mapInstance) => {
            console.log("FastPlannerApp: Map initialization complete");
            if (handleMapReady) {
              handleMapReady(mapInstance);
            }

            // Once the map is ready, load aircraft
            if (aircraftManagerRef.current && client) {
              console.log("Loading aircraft after map initialization");
              aircraftManagerRef.current.loadAircraftFromOSDK(client)
                .then(() => {
                  console.log("Aircraft loaded successfully");
                  // Force update to refresh the UI with aircraft data
                  setForceUpdate(prev => prev + 1);
                })
                .catch(error => {
                  console.error(`Error loading aircraft: ${error}`);
                  setAircraftLoading(false);
                });
            }
          })
          .catch(error => {
            console.error("FastPlannerApp: Error initializing map:", error);
          });
      }, 500);
    }

    // Create FavoriteLocationsManager
    if (!favoriteLocationsManagerRef.current) {
      console.log("FastPlannerApp: Creating FavoriteLocationsManager instance");
      favoriteLocationsManagerRef.current = new FavoriteLocationsManager();

      // Set up callback for when favorites change
      favoriteLocationsManagerRef.current.setCallback('onChange', (favorites) => {
        if (currentRegion) {
          console.log(`Favorites changed, updating UI for region ${currentRegion.id}`);
          const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id);
          setFavoriteLocations(regionFavorites);
        }
      });
    }

    // Create PlatformManager
    if (!platformManagerRef.current && mapManagerRef.current) {
      console.log("FastPlannerApp: Creating PlatformManager instance");
      platformManagerRef.current = new PlatformManager(mapManagerRef.current);
    }

    // Create RegionManager
    if (!regionManagerRef.current && mapManagerRef.current && platformManagerRef.current) {
      console.log("FastPlannerApp: Creating RegionManager instance");
      regionManagerRef.current = new RegionManager(mapManagerRef.current, platformManagerRef.current);

      // Set up region manager callbacks
      regionManagerRef.current.setCallback('onRegionLoaded', (data) => {
        console.log(`Region loaded: ${data.region.name}`);
        setRegionLoading(false);
      });

      regionManagerRef.current.setCallback('onRegionChanged', (region) => {
        console.log(`Region changed to: ${region.name}`);
        
        // Check if setCurrentRegion is a function before calling it
        if (typeof setCurrentRegion === 'function') {
          setCurrentRegion(region);
        } else {
          console.warn('setCurrentRegion is not a function in onRegionChanged callback');
          // As a workaround, store the current region in a global variable
          window.currentRegion = region;
        }

        // IMPORTANT: Load favorites for this region
        if (favoriteLocationsManagerRef.current && region) {
          console.log(`Loading favorites for region ${region.id}`);
          const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(region.id);
          console.log(`Found ${regionFavorites.length} favorites for region ${region.id}:`, regionFavorites);
          if (typeof setFavoriteLocations === 'function') {
            setFavoriteLocations(regionFavorites);
          } else {
            console.warn('setFavoriteLocations is not a function in onRegionChanged callback');
          }
        }
      });

      regionManagerRef.current.setCallback('onError', (error) => {
        console.error(`Region manager error: ${error}`);
        setRegionLoading(false);
      });
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

      // Set up aircraft manager callbacks
      aircraftManagerRef.current.setCallback('onAircraftLoaded', (aircraftList) => {
        console.log(`Loaded ${aircraftList.length} total aircraft`);

        // After loading all aircraft, filter by region if we have a current region
        if (currentRegion) {
          aircraftManagerRef.current.filterAircraft(currentRegion.id);
        }
      });

      aircraftManagerRef.current.setCallback('onAircraftFiltered', (filteredAircraft, type) => {
        console.log(`Filtered to ${filteredAircraft.length} aircraft of type ${type || 'all'}`);
        setAircraftLoading(false);
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
                
                // Also patch the WaypointManager on successful retry
                // Commenting out patch to isolate duplicate waypoint addition issue
                // patchWaypointManager(waypointManagerRef.current);
                console.log("[useManagers] RETRY BLOCK: Skipping patchWaypointManager for now to test duplicate add issue.");
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
          
          // Patch the WaypointManager to handle waypoints vs stops
          // Commenting out patch to isolate duplicate waypoint addition issue
          // patchWaypointManager(waypointManagerRef.current); 
          console.log("[useManagers] Skipping patchWaypointManager for now to test duplicate add issue.");
        }
        
      } catch (error) {
        console.error("Error creating WaypointInsertionManager:", error);
      }
    }

    // Initialize the AppSettingsManager
    if (!appSettingsManagerRef.current) {
      console.log("FastPlannerApp: Creating AppSettingsManager instance");
      appSettingsManagerRef.current = new AppSettingsManager();

      // Set callbacks for settings changes
      appSettingsManagerRef.current.setCallback('onRegionChange', (regionId) => {
        console.log(`AppSettingsManager: Region changed to ${regionId}`);
      });

      appSettingsManagerRef.current.setCallback('onAircraftChange', (aircraft) => {
        console.log(`AppSettingsManager: Aircraft changed to ${aircraft.type} ${aircraft.registration}`);
      });

      appSettingsManagerRef.current.setCallback('onFlightSettingsChange', (settings) => {
        console.log('AppSettingsManager: Flight settings changed');
        setFlightSettings(settings);
      });

      appSettingsManagerRef.current.setCallback('onUISettingsChange', (uiSettings) => {
        console.log('AppSettingsManager: UI settings changed');
      });

      // Load any saved settings
      const savedSettings = appSettingsManagerRef.current.getAllSettings();

      // Apply flight settings
      const flightSettings = savedSettings.flightSettings;
      setFlightSettings(flightSettings); // Set the entire flightSettings object from saved settings
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
        // The window._processingMapClick flag is managed by MapInteractionHandler.handleMapClick
        // No need to check or set it here again.
        try {
          // Create a local copy of the data to avoid reference issues
          const clickData = {...data};
          
          await addWaypoint(clickData); // addWaypoint is from FastPlannerApp props
          
        } catch (error) {
          console.error('Error processing map click in useManagers:', error);
        }
      });

      mapInteractionHandlerRef.current.setCallback('onPlatformClick', async (data) => {
        console.log('🏢 Platform click callback received in useManagers', data);
        // The window._processingMapClick flag is managed by MapInteractionHandler.handleMapClick
        // No need to check or set it here again.
        try {
          // Create a local copy of the data to avoid reference issues
          const clickData = {...data};

          await addWaypoint(clickData); // addWaypoint is from FastPlannerApp props

        } catch (error) {
          console.error('Error processing platform click in useManagers:', error);
        }
      });

      mapInteractionHandlerRef.current.setCallback('onRouteClick', async (data) => {
        console.log('🛣️ Route click callback received in useManagers', data);
        // The window._processingMapClick flag is managed by MapInteractionHandler.handleMapClick
        // No need to check or set it here again.
        try {
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
                  console.log(`🛣️ Found nearby waypoint for route click: ${nearestWp.name} (${nearestWp.distance.toFixed(2)}nm away)`);
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
                  console.log(`🛣️ Found nearby platform for route click: ${nearestPlatform.name} (${nearestPlatform.distance.toFixed(2)}nm away)`);
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
            console.log('🛣️ Adding navigation waypoint at route click:', clickData.nearestWaypoint.name);
            
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
            console.log('🛣️ Adding rig at route click:', clickData.nearestRig.name);
            
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
            console.log(`🛣️ Adding ${isWaypointMode ? 'waypoint' : 'stop'} at route click`);
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

          console.log('🛣️ Waypoints updated. Centralized useEffect will recalculate fuel.');
          
          // Add a small delay to prevent rapid-fire clicks
          await new Promise(resolve => setTimeout(resolve, 300)); // Keep existing delay if needed for other reasons
          
        } catch (error) {
          console.error('Error processing route click in useManagers:', error);
        }
        // Flag is cleared by MapInteractionHandler.handleMapClick's finally block
      });

      mapInteractionHandlerRef.current.setCallback('onError', (error) => {
        console.error(`MapInteractionHandler error: ${error}`);
      });
    }

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
      console.log("Settings changed event received. Centralized useEffect should handle updates.");
    };

    // Add event listeners
    window.addEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    window.addEventListener('settings-changed', handleSettingsChanged);

    // Force a rerender after initializing all managers
    setForceUpdate(prev => prev + 1);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('save-aircraft-settings', handleSaveAircraftSettings);
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, [client, currentRegion, flightSettings]);

  // Map initialization handler
  const handleMapReady = (mapInstance) => {
    console.log("🗺️ Map is ready", mapInstance);

    // When map is ready, initialize other components that depend on the map
    if (regionManagerRef.current) {
      console.log("🗺️ Initializing regions...");
      setRegionLoading(true);

      // Get available regions
      setRegions(regionManagerRef.current.getRegions());

      // Get the initial region from settings if available
      const initialRegion = appSettingsManagerRef.current ?
        appSettingsManagerRef.current.getRegion() : 'gulf-of-mexico';

      console.log(`🗺️ Initializing with region: ${initialRegion}`);
      // CRITICAL FIX: Make sure we're using the setRegion method, not setCurrentRegion
      regionManagerRef.current.setRegion(initialRegion);
      
      // Initialize OSDK data loading after region is set
      if (client && platformManagerRef.current && initialRegion) {
        console.log(`🗺️ Loading OSDK data for region: ${initialRegion}`);
        
        // Get the region object
        const regionObj = regionManagerRef.current.getRegionById(initialRegion);
        if (regionObj) {
          // Load platforms
          platformManagerRef.current.loadPlatformsFromFoundry(client, regionObj.osdkRegion || regionObj.name)
            .then(() => {
              console.log(`🗺️ Platforms loaded successfully for ${regionObj.name}`);
              // Also load OSDK waypoints if needed
              if (typeof platformManagerRef.current.loadOsdkWaypointsFromFoundry === 'function') {
                const regionQueryTerm = regionObj.osdkRegion || regionObj.name;
                platformManagerRef.current.loadOsdkWaypointsFromFoundry(client, regionQueryTerm)
                  .then(() => {
                    console.log(`🗺️ OSDK waypoints loaded for ${regionQueryTerm}`);
                  })
                  .catch(error => {
                    console.error(`Error loading OSDK waypoints: ${error.message}`);
                  });
              }
            })
            .catch(error => {
              console.error(`Error loading platforms: ${error.message}`);
            });
            
          // Load aircraft
          if (aircraftManagerRef.current) {
            aircraftManagerRef.current.loadAircraftFromOSDK(client)
              .then(() => {
                console.log(`🗺️ Aircraft loaded successfully`);
                // Filter by region
                aircraftManagerRef.current.filterAircraft(regionObj.id);
              })
              .catch(error => {
                console.error(`Error loading aircraft: ${error.message}`);
              });
          }
        }
      }
    }

    // Initialize the map interaction handler
    if (mapInteractionHandlerRef.current) {
      console.log("🗺️ Initializing map interaction handler...");

      // Make sure the waypointManager is properly connected
      if (waypointManagerRef.current) {
        // Set up the waypoint manager's callbacks
        waypointManagerRef.current.setCallback('onChange', (updatedWaypoints) => {
          console.log(`🗺️ Waypoints changed, now ${updatedWaypoints.length} waypoints`);

          // Update the waypoints state
          setWaypoints([...updatedWaypoints]);
        });

        waypointManagerRef.current.setCallback('onRouteUpdated', (routeData) => {
          console.log(`🗺️ Route updated with ${routeData.waypoints.length} waypoints`);
        });
      }

      // CRITICAL FIX: Force re-initialization of map handler to apply our fixes - with proper safety checks
      console.log("🧹 Carefully initializing map interaction handler to prevent duplicates");
      
      // First, make sure global flags are properly set
      window.isWaypointModeActive = waypointModeActive;
      
      // Clean up any existing handlers before initializing new ones
      const map = mapManagerRef.current.getMap();
      if (map && map._listeners && map._listeners.click) {
        console.log(`🧹 Removing ${map._listeners.click.length} existing click handlers before initializing`);
        map.off('click');
      }
      
      // Then, add a small delay to ensure the map is fully loaded
      setTimeout(() => {
        // Initialize map interactions carefully
        if (mapInteractionHandlerRef.current) {
          // Only initialize if we haven't already
          if (!mapInteractionHandlerRef.current.isInitialized) {
            const initSuccess = mapInteractionHandlerRef.current.initialize();
            
            if (initSuccess) {
              console.log("🧹 Map interaction handler initialized successfully");
            } else {
              console.error("🧹 Failed to initialize map interaction handler, will retry once");
              
              // Try again after a longer delay
              setTimeout(() => {
                if (mapInteractionHandlerRef.current && !mapInteractionHandlerRef.current.isInitialized) {
                  console.log("🧹 Second attempt at initializing map handler");
                  mapInteractionHandlerRef.current.initialize();
                }
              }, 1000);
            }
          } else {
            console.log("🧹 Map interaction handler already initialized, skipping");
          }
        }
      }, 500);
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
    handleMapReady
  };
};

export default useManagers;
