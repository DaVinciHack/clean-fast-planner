// src/components/fast-planner/hooks/useUIControls.js

import { useState, useEffect } from 'react';
import useScreenSize from './useScreenSize';

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
  // Screen size detection
  const { isSmallScreen } = useScreenSize();
  
  // UI panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Platform visibility states (enhanced categories)
  const [platformsVisible, setPlatformsVisible] = useState(true);
  const [airfieldsVisible, setAirfieldsVisible] = useState(true);
  const [fixedPlatformsVisible, setFixedPlatformsVisible] = useState(true); // Legacy
  const [movablePlatformsVisible, setMovablePlatformsVisible] = useState(true);
  const [blocksVisible, setBlocksVisible] = useState(true); // New category
  const [basesVisible, setBasesVisible] = useState(true); // New category for bases
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

  // Clean iPad auto-hide: Close left panel on small screens (runs after all loading)
  useEffect(() => {
    if (isSmallScreen) {
      // Wait for all loading and settings to complete before checking
      const timer = setTimeout(() => {
        console.log('📱 iPad detected - checking panel state after loading');
        
        // Check both state AND visual position
        const panel = document.querySelector('.route-editor-panel');
        const rect = panel?.getBoundingClientRect();
        const isVisuallyOpen = rect && rect.left >= 0;
        
        console.log('Panel check:', { 
          leftPanelVisible, 
          isVisuallyOpen,
          panelLeft: rect?.left 
        });
        
        // Close if either state says open OR panel is visually open
        if (leftPanelVisible || isVisuallyOpen) {
          console.log('Panel needs closing - doing it now');
          setLeftPanelVisible(false);
          
          // Force slide-out animation
          if (panel) {
            panel.style.animation = 'slideOutToLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
          }
          
          // Save the setting
          if (appSettingsManagerRef?.current) {
            appSettingsManagerRef.current.updateUISettings({
              leftPanelVisible: false
            });
          }
        } else {
          console.log('Panel is properly closed - good!');
        }
      }, 2000); // Wait 2 seconds for all loading to complete
      
      return () => clearTimeout(timer);
    }
  }, [isSmallScreen]); // Only depend on isSmallScreen, not leftPanelVisible

  // Clean iPad auto-hide: Close RIGHT panel on small screens (runs after all loading) 
  useEffect(() => {
    if (isSmallScreen) {
      // Wait for all loading and settings to complete before checking
      const timer = setTimeout(() => {
        console.log('📱 iPad detected - checking RIGHT panel state after loading');
        
        // Check both state AND visual position
        const panel = document.querySelector('.info-panel');
        const rect = panel?.getBoundingClientRect();
        const isVisuallyOpen = rect && rect.right <= window.innerWidth;
        
        console.log('RIGHT Panel check:', { 
          rightPanelVisible, 
          isVisuallyOpen,
          panelRight: rect?.right 
        });
        
        // Close if either state says open OR panel is visually open
        if (rightPanelVisible || isVisuallyOpen) {
          console.log('RIGHT Panel needs closing - doing it now');
          setRightPanelVisible(false);
          
          // Force slide-out animation
          if (panel) {
            panel.style.animation = 'slideOutToRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
          }
          
          // Save the setting
          if (appSettingsManagerRef?.current) {
            appSettingsManagerRef.current.updateUISettings({
              rightPanelVisible: false
            });
          }
        } else {
          console.log('RIGHT Panel is properly closed - good!');
        }
      }, 2000); // Wait 2 seconds for all loading to complete
      
      return () => clearTimeout(timer);
    }
  }, [isSmallScreen]); // Only depend on isSmallScreen, not rightPanelVisible

  // iPad map click: Open panel when map is clicked (for adding waypoints)
  useEffect(() => {
    if (!isSmallScreen) return; // Only on iPad/small screens
    
    console.log('🗺️ Setting up map click detection for iPad');
    
    const handleMapClick = (e) => {
      // Only open if clicking on the map area (not on panels or controls)
      const isMapArea = e.target.closest('.leaflet-container') || e.target.closest('canvas');
      
      if (isMapArea && !leftPanelVisible) {
        console.log('🗺️ Map clicked - opening panel for waypoint');
        setLeftPanelVisible(true);
        
        // Save the setting
        if (appSettingsManagerRef?.current) {
          appSettingsManagerRef.current.updateUISettings({
            leftPanelVisible: true
          });
        }
        
        // Trigger slide-in animation
        const panel = document.querySelector('.route-editor-panel');
        if (panel) {
          panel.style.animation = 'slideInFromLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
        }
      }
    };
    
    // Add click listener
    document.addEventListener('click', handleMapClick);
    
    return () => {
      console.log('🧹 Removing map click listener');
      document.removeEventListener('click', handleMapClick);
    };
  }, [isSmallScreen, leftPanelVisible, appSettingsManagerRef]);

  // iPad hover logic: Open on left edge, close when mouse leaves panel
  useEffect(() => {
    if (!isSmallScreen) return; // Only on iPad/small screens
    
    console.log('🖱️ Setting up hover interactions for iPad');
    
    let closeTimer = null;
    
    const handleMouseMove = (e) => {
      const isNearLeftEdge = e.clientX < 50; // Within 50px of left edge for opening
      const isInLeftPanelArea = e.clientX < 350; // Within 350px of left edge for staying open
      
      // Open panel if mouse near left edge and panel is closed
      if (isNearLeftEdge && !leftPanelVisible) {
        console.log('🖱️ Mouse near left edge - opening panel');
        setLeftPanelVisible(true);
        
        // Save setting and trigger animation (same as toggle)
        if (appSettingsManagerRef?.current) {
          appSettingsManagerRef.current.updateUISettings({
            leftPanelVisible: true
          });
        }
        
        const panel = document.querySelector('.route-editor-panel');
        if (panel) {
          panel.style.animation = 'slideInFromLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
        }
        
        // Clear any pending close timer
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      }
      // Start close timer if mouse leaves left panel area
      else if (!isInLeftPanelArea && leftPanelVisible && !closeTimer) {
        console.log('🖱️ Mouse left LEFT panel area - starting close timer');
        
        closeTimer = setTimeout(() => {
          console.log('🖱️ Closing LEFT panel after timeout');
          setLeftPanelVisible(false);
          
          if (appSettingsManagerRef?.current) {
            appSettingsManagerRef.current.updateUISettings({
              leftPanelVisible: false
            });
          }
          
          const panel = document.querySelector('.route-editor-panel');
          if (panel) {
            panel.style.animation = 'slideOutToLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
          }
          closeTimer = null;
        }, 1000);
      }
      // Cancel close timer if mouse re-enters left area
      else if (isInLeftPanelArea && closeTimer) {
        console.log('🖱️ Mouse back in LEFT area - canceling close');
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    
    // Add event listeners - only mousemove needed now
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      console.log('🧹 Removing LEFT panel hover listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [isSmallScreen, leftPanelVisible, appSettingsManagerRef]);

  // RIGHT panel hover logic: Open on right edge, close when mouse leaves panel
  useEffect(() => {
    if (!isSmallScreen) return; // Only on iPad/small screens
    
    console.log('🖱️ Setting up RIGHT panel hover interactions for iPad');
    
    let closeTimer = null;
    
    const handleMouseMove = (e) => {
      const isNearRightEdge = e.clientX > (window.innerWidth - 50); // Within 50px of right edge for opening
      const isInRightPanelArea = e.clientX > (window.innerWidth - 350); // Within 350px of right edge for staying open
      
      // Open panel if mouse near right edge and panel is closed
      if (isNearRightEdge && !rightPanelVisible) {
        console.log('🖱️ Mouse near RIGHT edge - opening panel');
        setRightPanelVisible(true);
        
        // Save setting and trigger animation (same as toggle)
        if (appSettingsManagerRef?.current) {
          appSettingsManagerRef.current.updateUISettings({
            rightPanelVisible: true
          });
        }
        
        const panel = document.querySelector('.info-panel');
        if (panel) {
          panel.style.animation = 'slideInFromRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
        }
        
        // Clear any pending close timer
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      }
      // Start close timer if mouse leaves right panel area
      else if (!isInRightPanelArea && rightPanelVisible && !closeTimer) {
        console.log('🖱️ Mouse left RIGHT panel area - starting close timer');
        
        closeTimer = setTimeout(() => {
          console.log('🖱️ Closing RIGHT panel after timeout');
          setRightPanelVisible(false);
          
          if (appSettingsManagerRef?.current) {
            appSettingsManagerRef.current.updateUISettings({
              rightPanelVisible: false
            });
          }
          
          const panel = document.querySelector('.info-panel');
          if (panel) {
            panel.style.animation = 'slideOutToRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
          }
          closeTimer = null;
        }, 1000);
      }
      // Cancel close timer if mouse re-enters right area
      else if (isInRightPanelArea && closeTimer) {
        console.log('🖱️ Mouse back in RIGHT area - canceling close');
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    
    // Add event listeners - only mousemove needed now
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      console.log('🧹 Removing RIGHT panel hover listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [isSmallScreen, rightPanelVisible, appSettingsManagerRef]);

  /**
   * Toggles the left panel visibility
   */
  const toggleLeftPanel = () => {
    console.log('🔄 toggleLeftPanel called:', { currentState: leftPanelVisible, isSmallScreen });
    
    const newState = !leftPanelVisible;
    console.log('🔄 Setting new state:', newState);
    
    setLeftPanelVisible(newState);

    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        leftPanelVisible: newState
      });
      console.log('💾 Saved to settings:', newState);
    }

    // Trigger animation by adding and removing classes
    const panel = document.querySelector('.route-editor-panel');
    if (panel) {
      if (newState) {
        // Panel becoming visible - slide in
        console.log('📤 Triggering slide-in animation');
        panel.style.animation = 'slideInFromLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      } else {
        // Panel becoming hidden - slide out
        console.log('📥 Triggering slide-out animation');
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
   * Toggles bases visibility on the map
   */
  const toggleBasesVisibility = () => {
    const newState = !basesVisible;
    setBasesVisible(newState);
    
    if (platformManagerRef && platformManagerRef.current) {
      platformManagerRef.current.toggleBasesVisibility(newState);
    }
    
    // Save to settings
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerRef.current.updateUISettings({
        basesVisible: newState
      });
    }
  };
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
    basesVisible, // New state for bases
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
    toggleBasesVisibility, // New function for bases
    toggleFuelAvailableVisibility, // New function
    reloadPlatformData,
    handleRouteInputChange
  };
};

export default useUIControls;
