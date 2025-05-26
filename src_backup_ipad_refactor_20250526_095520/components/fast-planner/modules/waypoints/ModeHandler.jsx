import React, { useState, useEffect, useRef } from 'react';
import { createSeparateHandlers, toggleMode } from './separate-mode-handler';
import { initializeHandlers, reinitializeHandlers, getHandlers } from './mode-handler-fix';

/**
 * A component that manages separate mode handlers for normal and waypoint mode
 * This completely replaces the old approach that used flags
 * 
 * EMERGENCY FIX: Now using direct initialization approach to bypass React lifecycle issues
 */
const ModeHandler = ({ 
  mapManagerRef, 
  waypointManagerRef, 
  platformManagerRef, 
  initialMode = 'normal'
}) => {
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [isInitialized, setIsInitialized] = useState(false);
  const handlersRef = useRef(null);
  
  // EMERGENCY FIX: First attempt to directly initialize on component mount
  useEffect(() => {
    console.log('🚨 ModeHandler: EMERGENCY FIX - Direct initialization');
    
    if (getHandlers()) {
      console.log('🚨 ModeHandler: Handlers already initialized, using existing handlers');
      handlersRef.current = getHandlers();
      setIsInitialized(true);
      return;
    }
    
    // Initialize with a delay to ensure managers are available
    setTimeout(() => {
      console.log('🚨 ModeHandler: Attempting direct initialization after delay');
      
      // Check if global managers are available
      if (window.mapManager && window.waypointManager && window.platformManager) {
        console.log('🚨 ModeHandler: Global managers available, initializing handlers');
        
        // Initialize handlers directly
        const handlers = initializeHandlers();
        
        if (handlers) {
          console.log('🚨 ModeHandler: Handlers initialized successfully');
          
          // Store in ref
          handlersRef.current = handlers;
          
          // Set initial mode
          if (initialMode === 'waypoint') {
            window.toggleMapMode('waypoint');
          } else {
            window.toggleMapMode('normal');
          }
          
          setIsInitialized(true);
          
          // Add an emergency reset button to the DOM
          const button = document.createElement('button');
          button.innerText = 'Reset Map Handlers';
          button.style.position = 'fixed';
          button.style.bottom = '10px';
          button.style.left = '10px';
          button.style.zIndex = '9999';
          button.style.background = '#ff4136';
          button.style.color = 'white';
          button.style.padding = '5px 10px';
          button.style.border = 'none';
          button.style.borderRadius = '4px';
          button.style.cursor = 'pointer';
          button.onclick = () => {
            console.log('🚨 EMERGENCY: Reinitializing handlers');
            reinitializeHandlers();
            window.LoadingIndicator.updateStatusIndicator('Map handlers reset. Try clicking again.', 'success');
          };
          document.body.appendChild(button);
        } else {
          console.error('🚨 ModeHandler: Failed to initialize handlers directly');
        }
      } else {
        console.warn('🚨 ModeHandler: Global managers not available after delay');
        
        // Try again in 2 seconds
        setTimeout(() => {
          console.log('🚨 ModeHandler: Final attempt at initialization');
          
          if (window.mapManager && window.waypointManager && window.platformManager) {
            const handlers = initializeHandlers();
            
            if (handlers) {
              console.log('🚨 ModeHandler: Final initialization successful');
              handlersRef.current = handlers;
              setIsInitialized(true);
            }
          }
        }, 2000);
      }
    }, 1000);
  }, [initialMode]);
  
  // BACKUP: Also try the original approach as a fallback
  useEffect(() => {
    // Skip if already initialized through direct method
    if (isInitialized) {
      console.log('🚨 ModeHandler: Skipping React lifecycle initialization, already initialized directly');
      return;
    }
    
    if (!mapManagerRef?.current || !waypointManagerRef?.current || !platformManagerRef?.current) {
      console.log('ModeHandler (Backup): Waiting for required manager refs to be populated.');
      return;
    }
    
    // Wait for the map to be loaded before creating handlers
    mapManagerRef.current.onMapLoaded(() => {
      console.log('ModeHandler (Backup): Map is loaded, proceeding to create handlers via React lifecycle.');
      if (!handlersRef.current) { // Check again inside onMapLoaded, in case direct init succeeded meanwhile
        console.log('🚨 ModeHandler: BACKUP - Creating handlers through React lifecycle (map confirmed loaded).');
        
        const handlers = createSeparateHandlers(
          mapManagerRef.current,
          waypointManagerRef.current,
          platformManagerRef.current
        );
        
        handlersRef.current = handlers;
        
        if (handlers) {
          console.log(`ModeHandler (Backup): Activating initial mode: ${initialMode}`);
          if (initialMode === 'waypoint') {
            handlers.normalModeHandler?.deactivate(); // Add null checks
            handlers.waypointModeHandler?.activate();
          } else {
            handlers.waypointModeHandler?.deactivate();
            handlers.normalModeHandler?.activate();
          }
          window.toggleMapMode = (mode) => handleToggleMode(mode);
          setIsInitialized(true); // Set initialized by backup method
        } else {
          console.error("ModeHandler (Backup): createSeparateHandlers returned null/undefined.");
        }
      } else {
        console.log('ModeHandler (Backup): handlersRef.current already set, skipping creation.');
      }
    });
  }, [mapManagerRef, waypointManagerRef, platformManagerRef, initialMode, isInitialized]); // Dependencies remain the same
  
  // Expose toggleMode method
  const handleToggleMode = (targetMode) => {
    console.log(`🚨 ModeHandler: handleToggleMode called with ${targetMode} mode`);
    
    // Try using direct handlers first
    const directHandlers = getHandlers();
    if (directHandlers) {
      console.log('🚨 ModeHandler: Using direct handlers for toggle');
      
      // Convert string mode to boolean for our toggle function
      const waypointMode = targetMode === 'waypoint';
      
      // Toggle mode
      const success = toggleMode(directHandlers, waypointMode);
      
      if (success) {
        setCurrentMode(targetMode);
        showModeMessage(waypointMode);
        return true;
      }
    }
    
    // Fall back to React ref handlers
    if (!handlersRef.current) {
      console.error('🚨 ModeHandler: Cannot toggle mode - no handlers available');
      return false;
    }
    
    // Convert string mode to boolean for our toggle function
    const waypointMode = targetMode === 'waypoint';
    
    // Toggle mode
    const success = toggleMode(handlersRef.current, waypointMode);
    
    if (success) {
      setCurrentMode(targetMode);
      showModeMessage(waypointMode);
    }
    
    return success;
  };
  
  // Helper to show mode change message
  const showModeMessage = (waypointMode) => {
    if (window.LoadingIndicator) {
      if (waypointMode) {
        window.LoadingIndicator.updateStatusIndicator(
          'Waypoint mode active. Click on yellow waypoints to add them to your route.',
          'info'
        );
      } else {
        window.LoadingIndicator.updateStatusIndicator(
          'Normal mode active. Click on the map to add stops.',
          'info'
        );
      }
    }
  };
  
  return (
    <div style={{ display: 'none' }}>
      {/* This component doesn't render anything, it just manages the handlers */}
      
      {/* Show status as a debug element */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        left: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white',
        padding: '5px',
        borderRadius: '3px',
        fontSize: '10px',
        zIndex: 9999,
        display: 'none' // Hidden by default
      }}>
        Mode: {currentMode} | Initialized: {isInitialized ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

export default ModeHandler;
