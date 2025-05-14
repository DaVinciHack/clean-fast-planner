import React from 'react';
import BaseCard from './BaseCard';

/**
 * WeatherCard Component
 * 
 * Contains weather settings and conditions from the original RightPanel component.
 */
const WeatherCard = ({ 
  id, 
  weather = { windSpeed: 15, windDirection: 270 },
  onWeatherUpdate = () => {}
}) => {
  return (
    <BaseCard title="Weather Settings" id={id}>
      <div className="control-section">
        <h4>Weather Source</h4>
        
        <div className="weather-source-options">
          <div>
            <input type="radio" id="actual-weather" name="weather-source" defaultChecked />
            <label htmlFor="actual-weather">Use Actual Weather</label>
          </div>
          
          <div>
            <input type="radio" id="manual-weather" name="weather-source" />
            <label htmlFor="manual-weather">Manual Weather Entry</label>
          </div>
        </div>
        
        <h4>Wind Settings</h4>
        
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
                console.log('WeatherCard: Wind direction changed to:', newDirection);
                // Ensure valid range 0-359
                const normalizedDirection = ((newDirection % 360) + 360) % 360;
                // Important: Pass parameters in correct order (speed, direction)
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
                console.log('WeatherCard: Wind speed changed to:', newSpeed);
                // Important: Pass parameters in correct order (speed, direction)
                onWeatherUpdate(newSpeed, weather.windDirection);
              }}
            />
          </div>
        </div>
        
        <h4>Visibility & Ceiling</h4>
        
        <div className="settings-group">
          <div>
            <label htmlFor="visibility">Visibility (nm):</label>
            <input 
              type="number" 
              id="visibility" 
              defaultValue={10}
              min="0" 
              max="50"
              step="0.1"
            />
          </div>
          
          <div>
            <label htmlFor="ceiling">Ceiling (ft):</label>
            <input 
              type="number" 
              id="ceiling" 
              defaultValue={3000}
              min="0" 
              max="20000"
              step="100"
            />
          </div>
        </div>
        
        <button className="control-button">
          Apply Weather
        </button>
        
        <div className="weather-data">
          <h4>Current Weather</h4>
          <div className="weather-item">
            <div className="weather-icon">🌤️</div>
            <div className="weather-details">
              <div>Wind: {weather.windDirection}° at {weather.windSpeed} kts</div>
              <div>Visibility: 10 nm</div>
              <div>Ceiling: 3,000 ft</div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

export default WeatherCard;