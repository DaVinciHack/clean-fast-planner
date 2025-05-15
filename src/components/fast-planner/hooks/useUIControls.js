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
  const [platformsVisible, setPlatformsVisible] = useState(true);
  
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
   * Toggles platform visibility on the map
   */
  const togglePlatformsVisibility = () => {
    const newState = !platformsVisible;
    setPlatformsVisible(newState);

    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleVisibility(newState);
    }

    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        platformsVisible: newState
      });
    }
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
    platformsLoaded,
    rigsLoading,
    rigsError,
    toggleLeftPanel,
    toggleRightPanel,
    togglePlatformsVisibility,
    reloadPlatformData,
    handleRouteInputChange
  };
};

export default useUIControls;
