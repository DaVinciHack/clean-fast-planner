import React, { useState } from 'react';
import { usePanelContext } from '../../context/PanelContext';

/**
 * LoadFlightsButton Component
 * 
 * Button that opens the Load Flights panel card
 */
const LoadFlightsButton = ({ 
  onLoadStart,
  onLoadComplete,
  onLoadError,
  ...props
}) => {
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  
  // Access the panel context for card navigation
  const panelContext = usePanelContext();
  
  // Handle button click
  const handleButtonClick = () => {
    // Use the panel context to change to the loadflights card
    if (panelContext && panelContext.handleCardChange) {
      console.log('LoadFlightsButton: Using panel context to switch to loadflights card');
      
      // Notify parent that loading is starting
      if (onLoadStart) {
        onLoadStart();
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Switch to the loadflights card
      panelContext.handleCardChange('loadflights');
    } else {
      console.error('LoadFlightsButton: Panel context not available');
      
      // Notify parent of error
      if (onLoadError) {
        onLoadError('Panel context not available');
      }
    }
  };
  
  // Button style
  const buttonStyle = {
    backgroundColor: isLoading ? '#6c757d' : '#038dde',
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
    height: '32px',
    ...props.style
  };
  
  // Loading spinner style
  const spinnerStyle = {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s ease-in-out infinite',
    marginRight: '8px'
  };
  
  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        style={buttonStyle}
        title="Load a saved flight from Palantir"
        className="control-button"
      >
        {isLoading && (
          <span className="spinner" style={spinnerStyle} />
        )}
        {isLoading ? 'Loading...' : 'Load Saved Flights'}
      </button>
      
      {/* Add loading animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default LoadFlightsButton;