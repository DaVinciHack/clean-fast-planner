import React, { useState, useEffect } from 'react';
import { useRegion } from '../../context/region';
import './MapLayersPanel.css';

/**
 * Map Layers Panel Component
 * 
 * Provides controls for toggling various map overlays including
 * the Gulf Coast helicopter map, weather data, and VFR charts
 */
const MapLayersPanel = ({ 
  mapManagerRef, 
  gulfCoastMapRef,
  weatherLayerRef,
  vfrChartsRef,
  isOpen,
  onClose
}) => {
  const { currentRegion } = useRegion();
  const [layers, setLayers] = useState({
    gulfCoastHeli: false,
    weather: false,
    vfrCharts: false,
    grid: true,
    platforms: true
  });
  
  // Update layer states when references change
  useEffect(() => {
    if (gulfCoastMapRef?.current) {
      setLayers(prev => ({
        ...prev,
        gulfCoastHeli: gulfCoastMapRef.current.isDisplayed
      }));
    }
    
    // Update other layer states when their refs become available
    // This will be implemented as other layers are added
  }, [gulfCoastMapRef, weatherLayerRef, vfrChartsRef]);
  
  // Toggle a layer
  const toggleLayer = async (layerName) => {
    try {
      switch (layerName) {
        case 'gulfCoastHeli':
          if (gulfCoastMapRef?.current) {
            const isVisible = await gulfCoastMapRef.current.toggle();
            setLayers(prev => ({ ...prev, gulfCoastHeli: isVisible }));
          }
          break;
          
        case 'weather':
          if (weatherLayerRef?.current) {
            const isVisible = await weatherLayerRef.current.toggle();
            setLayers(prev => ({ ...prev, weather: isVisible }));
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
          
        case 'platforms':
          if (mapManagerRef?.current) {
            // Toggle platform visibility
            const map = mapManagerRef.current.getMap();
            if (map) {
              const platformsVisible = !layers.platforms;
              
              // Toggle visibility of platform layers
              ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'].forEach(layerId => {
                if (map.getLayer(layerId)) {
                  map.setLayoutProperty(
                    layerId,
                    'visibility',
                    platformsVisible ? 'visible' : 'none'
                  );
                }
              });
              
              setLayers(prev => ({ ...prev, platforms: platformsVisible }));
            }
          }
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
    return (
      <div className="map-layer-toggle">
        <button
          className={`toggle-button ${layers[id] ? 'active' : 'inactive'}`}
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
  
  if (!isOpen) return null;
  
  return (
    <div className="map-layers-panel">
      <div className="panel-header">
        <h3>Map Layers</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="layer-section">
          <h4>Base Layers</h4>
          {renderLayerToggle('grid', 'Coordinate Grid')}
          {renderLayerToggle('platforms', 'Platforms & Airfields')}
        </div>
        
        <div className="layer-section">
          <h4>Region-Specific Layers</h4>
          {/* Only show Gulf Coast layer when in Gulf of Mexico */}
          {renderLayerToggle(
            'gulfCoastHeli', 
            'Gulf Coast Helicopter Map', 
            currentRegion?.id === 'gulf-of-mexico' && !!gulfCoastMapRef?.current
          )}
        </div>
        
        <div className="layer-section">
          <h4>Aviation Layers</h4>
          {renderLayerToggle('weather', 'Weather Overlay', !!weatherLayerRef?.current)}
          {renderLayerToggle('vfrCharts', 'VFR Charts', !!vfrChartsRef?.current)}
        </div>
        
        <div className="layer-info">
          <p>* Layers marked with an asterisk are not available in the current region.</p>
        </div>
      </div>
    </div>
  );
};

export default MapLayersPanel;
