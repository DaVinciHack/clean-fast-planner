import React from 'react';
import { DistanceIcon, TimeIcon, FuelIcon, PassengerIcon, WindIcon } from './StopIcons';

/**
 * StopCard Component
 * 
 * Displays information about a stop in the route
 * Now includes fuel component display and departure/destination highlighting
 */
const StopCard = React.forwardRef(({
  id,
  index,
  stopName,
  totalDistance,
  totalTime,
  totalFuel,
  maxPassengers,
  maxPassengersDisplay,
  groundSpeed,
  headwind,
  deckTime,
  isDeparture,
  isDestination,
  isAlternate,
  routeDescription,
  fuelComponents,
  isActive,
  onClick,
  className = ''
}, ref) => {
  // Function to format time as HH:MM
  const formatTime = (timeHours) => {
    if (!timeHours && timeHours !== 0) return '00:00';
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Define passenger colors array
  const colors = ['#3498db', '#614dd6', '#8c5ed6', '#c05edb', '#e27add', '#1abc9c'];
  
  // Get appropriate color based on index (cycle through colors if needed)
  const getBorderColor = () => {
    if (isDeparture) return '#3498db'; // First stop always blue
    if (isDestination) return '#2ecc71'; // Last stop always green
    if (isAlternate) return '#f39c12'; // Alternate card always orange
    // Use colors array for intermediate stops
    return colors[Math.min(index, colors.length - 1)];
  };
  
  // Determine card and border style
  const borderColor = getBorderColor();
  const cardStyle = {
    borderLeft: `3px solid ${borderColor}`,
    background: 'linear-gradient(to bottom, rgba(45, 55, 65, 0.95), rgba(30, 40, 50, 0.95))', // Match exact gradient of top card
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    marginBottom: '8px'
  };
  
  // Combine all class names
  const cardClasses = `stop-card ${isActive ? 'stop-card-active' : ''} ${isDeparture ? 'departure-card' : ''} ${isDestination ? 'destination-card' : ''} ${isAlternate ? 'alternate-card' : ''} ${className}`;
  
  // Determine the display text for the stop number
  let stopNumberDisplay = index;
  if (isDeparture) {
    stopNumberDisplay = 'D';
  } else if (isDestination) {
    stopNumberDisplay = 'F';
  } else if (isAlternate) {
    stopNumberDisplay = 'A';
  }
  
  // Determine the style for the stop number circle
  const stopNumberStyle = {
    backgroundColor: borderColor
  };
  
  // Format passenger display 
  const passengersDisplay = maxPassengersDisplay || maxPassengers || (isDestination ? 'Final' : '0');
  
  return (
    <div 
      id={id}
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      data-index={index}
      style={cardStyle}
    >
      <div className="stop-header">
        <div className="stop-number" style={stopNumberStyle}>{stopNumberDisplay}</div>
        <div className="stop-name">
          {stopName || `Stop ${index}`}
          {isAlternate && routeDescription && (
            <div className="route-description" style={{ 
              fontSize: '0.65em', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginTop: '2px',
              lineHeight: '1.2'
            }}>
              {routeDescription}
            </div>
          )}
        </div>
        {headwind !== undefined && !isDeparture && !isAlternate && (
          <div className="stop-wind" title={`Groundspeed: ${groundSpeed || 0} kts`}>
            <span className="wind-value" data-positive={headwind > 0} data-negative={headwind < 0}>
              {headwind > 0 ? `+${parseFloat(Number(headwind).toFixed(1))}` : parseFloat(Number(headwind).toFixed(1))} kts
            </span>
          </div>
        )}
      </div>
      
      <div className="stop-details">
        {/* Total Distance */}
        <div className="stop-metric">
          <span className="icon"><DistanceIcon /></span>
          <div className="metric-value">{totalDistance || '0'} nm</div>
        </div>
        
        {/* Total Time */}
        <div className="stop-metric">
          <span className="icon"><TimeIcon /></span>
          <div className="metric-value">{formatTime(totalTime)}</div>
        </div>
        
        {/* Total Fuel */}
        <div className="stop-metric">
          <span className="icon"><FuelIcon /></span>
          <div className="metric-value">{totalFuel || '0'} lbs</div>
        </div>
        
        {/* Passenger information */}
        <div className="stop-metric">
          <span className="icon"><PassengerIcon /></span>
          <div className="metric-value">{passengersDisplay}</div>
        </div>
        
        {/* Wind information moved to header */}
      </div>
      
      {/* Fuel Components - shown for all stops */}
      {fuelComponents && (
        <div className="fuel-components">
          <div className="fuel-components-text">{fuelComponents}</div>
        </div>
      )}
    </div>
  );
});

export default StopCard;