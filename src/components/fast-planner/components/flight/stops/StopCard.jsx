import React from 'react';
import { DistanceIcon, TimeIcon, FuelIcon, PassengerIcon, WindIcon } from './StopIcons';

/**
 * StopCard Component
 * 
 * Displays cumulative information about a stop in the route
 * Only shows the total values at this point in the journey
 */
const StopCard = React.forwardRef(({
  id,
  index,
  stopName,
  totalDistance,
  totalTime,
  totalFuel,
  maxPassengers,
  groundSpeed,
  headwind,
  deckTime,
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

  // Combine all class names
  const cardClasses = `stop-card ${isActive ? 'stop-card-active' : ''} ${className}`;
  
  return (
    <div 
      id={id}
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      data-index={index}
    >
      <div className="stop-header">
        <div className="stop-number">{index + 1}</div>
        <div className="stop-name">{stopName || `Stop ${index + 1}`}</div>
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
          <div className="metric-value">{maxPassengers || '0'}</div>
        </div>
        
        {/* Wind information if available */}
        {headwind !== undefined && (
          <div className="stop-metric wind-info" title={`Groundspeed: ${groundSpeed || 0} kts`}>
            <span className="icon"><WindIcon /></span>
            <div 
              className="metric-value"
              data-positive={headwind > 0}
              data-negative={headwind < 0}
            >
              {headwind > 0 ? `+${headwind}` : headwind} kts
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default StopCard;