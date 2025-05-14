// src/components/fast-planner/hooks/useUIControls.js

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing UI control state and interactions
 */
const useUIControls = ({
  appSettingsManagerRef,
  platformManagerRef,
  regionManagerRef,
  client,
  // Props for lifted state
  regions,
  currentRegion,
  regionLoading,
  setRegions,
  setCurrentRegion,
  setRegionLoading
}) => {
  // UI panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [platformsVisible, setPlatformsVisible] = useState(true);
  
  // Platform loading state (rigsError, rigsLoading, platformsLoaded are still local)
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [rigsLoading, setRigsLoading] = useState(false);
  const [rigsError, setRigsError] = useState(null);
  // regions, currentRegion, regionLoading are now props
  
  // Input state
  const [routeInput, setRouteInput] = useState('');

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
  }, [appSettingsManagerRef.current]);

  // Load platform data and OSDK waypoints when region changes
  useEffect(() => {
    // Ensure platformManagerRef.current exists before accessing it
    if (platformManagerRef && platformManagerRef.current && currentRegion && client) {
      console.log(`Loading platforms for region ${currentRegion.name}`);
      setRigsLoading(true); // Local state for rig loading

      try {
        if (typeof platformManagerRef.current.loadPlatformsFromFoundry === 'function') {
          platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
            .then(() => {
              setPlatformsLoaded(true); // Local state
              setRigsLoading(false);    // Local state
              // setPlatformsVisible(true); // This is a local state, might be controlled elsewhere or fine here
            })
            .catch(error => {
              console.error(`Error loading platforms: ${error}`);
              setRigsError(error?.message || 'Unknown error loading platforms'); // Local state
              setRigsLoading(false); // Local state
            });
        } else {
          console.error('PlatformManager.loadPlatformsFromFoundry is not a function');
          setRigsError('Platform loading method not available'); // Local state
          setRigsLoading(false); // Local state
        }
      } catch (error) {
        console.error(`Error calling platform loading method: ${error}`);
        setRigsError(error?.message || 'Error loading platforms'); // Local state
        setRigsLoading(false); // Local state
      }

      if (typeof platformManagerRef.current.loadOsdkWaypointsFromFoundry === 'function') {
        let regionQueryTerm = currentRegion.osdkRegion || currentRegion.name;
        if (regionQueryTerm && regionQueryTerm.toLowerCase() === 'norway') {
          regionQueryTerm = 'NORWAY';
        }
        console.log(`Loading OSDK waypoints for region identifier: ${regionQueryTerm}`);
        platformManagerRef.current.loadOsdkWaypointsFromFoundry(client, regionQueryTerm)
          .then(() => console.log(`OSDK waypoints loaded for ${regionQueryTerm}`))
          .catch(error => console.error(`Error loading OSDK waypoints for ${regionQueryTerm}:`, error));
      } else {
        console.error('PlatformManager.loadOsdkWaypointsFromFoundry is not a function');
      }
    }
  }, [platformManagerRef, currentRegion?.id, client, setRigsLoading, setPlatformsLoaded, setRigsError]); // Changed to currentRegion?.id

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
   * Changes the current region
   * 
   * @param {string} regionId - ID of the region to change to
   */
  const changeRegion = (regionId) => {
    // Use the passed-in setters for region state
    if (regionManagerRef && regionManagerRef.current && setCurrentRegion && setRegionLoading) {
      console.log(`Changing region to ${regionId}`);
      setRegionLoading(true); // Use prop setter
      
      console.log('RegionManager reference:', regionManagerRef.current);
      
      const regionObject = regionManagerRef.current.getRegionById(regionId); // Get the full region object
      if (regionObject) {
        setCurrentRegion(regionObject); // Use prop setter with the full object
        console.log('Region change initiated, new currentRegion object:', regionObject);

        // Save to settings
        if (appSettingsManagerRef && appSettingsManagerRef.current) {
          appSettingsManagerRef.current.setRegion(regionId); // Persist the ID
        }
      } else {
        console.error(`Region with ID ${regionId} not found by RegionManager.`);
        setRegionLoading(false); // Reset loading state if region not found
      }
      // setRegionLoading(false) might be better placed after platform loading in useEffect
    } else {
      console.error('Cannot change region: regionManagerRef, setCurrentRegion, or setRegionLoading is missing/null');
      if(setRegionLoading) setRegionLoading(false); // Attempt to reset loading state
    }
  };

  /**
   * Reloads platform data from Foundry
   */
  const reloadPlatformData = () => {
    if (platformManagerRef && platformManagerRef.current && currentRegion) {
      setRigsLoading(true); // Local state
      platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
        .then(() => {
          setPlatformsLoaded(true); // Local state
          setRigsLoading(false);    // Local state
          // setPlatformsVisible(true); // Local state
        })
        .catch(error => {
          console.error(`Error loading platforms: ${error}`);
          setRigsError(error.message); // Local state
          setRigsLoading(false);       // Local state
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
    setLeftPanelVisible, // Keep local state setters if panels are fully managed here
    rightPanelVisible,
    setRightPanelVisible, // Keep local state setters
    platformsVisible,
    setPlatformsVisible, // Keep local state setters
    platformsLoaded,
    // setPlatformsLoaded, // This is local, no need to return setter if not used externally
    rigsLoading,
    rigsError,
    // regions, // Prop, no longer returned
    // setRegions, // Prop, no longer returned
    // currentRegion, // Prop, no longer returned
    // setCurrentRegion, // Prop, no longer returned
    // regionLoading, // Prop, no longer returned
    // setRegionLoading, // Prop, no longer returned
    routeInput,
    setRouteInput, // Keep local state setter
    toggleLeftPanel,
    toggleRightPanel,
    togglePlatformsVisibility,
    changeRegion,
    reloadPlatformData,
    handleRouteInputChange
  };
};

export default useUIControls;
