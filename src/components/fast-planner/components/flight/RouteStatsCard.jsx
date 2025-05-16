import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import LoadingIndicator from '../../modules/LoadingIndicator';
import { EnhancedFuelDisplay } from '../fuel';
// Import StopCardCalculator for direct fuel calculations
import StopCardCalculator from '../../modules/calculations/flight/StopCardCalculator';
// Import PassengerCalculator for consistent passenger calculations
import PassengerCalculator from '../../modules/calculations/passengers/PassengerCalculator';

/**
 * Route Statistics Card Component
 * 
 * Displays route statistics in a card format at the top of the page
 * Including total distance, flight time, total time (flight + deck time),
 * trip fuel, total fuel (trip + deck fuel), and passenger numbers
 */
const RouteStatsCard = ({ 
  routeStats, 
  selectedAircraft, 
  waypoints = [],
  deckTimePerStop = 5,  // Add safe default
  deckFuelPerStop = 100, // Not a critical parameter
  deckFuelFlow = 400,     // Add safe default
  passengerWeight = 220,  // Add safe default
  cargoWeight = 0,  // Not a critical parameter
  taxiFuel = 50,         // Add safe default
  contingencyFuelPercent = 5, // Add safe default
  reserveFuel = 600,      // Add safe default
  weather = { windSpeed: 0, windDirection: 0 },
  // Optional stopCards prop to get data from StopCardsContainer
  stopCards = []
}) => {
  // Log received values for debugging
  console.log('📊 RouteStatsCard received values:', {
    taxiFuel,
    passengerWeight,
    contingencyFuelPercent,
    reserveFuel,
    deckTimePerStop,
    deckFuelFlow,
    rawContingencyValue: contingencyFuelPercent,
    rawContingencyType: typeof contingencyFuelPercent
  });
  
  // Force rerendering when routeStats or waypoints change
  const [forceRerender, setForceRerender] = useState(0);
  
  // Removed error handling code to fix React hooks errors
  // Log received values for debugging
  console.log('📊 RouteStatsCard received values:', {
    taxiFuel,
    passengerWeight,
    contingencyFuelPercent,
    reserveFuel,
    deckTimePerStop,
    deckFuelFlow,
    rawContingencyValue: contingencyFuelPercent,
    rawContingencyType: typeof contingencyFuelPercent
  });
  // Use StopCardCalculator directly for consistent fuel calculations
  const [localStopCards, setLocalStopCards] = useState([]);
  
  useEffect(() => {
    // First try to use passed stop cards
    if (stopCards && stopCards.length > 0) {
      console.log('Using existing stop cards:', stopCards.length);
      setLocalStopCards(stopCards);
    } 
    // Otherwise calculate cards directly with StopCardCalculator
    else if (waypoints && waypoints.length >= 2 && selectedAircraft && routeStats) {
      console.log('Generating stop cards directly from StopCardCalculator');
      console.log('🚨 PASSING SETTINGS TO STOPCARDCALCULATOR:', {
        taxiFuel,
        passengerWeight,
        contingencyFuelPercent,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow
      });
      
      const calculatedCards = StopCardCalculator.calculateStopCards(
        waypoints, 
        routeStats, 
        selectedAircraft, 
        weather, 
        {
          passengerWeight,
          taxiFuel,
          contingencyFuelPercent,
          reserveFuel,
          deckTimePerStop,
          deckFuelFlow
        }
      );
      
      setLocalStopCards(calculatedCards);
    }
  }, [stopCards, waypoints, selectedAircraft, routeStats, weather, passengerWeight, taxiFuel, contingencyFuelPercent, reserveFuel, deckTimePerStop, deckFuelFlow]);
  
  // Debug log for stop cards and force update when they change
  useEffect(() => {
    console.log('🚨 STOP CARDS CHANGED:', {
      count: stopCards?.length || 0,
      firstCard: stopCards && stopCards.length > 0 ? {
        isDeparture: stopCards[0].isDeparture || false,
        totalFuel: stopCards[0].totalFuel || 0,
        deckFuel: stopCards[0].deckFuel || 0
      } : null,
      departureCard: stopCards?.find(card => card.isDeparture) ? {
        totalFuel: stopCards.find(card => card.isDeparture).totalFuel || 0,
        deckFuel: stopCards.find(card => card.isDeparture).deckFuel || 0,
        components: stopCards.find(card => card.isDeparture).fuelComponents || ''
      } : 'No departure card found'
    });
    
    // The component will re-render if stopCards prop changes.
    // Forcing a rerender here with setForceRerender can lead to loops if stopCards is a new reference on every parent render.
    // setForceRerender(prev => prev + 1); // REMOVED to prevent potential loop
  }, [stopCards]);
  
  // Always fetch the currentRouteStats from window for the latest data
  useEffect(() => {
    // Check if window.currentRouteStats exists and has newer data than our local routeStats
    if (window.currentRouteStats && (!routeStats || !routeStats.timeHours || routeStats.timeHours === 0)) {
      console.log('⚠️ Found window.currentRouteStats with time data, using for display');
      
      // Force a rerender to use the window.currentRouteStats data
      setForceRerender(prev => prev + 1);
    }
  }, [routeStats, forceRerender]);
  
  // Force data fetch and calculation immediately before rendering
  useEffect(() => {
    // If we should have time data but don't, trigger debug logging
    if (waypoints && waypoints.length >= 2 && selectedAircraft && 
        (!routeStats || !routeStats.timeHours || routeStats.timeHours === 0)) {
      console.log('⚠️ Missing time data at render time. Waypoints:', waypoints.length);
      
      // If necessary, use window.currentRouteStats for rendering
      if (window.currentRouteStats && window.currentRouteStats.timeHours > 0) {
        console.log('⚠️ Using window.currentRouteStats for display with timeHours:', 
                    window.currentRouteStats.timeHours);
      }
    }
  }, [waypoints, selectedAircraft, routeStats]);
  
  // Get authentication state and user details
  const { isAuthenticated, userName } = useAuth();
  
  // Reference to card element for adding/removing loading indicator
  const cardRef = useRef(null);
  
  // Reference to track the active loader ID
  const loaderIdRef = useRef(null);
  
  // Force a rerender when routeStats change - added null check to prevent errors
  useEffect(() => {
    if (routeStats) {
      console.log("💥 RouteStatsCard - routeStats changed, forcing rerender");
      setForceRerender(prev => prev + 1);
    }
  }, [routeStats]);
  
  // Force a rerender when waypoints change
  useEffect(() => {
    if (waypoints && waypoints.length >= 2) {
      console.log("💥 RouteStatsCard - waypoints changed, forcing rerender");
      setForceRerender(prev => prev + 1);
    }
  }, [waypoints]);
  
  // Add debug logging to track the routeStats data
  console.log("💥 RouteStatsCard - received stats:", {
    forceRerender,
    timeHours: routeStats?.timeHours,
    estimatedTime: routeStats?.estimatedTime,
    totalDistance: routeStats?.totalDistance,
    legs: routeStats?.legs?.length || 0
  });
  
  // Extra validation to catch zero or missing time values
  if (routeStats && 
      (routeStats.timeHours === 0 || !routeStats.timeHours || 
       routeStats.estimatedTime === '00:00' || !routeStats.estimatedTime) && 
      routeStats.totalDistance && parseFloat(routeStats.totalDistance) > 0) {
    console.error("⚠️ RouteStatsCard - Invalid or missing time with non-zero distance!", {
      totalDistance: routeStats.totalDistance,
      timeHours: routeStats.timeHours,
      estimatedTime: routeStats.estimatedTime
    });
    
    // CRITICAL FIX: If zero time was received but we have distance and a valid selected aircraft, 
    // fix the time calculation immediately
    if (selectedAircraft && selectedAircraft.cruiseSpeed) {
      console.log("⚠️ RouteStatsCard - Fixing time with wind-adjusted calculation if possible");
      
      // Calculate time based on distance and cruise speed
      const totalDistance = parseFloat(routeStats.totalDistance);
      let timeHours;
      
      // Check if we can use wind calculations
      if (window.WindCalculations && routeStats.windData && routeStats.legs && routeStats.legs.length > 0) {
        console.log("⚠️ Using WindCalculations for top card fix");
        
        // Calculate average course from all legs
        let avgCourse = 0;
        let legCount = 0;
        
        routeStats.legs.forEach(leg => {
          if (leg.course !== undefined) {
            avgCourse += leg.course;
            legCount++;
          }
        });
        
        if (legCount > 0) {
          avgCourse = avgCourse / legCount;
          
          // Calculate wind-adjusted time
          timeHours = window.WindCalculations.calculateWindAdjustedTime(
            totalDistance,
            selectedAircraft.cruiseSpeed,
            avgCourse,
            routeStats.windData.windSpeed,
            routeStats.windData.windDirection
          );
          
          console.log("⚠️ Created wind-adjusted time using avg course:", {
            avgCourse,
            windSpeed: routeStats.windData.windSpeed,
            windDirection: routeStats.windData.windDirection,
            timeHours
          });
          
          // Make sure wind adjustment flag is set
          routeStats.windAdjusted = true;
        } else {
          // Basic calculation if we couldn't determine course
          timeHours = totalDistance / selectedAircraft.cruiseSpeed;
          console.log("⚠️ Using basic time calculation (no valid course data)");
        }
      } else {
        // Basic calculation without wind effects
        timeHours = totalDistance / selectedAircraft.cruiseSpeed;
        console.log("⚠️ Using basic time calculation (no wind data)");
      }
      
      // Format time string
      const hours = Math.floor(timeHours);
      const minutes = Math.floor((timeHours - hours) * 60);
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Update the routeStats object directly
      routeStats.timeHours = timeHours;
      routeStats.estimatedTime = estimatedTime;
      
      // Also update window.currentRouteStats to ensure it's available for map interactions
      if (window.currentRouteStats) {
        window.currentRouteStats.timeHours = timeHours;
        window.currentRouteStats.estimatedTime = estimatedTime;
        
        // Ensure wind status is synced
        if (routeStats.windAdjusted) {
          window.currentRouteStats.windAdjusted = true;
          window.currentRouteStats.windData = { ...routeStats.windData };
        }
      }
      
      console.log("⚠️ RouteStatsCard - Fixed time values:", {
        timeHours,
        estimatedTime,
        windAdjusted: routeStats.windAdjusted || false
      });
    }
  }
  
  if (routeStats && routeStats.windAdjusted) {
    console.log("✅ Wind-adjusted stats detected in RouteStatsCard:", {
      windSpeed: routeStats.windData?.windSpeed,
      windDirection: routeStats.windData?.windDirection,
      estimatedTime: routeStats.estimatedTime,
      timeHours: routeStats.timeHours,
      avgHeadwind: routeStats.windData?.avgHeadwind
    });
  } else {
    console.log("❌ Route stats WITHOUT wind adjustment in RouteStatsCard");
  }
  
  // Determine if time has been adjusted due to wind - with safety check
  const isWindAdjusted = routeStats && routeStats.windAdjusted && routeStats.windData;
  
  // Calculate average headwind if not present but we have wind data
  useEffect(() => {
    if (isWindAdjusted && routeStats && routeStats.windData && routeStats.windData.avgHeadwind === undefined) {
      console.log("⚠️ avgHeadwind missing, calculating from wind data");
      
      // If we have legs with headwind values, calculate average
      if (routeStats.legs && routeStats.legs.length > 0) {
        const legsWithHeadwind = routeStats.legs.filter(leg => leg.headwind !== undefined);
        if (legsWithHeadwind.length > 0) {
          const totalHeadwind = legsWithHeadwind.reduce((sum, leg) => sum + leg.headwind, 0);
          const avgHeadwind = Math.round(totalHeadwind / legsWithHeadwind.length);
          
          console.log(`⚠️ Calculated avgHeadwind: ${avgHeadwind}kt from ${legsWithHeadwind.length} legs`);
          
          // Update the windData with the calculated avgHeadwind
          routeStats.windData.avgHeadwind = avgHeadwind;
          
          // Also update window.currentRouteStats to ensure it's available for map interactions
          if (window.currentRouteStats && window.currentRouteStats.windData) {
            window.currentRouteStats.windData.avgHeadwind = avgHeadwind;
          }
        }
      } else if (routeStats.windData.windSpeed > 0) {
        // SAFETY FIX: Always use 0 when no leg headwind data is available
        // Do NOT use any estimation or fallback calculation for safety reasons
        const avgHeadwind = 0;
        
        console.log(`⚠️ No leg headwind data, defaulting to 0kt for safety`);
        
        // Update the windData with 0 avgHeadwind
        routeStats.windData.avgHeadwind = avgHeadwind;
        
        // Also update window.currentRouteStats
        if (window.currentRouteStats && window.currentRouteStats.windData) {
          window.currentRouteStats.windData.avgHeadwind = avgHeadwind;
        }
      }
    }
  }, [routeStats, isWindAdjusted]);
  
  // Get wind effect direction from actual weather data - with safety check
  const windEffect = isWindAdjusted && routeStats.windData && routeStats.windData.avgHeadwind !== undefined ? 
    routeStats.windData.avgHeadwind : 0;
  
  useEffect(() => {
    // Add CSS for wind-adjusted time highlight if it doesn't exist
    if (!document.getElementById('wind-adjusted-style')) {
      const style = document.createElement('style');
      style.id = 'wind-adjusted-style';
      style.innerHTML = `
        .wind-adjusted-time {
          position: relative;
        }
        .wind-adjusted-time::after {
          content: ' ★';
          font-size: 0.7em;
          color: ${routeStats?.windData?.windSpeed > 0 ? '#e74c3c' : '#2ecc71'};
          vertical-align: super;
        }
      `;
      document.head.appendChild(style);
    }
  }, [routeStats]);
  
  // Calculate the number of landings based on actual landing stops only (not waypoints)
  // Filter out navigation waypoints to get only landing stops
  const landingStopsOnly = waypoints.filter(wp => {
    // Check if this is a navigation waypoint based on any property
    const isWaypoint = 
      wp.pointType === 'NAVIGATION_WAYPOINT' || // Explicit type
      wp.isWaypoint === true || // Legacy flag
      wp.type === 'WAYPOINT'; // Legacy type value
    
    // Keep only landing stops by excluding waypoints
    return !isWaypoint;
  });
  
  // Log for debugging
  console.log(`RouteStatsCard: Found ${landingStopsOnly.length} landing stops out of ${waypoints.length} total waypoints`);
  
  // Calculate the number of landings (landing stops - 1 or 0 if no landing stops)
  const landingsCount = landingStopsOnly && landingStopsOnly.length > 1 ? landingStopsOnly.length - 1 : 0;
  
  // Calculate the number of intermediate stops (landing stops - 2 or 0 if less than 3 landing stops)
  // This matches the StopCardCalculator logic - intermediate stops only count landing stops
  const intermediateStops = landingStopsOnly && landingStopsOnly.length > 2 ? landingStopsOnly.length - 2 : 0;
  
  // Calculate total deck fuel using the same formula as StopCardCalculator
  // FIXED: Force numeric type conversions to avoid string math issues
  // Use the already defined intermediateStops variable from above
  const deckTimePerStopNum = Number(deckTimePerStop);
  const deckFuelFlowNum = Number(deckFuelFlow);
  
  // Calculate total deck time in minutes (used for display and total time calculation)
  // Use intermediateStops which is now based on landing stops only
  const totalDeckTime = intermediateStops * deckTimePerStopNum;
  const deckTimeHours = (intermediateStops * deckTimePerStopNum) / 60;
  const calculatedDeckFuel = Math.round(deckTimeHours * deckFuelFlowNum);
  
  // DEBUG: Log deck fuel calculation
  console.log('🚨 ROUTESTATSCARD DECK FUEL CALCULATION:', {
    landingStopsCount: landingStopsOnly.length,
    intermediateStops,
    deckTimePerStop_original: deckTimePerStop,
    deckTimePerStop_asNumber: deckTimePerStopNum,
    deckFuelFlow_original: deckFuelFlow,
    deckFuelFlow_asNumber: deckFuelFlowNum,
    deckTimeHours,
    calculation: `${intermediateStops} * ${deckTimePerStopNum} / 60 * ${deckFuelFlowNum} = ${calculatedDeckFuel}`,
    calculatedDeckFuel,
    routeStats_deckFuel: routeStats?.deckFuel
  });
  
  // Use the calculated value or the one from routeStats if available
  const totalDeckFuel = routeStats?.deckFuel || calculatedDeckFuel;
  
  // Always show the card, even without route stats
  // Use default values if routeStats is not available
  const stats = routeStats || {
    totalDistance: '0',
    estimatedTime: '00:00',
    timeHours: 0,
    fuelRequired: 0,
    usableLoad: 0,
    maxPassengers: 0,
    endurance: '2.3',
    availableFuel: '3070',
    takeoffWeight: '24807',
    operationalRadius: '85'
  };
  
  // Calculate total time (flight time + deck time)
  const calculateTotalTime = () => {
    // CRITICAL FIX: Get the exact same flight time that's displayed in the UI
    const displayedFlightTime = calculateFlightTime(stats, waypoints, selectedAircraft);
    
    // Convert displayed time (HH:MM) to hours
    let flightTimeHours = 0;
    if (displayedFlightTime && displayedFlightTime !== '00:00') {
      const [hours, minutes] = displayedFlightTime.split(':').map(Number);
      flightTimeHours = hours + (minutes / 60);
    }
    
    console.log('⚠️ Total time calculation using UI-displayed flight time:', {
      displayedFlightTime,
      flightTimeHours: flightTimeHours.toFixed(2),
      totalDeckTime,
      deckTimeHours: (totalDeckTime / 60).toFixed(2)
    });
    
    // Convert deck time from minutes to hours
    const deckTimeHours = totalDeckTime / 60;
    
    // Add flight time and deck time
    const totalTimeHours = flightTimeHours + deckTimeHours;
    
    // Format as HH:MM
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.floor((totalTimeHours - hours) * 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    console.log(`⚠️ Total time (displayed flight time + deck): ${formattedTime}`);
    return formattedTime;
  };
  
  // Get fuel data directly from StopCardCalculator for consistency
  const getFuelData = () => {
    try {
      console.log('🚨 DEBUG FUEL SETTINGS:', {
        passedSettings: {
          passengerWeight,
          taxiFuel,
          contingencyFuelPercent,
          reserveFuel,
          deckTimePerStop,
          deckFuelFlow
        },
        taxiFuel_type: typeof taxiFuel,
        taxiFuel_value: Number(taxiFuel)
      });
  
      // Option 1: Try to find the departure card in the existing stop cards
      if (stopCards && stopCards.length > 0) {
        const departureCard = stopCards.find(card => card.isDeparture);
        if (departureCard) {
          console.log('🚨 DEBUG FUEL DATA FROM STOPCARDS:', {
            totalFuel: departureCard.totalFuel,
            tripFuel: departureCard.fuelComponentsObject?.tripFuel,
            deckFuel: departureCard.deckFuel,
            contingencyFuel: departureCard.fuelComponentsObject?.contingencyFuel,
            reserveFuel: departureCard.fuelComponentsObject?.reserveFuel,
            taxiFuel: departureCard.fuelComponentsObject?.taxiFuel,
            rawFuelComponents: departureCard.fuelComponents,
            computedSum: (
              (departureCard.fuelComponentsObject?.tripFuel || 0) +
              (departureCard.fuelComponentsObject?.contingencyFuel || 0) +
              (departureCard.fuelComponentsObject?.taxiFuel || 0) +
              (departureCard.fuelComponentsObject?.deckFuel || 0) +
              (departureCard.fuelComponentsObject?.reserveFuel || 0)
            )
          });
          
          const result = {
            totalFuel: departureCard.totalFuel || 0,
            tripFuel: departureCard.fuelComponentsObject?.tripFuel || 0,
            deckFuel: departureCard.deckFuel || 0,
            contingencyFuel: departureCard.fuelComponentsObject?.contingencyFuel || 0,
            reserveFuel: departureCard.fuelComponentsObject?.reserveFuel || 0,
            taxiFuel: departureCard.fuelComponentsObject?.taxiFuel || 0
          };
          
          // Check if total fuel exceeds max fuel capacity
          if (selectedAircraft && selectedAircraft.maxFuel && result.totalFuel > selectedAircraft.maxFuel) {
            const fuelNeeded = result.totalFuel;
            const maxFuel = selectedAircraft.maxFuel;
            const refuelAmount = fuelNeeded - maxFuel;
            
            console.log(`⚠️ WARNING: Required fuel (${fuelNeeded} lbs) exceeds max fuel capacity (${maxFuel} lbs). Need refuel stop (+${refuelAmount} lbs)`);
            
            // Set the total fuel to max capacity
            result.totalFuel = maxFuel;
            // Add refuel indicator
            result.refuelNeeded = refuelAmount;
          }
          
          console.log('🚨 RETURNING FUEL DATA:', result);
          return result;
        }
      }
      
      // Option 2: Try to find the departure card in local stop cards (if different from stopCards)
      if (localStopCards && localStopCards.length > 0 && 
          (!stopCards || localStopCards.length !== stopCards.length)) {
        const departureCard = localStopCards.find(card => card.isDeparture);
        if (departureCard) {
          console.log('RouteStatsCard: Using departure card from localStopCards:', {
            totalFuel: departureCard.totalFuel,
            tripFuel: departureCard.fuelComponentsObject?.tripFuel,
            deckFuel: departureCard.deckFuel
          });
          
          const result = {
            totalFuel: departureCard.totalFuel || 0,
            tripFuel: departureCard.fuelComponentsObject?.tripFuel || 0,
            deckFuel: departureCard.deckFuel || 0,
            contingencyFuel: departureCard.fuelComponentsObject?.contingencyFuel || 0,
            reserveFuel: departureCard.fuelComponentsObject?.reserveFuel || 0,
            taxiFuel: departureCard.fuelComponentsObject?.taxiFuel || 0
          };
          
          // Check if total fuel exceeds max fuel capacity
          if (selectedAircraft && selectedAircraft.maxFuel && result.totalFuel > selectedAircraft.maxFuel) {
            const fuelNeeded = result.totalFuel;
            const maxFuel = selectedAircraft.maxFuel;
            const refuelAmount = fuelNeeded - maxFuel;
            
            console.log(`⚠️ WARNING: Required fuel (${fuelNeeded} lbs) exceeds max fuel capacity (${maxFuel} lbs). Need refuel stop (+${refuelAmount} lbs)`);
            
            // Set the total fuel to max capacity
            result.totalFuel = maxFuel;
            // Add refuel indicator
            result.refuelNeeded = refuelAmount;
          }
          
          return result;
        }
      }
      
    // Option 3: Calculate directly using StopCardCalculator if we have waypoints and aircraft
      if (waypoints && waypoints.length >= 2 && selectedAircraft && routeStats) {
        console.log('🚨 DEBUG CALCULATING DIRECTLY FROM STOPCARDCALCULATOR');
        console.log('🚨 SETTINGS BEING PASSED:', {
          passengerWeight,
          taxiFuel,
          contingencyFuelPercent,
          reserveFuel,
          deckTimePerStop,
          deckFuelFlow,
          deckTimePerStop_mins: deckTimePerStop,
          calculatedDeckFuel: Math.round((deckTimePerStop * (waypoints.length - 2) / 60) * deckFuelFlow)
        });
        
        try {
          // Use StopCardCalculator to calculate stop cards, then extract fuel data from the departure card
          const calculatedCards = StopCardCalculator.calculateStopCards(
            waypoints, 
            routeStats, 
            selectedAircraft, 
            weather, 
            {
              passengerWeight,
              taxiFuel,
              contingencyFuelPercent,
              reserveFuel,
              deckTimePerStop,
              deckFuelFlow
            }
          );
          
          // Additional debug log to confirm values in this code path
          console.log('🛫 Values passed to StopCardCalculator (direct fuel calculation):', {
            taxiFuel,
            passengerWeight
          });
          
          // Find the departure card
          const departureCard = calculatedCards.find(card => card.isDeparture);
          if (departureCard) {
            console.log('🚨 DEBUG FRESH CALCULATION RESULT:', {
              departure_card_totalFuel: departureCard.totalFuel,
              departure_card_components: departureCard.fuelComponentsObject,
              departure_card_text: departureCard.fuelComponents
            });
            
            const result = {
              totalFuel: departureCard.totalFuel || 0,
              tripFuel: departureCard.fuelComponentsObject?.tripFuel || 0,
              deckFuel: departureCard.deckFuel || 0,
              contingencyFuel: departureCard.fuelComponentsObject?.contingencyFuel || 0,
              reserveFuel: departureCard.fuelComponentsObject?.reserveFuel || 0,
              taxiFuel: departureCard.fuelComponentsObject?.taxiFuel || 0
            };
            
            // Check if total fuel exceeds max fuel capacity
            if (selectedAircraft && selectedAircraft.maxFuel && result.totalFuel > selectedAircraft.maxFuel) {
              const fuelNeeded = result.totalFuel;
              const maxFuel = selectedAircraft.maxFuel;
              const refuelAmount = fuelNeeded - maxFuel;
              
              console.log(`⚠️ WARNING: Required fuel (${fuelNeeded} lbs) exceeds max fuel capacity (${maxFuel} lbs). Need refuel stop (+${refuelAmount} lbs)`);
              
              // Set the total fuel to max capacity
              result.totalFuel = maxFuel;
              // Add refuel indicator
              result.refuelNeeded = refuelAmount;
            }
            
            return result;
          }
        } catch (error) {
          console.error('Error calculating from StopCardCalculator:', error);
          // Continue to fallback
        }
      }
      
    // Option 4: Final fallback to basic calculated values
      console.log('RouteStatsCard: No departure card found, using fallback calculated values');
      
      // Calculate all fuel components properly with simple, direct Number() conversions
      const calculatedTripFuel = stats?.fuelRequired || 0;
      
      try {
        // Calculate deck fuel simply
        const calculatedIntermediateStops = Math.max(0, waypoints?.length - 2 || 0);
        const calculatedDeckTimeHours = (calculatedIntermediateStops * Number(deckTimePerStop)) / 60;
        const calculatedDeckFuel = Math.round(calculatedDeckTimeHours * Number(deckFuelFlow));
        
        // Include ALL fuel components with direct Number conversion
        const calculatedContingencyFuel = Math.round((calculatedTripFuel * Number(contingencyFuelPercent)) / 100);
        const calculatedReserveFuel = Number(reserveFuel);
        const calculatedTaxiFuel = Number(taxiFuel);
        
        console.log('⛽ Fallback fuel calculation with direct values:', {
          taxiFuel,
          taxiFuel_asNumber: calculatedTaxiFuel,
          contingencyFuelPercent,
          reserveFuel,
          deckTimePerStop,
          deckFuelFlow
        });
        
        // Calculate total as sum of all components
        let calculatedTotalFuel = calculatedTripFuel + 
                                calculatedContingencyFuel + 
                                calculatedTaxiFuel + 
                                calculatedDeckFuel + 
                                calculatedReserveFuel;
        
        let refuelNeeded = 0;
        
        // Check if total fuel exceeds max fuel capacity
        if (selectedAircraft && selectedAircraft.maxFuel && calculatedTotalFuel > selectedAircraft.maxFuel) {
          const fuelNeeded = calculatedTotalFuel;
          const maxFuel = selectedAircraft.maxFuel;
          refuelNeeded = fuelNeeded - maxFuel;
          
          console.log(`⚠️ WARNING: Required fuel (${fuelNeeded} lbs) exceeds max fuel capacity (${maxFuel} lbs). Need refuel stop (+${refuelNeeded} lbs)`);
          
          // Set the total fuel to max capacity
          calculatedTotalFuel = maxFuel;
        }
        
        console.log('🚨 STRICT NUMBER CONVERSION FALLBACK FUEL CALCULATIONS:', {
          calculatedTripFuel,
          calculatedContingencyFuel,
          contingencyCalc: `${calculatedTripFuel} * ${contingencyFuelPercent} / 100 = ${calculatedContingencyFuel}`,
          calculatedTaxiFuel,
          taxiFuel_asNumber: calculatedTaxiFuel,
          calculatedDeckFuel,
          deckFuelCalc: `${calculatedIntermediateStops} * ${deckTimePerStop} / 60 * ${deckFuelFlow} = ${calculatedDeckFuel}`,
          calculatedReserveFuel,
          calculatedTotalFuel,
          // Original values
          taxiFuel_original: taxiFuel,
          deckTimePerStop_original: deckTimePerStop,
          deckFuelFlow_original: deckFuelFlow,
          contingencyFuelPercent_original: contingencyFuelPercent,
          intermediateStops: calculatedIntermediateStops
        });
        
        const result = {
          tripFuel: calculatedTripFuel,
          deckFuel: calculatedDeckFuel,
          totalFuel: calculatedTotalFuel,
          contingencyFuel: calculatedContingencyFuel,
          reserveFuel: calculatedReserveFuel,
          taxiFuel: calculatedTaxiFuel
        };
        
        if (refuelNeeded > 0) {
          result.refuelNeeded = refuelNeeded;
        }
        
        return result;
      } catch (error) {
        console.error('Error in fuel fallback calculation:', error);
        // Last resort emergency fallback
        return {
          tripFuel: 0,
          deckFuel: 0,
          totalFuel: 0,
          contingencyFuel: 0,
          reserveFuel: 0,
          taxiFuel: 0
        };
      }
    } catch (error) {
      console.error('Critical error in getFuelData:', error);
      // Emergency fallback with zeros
      return {
        tripFuel: 0,
        deckFuel: 0,
        totalFuel: 0,
        contingencyFuel: 0,
        reserveFuel: 0,
        taxiFuel: 0
      };
    }
  };
  
  // Get the fuel data with a safe default
  const fuelData = getFuelData() || {
    tripFuel: 0,
    deckFuel: 0,
    totalFuel: 0,
    contingencyFuel: 0,
    reserveFuel: 0,
    taxiFuel: 0
  };
  
  // Debug log what's actually being used in the render
  useEffect(() => {
    if (fuelData) {
      console.log('🚨 DEBUG FUEL DATA BEING USED FOR RENDER:', {
        fuelData,
        topCardTotalFuel: fuelData.totalFuel,
        componentSum: (
          (fuelData.tripFuel || 0) + 
          (fuelData.contingencyFuel || 0) + 
          (fuelData.taxiFuel || 0) + 
          (fuelData.deckFuel || 0) + 
          (fuelData.reserveFuel || 0)
        ),
        enhancedResults: routeStats?.enhancedResults ? true : false
      });
    } else {
      console.error('🚨 CRITICAL: fuelData is null or undefined');
    }
  }, [fuelData, forceRerender]);
  
  // Calculate maximum passengers based on usable load and passenger weight
  const calculateMaxPassengers = () => {
    // If we have calculatedPassengers from the flight calculator, use that
    if (stats.calculatedPassengers !== undefined) {
      return stats.calculatedPassengers;
    }
    
    // If routeStats has usableLoad and maxPassengers, use those directly
    if (stats.usableLoad !== undefined && stats.maxPassengers !== undefined) {
      console.log('Using maxPassengers directly from route stats:', stats.maxPassengers);
      return stats.maxPassengers;
    }
    
    // Check if we have stop cards with passenger info - most reliable source
    if (stopCards && stopCards.length > 0) {
      const departureCard = stopCards.find(card => card.isDeparture);
      if (departureCard && departureCard.maxPassengers !== undefined) {
        console.log('Using maxPassengers from departure card:', departureCard.maxPassengers);
        return departureCard.maxPassengers;
      }
    }
    
    // If we have local stop cards but no stopCards from props
    if (localStopCards && localStopCards.length > 0) {
      const departureCard = localStopCards.find(card => card.isDeparture);
      if (departureCard && departureCard.maxPassengers !== undefined) {
        console.log('Using maxPassengers from local departure card:', departureCard.maxPassengers);
        return departureCard.maxPassengers;
      }
    }
    
    // If we have fuelData and selectedAircraft, use PassengerCalculator
    if (selectedAircraft && fuelData && fuelData.totalFuel) {
      const maxPax = PassengerCalculator.calculateMaxPassengers(
        selectedAircraft,
        fuelData.totalFuel,
        passengerWeight
      );
      console.log('Calculated maxPassengers using PassengerCalculator:', maxPax);
      return maxPax;
    }
    
    // Last resort fallback - return 0 instead of using partial data
    return 0;
  };
  
  // Add a direct access to passengers from top card
  const getDisplayPassengers = () => {
    // First priority: Use the first stop card passenger count if available
    if (stopCards && stopCards.length > 0) {
      // Try departure card first
      const departureCard = stopCards.find(card => card.isDeparture);
      if (departureCard && departureCard.maxPassengers) {
        console.log('Using passenger count from departure card:', departureCard.maxPassengers);
        return departureCard.maxPassengers;
      }
      
      // If no specific departure card, use first card
      if (stopCards[0] && stopCards[0].maxPassengers) {
        console.log('Using passenger count from first card:', stopCards[0].maxPassengers);
        return stopCards[0].maxPassengers;
      }
    }
    
    // Second priority: Use localStopCards if available
    if (localStopCards && localStopCards.length > 0) {
      const departureCard = localStopCards.find(card => card.isDeparture);
      if (departureCard && departureCard.maxPassengers) {
        console.log('Using passenger count from local departure card:', departureCard.maxPassengers);
        return departureCard.maxPassengers;
      }
      
      if (localStopCards[0] && localStopCards[0].maxPassengers) {
        console.log('Using passenger count from first local card:', localStopCards[0].maxPassengers);
        return localStopCards[0].maxPassengers;
      }
    }
    
    // Last priority: Use calculated max passengers
    const calculated = calculateMaxPassengers();
    console.log('Using calculated max passengers as last resort:', calculated);
    return calculated;
  };
  
  // Initialize the route stats loader only once, with a cleanup function to remove any existing loaders first
  useEffect(() => {
    // First, remove any existing loading containers
    const existingContainers = document.querySelectorAll('.fp-loading-container');
    existingContainers.forEach(container => {
      container.remove();
    });
    
    // Clear any active status indicators
    if (LoadingIndicator && LoadingIndicator.clearStatusIndicator) {
      LoadingIndicator.clearStatusIndicator();
    }
    
    // Initialize the loading bar after a short delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      if (LoadingIndicator && LoadingIndicator.initializeRouteStatsLoader) {
        LoadingIndicator.initializeRouteStatsLoader();
      }
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(initTimer);
      
      // Remove any loading containers
      const containers = document.querySelectorAll('.fp-loading-container');
      containers.forEach(container => {
        container.remove();
      });
      
      // Clean up any loaders
      if (loaderIdRef.current !== null) {
        LoadingIndicator.hide(loaderIdRef.current);
        loaderIdRef.current = null;
      }
      
      // Clear any status messages
      if (LoadingIndicator && LoadingIndicator.clearStatusIndicator) {
        LoadingIndicator.clearStatusIndicator();
      }
    };
  }, []);
  
  // Log fuel data updates when it changes
  useEffect(() => {
    // Log when fuel data changes due to stop cards changes
    if (stopCards && stopCards.length > 0) {
      const departureCard = stopCards.find(card => card.isDeparture);
      if (departureCard) {
        console.log('⚠️ Fuel data updated from stop cards:', {
          totalFuel: departureCard.totalFuel,
          deckFuel: departureCard.deckFuel,
          tripFuel: departureCard.fuelComponentsObject?.tripFuel
        });
      }
    }
  }, [stopCards, forceRerender]);

  // Add loading indicator effect for waypoints changes
  useEffect(() => {
    // Show loading message when waypoints change
    if (waypoints && waypoints.length >= 2) {
      // Update the status indicator with a message
      if (LoadingIndicator && LoadingIndicator.updateStatusIndicator) {
        LoadingIndicator.updateStatusIndicator("Calculating route");
      }
    }
  }, [waypoints]);
  
  // Format time as HH:MM
  const formatTime = (timeHours) => {
    if (!timeHours && timeHours !== 0) return '00:00';
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Calculate total distance directly from waypoints if needed
  const calculateTotalDistance = (waypointArray) => {
    if (!waypointArray || waypointArray.length < 2 || !window.turf) return '0';
    
    try {
      let total = 0;
      for (let i = 0; i < waypointArray.length - 1; i++) {
        const from = window.turf.point(waypointArray[i].coords);
        const to = window.turf.point(waypointArray[i + 1].coords);
        const options = { units: 'nauticalmiles' };
        const legDistance = window.turf.distance(from, to, options);
        total += legDistance;
      }
      return total.toFixed(1);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return '0';
    }
  };
  
  // Calculate flight time - use existing values if valid, otherwise calculate
  const calculateFlightTime = (stats, waypointArray, aircraft) => {
    // First try to use estimatedTime or timeHours from stats
    if (stats.estimatedTime && stats.estimatedTime !== '00:00') {
      console.log('Using existing estimatedTime:', stats.estimatedTime);
      return stats.estimatedTime;
    }
    
    if (stats.timeHours && stats.timeHours > 0) {
      console.log('Formatting existing timeHours:', stats.timeHours);
      return formatTime(stats.timeHours);
    }
    
    // If we don't have valid time values but have waypoints and aircraft, calculate directly
    if (waypointArray && waypointArray.length >= 2 && aircraft && aircraft.cruiseSpeed && window.turf) {
      try {
        console.log('⚠️ Calculating flight time manually in RouteStatsCard');
        // Calculate distance
        let totalDistance;
        
        // Use existing distance if available, otherwise calculate
        if (stats.totalDistance && parseFloat(stats.totalDistance) > 0) {
          totalDistance = parseFloat(stats.totalDistance);
        } else {
          totalDistance = parseFloat(calculateTotalDistance(waypointArray));
        }
        
        // Try to use wind calculations if we have weather data
        let timeHours;
        const hasWindData = (stats.windData && window.WindCalculations) || (weather && window.WindCalculations);
        
        if (hasWindData) {
          console.log('⚠️ Attempting wind-adjusted flight time calculation');
          
          // Get wind data from stats or from weather prop
          const windData = stats.windData || weather;
          
          // Use it only if it actually has non-zero wind
          if (windData && windData.windSpeed > 0) {
            // If we have multiple waypoints, calculate average course
            if (waypointArray.length > 2) {
              // Calculate total time across all legs
              let totalTime = 0;
              
              for (let i = 0; i < waypointArray.length - 1; i++) {
                const from = window.turf.point(waypointArray[i].coords);
                const to = window.turf.point(waypointArray[i + 1].coords);
                const options = { units: 'nauticalmiles' };
                
                const legDistance = window.turf.distance(from, to, options);
                
                // Calculate course for this leg
                const fromPoint = {
                  lat: waypointArray[i].coords[1],
                  lon: waypointArray[i].coords[0]
                };
                
                const toPoint = {
                  lat: waypointArray[i + 1].coords[1],
                  lon: waypointArray[i + 1].coords[0]
                };
                
                const course = window.WindCalculations.calculateCourse(fromPoint, toPoint);
                
                // Calculate time with wind for this leg
                const legTime = window.WindCalculations.calculateWindAdjustedTime(
                  legDistance,
                  aircraft.cruiseSpeed,
                  course,
                  windData.windSpeed,
                  windData.windDirection
                );
                
                totalTime += legTime;
              }
              
              timeHours = totalTime;
              console.log(`⚠️ Multi-leg wind-adjusted flight time: ${timeHours.toFixed(2)} hours`);
            } else {
              // Single leg - calculate course
              const from = {
                lat: waypointArray[0].coords[1],
                lon: waypointArray[0].coords[0]
              };
              
              const to = {
                lat: waypointArray[1].coords[1],
                lon: waypointArray[1].coords[0]
              };
              
              const course = window.WindCalculations.calculateCourse(from, to);
              
              // Calculate time with wind
              timeHours = window.WindCalculations.calculateWindAdjustedTime(
                totalDistance,
                aircraft.cruiseSpeed,
                course,
                windData.windSpeed,
                windData.windDirection
              );
              
              console.log(`⚠️ Single-leg wind-adjusted flight time: ${timeHours.toFixed(2)} hours`);
            }
            
            // Mark as wind-adjusted
            if (routeStats) {
              routeStats.windAdjusted = true;
              
              // Set/update wind data
              if (!routeStats.windData) {
                routeStats.windData = {
                  windSpeed: windData.windSpeed,
                  windDirection: windData.windDirection
                };
              }
            }
          } else {
            // No wind or zero speed, fallback to basic calculation
            timeHours = totalDistance / aircraft.cruiseSpeed;
            console.log(`⚠️ Basic flight time (no wind): ${timeHours.toFixed(2)} hours`);
          }
        } else {
          // Basic calculation without wind
          timeHours = totalDistance / aircraft.cruiseSpeed;
          console.log(`⚠️ Basic flight time: ${timeHours.toFixed(2)} hours`);
        }
        
        // Format time and update stats for future use
        const formattedTime = formatTime(timeHours);
        
        console.log('⚠️ Manual flight time calculation:', {
          distance: totalDistance,
          cruiseSpeed: aircraft.cruiseSpeed,
          timeHours,
          formattedTime,
          windAdjusted: hasWindData
        });
        
        // Update routeStats object if it exists
        if (routeStats) {
          routeStats.timeHours = timeHours;
          routeStats.estimatedTime = formattedTime;
        }
        
        // Also update window.currentRouteStats if it exists
        if (window.currentRouteStats) {
          window.currentRouteStats.timeHours = timeHours;
          window.currentRouteStats.estimatedTime = formattedTime;
          
          // Also sync wind data
          if (routeStats && routeStats.windAdjusted) {
            window.currentRouteStats.windAdjusted = true;
            window.currentRouteStats.windData = { ...routeStats.windData };
          }
        }
        
        return formattedTime;
      } catch (error) {
        console.error('Error calculating flight time:', error);
      }
    }
    
    // Fallback to 00:00 if no valid time can be calculated
    return '00:00';
  };
  
  return (
    <div className="route-stats-card" ref={cardRef}>
      <div className="route-stats-header">
        <div className="logo-container">
          <img src="https://bristow.info/SAR/VTOL-5a215f01.png" alt="VTOL" className="vtol-logo" />
        </div>
        <div className="route-stats-title">
          {selectedAircraft ? (
            <span>{selectedAircraft.registration.split(' (')[0]} • {selectedAircraft.modelType}</span>
          ) : (
            <span>Route Statistics</span>
          )}
        </div>
        
        {/* Status indicator positioned in the middle of the header */}
        <div className="status-indicator-container" style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '100%',
          textAlign: 'center',
          zIndex: '100',
          pointerEvents: 'none'
        }}>
          <div className="status-indicator">
            {/* Status text will be updated dynamically with typewriter effect */}
          </div>
        </div>
        
        {/* Auth status container - always show on the right */}
        <div className="auth-status-container">
          {/* Username display with script font */}
          {isAuthenticated && userName && (
            <span className="username-display">{userName}</span>
          )}
          
          {/* Connection indicator dot - changes color based on status */}
          <span 
            className={`connection-indicator ${isAuthenticated ? 'connected' : 'disconnected'}`} 
            title={isAuthenticated ? 'Connected to OSDK' : 'Not connected to OSDK'}
          ></span>
        </div>
      </div>
      
      {/* Conditional rendering based on whether we have enhanced fuel calculations */}
      {routeStats && routeStats.enhancedResults ? (
        // Display the enhanced fuel display component when we have enhanced calculations
        <EnhancedFuelDisplay 
          fuelData={routeStats}
          selectedAircraft={selectedAircraft}
          onAdjustFuel={() => console.log('Adjust fuel clicked')}
          onChangeAlternate={() => console.log('Change alternate clicked')}
        />
      ) : (
        // Display the standard fuel display when we don't have enhanced calculations
        <div className="route-stats-content">
          <div className="stats-row">
            {/* Column 1: Total Distance and Trip Fuel */}
            <div className="route-stat-item">
              <div className="route-stat-label">Total Distance:</div>
              <div className="route-stat-value">
                {stats.totalDistance && stats.totalDistance !== '0' ? 
                  `${stats.totalDistance} NM` : 
                  (waypoints && waypoints.length >= 2 ? 
                    `${calculateTotalDistance(waypoints)} NM` : 
                    '0 NM')}
              </div>
            </div>
            
            {/* Column 2: Deck Time and Deck Fuel */}
            <div className="route-stat-item">
              <div className="route-stat-label">Deck Time:</div>
              <div className="route-stat-value">{stats.deckTimeMinutes || totalDeckTime} mins</div>
            </div>
            
            {/* Column 3: Flight Time and Total Time */}
            <div className="route-stat-item">
              <div className="route-stat-label">
                Flight Time:
                {isWindAdjusted && routeStats && routeStats.windData && (
                  <span style={{ 
                    fontSize: '0.8em', 
                    marginLeft: '4px', 
                    color: (routeStats.windData.avgHeadwind > 0) ? '#e74c3c' : '#2ecc71',
                    fontWeight: 'bold'
                  }}
                  title={`${Math.abs(routeStats.windData.avgHeadwind || 0)} kt ${(routeStats.windData.avgHeadwind || 0) > 0 ? 'headwind' : 'tailwind'}`}>
                    {(routeStats.windData.avgHeadwind || 0) > 0 ? 
                      ` (+${routeStats.windData.avgHeadwind}kt)` : 
                      ` (${routeStats.windData.avgHeadwind || 0}kt)`}
                  </span>
                )}
              </div>
              <div className="route-stat-value">
                {/* EMERGENCY FIX: Calculate time if needed */}
                {calculateFlightTime(stats, waypoints, selectedAircraft)}
              </div>
            </div>
            
            {/* Column 4: Total Fuel and Passengers */}
            <div className="route-stat-item">
              <div className="route-stat-label">Total Fuel:</div>
              <div className="route-stat-value">
                {(fuelData && fuelData.totalFuel) ? fuelData.totalFuel : '0'} lbs
                {fuelData && fuelData.refuelNeeded && (
                  <span style={{ 
                    fontSize: '0.8em', 
                    color: '#e74c3c', 
                    marginLeft: '5px', 
                    fontStyle: 'italic' 
                  }}>
                    (+{fuelData.refuelNeeded} lbs)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="stats-row">
            {/* Column 1: Trip Fuel (below Total Distance) */}
            <div className="route-stat-item">
              <div className="route-stat-label">Trip Fuel:</div>
              <div className="route-stat-value">
                {(fuelData && fuelData.tripFuel) ? fuelData.tripFuel : '0'} lbs
              </div>
            </div>
            
            {/* Column 2: Deck Fuel (below Deck Time) */}
            <div className="route-stat-item">
              <div className="route-stat-label">Deck Fuel:</div>
              <div className="route-stat-value">
                {(fuelData && fuelData.deckFuel) ? fuelData.deckFuel : '0'} lbs
              </div>
            </div>
            
            {/* Column 3: Total Time (below Flight Time) */}
            <div className="route-stat-item">
              <div className="route-stat-label">Total Time:</div>
              <div className="route-stat-value">{calculateTotalTime()}</div>
            </div>
            
            {/* Column 4: Passengers (below Total Fuel) */}
            <div className="route-stat-item">
              <div className="route-stat-label">Passengers:</div>
              <div className="route-stat-value" style={{ display: 'flex', alignItems: 'center' }}>
                {/* Try stopCards first, then fallback to localStopCards if needed */}
                {(stopCards && stopCards.length > 0) || (localStopCards && localStopCards.length > 0) ? (
                  <>
                    {(() => {
                      // Choose which cards to use - stopCards if available, otherwise localStopCards
                      const cardsToUse = (stopCards && stopCards.length > 0) ? stopCards : localStopCards;
                      
                      // Filter cards to get non-destination cards for passenger display
                      const cardsWithPassengers = cardsToUse.filter(card => !card.isDestination && card.maxPassengers !== undefined);
                      
                      // Return early if no valid cards
                      if (cardsWithPassengers.length === 0) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ marginRight: '2px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
                                  fill="#3498db" />
                              </svg>
                            </div>
                            <span style={{ fontSize: '0.9em' }}>0</span>
                          </div>
                        );
                      }
                      
                      // Define passenger colors array (same as in StopCard.jsx)
                      const colors = ['#3498db', '#614dd6', '#8c5ed6', '#c05edb', '#e27add', '#1abc9c'];
                      
                      // Display each passenger number with colored icon
                      return (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {cardsWithPassengers.map((card, idx) => {
                            // Get appropriate color based on index 
                            const iconColor = card.isDeparture ? '#3498db' : 
                                           colors[Math.min(idx, colors.length - 1)];
                            
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginRight: '0px' }}>
                                <div style={{ marginRight: '2px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
                                      fill={iconColor} />
                                  </svg>
                                </div>
                                <span style={{ fontSize: '0.9em' }}>{card.maxPassengers || 0}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ marginRight: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
                          fill="#3498db" />
                      </svg>
                    </div>
                    <span>{getDisplayPassengers()}</span>
                  </div>
                )}
                
                {/* Log passenger data for debugging */}
                {console.log("⭐ PASSENGER DATA DEBUG:", {
                  stopCardsCount: stopCards?.length || 0,
                  localStopCardsCount: localStopCards?.length || 0,
                  stopCards: stopCards?.map(c => ({
                    id: c.id,
                    index: c.index, 
                    isDeparture: c.isDeparture, 
                    isDestination: c.isDestination, 
                    maxPax: c.maxPassengers
                  }))
                })}
              </div>
            </div>
          </div>
          
          {/* Additional row for secondary fuel numbers */}
          <div className="stats-row" style={{ marginTop: '4px', fontSize: '0.85em' }}>
            {/* Column 1: Contingency Fuel */}
            <div className="route-stat-item">
              <div className="route-stat-label" style={{ color: '#777' }}>Contingency:</div>
              <div className="route-stat-value" style={{ color: '#777' }}>
                {(fuelData && fuelData.contingencyFuel) ? fuelData.contingencyFuel : '0'} lbs
              </div>
            </div>
            
            {/* Column 2: Taxi Fuel */}
            <div className="route-stat-item">
              <div className="route-stat-label" style={{ color: '#777' }}>Taxi Fuel:</div>
              <div className="route-stat-value" style={{ color: '#777' }}>
                {(fuelData && fuelData.taxiFuel) ? fuelData.taxiFuel : '0'} lbs
              </div>
            </div>
            
            {/* Column 3: Reserve Fuel */}
            <div className="route-stat-item">
              <div className="route-stat-label" style={{ color: '#777' }}>Reserve:</div>
              <div className="route-stat-value" style={{ color: '#777' }}>
                {(fuelData && fuelData.reserveFuel) ? fuelData.reserveFuel : '0'} lbs
              </div>
            </div>
            
            {/* Column 4: Empty for alignment */}
            <div className="route-stat-item">
              <div className="route-stat-label" style={{ color: '#777' }}></div>
              <div className="route-stat-value" style={{ color: '#777' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced info message if we're using enhanced calculations */}
      {routeStats && routeStats.enhancedResults && (
        <div className="enhanced-calculations-indicator" style={{
          textAlign: 'center',
          fontSize: '0.8em',
          color: '#3498db',
          padding: '4px',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderRadius: '4px',
          margin: '2px 0'
        }}>
          Using enhanced fuel calculations
        </div>
      )}
      
      {/* Local stop cards display */}
      {localStopCards && localStopCards.length > 0 && (
        <div className="route-stops" style={{ margin: '5px 0', padding: '8px 10px' }}>
          <h4 className="route-stops-title" style={{ 
            margin: '0 0 8px 0', 
            color: '#3498db', 
            fontSize: '0.85em', 
            fontWeight: '600', 
            textTransform: 'uppercase' 
          }}>ROUTE STOPS</h4>
          
          <div className="stop-cards-stack" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {localStopCards.map((card, index) => {
              // Determine styling based on stop type
              const borderColor = card.isDeparture ? '#2ecc71' : 
                                card.isDestination ? '#e74c3c' : 
                                '#3498db';
              const bgColor = card.isDeparture ? 'rgba(45, 55, 45, 0.95)' : 
                             card.isDestination ? 'rgba(55, 45, 45, 0.95)' : 
                             'rgba(45, 45, 55, 0.95)';
              
              // Format time as HH:MM
              const formatTime = (timeHours) => {
                if (!timeHours && timeHours !== 0) return '00:00';
                const hours = Math.floor(timeHours);
                const minutes = Math.floor((timeHours - hours) * 60);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              };
              
              // Determine stop number display
              const stopNumberDisplay = card.isDeparture ? 'D' : 
                                       card.isDestination ? 'F' : 
                                       card.index;
                                       
              return (
                <div key={`stop-${index}`} className={`stop-card ${card.isDeparture ? 'departure-card' : ''} ${card.isDestination ? 'destination-card' : ''}`} style={{
                  backgroundColor: bgColor,
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius: '3px',
                  padding: '8px 10px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer',
                  marginBottom: '5px'
                }}>
                  {/* Stop header with number and name */}
                  <div className="stop-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <div className="stop-number" style={{ 
                      backgroundColor: borderColor,
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75em',
                      fontWeight: 'bold',
                      marginRight: '8px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
                    }}>
                      {stopNumberDisplay}
                    </div>
                    <div className="stop-name" style={{
                      fontWeight: '600',
                      fontSize: '0.85em',
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px',
                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
                    }}>
                      {card.stopName || `Stop ${index + 1}`}
                    </div>
                  </div>
                  
                  {/* Stop details */}
                  <div className="stop-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    {/* Distance */}
                    <div className="stop-metric">
                      <span className="icon" style={{ color: borderColor }}>📍</span>
                      <div className="metric-value" style={{ fontSize: '0.75em', color: '#f5f5f5' }}>
                        {card.totalDistance || '0'} nm
                      </div>
                    </div>
                    
                    {/* Time */}
                    <div className="stop-metric">
                      <span className="icon" style={{ color: borderColor }}>⏱️</span>
                      <div className="metric-value" style={{ fontSize: '0.75em', color: '#f5f5f5' }}>
                        {formatTime(card.totalTime)}
                      </div>
                    </div>
                    
                    {/* Fuel */}
                    <div className="stop-metric">
                      <span className="icon" style={{ color: borderColor }}>⛽</span>
                      <div className="metric-value" style={{ fontSize: '0.75em', color: '#f5f5f5' }}>
                        {card.totalFuel || '0'} lbs
                      </div>
                    </div>
                    
                    {/* Passengers */}
                    <div className="stop-metric">
                      <span className="icon" style={{ color: borderColor }}>👥</span>
                      <div className="metric-value" style={{ fontSize: '0.75em', color: '#f5f5f5' }}>
                        {card.maxPassengersDisplay || card.maxPassengers || '0'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fuel Components */}
                  <div className="fuel-components" style={{ 
                    marginTop: '6px', 
                    paddingTop: '4px', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.7em',
                    color: 'rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <div className="fuel-components-text">
                      {/* Display fuel components using the prettier format for debugging */}
                      Trip: {card.fuelComponentsObject?.tripFuel || 0} • 
                      Cont: {card.fuelComponentsObject?.contingencyFuel || 0} • 
                      Taxi: {card.fuelComponentsObject?.taxiFuel || 0} • 
                      Deck: {card.fuelComponentsObject?.deckFuel || 0} • 
                      Res: {card.fuelComponentsObject?.reserveFuel || 0}
                    </div>
                    <div className="fuel-components-text" style={{ marginTop: '3px', color: '#999' }}>
                      {/* Show original string if available */}
                      {card.fuelComponents ? `Original: ${card.fuelComponents}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteStatsCard;
