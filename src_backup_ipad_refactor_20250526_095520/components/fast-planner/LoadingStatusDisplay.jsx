import React, { useState, useEffect } from 'react';

/**
 * LoadingStatusDisplay Component
 * 
 * Displays real-time loading status of various application components.
 * Helps diagnose loading issues during development.
 */
const LoadingStatusDisplay = ({ 
  mapReady, 
  regionLoading, 
  aircraftLoading, 
  platformsLoaded, 
  rigsLoading, 
  client, 
  selectedAircraft
}) => {
  const [visible, setVisible] = useState(true);
  const [steps, setSteps] = useState([
    { id: 'map', label: 'Map Loading', status: 'pending' },
    { id: 'regions', label: 'Regions Loading', status: 'pending' },
    { id: 'aircraft', label: 'Aircraft Loading', status: 'pending' },
    { id: 'platforms', label: 'Platforms/Rigs Loading', status: 'pending' }
  ]);

  // Update steps based on props
  useEffect(() => {
    setSteps(prev => {
      const newSteps = [...prev];
      
      // Update map status
      const mapStep = newSteps.find(s => s.id === 'map');
      if (mapStep) {
        mapStep.status = mapReady ? 'complete' : 'pending';
      }
      
      // Update regions status
      const regionsStep = newSteps.find(s => s.id === 'regions');
      if (regionsStep) {
        regionsStep.status = regionLoading ? 'loading' : 'complete';
      }
      
      // Update aircraft status
      const aircraftStep = newSteps.find(s => s.id === 'aircraft');
      if (aircraftStep) {
        if (selectedAircraft) {
          aircraftStep.status = 'complete';
        } else if (aircraftLoading) {
          aircraftStep.status = 'loading';
        } else {
          aircraftStep.status = 'pending';
        }
      }
      
      // Update platforms status
      const platformsStep = newSteps.find(s => s.id === 'platforms');
      if (platformsStep) {
        if (platformsLoaded) {
          platformsStep.status = 'complete';
        } else if (rigsLoading) {
          platformsStep.status = 'loading';
        } else {
          platformsStep.status = 'pending';
        }
      }
      
      return newSteps;
    });
  }, [mapReady, regionLoading, aircraftLoading, platformsLoaded, rigsLoading, selectedAircraft]);

  if (!visible) return (
    <button 
      onClick={() => setVisible(true)}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        padding: '5px 10px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Show Loading Status
    </button>
  );

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px',
      borderRadius: '5px',
      maxWidth: '300px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0 }}>Loading Status</h3>
        <button 
          onClick={() => setVisible(false)}
          style={{
            padding: '2px 6px',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Hide
        </button>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Client Status:</strong> {client ? 'Connected' : 'Not Connected'}
      </div>
      
      <div>
        {steps.map(step => (
          <div 
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '5px',
              opacity: step.status === 'pending' ? 0.7 : 1
            }}
          >
            {step.status === 'complete' && (
              <span style={{ 
                color: '#4caf50', 
                marginRight: '8px',
                fontSize: '16px' 
              }}>✓</span>
            )}
            {step.status === 'loading' && (
              <span style={{ 
                color: '#ff9800', 
                marginRight: '8px',
                fontSize: '16px' 
              }}>↻</span>
            )}
            {step.status === 'pending' && (
              <span style={{ 
                color: '#bbb', 
                marginRight: '8px',
                fontSize: '16px' 
              }}>○</span>
            )}
            <span>{step.label}</span>
            {step.status === 'loading' && (
              <span 
                style={{ 
                  marginLeft: '5px',
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite'
                }}
              >⟳</span>
            )}
          </div>
        ))}
      </div>
      
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingStatusDisplay;