import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import Context Providers
import { RegionProvider, useRegion } from './context';

// Import other necessary managers
import { 
  MapManager,
  WaypointManager, 
  PlatformManager, 
  RouteCalculator, 
  AircraftManager, 
  FavoriteLocationsManager 
} from './modules';

// Import UI components directly
import LeftPanel from './components/panels/LeftPanel';
import RightPanel from './components/panels/RightPanel';
import MapComponent from './components/map/MapComponent';
import RouteStatsCard from './components/flight/RouteStatsCard';

/**
 * RegionAwareComponent
 * Inner component that uses the RegionContext
 */
const RegionAwareComponent = () => {
  const { regions, currentRegion, regionLoading, changeRegion } = useRegion();
  
  // Core modules refs
  const mapManagerRef = useRef(new MapManager());
  const waypointManagerRef = useRef(new WaypointManager());
  const platformManagerRef = useRef(new PlatformManager());
  const routeCalculatorRef = useRef(new RouteCalculator());
  const favoriteLocationsManagerRef = useRef(new FavoriteLocationsManager());
  const aircraftManagerRef = useRef(new AircraftManager());
  
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
  const [deckTimePerStop, setDeckTimePerStop] = useState(5); 
  const [deckFuelPerStop, setDeckFuelPerStop] = useState(100);
  const [deckFuelFlow, setDeckFuelFlow] = useState(400);
  const [passengerWeight, setPassengerWeight] = useState(220);
  const [cargoWeight, setCargoWeight] = useState(0);
  const [taxiFuel, setTaxiFuel] = useState(50);
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10);
  const [reserveMethod, setReserveMethod] = useState('fixed');
  
  // Log region changes
  useEffect(() => {
    console.log('RegionAwareComponent: currentRegion changed:', currentRegion);
    
    // If region changes, update the map view
    if (currentRegion && mapManagerRef.current) {
      const map = mapManagerRef.current.getMap();
      if (map) {
        console.log('Updating map view for region:', currentRegion.name);
      }
    }
  }, [currentRegion]);

  // Map initialization handler
  const handleMapReady = (mapInstance) => {
    console.log("Map is ready", mapInstance);
    
    // When map is ready, set the default region if available
    if (regions.length > 0 && !currentRegion) {
      console.log('Setting default region after map is ready');
      const defaultRegion = regions.find(r => r.id === 'gulf-of-mexico') || regions[0];
      changeRegion(defaultRegion.id);
    }
  };
  
  // Panel visibility handlers
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };
  
  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };
  
  // Route input handler
  const handleRouteInputChange = (value) => {
    setRouteInput(value);
  };
  
  // Simple stubs for required handlers
  const addWaypoint = () => console.log("addWaypoint");
  const removeWaypoint = () => console.log("removeWaypoint");
  const updateWaypointName = () => console.log("updateWaypointName");
  const clearRoute = () => console.log("clearRoute");
  const handleAddFavoriteLocation = () => console.log("handleAddFavoriteLocation");
  const handleRemoveFavoriteLocation = () => console.log("handleRemoveFavoriteLocation");
  const togglePlatformsVisibility = () => console.log("togglePlatformsVisibility");
  const loadCustomChart = () => console.log("loadCustomChart");
  const reloadPlatformData = () => console.log("reloadPlatformData");
  const changeAircraftType = () => console.log("changeAircraftType");
  const changeAircraftRegistration = () => console.log("changeAircraftRegistration");
  
  return (
    <div className="fast-planner-container">
      {/* Loading Overlay */}
      <div id="loading-overlay" className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-message">Loading...</div>
      </div>
      
      {/* Route Stats Card Component */}
      <RouteStatsCard 
        routeStats={routeStats}
        selectedAircraft={selectedAircraft}
        waypoints={waypoints}
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
      />
      
      {/* Map Component */}
      <MapComponent
        mapManagerRef={mapManagerRef}
        onMapReady={handleMapReady}
      />
      
      {/* Left Panel (Route Editor) */}
      <LeftPanel
        visible={leftPanelVisible}
        onToggleVisibility={toggleLeftPanel}
        waypoints={waypoints}
        onRemoveWaypoint={removeWaypoint}
        onWaypointNameChange={updateWaypointName}
        onAddWaypoint={addWaypoint}
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
        onRegionChange={changeRegion}
        regions={regions}
        currentRegion={currentRegion}
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
        onDeckTimeChange={setDeckTimePerStop}
        onDeckFuelChange={setDeckFuelPerStop}
        onDeckFuelFlowChange={setDeckFuelFlow}
        onPassengerWeightChange={setPassengerWeight}
        onCargoWeightChange={setCargoWeight}
        onTaxiFuelChange={setTaxiFuel}
        onContingencyFuelPercentChange={setContingencyFuelPercent}
        onReserveMethodChange={setReserveMethod}
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

/**
 * FastPlannerWithRegionContext Component
 * Main component that wraps everything with the RegionContext
 */
const FastPlannerWithRegionContext = () => {
  const { isAuthenticated, userName, login } = useAuth();

  // Debug auth status
  useEffect(() => {
    console.log('FastPlannerWithRegionContext: Auth status -', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    if (isAuthenticated) {
      console.log('User:', userName);
    }
  }, [isAuthenticated, userName]);
  
  return (
    <div className="fast-planner-container">
      {/* Authentication Check */}
      {!isAuthenticated ? (
        <div id="loading-overlay" className="loading-overlay">
          <div>
            <div>Not connected to Palantir Foundry</div>
            <button 
              onClick={login} 
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Connect to Palantir
            </button>
          </div>
        </div>
      ) : (
        // Wrap with RegionContext when authenticated
        <RegionProvider client={client}>
          <RegionAwareComponent />
        </RegionProvider>
      )}
    </div>
  );
};

export default FastPlannerWithRegionContext;