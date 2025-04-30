/**
 * Flight Calculations Module
 * 
 * A dedicated module for performing all flight-related calculations including:
 * - Fuel requirements and consumption
 * - Passenger capacity based on load
 * - Flight timing with future wind calculations
 */

class FlightCalculations {
  constructor() {
    // Default values for calculations
    this.defaults = {
      passengerWeight: 220, // lbs per passenger including baggage
      contingencyFuelPercent: 10, // 10% contingency fuel
      taxiFuel: 50, // lbs
      reserveFuel: 600, // lbs
      deckTimePerStop: 5, // minutes
      deckFuelFlow: 400, // lbs per hour during deck operations
      callbacks: {} // For notifying UI of calculation results
    };
    
    // Current configuration, initialized with defaults
    this.config = {...this.defaults};
    
    console.log("FlightCalculations initialized with defaults:", this.config);
  }
  
  /**
   * Update configuration settings
   * 
   * @param {Object} newConfig Configuration parameters to update
   */
  updateConfig(newConfig) {