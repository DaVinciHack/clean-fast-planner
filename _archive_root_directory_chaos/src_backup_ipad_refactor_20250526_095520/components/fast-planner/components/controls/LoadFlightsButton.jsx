import React, { useState } from 'react';
import { usePanelContext } from '../../context/PanelContext';

/**
 * LoadFlightsButton Component
 * 
 * A button that opens the Load Flights panel to select and load a saved flight
 */
const LoadFlightsButton = ({
  onSuccess,
  onError,
  ...props // Add rest parameter to capture style and other props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Access the panel context for card navigation
  const panelContext = usePanelContext();
  
  const handleButtonClick = () => {
    // Use the panel context to change to the loadflights card
    if (panelContext && panelContext.handleCardChange) {
      console.log('LoadFlightsButton: Using panel context to switch to loadflights card');
      panelContext.handleCardChange('loadflights');
    } else {
      console.log('LoadFlightsButton: Panel context not available');
      // For now, we won't implement a fallback modal for this button
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          'Load flights feature needs to be used with the panel context', 
          'warning'
        );
      }
    }
  };
  
  // Button style to match the Save Flight button
  const buttonStyle = {
    backgroundColor: '#038dde',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    margin: '0 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'normal',
    height: '32px'
  };
  
  return (
    <button 
      style={{...buttonStyle, ...props.style}}
      onClick={handleButtonClick}
      disabled={isLoading}
      title="Load saved flights from Palantir"
      className="control-button"
    >
      {isLoading ? (
        <>
          <span 
            className="spinner" 
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              borderTopColor: 'white',
              animation: 'spin 1s ease-in-out infinite',
              marginRight: '8px'
            }}
          />
          Loading...
        </>
      ) : (
        'Load Flights'
      )}
      
      {/* Add loading animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
};

export default LoadFlightsButton;