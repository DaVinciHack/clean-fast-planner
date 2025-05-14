// src/components/fast-planner/hooks/useUIControls.js

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing UI control state and interactions
 */
const useUIControls = ({
  appSettingsManagerRef,
  platformManagerRef,
  regionManagerRef,
  client
}) => {
  // UI panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [platformsVisible, setPlatformsVisible] = useState(true);
  
  // Platform/region loading state
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [rigsLoading, setRigsLoading] = useState(false);
  const [rigsError, setRigsError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  
  // Input state
  const [routeInput, setRouteInput] = useState('');

  // Apply saved UI settings on mount
  useEffect(() => {
    if (appSettingsManagerRef.current) {
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
  }, [appSettingsManagerRef.current]);

  // Load platform data and OSDK waypoints when region changes
  useEffect(() => {
    if (platformManagerRef.current && currentRegion && client) {
      console.log(`Loading platforms for region ${currentRegion.name}`);
      setRigsLoading(true);

      try {
        // Check if the method exists
        if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
          platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
            .then(() => {
              setPlatformsLoaded(true);
              setRigsLoading(false);
              setPlatformsVisible(true);
            })
            .catch(error => {
              console.error(`Error loading platforms: ${error}`);
              setRigsError(error?.message || 'Unknown error loading platforms');
              setRigsLoading(false);
            });
        } else {
          // Method doesn't exist, show error
          console.error('PlatformManager.loadPlatformsFromFoundry is not a function');
          setRigsError('Platform loading method not available');
          setRigsLoading(false);
        }
      } catch (error) {
        console.error(`Error calling platform loading method: ${error}`);
        setRigsError(error?.message || 'Error loading platforms');
        setRigsLoading(false);
      }

      // Also load OSDK waypoints for the current region
      if (typeof platformManagerRef.current.loadOsdkWaypointsFromFoundry === 'function') {
        let regionQueryTerm = currentRegion.osdkRegion || currentRegion.name;
        // Specifically ensure "NORWAY" is uppercase if that's the region, as OSDK might be case-sensitive
        if (regionQueryTerm && regionQueryTerm.toLowerCase() === 'norway') {
          regionQueryTerm = 'NORWAY';
        }
        console.log(`Loading OSDK waypoints for region identifier: ${regionQueryTerm}`);
        platformManagerRef.current.loadOsdkWaypointsFromFoundry(client, regionQueryTerm)
          .then(() => {
            console.log(`OSDK waypoints loaded for ${regionQueryTerm}`);
          })
          .catch(error => {
            console.error(`Error loading OSDK waypoints for ${regionQueryTerm}:`, error);
          });
      } else {
        console.error('PlatformManager.loadOsdkWaypointsFromFoundry is not a function');
      }
    }
  }, [currentRegion, client]);

  /**
   * Toggles the left panel visibility
   */
  const toggleLeftPanel = () => {
    const newState = !leftPanelVisible;
    setLeftPanelVisible(newState);

    // Save to settings
    if (appSettingsManagerRef.current) {
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
    if (appSettingsManagerRef.current) {
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

    if (platformManagerRef.current) {
      platformManagerRef.current.toggleVisibility(newState);
    }

    // Save to settings
    if (appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        platformsVisible: newState
      });
    }
  };

  /**
   * Changes the current region
   * 
   * @param {string} regionId - ID of the region to change to
   */
  const changeRegion = (regionId) => {
    if (regionManagerRef.current) {
      console.log(`Changing region to ${regionId}`);
      setRegionLoading(true);

      // Set the new region
      regionManagerRef.current.setRegion(regionId);

      // Save to settings
      if (appSettingsManagerRef.current) {
        appSettingsManagerRef.current.setRegion(regionId);
      }
    }
  };

  /**
   * Reloads platform data from Foundry
   */
  const reloadPlatformData = () => {
    if (platformManagerRef.current && currentRegion) {
      setRigsLoading(true);
      platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
        .then(() => {
          setPlatformsLoaded(true);
          setRigsLoading(false);
          setPlatformsVisible(true);
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
    setLeftPanelVisible,
    rightPanelVisible,
    setRightPanelVisible,
    platformsVisible,
    setPlatformsVisible,
    platformsLoaded,
    setPlatformsLoaded,
    rigsLoading,
    rigsError,
    regions,
    setRegions,
    currentRegion,
    setCurrentRegion,
    regionLoading,
    setRegionLoading,
    routeInput,
    setRouteInput,
    toggleLeftPanel,
    toggleRightPanel,
    togglePlatformsVisibility,
    changeRegion,
    reloadPlatformData,
    handleRouteInputChange
  };
};

export default useUIControls;