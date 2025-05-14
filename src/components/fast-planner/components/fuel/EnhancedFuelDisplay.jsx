import React from 'react';
import './FuelStyles.css';

/**
 * EnhancedFuelDisplay Component
 * 
 * Displays detailed fuel requirements and passenger capacity information
 * from the enhanced fuel calculator.
 */
const EnhancedFuelDisplay = ({ 
  fuelData, 
  selectedAircraft,
  onAdjustFuel = () => {},
  onChangeAlternate = () => {}
}) => {
  // Return empty state if no data
  if (!fuelData || !selectedAircraft) {
    return (
      <div className="fuel-display fuel-display-empty">
        <p>Add waypoints and select an aircraft to see fuel calculations</p>
      </div>
    );
  }
  
  // Check if we have the enhanced results
  const enhancedResults = fuelData.enhancedResults;
  if (!enhancedResults) {
    return (
      <div className="fuel-display fuel-display-empty">
        <p>Enhanced fuel calculations not available</p>
      </div>
    );
  }
  
  // Extract relevant data for display
  const { fuelByStop, maxCapacity, legResults, auxiliaryFuel } = enhancedResults;
  
  // Function to format fuel components into a readable string
  const formatFuelComponents = (components) => {
    if (!components) return '';
    
    const parts = [];
    
    if (components.remainingTripFuel) parts.push(`Trip:${components.remainingTripFuel}`);
    if (components.remainingContingency) parts.push(`Cont:${components.remainingContingency}`);
    if (components.taxiFuel) parts.push(`Taxi:${components.taxiFuel}`);
    if (components.remainingDeckFuel) parts.push(`Deck:${components.remainingDeckFuel}`);
    if (components.reserveFuel) parts.push(`Res:${components.reserveFuel}`);
    
    return parts.join(' ');
  };
  
  return (
    <div className="fuel-display">
      {/* Top action buttons */}
      <div className="fuel-display-actions">
        <button 
          className="action-button" 
          onClick={onAdjustFuel}
        >
          <span className="material-icons">local_gas_station</span>
          Adjust fuel
        </button>
        
        <button 
          className="action-button" 
          onClick={onChangeAlternate}
        >
          <span className="material-icons">alt_route</span>
          Change Alternate leg
        </button>
      </div>
      
      {/* Fuel Requirements and Passenger Capacity by Stop */}
      <h3 className="fuel-section-title">
        Fuel Requirements and Passenger Capacity by Stop
      </h3>
      
      <div className="fuel-table-container">
        <table className="fuel-table">
          <thead>
            <tr>
              <th>Stop</th>
              <th>Required Fuel</th>
              <th>Max Passengers</th>
              <th>Fuel Components</th>
              <th>Legs</th>
            </tr>
          </thead>
          <tbody>
            {fuelByStop.map((stop, index) => (
              <tr key={index} className={stop.isLastStop ? 'last-stop' : ''}>
                <td>{stop.waypoint}</td>
                <td>{stop.requiredFuel} Lbs</td>
                <td>
                  {stop.isLastStop ? 'Final Stop' : (
                    <React.Fragment>
                      {stop.maxPassengers} ({stop.maxPassengerWeight} Lbs)
                    </React.Fragment>
                  )}
                </td>
                <td className="fuel-components-cell">
                  {formatFuelComponents(stop.components)}
                </td>
                <td>
                  {stop.leg ? (
                    <React.Fragment>
                      {stop.leg.from}-{stop.leg.to} → {stop.leg.distance.toFixed(1)} nm
                    </React.Fragment>
                  ) : (
                    'Final destination'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Minimal Fuel with Maximum Passenger Capacity */}
      {maxCapacity && (
        <React.Fragment>
          <h3 className="fuel-section-title">
            Minimal Fuel with Maximum Passenger Capacity
          </h3>
          
          <div className="fuel-table-container">
            <table className="fuel-table minimal-fuel-table">
              <thead>
                <tr>
                  <th>Required Fuel</th>
                  <th>Max Passengers</th>
                  <th>Fuel Components</th>
                  <th>Route</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{fuelByStop[0].requiredFuel} LBS</td>
                  <td>{maxCapacity.maxPassengers} ({maxCapacity.maxPassengerWeight} LBS)</td>
                  <td className="fuel-components-cell">
                    {formatFuelComponents(fuelByStop[0].components)}
                  </td>
                  <td>Legs to {maxCapacity.limitingWaypoint}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="fuel-extra-info">
            <p>
              Potential landing fuel: {auxiliaryFuel.reserveFuel} LBS 
              (Reserve + FULL Contingency)
            </p>
          </div>
        </React.Fragment>
      )}
      
      {/* Individual leg fuel cards */}
      <div className="leg-fuel-cards">
        {legResults.legDetails.map((leg, index) => (
          <div key={index} className="leg-fuel-card">
            <div className="leg-fuel-header">
              <div className="leg-route">
                <span className="leg-from">{leg.from}</span>
                <span className="leg-arrow">→</span>
                <span className="leg-to">{leg.to}</span>
              </div>
              
              <div className="leg-stats">
                <div className="leg-stat">
                  <span className="material-icons">straighten</span>
                  <span>{leg.distance.toFixed(1)} nm</span>
                </div>
                
                <div className="leg-stat">
                  <span className="material-icons">schedule</span>
                  <span>{formatTime(leg.flightTimeHours)}</span>
                </div>
                
                <div className="leg-stat">
                  <span className="material-icons">air</span>
                  <span>{formatWind(leg.windEffect)}</span>
                </div>
              </div>
            </div>
            
            <div className="leg-fuel-body">
              <div className="leg-fuel-section">
                <h4>Fuel Requirements</h4>
                <div className="leg-fuel-details">
                  <div className="leg-fuel-primary">
                    <span className="leg-fuel-label">Trip Fuel:</span>
                    <span className="leg-fuel-value">{leg.fuelRequired} lbs</span>
                  </div>
                  
                  <div className="leg-fuel-primary">
                    <span className="leg-fuel-label">Ground Speed:</span>
                    <span className="leg-fuel-value">{Math.round(leg.groundSpeed)} kts</span>
                  </div>
                </div>
              </div>
              
              <div className="leg-fuel-section">
                <h4>Passenger Capacity</h4>
                <div className="leg-passenger-details">
                  <div className="leg-passenger-primary">
                    <span className="leg-passenger-label">Max Passengers:</span>
                    <span className="leg-passenger-value">
                      {fuelByStop[index + 1]?.maxPassengers || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="leg-passenger-weight">
                    <span className="leg-passenger-label">Fuel Required:</span>
                    <span className="leg-passenger-value">
                      {fuelByStop[index + 1]?.requiredFuel || 'N/A'} lbs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Format wind component for display
 * @param {number} wind - Wind component in knots
 * @returns {string} Formatted wind string
 */
function formatWind(wind) {
  if (!wind) return '0 kts';
  if (wind > 0) return `+${Math.round(wind)} kts`;
  return `${Math.round(wind)} kts`;
}

/**
 * Format time in hours to HH:MM format
 * @param {number} timeHours - Time in decimal hours
 * @returns {string} Formatted time string
 */
function formatTime(timeHours) {
  if (typeof timeHours !== 'number' || timeHours < 0) {
    return '00:00';
  }
  
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default EnhancedFuelDisplay;