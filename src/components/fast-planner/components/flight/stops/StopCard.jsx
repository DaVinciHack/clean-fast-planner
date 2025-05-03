import React from 'react';

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
          <span className="icon">🛣️</span>
          <div className="metric-values">
            <div className="metric-label">Distance</div>
            <div className="metric-value">
              <span className="leg-value">{legDistance || '0'}</span>
              <span className="total-value">/ {totalDistance || '0'} nm</span>
            </div>
          </div>
        </div>
        
        <div className="stop-metric">
          <span className="icon">⏱️</span>
          <div className="metric-values">
            <div className="metric-label">Time</div>
            <div className="metric-value">
              <span className="leg-value">{formatTime(legTime)}</span>
              <span className="total-value">/ {formatTime(totalTime)}</span>
            </div>
          </div>
        </div>
        
        <div className="stop-metric">
          <span className="icon">⛽</span>
          <div className="metric-values">
            <div className="metric-label">Fuel</div>
            <div className="metric-value">
              <span className="leg-value">{legFuel || '0'}</span>
              <span className="total-value">/ {totalFuel || '0'} lbs</span>
            </div>
          </div>
        </div>
        
        <div className="stop-metric">
          <span className="icon">👥</span>
          <div className="metric-values">
            <div className="metric-label">Passengers</div>
            <div className="metric-value">{maxPassengers || '0'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopCard;