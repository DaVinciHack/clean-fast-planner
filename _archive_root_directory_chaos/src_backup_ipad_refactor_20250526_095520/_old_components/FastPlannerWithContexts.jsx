import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import Context Providers
import { 
  RegionProvider, 
  useRegion,
  AircraftProvider,
  useAircraft,
  RouteProvider,
  useRoute,
  MapProvider,
  useMap
} from './context';

// Import other necessary managers
import { 
  FavoriteLocationsManager,
  MapManager,
  PlatformManager
} from './modules';

// Import UI components directly
import LeftPanel from './components/panels/LeftPanel';
import RightPanel from './components/panels/RightPanel';
import MapComponent from './components/map/MapComponent';
import RouteStatsCard from './components/flight/RouteStatsCard';

// Import debugging tools
import DebugPanel from './DebugPanel';
import LoadingStatusDisplay from './LoadingStatusDisplay';

/**
 * AllContextsAwareComponent
 * Inner component that uses all contexts
 */
const AllContextsAwareComponent = () => {
  // Get data from contexts
  const { regions, currentRegion, regionLoading, changeRegion } = useRegion();
  
  const { 
    aircraftType, aircraftRegistration, selectedAircraft, aircraftsByType, aircraftLoading,
    changeAircraftType, changeAircraftRegistration, flightSettings,
    setDeckTimePerStop, setDeckFuelPerStop, setDeckFuelFlow, 
    setPassengerWeight, setCargoWeight, setTaxiFuel, 
    setContingencyFuelPercent, setReserveMethod, 
    setPayloadWeight, setReserveFuel
  } = useAircraft();
  
  const {
    waypoints, routeInput, routeStats, 
    addWaypoint, removeWaypoint, updateWaypointName, clearRoute,
    handleRouteInputChange
  } = useRoute();
  
  const {
    mapReady, platformsVisible, platformsLoaded, rigsLoading, rigsError,
    togglePlatformsVisibility, loadCustomChart, reloadPlatformData,
    mapManager
  } = useMap();
  
  // Core modules refs (that aren't managed by contexts)
  const favoriteLocationsManagerRef = useRef(new FavoriteLocationsManager());
  
  // UI state
  const [forceUpdate, setForceUpdate] = useState(0);
  const [airportData, setAirportData] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Log context changes for debugging
  useEffect(() => {
    console.log('Region changed:', currentRegion?.name);
  }, [currentRegion]);

  useEffect(() => {
    console.log('Aircraft changed:', selectedAircraft?.registration);
  }, [selectedAircraft]);
  
  useEffect(() => {
    console.log('Waypoints changed:', waypoints.length);
  }, [waypoints]);
  
  useEffect(() => {
    console.log('Route stats updated:', routeStats);
  }, [routeStats]);

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
  
  // Simple stubs for handlers not covered by contexts
  const handleAddFavoriteLocation = () => console.log("handleAddFavoriteLocation");
  const handleRemoveFavoriteLocation = () => console.log("handleRemoveFavoriteLocation");
  
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
        deckTimePerStop={flightSettings.deckTimePerStop}
        deckFuelPerStop={flightSettings.deckFuelPerStop}
        passengerWeight={flightSettings.passengerWeight}
        cargoWeight={flightSettings.cargoWeight}
      />
      
      {/* Map Component */}
      <MapComponent
        mapManagerRef={{ current: mapManager }}
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
        rigsLoading={rigsLoading}
        // Flight settings props
        deckTimePerStop={flightSettings.deckTimePerStop}
        deckFuelPerStop={flightSettings.deckFuelPerStop}
        deckFuelFlow={flightSettings.deckFuelFlow}
        passengerWeight={flightSettings.passengerWeight}
        cargoWeight={flightSettings.cargoWeight}
        taxiFuel={flightSettings.taxiFuel}
        contingencyFuelPercent={flightSettings.contingencyFuelPercent}
        reserveMethod={flightSettings.reserveMethod}
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
        payloadWeight={flightSettings.payloadWeight}
        onPayloadWeightChange={setPayloadWeight}
        reserveFuel={flightSettings.reserveFuel}
        onReserveFuelChange={setReserveFuel}
      />
    </div>
  );
};

/**
 * MapAwareComponent
 * Component that wraps with MapContext
 */
const MapAwareComponent = () => {
  const { currentRegion } = useRegion();
  
  return (
    <MapProvider client={client} currentRegion={currentRegion}>
      <AllContextsAwareComponent />
    </MapProvider>
  );
};

/**
 * RouteAwareComponent
 * Component that wraps with RouteContext
 */
const RouteAwareComponent = () => {
  const { selectedAircraft } = useAircraft();
  
  return (
    <RouteProvider aircraftData={selectedAircraft}>
      <MapAwareComponent />
    </RouteProvider>
  );
};

/**
 * AircraftAwareComponent
 * Component that wraps with AircraftContext
 */
const AircraftAwareComponent = () => {
  const { currentRegion } = useRegion();
  
  return (
    <AircraftProvider client={client} currentRegion={currentRegion}>
      <RouteAwareComponent />
    </AircraftProvider>
  );
};

/**
 * FastPlannerWithContexts Component
 * Main component that wraps everything with the MapContext first, then RegionContext
 */
const FastPlannerWithContexts = () => {
  const { isAuthenticated, userName, login } = useAuth();
  
  // Create manager instances at the top level
  const [mapManager] = useState(() => new MapManager());
  const [platformManager] = useState(() => new PlatformManager(mapManager));

  // Debug auth status
  useEffect(() => {
    console.log('FastPlannerWithContexts: Auth status -', isAuthenticated ? 'Authenticated' : 'Not authenticated');
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
        // IMPORTANT: Changed the order - MapProvider first, then RegionProvider
        <MapProvider client={client} mapManager={mapManager} platformManager={platformManager}>
          <RegionProvider client={client} mapManager={mapManager} platformManager={platformManager}>
            <AircraftAwareComponent />
          </RegionProvider>
        </MapProvider>
      )}
    </div>
  );
};

export default FastPlannerWithContexts;