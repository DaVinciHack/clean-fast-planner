/**
 * SARRangeCircle.jsx
 * 
 * React component wrapper for SAR range circle visualization on the map.
 * Integrates with the MapBox GL layer system and follows established visualization patterns.
 * Displays operational radius for Search and Rescue operations using real aircraft calculations.
 * 
 * @aviation-safety: Only displays ranges based on real aircraft performance data
 * @integration: Works with MapBox GL through WaypointManager layer system
 */

import React, { useEffect, useRef } from 'react';

/**
 * SAR Range Circle Layer Class
 * Manages MapBox GL layers for SAR operational radius visualization
 */
class SARRangeCircleLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'sar-range-circle-source';
    this.layerId = 'sar-range-circle-layer';
    this.strokeLayerId = 'sar-range-circle-stroke-layer';
    this.helicopterSourceId = 'sar-helicopter-source';
    this.helicopterLayerId = 'sar-helicopter-layer';
    this.isVisible = false;
    this.currentRange = null;
  }

  /**
   * Add SAR range circle to map
   * @param {Object} options - Range circle configuration
   * @param {Array} options.coordinates - [lng, lat] center coordinates
   * @param {number} options.radiusNM - Radius in nautical miles
   * @param {Object} options.aircraft - Aircraft object for labeling
   * @param {string} options.color - Circle color (default: SAR orange)
   * @param {number} options.opacity - Fill opacity (default: 0.2)
   */
  addRangeCircle(options) {
    const {
      coordinates,
      radiusNM,
      aircraft = {},
      color = '#FF6B35', // SAR orange
      opacity = 0.2
    } = options;

    if (!coordinates || !radiusNM || radiusNM <= 0) {
      console.warn('Invalid SAR range circle parameters');
      return;
    }

    // Convert nautical miles to kilometers for Turf.js
    const radiusKM = radiusNM * 1.852;

    try {
      // Clean up existing circle
      this.removeRangeCircle();

      // Check if Turf.js is available
      if (!window.turf) {
        console.error('Turf.js not available for SAR range circle generation');
        return;
      }

      // Create circle geometry using Turf.js (following WeatherCirclesLayer pattern)
      const center = window.turf.point(coordinates);
      const circle = window.turf.buffer(center, radiusKM, { units: 'kilometers' });

      // Create feature with properties
      const circleFeature = {
        type: 'Feature',
        geometry: circle.geometry,
        properties: {
          radius: radiusNM,
          radiusKM: radiusKM,
          aircraft: aircraft.registration || aircraft.name || 'Unknown Aircraft',
          aircraftModel: aircraft.modelType || aircraft.modelName || '',
          color: color,
          opacity: opacity,
          type: 'sar-operational-range',
          createdAt: new Date().toISOString()
        }
      };

      // Add source to map
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [circleFeature]
        }
      });

      // Find appropriate layer to insert before (maintain z-order)
      const beforeLayer = this.findRouteLayer();

      // Add fill layer (check if it doesn't already exist)
      if (!this.map.getLayer(this.layerId)) {
        this.map.addLayer({
          id: this.layerId,
          type: 'fill',
          source: this.sourceId,
          paint: {
            'fill-color': 'transparent',
            'fill-opacity': 0
          },
          metadata: {
            purpose: 'sar-range-visualization',
            aircraftId: aircraft.id || 'unknown'
          }
        }, beforeLayer);
      }

      // Add helicopter icon at center
      this.addHelicopterIcon(coordinates);

      // Add stroke layer for better visibility (check if it doesn't already exist)
      if (!this.map.getLayer(this.strokeLayerId)) {
        this.map.addLayer({
          id: this.strokeLayerId,
          type: 'line',
          source: this.sourceId,
          paint: {
            'line-color': '#FF0000',
            'line-width': 3,
            'line-opacity': 1.0,
            'line-blur': 0.5 // Creates a subtle glow/shadow effect
          },
          metadata: {
            purpose: 'sar-range-stroke',
            aircraftId: aircraft.id || 'unknown'
          }
        }, beforeLayer);
      }

      this.isVisible = true;
      this.currentRange = {
        coordinates,
        radiusNM,
        aircraft,
        color,
        opacity
      };

      console.log(`SAR range circle added: ${radiusNM} NM radius for ${aircraft.registration || 'aircraft'}`);

    } catch (error) {
      console.error('Error adding SAR range circle:', error);
    }
  }

  /**
   * Add helicopter icon at operational position
   * @param {Array} coordinates - [lng, lat] center coordinates
   */
  addHelicopterIcon(coordinates) {
    try {
      // Remove existing helicopter icon
      if (this.map.getLayer(this.helicopterLayerId)) {
        this.map.removeLayer(this.helicopterLayerId);
      }
      if (this.map.getSource(this.helicopterSourceId)) {
        this.map.removeSource(this.helicopterSourceId);
      }

      // Create helicopter point feature
      const helicopterFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        properties: {
          type: 'sar-helicopter',
          title: 'SAR Operational Position'
        }
      };

      // Add helicopter source
      this.map.addSource(this.helicopterSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [helicopterFeature]
        }
      });

      // Create animated helicopter overlay using DOM element
      this.createAnimatedHelicopterOverlay(coordinates);

    } catch (error) {
      console.error('Error adding helicopter icon:', error);
    }
  }

  /**
   * Create animated helicopter overlay using DOM element
   */
  createAnimatedHelicopterOverlay(coordinates) {
    try {
      // Remove existing overlay if present
      if (this.helicopterOverlay) {
        this.helicopterOverlay.remove();
      }

      // Create helicopter element
      const helicopterEl = document.createElement('img');
      helicopterEl.src = `${import.meta.env.BASE_URL}assets/icons/helicopter-spinning.gif`;
      helicopterEl.style.width = '48px';
      helicopterEl.style.height = '48px';
      helicopterEl.style.pointerEvents = 'none';
      helicopterEl.style.transform = 'translate(-50%, -50%)'; // Center the image
      helicopterEl.style.zIndex = '1000'; // Above everything
      helicopterEl.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'; // Drop shadow for 3D effect

      // Create Mapbox marker (DOM overlay)
      this.helicopterOverlay = new mapboxgl.Marker({
        element: helicopterEl,
        anchor: 'center'
      })
      .setLngLat(coordinates)
      .addTo(this.map);

      console.log('🚁 Animated helicopter overlay created at:', coordinates);
    } catch (error) {
      console.error('Error creating helicopter overlay:', error);
    }
  }

  /**
   * Remove SAR range circle from map
   */
  removeRangeCircle() {
    try {
      // Remove layers (following established cleanup pattern)
      if (this.map.getLayer(this.layerId)) {
        this.map.removeLayer(this.layerId);
      }
      if (this.map.getLayer(this.strokeLayerId)) {
        this.map.removeLayer(this.strokeLayerId);
      }
      
      // Remove helicopter layer
      if (this.map.getLayer(this.helicopterLayerId)) {
        this.map.removeLayer(this.helicopterLayerId);
      }
      
      // Remove sources
      if (this.map.getSource(this.sourceId)) {
        this.map.removeSource(this.sourceId);
      }
      if (this.map.getSource(this.helicopterSourceId)) {
        this.map.removeSource(this.helicopterSourceId);
      }

      // Remove helicopter overlay
      if (this.helicopterOverlay) {
        this.helicopterOverlay.remove();
        this.helicopterOverlay = null;
      }

      this.isVisible = false;
      this.currentRange = null;

    } catch (error) {
      console.error('Error removing SAR range circle:', error);
    }
  }

  /**
   * Update existing range circle (more efficient than remove/add)
   * @param {Object} options - New range circle options
   */
  updateRangeCircle(options) {
    if (!this.isVisible) {
      this.addRangeCircle(options);
      return;
    }

    const {
      coordinates,
      radiusNM,
      aircraft = {},
      color = '#FF6B35',
      opacity = 0.2
    } = options;

    // Check if significant change warrants update
    if (this.currentRange && 
        this.currentRange.radiusNM === radiusNM &&
        this.currentRange.coordinates[0] === coordinates[0] &&
        this.currentRange.coordinates[1] === coordinates[1]) {
      return; // No significant change
    }

    this.addRangeCircle(options);
  }

  /**
   * Set visibility of range circle
   * @param {boolean} visible - Whether circle should be visible
   */
  setVisibility(visible) {
    if (!this.map.getLayer(this.layerId)) return;

    const visibility = visible ? 'visible' : 'none';
    
    this.map.setLayoutProperty(this.layerId, 'visibility', visibility);
    this.map.setLayoutProperty(this.strokeLayerId, 'visibility', visibility);
    
    // Also handle helicopter layer visibility
    if (this.map.getLayer(this.helicopterLayerId)) {
      this.map.setLayoutProperty(this.helicopterLayerId, 'visibility', visibility);
    }
    
    this.isVisible = visible;
  }

  /**
   * Find first route layer for proper z-ordering
   * @returns {string|undefined} Layer ID to insert before
   */
  findRouteLayer() {
    try {
      const layers = this.map.getStyle()?.layers || [];
      const routeLayerPatterns = [
        'route-shadow',
        'route-glow', 
        'route',
        'waypoint',
        'platform',
        'rig'
      ];
      
      for (const pattern of routeLayerPatterns) {
        const layer = layers.find(l => l.id && l.id.includes(pattern));
        if (layer) {
          return layer.id;
        }
      }
      
      return undefined; // Insert at top if no route layers found
    } catch (error) {
      console.warn('Error finding route layer for SAR circle z-order:', error);
      return undefined;
    }
  }

  /**
   * Get current range information
   * @returns {Object|null} Current range data or null if not visible
   */
  getCurrentRange() {
    return this.currentRange;
  }

  /**
   * Check if range circle is currently visible
   * @returns {boolean} Visibility status
   */
  getVisibility() {
    return this.isVisible;
  }
}

/**
 * React Component for SAR Range Circle
 * @param {Object} props - Component props
 * @param {Object} props.mapManager - MapManager instance
 * @param {Object} props.center - Center coordinates {lat, lng}
 * @param {number} props.radiusNM - Radius in nautical miles
 * @param {boolean} props.visible - Whether circle should be visible
 * @param {Object} props.aircraft - Aircraft data for labeling
 * @param {string} props.color - Circle color
 * @param {number} props.opacity - Fill opacity
 * @param {Function} props.onCircleUpdate - Callback when circle updates
 */
const SARRangeCircle = ({
  mapManager,
  center,
  radiusNM,
  visible = true,
  aircraft = {},
  color = '#FF6B35',
  opacity = 0.2,
  onCircleUpdate
}) => {
  const layerRef = useRef(null);

  // Initialize layer when map is available
  useEffect(() => {
    if (mapManager && mapManager.map && !layerRef.current) {
      layerRef.current = new SARRangeCircleLayer(mapManager.map);
      
      if (onCircleUpdate) {
        onCircleUpdate(layerRef.current);
      }
    }

    // Cleanup on unmount
    return () => {
      if (layerRef.current) {
        layerRef.current.removeRangeCircle();
        layerRef.current = null;
      }
    };
  }, [mapManager, onCircleUpdate]);

  // Update circle when parameters change
  useEffect(() => {
    if (!layerRef.current || !center || !radiusNM) {
      return;
    }

    if (visible && radiusNM > 0) {
      layerRef.current.updateRangeCircle({
        coordinates: [center.lng, center.lat],
        radiusNM,
        aircraft,
        color,
        opacity
      });
    } else {
      layerRef.current.removeRangeCircle();
    }
  }, [center, radiusNM, visible, aircraft, color, opacity]);

  // Control visibility
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setVisibility(visible);
    }
  }, [visible]);

  // This component renders nothing directly - all visualization is handled by MapBox GL layers
  return null;
};

// Export both the component and the layer class for flexibility
export { SARRangeCircleLayer };
export default SARRangeCircle;