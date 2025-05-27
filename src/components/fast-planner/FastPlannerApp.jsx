// Import React and necessary hooks
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';
import './waypoint-markers.css'; // Clean waypoint marker styles
import './fixes/route-stats-card-fix.css';
import './fixes/panel-interaction-fix.css';

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  AppHeader
} from './components';

// Import MapZoomHandler for waypoint display
import MapZoomHandler from './components/map/MapZoomHandler';

// Import ModeHandler for backup
import ModeHandler from './modules/waypoints/ModeHandler';

// Import Region Context Provider and hook
import { RegionProvider, useRegion } from './context/region';

// Import LoadingIndicator for status checking
import LoadingIndicator from './modules/LoadingIndicator';
// Import StopCardCalculator for stop cards generation
import StopCardCalculator from './modules/calculations/flight/StopCardCalculator';
// Import custom hooks
import useManagers from './hooks/useManagers';
import useWeather from './hooks/useWeather';
import useAircraft from './hooks/useAircraft';
import useWaypoints from './hooks/useWaypoints';
import useRouteCalculation from './hooks/useRouteCalculation';
import useUIControls from './hooks/useUIControls';
import useMapLayers from './hooks/useMapLayers';

/**
 * FastPlannerCore Component
 * Contains the main application logic and UI, and can safely use useRegion()
 */
const FastPlannerCore = ({ 
  appManagers, 
  flightSettings, setFlightSettings, // Pass state and setter
  weather, setWeather,             // Pass state and setter
  waypoints, setWaypoints,         // Pass state and setter
  stopCards, setStopCards,         // Pass state and setter
  routeStats, setRouteStats,       // Pass state and setter
  forceUpdate, setForceUpdate,     // Pass state and setter
  routeInput, setRouteInput,       // Pass state and setter
  favoriteLocations, setFavoriteLocations, // Pass state and setter
  reserveMethod, setReserveMethod, // Pass state and setter
  addWaypointDirectImplementation, // Pass the actual implementation function
  handleMapReadyImpl // Pass the map ready implementation
}) => {
  const { isAuthenticated, userName, login } = useAuth();
  const { currentRegion: activeRegionFromContext } = useRegion(); 
  
  // State for tracking actual loading status from LoadingIndicator
  const [isActuallyLoading, setIsActuallyLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Check LoadingIndicator status periodically
  useEffect(() => {
    const checkLoadingStatus = () => {
      const status = LoadingIndicator.getQueueStatus();
      const hasActiveLoading = status.length > 0 || status.isProcessing || status.currentMessage;
      
      if (!hasActiveLoading && isActuallyLoading && !isFinishing) {
        // Loading just finished - start finishing animation
        setIsFinishing(true);
        // After one complete cycle (1.5s), actually stop
        setTimeout(() => {
          setIsActuallyLoading(false);
          setIsFinishing(false);
        }, 1500);
      } else if (hasActiveLoading && !isActuallyLoading) {
        // Loading started
        setIsActuallyLoading(true);
        setIsFinishing(false);
      }
    };
    
    // Check immediately and then every 200ms
    checkLoadingStatus();
    const interval = setInterval(checkLoadingStatus, 200);
    
    return () => clearInterval(interval);
  }, [isActuallyLoading, isFinishing]); 
  
  useEffect(() => {
    const removeDebugUI = () => {
      const debugSelectors = [
        '.debug-popup', 
        '.fix-applied-popup',
        '#status-indicator-container',
        '.clean-notification',
        '#clean-notifications-container'
      ];
      debugSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(element => element.remove());
        }
      });
    };
    removeDebugUI();
    const cleanupInterval = setInterval(removeDebugUI, 3000);
    return () => clearInterval(cleanupInterval);
  }, []);
  
  const {
    mapManagerRef, waypointManagerRef, platformManagerRef, routeCalculatorRef,
    aircraftManagerRef, mapInteractionHandlerRef, appSettingsManagerRef, handleMapReady
  } = appManagers; // Managers are created in parent and passed down

  // Setup for addWaypointDirect (if its implementation is passed)
  useEffect(() => {
    if (waypointManagerRef.current && platformManagerRef.current && 
        appManagers.addWaypoint && typeof addWaypointDirectImplementation === 'function') {
      appManagers.addWaypoint.implementation = addWaypointDirectImplementation;
    }
  }, [waypointManagerRef, platformManagerRef, appManagers.addWaypoint, addWaypointDirectImplementation]);


  const {
    aircraftType, setAircraftType, aircraftRegistration, setAircraftRegistration,
    selectedAircraft, setSelectedAircraft, aircraftList, aircraftTypes, aircraftsByType,
    aircraftLoading, changeAircraftType, changeAircraftRegistration,
    setAircraftManagers, setCurrentAircraftRegion
  } = useAircraft({
    aircraftManagerRef, appSettingsManagerRef, setFlightSettings
  });
  
  useEffect(() => {
    if (aircraftManagerRef.current && appSettingsManagerRef.current) {
      setAircraftManagers(aircraftManagerRef.current, appSettingsManagerRef.current);
    }
  }, [aircraftManagerRef, appSettingsManagerRef, setAircraftManagers]);

  // Memoize the region change handler to maintain stable reference
  const handleRegionChange = useCallback((event) => {
    if (event.detail && event.detail.region) {
      console.log(`FastPlannerCore: Received region change event: ${event.detail.region.name}`);
      // The actual region update is delegated to the stabilized function in useAircraft
      setCurrentAircraftRegion(event.detail.region);
    }
  }, [setCurrentAircraftRegion]);

  // Set up the event listener with the memoized handler
  useEffect(() => {
    console.log('FastPlannerCore: Setting up region-changed event listener');
    window.addEventListener('region-changed', handleRegionChange);
    return () => {
      console.log('FastPlannerCore: Removing region-changed event listener');
      window.removeEventListener('region-changed', handleRegionChange);
    };
  }, [handleRegionChange]);

  const {
    leftPanelVisible, rightPanelVisible, platformsVisible, platformsLoaded,
    rigsLoading, rigsError, toggleLeftPanel, toggleRightPanel,
    togglePlatformsVisibility, reloadPlatformData, handleRouteInputChange,
    // Enhanced platform visibility state and toggles
    airfieldsVisible, fixedPlatformsVisible, movablePlatformsVisible,
    blocksVisible, basesVisible, fuelAvailableVisible, // New state variables
    toggleAirfieldsVisibility, toggleFixedPlatformsVisibility, toggleMovablePlatformsVisibility,
    toggleBlocksVisibility, toggleBasesVisibility, toggleFuelAvailableVisibility // New toggle functions
  } = useUIControls({ appSettingsManagerRef, platformManagerRef, client, routeInput, setRouteInput });
  
  // Initialize map layers
  const {
    gulfCoastMapRef,
    weatherLayerRef,
    vfrChartsRef,
    layerStates,
    toggleLayer
  } = useMapLayers({ mapManagerRef });

  const {
    waypointModeActive, addWaypoint: hookAddWaypoint, removeWaypoint, updateWaypointName,
    clearRoute, reorderWaypoints, toggleWaypointMode
  } = useWaypoints({
    waypointManagerRef, platformManagerRef, mapInteractionHandlerRef, setWaypoints,
    client, currentRegion: activeRegionFromContext, setRouteStats, setStopCards
  });

  const { updateWeatherSettings } = useWeather({
    weather, setWeather, waypoints, selectedAircraft, routeCalculatorRef,
    waypointManagerRef, flightSettings, setRouteStats, setStopCards, setForceUpdate
  });

  const { updateFlightSetting } = useRouteCalculation({
    waypoints, selectedAircraft, flightSettings, setFlightSettings,
    setRouteStats, setStopCards, weather, waypointManagerRef, appSettingsManagerRef
  });

  useEffect(() => { import('./modules/waypoints/waypoint-styles.css'); }, []);

  // Effect to clear route when activeRegionFromContext (from useRegion) changes
  const firstLoadDone = useRef(false);
  const lastRegionId = useRef(null);
  
  useEffect(() => {
    // Skip if region is not set yet
    if (!activeRegionFromContext) return;
    
    // Skip on first load
    if (!firstLoadDone.current) {
      firstLoadDone.current = true;
      lastRegionId.current = activeRegionFromContext.id;
      return;
    }
    
    // Skip if the region hasn't actually changed (prevents unnecessary clearing)
    if (lastRegionId.current === activeRegionFromContext.id) {
      return;
    }
    
    // Update reference for next comparison
    lastRegionId.current = activeRegionFromContext.id;
    
    console.log('FastPlannerCore: activeRegionFromContext changed to', activeRegionFromContext.name);
    
    // Just clear React state since RegionContext now handles the map cleanup
    setWaypoints([]);
    setRouteStats(null);
    setStopCards([]);
    
    // Clear global state
    window.currentRouteStats = null;
  }, [activeRegionFromContext, setWaypoints, setRouteStats, setStopCards]);

  const handleAddFavoriteLocation = (location) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      appManagers.favoriteLocationsManagerRef.current.addFavoriteLocation(location);
      const updatedFavorites = appManagers.favoriteLocationsManagerRef.current.getFavoriteLocations();
      setFavoriteLocations(updatedFavorites);
    }
  };

  // Generate stop cards data using StopCardCalculator
  const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather, options = {}) => {
    try {
      // Ensure routeStats has the properties the FinanceCard expects
      if (routeStats) {
        // Add missing properties that FinanceCard might be looking for
        if (!routeStats.totalTime && routeStats.totalTimeFormatted) {
          routeStats.totalTime = routeStats.totalTimeFormatted;
        }
        if (!routeStats.flightTime && routeStats.estimatedTime) {
          routeStats.flightTime = routeStats.estimatedTime;
        }
        if (!routeStats.deckTime && routeStats.deckTimeMinutes) {
          routeStats.deckTime = Math.round(routeStats.deckTimeMinutes);
        }
      }
      
      const stopCards = StopCardCalculator.calculateStopCards(waypoints, routeStats, selectedAircraft, weather, options);
      // Make it available globally for debugging
      window.currentStopCards = stopCards;
      return stopCards;
    } catch (error) {
      console.error('Error generating stop cards:', error);
      return [];
    }
  };

  // Make generateStopCardsData available globally for debugging
  window.generateStopCardsData = generateStopCardsData;

  const handleRemoveFavoriteLocation = (locationId) => {
    if (appManagers.favoriteLocationsManagerRef && appManagers.favoriteLocationsManagerRef.current) {
      appManagers.favoriteLocationsManagerRef.current.removeFavoriteLocation(locationId);
      setFavoriteLocations(appManagers.favoriteLocationsManagerRef.current.getFavoriteLocations());
    }
  };

  // Handle loading a flight from the LoadFlightsCard
  const handleFlightLoad = async (flightData) => {
    try {
      console.log('🚁 handleFlightLoad CALLED with flight:', flightData.flightNumber || flightData.name);
      console.log('🚁 Aircraft ID in flight data:', flightData.aircraftId);
      
      // Clear existing route first
      clearRoute();
      
      // Wait for clear to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Build and set the route from stops using the proper handler
      // BUT ONLY if we don't have waypoint data (to avoid double loading)
      const hasWaypointData = (flightData.displayWaypoints && flightData.displayWaypoints.length > 0) ||
                            (flightData.waypoints && flightData.waypoints.length > 0);
      
      if (flightData.stops && flightData.stops.length > 0 && !hasWaypointData) {
        console.log(`Loading ${flightData.stops.length} stops as route (no waypoint data available)`);
        
        // Create a route string by joining the stops
        const routeString = flightData.stops.join(' ');
        console.log(`Setting route input to: ${routeString}`);
        
        // Set the route input field for display
        setRouteInput(routeString);
        
        // Actually process the route to create waypoints using the hookAddWaypoint function
        console.log('Processing route string to create waypoints...');
        try {
          if (hookAddWaypoint) {
            await hookAddWaypoint(routeString);
            console.log('Route processing completed via hookAddWaypoint');
          } else {
            console.warn('hookAddWaypoint not available, trying alternative method');
            // Alternative: use the addWaypointDirectImpl if available
            if (window.addWaypointClean) {
              await window.addWaypointClean(routeString);
              console.log('Route processing completed via addWaypointClean');
            } else {
              console.error('No waypoint processing function available');
            }
          }
        } catch (error) {
          console.error('Error processing route:', error);
        }
        
        // Wait for waypoint processing to complete with improved timing
        console.log('Waiting for waypoint processing to complete...');
        
        // Use a more robust waiting mechanism
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 500; // Check every 500ms
        
        const waitForWaypoints = () => {
          return new Promise((resolve) => {
            const checkWaypoints = () => {
              attempts++;
              
              // Get current waypoints from multiple sources
              const currentWaypoints = waypoints || 
                                     window.waypointManager?.getWaypoints?.() || 
                                     appManagers.waypointManagerRef?.current?.getWaypoints?.() ||
                                     [];
              
              console.log(`Attempt ${attempts}: Found ${currentWaypoints.length} waypoints`);
              
              // Check if we have the expected number of waypoints (at least the stops)
              if (currentWaypoints.length >= flightData.stops.length || attempts >= maxAttempts) {
                console.log(`Waypoint processing complete: ${currentWaypoints.length} waypoints created`);
                resolve(currentWaypoints);
              } else {
                console.log(`Waiting for more waypoints... (expected at least ${flightData.stops.length})`);
                setTimeout(checkWaypoints, checkInterval);
              }
            };
            
            checkWaypoints();
          });
        };
        
        // Wait for waypoints to be processed
        const processedWaypoints = await waitForWaypoints();
        
        console.log('Triggering stop card generation after flight load...');
        const currentRouteStats = routeStats || window.currentRouteStats;
          
        console.log(`Found ${processedWaypoints.length} waypoints for stop card generation`);
        console.log('Waypoints:', processedWaypoints.map(wp => wp.name || 'unnamed').join(', '));
        
        if (processedWaypoints && processedWaypoints.length >= 2) {
          console.log(`Generating stop cards for ${processedWaypoints.length} waypoints`);
          
          // Generate stop cards using the same logic as normal route building
          const newStopCards = generateStopCardsData(
            processedWaypoints, 
            currentRouteStats, 
            selectedAircraft, 
            weather
          );
          
          if (newStopCards && newStopCards.length > 0) {
            console.log(`Generated ${newStopCards.length} stop cards for loaded flight`);
            setStopCards(newStopCards);
            
            // Make stop cards globally available for debugging
            window.debugStopCards = newStopCards;
            console.log('Stop cards available at window.debugStopCards');
            
            // Update loading indicator with success
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Flight loaded: ${flightData.flightNumber || 'Unknown'} with ${flightData.stops.length} stops`, 
                'success',
                3000
              );
            }
          } else {
            console.warn('Stop card generation returned no results');
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                'Flight loaded but stop cards could not be generated', 
                'warning',
                3000
              );
            }
          }
        } else {
          console.warn(`Insufficient waypoints for stop card generation (need >= 2, have ${processedWaypoints.length})`);
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Flight loaded but insufficient waypoints for route calculation', 
              'warning',
              3000
            );
          }
        }
      }
      
      // After loading completes, ensure we return to the main card
      setTimeout(() => {
        // The RightPanel should automatically show stop cards if they exist
        // This timeout ensures the panel switches back to main view after loading
        console.log('Flight loading complete - returning to main view');
      }, 2000);
      
      // Process waypoints - handle both displayWaypoints (strings) and waypoints (objects)
      let waypointsToProcess = [];
      
      if (flightData.displayWaypoints && flightData.displayWaypoints.length > 0) {
        console.log('Using displayWaypoints format');
        waypointsToProcess = flightData.displayWaypoints;
      } else if (flightData.waypoints && flightData.waypoints.length > 0) {
        console.log('Using waypoints format - converting to displayWaypoints format');
        console.log('Flight waypoints:', flightData.waypoints);
        console.log('Flight stops:', flightData.stops);
        
        // We need to reconstruct the full sequence from the original displayWaypoints
        // Check if we have the raw flight data with the original displayWaypoints
        if (flightData._rawFlight && flightData._rawFlight.displayWaypoints) {
          const rawDisplayWaypoints = flightData._rawFlight.displayWaypoints;
          console.log('Found raw displayWaypoints:', rawDisplayWaypoints);
          
          if (typeof rawDisplayWaypoints === 'string' && rawDisplayWaypoints.includes('|')) {
            waypointsToProcess = rawDisplayWaypoints.split('|').map(wp => wp.trim()).filter(wp => wp.length > 0);
            console.log('Using parsed raw displayWaypoints:', waypointsToProcess);
          } else if (Array.isArray(rawDisplayWaypoints)) {
            waypointsToProcess = rawDisplayWaypoints;
            console.log('Using raw displayWaypoints array:', waypointsToProcess);
          }
        }
        
        // Fallback: reconstruct from waypoints + stops if raw data not available
        if (waypointsToProcess.length === 0) {
          console.log('Reconstructing displayWaypoints from waypoints and stops...');
          
          // Create a basic sequence: departure + waypoints + destination
          const stops = flightData.stops || [];
          const waypoints = flightData.waypoints || [];
          
          if (stops.length >= 2) {
            // Add departure
            waypointsToProcess.push(`${stops[0]} (Dep)`);
            
            // Add navigation waypoints (they don't have coordinates so we'll use name-based lookup)
            for (const wp of waypoints) {
              if (wp.name && !wp.isStop) {
                waypointsToProcess.push(wp.name);
              }
            }
            
            // Add intermediate stops
            for (let i = 1; i < stops.length - 1; i++) {
              waypointsToProcess.push(`${stops[i]} (Stop${i})`);
            }
            
            // Add destination
            waypointsToProcess.push(`${stops[stops.length - 1]} (Des)`);
          }
        }
        
        console.log('Final converted waypoints:', waypointsToProcess);
      }
      
      if (waypointsToProcess.length > 0) {
        console.log(`Loading flight waypoints with coordinate placement - ${waypointsToProcess.length} waypoints`);
        
        // Set the route input for display (just the stops)
        if (flightData.stops && flightData.stops.length > 0) {
          const routeString = flightData.stops.join(' ');
          console.log(`Setting route input to: ${routeString}`);
          setRouteInput(routeString);
        }
        
        try {
          // Get the full route coordinates from the raw flight data
          const rawFlight = flightData._rawFlight;
          let routeCoordinates = [];
          
          console.log('DEBUG: Raw flight object:', rawFlight);
          
          if (rawFlight && rawFlight.fullRouteGeoShape) {
            console.log('DEBUG: Found fullRouteGeoShape, extracting coordinates...');
            // Extract coordinates from the GeoShape
            const geoShape = rawFlight.fullRouteGeoShape.toGeoJson ? 
              rawFlight.fullRouteGeoShape.toGeoJson() : rawFlight.fullRouteGeoShape;
              
            console.log('DEBUG: GeoShape:', geoShape);
              
            if (geoShape && geoShape.coordinates) {
              routeCoordinates = geoShape.coordinates;
              console.log(`Found ${routeCoordinates.length} coordinate points in route`);
              console.log('First few coordinates:', routeCoordinates.slice(0, 3));
            } else {
              console.warn('DEBUG: No coordinates found in geoShape');
            }
          } else {
            console.warn('DEBUG: No fullRouteGeoShape found in raw flight');
          }
          
          // Get the waypoint names with labels
          const displayWaypoints = waypointsToProcess;
          console.log(`Display waypoints: ${displayWaypoints.join(', ')}`);
          
          // Match waypoints with coordinates and place them directly
          if (routeCoordinates.length > 0 && displayWaypoints.length === routeCoordinates.length) {
            console.log('Coordinate count matches waypoint count - proceeding with direct placement');
            
            // Wait for stops to be processed first
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Clear any existing waypoints first
            if (appManagers.waypointManagerRef?.current) {
              console.log('Clearing existing waypoints before loading flight waypoints');
              if (typeof appManagers.waypointManagerRef.current.clearWaypoints === 'function') {
                appManagers.waypointManagerRef.current.clearWaypoints();
              } else {
                console.log('clearWaypoints method not available, skipping waypoint clearing');
              }
            }
            
            // Add each waypoint using direct coordinates
            for (let i = 0; i < displayWaypoints.length; i++) {
              const waypointLabel = displayWaypoints[i];
              const coordinates = routeCoordinates[i]; // [lng, lat]
              
              // Parse the waypoint name and determine type
              const isStop = waypointLabel.includes('(Dep)') || 
                           waypointLabel.includes('(Stop') || 
                           waypointLabel.includes('(Des)');
              
              // Clean name (remove labels)
              const cleanName = waypointLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
              
              console.log(`Adding ${isStop ? 'STOP' : 'WAYPOINT'}: ${cleanName} at [${coordinates[0]}, ${coordinates[1]}]`);
              
              try {
                // Add the waypoint using direct coordinates
                if (appManagers.waypointManagerRef?.current) {
                  await appManagers.waypointManagerRef.current.addWaypoint(
                    coordinates, // [lng, lat]
                    cleanName,
                    {
                      isWaypoint: !isStop,
                      type: isStop ? 'LANDING_STOP' : 'WAYPOINT'
                    }
                  );
                  console.log(`Successfully placed ${isStop ? 'stop' : 'waypoint'}: ${cleanName}`);
                }
                
                // Small delay between placements to avoid conflicts
                await new Promise(resolve => setTimeout(resolve, 50));
                
              } catch (error) {
                console.error(`Error placing waypoint ${cleanName}:`, error);
                // Continue with other waypoints even if one fails
              }
            }
            
            console.log('All flight waypoints and stops loaded successfully');
            
            // Update loading indicator
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Loaded ${displayWaypoints.length} waypoints from flight`, 
                'success',
                2000
              );
            }
            
          } else {
            console.warn(`Coordinate/waypoint count mismatch: ${routeCoordinates.length} coordinates vs ${displayWaypoints.length} waypoints`);
            // Fallback to the original method if counts don't match
            console.log('Falling back to name-based waypoint loading...');
            
            for (const waypointLabel of displayWaypoints) {
              const isStop = waypointLabel.includes('(Dep)') || 
                           waypointLabel.includes('(Stop') || 
                           waypointLabel.includes('(Des)');
              
              if (!isStop) { // Only add navigation waypoints, stops already handled
                const cleanName = waypointLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
                
                try {
                  if (appManagers.waypointManagerRef?.current?.addWaypointByName) {
                    await appManagers.waypointManagerRef.current.addWaypointByName(cleanName, {
                      isWaypoint: true,
                      type: 'WAYPOINT'
                    });
                  }
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.error(`Error adding waypoint ${cleanName}:`, error);
                }
              }
            }
          }
          
        } catch (error) {
          console.error('Error loading flight waypoints:', error);
        }
      } else {
        console.log('DEBUG: No displayWaypoints found, checking combinedWaypoints...');
        
        // Fallback: try using combinedWaypoints if displayWaypoints is not available
        if (flightData.combinedWaypoints && flightData.combinedWaypoints.length > 0) {
          console.log('DEBUG: Using combinedWaypoints as fallback');
          console.log('Combined waypoints:', flightData.combinedWaypoints);
          
          try {
            // Process combinedWaypoints - these don't have labels so we need to determine type differently
            const stops = flightData.stops || [];
            
            for (const waypointName of flightData.combinedWaypoints) {
              const isStop = stops.includes(waypointName);
              
              if (!isStop) { // Only add navigation waypoints, stops are already handled
                console.log(`Adding navigation waypoint from combinedWaypoints: ${waypointName}`);
                
                try {
                  if (appManagers.waypointManagerRef?.current?.addWaypointByName) {
                    await appManagers.waypointManagerRef.current.addWaypointByName(waypointName, {
                      isWaypoint: true,
                      type: 'WAYPOINT'
                    });
                    console.log(`Successfully added waypoint: ${waypointName}`);
                  }
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.error(`Error adding waypoint ${waypointName}:`, error);
                }
              }
            }
          } catch (error) {
            console.error('Error processing combinedWaypoints:', error);
          }
        } else {
          console.log('DEBUG: No waypoints to load (neither displayWaypoints nor combinedWaypoints available)');
        }
      }
      
      // Set aircraft if available
      console.log('🛩️ Checking aircraft restoration conditions:');
      console.log('🛩️ flightData.aircraftId:', flightData.aircraftId);
      console.log('🛩️ appManagers.aircraftManagerRef?.current exists:', !!appManagers.aircraftManagerRef?.current);
      
      if (flightData.aircraftId && appManagers.aircraftManagerRef?.current) {
        console.log(`Restoring aircraft: ${flightData.aircraftId}`);
        try {
          // Get available aircraft using the correct method
          const availableAircraft = appManagers.aircraftManagerRef.current.filterAircraft(flightData.region);
          console.log(`Searching in ${availableAircraft.length} available aircraft for region: ${flightData.region}`);
          console.log('🔍 Sample aircraft structure:', availableAircraft[0]);
          console.log('🔍 Looking for aircraftId:', flightData.aircraftId);
          
          const matchingAircraft = availableAircraft.find(aircraft => {
            return aircraft.aircraftId === flightData.aircraftId || 
                   aircraft.id === flightData.aircraftId ||
                   aircraft.rawRegistration === flightData.aircraftId ||  // Use rawRegistration!
                   aircraft.registration === flightData.aircraftId ||
                   aircraft.name === flightData.aircraftId;
          });
          
          if (matchingAircraft) {
            console.log(`✅ Aircraft restored: ${matchingAircraft.name || matchingAircraft.registration || matchingAircraft.aircraftId}`);
            setSelectedAircraft(matchingAircraft);
            
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator(
                `Aircraft restored: ${matchingAircraft.name || matchingAircraft.registration}`, 
                'success',
                2000
              );
            }
          } else {
            console.warn(`❌ Aircraft ${flightData.aircraftId} not found. Available aircraft:`, 
              availableAircraft.map(a => a.aircraftId || a.id || a.registration).join(', '));
          }
        } catch (error) {
          console.error('Error restoring aircraft:', error);
        }
      } else {
        console.log('🛩️ Aircraft restoration skipped - missing aircraftId or aircraftManager');
      }
      
      // Update status
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Flight loaded: ${flightData.flightNumber || 'Unknown'} with ${flightData.stops.length} stops`, 
          'success',
          3000
        );
      }
      
    } catch (error) {
      console.error('Error loading flight:', error);
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to load flight: ${error.message}`, 
          'error'
        );
      }
    }
  };
  
  const loadCustomChart = () => console.log("loadCustomChart - Not implemented");

  // RegionAircraftConnector removed - using only event-based region sync

  return (
    <>
      {/* RegionAircraftConnector removed - using only event-based region sync */}
      <div className="fast-planner-container">
        
        <ModeHandler 
          mapManagerRef={mapManagerRef}
          waypointManagerRef={waypointManagerRef}
          platformManagerRef={platformManagerRef}
          initialMode="normal"
        />
        <div id="loading-overlay" className="loading-overlay" style={{ display: 'none' }}>
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading...</div>
        </div>
        {/* New iPad-friendly header */}
        <AppHeader
          selectedAircraft={selectedAircraft}
          stopCards={stopCards}
          taxiFuel={flightSettings.taxiFuel}
          reserveFuel={flightSettings.reserveFuel}
          contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          deckTimePerStop={flightSettings.deckTimePerStop}
          isLoading={aircraftLoading || rigsLoading}
          loadingText={aircraftLoading ? "Loading aircraft..." : rigsLoading ? "Loading platforms..." : ""}
        />
        
        {/* Map container - now full width below header */}
        <div className="map-container">
          {/* Controlled loading bar - graceful finish */}
          <div className={`map-loading-container ${isActuallyLoading ? (isFinishing ? 'finishing' : 'loading') : ''}`}>
            <div className="map-loading-bar"></div>
          </div>
          <MapComponent mapManagerRef={mapManagerRef} onMapReady={handleMapReadyImpl} className="fast-planner-map" />
          <MapZoomHandler mapManagerRef={mapManagerRef} />
        </div>
        <LeftPanel
          visible={leftPanelVisible} onToggleVisibility={toggleLeftPanel} waypoints={waypoints}
          onRemoveWaypoint={removeWaypoint} onWaypointNameChange={updateWaypointName}
          onAddWaypoint={hookAddWaypoint} onReorderWaypoints={reorderWaypoints} routeInput={routeInput}
          onRouteInputChange={handleRouteInputChange} favoriteLocations={favoriteLocations}
          onAddFavoriteLocation={handleAddFavoriteLocation} onRemoveFavoriteLocation={handleRemoveFavoriteLocation}
          onClearRoute={clearRoute} onToggleChart={togglePlatformsVisibility} chartsVisible={platformsVisible}
          onToggleWaypointMode={toggleWaypointMode} waypointModeActive={waypointModeActive}
        />
        <RightPanel
          visible={rightPanelVisible} onToggleVisibility={toggleRightPanel} onClearRoute={clearRoute}
          onLoadRigData={reloadPlatformData} onToggleChart={togglePlatformsVisibility}
          onLoadCustomChart={loadCustomChart} chartsVisible={platformsVisible} aircraftType={aircraftType}
          onAircraftTypeChange={changeAircraftType} aircraftRegistration={aircraftRegistration}
          onAircraftRegistrationChange={changeAircraftRegistration} selectedAircraft={selectedAircraft}
          aircraftsByType={aircraftsByType} aircraftLoading={aircraftLoading} routeStats={routeStats}
          stopCards={stopCards} waypoints={waypoints} onRemoveWaypoint={removeWaypoint} isAuthenticated={isAuthenticated}
          authUserName={userName} rigsLoading={rigsLoading} onLogin={login}
          onFlightLoad={handleFlightLoad} // Add flight loading handler
          deckTimePerStop={flightSettings.deckTimePerStop} deckFuelFlow={flightSettings.deckFuelFlow}
          passengerWeight={flightSettings.passengerWeight} cargoWeight={flightSettings.cargoWeight}
          taxiFuel={flightSettings.taxiFuel} contingencyFuelPercent={flightSettings.contingencyFuelPercent}
          reserveFuel={flightSettings.reserveFuel} reserveMethod={reserveMethod}
          onDeckTimeChange={(value) => updateFlightSetting('deckTimePerStop', value)}
          onDeckFuelFlowChange={(value) => updateFlightSetting('deckFuelFlow', value)}
          onPassengerWeightChange={(value) => updateFlightSetting('passengerWeight', value)}
          onCargoWeightChange={(value) => updateFlightSetting('cargoWeight', value)}
          onTaxiFuelChange={(value) => updateFlightSetting('taxiFuel', value)}
          onContingencyFuelPercentChange={(value) => updateFlightSetting('contingencyFuelPercent', value)}
          onReserveMethodChange={(value) => updateFlightSetting('reserveMethod', value)}
          onReserveFuelChange={(value) => updateFlightSetting('reserveFuel', value)}
          forceUpdate={forceUpdate} weather={weather} onWeatherUpdate={updateWeatherSettings}
          mapManagerRef={mapManagerRef}
          gulfCoastMapRef={gulfCoastMapRef}
          weatherLayerRef={weatherLayerRef}
          vfrChartsRef={vfrChartsRef}
          platformManagerRef={platformManagerRef}
          airfieldsVisible={airfieldsVisible}
          fixedPlatformsVisible={fixedPlatformsVisible} // Legacy
          movablePlatformsVisible={movablePlatformsVisible}
          blocksVisible={blocksVisible} // New prop
          basesVisible={basesVisible} // New prop for bases
          fuelAvailableVisible={fuelAvailableVisible} // New prop
          toggleAirfieldsVisibility={toggleAirfieldsVisibility}
          toggleFixedPlatformsVisibility={toggleFixedPlatformsVisibility} // Legacy
          toggleMovablePlatformsVisibility={toggleMovablePlatformsVisibility}
          toggleBlocksVisibility={toggleBlocksVisibility} // New prop
          toggleBasesVisibility={toggleBasesVisibility} // New prop for bases
          toggleFuelAvailableVisibility={toggleFuelAvailableVisibility} // New prop
        />
      </div>
    </>
  );
};

/**
 * Main FastPlannerApp component that sets up RegionProvider and top-level states/managers
 */
const FastPlannerApp = () => {
  // Hoist states needed by useManagers or passed to FastPlannerCore
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220, contingencyFuelPercent: 5, taxiFuel: 50,
    reserveFuel: 600, deckTimePerStop: 5, deckFuelFlow: 400, cargoWeight: 0,
  });
  const [weather, setWeather] = useState({ windSpeed: 15, windDirection: 270 });
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [stopCards, setStopCards] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [routeInput, setRouteInput] = useState('');
  const [reserveMethod, setReserveMethod] = useState('fixed');

  // Define addWaypointDirect and its implementation here, so they can be passed to useManagers
  // and then the implementation to FastPlannerCore
  const addWaypointDirectRef = useRef(async (waypointData) => {
    // Initial placeholder, implementation will be set by addWaypointDirectImpl
    // Ensure appManagers is defined before trying to access its properties
    if (appManagers && appManagers.waypointManagerRef && appManagers.waypointManagerRef.current) {
        console.warn('addWaypointDirect placeholder called');
    } else {
        console.error('Cannot add waypoint: appManagers or waypointManagerRef not available in placeholder');
        return;
    }
  });

  // appManagers must be defined before addWaypointDirectImpl can use it.
  // So, we declare appManagers first.
  const appManagers = useManagers({
    client,
    setFavoriteLocations,
    setWaypoints,
    flightSettings,
    setFlightSettings,
    forceUpdate,
    setForceUpdate,
    addWaypoint: addWaypointDirectRef.current, 
    weather,
    setWeather
  });

  const addWaypointDirectImpl = async (waypointData) => {
    const { waypointManagerRef, platformManagerRef } = appManagers; 
    console.log('🔧 Using direct addWaypoint implementation (FastPlannerApp)');
    if (!waypointManagerRef.current) {
      console.error('Cannot add waypoint: No waypoint manager ref');
      return;
    }
    if (!platformManagerRef.current && typeof waypointData === 'string') {
        console.warn('Platform manager ref not available for name lookup, proceeding if coordinates are provided.');
    }
    let coords, name, isWaypoint = false;
    console.log('🌐 Direct: Adding waypoint with data:', waypointData);
    if (Array.isArray(waypointData)) {
      coords = waypointData; name = null;
    } else if (typeof waypointData === 'string') {
      if (platformManagerRef.current) {
        const platform = platformManagerRef.current.findPlatformByName(waypointData);
        if (platform) { coords = platform.coordinates; name = platform.name; } 
        else { if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Platform "${waypointData}" not found.`, 'error'); return; }
      } else { if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Platform lookup unavailable.`, 'error'); return; }
    } else if (waypointData && typeof waypointData === 'object') {
      if (waypointData.isWaypoint === true) isWaypoint = true;
      if (platformManagerRef.current && waypointData.lngLat) {
        const { lat, lng } = waypointData.lngLat;
        if (window.isWaypointModeActive === true && !waypointData.nearestWaypoint && typeof platformManagerRef.current.findNearestOsdkWaypoint === 'function') {
          const nearestWp = platformManagerRef.current.findNearestOsdkWaypoint(lat, lng, 5);
          if (nearestWp) waypointData.nearestWaypoint = nearestWp;
        }
        if (!waypointData.nearestRig && typeof platformManagerRef.current.findNearestPlatform === 'function') {
          const nearestRig = platformManagerRef.current.findNearestPlatform(lat, lng, 5);
          if (nearestRig && nearestRig.distance <= 5) waypointData.nearestRig = nearestRig;
        }
      }
      if (window.isWaypointModeActive === true && waypointData.nearestWaypoint && waypointData.nearestWaypoint.distance <= 5) {
        coords = waypointData.nearestWaypoint.coordinates; name = waypointData.nearestWaypoint.name;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to waypoint: ${name}`, 'success', 2000);
      } else if (waypointData.coordinates) coords = waypointData.coordinates;
      else if (waypointData.coords) coords = waypointData.coords;
      else if (waypointData.lngLat) coords = [waypointData.lngLat.lng, waypointData.lngLat.lat];
      if (!window.isWaypointModeActive && waypointData.nearestRig && waypointData.nearestRig.distance <= 5) {
        if (waypointData.nearestRig.coordinates) coords = waypointData.nearestRig.coordinates;
        else if (waypointData.nearestRig.coords) coords = waypointData.nearestRig.coords;
        else if (waypointData.nearestRig.lng !== undefined && waypointData.nearestRig.lat !== undefined) coords = [waypointData.nearestRig.lng, waypointData.nearestRig.lat];
        name = waypointData.nearestRig.name;
        if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Snapped to ${name}`, 'success', 2000);
      } else if (!coords) { console.error('Invalid waypoint data format - no coordinates:', waypointData); return; }
      if (!name) {
        if (waypointData.name) name = waypointData.name;
        else if (waypointData.platformName) name = waypointData.platformName;
        else if (waypointData.displayName) name = waypointData.displayName;
      }
    } else { console.error('Invalid waypoint data:', waypointData); return; }
    if (!coords || !Array.isArray(coords) || coords.length !== 2) { if (window.LoadingIndicator) window.LoadingIndicator.updateStatusIndicator(`Invalid coordinates.`, 'error'); return; }
    if (window.isWaypointModeActive === true) isWaypoint = true;
    
    if (appManagers.waypointManagerRef && appManagers.waypointManagerRef.current) {
        appManagers.waypointManagerRef.current.addWaypoint(coords, name, { isWaypoint, type: isWaypoint ? 'WAYPOINT' : 'STOP' });
        const updatedWaypoints = appManagers.waypointManagerRef.current.getWaypoints();
        await new Promise(resolve => { setWaypoints([...updatedWaypoints]); setTimeout(resolve, 0); });
        console.log('🌐 Waypoints updated using direct implementation');
    } else {
        console.error('addWaypointDirectImpl: waypointManagerRef is not available on appManagers');
    }
  };
  
  // Effect to set the implementation on the ref after appManagers is initialized
  useEffect(() => {
    if (appManagers.waypointManagerRef && appManagers.platformManagerRef) {
        addWaypointDirectRef.current.implementation = addWaypointDirectImpl;
        // Ensure the addWaypointDirectImpl function is available globally for the input handlers
        window.addWaypointClean = addWaypointDirectImpl;
        console.log('🔧 Setting up global addWaypointClean function for input handlers');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appManagers.waypointManagerRef, appManagers.platformManagerRef]); 

  // Add mapReady handler to load aircraft data when map is ready
  const handleMapReadyImpl = useCallback((mapInstance) => {
    console.log("🗺️ Map is ready", mapInstance);

    // Wrap in try/catch for safety
    try {
      // Once the map is ready, load aircraft
      if (appManagers.aircraftManagerRef && appManagers.aircraftManagerRef.current && client) {
        console.log("Loading aircraft after map initialization");
        
        appManagers.aircraftManagerRef.current.loadAircraftFromOSDK(client)
          .then(() => {
            console.log("Aircraft loaded successfully");
            // Force update to refresh the UI with aircraft data
            setForceUpdate(prev => prev + 1);
          })
          .catch(error => {
            console.error(`Error loading aircraft: ${error}`);
          });
      }

      // Initialize map interactions if available
      if (appManagers.mapInteractionHandlerRef && appManagers.mapInteractionHandlerRef.current) {
        console.log("🗺️ Initializing map interaction handler...");
        appManagers.mapInteractionHandlerRef.current.initialize();
      }
    } catch (error) {
      console.error("Error in handleMapReady:", error);
    }
  }, [appManagers, client, setForceUpdate]);

  // Connect the handleMapReadyImpl to appManagers
  useEffect(() => {
    if (appManagers) {
      appManagers.handleMapReady = handleMapReadyImpl;
    }
  }, [appManagers, handleMapReadyImpl]);

  return (
    <RegionProvider
      mapManagerRef={appManagers.mapManagerRef}
      platformManagerRef={appManagers.platformManagerRef}
      waypointManagerRef={appManagers.waypointManagerRef}
      client={client} 
      aircraftManagerRef={appManagers.aircraftManagerRef}
      favoriteLocationsManagerRef={appManagers.favoriteLocationsManagerRef}
      setFavoriteLocations={setFavoriteLocations} 
      appSettingsManagerRef={appManagers.appSettingsManagerRef}
      mapInteractionHandlerRef={appManagers.mapInteractionHandlerRef}
    >
      <FastPlannerCore 
        appManagers={appManagers} 
        flightSettings={flightSettings} setFlightSettings={setFlightSettings}
        weather={weather} setWeather={setWeather}
        waypoints={waypoints} setWaypoints={setWaypoints}
        stopCards={stopCards} setStopCards={setStopCards}
        routeStats={routeStats} setRouteStats={setRouteStats}
        forceUpdate={forceUpdate} setForceUpdate={setForceUpdate}
        routeInput={routeInput} setRouteInput={setRouteInput}
        favoriteLocations={favoriteLocations} setFavoriteLocations={setFavoriteLocations}
        reserveMethod={reserveMethod} setReserveMethod={setReserveMethod}
        addWaypointDirectImplementation={addWaypointDirectImpl}
        handleMapReadyImpl={handleMapReadyImpl}
      />
    </RegionProvider>
  );
};

export default FastPlannerApp;
