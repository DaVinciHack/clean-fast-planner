import React, { useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './AppHeader.css';

/**
 * AppHeader Component
 * 
 * iPad-friendly header that spans the full width and contains:
 * - Left: Logo + Currently selected aircraft display (not a dropdown)
 * - Center: One line of flight details (distance, time, fuel, passengers)
 * - Right: User name + Login status
 */
const AppHeader = ({ 
  selectedAircraft,
  stopCards = [],
  taxiFuel = 50,           
  reserveFuel = 600,      
  contingencyFuelPercent = 5, 
  deckTimePerStop = 5,
  isLoading = false,        // New prop for loading state
  loadingText = ""          // New prop for loading text
}) => {
  // Get authentication state and user details
  const { isAuthenticated, userName } = useAuth();
  
  // Integrate with LoadingIndicator for dynamic status messages
  useEffect(() => {
    const statusElement = document.getElementById('header-status-indicator');
    
    if (isLoading && loadingText && statusElement) {
      // Show and update the status message
      statusElement.textContent = loadingText;
      statusElement.classList.add('active');
    } else if (statusElement) {
      // Hide status when not loading
      statusElement.classList.remove('active');
      setTimeout(() => {
        if (!statusElement.classList.contains('active')) {
          statusElement.textContent = '';
        }
      }, 300); // Match transition time
    }
  }, [isLoading, loadingText]);
  
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
  
  // Extract data from stop cards (using same logic as SimpleRouteStatsCard)
  let totalDistance = '0.0';
  let flightTime = '00:00';  // Flight time only
  let totalTime = '00:00';   // Total time including flight time + deck stops
  let totalFuel = 0;         // Total fuel including trip + deck + contingency + taxi + reserve
  let tripFuel = 0;
  let deckFuel = 0;
  let passengers = [];
  
  // Find departure and destination cards
  let departureCard = null;
  let destinationCard = null;
  
  if (stopCards && stopCards.length > 0) {
    departureCard = stopCards.find(card => card.isDeparture);
    destinationCard = stopCards.find(card => card.isDestination);
    
    // Get distance from destination card
    if (destinationCard && destinationCard.totalDistance) {
      totalDistance = destinationCard.totalDistance;
    }
    
    // Get flight time from destination card (flight time only)
    if (destinationCard && destinationCard.totalTime) {
      // Convert to number if it's a string, then format as HH:MM
      const flightTimeHours = typeof destinationCard.totalTime === 'string' ? 
        parseFloat(destinationCard.totalTime) : 
        safeNumber(destinationCard.totalTime);
      flightTime = formatTime(flightTimeHours);
    }
    
    // Get fuel data from departure card
    if (departureCard) {
      totalFuel = safeNumber(departureCard.totalFuel);
      deckFuel = safeNumber(departureCard.deckFuel);
      
      // Get fuel components if available
      if (departureCard.fuelComponentsObject) {
        tripFuel = safeNumber(departureCard.fuelComponentsObject.tripFuel);
      }
    }
    
    // Calculate deck time and total time (using same logic as SimpleRouteStatsCard)
    const intermediateStops = Math.max(0, stopCards.length - 2);
    const totalDeckTime = intermediateStops * safeNumber(deckTimePerStop);
    
    // Calculate total time (flight time + deck time)
    let totalTimeHours = 0;
    if (flightTime !== '00:00') {
      const [hours, minutes] = flightTime.split(':').map(Number);
      totalTimeHours = hours + (minutes / 60);
    }
    const deckTimeHours = totalDeckTime / 60;
    totalTime = formatTime(totalTimeHours + deckTimeHours);
    
    // Get passenger data from all non-destination cards (EXACT same logic as SimpleRouteStatsCard)
    passengers = stopCards
      .filter(card => !card.isDestination && card.maxPassengers !== undefined)
      .map(card => ({
        id: card.id,
        isDeparture: card.isDeparture,
        maxPassengers: safeNumber(card.maxPassengers)
      }));
  }
  
  return (
    <div className="app-header">
      {/* Left Side: Logo + Aircraft Display */}
      <div className="header-left">
        <div className="logo-container">
          <img 
            src="https://bristow.info/SAR/VTOL-5a215f01.png" 
            alt="VTOL" 
            className="vtol-logo" 
          />
        </div>
        
        <div className="aircraft-display">
          {selectedAircraft ? (
            <>
              <span className="aircraft-registration">
                {selectedAircraft.registration?.split(' (')[0] || 'Unknown'}
              </span>
              <span className="aircraft-type">
                {selectedAircraft.modelType || 'Unknown Type'}
              </span>
            </>
          ) : (
            <span className="no-aircraft">No Aircraft Selected</span>
          )}
        </div>
      </div>
      
      {/* Center: Flight Details */}
      <div className="header-center">
        <div className="flight-summary">
          <span className="flight-detail">
            <span className="detail-label">Distance:</span>
            <span className="detail-value">{totalDistance} NM</span>
          </span>
          <span className="flight-detail">
            <span className="detail-label">Total Time:</span>
            <span className="detail-value">{totalTime}</span>
          </span>
          <span className="flight-detail">
            <span className="detail-label">Total Fuel:</span>
            <span className="detail-value">{totalFuel.toFixed(0)} lbs</span>
          </span>
          <span className="flight-detail">
            <span className="detail-label">Passengers:</span>
            <span className="detail-value" style={{ display: 'flex', alignItems: 'center' }}>
              {passengers.length > 0 ? (
                <>
                  {(() => {
                    // Define passenger colors array (same as SimpleRouteStatsCard)
                    const colors = ['#3498db', '#614dd6', '#8c5ed6', '#c05edb', '#e27add', '#1abc9c'];
                    
                    // Display each passenger number with colored icon
                    return (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {passengers.map((passenger, idx) => {
                          // Get appropriate color based on index 
                          const iconColor = passenger.isDeparture ? '#3498db' : 
                                         colors[Math.min(idx, colors.length - 1)];
                          
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{ marginRight: '2px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
                                    fill={iconColor} />
                                </svg>
                              </div>
                              <span style={{ fontSize: '12px' }}>{passenger.maxPassengers}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: '3px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
                        fill="#3498db" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '12px' }}>0</span>
                </div>
              )}
            </span>
          </span>
        </div>
      </div>
      
      {/* Right Side: User + Login Status */}
      <div className="header-right">
        {isAuthenticated && userName ? (
          <div className="user-info">
            <span className="username">{userName}</span>
            <span className="connection-dot connected"></span>
          </div>
        ) : (
          <div className="user-info">
            <span className="username">Not Logged In</span>
            <span className="connection-dot disconnected"></span>
          </div>
        )}
      </div>
      
      {/* Loading Text (real status indicator) */}
      <div className="status-indicator" id="header-status-indicator"></div>
    </div>
  );
};

export default AppHeader;
