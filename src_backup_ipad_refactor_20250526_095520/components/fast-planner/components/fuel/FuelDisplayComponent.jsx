import React from 'react';
import LegFuelCard from './LegFuelCard';
import '../../FastPlannerStyles.css';

/**
 * FuelDisplayComponent
 * 
 * Renders the fuel requirements and passenger capacity tables
 * based on calculated fuel data from FuelCalculationManager
 */
const FuelDisplayComponent = ({ 
  fuelResults = [], 
  passengerCapacity = [],
  maxCapacity = null,
  onAdjustFuel = () => {},
  onChangeAlternate = () => {}
}) => {
  // Early return if no data
  if (!fuelResults.length || !passengerCapacity.length) {
    return (
      <div className="fuel-display fuel-display-empty">
        <p>Add waypoints and select an aircraft to see fuel calculations</p>
      </div>
    );
  }
  
  // Function to format fuel components into a readable string
  const formatFuelComponents = (components) => {
    if (!components) return '';
    
    const parts = [];
    
    if (components.trip) parts.push(`Trip:${components.trip}`);
    if (components.contingency) parts.push(`Cont:${components.contingency}`);
    if (components.taxi && components.taxi > 0) parts.push(`Taxi:${components.taxi}`);
    if (components.deck && components.deck > 0) parts.push(`Deck:${components.deck}`);
    if (components.reserve) parts.push(`Res:${components.reserve}`);
    if (components.extra && components.extra > 0) parts.push(`Extra:${components.extra}`);
    if (components.fullContingency) parts.push(`FullCont:${components.fullContingency}`);
    
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
            {fuelResults.map((result, index) => {
              const capacity = passengerCapacity[index];
              if (!capacity) return null;
              
              return (
                <tr key={index} className={capacity.isLastStop ? 'last-stop' : ''}>
                  <td>{result.waypoint}</td>
                  <td>{result.requiredFuel} Lbs</td>
                  <td>
                    {capacity.isLastStop ? 'Final Stop' : (
                      <React.Fragment>
                        {capacity.maxPassengers} ({capacity.maxPassengerWeight} Lbs)
                      </React.Fragment>
                    )}
                  </td>
                  <td className="fuel-components-cell">
                    {formatFuelComponents(result.fuelComponents)}
                  </td>
                  <td>
                    {result.legs ? (
                      <React.Fragment>
                        {result.legs.from}-{result.legs.to} → {result.legs.distance} nm
                      </React.Fragment>
                    ) : (
                      'Final destination'
                    )}
                  </td>
                </tr>
              );
            })}
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
                  <td>{maxCapacity.requiredFuel} LBS</td>
                  <td>{maxCapacity.maxPassengers} ({maxCapacity.maxPassengerWeight} LBS)</td>
                  <td className="fuel-components-cell">
                    {formatFuelComponents(maxCapacity.fuelComponents)}
                  </td>
                  <td>Legs to {maxCapacity.limitingWaypoint}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="fuel-extra-info">
            <p>
              Potential landing fuel: {maxCapacity.fuelComponents.reserve} LBS 
              (Reserve + FULL Contingency + Extra)
            </p>
          </div>
        </React.Fragment>
      )}
      
      {/* Individual leg fuel cards (optionally displayed) */}
      <div className="leg-fuel-cards">
        {fuelResults.map((result, index) => (
          result.legs && (
            <LegFuelCard 
              key={index}
              leg={result.legs}
              passengerCapacity={passengerCapacity[index]}
              fuelComponents={result.fuelComponents}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default FuelDisplayComponent;