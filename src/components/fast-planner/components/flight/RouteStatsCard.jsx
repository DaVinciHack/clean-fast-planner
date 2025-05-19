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
  // Log received values for debugging once
  const loggedValues = useRef(false);
  useEffect(() => {
    if (!loggedValues.current) {
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
      loggedValues.current = true;
    }
  }, [taxiFuel, passengerWeight, contingencyFuelPercent, reserveFuel, deckTimePerStop, deckFuelFlow]);
  
  // Force rerendering when routeStats or waypoints change
  const [forceRerender, setForceRerender] = useState(0);
  
  // REMOVED: No longer calculating local stop cards, using single source of truth from StopCardsContainer
  
  // ENHANCEMENT: Setup update listener to force refresh when window.currentRouteStats changes
  useEffect(() => {
    // Register a global update function to allow external components to trigger updates
    window.triggerRouteStatsUpdate = () => {
      console.log('🔄 RouteStatsCard: Update triggered by external component');
      setForceRerender(prev => prev + 1);
    };
    
    return () => {
      // Clean up the global function when component unmounts
      window.triggerRouteStatsUpdate = undefined;
    };
  }, []);
  
  // NEW APPROACH: Get route data directly from stop cards
  // This simplifies the data flow and eliminates timing issues
  const getRouteDataFromStopCards = () => {
    // Directly use the stopCards prop if available
    if (stopCards && stopCards.length > 0) {
      console.log('📊 Getting route data directly from stopCards prop:', stopCards.length);
      
      // Find the departure card for fuel data
      const departureCard = stopCards.find(card => card.isDeparture);
      
      // Find the destination card for final distance and time
      const destinationCard = stopCards.find(card => card.isDestination);
      
      if (departureCard && destinationCard) {
        // Extract fuel data from departure card
        let fuelData = {
          totalFuel: Number(departureCard.totalFuel) || 0,
          deckFuel: Number(departureCard.deckFuel) || 0
        };
        
        // Extract fuel components if available
        if (departureCard.fuelComponentsObject) {
          fuelData = {
            ...fuelData,
            tripFuel: Number(departureCard.fuelComponentsObject.tripFuel) || 0,
            contingencyFuel: Number(departureCard.fuelComponentsObject.contingencyFuel) || 0,
            taxiFuel: Number(departureCard.fuelComponentsObject.taxiFuel) || 0,
            reserveFuel: Number(departureCard.fuelComponentsObject.reserveFuel) || 0
          };
        }
        
        // Extract distance and time from destination card
        const totalDistance = destinationCard.totalDistance || '0';
        
        // Extract time from destination card
        let totalTime = 0;
        if (destinationCard.totalTime) {
          totalTime = Number(destinationCard.totalTime) || 0;
        }
        
        // Get passenger data from all non-destination cards
        const passengerData = stopCards
          .filter(card => !card.isDestination)
          .map(card => ({
            id: card.id,
            stopName: card.stopName,
            isDeparture: card.isDeparture,
            maxPassengers: card.maxPassengers
          }));
        
        console.log('📊 Extracted data directly from stop cards:', {
          totalDistance,
          totalTime,
          totalFuel: fuelData.totalFuel,
          tripFuel: fuelData.tripFuel,
          passengerCount: passengerData.length
        });
        
        return {
          fuelData,
          totalDistance,
          totalTime,
          passengerData
        };
      }
    }
    
    // If we reach here, we couldn't get data from stop cards
    return null;
  };
  
  // Debug log for stop cards - use a ref to only log once when they change
  const loggedStopCards = useRef(false);
  useEffect(() => {
    if (stopCards && stopCards.length > 0 && !loggedStopCards.current) {
      console.log('🚨 STOP CARDS CHANGED:', {
        count: stopCards.length,
        firstCard: stopCards[0] ? {
          isDeparture: stopCards[0].isDeparture || false,
          totalFuel: stopCards[0].totalFuel || 0,
          deckFuel: stopCards[0].deckFuel || 0
        } : null,
        departureCard: stopCards.find(card => card.isDeparture) ? {
          totalFuel: stopCards.find(card => card.isDeparture).totalFuel || 0,
          deckFuel: stopCards.find(card => card.isDeparture).deckFuel || 0,
          components: stopCards.find(card => card.isDeparture).fuelComponents || ''
        } : 'No departure card found',
        destinationCard: stopCards.find(card => card.isDestination) ? {
          totalFuel: stopCards.find(card => card.isDestination).totalFuel || 0,
          components: stopCards.find(card => card.isDestination).fuelComponentsObject || {}
        } : 'No destination card found'
      });
      loggedStopCards.current = true;
    }
  }, [stopCards]);
  
  // Add special handling for the destination card specifically
  useEffect(() => {
    try {
      if (window.currentRouteStats?.stopCards && window.currentRouteStats.stopCards.length > 0) {
        const destinationCard = window.currentRouteStats.stopCards.find(card => card.isDestination);
        
        if (destinationCard) {
          // Validate the destination card's components
          console.log('🛡️ RouteStatsCard: Validating destination card:', {
            totalFuel: destinationCard.totalFuel,
            fuelComponentsObject: destinationCard.fuelComponentsObject
          });
          
          // Ensure all component fields exist with valid numbers
          if (destinationCard.fuelComponentsObject) {
            const requiredFields = ['reserveFuel', 'contingencyFuel', 'extraFuel', 'tripFuel', 'taxiFuel', 'deckFuel'];
            let modified = false;
            
            // Ensure all fields exist
            requiredFields.forEach(field => {
              if (destinationCard.fuelComponentsObject[field] === undefined) {
                destinationCard.fuelComponentsObject[field] = 0;
                modified = true;
              } else if (isNaN(destinationCard.fuelComponentsObject[field])) {
                destinationCard.fuelComponentsObject[field] = 0;
                modified = true;
              }
            });
            
            // Recalculate totalFuel if components were modified
            if (modified) {
              const sum = Object.values(destinationCard.fuelComponentsObject).reduce((total, val) => total + (Number(val) || 0), 0);
              destinationCard.totalFuel = sum;
              console.log('🛡️ RouteStatsCard: Fixed destination card:', {
                newTotal: sum,
                components: destinationCard.fuelComponentsObject
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error validating destination card:', error);
    }
  }, [window.currentRouteStats?.stopCards]);
  
  // Log passenger data once
  const loggedPassengerData = useRef(false);
  useEffect(() => {
    if (!loggedPassengerData.current && window.currentRouteStats?.passengerData) {
      console.log("⭐ PASSENGER DATA DEBUG (Single Source of Truth):", {
        passengerData: window.currentRouteStats?.passengerData || [],
        cardsCount: window.currentRouteStats?.passengerData?.length || 0
      });
      loggedPassengerData.current = true;
    }
  }, [window.currentRouteStats?.passengerData]);
  
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
  // FIXED: Remove this to prevent infinite update loop
  // This is causing the issue because it forces a rerender whenever routeStats changes
  // But other effects are also updating routeStats causing a circular dependency
  
  // FIXED: Remove this useEffect completely as it may be contributing to the update loop
  // We'll rely on React's natural rendering when props change instead of forcing rerenders
  
  // Add debug logging to track the routeStats data - only if needed for debugging
  // console.log("💥 RouteStatsCard - received stats:", {
  //   forceRerender,
  //   timeHours: routeStats?.timeHours,
  //   estimatedTime: routeStats?.estimatedTime,
  //   totalDistance: routeStats?.totalDistance,
  //   legs: routeStats?.legs?.length || 0
  // });
  
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
  
  // NEW: Ensure route stats with time data is also in window.currentRouteStats
  // This is critical for the WaypointManager to show time on the route lines
  // FIXED: Use a ref to track if we've already done this update to avoid circular loops
  const routeStatsUpdated = useRef(false);
  
  useEffect(() => {
    // Only update if we have valid data AND haven't already updated with this data
    if (routeStats && routeStats.timeHours && routeStats.timeHours > 0 && 
        routeStats.estimatedTime && routeStats.estimatedTime !== '00:00' && 
        !routeStatsUpdated.current) {
      
      console.log("⭐ Updating window.currentRouteStats with time data:", routeStats.estimatedTime);
      
      // Mark that we've updated to prevent loops
      routeStatsUpdated.current = true;
      
      // Create new object to avoid reference issues
      const updatedStats = window.currentRouteStats ? {...window.currentRouteStats} : {};
      
      // Update time data
      updatedStats.timeHours = routeStats.timeHours;
      updatedStats.estimatedTime = routeStats.estimatedTime;
      
      // Update aircraft - crucial for WaypointManager
      updatedStats.aircraft = selectedAircraft;
      
      // Update legs for display on route
      if (routeStats.legs && routeStats.legs.length > 0) {
        updatedStats.legs = [...routeStats.legs];
      }
      
      // Update wind data if available
      if (routeStats.windData) {
        updatedStats.windAdjusted = routeStats.windAdjusted;
        updatedStats.windData = {...routeStats.windData};
      }
      
      // Delay the update to break the render cycle
      setTimeout(() => {
        window.currentRouteStats = updatedStats;
      }, 0);
    }
  }, [routeStats, selectedAircraft]);
  
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
  // DIRECT FIX: Use routeStats values if available to ensure consistent display
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
  
  // CRITICAL FIX: Update routeStats in the window object to ensure consistency
  // But use a ref to track if we've already updated to prevent infinite loops
  const hasUpdatedGlobalStats = useRef(false);
  
  useEffect(() => {
    // Only update if we have valid routeStats and haven't already updated for this data
    if (routeStats && routeStats.timeHours && window.currentRouteStats && !hasUpdatedGlobalStats.current) {
      console.log("🔄 Updating window.currentRouteStats with latest values from routeStats:", {
        timeHours: routeStats.timeHours,
        estimatedTime: routeStats.estimatedTime,
        fuelRequired: routeStats.fuelRequired,
        tripFuel: routeStats.tripFuel
      });
      
      // Mark that we've updated to prevent repeated updates with the same data
      hasUpdatedGlobalStats.current = true;
      
      // Update the window.currentRouteStats with the latest values - use a shallow copy
      // to avoid updating the reference which could trigger more effects
      const updatedStats = {...window.currentRouteStats};
      updatedStats.timeHours = routeStats.timeHours;
      updatedStats.estimatedTime = routeStats.estimatedTime;
      updatedStats.fuelRequired = routeStats.fuelRequired;
      updatedStats.tripFuel = routeStats.tripFuel;
      
      // Only update after the current render cycle to prevent cascading updates
      setTimeout(() => {
        window.currentRouteStats = updatedStats;
      }, 0);
    }
  }, [routeStats]);
  
  // Calculate total time (flight time + deck time)
  const calculateTotalTime = () => {
    // SAFETY CHECK: Never calculate time without an aircraft
    if (!selectedAircraft) {
      console.warn('⚠️ SAFETY: Attempted to calculate total time without aircraft');
      return '00:00';
    }
    
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
  
  /**
   * REMOVED: getFuelData() function
   * We now directly use window.currentRouteStats.fuelData as the single source of truth
   * All calculations are performed in StopCardCalculator.js
   */
  
  // SIMPLIFIED: Get fuel data directly from stop cards without relying on global state
  const getFuelData = () => {
    try {
      // Get data directly from stop cards first - this is the most direct and reliable approach
      const directData = getRouteDataFromStopCards();
      if (directData && directData.fuelData) {
        console.log('⭐ Using fuel data directly from stop cards');
        
        // Calculate sum for verification
        const sum = (directData.fuelData.tripFuel || 0) + 
                    (directData.fuelData.contingencyFuel || 0) + 
                    (directData.fuelData.taxiFuel || 0) + 
                    (directData.fuelData.deckFuel || 0) + 
                    (directData.fuelData.reserveFuel || 0);
        
        // If totalFuel is inconsistent with the sum, use the sum
        if (Math.abs((directData.fuelData.totalFuel || 0) - sum) > 1) {
          console.warn('⚠️ Fixing inconsistent totalFuel in stop card data');
          return {
            ...directData.fuelData,
            totalFuel: sum,
            sum: sum
          };
        }
        
        return {
          ...directData.fuelData,
          sum: sum
        };
      }
      
      // Fall back to window.currentRouteStats if direct approach fails
      if (window.currentRouteStats?.fuelData) {
        console.log('⚠️ Falling back to window.currentRouteStats.fuelData');
        
        // Verify the fuel data is consistent
        const fuelData = window.currentRouteStats.fuelData;
        
        // Make defensive copies of all values to ensure they're valid numbers
        const safeValues = {
          tripFuel: typeof fuelData.tripFuel === 'number' ? fuelData.tripFuel : Number(fuelData.tripFuel) || 0,
          contingencyFuel: typeof fuelData.contingencyFuel === 'number' ? fuelData.contingencyFuel : Number(fuelData.contingencyFuel) || 0,
          taxiFuel: typeof fuelData.taxiFuel === 'number' ? fuelData.taxiFuel : Number(fuelData.taxiFuel) || 0,
          deckFuel: typeof fuelData.deckFuel === 'number' ? fuelData.deckFuel : Number(fuelData.deckFuel) || 0,
          reserveFuel: typeof fuelData.reserveFuel === 'number' ? fuelData.reserveFuel : Number(fuelData.reserveFuel) || 0,
          totalFuel: typeof fuelData.totalFuel === 'number' ? fuelData.totalFuel : Number(fuelData.totalFuel) || 0
        };
        
        // Recalculate sum
        const sum = safeValues.tripFuel + 
                   safeValues.contingencyFuel + 
                   safeValues.taxiFuel + 
                   safeValues.deckFuel + 
                   safeValues.reserveFuel;
        
        // Fix totalFuel if needed
        if (Math.abs(sum - safeValues.totalFuel) > 1 || isNaN(safeValues.totalFuel)) {
          return {
            ...safeValues,
            totalFuel: sum,
            sum: sum
          };
        }
        
        return {
          ...safeValues,
          sum: sum
        };
      }
      
      // Try to get data from routeStats as a last resort
      if (routeStats?.tripFuel) {
        console.warn('⚠️ Using routeStats for fuel data (last resort)');
        
        const tripFuelValue = Number(routeStats.tripFuel) || 0;
        const contingencyFuelValue = Math.round((tripFuelValue * Number(contingencyFuelPercent)) / 100);
        const taxiFuelValue = Number(taxiFuel) || 0;
        const reserveFuelValue = Number(reserveFuel) || 0;
        
        // Calculate deck fuel
        const intermediateStops = landingStopsOnly.length > 2 ? landingStopsOnly.length - 2 : 0;
        const deckTimeHours = (intermediateStops * Number(deckTimePerStop)) / 60;
        const deckFuelValue = Math.round(deckTimeHours * Number(deckFuelFlow));
        
        // Calculate sum
        const sum = tripFuelValue + 
                   contingencyFuelValue + 
                   taxiFuelValue + 
                   deckFuelValue + 
                   reserveFuelValue;
        
        return {
          tripFuel: tripFuelValue,
          contingencyFuel: contingencyFuelValue,
          taxiFuel: taxiFuelValue,
          deckFuel: deckFuelValue,
          reserveFuel: reserveFuelValue,
          totalFuel: sum,
          sum: sum
        };
      }
    } catch (error) {
      console.error('Error in getFuelData:', error);
    }
    
    // Default values if no data available or on error
    return {
      tripFuel: 0,
      deckFuel: 0,
      totalFuel: 0,
      contingencyFuel: 0,
      reserveFuel: 0,
      taxiFuel: 0,
      sum: 0
    };
  };
  
  // Get the verified fuel data
  const fuelData = getFuelData();
  
  // Debug log what's actually being used in the render - but only once to avoid loops
  const loggedFuelData = useRef(false);
  useEffect(() => {
    if (window.currentRouteStats?.fuelData && !loggedFuelData.current) {
      console.log('🚨 USING AUTHORITATIVE FUEL DATA FROM StopCardCalculator:', {
        fuelData: window.currentRouteStats.fuelData,
        topCardTotalFuel: window.currentRouteStats.fuelData.totalFuel,
        componentSum: (
          (window.currentRouteStats.fuelData.tripFuel || 0) + 
          (window.currentRouteStats.fuelData.contingencyFuel || 0) + 
          (window.currentRouteStats.fuelData.taxiFuel || 0) + 
          (window.currentRouteStats.fuelData.deckFuel || 0) + 
          (window.currentRouteStats.fuelData.reserveFuel || 0)
        ),
        enhancedResults: routeStats?.enhancedResults ? true : false,
        updateTrigger: window.currentRouteStats.updateTrigger || 'none'
      });
      loggedFuelData.current = true;
    }
  }, [window.currentRouteStats?.fuelData]);
  
  // SIMPLIFIED: Get passenger data directly from stop cards
  const getDisplayPassengers = () => {
    // Try to get data directly from stop cards
    const directData = getRouteDataFromStopCards();
    if (directData && directData.passengerData && directData.passengerData.length > 0) {
      // For the top card, we usually want the departure card passenger count
      const departureCard = directData.passengerData.find(card => card.isDeparture);
      if (departureCard && departureCard.maxPassengers !== undefined) {
        return departureCard.maxPassengers;
      }
      
      // If no specific departure card found, use the first card
      if (directData.passengerData[0] && directData.passengerData[0].maxPassengers !== undefined) {
        return directData.passengerData[0].maxPassengers;
      }
    }
    
    // Fall back to window.currentRouteStats if direct approach fails
    if (window.currentRouteStats?.passengerData && window.currentRouteStats.passengerData.length > 0) {
      const departureCard = window.currentRouteStats.passengerData.find(card => card.isDeparture);
      if (departureCard && departureCard.maxPassengers !== undefined) {
        return departureCard.maxPassengers;
      }
      
      if (window.currentRouteStats.passengerData[0] && window.currentRouteStats.passengerData[0].maxPassengers !== undefined) {
        return window.currentRouteStats.passengerData[0].maxPassengers;
      }
    }
    
    // Return 0 if no data is available
    return 0;
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
    // SAFETY CHECK: Never calculate time without an aircraft
    if (!aircraft) {
      console.warn('⚠️ SAFETY: Attempted to calculate flight time without aircraft');
      return '00:00';
    }
    
    // First try to use estimatedTime or timeHours from stats
    if (stats && stats.estimatedTime && stats.estimatedTime !== '00:00') {
      return stats.estimatedTime;
    }
    
    if (stats && stats.timeHours && stats.timeHours > 0) {
      return formatTime(stats.timeHours);
    }
    
    // If we don't have valid time values but have waypoints and aircraft, calculate directly
    if (waypointArray && waypointArray.length >= 2 && aircraft && aircraft.cruiseSpeed && window.turf) {
      try {
        // Calculate distance
        let totalDistance;
        
        // Use existing distance if available, otherwise calculate
        if (stats && stats.totalDistance && parseFloat(stats.totalDistance) > 0) {
          totalDistance = parseFloat(stats.totalDistance);
        } else {
          totalDistance = parseFloat(calculateTotalDistance(waypointArray));
        }
        
        // Basic calculation without wind (simplify to avoid complex calculations that could cause issues)
        const timeHours = totalDistance / aircraft.cruiseSpeed;
        const formattedTime = formatTime(timeHours);
        
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
                {(() => {
                  // First, try to get distance from destination card in stopCards
                  if (stopCards && stopCards.length > 0) {
                    const destinationCard = stopCards.find(card => card.isDestination);
                    if (destinationCard && destinationCard.totalDistance) {
                      return `${destinationCard.totalDistance} NM`;
                    }
                  }
                  
                  // Then, try from routeStats
                  if (stats.totalDistance && stats.totalDistance !== '0') {
                    return `${stats.totalDistance} NM`;
                  }
                  
                  // Last resort: calculate from waypoints
                  if (waypoints && waypoints.length >= 2) {
                    return `${calculateTotalDistance(waypoints)} NM`;
                  }
                  
                  return '0 NM';
                })()}
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
                {(() => {
                  // First, try to get time directly from destination card in stopCards
                  if (stopCards && stopCards.length > 0) {
                    const destinationCard = stopCards.find(card => card.isDestination);
                    if (destinationCard && destinationCard.totalTime) {
                      return formatTime(destinationCard.totalTime);
                    }
                  }
                  
                  // Then, fall back to calculating from stats
                  return calculateFlightTime(stats, waypoints, selectedAircraft);
                })()}
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
                {stopCards && stopCards.length > 0 ? (
                  <>
                    {(() => {
                      // Get the non-destination cards for passenger display directly from stopCards
                      const cardsWithPassengers = stopCards.filter(
                        card => !card.isDestination && card.maxPassengers !== undefined
                      );
                      
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
      
      {/* REMOVED: Local stop cards display (redundant, now using StopCardsContainer as single source of truth) */}
    </div>
  );
};

export default RouteStatsCard;
