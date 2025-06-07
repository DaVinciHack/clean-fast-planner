/**
 * useMasterFuelManager.js
 * 
 * React hook wrapper for MasterFuelManager
 * Provides easy integration with React components while maintaining
 * the single source of truth architecture
 */

import { useState, useEffect, useCallback } from 'react';
import masterFuelManager from '../modules/fuel/MasterFuelManager.js';

export function useMasterFuelManager() {
  // State for React components
  const [calculations, setCalculations] = useState(null);
  const [state, setState] = useState(masterFuelManager.getCurrentState());
  const [isLoading, setIsLoading] = useState(false);
  
  // Subscribe to manager updates
  useEffect(() => {
    console.log('🪝 useMasterFuelManager: Subscribing to MasterFuelManager');
    
    const unsubscribe = masterFuelManager.subscribe('useMasterFuelManager', 
      (changeType, data, newCalculations) => {
        console.log(`🪝 useMasterFuelManager: Received ${changeType} update`);
        
        // Update state
        setState(masterFuelManager.getCurrentState());
        
        // Update calculations if available
        if (newCalculations) {
          setCalculations(newCalculations);
        }
        
        setIsLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      console.log('🪝 useMasterFuelManager: Unsubscribing');
      unsubscribe();
    };
  }, []);
  
  // API functions for components
  const updatePolicy = useCallback((policy) => {
    setIsLoading(true);
    masterFuelManager.updateFuelPolicy(policy);
  }, []);
  
  const updateWeather = useCallback((weather) => {
    setIsLoading(true);
    masterFuelManager.updateWeather(weather);
  }, []);
  
  const updateWeatherSegments = useCallback((segments) => {
    setIsLoading(true);
    masterFuelManager.updateWeatherSegments(segments);
  }, []);
  
  const updateWaypoints = useCallback((waypoints) => {
    setIsLoading(true);
    masterFuelManager.updateWaypoints(waypoints);
  }, []);
  
  const updateAircraft = useCallback((aircraft) => {
    setIsLoading(true);
    masterFuelManager.updateAircraft(aircraft);
  }, []);
  
  const applyOverrides = useCallback((overrides) => {
    setIsLoading(true);
    masterFuelManager.applyUserOverrides(overrides);
  }, []);
  
  const forceRecalculation = useCallback(() => {
    setIsLoading(true);
    return masterFuelManager.forceRecalculation();
  }, []);
  
  const getCalculations = useCallback(() => {
    return masterFuelManager.getCalculations();
  }, []);
  
  return {
    // State
    calculations,
    state,
    isLoading,
    
    // Actions
    updatePolicy,
    updateWeather,
    updateWeatherSegments, 
    updateWaypoints,
    updateAircraft,
    applyOverrides,
    forceRecalculation,
    getCalculations,
    
    // Computed
    hasPolicy: state.hasPolicy,
    hasWeather: state.hasWeather,
    hasWaypoints: state.hasWaypoints > 0,
    hasAircraft: state.hasAircraft,
    // AVIATION LOGIC: New flights don't have weather yet, only loaded flights do
    // So isReady should work without weather for new flight creation
    isReady: state.hasPolicy && state.hasWaypoints && state.hasAircraft
  };
}

export default useMasterFuelManager;