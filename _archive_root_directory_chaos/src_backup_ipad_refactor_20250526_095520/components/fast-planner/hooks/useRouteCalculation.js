// src/components/fast-planner/hooks/useRouteCalculation.js

import { useEffect, useCallback } from 'react';
// Import the calculator directly - never use fallbacks for aviation
import ComprehensiveFuelCalculator from '../modules/calculations/fuel/ComprehensiveFuelCalculator';

// Ensure the calculator is available globally
if (!window.ComprehensiveFuelCalculator) {
  window.ComprehensiveFuelCalculator = ComprehensiveFuelCalculator;
}

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
  // Initialize static properties for calculation state tracking
  if (!useRouteCalculation.lastInputHash) {
    useRouteCalculation.lastInputHash = '';
    useRouteCalculation.lastCalculationTime = 0;
    useRouteCalculation.lastResultHash = '';
    useRouteCalculation.calculationInProgress = false;
  }

  // Log the flight settings whenever they change for debugging
  useEffect(() => {
    console.log('🛫 Flight settings updated:', flightSettings);
  }, [flightSettings]);

  // Centralized useEffect for comprehensive fuel calculations
  // This effect runs whenever waypoints, selected aircraft, flight settings, or weather change
  useEffect(() => {
    // CRITICAL: Skip calculation if essential inputs are missing
    if (!waypoints || waypoints.length < 2) {
        console.log('⛽ useRouteCalculation: Skipping fuel calculation - insufficient waypoints');
        return;
    }
    
    if (!selectedAircraft) {
        console.log('⛽ useRouteCalculation: Skipping fuel calculation - no aircraft selected');
        return;
    }
    
    if (!flightSettings) {
        console.log('⛽ useRouteCalculation: Skipping fuel calculation - no flight settings');
        return;
    }
    
    // Add static properties to the effect for tracking state between renders
    if (!useRouteCalculation.lastInputHash) {
      useRouteCalculation.lastInputHash = '';
      useRouteCalculation.lastCalculationTime = 0;
      useRouteCalculation.lastResultHash = '';
      useRouteCalculation.calculationInProgress = false;
    }
    
    // Create a uniquely identifying hash for this calculation
    const inputHash = JSON.stringify({
      waypointsLength: waypoints.length,
      waypointIds: waypoints.map(wp => wp.id).join('-'),
      aircraftId: selectedAircraft.id || selectedAircraft.registration,
      settingsHash: JSON.stringify(flightSettings),
      weatherHash: weather ? `${weather.windSpeed}-${weather.windDirection}` : 'none'
    });
    
    // Check if this is a duplicate calculation within a short time window
    const now = Date.now();
    const timeSinceLastCalculation = now - useRouteCalculation.lastCalculationTime;
    
    if (useRouteCalculation.calculationInProgress) {
      console.warn('⚠️ useRouteCalculation: Calculation already in progress, skipping');
      return;
    }
    
    if (inputHash === useRouteCalculation.lastInputHash && timeSinceLastCalculation < 300) {
      console.warn('⚠️ useRouteCalculation: Duplicate calculation detected within 300ms, skipping');
      return;
    }
    
    // Set the tracking variables
    useRouteCalculation.lastInputHash = inputHash;
    useRouteCalculation.lastCalculationTime = now;
    useRouteCalculation.calculationInProgress = true;
    
    // CRITICAL: Essential aircraft properties check - NEVER proceed if any are missing
    const requiredProps = ['cruiseSpeed', 'fuelBurn', 'emptyWeight', 'maxTakeoffWeight', 'maxFuel'];
    const missingProps = requiredProps.filter(prop => 
      typeof selectedAircraft[prop] !== 'number' || selectedAircraft[prop] <= 0
    );
    
    if (missingProps.length > 0) {
      console.error(`⛽ useRouteCalculation: Skipping calculation - missing critical aircraft properties: ${missingProps.join(', ')}`);
      useRouteCalculation.calculationInProgress = false;
      return; // Exit without attempting calculation
    }
    
    console.log('⛽ useRouteCalculation: Aircraft validation passed, performing calculation');

    // CRITICAL: Never use fallbacks for aviation calculations
    if (!window.ComprehensiveFuelCalculator) {
      console.error('⛽ useRouteCalculation: Skipping calculation - ComprehensiveFuelCalculator not available');
      useRouteCalculation.calculationInProgress = false;
      return; // Exit without attempting calculation
    }

    // Create a settings object with explicit numeric values
    const numericSettings = {
      passengerWeight: Number(flightSettings.passengerWeight) || 0,
      taxiFuel: Number(flightSettings.taxiFuel) || 0,
      contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent) || 0,
      reserveFuel: Number(flightSettings.reserveFuel) || 0,
      deckTimePerStop: Number(flightSettings.deckTimePerStop) || 0,
      deckFuelFlow: Number(flightSettings.deckFuelFlow) || 0,
      cargoWeight: Number(flightSettings.cargoWeight) || 0
    };

    // Use a debounce to prevent too frequent calculations
    const debounceTimeoutId = setTimeout(() => {
      // Perform a single calculation attempt with proper error handling
      try {
        const result = window.ComprehensiveFuelCalculator.calculateAllFuelData(
          waypoints,
          selectedAircraft,
          numericSettings,
          weather
        );
        
        // If calculation succeeded, use the results
        if (result && result.enhancedResults) {
          // Create a hash of the results to detect meaningful changes
          const resultHash = JSON.stringify({
            totalDistance: result.enhancedResults.totalDistance,
            totalFuel: result.enhancedResults.totalFuel,
            maxPassengers: result.enhancedResults.maxPassengers,
            stopCardsCount: result.stopCards ? result.stopCards.length : 0
          });
          
          // Skip update if results didn't actually change
          if (useRouteCalculation.lastResultHash === resultHash) {
            console.log('⛽ useRouteCalculation: Results unchanged, skipping state updates');
            useRouteCalculation.calculationInProgress = false;
            return;
          }
          
          // Store the result hash
          useRouteCalculation.lastResultHash = resultHash;
          
          // Update global state with validated results
          window.currentRouteStats = result.enhancedResults;
          
          // Set state updates with validated data
          setRouteStats(result.enhancedResults);
          setStopCards(result.stopCards || []);
          
          // Only update route display if we have a valid waypointManager reference
          if (waypointManagerRef && waypointManagerRef.current) {
            // Debounce the updateRoute call to prevent rapid re-renders
            const currentWaypointManager = waypointManagerRef.current;
            const routeUpdateId = setTimeout(() => {
              if (currentWaypointManager) {
                currentWaypointManager.updateRoute(result.enhancedResults);
              }
            }, 50);
          }
        } else {
          console.error('⛽ useRouteCalculation: Calculation returned null or invalid results');
        }
      } catch (error) {
        console.error('⛽ useRouteCalculation: Error during fuel calculation:', error);
        // Do not attempt any fallback calculations - EXIT
      } finally {
        // Always clear the in-progress flag
        useRouteCalculation.calculationInProgress = false;
      }
    }, 250); // Add a 250ms debounce to prevent rapid recalculations
    
    // Clean up timeout if component unmounts or effect reruns
    return () => {
      clearTimeout(debounceTimeoutId);
      // Ensure flag is cleared on cleanup
      useRouteCalculation.calculationInProgress = false;
    };
  }, [waypoints, selectedAircraft, flightSettings, weather, setRouteStats, setStopCards, waypointManagerRef]);

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