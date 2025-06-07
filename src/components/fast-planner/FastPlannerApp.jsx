// Import React and necessary hooks
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';
import './waypoint-markers.css'; // Clean waypoint marker styles
import './fixes/route-stats-card-fix.css';
import './fixes/panel-interaction-fix.css';

// Import StopCardCalculator - the single source of truth
import StopCardCalculator from './modules/calculations/flight/StopCardCalculator.js';

// Import extracted utilities
import { generateStopCardsData as generateStopCardsUtil } from './utilities/FlightUtilities.js';

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  AppHeader
} from './components';

// Import MapZoomHandler for waypoint display
import MapZoomHandler from './components/map/MapZoomHandler';

// Import ModeHandler for backup
import ModeHandler from './modules/waypoints/ModeHandler';

// Import Region Context Provider and hook
import { RegionProvider, useRegion } from './context/region';

// Import LoadingIndicator for status checking
import LoadingIndicator from './modules/LoadingIndicator';
// Import custom hooks
import useManagers from './hooks/useManagers';
import useAircraft from './hooks/useAircraft';
import useWaypoints from './hooks/useWaypoints';
import useUIControls from './hooks/useUIControls';
import useMapLayers from './hooks/useMapLayers';
import useWeatherSegments from './hooks/useWeatherSegments';
import useFuelPolicy from './hooks/useFuelPolicy';

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
  alternateRouteData, setAlternateRouteData, // Pass alternate route state and setter
  alternateRouteInput, setAlternateRouteInput, // Pass alternate route input state and setter
  addWaypointDirectImplementation, // Pass the actual implementation function
  handleMapReadyImpl // Pass the map ready implementation
}) => {
  const { isAuthenticated, userName, login } = useAuth();
  const { currentRegion: activeRegionFromContext } = useRegion(); 
  
  // Initialize fuel policy management
  const fuelPolicy = useFuelPolicy();
  
  // State for tracking actual loading status from LoadingIndicator
  const [isActuallyLoading, setIsActuallyLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // State for tracking current loaded flight for weather segments
  const [currentFlightId, setCurrentFlightId] = useState(null);
  
  // Check LoadingIndicator status periodically
  useEffect(() => {
    const checkLoadingStatus = () => {
      const status = LoadingIndicator.getQueueStatus();
      const hasActiveLoading = status.length > 0 || status.isProcessing || status.currentMessage;
      
      if (!hasActiveLoading && isActuallyLoading && !isFinishing) {
        // Loading just finished - start finishing animation
        setIsFinishing(true);
        // After one complete cycle (1.5s), actually stop
        setTimeout(() => {
          setIsActuallyLoading(false);
          setIsFinishing(false);
        }, 1500);
      } else if (hasActiveLoading && !isActuallyLoading) {
        // Loading started
        setIsActuallyLoading(true);
        setIsFinishing(false);
      }
    };
    
    // Check immediately and then every 200ms
    checkLoadingStatus();
    const interval = setInterval(checkLoadingStatus, 200);
    
    return () => clearInterval(interval);
  }, [isActuallyLoading, isFinishing]); 
  
  useEffect(() => {
    const removeDebugUI = () => {
      const debugSelectors = [
        '.debug-popup', 
        '.fix-applied-popup',
        '#status-indicator-container',
        '.clean-notification',
        '#clean-notifications-container'
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

  // Effect to select appropriate fuel policy when aircraft changes
  useEffect(() => {
    if (!selectedAircraft || !activeRegionFromContext?.osdkRegion) {
      console.log(`🛩️ AIRCRAFT: Skipping aircraft policy selection - missing aircraft (${!!selectedAircraft}) or region (${!!activeRegionFromContext?.osdkRegion})`);
      return;
    }

    console.log(`🛩️ AIRCRAFT: Aircraft changed to: ${selectedAircraft.registration}`);
    console.log(`🛩️ AIRCRAFT: Has policies available: ${fuelPolicy.hasPolicies}`);
    console.log(`🛩️ AIRCRAFT: Available policies count: ${fuelPolicy.availablePolicies?.length || 0}`);
    
    // Aircraft policy selection with enhanced logging
    if (fuelPolicy.hasPolicies && fuelPolicy.selectDefaultPolicyForAircraft) {
      console.log(`🛩️ AIRCRAFT: Attempting to select aircraft-specific policy...`);
      const defaultPolicy = fuelPolicy.selectDefaultPolicyForAircraft(selectedAircraft);
      if (defaultPolicy) {
        console.log(`✅ AIRCRAFT: Selected aircraft-specific policy: ${defaultPolicy.name}`);
      } else {
        console.log(`⚠️ AIRCRAFT: No specific policy found for aircraft ${selectedAircraft.registration}`);
      }
    } else {
      console.log(`⚠️ AIRCRAFT: Cannot select aircraft policy - hasPolicies: ${fuelPolicy.hasPolicies}, selectFunction: ${!!fuelPolicy.selectDefaultPolicyForAircraft}`);
    }
  }, [selectedAircraft?.registration, fuelPolicy.hasPolicies, fuelPolicy.availablePolicies?.length]);

  // Memoize the region change handler to maintain stable reference
  const handleRegionChange = useCallback((event) => {
    if (event.detail && event.detail.region) {
      console.log(`FastPlannerCore: Received region change event: ${event.detail.region.name}`);
      // The actual region update is delegated to the stabilized function in useAircraft
      setCurrentAircraftRegion(event.detail.region);
    }
  }, [setCurrentAircraftRegion]);

  // Set up the event listener with the memoized handler
  useEffect(() => {
    console.log('FastPlannerCore: Setting up region-changed event listener');
    window.addEventListener('region-changed', handleRegionChange);
    return () => {
      console.log('FastPlannerCore: Removing region-changed event listener');
      window.removeEventListener('region-changed', handleRegionChange);
    };
  }, [handleRegionChange]);

  const {
    leftPanelVisible, rightPanelVisible, platformsVisible, platformsLoaded,
    rigsLoading, rigsError, toggleLeftPanel, toggleRightPanel,
    togglePlatformsVisibility, reloadPlatformData, handleRouteInputChange,
    // Enhanced platform visibility state and toggles
    airfieldsVisible, fixedPlatformsVisible, movablePlatformsVisible,
    blocksVisible, basesVisible, fuelAvailableVisible, // New state variables
    toggleAirfieldsVisibility, toggleFixedPlatformsVisibility, toggleMovablePlatformsVisibility,
    toggleBlocksVisibility, toggleBasesVisibility, toggleFuelAvailableVisibility // New toggle functions
  } = useUIControls({ appSettingsManagerRef, platformManagerRef, client, routeInput, setRouteInput });
  
  // Initialize map layers
  const {
    gulfCoastMapRef,
    weatherLayerRef,
    vfrChartsRef,
    layerStates,
    toggleLayer
  } = useMapLayers({ mapManagerRef });

  const {
    waypointModeActive, addWaypoint: hookAddWaypoint, removeWaypoint, updateWaypointName,
    clearRoute: hookClearRoute, reorderWaypoints, toggleWaypointMode
  } = useWaypoints({
    waypointManagerRef, platformManagerRef, mapInteractionHandlerRef, setWaypoints,
    client, currentRegion: activeRegionFromContext, setRouteStats, setStopCards
  });
  
  // ✅ RESTORED: Proper flight setting update function
  const updateFlightSetting = (settingName, value) => {
    console.log(`⚙️ RESTORED: updateFlightSetting(${settingName}, ${value})`);
    
    setFlightSettings(prev => ({
      ...prev,
      [settingName]: value
    }));
  };
  
  // ✅ RESTORED: Proper weather update function
  const updateWeatherSettings = (windSpeed, windDirection) => {
    console.log(`🌬️ RESTORED: updateWeatherSettings(${windSpeed}, ${windDirection})`);
    
    setWeather(prev => ({
      ...prev,
      windSpeed: Number(windSpeed) || 0,
      windDirection: Number(windDirection) || 0
    }));
  };
  
  // ✅ CRITICAL FIX: Auto-trigger calculations when route/aircraft change
  useEffect(() => {
    if (waypoints && waypoints.length >= 2 && selectedAircraft) {
      console.log('🔄 Auto-triggering calculations due to route/aircraft/settings change');
      console.log('🔧 EFFECT TRIGGERED - Current extraFuel:', flightSettings.extraFuel);
      
      // 🔧 DEBUG: Log flightSettings to see what we're passing
      console.log('🔧 FastPlannerApp DEBUG: flightSettings being passed:', {
        flightSettings,
        extraFuel: flightSettings.extraFuel,
        cargoWeight: flightSettings.cargoWeight
      });
      
      // Generate stop cards and update header
      const newStopCards = generateStopCardsData(
        waypoints,
        routeStats, 
        selectedAircraft,
        weather,
        flightSettings
      );
      
      if (newStopCards && newStopCards.length > 0) {
        setStopCards(newStopCards);
        console.log('✅ Auto-calculation complete - header should update');
      }
    }
  }, [waypoints, selectedAircraft, flightSettings, weather]);

  // Weather segments integration - MOVED BEFORE clearRoute to fix initialization order
  const {
    weatherSegments,
    weatherSegmentsLoading,
    weatherSegmentsError,
    loadWeatherSegments,
    toggleWeatherLayer,
    clearWeatherSegments
  } = useWeatherSegments({
    mapManagerRef,
    onWeatherUpdate: updateWeatherSettings // Now using stub function
  });

  // Enhanced clearRoute that also clears alternate route state
  const clearRoute = useCallback(() => {
    console.log('🧹 FastPlannerApp: Clearing route and alternate route');
    
    // Call the hook's clearRoute function
    hookClearRoute();
    
    // Clear alternate route state
    setAlternateRouteData(null);
    setAlternateRouteInput('');
    
    // Clear current flight ID and weather segments
    setCurrentFlightId(null);
    clearWeatherSegments();
    
    // CRITICAL FIX: Clear persistent alternate card storage
    window.currentAlternateCard = null;
    
    console.log('✅ FastPlannerApp: Route and alternate route cleared');
  }, [hookClearRoute, setAlternateRouteData, setAlternateRouteInput, clearWeatherSegments]);

  useEffect(() => { import('./modules/waypoints/waypoint-styles.css'); }, []);

  // Effect to load fuel policies when region changes (with debouncing)
  const regionIdRef = useRef(null);
  useEffect(() => {
    if (!activeRegionFromContext?.id) {
      console.log('No active region for fuel policy loading');
      return;
    }

    // Skip if this is the same region
    if (regionIdRef.current === activeRegionFromContext.id) {
      console.log('Same region, skipping fuel policy reload');
      return;
    }

    if (!fuelPolicy || !fuelPolicy.loadPoliciesForRegion) {
      console.log('Fuel policy hook not ready yet');
      return;
    }

    regionIdRef.current = activeRegionFromContext.id;
    console.log(`🌍 FastPlannerApp: Loading fuel policies for region change to: ${activeRegionFromContext.name}`);

    console.log(`Loading fuel policies for region: ${activeRegionFromContext.name} (OSDK: ${activeRegionFromContext.osdkRegion})`);
    fuelPolicy.loadPoliciesForRegion(activeRegionFromContext.osdkRegion)
      .then(policies => {
        console.log(`📋 REGION: Loaded ${policies.length} fuel policies for ${activeRegionFromContext.name}`);
        
        if (policies.length === 0) {
          console.warn(`📋 REGION: No policies found for region ${activeRegionFromContext.name}`);
          return;
        }
        
        // Only auto-select if no current policy or current policy is not from this region
        const currentPolicy = fuelPolicy.currentPolicy;
        if (!currentPolicy || !policies.find(p => p.uuid === currentPolicy.uuid)) {
          console.log(`📋 REGION: Auto-selecting first policy for region: ${policies[0].name}`);
          fuelPolicy.selectPolicy(policies[0]);
        } else {
          console.log(`📋 REGION: Keeping current policy: ${currentPolicy.name}`);
        }
      })
      .catch(error => {
        console.error(`Error loading fuel policies for region ${activeRegionFromContext.name} (${activeRegionFromContext.osdkRegion}):`, error);
      });
  }, [activeRegionFromContext?.id, activeRegionFromContext?.osdkRegion]); // Simplified dependencies

  // ✅ CRITICAL FIX: Apply fuel policy values to flightSettings when policy changes
  useEffect(() => {
    if (!fuelPolicy.currentPolicy) {
      console.log('⚙️ FUEL POLICY: No current policy, skipping flightSettings update');
      return;
    }

    const policySettings = fuelPolicy.getCurrentPolicySettings();
    if (!policySettings) {
      console.log('⚙️ FUEL POLICY: No policy settings available');
      return;
    }

    console.log('🔄 FUEL POLICY: Applying policy values to flightSettings');
    console.log('📊 FUEL POLICY: Policy contingency:', policySettings.contingencyFlightLegs);
    console.log('📊 FUEL POLICY: Policy taxi fuel:', policySettings.taxiFuel);
    console.log('📊 FUEL POLICY: Policy reserve fuel:', policySettings.reserveFuel);

    // Apply policy values to flightSettings, preserving user inputs
    setFlightSettings(currentSettings => ({
      ...currentSettings, // Preserve user inputs (passenger weight, cargo weight)
      // Apply OSDK policy values (these are the authoritative source) - Use ?? to allow 0 values
      contingencyFuelPercent: policySettings.contingencyFlightLegs ?? currentSettings.contingencyFuelPercent ?? 5,
      taxiFuel: policySettings.taxiFuel ?? currentSettings.taxiFuel ?? 50,
      reserveFuel: policySettings.reserveFuel ?? currentSettings.reserveFuel ?? 600,
      deckTimePerStop: policySettings.deckTime ?? currentSettings.deckTimePerStop ?? 5,
      // deckFuelFlow could come from policy or aircraft, keep existing for now
      deckFuelFlow: currentSettings.deckFuelFlow || 400
    }));

    console.log('✅ FUEL POLICY: Applied policy values to flightSettings');
  }, [fuelPolicy.currentPolicy?.uuid, fuelPolicy.getCurrentPolicySettings]); // Trigger when policy changes

  // Effect to clear route when activeRegionFromContext (from useRegion) changes
  const firstLoadDone = useRef(false);
  const lastRegionId = useRef(null);
  
  useEffect(() => {
    // Skip if region is not set yet
    if (!activeRegionFromContext) return;
    
    // Skip on first load
    if (!firstLoadDone.current) {
      firstLoadDone.current = true;
      lastRegionId.current = activeRegionFromContext.id;
      return;
    }
    
    // Skip if the region hasn't actually changed (prevents unnecessary clearing)
    if (lastRegionId.current === activeRegionFromContext.id) {
      return;
    }
    
    // Update reference for next comparison
    lastRegionId.current = activeRegionFromContext.id;
    
    console.log('FastPlannerCore: activeRegionFromContext changed to', activeRegionFromContext.name);
    
    // Just clear React state since RegionContext now handles the map cleanup
    setWaypoints([]);
    setRouteStats(null);
    setStopCards([]);
    
    // 🚨 REMOVED: No cache writes - regional change only clears route state
  }, [activeRegionFromContext, setWaypoints, setRouteStats, setStopCards]);

  const handleAddFavoriteLocation = (location) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      appManagers.favoriteLocationsManagerRef.current.addFavoriteLocation(location);
      const updatedFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocations();
      setFavoriteLocations(updatedFavorites);
    }
  };

  // ✅ SINGLE SOURCE OF TRUTH: Wrapper for extracted generateStopCardsData utility
  const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather, options = {}) => {
    return generateStopCardsUtil(waypoints, routeStats, selectedAircraft, weather, fuelPolicy, options);
  };

  // Make generateStopCardsData available globally for debugging
  window.generateStopCardsData = generateStopCardsData;

  const handleRemoveFavoriteLocation = (locationId) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      appManagers.favoriteLocationsManagerRef.current.removeFavoriteLocation(locationId);
      setFavoriteLocations(appManagers.favoriteLocationsManagerRef.current.getFavoriteLocations());
    }
  };

  // Handle alternate route input changes
  const handleAlternateRouteInputChange = (value) => {
    setAlternateRouteInput(value);
  };

  // Helper function to determine split point for new flights
  const determineNewFlightSplitPoint = useCallback((currentWaypoints) => {
    console.log('🎯 Determining split point for new flight');
    console.log('🎯 Current waypoints:', currentWaypoints?.length || 0);
    
    if (!currentWaypoints || currentWaypoints.length === 0) {
      console.log('🎯 No waypoints available, using default split point: ENXW');
      return "ENXW"; // Default fallback
    }
    
    // Find the first landing point (stop)
    // Landing points have labels like "(Stop1)", "(Stop2)", etc., or "(Des)" for destination
    for (let i = 0; i < currentWaypoints.length; i++) {
      const waypoint = currentWaypoints[i];
      const waypointName = waypoint.name || waypoint.id || '';
      
      console.log(`🎯 Checking waypoint ${i}: ${waypointName}`);
      
      // Skip departure point
      if (waypointName.includes('(Dep)')) {
        console.log('🎯 Skipping departure point');
        continue;
      }
      
      // Look for first landing point (Stop or Des)
      if (waypointName.includes('(Stop') || waypointName.includes('(Des)')) {
        // Extract the base location name (remove the label)
        const splitPoint = waypointName.split(' (')[0].trim();
        console.log(`🎯 Found first landing point as split point: ${splitPoint}`);
        return splitPoint;
      }
      
      // If waypoint doesn't have labels, assume stops are any waypoint after departure
      if (i > 0) {
        const splitPoint = waypointName.trim();
        console.log(`🎯 Using waypoint ${i} as split point (no labels): ${splitPoint}`);
        return splitPoint;
      }
    }
    
    // Fallback: use last waypoint if no stops found
    if (currentWaypoints.length > 0) {
      const lastWaypoint = currentWaypoints[currentWaypoints.length - 1];
      const splitPoint = (lastWaypoint.name || lastWaypoint.id || '').split(' (')[0].trim();
      console.log(`🎯 Using last waypoint as split point: ${splitPoint}`);
      return splitPoint;
    }
    
    console.log('🎯 No suitable waypoints found, using default: ENXW');
    return "ENXW"; // Ultimate fallback
  }, []);

  // Handle alternate route submission
  const handleAlternateRouteSubmit = async (input) => {
    console.log('🛣️ handleAlternateRouteSubmit called with:', input);
    
    try {
      // Parse the input to determine if it's single location or pair
      const trimmedInput = input.trim();
      const locations = trimmedInput.split(/\s+/).filter(loc => loc.length > 0);
      
      console.log('🛣️ Parsed locations:', locations);
      
      // Helper function to look up coordinates for a location
      const getLocationCoordinates = async (locationName) => {
        try {
          // Use the platform manager to find the location
          if (appManagers.platformManagerRef?.current) {
            const platforms = appManagers.platformManagerRef.current.getPlatforms();
            const platform = platforms.find(p => 
              p.name?.toUpperCase() === locationName.toUpperCase() ||
              p.id?.toUpperCase() === locationName.toUpperCase()
            );
            
            if (platform && platform.coordinates) {
              console.log(`🛣️ Found coordinates for ${locationName}:`, platform.coordinates);
              return platform.coordinates; // [lng, lat]
            }
          }
          
          console.warn(`🛣️ Could not find coordinates for location: ${locationName}`);
          return null;
        } catch (error) {
          console.error(`🛣️ Error looking up coordinates for ${locationName}:`, error);
          return null;
        }
      };
      
      if (locations.length === 1) {
        // Single location - determine split point based on context
        console.log('🛣️ Single location alternate route');
        const destination = locations[0];
        
        // ENHANCED SPLIT POINT LOGIC
        let currentSplitPoint;
        
        if (alternateRouteData?.splitPoint) {
          // LOADED FLIGHT: Use existing split point from flight data
          currentSplitPoint = alternateRouteData.splitPoint;
          console.log('🛣️ Using existing split point from loaded flight:', currentSplitPoint);
        } else {
          // NEW FLIGHT: Determine split point from current waypoints
          currentSplitPoint = determineNewFlightSplitPoint(waypoints);
          console.log('🛣️ Determined split point for new flight:', currentSplitPoint);
        }
        
        // Look up coordinates for both locations
        const fromCoords = await getLocationCoordinates(currentSplitPoint);
        const toCoords = await getLocationCoordinates(destination);
        
        if (fromCoords && toCoords) {
          // Create actual coordinates array
          const coordinates = [fromCoords, toCoords];
          
          const newAlternateRouteData = {
            coordinates: coordinates,
            splitPoint: currentSplitPoint,
            name: `${currentSplitPoint} ${destination} (Alternate)`, // Correct format: FROM TO (Alternate)
            geoPoint: `${toCoords[1]},${toCoords[0]}`, // lat,lng format
            legIds: []
          };
          
          console.log('🛣️ Created single location alternate route with real coordinates:', newAlternateRouteData);
          setAlternateRouteData(newAlternateRouteData);
          
          // Trigger map update immediately
          if (appManagers.waypointManagerRef?.current) {
            console.log('🛣️ Triggering immediate map update for new alternate route');
            appManagers.waypointManagerRef.current.updateRoute(routeStats, newAlternateRouteData);
          }
        } else {
          console.error('🛣️ Could not find coordinates for alternate route locations');
          return;
        }
        
      } else if (locations.length === 2) {
        // Pair of locations - custom from/to route
        console.log('🛣️ Custom from/to alternate route');
        const [from, to] = locations;
        console.log(`🛣️ Creating alternate route from ${from} to ${to}`);
        
        // Look up coordinates for both locations
        const fromCoords = await getLocationCoordinates(from);
        const toCoords = await getLocationCoordinates(to);
        
        if (fromCoords && toCoords) {
          // Create actual coordinates array
          const coordinates = [fromCoords, toCoords];
          
          const newAlternateRouteData = {
            coordinates: coordinates,
            splitPoint: from,
            name: `${from} ${to} (Alternate)`,
            geoPoint: `${toCoords[1]},${toCoords[0]}`, // lat,lng format
            legIds: []
          };
          
          console.log('🛣️ Created custom from/to alternate route with real coordinates:', newAlternateRouteData);
          setAlternateRouteData(newAlternateRouteData);
          
          // Trigger map update immediately
          if (appManagers.waypointManagerRef?.current) {
            console.log('🛣️ Triggering immediate map update for new alternate route');
            appManagers.waypointManagerRef.current.updateRoute(routeStats, newAlternateRouteData);
          }
        } else {
          console.error('🛣️ Could not find coordinates for alternate route locations');
          return;
        }
        
      } else {
        console.error('🛣️ Invalid alternate route format. Expected 1 or 2 locations.');
        return;
      }
      
      // Update the input field to show the formatted name
      const newName = locations.length === 1 ? 
        `${alternateRouteData?.splitPoint || "ENXW"} ${locations[0]} (Alternate)` : 
        `${locations[0]} ${locations[1]} (Alternate)`;
      setAlternateRouteInput(newName);
      
    } catch (error) {
      console.error('🛣️ Error processing alternate route:', error);
    }
  };

  // Handle loading a flight from the LoadFlightsCard
  const handleFlightLoad = async (flightData) => {
    try {
      console.log('🚁 handleFlightLoad CALLED with flight:', flightData.flightNumber || flightData.name);
      console.log('🚁 Aircraft ID in flight data:', flightData.aircraftId);
      
      // CRITICAL FIX: Apply wind data from loaded flight if available
      if (flightData.windData) {
        console.log('🌬️ Applying wind data from loaded flight:', flightData.windData);
        console.log('🌬️ Current weather state before update:', weather);
        
        const newWeather = {
          windSpeed: flightData.windData.windSpeed || 0,
          windDirection: flightData.windData.windDirection || 0,
          source: flightData.windData.source || 'loaded_flight'
        };
        
        console.log('🌬️ Setting new weather state:', newWeather);
        setWeather(newWeather);
        
      } else {
        console.log('⚠️ No wind data found in loaded flight:', flightData);
      }
      
      // Clear existing route first
      clearRoute();
      
      // Wait for clear to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Build and set the route from stops using the proper handler
      // BUT ONLY if we don't have waypoint data (to avoid double loading)
      const hasWaypointData = (flightData.displayWaypoints && flightData.displayWaypoints.length > 0) ||
                            (flightData.waypoints && flightData.waypoints.length > 0);
      
      if (flightData.stops && flightData.stops.length > 0 && !hasWaypointData) {
        console.log(`Loading ${flightData.stops.length} stops as route (no waypoint data available)`);
        
        // Create a route string by joining the stops
        const routeString = flightData.stops.join(' ');
        console.log(`Setting route input to: ${routeString}`);
        
        // Set the route input field for display
        setRouteInput(routeString);
        
        // Actually process the route to create waypoints using the hookAddWaypoint function
        console.log('Processing route string to create waypoints...');
        try {
          if (hookAddWaypoint) {
            await hookAddWaypoint(routeString);
            console.log('Route processing completed via hookAddWaypoint');
          } else {
            console.warn('hookAddWaypoint not available, trying alternative method');
            // Alternative: use the addWaypointDirectImpl if available
            if (window.addWaypointClean) {
              await window.addWaypointClean(routeString);
              console.log('Route processing completed via addWaypointClean');
            } else {
              console.error('No waypoint processing function available');
            }
          }
        } catch (error) {
          console.error('Error processing route:', error);
        }
        
        // Wait for waypoint processing to complete with improved timing
        console.log('Waiting for waypoint processing to complete...');
        
        // Use a more robust waiting mechanism
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 500; // Check every 500ms
        
        const waitForWaypoints = () => {
          return new Promise((resolve) => {
            const checkWaypoints = () => {
              attempts++;
              
              // Get current waypoints from multiple sources
              const currentWaypoints = waypoints || 
                                     window.waypointManager?.getWaypoints?.() || 
                                     appManagers.waypointManagerRef?.current?.getWaypoints?.() ||
                                     [];
              
              console.log(`Attempt ${attempts}: Found ${currentWaypoints.length} waypoints`);
              
              // Check if we have the expected number of waypoints (at least the stops)
              if (currentWaypoints.length >= flightData.stops.length || attempts >= maxAttempts) {
                console.log(`Waypoint processing complete: ${currentWaypoints.length} waypoints created`);
                resolve(currentWaypoints);
              } else {
                console.log(`Waiting for more waypoints... (expected at least ${flightData.stops.length})`);
                setTimeout(checkWaypoints, checkInterval);
              }
            };
            
            checkWaypoints();
          });
        };
        
        // Wait for waypoints to be processed
        const processedWaypoints = await waitForWaypoints();
        
        console.log('Triggering stop card generation after flight load...');
        const currentRouteStats = routeStats || window.currentRouteStats;
          
        console.log(`Found ${processedWaypoints.length} waypoints for stop card generation`);
        console.log('Waypoints:', processedWaypoints.map(wp => wp.name || 'unnamed').join(', '));
        
        if (processedWaypoints && processedWaypoints.length >= 2) {
          console.log(`Generating stop cards for ${processedWaypoints.length} waypoints`);
          
          // Generate stop cards using the same logic as normal route building
          const newStopCards = generateStopCardsData(
            processedWaypoints, 
            currentRouteStats, 
            selectedAircraft, 
            weather
          );
          
          if (newStopCards && newStopCards.length > 0) {
            console.log(`Generated ${newStopCards.length} stop cards for loaded flight`);
            setStopCards(newStopCards);
            
            // Make stop cards globally available for debugging
            window.debugStopCards = newStopCards;
            console.log('Stop cards available at window.debugStopCards');
            
            // Update loading indicator with success
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Flight loaded: ${flightData.flightNumber || 'Unknown'} with ${flightData.stops.length} stops`, 
                'success',
                3000
              );
            }
          } else {
            console.warn('Stop card generation returned no results');
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'Flight loaded but stop cards could not be generated', 
                'warning',
                3000
              );
            }
          }
        } else {
          console.warn(`Insufficient waypoints for stop card generation (need >= 2, have ${processedWaypoints.length})`);
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Flight loaded but insufficient waypoints for route calculation', 
              'warning',
              3000
            );
          }
        }
      }
      
      // Load weather segments for the flight if flightId is available
      if (flightData.flightId || flightData.id) {
        const flightId = flightData.flightId || flightData.id;
        console.log('🌤️ Loading weather segments for flight:', flightId);
        
        // Set current flight ID for WeatherCard
        setCurrentFlightId(flightId);
        
        try {
          const weatherResult = await loadWeatherSegments(flightId);
          if (weatherResult && weatherResult.segments && weatherResult.segments.length > 0) {
            console.log(`🌤️ Loaded ${weatherResult.segments.length} weather segments`);
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Weather segments loaded: ${weatherResult.segments.length} locations`, 
                'success',
                3000
              );
            }
          } else {
            console.log('🌤️ No weather segments found for this flight');
          }
        } catch (weatherError) {
          console.error('🌤️ Error loading weather segments:', weatherError);
          // Don't block flight loading if weather fails
        }
      } else {
        console.log('🌤️ No flight ID available for weather segments loading');
      }
      
      // CRITICAL FIX: Force wind input UI update at the end of flight loading
      if (flightData.windData) {
        console.log('🌬️ FINAL: Updating wind input UI with loaded flight data');
        console.log('🌬️ Wind data to apply:', flightData.windData);
        
        // Force update wind input fields by setting values directly
        setTimeout(() => {
          // Find wind input elements and update them
          const windDirectionInput = document.querySelector('input[value="' + weather.windDirection + '"]') || 
                                   document.querySelector('#wind-direction') ||
                                   document.querySelector('input[placeholder*="direction" i]');
          const windSpeedInput = document.querySelector('input[value="' + weather.windSpeed + '"]') || 
                               document.querySelector('#wind-speed') ||
                               document.querySelector('input[placeholder*="speed" i]');
          
          if (windDirectionInput) {
            windDirectionInput.value = flightData.windData.windDirection;
            windDirectionInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('🌬️ Updated wind direction input to:', flightData.windData.windDirection);
          }
          
          if (windSpeedInput) {
            windSpeedInput.value = flightData.windData.windSpeed;
            windSpeedInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('🌬️ Updated wind speed input to:', flightData.windData.windSpeed);
          }
          
          // CRITICAL FIX: Force stop cards regeneration with new wind data
          if (waypoints && waypoints.length >= 2 && selectedAircraft) {
            console.log('🔄 Regenerating stop cards with loaded flight wind data');
            const currentRouteStats = routeStats || window.currentRouteStats;
            
            // Use the updated weather state for stop card regeneration
            const updatedWeather = {
              windSpeed: flightData.windData.windSpeed,
              windDirection: flightData.windData.windDirection,
              source: 'loaded_flight'
            };
            
            const newStopCards = generateStopCardsData(
              waypoints,
              currentRouteStats,
              selectedAircraft,
              updatedWeather,
              {
                passengerWeight: flightSettings.passengerWeight,
                taxiFuel: flightSettings.taxiFuel,
                contingencyFuelPercent: flightSettings.contingencyFuelPercent,
                reserveFuel: flightSettings.reserveFuel,
                deckTimePerStop: flightSettings.deckTimePerStop,
                deckFuelFlow: flightSettings.deckFuelFlow
              }
            );
            
            if (newStopCards && newStopCards.length > 0) {
              console.log('🔄 Updated stop cards with new wind data:', newStopCards.length, 'cards');
              setStopCards(newStopCards);
            }
          }
        }, 100);
      }
      
      // After loading completes, ensure we return to the main card
      setTimeout(() => {
        // The RightPanel should automatically show stop cards if they exist
        // This timeout ensures the panel switches back to main view after loading
        console.log('Flight loading complete - returning to main view');
      }, 2000);
      
      // Process waypoints - handle both displayWaypoints (strings) and waypoints (objects)
      let waypointsToProcess = [];
      
      if (flightData.displayWaypoints && flightData.displayWaypoints.length > 0) {
        console.log('Using displayWaypoints format');
        waypointsToProcess = flightData.displayWaypoints;
      } else if (flightData.waypoints && flightData.waypoints.length > 0) {
        console.log('Using waypoints format - converting to displayWaypoints format');
        console.log('Flight waypoints:', flightData.waypoints);
        console.log('Flight stops:', flightData.stops);
        
        // We need to reconstruct the full sequence from the original displayWaypoints
        // Check if we have the raw flight data with the original displayWaypoints
        if (flightData._rawFlight && flightData._rawFlight.displayWaypoints) {
          const rawDisplayWaypoints = flightData._rawFlight.displayWaypoints;
          console.log('Found raw displayWaypoints:', rawDisplayWaypoints);
          
          if (typeof rawDisplayWaypoints === 'string' && rawDisplayWaypoints.includes('|')) {
            waypointsToProcess = rawDisplayWaypoints.split('|').map(wp => wp.trim()).filter(wp => wp.length > 0);
            console.log('Using parsed raw displayWaypoints:', waypointsToProcess);
          } else if (Array.isArray(rawDisplayWaypoints)) {
            waypointsToProcess = rawDisplayWaypoints;
            console.log('Using raw displayWaypoints array:', waypointsToProcess);
          }
        }
        
        // Fallback: reconstruct from waypoints + stops if raw data not available
        if (waypointsToProcess.length === 0) {
          console.log('Reconstructing displayWaypoints from waypoints and stops...');
          
          // Create a basic sequence: departure + waypoints + destination
          const stops = flightData.stops || [];
          const waypoints = flightData.waypoints || [];
          
          if (stops.length >= 2) {
            // Add departure
            waypointsToProcess.push(`${stops[0]} (Dep)`);
            
            // Add navigation waypoints (they don't have coordinates so we'll use name-based lookup)
            for (const wp of waypoints) {
              if (wp.name && !wp.isStop) {
                waypointsToProcess.push(wp.name);
              }
            }
            
            // Add intermediate stops
            for (let i = 1; i < stops.length - 1; i++) {
              waypointsToProcess.push(`${stops[i]} (Stop${i})`);
            }
            
            // Add destination
            waypointsToProcess.push(`${stops[stops.length - 1]} (Des)`);
          }
        }
        
        console.log('Final converted waypoints:', waypointsToProcess);
      }
      
      if (waypointsToProcess.length > 0) {
        console.log(`Loading flight waypoints with coordinate placement - ${waypointsToProcess.length} waypoints`);
        
        // Set the route input for display (just the stops)
        if (flightData.stops && flightData.stops.length > 0) {
          const routeString = flightData.stops.join(' ');
          console.log(`Setting route input to: ${routeString}`);
          setRouteInput(routeString);
        }
        
        try {
          // Get the full route coordinates from the raw flight data
          const rawFlight = flightData._rawFlight;
          let routeCoordinates = [];
          let alternateRouteData = null;
          
          console.log('DEBUG: Raw flight object:', rawFlight);
          
          if (rawFlight && rawFlight.fullRouteGeoShape) {
            console.log('DEBUG: Found fullRouteGeoShape, extracting coordinates...');
            // Extract coordinates from the GeoShape
            const geoShape = rawFlight.fullRouteGeoShape.toGeoJson ? 
              rawFlight.fullRouteGeoShape.toGeoJson() : rawFlight.fullRouteGeoShape;
              
            console.log('DEBUG: GeoShape:', geoShape);
              
            if (geoShape && geoShape.coordinates) {
              routeCoordinates = geoShape.coordinates;
              console.log(`Found ${routeCoordinates.length} coordinate points in route`);
              console.log('First few coordinates:', routeCoordinates.slice(0, 3));
            } else {
              console.warn('DEBUG: No coordinates found in geoShape');
            }
          } else {
            console.warn('DEBUG: No fullRouteGeoShape found in raw flight');
          }
          
          // Extract alternate route data if available
          if (rawFlight && rawFlight.alternateFullRouteGeoShape) {
            console.log('DEBUG: Found alternateFullRouteGeoShape, extracting alternate route data...');
            
            // Extract alternate route coordinates
            const alternateGeoShape = rawFlight.alternateFullRouteGeoShape.toGeoJson ? 
              rawFlight.alternateFullRouteGeoShape.toGeoJson() : rawFlight.alternateFullRouteGeoShape;
              
            console.log('DEBUG: Alternate GeoShape:', alternateGeoShape);
            
            if (alternateGeoShape && alternateGeoShape.coordinates) {
              alternateRouteData = {
                coordinates: alternateGeoShape.coordinates,
                splitPoint: rawFlight.alternateSplitPoint || null,
                name: rawFlight.alternateName || 'Alternate Route',
                geoPoint: rawFlight.alternateGeoPoint || null,
                legIds: rawFlight.alternateLegIds || []
              };
              
              console.log(`DEBUG: Found alternate route with ${alternateRouteData.coordinates.length} coordinate points`);
              console.log('DEBUG: Alternate split point:', alternateRouteData.splitPoint);
              console.log('DEBUG: Alternate name:', alternateRouteData.name);
              console.log('DEBUG: Alternate coordinates:', alternateRouteData.coordinates);
            } else {
              console.warn('DEBUG: No coordinates found in alternate geoShape');
            }
          } else {
            console.log('DEBUG: No alternateFullRouteGeoShape found in raw flight');
          }
          
          // Store alternate route data in state for rendering
          if (alternateRouteData) {
            console.log('DEBUG: Storing alternate route data in component state');
            setAlternateRouteData(alternateRouteData);
            
            // Also populate the alternate route input field with the current alternate name
            console.log('DEBUG: Setting alternate route input to:', alternateRouteData.name);
            setAlternateRouteInput(alternateRouteData.name);
          } else {
            console.log('DEBUG: Clearing alternate route data (no alternate route in flight)');
            setAlternateRouteData(null);
            setAlternateRouteInput(''); // Clear input field too
          }
          
          // Get the waypoint names with labels
          const displayWaypoints = waypointsToProcess;
          console.log(`Display waypoints: ${displayWaypoints.join(', ')}`);
          
          // Match waypoints with coordinates and place them directly
          if (routeCoordinates.length > 0 && displayWaypoints.length === routeCoordinates.length) {
            console.log('Coordinate count matches waypoint count - proceeding with direct placement');
            
            // Wait for stops to be processed first
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Clear any existing waypoints first
            if (appManagers.waypointManagerRef?.current) {
              console.log('Clearing existing waypoints before loading flight waypoints');
              if (typeof appManagers.waypointManagerRef.current.clearWaypoints === 'function') {
                appManagers.waypointManagerRef.current.clearWaypoints();
              } else {
                console.log('clearWaypoints method not available, skipping waypoint clearing');
              }
            }
            
            // Add each waypoint using direct coordinates
            for (let i = 0; i < displayWaypoints.length; i++) {
              const waypointLabel = displayWaypoints[i];
              const coordinates = routeCoordinates[i]; // [lng, lat]
              
              // Parse the waypoint name and determine type
              const isStop = waypointLabel.includes('(Dep)') || 
                           waypointLabel.includes('(Stop') || 
                           waypointLabel.includes('(Des)');
              
              // Clean name (remove labels)
              const cleanName = waypointLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
              
              console.log(`Adding ${isStop ? 'STOP' : 'WAYPOINT'}: ${cleanName} at [${coordinates[0]}, ${coordinates[1]}]`);
              
              try {
                // Add the waypoint using direct coordinates
                if (appManagers.waypointManagerRef?.current) {
                  await appManagers.waypointManagerRef.current.addWaypoint(
                    coordinates, // [lng, lat]
                    cleanName,
                    {
                      isWaypoint: !isStop,
                      type: isStop ? 'LANDING_STOP' : 'WAYPOINT'
                    }
                  );
                  console.log(`Successfully placed ${isStop ? 'stop' : 'waypoint'}: ${cleanName}`);
                }
                
                // Small delay between placements to avoid conflicts
                await new Promise(resolve => setTimeout(resolve, 50));
                
              } catch (error) {
                console.error(`Error placing waypoint ${cleanName}:`, error);
                // Continue with other waypoints even if one fails
              }
            }
            
            console.log('All flight waypoints and stops loaded successfully');
            
            // Update loading indicator
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Loaded ${displayWaypoints.length} waypoints from flight`, 
                'success',
                2000
              );
            }
            
          } else {
            console.warn(`Coordinate/waypoint count mismatch: ${routeCoordinates.length} coordinates vs ${displayWaypoints.length} waypoints`);
            // Fallback to the original method if counts don't match
            console.log('Falling back to name-based waypoint loading...');
            
            for (const waypointLabel of displayWaypoints) {
              const isStop = waypointLabel.includes('(Dep)') || 
                           waypointLabel.includes('(Stop') || 
                           waypointLabel.includes('(Des)');
              
              if (!isStop) { // Only add navigation waypoints, stops already handled
                const cleanName = waypointLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
                
                try {
                  if (appManagers.waypointManagerRef?.current?.addWaypointByName) {
                    await appManagers.waypointManagerRef.current.addWaypointByName(cleanName, {
                      isWaypoint: true,
                      type: 'WAYPOINT'
                    });
                  }
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.error(`Error adding waypoint ${cleanName}:`, error);
                }
              }
            }
          }
          
        } catch (error) {
          console.error('Error loading flight waypoints:', error);
        }
      } else {
        console.log('DEBUG: No displayWaypoints found, checking combinedWaypoints...');
        
        // Fallback: try using combinedWaypoints if displayWaypoints is not available
        if (flightData.combinedWaypoints && flightData.combinedWaypoints.length > 0) {
          console.log('DEBUG: Using combinedWaypoints as fallback');
          console.log('Combined waypoints:', flightData.combinedWaypoints);
          
          try {
            // Process combinedWaypoints - these don't have labels so we need to determine type differently
            const stops = flightData.stops || [];
            
            for (const waypointName of flightData.combinedWaypoints) {
              const isStop = stops.includes(waypointName);
              
              if (!isStop) { // Only add navigation waypoints, stops are already handled
                console.log(`Adding navigation waypoint from combinedWaypoints: ${waypointName}`);
                
                try {
                  if (appManagers.waypointManagerRef?.current?.addWaypointByName) {
                    await appManagers.waypointManagerRef.current.addWaypointByName(waypointName, {
                      isWaypoint: true,
                      type: 'WAYPOINT'
                    });
                    console.log(`Successfully added waypoint: ${waypointName}`);
                  }
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.error(`Error adding waypoint ${waypointName}:`, error);
                }
              }
            }
          } catch (error) {
            console.error('Error processing combinedWaypoints:', error);
          }
        } else {
          console.log('DEBUG: No waypoints to load (neither displayWaypoints nor combinedWaypoints available)');
        }
      }
      
      // Set aircraft if available
      console.log('🛩️ Checking aircraft restoration conditions:');
      console.log('🛩️ flightData.aircraftId:', flightData.aircraftId);
      console.log('🛩️ appManagers.aircraftManagerRef?.current exists:', !!appManagers.aircraftManagerRef?.current);
      
      if (flightData.aircraftId && appManagers.aircraftManagerRef?.current) {
        console.log(`Restoring aircraft: ${flightData.aircraftId}`);
        try {
          // Get available aircraft using the correct method
          const availableAircraft = appManagers.aircraftManagerRef.current.filterAircraft(flightData.region);
          console.log(`Searching in ${availableAircraft.length} available aircraft for region: ${flightData.region}`);
          console.log('🔍 Sample aircraft structure:', availableAircraft[0]);
          console.log('🔍 Looking for aircraftId:', flightData.aircraftId);
          
          const matchingAircraft = availableAircraft.find(aircraft => {
            return aircraft.aircraftId === flightData.aircraftId || 
                   aircraft.id === flightData.aircraftId ||
                   aircraft.rawRegistration === flightData.aircraftId ||  // Use rawRegistration!
                   aircraft.registration === flightData.aircraftId ||
                   aircraft.name === flightData.aircraftId;
          });
          
          if (matchingAircraft) {
            console.log(`✅ Aircraft restored: ${matchingAircraft.name || matchingAircraft.registration || matchingAircraft.aircraftId}`);
            setSelectedAircraft(matchingAircraft);
            
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Aircraft restored: ${matchingAircraft.name || matchingAircraft.registration}`, 
                'success',
                2000
              );
            }
          } else {
            console.warn(`❌ Aircraft ${flightData.aircraftId} not found. Available aircraft:`, 
              availableAircraft.map(a => a.aircraftId || a.id || a.registration).join(', '));
          }
        } catch (error) {
          console.error('Error restoring aircraft:', error);
        }
      } else {
        console.log('🛩️ Aircraft restoration skipped - missing aircraftId or aircraftManager');
      }
      
      // Update status
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Flight loaded: ${flightData.flightNumber || 'Unknown'} with ${flightData.stops.length} stops`, 
          'success',
          3000
        );
      }
      
    } catch (error) {
      console.error('Error loading flight:', error);
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to load flight: ${error.message}`, 
          'error'
        );
      }
    }
  };
  
  const loadCustomChart = () => console.log("loadCustomChart - Not implemented");

  // RegionAircraftConnector removed - using only event-based region sync

  return (
    <>
      {/* RegionAircraftConnector removed - using only event-based region sync */}
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
        {/* New iPad-friendly header */}
        <AppHeader
          selectedAircraft={selectedAircraft}
          stopCards={stopCards}
          taxiFuel={flightSettings.taxiFuel}
          reserveFuel={flightSettings.reserveFuel}
          contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          deckTimePerStop={flightSettings.deckTimePerStop}
          isLoading={aircraftLoading || rigsLoading}
          loadingText={aircraftLoading ? "Loading aircraft..." : rigsLoading ? "Loading platforms..." : ""}
          weather={weather}
          waypoints={waypoints}
        />
        
        {/* Map container - now full width below header */}
        <div className="map-container">
          {/* Controlled loading bar - graceful finish */}
          <div className={`map-loading-container ${isActuallyLoading ? (isFinishing ? 'finishing' : 'loading') : ''}`}>
            <div className="map-loading-bar"></div>
          </div>
          <MapComponent mapManagerRef={mapManagerRef} onMapReady={handleMapReadyImpl} className="fast-planner-map" />
          <MapZoomHandler mapManagerRef={mapManagerRef} />
        </div>
        <LeftPanel
          visible={leftPanelVisible} onToggleVisibility={toggleLeftPanel} waypoints={waypoints}
          onRemoveWaypoint={removeWaypoint} onWaypointNameChange={updateWaypointName}
          onAddWaypoint={hookAddWaypoint} onReorderWaypoints={reorderWaypoints} routeInput={routeInput}
          onRouteInputChange={handleRouteInputChange} favoriteLocations={favoriteLocations}
          alternateRouteInput={alternateRouteInput} onAlternateRouteInputChange={handleAlternateRouteInputChange}
          onAlternateRouteSubmit={handleAlternateRouteSubmit}
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
          stopCards={stopCards} waypoints={waypoints} onRemoveWaypoint={removeWaypoint} isAuthenticated={isAuthenticated}
          authUserName={userName} rigsLoading={rigsLoading} onLogin={login}
          onFlightLoad={handleFlightLoad} // Add flight loading handler
          deckTimePerStop={flightSettings.deckTimePerStop} deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight} cargoWeight={flightSettings.cargoWeight}
          extraFuel={flightSettings.extraFuel}
          taxiFuel={flightSettings.taxiFuel} contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel} reserveMethod={reserveMethod}
          onDeckTimeChange={(value) => updateFlightSetting('deckTimePerStop', value)}
          onDeckFuelFlowChange={(value) => updateFlightSetting('deckFuelFlow', value)}
          onPassengerWeightChange={(value) => updateFlightSetting('passengerWeight', value)}
          onCargoWeightChange={(value) => updateFlightSetting('cargoWeight', value)}
          onExtraFuelChange={(value) => updateFlightSetting('extraFuel', value)}
          onTaxiFuelChange={(value) => updateFlightSetting('taxiFuel', value)}
          onContingencyFuelPercentChange={(value) => updateFlightSetting('contingencyFuelPercent', value)}
          onReserveMethodChange={(value) => updateFlightSetting('reserveMethod', value)}
          onReserveFuelChange={(value) => updateFlightSetting('reserveFuel', value)}
          forceUpdate={forceUpdate} weather={weather} onWeatherUpdate={updateWeatherSettings}
          
          // Fuel policy props
          fuelPolicy={fuelPolicy}
          currentRegion={activeRegionFromContext}
          
          mapManagerRef={mapManagerRef}
          gulfCoastMapRef={gulfCoastMapRef}
          weatherLayerRef={weatherLayerRef}
          vfrChartsRef={vfrChartsRef}
          platformManagerRef={platformManagerRef}
          airfieldsVisible={airfieldsVisible}
          fixedPlatformsVisible={fixedPlatformsVisible} // Legacy
          movablePlatformsVisible={movablePlatformsVisible}
          blocksVisible={blocksVisible} // New prop
          basesVisible={basesVisible} // New prop for bases
          fuelAvailableVisible={fuelAvailableVisible} // New prop
          toggleAirfieldsVisibility={toggleAirfieldsVisibility}
          toggleFixedPlatformsVisibility={toggleFixedPlatformsVisibility} // Legacy
          toggleMovablePlatformsVisibility={toggleMovablePlatformsVisibility}
          toggleBlocksVisibility={toggleBlocksVisibility} // New prop
          toggleBasesVisibility={toggleBasesVisibility} // New prop for bases
          toggleFuelAvailableVisibility={toggleFuelAvailableVisibility} // New prop
          alternateRouteData={alternateRouteData} // Add alternate route data for alternate stop card
          currentFlightId={currentFlightId} // Pass current flight ID for weather segments
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
    passengerWeight: 220, // ✅ User input - safe default
    contingencyFuelPercent: null, // ✅ SAFETY: Will be populated from OSDK fuel policy
    taxiFuel: null, // ✅ SAFETY: Will be populated from OSDK fuel policy
    reserveFuel: null, // ✅ SAFETY: Will be populated from OSDK fuel policy  
    deckTimePerStop: null, // ✅ SAFETY: Will be populated from OSDK fuel policy
    deckFuelFlow: null, // ✅ SAFETY: Will be populated from OSDK fuel policy or aircraft data
    cargoWeight: 0, // ✅ User input - safe default
    extraFuel: 0, // ✅ User input - safe default for manual fuel override
  });

  // 🔍 DEBUG: Track flightSettings changes to find when contingencyFuelPercent gets corrupted
  useEffect(() => {
    console.log('🔍 FLIGHT SETTINGS CHANGED:', {
      contingencyFuelPercent: flightSettings.contingencyFuelPercent,
      passengerWeight: flightSettings.passengerWeight,
      taxiFuel: flightSettings.taxiFuel,
      reserveFuel: flightSettings.reserveFuel,
      deckFuelFlow: flightSettings.deckFuelFlow, // ✅ Add this to track aircraft updates
      deckTimePerStop: flightSettings.deckTimePerStop
    });
  }, [flightSettings.contingencyFuelPercent, flightSettings.passengerWeight, flightSettings.taxiFuel, flightSettings.reserveFuel, flightSettings.deckFuelFlow, flightSettings.deckTimePerStop]);
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [stopCards, setStopCards] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [routeInput, setRouteInput] = useState('');
  const [reserveMethod, setReserveMethod] = useState('fixed');
  const [alternateRouteData, setAlternateRouteData] = useState(null);
  const [alternateRouteInput, setAlternateRouteInput] = useState('');

  // Define addWaypointDirect and its implementation here, so they can be passed to useManagers
  // and then the implementation to FastPlannerCore
  const addWaypointDirectRef = useRef(async (waypointData) => {
    // Initial placeholder, implementation will be set by addWaypointDirectImpl
    // Ensure appManagers is defined before trying to access its properties
    if (appManagers && appManagers.waypointManagerRef && appManagers.waypointManagerRef.current) {
        console.warn('addWaypointDirect placeholder called');
    } else {
        console.error('Cannot add waypoint: appManagers or waypointManagerRef not available in placeholder');
        return;
    }
  });

  // appManagers must be defined before addWaypointDirectImpl can use it.
  // So, we declare appManagers first.
  const appManagers = useManagers({
    client,
    setFavoriteLocations,
    setWaypoints,
    flightSettings,
    setFlightSettings,
    forceUpdate,
    setForceUpdate,
    addWaypoint: addWaypointDirectRef.current, 
    weather,
    setWeather
  });

  const addWaypointDirectImpl = async (waypointData) => {
    const { waypointManagerRef, platformManagerRef } = appManagers; 
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
    
    if (appManagers.waypointManagerRef && appManagers.waypointManagerRef.current) {
        appManagers.waypointManagerRef.current.addWaypoint(coords, name, { isWaypoint, type: isWaypoint ? 'WAYPOINT' : 'STOP' });
        const updatedWaypoints = appManagers.waypointManagerRef.current.getWaypoints();
        await new Promise(resolve => { setWaypoints([...updatedWaypoints]); setTimeout(resolve, 0); });
        console.log('🌐 Waypoints updated using direct implementation');
    } else {
        console.error('addWaypointDirectImpl: waypointManagerRef is not available on appManagers');
    }
  };
  
  // Effect to set the implementation on the ref after appManagers is initialized
  useEffect(() => {
    if (appManagers.waypointManagerRef && appManagers.platformManagerRef) {
        addWaypointDirectRef.current.implementation = addWaypointDirectImpl;
        // Ensure the addWaypointDirectImpl function is available globally for the input handlers
        window.addWaypointClean = addWaypointDirectImpl;
        console.log('🔧 Setting up global addWaypointClean function for input handlers');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appManagers.waypointManagerRef, appManagers.platformManagerRef]); 

  // Add mapReady handler to load aircraft data when map is ready
  const handleMapReadyImpl = useCallback((mapInstance) => {
    console.log("🗺️ Map is ready", mapInstance);

    // Wrap in try/catch for safety
    try {
      // Once the map is ready, load aircraft
      if (appManagers.aircraftManagerRef && appManagers.aircraftManagerRef.current && client) {
        console.log("Loading aircraft after map initialization");
        
        appManagers.aircraftManagerRef.current.loadAircraftFromOSDK(client)
          .then(() => {
            console.log("Aircraft loaded successfully");
            // Force update to refresh the UI with aircraft data
            setForceUpdate(prev => prev + 1);
          })
          .catch(error => {
            console.error(`Error loading aircraft: ${error}`);
          });
      }

      // Initialize map interactions if available
      if (appManagers.mapInteractionHandlerRef && appManagers.mapInteractionHandlerRef.current) {
        console.log("🗺️ Initializing map interaction handler...");
        appManagers.mapInteractionHandlerRef.current.initialize();
      }
    } catch (error) {
      console.error("Error in handleMapReady:", error);
    }
  }, [appManagers, client, setForceUpdate]);

  // Connect the handleMapReadyImpl to appManagers
  useEffect(() => {
    if (appManagers) {
      appManagers.handleMapReady = handleMapReadyImpl;
    }
  }, [appManagers, handleMapReadyImpl]);

  return (
    <RegionProvider
      mapManagerRef={appManagers.mapManagerRef}
      platformManagerRef={appManagers.platformManagerRef}
      waypointManagerRef={appManagers.waypointManagerRef}
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
        alternateRouteData={alternateRouteData} setAlternateRouteData={setAlternateRouteData}
        alternateRouteInput={alternateRouteInput} setAlternateRouteInput={setAlternateRouteInput}
        addWaypointDirectImplementation={addWaypointDirectImpl}
        handleMapReadyImpl={handleMapReadyImpl}
      />
    </RegionProvider>
  );
};

export default FastPlannerApp;
