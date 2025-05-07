import React from 'react';
import '../../FastPlannerStyles.css';

/**
 * LegFuelCard component
 * 
 * Displays detailed fuel information for a single leg of the route
 * Used in the leg-by-leg view of fuel calculations
 */
const LegFuelCard = ({ 
  leg, 
  passengerCapacity,
  fuelComponents 
}) => {
  if (!leg) return null;
  
  // Early return if no data
  if (!leg.from || !leg.to) return null;
  
  // Helper to format wind component display
  const formatWind = (wind) => {
    if (!wind) return '0 kts';
    if (wind > 0) return `+${wind} kts`;
    return `${wind} kts`;
  };
  
  // Format function for fuel components with proper units
  const formatFuelComponent = (value, label) => {
    if (value === undefined || value === null) return null;
    return (
      <div className="fuel-component">
        <span className="fuel-component-label">{label}:</span>
        <span className="fuel-component-value">{Math.round(value)} lbs</span>
      </div>
    );
  };

  return (
    <div className="leg-fuel-card">
      <div className="leg-fuel-header">
        <div className="leg-route">
          <span className="leg-from">{leg.from}</span>
          <span className="leg-arrow">→</span>
          <span className="leg-to">{leg.to}</span>
        </div>
        
        <div className="leg-stats">
          <div className="leg-stat">
            <span className="material-icons">straighten</span>
            <span>{leg.distance} nm</span>
          </div>
          
          <div className="leg-stat">
            <span className="material-icons">schedule</span>
            <span>{leg.timeFormatted}</span>
          </div>
          
          <div className="leg-stat">
            <span className="material-icons">air</span>
            <span>{formatWind(leg.wind)}</span>
          </div>
        </div>
      </div>
      
      <div className="leg-fuel-body">
        <div className="leg-fuel-section">
          <h4>Fuel Requirements</h4>
          <div className="leg-fuel-details">
            <div className="leg-fuel-primary">
              <span className="leg-fuel-label">Trip Fuel:</span>
              <span className="leg-fuel-value">{leg.fuel} lbs</span>
            </div>
            
            {fuelComponents && (
              <div className="leg-fuel-components">
                {formatFuelComponent(fuelComponents.trip, 'Trip')}
                {formatFuelComponent(fuelComponents.contingency, 'Contingency')}
                {formatFuelComponent(fuelComponents.taxi, 'Taxi')}
                {formatFuelComponent(fuelComponents.deck, 'Deck')}
                {formatFuelComponent(fuelComponents.reserve, 'Reserve')}
              </div>
            )}
          </div>
        </div>
        
        {passengerCapacity && (
          <div className="leg-fuel-section">
            <h4>Passenger Capacity</h4>
            <div className="leg-passenger-details">
              <div className="leg-passenger-primary">
                <span className="leg-passenger-label">Max Passengers:</span>
                <span className="leg-passenger-value">
                  {passengerCapacity.isLastStop ? 'Final Stop' : passengerCapacity.maxPassengers}
                </span>
              </div>
              
              {!passengerCapacity.isLastStop && (
                <div className="leg-passenger-weight">
                  <span className="leg-passenger-label">Max Weight:</span>
                  <span className="leg-passenger-value">
                    {passengerCapacity.maxPassengerWeight} lbs
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegFuelCard;