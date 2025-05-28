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
  
  const loadWeatherSegments = useCallback(async (targetFlightId) => {
    if (!targetFlightId) return;
    
    setWeatherSegmentsLoading(true);
    setWeatherSegmentsError(null);
    
    try {
      const result = await WeatherSegmentsService.loadWeatherSegmentsForFlight(targetFlightId);
      
      if (result.success) {
        setWeatherSegments(result);
        
        const windData = WeatherSegmentsService.extractWindDataForRoute(result.segments);
        
        if (windData && onWeatherUpdate) {
          onWeatherUpdate(windData.windSpeed, windData.windDirection);
        }
        
        if (mapManagerRef?.current?.map && result.segments?.length > 0) {
          addWeatherSegmentsToMap(result);
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
      const { default: WeatherSegmentsLayer } = await import('../modules/layers/WeatherSegmentsLayer');
      
      if (!weatherLayer) {
        const newWeatherLayer = new WeatherSegmentsLayer(mapManagerRef.current.map);
        setWeatherLayer(newWeatherLayer);
        newWeatherLayer.addWeatherSegments(weatherData);
      } else {
        weatherLayer.addWeatherSegments(weatherData);
      }
    } catch (error) {
      console.error('useWeatherSegments: Error adding weather segments to map:', error);
    }
  }, [mapManagerRef, weatherLayer]);
  
  const toggleWeatherLayer = useCallback(() => {
    if (weatherLayer) {
      weatherLayer.toggle();
    }
  }, [weatherLayer]);
  
  const clearWeatherSegments = useCallback(() => {
    setWeatherSegments(null);
    setWeatherSegmentsError(null);
    if (weatherLayer) {
      weatherLayer.removeMainSegments();
    }
  }, [weatherLayer]);
  
  return {
    weatherSegments,
    weatherSegmentsLoading,
    weatherSegmentsError,
    loadWeatherSegments,
    toggleWeatherLayer,
    clearWeatherSegments,
    hasWeatherLayer: !!weatherLayer
  };
};

export default useWeatherSegments;