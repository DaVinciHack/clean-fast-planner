import React, { useState, useRef, useEffect } from 'react';
import client from '../../../client';

// Import context hooks
import { 
  useRegion,
  useAircraft,
  useRoute,
  useMap
} from '../context';

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  RouteStatsCard
} from './index';

// Import debugging tools
import DebugPanel from '../DebugPanel';
import LoadingStatusDisplay from '../LoadingStatusDisplay';

// Import FavoriteLocationsManager (the only manager not covered by contexts)
import { FavoriteLocationsManager } from '../modules';

/**
 * FastPlannerCore Component
 * 
 * Core component that uses all contexts to render the UI
 * and handle user interactions.
 */
const FastPlannerCore = () => {
  // Get data from Region context
  const { 
    regions, 
    currentRegion, 
    regionLoading, 
    changeRegion 
  } = useRegion();
  
  // Get data from Aircraft context
  const { 
    aircraftType, 
    aircraftRegistration, 
    selectedAircraft, 
    aircraftsByType, 
    aircraftLoading,
    changeAircraftType, 
    changeAircraftRegistration, 
    flightSettings,
    setDeckTimePerStop, 
    setDeckFuelPerStop, 
    setDeckFuelFlow, 
    setPassengerWeight, 
    setCargoWeight, 
    setTaxiFuel, 
    setContingencyFuelPercent, 
    setReserveMethod, 
    setPayloadWeight, 
    setReserveFuel
  } = useAircraft();
  
  // Get data from Route context
  const {
    waypoints, 
    routeInput, 
    routeStats, 
    addWaypoint, 
    removeWaypoint, 
    updateWaypointName, 
    clearRoute,
    handleRouteInputChange
  } = useRoute();
  
  // Get data from Map context
  const {
    mapReady, 
    platformsVisible, 
    platformsLoaded, 
    rigsLoading, 
    rigsError,
    togglePlatformsVisibility, 
    loadCustomChart, 
    reloadPlatformData,
    loadPlatformsForRegion, // Include the new function
    mapManager, 
    platformManager
  } = useMap();
  
  // Local state
  const [forceUpdate, setForceUpdate] = useState(0);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Phone layout detection and responsive behavior
  const [isPhoneLayout, setIsPhoneLayout] = useState(false);
  
  // Detect phone layout on mount and resize - PHONE ONLY (not iPad)
  useEffect(() => {
    const checkPhoneLayout = () => {
      const isPhone = window.innerWidth <= 480; // Phone only, not iPad/tablet (≤480px)
      setIsPhoneLayout(isPhone);
      
      if (isPhone) {
        console.log('📱 Phone layout detected (≤480px) - right panel will be managed by glass dock');
        // On phones, start with right panel hidden
        setRightPanelVisible(false);
      } else {
        console.log('💻 Desktop/iPad layout (>480px) - normal panel behavior');
        // On desktop/iPad, restore normal panel behavior
        setRightPanelVisible(true);
      }
    };
    
    // Check on mount
    checkPhoneLayout();
    
    // Add resize listener
    window.addEventListener('resize', checkPhoneLayout);
    
    return () => window.removeEventListener('resize', checkPhoneLayout);
  }, []);
  
  // Create favorite locations manager
  const favoriteLocationsManagerRef = useRef(new FavoriteLocationsManager());
  
  // Initialize favorite locations manager
  useEffect(() => {
    const favoriteManager = favoriteLocationsManagerRef.current;
    
    // Set callbacks
    favoriteManager.setCallback('onChange', (locations) => {
      setFavoriteLocations(Object.values(locations).flat());
    });
    
    // Load saved locations - use the method that exists in the manager
    favoriteManager.loadFromLocalStorage();
    
    // Set initial locations
    if (favoriteManager.favoriteLocations) {
      setFavoriteLocations(Object.values(favoriteManager.favoriteLocations).flat());
    }
  }, []);
  
  // Aircraft data update effect
  useEffect(() => {
    console.log('FastPlannerCore: Aircraft data changed', {
      aircraftType,
      aircraftRegistration,
      selectedAircraft,
      aircraftsByType: Object.keys(aircraftsByType).map(type => `${type}: ${aircraftsByType[type]?.length || 0}`)
    });
    
    // Check if we have data in the regions and types
    if (aircraftsByType && Object.keys(aircraftsByType).length > 0) {
      const totalAircraft = Object.values(aircraftsByType).flat().length;
      console.log(`FastPlannerCore: Total ${totalAircraft} aircraft available in this region`);
      
      if (totalAircraft > 0 && !aircraftType) {
        // Auto-select the first type with aircraft if none selected
        const firstTypeWithAircraft = Object.keys(aircraftsByType).find(
          type => aircraftsByType[type] && aircraftsByType[type].length > 0
        );
        
        if (firstTypeWithAircraft) {
          console.log(`FastPlannerCore: Auto-selecting first available type: ${firstTypeWithAircraft}`);
          changeAircraftType(firstTypeWithAircraft);
        }
      }
    }
  }, [aircraftsByType, aircraftType, changeAircraftType]);

  // Panel visibility handlers
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };
  
  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };
  
  // Favorite locations handlers
  const handleAddFavoriteLocation = (name, coords) => {
    if (currentRegion) {
      const location = {
        name, 
        coords,
        id: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
      };
      favoriteLocationsManagerRef.current.addFavoriteLocation(currentRegion.id, location);
    }
  };
  
  const handleRemoveFavoriteLocation = (id) => {
    if (currentRegion) {
      favoriteLocationsManagerRef.current.removeFavoriteLocation(currentRegion.id, id);
    }
  };
  
  // Map initialization handler
  const handleMapReady = (mapInstance) => {
    console.log("Map is ready", mapInstance);
    
    // When map is ready, set the default region if available
    if (regions && regions.length > 0 && !currentRegion) {
      console.log('Setting default region after map is ready');
      try {
        const defaultRegion = regions.find(r => r.id === 'gulf-of-mexico') || regions[0];
        if (defaultRegion) {
          console.log(`Setting default region to ${defaultRegion.id || defaultRegion.name}`);
          changeRegion(defaultRegion.id);
        } else {
          console.warn('No default region found in available regions');
        }
      } catch (error) {
        console.error('Error setting default region:', error);
      }
    }
  };
  
  // Load platforms when region changes
  useEffect(() => {
    if (currentRegion && mapReady && platformManager) {
      console.log(`Region changed to ${currentRegion.name}, loading platforms...`);
      
      // Use the loadPlatformsForRegion from MapContext if available 
      if (typeof loadPlatformsForRegion === 'function') {
        console.log('Using loadPlatformsForRegion from MapContext');
        loadPlatformsForRegion(currentRegion);
      } else {
        // Fallback to reloadPlatformData
        console.log('Using reloadPlatformData as fallback');
        reloadPlatformData();
      }
      
      // Add a special notification about region change
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.padding = '10px 15px';
      notification.style.backgroundColor = 'rgba(0, 70, 150, 0.9)';
      notification.style.color = 'white';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '10000';
      notification.style.fontFamily = 'sans-serif';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      notification.textContent = `Region changed to ${currentRegion.name}`;
      document.body.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
      
      // Force UI update for aircraft dropdowns by incrementing forceUpdate counter
      setForceUpdate(prev => prev + 1);
    }
  }, [currentRegion, mapReady, platformManager, loadPlatformsForRegion, reloadPlatformData]);
  
  // Debug state for toggling debug panel
  const [showDebug, setShowDebug] = useState(true);
  // Show Loading Status Display
  const [showLoadingStatus, setShowLoadingStatus] = useState(true);
  
  return (
    <div className="fast-planner-container">
      {/* Loading Overlay */}
      <div id="loading-overlay" className="loading-overlay" style={{ display: 'none' }}>
        <div className="loading-spinner"></div>
        <div className="loading-message">Loading...</div>
      </div>
      
      {/* Loading Status Display */}
      {showLoadingStatus && (
        <LoadingStatusDisplay 
          mapReady={mapReady}
          regionLoading={regionLoading}
          aircraftLoading={aircraftLoading}
          platformsLoaded={platformsLoaded}
          rigsLoading={rigsLoading}
          client={client}
          selectedAircraft={selectedAircraft}
        />
      )}
      
      {/* Route Stats Card Component - This was missing! */}
      <RouteStatsCard 
        routeStats={routeStats}
        selectedAircraft={selectedAircraft}
        waypoints={waypoints}
        deckTimePerStop={flightSettings.deckTimePerStop}
        deckFuelPerStop={flightSettings.deckFuelPerStop}
        passengerWeight={flightSettings.passengerWeight}
        cargoWeight={flightSettings.cargoWeight}
      />
      
      {/* Map Component - only render if mapManager is available */}
      {mapManager ? (
        <MapComponent
          mapManagerRef={{ current: mapManager }}
          onMapReady={handleMapReady}
        />
      ) : (
        <div className="loading-message" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '5px'
        }}>
          Loading map manager...
        </div>
      )}
      
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
        // Map and platform manager refs
        mapManagerRef={{ current: mapManager }}
        platformManagerRef={{ current: platformManager }}
        // Map layer refs
        gulfCoastMapRef={gulfCoastMapRef}
        weatherLayerRef={weatherLayerRef}
        vfrChartsRef={vfrChartsRef}
      />
      
      {/* Debug Panel */}
      <DebugPanel 
        isVisible={showDebug}
        mapManager={mapManager}
        regionManager={useRegion().regionManager}
        platformManager={platformManager}
        currentRegion={currentRegion}
      />
      
      {/* Debug Toggle Button */}
      <button 
        onClick={() => setShowDebug(!showDebug)}
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {/* Emergency Fix Button */}
      
      {/* 3D MAP TEST BUTTON */}
      <button 
        onClick={async () => {
          try {
            console.log('🗺️ Testing 3D map style switch...');
            
            if (!mapManager) {
              alert('Map manager not available');
              return;
            }
            
            // Toggle between dark and 3D style
            const currentStyle = mapManager.getCurrentStyle ? mapManager.getCurrentStyle() : 'dark';
            const newStyle = currentStyle === '3d' ? 'dark' : '3d';
            
            console.log(`🗺️ Switching from ${currentStyle} to ${newStyle}`);
            
            await mapManager.switchMapStyle(newStyle);
            alert(`🗺️ Switched to ${newStyle === '3d' ? '3D Standard' : 'Dark'} style!`);
            
          } catch (error) {
            console.error('3D map switch failed:', error);
            alert('3D map switch failed: ' + error.message);
          }
        }}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 2000,
          padding: '12px 16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: '2px solid #1976D2',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}
      >
        🗺️ Toggle 3D Map
      </button>
      
      <button 
        onClick={() => {
          try {
            console.log("Emergency Fix: Testing if platformManager is properly initialized");
            
            // First check if platformManager exists
            if (!platformManager) {
              console.error("platformManager is null or undefined");
              alert("Platform Manager is not initialized! Check console for details.");
              return;
            }
            
            // Check if mapManager exists and is properly referenced
            if (!platformManager.mapManager) {
              console.log("Emergency Fix: platformManager.mapManager is missing, fixing...");
              platformManager.mapManager = mapManager;
              alert("Fixed: platformManager.mapManager was missing and has been set");
            } else {
              console.log("platformManager.mapManager is properly set");
              alert("Platform manager is correctly initialized");
            }
            
            // Manual reset of flags
            window.platformsLoaded = false;
            window.staticDataLoaded = false;
            window.aircraftLoaded = false;
            
            // Force a UI refresh
            setForceUpdate(prev => prev + 1);
          } catch (e) {
            console.error("Error in emergency fix:", e);
            alert("Error: " + e.message);
          }
        }}
        style={{
          position: 'absolute',
          bottom: '50px',
          right: '10px',
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Emergency Fix
      </button>
      
      {/* Status Check Button */}
      <button 
        onClick={() => {
          // Check the state of managers and contexts
          console.log("Status Check:", {
            mapReady,
            platformsLoaded,
            platformsVisible,
            aircraftType,
            aircraftRegistration,
            selectedAircraft,
            aircraftsByType: Object.keys(aircraftsByType).map(type => `${type}: ${aircraftsByType[type]?.length || 0}`),
            waypoints: waypoints.length,
            currentRegion
          });
          
          // Check aircraft dropdown
          const typeDropdown = document.getElementById('aircraft-type');
          if (typeDropdown) {
            console.log("Aircraft Type Dropdown:", {
              options: Array.from(typeDropdown.options || []).map(o => ({value: o.value, text: o.textContent})),
              selectedValue: typeDropdown.value,
              optionCount: typeDropdown.options?.length || 0
            });
          }
          
          // Show status in alert
          alert(`Status:
Map Ready: ${mapReady ? 'Yes' : 'No'}
Platforms Loaded: ${platformsLoaded ? 'Yes' : 'No'}
Aircraft Types: ${Object.keys(aircraftsByType).length}
Selected Aircraft: ${selectedAircraft ? selectedAircraft.registration : 'None'}
Current Region: ${currentRegion ? currentRegion.name : 'None'}`);
          
          // Force refresh aircraft data
          if (!Object.keys(aircraftsByType).some(type => aircraftsByType[type]?.length > 0)) {
            console.log("No aircraft found, forcing refresh");
            window.aircraftLoaded = false;
            setForceUpdate(prev => prev + 1);
          }
        }}
        style={{
          position: 'absolute',
          bottom: '90px',
          right: '10px',
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Check Status
      </button>
      
      {/* Validate and Fix Button */}
      <button 
        onClick={() => {
          console.log("Validating application state...");
          
          // Check map initialization
          if (mapManager && !mapManager.getMap()) {
            console.error("Map not initialized yet");
            alert("Map not initialized yet");
            return;
          }
          
          // Check platform manager
          if (platformManager) {
            if (!platformManager.mapManager) {
              console.error("Platform manager missing map manager reference");
              platformManager.mapManager = mapManager;
              console.log("Fixed: Set mapManager on platformManager");
            }
            
            // Check if platforms are loaded
            if (currentRegion && (!platformsLoaded || platformManager.platforms?.length === 0)) {
              console.log("Platforms not loaded for region, forcing load");
              
              if (typeof loadPlatformsForRegion === 'function') {
                loadPlatformsForRegion(currentRegion);
                alert("Forcing platform load for region: " + currentRegion.name);
              } else if (platformManager.loadPlatformsFromFoundry) {
                platformManager.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
                  .then(platforms => {
                    console.log(`Loaded ${platforms.length} platforms`);
                    alert(`Loaded ${platforms.length} platforms for ${currentRegion.name}`);
                  })
                  .catch(err => {
                    console.error("Error loading platforms:", err);
                    alert("Error loading platforms: " + err.message);
                  });
              }
            } else {
              alert("Platforms already loaded: " + (platformManager.platforms?.length || 0));
            }
          }
          
          // Force update to refresh UI
          setForceUpdate(prev => prev + 1);
        }}
        style={{
          position: 'absolute',
          bottom: '130px',
          right: '10px',
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#9c27b0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Validate & Fix
      </button>
      
      {/* Force Refresh Aircraft Button */}
      <button 
        onClick={() => {
          console.log("Forcing aircraft refresh");
          
          // Reset global flags
          window.aircraftLoadedGlobally = false;
          
          // Create a notification
          const notification = document.createElement('div');
          notification.style.position = 'fixed';
          notification.style.top = '50%';
          notification.style.left = '50%';
          notification.style.transform = 'translate(-50%, -50%)';
          notification.style.padding = '15px 20px';
          notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          notification.style.color = 'white';
          notification.style.borderRadius = '5px';
          notification.style.zIndex = '10000';
          notification.style.fontFamily = 'sans-serif';
          notification.textContent = 'Refreshing aircraft data...';
          document.body.appendChild(notification);
          
          // Force a re-load of aircraft data through AircraftContext mechanisms
          setTimeout(() => {
            // Update the message
            notification.textContent = 'Aircraft data refreshed! Reloading dropdowns...';
            
            // Force the dropdowns to reset
            setTimeout(() => {
              // Force rerender by updating forceUpdate value
              setForceUpdate(prev => prev + 1);
              
              // Remove the notification
              document.body.removeChild(notification);
            }, 1000);
          }, 1000);
        }}
        style={{
          position: 'absolute',
          bottom: '170px',
          right: '10px',
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Force Refresh Aircraft
      </button>
    </div>
  );
};

export default FastPlannerCore;