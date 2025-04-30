import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import our modular components
import { MapManager, WaypointManager, PlatformManager, RouteCalculator, RegionManager, FavoriteLocationsManager, AircraftManager } from './modules';
import { LeftPanel, RightPanel, MapComponent, RegionSelector, RouteStatsCard, FlightSettings } from './components';
import FlightCalculations from './modules/calculations/FlightCalculations';

/**
 * Modular Fast Planner Component
 * 
 * A refactored version of FastPlannerComponent that uses modular architecture
 * for better maintainability and easier future enhancements.
 */
const ModularFastPlannerComponent = () => {
  const { isAuthenticated, userDetails, userName, login } = useAuth();
  
  // Core modules refs
  const mapManagerRef = useRef(null);
  const waypointManagerRef = useRef(null);
  const platformManagerRef = useRef(null);
  const routeCalculatorRef = useRef(null);
  const regionManagerRef = useRef(null);
  const favoriteLocationsManagerRef = useRef(null);
  const aircraftManagerRef = useRef(null); 
  const flightCalculationsRef = useRef(null); // Add reference for FlightCalculations

  
  // UI state
  const [forceUpdate, setForceUpdate] = useState(0); // Used to force component rerender
  const [routeInput, setRouteInput] = useState('');
  const [airportData, setAirportData] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]); // Add state for favorite locations
  const [leftPanelVisible, setLeftPanelVisible] = useState(false); // Start with left panel closed
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
  const [aircraftType, setAircraftType] = useState(''); // Start with empty selection
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  
  // Add a third field to store the selected aircraft independently of the dropdowns
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState(['S92', 'S76', 'S76D', 'AW139', 'AW189', 'H175', 'H160', 'EC135', 'EC225', 'AS350', 'A119']);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [payloadWeight, setPayloadWeight] = useState(2000);
  const [reserveFuel, setReserveFuel] = useState(600);
  const [routeStats, setRouteStats] = useState(null);
  
  // Flight calculation settings
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220, // lbs per passenger including baggage
    contingencyFuelPercent: 10, // 10% contingency fuel
    taxiFuel: 50, // lbs
    reserveFuel: 600, // lbs
    deckTimePerStop: 5, // minutes
    deckFuelFlow: 400, // lbs per hour during deck operations
  });
  
  // Maintain backwards compatibility with existing code
  const [deckTimePerStop, setDeckTimePerStop] = useState(5); 
  const [deckFuelPerStop, setDeckFuelPerStop] = useState(100);
  const [deckFuelFlow, setDeckFuelFlow] = useState(400); // lbs per hour during deck operations
  const [passengerWeight, setPassengerWeight] = useState(220);
  const [cargoWeight, setCargoWeight] = useState(0);
  const [taxiFuel, setTaxiFuel] = useState(50); // lbs of taxi fuel
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10); // % of trip fuel
  const [reserveMethod, setReserveMethod] = useState('fixed');
  
  /**
   * Unified function to handle flight settings changes
   * Updates both individual state variables and the flight calculations module
   */
  const handleFlightSettingChange = (settingName, value) => {
    console.log(`Updating flight setting: ${settingName} = ${value}`);
    
    // Update individual state variables (for backward compatibility)
    switch (settingName) {
      case 'passengerWeight':
        setPassengerWeight(value);
        break;
      case 'reserveFuel':
        setReserveFuel(value);
        break;
      case 'deckTimePerStop':
        setDeckTimePerStop(value);
        break;
      case 'deckFuelFlow':
        setDeckFuelFlow(value);
        break;
      case 'taxiFuel':
        setTaxiFuel(value);
        break;
      case 'contingencyFuelPercent':
        setContingencyFuelPercent(value);
        break;
      default:
        console.warn(`Unknown setting: ${settingName}`);
        break;
    }
    
    // Update the flightSettings object
    setFlightSettings(prevSettings => ({
      ...prevSettings,
      [settingName]: value
    }));
    
    // Update the flight calculations module if it exists
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        [settingName]: value
      });
      console.log(`Updated FlightCalculations module with ${settingName}: ${value}`);
    }
    
    // Recalculate route stats if a route exists
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      console.log(`Recalculating route with updated ${settingName}`);
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };

  // Update the existing handler functions to use the unified handler
  const handlePassengerWeightChange = (weight) => {
    handleFlightSettingChange('passengerWeight', weight);
  };

  const handleReserveFuelChange = (fuel) => {
    handleFlightSettingChange('reserveFuel', fuel);
  };

  const handleDeckTimeChange = (time) => {
    handleFlightSettingChange('deckTimePerStop', time);
  };

  const handleDeckFuelFlowChange = (fuelFlow) => {
    handleFlightSettingChange('deckFuelFlow', fuelFlow);
  };

  const handleTaxiFuelChange = (fuel) => {
    handleFlightSettingChange('taxiFuel', fuel);
  };

  const handleContingencyFuelPercentChange = (percent) => {
    handleFlightSettingChange('contingencyFuelPercent', percent);
  };

  // This function should be called when using the calculateRouteStats function
  // to ensure the most current settings are used
  const syncFlightCalculator = () => {
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent
      });
      console.log("Synchronized all flight settings with calculator");
    }
  };
  
  // Calculate route statistics using the enhanced FlightCalculations module
  const calculateRouteStats = (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
      setRouteStats(null);
      return null;
    }
    
    // Ensure flight calculator is initialized
    if (!flightCalculationsRef.current) {
      flightCalculationsRef.current = new FlightCalculations();
    }
    
    // Sync all current flight settings with the calculator
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight: payloadWeight + cargoWeight
      });
      console.log("Synchronized all flight settings with calculator");
    }
    
    // Use S92 as default type if no type is selected
    let calculationAircraftType = aircraftType || 'S92';
    
    // If we have a selected aircraft from the third field, use that data
    if (selectedAircraft) {
      calculationAircraftType = selectedAircraft.modelType || 'S92';
    }
    
    // Create aircraft data object for calculations
    let aircraftData;
    
    if (selectedAircraft) {
      // Use selected aircraft data with fallbacks
      aircraftData = {
        // Use correct field names with fallbacks
        cruiseSpeed: selectedAircraft.cruiseSpeed || selectedAircraft.cruseSpeed || 145,
        fuelBurn: selectedAircraft.fuelBurn || 1100,
        maxFuelCapacity: selectedAircraft.maxFuel || selectedAircraft.maxFuelCapacity || 5000,
        dryOperatingWeightLbs: selectedAircraft.dryOperatingWeightLbs || 15000,
        usefulLoad: selectedAircraft.usefulLoad || 7000,
        maxPassengers: selectedAircraft.maxPassengers || 19,
        // Include all other properties
        ...selectedAircraft
      };
    } else if (routeCalculatorRef.current) {
      // Get default aircraft data from RouteCalculator if no aircraft selected
      const defaultAircraft = routeCalculatorRef.current.getAircraftType(calculationAircraftType.toLowerCase());
      aircraftData = {
        cruiseSpeed: defaultAircraft.cruiseSpeed,
        fuelBurn: defaultAircraft.fuelBurn,
        maxFuelCapacity: defaultAircraft.maxFuel,
        dryOperatingWeightLbs: defaultAircraft.emptyWeight,
        usefulLoad: defaultAircraft.usefulLoad || 7000,
        maxPassengers: defaultAircraft.maxPassengers || 19,
        modelType: calculationAircraftType
      };
    } else {
      // Fallback to basic defaults if no data source available
      aircraftData = {
        cruiseSpeed: 145,
        fuelBurn: 1100,
        maxFuelCapacity: 5000,
        dryOperatingWeightLbs: 15000,
        usefulLoad: 7000,
        maxPassengers: 19,
        modelType: calculationAircraftType
      };
    }
    
    console.log("Calculating route stats with aircraft data:", {
      type: calculationAircraftType,
      cruiseSpeed: aircraftData.cruiseSpeed,
      fuelBurn: aircraftData.fuelBurn
    });
    
    // Calculate with the enhanced flight calculations module
    const stats = flightCalculationsRef.current.calculateFlightStats(
      coordinates, 
      aircraftData,
      { 
        payloadWeight: payloadWeight + cargoWeight
        // No need to pass other settings as they've been synced already
      }
    );
    
    // Update route stats state
    setRouteStats(stats);
    
    // Store route stats globally for access by WaypointManager
    window.currentRouteStats = stats;
    
    return stats;
  };
  
  // Ensure flight calculation settings are synchronized with the module
  useEffect(() => {
    if (flightCalculationsRef.current) {
      // Sync all state values to the calculator when they change
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent
      });
      
      console.log("Flight calculation settings synchronized with calculator module");
      
      // Recalculate route if we have waypoints
      const wps = waypointManagerRef.current?.getWaypoints() || [];
      if (wps.length >= 2) {
        const coordinates = wps.map(wp => wp.coords);
        calculateRouteStats(coordinates);
      }
    }
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent]);
