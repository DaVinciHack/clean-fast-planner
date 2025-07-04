/**
 * CleanDetailedFuelBreakdown.jsx
 * 
 * CLEAN VERSION of the fuel breakdown interface.
 * Uses FuelInputManager to eliminate the 4 competing state systems.
 * 
 * Key improvements:
 * - Single FuelInputManager instead of 4 state systems
 * - Clean FuelInput components instead of complex TinyInput
 * - No massive handleFieldChange function
 * - No competing synchronization logic
 * - Simple, predictable data flow
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FuelInputManager from '../../modules/fuel/FuelInputManager';
import SimpleFuelInput from './SimpleFuelInput';
import StopCardCalculator from '../../modules/calculations/flight/StopCardCalculator';
import { DistanceIcon, TimeIcon, FuelIcon, PassengerIcon } from '../flight/stops/StopIcons';
import { detectLocationSegment, getSegmentLocations } from '../../utilities/SegmentUtils.js';
import { FuelStopOptimizationManager } from '../../modules/optimization/FuelStopOptimizationManager.js';
import './FuelStyles.css'; // Import the existing fuel breakdown styles

// Time formatting function
const formatTime = (timeHours) => {
  if (!timeHours && timeHours !== 0) return '00:00';
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Standardized input styling
const getInputStyle = (isDisabled, borderColor = '#4A9EFF') => ({
  width: 'clamp(50px, 10vw, 65px)',
  padding: '2px 4px',
  backgroundColor: isDisabled ? '#2a2a2a' : '#1f1f1f',
  color: isDisabled ? '#666' : '#fff',
  border: `1px solid ${isDisabled ? '#555' : borderColor}`,
  borderRadius: '3px',
  textAlign: 'center',
  fontSize: 'clamp(11px, 2vw, 12px)',
  height: '20px',
  cursor: isDisabled ? 'not-allowed' : 'text',
  position: 'relative',
  opacity: isDisabled ? 0.5 : 1,
  backgroundImage: 'none'
});

const CleanDetailedFuelBreakdown = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  weatherSegments = [],
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  waypoints = [],
  weather = { windSpeed: 0, windDirection: 0 },
  locationFuelOverrides = {},
  waiveAlternates = false,
  alternateStopCard = null,
  alternateRouteData = null,
  currentRefuelStops = [],
  // Platform manager for real platform data
  platformManager = null,
  // Main callback to update parent
  onFuelDataChanged = () => {}
}) => {
  
  // 🔥 STABLE REFUEL DETECTION: Use ref to maintain refuel stops during fuel input
  const refuelStopsRef = useRef([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [globalSettingsCollapsed, setGlobalSettingsCollapsed] = useState(true);
  
  // ✅ ALTERNATE REQUIREMENTS DETECTION: Check which specific values are affected by alternate minimums
  const getAlternateRequirements = useCallback((stopCard) => {
    // Return the alternateRequirements flag from the specific stop card
    // This tells us if THIS specific stop's fuel/passenger values are constrained by alternates
    return stopCard?.alternateRequirements || false;
  }, []);
  
  // 🔧 ROCK-SOLID REFUEL SYNC: Use direct currentRefuelStops prop instead of scanning stopCards
  useEffect(() => {
    if (!visible) {
      return;
    }
    
    // ✅ ROCK-SOLID: Use direct refuel stops from parent state (no reconstruction needed)
    console.log('🔧 ROCK-SOLID REFUEL: Using direct currentRefuelStops:', currentRefuelStops);
    refuelStopsRef.current = currentRefuelStops || [];
    setIsInitialized(true);
  }, [visible, currentRefuelStops]); // React to both visibility and direct refuel state changes
  
  const refuelStops = refuelStopsRef.current;

  // Create single FuelInputManager instance
  const fuelManager = useMemo(() => {
    const manager = new FuelInputManager(flightSettings, locationFuelOverrides);
    
    // Update flight data immediately if we have stop cards
    if (stopCards.length > 0) {
      manager.updateFlightData(stopCards, refuelStops, weatherSegments, fuelPolicy);
    }
    
    return manager;
  }, [refuelStops, stopCards, weatherSegments, fuelPolicy]);
  
  // 🚀 SIMPLE STATE: Direct fuel overrides (must be declared before useMemo)
  const [fuelOverrides, setFuelOverrides] = useState({});
  
  // 🎯 PASSENGER REQUEST STATE: Track passenger requests per stop
  const [passengerRequests, setPassengerRequests] = useState({});
  
  // 🚨 FUEL STOP OPTIMIZATION POPUP STATE
  const [fuelStopPopup, setFuelStopPopup] = useState(null);
  const [hasTriggeredOptimization, setHasTriggeredOptimization] = useState(false);
  
  // 🎯 OPTIMIZATION MANAGER: Initialize the fuel stop optimization system
  const optimizationManager = useMemo(() => {
    const manager = new FuelStopOptimizationManager();
    manager.setCallbacks({
      onSuggestionsReady: (suggestions) => {
        console.log('🎯 OPTIMIZATION: Suggestions ready:', suggestions);
        setFuelStopPopup({
          type: 'suggestions',
          data: suggestions,
          timestamp: Date.now()
        });
      },
      onError: (error) => {
        console.log('🎯 OPTIMIZATION: Error:', error);
        setFuelStopPopup({
          type: 'error',
          message: error,
          timestamp: Date.now()
        });
      },
      onProcessingUpdate: (isProcessing) => {
        if (isProcessing) {
          setFuelStopPopup({
            type: 'processing',
            timestamp: Date.now()
          });
        }
      }
    });
    return manager;
  }, []);
  
  // 🎯 WIZARD DATA EXTRACTION: Extract passenger data from wizard
  const getWizardPassengerData = useCallback(() => {
    const wizardData = flightSettings?.wizardPassengerData || {};
    console.log('🎯 WIZARD DATA:', wizardData);
    
    
    return wizardData;
  }, [flightSettings?.wizardPassengerData]);
  
  // 🎯 PASSENGER REQUEST HELPERS: Get and set passenger requests per stop
  const getPassengerRequest = useCallback((stopName, requestType) => {
    const key = `${stopName}_${requestType}`;
    
    // First check if we have a local override
    if (passengerRequests[key] !== undefined) {
      return passengerRequests[key];
    }
    
    // Then check wizard data for initial values
    const wizardData = getWizardPassengerData();
    const legKey = stopName === (stopCards[0]?.name || stopCards[0]?.stopName) ? 'departure' : 
                   `leg-${stopCards.findIndex(card => (card.name || card.stopName) === stopName)}`;
    
    // Debug removed to reduce console spam
    
    if (wizardData[legKey]) {
      if (requestType === 'passengerCount') {
        return wizardData[legKey].passengerCount || 0;
      } else if (requestType === 'totalWeight') {
        return wizardData[legKey].totalWeight || 0;
      }
    }
    
    return 0;
  }, [passengerRequests, getWizardPassengerData, stopCards]);
  
  const setPassengerRequest = useCallback((stopName, requestType, value) => {
    const key = `${stopName}_${requestType}`;
    setPassengerRequests(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // 🔥 DIRECT CALCULATION: Calculate stop cards directly in render to avoid state sync issues
  const displayStopCards = useMemo(() => {
    if (!waypoints || waypoints.length === 0 || !selectedAircraft) {
      return stopCards; // Fallback to prop if can't calculate
    }
    
    // 🚨 TIMING FIX: Don't calculate if fuel policy isn't loaded yet
    if (!fuelPolicy || !fuelPolicy?.currentPolicy || !fuelPolicy?.currentPolicy?.fuelTypes || !fuelPolicy?.currentPolicy?.uuid) {
      console.log('🔄 MEMO: Fuel policy not fully loaded yet, using prop stopCards');
      return stopCards; // Use prop until OSDK data is ready
    }
    
    try {
      // 🔄 MERGE OVERRIDES: Combine local state (typing) with parent state (synced)
      const formattedOverrides = {};
      
      // First, add parent overrides (synced values)
      Object.entries(locationFuelOverrides || {}).forEach(([key, override]) => {
        formattedOverrides[key] = override;
      });
      
      // Then, overlay local overrides (for immediate typing feedback)
      Object.entries(fuelOverrides).forEach(([key, val]) => {
        formattedOverrides[key] = { value: val };
      });
      
      const effectiveSettings = {
        ...flightSettings,
        locationFuelOverrides: formattedOverrides,
        fuelPolicy: fuelPolicy?.currentPolicy  // 🚨 AVIATION SAFETY: Pass verified fuel policy
      };
      
      // Just call StopCardCalculator normally - it should handle segments via refuelStops parameter
      
      const calculatedCards = StopCardCalculator.calculateStopCards(
        waypoints,
        routeStats,
        selectedAircraft,
        weather,
        effectiveSettings,
        weatherSegments,
        refuelStops,
        waiveAlternates,
        alternateStopCard
      );
      
      
      // 🛩️ PRESERVE REFUEL FLAGS: Restore refuel information from local refuelStops array (MATCH EnhancedStopCardsContainer)
      const cardsWithRefuel = calculatedCards.map((card, index) => {
        const cardIndex = card.index;
        const isRefuelStop = refuelStops.includes(cardIndex);
        
        if (isRefuelStop) {
          return {
            ...card,
            refuelMode: true,
            isRefuelStop: true
          };
        }
        
        return card;
      });
      
      return cardsWithRefuel;
      
    } catch (error) {
      console.error('🔥 MEMO: Calculation error:', error);
      return stopCards; // Fallback to prop if calculation fails
    }
  }, [waypoints, selectedAircraft, routeStats, weather, flightSettings, weatherSegments, refuelStops, waiveAlternates, alternateStopCard, fuelOverrides, locationFuelOverrides]);
  
  // 🚨 OVERLOADED STOPS: Calculate which stops exceed passenger capacity (after displayStopCards is defined)
  const overloadedStops = useMemo(() => {
    if (!displayStopCards || displayStopCards.length === 0) return [];
    
    return displayStopCards.filter(card => {
      // 🛩️ AVIATION LOGIC: Skip final destinations - passenger capacity doesn't apply to arrival
      if (card.isDestination || card.maxPassengers === null) {
        console.log(`🛩️ SKIPPING final destination ${card.name || card.stopName} from overload check`);
        return false;
      }
      
      const requested = getPassengerRequest(card.name || card.stopName, 'passengerCount');
      const available = card.maxPassengers || 0;
      const isOverloaded = requested > available;
      
      console.log(`🎯 OVERLOAD CHECK: ${card.name || card.stopName} - requested: ${requested}, available: ${available}, overloaded: ${isOverloaded}`);
      
      return isOverloaded;
    });
  }, [displayStopCards, getPassengerRequest, passengerRequests]);
  
  // 🛡️ RACE CONDITION FIX: Only allow updates after component is mounted
  const [isMounted, setIsMounted] = useState(false);
  
  // 🔧 STABLE CALLBACK: Use ref to avoid recreation on every render
  const onFuelDataChangedRef = useRef(onFuelDataChanged);
  useEffect(() => {
    onFuelDataChangedRef.current = onFuelDataChanged;
  });
  
  // Stable callback that won't change reference
  const stableOnFuelDataChanged = useCallback((effectiveSettings) => {
    if (onFuelDataChangedRef.current) {
      onFuelDataChangedRef.current(effectiveSettings);
    }
  }, []);
  
  // 🎯 PASSENGER OPTIMIZATION: Trigger capacity analysis when passenger requests change
  useEffect(() => {
    if (!displayStopCards || displayStopCards.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      const maxPassengersRequested = Math.max(
        ...displayStopCards.map(card => 
          getPassengerRequest(card.name || card.stopName, 'passengerCount')
        )
      );
      
      // Use the memoized overloadedStops from above
      
      // Optimization check (reduced logging)
      
      // 🚨 RUN FUEL STOP OPTIMIZATION (only once per overload session)
      if (overloadedStops.length > 0 && !hasTriggeredOptimization) {
        console.log('🎯 RUNNING FUEL STOP OPTIMIZATION...');
        setHasTriggeredOptimization(true);
        
        // Build flight configuration for optimization
        const flightConfiguration = {
          selectedAircraft,
          waypoints,
          stopCards: displayStopCards,
          flightSettings,
          weatherSegments,
          routeStats,
          alternateRouteData,
          maxPassengersRequested,
          overloadedStops: overloadedStops.map(card => card.name || card.stopName),
          // Get real platform data from platform manager - NO MOCK DATA
          availablePlatforms: platformManager?.getPlatforms ? platformManager.getPlatforms() : [],
          platformManager: platformManager
        };
        
        // Debug platform data before optimization
        console.log('🎯 PLATFORM MANAGER DEBUG:', {
          hasManager: !!platformManager,
          platformCount: platformManager?.getPlatforms ? platformManager.getPlatforms().length : 'getPlatforms not available',
          platforms: platformManager?.platforms ? platformManager.platforms.length : 'platforms property not available',
          firstFewPlatforms: platformManager?.getPlatforms ? platformManager.getPlatforms().slice(0, 3).map(p => ({ name: p.name, hasFuel: p.hasFuel, fuelAvailable: p.fuelAvailable })) : 'none'
        });
        
        // Run optimization with detailed logging
        console.log('🎯 FLIGHT CONFIGURATION:', flightConfiguration);
        optimizationManager.checkAndOptimize(flightConfiguration)
          .then(result => {
            console.log('🎯 OPTIMIZATION RESULT:', result);
          })
          .catch(error => {
            console.error('🎯 OPTIMIZATION ERROR:', error);
            setFuelStopPopup({
              type: 'error',
              message: error.message || 'Unknown optimization error',
              timestamp: Date.now()
            });
          });
      } else if (overloadedStops.length === 0) {
        // Reset when no overload
        setFuelStopPopup(null);
        setHasTriggeredOptimization(false);
      }
      
      if (maxPassengersRequested > 0 && onFuelDataChanged) {
        console.log('🚨 TRIGGERING PASSENGER OPTIMIZATION CALLBACK');
        
        onFuelDataChanged({
          type: 'passengerRequest',
          maxPassengersRequested,
          hasOverload: overloadedStops.length > 0,
          overloadedStops: overloadedStops.map(card => card.name || card.stopName),
          stopRequests: displayStopCards.map(card => ({
            stopName: card.name || card.stopName,
            requestedPassengers: getPassengerRequest(card.name || card.stopName, 'passengerCount'),
            requestedWeight: getPassengerRequest(card.name || card.stopName, 'totalWeight'),
            availablePassengers: card.maxPassengers || 0,
            availableWeight: card.availableWeight || card.maxPassengersWeight || 0
          }))
        });
      }
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timeoutId);
  }, [passengerRequests, displayStopCards, getPassengerRequest, onFuelDataChanged, overloadedStops, selectedAircraft, waypoints, weatherSegments, routeStats, alternateRouteData, platformManager]);
  
  // Mark component as mounted after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Reset initialization when component closes so it can re-read refuel stops next time
  useEffect(() => {
    if (!visible && isInitialized) {
      console.log('🔄 RESET: Component closed, resetting for next open');
      setIsInitialized(false);
      // Don't clear refuelStopsRef here - let it be re-read on next open
    }
  }, [visible, isInitialized]);
  
  // 🚀 DIRECT CALCULATOR: Removed - now handled directly in setState callback to avoid closure issues
  
  // 🚀 SIMPLE FUEL CHANGE: Update local state and recalculate immediately  
  const handleFuelChange = useCallback((stopName, fuelType, value, cardIndex = null) => {
    console.log('🔧 FUEL CHANGE:', { stopName, fuelType, value, cardIndex });
    
    // Update local state with simple key-value overrides (NO SYNC during typing)
    setFuelOverrides(prev => {
      const key = cardIndex ? `${stopName}_${cardIndex}_${fuelType}` : `${stopName}_${fuelType}`;
      console.log('🔧 STORING KEY:', key, '=', value);
      const newOverrides = {
        ...prev,
        [key]: value
      };
      
      console.log('🔧 NEW OVERRIDES:', newOverrides);
      return newOverrides;
    });
  }, []);
  
  // Separate function for when user finishes typing (onBlur)
  const handleFuelBlur = useCallback((stopName, fuelType, value, cardIndex = null) => {
    
    // 🔧 SYNC ALL VALUES: Allow empty strings, zeros, and all values to sync to parent
    if (onFuelDataChanged) {
      const fuelChangeData = {
        stopName: stopName,
        fuelType: fuelType, 
        value: value, // Allow all values including 0 and empty string
        cardIndex: cardIndex, // 🔧 UNIQUE KEYS: Send cardIndex for unique key generation
        // 🚫 DO NOT SEND REFUEL STOPS: Detailed page should not override main UI refuel state
        stopIndex: undefined, // Will be detected in handleLocationFuelChange
        isRig: undefined // Will be detected in handleLocationFuelChange
      };
      
      console.log('🔄 BLUR SYNC:', fuelChangeData);
      onFuelDataChanged(fuelChangeData);
    }
  }, [onFuelDataChanged, refuelStops]);
  
  // ✅ SIMPLE FIX: Get reserve fuel from stop cards (they already have it calculated correctly)
  const getReserveFuelFromStopCards = useCallback(() => {
    // The stop cards already have the correct calculated reserve fuel
    if (stopCards && stopCards.length > 0) {
      const departureCard = stopCards.find(card => card.isDeparture);
      if (departureCard && departureCard.fuelComponentsObject?.reserveFuel) {
        return departureCard.fuelComponentsObject.reserveFuel;
      }
    }
    // Fallback: use raw value from flight settings
    return flightSettings.reserveFuel || 30;
  }, [stopCards, flightSettings]);

  const getFuelValue = useCallback((stopName, fuelType, cardIndex = null) => {
    const key = cardIndex ? `${stopName}_${cardIndex}_${fuelType}` : `${stopName}_${fuelType}`;
    
    // 🔄 DUAL SOURCE: Check local state first (for immediate typing feedback), then parent state (for persistence)
    let value = fuelOverrides[key];
    
    // If not in local state, check parent state (for values set elsewhere or on reload)
    if (value === undefined && locationFuelOverrides[key]) {
      const parentOverride = locationFuelOverrides[key];
      value = parentOverride && typeof parentOverride === 'object' ? parentOverride.value : parentOverride;
    }
    
    // Key reading debug removed to reduce console spam
    
    // For reserve fuel, use calculated value from stop cards instead of raw settings
    if (fuelType === 'reserveFuel') {
      return value !== undefined ? value : getReserveFuelFromStopCards();
    }
    
    // For taxi fuel, check override first, then fall back to flight settings
    if (fuelType === 'taxiFuel') {
      return value !== undefined ? value : (flightSettings.taxiFuel || 30);
    }
    
    // For other fuel types, return the override value or empty string (for input display)
    return value !== undefined ? value : '';
  }, [fuelOverrides, locationFuelOverrides, flightSettings, getReserveFuelFromStopCards]);
  
  const handleApplyChanges = useCallback(() => {
    
    // Convert simple overrides to FuelInputManager format
    Object.entries(fuelOverrides).forEach(([key, value]) => {
      const parts = key.split('_');
      const stopName = parts[0];
      const fuelType = parts.length === 3 ? parts[2] : parts[1]; // Handle both old and new formats
      fuelManager.updateLocationFuel(stopName, fuelType, value);
    });
    
    // 🛩️ SEGMENT-AWARE: Apply changes calls individual fuel changes already via handleFuelChange
    // No need to call onFuelDataChanged here as each fuel change triggers it individually
  }, [fuelOverrides, fuelManager, onFuelDataChanged, refuelStops]);
  
  // 🔥 REMOVED: No longer needed since displayStopCards is calculated via useMemo
  
  // Update fuel manager with new flight data (separate effect to avoid loops)
  useEffect(() => {
    if (stopCards.length > 0 && isMounted) {
      fuelManager.updateFlightData(stopCards, refuelStops, weatherSegments, fuelPolicy);
    }
  }, [stopCards, refuelStops, isMounted, weatherSegments, fuelPolicy]);
  
  // Update fuel manager when external settings change (ONLY if mounted)
  useEffect(() => {
    if (!isMounted) {
      return;
    }
    
    fuelManager.bulkUpdateSettings(flightSettings);
  }, [flightSettings, isMounted]);
  
  // Get weather values for inputs
  const getWeatherValue = (stopName, fuelType) => {
    if (!weatherSegments || weatherSegments.length === 0) {
      console.log('🚨 getWeatherValue: No weather segments available');
      return 0;
    }
    
    const segment = weatherSegments.find(segment => 
      segment.airportIcao === stopName ||
      segment.locationName === stopName ||
      segment.location === stopName ||
      segment.uniqueId === stopName
    );
    
    if (!segment) {
      console.log('🚨 getWeatherValue: No weather segment found for', stopName);
      return 0;
    }
    
    console.log('🚨 getWeatherValue DEBUG:', {
      stopName,
      fuelType,
      segment: {
        isRig: segment.isRig,
        ranking2: segment.ranking2
      },
      fuelPolicy: !!fuelPolicy
    });
    
    // Simple logic: if ranking indicates fuel needed, suggest amount
    if (fuelType === 'araFuel' && segment.isRig && (segment.ranking2 === 8 || segment.ranking2 === 5)) {
      // Use EXACT same path as EnhancedStopCardsContainer
      let araAmount = 0;
      if (fuelPolicy?.currentPolicy?.fuelTypes?.araFuel?.default) {
        araAmount = fuelPolicy.currentPolicy.fuelTypes.araFuel.default;
      }
      return araAmount;
    }
    
    if (fuelType === 'approachFuel' && !segment.isRig && (segment.ranking2 === 10 || segment.ranking2 === 5)) {
      // Use EXACT same path as EnhancedStopCardsContainer
      let approachAmount = 0;
      if (fuelPolicy?.currentPolicy?.fuelTypes?.approachFuel?.default) {
        approachAmount = fuelPolicy.currentPolicy.fuelTypes.approachFuel.default;
      }
      
      console.log('🚨 DETAILS APPROACH FUEL DEBUG:', {
        fuelPolicy: !!fuelPolicy,
        fuelPolicyKeys: Object.keys(fuelPolicy || {}),
        fuelTypesPath: fuelPolicy?.fuelTypes?.approachFuel?.default,
        approachFuelDefault: fuelPolicy?.approachFuelDefault,
        fullFuelPolicy: fuelPolicy,
        finalAmount: approachAmount,
        stopName,
        ranking: segment.ranking2,
        isRig: segment.isRig
      });
      return approachAmount;
    }
    
    return 0;
  };
  
  if (!visible) return null;
  
  return (
    <>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
    `}</style>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div className="fuel-modal-content" style={{
        background: '#1e1e1e',
        borderRadius: '18px',
        width: 'min(95vw, 750px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6)',
        color: '#fff',
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
        paddingRight: '6px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#444 transparent'
      }} onClick={(e) => e.stopPropagation()}>
        <div className="fuel-modal-header">
          <h2>Detailed Fuel & Passenger Management</h2>
          
          {/* 🔍 BACKGROUND OPTIMIZATION INDICATOR */}
          {fuelStopPopup && fuelStopPopup.type === 'background' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: '#4fc3f7',
              cursor: 'pointer'
            }} onClick={() => setFuelStopPopup({ ...fuelStopPopup, type: 'processing' })}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#e74c3c',
                animation: 'pulse 1s infinite'
              }}></div>
              Optimizing fuel stops...
            </div>
          )}
          
          <button className="fuel-close-button" onClick={onClose}>×</button>
        </div>
        
        
        <div className="fuel-modal-body">
          
          {/* Global Fuel Settings */}
          <div style={{ marginBottom: '12px' }}>
            <h3 
              onClick={() => setGlobalSettingsCollapsed(!globalSettingsCollapsed)}
              style={{ 
                cursor: 'pointer', 
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                margin: '0',
                padding: '6px 12px',
                backgroundColor: '#242424',
                borderRadius: '16px',
                height: '32px'
              }}
            >
              <span style={{ 
                transform: globalSettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                fontSize: '0.7rem'
              }}>▼</span>
              Global Fuel Settings
            </h3>
            {!globalSettingsCollapsed && (
            <div className="fuel-grid" style={{ padding: '8px 0', marginTop: '4px' }}>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Extra Fuel (lbs):</label>
                <input
                  type="number"
                  value={flightSettings?.extraFuel || 0}
                  placeholder="0"
                  style={{
                    width: '80px',
                    padding: '6px',
                    backgroundColor: '#2c2c2c',
                    color: '#fff',
                    border: '1px solid #666',
                    borderRadius: '4px'
                  }}
                  readOnly
                />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Taxi Fuel (lbs):</label>
                <input type="number" value={flightSettings?.taxiFuel || 0} placeholder="30" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Deck Time per Stop (min):</label>
                <input type="number" value={flightSettings?.deckTimePerStop || 0} placeholder="5" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Deck Fuel Flow (lbs/hr):</label>
                <input type="number" value={flightSettings?.deckFuelFlow || 0} placeholder="25" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Contingency (%):</label>
                <input type="number" value={flightSettings?.contingencyFuelPercent || 0} placeholder="5" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Reserve Fuel:</label>
                <div>
                  <div style={{
                    fontSize: '0.5rem',
                    color: '#888',
                    marginBottom: '1px',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const currentPolicy = fuelPolicy?.currentPolicy;
                      if (currentPolicy?.fuelTypes?.reserveFuel?.type === 'time' && selectedAircraft?.fuelBurn) {
                        const timeMinutes = currentPolicy.fuelTypes.reserveFuel.default || 0;
                        return `(${timeMinutes} min × ${selectedAircraft.fuelBurn} lbs/hr)`;
                      }
                      return '(lbs)';
                    })()}
                  </div>
                  <input type="number" value={getReserveFuelFromStopCards()} placeholder="20" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
                </div>
              </div>
              
            </div>
            )}
          </div>
          
          {/* Stop Cards with Fuel Inputs */}
          <div className="fuel-section">
            <h3>Stop-Specific Fuel & Passengers</h3>
            
            {displayStopCards.map((card, index) => {
              const stopName = card.name || card.stopName || `stop_${index}`;
              const isRefuelStop = card.refuelMode === true || card.isRefuelStop === true;
              
              // Get fuel summary for this stop from segment manager
              const fuelSummary = fuelManager.getFuelSummaryForStop(index);
              
              // Determine if this stop needs ARA/approach fuel inputs
              const weatherSegment = weatherSegments?.find(segment => 
                segment.airportIcao === stopName ||
                segment.locationName === stopName ||
                segment.location === stopName ||
                segment.uniqueId === stopName
              );
              
              const isRig = weatherSegment?.isRig || false;
              const isDeparture = index === 0;
              const isDestination = index === displayStopCards.length - 1;
              
              // 🚨 CORRECT AVIATION LOGIC: 
              // - ARA fuel: Only for rigs (any position)
              // - Approach fuel: All airports EXCEPT departure
              // - Extra fuel: Departure and refuel stops
              const showAraInput = isRig;
              const showApproachInput = !isRig && !isDeparture; // All airports except departure
              const showExtraFuelInput = isDeparture || isRefuelStop; // Departure + refuel stops
              
              // 🔍 DEBUG: Cross-connection debugging
              const debugInfo = {
                index: index,
                isRig: isRig,
                isDeparture: isDeparture,
                isDestination: isDestination,
                isRefuelStop: isRefuelStop,
                showAraInput: showAraInput,
                showApproachInput: showApproachInput,
                showExtraFuelInput: showExtraFuelInput,
                weatherSegment: weatherSegment,
                cardPosition: `${index + 1} of ${displayStopCards.length}`
              };
              
              
              return (
                <div key={card.id || index} className={`stop-fuel-card ${isRefuelStop ? 'refuel-stop' : ''}`} style={{
                  marginBottom: 'clamp(16px, 3vw, 24px)',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  background: 'linear-gradient(to bottom, rgba(50, 50, 50, 0.95), rgba(20, 20, 20, 0.98))',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  
                  {/* FLIGHT DETAILS - Top of card with location identity */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #404040',
                    background: 'linear-gradient(to bottom, rgba(45, 55, 65, 0.95), rgba(30, 40, 50, 0.95))',
                    position: 'relative',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px'
                  }}>
                    
                    {/* Location Type Indicator */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '4px',
                      height: '100%',
                      background: '#666',
                      opacity: 0.6
                    }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#0066cc',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: '1px solid #333'
                      }}>
                        {index + 1}
                      </div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{stopName}</h4>
                      <span style={{
                        color: '#888',
                        fontSize: '0.5rem',
                        fontWeight: '400',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>{isRig ? 'rig' : 'airport'}</span>
                      {isRefuelStop && <span style={{
                        background: '#f59e0b',
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>REFUEL</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#aaa', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DistanceIcon /> {card.totalDistance || card.distance || '0.0'} nm</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TimeIcon /> {formatTime(card.totalTime || card.timeHours || 0)}</span>
                      <div style={{
                        background: card.fuelCapacityWarning?.exceedsCapacity ? 'rgba(52, 52, 52, 0.8)' : 
                                   getAlternateRequirements(card) ? 'rgba(52, 52, 52, 0.8)' : '#0066cc',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: card.fuelCapacityWarning?.exceedsCapacity ? '2px solid #dc2626' :
                               getAlternateRequirements(card) ? '2px solid #f39c12' : 'none'
                      }}>
                        Required Fuel: <span style={
                          card.fuelCapacityWarning?.exceedsCapacity ? { color: '#dc2626' } :
                          getAlternateRequirements(card) ? { color: '#f39c12' } : {}
                        }>{card.totalFuel || 0}</span> lbs
                        {card.fuelCapacityWarning?.exceedsCapacity && (
                          <span style={{
                            fontSize: '0.7em',
                            marginLeft: '8px',
                            fontWeight: 'bold',
                            opacity: 0.9,
                            color: '#dc2626'
                          }}>
                            REFUEL ({card.fuelCapacityWarning.excessAmount} lbs)
                          </span>
                        )}
                        {getAlternateRequirements(card) && !card.fuelCapacityWarning?.exceedsCapacity && (
                          <span style={{
                            fontSize: '0.7em',
                            marginLeft: '8px',
                            fontWeight: 'bold',
                            opacity: 0.9,
                            color: '#f39c12'
                          }}>
                            ALT FUEL REQUIRED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px 16px' }}>
                    
                    {/* SIDE BY SIDE: Passengers LEFT | Fuel RIGHT */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '16px',
                      marginLeft: '-16px',
                      marginRight: '-16px'
                    }}>
                      
                      {/* LEFT: Passenger Section */}
                      <div style={{
                        background: 'linear-gradient(to bottom, rgba(45, 55, 65, 0.95), rgba(30, 40, 50, 0.95))',
                        borderRadius: '6px',
                        padding: '12px 16px 12px 16px'
                      }}>
                      <h5 style={{
                        margin: '0 0 12px 0',
                        color: '#4A9EFF',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}><PassengerIcon /> PASSENGER OPERATIONS</h5>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        alignItems: 'end'
                      }}>
                        
                        {/* PASSENGERS */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.7rem',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>PASSENGERS</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '33px' }}>
                            <div style={{
                              fontSize: '0.5rem',
                              color: '#888'
                            }}>Avail</div>
                            <div style={{
                              color: getAlternateRequirements(card) ? '#f39c12' : '#fff',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>{card.maxPassengers || 0}</div>
                          </div>
                          <div style={{ textAlign: 'center', marginTop: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              max={card.maxPassengers || 19}
                              value={getPassengerRequest(card.name || card.stopName, 'passengerCount')}
                              onChange={(e) => setPassengerRequest(card.name || card.stopName, 'passengerCount', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              style={{
                                width: '60px',
                                height: '20px',
                                padding: '2px 4px',
                                backgroundColor: '#1f1f1f',
                                color: '#fff',
                                border: getPassengerRequest(card.name || card.stopName, 'passengerCount') > (card.maxPassengers || 0) 
                                  ? '1px solid #e74c3c' 
                                  : '1px solid #4A9EFF',
                                borderRadius: '3px',
                                fontSize: '12px',
                                textAlign: 'center',
                                cursor: 'text'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* WEIGHT */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.7rem',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>WEIGHT (LBS)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '20px' }}>
                            <div style={{
                              fontSize: '0.5rem',
                              color: '#888'
                            }}>Avail</div>
                            <div style={{
                              color: getAlternateRequirements(card) ? '#f39c12' : '#fff',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>{card.availableWeight || card.maxPassengersWeight || 0}</div>
                          </div>
                          <div style={{ textAlign: 'center', marginTop: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              max={card.availableWeight || card.maxPassengersWeight || 5000}
                              value={getPassengerRequest(card.name || card.stopName, 'totalWeight')}
                              onChange={(e) => setPassengerRequest(card.name || card.stopName, 'totalWeight', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              style={{
                                width: '65px',
                                height: '20px',
                                padding: '2px 4px',
                                backgroundColor: '#1f1f1f',
                                color: '#fff',
                                border: getPassengerRequest(card.name || card.stopName, 'totalWeight') > (card.availableWeight || card.maxPassengersWeight || 0)
                                  ? '1px solid #e74c3c'
                                  : '1px solid #4A9EFF',
                                borderRadius: '3px',
                                fontSize: '12px',
                                textAlign: 'center',
                                cursor: 'text'
                              }}
                            />
                          </div>
                        </div>
                        
                      </div>
                      </div>
                      
                      {/* RIGHT: Fuel Section */}
                      <div style={{
                        background: 'linear-gradient(to bottom, rgba(45, 55, 65, 0.95), rgba(30, 40, 50, 0.95))',
                        borderRadius: '6px',
                        padding: '12px 16px 12px 16px'
                      }}>
                      <h5 style={{
                        margin: '0 0 12px 0',
                        color: '#10B981',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}><FuelIcon /> FUEL OPERATIONS</h5>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '15px',
                        alignItems: 'end'
                      }}>
                        
                        {/* DECK TIME / TAXI FUEL */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            color: '#aaa', 
                            fontSize: '0.7rem', 
                            marginBottom: '4px',
                            textTransform: 'uppercase' 
                          }}>{isDeparture ? 'TAXI FUEL' : 'DECK TIME'}</label>
                          <label style={{ 
                            display: 'block', 
                            color: '#666', 
                            fontSize: '0.6rem', 
                            marginBottom: '6px' 
                          }}>{isDeparture ? '(pounds)' : '(minutes)'}</label>
                          <div style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              value={isDeparture ? (getFuelValue(stopName, 'taxiFuel', card.index) || '') : (getFuelValue(stopName, 'deckTime', card.index) || '')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isDeparture) {
                                  handleFuelChange(stopName, 'taxiFuel', value, card.index);
                                } else {
                                  handleFuelChange(stopName, 'deckTime', value, card.index);
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isDeparture) {
                                  handleFuelBlur(stopName, 'taxiFuel', value, card.index);
                                } else {
                                  handleFuelBlur(stopName, 'deckTime', value, card.index);
                                }
                              }}
                              placeholder={isDeparture ? "30" : (isRig ? "15" : "0")}
                              style={getInputStyle(false, '#4A9EFF')}
                            />
                            <div style={{ 
                              color: '#666', 
                              fontSize: '0.6rem', 
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 'clamp(60px, 12vw, 80px)'
                            }}>
                              {isDeparture ? 'Departure' : (stopName.length > 8 ? stopName.substring(0, 8) + '...' : stopName)}
                            </div>
                          </div>
                        </div>
                        
                        {/* EXTRA FUEL */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            color: '#aaa', 
                            fontSize: '0.7rem', 
                            marginBottom: '4px',
                            textTransform: 'uppercase' 
                          }}>EXTRA FUEL</label>
                          <label style={{ 
                            display: 'block', 
                            color: '#666', 
                            fontSize: '0.6rem', 
                            marginBottom: '6px' 
                          }}>(pounds)</label>
                          <div style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              value={getFuelValue(stopName, 'extraFuel', card.index) || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleFuelChange(stopName, 'extraFuel', value, card.index);
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleFuelBlur(stopName, 'extraFuel', value, card.index);
                              }}
                              placeholder="0"
                              disabled={!showExtraFuelInput} // Disable if not departure/refuel
                              style={getInputStyle(
                                !showExtraFuelInput, 
                                !showExtraFuelInput ? '#666' : 
                                (getFuelValue(stopName, 'extraFuel', card.index) && getFuelValue(stopName, 'extraFuel', card.index) !== '') ? '#22c55e' : // Green for user-entered
                                '#4A9EFF' // Default blue
                              )}
                            />
                            <div style={{ 
                              color: !showExtraFuelInput ? '#444' : '#666', 
                              fontSize: '0.6rem', 
                              marginTop: '2px' 
                            }}>
                              {showExtraFuelInput ? (isDeparture ? 'Departure' : 'Refuel') : 'Carried'}
                            </div>
                          </div>
                        </div>
                        
                        {/* ARA/APPROACH */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            color: '#aaa', 
                            fontSize: '0.7rem', 
                            marginBottom: '4px',
                            textTransform: 'uppercase' 
                          }}>{isRig ? 'ARA' : 'APPROACH'}</label>
                          <label style={{ 
                            display: 'block', 
                            color: '#666', 
                            fontSize: '0.6rem', 
                            marginBottom: '6px' 
                          }}>(pounds)</label>
                          <div style={{ textAlign: 'center' }}>
                            {(() => {
                              const fuelType = isRig ? 'araFuel' : 'approachFuel';
                              const userValue = getFuelValue(stopName, fuelType, card.index);
                              const weatherValue = getWeatherValue(stopName, fuelType);
                              const displayValue = userValue !== '' ? userValue : weatherValue;
                              const isWeatherSuggested = userValue === '' && weatherValue > 0;
                              const isUserEntered = userValue !== '';
                              
                              return (
                                <input
                                  type="number"
                                  value={isDeparture ? '' : (displayValue || '')} // Empty string for disabled inputs (no 0)
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                    if (isRig) {
                                      handleFuelChange(stopName, 'araFuel', value, card.index);
                                    } else {
                                      handleFuelChange(stopName, 'approachFuel', value, card.index);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0);
                                    if (isRig) {
                                      handleFuelBlur(stopName, 'araFuel', value, card.index);
                                    } else {
                                      handleFuelBlur(stopName, 'approachFuel', value, card.index);
                                    }
                                  }}
                                  placeholder={isDeparture ? '' : '0'} // No placeholder for disabled
                                  disabled={isDeparture} // Disable approach fuel for ALL departures
                                  style={getInputStyle(
                                    isDeparture, 
                                    isDeparture ? '#666' : 
                                    isUserEntered ? '#22c55e' : // Green for user-entered
                                    isWeatherSuggested ? '#8b5cf6' : // Softer purple for weather-suggested  
                                    '#4A9EFF' // Default blue
                                  )}
                                />
                              );
                            })()}
                            {(() => {
                              const fuelType = isRig ? 'araFuel' : 'approachFuel';
                              const userValue = getFuelValue(stopName, fuelType, card.index);
                              const weatherValue = getWeatherValue(stopName, fuelType);
                              const isWeatherSuggested = userValue === '' && weatherValue > 0;
                              const isUserEntered = userValue !== '';
                              
                              return (
                                <div style={{ 
                                  color: isDeparture ? '#444' : 
                                         isUserEntered ? '#22c55e' : 
                                         isWeatherSuggested ? '#8b5cf6' : '#666',
                                  fontSize: '0.6rem', 
                                  marginTop: '2px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 'clamp(60px, 12vw, 80px)'
                                }}>
                                  {isDeparture ? 'N/A (Departure)' : 
                                   isUserEntered ? 'Custom' :
                                   isWeatherSuggested ? 'Weather' : 
                                   'Manual'}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        
                      </div>
                      </div>
                      
                    </div>
                    
                    {/* Fuel Breakdown Summary - Single line like original */}
                    <div style={{
                      background: '#1a1a1a',
                      borderRadius: '0px',
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                      padding: '12px 16px',
                      marginTop: '16px',
                      marginLeft: '-16px',
                      marginRight: '-16px',
                      marginBottom: '-12px',
                      border: 'none',
                      borderTop: '1px solid #333'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        color: '#4A9EFF',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>FUEL BREAKDOWN SUMMARY</div>
                      
                      
                      <div style={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        fontFamily: 'monospace'
                      }}>
{(() => {
                          // Create clean summary - only show components > 0
                          const parts = [];
                          
                          // Taxi fuel: Only show on departure card (consumed immediately on takeoff)
                          const taxi = isDeparture ? (getFuelValue(stopName, 'taxiFuel', card.index) || card.fuelComponentsObject?.taxiFuel || 0) : 0;
                          const trip = card.fuelComponentsObject?.tripFuel || card.tripFuel || 0;
                          const cont = card.fuelComponentsObject?.contingencyFuel || 0;
                          const deck = card.fuelComponentsObject?.deckFuel || 0;
                          // ARA fuel: Use CALCULATED remaining amount, not user override for this rig
                          // The user override is what this rig CONSUMES, not what it carries forward
                          const ara = card.fuelComponentsObject?.araFuel || 0;
                          // Approach fuel: Use CALCULATED remaining amount, not user override for this airport
                          // The user override is what this airport CONSUMES, not what it carries forward
                          const app = card.fuelComponentsObject?.approachFuel || 0;
                          const extra = card.fuelComponentsObject?.extraFuel || 0;
                          const res = getFuelValue(stopName, 'reserveFuel', card.index) || card.fuelComponentsObject?.reserveFuel || 0;
                          
                          if (taxi > 0) parts.push(`Taxi:${taxi}`);
                          if (trip > 0) parts.push(`Trip:${trip}`);
                          if (cont > 0) parts.push(`Cont:${cont}`);
                          if (ara > 0) parts.push(`ARA:${ara}`);
                          if (deck > 0) parts.push(`Deck:${deck}`);
                          if (app > 0) parts.push(`App:${app}`);
                          if (extra > 0) parts.push(`Extra:${extra}`);
                          if (res > 0) parts.push(`Res:${res}`);
                          
                          const summary = parts.join(' ') + ' = ';
                          const isFinalDestination = card.isDestination || card.maxPassengersDisplay === 'Final Stop';
                          return isFinalDestination ? `${parts.join(' ')} = Potential Landing fuel ` : summary;
                        })()}{(() => {
                          const isFinalDestination = card.isDestination || card.maxPassengersDisplay === 'Final Stop';
                          return isFinalDestination ? <span style={{ color: '#4A9EFF', fontWeight: 'bold' }}>({card.totalFuel || 0})</span> : <span style={{ color: '#4A9EFF', fontWeight: 'bold' }}>{card.totalFuel || 0} lbs</span>;
                        })()}
                      </div>
                    </div>
                    
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
        
        {/* COMPREHENSIVE FUEL SUMMARY */}
        <div className="fuel-section">
          <h3 style={{
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            <FuelIcon /> Flight Fuel Summary
          </h3>
          <div className="fuel-summary-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            
            {/* Total Fuel Overview */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ 
                color: '#10B981', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <FuelIcon /> Departure Total
              </h4>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#fff' }}>
                {displayStopCards[0]?.totalFuel || 0} lbs
              </div>
              <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '4px' }}>
                Trip: {displayStopCards[0]?.fuelComponentsObject?.tripFuel || 0} lbs
              </div>
              <div style={{ fontSize: '0.8em', color: '#10B981', marginTop: '4px', fontWeight: '600' }}>
                Flight Total: {(() => {
                  // Calculate total fuel for entire flight (sum all trip fuel from each segment)
                  const totalTripFuel = displayStopCards.reduce((sum, card) => {
                    return sum + (card.fuelComponentsObject?.tripFuel || 0);
                  }, 0);
                  return totalTripFuel;
                })()} lbs
              </div>
            </div>
            
            {/* User Overrides Summary */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ 
                color: '#3B82F6', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <FuelIcon /> Your Overrides
              </h4>
              {Object.keys(fuelOverrides).length === 0 ? (
                <div style={{ color: '#666' }}>None yet</div>
              ) : (
                <div>
                  {Object.entries(fuelOverrides).map(([key, value]) => {
                    const parts = key.split('_');
                    const location = parts[0];
                    const fuelType = parts.length === 3 ? parts[2] : parts[1]; // Handle both old and new formats
                    const typeLabel = fuelType === 'araFuel' ? 'ARA' : 'Approach';
                    return (
                      <div key={key} style={{ fontSize: '0.9em', marginBottom: '2px' }}>
                        <span style={{ color: '#FFA726' }}>{typeLabel}:</span> {value} lbs @ {location}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Weather Suggestions */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ 
                color: '#2196F3', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <FuelIcon /> Weather Suggestions
              </h4>
              {displayStopCards.length === 0 ? (
                <div style={{ color: '#666' }}>No stops loaded</div>
              ) : (
                <div>
                  {displayStopCards.map((card, index) => {
                    const stopName = card.name || card.stopName;
                    const araWeather = getWeatherValue(stopName, 'araFuel');
                    const approachWeather = getWeatherValue(stopName, 'approachFuel');
                    
                    if (araWeather > 0 || approachWeather > 0) {
                      return (
                        <div key={index} style={{ fontSize: '0.8em', marginBottom: '2px' }}>
                          {stopName}: {araWeather > 0 ? `ARA: ${araWeather}` : ''} {approachWeather > 0 ? `Approach: ${approachWeather}` : ''}
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </div>
              )}
            </div>
            
            
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleApplyChanges}
            style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
          >
            ✅ Apply Changes
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
            }}
          >
            🔧 Debug Info
          </button>
        </div>
        
      </div>
    </div>
    
    {/* 🎯 FUEL STOP OPTIMIZATION POPUP - Independent overlay */}
    {fuelStopPopup && fuelStopPopup.type !== 'background' && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000 // Higher than main modal
      }} onClick={(e) => {
        // Click background to minimize to background mode during processing
        if (fuelStopPopup.type === 'processing') {
          setFuelStopPopup({ type: 'background', data: fuelStopPopup.data });
        } else {
          setFuelStopPopup(null);
        }
      }}>
        <div style={{
          background: 'linear-gradient(to bottom, #404040, #1a1a1a)',
          border: '2px solid #ff3333',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '400px',
          width: '90%',
          color: '#fff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
          
          {fuelStopPopup.type === 'processing' && (
            <>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                Passenger Capacity Exceeded
              </div>
              
              {/* Show overload details */}
              <div style={{ marginBottom: '16px' }}>
                {(() => {
                  // 🔧 DEDUPLICATE: Group by location name and show most restrictive capacity
                  const locationGroups = {};
                  overloadedStops.forEach(card => {
                    const locationName = card.name || card.stopName;
                    const requestedPassengers = getPassengerRequest(locationName, 'passengerCount');
                    const requestedWeight = getPassengerRequest(locationName, 'totalWeight');
                    const availablePassengers = card.maxPassengers || 0;
                    const availableWeight = card.availableWeight || card.maxPassengersWeight || 0;
                    
                    if (!locationGroups[locationName] || availablePassengers < locationGroups[locationName].availablePassengers) {
                      locationGroups[locationName] = {
                        locationName,
                        requestedPassengers,
                        requestedWeight,
                        availablePassengers,
                        availableWeight
                      };
                    }
                  });
                  
                  return Object.values(locationGroups).map((location, index) => (
                    <div key={index} style={{
                      fontSize: '0.8rem',
                      color: '#fff',
                      marginBottom: '8px',
                      padding: '10px',
                      background: 'rgba(231, 76, 60, 0.25)',
                      borderRadius: '8px',
                      border: '1px solid #ff3333'
                    }}>
                      <strong>{location.locationName}</strong><br/>
                      Passengers: {location.requestedPassengers} requested vs {location.availablePassengers} available<br/>
                      Weight: {location.requestedWeight} lbs requested vs {location.availableWeight} lbs available
                    </div>
                  ));
                })()}
              </div>
              
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#4fc3f7', 
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                Looking for route optimization and refuel stops...
              </div>
              
              {/* Animated loader */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#e74c3c',
                  animation: 'pulse 1.5s infinite'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#e74c3c',
                  animation: 'pulse 1.5s infinite 0.3s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#e74c3c',
                  animation: 'pulse 1.5s infinite 0.6s'
                }}></div>
              </div>
              
              <div style={{
                fontSize: '0.8rem',
                color: '#999',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                Click away to continue working. Results will appear when ready.
              </div>
              
              <button 
                onClick={() => setFuelStopPopup({ type: 'background', data: fuelStopPopup.data })}
                style={{
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Minimize to Background
              </button>
            </>
          )}
          
          {fuelStopPopup.type === 'error' && (
            <>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', color: '#e74c3c' }}>
                Optimization Failed
              </div>
              <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '16px' }}>
                {fuelStopPopup.message}
              </div>
              <button 
                onClick={() => setFuelStopPopup(null)}
                style={{
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Close
              </button>
            </>
          )}
          
          {fuelStopPopup.type === 'suggestions' && (
            <>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                Fuel Stop Recommendations
              </div>
              <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '16px', textAlign: 'center' }}>
                Found {fuelStopPopup.data.suggestions?.length || 0} options to increase passenger capacity
              </div>
              
              {fuelStopPopup.data.suggestions?.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  {fuelStopPopup.data.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} style={{
                      background: '#333',
                      padding: '12px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #555'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#4fc3f7', marginBottom: '4px' }}>
                        {suggestion.platform?.name || `Option ${index + 1}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                        Distance: +{suggestion.analysis?.routeDeviation?.toFixed(1) || '0.0'}nm
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                        Passenger Gain: +{suggestion.analysis?.passengerGain || 0} passengers
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                        Score: {suggestion.score?.toFixed(1) || '0.0'}/100
                      </div>
                      <button style={{
                        background: '#4fc3f7',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        marginTop: '8px'
                      }}>
                        Add Fuel Stop
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '16px', textAlign: 'center' }}>
                  No suitable fuel stops found within 10nm of your route.
                </div>
              )}
              
              <button 
                onClick={() => setFuelStopPopup(null)}
                style={{
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Close
              </button>
            </>
          )}
          
        </div>
      </div>
    )}
    </>
  );
};

export default CleanDetailedFuelBreakdown;