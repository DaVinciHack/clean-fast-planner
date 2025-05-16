// src/components/fast-planner/hooks/useRouteCalculation.js

import { useEffect, useCallback } from 'react';

// Fallback when ComprehensiveFuelCalculator isn't available in window
const createFallbackCalculator = () => {
  console.warn('⚠️ Creating fallback for ComprehensiveFuelCalculator in useRouteCalculation');
  return {
    calculateAllFuelData: function(waypoints, selectedAircraft, flightSettings, weather) {
      console.warn('Using fallback ComprehensiveFuelCalculator implementation from useRouteCalculation');
      return {
        enhancedResults: {
          totalDistance: 0,
          timeHours: 0,
          estimatedTime: '00:00',
          fuelBurn: 0,
          totalFuel: 0,
          legs: []
        },
        stopCards: []
      };
    }
  };
};

/**
 * Custom hook for handling route and fuel calculations
 */
const useRouteCalculation = ({
  waypoints,
  selectedAircraft,
  flightSettings,
  setFlightSettings,
  setRouteStats,
  setStopCards,
  weather,
  waypointManagerRef,
  appSettingsManagerRef
}) => {
  // Log the flight settings whenever they change for debugging
  useEffect(() => {
    console.log('🛫 Flight settings updated:', flightSettings);
  }, [flightSettings]);

  // Centralized useEffect for comprehensive fuel calculations
  // This effect runs whenever waypoints, selected aircraft, flight settings, or weather change
  useEffect(() => {
    // Skip calculation if essential inputs are missing
    if (!waypoints || waypoints.length < 2 || !selectedAircraft || !flightSettings) {
        console.log('⛽ useRouteCalculation: Skipping fuel calculation due to missing inputs.');
        return;
    }
    
    console.log('⛽ useRouteCalculation: Triggering comprehensive fuel calculation...');

    // Create a settings object with numeric values
    const numericSettings = {
      passengerWeight: Number(flightSettings.passengerWeight),
      taxiFuel: Number(flightSettings.taxiFuel),
      contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent),
      reserveFuel: Number(flightSettings.reserveFuel),
      deckTimePerStop: Number(flightSettings.deckTimePerStop),
      deckFuelFlow: Number(flightSettings.deckFuelFlow),
      cargoWeight: Number(flightSettings.cargoWeight || 0)
    };

    console.log('⛽ useRouteCalculation: Using numeric settings for fuel calculation:', numericSettings);

    // Get the calculator from window or use fallback
    const calculator = window.ComprehensiveFuelCalculator || createFallbackCalculator();

    // Call the comprehensive calculator with numeric settings
    const { enhancedResults, stopCards } = calculator.calculateAllFuelData(
      waypoints,
      selectedAircraft,
      numericSettings,
      weather
    );

    // Ensure time values are valid
    let updatedResults = { ...enhancedResults };
    if (updatedResults && selectedAircraft && updatedResults.totalDistance && 
        (!updatedResults.timeHours || updatedResults.timeHours === 0 || 
         !updatedResults.estimatedTime || updatedResults.estimatedTime === '00:00')) {
      
      // Calculate time based on distance and cruise speed
      const totalDistance = parseFloat(updatedResults.totalDistance);
      const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
      
      // Format time string
      const hours = Math.floor(timeHours);
      const minutes = Math.floor((timeHours - hours) * 60);
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Update enhancedResults with calculated time values
      updatedResults.timeHours = timeHours;
      updatedResults.estimatedTime = estimatedTime;
      
      console.log('⚠️ Added calculated time values to enhancedResults:', {
        timeHours,
        estimatedTime
      });
    }
    
    // Update global state ONCE, outside of the waypointManager update section
    // to prevent loops
    window.currentRouteStats = updatedResults;
    
    // Set state updates in a single batch to prevent cascading updates
    setRouteStats(updatedResults);
    setStopCards(stopCards);

    // Only update route display if we have a valid waypointManager reference
    // and don't trigger other state updates from here
    if (waypointManagerRef.current && updatedResults) {
      // Debounce the updateRoute call to prevent rapid re-renders
      const currentWaypointManager = waypointManagerRef.current;
      const debounceId = setTimeout(() => {
        if (currentWaypointManager) {
          currentWaypointManager.updateRoute(updatedResults);
        }
      }, 50);
      
      // Clean up timeout if component unmounts or effect reruns
      return () => clearTimeout(debounceId);
    }
  }, [waypoints, selectedAircraft, flightSettings, weather, setRouteStats, setStopCards]);

  /**
   * Updates a specific flight setting
   * 
   * @param {string} settingName - Name of the setting to update
   * @param {number|string} value - New value for the setting
   */
  const updateFlightSetting = useCallback((settingName, value) => {
    // Ensure value is a number
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.warn(`⚙️ Warning: Attempted to set ${settingName} to non-numeric value: ${value}`);
      return; // Don't update with invalid values
    }
    
    console.log(`⚙️ updateFlightSetting: ${settingName} = ${numericValue}`);
    
    // Update the flightSettings object by creating a new object
    const updatedSettings = {
      ...flightSettings,
      [settingName]: numericValue
    };
    
    // Save to AppSettingsManager if available, but don't trigger additional updates
    if (appSettingsManagerRef.current) {
      // Use a setTimeout to avoid synchronous updates that might cause loops
      setTimeout(() => {
        try {
          appSettingsManagerRef.current.updateFlightSettings({
            [settingName]: numericValue
          });
        } catch (error) {
          console.error('Error updating AppSettingsManager:', error);
        }
      }, 0);
    }
    
    // Update the state - this will trigger the useEffect for recalculation
    setFlightSettings(updatedSettings);
  }, [flightSettings, appSettingsManagerRef, setFlightSettings]);

  /**
   * Calculates the maximum payload for the current aircraft
   * 
   * @returns {number} - Maximum payload in pounds
   */
  const calculateMaxPayload = useCallback(() => {
    if (!selectedAircraft) return 0;
    
    // Basic calculation based on aircraft properties
    const basicPayload = selectedAircraft.maxPayload || 0;
    
    // Adjust for fuel requirements if we have route stats
    if (window.currentRouteStats && window.currentRouteStats.totalFuel) {
      const fuelWeight = Number(window.currentRouteStats.totalFuel);
      // Assuming maxTakeoffWeight includes crew weight
      const adjustedPayload = Math.max(0, basicPayload - fuelWeight);
      return adjustedPayload;
    }
    
    return basicPayload;
  }, [selectedAircraft]);

  /**
   * Calculates the maximum passenger count based on aircraft and route
   * 
   * @returns {number} - Maximum number of passengers
   */
  const calculateMaxPassengers = useCallback(() => {
    if (!selectedAircraft || !flightSettings) return 0;
    
    const maxPayload = calculateMaxPayload();
    const passengerWeight = Number(flightSettings.passengerWeight);
    const cargoWeight = Number(flightSettings.cargoWeight || 0);
    
    if (passengerWeight <= 0) return 0;
    
    // Calculate max passengers after accounting for cargo
    const availableForPassengers = Math.max(0, maxPayload - cargoWeight);
    return Math.floor(availableForPassengers / passengerWeight);
  }, [selectedAircraft, flightSettings, calculateMaxPayload]);

  /**
   * Validates flight settings to ensure they are within reasonable ranges
   * 
   * @param {Object} settings - Flight settings to validate
   * @returns {Object} - Validated settings object
   */
  const validateFlightSettings = useCallback((settings) => {
    const validated = { ...settings };
    
    // Enforce minimum passenger weight
    if (validated.passengerWeight < 100) {
      validated.passengerWeight = 100;
    }
    
    // Cap contingency fuel at reasonable limits
    if (validated.contingencyFuelPercent > 30) {
      validated.contingencyFuelPercent = 30;
    } else if (validated.contingencyFuelPercent < 0) {
      validated.contingencyFuelPercent = 0;
    }
    
    // Ensure positive values for fuel settings
    if (validated.taxiFuel < 0) validated.taxiFuel = 0;
    if (validated.reserveFuel < 0) validated.reserveFuel = 0;
    if (validated.deckTimePerStop < 0) validated.deckTimePerStop = 0;
    if (validated.deckFuelFlow < 0) validated.deckFuelFlow = 0;
    
    return validated;
  }, []);

  return {
    updateFlightSetting,
    calculateMaxPayload,
    calculateMaxPassengers,
    validateFlightSettings
  };
};

export default useRouteCalculation;