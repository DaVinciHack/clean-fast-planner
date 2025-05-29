/**
 * Fuel Calculation Modules Index
 * 
 * Central export point for all fuel calculation modules
 */

import FuelCalculationManager from './FuelCalculationManager';
import TripFuelCalculator from './TripFuelCalculator';
import AuxiliaryFuelCalculator from './AuxiliaryFuelCalculator';
import EnhancedFuelManager from './EnhancedFuelManager';
import WeatherFuelAnalyzer from './weather/WeatherFuelAnalyzer';
import ManualFuelOverride from './weather/ManualFuelOverride';

export {
  FuelCalculationManager,
  TripFuelCalculator,
  AuxiliaryFuelCalculator,
  EnhancedFuelManager,
  WeatherFuelAnalyzer,
  ManualFuelOverride
};

// Export an enhanced instance as default for weather-aware fuel calculations
export default new EnhancedFuelManager();