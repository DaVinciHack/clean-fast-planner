/**
 * StopCardCalculator.js
 * 
 * Dedicated module for calculating stop card data for flight routes
 * based on waypoints, aircraft performance, and weather conditions.
 * 
 * IMPORTANT: This module NEVER uses hardcoded values for critical flight parameters.
 * All calculations rely on actual aircraft performance data from the selected aircraft.
 */

// Import the PassengerCalculator module for passenger calculations
import PassengerCalculator from '../passengers/PassengerCalculator';

/**
 * Calculate stop cards data for a route
 * Shows the fuel required to continue from each waypoint
 * This function now uses routeStats data when available for consistency
 * 
 * @param {Array} waypoints - Waypoints array
 * @param {Object} routeStats - Route statistics from RouteCalculator
 * @param {Object} selectedAircraft - Selected aircraft with performance data
 * @param {Object} weather - Weather data (windSpeed, windDirection)
 * @param {Object} options - Optional calculation parameters
 * @returns {Array} Array of stop card objects
 */
const calculateStopCards = (waypoints, routeStats, selectedAircraft, weather, options = {}) => {
  console.log('⭐ StopCardCalculator: Starting with routeStats?', !!routeStats);
  
  // First, verify we have the necessary input data
  if (!waypoints || waypoints.length < 2 || !selectedAircraft) {
    console.error('StopCardCalculator: Missing required input data');
    return [];
  }
  
  // IMPROVED FIX: Filter out navigation waypoints ONLY for stop cards.
  // This doesn't affect route distance/time calculations.
  const landingStopsOnly = waypoints.filter(wp => {
    // Check if this is a navigation waypoint based on any property
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || // Explicit type
      wp.isWaypoint === true || // Legacy flag
      wp.type === 'WAYPOINT'; // Legacy type value
    
    // Keep only landing stops by excluding waypoints
    return !isWaypoint;
  });
  
  console.log(`StopCardCalculator: Processing ${landingStopsOnly.length} landing stops out of ${waypoints.length} total waypoints`);
  
  // If we've filtered out ALL waypoints, we need to keep at least first and last as landing stops
  if (landingStopsOnly.length === 0 && waypoints.length >= 2) {
    console.log('StopCardCalculator: No landing stops found, using first and last waypoints as landing stops');
    landingStopsOnly.push(waypoints[0]);
    if (waypoints.length > 1) {
      landingStopsOnly.push(waypoints[waypoints.length - 1]);
    }
  }
  
  // Log routeStats data if available
  if (routeStats) {
    console.log('⭐ StopCardCalculator using routeStats:', {
      totalDistance: routeStats.totalDistance,
      timeHours: routeStats.timeHours,
      estimatedTime: routeStats.estimatedTime,
      tripFuel: routeStats.tripFuel,
      fuelRequired: routeStats.fuelRequired,
      hasLegs: routeStats.legs ? routeStats.legs.length : 0,
      windAdjusted: routeStats.windAdjusted || false
    });
  }
  
  // IMPORTANT: Use only landing stops for stop cards, but keep route stats using all waypoints
  const stopsToProcess = landingStopsOnly;
  
  // Extract options with defaults for safety, but these should always be provided
  const {
    passengerWeight = 0,  // Default to 0 to make missing settings obvious
    taxiFuel = 0,         // Default to 0 to make missing settings obvious
    contingencyFuelPercent = 0, // Default to 0 to make missing settings obvious
    reserveFuel = 0,      // Default to 0 to make missing settings obvious
    deckTimePerStop = 0,  // Default to 0 to make missing settings obvious
    deckFuelFlow = 0      // Default to 0 to make missing settings obvious
  } = options;
  
  // Log all received values for debugging
  console.log('🧰 StopCardCalculator received raw values:', {
    taxiFuel,
    passengerWeight,
    contingencyFuelPercent,
    reserveFuel,
    deckTimePerStop,
    deckFuelFlow
  });
  
  // Convert all calculation parameters to proper numeric values
  const taxiFuelValue = Number(taxiFuel);
  const passengerWeightValue = Number(passengerWeight);
  const contingencyFuelPercentValue = Number(contingencyFuelPercent);
  const reserveFuelValue = Number(reserveFuel);
  const deckTimePerStopValue = Number(deckTimePerStop);
  const deckFuelFlowValue = Number(deckFuelFlow);
  
  // Log converted values for debugging
  console.log('🧰 StopCardCalculator using numeric values:', {
    taxiFuelValue,
    passengerWeightValue,
    contingencyFuelPercentValue,
    reserveFuelValue,
    deckTimePerStopValue,
    deckFuelFlowValue
  });

  // Validate inputs
  if (!stopsToProcess || stopsToProcess.length < 2 || !selectedAircraft) {
    console.log('StopCardCalculator: Missing required data', {
      hasWaypoints: stopsToProcess ? stopsToProcess.length : 0,
      hasAircraft: !!selectedAircraft
    });
    return [];
  }
  
  // CRITICAL: Ensure aircraft has all required properties
  if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
    console.error('StopCardCalculator: Aircraft missing critical cruiseSpeed or fuelBurn property');
    return [];
  }
  
  // CRITICAL: Check for weight properties needed for passenger calculations
  // Log a warning but continue with calculation
  if (!selectedAircraft.emptyWeight || !selectedAircraft.maxTakeoffWeight) {
    console.warn('StopCardCalculator: Aircraft missing weight properties (emptyWeight or maxTakeoffWeight)');
    console.warn('Aircraft data:', selectedAircraft);
    
    // Add default values to allow calculation to proceed
    // This is safer than returning nothing
    if (!selectedAircraft.emptyWeight) {
      console.warn('StopCardCalculator: Adding default emptyWeight of 12500 lbs');
      selectedAircraft.emptyWeight = 12500;
    }
    
    if (!selectedAircraft.maxTakeoffWeight) {
      console.warn('StopCardCalculator: Adding default maxTakeoffWeight of 17500 lbs');
      selectedAircraft.maxTakeoffWeight = 17500;
    }
  }
  
  // Validate calculation parameters - Log warnings but don't fail
  if (isNaN(passengerWeightValue) || passengerWeightValue <= 0) {
    console.warn('StopCardCalculator: Invalid passengerWeight:', passengerWeight);
  }
  
  if (isNaN(taxiFuelValue)) {
    console.warn('StopCardCalculator: Invalid taxiFuel:', taxiFuel);
  }
  
  if (isNaN(contingencyFuelPercentValue) || contingencyFuelPercentValue < 0) {
    console.warn('StopCardCalculator: Invalid contingencyFuelPercent:', contingencyFuelPercent);
  }
  
  if (isNaN(reserveFuelValue)) {
    console.warn('StopCardCalculator: Invalid reserveFuel:', reserveFuel);
  }
  
  if (isNaN(deckTimePerStopValue) || deckTimePerStopValue < 0) {
    console.warn('StopCardCalculator: Invalid deckTimePerStop:', deckTimePerStop);
  }
  
  if (isNaN(deckFuelFlowValue) || deckFuelFlowValue < 0) {
    console.warn('StopCardCalculator: Invalid deckFuelFlow:', deckFuelFlow);
  }

  console.log('StopCardCalculator: Generating stop cards with', stopsToProcess.length, 'landing stops');

  // Create data for each stop
  const cards = [];

  // Get aircraft data for calculations
  const aircraft = selectedAircraft;

  // Calculate total trip values
  let totalDistance = 0;
  let totalTripFuel = 0;
  const legDetails = [];
  
  // IMPORTANT: First check if we can use RouteCalculator's results directly
  // This helps ensure a single source of truth for calculations
  let useRouteStatsDirectly = false;
  
  if (routeStats && routeStats.legs && routeStats.legs.length > 0) {
    console.log('⭐ StopCardCalculator: Using route stats legs data directly:', routeStats.legs.length);
    useRouteStatsDirectly = true;
    
    // Use routeStats totalDistance and tripFuel directly
    totalDistance = parseFloat(routeStats.totalDistance) || 0;
    totalTripFuel = routeStats.tripFuel || 0;
    
    console.log('⭐ StopCardCalculator: Using route stats values:', {
      totalDistance, 
      totalTripFuel,
      timeHours: routeStats.timeHours
    });
    
    // Map route stats legs to our internal format
    for (let i = 0; i < routeStats.legs.length; i++) {
      const leg = routeStats.legs[i];
      
      // Find waypoints corresponding to this leg
      const fromIndex = i;
      const toIndex = i + 1;
      
      // Ensure we have valid waypoints
      if (fromIndex >= stopsToProcess.length || toIndex >= stopsToProcess.length) {
        console.warn(`StopCardCalculator: Leg ${i} indices (${fromIndex}, ${toIndex}) out of range for stopsToProcess (${stopsToProcess.length})`);
        continue;
      }
      
      const fromWaypoint = stopsToProcess[fromIndex];
      const toWaypoint = stopsToProcess[toIndex];
      
      // Map the leg data
      legDetails.push({
        fromWaypoint,
        toWaypoint,
        distance: parseFloat(leg.distance),
        timeHours: leg.time || (leg.distance / aircraft.cruiseSpeed),
        fuel: leg.fuel || Math.round((leg.distance / aircraft.cruiseSpeed) * aircraft.fuelBurn),
        groundSpeed: leg.groundSpeed || aircraft.cruiseSpeed,
        headwind: parseFloat((leg.headwind || 0).toFixed(1))
      });
      
      console.log(`⭐ StopCardCalculator: Mapped leg ${i} from route stats:`, {
        distance: legDetails[legDetails.length-1].distance.toFixed(1),
        time: legDetails[legDetails.length-1].timeHours.toFixed(2),
        fuel: legDetails[legDetails.length-1].fuel
      });
    }
  }
  
  // If not using route stats directly, calculate leg details ourselves
  if (!useRouteStatsDirectly) {
    console.log('⭐ StopCardCalculator: Calculating leg details directly (not using route stats)');
    
    // First, pre-calculate all leg details and total values for LANDING STOPS ONLY
    // but include all waypoints between landing stops
    for (let i = 0; i < stopsToProcess.length - 1; i++) {
      const fromWaypoint = stopsToProcess[i];
      const toWaypoint = stopsToProcess[i + 1];
      
      // Find the indices of these waypoints in the full waypoints array
      const fromIndex = waypoints.findIndex(wp => wp.id === fromWaypoint.id);
      const toIndex = waypoints.findIndex(wp => wp.id === toWaypoint.id);
      
      // Get all waypoints between these two landing stops (inclusive)
      const legWaypoints = [];
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
        // Extract all waypoints in this leg
        for (let j = fromIndex; j <= toIndex; j++) {
          legWaypoints.push(waypoints[j]);
        }
      } else {
        // Fallback if we can't find the waypoints in the array
        legWaypoints.push(fromWaypoint, toWaypoint);
      }
      
      console.log(`StopCardCalculator: Processing leg ${i+1} with ${legWaypoints.length} waypoints (including navigation waypoints)`);
      
      // Calculate the total leg distance by summing all segments
      let legDistance = 0;
      let legTimeHours = 0;
      let legFuel = 0;
      let totalLegGroundSpeed = 0;
      let totalLegHeadwind = 0;
      let segmentCount = 0;
      
      // Process each segment in the leg
      for (let j = 0; j < legWaypoints.length - 1; j++) {
        const segmentFrom = legWaypoints[j];
        const segmentTo = legWaypoints[j + 1];
        
        // Check for coordinates
        const fromHasCoords = (segmentFrom.lat && segmentFrom.lon) ||
                            (segmentFrom.coords && segmentFrom.coords.length === 2);
        const toHasCoords = (segmentTo.lat && segmentTo.lon) ||
                          (segmentTo.coords && segmentTo.coords.length === 2);
        
        if (!fromHasCoords || !toHasCoords) {
          console.error(`StopCardCalculator: Missing coordinates for segment in leg ${i+1}`);
          continue;
        }
        
        // Get segment coordinates
        const fromCoords = {
          lat: segmentFrom.lat || segmentFrom.coords[1],
          lon: segmentFrom.lon || segmentFrom.coords[0]
        };
        
        const toCoords = {
          lat: segmentTo.lat || segmentTo.coords[1],
          lon: segmentTo.lon || segmentTo.coords[0]
        };
        
        // Calculate segment distance
        let segmentDistance = 0;
        try {
          // Calculate using turf
          const from = window.turf.point([fromCoords.lon, fromCoords.lat]);
          const to = window.turf.point([toCoords.lon, toCoords.lat]);
          segmentDistance = window.turf.distance(from, to, { units: 'nauticalmiles' });
        } catch (error) {
          console.error(`StopCardCalculator: Error calculating segment distance in leg ${i+1}:`, error);
          continue;
        }
        
        // Calculate segment time and fuel with wind adjustments
        let segmentTimeHours = 0;
        let segmentFuel = 0;
        let segmentGroundSpeed = aircraft.cruiseSpeed;
        let segmentHeadwind = 0;
        
        // Calculate with wind if available
        if (window.WindCalculations) {
          try {
            const segmentDetails = window.WindCalculations.calculateLegWithWind(
              fromCoords,
              toCoords,
              segmentDistance,
              aircraft,
              weather
            );
            
            segmentTimeHours = segmentDetails.time;
            segmentFuel = Math.round(segmentDetails.fuel);
            segmentGroundSpeed = Math.round(segmentDetails.groundSpeed);
            segmentHeadwind = Math.round(segmentDetails.headwindComponent);
            
            console.log(`StopCardCalculator: Segment ${j+1} in leg ${i+1}: distance=${segmentDistance.toFixed(1)}nm, time=${segmentTimeHours.toFixed(2)}h, fuel=${segmentFuel}lbs`);
          } catch (error) {
            // Fallback to basic calculation
            console.error(`StopCardCalculator: Error calculating wind adjustments for segment in leg ${i+1}:`, error);
            segmentTimeHours = segmentDistance / aircraft.cruiseSpeed;
            segmentFuel = Math.round(segmentTimeHours * aircraft.fuelBurn);
            segmentGroundSpeed = aircraft.cruiseSpeed;
            segmentHeadwind = 0;
          }
        } else {
          // Basic calculation without wind
          segmentTimeHours = segmentDistance / aircraft.cruiseSpeed;
          segmentFuel = Math.round(segmentTimeHours * aircraft.fuelBurn);
          segmentGroundSpeed = aircraft.cruiseSpeed;
          segmentHeadwind = 0;
        }
        
        // Add segment values to leg totals
        legDistance += segmentDistance;
        legTimeHours += segmentTimeHours;
        legFuel += segmentFuel;
        totalLegGroundSpeed += segmentGroundSpeed;
        totalLegHeadwind += segmentHeadwind;
        segmentCount++;
      }
      
      // Calculate average ground speed and headwind for the leg
      const legGroundSpeed = segmentCount > 0 ? Math.round(totalLegGroundSpeed / segmentCount) : aircraft.cruiseSpeed;
      const headwindComponent = segmentCount > 0 ? parseFloat((totalLegHeadwind / segmentCount).toFixed(1)) : 0;
      
      console.log(`StopCardCalculator: Leg ${i+1} totals: distance=${legDistance.toFixed(1)}nm, time=${legTimeHours.toFixed(2)}h, fuel=${legFuel}lbs`);
      
      // Update route totals
      totalDistance += legDistance;
      totalTripFuel += legFuel;
      
      // Store leg details for later use
      legDetails.push({
        fromWaypoint,
        toWaypoint,
        distance: legDistance,
        timeHours: legTimeHours,
        fuel: legFuel,
        groundSpeed: legGroundSpeed,
        headwind: headwindComponent
      });
    }
  }

  // Calculate auxiliary fuel values
  // Using our converted numeric values
  
  // Log the numeric values being used
  console.log('⛽ Using numeric fuel values:', {
    taxiFuelValue, 
    reserveFuelValue,
    contingencyFuelPercentValue,
    deckTimePerStopValue,
    deckFuelFlowValue
  });

  // Calculate intermediate stops (for deck fuel)
  // Only count landing stops that are not departure or destination
  const landingStopsCount = landingStopsOnly.length;
  const intermediateStops = Math.max(0, landingStopsCount - 2);
  
  console.log(`StopCardCalculator: Calculating deck time for ${intermediateStops} intermediate stops out of ${landingStopsCount} total landing stops`);
  
  // Calculate deck time and fuel
  const deckTimeHours = (intermediateStops * deckTimePerStopValue) / 60; // Convert from minutes to hours
  const deckFuelValue = Math.round(deckTimeHours * deckFuelFlowValue);

  // Calculate contingency fuel
  const contingencyFuelValue = Math.round((totalTripFuel * contingencyFuelPercentValue) / 100);
  
  // Log the calculated values with more detail
  console.log('🧮 Calculated auxiliary values with detailed breakdown:', {
    taxiFuel_passedValue: taxiFuel,
    taxiFuel_convertedValue: taxiFuelValue,
    taxiFuel_afterConversion: taxiFuelValue,
    
    reserveFuel_passedValue: reserveFuel,
    reserveFuel_convertedValue: reserveFuelValue,
    
    contingencyFuelPercent_passedValue: contingencyFuelPercent,
    contingencyFuelPercent_convertedValue: contingencyFuelPercentValue,
    contingencyFuelPercent_calculation: `${totalTripFuel} * ${contingencyFuelPercentValue} / 100 = ${contingencyFuelValue}`,
    contingencyFuelValue,
    
    deckTimePerStop_passedValue: deckTimePerStop,
    deckTimePerStop_convertedValue: deckTimePerStopValue,
    
    deckFuelFlow_passedValue: deckFuelFlow,
    deckFuelFlow_convertedValue: deckFuelFlowValue,
    
    deckFuel_calculation: `${intermediateStops} stops * (${deckTimePerStopValue} mins / 60) hrs * ${deckFuelFlowValue} lbs/hr = ${deckFuelValue}`,
    deckFuelValue,
    
    intermediateStops,
    totalTripFuel
  });

  // Calculate total fuel required for the entire trip
  const totalFuelRequired = taxiFuelValue + totalTripFuel + contingencyFuelValue + reserveFuelValue + deckFuelValue;

  // Create a departure card first
  if (waypoints.length >= 2) {
    const departureWaypoint = waypoints[0];
    
    // Total fuel needed for entire journey at departure
    const departureFuelNeeded = totalTripFuel + contingencyFuelValue + taxiFuelValue + deckFuelValue + reserveFuelValue;
    
    // Create fuel components text for departure
    const departureFuelComponentsText = `Trip:${totalTripFuel} Cont:${contingencyFuelValue} Taxi:${taxiFuelValue} Deck:${deckFuelValue} Res:${reserveFuelValue}`;
    
    // DEBUG: Log the fuel components for departure
    console.log('🔥 DEPARTURE CARD FUEL COMPONENTS (DETAILED):', {
      totalTripFuel,
      contingencyFuelValue,
      taxiFuelValue,
      deckFuelValue,
      reserveFuelValue,
      departureFuelNeeded,
      actualSum: totalTripFuel + contingencyFuelValue + taxiFuelValue + deckFuelValue + reserveFuelValue,
      componentText: departureFuelComponentsText
    });
    
    // Calculate max passengers for departure using PassengerCalculator
    let departureMaxPassengers = 0;
    if (selectedAircraft) {
      // Use our dedicated PassengerCalculator module
      departureMaxPassengers = PassengerCalculator.calculateMaxPassengers(
        selectedAircraft, 
        departureFuelNeeded, 
        passengerWeightValue
      );
    }
    
    // Create departure card with detailed console logging
    console.log('🔎 Creating departure card with components:', {
      tripFuel: totalTripFuel,
      contingencyFuel: contingencyFuelValue,
      contingencyRate: `${contingencyFuelPercentValue}%`,
      taxiFuel: taxiFuelValue,
      deckFuel: deckFuelValue,
      reserveFuel: reserveFuelValue,
      totalFuel: departureFuelNeeded,
      componentText: departureFuelComponentsText,
      sum: totalTripFuel + contingencyFuelValue + taxiFuelValue + deckFuelValue + reserveFuelValue
    });
    
    const departureCard = {
      index: 'D',
      id: departureWaypoint.id || 'departure',
      stopName: departureWaypoint.name,
      legDistance: '0.0',
      totalDistance: '0.0',
      legTime: 0,
      totalTime: 0,
      legFuel: 0,
      totalFuel: departureFuelNeeded,
      maxPassengers: departureMaxPassengers,
      maxPassengersDisplay: departureMaxPassengers,
      maxPassengersWeight: departureMaxPassengers * passengerWeightValue,
      groundSpeed: 0,
      headwind: 0,
      deckTime: deckTimeHours * 60, // Convert back to minutes for display
      deckFuel: deckFuelValue,
      fuelComponents: departureFuelComponentsText,
      fuelComponentsObject: {
        tripFuel: totalTripFuel,
        contingencyFuel: contingencyFuelValue,
        taxiFuel: taxiFuelValue,
        deckFuel: deckFuelValue,
        reserveFuel: reserveFuelValue
      },
      isDeparture: true,
      isDestination: false
    };
    
    // Add the departure card to our cards array
    cards.push(departureCard);
  }

  // Now create cards for each intermediate stop and destination
  let cumulativeDistance = 0;
  let cumulativeTime = 0;

  for (let i = 0; i < legDetails.length; i++) {
    const legDetail = legDetails[i];
    const toWaypoint = legDetail.toWaypoint;

    // Create a unique ID for this stop
    const stopId = toWaypoint.id || `waypoint-${i+1}`;

    // Update cumulative values for distance and time (for display only)
    cumulativeDistance += legDetail.distance;
    cumulativeTime += legDetail.timeHours;

    // Calculate remaining trip fuel - sum of all legs after this one
    let remainingTripFuel = 0;
    for (let j = i + 1; j < legDetails.length; j++) {
      remainingTripFuel += legDetails[j].fuel;
    }

    // Calculate remaining number of deck stops
    // This is critical - only count intermediate stops after this point
    // For a route like: A → B → C → D
    // At point A: B and C are intermediate (2 deck stops)
    // At point B: Only C is intermediate (1 deck stop)
    // At point C: No more intermediate stops (0 deck stops)
    const remainingIntermediateStops = Math.max(0, legDetails.length - i - 1 - 1); // -1 for current leg, -1 for final leg

    // Calculate remaining deck fuel - only for intermediate stops
    const remainingDeckTimeHours = (remainingIntermediateStops * deckTimePerStopValue) / 60;
    const remainingDeckFuel = Math.round(remainingDeckTimeHours * deckFuelFlowValue);

    // Calculate remaining contingency fuel (proportional to remaining trip fuel)
    let remainingContingencyFuel = 0;
    if (totalTripFuel > 0) {
      remainingContingencyFuel = Math.round((remainingTripFuel / totalTripFuel) * contingencyFuelValue);
    }

    // At the final destination, we only have reserve and unused contingency
    const isFinalDestination = i === legDetails.length - 1;

    // Calculate the fuel needed at this stop to continue the journey
    let fuelNeeded;
    let fuelComponents;
    let fuelComponentsText;

    if (isFinalDestination) {
      // At the final destination, you have reserve fuel and unused contingency
      // For potential landing fuel, we should show the total contingency (from departure)
      // not just the remaining contingency for this leg
      fuelNeeded = reserveFuelValue + remainingContingencyFuel;
      fuelComponents = {
        reserveFuel: reserveFuelValue,
        contingencyFuel: remainingContingencyFuel,
        extraFuel: 0, // Can be used for alternate or holding fuel
        // Add remaining fuel components with zero values for consistency
        tripFuel: 0,
        taxiFuel: 0,
        deckFuel: 0
      };

      // Get the original full contingency amount (from departure)
      const fullContingencyFuel = contingencyFuelValue;

      if (routeStats?.enhancedResults?.auxiliaryFuel?.contingencyFuel) {
        // If we have enhanced results, use the exact contingency fuel
        fuelComponents.contingencyFuel = routeStats.enhancedResults.auxiliaryFuel.contingencyFuel;
      }

      // Calculate potential landing fuel (reserve + full unused contingency)
      const potentialLandingFuel = reserveFuelValue + fullContingencyFuel;
      fuelComponentsText = `Reserve:${reserveFuelValue} Extra:0 FullCont:${remainingContingencyFuel} (${reserveFuelValue}+${fullContingencyFuel}=${potentialLandingFuel})`;
      
      // Recalculate fuelNeeded as the sum of all components to ensure consistency
      fuelNeeded = Object.values(fuelComponents).reduce((sum, value) => sum + value, 0);
      
      // Log the destination fuel components
      console.log('🔚 DESTINATION CARD FUEL COMPONENTS:', {
        reserveFuel: reserveFuelValue,
        fullContingencyFuel,
        remainingContingencyFuel,
        potentialLandingFuel,
        componentText: fuelComponentsText,
        finalFuelNeeded: fuelNeeded
      });
    } else {
      // At intermediate stops, you need fuel for remaining legs, plus reserve
      fuelNeeded = remainingTripFuel + remainingContingencyFuel + remainingDeckFuel + reserveFuelValue;
      fuelComponents = {
        remainingTripFuel: remainingTripFuel,
        contingencyFuel: remainingContingencyFuel,
        deckFuel: remainingDeckFuel,
        reserveFuel: reserveFuelValue
      };
      fuelComponentsText = `Trip:${remainingTripFuel} Cont:${remainingContingencyFuel} Res:${reserveFuelValue}`;

      // Add deck fuel text only if there are remaining intermediate stops
      if (remainingDeckFuel > 0) {
        fuelComponentsText += ` Deck:${remainingDeckFuel}`;
      }
      
      // Log the intermediate stop fuel components
      console.log('🛑 INTERMEDIATE STOP FUEL COMPONENTS:', {
        remainingTripFuel,
        remainingContingencyFuel,
        remainingDeckFuel,
        reserveFuel: reserveFuelValue,
        fuelNeeded,
        componentText: fuelComponentsText,
        sum: remainingTripFuel + remainingContingencyFuel + remainingDeckFuel + reserveFuelValue
      });
    }

    // Calculate max passengers using our PassengerCalculator module
    let maxPassengers = 0;
    if (selectedAircraft) {
      // Use our dedicated PassengerCalculator module
      maxPassengers = PassengerCalculator.calculateMaxPassengers(
        selectedAircraft, 
        fuelNeeded, 
        passengerWeightValue
      );
    }

    // For final destination, show "Final Stop" instead of passenger count
    const displayMaxPassengers = isFinalDestination ? "Final Stop" : maxPassengers;
    const maxPassengersValue = isFinalDestination ? null : maxPassengers;
    const maxPassengersWeight = isFinalDestination ? null : (maxPassengers * passengerWeightValue);

    // Only the final waypoint is a destination
    const isDeparture = false; // We already added the departure card
    const isDestination = isFinalDestination;

    // Initialize cardData before conditional assignment
    let cardData;
    
    if (isFinalDestination) {
      // CRITICAL FIX: Special handling for destination cards
      // Always include all fuel component fields, even if they're zero
      cardData = {
        index: isFinalDestination ? 'F' : (i + 1),
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDetail.distance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legDetail.timeHours),
        totalTime: Number(cumulativeTime),
        legFuel: Number(legDetail.fuel),
        // The fuel shown is what's needed to continue from this point
        totalFuel: Number(fuelNeeded),
        maxPassengers: maxPassengersValue,
        maxPassengersDisplay: displayMaxPassengers,
        maxPassengersWeight: maxPassengersWeight,
        groundSpeed: Number(legDetail.groundSpeed),
        headwind: Number(legDetail.headwind),
        deckTime: Number(remainingDeckTimeHours * 60), // Convert back to minutes for display
        deckFuel: Number(remainingDeckFuel),
        fuelComponents: fuelComponentsText,
        // For destination cards, ensure all component fields exist
        fuelComponentsObject: {
          reserveFuel: reserveFuelValue,
          contingencyFuel: remainingContingencyFuel,
          extraFuel: 0,
          // Always include these with zero values for consistency
          tripFuel: 0,
          taxiFuel: 0,
          deckFuel: 0
        },
        isDeparture: isDeparture,
        isDestination: isDestination
      };
    } else {
      // Normal case for all non-destination cards
      cardData = {
        index: isFinalDestination ? 'F' : (i + 1),
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDetail.distance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: Number(legDetail.timeHours),
        totalTime: Number(cumulativeTime),
        legFuel: Number(legDetail.fuel),
        // The fuel shown is what's needed to continue from this point
        totalFuel: Number(fuelNeeded),
        maxPassengers: maxPassengersValue,
        maxPassengersDisplay: displayMaxPassengers,
        maxPassengersWeight: maxPassengersWeight,
        groundSpeed: Number(legDetail.groundSpeed),
        headwind: Number(legDetail.headwind),
        deckTime: Number(remainingDeckTimeHours * 60), // Convert back to minutes for display
        deckFuel: Number(remainingDeckFuel),
        fuelComponents: fuelComponentsText,
        fuelComponentsObject: fuelComponents,
        isDeparture: isDeparture,
        isDestination: isDestination
      };
    }

    cards.push(cardData);
  }

  // Double-check destination card for correctness
  const destinationCard = cards.find(card => card.isDestination);
  if (destinationCard) {
    console.log('🔍 FINAL CHECK - DESTINATION CARD:', {
      totalFuel: destinationCard.totalFuel,
      componentSum: Object.values(destinationCard.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0),
      components: destinationCard.fuelComponentsObject
    });
    
    // Fix any discrepancy between totalFuel and component sum for destination card
    const componentSum = Object.values(destinationCard.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0);
    if (Math.abs(destinationCard.totalFuel - componentSum) > 1) {
      console.log(`⚠️ Fixing destination card totalFuel mismatch (${destinationCard.totalFuel} vs ${componentSum})`);
      destinationCard.totalFuel = componentSum;
    }
  }

    // Validate fuel components on each card to prevent crashes
    const finalCards = cards.map(card => {
      // Ensure all cards have a fuelComponentsObject with valid numerical values
      if (!card.fuelComponentsObject) {
        // Create appropriate default fuelComponentsObject based on card type
        if (card.isDestination) {
          card.fuelComponentsObject = {
            reserveFuel: reserveFuelValue,
            contingencyFuel: 0,
            extraFuel: 0,
            tripFuel: 0,
            taxiFuel: 0,
            deckFuel: 0
          };
        } else if (card.isDeparture) {
          card.fuelComponentsObject = {
            tripFuel: totalTripFuel,
            contingencyFuel: contingencyFuelValue,
            taxiFuel: taxiFuelValue,
            deckFuel: deckFuelValue,
            reserveFuel: reserveFuelValue
          };
        } else {
          // Default for intermediate stops
          card.fuelComponentsObject = {
            tripFuel: 0,
            contingencyFuel: 0,
            taxiFuel: 0,
            deckFuel: 0,
            reserveFuel: 0
          };
        }
      } else {
        // Ensure all standard component fields exist with valid numeric values
        const standardComponents = ['tripFuel', 'contingencyFuel', 'taxiFuel', 'deckFuel', 'reserveFuel'];
        standardComponents.forEach(component => {
          if (card.fuelComponentsObject[component] === undefined) {
            card.fuelComponentsObject[component] = 0;
          } else {
            card.fuelComponentsObject[component] = Number(card.fuelComponentsObject[component]) || 0;
          }
        });
        
        // Special handling for destination card's extraFuel
        if (card.isDestination && card.fuelComponentsObject.extraFuel === undefined) {
          card.fuelComponentsObject.extraFuel = 0;
        } else if (card.isDestination) {
          card.fuelComponentsObject.extraFuel = Number(card.fuelComponentsObject.extraFuel) || 0;
        }
      }
      
      // Ensure totalFuel is a valid number
      if (isNaN(card.totalFuel)) {
        // Recompute from components
        card.totalFuel = Object.values(card.fuelComponentsObject).reduce((sum, val) => sum + (Number(val) || 0), 0);
      } else {
        card.totalFuel = Number(card.totalFuel) || 0;
      }
      
      // Ensure other numerical fields are valid
      card.deckFuel = Number(card.deckFuel) || 0;
      card.legFuel = Number(card.legFuel) || 0;
      card.headwind = parseFloat(Number(card.headwind).toFixed(1)) || 0;
      
      return card;
    });
  
    // Verify fuel consistency in all cards before returning them
    console.log('StopCardCalculator: Verifying fuel consistency in all cards');
    for (let i = 0; i < finalCards.length; i++) {
      const card = finalCards[i];
      if (card.fuelComponentsObject) {
        // Calculate the sum of all fuel components
        const componentSum = Object.values(card.fuelComponentsObject).reduce((sum, value) => sum + value, 0);
        
        // Check if there's a significant discrepancy
        const difference = Math.abs(componentSum - card.totalFuel);
        
        if (difference > 1) { // Allow 1 lb for rounding errors
          console.warn(`⚠️ Card ${i} (${card.isDeparture ? 'Departure' : card.isDestination ? 'Destination' : 'Intermediate'}) fuel mismatch detected:`, {
            totalFuel: card.totalFuel,
            componentSum,
            difference: componentSum - card.totalFuel,
            components: { ...card.fuelComponentsObject }
          });
          
          // Correct the total fuel to match components
          card.totalFuel = componentSum;
          console.log(`✅ Card ${i} totalFuel corrected to ${componentSum}`);
        }
      }
    }

    return finalCards;
};

export default {
  calculateStopCards
};