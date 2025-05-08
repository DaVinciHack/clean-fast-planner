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

// Import enhanced fuel calculator modules
// import enhancedFuelCalculator from './modules/calculations/fuel'; // Remove this import
import FuelIntegration from './modules/calculations/fuel/FuelIntegration'; // Keep FuelIntegration for now, might be used elsewhere or for initialization
import { EnhancedFuelDisplay } from './components/fuel';
// Import StopCardCalculator for stop card calculations
import StopCardCalculator from './modules/calculations/flight/StopCardCalculator';
// Import WindCalculations for global access
import * as WindCalc from './modules/calculations/WindCalculations';
// Import ComprehensiveFuelCalculator for centralized fuel calculations
import ComprehensiveFuelCalculator from './modules/calculations/fuel/ComprehensiveFuelCalculator';

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
import FlightCalculations from './modules/calculations/FlightCalculations'; // Keep FlightCalculations for now, might be used elsewhere

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
    
    // Make WindCalculations available globally for other components and calculations
    window.WindCalculations = WindCalc;
    console.log('🌬️ Initialized WindCalculations globally:', window.WindCalculations);
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
  const [routeStats, setRouteStats] = useState(null); // Keep routeStats state

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
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });

  // Flight calculation settings - Consolidated with zero defaults
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220, // Initial value but will be overridden by settings
    contingencyFuelPercent: 5, // Initial value set to 5%
    taxiFuel: 50, // Initial value
    reserveFuel: 600, // Initial value
    deckTimePerStop: 5, // Initial value
    deckFuelFlow: 400, // Initial value
    cargoWeight: 0, // Initial value
  });
  
  // Log the flight settings whenever they change for debugging
  useEffect(() => {
    console.log('🛫 Flight settings updated:', flightSettings);
  }, [flightSettings]);

  // Remove individual flight setting states
  // const [deckTimePerStop, setDeckTimePerStop] = useState(5);
  // const [deckFuelPerStop, setDeckFuelPerStop] = useState(100);
  // const [deckFuelFlow, setDeckFuelFlow] = useState(400);
  // const [passengerWeight, setPassengerWeight] = useState(220);
  // const [cargoWeight, setCargoWeight] = useState(0);
  // const [taxiFuel, setTaxiFuel] = useState(50);
  // const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10);
  const [reserveMethod, setReserveMethod] = useState('fixed'); // Keep reserveMethod if used for UI only

  // Helper function to update flight settings
  const updateFlightSetting = (settingName, value) => {
    console.log(`⚙️ updateFlightSetting called with: ${settingName} = ${value} (${typeof value})`);
    
    // Ensure value is a number
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.warn(`⚙️ Warning: Attempted to set ${settingName} to non-numeric value: ${value}`);
      return; // Don't update with invalid values
    }
    
    // Update the flightSettings object
    const updatedSettings = {
      ...flightSettings,
      [settingName]: numericValue
    };
    
    console.log(`⚙️ Updating flightSettings:`, updatedSettings);
    
    // Update the state
    setFlightSettings(updatedSettings);

    // Save to AppSettingsManager
    if (appSettingsManagerRef.current) {
      console.log(`⚙️ Saving ${settingName} = ${numericValue} to AppSettingsManager`);
      appSettingsManagerRef.current.updateFlightSettings({
        [settingName]: numericValue
      });
    }

    // Force a UI update immediately to ensure consistency
    const event = new Event('settings-changed');
    window.dispatchEvent(event);
    
    console.log(`⚙️ updateFlightSetting completed for ${settingName}`);
    // The centralized useEffect will handle recalculation
  };

  // Remove this useEffect - initialization should happen within the calculator modules
  // useEffect(() => {
  //   if (flightSettings) {
  //     console.log("FastPlannerApp: Initializing enhanced fuel calculator...");
  //     FuelIntegration.initializeFuelCalculator({
  //       passengerWeight,
  //       taxiFuel,
  //       contingencyFuelPercent,
  //       reserveFuel,
  //       deckTimePerStop,
  //       deckFuelFlow,
  //       cargoWeight: cargoWeight || 0
  //     });
  //   }
  // }, [passengerWeight, taxiFuel, contingencyFuelPercent, reserveFuel, deckTimePerStop, deckFuelFlow, cargoWeight, flightSettings]);

  // Centralized useEffect for comprehensive fuel calculations
  // This effect runs whenever waypoints, selected aircraft, flight settings, or weather change
  useEffect(() => {
    console.log('⛽ FastPlannerApp: Triggering comprehensive fuel calculation...');

    // Ensure required inputs are available before calculating
    if (!waypoints || waypoints.length < 2 || !selectedAircraft || !flightSettings) {
        console.log('⛽ FastPlannerApp: Skipping fuel calculation due to missing inputs.');
        setRouteStats(null);
        setStopCards([]);
        return;
    }

    // Create a settings object with numeric values
    const numericSettings = {
      passengerWeight: Number(flightSettings.passengerWeight),
      taxiFuel: Number(flightSettings.taxiFuel),
      contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent),
      reserveFuel: Number(flightSettings.reserveFuel),
      deckTimePerStop: Number(flightSettings.deckTimePerStop),
      deckFuelFlow: Number(flightSettings.deckFuelFlow),
      cargoWeight: Number(flightSettings.cargoWeight || 0)
    };

    console.log('⛽ FastPlannerApp: Using numeric settings for fuel calculation:', numericSettings);

    // Call the comprehensive calculator with numeric settings
    const { enhancedResults, stopCards } = ComprehensiveFuelCalculator.calculateAllFuelData(
      waypoints,
      selectedAircraft,
      numericSettings,
      weather,
      routeStats // Pass current routeStats as it might be needed by StopCardCalculator
    );

    // Ensure time values in enhancedResults are valid before updating state
    if (enhancedResults && selectedAircraft && enhancedResults.totalDistance && 
        (!enhancedResults.timeHours || enhancedResults.timeHours === 0 || 
         !enhancedResults.estimatedTime || enhancedResults.estimatedTime === '00:00')) {
      console.warn('⚠️ enhancedResults missing time values - calculating before setting state...');
      
      // Calculate time based on distance and cruise speed
      const totalDistance = parseFloat(enhancedResults.totalDistance);
      const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
      
      // Format time string
      const hours = Math.floor(timeHours);
      const minutes = Math.floor((timeHours - hours) * 60);
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Update enhancedResults with calculated time values
      enhancedResults.timeHours = timeHours;
      enhancedResults.estimatedTime = estimatedTime;
      
      console.log('⚠️ Added calculated time values to enhancedResults:', {
        timeHours,
        estimatedTime
      });
    }
    
    // IMPORTANT: Always update window.currentRouteStats first for global access
    window.currentRouteStats = enhancedResults;
    
    // Update the state with the new results
    setRouteStats(enhancedResults); // enhancedResults should be in the format expected by routeStats
    setStopCards(stopCards);

    console.log('⛽ FastPlannerApp: Fuel calculation complete. State updated.');

    // CRITICAL FIX: Force route display update when fuel/route stats change
    // This ensures the route line labels are updated with new time/fuel values
    // This logic was previously in the RouteCalculator callback, moving it here
    // to react to the centralized fuel calculation update.
    if (waypointManagerRef.current && enhancedResults) {
      console.log('⛽ Forcing route display update with new stats');
      console.log('⛽ Route stats for waypoint display:', {
        timeHours: enhancedResults.timeHours,
        estimatedTime: enhancedResults.estimatedTime,
        totalDistance: enhancedResults.totalDistance,
        legCount: enhancedResults.legs?.length || 0,
        windAdjusted: enhancedResults.windAdjusted || false
      });
      
      // DEBUG - Check time values exist in enhancedResults
      if (!enhancedResults.timeHours || enhancedResults.timeHours === 0 || !enhancedResults.estimatedTime || enhancedResults.estimatedTime === '00:00') {
        console.error('⚠️ CRITICAL: Missing time values in enhancedResults! This will cause display issues.');
        
        // If we have distance and aircraft, calculate time directly
        if (enhancedResults.totalDistance && parseFloat(enhancedResults.totalDistance) > 0 && selectedAircraft && selectedAircraft.cruiseSpeed) {
          console.log('⚠️ Calculating missing time values for display...');
          const totalDistance = parseFloat(enhancedResults.totalDistance);
          const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
          const hours = Math.floor(timeHours);
          const minutes = Math.floor((timeHours - hours) * 60);
          const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // Update the enhancedResults with the calculated time values
          enhancedResults.timeHours = timeHours;
          enhancedResults.estimatedTime = estimatedTime;
          
          console.log('⚠️ Fixed enhancedResults with calculated times:', {
            timeHours,
            estimatedTime
          });
        }
      }
      
      // Directly pass the enhancedResults to updateRoute without clearing first
      // This ensures the stats are used for the leg labels
      waypointManagerRef.current.updateRoute(enhancedResults);
      
      // Also update window.currentRouteStats to ensure it's available for map interactions
      window.currentRouteStats = enhancedResults;
      
      console.log('⛽ Route display updated with new stats');
    }

  }, [waypoints, selectedAircraft, flightSettings, weather]); // Dependencies for the effect


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

        // The centralized useEffect will handle updating routeStats and stopCards
        console.log('🔄 Route calculation complete. Triggering centralized fuel calculation...');
        // No need to update state or generate stop cards here anymore
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
        passengerWeight: flightSettings.passengerWeight, // Use flightSettings state
        contingencyFuelPercent: flightSettings.contingencyFuelPercent, // Use flightSettings state
        taxiFuel: flightSettings.taxiFuel, // Use flightSettings state
        reserveFuel: flightSettings.reserveFuel, // Use flightSettings state
        deckTimePerStop: flightSettings.deckTimePerStop, // Use flightSettings state
        deckFuelFlow: flightSettings.deckFuelFlow, // Use flightSettings state
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

        // Update individual settings (these individual states are being removed)
        // setPassengerWeight(settings.passengerWeight);
        // setContingencyFuelPercent(settings.contingencyFuelPercent);
        // setTaxiFuel(settings.taxiFuel);
        // setReserveFuel(settings.reserveFuel);
        // setDeckTimePerStop(settings.deckTimePerStop);
        // setDeckFuelFlow(settings.deckFuelFlow);
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
      setFlightSettings(flightSettings); // Set the entire flightSettings object from saved settings
      // Remove individual state updates from here
      // setPassengerWeight(flightSettings.passengerWeight);
      // setContingencyFuelPercent(flightSettings.contingencyFuelPercent);
      // setTaxiFuel(flightSettings.taxiFuel);
      // setReserveFuel(flightSettings.reserveFuel || 600); // Ensure we have a default value
      // setDeckTimePerStop(flightSettings.deckTimePerStop);
      // setDeckFuelFlow(flightSettings.deckFuelFlow);


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
          await addWaypoint(clickData); // addWaypoint will trigger the centralized calculation
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
          await addWaypoint(clickData); // addWaypoint will trigger the centralized calculation
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

          // Update the state - wait for it to complete
          await new Promise(resolve => {
            setWaypoints([...updatedWaypoints]); // Updating waypoints state will trigger the centralized useEffect
            setTimeout(resolve, 0);
          });

          // The centralized useEffect will handle recalculation
          console.log('🛣️ Waypoints updated. Centralized useEffect will recalculate fuel.');

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

          // Update the flightSettings state with saved settings
          setFlightSettings(prev => ({
            ...prev,
            passengerWeight: settings.passengerWeight ?? prev.passengerWeight,
            contingencyFuelPercent: settings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
            taxiFuel: settings.taxiFuel ?? prev.taxiFuel,
            reserveFuel: settings.reserveFuel ?? prev.reserveFuel,
            deckTimePerStop: settings.deckTimePerStop ?? prev.deckTimePerStop,
            deckFuelFlow: settings.deckFuelFlow ?? prev.deckFuelFlow,
            cargoWeight: settings.cargoWeight ?? prev.cargoWeight,
          }));

          // Remove individual state updates
          // if (settings.passengerWeight !== undefined) setPassengerWeight(settings.passengerWeight);
          // ... (removed)

          // Update AppSettingsManager if it exists
          if (appSettingsManagerRef.current) {
            appSettingsManagerRef.current.updateFlightSettings(settings);
          }

          // Recalculate route if needed (centralized useEffect will handle this)
          // if (selectedAircraft && waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
          //   ... (removed)
          // }

          // Force UI update (centralized useEffect should handle this via state updates)
          // setForceUpdate(prev => prev + 1);
        }
      } catch (error) {
        console.error(`Error saving settings for ${key}:`, error);
      }
    };

    // Add event listener for settings-changed to force UI update
    // This listener might become redundant if all settings changes go through updateFlightSetting
    // and the centralized useEffect handles UI updates. Review if this is still needed.
    const handleSettingsChanged = () => {
      console.log("Settings changed event received. Centralized useEffect should handle updates.");
      // The centralized useEffect hook should now handle the recalculation and UI update
      // based on changes to flightSettings state.
      // setForceUpdate(prev => prev + 1); // Remove force update here

      // Remove recalculation logic from here
      // if (waypointManagerRef.current && waypointManagerRef.current.getWaypoints().length >= 2) {
      //   ... (removed)
      // }
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
  }, [selectedAircraft, waypointManagerRef, routeCalculatorRef, weather, flightSettings]); // Added flightSettings to dependencies

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
          setWaypoints([...updatedWaypoints]); // Updating waypoints state will trigger the centralized useEffect

          // Remove recalculation logic from here
          // CRITICAL FIX: Always calculate basic distance regardless of aircraft selection
          // ... (removed)
        });

        waypointManagerRef.current.setCallback('onRouteUpdated', (routeData) => {
          console.log(`🗺️ Route updated with ${routeData.waypoints.length} waypoints`);

          // Remove recalculation logic from here
          // Always calculate basic distance even without an aircraft
          // ... (removed)
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

  // Use StopCardCalculator to generate stop cards data
  // This function has been refactored to use the StopCardCalculator module
  // instead of the inline implementation to ensure consistency in calculations


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
    
    // Force an immediate UI update
    setForceUpdate(prev => prev + 1);
    
    // CRITICAL: Manually recalculate the route with the new wind settings
    if (waypoints && waypoints.length >= 2 && selectedAircraft) {
      console.log('🌬️ Manually recalculating route with new wind settings...');
      
      try {
        // Step 1: Clear the route display
        if (waypointManagerRef.current) {
          waypointManagerRef.current.updateRoute(null);
        }
        
        // Verify WindCalculations is available globally
        if (!window.WindCalculations) {
          console.log('🌬️ Making WindCalculations available globally');
          window.WindCalculations = WindCalc;
        }
        
        // Step 2: Manually calculate with numeric settings
        const numericSettings = {
          passengerWeight: Number(flightSettings.passengerWeight),
          taxiFuel: Number(flightSettings.taxiFuel),
          contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent),
          reserveFuel: Number(flightSettings.reserveFuel),
          deckTimePerStop: Number(flightSettings.deckTimePerStop),
          deckFuelFlow: Number(flightSettings.deckFuelFlow),
          cargoWeight: Number(flightSettings.cargoWeight || 0)
        };
        
        console.log('🌬️ Using numeric settings for manual recalculation:', numericSettings);
        
        // Calculate with the new wind settings - use imported module directly
        const { enhancedResults, stopCards: newStopCards } = ComprehensiveFuelCalculator.calculateAllFuelData(
          waypoints,
          selectedAircraft,
          numericSettings,
          newWeather
        );
        
        if (enhancedResults) {
          console.log('🌬️ Manual calculation complete with wind settings:', newWeather);
          
          // CRITICAL: Ensure wind data is properly set in all necessary places
          enhancedResults.windAdjusted = true;
          
          // Set wind data in the main object
          enhancedResults.windData = {
            windSpeed: newWeather.windSpeed,
            windDirection: newWeather.windDirection,
            avgHeadwind: enhancedResults.windData?.avgHeadwind || 0
          };
          
          // Also ensure each leg has proper wind data
          if (enhancedResults.legs && enhancedResults.legs.length > 0) {
            enhancedResults.legs.forEach((leg, index) => {
              // Calculate headwind for each leg if missing
              if (leg.headwind === undefined) {
                // If WindCalculations is available, try to calculate headwind
                if (window.WindCalculations && leg.heading !== undefined) {
                  leg.headwind = window.WindCalculations.calculateHeadwindComponent(
                    newWeather.windSpeed, 
                    leg.heading, 
                    newWeather.windDirection
                  );
                  console.log(`🌬️ Added headwind data to leg ${index+1}: ${leg.headwind.toFixed(2)} knots`);
                }
              }
            });
          }
          
          console.log('🌬️ Recalculated time with wind effects:', {
            timeHours: enhancedResults.timeHours,
            estimatedTime: enhancedResults.estimatedTime,
            windAdjusted: enhancedResults.windAdjusted
          });
          
          // Update state with new calculations
          setRouteStats(enhancedResults);
          setStopCards(newStopCards);
          
          // Update global reference immediately
          window.currentRouteStats = enhancedResults;
          
          // Step 3: Update the route display with the recalculated stats
          setTimeout(() => {
            if (waypointManagerRef.current) {
              waypointManagerRef.current.updateRoute(enhancedResults);
            }
          }, 100);
        }
      } catch (error) {
        console.error('🌬️ Error in manual recalculation:', error);
        
        // Fallback: Update with current stats but with updated wind data
        if (window.currentRouteStats) {
          window.currentRouteStats.windAdjusted = true;
          window.currentRouteStats.windData = {
            windSpeed: newWeather.windSpeed,
            windDirection: newWeather.windDirection,
            avgHeadwind: window.currentRouteStats.windData?.avgHeadwind || 0
          };
          
          if (waypointManagerRef.current) {
            waypointManagerRef.current.updateRoute(window.currentRouteStats);
          }
        }
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
        setWaypoints([...updatedWaypoints]); // Updating waypoints state will trigger the centralized useEffect
        // Use setTimeout to ensure the state update has time to complete
        setTimeout(resolve, 0);
      });

      // The centralized useEffect will handle recalculation
      console.log('🌐 Waypoints updated. Centralized useEffect will recalculate fuel.');
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
        setWaypoints([...updatedWaypoints]); // Updating waypoints state will trigger the centralized useEffect

        // The centralized useEffect will handle recalculation
        console.log('FastPlannerApp: Waypoints updated. Centralized useEffect will recalculate fuel.');
      } else {
        // Clear route stats if we don't have enough waypoints
        setRouteStats(null);
      }
    }
  };

  const updateWaypointName = (index, name) => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.updateWaypointName(index, name);
      setWaypoints([...waypointManagerRef.current.getWaypoints()]); // Updating waypoints state will trigger the centralized useEffect
    }
  };

  const clearRoute = () => {
    if (waypointManagerRef.current) {
      waypointManagerRef.current.clearRoute();
      setWaypoints([]); // Updating waypoints state will trigger the centralized useEffect
      setRouteStats(null); // Also clear routeStats explicitly
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
      setWaypoints([...waypointManagerRef.current.getWaypoints()]); // Updating waypoints state will trigger the centralized useEffect

      // Remove recalculation logic from here
      // Recalculate route stats if we have at least 2 waypoints
      // ... (removed)
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
      setSelectedAircraft(aircraft); // Updating selectedAircraft state will trigger the centralized useEffect

      // CRITICAL: Make the selected aircraft globally available for API testing
      window.currentSelectedAircraft = aircraft;

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

            // Update the flightSettings state with saved settings
            setFlightSettings(prev => ({
              ...prev,
              passengerWeight: savedSettings.passengerWeight ?? prev.passengerWeight,
              contingencyFuelPercent: savedSettings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
              taxiFuel: savedSettings.taxiFuel ?? prev.taxiFuel,
              reserveFuel: savedSettings.reserveFuel ?? prev.reserveFuel,
              deckTimePerStop: savedSettings.deckTimePerStop ?? prev.deckTimePerStop,
              deckFuelFlow: savedSettings.deckFuelFlow ?? prev.deckFuelFlow,
              cargoWeight: savedSettings.cargoWeight ?? prev.cargoWeight,
            }));

            // Remove individual state updates
            // if (savedSettings.passengerWeight !== undefined) setPassengerWeight(savedSettings.passengerWeight);
            // ... (removed)

            // Update FlightCalculations module (if still needed, review later)
            // if (flightCalculationsRef.current) {
            //   flightCalculationsRef.current.updateConfig(updatedSettings);
            // }

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

              // Update the flightSettings state with type settings
              setFlightSettings(prev => ({
                ...prev,
                passengerWeight: typeSettings.passengerWeight ?? prev.passengerWeight,
                contingencyFuelPercent: typeSettings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
                taxiFuel: typeSettings.taxiFuel ?? prev.taxiFuel,
                reserveFuel: typeSettings.reserveFuel ?? prev.reserveFuel,
                deckTimePerStop: typeSettings.deckTimePerStop ?? prev.deckTimePerStop,
                deckFuelFlow: typeSettings.deckFuelFlow ?? prev.deckFuelFlow,
                cargoWeight: typeSettings.cargoWeight ?? prev.cargoWeight,
              }));

              // Remove individual state updates
              // if (typeSettings.passengerWeight !== undefined) setPassengerWeight(typeSettings.passengerWeight);
              // ... (removed)

              // Update FlightCalculations module (if still needed, review later)
              // if (flightCalculationsRef.current) {
              //   flightCalculationsRef.current.updateConfig(updatedSettings);
              // }

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

      // Recalculate route if we have waypoints (centralized useEffect will handle this)
      // if (aircraft && waypointManagerRef.current) {
      //   ... (removed)
      // }
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

  // No longer need to extract fuel data from stop cards
  // StopCardCalculator will be used directly by RouteStatsCard
  // This simplifies the data flow and ensures consistency in calculations

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
        // Pass individual flight settings from the flightSettings state object
        deckTimePerStop={flightSettings.deckTimePerStop}
        // deckFuelPerStop={deckFuelPerStop} // This individual state is removed
        deckFuelFlow={flightSettings.deckFuelFlow}
        passengerWeight={flightSettings.passengerWeight}
        cargoWeight={flightSettings.cargoWeight}
        taxiFuel={flightSettings.taxiFuel}
        contingencyFuelPercent={flightSettings.contingencyFuelPercent}
        reserveFuel={flightSettings.reserveFuel}
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
        onClearRoute={clearRoute}
        onToggleChart={togglePlatformsVisibility}
        chartsVisible={platformsVisible}
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
        // Flight settings props - Pass values from flightSettings state
        deckTimePerStop={flightSettings.deckTimePerStop}
        // deckFuelPerStop={deckFuelPerStop} // This individual state is removed
        deckFuelFlow={flightSettings.deckFuelFlow}
        passengerWeight={flightSettings.passengerWeight}
        cargoWeight={flightSettings.cargoWeight}
        taxiFuel={flightSettings.taxiFuel}
        contingencyFuelPercent={flightSettings.contingencyFuelPercent}
        reserveFuel={flightSettings.reserveFuel}
        reserveMethod={reserveMethod} // Keep reserveMethod if used for UI only
        onDeckTimeChange={(value) => updateFlightSetting('deckTimePerStop', value)}
        // onDeckFuelChange={(value) => updateFlightSetting('deckFuelPerStop', value)} // Keep handler for now, review if needed
        onDeckFuelFlowChange={(value) => updateFlightSetting('deckFuelFlow', value)}
        onPassengerWeightChange={(value) => updateFlightSetting('passengerWeight', value)}
        onCargoWeightChange={(value) => updateFlightSetting('cargoWeight', value)}
        onTaxiFuelChange={(value) => updateFlightSetting('taxiFuel', value)}
        onContingencyFuelPercentChange={(value) => updateFlightSetting('contingencyFuelPercent', value)}
        onReserveMethodChange={(value) => updateFlightSetting('reserveMethod', value)} // Keep handler if used for UI only
        onReserveFuelChange={(value) => updateFlightSetting('reserveFuel', value)} // Add handler for reserveFuel
        forceUpdate={forceUpdate} // Keep forceUpdate if used for UI refresh
        // Additional props - Remove individual payloadWeight and reserveFuel props
        // payloadWeight={payloadWeight}
        // onPayloadWeightChange={setPayloadWeight}
        // reserveFuel={reserveFuel}
        // onReserveFuelChange={setReserveFuel}
        // Weather props
        weather={weather}
        onWeatherUpdate={updateWeatherSettings}
      />
    </div>
  );
};

export default FastPlannerApp;
