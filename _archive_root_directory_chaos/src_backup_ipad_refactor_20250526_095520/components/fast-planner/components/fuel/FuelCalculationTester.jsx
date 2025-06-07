import React, { useState, useEffect } from 'react';
import fuelManager from '../../modules/fuel';
import { FuelDisplayComponent } from './index';
import './FuelStyles.css';

/**
 * FuelCalculationTester
 * 
 * A component for testing the fuel calculation module
 * This provides a UI for configuring test data and viewing results
 */
const FuelCalculationTester = () => {
  // Test state
  const [aircraft, setAircraft] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [settings, setSettings] = useState({});
  const [results, setResults] = useState(null);
  
  // Create some test data on component mount
  useEffect(() => {
    // Create test aircraft (S92 helicopter)
    const testAircraft = {
      id: 'test-s92',
      type: 'S92',
      registration: 'LN-OPU',
      emptyWeight: 16300, // lbs
      maxTakeoffWeight: 26500, // lbs
      maxFuel: 5500, // lbs
      maxPayload: 5200, // lbs
      cruiseFuelFlow: 1500, // lbs/hr
      cruiseSpeed: 145, // knots
      assetId: '1234' // Palantir ID
    };
    
    // Create test waypoints (ENZV-ENLE-ENCN-ENZV)
    const testWaypoints = [
      { name: 'ENZV', coords: [5.2505, 60.4034], type: 'airport' },
      { name: 'ENLE', coords: [5.0623, 61.1056], type: 'rig' },
      { name: 'ENCN', coords: [6.3388, 62.7443], type: 'airport' },
      { name: 'ENZV', coords: [5.2505, 60.4034], type: 'airport' }
    ];
    
    // Default settings
    const testSettings = {
      taxiFuel: 50,
      contingencyFuelPercent: 10,
      reserveMethod: 'fixed',
      reserveFuel: 500,
      deckTimePerStop: 5,
      deckFuelFlow: 400,
      passengerWeight: 220
    };
    
    // Set test data to state
    setAircraft(testAircraft);
    setWaypoints(testWaypoints);
    setSettings(testSettings);
    
    // Configure the fuel manager
    fuelManager.setAircraft(testAircraft);
    fuelManager.updateSettings(testSettings);
    fuelManager.setWaypoints(testWaypoints);
    
    // Calculate initial results
    const calculationResults = fuelManager.calculateFuelRequirements(
      testAircraft,
      testWaypoints
    );
    
    setResults({
      fuelResults: calculationResults.fuelResults,
      passengerCapacity: calculationResults.passengerCapacity,
      maxCapacity: fuelManager.getMaximumPassengerCapacity()
    });
  }, []);
  
  // Event handlers
  const handleAircraftChange = (e) => {
    // Just update the fuel flow for testing
    const newFuelFlow = parseInt(e.target.value, 10);
    const updatedAircraft = { ...aircraft, cruiseFuelFlow: newFuelFlow };
    
    setAircraft(updatedAircraft);
    fuelManager.setAircraft(updatedAircraft);
    
    // Update results
    const calculationResults = fuelManager.getResults();
    setResults({
      fuelResults: calculationResults.fuelResults,
      passengerCapacity: calculationResults.passengerCapacity,
      maxCapacity: fuelManager.getMaximumPassengerCapacity()
    });
  };
  
  const handleSettingChange = (setting, value) => {
    // Parse numeric values
    if (typeof value === 'string' && !isNaN(value)) {
      value = parseFloat(value);
    }
    
    // Update settings
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
    fuelManager.updateSettings(updatedSettings);
    
    // Update results
    const calculationResults = fuelManager.getResults();
    setResults({
      fuelResults: calculationResults.fuelResults,
      passengerCapacity: calculationResults.passengerCapacity,
      maxCapacity: fuelManager.getMaximumPassengerCapacity()
    });
  };
  
  // Render loading state if no data yet
  if (!aircraft || !waypoints.length || !results) {
    return <div className="fuel-tester">Loading test data...</div>;
  }
  
  return (
    <div className="fuel-tester">
      <h2>Fuel Calculation Test</h2>
      
      <div className="test-controls">
        <div className="test-section">
          <h3>Aircraft Settings</h3>
          <div className="test-input-group">
            <label>Aircraft Type:</label>
            <span>{aircraft.type} ({aircraft.registration})</span>
          </div>
          
          <div className="test-input-group">
            <label>Cruise Fuel Flow (lbs/hr):</label>
            <input 
              type="number" 
              value={aircraft.cruiseFuelFlow} 
              onChange={handleAircraftChange}
              min="500"
              max="3000"
              step="100"
            />
          </div>
          
          <div className="test-input-group">
            <label>Cruise Speed (kts):</label>
            <span>{aircraft.cruiseSpeed}</span>
          </div>
        </div>
        
        <div className="test-section">
          <h3>Fuel Settings</h3>
          
          <div className="test-input-group">
            <label>Taxi Fuel (lbs):</label>
            <input 
              type="number" 
              value={settings.taxiFuel} 
              onChange={(e) => handleSettingChange('taxiFuel', e.target.value)}
              min="0"
              max="200"
              step="10"
            />
          </div>
          
          <div className="test-input-group">
            <label>Contingency (%):</label>
            <input 
              type="number" 
              value={settings.contingencyFuelPercent} 
              onChange={(e) => handleSettingChange('contingencyFuelPercent', e.target.value)}
              min="0"
              max="20"
              step="1"
            />
          </div>
          
          <div className="test-input-group">
            <label>Reserve Method:</label>
            <select 
              value={settings.reserveMethod}
              onChange={(e) => handleSettingChange('reserveMethod', e.target.value)}
            >
              <option value="fixed">Fixed</option>
              <option value="percent">Percent</option>
            </select>
          </div>
          
          {settings.reserveMethod === 'fixed' ? (
            <div className="test-input-group">
              <label>Reserve Fuel (lbs):</label>
              <input 
                type="number" 
                value={settings.reserveFuel} 
                onChange={(e) => handleSettingChange('reserveFuel', e.target.value)}
                min="0"
                max="1000"
                step="50"
              />
            </div>
          ) : (
            <div className="test-input-group">
              <label>Reserve (%):</label>
              <input 
                type="number" 
                value={settings.reserveFuelPercent || 10} 
                onChange={(e) => handleSettingChange('reserveFuelPercent', e.target.value)}
                min="0"
                max="20"
                step="1"
              />
            </div>
          )}
          
          <div className="test-input-group">
            <label>Deck Time (min):</label>
            <input 
              type="number" 
              value={settings.deckTimePerStop} 
              onChange={(e) => handleSettingChange('deckTimePerStop', e.target.value)}
              min="0"
              max="30"
              step="1"
            />
          </div>
          
          <div className="test-input-group">
            <label>Deck Fuel Flow (lbs/hr):</label>
            <input 
              type="number" 
              value={settings.deckFuelFlow} 
              onChange={(e) => handleSettingChange('deckFuelFlow', e.target.value)}
              min="0"
              max="1000"
              step="50"
            />
          </div>
          
          <div className="test-input-group">
            <label>Passenger Weight (lbs):</label>
            <input 
              type="number" 
              value={settings.passengerWeight} 
              onChange={(e) => handleSettingChange('passengerWeight', e.target.value)}
              min="100"
              max="500"
              step="10"
            />
          </div>
        </div>
        
        <div className="test-section">
          <h3>Route</h3>
          <div className="test-waypoints">
            {waypoints.map((waypoint, index) => (
              <div key={index} className="test-waypoint">
                <span className="waypoint-number">{index + 1}</span>
                <span className="waypoint-name">{waypoint.name}</span>
                <span className="waypoint-coords">
                  {waypoint.coords[1].toFixed(4)}, {waypoint.coords[0].toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="test-results">
        <h3>Fuel Calculation Results</h3>
        
        <FuelDisplayComponent 
          fuelResults={results.fuelResults}
          passengerCapacity={results.passengerCapacity}
          maxCapacity={results.maxCapacity}
          onAdjustFuel={() => alert('Adjust fuel clicked')}
          onChangeAlternate={() => alert('Change alternate clicked')}
        />
      </div>
      
      <div className="debug-output">
        <h3>Debug Output</h3>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </div>
      
      <style jsx>{`
        .fuel-tester {
          padding: 20px;
          background-color: #1e1e1e;
          color: #fff;
          border-radius: 8px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        h2, h3 {
          color: #fff;
          margin-top: 0;
        }
        
        .test-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .test-section {
          flex: 1;
          min-width: 300px;
          background-color: #2c2c2c;
          padding: 15px;
          border-radius: 8px;
        }
        
        .test-input-group {
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .test-input-group label {
          margin-right: 10px;
          font-size: 14px;
          color: #ccc;
        }
        
        .test-input-group input,
        .test-input-group select {
          background-color: #333;
          color: #fff;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 5px 10px;
          width: 100px;
        }
        
        .test-waypoints {
          margin-top: 10px;
        }
        
        .test-waypoint {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .waypoint-number {
          width: 24px;
          height: 24px;
          background-color: #0088cc;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          margin-right: 10px;
        }
        
        .waypoint-name {
          font-weight: 600;
          margin-right: 10px;
          min-width: 60px;
        }
        
        .waypoint-coords {
          font-size: 12px;
          color: #aaa;
        }
        
        .test-results {
          margin-bottom: 30px;
        }
        
        .debug-output {
          background-color: #2c2c2c;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
          overflow: auto;
          max-height: 400px;
        }
        
        .debug-output pre {
          margin: 0;
          font-family: monospace;
          font-size: 12px;
          color: #ccc;
        }
        
        @media (max-width: 768px) {
          .test-controls {
            flex-direction: column;
          }
          
          .test-section {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FuelCalculationTester;