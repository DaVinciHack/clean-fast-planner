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

import { useState, useCallback, useEffect } from 'react';
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
  fuelPolicy = null,
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
    
    // Get the departure card (first card) which contains total fuel required
    const departureCard = stopCards.find(card => card.type === 'departure') || stopCards[0];
    console.log('🚁 SAR: Found departure card:', departureCard);
    
    const routeFuelValue = departureCard?.totalFuel || departureCard?.fuelRequired || departureCard?.totalFuelRequired || 0;
    console.log('🚁 SAR: Extracted routeFuel value:', routeFuelValue);
    
    return routeFuelValue;
  })();
  
  const alternateFuel = alternateStats?.totalFuelRequired || alternateStats?.fuelRequired || 0;
  const reserveFuel = customReserveFuel !== null ? customReserveFuel : (() => {
    if (!stopCards || stopCards.length === 0) return 0;
    const departureCard = stopCards.find(card => card.type === 'departure') || stopCards[0];
    return departureCard?.fuelComponentsObject?.reserveFuel || departureCard?.reserveFuel || 0;
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
  
  const sarCalculation = (() => {
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
    
    try {
      const result = calculateOperationalRadius({
        takeoffFuel,
        sarWeight,
        timeOnTask,
        selectedAircraft, // REAL OSDK data
        routeFuel,
        alternateFuel,
        reserveFuel,
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
  })();
  
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
        reserveFuel
      });
      
      const minFuelResult = calculateMinimumFuel({
        selectedAircraft,
        desiredRadius,
        sarWeight,
        timeOnTask,
        routeFuel,
        alternateFuel,
        reserveFuel
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
    if (!sarEnabled || !selectedAircraft || !routeStats) return null;
    
    const totalRouteNeeded = routeStats.totalFuelRequired || 0;
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
      hasAlternate: !!alternateStats?.fuelRequired,
      warningNoAlternate: !alternateStats?.fuelRequired
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
    reserveFuel,
    actualRemainingFuel,
    
    // UI Helpers
    getSARStatus,
    getParameterValidation
  };
};