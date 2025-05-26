// src/components/fast-planner/hooks/useWeather.js

import { useState, useEffect } from 'react';
import * as WindCalc from '../modules/calculations/WindCalculations';
import ComprehensiveFuelCalculator from '../modules/calculations/fuel/ComprehensiveFuelCalculator';

/**
 * Custom hook to manage weather-related state and operations
 */
const useWeather = ({
  weather,
  setWeather,
  waypoints,
  selectedAircraft,
  routeCalculatorRef,
  waypointManagerRef,
  flightSettings,
  setRouteStats,
  setStopCards,
  setForceUpdate
}) => {
  // Ensure we've loaded WindCalculations globally
  useEffect(() => {
    if (!window.WindCalculations) {
      window.WindCalculations = WindCalc;
      console.log('🌬️ Made WindCalculations available globally through useWeather');
    }
  }, []);

  /**
   * Updates weather settings for the application
   * 
   * @param {number} windSpeed - Wind speed in knots
   * @param {number} windDirection - Direction wind is coming FROM in degrees (0-359)
   */
  const updateWeatherSettings = (windSpeed, windDirection) => {
    console.log('🌬️ updateWeatherSettings called with:', windSpeed, windDirection);

    // Ensure we have valid numbers
    const windSpeedNum = parseInt(windSpeed) || 0;
    // Normalize direction to 0-359 range
    const windDirectionNum = ((parseInt(windDirection) || 0) % 360 + 360) % 360;

    const newWeather = {
      windSpeed: windSpeedNum,
      windDirection: windDirectionNum
    };

    console.log(`🌬️ Updating weather settings: Wind ${newWeather.windSpeed} kts from ${newWeather.windDirection}°`);
    console.log('🌬️ Old weather state:', weather);

    // IMPORTANT FIX: Two-step update process to ensure correct wind calculations
    
    // Step 1: Clear the route display first
    if (waypointManagerRef.current) {
      console.log('🌬️ Step 1: Clearing route display to force redraw');
      waypointManagerRef.current.updateRoute(null);
    }
    
    // Step 2: Immediately set the new weather state
    setWeather(newWeather);
    
    // Step 3: Force an immediate UI update
    setForceUpdate(prev => prev + 1);
    
    // Step 4: Manually recalculate the route with the new wind settings
    if (waypoints && waypoints.length >= 2 && selectedAircraft) {
      console.log('🌬️ Manually recalculating route with new wind settings...');
      
      try {
        // Verify WindCalculations is available globally
        if (!window.WindCalculations) {
          console.log('🌬️ Making WindCalculations available globally');
          window.WindCalculations = WindCalc;
        }
        
        // First, use RouteCalculator for quick calculation with wind
        // This ensures the route lines and top card get proper wind-adjusted times
        if (routeCalculatorRef.current) {
          console.log('🌬️ Step 4a: Calculating wind-adjusted route with RouteCalculator');
          
          // Extract coordinates from waypoints
          const coordinates = waypoints.map(wp => wp.coords);
          
          // Calculate route stats with wind effects
          const basicRouteStats = routeCalculatorRef.current.calculateRouteStats(
            coordinates, 
            {
              selectedAircraft: selectedAircraft, 
              weather: newWeather,
              forceTimeCalculation: true // Force time calculation flag
            }
          );
          
          console.log('🌬️ RouteCalculator wind-adjusted results:', {
            timeHours: basicRouteStats?.timeHours,
            estimatedTime: basicRouteStats?.estimatedTime,
            windAdjusted: basicRouteStats?.windAdjusted || false,
            avgHeadwind: basicRouteStats?.windData?.avgHeadwind
          });
          
          // Ensure this calculated data is available globally
          window.currentRouteStats = basicRouteStats;
          
          // Update route display immediately with the basic wind-adjusted stats
          if (waypointManagerRef.current) {
            waypointManagerRef.current.updateRoute(basicRouteStats);
          }
        }
        
        // Step 5: Run comprehensive calculation for stop cards and full stats
        console.log('🌬️ Step 5: Running comprehensive calculation with wind effects');
        
        // Prepare numeric settings for calculation
        const numericSettings = {
          passengerWeight: Number(flightSettings.passengerWeight),
          taxiFuel: Number(flightSettings.taxiFuel),
          contingencyFuelPercent: Number(flightSettings.contingencyFuelPercent),
          reserveFuel: Number(flightSettings.reserveFuel),
          deckTimePerStop: Number(flightSettings.deckTimePerStop),
          deckFuelFlow: Number(flightSettings.deckFuelFlow),
          cargoWeight: Number(flightSettings.cargoWeight || 0)
        };
        
        console.log('🌬️ Using numeric settings for comprehensive calculation:', numericSettings);
        
        // Calculate with the new wind settings - use imported module directly
        const { enhancedResults, stopCards: newStopCards } = ComprehensiveFuelCalculator.calculateAllFuelData(
          waypoints,
          selectedAircraft,
          numericSettings,
          newWeather
        );

        if (enhancedResults) {
          console.log('🌬️ Comprehensive calculation complete with wind settings:', newWeather);
          
          // CRITICAL: Ensure wind data is properly set in all necessary places
          enhancedResults.windAdjusted = true;
          
          // Set wind data in the main object
          enhancedResults.windData = {
            windSpeed: newWeather.windSpeed,
            windDirection: newWeather.windDirection,
            avgHeadwind: enhancedResults.windData?.avgHeadwind || 0
          };
          
          // Also ensure each leg has proper wind data
          if (enhancedResults.legs && enhancedResults.legs.length > 0) {
            enhancedResults.legs.forEach((leg, index) => {
              // Calculate headwind for each leg if missing
              if (leg.headwind === undefined) {
                // If WindCalculations is available, try to calculate headwind
                if (window.WindCalculations && leg.course !== undefined) {
                  leg.headwind = window.WindCalculations.calculateHeadwindComponent(
                    newWeather.windSpeed, 
                    leg.course, 
                    newWeather.windDirection
                  );
                  console.log(`🌬️ Added headwind data to leg ${index+1}: ${leg.headwind.toFixed(2)} knots`);
                }
              }
            });
          }
          
          console.log('🌬️ Comprehensive calculation results:', {
            timeHours: enhancedResults.timeHours,
            estimatedTime: enhancedResults.estimatedTime,
            windAdjusted: enhancedResults.windAdjusted
          });
          
          // CRITICAL FIX: Transfer wind-adjusted time from enhancedResults to window.currentRouteStats
          // This ensures consistency between route display and stop cards
          if (window.currentRouteStats) {
            window.currentRouteStats.timeHours = enhancedResults.timeHours;
            window.currentRouteStats.estimatedTime = enhancedResults.estimatedTime;
            window.currentRouteStats.windAdjusted = true;
            window.currentRouteStats.windData = enhancedResults.windData;
            
            console.log('🌬️ Synchronized enhancedResults with window.currentRouteStats');
          }
          
          // Update state with new calculations
          setRouteStats(enhancedResults);
          setStopCards(newStopCards);
          
          // Step 6: Update the route display again with the comprehensive stats
          setTimeout(() => {
            if (waypointManagerRef.current) {
              console.log('🌬️ Step 6: Final route display update with comprehensive stats');
              waypointManagerRef.current.updateRoute(enhancedResults);
            }
          }, 100);
        }
      } catch (error) {
        console.error('🌬️ Error in wind calculation:', error);
        
        // Fallback: Update with current stats but with updated wind data
        if (window.currentRouteStats) {
          window.currentRouteStats.windAdjusted = true;
          window.currentRouteStats.windData = {
            windSpeed: newWeather.windSpeed,
            windDirection: newWeather.windDirection,
            avgHeadwind: window.currentRouteStats.windData?.avgHeadwind || 0
          };
          
          if (waypointManagerRef.current) {
            waypointManagerRef.current.updateRoute(window.currentRouteStats);
          }
        }
      }
    } else {
      // No waypoints or aircraft, just update the weather state
      console.log('🌬️ No waypoints or aircraft, just updating weather state');
    }
  };

  /**
   * Calculates wind effects on a route and updates route stats
   * 
   * @param {Object} route - The route object with legs and waypoints
   * @returns {Object} - Updated route stats with wind adjustments
   */
  const calculateWindEffects = (route) => {
    if (!route || !route.legs || !weather || weather.windSpeed === 0) {
      return route; // No wind or no route, return as is
    }

    try {
      if (!window.WindCalculations) {
        window.WindCalculations = WindCalc;
      }

      const updatedRoute = { ...route };
      updatedRoute.windAdjusted = true;
      updatedRoute.windData = {
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        avgHeadwind: 0
      };

      // Process each leg
      let totalHeadwind = 0;
      let totalHeadwindWeight = 0;
      let totalLegWeight = 0;
      
      if (updatedRoute.legs) {
        updatedRoute.legs.forEach((leg, index) => {
          if (leg.course !== undefined) {
            // Calculate headwind component
            const headwind = window.WindCalculations.calculateHeadwindComponent(
              weather.windSpeed,
              leg.course,
              weather.windDirection
            );
            leg.headwind = headwind;
            
            // For simple average (backward compatibility)
            totalHeadwind += headwind;
            
            // For time-weighted average (more accurate)
            if (leg.time !== undefined) {
              const legWeight = leg.time;
              totalHeadwindWeight += headwind * legWeight;
              totalLegWeight += legWeight;
            }
          }
        });

        // Calculate average headwind
        // First try time-weighted average if we have time data
        if (totalLegWeight > 0) {
          updatedRoute.windData.avgHeadwind = Math.round(totalHeadwindWeight / totalLegWeight);
          console.log('🌬️ Using time-weighted average headwind:', updatedRoute.windData.avgHeadwind);
        } else {
          // Fall back to simple average if no time data
          updatedRoute.windData.avgHeadwind = updatedRoute.legs.length > 0 
            ? Math.round(totalHeadwind / updatedRoute.legs.length) 
            : 0;
          console.log('🌬️ Using simple average headwind (no time data):', updatedRoute.windData.avgHeadwind);
        }
      }

      return updatedRoute;
    } catch (error) {
      console.error('Error calculating wind effects:', error);
      return route; // Return original on error
    }
  };

  return {
    updateWeatherSettings,
    calculateWindEffects
  };
};

export default useWeather;