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
  weatherSegmentsHook // Pass the entire weather segments hook
}) => {
  const { currentRegion } = useRegion();
  const [layers, setLayers] = useState({
    gulfCoastHeli: false,
    weather: false,
    weatherCircles: true, // Default ON - weather circles auto-show with flights
    vfrCharts: false,
    grid: true,
    platforms: true, // Fixed platforms (enhanced category)
    airfields: true, 
    fixedPlatforms: true, // Legacy (can be removed later)
    movablePlatforms: true,
    blocks: true, // New category for blocks
    bases: true, // New category for bases
    fuelAvailable: false // New category for fuel available (default off)
  });

  // State for Gulf Coast map opacity
  const [gulfCoastOpacity, setGulfCoastOpacity] = useState(0.85);
  
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
      
      // Sync weather circles state
      const weatherCirclesVisible = !!window.currentWeatherCirclesLayer;
      if (weatherCirclesVisible !== layers.weatherCircles) {
        console.log('🔄 SYNC: Weather circles state mismatch detected, correcting:', { current: layers.weatherCircles, actual: weatherCirclesVisible });
        setLayers(prev => ({ ...prev, weatherCircles: weatherCirclesVisible }));
      }
    };
    
    // Sync immediately
    syncLayerStates();
    
    // Set up interval to sync every 3 seconds
    const interval = setInterval(syncLayerStates, 3000);
    
    return () => clearInterval(interval);
  }, [layers.grid, layers.gulfCoastHeli, layers.weatherCircles, mapManagerRef, gulfCoastMapRef]);

  // Auto-enable weather circles when weather data becomes available
  useEffect(() => {
    const checkAndAutoEnableWeatherCircles = () => {
      // Check if weather data is available
      const hasWeatherData = (weatherSegmentsHook?.weatherSegments?.length > 0) || 
                            (window.loadedWeatherSegments?.length > 0);
      
      // Enhanced debugging for loaded flights
      console.log('🔍 AUTO-ENABLE CHECK:', {
        hasWeatherData,
        hookSegments: weatherSegmentsHook?.weatherSegments?.length || 0,
        loadedSegments: window.loadedWeatherSegments?.length || 0,
        currentCirclesState: layers.weatherCircles,
        existingLayer: !!window.currentWeatherCirclesLayer,
        mapAvailable: !!mapManagerRef?.current?.map
      });
      
      if (hasWeatherData && !layers.weatherCircles && !window.currentWeatherCirclesLayer) {
        console.log('🌤️ AUTO-ENABLE: Weather data detected, auto-enabling weather circles');
        
        // Auto-enable weather circles
        setLayers(prev => ({ ...prev, weatherCircles: true }));
        
        // Trigger the weather circles creation
        setTimeout(() => {
          try {
            // Find the best weather data source
            let weatherData = null;
            let dataSource = 'none';
            
            if (weatherSegmentsHook?.weatherSegments?.length > 0) {
              weatherData = weatherSegmentsHook.weatherSegments;
              dataSource = 'hook';
            } else if (window.loadedWeatherSegments?.length > 0) {
              weatherData = window.loadedWeatherSegments;
              dataSource = 'loaded';
            }
            
            console.log(`🌤️ AUTO-ENABLE: Creating weather circles from ${dataSource}, segments:`, weatherData?.length || 0);
            
            if (weatherData && weatherData.length > 0 && mapManagerRef?.current?.map) {
              import('../../../modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                // Clean up any existing layer first
                if (window.currentWeatherCirclesLayer) {
                  try {
                    window.currentWeatherCirclesLayer.removeWeatherCircles();
                  } catch (cleanupError) {
                    console.warn('🌤️ AUTO-ENABLE: Error during cleanup:', cleanupError);
                  }
                }
                
                console.log('🌤️ AUTO-ENABLE: Creating WeatherCirclesLayer automatically');
                const weatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
                weatherCirclesLayer.addWeatherCircles(weatherData);
                window.currentWeatherCirclesLayer = weatherCirclesLayer;
                console.log('🌤️ AUTO-ENABLE: Weather circles automatically enabled and displayed');
              }).catch(error => {
                console.error('🌤️ AUTO-ENABLE: Error importing WeatherCirclesLayer:', error);
                // Reset state on error
                setLayers(prev => ({ ...prev, weatherCircles: false }));
              });
            }
          } catch (error) {
            console.error('🌤️ AUTO-ENABLE: Error auto-enabling weather circles:', error);
            setLayers(prev => ({ ...prev, weatherCircles: false }));
          }
        }, 500); // Small delay to ensure map is ready
      }
    };
    
    // Check immediately
    checkAndAutoEnableWeatherCircles();
    
    // Set up interval to check for new weather data
    const interval = setInterval(checkAndAutoEnableWeatherCircles, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [weatherSegmentsHook?.weatherSegments?.length, layers.weatherCircles, mapManagerRef]);

  // Listen for force-enable events from flight loading
  useEffect(() => {
    const handleForceEnable = () => {
      console.log('🌤️ FORCE-ENABLE: Received weather circles force-enable event');
      setLayers(prev => ({ ...prev, weatherCircles: true }));
    };

    window.addEventListener('weather-circles-force-enabled', handleForceEnable);
    return () => window.removeEventListener('weather-circles-force-enabled', handleForceEnable);
  }, []);
  
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
          if (weatherLayerRef?.current) {
            const isVisible = await weatherLayerRef.current.toggle();
            setLayers(prev => ({ ...prev, weather: isVisible }));
          }
          break;
          
        case 'weatherCircles':
          try {
            console.log('🔘 TOGGLE: Weather circles clicked, current state:', layers.weatherCircles);
            
            // RACE CONDITION FIX: Use a single consistent approach with proper async handling
            
            // Step 1: Always clean up existing layers first (synchronous)
            if (window.currentWeatherCirclesLayer) {
              console.log('🔘 TOGGLE: Removing existing global weather circles layer');
              try {
                window.currentWeatherCirclesLayer.removeWeatherCircles();
              } catch (cleanupError) {
                console.warn('🔘 TOGGLE: Error during cleanup:', cleanupError);
              }
              window.currentWeatherCirclesLayer = null;
            }
            
            // Step 2: If toggling OFF, just set state and stop
            if (layers.weatherCircles) {
              console.log('🔘 TOGGLE: Turning weather circles OFF');
              setLayers(prev => ({ ...prev, weatherCircles: false }));
              return; // Early return to prevent further execution
            }
            
            // Step 3: If toggling ON, create new layer with available data
            console.log('🔘 TOGGLE: Turning weather circles ON');
            
            // Find the best weather data source
            let weatherData = null;
            let dataSource = 'none';
            
            if (weatherSegmentsHook?.weatherSegments?.length > 0) {
              weatherData = weatherSegmentsHook.weatherSegments;
              dataSource = 'hook';
            } else if (window.loadedWeatherSegments?.length > 0) {
              weatherData = window.loadedWeatherSegments;
              dataSource = 'loaded';
            }
            
            console.log(`🔘 TOGGLE: Using weather data from ${dataSource}, segments:`, weatherData?.length || 0);
            
            // Check map availability before proceeding
            if (!mapManagerRef?.current?.map) {
              console.error('🔘 TOGGLE: Map not available for weather circles');
              return;
            }
            
            if (weatherData && weatherData.length > 0) {
              // ASYNC FIX: Use async/await to prevent race conditions
              const createWeatherCircles = async () => {
                try {
                  const { default: WeatherCirclesLayer } = await import('../../../modules/layers/WeatherCirclesLayer');
                  
                  // Double-check map is still available after async import
                  if (mapManagerRef?.current?.map) {
                    console.log('🔘 TOGGLE: Creating new WeatherCirclesLayer with real data');
                    const weatherCirclesLayer = new WeatherCirclesLayer(mapManagerRef.current.map);
                    
                    // Add circles and store layer reference
                    weatherCirclesLayer.addWeatherCircles(weatherData);
                    window.currentWeatherCirclesLayer = weatherCirclesLayer;
                    console.log('🔘 TOGGLE: Real weather circles added successfully');
                  } else {
                    console.error('🔘 TOGGLE: Map became unavailable during async operation');
                  }
                } catch (importError) {
                  console.error('🔘 TOGGLE: Error importing or creating weather circles layer:', importError);
                }
              };
              
              createWeatherCircles();
            } else {
              // Enhanced debugging for missing weather data
              console.error('🔘 TOGGLE: No weather data available for weather circles');
              console.log('🔘 DEBUG: Weather data check:', {
                hookSegments: weatherSegmentsHook?.weatherSegments?.length || 0,
                loadedSegments: window.loadedWeatherSegments?.length || 0,
                hookObject: !!weatherSegmentsHook,
                loadedArray: Array.isArray(window.loadedWeatherSegments)
              });
              
              // Reset state since we can't create circles
              setLayers(prev => ({ ...prev, weatherCircles: false }));
            }
            
            // Update state only after successful setup
            setLayers(prev => ({ ...prev, weatherCircles: true }));
            
          } catch (error) {
            console.error('🔘 TOGGLE: Error toggling weather circles:', error);
            // Reset state on error
            setLayers(prev => ({ ...prev, weatherCircles: false }));
          }
          break;
          
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
          
        default:
          console.warn(`Unknown layer: ${layerName}`);
      }
    } catch (error) {
      console.error(`Error toggling layer ${layerName}:`, error);
    }
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
        <div className="layer-section">
          <h4>Base Layers</h4>
          {renderLayerToggle('grid', 'Coordinate Grid')}
        </div>
        
        <div className="layer-section">
          <h4>Platforms & Airfields</h4>
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
        </div>
        
        <div className="layer-section">
          <h4>Region-Specific Layers</h4>
          {renderLayerToggle(
            'gulfCoastHeli', 
            'Gulf Coast Helicopter Map', 
            true // Make always available for testing
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
        </div>
        
        <div className="layer-section">
          <h4>Aviation Layers</h4>
          {renderLayerToggle('weather', 'Weather Overlay', !!weatherLayerRef?.current)}
          {renderLayerToggle('weatherCircles', 'Weather Circles', !!weatherSegmentsHook)}
          {renderLayerToggle('vfrCharts', 'VFR Charts', !!vfrChartsRef?.current)}
        </div>
        
        <div className="layer-section">
          <h4>Map View</h4>
          <div className="map-view-controls">
            <button 
              className="map-3d-toggle-button"
              onClick={async () => {
                try {
                  console.log('🗺️ Testing 3D map style switch...');
                  
                  const mapManager = mapManagerRef?.current;
                  if (!mapManager) {
                    alert('Map manager not available');
                    return;
                  }
                  
                  // Toggle between dark and 3D style
                  const currentStyle = mapManager.getCurrentStyle ? mapManager.getCurrentStyle() : 'dark';
                  const newStyle = currentStyle === '3d' ? 'dark' : '3d';
                  
                  console.log(`🗺️ Switching from ${currentStyle} to ${newStyle}`);
                  
                  await mapManager.switchMapStyle(newStyle);
                  alert(`🗺️ Switched to ${newStyle === '3d' ? '3D Standard' : 'Dark'} style!`);
                  
                } catch (error) {
                  console.error('3D map switch failed:', error);
                  alert('3D map switch failed: ' + error.message);
                }
              }}
            >
              🗺️ Toggle 3D Map
            </button>
          </div>
        </div>
        
        <div className="layer-info">
          <p>* Layers marked with an asterisk are not available in the current region.</p>
        </div>
      </div>
    </div>
  );
};

export default MapLayersCard;