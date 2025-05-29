/**
 * CORRECTED Weather Fuel Distribution Example
 * 
 * This shows the CORRECT approach fuel logic as explained:
 * - Approach fuel is needed for ALL airports from the beginning
 * - It gets "consumed" only when you've completed your visit to that airport
 * - ARA fuel works the same way but for rigs
 */

export function demonstrateCorrectWeatherFuelLogic() {
  console.log("=== CORRECTED WEATHER FUEL DISTRIBUTION ===");
  
  // Example route: ENZV → ENLE (rig) → ENZV → ENCN (airport)
  // Weather: Bad at both airports (ENZV and ENCN), bad at rig (ENLE)
  const waypoints = [
    { name: 'ENZV', type: 'airport', isairport: 'Yes' },    // Index 0 - departure
    { name: 'ENLE', type: 'rig', isairport: 'No', isRig: true },   // Index 1 - rig
    { name: 'ENZV', type: 'airport', isairport: 'Yes' },    // Index 2 - return to ENZV  
    { name: 'ENCN', type: 'airport', isairport: 'Yes' }     // Index 3 - final destination
  ];
  
  const weatherSegments = [
    {
      airportIcao: 'ENZV',
      isRig: false,
      ranking2: 10  // Triggers approach fuel for ENZV
    },
    {
      airportIcao: 'ENLE',
      isRig: true,
      ranking2: 8   // Triggers ARA fuel for ENLE
    },
    {
      airportIcao: 'ENCN',
      isRig: false,
      ranking2: 5   // Triggers approach fuel for ENCN
    }
  ];
  
  console.log("\n=== WEATHER ANALYSIS ===");
  console.log("ARA Required: ENLE rig (200 lbs)");
  console.log("Approach Required: ENZV airport (200 lbs) + ENCN airport (200 lbs)");
  console.log("Total per-airport approach fuel: 400 lbs from start");
  
  console.log("\n=== CORRECT STOP CARD FUEL DISTRIBUTION ===");
  
  // Simulating the correct logic:
  const araFuelPerRig = 200;
  const approachFuelPerAirport = 200;
  
  const stopCards = [
    {
      waypoint: { name: 'ENZV' },
      cardType: 'DEPARTURE',
      waypointIndex: 0,
      baseFuel: 2000
    },
    {
      waypoint: { name: 'ENLE' },
      cardType: 'INTERMEDIATE',
      waypointIndex: 1,
      baseFuel: 1500
    },
    {
      waypoint: { name: 'ENZV' },
      cardType: 'INTERMEDIATE', 
      waypointIndex: 2,
      baseFuel: 1000
    },
    {
      waypoint: { name: 'ENCN' },
      cardType: 'DESTINATION',
      waypointIndex: 3,
      baseFuel: 500
    }
  ];
  
  // Apply the CORRECTED logic
  stopCards.forEach((card, cardIndex) => {
    const waypointIndex = card.waypointIndex;
    let araFuel = 0;
    let approachFuel = 0;
    
    // ARA FUEL LOGIC (unchanged - this was correct)
    // ENLE rig is at index 1, needs ARA fuel
    if (waypointIndex < 1) { // Before reaching ENLE
      araFuel += araFuelPerRig; // 200 lbs for ENLE
    }
    
    // APPROACH FUEL LOGIC (CORRECTED)
    // ENZV airport appears at indices 0 and 2 - need approach fuel until after index 2
    if (waypointIndex <= 2) { // Still need ENZV approach fuel
      approachFuel += approachFuelPerAirport; // 200 lbs for ENZV
    }
    
    // ENCN airport appears at index 3 - need approach fuel until after index 3
    if (waypointIndex <= 3) { // Still need ENCN approach fuel
      approachFuel += approachFuelPerAirport; // 200 lbs for ENCN
    }
    
    const totalWeatherFuel = araFuel + approachFuel;
    const totalFuel = card.baseFuel + totalWeatherFuel;
    
    console.log(`\nCard ${cardIndex} (${card.cardType}): ${card.waypoint.name}`);
    console.log(`  Base Fuel: ${card.baseFuel} lbs`);
    console.log(`  ARA Fuel: ${araFuel} lbs ${araFuel > 0 ? '(for ENLE rig)' : '(ENLE consumed)'}`);
    console.log(`  Approach Fuel: ${approachFuel} lbs`);
    
    if (approachFuel === 400) {
      console.log(`    - 200 lbs for ENZV (future visit at index 2)`);
      console.log(`    - 200 lbs for ENCN (future visit at index 3)`);
    } else if (approachFuel === 200 && waypointIndex === 2) {
      console.log(`    - 200 lbs for ENCN (ENZV approach consumed)`);
    } else if (approachFuel === 200 && waypointIndex === 3) {
      console.log(`    - 200 lbs for ENCN (carried to destination)`);
    }
    
    console.log(`  TOTAL FUEL: ${totalFuel} lbs`);
  });
  
  console.log("\n=== KEY INSIGHT ===");
  console.log("✅ Approach fuel starts at 400 lbs (200 for each airport)");
  console.log("✅ At card 0 (ENZV departure): Need approach for both ENZV return AND ENCN");
  console.log("✅ At card 2 (ENZV return): ENZV approach consumed, still need ENCN approach");
  console.log("✅ At card 3 (ENCN): ENCN approach carried through to destination");
  
  return stopCards;
}

/**
 * Even more complex example to really demonstrate the logic
 */
export function demonstrateComplexRouteExample() {
  console.log("\n\n=== COMPLEX ROUTE EXAMPLE ===");
  console.log("Route: ENZV → ENLE → ENZV → ENLE → ENCN → ENZV");
  console.log("Weather: Bad at all locations");
  
  const waypoints = [
    { name: 'ENZV', index: 0 }, // Departure
    { name: 'ENLE', index: 1 }, // First rig visit
    { name: 'ENZV', index: 2 }, // Return to ENZV
    { name: 'ENLE', index: 3 }, // Second rig visit  
    { name: 'ENCN', index: 4 }, // Airport visit
    { name: 'ENZV', index: 5 }  // Final return
  ];
  
  console.log("\nWeather Requirements:");
  console.log("- ENLE rig: ARA fuel needed");
  console.log("- ENZV airport: Approach fuel needed (appears at indices 0, 2, 5)");
  console.log("- ENCN airport: Approach fuel needed (appears at index 4)");
  
  console.log("\nCorrect Fuel Distribution:");
  
  waypoints.forEach((wp, cardIndex) => {
    let araFuel = 0;
    let approachFuel = 0;
    
    // ARA for ENLE rig (at indices 1 and 3)
    const futureEnleVisits = [1, 3].filter(idx => cardIndex < idx);
    if (futureEnleVisits.length > 0) {
      araFuel = 200; // One ARA fuel amount covers all visits to same rig
    }
    
    // Approach for ENZV (at indices 0, 2, 5) 
    const futureEnzvVisits = [0, 2, 5].filter(idx => cardIndex < idx);
    if (futureEnzvVisits.length > 0) {
      approachFuel += 200;
    }
    
    // Approach for ENCN (at index 4)
    const futureEncnVisits = [4].filter(idx => cardIndex < idx);
    if (futureEncnVisits.length > 0) {
      approachFuel += 200;
    }
    
    console.log(`Card ${cardIndex} (${wp.name}): ARA=${araFuel}, Approach=${approachFuel}`);
  });
  
  return waypoints;
}

export default {
  demonstrateCorrectWeatherFuelLogic,
  demonstrateComplexRouteExample
};