/**
 * Fuel Calculation Modules Index
 * 
 * Central export point for all fuel calculation modules
 */

import FuelCalculationManager from './FuelCalculationManager';
import TripFuelCalculator from './TripFuelCalculator';
import AuxiliaryFuelCalculator from './AuxiliaryFuelCalculator';

export {
  FuelCalculationManager,
  TripFuelCalculator,
  AuxiliaryFuelCalculator
};

// Export a default instance for easy import and use
export default new FuelCalculationManager();