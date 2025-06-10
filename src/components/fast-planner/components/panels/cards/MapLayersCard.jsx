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

  // Auto-enable weather circles when weather data becomes available
  useEffect(() => {
    const checkAndAutoEnableWeatherCircles = () => {
      // Check if weather data is available
      const hasWeatherData = (weatherSegmentsHook?.weatherSegments?.length > 0) || 
                            (window.loadedWeatherSegments?.length > 0);
      
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
              // Fallback to test circles
              console.log('🔘 TOGGLE: No real data available, using test circles');
              if (weatherSegmentsHook?.addTestWeatherCircles) {
                try {
                  weatherSegmentsHook.addTestWeatherCircles();
                } catch (testError) {
                  console.error('🔘 TOGGLE: Error adding test circles:', testError);
                }
              }
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
            }
          }
          break;
          
        // Handle all platform-related toggles using the new functions
        case 'platforms':
          togglePlatformsVisibility();
          break;
          
        case 'airfields':
          toggleAirfieldsVisibility();
          break;
          
        case 'fixedPlatforms':
          toggleFixedPlatformsVisibility();
          break;
          
        case 'movablePlatforms':
          toggleMovablePlatformsVisibility();
          break;
          
        case 'blocks':
          toggleBlocksVisibility();
          break;
          
        case 'bases':
          toggleBasesVisibility();
          break;
          
        case 'fuelAvailable':
          toggleFuelAvailableVisibility();
          break;
          
        default:
          console.warn(`Unknown layer: ${layerName}`);
      }
    } catch (error) {
      console.error(`Error toggling layer ${layerName}:`, error);
    }
  };
  
  // Render layer toggle button
  const renderLayerToggle = (id, label, isAvailable = true) => {
    console.log(`MapLayersCard: Rendering toggle for ${id}, available: ${isAvailable}, ` +
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