import React, { useState, useEffect } from 'react';
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

// Import ModeHandler for backup
import ModeHandler from './modules/waypoints/ModeHandler';

// No fixes - reset to original functionality

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
  
  // Simple debug cleanup - less aggressive and only removes visible elements
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
    
    // Run cleanup once on mount
    removeDebugUI();
    
    // Set up a single cleanup interval
    const cleanupInterval = setInterval(removeDebugUI, 3000);
    
    // Clear interval on unmount
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

  // Aircraft management hooks - initialize first to avoid reference errors 
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
    aircraftManagerRef: null, // Will be set after manager initialization
    currentRegion: null, // Will be updated later
    appSettingsManagerRef: null, // Will be set after manager initialization
    setFlightSettings
  });

  // Create direct inline solution for adding waypoints (without depending on hooks)
  const addWaypointDirect = async (waypointData) => {
    console.log('🔧 Using direct addWaypoint implementation');
    if (!waypointManagerRef.current) {
      console.error('Cannot add waypoint: No waypoint manager');
      return;
    }
    
    // Handle different input formats
    let coords, name, isWaypoint = false;

    console.log('🌐 Direct: Adding waypoint with data:', waypointData);

    // Extract waypoint flag and coordinate formats
    if (Array.isArray(waypointData)) {
      // Direct coordinates array: [lng, lat]
      coords = waypointData;
      name = null;
    } else if (typeof waypointData === 'string') {
      // It's just a name - try to find a location with that name
      console.log(`🌐 Looking for location with name: ${waypointData}`);

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
          }
          // Set coords to null so we'll return early
          coords = null;
          name = waypointData;
        }
      } else {
        console.log(`🌐 Platform manager not available`);
        coords = null;
        name = waypointData;
      }
    } else if (waypointData && typeof waypointData === 'object') {
      // Check if this has isWaypoint flag
      if (waypointData.isWaypoint === true) {
        console.log('🌐 This is a navigation waypoint, not a regular stop');
        isWaypoint = true;
      }
      
      // SNAPPING ENHANCEMENT: First check for nearest facility based on mode
      if (platformManagerRef.current) {
        if (waypointData.lngLat) {
          const lat = waypointData.lngLat.lat;
          const lng = waypointData.lngLat.lng;
          
          if (window.isWaypointModeActive === true && !waypointData.nearestWaypoint) {
            // In waypoint mode, look for nearest navigation waypoint within 5 miles
            if (typeof platformManagerRef.current.findNearestOsdkWaypoint === 'function') {
              const nearestWp = platformManagerRef.current.findNearestOsdkWaypoint(lat, lng, 5);
              if (nearestWp) {
                console.log(`🌐 Found nearest waypoint to snap to: ${nearestWp.name} (${nearestWp.distance.toFixed(2)} nm away)`);
                waypointData.nearestWaypoint = nearestWp;
              }
            }
          }
          
          // Always check for nearest platform if we don't already have one
          if (!waypointData.nearestRig && typeof platformManagerRef.current.findNearestPlatform === 'function') {
            console.log('🌐 Checking for nearest platform to snap to');
            const nearestRig = platformManagerRef.current.findNearestPlatform(lat, lng, 5); // Search within 5 nm
            
            if (nearestRig && nearestRig.distance <= 5) {
              console.log(`🌐 Found nearest platform to snap to: ${nearestRig.name} (${nearestRig.distance.toFixed(2)} nm away)`);
              // Add the nearest rig to the waypointData object
              waypointData.nearestRig = nearestRig;
            }
          }
        }
      }
      
      // Determine coordinates to use based on available data
      if (window.isWaypointModeActive === true && waypointData.nearestWaypoint && waypointData.nearestWaypoint.distance <= 5) {
        // In waypoint mode, prioritize nearby waypoint
        console.log(`🌐 Snapping to nearest waypoint: ${waypointData.nearestWaypoint.name}`);
        coords = waypointData.nearestWaypoint.coordinates;
        name = waypointData.nearestWaypoint.name;
        
        // Show feedback to user
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Snapped to waypoint: ${name} (${waypointData.nearestWaypoint.distance.toFixed(1)} nm away)`,
            'success',
            2000
          );
        }
      } 
      // Otherwise extract coordinates from various possible formats
      else if (waypointData.coordinates) {
        coords = waypointData.coordinates;
      } else if (waypointData.coords) {
        coords = waypointData.coords;
      } else if (waypointData.lngLat) {
        coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
      } 
      
      // IMPROVED: Always check for nearest platform within 5 miles to snap to
      if (!window.isWaypointModeActive && waypointData.nearestRig && waypointData.nearestRig.distance <= 5) {
        // Check if we have a nearest rig within range
        console.log(`🌐 Snapping to nearest rig: ${waypointData.nearestRig.name} (${waypointData.nearestRig.distance.toFixed(2)} nm away)`);

        // Get rig coordinates
        if (waypointData.nearestRig.coordinates) {
          coords = waypointData.nearestRig.coordinates;
        } else if (waypointData.nearestRig.coords) {
          coords = waypointData.nearestRig.coords;
        } else if (waypointData.nearestRig.lng !== undefined && waypointData.nearestRig.lat !== undefined) {
          coords = [waypointData.nearestRig.lng, waypointData.nearestRig.lat];
        } else {
          console.error('Invalid nearestRig coordinates format:', waypointData.nearestRig);
          // Use click coordinates as fallback
          if (waypointData.lngLat) {
            coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
          } else {
            return; // No valid coordinates found
          }
        }

        // CRITICAL: Set the name to the rig name for display
        name = waypointData.nearestRig.name;
        
        // Show feedback to user
        if (window.LoadingIndicator && window.LoadingIndicator.updateStatusIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Snapped to ${name} (${waypointData.nearestRig.distance.toFixed(1)} nm away)`,
            'success',
            2000
          );
        }
      } else if (!coords) {
        console.error('Invalid waypoint data format - no coordinates:', waypointData);
        return;
      }
      
      // Extract name - check all name properties if not already set
      if (!name) {
        if (waypointData.name) {
          name = waypointData.name;
        } else if (waypointData.platformName) {
          name = waypointData.platformName;
        } else if (waypointData.displayName) {
          name = waypointData.displayName;
        }
      }
    } else {
      console.error('Invalid waypoint data:', waypointData);
      return;
    }

    // If we only have a name, try to look up coordinates (this could be enhanced)
    if (!coords && name) {
      console.log(`🌐 We need to search for location with name: ${name}`);
      return; // For now, just return if we don't have coordinates
    }

    // Final validation of coords
    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      console.error('Invalid coordinates format:', coords);
      // Show error message to user
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates. Please try again.`, 'error');
      }
      return;
    }

    // Check global waypoint mode flag
    if (window.isWaypointModeActive === true) {
      console.log('🌐 Waypoint mode is active - forcing waypoint flag to true');
      isWaypoint = true;
    }
    
    console.log(`🌐 Direct: Adding ${isWaypoint ? 'waypoint' : 'stop'} at [${coords}] with name "${name || 'Unnamed'}"`);
    
    // Add the waypoint with the isWaypoint flag
    waypointManagerRef.current.addWaypoint(coords, name, { 
      isWaypoint: isWaypoint, // Pass the flag to identify waypoints vs stops
      type: isWaypoint ? 'WAYPOINT' : 'STOP' // Explicitly set type
    });

    // Get the updated waypoints list
    const updatedWaypoints = waypointManagerRef.current.getWaypoints();
    console.log(`🌐 Updated waypoints (${updatedWaypoints.length}):`, updatedWaypoints);

    // Update the state - wait for it to complete
    await new Promise(resolve => {
      setWaypoints([...updatedWaypoints]); // Updating waypoints state will trigger the centralized useEffect
      // Use setTimeout to ensure the state update has time to complete
      setTimeout(resolve, 0);
    });

    console.log('🌐 Waypoints updated using direct implementation');
  };

  // Initialize all managers with custom hook
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
    addWaypoint: addWaypointDirect, // Pass our direct implementation that doesn't depend on hooks
    weather,
    setWeather,
    currentRegion: null,
    setRegions: () => {},
    setRegionLoading: () => {},
    waypointModeActive: false,
    setAircraftLoading,
    selectedAircraft
  });

  // Set manager refs in aircraft hook
  useEffect(() => {
    if (aircraftManagerRef.current && appSettingsManagerRef.current) {
      // This will update the aircraft hook with the initialized manager refs
      setAircraftManagers(aircraftManagerRef.current, appSettingsManagerRef.current);
    }
  }, [aircraftManagerRef.current, appSettingsManagerRef.current]);

  // UI controls hooks
  const {
    leftPanelVisible,
    rightPanelVisible,
    platformsVisible,
    platformsLoaded,
    rigsLoading,
    rigsError,
    regions,
    currentRegion,
    regionLoading,
    toggleLeftPanel,
    toggleRightPanel,
    togglePlatformsVisibility,
    changeRegion,
    reloadPlatformData,
    handleRouteInputChange,
    setCurrentRegion,
    setRegions,
    setRegionLoading
  } = useUIControls({
    appSettingsManagerRef,
    platformManagerRef,
    regionManagerRef,
    client,
    routeInput
  });

  // Update aircraft manager with current region
  useEffect(() => {
    if (currentRegion && aircraftManagerRef.current) {
      setCurrentAircraftRegion(currentRegion);
    }
  }, [currentRegion, aircraftManagerRef.current]);

  // Waypoints management hooks
  const {
    waypointModeActive,
    addWaypoint,
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
    client // Pass the client explicitly
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

  // Load waypoint styles
  useEffect(() => {
    import('./modules/waypoints/waypoint-styles.css');
  }, []);

  // Handle favorite locations
  const handleAddFavoriteLocation = (location) => {
    if (favoriteLocationsManagerRef.current && currentRegion) {
      favoriteLocationsManagerRef.current.addFavoriteLocation(currentRegion.id, location);
      const updatedFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id);
      setFavoriteLocations(updatedFavorites);
    }
  };

  const handleRemoveFavoriteLocation = (locationId) => {
    if (favoriteLocationsManagerRef.current && currentRegion) {
      favoriteLocationsManagerRef.current.removeFavoriteLocation(currentRegion.id, locationId);
      setFavoriteLocations(favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id));
    }
  };

  // Simple placeholder function - will be implemented properly by hook
  const loadCustomChart = () => {
    console.log("loadCustomChart - Not implemented");
  };

  // Render the application
  return (
    <div className="fast-planner-container">
      {/* ModeHandler is kept but the dedicated WaypointHandler is used for waypoints */}
      <ModeHandler 
        mapManagerRef={mapManagerRef}
        waypointManagerRef={waypointManagerRef}
        platformManagerRef={platformManagerRef}
        initialMode="normal"
      />

      {/* Loading Overlay */}
      <div id="loading-overlay" className="loading-overlay" style={{ display: 'none' }}>
        <div className="loading-spinner"></div>
        <div className="loading-message">Loading...</div>
      </div>

      {/* Route Stats Card */}
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
        onToggleWaypointMode={toggleWaypointMode}
        waypointModeActive={waypointModeActive}
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
  );
};

export default FastPlannerApp;