import React, { useState, useContext } from 'react';
import BaseCard from './BaseCard';
import S92PerformanceCard from './performance/S92PerformanceCard';

/**
 * PerformanceCard Component
 * 
 * Contains takeoff & landing performance calculations and the S92 dropdown calculator.
 * It can switch between general performance settings and the S92-specific calculator.
 */
const PerformanceCard = ({ id }) => {
  const [showS92Calculator, setShowS92Calculator] = useState(false);
  
  // Get weather and aircraft data from parent component
  const weatherData = {
    temperature: 30,
    windSpeed: 7,
    windDirection: 0,
    pressureAltitude: 500
  };
  
  const selectedAircraft = {
    type: 'S92',
    registration: 'G-XXXX',
    maxTakeoffWeight: 26000,
    maxPassengers: 19
  };

  // Toggle between general performance settings and S92 calculator
  const toggleS92Calculator = () => {
    setShowS92Calculator(prev => !prev);
  };

  // Get a unique ID for the S92 Performance Card
  const s92CardId = `${id}-s92`;

  // Custom styles to match the application UI
  const styles = {
    section: {
      margin: '15px 0'
    },
    header: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4fc3f7',
      marginBottom: '10px'
    },
    formGroup: {
      margin: '10px 0'
    },
    label: {
      display: 'block',
      fontSize: '12px',
      marginBottom: '3px',
      color: '#bbb'
    },
    inputGroup: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginBottom: '15px'
    },
    input: {
      width: '100%',
      padding: '8px',
      backgroundColor: '#333',
      color: '#fff',
      border: '1px solid #555',
      borderRadius: '3px',
      fontSize: '12px'
    },
    checkboxGroup: {
      margin: '15px 0'
    },
    checkbox: {
      margin: '10px 0'
    },
    checkboxLabel: {
      marginLeft: '8px',
      fontSize: '12px',
      color: '#ddd'
    },
    button: {
      backgroundColor: '#4fc3f7',
      color: '#111',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 'bold'
    },
    resultsContainer: {
      backgroundColor: '#263238',
      padding: '12px',
      borderRadius: '3px',
      margin: '15px 0'
    },
    resultsHeader: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4fc3f7',
      marginBottom: '10px'
    },
    resultItem: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '8px 0'
    },
    resultLabel: {
      fontSize: '12px',
      color: '#bbb'
    },
    resultValue: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#fff'
    },
    s92Section: {
      margin: '20px 0 10px 0',
      borderTop: '1px solid #444',
      paddingTop: '15px'
    }
  };

  return (
    <>
      {!showS92Calculator ? (
        <BaseCard title="Performance Settings" id={id}>
          <div style={{ color: '#eee', fontSize: '12px' }}>
            <div style={styles.section}>
              <div style={styles.header}>Take-off & Landing Performance</div>
              
              <div style={styles.inputGroup}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="temperature">Temperature (°C):</label>
                  <input 
                    type="number" 
                    id="temperature" 
                    defaultValue={weatherData?.temperature || 25}
                    min="-20" 
                    max="50"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="pressure-altitude">Pressure Altitude (ft):</label>
                  <input 
                    type="number" 
                    id="pressure-altitude" 
                    defaultValue={weatherData?.pressureAltitude || 0}
                    min="0" 
                    max="10000"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
            
            <div style={styles.section}>
              <div style={styles.header}>Aircraft Configuration</div>
              
              <div style={styles.checkboxGroup}>
                <div style={styles.checkbox}>
                  <input 
                    type="checkbox" 
                    id="engine-failure" 
                    style={{ accentColor: '#4fc3f7' }}
                  />
                  <label style={styles.checkboxLabel} htmlFor="engine-failure">
                    Include Engine Failure Analysis
                  </label>
                </div>
                
                <div style={styles.checkbox}>
                  <input 
                    type="checkbox" 
                    id="cat-a" 
                    defaultChecked 
                    style={{ accentColor: '#4fc3f7' }}
                  />
                  <label style={styles.checkboxLabel} htmlFor="cat-a">
                    Apply Category A Procedures
                  </label>
                </div>
              </div>
              
              <button style={styles.button}>
                Calculate Performance
              </button>
            </div>
            
            <div style={styles.resultsContainer}>
              <div style={styles.resultsHeader}>Performance Results</div>
              
              <div style={styles.resultItem}>
                <div style={styles.resultLabel}>Max Takeoff Weight:</div>
                <div style={styles.resultValue}>
                  {selectedAircraft?.maxTakeoffWeight.toLocaleString() || '17,500'} lbs
                </div>
              </div>
              
              <div style={styles.resultItem}>
                <div style={styles.resultLabel}>Weight Limited By:</div>
                <div style={styles.resultValue}>Cat A Takeoff</div>
              </div>
              
              <div style={styles.resultItem}>
                <div style={styles.resultLabel}>Max Passengers:</div>
                <div style={styles.resultValue}>
                  {selectedAircraft?.maxPassengers || '12'}
                </div>
              </div>
            </div>
          
            {/* Show S92 Performance Calculator button only if S92 aircraft is selected */}
            {selectedAircraft?.type === 'S92' || !selectedAircraft ? (
              <div style={styles.s92Section}>
                <div style={styles.header}>S92 Performance Calculator</div>
                <p style={{ fontSize: '12px', color: '#bbb', marginBottom: '12px' }}>
                  Click below to open the S92 dropdown calculator
                </p>
                <button 
                  style={styles.button}
                  onClick={toggleS92Calculator}
                >
                  Open S92 Calculator
                </button>
              </div>
            ) : null}
          </div>
        </BaseCard>
      ) : (
        // When showS92Calculator is true, render S92PerformanceCard with props
        <S92PerformanceCard 
          id={s92CardId}
          weatherData={weatherData}
          aircraftData={selectedAircraft}
          onClose={toggleS92Calculator}
        />
      )}
    </>
  );
};

export default PerformanceCard;