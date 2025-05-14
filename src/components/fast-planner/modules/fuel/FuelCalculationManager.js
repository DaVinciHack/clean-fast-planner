/**
 * FuelCalculationManager.js
 * 
 * Primary module for coordinating fuel calculations across the application.
 * Acts as a facade for the various calculation modules and maintains state.
 */

import TripFuelCalculator from './TripFuelCalculator';
import AuxiliaryFuelCalculator from './AuxiliaryFuelCalculator';

class FuelCalculationManager {
  constructor() {
    this.tripFuelCalculator = new TripFuelCalculator();
    this.auxiliaryFuelCalculator = new AuxiliaryFuelCalculator();
    
    // Default values - will be overridden by settings
    this.settings = {
      taxiFuel: 50,                  // lbs
      contingencyFuelPercent: 10,    // % of trip fuel
      reserveMethod: 'fixed',        // 'fixed' or 'percent'
      reserveFuel: 500,              // lbs for fixed reserve
      reserveFuelPercent: 10,        // % for percent reserve
      deckFuelPerStop: 100,          // lbs of additional fuel at deck
      deckFuelFlow: 400,             // lbs/hr for hover/deck operations
      deckTimePerStop: 5,            // minutes spent at deck per stop
      approachFuel: 0,               // lbs for approach
      alternateDistance: 0,          // nm to alternate
      alternateFuelFlow: 0,          // lbs/hr to alternate
      alternateTime: 0,              // minutes to alternate
      passengerWeight: 220           // lbs per passenger
    };
    
    // Current calculation state
    this.state = {
      aircraft: null,
      waypoints: [],
      fuelResults: [],
      passengerCapacity: [],
      maxPayload: 0,
      maxFuel: 0
    };
  }
  
  /**
   * Update settings for fuel calculations
   * @param {Object} newSettings - Updated settings object
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Re-run calculations if we have waypoints
    if (this.state.waypoints.length > 0 && this.state.aircraft) {
      this.calculateFuelRequirements(
        this.state.aircraft,
        this.state.waypoints
      );
    }
  }
  
  /**
   * Update the current aircraft
   * @param {Object} aircraft - Aircraft object with performance data
   */
  setAircraft(aircraft) {
    if (!aircraft) return;
    
    this.state.aircraft = aircraft;
    
    // Extract aircraft-specific data
    this.state.maxFuel = aircraft.maxFuel || 0;
    this.state.maxPayload = aircraft.maxPayload || 0;
    this.tripFuelCalculator.setAircraftPerformance({
      cruiseFuelFlow: aircraft.cruiseFuelFlow || 0,
      cruiseSpeed: aircraft.cruiseSpeed || 0
    });
    
    // Re-run calculations if we have waypoints
    if (this.state.waypoints.length > 0) {
      this.calculateFuelRequirements(aircraft, this.state.waypoints);
    }
  }
  
  /**
   * Set waypoints and recalculate fuel
   * @param {Array} waypoints - Array of waypoint objects
   */
  setWaypoints(waypoints) {
    if (!waypoints || waypoints.length < 2) return;
    
    this.state.waypoints = waypoints;
    
    // Re-run calculations if we have an aircraft
    if (this.state.aircraft) {
      this.calculateFuelRequirements(this.state.aircraft, waypoints);
    }
  }
  
  /**
   * Main calculation method that orchestrates all fuel calculations
   * @param {Object} aircraft - Aircraft object
   * @param {Array} waypoints - Array of waypoint objects
   * @returns {Object} Calculated fuel requirements and passenger capacity
   */
  calculateFuelRequirements(aircraft, waypoints) {
    if (!aircraft || !waypoints || waypoints.length < 2) return null;
    
    // Always store current state
    this.state.aircraft = aircraft;
    this.state.waypoints = waypoints;
    
    // Calculate trip fuel for each leg
    const tripFuel = this.tripFuelCalculator.calculateTripFuel(waypoints);
    
    // Calculate taxi, contingency, reserve, etc.
    const auxiliaryFuel = this.auxiliaryFuelCalculator.calculateAuxiliaryFuel(
      tripFuel,
      this.settings,
      waypoints.length - 1 // Number of stops
    );
    
    // Combine results
    const fuelResults = this.combineResults(tripFuel, auxiliaryFuel, waypoints);
    
    // Calculate passenger capacity based on fuel load
    const passengerCapacity = this.calculatePassengerCapacity(
      fuelResults,
      aircraft,
      this.settings.passengerWeight
    );
    
    // Update state
    this.state.fuelResults = fuelResults;
    this.state.passengerCapacity = passengerCapacity;
    
    return {
      fuelResults,
      passengerCapacity
    };
  }
  
  /**
   * Combines trip and auxiliary fuel calculations into a complete result set
   * @param {Array} tripFuel - Trip fuel calculations per leg
   * @param {Object} auxiliaryFuel - Auxiliary fuel calculations
   * @param {Array} waypoints - Waypoints for the route
   * @returns {Array} Complete fuel results for each stop
   */
  combineResults(tripFuel, auxiliaryFuel, waypoints) {
    const results = [];
    
    // Calculate accumulated fuel required at each waypoint
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];
      const isLastStop = i === waypoints.length - 1;
      const isFirstStop = i === 0;
      
      // Default values
      let requiredFuel = 0;
      let fuelComponents = {};
      
      if (isLastStop) {
        // Final stop - only needs reserve (which might be 0 depending on config)
        requiredFuel = auxiliaryFuel.reserve;
        fuelComponents = {
          reserve: auxiliaryFuel.reserve,
          extra: 0,
          fullContingency: auxiliaryFuel.contingency // for display only
        };
      } else {
        // Calculate how much fuel is needed from this point forward
        let remainingTripFuel = 0;
        for (let j = i; j < tripFuel.length; j++) {
          remainingTripFuel += tripFuel[j].fuel;
        }
        
        // Calculate auxiliary fuel for remaining legs
        const remainingLegs = tripFuel.length - i;
        const remainingContingency = (auxiliaryFuel.contingencyPercent / 100) * remainingTripFuel;
        
        // Calculate deck fuel for remaining stops
        const remainingStops = waypoints.length - i - 1;
        const remainingDeckFuel = remainingStops * auxiliaryFuel.deckFuelPerStop;
        
        // Taxi fuel only applies at first stop
        const taxiFuel = isFirstStop ? auxiliaryFuel.taxi : 0;
        
        // Sum up all components
        requiredFuel = remainingTripFuel + 
                        remainingContingency + 
                        remainingDeckFuel + 
                        auxiliaryFuel.reserve + 
                        taxiFuel;
        
        // Store components for display
        fuelComponents = {
          trip: remainingTripFuel,
          contingency: remainingContingency,
          reserve: auxiliaryFuel.reserve,
          deck: remainingDeckFuel,
          taxi: taxiFuel
        };
      }
      
      // Store result for this waypoint
      results.push({
        waypoint: waypoint.name || `Stop ${i + 1}`,
        requiredFuel: Math.round(requiredFuel),
        fuelComponents: fuelComponents,
        legs: i < tripFuel.length ? tripFuel[i] : null,
        isLastStop
      });
    }
    
    return results;
  }
  
  /**
   * Calculate passenger capacity based on fuel requirements
   * @param {Array} fuelResults - Calculated fuel requirements
   * @param {Object} aircraft - Aircraft data
   * @param {Number} passengerWeight - Weight per passenger
   * @returns {Array} Passenger capacity at each waypoint
   */
  calculatePassengerCapacity(fuelResults, aircraft, passengerWeight) {
    // Get aircraft limitations
    const maxTakeoffWeight = aircraft.maxTakeoffWeight || 0;
    const emptyWeight = aircraft.emptyWeight || 0;
    const maxFuel = aircraft.maxFuel || 0;
    const maxPayload = aircraft.maxPayload || 0;
    
    // Calculate capacity at each stop
    return fuelResults.map(result => {
      const fuelWeight = result.requiredFuel;
      
      // Make sure we don't exceed max fuel
      const actualFuel = Math.min(fuelWeight, maxFuel);
      
      // Calculate available payload
      const availablePayload = Math.min(
        maxPayload,
        maxTakeoffWeight - emptyWeight - actualFuel
      );
      
      // Calculate max passengers (floor to be conservative)
      const maxPassengers = Math.floor(availablePayload / passengerWeight);
      
      // Calculate max weight (for display)
      const maxPassengerWeight = maxPassengers * passengerWeight;
      
      return {
        waypoint: result.waypoint,
        maxPassengers,
        maxPassengerWeight,
        availablePayload,
        fuelWeight: actualFuel,
        isLastStop: result.isLastStop
      };
    });
  }
  
  /**
   * Get current calculation results
   * @returns {Object} Current fuel calculation results
   */
  getResults() {
    return {
      fuelResults: this.state.fuelResults,
      passengerCapacity: this.state.passengerCapacity,
      settings: this.settings,
      aircraft: this.state.aircraft,
      waypoints: this.state.waypoints
    };
  }
  
  /**
   * Find the maximum passenger capacity for the route
   * Identifies the limiting stop/waypoint
   * @returns {Object} Maximum passenger capacity data
   */
  getMaximumPassengerCapacity() {
    if (!this.state.passengerCapacity.length) return null;
    
    // Find the limiting waypoint (lowest max passengers)
    let lowestCapacity = Number.MAX_SAFE_INTEGER;
    let limitingWaypoint = null;
    
    this.state.passengerCapacity.forEach(capacity => {
      if (capacity.maxPassengers < lowestCapacity && !capacity.isLastStop) {
        lowestCapacity = capacity.maxPassengers;
        limitingWaypoint = capacity.waypoint;
      }
    });
    
    // If we couldn't find a limiting waypoint, return null
    if (!limitingWaypoint) return null;
    
    // Get the minimum passenger capacity that works for the whole route
    // and the first waypoint's fuel requirement 
    const routeMaxPassengers = lowestCapacity;
    const routeRequiredFuel = this.state.fuelResults[0].requiredFuel;
    
    // Compile results
    return {
      maxPassengers: routeMaxPassengers,
      maxPassengerWeight: routeMaxPassengers * this.settings.passengerWeight,
      requiredFuel: routeRequiredFuel,
      limitingWaypoint,
      // Include a breakdown of fuel components
      fuelComponents: this.state.fuelResults[0].fuelComponents
    };
  }
}

export default FuelCalculationManager;