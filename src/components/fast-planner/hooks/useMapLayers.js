// src/components/fast-planner/hooks/useMapLayers.js

import { useRef, useEffect, useState } from 'react';
import { useRegion } from '../context/region';
import GulfCoastHeliMap from '../modules/layers/GulfCoastHeliMap';

/**
 * Custom hook to manage map layers
 */
const useMapLayers = ({ mapManagerRef }) => {
  const { currentRegion } = useRegion();
  const gulfCoastMapRef = useRef(null);
  const weatherLayerRef = useRef(null);
  const vfrChartsRef = useRef(null);
  
  const [layersInitialized, setLayersInitialized] = useState(false);
  const [layerStates, setLayerStates] = useState({
    gulfCoastHeli: false,
    weather: false,
    vfrCharts: false
  });

  // Initialize map layers
  useEffect(() => {
    console.log("useMapLayers: Effect triggered. mapManagerRef available:", !!mapManagerRef?.current, 
                "layersInitialized:", layersInitialized);
                
    if (!mapManagerRef?.current) {
      console.log("useMapLayers: mapManagerRef is not available yet");
      return;
    }
    
    if (layersInitialized) {
      console.log("useMapLayers: Layers already initialized, skipping initialization");
      return;
    }

    console.log("useMapLayers: Map manager available, checking if map is loaded...");
    
    // Check if map is already loaded
    const isMapAlreadyLoaded = mapManagerRef.current.isMapLoaded && mapManagerRef.current.isMapLoaded();
    console.log("useMapLayers: Is map already loaded?", isMapAlreadyLoaded);
    
    if (isMapAlreadyLoaded) {
      console.log("useMapLayers: Map is already loaded, initializing map layers immediately");
      initializeLayers();
    } else {
      console.log("useMapLayers: Map is not loaded yet, setting up onMapLoaded callback");
      // Wait for the map to be loaded
      mapManagerRef.current.onMapLoaded(() => {
        console.log("useMapLayers: onMapLoaded callback triggered, initializing map layers...");
        initializeLayers();
      });
    }
    
    // Initialize layers function to avoid code duplication
    function initializeLayers() {
      // Initialize Gulf Coast Map layer
      if (!gulfCoastMapRef.current) {
        console.log("useMapLayers: Creating Gulf Coast Helicopter Map layer...");
        gulfCoastMapRef.current = new GulfCoastHeliMap(mapManagerRef.current);
        
        // Initialize the layer
        gulfCoastMapRef.current.initialize().then(() => {
          console.log("useMapLayers: Gulf Coast Helicopter Map layer initialized successfully");
        }).catch(error => {
          console.error("useMapLayers: Failed to initialize Gulf Coast Helicopter Map layer:", error);
        });
      }
      
      // ALWAYS create weather layer adapter - even if weather system isn't ready
      if (!weatherLayerRef.current) {
        console.log("useMapLayers: Creating Weather layer adapter (always available)...");
        weatherLayerRef.current = {
          toggle: async () => {
            try {
              console.log('🌤️ Weather overlay toggle clicked!');
              
              // Check if weather system is available and initialized
              if (!window.weatherTest?.weatherManager) {
                console.warn('🌤️ Weather system not available - initializing...');
                try {
                  const { initializeWeatherSystem } = await import('../modules/WeatherLoader.js');
                  await initializeWeatherSystem();
                } catch (importError) {
                  console.error('❌ Could not import weather system:', importError);
                  return false;
                }
              }

              if (!window.weatherTest?.weatherManager) {
                console.error('❌ Weather system could not be initialized');
                return false;
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
              
              return newVisible;
            } catch (error) {
              console.error('❌ Error toggling weather layer:', error);
              return false;
            }
          },
          isVisible: () => window.weatherTest?.weatherManager?.isWeatherVisible || false
        };
        console.log("useMapLayers: Weather layer adapter created (always available)");
      }
      
      setLayersInitialized(true);
    }
    
    return () => {
      // Clean up layers on unmount
      console.log("useMapLayers: Cleaning up map layers on unmount");
      
      if (gulfCoastMapRef.current && gulfCoastMapRef.current.remove) {
        gulfCoastMapRef.current.remove();
      }
      
      if (weatherLayerRef.current && weatherLayerRef.current.remove) {
        weatherLayerRef.current.remove();
      }
      
      if (vfrChartsRef.current && vfrChartsRef.current.remove) {
        vfrChartsRef.current.remove();
      }
    };
  }, [mapManagerRef, layersInitialized]);
  
  // Update layer visibility based on region
  useEffect(() => {
    if (!layersInitialized || !currentRegion || !gulfCoastMapRef.current) return;
    
    // Show Gulf Coast layer only in Gulf of Mexico region
    if (currentRegion.id === 'gulf-of-mexico') {
      if (!gulfCoastMapRef.current.isDisplayed && layerStates.gulfCoastHeli) {
        gulfCoastMapRef.current.loadAndDisplay();
      }
    } else {
      if (gulfCoastMapRef.current.isDisplayed) {
        gulfCoastMapRef.current.remove();
      }
    }
  }, [currentRegion, layersInitialized, layerStates.gulfCoastHeli]);

  // Function to toggle layer visibility
  const toggleLayer = async (layerName) => {
    try {
      switch (layerName) {
        case 'gulfCoastHeli':
          if (gulfCoastMapRef.current) {
            const isVisible = await gulfCoastMapRef.current.toggle();
            setLayerStates(prev => ({ ...prev, gulfCoastHeli: isVisible }));
            return isVisible;
          }
          break;
          
        case 'weather':
          if (weatherLayerRef.current) {
            const isVisible = await weatherLayerRef.current.toggle();
            setLayerStates(prev => ({ ...prev, weather: isVisible }));
            return isVisible;
          }
          break;
          
        case 'vfrCharts':
          if (vfrChartsRef.current) {
            const isVisible = await vfrChartsRef.current.toggle();
            setLayerStates(prev => ({ ...prev, vfrCharts: isVisible }));
            return isVisible;
          }
          break;
          
        default:
          console.warn(`Unknown layer: ${layerName}`);
      }
      return false;
    } catch (error) {
      console.error(`Error toggling layer ${layerName}:`, error);
      return false;
    }
  };

  return {
    gulfCoastMapRef,
    weatherLayerRef,
    vfrChartsRef,
    layerStates,
    toggleLayer
  };
};

export default useMapLayers;