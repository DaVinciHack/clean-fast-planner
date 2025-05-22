// src/components/fast-planner/hooks/useUIControls.js

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing UI control state and interactions
 * 
 * Region management has been moved to RegionContext.
 */
const useUIControls = ({
  appSettingsManagerRef,
  platformManagerRef,
  client,
  routeInput,
  setRouteInput
}) => {
  // UI panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Platform visibility states (enhanced categories)
  const [platformsVisible, setPlatformsVisible] = useState(true);
  const [airfieldsVisible, setAirfieldsVisible] = useState(true);
  const [fixedPlatformsVisible, setFixedPlatformsVisible] = useState(true); // Legacy
  const [movablePlatformsVisible, setMovablePlatformsVisible] = useState(true);
  const [blocksVisible, setBlocksVisible] = useState(true); // New category
  const [fuelAvailableVisible, setFuelAvailableVisible] = useState(false); // New category
  
  // Platform loading state
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [rigsLoading, setRigsLoading] = useState(false);
  const [rigsError, setRigsError] = useState(null);
  
  // Apply saved UI settings on mount
  useEffect(() => {
    // Ensure appSettingsManagerRef.current exists before accessing it
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      // Load saved UI settings
      const savedSettings = appSettingsManagerRef.current.getAllSettings();
      const uiSettings = savedSettings.uiSettings;
      
      // Apply UI settings if they exist
      if (uiSettings) {
        setLeftPanelVisible(uiSettings.leftPanelVisible);
        setRightPanelVisible(uiSettings.rightPanelVisible);
        setPlatformsVisible(uiSettings.platformsVisible);
        
        // Apply new visibility settings if they exist, otherwise default to true
        setAirfieldsVisible(uiSettings.airfieldsVisible !== undefined ? uiSettings.airfieldsVisible : true);
        setFixedPlatformsVisible(uiSettings.fixedPlatformsVisible !== undefined ? uiSettings.fixedPlatformsVisible : true);
        setMovablePlatformsVisible(uiSettings.movablePlatformsVisible !== undefined ? uiSettings.movablePlatformsVisible : true);
      }
    }
  }, [appSettingsManagerRef]);

  /**
   * Toggles the left panel visibility
   */
  const toggleLeftPanel = () => {
    const newState = !leftPanelVisible;
    setLeftPanelVisible(newState);

    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        leftPanelVisible: newState
      });
    }

    // Trigger animation by adding and removing classes
    const panel = document.querySelector('.route-editor-panel');
    if (panel) {
      if (newState) {
        // Panel becoming visible - slide in
        panel.style.animation = 'slideInFromLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      } else {
        // Panel becoming hidden - slide out
        panel.style.animation = 'slideOutToLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      }
    }
  };

  /**
   * Toggles the right panel visibility
   */
  const toggleRightPanel = () => {
    const newState = !rightPanelVisible;
    setRightPanelVisible(newState);

    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        rightPanelVisible: newState
      });
    }

    // Trigger animation by adding and removing classes
    const panel = document.querySelector('.info-panel');
    if (panel) {
      if (newState) {
        // Panel becoming visible - slide in
        panel.style.animation = 'slideInFromRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      } else {
        // Panel becoming hidden - slide out
        panel.style.animation = 'slideOutToRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      }
    }
  };

  /**
   * Toggles only fixed platforms visibility on the map (updated for new design)
   * This function now controls only the "Platforms" button which represents fixed platforms
   */
  const togglePlatformsVisibility = () => {
    const newState = !platformsVisible;
    setPlatformsVisible(newState);

    if (platformManagerRef && platformManagerRef.current) {
      // Only toggle fixed platforms, not all platforms
      platformManagerRef.current.toggleFixedPlatformsVisibility(newState);
    }

    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        platformsVisible: newState
      });
    }
  };
  
  /**
   * Toggles only airfields visibility on the map
   */
  const toggleAirfieldsVisibility = () => {
    const newState = !airfieldsVisible;
    setAirfieldsVisible(newState);
    
    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleAirfieldsVisibility(newState);
    }
    
    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        airfieldsVisible: newState
      });
    }
  };
  
  /**
   * Toggles only fixed platforms visibility on the map
   */
  const toggleFixedPlatformsVisibility = () => {
    const newState = !fixedPlatformsVisible;
    setFixedPlatformsVisible(newState);
    
    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleFixedPlatformsVisibility(newState);
    }
    
    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        fixedPlatformsVisible: newState
      });
    }
  };
  
  /**
   * Toggles only movable platforms visibility on the map
   */
  const toggleMovablePlatformsVisibility = () => {
    const newState = !movablePlatformsVisible;
    setMovablePlatformsVisible(newState);
    
    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleMovablePlatformsVisibility(newState);
    }
    
    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        movablePlatformsVisible: newState
      });
    }
  };
  
  /**
   * Toggles only blocks visibility on the map
   */
  const toggleBlocksVisibility = () => {
    const newState = !blocksVisible;
    setBlocksVisible(newState);
    
    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleBlocksVisibility(newState);
    }
    
    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        blocksVisible: newState
      });
    }
  };
  
  /**
   * Toggles fuel available locations visibility on the map
   */
  const toggleFuelAvailableVisibility = () => {
    const newState = !fuelAvailableVisible;
    setFuelAvailableVisible(newState);
    
    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleFuelAvailableVisibility(newState);
      
      // Update combined visibility state (fuel available is overlay, doesn't affect main state)
      // updateCombinedVisibilityState(); // Don't include fuel in combined state
    }
    
    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        fuelAvailableVisible: newState
      });
    }
  };
  
  /**
   * Updates the combined platformsVisible state based on individual visibility states
   * Note: This function is kept for backwards compatibility but no longer affects individual toggles
   */
  const updateCombinedVisibilityState = () => {
    // Note: In the new design, each button controls only its own layer
    // This function no longer needs to set a combined state that affects other buttons
    // Each category (airfields, platforms, movable, blocks) is independent
    console.log('Platform visibility states:', {
      airfields: airfieldsVisible,
      platforms: platformsVisible,
      movable: movablePlatformsVisible,
      blocks: blocksVisible,
      fuelAvailable: fuelAvailableVisible
    });
  };

  /**
   * Reloads platform data from Foundry
   * This function now needs to get the current region from the RegionContext
   */
  const reloadPlatformData = () => {
    if (platformManagerRef && platformManagerRef.current && client) {
      setRigsLoading(true);
      
      // We'll need to get the current region using the RegionContext
      // For now, we can use the global variable as a fallback
      const region = window.currentRegion;
      if (!region) {
        console.error('Cannot reload platforms: No current region');
        setRigsLoading(false);
        return;
      }
      
      platformManagerRef.current.loadPlatformsFromFoundry(client, region.osdkRegion)
        .then(() => {
          setPlatformsLoaded(true);
          setRigsLoading(false);
        })
        .catch(error => {
          console.error(`Error loading platforms: ${error}`);
          setRigsError(error.message);
          setRigsLoading(false);
        });
    }
  };

  /**
   * Handles route input changes
   * 
   * @param {string} value - New route input value
   */
  const handleRouteInputChange = (value) => {
    setRouteInput(value);
  };

  return {
    leftPanelVisible,
    rightPanelVisible,
    platformsVisible,
    airfieldsVisible,
    fixedPlatformsVisible, // Legacy
    movablePlatformsVisible,
    blocksVisible, // New state
    fuelAvailableVisible, // New state
    platformsLoaded,
    rigsLoading,
    rigsError,
    toggleLeftPanel,
    toggleRightPanel,
    togglePlatformsVisibility,
    toggleAirfieldsVisibility,
    toggleFixedPlatformsVisibility, // Legacy
    toggleMovablePlatformsVisibility,
    toggleBlocksVisibility, // New function
    toggleFuelAvailableVisibility, // New function
    reloadPlatformData,
    handleRouteInputChange
  };
};

export default useUIControls;
