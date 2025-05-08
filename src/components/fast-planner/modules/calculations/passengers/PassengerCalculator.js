/**
 * PassengerCalculator.js
 * 
 * Module for calculating passenger capacity per leg based on aircraft usable load,
 * fuel requirements, and passenger weight settings.
 */

class PassengerCalculator {
  /**
   * Calculate the maximum number of passengers that can be carried on a leg
   * based on available usable load and fuel requirements
   * 
   * @param {Object} aircraft - The aircraft object with usable load info
   * @param {number} fuelWeight - The total fuel weight required for this leg (lbs)
   * @param {number} passengerWeight - The weight per passenger (lbs)
   * @returns {number} - The maximum number of passengers (integer)
   */
  static calculateMaxPassengers(aircraft, fuelWeight, passengerWeight) {
    // Validate inputs
    if (!aircraft || !aircraft.emptyWeight || !aircraft.maxTakeoffWeight) {
      console.error('PassengerCalculator: Invalid aircraft data provided');
      return 0;
    }

    // Ensure numeric inputs
    const fuelWeightNum = Number(fuelWeight) || 0;
    const passengerWeightNum = Number(passengerWeight) || 0;
    
    // If passenger weight is zero or invalid, return 0 to avoid division by zero
    if (passengerWeightNum <= 0) {
      console.error('PassengerCalculator: Invalid passenger weight (zero or negative)');
      return 0;
    }
    
    // Calculate usable load (max takeoff weight minus empty weight minus fuel)
    const usableLoadWithoutFuel = aircraft.maxTakeoffWeight - aircraft.emptyWeight - fuelWeightNum;
    
    // If usable load is negative, return 0 (can't carry passengers)
    if (usableLoadWithoutFuel <= 0) {
      console.log('PassengerCalculator: No usable load available for passengers');
      return 0;
    }
    
    // Calculate max passengers based on usable load and passenger weight
    const maxByWeight = Math.floor(usableLoadWithoutFuel / passengerWeightNum);
    
    // Limit by aircraft's maximum passenger capacity if available
    const aircraftMaxPax = aircraft.maxPassengers || Number.MAX_SAFE_INTEGER;
    
    // Return the lower value (can't exceed aircraft capacity)
    const result = Math.min(maxByWeight, aircraftMaxPax);
    
    console.log('PassengerCalculator result:', {
      usableLoadWithoutFuel,
      maxByWeight,
      aircraftMaxPax,
      result
    });
    
    return result;
  }
  
  /**
   * Calculate passenger capacity for all legs in a route
   * 
   * @param {Array} legs - Array of leg objects with fuel requirements
   * @param {Object} aircraft - The aircraft object with usable load info
   * @param {number} passengerWeight - The weight per passenger (lbs)
   * @returns {Array} - Array of passenger capacities for each leg
   */
  static calculatePassengersForRoute(legs, aircraft, passengerWeight) {
    if (!Array.isArray(legs) || legs.length === 0) {
      console.error('PassengerCalculator: Invalid legs data');
      return [];
    }
    
    return legs.map((leg, index) => {
      // Get the fuel required for this leg
      const fuelRequired = leg.totalFuel || leg.fuel || 0;
      
      // Calculate max passengers for this leg
      const maxPassengers = this.calculateMaxPassengers(
        aircraft,
        fuelRequired,
        passengerWeight
      );
      
      console.log(`PassengerCalculator: Leg ${index + 1} can carry ${maxPassengers} passengers`);
      
      return maxPassengers;
    });
  }
  
  /**
   * Update stopCards with passenger information
   * 
   * @param {Array} stopCards - Array of stop card objects to update
   * @param {Object} aircraft - The aircraft object
   * @param {number} passengerWeight - The weight per passenger (lbs)
   * @returns {Array} - Updated stopCards with passenger info
   */
  static updateStopCardsWithPassengers(stopCards, aircraft, passengerWeight) {
    if (!Array.isArray(stopCards) || stopCards.length === 0) {
      console.error('PassengerCalculator: Invalid stop cards data');
      return stopCards;
    }
    
    // Clone the input array to avoid modifying the original
    const updatedCards = [...stopCards];
    
    // Process each stop card
    updatedCards.forEach((card, index) => {
      // Get fuel for this stop (either directly or from fuel components)
      const fuelRequired = card.totalFuel || 
        (card.fuelComponentsObject ? 
          (card.fuelComponentsObject.tripFuel + 
           card.fuelComponentsObject.contingencyFuel + 
           card.fuelComponentsObject.taxiFuel + 
           card.fuelComponentsObject.deckFuel + 
           card.fuelComponentsObject.reserveFuel) : 0);
      
      // Calculate max passengers
      const maxPassengers = this.calculateMaxPassengers(
        aircraft,
        fuelRequired,
        passengerWeight
      );
      
      // Update the card with passenger info
      card.maxPassengers = maxPassengers;
      card.maxPassengersDisplay = maxPassengers.toString();
      
      console.log(`PassengerCalculator: Stop ${index + 1} (${card.stopName || 'Unknown'}) can carry ${maxPassengers} passengers`);
    });
    
    return updatedCards;
  }
}

export default PassengerCalculator;
