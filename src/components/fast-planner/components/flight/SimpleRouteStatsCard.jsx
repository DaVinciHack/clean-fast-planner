import React from 'react';
import { useAuth } from '../../../../context/AuthContext';

/**
 * SimpleRouteStatsCard Component
 * 
 * A simplified version of RouteStatsCard that displays basic route statistics with minimal complexity
 * This component avoids complex calculations and dependencies to ensure stability
 */
const SimpleRouteStatsCard = ({ 
  selectedAircraft, 
  stopCards = [],
  taxiFuel = 50,           
  reserveFuel = 600,      
  contingencyFuelPercent = 5, 
  deckTimePerStop = 5
}) => {
  // Get authentication state and user details
  const { isAuthenticated, userName } = useAuth();
  
  // Simple helper to format time as HH:MM
  const formatTime = (timeHours) => {
    if (!timeHours && timeHours !== 0) return '00:00';
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Helper to get a safe number value
  const safeNumber = (value) => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };
  
  // Extract data directly from stop cards when possible
  let totalDistance = '0.0';
  let flightTime = '00:00';
  let totalFuel = 0;
  let tripFuel = 0;
  let deckFuel = 0;
  let contingencyFuel = 0;
  let passengers = [];
  
  // Find the departure and destination cards
  let departureCard = null;
  let destinationCard = null;
  
  if (stopCards && stopCards.length > 0) {
    departureCard = stopCards.find(card => card.isDeparture);
    destinationCard = stopCards.find(card => card.isDestination);
    
    // Get distance from destination card
    if (destinationCard && destinationCard.totalDistance) {
      totalDistance = destinationCard.totalDistance;
    }
    
    // Get time from destination card
    if (destinationCard && destinationCard.totalTime) {
      flightTime = formatTime(destinationCard.totalTime);
    }
    
    // Get fuel data from departure card
    if (departureCard) {
      totalFuel = safeNumber(departureCard.totalFuel);
      deckFuel = safeNumber(departureCard.deckFuel);
      
      // Get fuel components if available
      if (departureCard.fuelComponentsObject) {
        tripFuel = safeNumber(departureCard.fuelComponentsObject.tripFuel);
        contingencyFuel = safeNumber(departureCard.fuelComponentsObject.contingencyFuel);
      }
    }
    
    // Get passenger data from all non-destination cards
    passengers = stopCards
      .filter(card => !card.isDestination && card.maxPassengers !== undefined)
      .map(card => ({
        id: card.id,
        isDeparture: card.isDeparture,
        maxPassengers: safeNumber(card.maxPassengers)
      }));
  }
  
  // Calculate a basic deck time
  const intermediateStops = Math.max(0, stopCards.length - 2);
  const totalDeckTime = intermediateStops * safeNumber(deckTimePerStop);
  
  // Calculate a very simple total time (flight time + deck time)
  let totalTimeHours = 0;
  if (flightTime !== '00:00') {
    const [hours, minutes] = flightTime.split(':').map(Number);
    totalTimeHours = hours + (minutes / 60);
  }
  const deckTimeHours = totalDeckTime / 60;
  const totalTime = formatTime(totalTimeHours + deckTimeHours);
  
  return (
    <div className="route-stats-card">
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
      
      {/* Simple stats display */}
      <div className="route-stats-content">
        <div className="stats-row">
          {/* Column 1: Total Distance */}
          <div className="route-stat-item">
            <div className="route-stat-label">Total Distance:</div>
            <div className="route-stat-value">{totalDistance} NM</div>
          </div>
          
          {/* Column 2: Deck Time */}
          <div className="route-stat-item">
            <div className="route-stat-label">Deck Time:</div>
            <div className="route-stat-value">{totalDeckTime} mins</div>
          </div>
          
          {/* Column 3: Flight Time */}
          <div className="route-stat-item">
            <div className="route-stat-label">Flight Time:</div>
            <div className="route-stat-value">{flightTime}</div>
          </div>
          
          {/* Column 4: Total Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label">Total Fuel:</div>
            <div className="route-stat-value">{totalFuel} lbs</div>
          </div>
        </div>
        
        <div className="stats-row">
          {/* Column 1: Trip Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label">Trip Fuel:</div>
            <div className="route-stat-value">{tripFuel} lbs</div>
          </div>
          
          {/* Column 2: Deck Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label">Deck Fuel:</div>
            <div className="route-stat-value">{deckFuel} lbs</div>
          </div>
          
          {/* Column 3: Total Time */}
          <div className="route-stat-item">
            <div className="route-stat-label">Total Time:</div>
            <div className="route-stat-value">{totalTime}</div>
          </div>
          
          {/* Column 4: Passengers */}
          <div className="route-stat-item">
            <div className="route-stat-label">Passengers:</div>
            <div className="route-stat-value" style={{ display: 'flex', alignItems: 'center' }}>
              {passengers.length > 0 ? (
                <>
                  {(() => {
                    // Define passenger colors array
                    const colors = ['#3498db', '#614dd6', '#8c5ed6', '#c05edb', '#e27add', '#1abc9c'];
                    
                    // Display each passenger number with colored icon
                    return (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {passengers.map((passenger, idx) => {
                          // Get appropriate color based on index 
                          const iconColor = passenger.isDeparture ? '#3498db' : 
                                         colors[Math.min(idx, colors.length - 1)];
                          
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginRight: '0px' }}>
                              <div style={{ marginRight: '2px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
                                    fill={iconColor} />
                                </svg>
                              </div>
                              <span style={{ fontSize: '0.9em' }}>{passenger.maxPassengers}</span>
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
                  <span>0</span>
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
              {contingencyFuel} lbs
            </div>
          </div>
          
          {/* Column 2: Taxi Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label" style={{ color: '#777' }}>Taxi Fuel:</div>
            <div className="route-stat-value" style={{ color: '#777' }}>
              {taxiFuel} lbs
            </div>
          </div>
          
          {/* Column 3: Reserve Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label" style={{ color: '#777' }}>Reserve:</div>
            <div className="route-stat-value" style={{ color: '#777' }}>
              {reserveFuel} lbs
            </div>
          </div>
          
          {/* Column 4: Empty for alignment */}
          <div className="route-stat-item">
            <div className="route-stat-label" style={{ color: '#777' }}></div>
            <div className="route-stat-value" style={{ color: '#777' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleRouteStatsCard;
