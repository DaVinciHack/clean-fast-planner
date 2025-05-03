import React from 'react';
import { DistanceIcon, TimeIcon, FuelIcon, PassengerIcon, WindIcon } from './StopIcons';

/**
 * StopCard Component
 * 
 * Displays information about a single stop in the route
 * including location, distance, time, fuel, passenger capacity, and wind data
 * Shows both leg-specific and cumulative information
 */
const StopCard = React.forwardRef(({
  id,
  index,
  stopName,
  legDistance,
  totalDistance,
  legTime,
  totalTime,
  legFuel,
  totalFuel,
  maxPassengers,
  groundSpeed,
  headwind,
  deckTime,
  deckFuel,
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
  
  // For expanded cards, we'll show both leg and cumulative information
  const expandedCard = isActive;
  
  // Styles for the cumulative vs leg values
  const styles = {
    metricValues: {
      display: 'flex',
      flexDirection: 'column'
    },
    totalValue: {
      fontWeight: 'bold',
      fontSize: '13px', 
      color: 'white'
    },
    legValue: {
      fontSize: '12px',
      color: '#a0a0a0'
    },
    legValueSmall: {
      fontSize: '10px',
      color: '#808080',
      marginTop: '2px'
    },
    deckValue: {
      fontSize: '10px',
      color: '#00bcd4',
      marginTop: '2px'
    }
  };

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
        {/* Distance information */}
        <div className="stop-metric">
          <span className="icon"><DistanceIcon /></span>
          <div style={styles.metricValues}>
            {expandedCard ? (
              <>
                <div style={styles.legValue} title="Leg distance">Leg: {legDistance || '0'} nm</div>
                <div style={styles.totalValue} title="Total distance">Total: {totalDistance || '0'} nm</div>
              </>
            ) : (
              // When collapsed, show the total distance first, then leg in smaller text
              <>
                <div className="metric-value">{totalDistance || '0'} nm</div>
                <div style={styles.legValueSmall}>Leg: {legDistance || '0'} nm</div>
              </>
            )}
          </div>
        </div>
        
        {/* Time information */}
        <div className="stop-metric">
          <span className="icon"><TimeIcon /></span>
          <div style={styles.metricValues}>
            {expandedCard ? (
              <>
                <div style={styles.legValue} title="Leg time">Leg: {formatTime(legTime)}</div>
                {deckTime > 0 && <div style={styles.deckValue} title="Deck time">Deck: {Math.round(deckTime)} min</div>}
                <div style={styles.totalValue} title="Total time">Total: {formatTime(totalTime)}</div>
              </>
            ) : (
              // When collapsed, show the total time first, then leg in smaller text
              <>
                <div className="metric-value">{formatTime(totalTime)}</div>
                <div style={styles.legValueSmall}>Leg: {formatTime(legTime)}</div>
              </>
            )}
          </div>
        </div>
        
        {/* Fuel information */}
        <div className="stop-metric">
          <span className="icon"><FuelIcon /></span>
          <div style={styles.metricValues}>
            {expandedCard ? (
              <>
                <div style={styles.legValue} title="Leg fuel">Leg: {legFuel || '0'} lbs</div>
                {deckFuel > 0 && <div style={styles.deckValue} title="Deck fuel">Deck: {deckFuel} lbs</div>}
                <div style={styles.totalValue} title="Total fuel">Total: {totalFuel || '0'} lbs</div>
              </>
            ) : (
              // When collapsed, show the total fuel first, then leg in smaller text
              <>
                <div className="metric-value">{totalFuel || '0'} lbs</div>
                <div style={styles.legValueSmall}>Leg: {legFuel || '0'} lbs</div>
              </>
            )}
          </div>
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