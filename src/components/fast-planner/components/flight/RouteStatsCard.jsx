import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import LoadingIndicator from '../../modules/LoadingIndicator';
import { EnhancedFuelDisplay } from '../fuel';
// Import the backup stop cards component
import generateBackupStopCards from '../../backup-stop-cards';

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
  waypoints,
  deckTimePerStop = 5,
  deckFuelPerStop = 100,
  deckFuelFlow = 400,
  passengerWeight = 220,
  cargoWeight = 0,
  taxiFuel = 50,
  contingencyFuelPercent = 10,
  reserveFuel = 600,
  weather = { windSpeed: 0, windDirection: 0 },
  // Add optional stopCards prop to get data from StopCardsContainer
  stopCards = []
}) => {
  // Add effect to generate backup stop cards if needed
  const [localStopCards, setLocalStopCards] = useState([]);
  
  useEffect(() => {
    // Only generate backup cards if we have waypoints, aircraft and route stats
    if (stopCards && stopCards.length > 0) {
      console.log('Using existing stop cards:', stopCards.length);
      setLocalStopCards(stopCards);
    } else if (waypoints && waypoints.length >= 2 && selectedAircraft && routeStats) {
      console.log('Generating backup stop cards');
      const backupCards = generateBackupStopCards(waypoints, routeStats, selectedAircraft, weather);
      setLocalStopCards(backupCards);
    }
  }, [stopCards, waypoints, selectedAircraft, routeStats, weather]);
  
  // Debug log for stop cards
  useEffect(() => {
    console.log('🔴 Stop Cards status:', {
      passed: stopCards ? stopCards.length : 0,
      local: localStopCards ? localStopCards.length : 0,
      waypoints: waypoints ? waypoints.length : 0
    });
  }, [stopCards, localStopCards, waypoints]);
  
  // Get authentication state and user details
  const { isAuthenticated, userName } = useAuth();
  
  // Reference to card element for adding/removing loading indicator
  const cardRef = useRef(null);
  
  // Reference to track the active loader ID
  const loaderIdRef = useRef(null);
  
  // Force rerendering when routeStats or waypoints change
  const [forceRerender, setForceRerender] = useState(0);
  
  // Force a rerender when routeStats change
  useEffect(() => {
    console.log("💥 RouteStatsCard - routeStats changed, forcing rerender");
    setForceRerender(prev => prev + 1);
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
  
  // Extra validation to catch zero time values
  if (routeStats && routeStats.timeHours === 0 && routeStats.estimatedTime === '00:00' && 
      routeStats.totalDistance && parseFloat(routeStats.totalDistance) > 0) {
    console.error("⚠️ RouteStatsCard - Invalid zero time with non-zero distance!", {
      totalDistance: routeStats.totalDistance,
      estimatedTime: routeStats.estimatedTime
    });
    
    // CRITICAL FIX: If zero time was received but we have distance and a valid selected aircraft, 
    // fix the time calculation immediately
    if (selectedAircraft && selectedAircraft.cruiseSpeed) {
      console.log("⚠️ RouteStatsCard - Fixing zero time with manual calculation");
      
      // Calculate time based on distance and cruise speed
      const totalDistance = parseFloat(routeStats.totalDistance);
      const timeHours = totalDistance / selectedAircraft.cruiseSpeed;
      
      // Format time string
      const hours = Math.floor(timeHours);
      const minutes = Math.floor((timeHours - hours) * 60);
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Update the routeStats object directly
      routeStats.timeHours = timeHours;
      routeStats.estimatedTime = estimatedTime;
      
      console.log("⚠️ RouteStatsCard - Fixed time values:", {
        timeHours,
        estimatedTime
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
  
  // Determine if time has been adjusted due to wind
  const isWindAdjusted = routeStats && routeStats.windAdjusted && routeStats.windData;
  
  // Get wind effect direction from actual weather data
  const windEffect = isWindAdjusted ? routeStats.windData.avgHeadwind : 0;
  
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
  
  // Calculate the number of landings (waypoints - 1 or 0 if no waypoints)
  const landingsCount = waypoints && waypoints.length > 1 ? waypoints.length - 1 : 0;
  
  // Calculate the number of intermediate stops (waypoints - 2 or 0 if less than 3 waypoints)
  // This matches the StopCardCalculator logic
  const intermediateStops = waypoints && waypoints.length > 2 ? waypoints.length - 2 : 0;
  
  // Calculate total deck time (in minutes) - prefer value from stats if available
  const totalDeckTime = routeStats?.deckTimeMinutes || (intermediateStops * deckTimePerStop);
  
  // Calculate total deck fuel using the same formula as StopCardCalculator
  // Convert deck time from minutes to hours and multiply by fuel flow rate
  const deckTimeHours = totalDeckTime / 60;
  const calculatedDeckFuel = Math.round(deckTimeHours * deckFuelFlow);
  
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
    // Use totalTimeFormatted from stats if available
    if (stats.totalTimeFormatted) {
      return stats.totalTimeFormatted;
    }
    
    // Get flight time from stats
    const flightTimeHours = stats.timeHours || 0;
    
    // Convert deck time from minutes to hours
    const deckTimeHours = totalDeckTime / 60;
    
    // Add flight time and deck time
    const totalTimeHours = flightTimeHours + deckTimeHours;
    
    // Format as HH:MM
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.floor((totalTimeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Get the departure stop card to get the TOTAL fuel required (which includes all components)
  // Using ONLY the official stop cards, no fallbacks, no mock data
  let totalFuel = 0;
  
  // ONLY use the departure card from the official stop cards
  if (stopCards && stopCards.length > 0) {
    const departureCard = stopCards.find(card => card.isDeparture);
    if (departureCard && departureCard.totalFuel) {
      totalFuel = departureCard.totalFuel;
      console.log('RouteStatsCard: Using departure card total fuel:', totalFuel);
    }
  }
  
  // Calculate maximum passengers based on usable load and passenger weight
  const calculateMaxPassengers = () => {
    // If we have calculatedPassengers from the flight calculator, use that
    if (stats.calculatedPassengers !== undefined) {
      return stats.calculatedPassengers;
    }
    
    // Otherwise calculate manually as a fallback
    if (!selectedAircraft || !stats.usableLoad) return 0;
    
    // Get max passengers from the aircraft data or calculate based on usable load
    const maxByLoad = Math.floor(stats.usableLoad / passengerWeight);
    const aircraftMaxPax = selectedAircraft.maxPassengers || 19;
    
    // Return the lower value (can't exceed aircraft capacity)
    return Math.min(maxByLoad, aircraftMaxPax);
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
                {stats.totalDistance || '0'} NM
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
                {isWindAdjusted && routeStats.windData.avgHeadwind !== 0 && (
                  <span style={{ 
                    fontSize: '0.8em', 
                    marginLeft: '4px', 
                    color: routeStats.windData.avgHeadwind > 0 ? '#e74c3c' : '#2ecc71',
                    fontWeight: 'bold'
                  }}
                  title={`${Math.abs(routeStats.windData.avgHeadwind)} kt ${routeStats.windData.avgHeadwind > 0 ? 'headwind' : 'tailwind'}`}>
                    {routeStats.windData.avgHeadwind > 0 ? 
                      ` (+${routeStats.windData.avgHeadwind}kt)` : 
                      ` (${routeStats.windData.avgHeadwind}kt)`}
                  </span>
                )}
              </div>
              <div className="route-stat-value">
                {/* Display estimatedTime from routeStats */}
                {stats.estimatedTime || "00:00"}
              </div>
            </div>
            
            {/* Column 4: Total Fuel and Passengers */}
            <div className="route-stat-item">
              <div className="route-stat-label">Total Fuel:</div>
              <div className="route-stat-value">
                {stopCards && stopCards.length > 0 && stopCards.find(card => card.isDeparture)?.totalFuel ? 
                  stopCards.find(card => card.isDeparture).totalFuel : 0} lbs
              </div>
            </div>
          </div>
          
          <div className="stats-row">
            {/* Column 1: Trip Fuel (below Total Distance) */}
            <div className="route-stat-item">
              <div className="route-stat-label">Trip Fuel:</div>
              <div className="route-stat-value">
                {/* Get trip fuel directly from departure card */}
                {stopCards && stopCards.length > 0 && stopCards.find(card => card.isDeparture)?.fuelComponentsObject?.tripFuel ? 
                  stopCards.find(card => card.isDeparture).fuelComponentsObject.tripFuel : 0} lbs
              </div>
            </div>
            
            {/* Column 2: Deck Fuel (below Deck Time) */}
            <div className="route-stat-item">
              <div className="route-stat-label">Deck Fuel:</div>
              <div className="route-stat-value">
                {/* Get deck fuel directly from departure card to ensure consistency */}
                {stopCards && stopCards.length > 0 && stopCards.find(card => card.isDeparture)?.deckFuel ? 
                  stopCards.find(card => card.isDeparture).deckFuel : 0} lbs
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
              <div className="route-stat-value">{calculateMaxPassengers()}</div>
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
                  {card.fuelComponents && (
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
                      <div className="fuel-components-text">{card.fuelComponents}</div>
                    </div>
                  )}
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