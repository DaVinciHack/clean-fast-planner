/**
 * Enhanced StopCardCalculator with Weather Fuel Integration
 * 
 * This enhanced version integrates weather-based fuel distribution
 * with the existing stop card calculation system.
 * 
 * Key enhancements:
 * - Proper ARA fuel distribution (consumed at rigs)
 * - Proper approach fuel distribution (carried throughout)
 * - Weather segment analysis integration
 * - Maintains all existing functionality
 */

import WeatherStopCardFuelDistributor from '../../fuel/weather/WeatherStopCardFuelDistributor.js';

// Import the original calculator
import originalStopCardCalculator from './StopCardCalculator.js';

// Create an enhanced calculator instance
const weatherFuelDistributor = new WeatherStopCardFuelDistributor();

/**
 * Enhanced calculateStopCards with weather fuel integration
 * @param {Array} waypoints - Waypoints array
 * @param {Object} routeStats - Route statistics from RouteCalculator
 * @param {Object} selectedAircraft - Selected aircraft with performance data
 * @param {Object} weather - Weather data (windSpeed, windDirection)
 * @param {Object} options - Optional calculation parameters including weatherSegments
 * @returns {Array} Array of stop card objects with weather fuel properly distributed
 */
const calculateStopCardsWithWeather = (waypoints, routeStats, selectedAircraft, weather, options = {}) => {
  console.log('🌩️ Enhanced StopCardCalculator: Starting with weather fuel integration');
  
  // First, run the original stop card calculation
  const originalCards = originalStopCardCalculator.calculateStopCards(
    waypoints, 
    routeStats, 
    selectedAircraft, 
    weather, 
    options
  );
  
  // If no weather segments provided, return original cards
  if (!options.weatherSegments || options.weatherSegments.length === 0) {
    console.log('🌩️ No weather segments provided, returning original cards');
    return originalCards;
  }
  
  console.log('🌩️ Integrating weather fuel with', options.weatherSegments.length, 'weather segments');
  
  // Apply weather fuel distribution
  const enhancedCards = weatherFuelDistributor.distributeWeatherFuel(
    originalCards,
    waypoints,
    options.weatherSegments,
    {
      araFuelDefault: options.araFuelDefault || 200,
      approachFuelDefault: options.approachFuelDefault || 200
    }
  );
  
  console.log('🌩️ Weather fuel integration complete');
  return enhancedCards;
};

/**
 * Enhanced calculateAlternateStopCard with weather fuel integration
 * @param {Array} waypoints - Main route waypoints array
 * @param {Object} alternateRouteData - Alternate route information
 * @param {Object} routeStats - Route statistics from RouteCalculator
 * @param {Object} selectedAircraft - Selected aircraft with performance data
 * @param {Object} weather - Weather data (windSpeed, windDirection)
 * @param {Object} options - Calculation parameters including weatherSegments
 * @returns {Object|null} Enhanced alternate stop card object or null
 */
const calculateAlternateStopCardWithWeather = (waypoints, alternateRouteData, routeStats, selectedAircraft, weather, options = {}) => {
  console.log('🌩️ Enhanced AlternateStopCard: Starting with weather fuel integration');
  
  // First, run the original alternate calculation
  const originalCard = originalStopCardCalculator.calculateAlternateStopCard(
    waypoints,
    alternateRouteData,
    routeStats,
    selectedAircraft,
    weather,
    options
  );
  
  if (!originalCard) {
    return null;
  }
  
  // If no weather segments provided, return original card
  if (!options.weatherSegments || options.weatherSegments.length === 0) {
    console.log('🌩️ No weather segments provided for alternate, returning original card');
    return originalCard;
  }
  
  console.log('🌩️ Integrating weather fuel with alternate card');
  
  // For alternate route, we need to create a waypoints array representing the alternate route
  // This includes waypoints up to the split point + the alternate destination
  const splitPoint = alternateRouteData.splitPoint;
  const alternateDestination = alternateRouteData.destination;
  
  // Find split point index
  const splitPointIndex = waypoints.findIndex(wp => 
    wp.name && wp.name.toUpperCase() === splitPoint.toUpperCase()
  );
  
  if (splitPointIndex === -1) {
    console.warn('🌩️ Could not find split point for alternate weather analysis');
    return originalCard;
  }
  
  // Create alternate route waypoints (up to split point + alternate destination)
  const alternateWaypoints = waypoints.slice(0, splitPointIndex + 1);
  
  // Add alternate destination if it's not already included
  const alternateDestWaypoint = waypoints.find(wp => 
    wp.name && wp.name.toUpperCase() === alternateDestination.toUpperCase()
  ) || { name: alternateDestination, type: 'airport' };
  
  if (!alternateWaypoints.find(wp => wp.name === alternateDestWaypoint.name)) {
    alternateWaypoints.push(alternateDestWaypoint);
  }
  
  // Apply weather fuel distribution to the single alternate card
  const enhancedCards = weatherFuelDistributor.distributeWeatherFuel(
    [originalCard],
    alternateWaypoints,
    options.weatherSegments,
    {
      araFuelDefault: options.araFuelDefault || 200,
      approachFuelDefault: options.approachFuelDefault || 200
    }
  );
  
  console.log('🌩️ Weather fuel integration complete for alternate card');
  return enhancedCards[0];
};

/**
 * Get weather fuel analysis for debugging and display
 * @param {Array} waypoints - Route waypoints
 * @param {Array} weatherSegments - Weather segments from Palantir
 * @returns {Object} Weather fuel analysis details
 */
const getWeatherFuelAnalysis = (waypoints, weatherSegments) => {
  return weatherFuelDistributor.analyzeWeatherRequirements(weatherSegments, waypoints);
};

// Export the enhanced calculator with same interface as original
export default {
  calculateStopCards: calculateStopCardsWithWeather,
  calculateAlternateStopCard: calculateAlternateStopCardWithWeather,
  getWeatherFuelAnalysis,
  
  // Also export original functions for backward compatibility
  calculateStopCardsOriginal: originalStopCardCalculator.calculateStopCards,
  calculateAlternateStopCardOriginal: originalStopCardCalculator.calculateAlternateStopCard
};