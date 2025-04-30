import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import our context providers and hooks
import {
  RegionProvider,
  AircraftProvider,
  RouteProvider,
  MapProvider,
  useRegion,
  useAircraft,
  useRoute,
  useMap
} from './context';

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent
} from './components';

// Import favorites manager
import { FavoriteLocationsManager } from './modules';

/**
 * FastPlannerApp Component
 * 
 * Main component for the Fast Planner application using context providers
 * for state management and modular architecture for better maintainability.
 */
const FastPlannerApp = () => {
  return (
    <div className="fast-planner-container">
      {/* Context Providers - Nested to allow dependencies between them */}
      <RegionProvider client={client}>
        <AircraftContextWrapper client={client} />
      </RegionProvider>
    </div>
  );
};
};

/**
 * AircraftContextWrapper Component
 * 
 * Access the RegionContext and passes it to the AircraftProvider
 */
const AircraftContextWrapper = ({ client }) => {
  const { currentRegion } = useRegion();
  
  return (
    <AircraftProvider client={client} currentRegion={currentRegion}>
      <MapContextWrapper client={client} currentRegion={currentRegion} />
    </AircraftProvider>
  );
};

/**
 * MapContextWrapper Component
 * 
 * Access the AircraftContext and passes it to the MapProvider
 */
const MapContextWrapper = ({ client, currentRegion }) => {
  const { selectedAircraft } = useAircraft();
  
  return (
    <MapProvider client={client} currentRegion={currentRegion}>
      <RouteProvider aircraftData={selectedAircraft}>
        <FastPlannerContent />
      </RouteProvider>
    </MapProvider>
  );
};
};

/**
 * FastPlannerContent Component
 * 
 * Contains the actual application content, using context hooks for data
 */
const FastPlannerContent = () => {
  // Access auth context
  const { isAuthenticated, userName, login } = useAuth();
  
  // Access context data from providers
  const { regions, currentRegion, regionLoading, changeRegion } = useRegion();
  const { 
    selectedAircraft, 
    flightSettings,
    aircraftType,
    aircraftRegistration,
    aircraftsByType,
    aircraftLoading,
    changeAircraftType,
    changeAircraftRegistration
  } = useAircraft();
  const { 
    waypoints, 
    routeStats, 
    routeInput, 
    addWaypoint, 
    removeWaypoint, 
    updateWaypointName, 
    clearRoute,
    handleRouteInputChange 
  } = useRoute();
  const { 
    platformsVisible, 
    togglePlatformsVisibility, 
    loadCustomChart, 
    reloadPlatformData, 
    rigsLoading,
    mapManager
  } = useMap();
  
  // Local state for UI
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Refs
  const mapManagerRef = useRef(mapManager);
  const favoriteLocationsManagerRef = useRef(null);
  
  // Favorite locations state
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  
  // Initialize favorite locations manager
  useEffect(() => {
    if (!favoriteLocationsManagerRef.current) {
      favoriteLocationsManagerRef.current = new FavoriteLocationsManager();
      
      // Set up callbacks
      favoriteLocationsManagerRef.current.setCallback('onFavoritesLoaded', (favorites) => {
        setFavoriteLocations(favorites);
      });
      
      favoriteLocationsManagerRef.current.setCallback('onFavoriteAdded', (favorites) => {
        setFavoriteLocations(favorites);
      });
      
      favoriteLocationsManagerRef.current.setCallback('onFavoriteRemoved', (favorites) => {
        setFavoriteLocations(favorites);
      });
      
      // Load favorites from storage
      favoriteLocationsManagerRef.current.loadFavorites();
    }
  }, []);
  
  // Handler for map initialization
  const handleMapReady = (mapInstance) => {
    console.log('Map is ready:', mapInstance);
  };
  
  // Panel visibility handlers
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };
  
  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };
  
  // Favorite locations handlers
  const handleAddFavoriteLocation = (location) => {
    if (favoriteLocationsManagerRef.current) {
      favoriteLocationsManagerRef.current.addFavorite(location);
    }
  };
  
  const handleRemoveFavoriteLocation = (locationId) => {
    if (favoriteLocationsManagerRef.current) {
      favoriteLocationsManagerRef.current.removeFavorite(locationId);
    }
  };
  
  return (
    <>
      {/* Loading Overlay */}
      <div id="loading-overlay" className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-message">Loading...</div>
      </div>
      
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
        isAuthenticated={isAuthenticated}
        authUserName={userName}
        rigsLoading={rigsLoading}
        onLogin={login}
        regions={regions}
        currentRegion={currentRegion}
        onRegionChange={changeRegion}
        regionLoading={regionLoading}
        {...flightSettings}
      />
    </>
  );
};

export default FastPlannerApp;