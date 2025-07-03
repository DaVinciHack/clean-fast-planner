import React, { useState, useEffect } from 'react';
import { useRegion } from '../../../context/region';
import './MapLayersCard.css';

/**
 * MapLayersCard
 * 
 * Card component for the Map Layers panel that allows toggling various map overlays
 */
const MapLayersCard = ({ 
  id,
  mapManagerRef,
  gulfCoastMapRef,
  weatherLayerRef,
  vfrChartsRef,
  observedWeatherStationsRef, // NEW: Ref for observed weather stations layer
  // Props for platform toggles (enhanced categories)
  platformManagerRef,
  platformsVisible,
  airfieldsVisible,
  fixedPlatformsVisible, // Legacy prop (can be removed later)
  movablePlatformsVisible,
  blocksVisible, // New prop for blocks
  basesVisible, // New prop for bases
  fuelAvailableVisible, // New prop for fuel available
  togglePlatformsVisibility,
  toggleAirfieldsVisibility,
  toggleFixedPlatformsVisibility, // Legacy function (can be removed later)
  toggleMovablePlatformsVisibility,
  toggleBlocksVisibility, // New function for blocks
  toggleBasesVisibility, // New function for bases
  toggleFuelAvailableVisibility, // New function for fuel available
  // Weather segments props
  weatherSegmentsHook, // Pass the entire weather segments hook
  // Flight data props for AutoFlight
  waypoints, // Current flight waypoints
  routeStats, // Route statistics
  // LIVE weather toggle from glass menu
  onLiveWeatherToggled // Callback to notify parent when LIVE weather state changes
}) => {
  const { currentRegion } = useRegion();
  
  // State for auto flight controls
  const [flightControls, setFlightControls] = useState({
    isPlaying: false,
    speed: 5,
    progress: 0,
    phase: 'PREFLIGHT',
    currentWaypoint: '',
    estimatedTime: 0
  });
  
  const [layers, setLayers] = useState({
    gulfCoastHeli: false,
    weather: false,
    weatherCircles: false, // Default OFF - user can toggle on when needed
    observedWeatherStations: false, // NEW: Real NOAA weather stations
    vfrCharts: false,
    grid: true,
    platforms: true, // Fixed platforms (enhanced category)
    airfields: true, 
    fixedPlatforms: true, // Legacy (can be removed later)
    movablePlatforms: true,
    blocks: true, // New category for blocks
    bases: true, // New category for bases
    fuelAvailable: false, // New category for fuel available (default off)
    // Weather Satellite Layers - User controlled, no auto-enable
    lightning: false, // User can enable when needed
    satelliteConus: false, // User can enable when needed
    satelliteLongwave: false, // User can enable when needed
    satelliteShortwave: false, // User can enable when needed
    // 3D Flight Simulation (consolidated)
    autoFlight: false // Automatic route following with integrated controls
  });

  // State for Gulf Coast map opacity
  const [gulfCoastOpacity, setGulfCoastOpacity] = useState(0.85);
  
  // State for weather layer opacities
  const [weatherOpacities, setWeatherOpacities] = useState({
    lightning: 0.6, // Reduced from 0.8 to 0.6
    satelliteConus: 0.6, // Keep at 0.6 (already correct)
    satelliteLongwave: 0.8,
    satelliteShortwave: 0.4 // Reduced from 0.8 to 0.4 for auto-enable
  });
  
  // Update layer states when references or visibility props change
  useEffect(() => {
    console.log('🔄 SYNC: Updating layer states from props:', {
      platforms: platformsVisible,
      airfields: airfieldsVisible,
      movablePlatforms: movablePlatformsVisible,
      blocks: blocksVisible,
      bases: basesVisible,
      fuelAvailable: fuelAvailableVisible
    });
    
    setLayers(prev => ({
      ...prev,
      platforms: platformsVisible,
      airfields: airfieldsVisible,
      fixedPlatforms: fixedPlatformsVisible, // Legacy
      movablePlatforms: movablePlatformsVisible,
      blocks: blocksVisible,
      bases: basesVisible,
      fuelAvailable: fuelAvailableVisible
    }));
  }, [platformsVisible, airfieldsVisible, fixedPlatformsVisible, movablePlatformsVisible, blocksVisible, basesVisible, fuelAvailableVisible]);

  // Periodic sync to ensure toggles match actual layer state
  useEffect(() => {
    const syncLayerStates = () => {
      // Check if map manager is available
      if (!mapManagerRef?.current?.map) return;
      
      const map = mapManagerRef.current.map;
      
      // Sync grid state with actual map layers
      const gridLayers = ['latitude-lines', 'longitude-lines', 'grid-labels'];
      const gridVisible = gridLayers.some(layerId => {
        const layer = map.getLayer(layerId);
        return layer && map.getLayoutProperty(layerId, 'visibility') !== 'none';
      });
      
      // Only update if there's a mismatch
      if (gridVisible !== layers.grid) {
        console.log('🔄 SYNC: Grid state mismatch detected, correcting:', { current: layers.grid, actual: gridVisible });
        setLayers(prev => ({ ...prev, grid: gridVisible }));
      }
      
      // Sync Gulf Coast map state
      if (gulfCoastMapRef?.current) {
        const gulfCoastVisible = gulfCoastMapRef.current.isDisplayed;
        if (gulfCoastVisible !== layers.gulfCoastHeli) {
          console.log('🔄 SYNC: Gulf Coast state mismatch detected, correcting:', { current: layers.gulfCoastHeli, actual: gulfCoastVisible });
          setLayers(prev => ({ ...prev, gulfCoastHeli: gulfCoastVisible }));
        }
      }
      
      // Weather circles state is user-controlled
    };
    
    // Sync immediately
    syncLayerStates();
    
    // Set up interval to sync every 3 seconds
    const interval = setInterval(syncLayerStates, 3000);
    
    return () => clearInterval(interval);
  }, [layers.grid, layers.gulfCoastHeli, layers.weatherCircles, mapManagerRef, gulfCoastMapRef]);

  // All weather features are user-controlled via toggle buttons
  
  // Update layer states for map layers when references change
  useEffect(() => {
    if (gulfCoastMapRef?.current) {
      setLayers(prev => ({
        ...prev,
        gulfCoastHeli: gulfCoastMapRef.current.isDisplayed
      }));
      console.log("MapLayersCard: gulfCoastMapRef is available, current display state:", 
                  gulfCoastMapRef.current.isDisplayed);
    } else {
      console.log("MapLayersCard: gulfCoastMapRef is not yet available");
    }
    
    // Update other layer states when their refs become available
  }, [gulfCoastMapRef, weatherLayerRef, vfrChartsRef]);
  
  // Handle Gulf Coast map opacity change
  const handleGulfCoastOpacityChange = (event) => {
    const newOpacity = parseFloat(event.target.value);
    setGulfCoastOpacity(newOpacity);
    
    // Apply opacity to the Gulf Coast map layer
    if (gulfCoastMapRef?.current && layers.gulfCoastHeli) {
      gulfCoastMapRef.current.setOpacity(newOpacity);
    }
  };

  // Toggle a layer
  const toggleLayer = async (layerName) => {
    console.log(`MapLayersCard: Attempting to toggle layer: ${layerName}`);
    
    try {
      switch (layerName) {
        case 'gulfCoastHeli':
          if (gulfCoastMapRef?.current) {
            console.log('MapLayersCard: Using gulfCoastMapRef.current.toggle()');
            try {
              const isVisible = await gulfCoastMapRef.current.toggle();
              console.log(`MapLayersCard: Gulf Coast toggle result: ${isVisible}`);
              setLayers(prev => ({ ...prev, gulfCoastHeli: isVisible }));
              
              // Apply current opacity when layer is displayed
              if (isVisible) {
                gulfCoastMapRef.current.setOpacity(gulfCoastOpacity);
              }
            } catch (error) {
              console.error('MapLayersCard: Error toggling Gulf Coast Helicopter Map:', error);
              // Try a more direct approach if the toggle method fails
              if (!layers.gulfCoastHeli) {
                // If it's currently off, try to turn it on
                try {
                  await gulfCoastMapRef.current.loadAndDisplay();
                  console.log('MapLayersCard: Directly loaded Gulf Coast Helicopter Map');
                  setLayers(prev => ({ ...prev, gulfCoastHeli: true }));
                  // Apply current opacity
                  gulfCoastMapRef.current.setOpacity(gulfCoastOpacity);
                } catch (innerError) {
                  console.error('MapLayersCard: Failed direct load of Gulf Coast Helicopter Map:', innerError);
                }
              } else {
                // If it's currently on, try to turn it off
                try {
                  gulfCoastMapRef.current.remove();
                  console.log('MapLayersCard: Directly removed Gulf Coast Helicopter Map');
                  setLayers(prev => ({ ...prev, gulfCoastHeli: false }));
                } catch (innerError) {
                  console.error('MapLayersCard: Failed direct removal of Gulf Coast Helicopter Map:', innerError);
                }
              }
            }
          } else {
            console.error('MapLayersCard: gulfCoastMapRef is not available');
            
            // Try to force initialization if the mapManagerRef is available
            if (mapManagerRef?.current && typeof mapManagerRef.current.isMapLoaded === 'function' && mapManagerRef.current.isMapLoaded()) {
              console.log('MapLayersCard: Attempting to force initialize Gulf Coast Helicopter Map');
              
              // Dynamically import and initialize
              import('../../../modules/layers/GulfCoastHeliMap').then(module => {
                const GulfCoastHeliMap = module.default;
                const layer = new GulfCoastHeliMap(mapManagerRef.current);
                layer.initialize().then(() => {
                  console.log('MapLayersCard: Forced initialization successful');
                  if (typeof gulfCoastMapRef === 'object') {
                    gulfCoastMapRef.current = layer;
                    layer.toggle().then(visible => {
                      setLayers(prev => ({ ...prev, gulfCoastHeli: visible }));
                      // Apply current opacity
                      if (visible) {
                        layer.setOpacity(gulfCoastOpacity);
                      }
                    });
                  }
                });
              }).catch(error => {
                console.error('MapLayersCard: Failed to force initialize:', error);
              });
            } else {
              console.log('MapLayersCard: Cannot force initialize - map not loaded or manager not available');
            }
          }
          break;
          
        case 'weather':
          console.log('🌤️ WEATHER OVERLAY: Toggling weather overlay...');
          
          try {
            // Don't rely on weatherLayerRef - handle weather toggle directly
            if (!window.weatherTest?.weatherManager) {
              console.log('🌤️ Initializing weather system...');
              const { initializeWeatherSystem } = await import('../../../modules/WeatherLoader.js');
              await initializeWeatherSystem();
            }

            if (!window.weatherTest?.weatherManager) {
              console.error('❌ Weather system could not be initialized');
              break;
            }

            // Ensure weather manager has map reference
            if (!window.weatherTest.weatherManager.mapManager) {
              console.log('🌤️ Setting map manager reference for weather system');
              window.weatherTest.weatherManager.mapManager = mapManagerRef.current;
            }

            const currentVisible = window.weatherTest.weatherManager.isWeatherVisible;
            const newVisible = !currentVisible;
            
            console.log(`🌤️ Toggling weather overlay: ${currentVisible} → ${newVisible}`);
            window.weatherTest.weatherManager.setWeatherVisible(newVisible);
            
            setLayers(prev => ({ ...prev, weather: newVisible }));
            
            console.log(`✅ Weather overlay ${newVisible ? 'ENABLED' : 'DISABLED'}`);
          } catch (error) {
            console.error('❌ Error toggling weather overlay:', error);
          }
          break;
          
        case 'weatherCircles':
          console.log('🌤️ WEATHER CIRCLES: Toggling weather visualization...');
          
          if (window.currentWeatherCirclesLayer) {
            // Remove existing weather circles
            try {
              window.currentWeatherCirclesLayer.removeWeatherCircles();
              window.currentWeatherCirclesLayer = null;
              console.log('🧹 Removed weather circles');
              setLayers(prev => ({ ...prev, weatherCircles: false }));
            } catch (error) {
              console.warn('Error removing weather circles:', error);
            }
          } else {
            // Create weather circles using PlatformManager (single responsibility)
            console.log('🌤️ TOGGLE: Requesting weather circles from PlatformManager');
            
            // Get platform manager and use its loadWeatherFeatures method
            if (window.platformManager && typeof window.platformManager.loadWeatherFeatures === 'function') {
              window.platformManager.loadWeatherFeatures();
              console.log('✅ Weather circles requested from PlatformManager');
              // Explicitly set state - no auto-sync to prevent re-enabling issues
              setLayers(prev => ({ ...prev, weatherCircles: true }));
            } else if (weatherSegmentsHook?.segments && weatherSegmentsHook.segments.length > 0) {
              // Fallback: direct creation only if PlatformManager not available
              try {
                const { default: WeatherCirclesLayer } = await import('../../../modules/layers/WeatherCirclesLayer');
                const weatherLayer = new WeatherCirclesLayer(mapManagerRef?.current?.map);
                
                await weatherLayer.addWeatherCircles(weatherSegmentsHook.segments);
                window.currentWeatherCirclesLayer = weatherLayer;
                console.log('✅ Created weather circles (fallback method)');
                
                // Wind arrows are managed separately by user
                
                setLayers(prev => ({ ...prev, weatherCircles: true }));
              } catch (error) {
                console.error('Error creating weather circles:', error);
              }
            } else {
              console.warn('No weather segments available for circles and PlatformManager not available');
            }
          }
          break;
          
        // NEW: Observed Weather Stations toggle
        case 'observedWeatherStations':
          console.log('🌡️ OBSERVED WEATHER STATIONS: Toggling real NOAA observation stations...');
          console.log('🌡️ DEBUG: observedWeatherStationsRef exists:', !!observedWeatherStationsRef);
          console.log('🌡️ DEBUG: observedWeatherStationsRef.current:', !!observedWeatherStationsRef?.current);
          
          try {
            if (observedWeatherStationsRef?.current) {
              const currentVisible = observedWeatherStationsRef.current.isVisible;
              const newVisible = !currentVisible;
              observedWeatherStationsRef.current.setVisible(newVisible);
              setLayers(prev => ({ ...prev, observedWeatherStations: newVisible }));
              console.log(`✅ Observed Weather Stations ${newVisible ? 'ENABLED' : 'DISABLED'}`);
            } else {
              console.warn('⚠️ Observed Weather Stations layer not available - attempting to initialize...');
              
              // Try to initialize the layer if it doesn't exist
              if (mapManagerRef?.current?.map) {
                console.log('🌡️ Attempting to create Observed Weather Stations layer...');
                try {
                  const ObservedWeatherStationsLayer = (await import('../../../modules/layers/ObservedWeatherStationsLayer')).default;
                  const stationsLayer = new ObservedWeatherStationsLayer(mapManagerRef.current.map);
                  
                  await stationsLayer.initialize();
                  observedWeatherStationsRef.current = stationsLayer;
                  stationsLayer.setVisible(true);
                  setLayers(prev => ({ ...prev, observedWeatherStations: true }));
                  console.log('✅ Observed Weather Stations layer created and enabled!');
                } catch (initError) {
                  console.error('❌ Failed to initialize Observed Weather Stations layer:', initError);
                }
              } else {
                console.error('❌ Map not available for Observed Weather Stations layer');
              }
            }
          } catch (error) {
            console.error('❌ Error toggling observed weather stations:', error);
          }
          break;
          
        // Weather graphics handled by weather circles toggle
          
        case 'vfrCharts':
          if (vfrChartsRef?.current) {
            const isVisible = await vfrChartsRef.current.toggle();
            setLayers(prev => ({ ...prev, vfrCharts: isVisible }));
          }
          break;
          
        case 'grid':
          if (mapManagerRef?.current) {
            // Toggle grid visibility
            const map = mapManagerRef.current.getMap();
            if (map) {
              const gridVisible = !layers.grid;
              
              // Toggle visibility of grid layers
              ['latitude-lines', 'longitude-lines', 'grid-labels'].forEach(layerId => {
                if (map.getLayer(layerId)) {
                  map.setLayoutProperty(
                    layerId,
                    'visibility',
                    gridVisible ? 'visible' : 'none'
                  );
                }
              });
              
              setLayers(prev => ({ ...prev, grid: gridVisible }));
              
              // Emit event to notify other components
              setTimeout(() => {
                const event = new CustomEvent('layer-visibility-changed', {
                  detail: { layerType: 'grid', visible: gridVisible }
                });
                window.dispatchEvent(event);
              }, 100);
            }
          }
          break;
          
        // Handle all platform-related toggles using the new functions
        case 'platforms':
          togglePlatformsVisibility();
          // Emit event to notify other components
          setTimeout(() => {
            const event = new CustomEvent('layer-visibility-changed', {
              detail: { layerType: 'platforms', visible: !layers.platforms }
            });
            window.dispatchEvent(event);
          }, 100);
          break;
          
        case 'airfields':
          toggleAirfieldsVisibility();
          setTimeout(() => {
            const event = new CustomEvent('layer-visibility-changed', {
              detail: { layerType: 'airfields', visible: !layers.airfields }
            });
            window.dispatchEvent(event);
          }, 100);
          break;
          
        case 'fixedPlatforms':
          toggleFixedPlatformsVisibility();
          break;
          
        case 'movablePlatforms':
          toggleMovablePlatformsVisibility();
          setTimeout(() => {
            const event = new CustomEvent('layer-visibility-changed', {
              detail: { layerType: 'movablePlatforms', visible: !layers.movablePlatforms }
            });
            window.dispatchEvent(event);
          }, 100);
          break;
          
        case 'blocks':
          toggleBlocksVisibility();
          setTimeout(() => {
            const event = new CustomEvent('layer-visibility-changed', {
              detail: { layerType: 'blocks', visible: !layers.blocks }
            });
            window.dispatchEvent(event);
          }, 100);
          break;
          
        case 'bases':
          toggleBasesVisibility();
          setTimeout(() => {
            const event = new CustomEvent('layer-visibility-changed', {
              detail: { layerType: 'bases', visible: !layers.bases }
            });
            window.dispatchEvent(event);
          }, 100);
          break;
          
        case 'fuelAvailable':
          toggleFuelAvailableVisibility();
          setTimeout(() => {
            const event = new CustomEvent('layer-visibility-changed', {
              detail: { layerType: 'fuelAvailable', visible: !layers.fuelAvailable }
            });
            window.dispatchEvent(event);
          }, 100);
          break;
          
        // Weather Satellite Layer Cases
        case 'lightning':
          console.log('⚡ LIGHTNING: Toggling global lightning detection...');
          try {
            const mapInstance = mapManagerRef?.current?.map;
            if (!mapInstance) {
              console.error('❌ No map instance available for lightning toggle');
              break;
            }
            
            const currentVisible = layers.lightning;
            if (currentVisible) {
              // Remove lightning layer
              if (mapInstance.getSource('simple-lightning')) {
                mapInstance.removeLayer('simple-lightning-layer');
                mapInstance.removeSource('simple-lightning');
                console.log('🧹 Removed lightning layer');
              }
              setLayers(prev => ({ ...prev, lightning: false }));
            } else {
              // Add lightning layer
              const { addSimpleLightningOverlay } = await import('../../../modules/WeatherLoader.js');
              const success = await addSimpleLightningOverlay(mapInstance);
              if (success) {
                // Set the correct opacity after adding
                setTimeout(() => {
                  try {
                    mapInstance.setPaintProperty('simple-lightning-layer', 'raster-opacity', weatherOpacities.lightning);
                    console.log(`✅ Lightning layer added with ${weatherOpacities.lightning * 100}% opacity`);
                  } catch (error) {
                    console.warn('⚠️ Could not set lightning toggle opacity:', error);
                  }
                }, 500);
                setLayers(prev => ({ ...prev, lightning: true }));
              } else {
                console.error('❌ Failed to add lightning layer');
              }
            }
          } catch (error) {
            console.error('❌ Error toggling lightning layer:', error);
          }
          break;
          
        case 'satelliteConus':
          console.log('🛰️ CONUS: Toggling CONUS weather radar...');
          try {
            const mapInstance = mapManagerRef?.current?.map;
            if (!mapInstance) {
              console.error('❌ No map instance available for CONUS toggle');
              break;
            }
            
            const currentVisible = layers.satelliteConus;
            if (currentVisible) {
              // Remove CONUS layer
              const { removeNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
              await removeNOAAWeatherOverlay(mapInstance, 'CONUS');
              console.log('🧹 Removed CONUS layer');
              setLayers(prev => ({ ...prev, satelliteConus: false }));
            } else {
              // Add CONUS layer
              const { addNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
              const success = await addNOAAWeatherOverlay(mapInstance, 'CONUS');
              if (success) {
                console.log('✅ CONUS layer added');
                setLayers(prev => ({ ...prev, satelliteConus: true }));
              } else {
                console.error('❌ Failed to add CONUS layer');
              }
            }
          } catch (error) {
            console.error('❌ Error toggling CONUS layer:', error);
          }
          break;
          
        case 'satelliteLongwave':
          console.log('🛰️ LONGWAVE: Toggling longwave infrared...');
          try {
            const mapInstance = mapManagerRef?.current?.map;
            if (!mapInstance) {
              console.error('❌ No map instance available for longwave toggle');
              break;
            }
            
            const currentVisible = layers.satelliteLongwave;
            if (currentVisible) {
              // Remove longwave layer
              const { removeNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
              await removeNOAAWeatherOverlay(mapInstance, 'LONGWAVE');
              console.log('🧹 Removed longwave layer');
              setLayers(prev => ({ ...prev, satelliteLongwave: false }));
            } else {
              // Add longwave layer
              const { addNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
              const success = await addNOAAWeatherOverlay(mapInstance, 'LONGWAVE');
              if (success) {
                console.log('✅ Longwave layer added');
                setLayers(prev => ({ ...prev, satelliteLongwave: true }));
              } else {
                console.error('❌ Failed to add longwave layer');
              }
            }
          } catch (error) {
            console.error('❌ Error toggling longwave layer:', error);
          }
          break;
          
        case 'satelliteShortwave':
          console.log('🛰️ SHORTWAVE: Toggling shortwave infrared...');
          try {
            const mapInstance = mapManagerRef?.current?.map;
            if (!mapInstance) {
              console.error('❌ No map instance available for shortwave toggle');
              break;
            }
            
            const currentVisible = layers.satelliteShortwave;
            if (currentVisible) {
              // Remove shortwave layer
              const { removeNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
              await removeNOAAWeatherOverlay(mapInstance, 'SHORTWAVE');
              console.log('🧹 Removed shortwave layer');
              setLayers(prev => ({ ...prev, satelliteShortwave: false }));
            } else {
              // Add shortwave layer
              const { addNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
              const success = await addNOAAWeatherOverlay(mapInstance, 'SHORTWAVE');
              if (success) {
                // Set the correct opacity and z-index after adding
                setTimeout(() => {
                  try {
                    mapInstance.setPaintProperty('noaa-shortwave-layer', 'raster-opacity', weatherOpacities.satelliteShortwave);
                    console.log(`✅ Shortwave layer added with ${weatherOpacities.satelliteShortwave * 100}% opacity (NOAA default positioning)`);
                  } catch (error) {
                    console.warn('⚠️ Could not set shortwave toggle properties:', error);
                  }
                }, 500);
                setLayers(prev => ({ ...prev, satelliteShortwave: true }));
              } else {
                console.error('❌ Failed to add shortwave layer');
              }
            }
          } catch (error) {
            console.error('❌ Error toggling shortwave layer:', error);
          }
          break;
          
        // 3D features consolidated into Auto Flight section
          
        case 'autoFlight':
          console.log('🛩️ AUTO FLIGHT: Toggling automatic route following...');
          try {
            const mapInstance = mapManagerRef?.current?.map;
            if (!mapInstance) {
              console.error('❌ No map instance available for auto flight');
              break;
            }
            
            const currentVisible = layers.autoFlight;
            if (currentVisible) {
              // Disable auto flight
              if (window.autoFlightManager) {
                window.autoFlightManager.destroy();
                window.autoFlightManager = null;
                console.log('🧹 Auto flight disabled');
              }
              setLayers(prev => ({ ...prev, autoFlight: false }));
            } else {
              // Enable auto flight
              console.log('🛩️ === AUTO FLIGHT ROUTE DETECTION DEBUG ===');
              console.log('🛩️ waypoints prop exists?', !!waypoints);
              console.log('🛩️ waypoints length:', waypoints?.length || 'undefined');
              console.log('🛩️ waypoints content:', waypoints);
              console.log('🛩️ routeStats:', routeStats);
              console.log('🛩️ weatherSegmentsHook exists?', !!weatherSegmentsHook);
              console.log('🛩️ window.currentWaypoints exists?', !!window.currentWaypoints);
              console.log('🛩️ window.currentWaypoints:', window.currentWaypoints);
              console.log('🛩️ === END DEBUG ===');
              
              const { default: AutoFlightManager } = await import('../../../modules/weather/AutoFlightManager.js');
              
              // Create flight manager (no longer needs enhanced3DControls)
              const flightManager = new AutoFlightManager(mapInstance, null);
              
              // Try to get REAL flight route from your existing system
              let flightRoute = null;
              
              // DEBUG: Log all available data sources
              console.log('🛩️ DEBUG: AutoFlight route detection:');
              console.log('🛩️ waypoints prop:', waypoints);
              console.log('🛩️ routeStats prop:', routeStats);
              console.log('🛩️ weatherSegmentsHook:', weatherSegmentsHook);
              console.log('🛩️ mapManagerRef:', mapManagerRef?.current);
              
              // Method 1: Use the waypoints prop (ACTUAL PLANNED FLIGHT!)
              if (waypoints && waypoints.length >= 2) {
                console.log('🛩️ Method 1: Found waypoints prop with', waypoints.length, 'waypoints');
                console.log('🛩️ Sample waypoint:', waypoints[0]);
                
                flightRoute = waypoints.map((wp, index) => {
                  // Extract coordinates from multiple possible formats
                  let lat = wp.lat || wp.latitude;
                  let lng = wp.lng || wp.longitude || wp.lon;
                  
                  // Check if coordinates are in coords array format [lng, lat]
                  if (!lat && !lng && wp.coords && Array.isArray(wp.coords) && wp.coords.length >= 2) {
                    lng = wp.coords[0]; // MapBox format: [lng, lat]
                    lat = wp.coords[1];
                    console.log(`🛩️ Extracted coords from array for ${wp.name}: [${lng}, ${lat}]`);
                  }
                  
                  // Check if coordinates are in coordinates property
                  if (!lat && !lng && wp.coordinates) {
                    if (Array.isArray(wp.coordinates) && wp.coordinates.length >= 2) {
                      lng = wp.coordinates[0];
                      lat = wp.coordinates[1];
                    } else if (wp.coordinates.lat && wp.coordinates.lng) {
                      lat = wp.coordinates.lat;
                      lng = wp.coordinates.lng;
                    }
                  }
                  
                  console.log(`🛩️ Waypoint ${index + 1} (${wp.name}): lat=${lat}, lng=${lng}`);
                  
                  return {
                    lat: lat,
                    lng: lng,
                    name: wp.name || wp.id || `${wp.type || 'WP'} ${index + 1}`,
                    altitude: wp.altitude || (wp.type === 'departure' ? 0 : (wp.type === 'destination' ? 0 : 2000)),
                    type: wp.type || 'waypoint'
                  };
                }).filter(wp => wp.lat && wp.lng); // Only keep waypoints with valid coordinates
                
                if (flightRoute.length >= 2) {
                  console.log('🛩️ ✅ SUCCESS! Using REAL FLIGHT WAYPOINTS!');
                  console.log('🛩️ Converted route:', flightRoute);
                  console.log(`🛩️ Flight route: ${flightRoute.map(wp => wp.name).join(' → ')}`);
                } else {
                  console.log('🛩️ Method 1: Not enough waypoints with valid coordinates after processing');
                  flightRoute = null;
                }
              } else {
                console.log('🛩️ Method 1: No waypoints prop or insufficient waypoints');
              }
              
              // Method 2: Try to get from mapManagerRef waypoints
              if (!flightRoute && mapManagerRef?.current?.getWaypoints) {
                console.log('🛩️ Method 2: Trying mapManager.getWaypoints()');
                const mapWaypoints = mapManagerRef.current.getWaypoints();
                console.log('🛩️ Map waypoints:', mapWaypoints);
                
                if (mapWaypoints && mapWaypoints.length >= 2) {
                  flightRoute = mapWaypoints.map((wp, index) => ({
                    lat: wp.lat || wp.latitude,
                    lng: wp.lng || wp.longitude || wp.lon,
                    name: wp.name || wp.id || `WP${index + 1}`,
                    altitude: wp.altitude || (index === 0 ? 500 : (index === mapWaypoints.length - 1 ? 500 : 2000))
                  }));
                  console.log('✅ Using real waypoints from mapManager');
                }
              } else if (!flightRoute) {
                console.log('🛩️ Method 2: mapManager.getWaypoints not available');
              }
              
              // Method 2.5: Try to get waypoints from window.currentWaypoints (global variable)
              if (!flightRoute && window.currentWaypoints && window.currentWaypoints.length >= 2) {
                console.log('🛩️ Method 2.5: Found window.currentWaypoints');
                console.log('🛩️ Global waypoints:', window.currentWaypoints);
                
                flightRoute = window.currentWaypoints.map((wp, index) => ({
                  lat: wp.lat || wp.latitude,
                  lng: wp.lng || wp.longitude || wp.lon,
                  name: wp.name || wp.id || `Global WP${index + 1}`,
                  altitude: wp.altitude || 2000
                }));
                console.log('✅ Using waypoints from window.currentWaypoints');
              }
              
              // Method 3: Try to get from weather segments hook
              if (!flightRoute && weatherSegmentsHook?.segments) {
                const segments = weatherSegmentsHook.segments;
                if (segments.length > 0) {
                  // Extract coordinates from segments
                  const coords = segments.map(seg => seg.coordinates).flat();
                  if (coords.length >= 2) {
                    flightRoute = coords.map((coord, index) => ({
                      lat: coord.lat || coord.latitude,
                      lng: coord.lng || coord.longitude || coord.lon,
                      name: coord.name || `Segment ${index + 1}`,
                      altitude: coord.altitude || 2000
                    }));
                    console.log('✅ Using real route from weather segments');
                  }
                }
              }
              
              // Method 4: Fallback to realistic Gulf demo route if no real route found
              if (!flightRoute) {
                console.log('⚠️ No real flight route found, using realistic Gulf demo route');
                flightRoute = [
                  { lat: 29.7604, lng: -95.3698, name: "KHOU (Houston)", altitude: 0 },
                  { lat: 29.5333, lng: -94.8667, name: "Galveston Bay", altitude: 1000 },
                  { lat: 29.2000, lng: -94.5000, name: "Offshore Waypoint", altitude: 2000 },
                  { lat: 28.8667, lng: -94.2000, name: "East Cameron 330", altitude: 2000 },
                  { lat: 28.6000, lng: -93.8000, name: "South Timbalier 54", altitude: 1500 },
                  { lat: 28.4500, lng: -93.5000, name: "Final Approach", altitude: 500 },
                  { lat: 28.3333, lng: -93.3333, name: "Heliport Landing", altitude: 0 }
                ];
              }
              
              if (flightManager.loadRoute(flightRoute)) {
                window.autoFlightManager = flightManager;
                console.log(`✅ Auto flight enabled with ${flightRoute.length} waypoints!`);
                console.log(`🛩️ Route: ${flightRoute.map(wp => wp.name).join(' → ')}`);
                setLayers(prev => ({ ...prev, autoFlight: true }));
                
                // 🛫 AUTO-START: Automatically start the flight like the old behavior
                setTimeout(() => {
                  console.log('🛫 Auto-starting flight in 1 second...');
                  if (flightManager && !flightManager.isFlying) {
                    const started = flightManager.startFlight();
                    if (started) {
                      console.log('🛫 ✅ Flight started automatically!');
                    } else {
                      console.log('🛫 ❌ Failed to auto-start flight - use Start button in control panel');
                    }
                  }
                }, 1000); // Give the panel a moment to be created
                
              } else {
                console.error('❌ Failed to initialize auto flight system');
              }
            }
          } catch (error) {
            console.error('❌ Error toggling auto flight:', error);
          }
          break;
          
        default:
          console.warn(`Unknown layer: ${layerName}`);
      }
    } catch (error) {
      console.error(`Error toggling layer ${layerName}:`, error);
    }
  };
  
  // Auto Flight Control Handlers
  const handleFlightControl = (action) => {
    const manager = window.autoFlightManager;
    if (!manager) {
      console.warn('🛩️ No auto flight manager available');
      return;
    }
    
    switch (action) {
      case 'play':
        if (manager.isFlying && !manager.isPaused) {
          // Currently playing - pause it
          manager.togglePause();
          setFlightControls(prev => ({ ...prev, isPlaying: false }));
          console.log('🛩️ Flight paused');
        } else if (manager.isFlying && manager.isPaused) {
          // Currently paused - resume it
          manager.togglePause();
          setFlightControls(prev => ({ ...prev, isPlaying: true }));
          console.log('🛩️ Flight resumed');
        } else {
          // Not flying - start it from current position (don't reset to beginning)
          const started = manager.startFlight();
          if (started) {
            setFlightControls(prev => ({ ...prev, isPlaying: true }));
            console.log('🛩️ Flight started from current position');
          }
        }
        break;
        
      case 'stop':
        manager.stopFlight();
        setFlightControls(prev => ({ 
          ...prev, 
          isPlaying: false, 
          progress: 0,
          phase: 'PREFLIGHT'
        }));
        console.log('🛩️ Flight stopped');
        break;
    }
  };
  
  // Jump to approach view for specific waypoint
  const handleWaypointJump = (waypointIndex) => {
    const manager = window.autoFlightManager;
    if (!manager || !manager.route?.waypoints?.length) return;
    
    // Calculate progress to show approach TO each waypoint (not AT the waypoint)
    let progress;
    if (waypointIndex === 0) {
      // For departure, start at 0% (can't show approach to departure)
      progress = 0;
      console.log(`🛩️ Jumping to departure: ${manager.route.waypoints[waypointIndex]?.name} (${progress}%)`);
    } else {
      // For all other waypoints, position 1% before the waypoint to show final approach
      const waypointProgress = (waypointIndex / (manager.route.waypoints.length - 1)) * 100;
      const approachOffset = 1; // 1% before the waypoint for close approach view
      progress = Math.max(0, waypointProgress - approachOffset);
      
      console.log(`🛩️ Jumping to final approach for: ${manager.route.waypoints[waypointIndex]?.name} (${progress}% - approaching from ${approachOffset}% out)`);
    }
    
    // Use the existing setFlightProgress method
    if (manager.setFlightProgress) {
      manager.setFlightProgress(progress);
      setFlightControls(prev => ({ ...prev, progress }));
    }
  };
  
  const handleFlightProgress = (progress) => {
    const manager = window.autoFlightManager;
    if (!manager) return;
    
    // Set flight progress (0-100%)
    if (manager.setFlightProgress) {
      manager.setFlightProgress(progress);
      setFlightControls(prev => ({ ...prev, progress }));
      console.log(`🛩️ Flight progress set to ${progress}%`);
    }
  };
  
  const handleFlightSpeed = (speed) => {
    const manager = window.autoFlightManager;
    if (!manager) return;
    
    // Set flight speed multiplier (1-50x)
    manager.config.speedMultiplier = speed;
    setFlightControls(prev => ({ ...prev, speed }));
    console.log(`🛩️ Flight speed set to ${speed}x`);
  };
  
  // Update flight controls state from auto flight manager
  React.useEffect(() => {
    const updateFlightState = () => {
      const manager = window.autoFlightManager;
      if (manager && layers.autoFlight) {
        setFlightControls(prev => ({
          ...prev,
          isPlaying: manager.isFlying && !manager.isPaused,
          phase: manager.state?.phase || 'PREFLIGHT',
          currentWaypoint: manager.currentWaypointIndex < manager.route?.waypoints?.length ? 
            `${manager.currentWaypointIndex + 1}/${manager.route.waypoints.length} - ${manager.route.waypoints[manager.currentWaypointIndex]?.name}` :
            'No route',
          estimatedTime: manager.route?.estimatedTime || 0,
          progress: manager.route?.waypoints?.length > 1 ? 
            Math.round(((manager.currentWaypointIndex + (manager.flightProgress || 0)) / (manager.route.waypoints.length - 1)) * 100) : 0
        }));
      }
    };
    
    // Update every second when auto flight is active
    let interval;
    if (layers.autoFlight) {
      interval = setInterval(updateFlightState, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [layers.autoFlight]);
  
  // Master toggle function for all platform layers
  const toggleAllPlatformLayers = () => {
    // Determine if we should turn all on or all off
    // Turn off if ANY platform layer is currently on, turn on if ALL are off
    const platformLayerStates = [
      layers.airfields,
      layers.platforms, 
      layers.movablePlatforms,
      layers.blocks,
      layers.bases,
      layers.fuelAvailable,
      layers.grid
    ];
    
    const anyLayerOn = platformLayerStates.some(state => state);
    const newState = !anyLayerOn; // If any layer is on, turn all off. If all off, turn all on.
    
    console.log(`🔄 MASTER TOGGLE: Setting all platform layers to: ${newState}`);
    
    // Emit master toggle event to notify MainCard
    setTimeout(() => {
      const masterEvent = new CustomEvent('master-layer-toggle', {
        detail: { 
          source: 'mapLayersCard-master', 
          allVisible: newState,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(masterEvent);
      console.log('🔄 MASTER TOGGLE: Emitted master toggle event to MainCard:', newState);
    }, 10);
    
    // List of all platform layer types
    const layerTypes = [
      'airfields', 'platforms', 'movablePlatforms', 
      'blocks', 'bases', 'fuelAvailable', 'grid'
    ];
    
    // Toggle each layer by emitting the same events that individual toggles emit
    layerTypes.forEach(layerType => {
      // Only toggle if the current state is different from the target state
      if (layers[layerType] !== newState) {
        setTimeout(() => {
          const event = new CustomEvent('layer-visibility-changed', {
            detail: { layerType, visible: newState }
          });
          window.dispatchEvent(event);
          console.log(`🔄 MASTER TOGGLE: Emitted event for ${layerType}: ${newState}`);
        }, 50); // Small delay to ensure proper sequencing
        
        // Also trigger the individual toggle functions
        switch (layerType) {
          case 'airfields':
            if (layers.airfields !== newState) toggleAirfieldsVisibility();
            break;
          case 'platforms': 
            if (layers.platforms !== newState) togglePlatformsVisibility();
            break;
          case 'movablePlatforms':
            if (layers.movablePlatforms !== newState) toggleMovablePlatformsVisibility();
            break;
          case 'blocks':
            if (layers.blocks !== newState) toggleBlocksVisibility();
            break;
          case 'bases':
            if (layers.bases !== newState) toggleBasesVisibility();
            break;
          case 'fuelAvailable':
            if (layers.fuelAvailable !== newState) toggleFuelAvailableVisibility();
            break;
          case 'grid':
            if (layers.grid !== newState) toggleLayer('grid');
            break;
        }
      }
    });
  };
  
  // Listen for global layer state changes from other components
  useEffect(() => {
    const handleGlobalLayerChange = (event) => {
      console.log('🔄 SYNC: Received global layer change event:', event.detail);
      const { layerType, visible } = event.detail;
      
      // Update our state to match the global change
      if (layers.hasOwnProperty(layerType)) {
        setLayers(prev => ({ ...prev, [layerType]: visible }));
      }
    };

    window.addEventListener('layer-visibility-changed', handleGlobalLayerChange);
    return () => window.removeEventListener('layer-visibility-changed', handleGlobalLayerChange);
  }, []);

  // LIVE Weather Toggle Function - toggles weather radar and CONUS satellite at once
  const toggleLiveWeather = async () => {
    console.log('⚡ LIVE WEATHER FUNCTION CALLED: Starting toggle...');
    console.log('⚡ LIVE WEATHER: Current region:', currentRegion?.id);
    console.log('⚡ LIVE WEATHER: Current layer states:', {
      weather: layers.weather,
      satelliteConus: layers.satelliteConus,
      allLayers: layers
    });
    
    try {
      // Check current state - LIVE is active if ANY of the 2 features are on
      const isCurrentlyLive = layers.lightning || layers.observedWeatherStations;
      const newLiveState = !isCurrentlyLive;
      
      console.log(`⚡ LIVE WEATHER: Current live state: ${isCurrentlyLive}, switching to: ${newLiveState}`);
      
      if (newLiveState) {
        // Turn ON lightning and NOAA weather stations
        console.log('⚡ LIVE WEATHER: Enabling lightning and NOAA weather stations...');
        
        // Enable lightning
        if (!layers.lightning) {
          console.log('⚡ LIVE WEATHER: Enabling lightning...');
          await toggleLayer('lightning');
          console.log('⚡ LIVE WEATHER: Lightning toggle completed');
        }
        
        // Enable NOAA weather stations
        if (!layers.observedWeatherStations) {
          console.log('⚡ LIVE WEATHER: Enabling NOAA weather stations...');
          await toggleLayer('observedWeatherStations');
          console.log('⚡ LIVE WEATHER: NOAA weather stations toggle completed');
        }
        
        console.log('✅ LIVE WEATHER: Lightning and NOAA weather stations enabled');
      } else {
        // Turn OFF lightning and NOAA weather stations
        console.log('⚡ LIVE WEATHER: Disabling lightning and NOAA weather stations...');
        
        // Disable lightning
        if (layers.lightning) {
          console.log('⚡ LIVE WEATHER: Disabling lightning...');
          await toggleLayer('lightning');
          console.log('⚡ LIVE WEATHER: Lightning disabled');
        }
        
        // Disable NOAA weather stations
        if (layers.observedWeatherStations) {
          console.log('⚡ LIVE WEATHER: Disabling NOAA weather stations...');
          await toggleLayer('observedWeatherStations');
          console.log('⚡ LIVE WEATHER: NOAA weather stations disabled');
        }
        
        console.log('✅ LIVE WEATHER: Lightning and NOAA weather stations disabled');
      }
      
      // Notify parent component of the state change
      if (onLiveWeatherToggled) {
        onLiveWeatherToggled(newLiveState);
      }
      
    } catch (error) {
      console.error('❌ Error toggling LIVE weather:', error);
    }
  };
  
  // Expose the toggle function globally so parent components can call it
  React.useEffect(() => {
    console.log('🔧 EXPOSING window.toggleLiveWeather function');
    window.toggleLiveWeather = toggleLiveWeather;
    console.log('🔧 window.toggleLiveWeather set:', !!window.toggleLiveWeather);
    return () => {
      console.log('🔧 CLEANING UP window.toggleLiveWeather function');
      delete window.toggleLiveWeather;
    };
  }, [layers.lightning, layers.observedWeatherStations, toggleLiveWeather]);
  
  // Calculate current LIVE weather state for parent
  const isLiveWeatherActive = layers.lightning || layers.observedWeatherStations;
  
  // Notify parent when LIVE state changes
  React.useEffect(() => {
    if (onLiveWeatherToggled) {
      onLiveWeatherToggled(isLiveWeatherActive);
    }
  }, [isLiveWeatherActive, onLiveWeatherToggled]);

  // Listen for master toggle events from MainCard to keep buttons synchronized
  useEffect(() => {
    const handleMasterToggleFromMainCard = (event) => {
      if (event.detail && event.detail.source === 'mainCard-master') {
        console.log('🔄 MAP LAYERS: Received master toggle from MainCard:', event.detail);
        // The MainCard master button was used, trigger our master toggle
        // but only if the states are different to avoid infinite loops
        const { allVisible } = event.detail;
        
        const platformLayerStates = [
          layers.airfields, layers.platforms, layers.movablePlatforms,
          layers.blocks, layers.bases, layers.fuelAvailable, layers.grid
        ];
        const currentAnyLayerOn = platformLayerStates.some(state => state);
        
        // Only trigger if the target state is different from current state
        if (allVisible !== currentAnyLayerOn) {
          console.log('🔄 MAP LAYERS: Syncing with MainCard master toggle');
          // Don't call toggleAllPlatformLayers() directly to avoid event loops
          // Instead, update layers directly and trigger individual toggles
          const layerTypes = [
            'airfields', 'platforms', 'movablePlatforms', 
            'blocks', 'bases', 'fuelAvailable', 'grid'
          ];
          
          layerTypes.forEach(layerType => {
            if (layers[layerType] !== allVisible) {
              // Update the layer state
              setLayers(prev => ({ ...prev, [layerType]: allVisible }));
              
              // Trigger the individual toggle function
              setTimeout(() => {
                switch (layerType) {
                  case 'airfields':
                    if (layers.airfields !== allVisible) toggleAirfieldsVisibility();
                    break;
                  case 'platforms': 
                    if (layers.platforms !== allVisible) togglePlatformsVisibility();
                    break;
                  case 'movablePlatforms':
                    if (layers.movablePlatforms !== allVisible) toggleMovablePlatformsVisibility();
                    break;
                  case 'blocks':
                    if (layers.blocks !== allVisible) toggleBlocksVisibility();
                    break;
                  case 'bases':
                    if (layers.bases !== allVisible) toggleBasesVisibility();
                    break;
                  case 'fuelAvailable':
                    if (layers.fuelAvailable !== allVisible) toggleFuelAvailableVisibility();
                    break;
                  case 'grid':
                    if (layers.grid !== allVisible) toggleLayer('grid');
                    break;
                }
              }, 100 + Math.random() * 50); // Stagger the toggles slightly
            }
          });
        }
      }
    };

    window.addEventListener('master-layer-toggle', handleMasterToggleFromMainCard);
    return () => window.removeEventListener('master-layer-toggle', handleMasterToggleFromMainCard);
  }, [layers, toggleAirfieldsVisibility, togglePlatformsVisibility, toggleMovablePlatformsVisibility, 
      toggleBlocksVisibility, toggleBasesVisibility, toggleFuelAvailableVisibility]);

  // Render layer toggle button
  const renderLayerToggle = (id, label, isAvailable = true) => {
    console.log(`MapLayersCard: Rendering toggle for ${id}, state: ${layers[id]}, available: ${isAvailable}, ` +
                `current region: ${currentRegion?.id || 'unknown'}`);
    
    return (
      <div className="layer-toggle-container" key={id}>
        <button
          className={`layer-toggle-button ${layers[id] ? 'active' : 'inactive'}`}
          onClick={() => toggleLayer(id)}
          disabled={!isAvailable}
        >
          <span className="toggle-indicator"></span>
          <span className="toggle-label">{label}</span>
          {!isAvailable && <span className="unavailable-indicator">*</span>}
        </button>
      </div>
    );
  };
  
  return (
    <div id={id} className="panel-card">
      <h3 className="panel-card-title">Map Layers</h3>
      
      <div className="panel-card-content">
        {/* Section 1: Common to All Regions */}
        <div className="layer-section section-border">
          <h4>🌍 Common to All Regions</h4>
          
          {/* Platforms & Airfields */}
          <div className="subsection-header">Platforms & Airfields</div>
          
          {/* Master toggle button for all platform layers */}
          <div className="button-row" style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            <button
              onClick={toggleAllPlatformLayers}
              style={{
                flex: '1',
                backgroundColor: (() => {
                  const platformLayerStates = [
                    layers.airfields, layers.platforms, layers.movablePlatforms,
                    layers.blocks, layers.bases, layers.fuelAvailable, layers.grid
                  ];
                  const anyLayerOn = platformLayerStates.some(state => state);
                  const allLayersOn = platformLayerStates.every(state => state);
                  
                  if (allLayersOn) return '#3b82f6'; // All on - blue
                  if (anyLayerOn) return '#1f2937'; // Some on - dark gray with amber border
                  return '#6b7280'; // All off - gray
                })(),
                color: '#ffffff',
                border: (() => {
                  const platformLayerStates = [
                    layers.airfields, layers.platforms, layers.movablePlatforms,
                    layers.blocks, layers.bases, layers.fuelAvailable, layers.grid
                  ];
                  const anyLayerOn = platformLayerStates.some(state => state);
                  const allLayersOn = platformLayerStates.every(state => state);
                  
                  if (allLayersOn) return '1px solid #3b82f6'; // All on - blue border
                  if (anyLayerOn) return '2px solid #f59e0b'; // Some on - amber border  
                  return '1px solid rgba(255,255,255,0.2)'; // All off - default border
                })(),
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.opacity = '0.8';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {(() => {
                const platformLayerStates = [
                  layers.airfields, layers.platforms, layers.movablePlatforms,
                  layers.blocks, layers.bases, layers.fuelAvailable, layers.grid
                ];
                const anyLayerOn = platformLayerStates.some(state => state);
                const allLayersOn = platformLayerStates.every(state => state);
                
                if (allLayersOn) return '🔲 Hide All Platforms';
                if (anyLayerOn) return '🔳 Show All Platforms'; 
                return '☐ Show All Platforms';
              })()}
            </button>
          </div>
          
          <div className="button-row">
            {renderLayerToggle('airfields', 'Airfields')}
            {renderLayerToggle('platforms', 'Platforms')}
          </div>
          <div className="button-row">
            {renderLayerToggle('movablePlatforms', 'Movable')}
            {renderLayerToggle('blocks', 'Blocks')}
          </div>
          <div className="button-row">
            {renderLayerToggle('bases', 'Bases')}
            {renderLayerToggle('fuelAvailable', 'Fuel Available')}
          </div>
          
          {/* 3D Map Toggle */}
          <div className="subsection-header">Map View</div>
          <div className="map-view-controls">
            <button 
              className="map-3d-toggle-button"
              onClick={async () => {
                try {
                  console.log('🗺️ Switching map view...');
                  
                  const mapManager = mapManagerRef?.current;
                  if (!mapManager) {
                    console.error('Map manager not available');
                    return;
                  }
                  
                  // SAVE CURRENT LAYER STATE before switching
                  const currentLayers = { ...layers };
                  const currentWeatherOpacities = { ...weatherOpacities };
                  console.log('💾 Saving layer state before style switch:', currentLayers);
                  
                  // Toggle between dark and 3D style
                  const currentStyle = mapManager.getCurrentStyle ? mapManager.getCurrentStyle() : 'dark';
                  const newStyle = currentStyle === '3d' ? 'dark' : '3d';
                  
                  console.log(`🗺️ Switching from ${currentStyle} to ${newStyle}`);
                  
                  await mapManager.switchMapStyle(newStyle);
                  
                  // CRITICAL: Reset camera to top-down view when switching back to 2D
                  const map = mapManager.getMap();
                  if (newStyle === 'dark' && map) {
                    console.log('📐 Resetting camera to top-down 2D view');
                    map.easeTo({
                      pitch: 0,     // Top-down view
                      bearing: 0,   // North up
                      duration: 800 // Smooth transition
                    });
                  }
                  
                  console.log(`🗺️ Switched to ${newStyle === '3d' ? '3D Standard' : '2D Top View'} style`);
                  
                  // RESTORE LAYERS after style switch (small delay to ensure style is loaded)
                  setTimeout(async () => {
                    console.log('🔄 Restoring layers after style switch...');
                    const mapInstance = mapManager.getMap();
                    
                    try {
                      // Restore lightning if it was on
                      if (currentLayers.lightning && !mapInstance.getLayer('simple-lightning-layer')) {
                        console.log('⚡ Restoring lightning...');
                        const { addSimpleLightningOverlay } = await import('../../../modules/WeatherLoader.js');
                        await addSimpleLightningOverlay(mapInstance);
                        setTimeout(() => {
                          try {
                            mapInstance.setPaintProperty('simple-lightning-layer', 'raster-opacity', currentWeatherOpacities.lightning);
                          } catch (e) { console.warn('Lightning opacity restore failed:', e); }
                        }, 200);
                      }
                      
                      // Restore Gulf weather layers if in Gulf region
                      if (currentRegion?.id === 'gulf-of-mexico') {
                        const { addNOAAWeatherOverlay } = await import('../../../modules/WeatherLoader.js');
                        
                        if (currentLayers.satelliteConus && !mapInstance.getLayer('noaa-conus-layer')) {
                          console.log('🌧️ Restoring CONUS radar...');
                          await addNOAAWeatherOverlay(mapInstance, 'CONUS');
                          setTimeout(() => {
                            try {
                              mapInstance.setPaintProperty('noaa-conus-layer', 'raster-opacity', currentWeatherOpacities.satelliteConus);
                            } catch (e) { console.warn('CONUS opacity restore failed:', e); }
                          }, 200);
                        }
                        
                        if (currentLayers.satelliteLongwave && !mapInstance.getLayer('noaa-longwave-layer')) {
                          console.log('🛰️ Restoring Longwave IR...');
                          await addNOAAWeatherOverlay(mapInstance, 'LONGWAVE');
                          setTimeout(() => {
                            try {
                              mapInstance.setPaintProperty('noaa-longwave-layer', 'raster-opacity', currentWeatherOpacities.satelliteLongwave);
                            } catch (e) { console.warn('Longwave opacity restore failed:', e); }
                          }, 200);
                        }
                        
                        if (currentLayers.satelliteShortwave && !mapInstance.getLayer('noaa-shortwave-layer')) {
                          console.log('🛰️ Restoring Shortwave IR...');
                          await addNOAAWeatherOverlay(mapInstance, 'SHORTWAVE');
                          setTimeout(() => {
                            try {
                              mapInstance.setPaintProperty('noaa-shortwave-layer', 'raster-opacity', currentWeatherOpacities.satelliteShortwave);
                            } catch (e) { console.warn('Shortwave opacity restore failed:', e); }
                          }, 200);
                        }
                      }
                      
                      // Emit multiple events to notify all components to restore their layers
                      setTimeout(() => {
                        const eventDetail = { 
                          newStyle, 
                          previousLayers: currentLayers,
                          restoreAlternateLines: true,
                          restoreWeatherCircles: true 
                        };

                        // Emit multiple event types for maximum compatibility
                        ['map-style-switched', 'map-style-changed'].forEach(eventName => {
                          const event = new CustomEvent(eventName, { detail: eventDetail });
                          window.dispatchEvent(event);
                        });
                        
                        console.log('📢 Notified other components to restore layers (multiple event types)');
                      }, 500);
                      
                      console.log('✅ Layer restoration completed');
                      
                    } catch (error) {
                      console.error('❌ Error during layer restoration:', error);
                    }
                  }, 1000); // Wait 1 second for style to fully load
                  
                } catch (error) {
                  console.error('3D map switch failed:', error);
                }
              }}
            >
              🗺️ Toggle 3D Map
            </button>
          </div>
        </div>
        
        {/* Section 2: Region-Specific Layers */}
        <div className="layer-section section-border">
          <h4>🗺️ {currentRegion?.name || 'Region-Specific'} Layers</h4>
          
          {/* Coordinate Grid - moved here as requested */}
          <div className="subsection-header">Coordinate Grid</div>
          {renderLayerToggle('grid', 'Coordinate Grid')}
          
          {/* Gulf Coast Region */}
          {currentRegion?.id === 'gulf-of-mexico' && (
            <>
              <div className="subsection-header">Gulf Coast Layers</div>
              {renderLayerToggle(
                'gulfCoastHeli', 
                'Gulf Coast Helicopter Map', 
                true
              )}
          
              {/* Opacity slider for Gulf Coast map */}
              {layers.gulfCoastHeli && (
                <div className="opacity-slider-container">
                  <label className="opacity-slider-label">
                    Map Opacity: {Math.round(gulfCoastOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gulfCoastOpacity}
                    onChange={handleGulfCoastOpacityChange}
                    className="opacity-slider"
                  />
                  <div className="opacity-slider-marks">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
              
              {/* Gulf Region Specific Weather Layers */}
              <div className="subsection-header">Gulf Weather Layers</div>
              <div className="button-row">
                {renderLayerToggle('satelliteConus', '🌧️ Radar (CONUS)', true)}
                {renderLayerToggle('satelliteLongwave', '🛰️ Longwave IR', true)}
              </div>
              <div className="button-row">
                {renderLayerToggle('satelliteShortwave', '🛰️ Shortwave IR', true)}
              </div>
              
              {/* Weather layer descriptions */}
              <div className="weather-layer-descriptions">
                <div className="layer-description">
                  <strong>🌧️ Radar (CONUS):</strong> Real-time precipitation and storm intensity
                </div>
                <div className="layer-description">
                  <strong>🛰️ Longwave IR:</strong> Cloud temperature and high-altitude weather
                </div>
                <div className="layer-description">
                  <strong>🛰️ Shortwave IR:</strong> Low clouds, fog, and surface conditions
                </div>
              </div>
              
              {/* Opacity sliders for active Gulf weather layers */}
              {layers.satelliteConus && (
                <div className="opacity-slider-container">
                  <label className="opacity-slider-label">
                    Radar Opacity: {Math.round(weatherOpacities.satelliteConus * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weatherOpacities.satelliteConus}
                    onChange={(e) => {
                      const newOpacity = parseFloat(e.target.value);
                      setWeatherOpacities(prev => ({ ...prev, satelliteConus: newOpacity }));
                      // Apply opacity to map layer using new naming convention
                      const mapInstance = mapManagerRef?.current?.map;
                      if (mapInstance && mapInstance.getLayer('noaa-conus-layer')) {
                        try {
                          mapInstance.setPaintProperty('noaa-conus-layer', 'raster-opacity', newOpacity);
                        } catch (error) {
                          console.warn('Could not set CONUS opacity:', error);
                        }
                      }
                    }}
                    className="opacity-slider"
                  />
                  <div className="opacity-slider-marks">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
              
              {layers.satelliteLongwave && (
                <div className="opacity-slider-container">
                  <label className="opacity-slider-label">
                    Longwave Opacity: {Math.round(weatherOpacities.satelliteLongwave * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weatherOpacities.satelliteLongwave}
                    onChange={(e) => {
                      const newOpacity = parseFloat(e.target.value);
                      setWeatherOpacities(prev => ({ ...prev, satelliteLongwave: newOpacity }));
                      // Apply opacity to map layer using new naming convention
                      const mapInstance = mapManagerRef?.current?.map;
                      if (mapInstance && mapInstance.getLayer('noaa-longwave-layer')) {
                        try {
                          mapInstance.setPaintProperty('noaa-longwave-layer', 'raster-opacity', newOpacity);
                        } catch (error) {
                          console.warn('Could not set longwave opacity:', error);
                        }
                      }
                    }}
                    className="opacity-slider"
                  />
                  <div className="opacity-slider-marks">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
              
              {layers.satelliteShortwave && (
                <div className="opacity-slider-container">
                  <label className="opacity-slider-label">
                    Shortwave Opacity: {Math.round(weatherOpacities.satelliteShortwave * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weatherOpacities.satelliteShortwave}
                    onChange={(e) => {
                      const newOpacity = parseFloat(e.target.value);
                      setWeatherOpacities(prev => ({ ...prev, satelliteShortwave: newOpacity }));
                      // Apply opacity to map layer using new naming convention
                      const mapInstance = mapManagerRef?.current?.map;
                      if (mapInstance && mapInstance.getLayer('noaa-shortwave-layer')) {
                        try {
                          mapInstance.setPaintProperty('noaa-shortwave-layer', 'raster-opacity', newOpacity);
                        } catch (error) {
                          console.warn('Could not set shortwave opacity:', error);
                        }
                      }
                    }}
                    className="opacity-slider"
                  />
                  <div className="opacity-slider-marks">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Norway Region Specific Layers */}
          {currentRegion?.id === 'norway' && (
            <>
              <div className="subsection-header">Norway Regional Maps</div>
              <div className="layer-placeholder">
                <em>Norway helicopter routes and wind maps coming soon...</em>
              </div>
              
              <div className="subsection-header">Norway Weather Layers</div>
              <div className="layer-placeholder">
                <em>Norwegian MET data and triggered lightning coming soon...</em>
              </div>
              
              {/* Norway-specific weather circles if available */}
              {renderLayerToggle('weatherCircles', 'Weather Circles', !!weatherSegmentsHook)}
            </>
          )}
          
          {/* Other regions - standard weather circles */}
          {currentRegion?.id !== 'gulf-of-mexico' && currentRegion?.id !== 'norway' && (
            <>
              <div className="subsection-header">{currentRegion?.name || 'Regional'} Weather Layers</div>
              {renderLayerToggle('weatherCircles', 'Weather Circles', !!weatherSegmentsHook)}
              
              <div className="layer-placeholder">
                <em>Additional regional layers will be available as they are implemented</em>
              </div>
            </>
          )}
          
          {/* US/Gulf-specific Aviation Layers */}
          {(currentRegion?.id === 'gulf-of-mexico' || currentRegion?.id === 'north-sea' || !currentRegion?.id) && (
            <>
              <div className="subsection-header">Aviation Layers</div>
              {renderLayerToggle('observedWeatherStations', 'NOAA Weather Stations', true)}
            </>
          )}
          
          {/* Global Weather Satellite Layers */}
          <div className="subsection-header">Global Weather Layers</div>
          {renderLayerToggle('lightning', '⚡ Lightning (Global)', true)}
          
          {/* Lightning opacity slider - always visible when lightning is on */}
          {layers.lightning && (
            <div className="opacity-slider-container">
              <label className="opacity-slider-label">
                Lightning Opacity: {Math.round(weatherOpacities.lightning * 100)}%
              </label>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={weatherOpacities.lightning}
                onChange={(e) => {
                  const newOpacity = parseFloat(e.target.value);
                  setWeatherOpacities(prev => ({ ...prev, lightning: newOpacity }));
                  // Apply opacity to lightning layer
                  const mapInstance = mapManagerRef?.current?.map;
                  if (mapInstance && mapInstance.getLayer('simple-lightning-layer')) {
                    try {
                      mapInstance.setPaintProperty('simple-lightning-layer', 'raster-opacity', newOpacity);
                    } catch (error) {
                      console.warn('Could not set lightning opacity:', error);
                    }
                  }
                }}
                className="opacity-slider"
              />
              <div className="opacity-slider-marks">
                <span>20%</span>
                <span>60%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Section 3: AutoFlight Controls */}
        <div className="layer-section section-border">
          <h4>🛩️ AutoFlight Controls</h4>
          <div className="button-row">
            {renderLayerToggle('autoFlight', '🛩️ Auto Flight', true)}
          </div>
          
          {/* Auto Flight Control Panel - Slides down when enabled */}
          {layers.autoFlight && (
            <div className="auto-flight-panel">
              <div className="flight-controls-row">
                <button 
                  className={`flight-control-btn ${flightControls.isPlaying ? 'active' : ''}`}
                  onClick={() => handleFlightControl('play')}
                  disabled={!window.autoFlightManager}
                >
                  {flightControls.isPlaying ? '⏸️' : '▶️'}
                </button>
                <button 
                  className="flight-control-btn"
                  onClick={() => handleFlightControl('stop')}
                  disabled={!window.autoFlightManager}
                >
                  ⏹️
                </button>
                <div className="flight-phase">
                  {flightControls.phase}
                </div>
              </div>
              
              <div className="flight-slider-row">
                <label>Flight Progress:</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={flightControls.progress}
                  onChange={(e) => handleFlightProgress(parseInt(e.target.value))}
                  className="flight-progress-slider"
                  disabled={!window.autoFlightManager}
                />
                <span>{flightControls.progress}%</span>
              </div>
              
              <div className="flight-slider-row">
                <label>Speed:</label>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={flightControls.speed}
                  onChange={(e) => handleFlightSpeed(parseInt(e.target.value))}
                  className="flight-speed-slider"
                  disabled={!window.autoFlightManager}
                />
                <span>{flightControls.speed}x</span>
              </div>
              
              <div className="flight-info">
                <div className="flight-waypoint">
                  {flightControls.currentWaypoint || 'No route loaded'}
                </div>
                {flightControls.estimatedTime > 0 && (
                  <div className="flight-time">
                    Est. {Math.round(flightControls.estimatedTime)} min
                  </div>
                )}
              </div>
              
              {/* Waypoint Jump Buttons */}
              {window.autoFlightManager?.route?.waypoints?.length > 0 && (
                <div className="flight-waypoints-row">
                  <label>View Approach:</label>
                  <div className="waypoint-buttons">
                    {window.autoFlightManager.route.waypoints.map((waypoint, index) => (
                      <button
                        key={index}
                        className={`waypoint-jump-btn ${
                          window.autoFlightManager.currentWaypointIndex === index ? 'current' : ''
                        }`}
                        onClick={() => handleWaypointJump(index)}
                        title={index === 0 ? `Departure: ${waypoint.name}` : `Approach to ${waypoint.name}`}
                      >
                        {index === 0 ? '🛫' : 
                         index === window.autoFlightManager.route.waypoints.length - 1 ? '🛬' : 
                         waypoint.name?.includes('Platform') || waypoint.name?.includes('Rig') ? '🛢️' : '📍'}
                        <span className="waypoint-name">{waypoint.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="layer-info">
          <p>* Layers marked with an asterisk are not available in the current region.</p>
        </div>
      </div>
    </div>
  );
};

export default MapLayersCard;