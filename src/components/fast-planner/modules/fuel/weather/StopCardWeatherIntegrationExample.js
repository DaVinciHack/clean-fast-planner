/**
 * StopCardWeatherIntegrationExample.js
 * 
 * Example demonstrating how ARA and approach fuel are properly distributed
 * across stop cards based on weather analysis.
 * 
 * This shows the correct implementation that you described:
 * - ARA fuel appears before rigs, gets consumed at rigs
 * - Approach fuel carries through entire remaining route
 */

import EnhancedStopCardCalculator from '../calculations/flight/EnhancedStopCardCalculator.js';

/**
 * Example showing proper ARA and approach fuel distribution
 */
export function demonstrateWeatherFuelDistribution() {
  // Example route: ENZV -> ENLE (rig) -> XCPC (rig) -> ENUG (rig) -> ENHF (airport)
  const waypoints = [
    { name: 'ENZV', type: 'airport', isairport: 'Yes' },
    { name: 'ENLE', type: 'rig', isairport: 'No', isRig: true },
    { name: 'XCPC', type: 'rig', isairport: 'No', isRig: true },
    { name: 'ENUG', type: 'rig', isairport: 'No', isRig: true },
    { name: 'ENHF', type: 'airport', isairport: 'Yes' }
  ];
  
  // Example weather segments showing different requirements
  const weatherSegments = [
    {
      airportIcao: 'ENZV',
      isRig: false,
      ranking2: 2  // No special fuel required
    },
    {
      airportIcao: 'ENLE',
      isRig: true,
      ranking2: 8  // Triggers ARA fuel for this rig
    },
    {
      airportIcao: 'XCPC',
      isRig: true,
      ranking2: 3  // No ARA fuel required
    },
    {
      airportIcao: 'ENUG',
      isRig: true,
      ranking2: 5  // Triggers ARA fuel for this rig
    },
    {
      airportIcao: 'ENHF',
      isRig: false,
      ranking2: 10 // Triggers approach fuel from here onwards
    }
  ];
  
  const aircraft = {
    cruiseSpeed: 120,
    fuelBurn: 1350,
    emptyWeight: 12500,
    maxTakeoffWeight: 17500
  };
  
  const options = {
    weatherSegments: weatherSegments,
    araFuelDefault: 200,
    approachFuelDefault: 200,
    passengerWeight: 220,
    taxiFuel: 50,
    contingencyFuelPercent: 10,
    reserveFuel: 500
  };
  
  // Calculate stop cards with weather integration
  const stopCards = EnhancedStopCardCalculator.calculateStopCards(
    waypoints,
    null, // No route stats for this example
    aircraft,
    { windSpeed: 10, windDirection: 180 },
    options
  );
  
  console.log("=== WEATHER FUEL DISTRIBUTION EXAMPLE ===");
  
  stopCards.forEach((card, index) => {
    const cardType = card.isDeparture ? 'DEPARTURE' : 
                     card.isDestination ? 'DESTINATION' : 'INTERMEDIATE';
    
    console.log(`\nCard ${index} (${cardType}): ${card.waypoint?.name || 'Unknown'}`);
    console.log(`Total Fuel: ${card.totalFuel} lbs`);
    
    if (card.fuelComponentsObject) {
      console.log("Fuel Components:");
      console.log(`  Trip: ${card.fuelComponentsObject.trip || 0} lbs`);
      console.log(`  Contingency: ${card.fuelComponentsObject.contingency || 0} lbs`);
      console.log(`  Reserve: ${card.fuelComponentsObject.reserve || 0} lbs`);
      console.log(`  ARA: ${card.fuelComponentsObject.araFuel || 0} lbs`);
      console.log(`  Approach: ${card.fuelComponentsObject.approachFuel || 0} lbs`);
      console.log(`  Deck: ${card.fuelComponentsObject.deck || 0} lbs`);
    }
    
    // Explain the ARA fuel logic
    if (card.fuelComponentsObject?.araFuel > 0) {
      const araAmount = card.fuelComponentsObject.araFuel;
      if (araAmount === 400) {
        console.log(`  ✈️ ARA Explanation: Carrying ${araAmount} lbs for 2 upcoming rigs (ENLE + ENUG)`);
      } else if (araAmount === 200) {
        console.log(`  ✈️ ARA Explanation: Carrying ${araAmount} lbs for 1 upcoming rig`);
      }
    }
    
    // Explain the approach fuel logic
    if (card.fuelComponentsObject?.approachFuel > 0) {
      console.log(`  🛬 Approach Explanation: Carrying ${card.fuelComponentsObject.approachFuel} lbs for airport ENHF (required from here onwards)`);
    }
  });
  
  console.log("\n=== EXPECTED FUEL DISTRIBUTION ===");
  console.log("Card 0 (ENZV - Departure): ARA=400 (for ENLE+ENUG), Approach=0");
  console.log("Card 1 (ENLE - Rig Stop): ARA=200 (for ENUG only, ENLE ARA consumed), Approach=0");
  console.log("Card 2 (XCPC - Rig Stop): ARA=200 (for ENUG only), Approach=0");
  console.log("Card 3 (ENUG - Rig Stop): ARA=0 (ENUG ARA consumed), Approach=200 (ENHF approach starts)");
  console.log("Card 4 (ENHF - Destination): ARA=0, Approach=200 (carried through)");
  
  return stopCards;
}

/**
 * Example showing manual fuel override when weather APIs fail
 */
export function demonstrateManualFuelOverride() {
  console.log("\n=== MANUAL FUEL OVERRIDE EXAMPLE ===");
  
  // Same route as above
  const waypoints = [
    { name: 'ENZV', type: 'airport' },
    { name: 'ENLE', type: 'rig', isRig: true },
    { name: 'ENHF', type: 'airport' }
  ];
  
  const aircraft = {
    cruiseSpeed: 120,
    fuelBurn: 1350,
    emptyWeight: 12500,
    maxTakeoffWeight: 17500
  };
  
  // Manual fuel settings when weather APIs fail
  const manualOptions = {
    weatherSegments: [], // No weather data available
    passengerWeight: 220,
    taxiFuel: 50,
    contingencyFuelPercent: 10,
    reserveFuel: 500,
    // Manual overrides
    araFuel: 200,        // Pilot manually adds ARA fuel for rig
    approachFuel: 200,   // Pilot manually adds approach fuel
    deckFuelPerStop: 150 // Pilot manually sets deck fuel
  };
  
  const stopCards = EnhancedStopCardCalculator.calculateStopCards(
    waypoints,
    null,
    aircraft,
    { windSpeed: 0, windDirection: 0 },
    manualOptions
  );
  
  console.log("Manual fuel override ensures flight safety even without weather data");
  stopCards.forEach((card, index) => {
    console.log(`Card ${index}: ${card.waypoint?.name} - Total: ${card.totalFuel} lbs`);
  });
  
  return stopCards;
}

/**
 * Example showing comparison with imported Palantir fuel
 */
export function demonstratePalantirComparison() {
  console.log("\n=== PALANTIR FUEL COMPARISON EXAMPLE ===");
  
  // Example imported fuel data from Palantir
  const palantirFuelData = {
    stopLocations: ['ENZV', 'ENLE', 'ENHF'],
    stopRequiredFuels: [2500, 1800, 500],
    stopAraFuels: [200, 0, 0],
    stopApproachFuels: [0, 200, 200],
    stopTripFuels: [1200, 800, 0],
    stopContingencyFuels: [120, 80, 0],
    stopReserveFuels: [500, 500, 500]
  };
  
  // Our calculated fuel data
  const calculatedFuelData = {
    stopLocations: ['ENZV', 'ENLE', 'ENHF'],
    stopRequiredFuels: [2480, 1820, 500],
    stopAraFuels: [200, 0, 0],
    stopApproachFuels: [0, 200, 200],
    stopTripFuels: [1200, 800, 0],
    stopContingencyFuels: [120, 80, 0],
    stopReserveFuels: [500, 500, 500]
  };
  
  console.log("Comparing fuel calculations:");
  console.log("Location | Palantir | Calculated | Difference");
  console.log("---------|----------|------------|----------");
  
  palantirFuelData.stopLocations.forEach((location, i) => {
    const palantirFuel = palantirFuelData.stopRequiredFuels[i];
    const calculatedFuel = calculatedFuelData.stopRequiredFuels[i];
    const difference = Math.abs(palantirFuel - calculatedFuel);
    const status = difference <= 50 ? "✅ MATCH" : "⚠️ DIFF";
    
    console.log(`${location.padEnd(8)} | ${palantirFuel.toString().padEnd(8)} | ${calculatedFuel.toString().padEnd(10)} | ${difference} lbs ${status}`);
  });
  
  return {
    palantirFuelData,
    calculatedFuelData,
    maxDifference: Math.max(...palantirFuelData.stopRequiredFuels.map((pf, i) => 
      Math.abs(pf - calculatedFuelData.stopRequiredFuels[i])
    ))
  };
}

export default {
  demonstrateWeatherFuelDistribution,
  demonstrateManualFuelOverride,
  demonstratePalantirComparison
};