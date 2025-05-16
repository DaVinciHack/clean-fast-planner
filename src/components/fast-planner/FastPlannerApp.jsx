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

// Import Region Context Provider and hook
import { RegionProvider, useRegion } from './context/region';

// Import custom hooks
import useManagers from './hooks/useManagers';
import useWeather from './hooks/useWeather';
import useAircraft from './hooks/useAircraft';
import useWaypoints from './hooks/useWaypoints';
import useRouteCalculation from './hooks/useRouteCalculation';
import useUIControls from './hooks/useUIControls';

/**
 * FastPlannerCore Component
 * Contains the main application logic and UI, and can safely use useRegion()
 */
const FastPlannerCore = ({ 
  appManagers, 
  flightSettings, setFlightSettings, // Pass state and setter
  weather, setWeather,             // Pass state and setter
  waypoints, setWaypoints,         // Pass state and setter
  stopCards, setStopCards,         // Pass state and setter
  routeStats, setRouteStats,       // Pass state and setter
  forceUpdate, setForceUpdate,     // Pass state and setter
  routeInput, setRouteInput,       // Pass state and setter
  favoriteLocations, setFavoriteLocations, // Pass state and setter
  reserveMethod, setReserveMethod, // Pass state and setter
  addWaypointDirectImplementation // Pass the actual implementation function
}) => {
  const { isAuthenticated, userName, login } = useAuth();
  const { currentRegion: activeRegionFromContext } = useRegion(); 
  
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
  
  const {
    mapManagerRef, waypointManagerRef, platformManagerRef, routeCalculatorRef,
    aircraftManagerRef, mapInteractionHandlerRef, appSettingsManagerRef, handleMapReady
  } = appManagers; // Managers are created in parent and passed down

  // Setup for addWaypointDirect (if its implementation is passed)
  useEffect(() => {
    if (waypointManagerRef.current && platformManagerRef.current && 
        appManagers.addWaypoint && typeof addWaypointDirectImplementation === 'function') {
      appManagers.addWaypoint.implementation = addWaypointDirectImplementation;
    }
  }, [waypointManagerRef, platformManagerRef, appManagers.addWaypoint, addWaypointDirectImplementation]);


  const {
    aircraftType, setAircraftType, aircraftRegistration, setAircraftRegistration,
    selectedAircraft, setSelectedAircraft, aircraftList, aircraftTypes, aircraftsByType,
    aircraftLoading, changeAircraftType, changeAircraftRegistration,
    setAircraftManagers, setCurrentAircraftRegion
  } = useAircraft({
    aircraftManagerRef, appSettingsManagerRef, setFlightSettings
  });
  
  useEffect(() => {
    if (aircraftManagerRef.current && appSettingsManagerRef.current) {
      setAircraftManagers(aircraftManagerRef.current, appSettingsManagerRef.current);
    }
  }, [aircraftManagerRef, appSettingsManagerRef, setAircraftManagers]);

  useEffect(() => {
    const handleRegionChange = (event) => {
      if (event.detail && event.detail.region) {
        console.log(`FastPlannerCore: Received region change event: ${event.detail.region.name}`);
        setCurrentAircraftRegion(event.detail.region);
      }
    };
    window.addEventListener('region-changed', handleRegionChange);
    return () => {
      window.removeEventListener('region-changed', handleRegionChange);
    };
  }, [setCurrentAircraftRegion]);

  const {
    leftPanelVisible, rightPanelVisible, platformsVisible, platformsLoaded,
    rigsLoading, rigsError, toggleLeftPanel, toggleRightPanel,
    togglePlatformsVisibility, reloadPlatformData, handleRouteInputChange
  } = useUIControls({ appSettingsManagerRef, platformManagerRef, client, routeInput, setRouteInput });

  const {
    waypointModeActive, addWaypoint: hookAddWaypoint, removeWaypoint, updateWaypointName,
    clearRoute, reorderWaypoints, toggleWaypointMode
  } = useWaypoints({
    waypointManagerRef, platformManagerRef, mapInteractionHandlerRef, setWaypoints,
    client, currentRegion: activeRegionFromContext, setRouteStats, setStopCards
  });

  const { updateWeatherSettings } = useWeather({
    weather, setWeather, waypoints, selectedAircraft, routeCalculatorRef,
    waypointManagerRef, flightSettings, setRouteStats, setStopCards, setForceUpdate
  });

  const { updateFlightSetting } = useRouteCalculation({
    waypoints, selectedAircraft, flightSettings, setFlightSettings,
    setRouteStats, setStopCards, weather, waypointManagerRef, appSettingsManagerRef
  });

  useEffect(() => { import('./modules/waypoints/waypoint-styles.css'); }, []);

  const handleAddFavoriteLocation = (location) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      appManagers.favoriteLocationsManagerRef.current.addFavoriteLocation(location);
      const updatedFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocations();
      setFavoriteLocations(updatedFavorites);
    }
  };

  const handleRemoveFavoriteLocation = (locationId) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      appManagers.favoriteLocationsManagerRef.current.removeFavoriteLocation(locationId);
      setFavoriteLocations(appManagers.favoriteLocationsManagerRef.current.getFavoriteLocations());
    }
  };
  
  const loadCustomChart = () => console.log("loadCustomChart - Not implemented");

  const RegionAircraftConnector = ({ aircraftSetter }) => {
    const { currentRegion: contextRegion } = useRegion();
    useEffect(() => {
      if (contextRegion && contextRegion.id) {
        const timer = setTimeout(() => {
          console.log(`RegionAircraftConnector: Updating aircraft for region ${contextRegion.name}`);
          aircraftSetter(contextRegion);
        }, 0);
        return () => clearTimeout(timer);
      }
    }, [contextRegion, aircraftSetter]);
    return null; 
  };

  return (
    <>
      <RegionAircraftConnector aircraftSetter={setCurrentAircraftRegion} />
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
          routeStats={routeStats} selectedAircraft={selectedAircraft} waypoints={waypoints}
          deckTimePerStop={flightSettings.deckTimePerStop} deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight} cargoWeight={flightSettings.cargoWeight}
          taxiFuel={flightSettings.taxiFuel} contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel} weather={weather} stopCards={stopCards}
        />
        <MapComponent mapManagerRef={mapManagerRef} onMapReady={handleMapReady} className="fast-planner-map" />
        <MapZoomHandler mapManagerRef={mapManagerRef} />
        <LeftPanel
          visible={leftPanelVisible} onToggleVisibility={toggleLeftPanel} waypoints={waypoints}
          onRemoveWaypoint={removeWaypoint} onWaypointNameChange={updateWaypointName}
          onAddWaypoint={hookAddWaypoint} onReorderWaypoints={reorderWaypoints} routeInput={routeInput}
          onRouteInputChange={handleRouteInputChange} favoriteLocations={favoriteLocations}
          onAddFavoriteLocation={handleAddFavoriteLocation} onRemoveFavoriteLocation={handleRemoveFavoriteLocation}
          onClearRoute={clearRoute} onToggleChart={togglePlatformsVisibility} chartsVisible={platformsVisible}
          onToggleWaypointMode={toggleWaypointMode} waypointModeActive={waypointModeActive}
        />
        <RightPanel
          visible={rightPanelVisible} onToggleVisibility={toggleRightPanel} onClearRoute={clearRoute}
          onLoadRigData={reloadPlatformData} onToggleChart={togglePlatformsVisibility}
          onLoadCustomChart={loadCustomChart} chartsVisible={platformsVisible} aircraftType={aircraftType}
          onAircraftTypeChange={changeAircraftType} aircraftRegistration={aircraftRegistration}
          onAircraftRegistrationChange={changeAircraftRegistration} selectedAircraft={selectedAircraft}
          aircraftsByType={aircraftsByType} aircraftLoading={aircraftLoading} routeStats={routeStats}
          waypoints={waypoints} onRemoveWaypoint={removeWaypoint} isAuthenticated={isAuthenticated}
          authUserName={userName} rigsLoading={rigsLoading} onLogin={login}
          deckTimePerStop={flightSettings.deckTimePerStop} deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight} cargoWeight={flightSettings.cargoWeight}
          taxiFuel={flightSettings.taxiFuel} contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel} reserveMethod={reserveMethod}
          onDeckTimeChange={(value) => updateFlightSetting('deckTimePerStop', value)}
          onDeckFuelFlowChange={(value) => updateFlightSetting('deckFuelFlow', value)}
          onPassengerWeightChange={(value) => updateFlightSetting('passengerWeight', value)}
          onCargoWeightChange={(value) => updateFlightSetting('cargoWeight', value)}
          onTaxiFuelChange={(value) => updateFlightSetting('taxiFuel', value)}
          onContingencyFuelPercentChange={(value) => updateFlightSetting('contingencyFuelPercent', value)}
          onReserveMethodChange={(value) => updateFlightSetting('reserveMethod', value)}
          onReserveFuelChange={(value) => updateFlightSetting('reserveFuel', value)}
          forceUpdate={forceUpdate} weather={weather} onWeatherUpdate={updateWeatherSettings}
        />
      </div>
    </>
  );
};

/**
 * Main FastPlannerApp component that sets up RegionProvider and top-level states/managers
 */
const FastPlannerApp = () => {
  // Hoist states needed by useManagers or passed to FastPlannerCore
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220, contingencyFuelPercent: 5, taxiFuel: 50,
    reserveFuel: 600, deckTimePerStop: 5, deckFuelFlow: 400, cargoWeight: 0,
  });
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [stopCards, setStopCards] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [routeInput, setRouteInput] = useState('');
  const [reserveMethod, setReserveMethod] = useState('fixed');

  // Define addWaypointDirect and its implementation here, so they can be passed to useManagers
  // and then the implementation to FastPlannerCore
  const addWaypointDirectRef = useRef(async (waypointData) => {
    // Initial placeholder, implementation will be set by addWaypointDirectImpl
    if (!appManagers.waypointManagerRef || !appManagers.waypointManagerRef.current) {
        console.error('Cannot add waypoint: No waypoint manager ref in placeholder');
        return;
    }
    console.warn('addWaypointDirect placeholder called');
  });

  const addWaypointDirectImpl = async (waypointData) => {
    const { waypointManagerRef, platformManagerRef } = appManagers; // Get refs from appManagers
    console.log('🔧 Using direct addWaypoint implementation (FastPlannerApp)');
    if (!waypointManagerRef.current) {
      console.error('Cannot add waypoint: No waypoint manager ref');
      return;
    }
    if (!platformManagerRef.current && typeof waypointData === 'string') {
        console.warn('Platform manager ref not available for name lookup, proceeding if coordinates are provided.');
    }
    let coords, name, isWaypoint = false;
    console.log('🌐 Direct: Adding waypoint with data:', waypointData);
    if (Array.isArray(waypointData)) {
      coords = waypointData; name = null;
    } else if (typeof waypointData === 'string') {
      if (platformManagerRef.current) {
        const platform = platformManagerRef.current.findPlatformByName(waypointData);
        if (platform) { coords = platform.coordinates; name = platform.name; } 
        else { if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Platform "${waypointData}" not found.`, 'error'); return; }
      } else { if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Platform lookup unavailable.`, 'error'); return; }
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
        coords = waypointData.nearestWaypoint.coordinates; name = waypointData.nearestWaypoint.name;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to waypoint: ${name}`, 'success', 2000);
      } else if (waypointData.coordinates) coords = waypointData.coordinates;
      else if (waypointData.coords) coords = waypointData.coords;
      else if (waypointData.lngLat) coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
      if (!window.isWaypointModeActive && waypointData.nearestRig && waypointData.nearestRig.distance <= 5) {
        if (waypointData.nearestRig.coordinates) coords = waypointData.nearestRig.coordinates;
        else if (waypointData.nearestRig.coords) coords = waypointData.nearestRig.coords;
        else if (waypointData.nearestRig.lng !== undefined && waypointData.nearestRig.lat !== undefined) coords = [waypointData.nearestRig.lng, waypointData.nearestRig.lat];
        name = waypointData.nearestRig.name;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to ${name}`, 'success', 2000);
      } else if (!coords) { console.error('Invalid waypoint data format - no coordinates:', waypointData); return; }
      if (!name) {
        if (waypointData.name) name = waypointData.name;
        else if (waypointData.platformName) name = waypointData.platformName;
        else if (waypointData.displayName) name = waypointData.displayName;
      }
    } else { console.error('Invalid waypoint data:', waypointData); return; }
    if (!coords || !Array.isArray(coords) || coords.length !== 2) { if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates.`, 'error'); return; }
    if (window.isWaypointModeActive === true) isWaypoint = true;
    
    // Ensure appManagers and its refs are available before using them
    if (appManagers.waypointManagerRef && appManagers.waypointManagerRef.current) {
        appManagers.waypointManagerRef.current.addWaypoint(coords, name, { isWaypoint, type: isWaypoint ? 'WAYPOINT' : 'STOP' });
        const updatedWaypoints = appManagers.waypointManagerRef.current.getWaypoints();
        await new Promise(resolve => { setWaypoints([...updatedWaypoints]); setTimeout(resolve, 0); });
        console.log('🌐 Waypoints updated using direct implementation');
    } else {
        console.error('addWaypointDirectImpl: waypointManagerRef is not available on appManagers');
    }
  };
  
  const appManagers = useManagers({
    client,
    setFavoriteLocations,
    setWaypoints,
    flightSettings,
    setFlightSettings,
    forceUpdate,
    setForceUpdate,
    addWaypoint: addWaypointDirectRef.current, // Pass the ref's current value
    weather,
    setWeather
  });

  // Effect to set the implementation on the ref after appManagers is initialized
  useEffect(() => {
    if (appManagers.waypointManagerRef && appManagers.platformManagerRef) {
        addWaypointDirectRef.current.implementation = addWaypointDirectImpl;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appManagers.waypointManagerRef, appManagers.platformManagerRef]); // addWaypointDirectImpl is not added to deps to avoid re-assigning on every render.

  return (
    <RegionProvider
      mapManagerRef={appManagers.mapManagerRef}
      platformManagerRef={appManagers.platformManagerRef}
      client={client} 
      aircraftManagerRef={appManagers.aircraftManagerRef}
      favoriteLocationsManagerRef={appManagers.favoriteLocationsManagerRef}
      setFavoriteLocations={setFavoriteLocations} 
      appSettingsManagerRef={appManagers.appSettingsManagerRef}
      mapInteractionHandlerRef={appManagers.mapInteractionHandlerRef}
    >
      <FastPlannerCore 
        appManagers={appManagers} 
        flightSettings={flightSettings} setFlightSettings={setFlightSettings}
        weather={weather} setWeather={setWeather}
        waypoints={waypoints} setWaypoints={setWaypoints}
        stopCards={stopCards} setStopCards={setStopCards}
        routeStats={routeStats} setRouteStats={setRouteStats}
        forceUpdate={forceUpdate} setForceUpdate={setForceUpdate}
        routeInput={routeInput} setRouteInput={setRouteInput}
        favoriteLocations={favoriteLocations} setFavoriteLocations={setFavoriteLocations}
        reserveMethod={reserveMethod} setReserveMethod={setReserveMethod}
        addWaypointDirectImplementation={addWaypointDirectImpl} // Pass the actual function
      />
    </RegionProvider>
  );
};

export default FastPlannerApp;
