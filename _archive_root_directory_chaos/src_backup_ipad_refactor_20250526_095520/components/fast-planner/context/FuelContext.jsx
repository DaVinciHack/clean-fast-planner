import React, { createContext, useContext, useState, useEffect } from 'react';
import fuelManager from '../modules/fuel';

// Create the context
const FuelContext = createContext(null);

/**
 * FuelProvider Component
 * 
 * Provides fuel calculation functionality to the entire application
 * Manages state for fuel calculations and settings
 */
export const FuelProvider = ({ children }) => {
  // State for fuel calculation results
  const [fuelResults, setFuelResults] = useState([]);
  const [passengerCapacity, setPassengerCapacity] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(null);
  
  // State for fuel settings
  const [fuelSettings, setFuelSettings] = useState({
    taxiFuel: 50,                  // lbs
    contingencyFuelPercent: 10,    // % of trip fuel
    reserveMethod: 'fixed',        // 'fixed' or 'percent'
    reserveFuel: 500,              // lbs for fixed reserve
    reserveFuelPercent: 10,        // % for percent reserve
    deckFuelPerStop: 100,          // lbs of additional fuel at deck
    deckFuelFlow: 400,             // lbs/hr for hover/deck operations
    deckTimePerStop: 5,            // minutes spent at deck per stop
    passengerWeight: 220           // lbs per passenger
  });
  
  // Initialize the fuel manager with settings
  useEffect(() => {
    fuelManager.updateSettings(fuelSettings);
  }, []);
  
  /**
   * Set aircraft data for fuel calculations
   * @param {Object} aircraft - Aircraft data object
   */
  const setAircraft = (aircraft) => {
    if (!aircraft) return;
    
    fuelManager.setAircraft(aircraft);
    updateResults();
  };
  
  /**
   * Set waypoints for fuel calculations
   * @param {Array} waypoints - Array of waypoint objects
   */
  const setWaypoints = (waypoints) => {
    if (!waypoints || waypoints.length < 2) return;
    
    fuelManager.setWaypoints(waypoints);
    updateResults();
  };
  
  /**
   * Update fuel settings
   * @param {Object} newSettings - Updated settings object
   */
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...fuelSettings, ...newSettings };
    setFuelSettings(updatedSettings);
    fuelManager.updateSettings(updatedSettings);
    updateResults();
  };
  
  /**
   * Calculate fuel requirements with current aircraft and waypoints
   * @param {Object} aircraft - Aircraft data (optional, uses stored if not provided)
   * @param {Array} waypoints - Waypoints (optional, uses stored if not provided)
   */
  const calculateFuel = (aircraft, waypoints) => {
    const results = fuelManager.calculateFuelRequirements(aircraft, waypoints);
    
    if (!results) return;
    
    setFuelResults(results.fuelResults || []);
    setPassengerCapacity(results.passengerCapacity || []);
    setMaxCapacity(fuelManager.getMaximumPassengerCapacity());
  };
  
  /**
   * Update results from current fuel manager state
   */
  const updateResults = () => {
    const results = fuelManager.getResults();
    
    if (!results) return;
    
    setFuelResults(results.fuelResults || []);
    setPassengerCapacity(results.passengerCapacity || []);
    setMaxCapacity(fuelManager.getMaximumPassengerCapacity());
  };
  
  // Value object to provide to consumers
  const contextValue = {
    // State
    fuelResults,
    passengerCapacity,
    maxCapacity,
    fuelSettings,
    
    // Methods
    setAircraft,
    setWaypoints,
    updateSettings,
    calculateFuel,
    
    // Direct access to manager for advanced usage
    fuelManager
  };
  
  return (
    <FuelContext.Provider value={contextValue}>
      {children}
    </FuelContext.Provider>
  );
};

/**
 * useFuel Hook
 * 
 * Custom hook to access the fuel context
 * @returns {Object} Fuel context value
 */
export const useFuel = () => {
  const context = useContext(FuelContext);
  
  if (!context) {
    throw new Error('useFuel must be used within a FuelProvider');
  }
  
  return context;
};

export default FuelContext;