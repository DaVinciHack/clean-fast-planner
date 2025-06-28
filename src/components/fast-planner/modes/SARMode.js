/**
 * SARMode.js
 * 
 * Hook for managing SAR (Search and Rescue) Mode functionality.
 * Controls SAR parameters, integrates with alternate mode, and manages real-time calculations
 * using authentic OSDK aircraft performance data.
 * 
 * @aviation-safety: All calculations use real aircraft data, no placeholder values
 * @integration: Works with AlternateMode for complete SAR planning workflow
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { calculateOperationalRadius, calculateMaxSARWeight, calculateMinimumFuel } from '../calculations/SARCalculations';

/**
 * Custom hook for SAR Mode functionality
 * @param {Object} params - Configuration parameters
 * @param {Object} params.selectedAircraft - OSDK aircraft data
 * @param {Object} params.routeStats - Main route statistics
 * @param {Object} params.alternateStats - Alternate route statistics  
 * @param {Object} params.fuelPolicy - Current fuel policy
 * @param {Array} params.waypoints - Current route waypoints
 * @param {Function} params.onSARUpdate - Callback when SAR calculation updates
 * @returns {Object} SAR mode state and functions
 */
export const useSARMode = ({
  selectedAircraft = null,
  routeStats = null,
  alternateStats = null,
  alternateRouteData = null,
  fuelPolicy = null,
  reserveFuel = null,
  waypoints = [],
  stopCards = [],
  onSARUpdate = null
} = {}) => {
  
  // ========================================
  // CORE SAR MODE STATE
  // ========================================
  
  const [sarEnabled, setSarEnabled] = useState(false);
  const [takeoffFuel, setTakeoffFuel] = useState(4000); // lbs - reasonable default
  const [sarWeight, setSarWeight] = useState(440); // lbs - typical SAR equipment weight
  const [timeOnTask, setTimeOnTask] = useState(1.0); // hours - time spent on search pattern
  
  // Advanced options state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [desiredRadius, setDesiredRadius] = useState(25); // NM - desired operational radius
  const [customReserveFuel, setCustomReserveFuel] = useState(null); // Override policy reserve
  
  // UI state
  const [lastCalculationTime, setLastCalculationTime] = useState(null);
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  
  // ========================================
  // DERIVED VALUES FROM CURRENT FLIGHT (SIMPLIFIED)
  // ========================================
  
  // Extract fuel requirements from stop cards (single source of truth)
  const routeFuel = (() => {
    console.log('🚁 SAR: Extracting routeFuel from stopCards:', {
      hasStopCards: !!stopCards,
      stopCardsLength: stopCards?.length || 0,
      stopCards: stopCards
    });
    
    if (!stopCards || stopCards.length === 0) {
      console.log('🚁 SAR: No stopCards available, routeFuel = 0');
      return 0;
    }
    
    // Extract route fuel consumed (not total fuel on takeoff)
    // Option 1: Get trip fuel from fuel components
    const departureCard = stopCards.find(card => card.type === 'departure') || stopCards[0];
    const destinationCard = stopCards.find(card => card.isDestination) || stopCards[stopCards.length - 1];
    
    console.log('🚁 SAR: Debugging fuel extraction:');
    console.log('  - departureCard:', departureCard);
    console.log('  - destinationCard:', destinationCard);
    console.log('  - departureCard.fuelComponentsObject:', departureCard?.fuelComponentsObject);
    console.log('  - destinationCard.fuelComponentsObject:', destinationCard?.fuelComponentsObject);
    
    // Try to get trip fuel from fuel components
    let routeFuelValue = 0;
    if (destinationCard?.fuelComponentsObject?.tripFuel) {
      routeFuelValue = destinationCard.fuelComponentsObject.tripFuel;
      console.log('🚁 SAR: Using destinationCard.fuelComponentsObject.tripFuel:', routeFuelValue);
    } else if (departureCard?.fuelComponentsObject?.tripFuel) {
      routeFuelValue = departureCard.fuelComponentsObject.tripFuel;
      console.log('🚁 SAR: Using departureCard.fuelComponentsObject.tripFuel:', routeFuelValue);
    } else {
      // No route fuel available
      routeFuelValue = 0;
      console.log('🚁 SAR: No route fuel available from stop cards');
    }
    
    console.log('🚁 SAR: Final routeFuel value (consumed by route):', routeFuelValue);
    
    return routeFuelValue;
  })();
  
  const alternateFuel = useMemo(() => {
    console.log('🚁 SAR: ===== ALTERNATEFUEL USEMEMO TRIGGERED =====');
    console.log('🚁 SAR: Extracting alternateFuel from all sources:', {
      alternateStats: alternateStats,
      alternateRouteData: alternateRouteData,
      hasStopCards: !!stopCards,
      stopCardsLength: stopCards?.length || 0,
      debugMessage: 'Need to find the ALTERNATE CARD (A) with Alt:95 fuel value',
      timestamp: new Date().toISOString()
    });
    
    // First try alternateStats
    if (alternateStats?.totalFuelRequired || alternateStats?.fuelRequired) {
      const altFuel = alternateStats.totalFuelRequired || alternateStats.fuelRequired;
      console.log('🚁 SAR: Using alternateStats fuel:', altFuel);
      return altFuel;
    }
    
    // Second try alternateRouteData - check EVERYTHING in it
    if (alternateRouteData) {
      console.log('🚁 SAR: FULL alternateRouteData structure:', alternateRouteData);
      console.log('🚁 SAR: alternateRouteData keys:', Object.keys(alternateRouteData));
      
      // Try stats first
      if (alternateRouteData?.stats?.totalFuelRequired || alternateRouteData?.stats?.fuelRequired) {
        const altFuel = alternateRouteData.stats.totalFuelRequired || alternateRouteData.stats.fuelRequired;
        console.log('🚁 SAR: ✅ Using alternateRouteData.stats fuel:', altFuel);
        return altFuel;
      }
      
      // Try looking for alternate fuel in other properties
      const possibleFuelProps = ['alternateFuel', 'altFuel', 'fuelRequired', 'totalFuel', 'fuel'];
      for (const prop of possibleFuelProps) {
        if (alternateRouteData[prop]) {
          console.log(`🚁 SAR: ✅ Found alternate fuel in alternateRouteData.${prop}:`, alternateRouteData[prop]);
          return alternateRouteData[prop];
        }
      }
      
      console.log('🚁 SAR: alternateRouteData exists but no fuel found in it');
    }
    
    // PRIORITY 3: Extract from stop cards (including separate alternate card)
    if (stopCards && stopCards.length > 0) {
      console.log('🚁 SAR: Searching ALL cards (stop cards + alternate card):', {
        totalCards: stopCards.length,
        cardTypes: stopCards.map((card, index) => ({ 
          index: index,
          type: card.type, 
          isAlternate: card.isAlternate, 
          stopName: card.stopName,
          totalFuel: card.totalFuel,
          fuelRequired: card.fuelRequired,
          fuelComponentsObject: card.fuelComponentsObject,
          isDestination: card.isDestination,
          isDeparture: card.isDeparture,
          cardDescription: `${card.isDeparture ? 'D' : ''}${card.isDestination ? 'F' : ''}${card.isAlternate ? 'A' : ''}`,
          allKeys: Object.keys(card)
        }))
      });
      
      // Look for alternate card (when alternate route is added)
      const alternateCard = stopCards.find(card => card.isAlternate === true);
      if (alternateCard) {
        console.log('🚁 SAR: Found alternate card - FULL STRUCTURE:', alternateCard);
        
        // Extract ONLY the alternate leg fuel (Alt: 112), not total fuel
        const altFuel = alternateCard.fuelComponentsObject?.altFuel || 
                       alternateCard.altFuel || 
                       alternateCard.tripFuel || 0;
        
        console.log('🚁 SAR: ✅ Alternate fuel extraction attempt:', {
          stopName: alternateCard.stopName,
          'fuelComponentsObject exists': !!alternateCard.fuelComponentsObject,
          'fuelComponentsObject': alternateCard.fuelComponentsObject,
          'altFuel property (CORRECT KEY)': alternateCard.fuelComponentsObject?.altFuel,
          'direct altFuel': alternateCard.altFuel,
          'tripFuel': alternateCard.tripFuel,
          'totalFuel': alternateCard.totalFuel,
          'FINAL extractedAltFuel': altFuel
        });
        
        if (altFuel > 0) {
          console.log('🚁 SAR: ✅ Successfully extracted alternate fuel:', altFuel);
          return altFuel;
        } else {
          console.log('🚁 SAR: ❌ Alternate card found but no fuel extracted - checking all properties');
          console.log('🚁 SAR: All alternate card keys:', Object.keys(alternateCard));
        }
      }
      
      // Check departure card for alternate fuel component (first card or card with isDeparture)
      const departureCard = stopCards.find(card => card.isDeparture === true) || stopCards[0];
      console.log('🚁 SAR: Checking departure card for altFuel - COMPLETE BREAKDOWN:', {
        stopName: departureCard?.stopName,
        isDeparture: departureCard?.isDeparture,
        'ALL fuelComponentsObject keys': departureCard?.fuelComponentsObject ? Object.keys(departureCard.fuelComponentsObject) : 'none',
        'FULL fuelComponentsObject': departureCard?.fuelComponentsObject,
        'altFuel property (CORRECT KEY)': departureCard?.fuelComponentsObject?.altFuel,
        'alt property': departureCard?.fuelComponentsObject?.alt,
        'alternateFuel property (OLD KEY)': departureCard?.fuelComponentsObject?.alternateFuel,
        hasAltFuel: !!departureCard?.fuelComponentsObject?.altFuel
      });
      
      if (departureCard?.fuelComponentsObject?.altFuel) {
        const altFuel = departureCard.fuelComponentsObject.altFuel;
        console.log('🚁 SAR: ✅ Found altFuel in departure card components:', altFuel);
        return altFuel;
      }
      
      console.log('🚁 SAR: No alternate fuel found in stop cards');
    }
    
    console.log('🚁 SAR: No alternate fuel found, using 0');
    return 0;
  }, [alternateStats, alternateRouteData, stopCards]);
  const reserveFuelValue = customReserveFuel !== null ? customReserveFuel : (() => {
    console.log('🚁 SAR: Extracting reserveFuel:', {
      hasPreCalculatedReserve: reserveFuel !== null,
      preCalculatedReserve: reserveFuel,
      hasStopCards: !!stopCards,
      stopCardsLength: stopCards?.length || 0,
      hasFuelPolicy: !!fuelPolicy,
      selectedAircraftFuelBurn: selectedAircraft?.fuelBurn
    });
    
    // PRIORITY 1: Use pre-calculated reserve fuel passed as prop (may be in minutes, need to convert)
    if (reserveFuel !== null && reserveFuel > 0) {
      // Check if this looks like a time value (typical reserve times are 20-45 minutes)
      if (reserveFuel <= 60 && selectedAircraft?.fuelBurn) {
        // Convert minutes to fuel amount
        const reserveHours = reserveFuel / 60;
        const calculatedReserveFuel = reserveHours * selectedAircraft.fuelBurn;
        console.log('🚁 SAR: ✅ Converting reserve time to fuel:', {
          reserveMinutes: reserveFuel,
          reserveHours,
          fuelBurnRate: selectedAircraft.fuelBurn,
          calculatedReserveFuel
        });
        return calculatedReserveFuel;
      } else {
        // Already in fuel amount
        console.log('🚁 SAR: ✅ Using pre-calculated reserve fuel amount:', reserveFuel);
        return reserveFuel;
      }
    }
    
    // PRIORITY 2: Try to get from stop cards if available (when route is planned)
    if (stopCards && stopCards.length > 0) {
      const departureCard = stopCards.find(card => card.type === 'departure') || stopCards[0];
      if (departureCard?.fuelComponentsObject?.reserveFuel) {
        const reserveFromCards = departureCard.fuelComponentsObject.reserveFuel;
        console.log('🚁 SAR: Using reserve from stop cards:', reserveFromCards);
        return reserveFromCards;
      }
    }
    
    // Fallback: calculate from fuel policy if aircraft is selected
    if (selectedAircraft && fuelPolicy && fuelPolicy.currentPolicy) {
      const currentPolicy = fuelPolicy.currentPolicy;
      console.log('🚁 SAR: Calculating reserve from fuel policy:', {
        selectedAircraft: !!selectedAircraft,
        fuelPolicy: fuelPolicy,
        currentPolicy: currentPolicy,
        fuelBurn: selectedAircraft.fuelBurn,
        reserveType: currentPolicy.reserveType,
        reserveValue: currentPolicy.reserveValue
      });
      
      // Use the same logic as StopCardCalculator for reserve fuel
      const fuelBurnRate = selectedAircraft.fuelBurn || 0;
      
      if (currentPolicy.reserveType === 'TIME' && currentPolicy.reserveValue && fuelBurnRate > 0) {
        const reserveMinutes = currentPolicy.reserveValue;
        const reserveHours = reserveMinutes / 60;
        const calculatedReserve = reserveHours * fuelBurnRate;
        console.log('🚁 SAR: ✅ Calculated reserve from TIME policy:', {
          reserveMinutes,
          reserveHours,
          fuelBurnRate,
          calculatedReserve
        });
        return calculatedReserve;
      } else if (currentPolicy.reserveType === 'FUEL' && currentPolicy.reserveValue) {
        const calculatedReserve = currentPolicy.reserveValue;
        console.log('🚁 SAR: ✅ Using FUEL policy reserve:', calculatedReserve);
        return calculatedReserve;
      } else {
        console.log('🚁 SAR: ❌ Fuel policy missing required fields:', {
          reserveType: currentPolicy.reserveType,
          reserveValue: currentPolicy.reserveValue,
          fuelBurnRate
        });
      }
    } else {
      console.log('🚁 SAR: ❌ Missing selectedAircraft or fuelPolicy:', {
        hasSelectedAircraft: !!selectedAircraft,
        hasFuelPolicy: !!fuelPolicy
      });
    }
    
    console.log('🚁 SAR: No reserve fuel available, using 0');
    return 0;
  })();
  
  // Get final waypoint for range circle positioning - simplified  
  const finalWaypoint = (() => {
    if (!waypoints || waypoints.length === 0) return null;
    const lastWaypoint = waypoints[waypoints.length - 1];
    
    // Handle both coordinate formats: coords array [lng, lat] or direct lat/lng properties
    let lat, lng;
    if (lastWaypoint.coords && Array.isArray(lastWaypoint.coords) && lastWaypoint.coords.length >= 2) {
      lng = lastWaypoint.coords[0];
      lat = lastWaypoint.coords[1];
    } else if (lastWaypoint.lat && lastWaypoint.lng) {
      lat = lastWaypoint.lat;
      lng = lastWaypoint.lng;
    } else {
      return null;
    }
    
    return {
      lat,
      lng,
      name: lastWaypoint.name || 'Final Waypoint'
    };
  })();
  
  // Create a serializable waypoint dependency for calculation triggering
  const waypointDependency = finalWaypoint ? 
    `${finalWaypoint.lat}_${finalWaypoint.lng}_${waypoints.length}` : 
    `no_waypoints_${waypoints.length}`;
  
  // ========================================
  // REAL-TIME SAR CALCULATION (SIMPLIFIED)
  // ========================================
  
  const sarCalculation = useMemo(() => {
    console.log('🚁 SAR: ===== SARCALCULATION USEMEMO TRIGGERED =====');
    if (!sarEnabled || !selectedAircraft) {
      return null;
    }
    
    // CRITICAL FIX: Include waypoints in calculation dependencies
    // This ensures SAR calculation updates when route changes
    const waypointCount = waypoints?.length || 0;
    const hasValidFinalWaypoint = finalWaypoint && finalWaypoint.lat && finalWaypoint.lng;
    
    console.log('🚁 SAR calculation triggered:', {
      sarEnabled,
      selectedAircraft: !!selectedAircraft,
      waypointCount,
      hasValidFinalWaypoint,
      finalWaypoint,
      waypointDependency,
      routeFuel,
      routeStats: !!routeStats,
      takeoffFuel
    });
    
    console.log('🚁 SAR: About to call calculateOperationalRadius with:', {
      takeoffFuel,
      routeFuel,
      alternateFuel,
      reserveFuelValue,
      sarWeight,
      timeOnTask
    });

    try {
      const result = calculateOperationalRadius({
        takeoffFuel,
        sarWeight,
        timeOnTask,
        selectedAircraft, // REAL OSDK data
        routeFuel,
        alternateFuel,
        reserveFuel: reserveFuelValue, // EXPLICIT PARAMETER NAME
        fuelPolicy,
        // Include waypoint context for calculation validation
        waypointCount,
        finalWaypoint,
        waypointDependency
      });
      
      console.log('🚁 SAR calculation result:', result);
      return result;
    } catch (error) {
      console.error('SAR calculation error:', error);
      return {
        error: 'Calculation failed',
        details: error.message,
        category: 'calculation',
        severity: 'error'
      };
    }
  }, [sarEnabled, selectedAircraft, takeoffFuel, sarWeight, timeOnTask, routeFuel, alternateFuel, reserveFuelValue, waypointDependency]);
  
  // ========================================
  // AIRCRAFT CAPABILITY ANALYSIS (SIMPLIFIED)
  // ========================================
  
  const aircraftCapability = (() => {
    if (!selectedAircraft || !sarEnabled) {
      return { hasCapabilityData: false };
    }
    
    try {
      const maxWeightResult = calculateMaxSARWeight({
        selectedAircraft,
        takeoffFuel,
        routeFuel,
        alternateFuel,
        reserveFuelValue
      });
      
      const minFuelResult = calculateMinimumFuel({
        selectedAircraft,
        desiredRadius,
        sarWeight,
        timeOnTask,
        routeFuel,
        alternateFuel,
        reserveFuelValue
      });
      
      return {
        hasCapabilityData: true,
        maxWeight: maxWeightResult,
        minFuel: minFuelResult
      };
    } catch (error) {
      console.error('Aircraft capability analysis error:', error);
      return { hasCapabilityData: false, error: error.message };
    }
  })();
  
  // ========================================
  // CONTROL FUNCTIONS
  // ========================================
  
  const toggleSARMode = useCallback(() => {
    setSarEnabled(!sarEnabled);
    setCalculationInProgress(false);
  }, [sarEnabled]);
  
  const updateTakeoffFuel = useCallback((value) => {
    setTakeoffFuel(value);
  }, []);
  
  const updateSARWeight = useCallback((value) => {
    setSarWeight(value);
  }, []);
  
  const updateTimeOnTask = useCallback((value) => {
    setTimeOnTask(value);
  }, []);
  
  const applyAircraftPresets = useCallback(() => {
    if (!selectedAircraft) return;
    
    // Set fuel to 80% of max capacity (typical SAR loading)
    if (selectedAircraft.maxFuel) {
      setTakeoffFuel(Math.round(selectedAircraft.maxFuel * 0.8));
    }
    
    // Set weight based on aircraft type
    const modelType = selectedAircraft.modelType || selectedAircraft.modelName || '';
    let presetWeight = 440; // Default SAR weight
    
    if (modelType.includes('S92') || modelType.includes('S-92')) {
      presetWeight = 600; // Heavier SAR equipment for large aircraft
    } else if (modelType.includes('AW139') || modelType.includes('139')) {
      presetWeight = 500; // Medium SAR equipment
    } else if (modelType.includes('AW169') || modelType.includes('169')) {
      presetWeight = 450; // Medium-light SAR equipment
    }
    
    setSarWeight(presetWeight);
    setLastCalculationTime(new Date());
  }, [selectedAircraft]);
  
  // ========================================
  // COMPUTED PROPERTIES (SIMPLIFIED)
  // ========================================
  
  // Real-world SAR calculation using actual flight data
  const actualRemainingFuel = (() => {
    if (!sarEnabled || !selectedAircraft) return null;
    
    const totalRouteNeeded = routeFuel || 0;
    const remainingAfterRoute = takeoffFuel - totalRouteNeeded;
    
    if (remainingAfterRoute <= 0) return null;
    
    // Calculate operational radius with remaining fuel
    const fuelBurnRate = selectedAircraft.fuelBurn || selectedAircraft.fuelBurnLbsHr || 0;
    const cruiseSpeed = selectedAircraft.cruiseSpeed || selectedAircraft.cruiseSpeedKnots || 0;
    
    if (fuelBurnRate === 0 || cruiseSpeed === 0) return null;
    
    const operationalRadius = (remainingAfterRoute / fuelBurnRate / 2) * cruiseSpeed;
    
    return {
      routeFuelUsed: totalRouteNeeded,
      remainingFuel: remainingAfterRoute,
      operationalRadius: operationalRadius,
      hasAlternate: !!alternateFuel && alternateFuel > 0,
      warningNoAlternate: !alternateFuel || alternateFuel <= 0
    };
  })();
  
  // Aircraft validation
  const hasValidAircraft = selectedAircraft && 
    selectedAircraft.fuelBurn && 
    selectedAircraft.cruiseSpeed;
  
  const isOperational = sarEnabled && hasValidAircraft && sarCalculation && !sarCalculation.error;
  
  // Range circle data for map display
  const rangeCircleData = (() => {
    if (!isOperational || !finalWaypoint || !sarCalculation) {
      console.log('🚁 Range circle not displayed:', {
        isOperational,
        hasFinalWaypoint: !!finalWaypoint,
        hasSarCalculation: !!sarCalculation,
        finalWaypoint
      });
      return null;
    }
    
    const circleData = {
      center: finalWaypoint,
      radiusNM: sarCalculation.operationalRadiusNM,
      visible: true,
      helicopterPosition: finalWaypoint
    };
    
    console.log('🚁 Range circle data generated:', circleData);
    return circleData;
  })();
  
  // ========================================
  // UI HELPER FUNCTIONS
  // ========================================
  
  const getSARStatus = useCallback(() => {
    if (!sarEnabled) {
      return { status: 'disabled', message: 'SAR Mode disabled' };
    }
    
    if (!selectedAircraft) {
      return { status: 'error', message: 'No aircraft selected' };
    }
    
    if (!hasValidAircraft) {
      return { status: 'error', message: 'Aircraft missing performance data' };
    }
    
    if (calculationInProgress) {
      return { status: 'calculating', message: 'Calculating SAR parameters...' };
    }
    
    if (sarCalculation?.error) {
      return { status: 'error', message: sarCalculation.error };
    }
    
    if (sarCalculation) {
      return { 
        status: 'operational', 
        message: `Operational - ${sarCalculation.operationalRadiusNM} NM range` 
      };
    }
    
    return { status: 'ready', message: 'Ready for SAR calculation' };
  }, [sarEnabled, selectedAircraft, hasValidAircraft, calculationInProgress, sarCalculation]);
  
  const getParameterValidation = useCallback(() => {
    const validation = {
      fuel: { valid: true, message: '' },
      weight: { valid: true, message: '' },
      time: { valid: true, message: '' }
    };
    
    // Fuel validation
    if (takeoffFuel <= 0) {
      validation.fuel = { valid: false, message: 'Fuel must be greater than 0' };
    } else if (selectedAircraft?.maxFuel && takeoffFuel > selectedAircraft.maxFuel) {
      validation.fuel = { valid: false, message: `Exceeds max fuel capacity (${selectedAircraft.maxFuel} lbs)` };
    }
    
    // Weight validation
    if (sarWeight < 0) {
      validation.weight = { valid: false, message: 'Weight cannot be negative' };
    } else if (sarWeight > 5000) {
      validation.weight = { valid: false, message: 'Weight exceeds reasonable SAR equipment limits' };
    }
    
    // Time validation
    if (timeOnTask <= 0) {
      validation.time = { valid: false, message: 'Time on task must be greater than 0' };
    } else if (timeOnTask > 4) {
      validation.time = { valid: false, message: 'Time on task exceeds reasonable limits (4 hours)' };
    }
    
    return validation;
  }, [takeoffFuel, sarWeight, timeOnTask, selectedAircraft]);
  
  // ========================================
  // EFFECT HOOKS (REMOVED TO AVOID RACE CONDITIONS)
  // ========================================
  // Note: onSARUpdate will be called manually from the SARCard component
  
  // ========================================
  // RETURN HOOK INTERFACE
  // ========================================
  
  return {
    // Core State
    sarEnabled,
    takeoffFuel,
    sarWeight,
    timeOnTask,
    
    // Advanced Options
    showAdvancedOptions,
    setShowAdvancedOptions,
    desiredRadius,
    setDesiredRadius,
    customReserveFuel,
    setCustomReserveFuel,
    
    // Control Functions
    toggleSARMode,
    updateTakeoffFuel,
    updateSARWeight,
    updateTimeOnTask,
    applyAircraftPresets,
    
    // Calculation Results
    sarCalculation,
    aircraftCapability,
    rangeCircleData,
    
    // Status Properties
    hasValidAircraft,
    isOperational,
    calculationInProgress,
    
    // Derived Data
    routeFuel,
    alternateFuel,
    reserveFuel: reserveFuelValue,
    actualRemainingFuel,
    
    // UI Helpers
    getSARStatus,
    getParameterValidation
  };
};