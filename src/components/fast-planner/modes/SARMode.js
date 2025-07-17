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

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  
  // Track previous aircraft to detect changes
  const prevAircraftRef = useRef(null);
  
  // ========================================
  // AUTO-PRESET AIRCRAFT VALUES
  // ========================================
  
  // Automatically set fuel and weight when aircraft changes
  useEffect(() => {
    const currentAircraftId = selectedAircraft?.id || selectedAircraft?.registration;
    const prevAircraftId = prevAircraftRef.current?.id || prevAircraftRef.current?.registration;
    
    // Only apply presets if aircraft actually changed (not on first load with null)
    if (selectedAircraft && currentAircraftId !== prevAircraftId) {
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
    }
    
    // Update the ref to track the current aircraft
    prevAircraftRef.current = selectedAircraft;
  }, [selectedAircraft]);
  
  // ========================================
  // DERIVED VALUES FROM CURRENT FLIGHT (SIMPLIFIED)
  // ========================================
  
  // Extract fuel requirements from stop cards (single source of truth)
  const routeFuel = (() => {
    if (!stopCards || stopCards.length === 0) {
      return 0;
    }
    
    // Extract route fuel consumed (not total fuel on takeoff)
    // Option 1: Get trip fuel from fuel components
    const departureCard = stopCards.find(card => card.type === 'departure') || stopCards[0];
    const destinationCard = stopCards.find(card => card.isDestination) || stopCards[stopCards.length - 1];
    
    // Try to get trip fuel from fuel components
    let routeFuelValue = 0;
    if (destinationCard?.fuelComponentsObject?.tripFuel) {
      routeFuelValue = destinationCard.fuelComponentsObject.tripFuel;
    } else if (departureCard?.fuelComponentsObject?.tripFuel) {
      routeFuelValue = departureCard.fuelComponentsObject.tripFuel;
    } else {
      // No route fuel available
      routeFuelValue = 0;
    }
    
    return routeFuelValue;
  })();
  
  const alternateFuel = useMemo(() => {
    // First try alternateStats
    if (alternateStats?.totalFuelRequired || alternateStats?.fuelRequired) {
      const altFuel = alternateStats.totalFuelRequired || alternateStats.fuelRequired;
      return altFuel;
    }
    
    // Second try alternateRouteData - check EVERYTHING in it
    if (alternateRouteData) {
      // Try stats first
      if (alternateRouteData?.stats?.totalFuelRequired || alternateRouteData?.stats?.fuelRequired) {
        const altFuel = alternateRouteData.stats.totalFuelRequired || alternateRouteData.stats.fuelRequired;
        return altFuel;
      }
      
      // Try looking for alternate fuel in other properties
      const possibleFuelProps = ['alternateFuel', 'altFuel', 'fuelRequired', 'totalFuel', 'fuel'];
      for (const prop of possibleFuelProps) {
        if (alternateRouteData[prop]) {
          return alternateRouteData[prop];
        }
      }
    }
    
    // PRIORITY 3: Extract from stop cards (including separate alternate card)
    if (stopCards && stopCards.length > 0) {
      // Look for alternate card (when alternate route is added)
      const alternateCard = stopCards.find(card => card.isAlternate === true);
      if (alternateCard) {
        // Extract ONLY the alternate leg fuel (Alt: 112), not total fuel
        const altFuel = alternateCard.fuelComponentsObject?.altFuel || 
                       alternateCard.altFuel || 
                       alternateCard.tripFuel || 0;
        
        if (altFuel > 0) {
          return altFuel;
        }
      }
      
      // Check departure card for alternate fuel component (first card or card with isDeparture)
      const departureCard = stopCards.find(card => card.isDeparture === true) || stopCards[0];
      
      if (departureCard?.fuelComponentsObject?.altFuel) {
        const altFuel = departureCard.fuelComponentsObject.altFuel;
        return altFuel;
      }
    }
    
    return 0;
  }, [alternateStats, alternateRouteData, stopCards,
      // Add granular dependency tracking for alternate route data properties
      alternateStats?.totalFuelRequired, alternateStats?.fuelRequired,
      alternateRouteData?.stats?.totalFuelRequired, alternateRouteData?.stats?.fuelRequired,
      // Track changes to stop cards length and presence of alternate cards (more stable)
      stopCards?.length, 
      stopCards?.some(card => card.isAlternate)]);
  const reserveFuelValue = customReserveFuel !== null ? customReserveFuel : (() => {
    // PRIORITY 1: Use pre-calculated reserve fuel passed as prop (may be in minutes, need to convert)
    if (reserveFuel !== null && reserveFuel > 0) {
      // Check if this looks like a time value (typical reserve times are 20-45 minutes)
      if (reserveFuel <= 60 && selectedAircraft?.fuelBurn) {
        // Convert minutes to fuel amount
        const reserveHours = reserveFuel / 60;
        const calculatedReserveFuel = reserveHours * selectedAircraft.fuelBurn;
        return calculatedReserveFuel;
      } else {
        // Already in fuel amount
        return reserveFuel;
      }
    }
    
    // PRIORITY 2: Try to get from stop cards if available (when route is planned)
    if (stopCards && stopCards.length > 0) {
      const departureCard = stopCards.find(card => card.type === 'departure') || stopCards[0];
      if (departureCard?.fuelComponentsObject?.reserveFuel) {
        const reserveFromCards = departureCard.fuelComponentsObject.reserveFuel;
        return reserveFromCards;
      }
    }
    
    // Fallback: calculate from fuel policy if aircraft is selected
    if (selectedAircraft && fuelPolicy && fuelPolicy.currentPolicy) {
      const currentPolicy = fuelPolicy.currentPolicy;
      
      // Use the same logic as StopCardCalculator for reserve fuel
      const fuelBurnRate = selectedAircraft.fuelBurn || 0;
      
      if (currentPolicy.reserveType === 'TIME' && currentPolicy.reserveValue && fuelBurnRate > 0) {
        const reserveMinutes = currentPolicy.reserveValue;
        const reserveHours = reserveMinutes / 60;
        const calculatedReserve = reserveHours * fuelBurnRate;
        return calculatedReserve;
      } else if (currentPolicy.reserveType === 'FUEL' && currentPolicy.reserveValue) {
        const calculatedReserve = currentPolicy.reserveValue;
        return calculatedReserve;
      }
    }
    
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
    if (!sarEnabled || !selectedAircraft) {
      return null;
    }
    
    // CRITICAL FIX: Include waypoints in calculation dependencies
    // This ensures SAR calculation updates when route changes
    const waypointCount = waypoints?.length || 0;
    const hasValidFinalWaypoint = finalWaypoint && finalWaypoint.lat && finalWaypoint.lng;

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
  }, [sarEnabled, selectedAircraft, takeoffFuel, sarWeight, timeOnTask, routeFuel, alternateFuel, reserveFuelValue, waypointDependency, 
      // Add specific alternate route dependencies to ensure SAR recalculates when alternate data changes
      alternateRouteData?.stats?.totalFuelRequired, alternateRouteData?.stats?.fuelRequired, 
      alternateStats?.totalFuelRequired, alternateStats?.fuelRequired]);
  
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
      return null;
    }
    
    const circleData = {
      center: finalWaypoint,
      radiusNM: sarCalculation.operationalRadiusNM,
      visible: true,
      helicopterPosition: finalWaypoint
    };
    
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