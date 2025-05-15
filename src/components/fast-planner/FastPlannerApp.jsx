// Import React and necessary hooks
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';
import './modules/waypoints/waypoint-styles.css';
import './fixes/route-stats-card-fix.css'; // Keep CSS fixes
import './fixes/panel-interaction-fix.css'; // Keep CSS fixes

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  RouteStatsCard
} from './components';

// Import MapZoomHandler for waypoint display
import MapZoomHandler from './components/map/MapZoomHandler';

// Import ModeHandler for backup
import ModeHandler from './modules/waypoints/ModeHandler';

// Import Region Context Provider
import { RegionProvider } from './context/region';

// Import custom hooks
import useManagers from './hooks/useManagers';
import useWeather from './hooks/useWeather';
import useAircraft from './hooks/useAircraft';
import useWaypoints from './hooks/useWaypoints';
import useRouteCalculation from './hooks/useRouteCalculation';
import useUIControls from './hooks/useUIControls';

/**
 * FastPlannerApp Component
 *
 * Main component that orchestrates the Fast Planner application
 */
const FastPlannerApp = () => {
  const { isAuthenticated, userName, login } = useAuth();
  
  useEffect(() => {
    const removeDebugUI = () => {
      const debugSelectors = [
        '.debug-popup', 
        '.fix-applied-popup',
        '#status-indicator-container'
      ];
      debugSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(element => element.remove());
        }
      });
    };
    removeDebugUI();
    const cleanupInterval = setInterval(removeDebugUI, 3000);
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // Initialize core state
  const [forceUpdate, setForceUpdate] = useState(0);
  const [routeInput, setRouteInput] = useState('');
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [stopCards, setStopCards] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [reserveMethod, setReserveMethod] = useState('fixed');
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });

  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220,
    contingencyFuelPercent: 5,
    taxiFuel: 50,
    reserveFuel: 600,
    deckTimePerStop: 5,
    deckFuelFlow: 400,
    cargoWeight: 0,
  });

  // Create the addWaypointDirect function before using it
  // It will be defined and filled later once we have the refs
  const addWaypointDirect = async (waypointData) => {
    if (!waypointManagerRef || !waypointManagerRef.current) {
      console.error('Cannot add waypoint: No waypoint manager ref');
      return;
    }
    // Actual implementation will be defined below
  };

  // Initialize all managers with custom hook
  // This hook populates the manager refs (mapManagerRef, waypointManagerRef, etc.)
  const {
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
  } = useManagers({
    client,
    setFavoriteLocations,
    setWaypoints,
    flightSettings,
    setFlightSettings,
    forceUpdate,
    setForceUpdate,
    addWaypoint: addWaypointDirect,
    weather,
    setWeather
  });

  // Aircraft management hooks
  const {
    aircraftType,
    setAircraftType,
    aircraftRegistration, 
    setAircraftRegistration,
    selectedAircraft,
    setSelectedAircraft,
    aircraftList,
    aircraftTypes,
    aircraftsByType,
    aircraftLoading,
    setAircraftLoading,
    changeAircraftType,
    changeAircraftRegistration,
    setAircraftManagers,
    setCurrentAircraftRegion
  } = useAircraft({
    aircraftManagerRef,
    appSettingsManagerRef,
    setFlightSettings
  });
  
  // Set manager refs in aircraft hook after useManagers has populated them
  useEffect(() => {
    if (aircraftManagerRef.current && appSettingsManagerRef.current) {
      setAircraftManagers(aircraftManagerRef.current, appSettingsManagerRef.current);
    }
  }, [aircraftManagerRef, appSettingsManagerRef, setAircraftManagers]);

  // Setup event listener for region changes
  useEffect(() => {
    const handleRegionChange = (event) => {
      if (event.detail && event.detail.region) {
        console.log(`FastPlannerApp: Received region change event: ${event.detail.region.name}`);
        setCurrentAircraftRegion(event.detail.region);
      }
    };
    
    // Add event listener
    window.addEventListener('region-changed', handleRegionChange);
    
    // Clean up
    return () => {
      window.removeEventListener('region-changed', handleRegionChange);
    };
  }, [setCurrentAircraftRegion]);

  // Now define the real implementation of addWaypointDirect
  // using the populated refs from useManagers
  // This function needs waypointManagerRef and platformManagerRef, which come from useManagers
  const addWaypointDirectImpl = async (waypointData) => {
    console.log('🔧 Using direct addWaypoint implementation');
    // Refs are populated by useManagers, check if they exist
    if (!waypointManagerRef.current) {
      console.error('Cannot add waypoint: No waypoint manager ref');
      return;
    }
    if (!platformManagerRef.current && typeof waypointData === 'string') {
        // platformManagerRef is only strictly needed if waypointData is a string name to search
        console.warn('Platform manager ref not available for name lookup, proceeding if coordinates are provided.');
    }
    
    let coords, name, isWaypoint = false;
    console.log('🌐 Direct: Adding waypoint with data:', waypointData);

    if (Array.isArray(waypointData)) {
      coords = waypointData;
      name = null;
    } else if (typeof waypointData === 'string') {
      console.log(`🌐 Looking for location with name: ${waypointData}`);
      if (platformManagerRef.current) {
        const platform = platformManagerRef.current.findPlatformByName(waypointData);
        if (platform) {
          coords = platform.coordinates;
          name = platform.name;
        } else {
          if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Platform "${waypointData}" not found.`, 'error');
          return;
        }
      } else {
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Platform lookup unavailable.`, 'error');
        return; 
      }
    } else if (waypointData && typeof waypointData === 'object') {
      if (waypointData.isWaypoint === true) isWaypoint = true;
      
      if (platformManagerRef.current && waypointData.lngLat) {
        const { lat, lng } = waypointData.lngLat;
        if (window.isWaypointModeActive === true && !waypointData.nearestWaypoint && typeof platformManagerRef.current.findNearestOsdkWaypoint === 'function') {
          const nearestWp = platformManagerRef.current.findNearestOsdkWaypoint(lat, lng, 5);
          if (nearestWp) waypointData.nearestWaypoint = nearestWp;
        }
        if (!waypointData.nearestRig && typeof platformManagerRef.current.findNearestPlatform === 'function') {
          const nearestRig = platformManagerRef.current.findNearestPlatform(lat, lng, 5);
          if (nearestRig && nearestRig.distance <= 5) waypointData.nearestRig = nearestRig;
        }
      }
      
      if (window.isWaypointModeActive === true && waypointData.nearestWaypoint && waypointData.nearestWaypoint.distance <= 5) {
        coords = waypointData.nearestWaypoint.coordinates;
        name = waypointData.nearestWaypoint.name;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to waypoint: ${name}`, 'success', 2000);
      } else if (waypointData.coordinates) {
        coords = waypointData.coordinates;
      } else if (waypointData.coords) {
        coords = waypointData.coords;
      } else if (waypointData.lngLat) {
        coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
      }
      
      if (!window.isWaypointModeActive && waypointData.nearestRig && waypointData.nearestRig.distance <= 5) {
        if (waypointData.nearestRig.coordinates) coords = waypointData.nearestRig.coordinates;
        else if (waypointData.nearestRig.coords) coords = waypointData.nearestRig.coords;
        else if (waypointData.nearestRig.lng !== undefined && waypointData.nearestRig.lat !== undefined) coords = [waypointData.nearestRig.lng, waypointData.nearestRig.lat];
        name = waypointData.nearestRig.name;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to ${name}`, 'success', 2000);
      } else if (!coords) {
        console.error('Invalid waypoint data format - no coordinates:', waypointData);
        return;
      }
      
      if (!name) {
        if (waypointData.name) name = waypointData.name;
        else if (waypointData.platformName) name = waypointData.platformName;
        else if (waypointData.displayName) name = waypointData.displayName;
      }
    } else {
      console.error('Invalid waypoint data:', waypointData);
      return;
    }

    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates.`, 'error');
      return;
    }

    if (window.isWaypointModeActive === true) isWaypoint = true;
    
    waypointManagerRef.current.addWaypoint(coords, name, { isWaypoint, type: isWaypoint ? 'WAYPOINT' : 'STOP' });
    const updatedWaypoints = waypointManagerRef.current.getWaypoints();
    await new Promise(resolve => {
      setWaypoints([...updatedWaypoints]);
      setTimeout(resolve, 0);
    });
    console.log('🌐 Waypoints updated using direct implementation');
  };

  // Set the proper implementation after managers are loaded
  useEffect(() => {
    if (waypointManagerRef.current && platformManagerRef.current) {
      // Now that we have the necessary refs, update the implementation
      addWaypointDirect.implementation = addWaypointDirectImpl;
    }
  }, [waypointManagerRef, platformManagerRef]);

  // UI controls hooks - WITHOUT region management now
  const {
    leftPanelVisible,
    rightPanelVisible,
    platformsVisible,
    platformsLoaded,
    rigsLoading,
    rigsError,
    toggleLeftPanel,
    toggleRightPanel,
    togglePlatformsVisibility,
    reloadPlatformData,
    handleRouteInputChange
  } = useUIControls({
    appSettingsManagerRef,
    platformManagerRef,
    client,
    routeInput,
    setRouteInput
  });

  // Waypoints management hooks
  const {
    waypointModeActive,
    addWaypoint, // This addWaypoint is from useWaypoints, distinct from addWaypointDirect
    removeWaypoint,
    updateWaypointName,
    clearRoute,
    reorderWaypoints,
    toggleWaypointMode
  } = useWaypoints({
    waypointManagerRef,
    platformManagerRef,
    mapInteractionHandlerRef,
    setWaypoints,
    client,
    setRouteStats,
    setStopCards
  });

  // Weather management hooks
  const { updateWeatherSettings } = useWeather({
    weather,
    setWeather,
    waypoints,
    selectedAircraft,
    routeCalculatorRef,
    waypointManagerRef,
    flightSettings,
    setRouteStats,
    setStopCards,
    setForceUpdate
  });

  // Flight calculations hooks
  const { updateFlightSetting } = useRouteCalculation({
    waypoints,
    selectedAircraft,
    flightSettings,
    setFlightSettings,
    setRouteStats,
    setStopCards,
    weather,
    waypointManagerRef,
    appSettingsManagerRef
  });

  useEffect(() => {
    import('./modules/waypoints/waypoint-styles.css');
  }, []);

  const handleAddFavoriteLocation = (location) => {
    if (favoriteLocationsManagerRef.current) {
      favoriteLocationsManagerRef.current.addFavoriteLocation(location);
      const updatedFavorites = favoriteLocationsManagerRef.current.getFavoriteLocations();
      setFavoriteLocations(updatedFavorites);
    }
  };

  const handleRemoveFavoriteLocation = (locationId) => {
    if (favoriteLocationsManagerRef.current) {
      favoriteLocationsManagerRef.current.removeFavoriteLocation(locationId);
      setFavoriteLocations(favoriteLocationsManagerRef.current.getFavoriteLocations());
    }
  };

  const loadCustomChart = () => console.log("loadCustomChart - Not implemented");

/**
 * RegionAircraftConnector Component
 * 
 * Links region changes from RegionContext to the aircraft system
 */
const RegionAircraftConnector = ({ setCurrentAircraftRegion }) => {
  // Get region data from context
  const { currentRegion } = useRegion();
  
  // Update aircraft when region changes
  useEffect(() => {
    if (currentRegion && currentRegion.id) {
      // Use a timeout to break the potential circular dependency
      const timer = setTimeout(() => {
        console.log(`RegionAircraftConnector: Updating aircraft for region ${currentRegion.name}`);
        setCurrentAircraftRegion(currentRegion);
      }, 0);
      
      // Clean up the timeout if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [currentRegion, setCurrentAircraftRegion]);
  
  return null; // This is just a connector, not a visual component
};

  return (
    <RegionProvider
      mapManagerRef={mapManagerRef}
      platformManagerRef={platformManagerRef}
      client={client}
      aircraftManagerRef={aircraftManagerRef}
      favoriteLocationsManagerRef={favoriteLocationsManagerRef}
      setFavoriteLocations={setFavoriteLocations}
      appSettingsManagerRef={appSettingsManagerRef}
    >
      <div className="fast-planner-container">
        <ModeHandler 
          mapManagerRef={mapManagerRef}
          waypointManagerRef={waypointManagerRef}
          platformManagerRef={platformManagerRef}
          initialMode="normal"
        />
        <div id="loading-overlay" className="loading-overlay" style={{ display: 'none' }}>
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading...</div>
        </div>
        <RouteStatsCard
          routeStats={routeStats}
          selectedAircraft={selectedAircraft}
          waypoints={waypoints}
          deckTimePerStop={flightSettings.deckTimePerStop}
          deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight}
          cargoWeight={flightSettings.cargoWeight}
          taxiFuel={flightSettings.taxiFuel}
          contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel}
          weather={weather}
          stopCards={stopCards}
        />
        <MapComponent
          mapManagerRef={mapManagerRef}
          onMapReady={handleMapReady}
          className="fast-planner-map"
        />
        <MapZoomHandler mapManagerRef={mapManagerRef} />
        <LeftPanel
          visible={leftPanelVisible}
          onToggleVisibility={toggleLeftPanel}
          waypoints={waypoints}
          onRemoveWaypoint={removeWaypoint}
          onWaypointNameChange={updateWaypointName}
          onAddWaypoint={addWaypoint} // This is the addWaypoint from useWaypoints
          onReorderWaypoints={reorderWaypoints}
          routeInput={routeInput}
          onRouteInputChange={handleRouteInputChange}
          favoriteLocations={favoriteLocations}
          onAddFavoriteLocation={handleAddFavoriteLocation}
          onRemoveFavoriteLocation={handleRemoveFavoriteLocation}
          onClearRoute={clearRoute}
          onToggleChart={togglePlatformsVisibility}
          chartsVisible={platformsVisible}
          onToggleWaypointMode={toggleWaypointMode}
          waypointModeActive={waypointModeActive}
        />
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
          deckTimePerStop={flightSettings.deckTimePerStop}
          deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight}
          cargoWeight={flightSettings.cargoWeight}
          taxiFuel={flightSettings.taxiFuel}
          contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel}
          reserveMethod={reserveMethod}
          onDeckTimeChange={(value) => updateFlightSetting('deckTimePerStop', value)}
          onDeckFuelFlowChange={(value) => updateFlightSetting('deckFuelFlow', value)}
          onPassengerWeightChange={(value) => updateFlightSetting('passengerWeight', value)}
          onCargoWeightChange={(value) => updateFlightSetting('cargoWeight', value)}
          onTaxiFuelChange={(value) => updateFlightSetting('taxiFuel', value)}
          onContingencyFuelPercentChange={(value) => updateFlightSetting('contingencyFuelPercent', value)}
          onReserveMethodChange={(value) => updateFlightSetting('reserveMethod', value)}
          onReserveFuelChange={(value) => updateFlightSetting('reserveFuel', value)}
          forceUpdate={forceUpdate}
          weather={weather}
          onWeatherUpdate={updateWeatherSettings}
        />
      </div>
    </RegionProvider>
  );
};

export default FastPlannerApp;
