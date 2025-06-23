/**
 * AlternateModeButton.jsx
 * 
 * Button component for toggling Alternate Mode functionality.
 * Provides visual feedback for mode state and integrates with the useAlternateMode hook.
 * Matches the existing button styling from the waypoint mode button.
 * 
 * @aviation-safety: UI component only, no flight data processing
 */

import React from 'react';
import { useAlternateMode } from '../../modes/AlternateMode';

/**
 * AlternateModeButton Component
 * @param {Object} props - Component props
 * @param {Array} props.waypoints - Current route waypoints
 * @param {Array} props.fuelLocations - Available fuel-capable locations
 * @param {Array} props.airports - Available airports
 * @param {Object} props.platformManager - PlatformManager instance for layer control
 * @param {Function} props.onAlternateUpdate - Callback when alternate is selected
 * @param {Function} props.onToggleFuelLocations - Callback to toggle fuel locations visibility
 * @param {Function} props.onToggleAirports - Callback to toggle airports visibility
 * @param {Function} props.onRegisterMapClickHandler - Callback to register map click handler
 */
const AlternateModeButton = ({
  waypoints = [],
  fuelLocations = [],
  airports = [],
  platformManager,
  onAlternateUpdate,
  onToggleFuelLocations,
  onToggleAirports,
  onRegisterMapClickHandler,
  style = {}
}) => {
  
  // Use the alternate mode hook
  const {
    isAlternateMode,
    toggleAlternateMode,
    handleMapClick,
    clickFeedback,
    getModeStatus,
    selectedAlternate,
    awaitingAlternate
  } = useAlternateMode({
    waypoints,
    fuelLocations,
    airports,
    platformManager,
    onAlternateUpdate,
    onToggleFuelLocations,
    onToggleAirports
  });
  
  // Register map click handler with parent component
  React.useEffect(() => {
    if (onRegisterMapClickHandler) {
      onRegisterMapClickHandler('alternateMode', handleMapClick);
    }
  }, [handleMapClick, onRegisterMapClickHandler]);
  
  // Get current status for display
  const modeStatus = getModeStatus();
  
  // Determine button text based on state
  const getButtonText = () => {
    if (!isAlternateMode) {
      return 'Alternate Mode';
    }
    
    if (awaitingAlternate) {
      return '⏳ SELECT ALTERNATE';
    }
    
    if (selectedAlternate) {
      return `✅ ALT: ${selectedAlternate.name ? selectedAlternate.name.substring(0, 15) : 'CUSTOM'}`;
    }
    
    return '🎯 ALTERNATE MODE ACTIVE';
  };
  
  // Determine button color based on state
  const getButtonColor = () => {
    if (!isAlternateMode) {
      return '#0066cc'; // Standard blue
    }
    
    if (awaitingAlternate) {
      return '#ff6600'; // Orange for waiting
    }
    
    if (selectedAlternate) {
      return '#00cc66'; // Green for success
    }
    
    return '#9900cc'; // Purple for active mode
  };
  
  return (
    <div style={{ width: '100%', marginTop: '5px', marginBottom: '5px', ...style }}>
      {/* Main Button */}
      <button
        id="alternate-mode-button"
        className={`control-button ${isAlternateMode ? 'active' : ''}`}
        style={{
          width: '100%',
          padding: '6px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          height: '32px',
          backgroundColor: getButtonColor(),
          color: 'white',
          fontWeight: isAlternateMode ? 'bold' : 'normal',
          border: isAlternateMode ? '2px solid #ffcc00' : 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={toggleAlternateMode}
        title={modeStatus.message}
      >
        {getButtonText()}
      </button>
      
      {/* Feedback Message */}
      {clickFeedback && (
        <div
          style={{
            marginTop: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            backgroundColor: 
              clickFeedback.type === 'error' ? '#ffebee' :
              clickFeedback.type === 'success' ? '#e8f5e8' :
              '#e3f2fd',
            color: 
              clickFeedback.type === 'error' ? '#c62828' :
              clickFeedback.type === 'success' ? '#2e7d32' :
              '#1565c0',
            border: `1px solid ${
              clickFeedback.type === 'error' ? '#ffcdd2' :
              clickFeedback.type === 'success' ? '#c8e6c9' :
              '#bbdefb'
            }`,
            lineHeight: '1.2'
          }}
        >
          {clickFeedback.message}
        </div>
      )}
      
      {/* Status Display */}
      {isAlternateMode && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center',
            lineHeight: '1.2'
          }}
        >
          {modeStatus.message}
        </div>
      )}
      
      {/* Clear Button when alternate is selected */}
      {selectedAlternate && (
        <button
          style={{
            width: '100%',
            marginTop: '4px',
            padding: '3px 0',
            fontSize: '11px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            height: '20px'
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Clear alternate logic would go here
            // This would call a clearAlternate function from the hook
          }}
          title="Clear selected alternate"
        >
          Clear Alternate
        </button>
      )}
    </div>
  );
};

export default AlternateModeButton;