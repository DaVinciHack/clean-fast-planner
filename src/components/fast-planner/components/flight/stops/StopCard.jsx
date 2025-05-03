import React from 'react';
import { DistanceIcon, TimeIcon, FuelIcon, PassengerIcon } from './StopIcons';

/**
 * StopCard Component
 * 
 * Displays information about a single stop in the route
 * including location, distance, time, fuel, and passenger capacity
 */
const StopCard = ({
  index,
  stopName,
  legDistance,
  totalDistance,
  legTime,
  totalTime,
  legFuel,
  totalFuel,
  maxPassengers,
  isActive,
  onClick
}) => {
  // Function to format time as HH:MM
  const formatTime = (timeHours) => {
    if (!timeHours && timeHours !== 0) return '00:00';
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`stop-card ${isActive ? 'stop-card-active' : ''}`}
      onClick={onClick}
      data-index={index}
    >
      <div className="stop-header">
        <div className="stop-number">{index + 1}</div>
        <div className="stop-name">{stopName || `Stop ${index + 1}`}</div>
      </div>
      
      <div className="stop-details">
        <div className="stop-metric">
          <span className="icon"><DistanceIcon /></span>
          <div className="metric-value">{legDistance || '0'} nm</div>
        </div>
        
        <div className="stop-metric">
          <span className="icon"><TimeIcon /></span>
          <div className="metric-value">{formatTime(legTime)}</div>
        </div>
        
        <div className="stop-metric">
          <span className="icon"><FuelIcon /></span>
          <div className="metric-value">{legFuel || '0'} lbs</div>
        </div>
        
        <div className="stop-metric">
          <span className="icon"><PassengerIcon /></span>
          <div className="metric-value">{maxPassengers || '0'}</div>
        </div>
      </div>
    </div>
  );
};

export default StopCard;