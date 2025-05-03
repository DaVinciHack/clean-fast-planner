import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Initialize loading indicator effect
const initializeLoadingIndicator = () => {
  if (window.LoadingIndicator && window.LoadingIndicator.initializeRouteStatsLoader) {
    setTimeout(() => {
      window.LoadingIndicator.initializeRouteStatsLoader();
    }, 1000); // Delay to ensure the DOM is ready
  }
};

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  RouteStatsCard
} from './components';

// Import all manager modules
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
} from './modules';
import FlightCalculations from './modules/calculations/FlightCalculations';

/**
 * FastPlannerApp Component
 * 
 * A simplified version that directly replicates ModularFastPlannerComponent 
 * functionality without context providers for now.
 */
const FastPlannerApp = () => {
  const { isAuthenticated, userDetails, userName, login } = useAuth();
  
  // Core modules refs
  const mapManagerRef = useRef(null);
  const waypointManagerRef = useRef(null);
  const platformManagerRef = useRef(null);
  const routeCalculatorRef = useRef(null);
  const regionManagerRef = useRef(null);
  const favoriteLocationsManagerRef = useRef(null);
  const aircraftManagerRef = useRef(null); 
  const flightCalculationsRef = useRef(null);
  const mapInteractionHandlerRef = useRef(null);
  const appSettingsManagerRef = useRef(null);
  
  // Initialize loading indicator on first render
  useEffect(() => {
    initializeLoadingIndicator();
  }, []);
  
  // UI state
  const [forceUpdate, setForceUpdate] = useState(0);
  const [routeInput, setRouteInput] = useState('');
  const [airportData, setAirportData] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [platformsVisible, setPlatformsVisible] = useState(true);
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [rigsLoading, setRigsLoading] = useState(false);
  const [rigsError, setRigsError] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  
  // Region state
  const [regions, setRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  
  // Aircraft and route state
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [payloadWeight, setPayloadWeight] = useState(2000);
  const [reserveFuel, setReserveFuel] = useState(600);
  const [routeStats, setRouteStats] = useState(null);
  
  // Flight calculation settings
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220,
    contingencyFuelPercent: 10,
    taxiFuel: 50,
    reserveFuel: 600,
    deckTimePerStop: 5,
    deckFuelFlow: 400,
  });
  
  // Compatible with ModularFastPlannerComponent
  const [deckTimePerStop, setDeckTimePerStop] = useState(5); 
  const [deckFuelPerStop, setDeckFuelPerStop] = useState(100);
  const [deckFuelFlow, setDeckFuelFlow] = useState(400);
  const [passengerWeight, setPassengerWeight] = useState(220);
  const [cargoWeight, setCargoWeight] = useState(0);
  const [taxiFuel, setTaxiFuel] = useState(50);
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10);
  const [reserveMethod, setReserveMethod] = useState('fixed');
  
  // Helper function to update flight settings
  const updateFlightSetting = (settingName, value) => {
    // Update the individual setting state
    switch (settingName) {
      case 'passengerWeight':
        setPassengerWeight(value);
        break;
      case 'deckTimePerStop':
        setDeckTimePerStop(value);
        break;
      case 'deckFuelFlow':
        setDeckFuelFlow(value);
        break;
      case 'deckFuelPerStop':
        setDeckFuelPerStop(value);
        break;
      case 'taxiFuel':
        setTaxiFuel(value);
        break;
      case 'contingencyFuelPercent':
        setContingencyFuelPercent(value);
        break;
      case 'cargoWeight':
        setCargoWeight(value);
        break;
      case 'reserveMethod':
        setReserveMethod(value);
        break;
      default:
        console.warn(`Unknown flight setting: ${settingName}`);
    }
    
    // Update the flightSettings object
    const updatedSettings = {
      ...flightSettings,
      [settingName]: value
    };
    setFlightSettings(updatedSettings);
    
    // Update Flight Calculations module
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig(updatedSettings);
    }
    
    // Save to AppSettingsManager
    if (appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateFlightSettings({
        [settingName]: value
      });
    }
    
    // Recalculate route if we have an aircraft and waypoints
    if (selectedAircraft && waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
      // Extract coordinates from waypoints
      const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
      
      // Calculate route statistics using the correct method
      routeCalculatorRef.current.calculateRouteStats(coordinates, {
        aircraftType: selectedAircraft.modelType || 's92',
        payloadWeight: cargoWeight || 0,
        reserveFuel: updatedSettings.reserveFuel || reserveFuel
      });
    }
  };

  // Initialize managers
  useEffect(() => {
    console.log("FastPlannerApp: Initializing managers...");
    
    // Create managers if they don't exist - order matters!
    // 1. First create the map manager
    if (!mapManagerRef.current) {
      console.log("FastPlannerApp: Creating MapManager instance");
      mapManagerRef.current = new MapManager();
      
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
                  console.error("Error loading aircraft:", error);
                });
            }
          })
          .catch(error => {
            console.error("FastPlannerApp: Error initializing map:", error);
          });
      }, 500);
    }
    
    // Create favoriteLocationsManager first so it's available to other components
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
    
    // 2. Create platform manager before region manager
    if (!platformManagerRef.current && mapManagerRef.current) {
      console.log("FastPlannerApp: Creating PlatformManager instance");
      platformManagerRef.current = new PlatformManager(mapManagerRef.current);
    }
    
    // 3. Create region manager after platform manager
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
        setCurrentRegion(region);
        
        // IMPORTANT: Load favorites for this region
        if (favoriteLocationsManagerRef.current && region) {
          console.log(`Loading favorites for region ${region.id}`);
          const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(region.id);
          console.log(`Found ${regionFavorites.length} favorites for region ${region.id}:`, regionFavorites);
          setFavoriteLocations(regionFavorites);
        }
      });
      
      regionManagerRef.current.setCallback('onError', (error) => {
        console.error(`Region manager error: ${error}`);
        setRegionLoading(false);
      });
    }
    
    if (!waypointManagerRef.current) {
      console.log("FastPlannerApp: Creating WaypointManager instance");
      waypointManagerRef.current = new WaypointManager(mapManagerRef.current);
    }
    
    // Add platformManager to waypointManager if both exist
    if (waypointManagerRef.current && platformManagerRef.current) {
      waypointManagerRef.current.setPlatformManager(platformManagerRef.current);
    }
    
    // Remove this duplicate initialization
    if (!routeCalculatorRef.current) {
      console.log("FastPlannerApp: Creating RouteCalculator instance");
      routeCalculatorRef.current = new RouteCalculator();
      
      // Set up route calculator callbacks
      routeCalculatorRef.current.setCallback('onCalculationComplete', (stats) => {
        setRouteStats(stats);
      });
    }
    
    if (!aircraftManagerRef.current) {
      console.log("FastPlannerApp: Creating AircraftManager instance");
      aircraftManagerRef.current = new AircraftManager();
      
      // Set up aircraft manager callbacks
      aircraftManagerRef.current.setCallback('onAircraftLoaded', (aircraftList) => {
        console.log(`Loaded ${aircraftList.length} total aircraft`);
        setAircraftList(aircraftList);
        
        // After loading all aircraft, filter by region if we have a current region
        if (currentRegion) {
          aircraftManagerRef.current.filterAircraft(currentRegion.id);
        }
      });
      
      aircraftManagerRef.current.setCallback('onAircraftFiltered', (filteredAircraft, type) => {
        console.log(`Filtered to ${filteredAircraft.length} aircraft of type ${type || 'all'}`);
        
        if (type) {
          // Update the aircraftsByType with the filtered aircraft for this type
          setAircraftsByType(prev => ({
            ...prev,
            [type]: filteredAircraft
          }));
        } else {
          // If no type specified, organize all aircraft by type
          const byType = {};
          const availableTypes = [];
          
          // Create empty buckets for each type
          filteredAircraft.forEach(aircraft => {
            const type = aircraft.modelType || 'Unknown';
            if (!byType[type]) {
              byType[type] = [];
              availableTypes.push(type);
            }
            byType[type].push(aircraft);
          });
          
          console.log(`Available aircraft types: ${availableTypes.join(', ')}`);
          setAircraftTypes(availableTypes);
          setAircraftsByType(byType);
        }
        
        setAircraftLoading(false);
      });
    }
    
    if (!flightCalculationsRef.current) {
      console.log("FastPlannerApp: Creating FlightCalculations instance");
      flightCalculationsRef.current = new FlightCalculations();
      
      // Update with current settings
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        contingencyFuelPercent,
        taxiFuel,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
      });
    }
    
    // Initialize the AppSettingsManager 
    if (!appSettingsManagerRef.current) {
      console.log("FastPlannerApp: Creating AppSettingsManager instance");
      appSettingsManagerRef.current = new AppSettingsManager();
      
      // Set callbacks for settings changes
      appSettingsManagerRef.current.setCallback('onRegionChange', (regionId) => {
        console.log(`AppSettingsManager: Region changed to ${regionId}`);
        // We don't automatically change the region here to avoid infinite loops
        // The region is changed via the changeRegion function which also updates the setting
      });
      
      appSettingsManagerRef.current.setCallback('onAircraftChange', (aircraft) => {
        console.log(`AppSettingsManager: Aircraft changed to ${aircraft.type} ${aircraft.registration}`);
        // Update aircraft selection if it doesn't match current selection
        if (aircraft.type !== aircraftType) {
          setAircraftType(aircraft.type);
        }
        if (aircraft.registration !== aircraftRegistration) {
          setAircraftRegistration(aircraft.registration);
        }
      });
      
      appSettingsManagerRef.current.setCallback('onFlightSettingsChange', (settings) => {
        console.log('AppSettingsManager: Flight settings changed');
        setFlightSettings(settings);
        
        // Update individual settings
        setPassengerWeight(settings.passengerWeight);
        setContingencyFuelPercent(settings.contingencyFuelPercent);
        setTaxiFuel(settings.taxiFuel);
        setReserveFuel(settings.reserveFuel);
        setDeckTimePerStop(settings.deckTimePerStop);
        setDeckFuelFlow(settings.deckFuelFlow);
      });
      
      appSettingsManagerRef.current.setCallback('onUISettingsChange', (uiSettings) => {
        console.log('AppSettingsManager: UI settings changed');
        // Update UI visibility settings
        if (leftPanelVisible !== uiSettings.leftPanelVisible) {
          setLeftPanelVisible(uiSettings.leftPanelVisible);
        }
        if (rightPanelVisible !== uiSettings.rightPanelVisible) {
          setRightPanelVisible(uiSettings.rightPanelVisible);
        }
        if (platformsVisible !== uiSettings.platformsVisible) {
          setPlatformsVisible(uiSettings.platformsVisible);
        }
      });
      
      // Load any saved settings
      const savedSettings = appSettingsManagerRef.current.getAllSettings();
      
      // Apply flight settings
      const flightSettings = savedSettings.flightSettings;
      setPassengerWeight(flightSettings.passengerWeight);
      setContingencyFuelPercent(flightSettings.contingencyFuelPercent);
      setTaxiFuel(flightSettings.taxiFuel);
      setReserveFuel(flightSettings.reserveFuel || 600); // Ensure we have a default value
      setDeckTimePerStop(flightSettings.deckTimePerStop);
      setDeckFuelFlow(flightSettings.deckFuelFlow);
      
      // Apply UI settings
      const uiSettings = savedSettings.uiSettings;
      setLeftPanelVisible(uiSettings.leftPanelVisible);
      setRightPanelVisible(uiSettings.rightPanelVisible);
      setPlatformsVisible(uiSettings.platformsVisible);
    }
    
    // Create the map interaction handler last, after other managers are initialized
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
      
      // Set up callbacks
      mapInteractionHandlerRef.current.setCallback('onLeftPanelOpen', () => {
        if (!leftPanelVisible) {
          console.log('Opening left panel due to map click');
          setLeftPanelVisible(true);
        }
      });
      
      mapInteractionHandlerRef.current.setCallback('onMapClick', (data) => {
        console.log('Map click callback received', data);
        addWaypoint(data); // Pass the data object with lngLat property
      });
      
      mapInteractionHandlerRef.current.setCallback('onPlatformClick', (data) => {
        console.log('Platform click callback received', data);
        addWaypoint(data); // Pass the data object with coordinates and name
      });
      
      mapInteractionHandlerRef.current.setCallback('onRouteClick', (data) => {
        console.log('Route click callback received', data);
        
        // If we have a nearest rig and it's close
        if (data.nearestRig && data.nearestRig.distance < 1) {
          // Add the rig instead of the clicked point
          waypointManagerRef.current.addWaypointAtIndex(
            data.nearestRig.coordinates, 
            data.nearestRig.name, 
            data.insertIndex
          );
        } else {
          // Add the clicked point
          waypointManagerRef.current.addWaypointAtIndex(
            [data.lngLat.lng, data.lngLat.lat], 
            null, 
            data.insertIndex
          );
        }
        
        // Update the waypoints state
        setWaypoints([...waypointManagerRef.current.getWaypoints()]);
      });
      
      mapInteractionHandlerRef.current.setCallback('onError', (error) => {
        console.error(`MapInteractionHandler error: ${error}`);
      });
      
      // We'll initialize it in the handleMapReady function when the map is ready
    }
    
    // ADD EVENT LISTENER FOR SAVING AIRCRAFT SETTINGS
    // This handles the custom event from the SettingsCard to save aircraft-specific settings
    const handleSaveAircraftSettings = (event) => {
      const { key, settings } = event.detail;
      console.log(`Saving settings for ${key}:`, settings);
      
      try {
        // Save the settings to localStorage
        localStorage.setItem(`fastPlanner_settings_${key}`, JSON.stringify(settings));
        console.log(`Successfully saved settings for ${key}`);
        
        // If this is also the current aircraft, update the active settings
        if (selectedAircraft && key === `aircraft_${selectedAircraft.registration}`) {
          console.log('Updating current flight settings with saved aircraft settings');
          
          // Update all the settings
          if (settings.passengerWeight !== undefined) setPassengerWeight(settings.passengerWeight);
          if (settings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(settings.contingencyFuelPercent);
          if (settings.taxiFuel !== undefined) setTaxiFuel(settings.taxiFuel);
          if (settings.reserveFuel !== undefined) setReserveFuel(settings.reserveFuel);
          if (settings.deckTimePerStop !== undefined) setDeckTimePerStop(settings.deckTimePerStop);
          if (settings.deckFuelFlow !== undefined) setDeckFuelFlow(settings.deckFuelFlow);
          if (settings.deckFuelPerStop !== undefined) setDeckFuelPerStop(settings.deckFuelPerStop);
          if (settings.cargoWeight !== undefined) setCargoWeight(settings.cargoWeight);
          
          // Update AppSettingsManager if it exists
          if (appSettingsManagerRef.current) {
            appSettingsManagerRef.current.updateFlightSettings({
              passengerWeight: settings.passengerWeight,
              contingencyFuelPercent: settings.contingencyFuelPercent,
              taxiFuel: settings.taxiFuel,
              reserveFuel: settings.reserveFuel,
              deckTimePerStop: settings.deckTimePerStop,
              deckFuelFlow: settings.deckFuelFlow
            });
          }
          
          // Recalculate route if needed
          if (selectedAircraft && waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
            // Extract coordinates from waypoints
            const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
            
            // Calculate route statistics using the correct method
            routeCalculatorRef.current.calculateRouteStats(coordinates, {
              aircraftType: selectedAircraft.modelType || 's92',
              payloadWeight: settings.cargoWeight || cargoWeight || 0,
              reserveFuel: settings.reserveFuel || reserveFuel
            });
          }
          
          // Force UI update
          setForceUpdate(prev => prev + 1);
        }
      } catch (error) {
        console.error(`Error saving settings for ${key}:`, error);
      }
    };
    
    // Add event listener for settings-changed to force UI update
    const handleSettingsChanged = () => {
      console.log("Settings changed event received, forcing UI update");
      setForceUpdate(prev => prev + 1);
      
      // Recalculate route if needed
      if (selectedAircraft && waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
        
        // Calculate route statistics using the correct method
        routeCalculatorRef.current.calculateRouteStats(coordinates, {
          aircraftType: selectedAircraft.modelType || 's92',
          payloadWeight: cargoWeight || 0,
          reserveFuel: reserveFuel
        });
      }
    };
    
    // Add event listener for aircraft settings
    window.addEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    window.addEventListener('settings-changed', handleSettingsChanged);
    
    // Force a rerender after initializing all managers
    setForceUpdate(prev => prev + 1);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('save-aircraft-settings', handleSaveAircraftSettings);
      window.removeEventListener('settings-changed', handleSettingsChanged);
    };
  }, [passengerWeight, contingencyFuelPercent, taxiFuel, reserveFuel, deckTimePerStop, deckFuelFlow, waypoints.length, selectedAircraft]);

  // Map initialization handler
  const handleMapReady = (mapInstance) => {
    console.log("Map is ready", mapInstance);
    
    // When map is ready, initialize other components that depend on the map
    if (regionManagerRef.current) {
      console.log("Initializing regions...");
      setRegionLoading(true);
      
      // Get available regions
      setRegions(regionManagerRef.current.getRegions());
      
      // Get the initial region from settings if available
      const initialRegion = appSettingsManagerRef.current ? 
        appSettingsManagerRef.current.getRegion() : 'gulf-of-mexico';
      
      console.log(`Initializing with region: ${initialRegion}`);
      regionManagerRef.current.initialize(initialRegion);
    }
    
    // Initialize the map interaction handler
    if (mapInteractionHandlerRef.current) {
      console.log("Initializing map interaction handler...");
      
      // Make sure the waypointManager is properly connected
      if (waypointManagerRef.current) {
        // Set up the waypoint manager's callbacks
        waypointManagerRef.current.setCallback('onChange', (updatedWaypoints) => {
          console.log(`Waypoints changed, now ${updatedWaypoints.length} waypoints`);
          setWaypoints([...updatedWaypoints]);
        });
        
        waypointManagerRef.current.setCallback('onRouteUpdated', (routeData) => {
          console.log(`Route updated with ${routeData.waypoints.length} waypoints`);
          
          // Recalculate route stats if we have an aircraft and at least 2 waypoints
          if (selectedAircraft && routeData.waypoints.length >= 2) {
            // Extract coordinates from waypoints
            const coordinates = routeData.waypoints.map(wp => wp.coords);
            
            // Calculate route statistics using the correct method
            routeCalculatorRef.current.calculateRouteStats(coordinates, {
              aircraftType: selectedAircraft.modelType || 's92',
              payloadWeight: cargoWeight || 0,
              reserveFuel: reserveFuel
            });
          }
        });
      }
      
      // Initialize map interactions
      const initSuccess = mapInteractionHandlerRef.current.initialize();
      if (!initSuccess) {
        console.error("Failed to initialize map interaction handler");
      } else {
        console.log("Map interaction handler initialized successfully");
      }
    }
  };
  
  // Panel visibility handlers
  const toggleLeftPanel = () => {
    const newState = !leftPanelVisible;
    setLeftPanelVisible(newState);
    
    // Save to settings
    if (appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        leftPanelVisible: newState
      });
    }
    
    // Trigger animation by adding and removing classes
    const panel = document.querySelector('.route-editor-panel');
    if (panel) {
      if (newState) {
        // Panel becoming visible - slide in
        panel.style.animation = 'slideInFromLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      } else {
        // Panel becoming hidden - slide out
        panel.style.animation = 'slideOutToLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      }
    }
  };
  
  const toggleRightPanel = () => {
    const newState = !rightPanelVisible;
    setRightPanelVisible(newState);
    
    // Save to settings
    if (appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        rightPanelVisible: newState
      });
    }
    
    // Trigger animation by adding and removing classes
    const panel = document.querySelector('.info-panel');
    if (panel) {
      if (newState) {
        // Panel becoming visible - slide in
        panel.style.animation = 'slideInFromRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      } else {
        // Panel becoming hidden - slide out
        panel.style.animation = 'slideOutToRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      }
    }
  };
  
  const handleRouteInputChange = (value) => {
    setRouteInput(value);
  };
  
  // Basic handlers
  const addWaypoint = (waypointData) => {
    if (waypointManagerRef.current) {
      // Handle different input formats
      let coords, name;
      
      console.log('FastPlannerApp: Adding waypoint with data:', waypointData);
      
      if (Array.isArray(waypointData)) {
        // Direct coordinates array: [lng, lat]
        coords = waypointData;
        name = null;
      } else if (typeof waypointData === 'string') {
        // It's just a name - try to find a location with that name
        // This is used when adding a waypoint by typing the name in the input field
        console.log(`Looking for location with name: ${waypointData}`);
        coords = null;
        name = waypointData;
      } else if (waypointData && typeof waypointData === 'object') {
        // Check if we have a nearest rig within range
        if (waypointData.nearestRig && waypointData.nearestRig.distance <= 2) {
          console.log(`FastPlannerApp: Snapping to nearest rig: ${waypointData.nearestRig.name} (${waypointData.nearestRig.distance.toFixed(2)} nm away)`);
          
          // Get coordinates, checking different possible formats
          if (waypointData.nearestRig.coordinates) {
            coords = waypointData.nearestRig.coordinates;
          } else if (waypointData.nearestRig.coords) {
            coords = waypointData.nearestRig.coords;
          } else if (waypointData.nearestRig.lng !== undefined && waypointData.nearestRig.lat !== undefined) {
            coords = [waypointData.nearestRig.lng, waypointData.nearestRig.lat];
          } else {
            console.error('Invalid nearestRig coordinates format:', waypointData.nearestRig);
            // Fall back to the clicked point
            coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
          }
          
          name = waypointData.nearestRig.name;
        }
        // Check if coordinates property exists (from favorites or other sources)
        else if (waypointData.coordinates) {
          coords = waypointData.coordinates;
          name = waypointData.name;
        } else if (waypointData.lngLat) {
          // From map click via MapInteractionHandler
          coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
          name = null;
        } else {
          console.error('Invalid waypoint data format:', waypointData);
          return;
        }
      } else {
        console.error('Invalid waypoint data:', waypointData);
        return;
      }
      
      // If we only have a name, try to look up coordinates (this could be enhanced)
      if (!coords && name) {
        // TODO: Implement location search by name
        console.log(`We need to search for location with name: ${name}`);
      }
      
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        console.error('Invalid coordinates format:', coords);
        return;
      }
      
      console.log(`FastPlannerApp: Adding waypoint at [${coords}] with name "${name || 'Unnamed'}"`);
      waypointManagerRef.current.addWaypoint(coords, name);
      setWaypoints([...waypointManagerRef.current.getWaypoints()]);
      
      // Recalculate route stats if we have an aircraft and at least 2 waypoints
      if (selectedAircraft && waypointManagerRef.current.getWaypoints().length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
        
        // Calculate route statistics using the correct method
        routeCalculatorRef.current.calculateRouteStats(coordinates, {
          aircraftType: selectedAircraft.modelType || 's92',
          payloadWeight: cargoWeight || 0,
          reserveFuel: reserveFuel
        });
      }
    }
  };
  
  const removeWaypoint = (waypointIdOrIndex) => {
    if (waypointManagerRef.current) {
      const waypoints = waypointManagerRef.current.getWaypoints();
      let id, index;
      
      // Check if we received an ID or an index
      if (typeof waypointIdOrIndex === 'string') {
        // It's an ID
        id = waypointIdOrIndex;
        index = waypoints.findIndex(wp => wp.id === id);
      } else if (typeof waypointIdOrIndex === 'number') {
        // It's an index
        index = waypointIdOrIndex;
        id = waypoints[index]?.id;
      } else {
        console.error('Invalid waypoint identifier:', waypointIdOrIndex);
        return;
      }
      
      console.log(`FastPlannerApp: Removing waypoint with ID ${id} at index ${index}`);
      
      // Only proceed if we have a valid ID and index
      if (id && index !== -1) {
        waypointManagerRef.current.removeWaypoint(id, index);
        setWaypoints([...waypointManagerRef.current.getWaypoints()]);
        
        // Recalculate route stats if we have an aircraft and at least 2 waypoints
        if (selectedAircraft && waypointManagerRef.current.getWaypoints().length >= 2) {
          // Extract coordinates from waypoints
          const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
          
          // Calculate route statistics using the correct method
          routeCalculatorRef.current.calculateRouteStats(coordinates, {
            aircraftType: selectedAircraft.modelType || 's92',
            payloadWeight: cargoWeight || 0,
            reserveFuel: reserveFuel
          });
        } else {
          // Clear route stats if we don't have enough waypoints
          setRouteStats(null);
        }
      } else {
        console.error(`FastPlannerApp: Cannot find waypoint to remove - ID: ${id}, Index: ${index}`);
      }
    }
  };
  
  const updateWaypointName = (index, name) => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.updateWaypointName(index, name);
      setWaypoints([...waypointManagerRef.current.getWaypoints()]);
    }
  };
  
  const clearRoute = () => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.clearRoute();
      setWaypoints([]);
      setRouteStats(null);
    }
  };
  
  const handleAddFavoriteLocation = (location) => {
    if (favoriteLocationsManagerRef.current && currentRegion) {
      console.log(`Adding favorite location to region ${currentRegion.id}:`, location);
      
      // First add to the manager
      favoriteLocationsManagerRef.current.addFavoriteLocation(currentRegion.id, location);
      
      // Then immediately update the UI with the new favorites
      // This is needed because the callback might not be triggered properly
      const updatedFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id);
      console.log(`Manually updating UI with ${updatedFavorites.length} favorites after adding:`, updatedFavorites);
      setFavoriteLocations(updatedFavorites);
    } else {
      console.error('Cannot add favorite: No favorite locations manager or current region');
    }
  };
  
  /**
   * Reorder waypoints via drag and drop
   * @param {string} draggedId - ID of waypoint being dragged
   * @param {string} dropTargetId - ID of waypoint being dropped onto
   */
  const reorderWaypoints = (draggedId, dropTargetId) => {
    if (waypointManagerRef.current && draggedId && dropTargetId) {
      console.log(`FastPlannerApp: Reordering from ${draggedId} to ${dropTargetId}`);
      waypointManagerRef.current.reorderWaypoints(draggedId, dropTargetId);
      
      // Get updated waypoints
      setWaypoints([...waypointManagerRef.current.getWaypoints()]);
      
      // Recalculate route stats if we have an aircraft and at least 2 waypoints
      const updatedWaypoints = waypointManagerRef.current.getWaypoints();
      if (selectedAircraft && updatedWaypoints.length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = updatedWaypoints.map(wp => wp.coords);
        
        // Calculate route statistics using the correct method
        routeCalculatorRef.current.calculateRouteStats(coordinates, {
          aircraftType: selectedAircraft.modelType || 's92',
          payloadWeight: cargoWeight || 0,
          reserveFuel: reserveFuel
        });
      }
    } else {
      console.error('Cannot reorder: Missing waypoint manager or invalid IDs');
    }
  };
  
  const handleRemoveFavoriteLocation = (locationId) => {
    if (favoriteLocationsManagerRef.current && currentRegion) {
      console.log(`Removing favorite location with ID ${locationId} from region ${currentRegion.id}`);
      favoriteLocationsManagerRef.current.removeFavoriteLocation(currentRegion.id, locationId);
      setFavoriteLocations(favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id));
    } else {
      console.error('Cannot remove favorite: No favorite locations manager or current region');
    }
  };
  
  const togglePlatformsVisibility = () => {
    const newState = !platformsVisible;
    setPlatformsVisible(newState);
    
    if (platformManagerRef.current) {
      platformManagerRef.current.toggleVisibility(newState);
    }
    
    // Save to settings
    if (appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        platformsVisible: newState
      });
    }
  };
  
  const loadCustomChart = () => {
    // Not implemented yet
    console.log("loadCustomChart - Not implemented");
  };
  
  const reloadPlatformData = () => {
    if (platformManagerRef.current && currentRegion) {
      setRigsLoading(true);
      platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
        .then(() => {
          setPlatformsLoaded(true);
          setRigsLoading(false);
          setPlatformsVisible(true);
        })
        .catch(error => {
          console.error(`Error loading platforms: ${error}`);
          setRigsError(error.message);
          setRigsLoading(false);
        });
    }
  };
  
  const changeRegion = (regionId) => {
    if (regionManagerRef.current) {
      console.log(`Changing region to ${regionId}`);
      setRegionLoading(true);
      
      // Clear aircraft selection when changing regions
      setAircraftType('');
      setAircraftRegistration('');
      setSelectedAircraft(null);
      
      // Set the new region
      regionManagerRef.current.setRegion(regionId);
      
      // Load favorite locations for the new region
      if (favoriteLocationsManagerRef.current) {
        console.log(`Loading favorite locations for region: ${regionId}`);
        const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
        setFavoriteLocations(regionFavorites);
      }
      
      // Save to settings
      if (appSettingsManagerRef.current) {
        appSettingsManagerRef.current.setRegion(regionId);
      }
    }
  };
  
  const changeAircraftType = (type) => {
    setAircraftType(type);
    setAircraftRegistration('');  // Clear registration when type changes
    setSelectedAircraft(null);    // Clear selected aircraft
    
    // Save to settings
    if (appSettingsManagerRef.current) {
      appSettingsManagerRef.current.setAircraft(type, '');
    }
    
    if (aircraftManagerRef.current && currentRegion) {
      setAircraftLoading(true);
      aircraftManagerRef.current.filterAircraft(currentRegion.id, type);
    }
  };
  
  const changeAircraftRegistration = (registration) => {
    setAircraftRegistration(registration);
    
    // Find the selected aircraft in the aircraftsByType
    if (aircraftsByType[aircraftType]) {
      const aircraft = aircraftsByType[aircraftType].find(a => a.registration === registration);
      setSelectedAircraft(aircraft);
      
      // Save to settings
      if (appSettingsManagerRef.current) {
        appSettingsManagerRef.current.setAircraft(aircraftType, registration);
      }
      
      // Load aircraft-specific settings if they exist
      if (aircraft) {
        try {
          const storageKey = `aircraft_${aircraft.registration}`;
          const savedSettingsJson = localStorage.getItem(`fastPlanner_settings_${storageKey}`);
          
          if (savedSettingsJson) {
            const savedSettings = JSON.parse(savedSettingsJson);
            console.log(`Found saved settings for ${aircraft.registration}:`, savedSettings);
            
            // Apply the saved settings
            if (savedSettings.passengerWeight !== undefined) setPassengerWeight(savedSettings.passengerWeight);
            if (savedSettings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(savedSettings.contingencyFuelPercent);
            if (savedSettings.taxiFuel !== undefined) setTaxiFuel(savedSettings.taxiFuel);
            if (savedSettings.reserveFuel !== undefined) setReserveFuel(savedSettings.reserveFuel);
            if (savedSettings.deckTimePerStop !== undefined) setDeckTimePerStop(savedSettings.deckTimePerStop);
            if (savedSettings.deckFuelFlow !== undefined) setDeckFuelFlow(savedSettings.deckFuelFlow);
            if (savedSettings.deckFuelPerStop !== undefined) setDeckFuelPerStop(savedSettings.deckFuelPerStop);
            if (savedSettings.cargoWeight !== undefined) setCargoWeight(savedSettings.cargoWeight);
            
            // Update flightSettings object
            const updatedSettings = {
              ...flightSettings,
              passengerWeight: savedSettings.passengerWeight || flightSettings.passengerWeight,
              contingencyFuelPercent: savedSettings.contingencyFuelPercent || flightSettings.contingencyFuelPercent,
              taxiFuel: savedSettings.taxiFuel || flightSettings.taxiFuel,
              reserveFuel: savedSettings.reserveFuel || flightSettings.reserveFuel,
              deckTimePerStop: savedSettings.deckTimePerStop || flightSettings.deckTimePerStop,
              deckFuelFlow: savedSettings.deckFuelFlow || flightSettings.deckFuelFlow
            };
            setFlightSettings(updatedSettings);
            
            // Update FlightCalculations module
            if (flightCalculationsRef.current) {
              flightCalculationsRef.current.updateConfig(updatedSettings);
            }
            
            // Show a message that settings were loaded
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(`Loaded saved settings for ${aircraft.registration}`);
            }
          } else {
            // If no aircraft-specific settings, try to load type-specific settings
            const typeSettingsJson = localStorage.getItem(`fastPlanner_settings_${aircraftType}`);
            
            if (typeSettingsJson) {
              const typeSettings = JSON.parse(typeSettingsJson);
              console.log(`Found saved settings for aircraft type ${aircraftType}:`, typeSettings);
              
              // Apply the type settings
              if (typeSettings.passengerWeight !== undefined) setPassengerWeight(typeSettings.passengerWeight);
              if (typeSettings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(typeSettings.contingencyFuelPercent);
              if (typeSettings.taxiFuel !== undefined) setTaxiFuel(typeSettings.taxiFuel);
              if (typeSettings.reserveFuel !== undefined) setReserveFuel(typeSettings.reserveFuel);
              if (typeSettings.deckTimePerStop !== undefined) setDeckTimePerStop(typeSettings.deckTimePerStop);
              if (typeSettings.deckFuelFlow !== undefined) setDeckFuelFlow(typeSettings.deckFuelFlow);
              if (typeSettings.deckFuelPerStop !== undefined) setDeckFuelPerStop(typeSettings.deckFuelPerStop);
              if (typeSettings.cargoWeight !== undefined) setCargoWeight(typeSettings.cargoWeight);
              
              // Update flightSettings object
              const updatedSettings = {
                ...flightSettings,
                passengerWeight: typeSettings.passengerWeight || flightSettings.passengerWeight,
                contingencyFuelPercent: typeSettings.contingencyFuelPercent || flightSettings.contingencyFuelPercent,
                taxiFuel: typeSettings.taxiFuel || flightSettings.taxiFuel,
                reserveFuel: typeSettings.reserveFuel || flightSettings.reserveFuel,
                deckTimePerStop: typeSettings.deckTimePerStop || flightSettings.deckTimePerStop,
                deckFuelFlow: typeSettings.deckFuelFlow || flightSettings.deckFuelFlow
              };
              setFlightSettings(updatedSettings);
              
              // Update FlightCalculations module
              if (flightCalculationsRef.current) {
                flightCalculationsRef.current.updateConfig(updatedSettings);
              }
              
              // Show a message that type settings were loaded
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(`Loaded ${aircraftType} type settings`);
              }
            }
          }
        } catch (error) {
          console.error(`Error loading saved settings for ${registration}:`, error);
        }
      }
      
      // Handle the case when an aircraft is selected (non-empty registration)
      if (registration) {
        // After selecting an aircraft, reset dropdown values for next selection
        // but maintain the actual selected aircraft in state
        setTimeout(() => {
          // Reset type dropdown value but DO NOT change state
          setAircraftType('');
          // Reset registration dropdown value but DO NOT clear selected aircraft
          setAircraftRegistration('');
          
          // Force a UI update to refresh the dropdown components
          setForceUpdate(prev => prev + 1);
          
          console.log("Reset dropdowns after aircraft selection while keeping selectedAircraft");
        }, 100);
      }
      
      // Recalculate route if we have waypoints
      if (aircraft && waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
        
        // Calculate route statistics using the correct method
        routeCalculatorRef.current.calculateRouteStats(coordinates, {
          aircraftType: aircraft.modelType || 's92',
          payloadWeight: cargoWeight || 0,
          reserveFuel: reserveFuel
        });
      }
    }
  };
  
  // Load aircraft data when region changes
  useEffect(() => {
    if (aircraftManagerRef.current && currentRegion && client) {
      console.log(`Loading aircraft for region ${currentRegion.name}`);
      setAircraftLoading(true);
      
      // Check if we already have loaded aircraft
      if (aircraftList.length > 0) {
        console.log('Aircraft already loaded, just filtering by region');
        aircraftManagerRef.current.filterAircraft(currentRegion.id, aircraftType);
        setAircraftLoading(false);
      } else {
        // Load all aircraft from OSDK
        try {
          aircraftManagerRef.current.loadAircraftFromOSDK(client)
            .then(() => {
              console.log('Aircraft loaded from OSDK, filtering by region');
              
              // Filter aircraft for the current region
              if (currentRegion) {
                aircraftManagerRef.current.filterAircraft(currentRegion.id, aircraftType);
              }
              
              setAircraftLoading(false);
            })
            .catch(error => {
              console.error(`Error loading aircraft: ${error}`);
              setAircraftLoading(false);
            });
        } catch (error) {
          console.error(`Error calling loadAircraftFromOSDK: ${error}`);
          setAircraftLoading(false);
        }
      }
    }
  }, [currentRegion, client, aircraftType, aircraftList.length]);
  
  // Load platform data when region changes
  useEffect(() => {
    if (platformManagerRef.current && currentRegion && client) {
      console.log(`Loading platforms for region ${currentRegion.name}`);
      setRigsLoading(true);
      
      try {
        // Check if the method exists
        if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
          platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
            .then(() => {
              setPlatformsLoaded(true);
              setRigsLoading(false);
              setPlatformsVisible(true);
            })
            .catch(error => {
              console.error(`Error loading platforms: ${error}`);
              setRigsError(error?.message || 'Unknown error loading platforms');
              setRigsLoading(false);
            });
        } else {
          // Method doesn't exist, show error
          console.error('PlatformManager.loadPlatformsFromFoundry is not a function');
          setRigsError('Platform loading method not available');
          setRigsLoading(false);
        }
      } catch (error) {
        console.error(`Error calling platform loading method: ${error}`);
        setRigsError(error?.message || 'Error loading platforms');
        setRigsLoading(false);
      }
    }
  }, [currentRegion, client]);

  return (
    <div className="fast-planner-container">
      {/* Loading Overlay - Only used for critical operations, not for aircraft loading */}
      <div id="loading-overlay" className="loading-overlay" style={{ display: 'none' }}>
        <div className="loading-spinner"></div>
        <div className="loading-message">Loading...</div>
      </div>
      
      {/* Route Stats Card */}
      <RouteStatsCard
        routeStats={routeStats}
        selectedAircraft={selectedAircraft}
        waypoints={waypoints}
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        deckFuelFlow={deckFuelFlow}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
        taxiFuel={taxiFuel}
        contingencyFuelPercent={contingencyFuelPercent}
        reserveFuel={reserveFuel}
      />
      
      {/* Map Component */}
      <MapComponent
        mapManagerRef={mapManagerRef}
        onMapReady={handleMapReady}
        className="fast-planner-map"
      />
      
      {/* Left Panel (Route Editor) */}
      <LeftPanel
        visible={leftPanelVisible}
        onToggleVisibility={toggleLeftPanel}
        waypoints={waypoints}
        onRemoveWaypoint={removeWaypoint}
        onWaypointNameChange={updateWaypointName}
        onAddWaypoint={addWaypoint}
        onReorderWaypoints={reorderWaypoints}
        routeInput={routeInput}
        onRouteInputChange={handleRouteInputChange}
        favoriteLocations={favoriteLocations}
        onAddFavoriteLocation={handleAddFavoriteLocation}
        onRemoveFavoriteLocation={handleRemoveFavoriteLocation}
      />
      
      {/* Right Panel (Controls & Stats) */}
      <RightPanel
        visible={rightPanelVisible}
        onToggleVisibility={toggleRightPanel}
        onClearRoute={clearRoute}
        onLoadRigData={reloadPlatformData}
        onToggleChart={togglePlatformsVisibility}
        onLoadCustomChart={loadCustomChart}
        chartsVisible={platformsVisible}
        aircraftType={aircraftType}
        onAircraftTypeChange={changeAircraftType}
        aircraftRegistration={aircraftRegistration}
        onAircraftRegistrationChange={changeAircraftRegistration}
        selectedAircraft={selectedAircraft}
        aircraftsByType={aircraftsByType}
        aircraftLoading={aircraftLoading}
        routeStats={routeStats}
        waypoints={waypoints}
        onRemoveWaypoint={removeWaypoint}
        isAuthenticated={isAuthenticated}
        authUserName={userName}
        rigsLoading={rigsLoading}
        onLogin={login}
        regions={regions}
        currentRegion={currentRegion}
        onRegionChange={changeRegion}
        regionLoading={regionLoading}
        // Flight settings props
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        deckFuelFlow={deckFuelFlow}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
        taxiFuel={taxiFuel}
        contingencyFuelPercent={contingencyFuelPercent}
        reserveMethod={reserveMethod}
        onDeckTimeChange={(value) => updateFlightSetting('deckTimePerStop', value)}
        onDeckFuelChange={(value) => updateFlightSetting('deckFuelPerStop', value)}
        onDeckFuelFlowChange={(value) => updateFlightSetting('deckFuelFlow', value)}
        onPassengerWeightChange={(value) => updateFlightSetting('passengerWeight', value)}
        onCargoWeightChange={(value) => updateFlightSetting('cargoWeight', value)}
        onTaxiFuelChange={(value) => updateFlightSetting('taxiFuel', value)}
        onContingencyFuelPercentChange={(value) => updateFlightSetting('contingencyFuelPercent', value)}
        onReserveMethodChange={(value) => updateFlightSetting('reserveMethod', value)}
        forceUpdate={forceUpdate}
        // Additional props
        payloadWeight={payloadWeight}
        onPayloadWeightChange={setPayloadWeight}
        reserveFuel={reserveFuel}
        onReserveFuelChange={setReserveFuel}
      />
    </div>
  );
};

export default FastPlannerApp;