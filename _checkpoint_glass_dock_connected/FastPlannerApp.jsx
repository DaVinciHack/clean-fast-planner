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

// Import WeatherFuelAnalyzer for weather-based fuel calculations
import WeatherFuelAnalyzer from './modules/fuel/weather/WeatherFuelAnalyzer.js';

// Import extracted utilities
import { generateStopCardsData as generateStopCardsUtil } from './utilities/FlightUtilities.js';

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  AppHeader
} from './components';

// Import GlassMenuDock for flight-loaded controls
import GlassMenuDock from './components/controls/GlassMenuDock';

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
  handleMapReadyImpl              // Pass the map ready implementation
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
  
  // Glass menu states for flight-loaded controls
  const [isFlightLoaded, setIsFlightLoaded] = useState(false);
  const [isEditLocked, setIsEditLocked] = useState(true); // Start locked to prevent accidental edits
  
  // State for weather-based fuel calculations
  const [weatherFuel, setWeatherFuel] = useState({ araFuel: 0, approachFuel: 0 });
  
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

  // 🚫 DISABLED: Manual route auto-zoom was causing unwanted second zoom during flight loading
  // Only keep the flight loading auto-zoom (after direct coordinate placement)

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
        {
          ...flightSettings,
          araFuel: weatherFuel.araFuel,
          approachFuel: weatherFuel.approachFuel
        }
      );
      
      if (newStopCards && newStopCards.length > 0) {
        setStopCards(newStopCards);
        console.log('✅ Auto-calculation complete - header should update');
      }
    }
  }, [waypoints, selectedAircraft, flightSettings, weather, weatherFuel]);

  // Weather segments integration - MOVED BEFORE clearRoute to fix initialization order
  const weatherSegmentsHook = useWeatherSegments({
    flightId: currentFlightId, // Pass current flight ID to enable weather loading
    mapManagerRef,
    onWeatherUpdate: updateWeatherSettings // Now using stub function
  });
  
  const {
    weatherSegments,
    weatherSegmentsLoading,
    weatherSegmentsError,
    loadWeatherSegments,
    toggleWeatherLayer,
    clearWeatherSegments
  } = weatherSegmentsHook;

  // Calculate weather-based fuel requirements whenever dependencies change
  useEffect(() => {
    // DEBUG: Always log what we have
    console.log('🔍 WEATHER FUEL CHECK:', {
      hasWeatherSegments: !!weatherSegments,
      weatherSegmentsLength: weatherSegments?.length || 0,
      hasWaypoints: !!waypoints,
      waypointsLength: waypoints?.length || 0,
      hasFuelPolicy: !!fuelPolicy,
      // Get actual fuel policy settings
      actualFuelPolicy: fuelPolicy?.getCurrentPolicySettings ? fuelPolicy.getCurrentPolicySettings() : 'No getCurrentPolicySettings method',
      currentPolicy: fuelPolicy?.currentPolicy,
    });
    
    // RACE CONDITION FIX: Add proper checks and prevent infinite loops
    if (weatherSegments && 
        Array.isArray(weatherSegments) && 
        weatherSegments.length > 0 && 
        waypoints && 
        waypoints.length >= 2 && 
        fuelPolicy && 
        fuelPolicy.getCurrentPolicySettings) {
      
      // Get actual fuel policy settings
      const actualFuelPolicy = fuelPolicy.getCurrentPolicySettings();
      console.log('🔍 ACTUAL FUEL POLICY:', actualFuelPolicy);
      
      if (actualFuelPolicy && 
          actualFuelPolicy.araFuel !== undefined && 
          actualFuelPolicy.approachFuel !== undefined) {
      
      try {
        console.log('🔍 DEBUG: Starting weather fuel analysis with:', {
          weatherSegments: weatherSegments.length,
          waypoints: waypoints.map(wp => wp.name || wp),
          araFuelDefault: actualFuelPolicy.araFuel,
          approachFuelDefault: actualFuelPolicy.approachFuel
        });
        
        const weatherAnalyzer = new WeatherFuelAnalyzer();
        const weatherAnalysis = weatherAnalyzer.analyzeWeatherForFuel(
          weatherSegments,
          waypoints,
          {
            araFuelDefault: actualFuelPolicy.araFuel || 0,
            approachFuelDefault: actualFuelPolicy.approachFuel || 0
          }
        );
        
        console.log('🔍 DEBUG: Weather analysis result:', {
          totalAraFuel: weatherAnalysis.totalAraFuel,
          totalApproachFuel: weatherAnalysis.totalApproachFuel,
          araRequirements: weatherAnalysis.araRequirements,
          approachRequirements: weatherAnalysis.approachRequirements,
          rigStops: weatherAnalysis.rigStops
        });
        
        const calculatedAraFuel = weatherAnalysis.totalAraFuel || 0;
        const calculatedApproachFuel = weatherAnalysis.totalApproachFuel || 0;
        
        // Only update state if values actually changed to prevent infinite loops
        setWeatherFuel(prevFuel => {
          if (prevFuel.araFuel !== calculatedAraFuel || prevFuel.approachFuel !== calculatedApproachFuel) {
            console.log('🌤️ Weather fuel updated:', {
              araFuel: calculatedAraFuel,
              approachFuel: calculatedApproachFuel,
              weatherSegments: weatherSegments.length,
              waypoints: waypoints.length
            });
            return {
              araFuel: calculatedAraFuel,
              approachFuel: calculatedApproachFuel
            };
          }
          return prevFuel; // No change, prevent re-render
        });
        
      } catch (error) {
        console.error('❌ Weather fuel calculation error:', error);
        setWeatherFuel(prevFuel => {
          if (prevFuel.araFuel !== 0 || prevFuel.approachFuel !== 0) {
            return { araFuel: 0, approachFuel: 0 };
          }
          return prevFuel;
        });
      }
      } else {
        console.log('🔍 Fuel policy missing ARA/Approach values:', actualFuelPolicy);
      }
    } else {
      // Only reset if currently not zero to prevent infinite loops
      setWeatherFuel(prevFuel => {
        if (prevFuel.araFuel !== 0 || prevFuel.approachFuel !== 0) {
          console.log('🌤️ Weather fuel reset - missing dependencies');
          return { araFuel: 0, approachFuel: 0 };
        }
        return prevFuel;
      });
    }
  }, [weatherSegments, waypoints, fuelPolicy?.araFuelDefault, fuelPolicy?.approachFuelDefault]);

  // AGGRESSIVE clearRoute that flushes all system state 
  const clearRoute = useCallback(() => {
    console.log('🟠 CLEAR ROUTE DEBUG: clearRoute() called');
    console.log('🟠 CLEAR ROUTE DEBUG: About to clear alternateRouteData - current value:', alternateRouteData);
    console.log('🟠 CLEAR ROUTE DEBUG: Stack trace:', new Error().stack);
    console.log('🧹 FastPlannerApp: AGGRESSIVE CLEARING - Flushing all system state');
    
    // Call the hook's clearRoute function
    hookClearRoute();
    
    // Clear alternate route state
    setAlternateRouteData(null);
    setAlternateRouteInput('');
    
    // Clear current flight ID and weather segments
    setCurrentFlightId(null);
    clearWeatherSegments();
    
    // AGGRESSIVE CLEANUP: Clear all persistent window state
    window.currentAlternateCard = null;
    window.loadedWeatherSegments = null;
    window.currentWeatherSegments = null;
    window.currentFlightData = null;
    window.currentWeatherAnalysis = null;
    window.debugStopCards = null;
    window.globalWaypoints = null;
    window.flightAlternateData = null;
    
    // Clear weather circles and any stuck locks
    if (window.currentWeatherCirclesLayer) {
      try {
        window.currentWeatherCirclesLayer.removeWeatherCircles();
        window.currentWeatherCirclesLayer = null;
      } catch (e) {
        console.warn('🧹 CLEAR: Error removing weather circles:', e.message);
      }
    }
    
    // Force clear any stuck weather circles locks
    window.weatherCirclesCreationInProgress = false;
    window.weatherCirclesLockTime = null;
    
    // Clear automation loader state if needed
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator('Route cleared', 'success');
    }
    
    // Reset weather fuel state
    setWeatherFuel({ araFuel: 0, approachFuel: 0 });
    
    console.log('✅ FastPlannerApp: AGGRESSIVE CLEAR COMPLETE - All system state flushed');
  }, [hookClearRoute, setAlternateRouteData, setAlternateRouteInput, clearWeatherSegments, alternateRouteData, setWeatherFuel]);
  
  // Make aggressive clear available globally for debugging
  useEffect(() => {
    window.aggressiveClearAll = () => {
      console.log('🧹 GLOBAL: Performing aggressive system clear');
      clearRoute();
      
      // Additional cleanup that might not be in regular clear
      localStorage.removeItem('fastPlannerCache');
      sessionStorage.removeItem('flightData');
      
      // Force garbage collection if possible
      if (window.gc) {
        window.gc();
      }
      
      console.log('🧹 GLOBAL: Aggressive clear complete');
    };
    
    return () => {
      delete window.aggressiveClearAll;
    };
  }, [clearRoute]);

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
      // Get current region with enhanced detection
      let currentRegion = appManagers.regionManagerRef?.current?.getCurrentRegion();
      
      // Fallback: try to detect region from activeRegionFromContext
      if (!currentRegion || !currentRegion.id) {
        console.log('FastPlannerApp: No region from RegionManager, trying activeRegionFromContext:', activeRegionFromContext);
        currentRegion = activeRegionFromContext;
      }
      
      // Convert region name to ID if needed
      let regionId = currentRegion?.id || currentRegion?.name || 'unknown';
      if (regionId && typeof regionId === 'string') {
        regionId = regionId.toLowerCase().replace(/\s+/g, '-');
      }
      
      console.log('FastPlannerApp: Adding favorite location to region:', regionId, location);
      console.log('FastPlannerApp: Region detection details:', {
        fromRegionManager: appManagers.regionManagerRef?.current?.getCurrentRegion(),
        fromContext: activeRegionFromContext,
        finalRegionId: regionId
      });
      
      // Add to the correct region
      appManagers.favoriteLocationsManagerRef.current.addFavoriteLocation(regionId, location);
      
      // Update UI with favorites for current region
      const updatedFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      setFavoriteLocations(updatedFavorites);
    }
  };

  // ✅ SINGLE SOURCE OF TRUTH: Wrapper for extracted generateStopCardsData utility
  const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather, options = {}, weatherSegmentsParam = null) => {
    return generateStopCardsUtil(waypoints, routeStats, selectedAircraft, weather, fuelPolicy, options, weatherSegmentsParam || weatherSegments);
  };

  // Make generateStopCardsData available globally for debugging
  window.generateStopCardsData = generateStopCardsData;

  // Make addToFavorites available globally for popup heart icons
  window.addToFavorites = (name, coords) => {
    console.log('Global addToFavorites called:', { name, coords });
    
    // Create location object in the format expected by handleAddFavoriteLocation
    const location = {
      name: name,
      coords: coords
    };
    
    handleAddFavoriteLocation(location);
  };

  // Debug function to check localStorage
  window.checkFavoritesStorage = () => {
    const stored = localStorage.getItem('fastPlannerFavorites_v2');
    console.log('Raw localStorage content:', stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Parsed localStorage favorites:', parsed);
      } catch (e) {
        console.error('Error parsing favorites:', e);
      }
    } else {
      console.log('No favorites found in localStorage');
    }
  };

  // Debug function to check current region
  window.checkCurrentRegion = () => {
    const currentRegion = appManagers.regionManagerRef?.current?.getCurrentRegion();
    console.log('Current region from RegionManager:', currentRegion);
    return currentRegion;
  };

  // Debug function to force load favorites for a region
  window.loadFavoritesForRegion = (regionId) => {
    if (appManagers.favoriteLocationsManagerRef?.current) {
      const favorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      console.log(`Favorites for region ${regionId}:`, favorites);
      setFavoriteLocations(favorites);
      return favorites;
    }
    return [];
  };

  // Load favorites on app startup (fallback if other loading doesn't work)
  useEffect(() => {
    if (appManagers.favoriteLocationsManagerRef?.current) {
      // Enhanced region detection for loading
      let currentRegion = appManagers.regionManagerRef?.current?.getCurrentRegion();
      
      // Fallback to activeRegionFromContext if RegionManager doesn't have it
      if (!currentRegion || !currentRegion.id) {
        currentRegion = activeRegionFromContext;
      }
      
      if (currentRegion) {
        // Convert region name to ID if needed
        let regionId = currentRegion.id || currentRegion.name || 'unknown';
        if (regionId && typeof regionId === 'string') {
          regionId = regionId.toLowerCase().replace(/\s+/g, '-');
        }
        
        const regionFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
        console.log(`FastPlannerApp: Loading ${regionFavorites.length} favorites for region ${regionId} on startup`, regionFavorites);
        console.log('FastPlannerApp: Region loading details:', {
          fromRegionManager: appManagers.regionManagerRef?.current?.getCurrentRegion(),
          fromContext: activeRegionFromContext,
          finalRegionId: regionId
        });
        setFavoriteLocations(regionFavorites);
      } else {
        console.log('FastPlannerApp: No region available for loading favorites');
      }
    }
  }, [appManagers.favoriteLocationsManagerRef, appManagers.regionManagerRef, activeRegionFromContext]);

  const handleRemoveFavoriteLocation = (locationId) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      // Enhanced region detection for removal
      let currentRegion = appManagers.regionManagerRef?.current?.getCurrentRegion();
      
      // Fallback to activeRegionFromContext
      if (!currentRegion || !currentRegion.id) {
        currentRegion = activeRegionFromContext;
      }
      
      // Convert region name to ID if needed
      let regionId = currentRegion?.id || currentRegion?.name || 'unknown';
      if (regionId && typeof regionId === 'string') {
        regionId = regionId.toLowerCase().replace(/\s+/g, '-');
      }
      
      console.log('FastPlannerApp: Removing favorite location from region:', regionId, locationId);
      
      // Remove from the correct region
      appManagers.favoriteLocationsManagerRef.current.removeFavoriteLocation(regionId, locationId);
      
      // Update UI with favorites for current region
      const updatedFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      setFavoriteLocations(updatedFavorites);
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
    console.log('🚨 FLIGHT LOAD STARTED - handleFlightLoad function called');
    
    // 🔍 DEBUG: Log the complete flightData structure to find flight ID
    console.log('🔍 COMPLETE FLIGHT DATA STRUCTURE:', JSON.stringify(flightData, null, 2));
    console.log('🔍 FLIGHT DATA KEYS:', Object.keys(flightData));
    console.log('🔍 LOOKING FOR FLIGHT ID:', {
      flightId: flightData.flightId,
      id: flightData.id,
      uuid: flightData.uuid,
      flightUuid: flightData.flightUuid,
      flightNumber: flightData.flightNumber
    });
    
    try {
      console.log('🚁 handleFlightLoad CALLED with flight:', flightData.flightNumber || flightData.name);
      console.log('🚁 Aircraft ID in flight data:', flightData.aircraftId);
      
      // 🎯 GLASS MENU: Activate glass menu when flight loads
      setIsFlightLoaded(true);
      setIsEditLocked(true); // Always start locked to prevent accidental edits
      console.log('🏗️ Glass menu activated for loaded flight');
      
      // 🎯 AUTO-CLOSE: Close panels on smaller screens only to free up screen space
      const isSmallScreen = window.innerWidth <= 1024; // iPad and smaller
      
      if (isSmallScreen) {
        console.log('📱 Small screen detected - will close side panels after flight load completes');
        
        // Delay the panel closing to avoid interfering with flight load card transitions
        setTimeout(() => {
          console.log('📱 Now closing side panels for small screen real estate');
          
          // Only close panels if they're actually open
          if (leftPanelVisible) {
            console.log('📦 Closing left panel (small screen)');
            toggleLeftPanel();
          }
          
          if (rightPanelVisible) {
            console.log('📦 Closing right panel (small screen)');  
            toggleRightPanel();
          }
          
          console.log('📱 Side panel closure complete - main content should remain stable');
        }, 500); // Wait for flight load to complete
        
      } else {
        console.log('🖥️ Large screen detected - keeping panels as they are');
      }
      
      // 🚨 CRITICAL: Set current flight ID and load weather segments
      if (flightData.flightId) {
        console.log('🚨 Setting currentFlightId for weather loading:', flightData.flightId);
        setCurrentFlightId(flightData.flightId);
        
        // Manually trigger weather loading
        if (loadWeatherSegments) {
          console.log('🌤️ MANUAL: Loading weather segments for flight:', flightData.flightId);
          loadWeatherSegments(flightData.flightId)
            .then(result => {
              console.log('🌤️ MANUAL: Weather segments loaded successfully');
              
              // Store weather segments and auto-show circles if data is available
              if (result && result.segments && result.segments.length > 0) {
                console.log('🌤️ MANUAL: Weather segments loaded, storing and auto-showing circles');
                console.log('🌤️ MANUAL: Loaded segments:', result.segments.length);
                
                // Store the segments for toggle to use
                window.loadedWeatherSegments = result.segments;
                console.log('🌤️ MANUAL: Weather segments stored in window.loadedWeatherSegments');
                
                // AUTO-SHOW: Create weather circles immediately with loaded flight data
                setTimeout(() => {
                  try {
                    console.log('🌤️ AUTO-SHOW: Creating weather circles for loaded flight');
                    
                    // Import and create weather circles layer
                    import('./modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                      if (mapManagerRef?.current?.map) {
                        console.log('🌤️ AUTO-SHOW: Creating WeatherCirclesLayer with loaded data');
                        
                        // Clean up any existing layer first
                        if (window.currentWeatherCirclesLayer) {
                          try {
                            window.currentWeatherCirclesLayer.removeWeatherCircles();
                          } catch (cleanupError) {
                            console.warn('🌤️ AUTO-SHOW: Error during cleanup:', cleanupError);
                          }
                        }
                        
                        const weatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
                        weatherCirclesLayer.addWeatherCircles(result.segments);
                        window.currentWeatherCirclesLayer = weatherCirclesLayer;
                        console.log('🌤️ AUTO-SHOW: Weather circles automatically displayed for loaded flight');
                      }
                    }).catch(importError => {
                      console.error('🌤️ AUTO-SHOW: Error importing WeatherCirclesLayer:', importError);
                    });
                  } catch (autoShowError) {
                    console.error('🌤️ AUTO-SHOW: Error auto-showing weather circles:', autoShowError);
                  }
                }, 1000); // Wait 1 second for map to be ready
              }
            })
            .catch(error => {
              console.error('🌤️ MANUAL: Failed to load weather segments:', error);
            });
        }
      }
      
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
            weather,
            {
              ...flightSettings,
              araFuel: weatherFuel.araFuel,
              approachFuel: weatherFuel.approachFuel
            }
          );
          
          // 🌤️ CRITICAL: Auto-load weather segments for loaded flight using OSDK directly
          // MOVED OUTSIDE stop cards condition to ensure it always runs
          console.log('🌤️ Auto-loading weather segments for flight:', flightData.flightId);
          if (flightData.flightId) {
            try {
              console.log('🌤️ Loading OSDK weather data for flight:', flightData.flightId);
              
              // Use the EXACT WeatherCard method to fetch weather segments
              const sdk = await import('@flight-app/sdk');
              
              if (!sdk.NorwayWeatherSegments) {
                throw new Error('NorwayWeatherSegments not found in SDK');
              }
              
              console.log('🌤️ Fetching NorwayWeatherSegments directly like WeatherCard...');
              
              // Import client from correct path (src/client.ts)
              const { default: client } = await import('../../client');
              
              // Fetch exactly like WeatherCard does
              const weatherResult = await client(sdk.NorwayWeatherSegments)
                .where({ flightUuid: flightData.flightId })
                .fetchPage({ $pageSize: 1000 });
                
              const loadedWeatherSegments = weatherResult.data || [];
              console.log(`🌤️ Fetched ${loadedWeatherSegments.length} NorwayWeatherSegments directly`);
              
              if (loadedWeatherSegments.length > 0) {
                console.log("🌤️ First weather segment structure:", JSON.stringify(loadedWeatherSegments[0], null, 2));
                
                // Set weather segments globally and trigger auto-loading
                window.loadedWeatherSegments = loadedWeatherSegments;
                console.log('🌤️ STORED: Weather segments stored in window.loadedWeatherSegments for auto-loading');
                
                // CRITICAL FIX: Store alternate route data for correct split point coordinates
                if (alternateRouteData && alternateRouteData.splitPoint) {
                  window.flightAlternateData = alternateRouteData;
                  console.log('🎯 STORED: Flight alternate data with correct split point:', {
                    splitPoint: alternateRouteData.splitPoint,
                    name: alternateRouteData.name,
                    coordinateCount: alternateRouteData.coordinates?.length || 0
                  });
                } else {
                  console.warn('🎯 WARNING: No alternate route data available for correct split point');
                }
                
                // PROFESSIONAL SOLUTION: Dispatch proper data-ready event instead of timeouts
                console.log('🎯 PROFESSIONAL: Dispatching weather-data-ready event for proper event-driven triggers');
                window.dispatchEvent(new CustomEvent('weather-data-ready', {
                  detail: {
                    weatherSegments: loadedWeatherSegments,
                    flightAlternateData: alternateRouteData,
                    timestamp: Date.now(),
                    source: 'flight-load-complete'
                  }
                }));
                
                // COMPREHENSIVE DEBUG: Let's see what's actually happening
                console.log('🚨 DEBUG: Flight load complete - starting comprehensive debug');
                console.log('🚨 DEBUG: loadedWeatherSegments:', loadedWeatherSegments?.length || 0);
                console.log('🚨 DEBUG: alternateRouteData:', !!alternateRouteData);
                console.log('🚨 DEBUG: window.mapManager:', !!window.mapManager);
                console.log('🚨 DEBUG: window.mapManagerRef:', !!window.mapManagerRef);
                console.log('🚨 DEBUG: Map available:', !!(window.mapManager?.map || window.mapManagerRef?.current?.map));
                
                // Store debug data globally for inspection
                window.debugWeatherData = {
                  loadedWeatherSegments,
                  alternateRouteData,
                  mapManager: window.mapManager,
                  mapManagerRef: window.mapManagerRef,
                  timestamp: Date.now()
                };
                
                // DIRECT FIX: Force create weather circles immediately after data is available
                setTimeout(() => {
                  console.log('🚨 DEBUG TIMEOUT: Starting 1-second delayed creation');
                  const hasMap = window.mapManager?.map || window.mapManagerRef?.current?.map;
                  console.log('🚨 DEBUG TIMEOUT: Map check:', !!hasMap);
                  console.log('🚨 DEBUG TIMEOUT: Weather segments check:', loadedWeatherSegments?.length || 0);
                  
                  if (loadedWeatherSegments && loadedWeatherSegments.length > 0 && hasMap) {
                    console.log('🎯 DIRECT: Creating weather circles immediately with loaded data');
                    console.log('🎯 DIRECT: First few weather segments:', loadedWeatherSegments.slice(0, 3));
                    
                    import('./modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                      console.log('🎯 DIRECT: WeatherCirclesLayer imported successfully');
                      
                      // Clean up existing layer
                      if (window.currentWeatherCirclesLayer) {
                        try {
                          window.currentWeatherCirclesLayer.removeWeatherCircles();
                          console.log('🎯 DIRECT: Cleaned up existing layer');
                        } catch (e) { 
                          console.warn('🎯 DIRECT: Cleanup warning:', e.message); 
                        }
                      }
                      
                      // Create new layer
                      console.log('🎯 DIRECT: Creating new WeatherCirclesLayer with map:', !!hasMap);
                      const weatherCirclesLayer = new WeatherCirclesLayer(hasMap);
                      console.log('🎯 DIRECT: WeatherCirclesLayer instance created');
                      
                      weatherCirclesLayer.addWeatherCircles(loadedWeatherSegments);
                      window.currentWeatherCirclesLayer = weatherCirclesLayer;
                      console.log('🎯 DIRECT: Weather circles created immediately after flight load - SUCCESS');
                      
                      // Extra verification
                      setTimeout(() => {
                        console.log('🎯 VERIFY: Checking if weather circles are visible on map');
                        console.log('🎯 VERIFY: currentWeatherCirclesLayer exists:', !!window.currentWeatherCirclesLayer);
                        console.log('🎯 VERIFY: Layer visible state:', window.currentWeatherCirclesLayer?.isVisible);
                      }, 500);
                      
                    }).catch(error => {
                      console.error('🎯 DIRECT: Error importing/creating weather circles:', error);
                    });
                  } else {
                    console.log('🚨 DEBUG TIMEOUT: Failed checks:');
                    console.log('🚨 DEBUG TIMEOUT: - Has weather segments:', !!(loadedWeatherSegments && loadedWeatherSegments.length > 0));
                    console.log('🚨 DEBUG TIMEOUT: - Has map:', !!hasMap);
                    console.log('🚨 DEBUG TIMEOUT: - Weather segments value:', loadedWeatherSegments);
                  }
                }, 1000); // 1 second after flight data is loaded
                
                // ADDITIONAL DEBUG: Multiple timing attempts
                setTimeout(() => {
                  console.log('🚨 DEBUG 3s: Checking data availability at 3 seconds');
                  console.log('🚨 DEBUG 3s: window.loadedWeatherSegments:', window.loadedWeatherSegments?.length || 0);
                  console.log('🚨 DEBUG 3s: window.flightAlternateData:', !!window.flightAlternateData);
                }, 3000);
                
                setTimeout(() => {
                  console.log('🚨 DEBUG 5s: Checking data availability at 5 seconds');
                  console.log('🚨 DEBUG 5s: window.loadedWeatherSegments:', window.loadedWeatherSegments?.length || 0);
                  console.log('🚨 DEBUG 5s: window.flightAlternateData:', !!window.flightAlternateData);
                }, 5000);
                
                // GLOBAL DEBUG FUNCTION: Make manual testing available
                window.debugWeatherCircles = () => {
                  console.log('🔧 MANUAL DEBUG: Running manual weather circles creation');
                  console.log('🔧 MANUAL DEBUG: window.loadedWeatherSegments:', window.loadedWeatherSegments?.length || 0);
                  console.log('🔧 MANUAL DEBUG: window.flightAlternateData:', !!window.flightAlternateData);
                  console.log('🔧 MANUAL DEBUG: window.mapManager:', !!window.mapManager);
                  
                  const hasMap = window.mapManager?.map || window.mapManagerRef?.current?.map;
                  const weatherData = window.loadedWeatherSegments;
                  
                  if (weatherData && weatherData.length > 0 && hasMap) {
                    import('./modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                      if (window.currentWeatherCirclesLayer) {
                        window.currentWeatherCirclesLayer.removeWeatherCircles();
                      }
                      const layer = new WeatherCirclesLayer(hasMap);
                      layer.addWeatherCircles(weatherData);
                      window.currentWeatherCirclesLayer = layer;
                      console.log('🔧 MANUAL DEBUG: Weather circles created manually - SUCCESS');
                    });
                  } else {
                    console.log('🔧 MANUAL DEBUG: FAILED - missing data or map');
                  }
                };
                
                // 🌤️ FORCE AUTO-ENABLE: Trigger weather circles creation after weather data is loaded
                setTimeout(() => {
                  console.log('🌤️ FORCE: Attempting to auto-create weather circles after data load');
                  if (mapManagerRef?.current?.map && loadedWeatherSegments.length > 0) {
                    import('./modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                      // Clean up any existing layer first
                      if (window.currentWeatherCirclesLayer) {
                        try {
                          window.currentWeatherCirclesLayer.removeWeatherCircles();
                        } catch (cleanupError) {
                          console.warn('🌤️ FORCE: Cleanup error:', cleanupError);
                        }
                      }
                      
                      console.log('🌤️ FORCE: Creating WeatherCirclesLayer with loaded flight data');
                      const weatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
                      weatherCirclesLayer.addWeatherCircles(loadedWeatherSegments);
                      window.currentWeatherCirclesLayer = weatherCirclesLayer;
                      console.log('🌤️ FORCE: Weather circles force-created for loaded flight');
                      
                      // Also dispatch an event to update MapLayersCard state
                      window.dispatchEvent(new CustomEvent('weather-circles-force-enabled'));
                    }).catch(error => {
                      console.error('🌤️ FORCE: Error force-creating weather circles:', error);
                    });
                  }
                }, 2000); // Wait 2 seconds for map to be ready
              }
              
              console.log('🌤️ Weather segments loaded successfully for flight');
            } catch (weatherError) {
              console.error('🌤️ Failed to load weather segments:', weatherError);
              console.error('🌤️ Weather error details:', weatherError.message);
            }
          } else {
            console.warn('🌤️ Cannot load weather segments - missing flightId');
          }
          
          if (newStopCards && newStopCards.length > 0) {
            console.log(`Generated ${newStopCards.length} stop cards for loaded flight`);
            setStopCards(newStopCards);
            
            // Make stop cards globally available for debugging
            window.debugStopCards = newStopCards;
            console.log('Stop cards available at window.debugStopCards');
            
            // 🛢️ RIG WEATHER: Make current waypoints globally available for weather circle coordinate lookup
            window.currentWaypoints = processedWaypoints;
            console.log('🛢️ RIG WEATHER: Current waypoints made globally available for weather circles:', processedWaypoints.length);
            console.log('🌤️ Auto-loading weather segments for flight:', flightData.flightId);
            if (flightData.flightId) {
              try {
                console.log('🌤️ Loading OSDK weather data for flight:', flightData.flightId);
                
                // Use the EXACT WeatherCard method to fetch weather segments
                const sdk = await import('@flight-app/sdk');
                
                if (!sdk.NorwayWeatherSegments) {
                  throw new Error('NorwayWeatherSegments not found in SDK');
                }
                
                console.log('🌤️ Fetching NorwayWeatherSegments directly like WeatherCard...');
                
                // Import client from correct path (src/client.ts)
                const { default: client } = await import('../../client');
                
                // Fetch exactly like WeatherCard does
                const weatherResult = await client(sdk.NorwayWeatherSegments)
                  .where({ flightUuid: flightData.flightId })
                  .fetchPage({ $pageSize: 1000 });
                  
                const loadedWeatherSegments = weatherResult.data || [];
                console.log(`🌤️ Fetched ${loadedWeatherSegments.length} NorwayWeatherSegments directly`);
                
                if (loadedWeatherSegments.length > 0) {
                  console.log("🌤️ First weather segment structure:", JSON.stringify(loadedWeatherSegments[0], null, 2));
                  
                  // TODO: Set weather segments state for fuel calculations
                  // This needs to integrate with the useWeatherSegments hook
                  window.loadedWeatherSegments = loadedWeatherSegments; // Temporary for debugging
                }
                
                console.log('🌤️ Weather segments loaded successfully for flight');
              } catch (weatherError) {
                console.error('🌤️ Failed to load weather segments:', weatherError);
                console.error('🌤️ Weather error details:', weatherError.message);
              }
            } else {
              console.warn('🌤️ Cannot load weather segments - missing flightId');
            }
            
            // 🚫 REMOVED: Second auto-zoom was happening too late and zooming too close without alternates
            // The first auto-zoom (after direct coordinate loading) is perfect - keep only that one
            
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
                ...flightSettings,
                araFuel: weatherFuel.araFuel,
                approachFuel: weatherFuel.approachFuel
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
          // First check if alternate data was passed directly from RightPanel
          if (flightData.alternateRouteData) {
            console.log('🟠 FASTPLANNER LOAD: Using alternate data passed from RightPanel:', flightData.alternateRouteData);
            alternateRouteData = flightData.alternateRouteData;
          }
          // Otherwise extract from raw flight (for auto-reload cases)
          else if (rawFlight && rawFlight.alternateFullRouteGeoShape) {
            console.log('🟠 FLIGHT LOAD DEBUG: Found alternateFullRouteGeoShape, extracting alternate route data...');
            console.log('🟠 FLIGHT LOAD DEBUG: Current waypoint count:', waypoints?.length || 0);
            
            // Extract alternate route coordinates
            const alternateGeoShape = rawFlight.alternateFullRouteGeoShape.toGeoJson ? 
              rawFlight.alternateFullRouteGeoShape.toGeoJson() : rawFlight.alternateFullRouteGeoShape;
              
            console.log('🟠 FLIGHT LOAD DEBUG: Alternate GeoShape:', alternateGeoShape);
            
            if (alternateGeoShape && alternateGeoShape.coordinates) {
              alternateRouteData = {
                coordinates: alternateGeoShape.coordinates,
                splitPoint: rawFlight.alternateSplitPoint || null,
                name: rawFlight.alternateName || 'Alternate Route',
                geoPoint: rawFlight.alternateGeoPoint || null,
                legIds: rawFlight.alternateLegIds || []
              };
              
              console.log('🟠 FLIGHT LOAD DEBUG: Successfully created alternateRouteData:', {
                coordinateCount: alternateRouteData.coordinates.length,
                splitPoint: alternateRouteData.splitPoint,
                name: alternateRouteData.name
              });
            } else {
              console.warn('🟠 FLIGHT LOAD DEBUG: No coordinates found in alternate geoShape');
            }
          } else {
            console.log('🟠 FLIGHT LOAD DEBUG: No alternate route data found');
            console.log('🟠 FLIGHT LOAD DEBUG: flightData.alternateRouteData:', !!flightData.alternateRouteData);
            console.log('🟠 FLIGHT LOAD DEBUG: rawFlight.alternateFullRouteGeoShape:', !!rawFlight?.alternateFullRouteGeoShape);
          }
          
          // Store alternate route data in state for rendering
          if (alternateRouteData) {
            console.log('🟠 STATE DEBUG: Storing alternate route data in component state');
            console.log('🟠 STATE DEBUG: About to store alternateRouteData:', {
              hasCoordinates: !!alternateRouteData.coordinates,
              coordinateCount: alternateRouteData.coordinates?.length,
              name: alternateRouteData.name,
              splitPoint: alternateRouteData.splitPoint
            });
            setAlternateRouteData(alternateRouteData);
            
            // 🚁 CRITICAL FIX: Trigger map update to render alternate route after flight loading
            console.log('🟠 FLIGHT LOAD: Triggering map update to render loaded alternate route');
            if (appManagers.waypointManagerRef?.current) {
              // Use current routeStats (will be calculated) and the loaded alternateRouteData
              appManagers.waypointManagerRef.current.updateRoute(routeStats, alternateRouteData);
            }
            
            // Also populate the alternate route input field with the current alternate name
            console.log('🟠 STATE DEBUG: Setting alternate route input to:', alternateRouteData.name);
            setAlternateRouteInput(alternateRouteData.name);
          } else {
            console.log('🟠 STATE DEBUG: Clearing alternate route data (no alternate route in flight)');
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
            
            // 🛢️ RIG WEATHER: Make waypoints globally available for weather circle coordinate lookup
            const waypointObjects = routeCoordinates.map((coords, index) => ({
              name: displayWaypoints[index]?.replace(/\s*\([^)]*\)\s*$/, '').trim() || `Point ${index + 1}`,
              lng: coords[0],
              lat: coords[1],
              coordinates: coords
            }));
            window.currentWaypoints = waypointObjects;
            console.log('🛢️ RIG WEATHER: Direct coordinate waypoints made globally available:', waypointObjects.length);
            
            // 🎯 AUTO-ZOOM: Immediately trigger auto-zoom after direct coordinate loading
            setTimeout(() => {
              if (mapManagerRef?.current && routeCoordinates && routeCoordinates.length > 0) {
                console.log('🎯 AUTO-ZOOM: Triggering auto-zoom after direct coordinate loading');
                
                const zoomSuccess = mapManagerRef.current.autoZoomToFlight(waypointObjects, {
                  padding: 150,          // More generous padding around flight
                  maxZoom: 8,            // Much less close zoom
                  duration: 2000,        // Fast 2 second animation
                  animate: true
                });
                
                if (zoomSuccess) {
                  console.log('🎯 AUTO-ZOOM: Successfully auto-zoomed to loaded flight coordinates');
                } else {
                  console.warn('🎯 AUTO-ZOOM: Failed to auto-zoom to loaded flight coordinates');
                }
              }
            }, 500); // Small delay to allow waypoint rendering
            
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

  // Glass menu handlers
  const handleToggleLock = () => {
    const newLockState = !isEditLocked;
    setIsEditLocked(newLockState);
    console.log('🔒 Edit lock toggled:', newLockState ? 'LOCKED' : 'UNLOCKED');
    
    // Update global edit lock state for managers
    window.isEditLocked = newLockState;
    
    // 🚫 IMPLEMENT ACTUAL LOCKING - Disable map interactions when locked
    if (newLockState) {
      // LOCKED - Disable map interactions
      console.log('🚫 LOCKING: Disabling map interactions and waypoint modifications');
      
      // Disable map click handlers
      if (window.mapboxManager?.mapInteractionHandler) {
        window.mapboxManager.mapInteractionHandler.disableMapClicks();
      }
      
      // Disable waypoint dragging
      if (window.mapboxManager?.waypointManager) {
        window.mapboxManager.waypointManager.disableWaypointDragging();
      }
      
      // Add visual overlay to indicate locked state
      const overlay = document.createElement('div');
      overlay.id = 'edit-lock-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 59, 48, 0.05);
        backdrop-filter: blur(1px);
        z-index: 1000;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      overlay.innerHTML = `
        <div style="
          background: rgba(255, 59, 48, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          🔒 Flight Locked - Click unlock to edit
        </div>
      `;
      document.body.appendChild(overlay);
      
      // Fade in the overlay
      setTimeout(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          }, 300);
        }, 2000);
      }, 100);
      
    } else {
      // UNLOCKED - Re-enable map interactions
      console.log('🔓 UNLOCKING: Re-enabling map interactions and waypoint modifications');
      
      // Re-enable map click handlers
      if (window.mapboxManager?.mapInteractionHandler) {
        window.mapboxManager.mapInteractionHandler.enableMapClicks();
      }
      
      // Re-enable waypoint dragging
      if (window.mapboxManager?.waypointManager) {
        window.mapboxManager.waypointManager.enableWaypointDragging();
      }
      
      // Show unlock notification
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(52, 199, 89, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      overlay.innerHTML = '🔓 Flight Unlocked - Editing enabled';
      document.body.appendChild(overlay);
      
      // Fade in and out
      setTimeout(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          }, 300);
        }, 1500);
      }, 100);
    }
    
    // Notify managers to refresh route display with new lock state
    if (window.mapboxManager?.waypointManager) {
      setTimeout(() => {
        window.mapboxManager.waypointManager.refreshRouteDisplay();
        window.mapboxManager.waypointManager.updateRouteDragState(window._originalRouteDragHandler);
      }, 100);
    }
  };

  const handleOpenRoute = () => {
    console.log('🗺️ Route button clicked - Current leftPanelVisible:', leftPanelVisible);
    toggleLeftPanel();
    console.log('🗺️ toggleLeftPanel called');
  };

  const handleOpenMenu = () => {
    console.log('⚙️ Menu button clicked - Current rightPanelVisible:', rightPanelVisible);
    toggleRightPanel();
    console.log('⚙️ toggleRightPanel called');
  };

  // Create ref for RightPanel to access its card change functionality
  const rightPanelRef = useRef(null);

  // Function to handle card changes from glass dock buttons
  const handleCardChange = useCallback((cardId) => {
    console.log(`🎛️ Glass dock requesting card change to: ${cardId}`);
    
    // First ensure the right panel is visible
    if (!rightPanelVisible) {
      console.log('🎛️ Opening right panel first...');
      toggleRightPanel();
    }
    
    // Then change the card
    if (rightPanelRef.current && rightPanelRef.current.handleCardChange) {
      console.log(`🎛️ Calling right panel handleCardChange(${cardId})`);
      rightPanelRef.current.handleCardChange(cardId);
    } else {
      console.warn('🎛️ Right panel ref or handleCardChange not available');
    }
  }, [rightPanelVisible, toggleRightPanel]);

  // Individual card change handlers for glass dock buttons
  const handleMainCard = () => handleCardChange('main');
  const handleSettingsCard = () => handleCardChange('settings');
  const handlePerformanceCard = () => handleCardChange('performance');
  const handleWeatherCard = () => handleCardChange('weather');
  const handleFinanceCard = () => handleCardChange('finance');
  const handleEvacuationCard = () => handleCardChange('evacuation');
  const handleSaveCard = () => handleCardChange('saveflight');
  const handleLoadCard = () => handleCardChange('loadflights');
  const handleLayersCard = () => handleCardChange('maplayers');

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
          toggleWaypointMode={toggleWaypointMode} // Add waypoint mode toggle
          waypointModeActive={waypointModeActive} // Add waypoint mode state
          deckTimePerStop={flightSettings.deckTimePerStop} deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight} cargoWeight={flightSettings.cargoWeight}
          extraFuel={flightSettings.extraFuel}
          araFuel={weatherFuel.araFuel} // Use calculated weather fuel from state
          approachFuel={weatherFuel.approachFuel} // Use calculated weather fuel from state
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
          weatherSegments={weatherSegments} // Pass weather segments for rig detection
          weatherSegmentsHook={weatherSegmentsHook} // Pass full weather segments hook for layer controls
          ref={rightPanelRef} // Add ref to access card change functionality
        />
      </div>

      {/* Glass Menu Dock - always visible */}
      <GlassMenuDock
        isVisible={true}
        isLocked={isEditLocked}
        onToggleLock={handleToggleLock}
        onOpenRoute={handleOpenRoute}
        onOpenMenu={handleOpenMenu}
        leftPanelVisible={leftPanelVisible}
        rightPanelVisible={rightPanelVisible}
        // Card change handlers for expanded buttons
        onMainCard={handleMainCard}
        onSettingsCard={handleSettingsCard}
        onPerformanceCard={handlePerformanceCard}
        onWeatherCard={handleWeatherCard}
        onFinanceCard={handleFinanceCard}
        onEvacuationCard={handleEvacuationCard}
        onSaveCard={handleSaveCard}
        onLoadCard={handleLoadCard}
        onLayersCard={handleLayersCard}
      />
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
  const addWaypointDirectRef = useRef(async () => {
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
