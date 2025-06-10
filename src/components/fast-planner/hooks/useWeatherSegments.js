// useWeatherSegments.js - Custom hook to manage OSDK weather segments

import { useState, useCallback } from 'react';
import WeatherSegmentsService from '../services/WeatherSegmentsService';

const useWeatherSegments = ({
  flightId,
  mapManagerRef,
  onWeatherUpdate
}) => {
  const [weatherSegments, setWeatherSegments] = useState(null);
  const [weatherSegmentsLoading, setWeatherSegmentsLoading] = useState(false);
  const [weatherSegmentsError, setWeatherSegmentsError] = useState(null);
  const [weatherLayer, setWeatherLayer] = useState(null);
  const [weatherCirclesLayer, setWeatherCirclesLayer] = useState(null);
  
  const loadWeatherSegments = useCallback(async (targetFlightId) => {
    if (!targetFlightId) return;
    
    setWeatherSegmentsLoading(true);
    setWeatherSegmentsError(null);
    
    try {
      const result = await WeatherSegmentsService.loadWeatherSegmentsForFlight(targetFlightId);
      
      if (result.success) {
        console.log('🌤️ useWeatherSegments: Successfully loaded', result.segments?.length, 'weather segments');
        setWeatherSegments(result.segments);
        
        const windData = WeatherSegmentsService.extractWindDataForRoute(result.segments);
        
        if (windData && onWeatherUpdate) {
          onWeatherUpdate(windData.windSpeed, windData.windDirection);
        }
        
        // RACE CONDITION FIX: Wait for map and segments to be ready, then add to map
        if (mapManagerRef?.current?.map && result.segments?.length > 0) {
          console.log('🌤️ useWeatherSegments: Map and segments ready, adding to map...');
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            addWeatherSegmentsToMap(result);
          }, 100);
        } else {
          console.log('🌤️ useWeatherSegments: Map or segments not ready:', {
            hasMap: !!mapManagerRef?.current?.map,
            segmentsLength: result.segments?.length
          });
        }
        
        return result;
      } else {
        setWeatherSegmentsError(result.error || 'Failed to load weather segments');
        return null;
      }
    } catch (error) {
      console.error('useWeatherSegments: Error loading weather segments:', error);
      setWeatherSegmentsError('Error loading weather segments');
      return null;
    } finally {
      setWeatherSegmentsLoading(false);
    }
  }, [mapManagerRef, onWeatherUpdate]);  
  const addWeatherSegmentsToMap = useCallback(async (weatherData) => {
    if (!mapManagerRef?.current?.map || !weatherData) return;
    
    try {
      // Load both weather layers
      const { default: WeatherSegmentsLayer } = await import('../modules/layers/WeatherSegmentsLayer');
      const { default: WeatherCirclesLayer } = await import('../modules/layers/WeatherCirclesLayer');
      
      // Add weather segments layer (existing functionality)
      if (!weatherLayer) {
        const newWeatherLayer = new WeatherSegmentsLayer(mapManagerRef.current.map);
        setWeatherLayer(newWeatherLayer);
        newWeatherLayer.addWeatherSegments(weatherData);
      } else {
        weatherLayer.addWeatherSegments(weatherData);
      }
      
      // Store weather circles layer reference but don't auto-create circles (prevent race conditions)
      if (!weatherCirclesLayer) {
        const newWeatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
        setWeatherCirclesLayer(newWeatherCirclesLayer);
        console.log('🟡 useWeatherSegments: Weather circles layer created, ready for manual activation');
        // Don't automatically add circles - let the flight loading process or manual toggle handle this
      } else {
        console.log('🟡 useWeatherSegments: Weather circles layer already exists');
      }
      
      console.log('useWeatherSegments: Added both weather segments and weather circles to map');
    } catch (error) {
      console.error('useWeatherSegments: Error adding weather segments to map:', error);
    }
  }, [mapManagerRef, weatherLayer, weatherCirclesLayer]);
  
  const toggleWeatherLayer = useCallback(() => {
    if (weatherLayer) {
      weatherLayer.toggle();
    }
  }, [weatherLayer]);
  
  const toggleWeatherCircles = useCallback(() => {
    if (weatherCirclesLayer) {
      weatherCirclesLayer.toggle();
    }
  }, [weatherCirclesLayer]);
  
  const clearWeatherSegments = useCallback(() => {
    setWeatherSegments(null);
    setWeatherSegmentsError(null);
    if (weatherLayer) {
      weatherLayer.removeMainSegments();
    }
    if (weatherCirclesLayer) {
      weatherCirclesLayer.removeWeatherCircles();
    }
  }, [weatherLayer, weatherCirclesLayer]);
  
  // Add test function for immediate testing
  const addTestWeatherCircles = useCallback(() => {
    if (weatherCirclesLayer) {
      weatherCirclesLayer.addTestCircles();
    } else if (mapManagerRef?.current?.map) {
      // Create the layer if it doesn't exist and add test circles
      import('../modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
        const newWeatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
        setWeatherCirclesLayer(newWeatherCirclesLayer);
        newWeatherCirclesLayer.addTestCircles();
      });
    }
  }, [weatherCirclesLayer, mapManagerRef]);

  return {
    weatherSegments,
    weatherSegmentsLoading,
    weatherSegmentsError,
    loadWeatherSegments,
    toggleWeatherLayer,
    toggleWeatherCircles,
    clearWeatherSegments,
    addTestWeatherCircles, // Add test function to exports
    hasWeatherLayer: !!weatherLayer,
    hasWeatherCircles: !!weatherCirclesLayer
  };
};

export default useWeatherSegments;