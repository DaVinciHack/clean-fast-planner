// Import React and necessary hooks
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// Import weather system initialization
import { initializeWeatherSystem } from './modules/WeatherLoader.js';

// Import extracted utilities
import { generateStopCardsData as generateStopCardsUtil } from './utilities/FlightUtilities.js';

// Import segment-aware fuel utilities
import { detectLocationSegment, createSegmentFuelKey, getSegmentBoundaries } from './utilities/SegmentUtils.js';

// Import fuel save service for loading saved fuel settings
import { FuelSaveBackService } from './services/FuelSaveBackService.js';

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  AppHeader
} from './components';

// Import GlassMenuDock for flight-loaded controls
import GlassMenuDock from './components/controls/GlassMenuDock';

// Import FlightWizard for guided flight planning
import FlightWizard from './components/wizard/FlightWizard';

// Import CLEAN DetailedFuelBreakdown for fuel analysis popup
import CleanDetailedFuelBreakdown from './components/fuel/CleanDetailedFuelBreakdown';

// Import MapZoomHandler for waypoint display
import MapZoomHandler from './components/map/MapZoomHandler';

// Import SAR Range Circle for SAR mode visualization
import SARRangeCircle from './components/map/SARRangeCircle';

// Import SAR Manager for SAR state and calculations
import { sarManager } from './managers/SARManager';

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

// 🔧 DEBUG FLAGS: Control logging output for performance and debugging
const DEBUG_CALC = false;      // Calculation logging
const DEBUG_ROUTE = false;     // Route calculation logging
const DEBUG_AIRCRAFT = false;  // Aircraft data logging
const DEBUG_FUEL = false;      // Fuel calculation logging
const DEBUG_WEATHER = false;   // Weather processing logging

// Debug helper function for conditional logging
const debugLog = (flag, ...args) => flag && console.log(...args);

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
  const { isAuthenticated, userName, userDetails, isLoading, login } = useAuth();
  const { currentRegion: activeRegionFromContext } = useRegion();
  
  // 🔧 CRITICAL FIX: Declare pendingRefuelStops state FIRST before any useEffect that references it
  const [pendingRefuelStops, setPendingRefuelStops] = useState(null); // 🔧 Store refuel stops waiting for stop cards
  
  // Make region globally accessible for weather system
  useEffect(() => {
    window.activeRegionFromContext = activeRegionFromContext;
  }, [activeRegionFromContext]); 
  
  // Initialize fuel policy management
  const fuelPolicy = useFuelPolicy();
  
  // 🔧 TIMING FIX: Process pending refuel stops when stop cards become available
  useEffect(() => {
    if (pendingRefuelStops && pendingRefuelStops.length > 0 && stopCards && stopCards.length > 0) {
      debugLog(DEBUG_FUEL, '🔧 PENDING REFUEL: Processing pending refuel stops now that stop cards are available');
      debugLog(DEBUG_FUEL, '🔧 PENDING REFUEL: Pending stops:', pendingRefuelStops);
      debugLog(DEBUG_FUEL, '🔧 PENDING REFUEL: Available stop cards:', stopCards.length);
      
      const refuelIndices = [];
      
      // Process each pending refuel location
      pendingRefuelStops.forEach(locationName => {
        const stopCardIndex = stopCards.findIndex(card => card.stopName === locationName);
        if (stopCardIndex >= 0) {
          const stopCardUIIndex = stopCardIndex + 1; // Stop cards use 1-based indexing
          debugLog(DEBUG_FUEL, '🔧 PENDING REFUEL: Found', locationName, 'at stop card index:', stopCardUIIndex);
          refuelIndices.push(stopCardUIIndex);
        } else {
          console.warn('🔧 PENDING REFUEL: Could not find stop card for location:', locationName);
        }
      });
      
      if (refuelIndices.length > 0) {
        debugLog(DEBUG_FUEL, '🔧 PENDING REFUEL: Setting currentRefuelStops to:', refuelIndices);
        setCurrentRefuelStops(refuelIndices);
        
        // Update waypoint refuelMode flags too
        setWaypoints(prevWaypoints => {
          return prevWaypoints.map(waypoint => {
            const isRefuelStop = pendingRefuelStops.includes(waypoint.name);
            return {
              ...waypoint,
              refuelMode: isRefuelStop
            };
          });
        });
      }
      
      // Clear pending stops
      setPendingRefuelStops(null);
    }
  }, [pendingRefuelStops, stopCards]);
  
  // State for tracking actual loading status from LoadingIndicator
  const [isActuallyLoading, setIsActuallyLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // State for tracking current loaded flight for weather segments
  const [currentFlightId, setCurrentFlightId] = useState(null);
  const [loadedFlightData, setLoadedFlightData] = useState(null); // Track loaded flight data for AppHeader
  const [loadedFuelObject, setLoadedFuelObject] = useState(null); // 🎯 Store actual fuel object to avoid duplicate lookups
  
  // 🧙‍♂️ WIZARD STATE: Flight planning wizard for non-aviation users
  const [isWizardVisible, setIsWizardVisible] = useState(false);

  // 🔧 NEW: State to store alternate card data
  const [alternateStopCard, setAlternateStopCard] = useState(null);
  
  // Simple loading overlay to prevent flash before wizard
  const [showInitialOverlay, setShowInitialOverlay] = useState(true);
  
  // 🚁 SAR STATE: Search and Rescue mode state
  const [sarData, setSarData] = useState(null);
  
  // ⚡ LIVE WEATHER STATE: Real-time weather monitoring toggle
  const [liveWeatherActive, setLiveWeatherActive] = useState(false);
  
  // Check if wizard should show on load (first time users)
  useEffect(() => {
    const wizardDisabled = localStorage.getItem('fastplanner-wizard-disabled');
    
    // Helper function to smoothly fade out the HTML overlay
    const fadeOutHtmlOverlay = () => {
      const htmlOverlay = document.getElementById('initial-loading-overlay');
      if (htmlOverlay) {
        htmlOverlay.style.opacity = '0';
        // Remove from DOM after fade completes
        setTimeout(() => {
          htmlOverlay.style.display = 'none';
        }, 500);
      }
      setShowInitialOverlay(false);
    };
    
    // 🔍 DEBUG: Authentication state analysis - only when debugging
    if (DEBUG_CALC) {
      debugLog(DEBUG_CALC, '🔍 WIZARD LOGIC CHECK:', {
        isAuthenticated,
        isLoading,
        userName,
        userDetails: !!userDetails,
        wizardDisabled,
        shouldWait: !isAuthenticated || isLoading
      });
    }
    
    // If not authenticated yet OR still loading user data, keep overlay showing
    if (!isAuthenticated || isLoading) {
      debugLog(DEBUG_CALC, '🔍 WAITING: Not proceeding to wizard yet (auth or loading)');
      return;
    }
    
    debugLog(DEBUG_CALC, '🔍 PROCEEDING: Authentication complete, proceeding with wizard logic');
    
    if (!wizardDisabled) {
      // Show wizard first, then fade out base overlay after wizard is visible
      const wizardTimer = setTimeout(() => {
        setIsWizardVisible(true);
        // Give wizard time to appear, then fade out base overlay
        setTimeout(() => {
          fadeOutHtmlOverlay();
        }, 300); // Quick fade after wizard shows
      }, 500); // Shorter delay since layering works
      return () => clearTimeout(wizardTimer);
    } else {
      // Wizard disabled, fade out overlay after app is fully ready
      const timer = setTimeout(() => {
        fadeOutHtmlOverlay();
      }, 800); // Shorter delay since no wizard needed
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);
  
  // DEBUG: Track loadedFlightData state changes
  useEffect(() => {
  }, [loadedFlightData]);
  
  // Glass menu states for flight-loaded controls
  const [isFlightLoaded, setIsFlightLoaded] = useState(false);
  const [isEditLocked, setIsEditLocked] = useState(false); // Start unlocked to build flights immediately
  
  // CRITICAL: Set initial global lock state for managers
  React.useEffect(() => {
    window.isEditLocked = isEditLocked;
  }, [isEditLocked]);

  // State for weather-based fuel calculations
  const [weatherFuel, setWeatherFuel] = useState({ araFuel: 0, approachFuel: 0 });
  
  // Phone layout detection - PHONE ONLY (≤480px, not iPad)
  const [isPhoneLayout, setIsPhoneLayout] = useState(false);
  
  // Detect phone layout on mount and resize
  useEffect(() => {
    const checkPhoneLayout = () => {
      const isPhone = window.innerWidth <= 480; // Phone only, not iPad/tablet
      setIsPhoneLayout(isPhone);
    };
    
    checkPhoneLayout();
    window.addEventListener('resize', checkPhoneLayout);
    return () => window.removeEventListener('resize', checkPhoneLayout);
  }, []);
  
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
      return;
    }

    // Aircraft policy selection with enhanced logging
    if (fuelPolicy.hasPolicies && fuelPolicy.selectDefaultPolicyForAircraft) {
      const defaultPolicy = fuelPolicy.selectDefaultPolicyForAircraft(selectedAircraft);
      if (defaultPolicy) {
      } else {
      }
    } else {
    }
  }, [selectedAircraft?.registration, fuelPolicy.hasPolicies, fuelPolicy.availablePolicies?.length]);

  // 🚁 SAR CALCULATION: Calculate SAR data when relevant parameters change (with race condition prevention)
  useEffect(() => {
    // Create a stable string key for comparison
    const dataKey = JSON.stringify({
      aircraft: selectedAircraft?.registration,
      routeFuel: routeStats?.totalFuelRequired || routeStats?.fuelRequired,
      alternateFuel: alternateRouteData?.totalFuelRequired || alternateRouteData?.fuelRequired,
      waypointCount: waypoints?.length,
      hasFuelPolicy: fuelPolicy?.hasPolicies
    });

    // Only calculate if SAR is enabled
    if (!sarManager.sarEnabled) {
      setSarData(null);
      return;
    }

    const flightData = {
      selectedAircraft,
      routeStats,
      alternateStats: alternateRouteData,
      fuelPolicy,
      waypoints
    };
    
    const sarCalculation = sarManager.calculateSAR(flightData);
    
    // Only update state if the calculation result is actually different
    setSarData(prevSarData => {
      // Quick comparison of key properties to avoid expensive JSON.stringify on every render
      if (prevSarData && 
          prevSarData.operationalRadius === sarCalculation.operationalRadius &&
          prevSarData.timeOnTask === sarCalculation.timeOnTask &&
          prevSarData.sarWeight === sarCalculation.sarWeight) {
        return prevSarData; // No meaningful change
      }
      return sarCalculation;
    });
  }, [selectedAircraft?.registration, routeStats?.totalFuelRequired, alternateRouteData?.totalFuelRequired, waypoints?.length, fuelPolicy?.hasPolicies]);

  // 🚫 DISABLED: Manual route auto-zoom was causing unwanted second zoom during flight loading
  // Only keep the flight loading auto-zoom (after direct coordinate placement)

  // Memoize the region change handler to maintain stable reference
  const handleRegionChange = useCallback((event) => {
    if (event.detail && event.detail.region) {
      // The actual region update is delegated to the stabilized function in useAircraft
      setCurrentAircraftRegion(event.detail.region);
    }
  }, [setCurrentAircraftRegion]);

  // Set up the event listener with the memoized handler
  useEffect(() => {
    window.addEventListener('region-changed', handleRegionChange);
    return () => {
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
    toggleBlocksVisibility, toggleBasesVisibility, toggleFuelAvailableVisibility, // New toggle functions
    // 📊 FUEL BREAKDOWN MODAL
    showFuelBreakdown, setShowFuelBreakdown
  } = useUIControls({ appSettingsManagerRef, platformManagerRef, client, routeInput, setRouteInput });
  
  // Initialize map layers
  const {
    gulfCoastMapRef,
    weatherLayerRef,
    vfrChartsRef,
    observedWeatherStationsRef,  // NEW: Include observed weather stations ref
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
  
  // Alternate mode state (toggle function defined later after handleAlternateRouteInputChange)
  const [alternateModeActive, setAlternateModeActive] = useState(false);
  const [alternateSplitPoint, setAlternateSplitPoint] = useState(null);
  
  // ✅ NEW: Location-specific fuel overrides state (for ARA/approach fuel)
  const [locationFuelOverrides, setLocationFuelOverrides] = useState({});
  
  // 🚫 REFUEL SYNC STATE: Store refuel stops from DetailedFuelBreakdown
  const [currentRefuelStops, setCurrentRefuelStops] = useState([]);
  
  // 🛩️ VFR OPERATIONS: Waive alternates state for VFR day flying
  const [waiveAlternates, setWaiveAlternates] = useState(false);
  
  // ✅ RESTORED: Proper flight setting update function
  const updateFlightSetting = (settingName, value) => {
    
    setFlightSettings(prev => ({
      ...prev,
      [settingName]: value
    }));
  };
  
  // ✅ NEW: Handle location-specific fuel overrides (ARA/approach fuel)
  const handleLocationFuelChange = useCallback((fuelData) => {
    
    // 🚫 PRESERVE REFUEL STATE: DetailedFuelBreakdown should NOT override main UI refuel stops
    if (fuelData.refuelStops && Array.isArray(fuelData.refuelStops)) {
      // DON'T setCurrentRefuelStops - let main UI control refuel stops
    } else {
    }
    
    // 🔧 UNIQUE KEYS: Create cardIndex-based key to handle duplicate location names
    const key = fuelData.cardIndex ? 
      `${fuelData.stopName}_${fuelData.cardIndex}_${fuelData.fuelType}` : 
      `${fuelData.stopName}_${fuelData.fuelType}`; // Fallback to old format if no cardIndex
    
    setLocationFuelOverrides(prev => ({
      ...prev,
      [key]: {
        stopName: fuelData.stopName,
        stopIndex: fuelData.stopIndex,
        fuelType: fuelData.fuelType,
        value: fuelData.value,
        isRig: fuelData.isRig,
        cardIndex: fuelData.cardIndex
      }
    }));
  }, [waypoints]);
  
  // ✅ NEW: Handle segment-aware extra fuel changes
  const handleSegmentExtraFuelChange = useCallback((segmentData) => {
    
    // Create segment-aware key for extra fuel
    const key = createSegmentFuelKey(null, 'extraFuel', segmentData.segment);
    
    setLocationFuelOverrides(prev => {
      const newOverrides = {
        ...prev,
        [key]: {
          stopName: null, // Extra fuel is segment-wide, not location-specific
          fuelType: 'extraFuel',
          value: segmentData.value,
          segment: segmentData.segment,
          isSegmentWide: true
        }
      };

      return newOverrides;
    });
  }, []);
  
  // ✅ NEW: Get current flight segment information for UI display
  const getCurrentSegmentInfo = useCallback(() => {
    // Get refuel stops from EnhancedStopCardsContainer state
    // For now, we'll pass this as a prop to components that need it
    return getSegmentBoundaries(waypoints, []);
  }, [waypoints]);
  
  // ❌ REMOVED: Complex refuel stops handling - was causing refuel stops to jump around
  
  // ✅ CRITICAL FIX: Stable callback for fuel overrides to prevent infinite loops
  const handleFuelOverridesChanged = useCallback((callback) => {
    window.fuelOverridesCallback = callback;
  }, []);
  
  // ✅ NEW: Reset user-entered flight settings to defaults (for new flights)
  const resetUserFlightSettings = useCallback(() => {
    
    setFlightSettings(prev => {
      const newSettings = {
        ...prev,
        // Reset user-entered values to defaults
        passengerWeight: 220,
        cargoWeight: 0,
        extraFuel: 0, // ✅ This fixes the extraFuel persistence issue
        // Keep fuel policy values intact - they come from OSDK
        // contingencyFuelPercent, taxiFuel, reserveFuel, deckTimePerStop, deckFuelFlow remain unchanged
      };
      return newSettings;
    });
    
  }, [flightSettings]);
  
  // ✅ RESTORED: Proper weather update function
  const updateWeatherSettings = (windSpeed, windDirection) => {
    
    setWeather(prev => ({
      ...prev,
      windSpeed: Number(windSpeed) || 0,
      windDirection: Number(windDirection) || 0
    }));
  };
  
  // ✅ CRITICAL FIX: Memoize stop card options to prevent infinite loops
  const stopCardOptions = useMemo(() => ({
    ...flightSettings,
    araFuel: weatherFuel.araFuel,
    approachFuel: weatherFuel.approachFuel,
    alternateRouteData: alternateRouteData,
    locationFuelOverrides: locationFuelOverrides
  }), [flightSettings, weatherFuel, alternateRouteData, locationFuelOverrides]);
  
  // ✅ CRITICAL FIX: Auto-trigger calculations when route/aircraft change
  // Debounce to prevent calculation spam
  const debounceTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce calculations by 200ms
    debounceTimeoutRef.current = setTimeout(() => {
      debugLog(DEBUG_CALC, '🧮 AUTO-CALCULATION: useEffect triggered, refuel stops:', currentRefuelStops.length);
    
    // 🔍 DEBUG: Aircraft data analysis - only when debugging
    if (selectedAircraft && DEBUG_AIRCRAFT) {
      const aircraftDebug = {
        emptyWeight: selectedAircraft.emptyWeight,
        empty_weight: selectedAircraft.empty_weight,
        emptyWeightLbs: selectedAircraft.emptyWeightLbs,
        fuelBurnRate: selectedAircraft.fuelBurnRate,
        fuel_burn_rate: selectedAircraft.fuel_burn_rate,
        fuelBurnPerHour: selectedAircraft.fuelBurnPerHour,
        burnRate: selectedAircraft.burnRate,
        weight: selectedAircraft.weight,
        maxGrossWeight: selectedAircraft.maxGrossWeight,
        maxTakeoffWeight: selectedAircraft.maxTakeoffWeight
      };
      debugLog(DEBUG_AIRCRAFT, '🔍 AIRCRAFT DEBUG DATA:', aircraftDebug);
    }
    
    // 🚨 SAFETY: Wait for aircraft data to be complete before calculating
    const hasRequiredAircraftData = selectedAircraft && 
      selectedAircraft.fuelBurn &&
      selectedAircraft.usefulLoad && selectedAircraft.usefulLoad > 0;
    
    // 🔍 DEBUG: Route calculation state analysis - only when debugging
    if (DEBUG_CALC) {
      const debugInfo = {
        hasWaypoints: waypoints && waypoints.length >= 2,
        hasSelectedAircraft: !!selectedAircraft,
        hasRequiredAircraftData: hasRequiredAircraftData,
        usefulLoad: selectedAircraft?.usefulLoad,
        fuelBurn: selectedAircraft?.fuelBurn
      };
      debugLog(DEBUG_CALC, '🔍 CALC DEBUG INFO:', debugInfo);
    }
    
    // 🚨 AIRCRAFT WARNING: Keep this critical aviation safety warning
    if (selectedAircraft && !hasRequiredAircraftData) {
      console.warn('❌ AIRCRAFT MISSING DATA:', {
        hasFuelBurn: !!selectedAircraft.fuelBurn,
        fuelBurn: selectedAircraft.fuelBurn,
        hasUsefulLoad: !!selectedAircraft.usefulLoad,
        usefulLoad: selectedAircraft.usefulLoad,
        allAircraftProps: Object.keys(selectedAircraft)
      });
    }
      
    if (waypoints && waypoints.length >= 2 && selectedAircraft && hasRequiredAircraftData) {
      
      // 🔧 DEBUG: Flight settings analysis - only when debugging
      if (DEBUG_CALC) {
        const settingsDebug = {
          flightSettings,
          extraFuel: flightSettings.extraFuel,
          cargoWeight: flightSettings.cargoWeight
        };
        debugLog(DEBUG_CALC, '🔧 SETTINGS DEBUG:', settingsDebug);
      }
      
      // 🔧 PROPER FIX: Calculate routeStats with FILTERED landing stops only (matches StopCardCalculator)
      if (appManagers?.routeCalculatorRef?.current && waypoints.length >= 2) {
        
        // Filter out navigation waypoints (same logic as StopCardCalculator)
        const landingStopsOnly = waypoints.filter(wp => {
          const isWaypoint = 
            wp.pointType === 'NAVIGATION_WAYPOINT' || 
            wp.isWaypoint === true || 
            wp.type === 'WAYPOINT';
          return !isWaypoint;
        });
        
        const coordinates = landingStopsOnly.map(wp => wp.coords).filter(Boolean);
        
        if (coordinates.length >= 2) {
          const newRouteStats = appManagers.routeCalculatorRef.current.calculateRouteStats(coordinates, {
            selectedAircraft,
            weather,
            payloadWeight: (flightSettings.passengerWeight || 0) + (flightSettings.cargoWeight || 0),
            reserveFuel: flightSettings.reserveFuel || 0
          });
          
          if (newRouteStats) {
            // 🔧 CRITICAL FIX: Don't override route stats if refuel stops are active
            // Let the fuel calculation system manage route optimization when refuel configured
            if (currentRefuelStops.length === 0) {
              setRouteStats(newRouteStats);
              debugLog(DEBUG_ROUTE, '🗺️ AUTO-CALC: Updated route stats (no refuel stops)');
            } else {
              // CRITICAL: Set route stats anyway on first load to prevent time clearing
              if (!routeStats || !routeStats.totalDistance) {
                debugLog(DEBUG_ROUTE, '🗺️ AUTO-CALC: First load with refuel stops - setting route stats to prevent time clearing');
                setRouteStats(newRouteStats);
              }
              debugLog(DEBUG_ROUTE, '🗺️ AUTO-CALC: Skipping route stats update (refuel stops active)');
            }
          }
        }
      } else {
      }

      // Generate stop cards and update header - KEEP EXISTING FUEL FLOW
      
      const newStopCards = generateStopCardsData(
        waypoints,
        routeStats, 
        selectedAircraft,
        weather,
        stopCardOptions
      );

      if (newStopCards && newStopCards.length > 0) {
        // 🔧 CRITICAL FIX: Don't override stop cards if refuel stops are active
        // Let the fuel calculation system manage stop cards when refuel configured
        if (currentRefuelStops.length === 0) {
          setStopCards(newStopCards);
          debugLog(DEBUG_CALC, '🧮 AUTO-CALC: Updated stop cards (no refuel stops)');
        } else {
          debugLog(DEBUG_CALC, '🧮 AUTO-CALC: Skipping stop cards update (refuel stops active - fuel system manages cards)');
        }
      } else {
        // Only clear if no refuel stops
        if (currentRefuelStops.length === 0) {
          setStopCards([]);
        }
      }
    } else {
      setStopCards([]);
    }
    
    }, 200); // 200ms debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [waypoints, selectedAircraft, stopCardOptions, weather]);

  // 🚨 AVIATION CRITICAL: Recalculate alternate route stats when aircraft becomes available
  useEffect(() => {
    if (alternateRouteData && selectedAircraft && alternateRouteData.coordinates && 
        (!alternateRouteData.totalDistance || alternateRouteData.totalDistance === 0)) {
      
      debugLog(DEBUG_ROUTE, '🔍 RECALCULATING ALTERNATE ROUTE STATS for loaded flight');
      
      // Recalculate route statistics with current aircraft
      const alternateRouteStats = appManagers?.routeCalculatorRef?.current?.calculateRouteStats(
        alternateRouteData.coordinates,
        {
          selectedAircraft,
          weather,
          payloadWeight: (flightSettings.passengerWeight || 0) + (flightSettings.cargoWeight || 0),
          reserveFuel: flightSettings.reserveFuel || 0
        }
      );
      
      if (alternateRouteStats) {
        const updatedAlternateRouteData = {
          ...alternateRouteData,
          totalDistance: alternateRouteStats.totalDistance,
          estimatedTime: alternateRouteStats.estimatedTime,
          timeHours: alternateRouteStats.timeHours
        };
        
        debugLog(DEBUG_ROUTE, '🔍 UPDATED ALTERNATE ROUTE DATA:', updatedAlternateRouteData);
        setAlternateRouteData(updatedAlternateRouteData);
      }
    }
  }, [alternateRouteData, selectedAircraft, appManagers, weather, flightSettings]);

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
      
      if (actualFuelPolicy && 
          actualFuelPolicy.araFuel !== undefined && 
          actualFuelPolicy.approachFuel !== undefined) {
      
      try {
        
        const weatherAnalyzer = new WeatherFuelAnalyzer();
        const weatherAnalysis = weatherAnalyzer.analyzeWeatherForFuel(
          weatherSegments,
          waypoints,
          {
            araFuelDefault: actualFuelPolicy.araFuel || 0,
            approachFuelDefault: actualFuelPolicy.approachFuel || 0
          }
        );
        
        const calculatedAraFuel = weatherAnalysis.totalAraFuel || 0;
        const calculatedApproachFuel = weatherAnalysis.totalApproachFuel || 0;
        
        // Only update state if values actually changed to prevent infinite loops
        setWeatherFuel(prevFuel => {
          if (prevFuel.araFuel !== calculatedAraFuel || prevFuel.approachFuel !== calculatedApproachFuel) {
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
      }
    } else {
      // Only reset if currently not zero to prevent infinite loops
      setWeatherFuel(prevFuel => {
        if (prevFuel.araFuel !== 0 || prevFuel.approachFuel !== 0) {
          return { araFuel: 0, approachFuel: 0 };
        }
        return prevFuel;
      });
    }
  }, [weatherSegments, waypoints, fuelPolicy?.araFuelDefault, fuelPolicy?.approachFuelDefault]);

  // AGGRESSIVE clearRoute that flushes all system state 
  const clearRoute = useCallback((preserveFlightData = false) => {
    
    // Call the hook's clearRoute function
    hookClearRoute();
    
    // Clear alternate route state
    setAlternateRouteData(null);
    setAlternateRouteInput('');
    setAlternateSplitPoint(null); // Clear split point state
    
    // Clear alternate mode memory
    window.currentSplitPoint = null;
    window.alternateModeClickHandler = null;
    
    // Clear current flight ID and weather segments
    setCurrentFlightId(null);
    setLoadedFlightData(null); // Always clear loaded flight data when clearing route
    setLoadedFuelObject(null); // 🎯 Clear stored fuel object when clearing route
    if (!preserveFlightData) {
      // Additional flight data clearing if needed
    }
    clearWeatherSegments();
    
    // ✅ FIX: Reset user flight settings when starting a new flight
    // This prevents extraFuel and other user settings from persisting across flights
    resetUserFlightSettings();
    
    // 🔧 FIX: Reset flight loading states to properly clear UI
    setIsFlightLoaded(false);
    setIsEditLocked(false);
    window.isEditLocked = false;
    
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
    
    // Clear wind arrows from rig weather integration
    if (window.rigWeatherIntegration) {
      try {
        window.rigWeatherIntegration.removeWeatherGraphics();
      } catch (e) {
        console.warn('🧹 CLEAR: Error removing wind arrows:', e.message);
      }
    }
    
    // Additional popup cleanup - remove any orphaned popups from the map container
    try {
      const mapContainer = document.querySelector('.mapboxgl-map');
      if (mapContainer) {
        const orphanedPopups = mapContainer.querySelectorAll('.mapboxgl-popup, .rig-weather-popup, .unified-weather-popup');
        orphanedPopups.forEach(popup => popup.remove());
        if (orphanedPopups.length > 0) {
        }
      }
    } catch (e) {
      console.warn('🧹 CLEAR: Error during additional popup cleanup:', e.message);
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
    
    // 🚁 Clear SAR mode elements (helicopter and range circles)
    setSarData(null);
    
    // Reset SAR manager to clear helicopter and range circles
    if (sarManager) {
      try {
        sarManager.reset();
      } catch (e) {
        console.warn('🚁 CLEAR: Error resetting SAR manager:', e.message);
      }
    }
    
    // Clear SAR range circles directly if they exist
    if (window.currentSARRangeCircle) {
      try {
        window.currentSARRangeCircle.removeRangeCircle();
        window.currentSARRangeCircle = null;
      } catch (e) {
        console.warn('🚁 CLEAR: Error removing SAR range circles:', e.message);
      }
    }
    
  }, [hookClearRoute, setAlternateRouteData, setAlternateRouteInput, clearWeatherSegments, alternateRouteData, setWeatherFuel, resetUserFlightSettings]);
  
  // Make aggressive clear available globally for debugging
  useEffect(() => {
    window.aggressiveClearAll = () => {
      clearRoute();
      
      // Additional cleanup that might not be in regular clear
      localStorage.removeItem('fastPlannerCache');
      sessionStorage.removeItem('flightData');
      
      // Force garbage collection if possible
      if (window.gc) {
        window.gc();
      }
      
    };
    
    // DEBUG: Manual extraFuel reset function
    window.resetExtraFuel = () => {
      
      updateFlightSetting('extraFuel', 0);
      
      // Also trigger a recalculation to update the UI immediately
      if (stopCards && stopCards.length > 0) {
        // Force a recalculation by updating a dependency
        setForceUpdate(prev => prev + 1);
      }

      // Check after a delay to see if it stuck
      setTimeout(() => {
      }, 500);
    };
    
    // DEBUG: Expose flightSettings to window for inspection
    window.flightSettings = flightSettings;
    window.updateFlightSetting = updateFlightSetting;
    
    // DEBUG: Clear all browser-stored extraFuel values
    window.clearAllStoredExtraFuel = () => {
      
      // 1. Clear localStorage fastPlannerSettings
      try {
        const savedSettings = localStorage.getItem('fastPlannerSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          
          if (parsed.flightSettings && parsed.flightSettings.extraFuel !== undefined) {
            delete parsed.flightSettings.extraFuel;
            localStorage.setItem('fastPlannerSettings', JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error('❌ Error clearing fastPlannerSettings:', e);
      }
      
      // 2. Clear all aircraft-specific settings that might contain extraFuel
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('fastPlanner_settings_aircraft_') || key.startsWith('fastPlanner_settings_')) {
            try {
              const value = localStorage.getItem(key);
              if (value && value.includes('extraFuel')) {
                const parsed = JSON.parse(value);
                if (parsed.extraFuel !== undefined) {
                  delete parsed.extraFuel;
                  localStorage.setItem(key, JSON.stringify(parsed));
                }
              }
            } catch (e) {
              console.warn(`⚠️ Could not parse ${key}:`, e);
            }
          }
        });
      } catch (e) {
        console.error('❌ Error clearing aircraft settings:', e);
      }
      
      // 3. Force reset current flightSettings extraFuel to 0
      updateFlightSetting('extraFuel', 0);
      
      // 4. Trigger recalculation
      setForceUpdate(prev => prev + 1);

      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Cleared all browser-stored extraFuel values - please reload',
          'success',
          5000
        );
      }
    };

    // DEBUG: Advanced function to clear extraFuel from saved flight data
    window.clearSavedExtraFuel = async (flightId) => {
      if (!flightId) {
        const currentFlightId = window.currentFlightId || flightSettings.currentFlightId;
        if (!currentFlightId) {
          console.error('🔧 CLEAR: No flight ID provided and no current flight loaded');
          return;
        }
        flightId = currentFlightId;
      }

      try {
        // Load current stop cards and flight settings
        const currentStopCards = stopCards && stopCards.length > 0 ? stopCards : [];
        const currentFlightSettings = { ...flightSettings, extraFuel: 0 }; // Force extraFuel to 0
        
        if (currentStopCards.length === 0) {
          console.warn('🔧 CLEAR: No stop cards available, cannot save cleared extraFuel');
          return;
        }
        
        // Save flight with extraFuel = 0 to overwrite the persistent value
        
        const { default: FuelSaveBackService } = await import('./services/FuelSaveBackService');
        await FuelSaveBackService.saveFuelData(
          flightId,
          currentStopCards,
          currentFlightSettings,
          weatherFuel,
          fuelPolicy,
          routeStats,
          selectedAircraft,
          alternateStopCard  // 🔧 NEW: Pass alternate card data for fuel save operations
        );

        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            'Cleared persistent extraFuel value from saved flight',
            'success',
            3000
          );
        }
        
      } catch (error) {
        console.error('❌ CLEAR: Failed to clear saved extraFuel:', error);
        
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Failed to clear saved extraFuel: ${error.message}`,
            'error',
            5000
          );
        }
      }
    };
    
    return () => {
      delete window.aggressiveClearAll;
      delete window.resetExtraFuel;
      delete window.clearSavedExtraFuel;
      delete window.clearAllStoredExtraFuel;
    };
  }, [clearRoute]);

  useEffect(() => { import('./modules/waypoints/waypoint-styles.css'); }, []);

  // Effect to load fuel policies when region changes (with debouncing)
  const regionIdRef = useRef(null);
  useEffect(() => {
    if (!activeRegionFromContext?.id) {
      return;
    }

    // Skip if this is the same region
    if (regionIdRef.current === activeRegionFromContext.id) {
      return;
    }

    if (!fuelPolicy || !fuelPolicy.loadPoliciesForRegion) {
      return;
    }

    regionIdRef.current = activeRegionFromContext.id;

    fuelPolicy.loadPoliciesForRegion(activeRegionFromContext.osdkRegion)
      .then(policies => {
        
        if (policies.length === 0) {
          console.warn(`📋 REGION: No policies found for region ${activeRegionFromContext.name}`);
          return;
        }
        
        // Only auto-select if no current policy or current policy is not from this region
        const currentPolicy = fuelPolicy.currentPolicy;
        if (!currentPolicy || !policies.find(p => p.uuid === currentPolicy.uuid)) {
          fuelPolicy.selectPolicy(policies[0]);
        } else {
        }
      })
      .catch(error => {
        console.error(`Error loading fuel policies for region ${activeRegionFromContext.name} (${activeRegionFromContext.osdkRegion}):`, error);
      });
  }, [activeRegionFromContext?.id, activeRegionFromContext?.osdkRegion]); // Simplified dependencies

  // ✅ CRITICAL FIX: Apply fuel policy values to flightSettings when policy changes
  useEffect(() => {
    if (!fuelPolicy.currentPolicy) {
      return;
    }

    const policySettings = fuelPolicy.getCurrentPolicySettings();
    if (!policySettings) {
      return;
    }

    // Apply policy values to flightSettings, preserving user inputs
    setFlightSettings(currentSettings => ({
      ...currentSettings, // Preserve user inputs (passenger weight, cargo weight)
      // Apply OSDK policy values (these are the authoritative source) - Use ?? to allow 0 values
      contingencyFuelPercent: policySettings.contingencyFlightLegs ?? currentSettings.contingencyFuelPercent ?? 5,
      taxiFuel: policySettings.taxiFuel ?? currentSettings.taxiFuel ?? 50,
      reserveFuel: policySettings.reserveFuel ?? currentSettings.reserveFuel ?? 600,
      deckTimePerStop: policySettings.deckTime ?? currentSettings.deckTimePerStop ?? 5,
      extraFuel: policySettings.extraFuel ?? currentSettings.extraFuel ?? 0, // ✅ ADD: Apply extraFuel from policy
      // deckFuelFlow could come from policy or aircraft, keep existing for now
      deckFuelFlow: currentSettings.deckFuelFlow || 400
    }));

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

    // Just clear React state since RegionContext now handles the map cleanup
    setWaypoints([]);
    setRouteStats(null);
    setStopCards([]);
    
    // 🚨 REMOVED: No cache writes - regional change only clears route state
  }, [activeRegionFromContext, setWaypoints, setRouteStats, setStopCards]);

  // 🔄 REFUEL SYNC: Handle refuel stops changes from main cards
  // 🚨 RACE CONDITION FIX: Add loop prevention for refuel stops
  const lastRefuelStopsRef = useRef([]);
  const handleRefuelStopsChanged = useCallback((newRefuelStops) => {
    // Prevent unnecessary updates if refuel stops haven't actually changed
    const newStopsString = JSON.stringify(newRefuelStops.sort());
    const lastStopsString = JSON.stringify(lastRefuelStopsRef.current.sort());
    
    if (newStopsString !== lastStopsString) {
      console.log('🔄 REFUEL SYNC: Updating refuel stops:', newRefuelStops);
      lastRefuelStopsRef.current = [...newRefuelStops];
      
      setCurrentRefuelStops(newRefuelStops);
      setStopCards(prev => prev.map(card => ({
        ...card,
        refuelMode: newRefuelStops.includes(card.index),
        isRefuelStop: newRefuelStops.includes(card.index)
      })));
    } else {
      console.log('🔄 REFUEL SYNC: No change in refuel stops, skipping update');
    }
  }, []);

  const handleAddFavoriteLocation = (location) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      // Get current region with enhanced detection
      let currentRegion = appManagers.regionManagerRef?.current?.getCurrentRegion();
      
      // Fallback: try to detect region from activeRegionFromContext
      if (!currentRegion || !currentRegion.id) {
        currentRegion = activeRegionFromContext;
      }
      
      // Convert region name to ID if needed
      let regionId = currentRegion?.id || currentRegion?.name || 'unknown';
      if (regionId && typeof regionId === 'string') {
        regionId = regionId.toLowerCase().replace(/\s+/g, '-');
      }
      
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
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing favorites:', e);
      }
    } else {
    }
  };

  // Debug function to check current region
  window.checkCurrentRegion = () => {
    const currentRegion = appManagers.regionManagerRef?.current?.getCurrentRegion();
    return currentRegion;
  };

  // Debug function to force load favorites for a region
  window.loadFavoritesForRegion = (regionId) => {
    if (appManagers.favoriteLocationsManagerRef?.current) {
      const favorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
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
        setFavoriteLocations(regionFavorites);
      } else {
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

      // Remove from the correct region
      appManagers.favoriteLocationsManagerRef.current.removeFavoriteLocation(regionId, locationId);
      
      // Update UI with favorites for current region
      const updatedFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      setFavoriteLocations(updatedFavorites);
    }
  };

  // 🛩️ VFR OPERATIONS: Handle waive alternates checkbox changes
  const handleWaiveAlternatesChange = useCallback((isWaived) => {
    
    // Update local state
    setWaiveAlternates(isWaived);

    // Control alternate route line visibility on map via WaypointManager
    if (waypointManagerRef.current && mapManagerRef.current) {
      // 🛩️ Update WaypointManager's waive alternates state first
      waypointManagerRef.current.setWaiveAlternates(isWaived);
      
      if (isWaived) {
        // 1. Clear traditional alternate route from WaypointManager
        waypointManagerRef.current.clearAlternateRoute(mapManagerRef.current.map);
        
        // 2. Clear weather-based alternate lines from WeatherCirclesLayer
        if (window.currentWeatherCirclesLayer) {
          try {
            window.currentWeatherCirclesLayer.removeWeatherCircles();
          } catch (error) {
            console.warn('🌦️ FASTPLANNER APP: Warning clearing weather circles:', error.message);
          }
        } else {
        }
      } else {
        // Check if we have stored alternate route data to restore
        if (waypointManagerRef.current.storedAlternateRouteData) {
          waypointManagerRef.current.renderAlternateRoute(
            waypointManagerRef.current.storedAlternateRouteData, 
            mapManagerRef.current.map
          );
        } else {
        }
        
        // Note: Weather circles layer restoration is handled automatically by the weather system
      }
    } else {
      console.error('🚨 FASTPLANNER APP: Managers not available for alternate route line control:', {
        waypointManagerRef: waypointManagerRef.current,
        mapManagerRef: mapManagerRef.current
      });
    }
  }, [waypointManagerRef, mapManagerRef]);

  // Handle custom chart loading
  const loadCustomChart = useCallback(() => {
    // Placeholder function for custom chart loading
    console.log('Custom chart loading requested');
  }, []);

  // Handle alternate route input changes
  const handleAlternateRouteInputChange = (value) => {
    setAlternateRouteInput(value);
  };

  // 📊 FUEL BREAKDOWN: Handle fuel data changes from clean fuel system
  const handleFuelDataChanged = useCallback((effectiveSettings) => {
    
    // ✅ FIX: Single setFlightSettings call to avoid race conditions
    setFlightSettings(prev => {
      const newSettings = {
        ...prev,
        ...effectiveSettings,
        // ✅ FIX: Create completely new object reference for React detection
        locationFuelOverrides: effectiveSettings.locationFuelOverrides ? 
          JSON.parse(JSON.stringify(effectiveSettings.locationFuelOverrides)) : {},
        // Add unique timestamp to force React update
        _fuelUpdateTimestamp: Date.now(),
        lastFuelUpdate: Date.now() // Combined both timestamp updates
      };

      return newSettings;
    });

    // Trigger recalculation with multiple state updates to force re-render
    setForceUpdate(prev => prev + 1);
    setRouteStats(prev => prev ? {...prev, _fuelUpdate: Date.now()} : prev);
  }, [setFlightSettings, setForceUpdate]);

  // Alternate mode toggle function (defined after handleAlternateRouteInputChange to avoid reference error)
  const toggleAlternateMode = useCallback((active) => {
    
    setAlternateModeActive(active);
    window.isAlternateModeActive = active;
    
    // Call PlatformManager directly for visibility toggle (same pattern as waypoint mode)
    if (platformManagerRef.current && typeof platformManagerRef.current.toggleAlternateMode === 'function') {
      platformManagerRef.current.toggleAlternateMode(active);
    } else {
      console.warn('🎯 ALTERNATE MODE: PlatformManager.toggleAlternateMode not available');
    }
    
    // Store alternate mode click handler for map integration
    if (active) {
      // Don't automatically reset split point - let it persist between clicks
      // ✅ SOLUTION: Use window variable to avoid React closure issues
      window.currentSplitPoint = null;
      
      // 🎯 LOADED FLIGHT FIX: Clear alternateRouteInput when entering alternate mode
      // This makes loaded flights behave like new flights (click anywhere works)
      if (alternateRouteInput && alternateRouteInput.includes(' ')) {
        setAlternateRouteInput('');
      }
      
      window.alternateModeClickHandler = (clickPoint, clickedFeature) => {
        
        // First check if this click is on an existing route waypoint
        const clickedWaypoint = waypoints.find(wp => {
          if (!wp.lat || !wp.lng) return false;
          // More robust distance calculation using haversine formula or simple approximation
          const latDiff = Math.abs(wp.lat - clickPoint.lat);
          const lngDiff = Math.abs(wp.lng - clickPoint.lng);
          // Approximate: 0.01 degrees ≈ ~1km at most latitudes
          return latDiff < 0.05 && lngDiff < 0.05; // Within ~5km tolerance for easier clicking
        });
        
        if (clickedWaypoint) {
          // Click on existing route waypoint - set as new split point
          setAlternateSplitPoint(clickedWaypoint.name);
          
          // Clear the alternate input and set only the split point (no submission)
          handleAlternateRouteInputChange(clickedWaypoint.name);
          
          // Show user feedback that we're waiting for alternate destination
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              `Split point set: ${clickedWaypoint.name}. Now click to select alternate destination.`,
              'info',
              3000
            );
          }
          
          return true; // Click handled
        }
        
        // Handle platform clicks (clickedFeature will be platform properties)
        if (clickedFeature && clickedFeature.name) {
          // Check if this is a fuel-capable location, airport, or route waypoint
          const isFuelCapable = clickedFeature.hasFuel === true || clickedFeature.hasFuel === 'true';
          const isAirfield = clickedFeature.isAirfield === true || clickedFeature.isAirfield === 'true';
          const isRouteWaypoint = clickedFeature.isInRoute === true;
          
          if (isFuelCapable || isAirfield || isRouteWaypoint) {
            const locationName = clickedFeature.name || clickedFeature.Name || 'Selected Location';
            
            // FIRST: Check if this is explicitly marked as a route waypoint OR if it's in the route
            const isLocationInRoute = isRouteWaypoint || waypoints.some(wp => wp.name === locationName);
            
            if (isLocationInRoute) {
              // This location is in the route - set as split point and wait for alternate
              window.currentSplitPoint = locationName;
              handleAlternateRouteInputChange(locationName);
              
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Split point set: ${locationName}. Now click alternate destination.`,
                  'info',
                  3000
                );
              }
              return true; // Click handled, waiting for next click
            }
            
            // Location is NOT in route - proceed with normal alternate logic
            let alternateString;
            if (window.currentSplitPoint) {
              // Use custom split point to create pair
              alternateString = `${window.currentSplitPoint.replace(/\s+/g, '_')} ${locationName.replace(/\s+/g, '_')}`;
              window.currentSplitPoint = null; // Reset for next time
            } else if (alternateRouteInput && alternateRouteInput.trim() && !alternateRouteInput.includes(' ')) {
              // We have a single location in input (split point from route click), add destination to complete pair
              alternateString = `${alternateRouteInput.trim().replace(/\s+/g, '_')} ${locationName.replace(/\s+/g, '_')}`;
              // Clear the split point state since we're using it
              setAlternateSplitPoint(null);
            } else {
              // 🎯 LOADED FLIGHT FIX: Use stops[1] (first landing stop, not departure)
              const splitPoint = loadedFlightData?.stops?.[1];
              if (splitPoint) {
                alternateString = `${splitPoint.replace(/\s+/g, '_')} ${locationName.replace(/\s+/g, '_')}`;
              } else {
                alternateString = locationName;
              }
            }
            
            handleAlternateRouteInputChange(alternateString);
            // Automatically trigger the alternate route submission to create the orange line
            setTimeout(() => {
              handleAlternateRouteSubmit(alternateString);
            }, 100); // Small delay to ensure input is set first
            return true; // Click handled
          } else {
            return false; // Not a valid alternate
          }
        }
        
        // Handle map clicks (clickedFeature will be nearestPlatform if any)
        if (clickedFeature && clickedFeature.distance !== undefined) {
          // This is a nearestPlatform result from map click
          const isFuelCapable = clickedFeature.hasFuel === true;
          const isAirfield = clickedFeature.isAirfield === true;
          
          if (isFuelCapable || isAirfield) {
            const locationName = clickedFeature.name || 'Nearby Location';
            
            // FIRST: Check if this location is already in the route
            const isLocationInRoute = waypoints.some(wp => wp.name === locationName);
            
            if (isLocationInRoute) {
              // This location is in the route - set as split point and wait for alternate
              // Clear the state variable and only use the input field for route clicks
              setAlternateSplitPoint(null);
              handleAlternateRouteInputChange(locationName);
              
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  `Split point set: ${locationName}. Now click alternate destination.`,
                  'info',
                  3000
                );
              }
              return true; // Click handled, waiting for next click
            }
            
            // Location is NOT in route - proceed with normal alternate logic
            let alternateString;
            if (window.currentSplitPoint) {
              // Use custom split point to create pair
              alternateString = `${window.currentSplitPoint.replace(/\s+/g, '_')} ${locationName.replace(/\s+/g, '_')}`;
              window.currentSplitPoint = null; // Reset for next time
            } else if (alternateRouteInput && alternateRouteInput.trim() && !alternateRouteInput.includes(' ')) {
              // We have a single location in input (split point from route click), add destination to complete pair
              alternateString = `${alternateRouteInput.trim().replace(/\s+/g, '_')} ${locationName.replace(/\s+/g, '_')}`;
            } else {
              // 🎯 LOADED FLIGHT FIX: Use stops[1] (first landing stop, not departure)
              const splitPoint = loadedFlightData?.stops?.[1];
              if (splitPoint) {
                alternateString = `${splitPoint.replace(/\s+/g, '_')} ${locationName.replace(/\s+/g, '_')}`;
              } else {
                alternateString = locationName;
              }
            }
            handleAlternateRouteInputChange(alternateString);
            // ✅ CRITICAL FIX: Pass the complete pair string to handleAlternateRouteSubmit
            // This ensures that when we have a pair like "ENLE EI346-A", it's treated as a pair, not single location
            setTimeout(() => {
              handleAlternateRouteSubmit(alternateString);
            }, 100); // Small delay to ensure input is set first
            return true; // Click handled
          }
        }
        
        // No suitable alternate found
        return false; // Click not handled
      };
    } else {
      window.alternateModeClickHandler = null;
      window.currentSplitPoint = null; // Clear window variable too
      setAlternateSplitPoint(null); // Reset when exiting alternate mode
    }
  }, [platformManagerRef, handleAlternateRouteInputChange, waypoints]);

  // Clear alternate route function
  const clearAlternate = useCallback(() => {
    
    // Clear alternate route data and input
    setAlternateRouteData(null);
    setAlternateRouteInput('');
    setAlternateSplitPoint(null);
    
    // Clear window variables
    window.currentSplitPoint = null;
    window.alternateModeClickHandler = null;
    
    // Turn off alternate mode
    setAlternateModeActive(false);
    window.isAlternateModeActive = false;
    
    // Clear alternate route from map using WaypointManager
    if (waypointManagerRef.current && typeof waypointManagerRef.current.clearAlternateRoute === 'function') {
      const map = mapManagerRef.current?.getMap();
      if (map) {
        waypointManagerRef.current.clearAlternateRoute(map);
      }
      waypointManagerRef.current.clearAlternateRouteData();
    }
    
    // Clear alternate from PlatformManager
    if (platformManagerRef.current && typeof platformManagerRef.current.toggleAlternateMode === 'function') {
      platformManagerRef.current.toggleAlternateMode(false);
    }
    
  }, [waypointManagerRef, mapManagerRef, platformManagerRef]);

  // Helper function to determine split point for new flights
  const determineNewFlightSplitPoint = useCallback((currentWaypoints) => {
    
    if (!currentWaypoints || currentWaypoints.length === 0) {
      return "ENXW"; // Default fallback
    }
    
    // Find the first landing point (stop)
    // Landing points have labels like "(Stop1)", "(Stop2)", etc., or "(Des)" for destination
    for (let i = 0; i < currentWaypoints.length; i++) {
      const waypoint = currentWaypoints[i];
      const waypointName = waypoint.name || waypoint.id || '';

      // Skip departure point
      if (waypointName.includes('(Dep)')) {
        continue;
      }
      
      // Look for first landing point (Stop or Des)
      if (waypointName.includes('(Stop') || waypointName.includes('(Des)')) {
        // Extract the base location name (remove the label)
        const splitPoint = waypointName.split(' (')[0].trim();
        return splitPoint;
      }
      
      // If waypoint doesn't have labels, assume stops are any waypoint after departure
      if (i > 0) {
        const splitPoint = waypointName.trim();
        return splitPoint;
      }
    }
    
    // Fallback: use last waypoint if no stops found
    if (currentWaypoints.length > 0) {
      const lastWaypoint = currentWaypoints[currentWaypoints.length - 1];
      const splitPoint = (lastWaypoint.name || lastWaypoint.id || '').split(' (')[0].trim();
      return splitPoint;
    }
    
    return "ENXW"; // Ultimate fallback
  }, []);

  // Handle alternate route submission
  const handleAlternateRouteSubmit = async (input) => {
    
    try {
      // Parse the input to determine if it's single location or pair
      const trimmedInput = input.trim();
      const locations = trimmedInput.split(/\s+/).filter(loc => loc.length > 0).map(loc => loc.replace(/_/g, ' '));

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
        const destination = locations[0];
        
        // ENHANCED SPLIT POINT LOGIC
        let currentSplitPoint;
        
        // Check if we have a manual split point in the input (from route click)
        if (alternateRouteInput && alternateRouteInput.trim() && !alternateRouteInput.includes(' ')) {
          // We have a single location in input - this is a manual split point from route click
          currentSplitPoint = alternateRouteInput.trim();
        } else if (alternateRouteData?.splitPoint) {
          // LOADED FLIGHT: Use existing split point from flight data
          currentSplitPoint = alternateRouteData.splitPoint;
        } else {
          // NEW FLIGHT: Determine split point from current waypoints
          currentSplitPoint = determineNewFlightSplitPoint(waypoints);
        }
        
        // Look up coordinates for both locations
        const fromCoords = await getLocationCoordinates(currentSplitPoint);
        const toCoords = await getLocationCoordinates(destination);
        
        if (fromCoords && toCoords) {
          // Create actual coordinates array
          const coordinates = [fromCoords, toCoords];
          
          // 🚨 AVIATION CRITICAL: Calculate alternate route statistics
          const alternateRouteStats = appManagers?.routeCalculatorRef?.current?.calculateRouteStats(
            coordinates, 
            {
              selectedAircraft,
              weather,
              payloadWeight: (flightSettings.passengerWeight || 0) + (flightSettings.cargoWeight || 0),
              reserveFuel: flightSettings.reserveFuel || 0
            }
          );
          
          // 🔍 DEBUG: Log alternate route stats to see what we're getting
          console.log('🔍 ALTERNATE ROUTE STATS:', alternateRouteStats);
          console.log('🔍 AIRCRAFT DATA FOR ALTERNATE:', { 
            hasSelectedAircraft: !!selectedAircraft,
            aircraftId: selectedAircraft?.assetId,
            fuelBurn: selectedAircraft?.fuelBurn 
          });

          const newAlternateRouteData = {
            coordinates: coordinates,
            splitPoint: currentSplitPoint,
            name: `${currentSplitPoint} ${destination} (Alternate)`, // Correct format: FROM TO (Alternate)
            geoPoint: `${toCoords[1]},${toCoords[0]}`, // lat,lng format
            legIds: [],
            // ✅ CRITICAL FIX: Add missing calculated route statistics
            totalDistance: alternateRouteStats?.totalDistance || 0,
            estimatedTime: alternateRouteStats?.estimatedTime || '00:00',
            timeHours: alternateRouteStats?.timeHours || 0
          };
          
          // 🔍 DEBUG: Log final alternate route data
          console.log('🔍 FINAL ALTERNATE ROUTE DATA:', newAlternateRouteData);
          
          setAlternateRouteData(newAlternateRouteData);
          
          // Trigger map update immediately
          if (appManagers.waypointManagerRef?.current) {
            appManagers.waypointManagerRef.current.updateRoute(routeStats, newAlternateRouteData);
          }
        } else {
          console.error('🛣️ Could not find coordinates for alternate route locations');
          return;
        }
        
      } else if (locations.length === 2) {
        // Pair of locations - custom from/to route
        const [from, to] = locations;
        
        // Look up coordinates for both locations
        const fromCoords = await getLocationCoordinates(from);
        const toCoords = await getLocationCoordinates(to);
        
        if (fromCoords && toCoords) {
          // Create actual coordinates array
          const coordinates = [fromCoords, toCoords];
          
          // 🚨 AVIATION CRITICAL: Calculate alternate route statistics
          const alternateRouteStats = appManagers?.routeCalculatorRef?.current?.calculateRouteStats(
            coordinates, 
            {
              selectedAircraft,
              weather,
              payloadWeight: (flightSettings.passengerWeight || 0) + (flightSettings.cargoWeight || 0),
              reserveFuel: flightSettings.reserveFuel || 0
            }
          );
          
          // 🔍 DEBUG: Log alternate route stats to see what we're getting
          console.log('🔍 ALTERNATE ROUTE STATS:', alternateRouteStats);
          console.log('🔍 AIRCRAFT DATA FOR ALTERNATE:', { 
            hasSelectedAircraft: !!selectedAircraft,
            aircraftId: selectedAircraft?.assetId,
            fuelBurn: selectedAircraft?.fuelBurn 
          });

          const newAlternateRouteData = {
            coordinates: coordinates,
            splitPoint: from,
            name: `${from} ${to} (Alternate)`,
            geoPoint: `${toCoords[1]},${toCoords[0]}`, // lat,lng format
            legIds: [],
            // ✅ CRITICAL FIX: Add missing calculated route statistics
            totalDistance: alternateRouteStats?.totalDistance || 0,
            estimatedTime: alternateRouteStats?.estimatedTime || '00:00',
            timeHours: alternateRouteStats?.timeHours || 0
          };
          
          // 🔍 DEBUG: Log final alternate route data
          console.log('🔍 FINAL ALTERNATE ROUTE DATA:', newAlternateRouteData);
          
          setAlternateRouteData(newAlternateRouteData);
          
          // Trigger map update immediately
          if (appManagers.waypointManagerRef?.current) {
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
    // 🔍 DEBUG: Log the exact flight data received by handleFlightLoad
    console.log('🔍 handleFlightLoad: Received flight data:', flightData);
    console.log('🔍 handleFlightLoad: Flight data keys:', Object.keys(flightData || {}));
    console.log('🔍 handleFlightLoad: fuelPlanId present:', !!flightData?.fuelPlanId);
    console.log('🔍 handleFlightLoad: fuelPlanId value:', flightData?.fuelPlanId);
    
    // 🚨 CRITICAL: Clear ALL refuel state before loading new flight
    console.log('🧹 REFUEL RESET: Clearing all refuel state for new flight load');
    setCurrentRefuelStops([]); // Clear current refuel stops
    setPendingRefuelStops(null); // Clear pending refuel stops
    
    // 🚨 CRITICAL: Clear temp fuel object cache to prevent persistence between flights
    const { FuelSaveBackService } = await import('./services/FuelSaveBackService');
    if (FuelSaveBackService._tempExistingFuelObject) {
      console.log('🧹 CACHE CLEAR: Clearing temp fuel object cache');
      delete FuelSaveBackService._tempExistingFuelObject;
    }
    
    // 🚨 AVIATION SAFETY: Reset ALL fuel data first to prevent cross-flight contamination
    console.log('🧹 FUEL RESET: Clearing all fuel overrides and extra fuel before loading new flight');
    setLocationFuelOverrides({}); // Clear all location-specific fuel overrides
    updateFlightSetting('extraFuel', 0); // Reset global extra fuel to 0
    setForceUpdate(prev => prev + 1); // Force recalculation with clean fuel state
    
    // RESET LOADING STATE: Always reset to false first, then set to true
    setIsActuallyLoading(false);
    
    // Small delay to ensure state update
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Now set to true for this load
    setIsActuallyLoading(true);
    
    try {
      // 🎯 VISUAL FIX: Hide ALL map elements immediately to prevent flash during satellite switch
      console.log('🎯 HIDING ALL ELEMENTS: Preventing flash during satellite switch');
      try {
        if (appManagers.platformManagerRef?.current) {
          appManagers.platformManagerRef.current.toggleFixedPlatformsVisibility(false);
          appManagers.platformManagerRef.current.toggleMovablePlatformsVisibility(false);
          appManagers.platformManagerRef.current.toggleBlocksVisibility(false);
          appManagers.platformManagerRef.current.toggleBasesVisibility(false);
          // Hide airports/airfields too
          appManagers.platformManagerRef.current.toggleAirfieldsVisibility(false);
        }
      } catch (error) {
        console.warn('🎯 Warning: Could not hide map elements:', error);
        // Continue with flight loading even if hiding fails
      }
      
      // 🎬 CRITICAL: Store flight data globally for FlightSequenceController
      window.currentFlightData = flightData;
      window.appManagers = appManagers;
      window.currentRouteStats = routeStats;
      
      // 🚁 CRITICAL: Set aircraft FIRST before anything else - RACE CONDITION FIX
      // This ensures stop cards have aircraft data for speed calculations
      if (flightData.aircraftId && appManagers.aircraftManagerRef?.current) {
        try {
          console.log('🛩️ FLIGHT LOAD: Setting aircraft FIRST:', flightData.aircraftId);
          
          // Get available aircraft using the correct method
          const availableAircraft = appManagers.aircraftManagerRef.current.filterAircraft(flightData.region);
          
          const matchingAircraft = availableAircraft.find(aircraft => {
            return aircraft.aircraftId === flightData.aircraftId || 
                   aircraft.id === flightData.aircraftId ||
                   aircraft.rawRegistration === flightData.aircraftId ||  // Use rawRegistration!
                   aircraft.registration === flightData.aircraftId ||
                   aircraft.name === flightData.aircraftId;
          });
          
          if (matchingAircraft) {
            console.log('🛩️ FLIGHT LOAD: Found matching aircraft:', matchingAircraft.registration, 'type:', matchingAircraft.modelType);
            
            // ROBUST AIRCRAFT SELECTION: Set all aircraft state directly
            setAircraftType(matchingAircraft.modelType);
            setAircraftRegistration(matchingAircraft.registration);
            setSelectedAircraft(matchingAircraft);
            
            console.log('🛩️ FLIGHT LOAD: Aircraft state set directly:', {
              type: matchingAircraft.modelType,
              registration: matchingAircraft.registration,
              cruiseSpeed: matchingAircraft.cruiseSpeed,
              fuelBurn: matchingAircraft.fuelBurn
            });
            
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
          console.error('🚁 Error setting aircraft FIRST:', error);
        }
      }
      
      // 🎯 GLASS MENU: Activate glass menu when flight loads
      setIsFlightLoaded(true);
      setIsEditLocked(true); // Always start locked to prevent accidental edits
      setLoadedFlightData(flightData); // Store flight data for AppHeader display
      
      // 🎯 NEW BEHAVIOR: Close BOTH panels when flight loads and apply lock
      
      // Add a small delay to ensure flight load card transitions complete first
      setTimeout(() => {
        
        // Close BOTH panels after flight load to show clean map
        if (leftPanelVisible) {
          toggleLeftPanel();
        } else {
        }
        
        if (rightPanelVisible) {
          toggleRightPanel();
        } else {
        }
        
      }, 300); // Small delay to ensure smooth transitions

      // 🚨 CRITICAL: Set current flight ID and load weather segments
      if (flightData.flightId) {
        setCurrentFlightId(flightData.flightId);
        
        // 💾 FUEL LOAD-BACK: Load saved fuel data from MainFuelV2 with new OSDK v0.9.0 support
        try {
          console.log('💾 FUEL LOAD-BACK: Loading saved fuel and refuel stops for flight:', flightData.flightId);
          
          // 🔄 CRITICAL: Clear refuel state at start of flight loading
          console.log('💾 FUEL LOAD-BACK: Clearing refuel state at start of flight load');
          console.log('💾 FUEL LOAD-BACK: Current refuel state before clear:', currentRefuelStops);
          setCurrentRefuelStops([]);
          
          // Force a brief delay to ensure state clearing takes effect
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Import FuelSaveBackService with new loadFuelSettingsForFlight method
          const { FuelSaveBackService } = await import('./services/FuelSaveBackService');
          
          // Load fuel settings using new consolidated method - pass full flightData for fuelPlanId
          const fuelSettings = await FuelSaveBackService.loadFuelSettingsForFlight(flightData);
          
          if (fuelSettings) {
            console.log('💾 FUEL LOAD-BACK: Loaded fuel settings:', fuelSettings);
            console.log('💾 FUEL LOAD-BACK: Flight data details:', {
              flightId: flightData?.id || flightData?.flightId,
              fuelPlanId: flightData?.fuelPlanId,
              currentWaypoints: waypoints?.map(w => w.name),
              loadedRefuelStops: fuelSettings.refuelStops
            });
            console.log('💾 FUEL LOAD-BACK: DEBUG - fuelSettings structure:', {
              hasExtraFuel: typeof fuelSettings.extraFuel !== 'undefined',
              extraFuelValue: fuelSettings.extraFuel,
              hasLocationOverrides: !!fuelSettings.locationOverrides,
              locationOverridesCount: fuelSettings.locationOverrides ? Object.keys(fuelSettings.locationOverrides).length : 0,
              hasFuelObject: !!fuelSettings.fuelObject,
              fuelObjectId: fuelSettings.fuelObject?.$primaryKey
            });
            
            // 🎯 CRITICAL: Store the actual fuel object to avoid duplicate lookups during save
            if (fuelSettings.fuelObject) {
              console.log('💾 FUEL LOAD-BACK: Storing fuel object for reuse:', fuelSettings.fuelObject.$primaryKey);
              setLoadedFuelObject(fuelSettings.fuelObject);
            }
            
            // 1. Restore location fuel overrides (includes extra fuel and any other overrides)
            if (fuelSettings.locationOverrides && Object.keys(fuelSettings.locationOverrides).length > 0) {
              console.log('💾 FUEL LOAD-BACK: Restoring location fuel overrides:', fuelSettings.locationOverrides);
              
              setLocationFuelOverrides(fuelSettings.locationOverrides);
              
              // 🔧 FORCE RECALCULATION: Trigger recalculation after setting location overrides
              setForceUpdate(prev => prev + 1);
              
              if (window.LoadingIndicator) {
                const overrideCount = Object.keys(fuelSettings.locationOverrides).length;
                window.LoadingIndicator.updateStatusIndicator(
                  `Restored ${overrideCount} fuel overrides`,
                  'info',
                  2000
                );
              }
              
              console.log('💾 FUEL LOAD-BACK: Successfully restored location fuel overrides');
            } else if (typeof fuelSettings.extraFuel === 'number' && fuelSettings.extraFuel > 0) {
              // Fallback for old flights that only have plannedExtraFuel (convert to location override)
              console.log('💾 FUEL LOAD-BACK: Converting legacy extra fuel to departure location override:', fuelSettings.extraFuel);
              
              const departureWaypoint = waypoints[0]?.name;
              if (departureWaypoint) {
                const overrideKey = `${departureWaypoint}_1_extraFuel`;
                console.log('💾 FUEL LOAD-BACK: Creating departure override for legacy fuel:', { key: overrideKey, value: fuelSettings.extraFuel });
                
                setLocationFuelOverrides({ [overrideKey]: fuelSettings.extraFuel });
                setForceUpdate(prev => prev + 1);
                
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `Converted legacy extra fuel: ${fuelSettings.extraFuel} lbs`,
                    'info',
                    2000
                  );
                }
              }
            }
            
            // 🔄 CRITICAL: Clear any existing refuel state before loading new data
            console.log('💾 FUEL LOAD-BACK: Clearing existing refuel state before loading new flight');
            setCurrentRefuelStops([]);
            
            // 2. Restore refuel stop flags (user selections)
            if (fuelSettings.refuelStops && Array.isArray(fuelSettings.refuelStops) && fuelSettings.refuelStops.length > 0) {
              console.log('💾 FUEL LOAD-BACK: Restoring refuel stops:', fuelSettings.refuelStops);
              console.log('💾 FUEL LOAD-BACK: Current waypoints:', waypoints.map((w, i) => `${i}: ${w.name}`));
              
              // Set refuel flags after waypoints are loaded
              setTimeout(() => {
                // Find waypoints that match the refuel stop locations
                const currentWaypoints = waypoints || [];
                const refuelIndices = [];
                
                const updatedWaypoints = currentWaypoints.map((waypoint, index) => {
                  const isRefuelStop = fuelSettings.refuelStops.includes(waypoint.name);
                  if (isRefuelStop) {
                    // ✅ CRITICAL FIX: Find the stop card index for this waypoint name, not waypoint index
                    // We need to find where this waypoint appears in the stop cards, not waypoints
                    const stopCardIndex = stopCards.findIndex(card => card.stopName === waypoint.name);
                    if (stopCardIndex >= 0) {
                      const stopCardUIIndex = stopCardIndex + 1; // Stop cards use 1-based indexing
                      console.log('💾 FUEL LOAD-BACK: Found', waypoint.name, 'at stop card index:', stopCardUIIndex);
                      refuelIndices.push(stopCardUIIndex);
                    } else {
                      console.warn('💾 FUEL LOAD-BACK: Could not find stop card for waypoint:', waypoint.name);
                    }
                  }
                  return {
                    ...waypoint,
                    refuelMode: isRefuelStop
                  };
                });
                
                // Update waypoints with refuel flags
                setWaypoints(updatedWaypoints);
                
                // Update currentRefuelStops state for UI checkboxes
                if (refuelIndices.length > 0) {
                  // 🚨 CRITICAL FIX: Remove duplicates from refuelIndices
                  const uniqueRefuelIndices = [...new Set(refuelIndices)];
                  console.log('💾 FUEL LOAD-BACK: Setting currentRefuelStops to:', uniqueRefuelIndices);
                  console.log('💾 FUEL LOAD-BACK: Before setCurrentRefuelStops - current state:', currentRefuelStops);
                  setCurrentRefuelStops(uniqueRefuelIndices);
                  
                  // Verify state update with setTimeout
                  setTimeout(() => {
                    console.log('💾 FUEL LOAD-BACK: After setCurrentRefuelStops - new state should be:', refuelIndices);
                  }, 100);
                } else {
                  console.log('💾 FUEL LOAD-BACK: No refuel indices found, checking if we should store pending');
                  // Store for later processing when stop cards are available
                  if (fuelSettings.refuelStops && fuelSettings.refuelStops.length > 0) {
                    console.log('💾 FUEL LOAD-BACK: Storing pending refuel stops for later:', fuelSettings.refuelStops);
                    setPendingRefuelStops(fuelSettings.refuelStops);
                  }
                }
                
                if (window.LoadingIndicator && fuelSettings.refuelStops.length > 0) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `Restored ${fuelSettings.refuelStops.length} refuel stops`,
                    'info',
                    2000
                  );
                }
              }, 500); // Wait for waypoints to be loaded
            }
            
          } else {
            console.log('💾 FUEL LOAD-BACK: No saved fuel settings found for flight');
          }
          
        } catch (fuelLoadError) {
          console.error('❌ FUEL LOAD-BACK: Failed to load fuel settings:', fuelLoadError);
          // Don't block flight loading if fuel settings load fails
        }
        
        // Manually trigger weather loading
        if (loadWeatherSegments) {
          loadWeatherSegments(flightData.flightId)
            .then(result => {
              
              // Store weather segments and auto-show circles if data is available
              if (result && result.segments && result.segments.length > 0) {
                
                // Store the segments for toggle to use
                window.loadedWeatherSegments = result.segments;
                
                // 🚁 HYBRID WEATHER SYSTEM: Auto-show weather circles for airports + rig graphics for rigs
                setTimeout(() => {
                  try {
                    
                    // Split segments into airports vs rigs
                    const airportSegments = result.segments.filter(segment => !segment.isRig);
                    const rigSegments = result.segments.filter(segment => segment.isRig === true);

                    // 1. Create weather circles for AIRPORTS ONLY
                    if (airportSegments.length > 0) {
                      import('./modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                        if (mapManagerRef?.current?.map) {
                          
                          // Clean up any existing layer first
                          if (window.currentWeatherCirclesLayer) {
                            try {
                              window.currentWeatherCirclesLayer.removeWeatherCircles();
                            } catch (cleanupError) {
                              console.warn('🌤️ HYBRID: Error during cleanup:', cleanupError);
                            }
                          }
                          
                          const weatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
                          weatherCirclesLayer.addWeatherCircles(airportSegments); // Only airports
                          window.currentWeatherCirclesLayer = weatherCirclesLayer;
                        }
                      }).catch(importError => {
                        console.error('🌤️ HYBRID: Error importing WeatherCirclesLayer:', importError);
                      });
                    }
                    
                    // 2. Create rig weather graphics for RIGS ONLY with REAL API data
                    if (rigSegments.length > 0) {
                      
                      // 🚨 RACE CONDITION FIX: Wait for rig weather integration to be available
                      const waitForRigWeatherIntegration = () => {
                        return new Promise((resolve) => {
                          const checkIntegration = () => {
                            if (window.rigWeatherIntegration) {
                              resolve();
                            } else {
                              setTimeout(checkIntegration, 100);
                            }
                          };
                          checkIntegration();
                        });
                      };
                      
                      // Enable rig weather graphics after integration is ready
                      waitForRigWeatherIntegration().then(() => {
                        if (window.rigWeatherIntegration) {
                          window.rigWeatherIntegration.toggleVisibility(true);
                        }
                      });
                      
                      // DISABLED: Competing rig-only system - WeatherCirclesLayer now handles ALL arrows  
                    }
                    
                  } catch (autoShowError) {
                    console.error('🚁 HYBRID: Error during hybrid weather display:', autoShowError);
                  }
                }, 1000); // Wait 1 second for map to be ready
              }
            })
            .catch(error => {
              console.error('🌤️ MANUAL: Failed to load weather segments:', error);
            });
        }
      }
      
      // CRITICAL FIX: Apply wind data from loaded flight - use Palantir automation calculated wind
      
      if (flightData.windSpeed !== undefined || flightData.windDirection !== undefined || flightData.windData) {
        // Priority: Use windData structure first, then direct fields (from automation)
        const windSpeed = flightData.windData?.windSpeed || flightData.windSpeed || 0;
        const windDirection = flightData.windData?.windDirection || flightData.windDirection || 0;
        
        const newWeather = {
          windSpeed,
          windDirection,
          source: 'palantir_automation'
        };
        
        setWeather(newWeather);
        
        // Force a re-render to ensure UI updates
        setTimeout(() => {
          // Force re-render
        }, 100);
        
      } else {
      }
      
      // Clear existing route data but preserve loaded flight data
      hookClearRoute(); // Clear waypoints, stop cards, route stats
      setAlternateRouteData(null); // Clear alternate route
      setAlternateRouteInput('');
      clearWeatherSegments(); // Clear weather segments
      
      // Clear weather circles immediately (don't wait for new flight to load)
      if (window.currentWeatherCirclesLayer) {
        try {
          window.currentWeatherCirclesLayer.removeWeatherCircles();
          window.currentWeatherCirclesLayer = null;
        } catch (e) {
          console.warn('🧹 FLIGHT LOAD: Error removing weather circles:', e.message);
        }
      }
      
      // Clear weather window state
      window.currentWeatherSegments = null;
      window.currentWeatherAnalysis = null;
      window.loadedWeatherSegments = null;
      
      // Force clear any stuck weather circles locks
      window.weatherCirclesCreationInProgress = false;
      window.weatherCirclesLockTime = null;
      
      // Reset weather fuel state
      setWeatherFuel({ araFuel: 0, approachFuel: 0 });
      
      // NOTE: We deliberately DON'T clear loadedFlightData here since we just set it
      
      // Wait for clear to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 🎬 BEFORE FLIGHT LOADS: Switch to satellite if in edit mode
      if (currentMapMode !== '3d' && mapManagerRef?.current?.map) {
        const map = mapManagerRef.current.map;
        map.setStyle('mapbox://styles/mapbox/satellite-v9');
        setCurrentMapMode('3d');
        
        // Wait for style to load before continuing
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Remove this - check mode later at actual animation time
      
      // SIMPLE: Let the normal flight loading work like the wizard does
      
      // 🚨 CRITICAL FIX: Always check for displayWaypoints in raw flight data first
      // The issue was that extracted waypoints were incomplete, causing fallback to route string
      const hasRawDisplayWaypoints = flightData._rawFlight?.displayWaypoints;
      const hasExtractedWaypoints = (flightData.displayWaypoints && flightData.displayWaypoints.length > 0) ||
                                  (flightData.waypoints && flightData.waypoints.length > 0);
      
      // 🚨 NEVER use hookAddWaypoint for flight loading - it puts data in route input!
      // Only process stops as a route string if we have NO waypoint data at all
      if (flightData.stops && flightData.stops.length > 0 && !hasRawDisplayWaypoints && !hasExtractedWaypoints) {
        
        // 🚨 CRITICAL: Use direct waypoint manager instead of hookAddWaypoint
        // hookAddWaypoint puts data in route input field, not waypoint list!
        try {
          if (appManagers.waypointManagerRef?.current) {
            
            // Clear existing waypoints first
            if (typeof appManagers.waypointManagerRef.current.clearWaypoints === 'function') {
              appManagers.waypointManagerRef.current.clearWaypoints();
            }
            
            // Add each stop as a landing stop waypoint
            for (let i = 0; i < flightData.stops.length; i++) {
              const stopName = flightData.stops[i];
              
              try {
                if (appManagers.waypointManagerRef.current.addWaypointByName) {
                  await appManagers.waypointManagerRef.current.addWaypointByName(stopName, {
                    isWaypoint: false, // This is a landing stop
                    type: 'LANDING_STOP'
                  });
                }
                
                // Small delay between additions
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                console.error(`🚨 FALLBACK: Error adding stop ${stopName}:`, error);
              }
            }
            
          } else {
            console.error('🚨 FALLBACK: WaypointManager not available for stop processing');
          }
        } catch (error) {
          console.error('🚨 FALLBACK: Error processing stops via WaypointManager:', error);
        }
        
        // Wait for waypoint processing to complete with improved timing
        
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

              // Check if we have the expected number of waypoints (at least the stops)
              if (currentWaypoints.length >= flightData.stops.length || attempts >= maxAttempts) {
                resolve(currentWaypoints);
              } else {
                setTimeout(checkWaypoints, checkInterval);
              }
            };
            
            checkWaypoints();
          });
        };
        
        // Wait for waypoints to be processed
        const processedWaypoints = await waitForWaypoints();
        
        const currentRouteStats = routeStats || window.currentRouteStats;

        if (processedWaypoints && processedWaypoints.length >= 2) {
          
          // Generate stop cards using the same logic as normal route building
          const newStopCards = generateStopCardsData(
            processedWaypoints, 
            currentRouteStats, 
            selectedAircraft, 
            weather,
            {
              ...flightSettings,
              araFuel: weatherFuel.araFuel,
              approachFuel: weatherFuel.approachFuel,
              locationFuelOverrides: locationFuelOverrides  // ✅ NEW: Pass location-specific fuel overrides
            }
          );
          
          // 🌤️ DEFERRED: Weather segments and circles moved to AFTER flight sequence completion
          
          if (newStopCards && newStopCards.length > 0) {
            setStopCards(newStopCards);
            
            // Make stop cards globally available for debugging
            window.debugStopCards = newStopCards;
            
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
        
        // Set current flight ID for WeatherCard
        setCurrentFlightId(flightId);
        
        try {
          const weatherResult = await loadWeatherSegments(flightId);
          if (weatherResult && weatherResult.segments && weatherResult.segments.length > 0) {
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Weather segments loaded: ${weatherResult.segments.length} locations`, 
                'success',
                3000
              );
            }
          } else {
          }
        } catch (weatherError) {
          console.error('🌤️ Error loading weather segments:', weatherError);
          // Don't block flight loading if weather fails
        }
      } else {
      }
      
      // CRITICAL FIX: Force wind input UI update at the end of flight loading
      if (flightData.windData) {
        
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
          }
          
          if (windSpeedInput) {
            windSpeedInput.value = flightData.windData.windSpeed;
            windSpeedInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // CRITICAL FIX: Force stop cards regeneration with new wind data
          // 🚨 SAFETY: Check aircraft data before calculating (CONSISTENT WITH MAIN USEEFFECT)
          const hasRequiredAircraftData = selectedAircraft && 
            selectedAircraft.fuelBurn &&
            selectedAircraft.usefulLoad && selectedAircraft.usefulLoad > 0;
            
          if (waypoints && waypoints.length >= 2 && selectedAircraft && hasRequiredAircraftData) {
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
                approachFuel: weatherFuel.approachFuel,
                locationFuelOverrides: locationFuelOverrides  // ✅ NEW: Pass location-specific fuel overrides
              }
            );
            
            if (newStopCards && newStopCards.length > 0) {
              setStopCards(newStopCards);
            }
          } else {
            // Waiting for aircraft or waypoint data
          }
        }, 100);
      }
      
      // After loading completes, ensure we return to the main card
      setTimeout(() => {
        // The RightPanel should automatically show stop cards if they exist
        // This timeout ensures the panel switches back to main view after loading
      }, 2000);
      
      // 🚨 CRITICAL FIX: Ensure waypoint processing uses proper sources
      // Process waypoints - handle both displayWaypoints (strings) and waypoints (objects)
      let waypointsToProcess = [];
      
      // Priority 1: Use flightData.displayWaypoints if available
      if (flightData.displayWaypoints && flightData.displayWaypoints.length > 0) {
        waypointsToProcess = flightData.displayWaypoints;
      } 
      // Priority 2: Check raw flight displayWaypoints
      else if (flightData._rawFlight?.displayWaypoints) {
        const rawDisplayWaypoints = flightData._rawFlight.displayWaypoints;
        
        if (typeof rawDisplayWaypoints === 'string' && rawDisplayWaypoints.includes('|')) {
          waypointsToProcess = rawDisplayWaypoints.split('|').map(wp => wp.trim()).filter(wp => wp.length > 0);
        } else if (Array.isArray(rawDisplayWaypoints)) {
          waypointsToProcess = rawDisplayWaypoints;
        } else {
        }
      }
      // Priority 3: Fall back to extracted waypoints + stops reconstruction  
      else if (flightData.waypoints && flightData.waypoints.length > 0) {
        
        // We need to reconstruct the full sequence from the original displayWaypoints
        // Check if we have the raw flight data with the original displayWaypoints
        if (flightData._rawFlight && flightData._rawFlight.displayWaypoints) {
          const rawDisplayWaypoints = flightData._rawFlight.displayWaypoints;
          
          if (typeof rawDisplayWaypoints === 'string' && rawDisplayWaypoints.includes('|')) {
            waypointsToProcess = rawDisplayWaypoints.split('|').map(wp => wp.trim()).filter(wp => wp.length > 0);
          } else if (Array.isArray(rawDisplayWaypoints)) {
            waypointsToProcess = rawDisplayWaypoints;
          }
        }
        
        // Fallback: reconstruct from waypoints + stops if raw data not available
        if (waypointsToProcess.length === 0) {
          
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
        
      }
      
      if (waypointsToProcess.length > 0) {
        
        // Process the route data (stops are processed via waypoint loading, no need to fill input field)
        
        try {
          // Get the full route coordinates from the raw flight data
          const rawFlight = flightData._rawFlight;
          let routeCoordinates = [];
          let alternateRouteData = null;

          if (rawFlight && rawFlight.fullRouteGeoShape) {
            // Extract coordinates from the GeoShape
            const geoShape = rawFlight.fullRouteGeoShape.toGeoJson ? 
              rawFlight.fullRouteGeoShape.toGeoJson() : rawFlight.fullRouteGeoShape;

            if (geoShape && geoShape.coordinates) {
              routeCoordinates = geoShape.coordinates;
            } else {
              console.warn('DEBUG: No coordinates found in geoShape');
            }
          } else {
            console.warn('DEBUG: No fullRouteGeoShape found in raw flight');
          }
          
          // MOVED: Alternate route processing will happen AFTER main route loads
          
          // Get the waypoint names with labels
          const displayWaypoints = waypointsToProcess;
          
          // Match waypoints with coordinates and place them directly
          if (routeCoordinates.length > 0 && displayWaypoints.length === routeCoordinates.length) {
            
            // Wait for stops to be processed first
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Clear any existing waypoints first
            if (appManagers.waypointManagerRef?.current) {
              if (typeof appManagers.waypointManagerRef.current.clearWaypoints === 'function') {
                appManagers.waypointManagerRef.current.clearWaypoints();
              } else {
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
                }
                
                // Small delay between placements to avoid conflicts
                await new Promise(resolve => setTimeout(resolve, 50));
                
              } catch (error) {
                console.error(`Error placing waypoint ${cleanName}:`, error);
                // Continue with other waypoints even if one fails
              }
            }

            // EXTRACT AND RENDER: Process alternate route AFTER main route is complete
            
            let alternateRouteData = null;
            
            // Extract alternate route data (moved from earlier)
            const rawFlight = flightData._rawFlight;
            if (flightData.alternateRouteData) {
              alternateRouteData = flightData.alternateRouteData;
            } else if (rawFlight && rawFlight.alternateFullRouteGeoShape) {
              
              const alternateGeoShape = rawFlight.alternateFullRouteGeoShape.toGeoJson ? 
                rawFlight.alternateFullRouteGeoShape.toGeoJson() : rawFlight.alternateFullRouteGeoShape;
                
              if (alternateGeoShape && alternateGeoShape.coordinates) {
                alternateRouteData = {
                  coordinates: alternateGeoShape.coordinates,
                  splitPoint: rawFlight.alternateSplitPoint || null,
                  name: rawFlight.alternateName || 'Alternate Route',
                  geoPoint: rawFlight.alternateGeoPoint || null,
                  legIds: rawFlight.alternateLegIds || []
                };
              }
            }
            
            // Store and render alternate route AFTER main route
            if (alternateRouteData) {
              setAlternateRouteData(alternateRouteData);
              setAlternateRouteInput(alternateRouteData.name);
              window.pendingAlternateRouteData = alternateRouteData;
              
              // Render alternate route
              setTimeout(() => {
                if (appManagers.waypointManagerRef?.current && alternateRouteData) {
                  appManagers.waypointManagerRef.current.updateRoute(routeStats, alternateRouteData);
                }
              }, 300); // Small delay after main route completion
            } else {
              setAlternateRouteData(null);
              setAlternateRouteInput('');
              window.pendingAlternateRouteData = null;
            }
            
            // 🛢️ RIG WEATHER: Make waypoints globally available for weather circle coordinate lookup
            const waypointObjects = routeCoordinates.map((coords, index) => ({
              name: displayWaypoints[index]?.replace(/\s*\([^)]*\)\s*$/, '').trim() || `Point ${index + 1}`,
              lng: coords[0],
              lat: coords[1],
              coordinates: coords
            }));
            window.currentWaypoints = waypointObjects;
            
            // 🎯 ZOOM: Always zoom to flight after it loads
            setTimeout(() => {
              if (routeCoordinates && routeCoordinates.length > 0 && mapManagerRef?.current) {
                
                // Combine main route with alternates for bounding box
                let allCoordinates = [...waypointObjects];
                
                // Add alternate route coordinates if available
                if (alternateRouteData?.coordinates) {
                  const alternateWaypoints = alternateRouteData.coordinates.map(coord => ({
                    lat: coord[1],
                    lng: coord[0],
                    name: 'Alternate'
                  }));
                  allCoordinates = [...allCoordinates, ...alternateWaypoints];
                }
                
                // Zoom to include both main route and alternates
                const zoomSuccess = mapManagerRef.current.autoZoomToFlight(allCoordinates, {
                  padding: 120,     // Less padding 
                  maxZoom: 8,       // Closer zoom (back to 8)
                  duration: 2000,   
                  animate: true,
                  pitch: 60         
                });
                
                if (zoomSuccess) {
                  // Zoom succeeded
                } else {
                  console.warn('🎯 ZOOM: Failed to zoom to flight');
                }
              }
            }, 500); // Small delay to allow waypoint rendering
            
            // 🎯 SMOOTH TILT: Just smooth tilt, accept current map style
            setTimeout(() => {
              if (mapManagerRef?.current?.map) {
                const map = mapManagerRef.current.map;
                
                // Smooth tilt without changing anything else
                map.flyTo({
                  pitch: 60,
                  duration: 1500,
                  easing: (t) => 1 - Math.pow(1 - t, 3)
                });
                
                // Update state so glass button works correctly
                setCurrentMapMode('3d');
              }
            }, 2500); // After zoom completes
            
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
        
        // Fallback: try using combinedWaypoints if displayWaypoints is not available
        if (flightData.combinedWaypoints && flightData.combinedWaypoints.length > 0) {
          
          try {
            // Process combinedWaypoints - these don't have labels so we need to determine type differently
            const stops = flightData.stops || [];
            
            for (const waypointName of flightData.combinedWaypoints) {
              const isStop = stops.includes(waypointName);
              
              if (!isStop) { // Only add navigation waypoints, stops are already handled
                
                try {
                  if (appManagers.waypointManagerRef?.current?.addWaypointByName) {
                    await appManagers.waypointManagerRef.current.addWaypointByName(waypointName, {
                      isWaypoint: true,
                      type: 'WAYPOINT'
                    });
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
        }
      }
      
      // Aircraft selection moved to beginning of function
      
      // Update status
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Flight loaded: ${flightData.flightNumber || 'Unknown'} with ${flightData.stops.length} stops`, 
          'success',
          3000
        );
      }
      
      // 🛩️ FLIGHT LOADING FALLBACK: Legacy workaround - should no longer be needed
      // The proper fix is now in useManagers.js with authentication-gated initialization
      // Keeping this as a safety net until the new architecture is fully verified
      setTimeout(() => {
        if (appManagers.waypointManagerRef?.current) {
          const waypointManagerWaypoints = appManagers.waypointManagerRef.current.waypoints || [];
          const currentReactWaypoints = waypoints || [];
          
          // Check if callback system worked by comparing waypoint counts
          if (waypointManagerWaypoints.length > 0 && currentReactWaypoints.length === 0) {
            console.log('🔧 FLIGHT LOADING WORKAROUND: Callback system failed online, forcing React state sync');
            console.log(`WaypointManager has ${waypointManagerWaypoints.length} waypoints, React state has ${currentReactWaypoints.length}`);
            
            // Force React state update with waypoint manager's current waypoints
            if (typeof setWaypoints === 'function') {
              setWaypoints([...waypointManagerWaypoints]);
              console.log('✅ FLIGHT LOADING WORKAROUND: Successfully synced React state with waypoint manager');
              
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(
                  'Flight loading callback system repaired automatically', 
                  'info',
                  2000
                );
              }
            } else {
              console.error('❌ FLIGHT LOADING WORKAROUND: setWaypoints function not available');
            }
          } else if (waypointManagerWaypoints.length > 0 && currentReactWaypoints.length > 0) {
            console.log('✅ FLIGHT LOADING: Callback system worked correctly');
            console.log(`WaypointManager: ${waypointManagerWaypoints.length} waypoints, React state: ${currentReactWaypoints.length} waypoints`);
          } else {
            console.log('⚠️ FLIGHT LOADING: No waypoints in waypoint manager - flight may not have loaded correctly');
          }
        }
      }, 1000); // Give callbacks time to fire naturally first
      
    } catch (error) {
      console.error('Error loading flight:', error);
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to load flight: ${error.message}`, 
          'error'
        );
      }
    } finally {
      // CRITICAL: Always clear the loading flag, even if there's an error
      setIsActuallyLoading(false);
    }
  };

  // RegionAircraftConnector removed - using only event-based region sync

  // Glass menu handlers
  const handleToggleLock = () => {
    const newLockState = !isEditLocked;
    setIsEditLocked(newLockState);
    
    // Update global edit lock state for managers
    window.isEditLocked = newLockState;
    
    // 🚫 IMPLEMENT ACTUAL LOCKING - Disable map interactions when locked
    if (newLockState) {
      // LOCKED - Disable map interactions
      
      // Disable map click handlers
      if (appManagers.mapInteractionHandlerRef?.current) {
        appManagers.mapInteractionHandlerRef.current.disableMapClicks();
      }
      
      // Disable waypoint dragging
      if (appManagers.waypointManagerRef?.current) {
        appManagers.waypointManagerRef.current.disableWaypointDragging();
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
      
      // Re-enable map click handlers
      if (appManagers.mapInteractionHandlerRef?.current) {
        appManagers.mapInteractionHandlerRef.current.enableMapClicks();
      }
      
      // Re-enable waypoint dragging
      if (appManagers.waypointManagerRef?.current) {
        appManagers.waypointManagerRef.current.enableWaypointDragging();
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
    if (appManagers.waypointManagerRef?.current) {
      setTimeout(() => {
        if (typeof appManagers.waypointManagerRef.current.refreshRouteDisplay === 'function') {
          appManagers.waypointManagerRef.current.refreshRouteDisplay();
        }
        if (typeof appManagers.waypointManagerRef.current.updateRouteDragState === 'function') {
          appManagers.waypointManagerRef.current.updateRouteDragState(window._originalRouteDragHandler);
        }
      }, 100);
    }
  };

  // Phone layout: Right panel toggle handler for glass dock
  const handleToggleRightPanel = () => {
    toggleRightPanel();
  };

  const handleOpenRoute = () => {
    toggleLeftPanel();
  };

  const handleOpenMenu = () => {
    
    // Menu button ONLY closes panels, never opens them
    // If either panel is open, close BOTH panels
    if (leftPanelVisible || rightPanelVisible) {
      
      if (leftPanelVisible) {
        toggleLeftPanel();
      }
      
      if (rightPanelVisible) {
        toggleRightPanel();
      }
    } else {
      // If both panels are already closed, do nothing
    }
  };

  // 🎯 SMART TOGGLE: Detect satellite + no-rigs mode and track current mode
  const [showEditButton, setShowEditButton] = useState(false);
  const [currentMapMode, setCurrentMapMode] = useState('dark'); // Track current map style
  
  // 🎯 SMART TOGGLE: Listen for flight load events and detect final mode
  useEffect(() => {
    const handleFlightLoadComplete = (event) => {
      
      // Show button and detect mode after flight loads with 3D transition
      setTimeout(() => {
        setShowEditButton(true);
        
        // DISABLED: This was overriding FlightSequenceController's state setting
        // FlightSequenceController now properly manages currentMapMode
      }, 1000);
    };
    
    // 🎯 SMART TOGGLE: Listen for map mode changes from flight loading
    const handleMapModeChanged = (event) => {
      const { mode, source } = event.detail;
      
      if (source === 'flight-loading') {
        setCurrentMapMode(mode); // This will make the button show "Edit" instead of "Satellite"
      }
    };
    
    // Listen for custom flight load events
    window.addEventListener('flight-loaded', handleFlightLoadComplete);
    window.addEventListener('map-mode-changed', handleMapModeChanged);
    
    return () => {
      window.removeEventListener('flight-loaded', handleFlightLoadComplete);
      window.removeEventListener('map-mode-changed', handleMapModeChanged);
    };
  }, []); // No dependencies to avoid conflicts

  // 🎯 SMART TOGGLE: Show button when flight is loaded, hide when cleared
  useEffect(() => {
    if (!loadedFlightData) {
      setShowEditButton(false);
    } else {
      setShowEditButton(true);
    }
  }, [loadedFlightData]);
  
  // 🎯 SMART TOGGLE: Toggle between satellite and edit modes (like 3D toggle button)
  const handleToggleMode = async () => {
    
    try {
      const mapManager = mapManagerRef?.current;
      if (!mapManager) {
        console.error('🎯 SMART TOGGLE: Map manager not available');
        return;
      }
      
      // Use our tracked state instead of map detection (more reliable)
      const newStyle = currentMapMode === '3d' ? 'dark' : '3d';

      // Update state immediately to prevent double-clicks
      setCurrentMapMode(newStyle);
      
      await mapManager.switchMapStyle(newStyle);
      
      // CRITICAL: Reset camera to top-down view when switching back to 2D
      const map = mapManager.getMap();
      if (newStyle === 'dark' && map) {
        
        // First reset terrain to avoid conflicts
        if (map.getTerrain()) {
          map.setTerrain(null);
        }
        
        // Then smooth transition to vertical 
        setTimeout(() => {
          map.easeTo({
            pitch: 0,     // Top-down view
            bearing: 0,   // North up
            duration: 1200 // Longer duration for smoother animation
          });
        }, 100); // Small delay after terrain removal
      } else if (newStyle === '3d') {
        // 3D style selected
      }

      // RESTORE LAYERS after style switch (same timing as MapLayersCard)
      setTimeout(() => {
        
        // Emit the same events as MapLayersCard to restore all layers
        setTimeout(() => {
          const eventDetail = { 
            newStyle, 
            previousLayers: {}, 
            restoreAlternateLines: true,
            restoreWeatherCircles: true 
          };

          // Emit the same multiple event types as MapLayersCard
          ['map-style-switched', 'map-style-changed'].forEach(eventName => {
            const event = new CustomEvent(eventName, { detail: eventDetail });
            window.dispatchEvent(event);
          });
          
        }, 500);

      }, 1000); // Wait 1 second for style to fully load (same as MapLayersCard)
      
      // Update mode tracking and editing lock
      setCurrentMapMode(newStyle);
      
      if (newStyle === 'dark') {
        setIsEditLocked(false);
        window.isEditLocked = false;
        
        // 🔧 FIX: Reset any flight sequence flags when entering edit mode
        // This prevents tilt flags from persisting when loading new flights
        if (window.flightSequenceController) {
          window.flightSequenceController.reset();
        }
        
        // 🎯 CRITICAL FIX: Initialize ALL interaction handlers for edit mode
        // This was missing - explains why click/drag/hover didn't work in edit mode
        setTimeout(() => {
          if (mapInteractionHandlerRef.current) {
            console.log('🎯 EDIT MODE: Re-initializing ALL interaction handlers');
            mapInteractionHandlerRef.current.initialize();
          }
          
          // ⛽ AUTO-LOAD REFUEL RIGS: 99% of edit mode usage is for adding refuel stops
          if (platformManagerRef.current) {
            console.log('🎯 EDIT MODE: Auto-loading rigs with fuel for editing');
            // Show rigs with fuel capability specifically
            platformManagerRef.current.toggleFuelAvailableVisibility(true);
          }
        }, 100); // Small delay to ensure map style is loaded
      } else {
        setIsEditLocked(true);
        window.isEditLocked = true;
      }
      
    } catch (error) {
      console.error('🎯 SMART TOGGLE: Error in toggle mode:', error);
    }
  };

  // Create ref for RightPanel to access its card change functionality
  const rightPanelRef = useRef(null);
  
  // Track the current active card in main component for toggle functionality
  const [currentActiveCard, setCurrentActiveCard] = useState('main');

  // Function to handle card changes from glass dock buttons with toggle functionality
  const handleCardChange = useCallback((cardId) => {
    
    // If panel is open and same card is clicked → close panel (toggle off)
    if (rightPanelVisible && currentActiveCard === cardId) {
      toggleRightPanel();
      return;
    }
    
    // Otherwise → open panel and/or switch to card
    
    // Open panel if closed
    if (!rightPanelVisible) {
      toggleRightPanel();
    }
    
    // Switch to the requested card and update our tracking
    if (rightPanelRef.current?.handleCardChange) {
      rightPanelRef.current.handleCardChange(cardId);
      setCurrentActiveCard(cardId);
    }
  }, [rightPanelVisible, currentActiveCard, toggleRightPanel]);

  // Individual card change handlers for glass dock buttons
  const handleMainCard = () => handleCardChange('main');
  const handleSettingsCard = () => handleCardChange('settings');
  const handlePerformanceCard = () => handleCardChange('performance');
  const handleWeatherCard = () => handleCardChange('weather');
  const handleFinanceCard = () => handleCardChange('finance');
  const handleSARCard = () => {
    handleCardChange('sar');
  };
  const handleSaveCard = () => handleCardChange('saveflight');
  const handleLoadCard = () => handleCardChange('loadflights');
  
  // Handle flight loading from wizard - use EXACT same path as RightPanel
  const handleLoadFlight = async (flight) => {
    
    // 🎯 CRITICAL: Process flight data exactly like RightPanel.handleLoadFlight does
    // This ensures the exact same stereolight mode, 3D camera, object clearing workflow

    // 🧹 CRITICAL: Clear all old weather graphics before loading new flight
    if (window.clearRigWeatherGraphics) {
      window.clearRigWeatherGraphics();
    }
    
    try {
      // Extract flight data for the main application (EXACT same as RightPanel)
      const flightData = {
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        
        // Extract stops (landing locations) from the stops array
        stops: flight.stops || [],
        
        // Extract aircraft ID if available
        aircraftId: flight.aircraftId,
        
        // Pass through the raw flight data for alternate routes and other data
        _rawFlight: flight._rawFlight,
        
        // Include other flight properties
        name: flight.name,
        status: flight.status,
        date: flight.date,
        etd: flight.etd
      };

      // Now call the main flight load handler (same as RightPanel does)
      await handleFlightLoad(flightData);
      
    } catch (error) {
      console.error('🧙‍♂️ Wizard: Error in flight loading workflow:', error);
    }
  };
  const handleLayersCard = () => handleCardChange('maplayers');
  
  // LIVE weather toggle handler for glass menu - direct implementation
  const handleLiveWeatherToggle = useCallback(async () => {
    
    try {
      const mapInstance = appManagers.mapManagerRef?.current?.getMap();
      if (!mapInstance) {
        console.error('🌩️ No map instance available');
        return;
      }
      
      // Determine current state by checking for lightning, NOAA stations, and radar
      const hasLightningLayer = !!mapInstance.getLayer('simple-lightning-layer');
      const hasNOAAStations = !!observedWeatherStationsRef?.current?.isVisible;
      const hasConusRadar = !!mapInstance.getLayer('noaa-conus-layer');
      const isCurrentlyActive = hasLightningLayer || hasNOAAStations || hasConusRadar;
      
      if (!isCurrentlyActive) {
        // Turn ON lightning + NOAA stations + radar
        
        // Import weather loading functions
        const { addSimpleLightningOverlay, addNOAAWeatherOverlay } = await import('./modules/WeatherLoader.js');
        
        // Enable lightning
        if (!hasLightningLayer) {
          const lightningSuccess = await addSimpleLightningOverlay(mapInstance);
          if (lightningSuccess) {
          }
        }
        
        // Enable NOAA weather stations
        if (observedWeatherStationsRef?.current && !hasNOAAStations) {
          observedWeatherStationsRef.current.setVisible(true);
        } else if (!observedWeatherStationsRef?.current) {
          // Try to initialize NOAA stations if they don't exist
          try {
            const ObservedWeatherStationsLayer = (await import('./modules/layers/ObservedWeatherStationsLayer')).default;
            const stationsLayer = new ObservedWeatherStationsLayer(mapInstance);
            await stationsLayer.initialize();
            observedWeatherStationsRef.current = stationsLayer;
            stationsLayer.setVisible(true);
          } catch (initError) {
            console.error('❌ Failed to initialize NOAA weather stations:', initError);
          }
        }
        
        // TEMPORARILY DISABLED: CONUS radar (fixing radar URL issues)
        // The radar overlay is causing image decoding errors in production
        // Lightning and weather stations work fine, just radar needs fixing
        console.warn('🚧 CONUS radar temporarily disabled - working on fixing radar URLs');
        /*
        if (!hasConusRadar) {
          const radarSuccess = await addNOAAWeatherOverlay(mapInstance, 'CONUS');
          if (radarSuccess) {
          } else {
          }
        }
        */
        
        setLiveWeatherActive(true);
        
      } else {
        // Turn OFF lightning + NOAA stations + radar
        
        // Remove lightning layer
        if (hasLightningLayer) {
          if (mapInstance.getSource('simple-lightning')) {
            mapInstance.removeLayer('simple-lightning-layer');
            mapInstance.removeSource('simple-lightning');
          }
        }
        
        // Disable NOAA weather stations
        if (observedWeatherStationsRef?.current && hasNOAAStations) {
          observedWeatherStationsRef.current.setVisible(false);
        }
        
        // TEMPORARILY DISABLED: Remove CONUS radar (disabled above)
        /*
        if (hasConusRadar) {
          const { removeNOAAWeatherOverlay } = await import('./modules/WeatherLoader.js');
          await removeNOAAWeatherOverlay(mapInstance, 'CONUS');
        }
        */
        
        setLiveWeatherActive(false);
      }
      
    } catch (error) {
      console.error('❌ Error in LIVE weather toggle:', error);
    }
  }, [liveWeatherActive, appManagers.mapManagerRef, observedWeatherStationsRef]);

  // 🚁 SAR HANDLERS: Search and Rescue mode functionality
  const handleSARUpdate = useCallback((sarUpdate) => {
    // Sync SARManager state with the useSARMode state
    if (sarManager) {
      sarManager.sarEnabled = sarUpdate?.enabled || false;
    }
    
    setSarData(sarUpdate);
  }, []);

  // 🧙‍♂️ WIZARD HANDLERS: Flight planning wizard functionality
  const handleWizardComplete = useCallback((flightData) => {
    
    // Set aircraft if selected
    if (flightData.aircraft) {
      setAircraftRegistration(flightData.aircraft.registration);
      setSelectedAircraft(flightData.aircraft);
    } else if (flightData.aircraftType) {
      setAircraftType(flightData.aircraftType);
    }
    
    // 🛩️ NEW: Process passenger data from wizard for fuel optimization
    if (flightData.passengers && flightData.passengers.enabled && flightData.passengers.legData) {
      
      const legData = flightData.passengers.legData;
      
      // Calculate maximum passenger requirements across all legs for fuel calculations  
      let maxPassengerCount = 0;
      let maxTotalCargoWeight = 0;
      let standardPassengerWeight = 220; // Keep standard weight per passenger
      
      Object.values(legData).forEach(leg => {
        const passengerCount = leg.passengerCount || 0;
        const totalWeight = leg.totalWeight || 0;
        const bagWeight = leg.bagWeight || 0;
        
        maxPassengerCount = Math.max(maxPassengerCount, passengerCount);
        maxTotalCargoWeight = Math.max(maxTotalCargoWeight, bagWeight);
        
        // Calculate actual weight per passenger from the leg data
        if (passengerCount > 0) {
          const actualWeightPerPassenger = (totalWeight - bagWeight) / passengerCount;
          standardPassengerWeight = Math.max(standardPassengerWeight, actualWeightPerPassenger);
        }
      });
      
        maxPassengerCount,
        maxTotalCargoWeight,

      // Update flight settings with passenger data (keep standard format)
      setFlightSettings(prev => ({
        ...prev,
        passengerWeight: Math.round(standardPassengerWeight), // Weight PER passenger, not total
        cargoWeight: maxTotalCargoWeight, // Total cargo weight
        passengerCount: maxPassengerCount, // 🔧 FIX: Store passenger count for fuel calculations
        wizardPassengerData: flightData.passengers.legData // 🔧 FIX: Store detailed wizard passenger data
      }));
      
      // Store detailed passenger data for potential fuel optimization
      // Note: This would trigger fuel stop optimization if passenger count exceeds aircraft capacity
    }
    
    // Set departure time if provided
    if (flightData.departureTime) {
      const etdDate = new Date(flightData.departureTime);
      setFlightSettings(prev => {
        const newSettings = {
          ...prev,
          etd: etdDate
        };
        return newSettings;
      });
    }
    
    // Load saved fuel settings (extra fuel + refuel stops) from MainFuelV2
    console.log('🔍 DEBUG: Checking fuel loading conditions:', {
      hasFlightData: !!flightData,
      flightDataId: flightData?.id,
      flightDataKeys: flightData ? Object.keys(flightData) : 'no flightData'
    });
    
    if (flightData.id) {
      console.log('📥 Starting fuel loading for flight ID:', flightData.id);
      console.log('📥 DEBUG: Current waypoints count:', waypoints?.length);
      console.log('📥 DEBUG: Current stopCards count:', stopCards?.length);
      // Use Promise to handle async fuel loading without blocking flight loading
      FuelSaveBackService.loadFuelSettingsForFlight(flightData)
        .then(savedFuelData => {
          console.log('📥 Retrieved fuel settings:', savedFuelData);
          console.log('📥 Current flightSettings.extraFuel before loading:', flightSettings.extraFuel);
          
          // Convert saved extra fuel to departure location override
          if (savedFuelData.extraFuel > 0) {
            console.log('📥 Converting extra fuel to departure location override:', savedFuelData.extraFuel);
            
            // Get departure waypoint for location override (index 1 for departure)
            const departureWaypoint = waypoints[0]?.name;
            if (departureWaypoint) {
              const overrideKey = `${departureWaypoint}_1_extraFuel`;
              console.log('📥 Creating departure override:', { key: overrideKey, value: savedFuelData.extraFuel });
              
              // Add to location fuel overrides instead of global setting
              setLocationFuelOverrides(prev => ({
                ...prev,
                [overrideKey]: savedFuelData.extraFuel
              }));
              
              // Clear global extra fuel setting since it's now location-specific
              setFlightSettings(prev => ({
                ...prev,
                extraFuel: 0
              }));
              
              // 🔧 FORCE RECALCULATION: Trigger recalculation after setting location overrides
              setForceUpdate(prev => prev + 1);
              
              console.log('📥 Successfully converted extra fuel to departure location override');
            } else {
              console.warn('📥 No departure waypoint found, using global extra fuel fallback');
              // Fallback to global setting if no departure waypoint
              setFlightSettings(prev => ({
                ...prev,
                extraFuel: savedFuelData.extraFuel
              }));
            }
          }
          
          // 🔄 CRITICAL: Clear any existing refuel state before loading new data
          console.log('📥 BACKUP: Clearing existing refuel state before loading new flight');
          setCurrentRefuelStops([]);
          
          // Set refuel stop flags on waypoints
          if (savedFuelData.refuelStops && savedFuelData.refuelStops.length > 0) {
            console.log('📥 Restoring refuel stops:', savedFuelData.refuelStops);
            
            // Use setTimeout to allow waypoints to be set first
            setTimeout(() => {
              const refuelIndices = [];
              
              // 🔧 TIMING FIX: Check if we have stop cards data before proceeding
              if (!stopCards || stopCards.length === 0) {
                console.log('📥 BACKUP: No stop cards available yet, will retry refuel restoration');
                // Retry after stop cards are calculated
                setTimeout(() => {
                  console.log('📥 BACKUP RETRY: Attempting refuel restoration with stop cards:', stopCards?.length);
                  // TODO: Add retry logic here if needed
                }, 1000);
                return prevWaypoints; // Return unchanged for now
              }
              
              setWaypoints(prevWaypoints => {
                return prevWaypoints.map((waypoint, index) => {
                  const shouldRefuel = savedFuelData.refuelStops.includes(waypoint.name);
                  if (shouldRefuel) {
                    // ✅ CRITICAL FIX: Find the stop card index for this waypoint name
                    const stopCardIndex = stopCards.findIndex(card => card.stopName === waypoint.name);
                    if (stopCardIndex >= 0) {
                      const stopCardUIIndex = stopCardIndex + 1; // Stop cards use 1-based indexing
                      console.log('📥 BACKUP: Found', waypoint.name, 'at stop card index:', stopCardUIIndex);
                      refuelIndices.push(stopCardUIIndex);
                    } else {
                      console.warn('📥 BACKUP: Could not find stop card for waypoint:', waypoint.name);
                    }
                    if (!waypoint.refuelMode) {
                      return { ...waypoint, refuelMode: true };
                    }
                  }
                  return waypoint;
                });
              });
              
              // Update currentRefuelStops state for UI checkboxes
              if (refuelIndices.length > 0) {
                console.log('📥 BACKUP LOAD: Setting currentRefuelStops to:', refuelIndices);
                console.log('📥 BACKUP LOAD: Before setCurrentRefuelStops - current state:', currentRefuelStops);
                setCurrentRefuelStops(refuelIndices);
                
                // Verify state update with setTimeout
                setTimeout(() => {
                  console.log('📥 BACKUP LOAD: After setCurrentRefuelStops - new state should be:', refuelIndices);
                }, 100);
              }
            }, 100);
          }
        })
        .catch(error => {
          console.error('❌ Error loading fuel settings:', error);
          // Continue flight loading even if fuel loading fails
        });
    }
    
    // Show success message
    if (window.LoadingIndicator) {
      const destinationName = flightData.landings && flightData.landings.length > 0 
        ? flightData.landings[flightData.landings.length - 1]?.name 
        : 'Unknown';
      window.LoadingIndicator.updateStatusIndicator(
        `✈️ Flight created: ${flightData.departure?.name} → ${destinationName}`, 
        'success', 
        3000
      );
    }
    
    // If auto-run is requested, trigger the MainCard AutoPlan button
    if (flightData.autoRun) {
      
      // 🧙‍♂️ WIZARD FIX: Store wizard flight name for Auto Plan to use
      if (flightData.flightName) {
        window.wizardCustomFlightName = flightData.flightName;
      }
      
      // Wait for React state updates to process before triggering automation
      setTimeout(() => {
        
        // Simple approach: Find and click the AutoPlan button
        const buttons = Array.from(document.querySelectorAll('button'));
        const autoPlanButton = buttons.find(btn => 
          btn.textContent.includes('Auto Plan') || 
          btn.textContent.includes('⚡') || 
          btn.innerHTML.includes('⚡')
        );
        
        if (autoPlanButton) {
          autoPlanButton.click();
        } else {
          console.error('🧙‍♂️ No AutoPlan button found');
        }
      }, 1000);
    }
  }, [setWaypoints, setAircraftRegistration, setSelectedAircraft]);
  
  const handleWizardSkip = useCallback(() => {
    setIsWizardVisible(false);
  }, []);
  
  const handleWizardClose = useCallback(() => {
    setIsWizardVisible(false);
  }, []);
  
  // 🎯 FIX: Handle flight loading from wizard through proper RightPanel workflow
  const handleWizardFlightLoad = useCallback((flight) => {
    
    // Get reference to the right panel's handleLoadFlight function
    // This ensures the wizard gets the same satellite mode switching and map clearing behavior
    if (window.rightPanelHandleLoadFlight) {
      window.rightPanelHandleLoadFlight(flight);
    } else {
      console.warn('🧙‍♂️ Wizard: ⚠️ RightPanel.handleLoadFlight not available, falling back to direct call');
      // Fallback to direct call if RightPanel function not available
      handleFlightLoad(flight);
    }
  }, [handleFlightLoad]);
  
  // 🛩️ HEADER SYNC: Callback to update stopCards when EnhancedStopCardsContainer calculates new values
  // 🚨 INTELLIGENT FUEL SYNC: Compare fuel values instead of entire objects to prevent sync breaks
  const lastProcessedFuelSignatureRef = useRef(null);
  const handleStopCardsCalculated = useCallback((calculatedStopCards, options = {}) => {
    console.log('🔄 HEADER SYNC: handleStopCardsCalculated called with', calculatedStopCards?.length, 'cards');
    console.log('🔄 HEADER SYNC: Current refuel stops:', currentRefuelStops);
    console.log('🔄 HEADER SYNC: Call stack:', new Error().stack.split('\n').slice(1, 4));
    
    // 🎯 INTELLIGENT DUPLICATE PREVENTION: Compare only fuel-critical values, not entire objects
    if (calculatedStopCards && calculatedStopCards.length > 0) {
      // Create a signature based on actual fuel values (not object references)
      const fuelSignature = calculatedStopCards.map(card => ({
        id: card.id || card.stopName || card.name,
        totalFuel: Math.round((card.totalFuel || 0) * 100) / 100, // Round to prevent floating point issues
        tripFuel: Math.round((card.fuelComponentsObject?.tripFuel || 0) * 100) / 100,
        araFuel: Math.round((card.fuelComponentsObject?.araFuel || 0) * 100) / 100,
        approachFuel: Math.round((card.fuelComponentsObject?.approachFuel || 0) * 100) / 100,
        extraFuel: Math.round((card.fuelComponentsObject?.extraFuel || 0) * 100) / 100,
        refuelMode: !!card.refuelMode || !!card.isRefuelStop
      }));
      
      const currentSignature = JSON.stringify(fuelSignature);
      
      // Only block if fuel signature is EXACTLY the same (not just object references)
      if (lastProcessedFuelSignatureRef.current === currentSignature) {
        console.log('🔄 HEADER SYNC: Skipping - fuel values unchanged (smart duplicate prevention)');
        return;
      }
      
      lastProcessedFuelSignatureRef.current = currentSignature;
      
      const departureCard = calculatedStopCards.find(card => card.isDeparture);
      console.log('🔄 HEADER SYNC: Departure card fuel =', departureCard?.totalFuel, '(fuel signature changed)');
    }
    
    if (options.forceVfrRecalc) {
      // Force a complete recalculation by updating forceUpdate state
      setForceUpdate(prev => prev + 1);
      console.log('🔄 HEADER SYNC: Force VFR recalc - updating forceUpdate state');
    } else {
      // 🎯 FUEL-SMART UPDATE: Always update if we got here (fuel signature already verified as different)
      setStopCards(calculatedStopCards);
      console.log('🔄 HEADER SYNC: Updated stopCards state for header (smart fuel sync)');
    }
  }, []);
  
  // ⛽ FUEL BREAKDOWN: Callback to handle refuel toggle from DetailedFuelBreakdown
  const handleRefuelToggle = useCallback((stopIndex, isRefuel) => {
    // The refuel logic is handled internally by EnhancedStopCardsContainer
    // This callback is for coordination and logging
  }, []);
  
  // Real search function for wizard using existing platform data
  const handleWizardSearch = useCallback(async (searchTerm) => {
    
    if (!searchTerm || !searchTerm.trim()) {
      return [];
    }
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Get real platforms data from PlatformManager
    const platformManager = platformManagerRef?.current;
    if (!platformManager) {
      console.warn('🧙‍♂️ Wizard: PlatformManager not available');
      return [];
    }
    
    // Get raw OSDK data with all fields for comprehensive search
    const rawOSDKData = platformManager.getRawOSDKData() || [];
    const osdkWaypoints = platformManager.getOsdkWaypoints() || [];
    
    // Use raw OSDK data which has all the fields (locationDescription, LOCATION NOTES, etc.)
    const allLocations = [...rawOSDKData, ...osdkWaypoints];

    // DEBUG: Let's see what fields we have for a few sample locations
    allLocations.slice(0, 3).forEach((loc, i) => {
      // Debug location fields

    });
    
    // DEBUG: Specifically search for anything with "delta" in any field
    const deltaMatches = allLocations.filter(loc => {
      const allValues = Object.values(loc).join(' ').toLowerCase();
      return allValues.includes('delta');
    });
    
    // Enhanced hierarchical search like the existing fuzzy search
    const searchResults = [];
    
    // 1. EXACT MATCH: locName (primary name field)
    allLocations.forEach(location => {
      const name = (location.locName || location.name || '').toLowerCase();
      if (name && name === normalizedSearch) {
        searchResults.push({
          location,
          matchType: 'exact',
          matchField: 'locName',
          priority: 1
        });
      }
    });
    
    // 2. EXACT MATCH: locationDescription 
    if (searchResults.length === 0) {
      allLocations.forEach(location => {
        const description = (location.locationDescription || '').toLowerCase();
        if (description === normalizedSearch) {
          searchResults.push({
            location,
            matchType: 'exact', 
            matchField: 'locationDescription',
            priority: 2
          });
        }
      });
    }
    
    // 3. EXACT MATCH: LOCATION NOTES
    if (searchResults.length === 0) {
      allLocations.forEach(location => {
        const locationNotes = (location['LOCATION NOTES'] || location.locationNotes || '').toLowerCase();
        if (locationNotes === normalizedSearch) {
          searchResults.push({
            location,
            matchType: 'exact',
            matchField: 'locationNotes', 
            priority: 3
          });
        }
      });
    }
    
    // 4. EXACT MATCH: LOC ALIAS
    if (searchResults.length === 0) {
      allLocations.forEach(location => {
        const locAlias = (location['LOC ALIAS'] || location.locAlias || '').toLowerCase();
        if (locAlias === normalizedSearch) {
          searchResults.push({
            location,
            matchType: 'exact',
            matchField: 'locAlias',
            priority: 4
          });
        }
      });
    }
    
    // 5. STARTS WITH: locName
    if (searchResults.length === 0) {
      allLocations.forEach(location => {
        const name = (location.locName || location.name || '').toLowerCase();
        if (name && name.startsWith(normalizedSearch)) {
          searchResults.push({
            location,
            matchType: 'startsWith',
            matchField: 'locName', 
            priority: 5
          });
        }
      });
    }
    
    // 6. CONTAINS: locName, locationDescription, LOCATION NOTES, LOC ALIAS, or type
    if (searchResults.length === 0) {
      allLocations.forEach(location => {
        const name = (location.locName || location.name || '').toLowerCase();
        const description = (location.locationDescription || '').toLowerCase();
        const locationNotes = (location['LOCATION NOTES'] || location.locationNotes || '').toLowerCase();
        const locAlias = (location['LOC ALIAS'] || location.locAlias || '').toLowerCase();
        const type = (location.type || location.locationType || '').toLowerCase();
        
        if (name.includes(normalizedSearch) || 
            description.includes(normalizedSearch) ||
            locationNotes.includes(normalizedSearch) ||
            locAlias.includes(normalizedSearch) ||
            type.includes(normalizedSearch)) {
          searchResults.push({
            location,
            matchType: 'contains',
            matchField: name.includes(normalizedSearch) ? 'locName' : 
                       description.includes(normalizedSearch) ? 'locationDescription' :
                       locationNotes.includes(normalizedSearch) ? 'locationNotes' :
                       locAlias.includes(normalizedSearch) ? 'locAlias' : 'type',
            priority: 3
          });
        }
      });
    }
    
    // Sort by priority and limit to 5 results
    const results = searchResults
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5)
      .map(result => {
        const primaryName = result.location.locName || result.location.name;
        let displayName = primaryName;
        
        // If match was found in a field other than the primary name, show what was matched
        if (result.matchField !== 'locName' && primaryName) {
          const matchedValue = (() => {
            switch (result.matchField) {
              case 'locationDescription':
                return result.location.locationDescription;
              case 'locationNotes':
                return result.location['LOCATION NOTES'] || result.location.locationNotes;
              case 'locAlias':
                return result.location['LOC ALIAS'] || result.location.locAlias;
              default:
                return null;
            }
          })();
          
          if (matchedValue && matchedValue.toLowerCase() !== primaryName.toLowerCase()) {
            displayName = `${primaryName} (${matchedValue})`;
          }
        }
        
        return {
          name: displayName, // Display name with brackets for user
          originalName: primaryName, // Original locName for system use
          type: result.location.type || result.location.locationType || 'Location',
          id: result.location.id || result.location.locName || result.location.name,
          coordinates: result.location.geoPoint?.coordinates || result.location.coordinates,
          lat: result.location.geoPoint?.coordinates ? result.location.geoPoint.coordinates[1] : 
               result.location.coordinates ? result.location.coordinates[1] : result.location.lat,
          lng: result.location.geoPoint?.coordinates ? result.location.geoPoint.coordinates[0] : 
               result.location.coordinates ? result.location.coordinates[0] : result.location.lng,
          matchType: result.matchType,
          matchField: result.matchField,
          locationDescription: result.location.locationDescription || ''
        };
      });
    
    return results;
  }, [platformManagerRef]);

  return (
    <>
      {/* Flight Planning Wizard for Non-Aviation Users */}
      <FlightWizard
        isVisible={isWizardVisible}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
        onLoadFlight={handleWizardFlightLoad}
        searchLocation={handleWizardSearch}
        onAddWaypoint={hookAddWaypoint}
        onClearRoute={clearRoute}
        aircraftTypes={aircraftTypes}
        aircraftsByType={aircraftsByType}
        selectedAircraft={selectedAircraft}
        onAircraftSelect={setSelectedAircraft}
      />
      
      {/* 📊 CLEAN FUEL BREAKDOWN MODAL - Rendered at App Level for True Popup */}
      <CleanDetailedFuelBreakdown
        visible={showFuelBreakdown}
        onClose={() => setShowFuelBreakdown(false)}
        stopCards={stopCards}
        flightSettings={flightSettings}
        weatherFuel={weatherFuel}
        weatherSegments={weatherSegments}
        fuelPolicy={fuelPolicy}
        routeStats={routeStats}
        selectedAircraft={selectedAircraft}
        waypoints={waypoints}
        weather={weather}
        locationFuelOverrides={locationFuelOverrides}
        waiveAlternates={waiveAlternates}
        alternateStopCard={alternateStopCard}
        alternateRouteData={alternateRouteData}
        currentRefuelStops={currentRefuelStops}
        platformManager={platformManagerRef.current}
        onFuelDataChanged={handleLocationFuelChange}
      />
      
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
          loadedFlightData={loadedFlightData}
          weatherSegments={weatherSegments}
        />
        
        {/* Map container - now full width below header */}
        <div className="map-container">
          {/* Controlled loading bar - graceful finish */}
          <div className={`map-loading-container ${isActuallyLoading ? (isFinishing ? 'finishing' : 'loading') : ''}`}>
            <div className="map-loading-bar"></div>
          </div>
          <MapComponent mapManagerRef={mapManagerRef} onMapReady={handleMapReadyImpl} className="fast-planner-map" />
          <MapZoomHandler mapManagerRef={mapManagerRef} />
          {/* SAR Range Circle for Search and Rescue mode */}
          {(() => {
            const sarEnabled = sarData?.enabled || sarManager.sarEnabled;
            const calculation = sarData?.calculation;
            const finalWaypoint = sarData?.finalWaypoint;
            const operationalRadiusNM = calculation?.operationalRadiusNM;
            
            const shouldShow = sarEnabled && sarData && !calculation?.error && finalWaypoint && operationalRadiusNM;
            
            return shouldShow && (
              <SARRangeCircle
                mapManager={appManagers.mapManagerRef?.current}
                center={finalWaypoint}
                radiusNM={operationalRadiusNM}
                visible={true}
                aircraft={selectedAircraft}
                color="#FF6B35"
                opacity={0.2}
              />
            );
          })()}
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
          onToggleAlternateMode={toggleAlternateMode} alternateModeActive={alternateModeActive}
          onClearAlternate={clearAlternate}
        />
        
        <RightPanel
          visible={rightPanelVisible} onToggleVisibility={toggleRightPanel} onClearRoute={clearRoute}
          onLoadRigData={reloadPlatformData} onToggleChart={togglePlatformsVisibility}
          onLoadCustomChart={loadCustomChart} onWaiveAlternatesChange={handleWaiveAlternatesChange}
          waiveAlternates={waiveAlternates} // 🛩️ VFR OPERATIONS: Pass waive alternates state 
          chartsVisible={platformsVisible} aircraftType={aircraftType}
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
          // DEBUG: Add logging to see what extraFuel value is being passed
          {...(() => {
            return {};
          })()}
          araFuel={weatherFuel.araFuel} // Use calculated weather fuel from state
          approachFuel={weatherFuel.approachFuel} // Use calculated weather fuel from state
          taxiFuel={flightSettings.taxiFuel} contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel} reserveMethod={reserveMethod}
          etd={flightSettings.etd} // Pass current ETD from wizard to auto plan
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
          onStopCardsCalculated={handleStopCardsCalculated} // 🛩️ HEADER SYNC: Callback for stop cards synchronization
          onShowFuelBreakdown={() => setShowFuelBreakdown(true)} // 📊 FUEL BREAKDOWN: Callback to show modal
          onAlternateCardCalculated={setAlternateStopCard} // 🔧 NEW: Callback to receive alternate card data
          alternateStopCard={alternateStopCard} // 🔧 NEW: Pass alternate card data to RightPanel for fuel save
          onRefuelStopsChanged={handleRefuelStopsChanged} // 🔄 REFUEL SYNC: Callback for refuel stops synchronization
          
          // ✅ FIX: Pass locationFuelOverrides from state to RightPanel
          locationFuelOverrides={locationFuelOverrides}
          
          // 🔥 DIRECT CALLBACK: Pass fuel overrides callback to enable direct communication
          onFuelOverridesChanged={handleFuelOverridesChanged}
          
          // Fuel policy props
          fuelPolicy={fuelPolicy}
          currentRegion={activeRegionFromContext}
          
          mapManagerRef={mapManagerRef}
          gulfCoastMapRef={gulfCoastMapRef}
          weatherLayerRef={weatherLayerRef}
          vfrChartsRef={vfrChartsRef}
          observedWeatherStationsRef={observedWeatherStationsRef}  // NEW: Pass observed weather stations ref
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
          alternateRouteInput={alternateRouteInput} // Add alternate route input for save functionality
          loadedFlightData={loadedFlightData} // Pass loaded flight data for responsive display
          loadedFuelObject={loadedFuelObject} // 🎯 Pass stored fuel object to avoid duplicate lookups
          currentFlightId={currentFlightId} // Pass current flight ID for weather segments
          weatherSegments={weatherSegments} // Pass weather segments for rig detection
          weatherSegmentsHook={weatherSegmentsHook} // Pass full weather segments hook for layer controls
          currentRefuelStops={currentRefuelStops} // 🚫 REFUEL SYNC: Pass synced refuel stops to components
          onSegmentExtraFuelChange={handleSegmentExtraFuelChange} // ✅ SEGMENT-AWARE: Pass segment extra fuel handler
          getCurrentSegmentInfo={getCurrentSegmentInfo} // ✅ SEGMENT-AWARE: Pass segment info getter
          onSARUpdate={handleSARUpdate} // Add SAR update handler
          sarData={sarData} // Pass SAR calculation data
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
        // Phone layout support - PHONE ONLY (not iPad)
        isPhoneLayout={isPhoneLayout}
        onToggleRightPanel={handleToggleRightPanel}
        // Smart toggle button props  
        showEditButton={showEditButton}
        currentMapMode={currentMapMode}
        onEditMode={handleToggleMode}
        // Card change handlers for expanded buttons
        onMainCard={handleMainCard}
        onSettingsCard={handleSettingsCard}
        onPerformanceCard={handlePerformanceCard}
        onWeatherCard={handleWeatherCard}
        onFinanceCard={handleFinanceCard}
        onSARCard={handleSARCard}
        onSaveCard={handleSaveCard}
        onLoadCard={handleLoadCard}
        onLayersCard={handleLayersCard}
        // LIVE weather toggle props
        onLiveWeatherToggle={handleLiveWeatherToggle}
        liveWeatherActive={liveWeatherActive}
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
    // Flight settings monitoring logic would go here
  }, [flightSettings.contingencyFuelPercent, flightSettings.passengerWeight, flightSettings.taxiFuel, flightSettings.reserveFuel, flightSettings.deckFuelFlow, flightSettings.deckTimePerStop]);
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });
  
  // LIVE weather toggle state for glass menu
  const [liveWeatherActive, setLiveWeatherActive] = useState(false);
  
  // Debug weather state changes
  useEffect(() => {
  }, [weather]);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [stopCards, setStopCards] = useState([]);
  
  // Debug waypoints state changes
  useEffect(() => {
    if (waypoints.length > 0) {
    }
  }, [waypoints]);
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
    if (!waypointManagerRef.current) {
      console.error('Cannot add waypoint: No waypoint manager ref');
      return;
    }
    if (!platformManagerRef.current && typeof waypointData === 'string') {
        console.warn('Platform manager ref not available for name lookup, proceeding if coordinates are provided.');
    }
    let coords, name, isWaypoint = false;
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appManagers.waypointManagerRef, appManagers.platformManagerRef]); 

  // Add mapReady handler to load aircraft data when map is ready
  const handleMapReadyImpl = useCallback((mapInstance) => {

    // Wrap in try/catch for safety
    try {
      // Once the map is ready, load aircraft
      if (appManagers.aircraftManagerRef && appManagers.aircraftManagerRef.current && client) {
        
        appManagers.aircraftManagerRef.current.loadAircraftFromOSDK(client)
          .then(() => {
            // Force update to refresh the UI with aircraft data
            setForceUpdate(prev => prev + 1);
          })
          .catch(error => {
            console.error(`Error loading aircraft: ${error}`);
          });
      }

      // Initialize map interactions if available
      if (appManagers.mapInteractionHandlerRef && appManagers.mapInteractionHandlerRef.current) {
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

  // Initialize weather system - minimal integration for testing
  useEffect(() => {
    const initWeatherSystem = async () => {
      if (appManagers && appManagers.mapManagerRef?.current) {
        try {
          const weatherTest = await initializeWeatherSystem();
          if (weatherTest) {
          }
        } catch (error) {
          console.error('❌ Weather system initialization failed:', error);
        }
      }
    };

    initWeatherSystem();
  }, [appManagers]);

  // Layer restoration is handled by PlatformManager.restoreWeatherFeatures() 
  // No additional persistence manager needed - clean single responsibility architecture

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
