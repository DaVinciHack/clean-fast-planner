// src/components/fast-planner/hooks/useRouteCalculation.js

import { useEffect } from 'react';

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
    console.log('⛽ useRouteCalculation: Triggering comprehensive fuel calculation...');

    // Ensure required inputs are available before calculating
    if (!waypoints || waypoints.length < 2 || !selectedAircraft || !flightSettings) {
        console.log('⛽ useRouteCalculation: Skipping fuel calculation due to missing inputs.');
        setRouteStats(null);
        setStopCards([]);
        return;
    }

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

    // Ensure time values in enhancedResults are valid before updating state
    if (enhancedResults && selectedAircraft && enhancedResults.totalDistance && 
        (!enhancedResults.timeHours || enhancedResults.timeHours === 0 || 
         !enhancedResults.estimatedTime || enhancedResults.estimatedTime === '00:00')) {
      console.warn('⚠️ enhancedResults missing time values - calculating before setting state...');
      
      // Calculate time based on distance and cruise speed
      const totalDistance = parseFloat(enhancedResults.totalDistance);
      const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
      
      // Format time string
      const hours = Math.floor(timeHours);
      const minutes = Math.floor((timeHours - hours) * 60);
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Update enhancedResults with calculated time values
      enhancedResults.timeHours = timeHours;
      enhancedResults.estimatedTime = estimatedTime;
      
      console.log('⚠️ Added calculated time values to enhancedResults:', {
        timeHours,
        estimatedTime
      });
    }
    
    // IMPORTANT: Always update window.currentRouteStats first for global access
    window.currentRouteStats = enhancedResults;
    
    // Update the state with the new results
    setRouteStats(enhancedResults);
    setStopCards(stopCards);

    console.log('⛽ useRouteCalculation: Fuel calculation complete. State updated.');

    // CRITICAL FIX: Force route display update when fuel/route stats change
    // This ensures the route line labels are updated with new time/fuel values
    if (waypointManagerRef.current && enhancedResults) {
      console.log('⛽ Forcing route display update with new stats');
      
      // DEBUG - Check time values exist in enhancedResults
      if (!enhancedResults.timeHours || enhancedResults.timeHours === 0 || !enhancedResults.estimatedTime || enhancedResults.estimatedTime === '00:00') {
        console.error('⚠️ CRITICAL: Missing time values in enhancedResults! This will cause display issues.');
        
        // If we have distance and aircraft, calculate time directly
        if (enhancedResults.totalDistance && parseFloat(enhancedResults.totalDistance) > 0 && selectedAircraft && selectedAircraft.cruiseSpeed) {
          console.log('⚠️ Calculating missing time values for display...');
          const totalDistance = parseFloat(enhancedResults.totalDistance);
          const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
          const hours = Math.floor(timeHours);
          const minutes = Math.floor((timeHours - hours) * 60);
          const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // Update the enhancedResults with the calculated time values
          enhancedResults.timeHours = timeHours;
          enhancedResults.estimatedTime = estimatedTime;
          
          console.log('⚠️ Fixed enhancedResults with calculated times:', {
            timeHours,
            estimatedTime
          });
        }
      }
      
      // Directly pass the enhancedResults to updateRoute without clearing first
      // This ensures the stats are used for the leg labels
      waypointManagerRef.current.updateRoute(enhancedResults);
      
      // Also update window.currentRouteStats to ensure it's available for map interactions
      window.currentRouteStats = enhancedResults;
      
      console.log('⛽ Route display updated with new stats');
    }
  }, [waypoints, selectedAircraft, flightSettings, weather]); // Dependencies for the effect

  /**
   * Updates a specific flight setting
   * 
   * @param {string} settingName - Name of the setting to update
   * @param {number|string} value - New value for the setting
   */
  const updateFlightSetting = (settingName, value) => {
    console.log(`⚙️ updateFlightSetting called with: ${settingName} = ${value} (${typeof value})`);
    
    // Ensure value is a number
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      console.warn(`⚙️ Warning: Attempted to set ${settingName} to non-numeric value: ${value}`);
      return; // Don't update with invalid values
    }
    
    // Update the flightSettings object
    const updatedSettings = {
      ...flightSettings,
      [settingName]: numericValue
    };
    
    console.log(`⚙️ Updating flightSettings:`, updatedSettings);
    
    // Update the state
    setFlightSettings(updatedSettings);

    // Save to AppSettingsManager
    if (appSettingsManagerRef.current) {
      console.log(`⚙️ Saving ${settingName} = ${numericValue} to AppSettingsManager`);
      appSettingsManagerRef.current.updateFlightSettings({
        [settingName]: numericValue
      });
    }

    // Force a UI update immediately to ensure consistency
    const event = new Event('settings-changed');
    window.dispatchEvent(event);
    
    console.log(`⚙️ updateFlightSetting completed for ${settingName}`);
    // The centralized useEffect will handle recalculation
  };

  /**
   * Calculates the maximum payload for the current aircraft
   * 
   * @returns {number} - Maximum payload in pounds
   */
  const calculateMaxPayload = () => {
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
  };

  /**
   * Calculates the maximum passenger count based on aircraft and route
   * 
   * @returns {number} - Maximum number of passengers
   */
  const calculateMaxPassengers = () => {
    if (!selectedAircraft || !flightSettings) return 0;
    
    const maxPayload = calculateMaxPayload();
    const passengerWeight = Number(flightSettings.passengerWeight);
    const cargoWeight = Number(flightSettings.cargoWeight || 0);
    
    if (passengerWeight <= 0) return 0;
    
    // Calculate max passengers after accounting for cargo
    const availableForPassengers = Math.max(0, maxPayload - cargoWeight);
    return Math.floor(availableForPassengers / passengerWeight);
  };

  /**
   * Validates flight settings to ensure they are within reasonable ranges
   * 
   * @param {Object} settings - Flight settings to validate
   * @returns {Object} - Validated settings object
   */
  const validateFlightSettings = (settings) => {
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
  };

  return {
    updateFlightSetting,
    calculateMaxPayload,
    calculateMaxPassengers,
    validateFlightSettings
  };
};

export default useRouteCalculation;