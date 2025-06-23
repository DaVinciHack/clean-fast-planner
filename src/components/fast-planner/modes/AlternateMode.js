/**
 * AlternateMode.js
 * 
 * Hook for managing Alternate Mode functionality - visual alternate destination selection.
 * Provides smart click detection to distinguish between on-route and off-route clicks,
 * automatically enables fuel locations/airports, and coordinates with existing route systems.
 * 
 * @aviation-safety: Uses only real waypoint and location data, no dummy coordinates
 */

import { useState, useCallback, useEffect } from 'react';
import { isPointOnRoute, findNearestFuelLocation, findNearestAirport } from '../utilities/RouteGeometry';

/**
 * Custom hook for Alternate Mode functionality
 * @param {Object} params - Configuration parameters
 * @param {Array} params.waypoints - Current route waypoints
 * @param {Array} params.fuelLocations - Available fuel-capable locations
 * @param {Array} params.airports - Available airports
 * @param {Object} params.platformManager - PlatformManager instance for layer control
 * @param {Function} params.onAlternateUpdate - Callback when alternate is selected
 * @param {Function} params.onToggleFuelLocations - Callback to toggle fuel locations visibility
 * @param {Function} params.onToggleAirports - Callback to toggle airports visibility
 * @returns {Object} Alternate mode state and functions
 */
export const useAlternateMode = ({
  waypoints = [],
  fuelLocations = [],
  airports = [],
  platformManager,
  onAlternateUpdate,
  onToggleFuelLocations,
  onToggleAirports
} = {}) => {
  
  // Core state
  const [isAlternateMode, setIsAlternateMode] = useState(false);
  const [splitPoint, setSplitPoint] = useState(null);
  const [awaitingAlternate, setAwaitingAlternate] = useState(false);
  const [selectedAlternate, setSelectedAlternate] = useState(null);
  
  // UI feedback state
  const [clickFeedback, setClickFeedback] = useState(null);
  
  /**
   * Toggle alternate mode on/off
   */
  const toggleAlternateMode = useCallback(() => {
    const newMode = !isAlternateMode;
    setIsAlternateMode(newMode);
    
    if (newMode) {
      // Entering alternate mode - call PlatformManager to change map layers
      if (platformManager && typeof platformManager.toggleAlternateMode === 'function') {
        console.log('🎯 AlternateMode: Calling PlatformManager.toggleAlternateMode(true)');
        platformManager.toggleAlternateMode(true);
      } else {
        console.warn('🎯 AlternateMode: PlatformManager.toggleAlternateMode not available, falling back to individual toggles');
        // Fallback to individual layer toggles
        if (onToggleFuelLocations) {
          onToggleFuelLocations(true);
        }
        if (onToggleAirports) {
          onToggleAirports(true);
        }
      }
      
      // Reset state
      setSplitPoint(null);
      setAwaitingAlternate(false);
      setSelectedAlternate(null);
      setClickFeedback({
        type: 'info',
        message: 'Alternate Mode Active: Click on route to set split point, or off route to select alternate directly'
      });
    } else {
      // Exiting alternate mode - call PlatformManager to restore normal layers
      if (platformManager && typeof platformManager.toggleAlternateMode === 'function') {
        console.log('🎯 AlternateMode: Calling PlatformManager.toggleAlternateMode(false)');
        platformManager.toggleAlternateMode(false);
      }
      
      // Clear all state
      setSplitPoint(null);
      setAwaitingAlternate(false);
      setSelectedAlternate(null);
      setClickFeedback(null);
    }
  }, [isAlternateMode, platformManager, onToggleFuelLocations, onToggleAirports]);
  
  /**
   * Handle map click events in alternate mode
   * @param {Object} clickPoint - Click coordinates {lat, lng}
   * @param {Object} clickedFeature - Optional clicked map feature
   */
  const handleMapClick = useCallback((clickPoint, clickedFeature = null) => {
    if (!isAlternateMode) {
      return false; // Not handled
    }
    
    if (!clickPoint || !clickPoint.lat || !clickPoint.lng) {
      setClickFeedback({
        type: 'error',
        message: 'Invalid click coordinates'
      });
      return true; // Handled but error
    }
    
    // If clicked on a specific location (platform, airport, etc.)
    if (clickedFeature && (clickedFeature.hasFuel || clickedFeature.type === 'airport')) {
      handleAlternateSelection(clickedFeature);
      return true;
    }
    
    // Smart detection: on-route vs off-route
    const routeAnalysis = isPointOnRoute(clickPoint, waypoints, 5.0); // 5 NM tolerance
    
    if (routeAnalysis.isOnRoute) {
      // Click ON route - set split point
      handleSplitPointSelection(routeAnalysis.splitPoint);
    } else {
      // Click OFF route - find nearest alternate
      handleOffRouteClick(clickPoint);
    }
    
    return true; // Handled
  }, [isAlternateMode, waypoints]);
  
  /**
   * Handle split point selection (click on route)
   * @param {Object} splitPointData - Split point data from route analysis
   */
  const handleSplitPointSelection = useCallback((splitPointData) => {
    setSplitPoint(splitPointData);
    setAwaitingAlternate(true);
    setClickFeedback({
      type: 'success',
      message: 'Split point set. Now click to select alternate destination.'
    });
  }, []);
  
  /**
   * Handle off-route clicks (find nearest alternate)
   * @param {Object} clickPoint - Click coordinates
   */
  const handleOffRouteClick = useCallback((clickPoint) => {
    // Search for nearest fuel location first
    const nearestFuel = findNearestFuelLocation(clickPoint, fuelLocations, 25);
    const nearestAirport = findNearestAirport(clickPoint, airports, 50);
    
    // Choose the closest option
    let selectedLocation = null;
    
    if (nearestFuel && nearestAirport) {
      selectedLocation = nearestFuel.distance <= nearestAirport.distance ? nearestFuel : nearestAirport;
    } else if (nearestFuel) {
      selectedLocation = nearestFuel;
    } else if (nearestAirport) {
      selectedLocation = nearestAirport;
    }
    
    if (selectedLocation) {
      handleAlternateSelection(selectedLocation);
    } else {
      // No suitable location found - create custom alternate
      const customAlternate = {
        lat: clickPoint.lat,
        lng: clickPoint.lng,
        name: `Custom Alternate (${clickPoint.lat.toFixed(4)}, ${clickPoint.lng.toFixed(4)})`,
        type: 'CUSTOM_ALTERNATE',
        hasFuel: false
      };
      handleAlternateSelection(customAlternate);
    }
  }, [fuelLocations, airports]);
  
  /**
   * Handle final alternate selection
   * @param {Object} alternateLocation - Selected alternate destination
   */
  const handleAlternateSelection = useCallback((alternateLocation) => {
    setSelectedAlternate(alternateLocation);
    
    // Update the alternate input field
    if (onAlternateUpdate) {
      onAlternateUpdate(alternateLocation, splitPoint);
    }
    
    setClickFeedback({
      type: 'success',
      message: `Alternate selected: ${alternateLocation.name || 'Custom Location'}`
    });
    
    // Reset for next selection
    if (!splitPoint) {
      // Direct alternate selection - could allow another
      setTimeout(() => {
        setClickFeedback({
          type: 'info',
          message: 'Alternate set. Click on route for split point, or select another alternate.'
        });
      }, 2000);
    } else {
      // Split point + alternate complete
      setTimeout(() => {
        setAwaitingAlternate(false);
        setSplitPoint(null);
        setClickFeedback({
          type: 'info',
          message: 'Alternate route complete. Continue adding alternates or exit mode.'
        });
      }, 2000);
    }
  }, [splitPoint, onAlternateUpdate]);
  
  /**
   * Clear current alternate selection
   */
  const clearAlternate = useCallback(() => {
    setSelectedAlternate(null);
    setSplitPoint(null);
    setAwaitingAlternate(false);
    
    if (onAlternateUpdate) {
      onAlternateUpdate(null, null);
    }
    
    setClickFeedback({
      type: 'info',
      message: 'Alternate cleared. Click to select new alternate.'
    });
  }, [onAlternateUpdate]);
  
  /**
   * Auto-clear feedback messages
   */
  useEffect(() => {
    if (clickFeedback && clickFeedback.type !== 'error') {
      const timer = setTimeout(() => {
        setClickFeedback(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [clickFeedback]);
  
  /**
   * Get current mode status for UI display
   */
  const getModeStatus = useCallback(() => {
    if (!isAlternateMode) {
      return { active: false, message: 'Alternate Mode Inactive' };
    }
    
    if (awaitingAlternate) {
      return { 
        active: true, 
        message: 'Select Alternate Destination',
        awaiting: true
      };
    }
    
    if (selectedAlternate) {
      return {
        active: true,
        message: `Alternate: ${selectedAlternate.name}`,
        hasAlternate: true
      };
    }
    
    return {
      active: true,
      message: 'Click Route or Select Alternate'
    };
  }, [isAlternateMode, awaitingAlternate, selectedAlternate]);
  
  // Return public interface
  return {
    // State
    isAlternateMode,
    splitPoint,
    awaitingAlternate,
    selectedAlternate,
    clickFeedback,
    
    // Actions
    toggleAlternateMode,
    handleMapClick,
    clearAlternate,
    
    // UI helpers
    getModeStatus,
    
    // Computed properties
    isActive: isAlternateMode,
    hasAlternate: !!selectedAlternate,
    hasSplitPoint: !!splitPoint,
    isWaitingForAlternate: awaitingAlternate
  };
};

export default useAlternateMode;