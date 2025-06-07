import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { FinanceCalculator } from '../modules';
import { useRoute } from './RouteContext';

// Create the context
const FinanceContext = createContext(null);

/**
 * FinanceProvider component
 * Manages finance calculations and state
 */
export const FinanceProvider = ({ children }) => {
  // Finance settings state
  const [financeSettings, setFinanceSettings] = useState({
    hourlyRate: 4500,         // USD per hour
    landingFee: 250,          // USD per landing
    fuelCost: 3.25,           // USD per lb
    billingMethod: 'hourly',  // 'hourly', 'fixed', or 'mileage'
    mileageRate: 100,         // USD per nm (only used for mileage billing)
    fixedPrice: 25000         // USD (only used for fixed price billing)
  });
  
  // Finance calculation results
  const [financeResults, setFinanceResults] = useState(null);
  
  // Get route context for route statistics
  const { routeStats } = useRoute();
  
  // Create finance calculator instance
  const [financeCalculatorInstance, setFinanceCalculatorInstance] = useState(null);

  // Initialize finance calculator
  useEffect(() => {
    const financeCalculator = new FinanceCalculator();
    
    // Set up callback
    financeCalculator.setCallback('onCalculationComplete', (results) => {
      setFinanceResults(results);
    });
    
    // Initialize with current settings
    financeCalculator.updateSettings(financeSettings);
    
    setFinanceCalculatorInstance(financeCalculator);
  }, []);

  // Update finance settings
  useEffect(() => {
    if (financeCalculatorInstance) {
      financeCalculatorInstance.updateSettings(financeSettings);
    }
  }, [financeCalculatorInstance, financeSettings]);

  // Calculate finance when route stats change
  useEffect(() => {
    if (financeCalculatorInstance && routeStats) {
      financeCalculatorInstance.calculateFinance(routeStats);
    } else if (!routeStats) {
      // Clear finance results when no route stats
      setFinanceResults(null);
    }
  }, [financeCalculatorInstance, routeStats]);

  // Handler for updating hourly rate
  const updateHourlyRate = useCallback((value) => {
    setFinanceSettings(prev => ({
      ...prev,
      hourlyRate: Number(value)
    }));
  }, []);

  // Handler for updating landing fee
  const updateLandingFee = useCallback((value) => {
    setFinanceSettings(prev => ({
      ...prev,
      landingFee: Number(value)
    }));
  }, []);

  // Handler for updating fuel cost
  const updateFuelCost = useCallback((value) => {
    setFinanceSettings(prev => ({
      ...prev,
      fuelCost: Number(value)
    }));
  }, []);

  // Handler for updating billing method
  const updateBillingMethod = useCallback((value) => {
    setFinanceSettings(prev => ({
      ...prev,
      billingMethod: value
    }));
  }, []);
  
  // Handler for updating mileage rate
  const updateMileageRate = useCallback((value) => {
    setFinanceSettings(prev => ({
      ...prev,
      mileageRate: Number(value)
    }));
  }, []);
  
  // Handler for updating fixed price
  const updateFixedPrice = useCallback((value) => {
    setFinanceSettings(prev => ({
      ...prev,
      fixedPrice: Number(value)
    }));
  }, []);
  
  // Handler to recalculate finance with current settings and route stats
  const calculateFinance = useCallback(() => {
    if (financeCalculatorInstance && routeStats) {
      return financeCalculatorInstance.calculateFinance(routeStats);
    }
    return null;
  }, [financeCalculatorInstance, routeStats]);

  // Provider value object
  const value = {
    financeSettings,
    financeResults,
    updateHourlyRate,
    updateLandingFee,
    updateFuelCost,
    updateBillingMethod,
    updateMileageRate,
    updateFixedPrice,
    calculateFinance,
    financeCalculator: financeCalculatorInstance
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook for using the finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export default FinanceContext;