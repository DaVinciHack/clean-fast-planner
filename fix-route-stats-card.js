// ISSUE: RouteStatsCard might not be using the values from FlightCalculations correctly
// FIX: Modify it to prioritize using the values directly from the stats object

// For file: /src/components/fast-planner/components/RouteStatsCard.jsx
// Look around line ~60 for things like:
//   const totalDeckTime = landingsCount * deckTimePerStop;
//   const totalDeckFuel = landingsCount * deckFuelPerStop;

// Fix these to use the values from the stats object:

// 1. For Deck Time - replace:
const totalDeckTime = landingsCount * deckTimePerStop;
// with:
const totalDeckTime = stats.deckTimeMinutes || (landingsCount * deckTimePerStop);

// 2. For Deck Fuel - replace:
const totalDeckFuel = landingsCount * deckFuelPerStop;
// with:
const totalDeckFuel = stats.deckFuel || (landingsCount * deckFuelPerStop);

// 3. For Total Fuel - replace any manual calculation with:
const totalFuel = stats.totalFuel || (stats.tripFuel + stats.deckFuel + stats.contingencyFuel + stats.taxiFuel + stats.reserveFuel) || (parseInt(stats.fuelRequired || 0) + totalDeckFuel);

// 4. For calculateMaxPassengers - replace:
const calculateMaxPassengers = () => {
  if (!selectedAircraft || !stats.usableLoad) return 0;
  
  // Get max passengers from the aircraft data or calculate based on usable load
  const maxByLoad = Math.floor(stats.usableLoad / passengerWeight);
  const aircraftMaxPax = selectedAircraft.maxPassengers || 19;
  
  // Return the lower value (can't exceed aircraft capacity)
  return Math.min(maxByLoad, aircraftMaxPax);
};
// with:
const calculateMaxPassengers = () => {
  // If we have calculatedPassengers from the flight calculator, use that
  if (stats.calculatedPassengers !== undefined) {
    return stats.calculatedPassengers;
  }
  
  // Otherwise calculate manually as a fallback
  if (!selectedAircraft || !stats.usableLoad) return 0;
  
  // Get max passengers from the aircraft data or calculate based on usable load
  const maxByLoad = Math.floor(stats.usableLoad / passengerWeight);
  const aircraftMaxPax = selectedAircraft.maxPassengers || 19;
  
  // Return the lower value (can't exceed aircraft capacity)
  return Math.min(maxByLoad, aircraftMaxPax);
};

// 5. Add debugging information
// Near the top of the component, add:
console.log("RouteStatsCard - received stats:", routeStats);
