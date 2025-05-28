import React, { useState, useEffect } from 'react';
import BaseCard from './BaseCard';
import WeatherSegmentsService from '../../../services/WeatherSegmentsService';

/**
 * Enhanced WeatherCard Component
 * 
 * Displays weather settings and OSDK weather segments data
 * Supports both manual weather input and OSDK weather data display
 */
const WeatherCard = ({ 
  id, 
  weather = { windSpeed: 15, windDirection: 270 },
  onWeatherUpdate = () => {},
  flightId = null, // Flight ID for loading OSDK weather segments
  showOSDKWeather = false // Toggle to show OSDK weather data
}) => {
  const [weatherSource, setWeatherSource] = useState('manual');
  const [osdkWeatherData, setOsdkWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  
  // Load OSDK weather data when flight ID is provided
  useEffect(() => {
    if (flightId && weatherSource === 'osdk') {
      loadOSDKWeatherData();
    }
  }, [flightId, weatherSource]);
  
  const loadOSDKWeatherData = async () => {
    if (!flightId) return;
    
    setLoadingWeather(true);
    setWeatherError(null);
    
    try {
      console.log('WeatherCard: Loading OSDK weather data for flight:', flightId);
      
      const result = await WeatherSegmentsService.loadWeatherSegmentsForFlight(flightId);
      
      if (result.success) {
        setOsdkWeatherData(result);
        
        // Extract wind data for route calculations
        const windData = WeatherSegmentsService.extractWindDataForRoute(result.segments);
        
        if (windData) {
          console.log('WeatherCard: Updating weather from OSDK data:', windData);
          onWeatherUpdate(windData.windSpeed, windData.windDirection);
        }
      } else {
        setWeatherError(result.error || 'Failed to load weather data');
      }
    } catch (error) {
      console.error('WeatherCard: Error loading OSDK weather:', error);
      setWeatherError('Error loading weather segments');
    } finally {
      setLoadingWeather(false);
    }
  };
  
  const handleWeatherSourceChange = (source) => {
    console.log('WeatherCard: Weather source changed to:', source);
    setWeatherSource(source);
    
    if (source === 'osdk' && flightId) {
      loadOSDKWeatherData();
    }
  };
  
  const renderOSDKWeatherData = () => {
    if (!osdkWeatherData) return null;
    
    return (
      <div className="osdk-weather-data">
        <h4>OSDK Weather Segments</h4>
        
        {osdkWeatherData.segments?.length > 0 && (
          <div className="weather-segments">
            <h5>Main Route Segments ({osdkWeatherData.segments.length})</h5>
            {osdkWeatherData.segments.slice(0, 5).map((segment, index) => (
              <div key={segment.uniqueId || index} className="weather-segment">
                <div className="segment-header">
                  <span className="airport-code">{segment.airportIcao}</span>
                  <span 
                    className="ranking-indicator" 
                    style={{ backgroundColor: segment.color }}
                  >
                    Rank: {segment.alternateRanking || 'N/A'}
                  </span>
                </div>
                <div className="segment-details">
                  <div>Wind: {segment.windDirection}° at {segment.windSpeed} kts</div>
                  <div>Distance: {Math.round(segment.distanceFromDeparture || 0)} nm</div>
                  {segment.warnings && (
                    <div className="warning">⚠️ {segment.warnings}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {osdkWeatherData.alternates?.length > 0 && (
          <div className="alternate-segments">
            <h5>Alternate Routes ({osdkWeatherData.alternates.length})</h5>
            {osdkWeatherData.alternates.slice(0, 3).map((segment, index) => (
              <div key={segment.uniqueId || index} className="alternate-segment">
                <div className="segment-header">
                  <span className="airport-code">{segment.airportIcao}</span>
                  <span 
                    className="ranking-indicator" 
                    style={{ backgroundColor: segment.color }}
                  >
                    Alt Rank: {segment.alternateRanking || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };  
  return (
    <BaseCard title="Weather Settings" id={id}>
      <div className="control-section">
        <h4>Weather Source</h4>
        
        <div className="weather-source-options">
          <div>
            <input 
              type="radio" 
              id="manual-weather" 
              name="weather-source" 
              checked={weatherSource === 'manual'}
              onChange={() => handleWeatherSourceChange('manual')}
            />
            <label htmlFor="manual-weather">Manual Weather Entry</label>
          </div>
          
          {flightId && (
            <div>
              <input 
                type="radio" 
                id="osdk-weather" 
                name="weather-source" 
                checked={weatherSource === 'osdk'}
                onChange={() => handleWeatherSourceChange('osdk')}
              />
              <label htmlFor="osdk-weather">OSDK Weather Segments</label>
            </div>
          )}
        </div>
        
        {weatherSource === 'manual' && (
          <>
            <h4>Manual Wind Settings</h4>
            <div className="settings-group">
              <div>
                <label htmlFor="wind-direction">Wind Direction (°):</label>
                <input 
                  type="number" 
                  id="wind-direction" 
                  value={weather.windDirection}
                  min="0" 
                  max="359"
                  onChange={(e) => {
                    const newDirection = parseInt(e.target.value) || 0;
                    const normalizedDirection = ((newDirection % 360) + 360) % 360;
                    onWeatherUpdate(weather.windSpeed, normalizedDirection);
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="wind-speed">Wind Speed (kts):</label>
                <input 
                  type="number" 
                  id="wind-speed" 
                  value={weather.windSpeed}
                  min="0" 
                  max="100"
                  onChange={(e) => {
                    const newSpeed = parseInt(e.target.value) || 0;
                    onWeatherUpdate(newSpeed, weather.windDirection);
                  }}
                />
              </div>
            </div>
          </>
        )}
        
        {weatherSource === 'osdk' && (
          <>
            {loadingWeather && (
              <div className="loading-indicator">Loading weather segments...</div>
            )}
            
            {weatherError && (
              <div className="error-message">⚠️ {weatherError}</div>
            )}
            
            {osdkWeatherData && renderOSDKWeatherData()}
          </>
        )}
        
        <div className="weather-data">
          <h4>Current Weather</h4>
          <div className="weather-item">
            <div className="weather-icon">🌤️</div>
            <div className="weather-details">
              <div>Wind: {weather.windDirection}° at {weather.windSpeed} kts</div>
              <div>Source: {weatherSource === 'osdk' ? 'OSDK Segments' : 'Manual Entry'}</div>
              {osdkWeatherData && (
                <div>Segments: {osdkWeatherData.totalSegments || 0}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

export default WeatherCard;