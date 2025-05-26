import React, { useState } from 'react';
import { forceResetToNormalMode, forceToggleWaypointMode } from './force-reset-waypoint-mode';

/**
 * Emergency Reset Button
 * 
 * A simple UI component that allows the user to force reset the waypoint mode
 * to normal mode in case the toggle gets stuck.
 */
const EmergencyResetButton = ({ className }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState('');
  
  const handleReset = () => {
    setIsResetting(true);
    setStatus('Resetting...');
    
    try {
      // Force reset to normal mode
      const success = forceResetToNormalMode();
      
      if (success) {
        setStatus('Reset successful! Normal mode restored.');
      } else {
        setStatus('Reset failed! Please reload the page.');
      }
    } catch (error) {
      console.error('Error during emergency reset:', error);
      setStatus('Error during reset. Please reload the page.');
    } finally {
      setTimeout(() => {
        setIsResetting(false);
        setTimeout(() => setStatus(''), 3000);
      }, 1000);
    }
  };
  
  const buttonStyle = {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
    zIndex: 9999,
    background: '#ff3b30',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    opacity: isResetting ? 0.7 : 1,
    pointerEvents: isResetting ? 'none' : 'auto'
  };
  
  const statusStyle = {
    position: 'fixed',
    bottom: '10px',
    left: '150px',
    zIndex: 9999,
    background: status.includes('successful') ? '#4CD964' : '#FF9500',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    display: status ? 'block' : 'none'
  };
  
  return (
    <>
      <button 
        style={buttonStyle} 
        className={className}
        onClick={handleReset}
        disabled={isResetting}
      >
        {isResetting ? 'Resetting...' : 'EMERGENCY RESET'}
      </button>
      
      {status && (
        <div style={statusStyle}>
          {status}
        </div>
      )}
    </>
  );
};

export default EmergencyResetButton;
