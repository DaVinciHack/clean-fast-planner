// src/components/fast-planner/hooks/useRouteCalculation.js

import { useEffect, useCallback } from 'react';
// Import the calculator directly
import ComprehensiveFuelCalculator from '../modules/calculations/fuel/ComprehensiveFuelCalculator';

// Ensure the calculator is available globally
if (!window.ComprehensiveFuelCalculator) {
  window.ComprehensiveFuelCalculator = ComprehensiveFuelCalculator;
}

// Create a singleton fallback calculator to prevent repeated creations
let fallbackCalculator = null;

// Fallback when ComprehensiveFuelCalculator isn't available in window
const createFallbackCalculator = () => {
  // Only create a new instance if one doesn't already exist
  if (fallbackCalculator === null) {
    console.warn('⚠️ Creating fallback for ComprehensiveFuelCalculator in useRouteCalculation');
    fallbackCalculator = {
      calculateAllFuelData: function(waypoints, selectedAircraft, flightSettings, weather) {
        // Only log once per calculation, not on every call
        console.log('Using fallback ComprehensiveFuelCalculator implementation');
        
        // Calculate basic route statistics based on waypoints and aircraft
        let totalDistance = 0;
        let estimatedTime = '00:00';
        let timeHours = 0;
        
        // Calculate distance and time if we have waypoints and aircraft
        if (waypoints && waypoints.length >= 2 && selectedAircraft) {
          // Calculate distance between each pair of waypoints
          for (let i = 0; i < waypoints.length - 1; i++) {
            const wp1 = waypoints[i];
            const wp2 = waypoints[i + 1];
            
            if (wp1.coordinates && wp2.coordinates) {
              const distance = calculateDistance(wp1.coordinates, wp2.coordinates);
              totalDistance += distance;
            }
          }
          
          // Calculate time based on distance and cruise speed
          if (selectedAircraft.cruiseSpeed) {
            timeHours = totalDistance / selectedAircraft.cruiseSpeed;
            const hours = Math.floor(timeHours);
            const minutes = Math.floor((timeHours - hours) * 60);
            estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
        
        // Calculate basic fuel burn based on distance and fuel flow
        let fuelBurn = 0;
        if (selectedAircraft && selectedAircraft.fuelFlow) {
          fuelBurn = timeHours * selectedAircraft.fuelFlow;
        }
        
        // Calculate total fuel including contingency, reserve, and taxi
        const contingencyFuel = fuelBurn * (flightSettings.contingencyFuelPercent / 100);
        const totalFuel = fuelBurn + contingencyFuel + flightSettings.reserveFuel + flightSettings.taxiFuel;
        
        return {
          enhancedResults: {
            totalDistance,
            timeHours,
            estimatedTime,
            fuelBurn,
            totalFuel,
            legs: []
          },
          stopCards: []
        };
      }
    };
  }
  
  return fallbackCalculator;
};

// Helper function to calculate distance between two coordinates (in nm)
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  
  // Extract coordinates, handling different possible formats
  const lat1 = typeof coord1[1] === 'number' ? coord1[1] : 0;
  const lon1 = typeof coord1[0] === 'number' ? coord1[0] : 0;
  const lat2 = typeof coord2[1] === 'number' ? coord2[1] : 0;
  const lon2 = typeof coord2[0] === 'number' ? coord2[0] : 0;
  
  // Convert decimal degrees to radians
  const toRad = value => value * Math.PI / 180;
  const R = 3440.07; // Earth radius in nautical miles
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
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

    // Get the calculator from window or use fallback - only once per calculation
    let calculator;
    try {
      if (window.ComprehensiveFuelCalculator) {
        calculator = window.ComprehensiveFuelCalculator;
      } else {
        // Import the calculator directly if available
        try {
          // Dynamic import (this is a one-time operation)
          import('../modules/calculations/fuel/ComprehensiveFuelCalculator')
            .then(module => {
              window.ComprehensiveFuelCalculator = module.default;
              // Re-trigger calculation once imported
              setFlightSettings({...flightSettings});
            })
            .catch(err => {
              console.error('Failed to import ComprehensiveFuelCalculator:', err);
              // Use fallback but don't trigger another calculation
              window.ComprehensiveFuelCalculator = createFallbackCalculator();
            });
          
          // Return early - we'll re-run this effect when the import completes
          return;
        } catch (importError) {
          console.error('Error importing ComprehensiveFuelCalculator:', importError);
          calculator = createFallbackCalculator();
        }
      }
    } catch (error) {
      console.error('Error accessing or creating calculator:', error);
      calculator = createFallbackCalculator();
    }

    // Call the calculator with numeric settings
    let enhancedResults, stopCards;
    try {
      const result = calculator.calculateAllFuelData(
        waypoints,
        selectedAircraft,
        numericSettings,
        weather
      );
      
      enhancedResults = result.enhancedResults;
      stopCards = result.stopCards;
    } catch (calculationError) {
      console.error('Error in fuel calculation:', calculationError);
      // Use fallback values if calculation fails
      enhancedResults = {
        totalDistance: 0,
        timeHours: 0,
        estimatedTime: '00:00',
        fuelBurn: 0,
        totalFuel: 0,
        legs: []
      };
      stopCards = [];
    }

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
    }
    
    // Update global state ONCE
    window.currentRouteStats = updatedResults;
    
    // Set state updates in a single batch to prevent cascading updates
    setRouteStats(updatedResults);
    setStopCards(stopCards);

    // Only update route display if we have a valid waypointManager reference
    // and don't trigger other state updates from here
    if (waypointManagerRef?.current && updatedResults) {
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