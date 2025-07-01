/**
 * useFuelStopOptimization.js
 * 
 * React hook for integrating fuel stop optimization into existing components.
 * Provides easy integration with the passenger overload detection system.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FuelStopOptimizationManager } from '../modules/optimization/FuelStopOptimizationManager.js';

export const useFuelStopOptimization = (
  flightConfiguration = {},
  options = {}
) => {
  const {
    autoTrigger = true,
    showNotifications = true,
    onRouteModified = null
  } = options;

  const [suggestions, setSuggestions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const optimizationManagerRef = useRef(null);
  const lastFlightConfigRef = useRef(null);

  // Initialize optimization manager
  useEffect(() => {
    if (!optimizationManagerRef.current) {
      optimizationManagerRef.current = new FuelStopOptimizationManager();
      
      // Set up callbacks
      optimizationManagerRef.current.setCallbacks({
        onSuggestionsReady: (suggestionData) => {
          console.log('useFuelStopOptimization: Suggestions ready:', suggestionData);
          setSuggestions(suggestionData);
          setError(null);
          
          if (showNotifications) {
            setShowNotification(true);
          }
        },
        onError: (errorMessage) => {
          console.log('useFuelStopOptimization: Error occurred:', errorMessage);
          setError(errorMessage);
          setSuggestions(null);
        },
        onProcessingUpdate: (processing) => {
          setIsProcessing(processing);
        }
      });
    }
  }, [showNotifications]);

  // Auto-trigger optimization when flight configuration changes
  useEffect(() => {
    if (!autoTrigger || !optimizationManagerRef.current) {
      return;
    }

    // Simple change detection to avoid constant re-processing
    const configString = JSON.stringify({
      requiredPassengers: flightConfiguration.requiredPassengers,
      stopCardsLength: flightConfiguration.stopCards?.length || 0,
      waypointsLength: flightConfiguration.waypoints?.length || 0,
      aircraftId: flightConfiguration.selectedAircraft?.id
    });

    if (configString === lastFlightConfigRef.current) {
      return; // No significant changes
    }

    lastFlightConfigRef.current = configString;

    // Check if should auto-trigger
    if (optimizationManagerRef.current.shouldAutoTrigger(flightConfiguration)) {
      console.log('useFuelStopOptimization: Auto-triggering optimization...');
      triggerOptimization();
    }
  }, [flightConfiguration, autoTrigger]);

  // Manual trigger function
  const triggerOptimization = useCallback(async () => {
    if (!optimizationManagerRef.current || isProcessing) {
      return;
    }

    console.log('useFuelStopOptimization: Manually triggering optimization...');
    
    try {
      const result = await optimizationManagerRef.current.checkAndOptimize(flightConfiguration);
      console.log('useFuelStopOptimization: Optimization result:', result);
      return result;
    } catch (error) {
      console.error('useFuelStopOptimization: Manual trigger failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [flightConfiguration, isProcessing]);

  // Accept suggestion and add to route
  const acceptSuggestion = useCallback(async (suggestion) => {
    if (!optimizationManagerRef.current || !onRouteModified) {
      console.error('useFuelStopOptimization: Cannot accept suggestion - missing dependencies');
      return false;
    }

    console.log('useFuelStopOptimization: Accepting suggestion:', suggestion.platform.name);

    try {
      // Use provided route modifier or create default one
      const routeModifier = onRouteModified || ((waypoint, insertIndex) => {
        console.log('useFuelStopOptimization: Default route modifier - would insert:', waypoint, 'at index:', insertIndex);
        return Promise.resolve(true);
      });

      const success = await optimizationManagerRef.current.addFuelStopToRoute(
        suggestion,
        routeModifier
      );

      if (success) {
        setSuggestions(null);
        setShowSuggestionModal(false);
        setShowNotification(false);
        console.log('useFuelStopOptimization: Suggestion accepted successfully');
      }

      return success;
    } catch (error) {
      console.error('useFuelStopOptimization: Failed to accept suggestion:', error);
      setError(`Failed to add fuel stop: ${error.message}`);
      return false;
    }
  }, [onRouteModified]);

  // Dismiss suggestions
  const dismissSuggestions = useCallback(() => {
    setSuggestions(null);
    setShowSuggestionModal(false);
    setShowNotification(false);
    setError(null);
    
    if (optimizationManagerRef.current) {
      optimizationManagerRef.current.clearSuggestions();
    }
  }, []);

  // Show detailed modal
  const showDetailsModal = useCallback(() => {
    setShowSuggestionModal(true);
    setShowNotification(false);
  }, []);

  return {
    // State
    suggestions,
    isProcessing,
    error,
    showSuggestionModal,
    showNotification,
    
    // Actions
    triggerOptimization,
    acceptSuggestion,
    dismissSuggestions,
    showDetailsModal,
    
    // UI Control
    setShowSuggestionModal,
    setShowNotification,
    
    // Data
    hasSuggestions: suggestions && suggestions.suggestions && suggestions.suggestions.length > 0,
    primarySuggestion: suggestions?.suggestions?.[0] || null,
    overloadAnalysis: suggestions?.overloadAnalysis || null
  };
};

export default useFuelStopOptimization;