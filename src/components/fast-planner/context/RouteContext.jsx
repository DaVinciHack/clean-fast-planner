import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { WaypointManager, RouteCalculator } from '../modules';

// Create the context
const RouteContext = createContext(null);

/**
 * RouteProvider component
 * Manages waypoints and route calculations
 */
export const RouteProvider = ({ children, aircraftData }) => {
  // Waypoints state
  const [waypoints, setWaypoints] = useState([]);
  const [routeInput, setRouteInput] = useState('');
  const [routeStats, setRouteStats] = useState(null);
  
  // Manager instances
  const [waypointManagerInstance, setWaypointManagerInstance] = useState(null);
  const [routeCalculatorInstance, setRouteCalculatorInstance] = useState(null);

  // Initialize managers
  useEffect(() => {
    // Create waypoint manager
    const waypointManager = new WaypointManager();
    
    // Set up waypoint manager callbacks
    waypointManager.setCallback('onWaypointsChanged', (updatedWaypoints) => {
      setWaypoints(updatedWaypoints);
    });
    
    setWaypointManagerInstance(waypointManager);
    
    // Create route calculator
    const routeCalculator = new RouteCalculator();
    
    // Set up route calculator callbacks
    routeCalculator.setCallback('onCalculationComplete', (stats) => {
      setRouteStats(stats);
    });
    
    setRouteCalculatorInstance(routeCalculator);
  }, []);

  // Update route statistics when waypoints or aircraft change
  useEffect(() => {
    if (routeCalculatorInstance && waypoints.length >= 2 && aircraftData) {
      // Extract coordinates from waypoints
      const coordinates = waypoints.map(wp => wp.coords);
      
      // Calculate route statistics
      routeCalculatorInstance.calculateRouteStats(coordinates, aircraftData);
    } else if (routeCalculatorInstance && waypoints.length < 2) {
      // Clear route stats when there are not enough waypoints
      setRouteStats(null);
    }
  }, [routeCalculatorInstance, waypoints, aircraftData]);

  // Handler for adding a waypoint
  const addWaypoint = useCallback((name, coords) => {
    if (waypointManagerInstance) {
      waypointManagerInstance.addWaypoint(name, coords);
    }
  }, [waypointManagerInstance]);

  // Handler for removing a waypoint
  const removeWaypoint = useCallback((id, index) => {
    if (waypointManagerInstance) {
      waypointManagerInstance.removeWaypoint(id);
    }
  }, [waypointManagerInstance]);

  // Handler for updating a waypoint name
  const updateWaypointName = useCallback((id, name, updatedWaypoints) => {
    if (waypointManagerInstance) {
      if (updatedWaypoints) {
        // This is a reordering operation with updated waypoints
        waypointManagerInstance.updateWaypoints(updatedWaypoints);
      } else {
        // This is just a name update
        waypointManagerInstance.updateWaypointName(id, name);
      }
    }
  }, [waypointManagerInstance]);

  // Handler for clearing the route
  const clearRoute = useCallback(() => {
    if (waypointManagerInstance) {
      waypointManagerInstance.clearWaypoints();
    }
  }, [waypointManagerInstance]);

  // Handler for route input change
  const handleRouteInputChange = useCallback((value) => {
    setRouteInput(value);
  }, []);

  // Provider value object
  const value = {
    waypoints,
    routeInput,
    routeStats,
    addWaypoint,
    removeWaypoint,
    updateWaypointName,
    clearRoute,
    handleRouteInputChange,
    waypointManager: waypointManagerInstance,
    routeCalculator: routeCalculatorInstance
  };

  return (
    <RouteContext.Provider value={value}>
      {children}
    </RouteContext.Provider>
  );
};

// Custom hook for using the route context
export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};

export default RouteContext;