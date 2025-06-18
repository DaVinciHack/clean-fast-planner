import React, { useState, useEffect } from 'react';
import BaseCard from './BaseCard';
import WeatherSegmentsService from '../../../services/WeatherSegmentsService';
import client from '../../../../../client';
import './weather-card-styles.css';

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
  
  // Automatically switch to OSDK mode when a flight ID is provided
  useEffect(() => {
    if (flightId && weatherSource === 'manual') {
      console.log('WeatherCard: Flight ID provided, switching to OSDK weather mode');
      setWeatherSource('osdk');
    }
  }, [flightId]);
  
  const loadOSDKWeatherData = async () => {
    if (!flightId) return;
    
    setLoadingWeather(true);
    setWeatherError(null);
    
    try {
      console.log('WeatherCard: Loading OSDK weather data for flight:', flightId);
      
      // Use the EXACT FlightApp method to fetch weather segments
      const sdk = await import('@flight-app/sdk');
      
      if (!sdk.NorwayWeatherSegments) {
        throw new Error('NorwayWeatherSegments not found in SDK');
      }
      
      console.log('Fetching NorwayWeatherSegments directly like FlightApp...');
      
      // Fetch exactly like FlightApp does
      const weatherResult = await client(sdk.NorwayWeatherSegments)
        .where({ flightUuid: flightId })
        .fetchPage({ $pageSize: 1000 });
        
      const weatherSegments = weatherResult.data || [];
      console.log(`Fetched ${weatherSegments.length} NorwayWeatherSegments directly`);
      
      if (weatherSegments.length > 0) {
        console.log("⭐ First weather segment structure:", JSON.stringify(weatherSegments[0], null, 2));
      }
      
      // Create result structure similar to our service but with raw data
      const result = {
        success: true,
        segments: weatherSegments, // Use raw segments directly
        alternates: [],
        weatherData: [],
        totalSegments: weatherSegments.length
      };
      
      setOsdkWeatherData(result);
      
      // DON'T automatically update global wind data from segments
      // Weather segments contain location-specific wind, but flight-level wind 
      // should come from Palantir's automation system (avgWindSpeed/avgWindDirection)
      console.log('WeatherCard: Weather segments loaded but NOT updating global wind settings');
      console.log('WeatherCard: Use flight-level automation wind, not segment-specific wind');
      
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
    
    console.log('WeatherCard: Processing OSDK weather data with', osdkWeatherData.segments?.length || 0, 'segments');
    
    // Create weatherDataMap using FlightApp method - organize by composite keys
    const weatherDataMap = new Map();
    
    if (osdkWeatherData.segments?.length > 0) {
      console.log('=== RAW SEGMENT INSPECTION ===');
      console.log('First segment object keys:', Object.keys(osdkWeatherData.segments[0]));
      console.log('First segment sample:', osdkWeatherData.segments[0]);
      
      osdkWeatherData.segments.forEach((weatherSegment) => {
        const icao = weatherSegment.airportIcao;
        if (!icao) return;
        
        console.log(`Processing weather segment for ${icao}:`, {
          airportRanking: weatherSegment.airportRanking,
          IsRig: weatherSegment.isRig,
          hasAirportRanking: weatherSegment.airportRanking !== undefined && weatherSegment.airportRanking !== null,
          // Debug: Show ALL properties that might contain ranking
          alternateRanking: weatherSegment.alternateRanking,
          isAlternateFor: weatherSegment.isAlternateFor,
          // Check for additional fields we need
          flightCategory: weatherSegment.flightCategory,
          weatherSource: weatherSegment.weatherSource,
          bestApproach: weatherSegment.bestApproach,
          approachSegment: weatherSegment.approachSegment,
          // Show a sample of all properties
          allProperties: Object.keys(weatherSegment).filter(key => 
            key.toLowerCase().includes('rank') || 
            key.toLowerCase().includes('alternate') ||
            key.toLowerCase().includes('airport') ||
            key.toLowerCase().includes('flight') ||
            key.toLowerCase().includes('weather') ||
            key.toLowerCase().includes('approach')
          )
        });
        
        // Use FlightApp composite key logic EXACTLY
        let compositeKey = `${icao}`; // Default key
        if (weatherSegment.isRig === true) {
          compositeKey = `${icao}-RIG`;
        } else if (weatherSegment.airportRanking === undefined || weatherSegment.airportRanking === null) {
          compositeKey = `${icao}-DEST`; // Destination
        } else {
          compositeKey = `${icao}-ALT-${weatherSegment.airportRanking}`; // Alternate
        }
        
        console.log(`Created composite key: ${compositeKey}`);
        
        // Collect weather segments for this location
        const locationWeatherSegments = [];
        let tafTimeRanking = null; // Track ranking for segment2 (TAF time of issue)
        
        for (let i = 1; i <= 10; i++) {
          const segmentText = weatherSegment[`segment${i}`];
          const segmentRanking = weatherSegment[`ranking${i}`];
          
          if (segmentText && segmentText.trim() !== '') {
            locationWeatherSegments.push({
              index: i,
              data: segmentText,
              ranking: segmentRanking
            });
            
            // segment2 contains the TAF time of issue - use this for approach color
            if (i === 2) {
              tafTimeRanking = segmentRanking;
              console.log(`Found TAF time segment for ${icao}: segment2 "${segmentText}" with ranking ${segmentRanking}`);
            }
          }
        }
        
        // If no segment2 ranking found, use first available segment ranking as fallback
        if (tafTimeRanking === null && locationWeatherSegments.length > 0) {
          tafTimeRanking = locationWeatherSegments[0].ranking;
          console.log(`Using first available segment ranking as fallback for ${icao}: ${tafTimeRanking}`);
        }
        
        // Store using composite key (FlightApp method)
        weatherDataMap.set(compositeKey, {
          ...weatherSegment,
          weatherSegments: locationWeatherSegments,
          icao: icao, // Add plain ICAO for convenience
          // Include additional OSDK fields that might be available
          flightCategory: weatherSegment.flightCategory,
          weatherSource: weatherSegment.weatherSource || icao,
          bestApproach: weatherSegment.bestApproach || weatherSegment.approachSegment,
          locationCode: icao,
          tafTimeRanking: tafTimeRanking // Store segment2 ranking for approach color
        });
      });
    }
    
    console.log('Created weatherDataMap with keys:', Array.from(weatherDataMap.keys()));
    
    // Process entries using FlightApp method EXACTLY
    let weatherEntries = Array.from(weatherDataMap.entries()).map(([compositeKey, data]) => {
      let locationType = 'Alternate'; // Default to Alternate (FlightApp pattern)
      
      // Extract plain ICAO from composite key (e.g., "ENZV-DEST" -> "ENZV")
      const icao = compositeKey.split('-')[0];
      
      if (data.isRig === true) {
        locationType = 'Rig';
      } else if (data.airportRanking === undefined || data.airportRanking === null) {
        // Assuming destination lacks airportRanking (FlightApp logic)
        locationType = 'Destination';
      }
      
      console.log(`Entry ${icao}: locationType=${locationType}, airportRanking=${data.airportRanking}`);
      
      // Return the composite key along with the data + locationType (FlightApp pattern)
      return [compositeKey, { ...data, locationType, icao }];
    });
    
    // FlightApp sorting logic EXACTLY
    weatherEntries.sort(([, weatherA], [, weatherB]) => {
      const typeA = weatherA.locationType;
      const typeB = weatherB.locationType;
      const rankA = weatherA.airportRanking ?? 999; // Use a high number for undefined/null ranks
      const rankB = weatherB.airportRanking ?? 999;
      const timeA = weatherA.arrivalTime ? new Date(weatherA.arrivalTime).getTime() : Infinity;
      const timeB = weatherB.arrivalTime ? new Date(weatherB.arrivalTime).getTime() : Infinity;

      // 1. Sort by Type: Rig > Destination > Alternate (FlightApp order)
      const typeOrder = { Rig: 1, Destination: 2, Alternate: 3 };
      if (typeOrder[typeA] !== typeOrder[typeB]) {
        return typeOrder[typeA] - typeOrder[typeB];
      }

      // 2. Within Rigs: Sort by arrival time
      if (typeA === 'Rig') {
        return timeA - timeB;
      }

      // 3. Within Alternates: Sort by ranking (FlightApp logic)
      if (typeA === 'Alternate') {
        const isClosedA = rankA === 20;
        const isClosedB = rankB === 20;
        if (isClosedA && !isClosedB) return 1;  // Closed A goes after open B
        if (!isClosedA && isClosedB) return -1; // Open A goes before closed B
        // If both open or both closed, sort by original ranking
        return rankA - rankB;
      }

      // Destination sorting (if multiple destinations somehow existed, sort by time)
      if (typeA === 'Destination') {
        return timeA - timeB;
      }

      return 0;
    });
    
    console.log('Final sorted entries:', weatherEntries.map(([key, data]) => ({
      key,
      icao: data.icao,
      type: data.locationType,
      originalRanking: data.airportRanking
    })));
    
    // Assign sequential display numbers to alternates
    let alternateSequence = 1;
    weatherEntries.forEach(([key, data]) => {
      if (data.locationType === 'Alternate') {
        if (data.airportRanking === 20) {
          data.displayRanking = '✕'; // X for closed alternates
        } else {
          data.displayRanking = alternateSequence;
          alternateSequence++;
        }
      }
    });
    
    console.log('After assigning sequential rankings:', weatherEntries.map(([key, data]) => ({
      key,
      icao: data.icao,
      type: data.locationType,
      originalRanking: data.airportRanking,
      displayRanking: data.displayRanking
    })));
    
    return (
      <div className="osdk-weather-data">
        <h4>Weather Data ({weatherEntries.length} locations)</h4>
        
        {weatherEntries.map(([compositeKey, location]) => (
          <div 
            key={compositeKey} 
            className="location-weather-card"
          >
            {/* Header with location name in box and ranking disk */}
            <div className="location-card-header">
              <div className="location-info">
                <span 
                  className="location-code-box"
                  style={{
                    color: location.segment1?.includes('(DAY)') ? '#FFFFFF' : '#2196F3',
                    borderColor: location.segment1?.includes('(DAY)') ? '#FFFFFF' : '#2196F3'
                  }}
                >
                  {location.icao || location.locationCode}
                </span>
                <span className="location-type">{location.locationType}</span>
              </div>
              
              {/* Alternate ranking disk - shows sequential numbers */}
              {location.locationType === 'Alternate' && location.airportRanking !== undefined && location.airportRanking !== null && (
                <div 
                  className="alternate-ranking-disk"
                  style={{ 
                    backgroundColor: getRankingColor(location.airportRanking),
                    position: 'absolute',
                    top: '8px',
                    right: '8px'
                  }}
                  title={`Alternate ranking: ${location.airportRanking} (Display: ${location.displayRanking})`}
                >
                  {location.displayRanking}
                </div>
              )}
            </div>
            
            {/* Flight category and details */}
            <div className="flight-details">
              {/* Only show flight category if we have it from OSDK data */}
              {location.flightCategory && (
                <div className="flight-category">
                  flightCategory • <span className="vfr-tag">{location.flightCategory}</span>
                </div>
              )}
              
              {location.estimatedFlightTime && (
                <div className="flight-time">
                  Estimated Flight Time • {location.estimatedFlightTime}
                </div>
              )}
              
              {/* Best approach info for alternates - uses TAF time segment ranking (segment2) */}
              {location.locationType === 'Alternate' && location.bestApproach && (
                <div className="best-approach">
                  Best Approach • 
                  <span 
                    className="approach-badge"
                    style={{ 
                      '--outline-color': getAviationRankingColor(location.tafTimeRanking),
                      marginLeft: '4px'
                    }}
                  >
                    {location.bestApproach}
                  </span>
                </div>
              )}
              
              {/* Weather source - from OSDK data */}
              {location.weatherSource && (
                <div className="weather-source">
                  Weather Source • {location.weatherSource}
                </div>
              )}
              
              {/* Warning messages - orange outline style */}
              {location.airportRanking === 20 && (
                <div className="warning-section">
                  Warnings • 
                  <span className="warning-outline">NO VALID TAF FOR ARRIVAL</span>
                </div>
              )}
            </div>
            
            {/* Raw METAR */}
            <div className="raw-metar-section">
              <span className="metar-label">Raw Metar •</span>
              <div className="metar-text">
                {location.rawMetar || 'No METAR available'}
              </div>
            </div>
            
            {/* Arrival time with day/night colors */}
            {location.arrivalTime && (
              <div className="arrival-section">
                <span 
                  className="arrival-text"
                  style={{ 
                    color: location.segment1?.includes('(DAY)') ? '#FFFFFF' : '#2196F3' 
                  }}
                >
                  {location.segment1 || `Arrival at ${location.locationCode}: ${formatArrivalTime(location.arrivalTime)}`}
                </span>
              </div>
            )}
            
            {/* Weather segments - text outline style */}
            {location.weatherSegments && location.weatherSegments.length > 0 && (
              <div className="weather-segments-list">
                {location.weatherSegments
                  .filter(segment => segment.data && segment.data !== 'No data' && segment.ranking !== undefined)
                  .map((segment, idx) => (
                    <span 
                      key={idx}
                      className="segment-badge"
                      style={{ 
                        '--outline-color': getAviationRankingColor(segment.ranking),
                        marginRight: '4px',
                        marginBottom: '4px',
                        display: 'inline-block'
                      }}
                      title={`Segment ${segment.index} - Ranking: ${segment.ranking}`}
                    >
                      {segment.data}
                    </span>
                  ))
                }
              </div>
            )}
            
            {/* Last updated timestamp with warning if > 3 hours */}
            {location.timestamp && (
              <div className="update-timestamp">
                Updated at • 
                {isTimestampOld(location.timestamp) ? (
                  <span className="timestamp-warning">{formatTimestamp(location.timestamp)}</span>
                ) : (
                  <span className="timestamp-normal">{formatTimestamp(location.timestamp)}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Helper function to get color based on location type
  const getLocationTypeColor = (locationType) => {
    switch (locationType) {
      case 'Rig':
        return '#00BCD4'; // Cyan for rigs
      case 'Destination':
        return '#4CAF50'; // Green for destination
      case 'Alternate':
        return '#FF9800'; // Orange for alternates
      default:
        return '#2196F3'; // Blue default
    }
  };
  
  // CENTRALIZED COLOR LOGIC - Single source of truth for all ranking colors
  const getAviationRankingColor = (ranking) => {
    switch (ranking) {
      case 5:
        return '#D32F2F'; // Red - Below alternate minimums
      case 8:
        return '#8E24AA'; // Brighter purple - ARA fuel needed at rig
      case 10:
        return '#F57C00'; // Orange - Warning conditions
      case 15:
        return '#66BB6A'; // Much brighter green - Good conditions
      case 20:
        return '#616161'; // Grey - Not applicable to landing time
      default:
        return '#1976D2'; // Blue - Default/unknown
    }
  };

  // Helper function for alternate ranking disk colors (darker blue to purple, max 6 colors)
  const getRankingColor = (ranking) => {
    // For alternate ranking disks ONLY, use dark blue to purple progression (max 6)
    // Remove the aviation color check - use progression for ALL rankings
    switch (ranking) {
      case 1:
        return '#1565C0'; // Dark blue - Best alternate
      case 2:
        return '#283593'; // Dark indigo
      case 3:
        return '#4527A0'; // Dark purple-blue
      case 4:
        return '#6A1B9A'; // Dark purple
      case 5:
        return '#8E24AA'; // Brighter purple (NOT red anymore!)
      case 6:
        return '#9C27B0'; // Brightest purple
      case 20:
        return '#424242'; // Dark grey - Closed/outside window
      default:
        // For any ranking > 6, cycle through the colors
        const colorIndex = ((ranking - 1) % 6) + 1;
        return getRankingColor(colorIndex);
    }
  };
  

  // Helper function to check if timestamp is more than 3 hours old
  const isTimestampOld = (timestamp) => {
    if (!timestamp) return false;
    
    try {
      const now = new Date();
      const updated = new Date(timestamp);
      const hoursOld = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
      return hoursOld > 3;
    } catch (error) {
      return false;
    }
  };

  // Helper function to format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const hoursOld = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (hoursOld < 1) {
        return `${Math.round(hoursOld * 60)} minutes ago`;
      } else {
        return `${Math.round(hoursOld)} hours ago`;
      }
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Helper function to format arrival time
  const formatArrivalTime = (arrivalTime) => {
    if (!arrivalTime) return 'N/A';
    
    try {
      const date = new Date(arrivalTime);
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}Z`;
    } catch (error) {
      return arrivalTime;
    }
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