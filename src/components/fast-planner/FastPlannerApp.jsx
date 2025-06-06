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
  const [stopCards, setStopCards] = useState([]);
  
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
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });
  
  // Flight calculation settings
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 0,
    contingencyFuelPercent: 10,
    taxiFuel: 50,
    reserveFuel: 0,
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
        selectedAircraft: selectedAircraft, // Pass the full aircraft object
        payloadWeight: cargoWeight || 0,
        reserveFuel: updatedSettings.reserveFuel || reserveFuel,
        weather: weather // Include weather data in calculations
      });
    }
  };

  // Initialize managers
  useEffect(() => {
    console.log("FastPlannerApp: Initializing managers...");
    
    // Check if OSDK client is available
    if (!client) {
      console.error("OSDK Client Error: client is null or undefined");
      
      // Create error dialog
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
    }
    
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
        
        // Check if stats are valid before updating
        if (!stats || !stats.timeHours || stats.timeHours === 0) {
          console.error('🔄 Received invalid route stats with zero time:', stats);
          return; // Don't update with invalid stats
        }
        
        // Store previous route stats
        const prevStats = {...routeStats};
        
        // Update the route stats state with the new data
        setRouteStats(stats);
        
        // CRITICAL FIX: Make the route stats accessible globally for WaypointManager
        window.currentRouteStats = stats;
        
        // CRITICAL FIX: Force route display update when weather stats change
        // This ensures the route line labels are updated with new time values
        if (waypointManagerRef.current) {
          // Check if weather data has changed from previous stats
          const hasWindChanged = prevStats?.windData?.windSpeed !== stats?.windData?.windSpeed || 
                                 prevStats?.windData?.windDirection !== stats?.windData?.windDirection;
          
          // Force route update whenever new calculation occurs, especially with wind changes
          console.log('🔄 Forcing route display update with new stats, wind changed:', hasWindChanged);
          
          // First clear the route display to ensure a clean redraw
          waypointManagerRef.current.updateRoute(null);
          
          // Then redraw with the new stats after a small delay
          setTimeout(() => {
            waypointManagerRef.current.updateRoute(stats);
            console.log('🔄 Route display updated with new stats');
          }, 50);
        }
        
        // When route stats are updated, update stop cards too
        if (stats && waypoints.length >= 2 && selectedAircraft) {
          console.log('🔄 Generating stop cards with stats:', {
            totalDistance: stats.totalDistance,
            estimatedTime: stats.estimatedTime,
            timeHours: stats.timeHours
          });
          
          // Generate stop cards with the new stats
          const newStopCards = generateStopCardsData(waypoints, stats, selectedAircraft, weather);
          console.log('🔄 Generated stop cards:', newStopCards.map(card => ({
            leg: card.index + 1,
            legTime: card.legTime,
            totalTime: card.totalTime
          })));
          
          // Update the stop cards state
          setStopCards(newStopCards);
        }
      });
      
      // We no longer need the DirectTimeFix as RouteCalculator now uses the same calculation method as StopCards
      console.log("FastPlannerApp: RouteCalculator configured with accurate wind calculations");
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
      
      // Import and make WindCalculations available globally
      import('./modules/calculations/WindCalculations')
        .then(WindCalc => {
          // Make WindCalculations globally available
          window.WindCalculations = WindCalc;
          console.log("WindCalculations module imported and made globally available");
        })
        .catch(error => {
          console.error("Failed to import WindCalculations module:", error);
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
      
      mapInteractionHandlerRef.current.setCallback('onMapClick', async (data) => {
        console.log('🗺️ Map click callback received', data);
        // Don't return anything from this callback to avoid async issues
        try {
          // Create a local copy of the data to avoid reference issues
          const clickData = {...data};
          // Process the waypoint addition
          await addWaypoint(clickData);
        } catch (error) {
          console.error('Error processing map click:', error);
        }
      });
      
      mapInteractionHandlerRef.current.setCallback('onPlatformClick', async (data) => {
        console.log('🏢 Platform click callback received', data);
        // Don't return anything from this callback to avoid async issues
        try {
          // Create a local copy of the data to avoid reference issues
          const clickData = {...data};
          // Process the waypoint addition
          await addWaypoint(clickData);
        } catch (error) {
          console.error('Error processing platform click:', error);
        }
      });
      
      mapInteractionHandlerRef.current.setCallback('onRouteClick', async (data) => {
        console.log('🛣️ Route click callback received', data);
        
        try {
          // Create a local copy of the data
          const clickData = {...data};
          
          // If we have a nearest rig and it's close
          if (clickData.nearestRig && clickData.nearestRig.distance < 1) {
            // Add the rig instead of the clicked point
            console.log('🛣️ Adding rig at route click:', clickData.nearestRig.name);
            waypointManagerRef.current.addWaypointAtIndex(
              clickData.nearestRig.coordinates, 
              clickData.nearestRig.name, 
              clickData.insertIndex
            );
          } else {
            // Add the clicked point
            console.log('🛣️ Adding waypoint at route click');
            waypointManagerRef.current.addWaypointAtIndex(
              [clickData.lngLat.lng, clickData.lngLat.lat], 
              null, 
              clickData.insertIndex
            );
          }
          
          // Get updated waypoints
          const updatedWaypoints = waypointManagerRef.current.getWaypoints();
          
          // Update the waypoints state - wait for it to complete
          await new Promise(resolve => {
            setWaypoints([...updatedWaypoints]);
            setTimeout(resolve, 0);
          });
          
          // CRITICAL FIX: Recalculate route MANUALLY and update stats directly
          if (updatedWaypoints.length >= 2 && selectedAircraft) {
            // Extract coordinates from waypoints
            const coordinates = updatedWaypoints.map(wp => wp.coords);
            
            console.log('🛣️ Manually recalculating route for route click');
            
            // First calculate directly to get immediate results
            if (routeCalculatorRef.current) {
              console.log('🛣️ Direct calculation for route click');
              const calcResults = routeCalculatorRef.current.calculateRouteStats(coordinates, {
                selectedAircraft: selectedAircraft,
                payloadWeight: cargoWeight || 0,
                reserveFuel: reserveFuel,
                weather: weather
              });
              
              // Directly update route stats
              if (calcResults && calcResults.timeHours > 0) {
                console.log('🛣️ Directly updating route stats from calculation:', {
                  distance: calcResults.totalDistance,
                  time: calcResults.estimatedTime
                });
                
                // Update the state - wait for it to complete
                await new Promise(resolve => {
                  setRouteStats(calcResults);
                  setTimeout(resolve, 0);
                });
                
                // Generate stop cards with the FRESH calculation results
                const newStopCards = generateStopCardsData(updatedWaypoints, calcResults, selectedAircraft, weather);
                
                // Update stop cards - wait for it to complete
                await new Promise(resolve => {
                  setStopCards(newStopCards);
                  setTimeout(resolve, 0);
                });
                
                // Force a rerender
                setForceUpdate(prev => prev + 1);
              }
            }
          }
        } catch (error) {
          console.error('Error processing route click:', error);
        }
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
              reserveFuel: settings.reserveFuel || reserveFuel,
              weather: weather // Include weather data in calculations
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
      if (waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
        
        // Always calculate basic distance
        if (routeCalculatorRef.current) {
          routeCalculatorRef.current.calculateDistanceOnly(coordinates);
        }
        
        // Calculate full stats if we have an aircraft
        if (selectedAircraft) {
          // Calculate route statistics using the correct method
          routeCalculatorRef.current.calculateRouteStats(coordinates, {
            selectedAircraft: selectedAircraft, // Pass the full aircraft object
            payloadWeight: cargoWeight || 0,
            reserveFuel: reserveFuel,
            weather: weather // Include weather data in calculations
          });
          
          // Also update stop cards when settings change
          const newStopCards = generateStopCardsData(waypoints, routeStats, selectedAircraft, weather);
          setStopCards(newStopCards);
        }
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
      regionManagerRef.current.initialize(initialRegion);
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
          
          // CRITICAL FIX: Always calculate distance regardless of aircraft selection
          if (updatedWaypoints.length >= 2 && routeCalculatorRef.current) {
            // Extract coordinates for calculation
            const coordinates = updatedWaypoints.map(wp => wp.coords);
            
            // Always do a distance-only calculation for basic stats
            console.log('🗺️ Calculating basic distance for updated waypoints');
            const distanceResults = routeCalculatorRef.current.calculateDistanceOnly(coordinates);
            
            // If we don't have aircraft-based stats yet, use the distance-only results
            if (!routeStats || !routeStats.timeHours) {
              console.log('🗺️ No aircraft-based stats available, using distance-only results');
              setRouteStats(distanceResults);
            }
            
            // If we have an aircraft, also do the full calculation
            if (selectedAircraft) {
              console.log('🗺️ Calculating full route stats with aircraft');
              routeCalculatorRef.current.calculateRouteStats(coordinates, {
                selectedAircraft: selectedAircraft,
                payloadWeight: cargoWeight || 0,
                reserveFuel: reserveFuel,
                weather: weather
              });
            }
          }
        });
        
        waypointManagerRef.current.setCallback('onRouteUpdated', (routeData) => {
          console.log(`🗺️ Route updated with ${routeData.waypoints.length} waypoints`);
          
          // Always calculate basic distance even without an aircraft
          if (routeCalculatorRef.current && routeData.coordinates && routeData.coordinates.length >= 2) {
            routeCalculatorRef.current.calculateDistanceOnly(routeData.coordinates);
          }
          
          // Calculate full route stats if we have an aircraft and waypoints
          if (selectedAircraft && routeData.waypoints.length >= 2) {
            // Extract coordinates from waypoints
            const coordinates = routeData.waypoints.map(wp => wp.coords);
            
            // Calculate route statistics using the correct method
            routeCalculatorRef.current.calculateRouteStats(coordinates, {
              aircraftType: selectedAircraft.modelType || 's92',
              payloadWeight: cargoWeight || 0,
              reserveFuel: reserveFuel,
              weather: weather // Include weather data in calculations
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
  
  // Generate stop cards data
  const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather) => {
    if (waypoints.length < 2 || !selectedAircraft) {
      return [];
    }
    
    // Check if aircraft has all required properties
    if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
      console.log('generateStopCardsData: Aircraft missing required properties');
      return [];
    }
    
    console.log('Generating stop cards with weather data:', weather);
    
    // Create data for each stop
    const cards = [];
    let cumulativeDistance = 0;
    let cumulativeTime = 0;
    let cumulativeFuel = 0;
    let cumulativeDeckTime = 0;
    let cumulativeDeckFuel = 0;
    
    // Get aircraft data for calculations
    const aircraft = selectedAircraft;
    
    // Add taxi fuel to the total immediately
    const taxiFuelValue = taxiFuel || 50; // Default value
    cumulativeFuel += taxiFuelValue;
    
    // Add reserve fuel to the total
    cumulativeFuel += reserveFuel;
    
    // Check if window.turf is available
    if (!window.turf && routeCalculatorRef.current) {
      console.warn('Turf.js not loaded, using routeStats legs for distances');
    }
    
    // For each leg (between waypoints)
    for (let i = 0; i < waypoints.length - 1; i++) {
      const fromWaypoint = waypoints[i];
      const toWaypoint = waypoints[i + 1];
      
      // Create a unique ID for this stop
      const stopId = toWaypoint.id || `waypoint-${i}`;
      
      // Get leg distance from routeStats if available
      let legDistance = 0;
      if (routeStats && routeStats.legs && routeStats.legs[i]) {
        legDistance = parseFloat(routeStats.legs[i].distance);
      } else if (window.turf) {
        // Calculate distance using turf if available
        const from = window.turf.point(fromWaypoint.coords);
        const to = window.turf.point(toWaypoint.coords);
        const options = { units: 'nauticalmiles' };
        
        legDistance = window.turf.distance(from, to, options);
      }
      
      // Calculate leg timing and fuel with wind adjustments
      let legTimeHours = 0;
      let legFuel = 0;
      let legGroundSpeed = aircraft.cruiseSpeed;
      let headwindComponent = 0;
      
      // Check if we have coordinates - either as separate lat/lon or as coords array
      const fromHasCoords = (fromWaypoint.lat && fromWaypoint.lon) || 
                           (fromWaypoint.coords && fromWaypoint.coords.length === 2);
      const toHasCoords = (toWaypoint.lat && toWaypoint.lon) || 
                         (toWaypoint.coords && toWaypoint.coords.length === 2);
      
      // Import the wind calculation functions if needed
      // Use window.WindCalculations which we've made globally available
      
      if (fromHasCoords && toHasCoords) {
        // Create lat/lon objects from either format
        const fromCoords = {
          lat: fromWaypoint.lat || fromWaypoint.coords[1],
          lon: fromWaypoint.lon || fromWaypoint.coords[0]
        };
        
        const toCoords = {
          lat: toWaypoint.lat || toWaypoint.coords[1],
          lon: toWaypoint.lon || toWaypoint.coords[0]
        };
        
        // Use wind calculations if available
        if (window.WindCalculations) {
          try {
            console.log(`Calculating leg ${i} with wind: ${fromCoords.lat},${fromCoords.lon} to ${toCoords.lat},${toCoords.lon}`);
            const legDetails = window.WindCalculations.calculateLegWithWind(
              fromCoords,
              toCoords,
              legDistance,
              aircraft,
              weather
            );
            
            console.log(`Leg ${i} calculation results:`, {
              time: legDetails.time,
              fuel: legDetails.fuel,
              groundSpeed: legDetails.groundSpeed,
              headwind: legDetails.headwindComponent
            });
            
            legTimeHours = legDetails.time;
            legFuel = Math.round(legDetails.fuel);
            legGroundSpeed = Math.round(legDetails.groundSpeed);
            headwindComponent = Math.round(legDetails.headwindComponent);
          } catch (error) {
            console.warn('Error calculating leg with wind:', error);
            // Basic calculation without wind as fallback
            legTimeHours = legDistance / aircraft.cruiseSpeed;
            legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
            legGroundSpeed = aircraft.cruiseSpeed;
            headwindComponent = 0;
          }
        } else {
          // Basic calculation without wind as fallback
          legTimeHours = legDistance / aircraft.cruiseSpeed;
          legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
          legGroundSpeed = aircraft.cruiseSpeed;
          headwindComponent = 0;
          console.warn('WindCalculations not available, using basic time calculation');
        }
      } else {
        // Fall back to simple calculation without wind
        legTimeHours = legDistance / aircraft.cruiseSpeed;
        legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
      }
      
      // Update cumulative values
      cumulativeDistance += legDistance;
      cumulativeTime += legTimeHours;
      cumulativeFuel += legFuel;
      
      // Add deck time and fuel for this stop if it's not the final destination
      // IMPORTANT: Only add deck time to future stops, since the current stop
      // hasn't had its deck time yet - it will be added to the NEXT leg
      let deckTimeHours = 0;
      let deckFuel = 0;

      // Add deck time only if this is not the final leg
      // This adds deck time for the PREVIOUS stop, not the current one
      if (i > 0) {
        deckTimeHours = deckTimePerStop / 60; // Convert minutes to hours
        deckFuel = Math.round(deckTimeHours * deckFuelFlow);
        
        cumulativeDeckTime += deckTimeHours;
        cumulativeDeckFuel += deckFuel;
      }
      
      // Calculate max passengers based on remaining load
      let maxPassengers = 0;
      if (selectedAircraft) {
        const usableLoad = Math.max(
          0, 
          selectedAircraft.maxTakeoffWeight - 
          selectedAircraft.emptyWeight - 
          cumulativeFuel - cumulativeDeckFuel
        );
        maxPassengers = Math.floor(usableLoad / passengerWeight);
        
        // Ensure we don't exceed aircraft capacity
        maxPassengers = Math.min(maxPassengers, selectedAircraft.maxPassengers || 19);
      }
      
      // Create the card data
      // Make a deep copy of all values to prevent reference issues
      const cardData = {
        index: i,
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDistance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legTimeHours),
        // Include cumulative deck time in the total time calculation
        totalTime: Number(cumulativeTime + cumulativeDeckTime),
        legFuel: Number(legFuel),
        // Include cumulative deck fuel in the total fuel calculation
        totalFuel: Number(cumulativeFuel + cumulativeDeckFuel),
        maxPassengers: Number(maxPassengers),
        groundSpeed: Number(legGroundSpeed),
        headwind: Number(headwindComponent),
        // Add explicit deck time values for display
        deckTime: Number(cumulativeDeckTime * 60), // Convert back to minutes for display
        deckFuel: Number(cumulativeDeckFuel)
      };
      
      console.log(`Stop card ${i} data:`, {
        stopName: cardData.stopName,
        legTime: cardData.legTime,
        cumulativeTime: cumulativeTime,
        deckTime: cumulativeDeckTime * 60,
        totalTime: cardData.totalTime,
        legFuel: cardData.legFuel,
        cumulativeFuel: cumulativeFuel,
        deckFuel: cumulativeDeckFuel,
        totalFuel: cardData.totalFuel
      });
      
      cards.push(cardData);
    }
    
    console.log('All stop cards generated, cards count:', cards.length);
    return cards;
  };

  /**
   * Updates weather settings for the application
   * IMPORTANT: This function is used by both MainCard and WeatherCard components
   * to update wind speed and direction.
   * 
   * @param {number} windSpeed - Wind speed in knots
   * @param {number} windDirection - Direction wind is coming FROM in degrees (0-359)
   */
  const updateWeatherSettings = (windSpeed, windDirection) => {
    console.log('🌬️ updateWeatherSettings called with:', windSpeed, windDirection);
    
    // Ensure we have valid numbers
    const windSpeedNum = parseInt(windSpeed) || 0;
    // Normalize direction to 0-359 range
    const windDirectionNum = ((parseInt(windDirection) || 0) % 360 + 360) % 360;
    
    const newWeather = { 
      windSpeed: windSpeedNum, 
      windDirection: windDirectionNum 
    };
    
    console.log(`🌬️ Updating weather settings: Wind ${newWeather.windSpeed} kts from ${newWeather.windDirection}°`);
    console.log('🌬️ Old weather state:', weather);
    
    // Immediately set the new weather state
    setWeather(newWeather);
    console.log('🌬️ Weather state updated to:', newWeather);
    
    // Force an immediate UI update
    setForceUpdate(prev => prev + 1);
    
    // Recalculate route if we have an aircraft and waypoints
    if (selectedAircraft && waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
      // Extract coordinates from waypoints
      const coordinates = waypointManagerRef.current.getWaypoints().map(wp => wp.coords);
      
      // Calculate route statistics with weather
      console.log(`🌬️ Recalculating route with weather: Wind ${newWeather.windSpeed} kts from ${newWeather.windDirection}°`);
      
      // CRITICAL FIX: First, force the route to update with existing stats to clear the old display
      if (waypointManagerRef.current) {
        console.log('🌬️ Forcing immediate route display update to clear old wind data');
        waypointManagerRef.current.updateRoute(null);
      }
      
      // Then calculate new route stats with the updated weather
      routeCalculatorRef.current.calculateRouteStats(coordinates, {
        selectedAircraft: selectedAircraft, // Pass the full aircraft object
        payloadWeight: cargoWeight || 0,
        reserveFuel: reserveFuel,
        weather: newWeather, // Pass the new weather object
        forceTimeCalculation: true // Force recalculation of time with new wind
      });
      
      // CRITICAL FIX: Force route display update with a delay to ensure the route calculator has time to finish
      setTimeout(() => {
        if (waypointManagerRef.current) {
          // Get the latest route stats from our state
          const currentStats = window.currentRouteStats || routeStats;
          console.log('🌬️ Forcing delayed route display update after weather change with stats:', 
                      currentStats ? {time: currentStats.estimatedTime, windAdjusted: currentStats.windAdjusted} : 'No stats');
          
          // Update the route with the latest stats to refresh the time display
          waypointManagerRef.current.updateRoute(currentStats);
          
          // Force another UI update to ensure everything is synced
          setForceUpdate(prev => prev + 1);
        }
      }, 300); // Slightly longer delay for more reliable updates
      
      // Generate stop cards data with the new weather settings immediately
      if (waypoints.length >= 2 && selectedAircraft) {
        console.log(`🌬️ Generating new stop cards with updated weather: ${newWeather.windSpeed} kts from ${newWeather.windDirection}°`);
        const newStopCards = generateStopCardsData(waypoints, routeStats, selectedAircraft, newWeather);
        setStopCards(newStopCards);
      }
    }
  };
  
  // Basic handlers
  const addWaypoint = async (waypointData) => {
    if (waypointManagerRef.current) {
      // Handle different input formats
      let coords, name;
      // CRITICAL FIX: Add flag to identify map clicks
      let isMapClick = false;
      
      console.log('🌐 FastPlannerApp: Adding waypoint with data:', waypointData);
      
      if (Array.isArray(waypointData)) {
        // Direct coordinates array: [lng, lat]
        coords = waypointData;
        name = null;
      } else if (typeof waypointData === 'string') {
        // It's just a name - try to find a location with that name
        // This is used when adding a waypoint by typing the name in the input field
        console.log(`🌐 Looking for location with name: ${waypointData}`);
        
        // CRITICAL FIX: Search for platform by name when string is passed
        if (platformManagerRef.current) {
          console.log(`🌐 Searching for platform with name: ${waypointData}`);
          const platform = platformManagerRef.current.findPlatformByName(waypointData);
          
          if (platform) {
            console.log(`🌐 Found platform: ${platform.name} at ${platform.coordinates}`);
            coords = platform.coordinates;
            name = platform.name;
          } else {
            console.log(`🌐 Platform not found with name: ${waypointData}`);
            
            // Show error message to user
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(`Platform "${waypointData}" not found. Please check spelling or click on map.`, 'error');
            } else {
              // Fallback error - create a toast notification
              const toast = document.createElement('div');
              toast.style.position = 'fixed';
              toast.style.bottom = '20px';
              toast.style.left = '50%';
              toast.style.transform = 'translateX(-50%)';
              toast.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
              toast.style.color = 'white';
              toast.style.padding = '10px 20px';
              toast.style.borderRadius = '5px';
              toast.style.zIndex = '1000';
              toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
              toast.textContent = `Platform "${waypointData}" not found. Please check spelling or click on map.`;
              document.body.appendChild(toast);
              
              // Remove toast after 3 seconds
              setTimeout(() => {
                document.body.removeChild(toast);
              }, 3000);
            }
            
            // Set coords to null so we'll return early without adding an invalid waypoint
            coords = null;
            name = waypointData;
          }
        } else {
          console.log(`🌐 Platform manager not available`);
          coords = null;
          name = waypointData;
        }
      } else if (waypointData && typeof waypointData === 'object') {
        // CRITICAL FIX: Check if this is a map click operation
        if (waypointData.mapClickSource === 'directClick') {
          console.log('🌐 Detected direct map click operation');
          isMapClick = true;
        }
        
        // Check if we have a nearest rig within range
        if (waypointData.nearestRig && waypointData.nearestRig.distance <= 2) {
          console.log(`🌐 FastPlannerApp: Snapping to nearest rig: ${waypointData.nearestRig.name} (${waypointData.nearestRig.distance.toFixed(2)} nm away)`);
          
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
            if (waypointData.lngLat) {
              coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
            } else {
              console.error('No valid coordinates found in nearestRig or lngLat');
              return;
            }
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
        console.log(`🌐 We need to search for location with name: ${name}`);
      }
      
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        console.error('Invalid coordinates format:', coords);
        // Don't add waypoint with invalid coordinates
        return;
      }
      
      // Additional validation to ensure coordinates are numbers
      if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || 
          isNaN(coords[0]) || isNaN(coords[1])) {
        console.error('Coordinates must be valid numbers:', coords);
        // Show error message to user
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates. Please try again.`, 'error');
        }
        return;
      }
      
      console.log(`🌐 FastPlannerApp: Adding waypoint at [${coords}] with name "${name || 'Unnamed'}", isMapClick=${isMapClick}`);
      waypointManagerRef.current.addWaypoint(coords, name);
      
      // Get the updated waypoints list
      const updatedWaypoints = waypointManagerRef.current.getWaypoints();
      console.log(`🌐 Updated waypoints (${updatedWaypoints.length}):`, updatedWaypoints);
      
      // Update the state - wait for it to complete
      await new Promise(resolve => {
        setWaypoints([...updatedWaypoints]);
        // Use setTimeout to ensure the state update has time to complete
        setTimeout(resolve, 0);
      });
      
      // CRITICAL FIX: Manually recalculate route stats
      if (updatedWaypoints.length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = updatedWaypoints.map(wp => wp.coords);
        console.log(`🌐 Recalculating routes for ${coordinates.length} coordinates, isMapClick=${isMapClick}`);
        
        // Always calculate basic distance
        if (routeCalculatorRef.current) {
          console.log(`🌐 Calculating route distance`);
          routeCalculatorRef.current.calculateDistanceOnly(coordinates);
        }
        
        // Calculate full stats if we have an aircraft 
        if (selectedAircraft) {
          console.log('🌐 Calculating full route stats with aircraft:', selectedAircraft.registration);
          
          // DIRECT CALCULATION: Calculate directly and use the results immediately
          if (routeCalculatorRef.current) {
            // Log aircraft information to debug time calculation issues
            console.log('🌐 Aircraft verification:', {
              modelType: selectedAircraft.modelType,
              cruiseSpeed: selectedAircraft.cruiseSpeed,
              fuelBurn: selectedAircraft.fuelBurn
            });
            
            // CRITICAL FIX: For map clicks, ensure we pass accurate options
            const calcOptions = {
              selectedAircraft: selectedAircraft,
              payloadWeight: cargoWeight || 0,
              reserveFuel: reserveFuel,
              weather: weather
            };
            
            // For map clicks, add a special flag to ensure time is calculated
            if (isMapClick) {
              calcOptions.forceTimeCalculation = true;
            }
            
            const calcResults = routeCalculatorRef.current.calculateRouteStats(coordinates, calcOptions);
            
            // Log raw results for debugging
            console.log('🌐 Raw calculation results:', calcResults ? {
              totalDistance: calcResults.totalDistance,
              estimatedTime: calcResults.estimatedTime,
              timeHours: calcResults.timeHours,
              legs: calcResults.legs?.length || 0
            } : 'No results');
            
            // CRITICAL FIX: If we have distance but timeHours is zero, fix it manually
            if (calcResults && calcResults.totalDistance && (calcResults.timeHours === 0 || calcResults.estimatedTime === '00:00')) {
              console.log('🌐 FIXING ZERO TIME ISSUE: Manual time calculation');
              
              // Manual time calculation based on distance and cruise speed
              const totalDistance = parseFloat(calcResults.totalDistance);
              if (totalDistance > 0 && selectedAircraft.cruiseSpeed > 0) {
                const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
                const hours = Math.floor(timeHours);
                const minutes = Math.floor((timeHours - hours) * 60);
                
                // Update the calculation results
                calcResults.timeHours = timeHours;
                calcResults.estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                
                console.log('🌐 Fixed time calculation:', {
                  distance: totalDistance,
                  cruiseSpeed: selectedAircraft.cruiseSpeed,
                  timeHours: timeHours,
                  estimatedTime: calcResults.estimatedTime
                });
              }
            }
            
            // Check if we have valid results after potential fixes
            if (calcResults && calcResults.timeHours > 0) {
              console.log('🌐 Final calculation results:', {
                distance: calcResults.totalDistance,
                time: calcResults.estimatedTime,
                timeHours: calcResults.timeHours,
                legs: calcResults.legs?.length || 0
              });
              
              // Directly update the routeStats state with the calculation results - wait for it to complete
              await new Promise(resolve => {
                setRouteStats(calcResults);
                // CRITICAL FIX: Make route stats available to WaypointManager
                window.currentRouteStats = calcResults;
                setTimeout(resolve, 0);
              });
              
              // Generate stop cards using the fresh calculation results
              const newStopCards = generateStopCardsData(updatedWaypoints, calcResults, selectedAircraft, weather);
              
              // Update stop cards - wait for it to complete
              await new Promise(resolve => {
                setStopCards(newStopCards);
                setTimeout(resolve, 0);
              });
              
              // CRITICAL FIX: Force a rerender with a slight delay to ensure all updates propagate
              setTimeout(() => {
                setForceUpdate(prev => prev + 1);
                console.log('🌐 Forced update after map click calculation');
              }, 50);
            } else {
              console.error('🌐 Invalid calculation results even after fixes:', calcResults);
              
              // CRITICAL FIX: Create emergency backup calculation as last resort
              console.log('🌐 Creating emergency backup calculation');
              
              // Calculate distance manually as a last resort
              let totalDistance = 0;
              for (let i = 0; i < coordinates.length - 1; i++) {
                const from = window.turf.point(coordinates[i]);
                const to = window.turf.point(coordinates[i+1]);
                const options = { units: 'nauticalmiles' };
                totalDistance += window.turf.distance(from, to, options);
              }
              
              // Calculate basic time
              const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
              const hours = Math.floor(timeHours);
              const minutes = Math.floor((timeHours - hours) * 60);
              const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              
              // Create minimal valid result
              const backupResults = {
                totalDistance: totalDistance.toFixed(1),
                estimatedTime: estimatedTime,
                timeHours: timeHours,
                fuelRequired: Math.round(timeHours * selectedAircraft.fuelBurn),
                tripFuel: Math.round(timeHours * selectedAircraft.fuelBurn),
                windAdjusted: false
              };
              
              console.log('🌐 Emergency backup calculation results:', backupResults);
              
              // Update with backup results
              await new Promise(resolve => {
                setRouteStats(backupResults);
                setTimeout(resolve, 0);
              });
              
              // Generate stop cards with backup results
              const emergencyStopCards = generateStopCardsData(updatedWaypoints, backupResults, selectedAircraft, weather);
              await new Promise(resolve => {
                setStopCards(emergencyStopCards);
                setTimeout(resolve, 0);
              });
              
              // Force a rerender with delay
              setTimeout(() => {
                setForceUpdate(prev => prev + 1);
                console.log('🌐 Forced emergency update');
              }, 50);
            }
          }
        }
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
        
        // Get updated waypoints
        const updatedWaypoints = waypointManagerRef.current.getWaypoints();
        
        // Update the state
        setWaypoints([...updatedWaypoints]);
        
        // Recalculate route stats if we have at least 2 waypoints
        if (updatedWaypoints.length >= 2) {
          // Extract coordinates from waypoints
          const coordinates = updatedWaypoints.map(wp => wp.coords);
          
          // Always calculate basic distance
          if (routeCalculatorRef.current) {
            routeCalculatorRef.current.calculateDistanceOnly(coordinates);
          }
          
          // Calculate full stats if we have an aircraft
          if (selectedAircraft) {
            console.log('Recalculating route after removing waypoint');
            
            // Calculate route statistics using the correct method
            routeCalculatorRef.current.calculateRouteStats(coordinates, {
              selectedAircraft: selectedAircraft, // Pass the full aircraft object
              payloadWeight: cargoWeight || 0,
              reserveFuel: reserveFuel,
              weather: weather // Include weather data in calculations
            });
            
            // Force generate new stop cards with the updated waypoints
            setTimeout(() => {
              const newStopCards = generateStopCardsData(updatedWaypoints, routeStats, selectedAircraft, weather);
              setStopCards(newStopCards);
            }, 100);
          }
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
      
      // Recalculate route stats if we have at least 2 waypoints
      const updatedWaypoints = waypointManagerRef.current.getWaypoints();
      if (updatedWaypoints.length >= 2) {
        // Extract coordinates from waypoints
        const coordinates = updatedWaypoints.map(wp => wp.coords);
        
        // Always calculate basic distance
        if (routeCalculatorRef.current) {
          routeCalculatorRef.current.calculateDistanceOnly(coordinates);
        }
        
        // Calculate full stats if we have an aircraft
        if (selectedAircraft) {
          // Calculate route statistics using the correct method
          routeCalculatorRef.current.calculateRouteStats(coordinates, {
            selectedAircraft: selectedAircraft, // Pass the full aircraft object
            payloadWeight: cargoWeight || 0,
            reserveFuel: reserveFuel,
            weather: weather // Include weather data in calculations
          });
        }
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
    console.log(`⚡ Changing aircraft registration to: ${registration}`);
    setAircraftRegistration(registration);
    
    // Find the selected aircraft in the aircraftsByType
    let aircraft = null;
    if (aircraftsByType[aircraftType]) {
      aircraft = aircraftsByType[aircraftType].find(a => a.registration === registration);
      setSelectedAircraft(aircraft);
      
      console.log(`⚡ Selected aircraft:`, {
        registration: aircraft?.registration,
        type: aircraft?.modelType,
        cruiseSpeed: aircraft?.cruiseSpeed,
        fuelBurn: aircraft?.fuelBurn
      });
      
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
      if (aircraft && waypointManagerRef.current) {
        const existingWaypoints = waypointManagerRef.current.getWaypoints();
        if (existingWaypoints.length >= 2) {
          // Extract coordinates from waypoints
          const coordinates = existingWaypoints.map(wp => wp.coords);
          
          console.log(`⚡ Recalculating route for ${existingWaypoints.length} waypoints after aircraft selection`);
          
          // CRITICAL FIX: Force immediate route calculation and stop cards update
          if (routeCalculatorRef.current) {
            console.log(`⚡ Forcing route calculation after aircraft selection`);
            
            // Make sure to use the current aircraft we just selected
            const calcResults = routeCalculatorRef.current.calculateRouteStats(coordinates, {
              selectedAircraft: aircraft, // Use the aircraft we just found
              payloadWeight: cargoWeight || 0,
              reserveFuel: reserveFuel,
              weather: weather // Include weather data
            });
            
            console.log(`⚡ Direct calculation results:`, {
              estimatedTime: calcResults?.estimatedTime,
              timeHours: calcResults?.timeHours,
              totalDistance: calcResults?.totalDistance
            });
            
            // Directly update the routeStats state
            if (calcResults && calcResults.timeHours > 0) {
              console.log(`⚡ Directly updating route stats`);
              setRouteStats(calcResults);
              
              // Generate stop cards with the new stats
              const directStopCards = generateStopCardsData(existingWaypoints, calcResults, aircraft, weather);
              setStopCards(directStopCards);
              
              // Force UI refresh
              setForceUpdate(prev => prev + 1);
            }
          }
        }
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
        weather={weather}
        stopCards={stopCards}
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
        // Weather props
        weather={weather}
        onWeatherUpdate={updateWeatherSettings}
      />
    </div>
  );
};

export default FastPlannerApp;