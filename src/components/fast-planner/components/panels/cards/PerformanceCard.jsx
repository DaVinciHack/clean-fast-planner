import React from 'react';
import BaseCard from './BaseCard';
import S92PerformanceCard from './performance/S92PerformanceCard';

/**
 * PerformanceCard Component
 * 
 * Contains takeoff & landing performance calculations from the original RightPanel component.
 * Also includes the S92 dropdown calculator.
 */
const PerformanceCard = ({ id }) => {
  return (
    <BaseCard title="Performance Settings" id={id}>
      <div className="control-section">
        <h4>Take-off & Landing Performance</h4>
        
        <div className="settings-group">
          <div>
            <label htmlFor="temperature">Temperature (°C):</label>
            <input 
              type="number" 
              id="temperature" 
              defaultValue={25}
              min="-20" 
              max="50"
            />
          </div>
          
          <div>
            <label htmlFor="pressure-altitude">Pressure Altitude (ft):</label>
            <input 
              type="number" 
              id="pressure-altitude" 
              defaultValue={0}
              min="0" 
              max="10000"
            />
          </div>
        </div>
        
        <h4>Aircraft Configuration</h4>
        
        <div className="performance-checkbox-group">
          <div>
            <input type="checkbox" id="engine-failure" />
            <label htmlFor="engine-failure">Include Engine Failure Analysis</label>
          </div>
          
          <div>
            <input type="checkbox" id="cat-a" defaultChecked />
            <label htmlFor="cat-a">Apply Category A Procedures</label>
          </div>
        </div>
        
        <button className="control-button">
          Calculate Performance
        </button>
        
        <div className="performance-results">
          <h4>Performance Results</h4>
          <div className="result-item">
            <div className="result-label">Max Takeoff Weight:</div>
            <div className="result-value">17,500 lbs</div>
          </div>
          <div className="result-item">
            <div className="result-label">Weight Limited By:</div>
            <div className="result-value">Cat A Takeoff</div>
          </div>
          <div className="result-item">
            <div className="result-label">Max Passengers:</div>
            <div className="result-value">12</div>
          </div>
        </div>
      </div>
      
      {/* Add S92 Performance Calculator Section */}
      <div className="control-section">
        <h4>S92 Performance Calculator</h4>
        <p>Click below to open the S92 dropdown calculator</p>
        <button className="control-button">
          Open S92 Calculator
        </button>
      </div>
    </BaseCard>
  );
};

export default PerformanceCard;