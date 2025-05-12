import React, { useState, useEffect } from 'react';

/**
 * Component to toggle between Stop and Waypoint modes
 * 
 * In Stop mode, clicking on the map adds stops (departure, destination, etc.)
 * In Waypoint mode, clicking on the map adds waypoints to the currently active leg
 */
const WaypointModeToggle = ({ routeManager }) => {
  // Initialize state from the RouteManager's current mode
  const [mode, setMode] = useState(routeManager ? routeManager.getEditMode() : 'stops');
  
  // Listen for mode changes from other components
  useEffect(() => {
    const handleModeChange = (event) => {
      if (event.detail && event.detail.mode) {
        setMode(event.detail.mode);
      }
    };
    
    window.addEventListener('edit-mode-changed', handleModeChange);
    
    return () => {
      window.removeEventListener('edit-mode-changed', handleModeChange);
    };
  }, []);
  
  // Toggle between modes
  const toggleMode = () => {
    const newMode = mode === 'stops' ? 'waypoints' : 'stops';
    setMode(newMode);
    
    // Update the RouteManager if provided
    if (routeManager) {
      routeManager.setEditMode(newMode);
    } else {
      // Fallback if routeManager not provided - dispatch event
      const event = new CustomEvent('edit-mode-changed', { 
        detail: { mode: newMode } 
      });
      window.dispatchEvent(event);
    }
  };
  
  return (
    <div className="waypoint-mode-toggle">
      <div className={`mode-indicator ${mode === 'waypoints' ? 'waypoints-mode' : 'stops-mode'}`}>
        {mode === 'waypoints' ? 'Waypoint Mode' : 'Stop Mode'}
      </div>
      
      <button className="toggle-button" onClick={toggleMode}>
        Switch to {mode === 'waypoints' ? 'Stops' : 'Waypoints'}
      </button>
      
      <div className="mode-description">
        {mode === 'waypoints' ? (
          <span>
            <strong>Waypoint Mode:</strong> Click on map to add intermediate waypoints between stops.
            You can also drag a route line to add a waypoint.
          </span>
        ) : (
          <span>
            <strong>Stop Mode:</strong> Click on map to add main stops (departure, destination, etc.).
          </span>
        )}
      </div>
    </div>
  );
};

export default WaypointModeToggle;