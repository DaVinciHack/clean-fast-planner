/**
 * RigWeatherGraphics.js
 * 
 * Creates dynamic, flat-lying weather graphics for offshore rig locations
 * Similar to radar display with concentric rings, wind arrows, and aviation data
 * 
 * Features:
 * - Wind arrows with color-coded strength (Green <15, Yellow 15-39, Orange 40-59, Red 60+ kts)
 * - Visibility rings colored by flight category (VFR/MVFR/IFR/LIFR)
 * - Cloud coverage shown as concentric rings
 * - Flat rendering below route lines
 * - Hover interactions for detailed weather
 */

class RigWeatherGraphics {
  constructor(map) {
    this.map = map;
    this.sourceId = 'rig-weather-graphics-source';
    this.layerId = 'rig-weather-graphics-layer';
    this.windArrowsLayerId = 'rig-wind-arrows-layer';
    this.currentGraphics = [];
    
    // Wind speed thresholds (knots) - as specified
    this.windThresholds = {
      green: { min: 0, max: 14, color: '#4CAF50' },      // Below 15
      yellow: { min: 15, max: 39, color: '#FFC107' },    // 15 and above  
      orange: { min: 40, max: 59, color: '#FF9800' },    // 40 and above
      red: { min: 60, max: 999, color: '#F44336' }       // 60 and above
    };
    
    // Visibility colors (aviation standard)
    this.visibilityColors = {
      vfr: '#4CAF50',    // >5 miles - Green
      mvfr: '#FFC107',   // 3-5 miles - Yellow  
      ifr: '#FF9800',    // 1-3 miles - Orange
      lifr: '#F44336'    // <1 mile - Red
    };
    
    // Ring configuration for flat map display
    this.ringConfig = {
      baseRadius: 1000,        // meters - outer ring
      innerRingRatio: 0.7,     // 70% of base for inner ring
      centerRatio: 0.4,        // 40% of base for center
      strokeWidth: 2,
      opacity: 0.7
    };
    
    console.log('🎯 RigWeatherGraphics initialized');
  }

  /**
   * Add weather graphics for multiple rig locations
   * @param {Array} rigWeatherData - Array of rig weather objects
   */
  addRigWeatherGraphics(rigWeatherData) {
    if (!rigWeatherData || !this.map) {
      console.warn('RigWeatherGraphics: Missing weather data or map');
      return;
    }

    console.log(`🎯 Creating weather graphics for ${rigWeatherData.length} rigs`);
    
    // Clear existing graphics
    this.removeRigWeatherGraphics();
    
    // Store current graphics
    this.currentGraphics = rigWeatherData;
    
    // Create ring graphics (flat on map, below routes)
    this.createWeatherRings(rigWeatherData);
    
    // Create wind arrows (above rings, below routes)
    this.createWindArrows(rigWeatherData);
    
    // Add hover interactions
    this.addHoverInteractions();
    
    console.log(`✅ Weather graphics created for ${rigWeatherData.length} rig locations`);
  }

  /**
   * Create concentric rings for each rig based on cloud coverage and visibility
   * @private
   */
  createWeatherRings(rigWeatherData) {
    const ringFeatures = [];
    
    rigWeatherData.forEach(rig => {
      const rings = this.generateRingFeatures(rig);
      ringFeatures.push(...rings);
    });

    // Add rings source and layer (rendered flat and below routes)
    if (ringFeatures.length > 0) {
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: ringFeatures
        }
      });

      // Add fill layer for rings (flat on map surface)
      this.map.addLayer({
        id: this.layerId + '-fill',
        type: 'fill',
        source: this.sourceId,
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': ['get', 'fillOpacity']
        }
      }, this.findInsertionPoint()); // Insert below route layer

      // Add stroke layer for ring outlines
      this.map.addLayer({
        id: this.layerId + '-stroke', 
        type: 'line',
        source: this.sourceId,
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-width': ['get', 'strokeWidth'],
          'line-opacity': ['get', 'strokeOpacity']
        }
      }, this.findInsertionPoint()); // Insert below route layer
    }
  }

  /**
   * Find the correct layer to insert below (routes, waypoints, etc.)
   * @private
   */
  findInsertionPoint() {
    const layers = this.map.getStyle().layers;
    
    // Look for route or waypoint layers to insert below
    const targetLayers = [
      'route-layer',
      'waypoints-layer', 
      'flight-path-layer',
      'live-weather-symbols', // Insert below existing weather
      'weather-circles-layer'
    ];
    
    for (const targetLayer of targetLayers) {
      if (layers.find(layer => layer.id === targetLayer)) {
        return targetLayer;
      }
    }
    
    // Default: insert above base map but below everything else
    return undefined;
  }

  /**
   * Generate ring features for a single rig location
   * @private
   */
  generateRingFeatures(rig) {
    const { latitude, longitude, cloudCoverage, flightCategory, rigName } = rig;
    const rings = [];
    
    // Determine visibility color based on flight category
    const visibilityColor = this.getVisibilityColor(flightCategory);
    
    // Create rings based on cloud coverage
    const cloudPercent = cloudCoverage || 0;
    
    // Outer ring (always present - represents visibility)
    rings.push(this.createRingFeature({
      center: [longitude, latitude],
      radius: this.ringConfig.baseRadius,
      fillColor: visibilityColor,
      fillOpacity: 0.1,
      strokeColor: visibilityColor,
      strokeWidth: 3,
      strokeOpacity: 0.8,
      rigName,
      ringType: 'visibility',
      data: rig
    }));

    // Inner rings based on cloud coverage
    if (cloudPercent >= 25) {
      // First inner ring (25-50% clouds)
      rings.push(this.createRingFeature({
        center: [longitude, latitude],
        radius: this.ringConfig.baseRadius * this.ringConfig.innerRingRatio,
        fillColor: visibilityColor,
        fillOpacity: 0.15,
        strokeColor: visibilityColor,
        strokeWidth: 2,
        strokeOpacity: 0.6,
        rigName,
        ringType: 'cloud-coverage-1',
        data: rig
      }));
    }

    if (cloudPercent >= 50) {
      // Second inner ring (50-75% clouds)
      rings.push(this.createRingFeature({
        center: [longitude, latitude],
        radius: this.ringConfig.baseRadius * this.ringConfig.centerRatio,
        fillColor: visibilityColor,
        fillOpacity: 0.2,
        strokeColor: visibilityColor,
        strokeWidth: 2,
        strokeOpacity: 0.6,
        rigName,
        ringType: 'cloud-coverage-2', 
        data: rig
      }));
    }

    if (cloudPercent >= 75) {
      // Center filled circle (75-100% clouds)
      rings.push(this.createRingFeature({
        center: [longitude, latitude],
        radius: this.ringConfig.baseRadius * 0.2,
        fillColor: visibilityColor,
        fillOpacity: 0.4,
        strokeColor: visibilityColor,
        strokeWidth: 1,
        strokeOpacity: 0.8,
        rigName,
        ringType: 'cloud-coverage-3',
        data: rig
      }));
    }

    return rings;
  }

  /**
   * Create wind arrows for each rig location  
   * @private
   */
  createWindArrows(rigWeatherData) {
    const arrowFeatures = [];
    
    rigWeatherData.forEach(rig => {
      const arrow = this.generateWindArrowFeature(rig);
      if (arrow) {
        arrowFeatures.push(arrow);
      }
    });

    if (arrowFeatures.length > 0) {
      const arrowSourceId = this.sourceId + '-arrows';
      
      this.map.addSource(arrowSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: arrowFeatures
        }
      });

      // Add wind arrow symbols (using Unicode arrow or custom styling)
      this.map.addLayer({
        id: this.windArrowsLayerId,
        type: 'symbol',
        source: arrowSourceId,
        layout: {
          'text-field': '↑', // Unicode arrow - will be rotated
          'text-font': ['Arial Unicode MS Bold'],
          'text-size': 20,
          'text-rotate': ['get', 'windDirection'],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': ['get', 'windColor'],
          'text-opacity': 0.9,
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      }, this.findInsertionPoint()); // Insert below route layer

      // Add wind speed labels
      this.map.addLayer({
        id: this.windArrowsLayerId + '-labels',
        type: 'symbol',
        source: arrowSourceId,
        layout: {
          'text-field': ['get', 'windSpeedText'],
          'text-font': ['Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 2.5],
          'text-anchor': 'top',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': ['get', 'windColor'],
          'text-halo-color': '#000000',
          'text-halo-width': 2
        }
      }, this.findInsertionPoint());
    }
  }

  /**
   * Generate wind arrow feature for a single rig
   * @private
   */
  generateWindArrowFeature(rig) {
    const { latitude, longitude, windSpeed, windDirection, rigName } = rig;
    
    if (!windSpeed || windSpeed === 0) {
      return null; // No arrow for calm conditions
    }

    // Determine wind color based on speed thresholds
    const windColor = this.getWindColor(windSpeed);

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      properties: {
        rigName,
        windSpeed,
        windDirection: windDirection || 0,
        windColor,
        windSpeedText: `${Math.round(windSpeed)}kt`,
        data: JSON.stringify(rig)
      }
    };
  }

  /**
   * Create individual ring feature
   * @private
   */
  createRingFeature(config) {
    const { center, radius, fillColor, fillOpacity, strokeColor, strokeWidth, strokeOpacity, rigName, ringType, data } = config;
    
    // Create circle geometry
    const circle = this.createCircleGeometry(center, radius);
    
    return {
      type: 'Feature',
      geometry: circle,
      properties: {
        rigName,
        ringType,
        fillColor,
        fillOpacity,
        strokeColor,
        strokeWidth,
        strokeOpacity,
        data: JSON.stringify(data)
      }
    };
  }

  /**
   * Create circle geometry for ring
   * @private  
   */
  createCircleGeometry(center, radius) {
    const points = 64; // Number of points for smooth circle
    const coordinates = [];
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radius * Math.cos(angle);
      const dy = radius * Math.sin(angle);
      
      // Convert meters to approximate degrees
      const deltaLat = dy / 111320; // meters to degrees latitude
      const deltaLon = dx / (111320 * Math.cos(center[1] * Math.PI / 180)); // adjust for longitude
      
      coordinates.push([
        center[0] + deltaLon,
        center[1] + deltaLat
      ]);
    }
    
    return {
      type: 'Polygon',
      coordinates: [coordinates]
    };
  }

  /**
   * Get wind color based on speed thresholds
   * @private
   */
  getWindColor(windSpeed) {
    if (windSpeed >= 60) return this.windThresholds.red.color;
    if (windSpeed >= 40) return this.windThresholds.orange.color;  
    if (windSpeed >= 15) return this.windThresholds.yellow.color;
    return this.windThresholds.green.color;
  }

  /**
   * Get visibility color based on flight category
   * @private
   */
  getVisibilityColor(flightCategory) {
    switch (flightCategory?.toUpperCase()) {
      case 'VFR': return this.visibilityColors.vfr;
      case 'MVFR': return this.visibilityColors.mvfr;
      case 'IFR': return this.visibilityColors.ifr;
      case 'LIFR': return this.visibilityColors.lifr;
      default: return this.visibilityColors.vfr; // Default to VFR
    }
  }

  /**
   * Add hover interactions for detailed weather info
   * @private
   */
  addHoverInteractions() {
    // Create popup for detailed weather display
    this.popup = new window.mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'rig-weather-popup',
      maxWidth: '300px'
    });

    // Add hover for rings
    this.map.on('mouseenter', this.layerId + '-fill', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      this.showWeatherPopup(e);
    });

    this.map.on('mouseleave', this.layerId + '-fill', () => {
      this.map.getCanvas().style.cursor = '';
      this.popup.remove();
    });

    // Add hover for wind arrows
    this.map.on('mouseenter', this.windArrowsLayerId, (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      this.showWeatherPopup(e);
    });

    this.map.on('mouseleave', this.windArrowsLayerId, () => {
      this.map.getCanvas().style.cursor = '';
      this.popup.remove();
    });

    // Add hover for wind labels
    this.map.on('mouseenter', this.windArrowsLayerId + '-labels', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      this.showWeatherPopup(e);
    });

    this.map.on('mouseleave', this.windArrowsLayerId + '-labels', () => {
      this.map.getCanvas().style.cursor = '';
      this.popup.remove();
    });
  }

  /**
   * Show detailed weather popup on hover
   * @private
   */
  showWeatherPopup(e) {
    const feature = e.features[0];
    const properties = feature.properties;
    
    let weatherData;
    try {
      weatherData = JSON.parse(properties.data);
    } catch (error) {
      console.warn('Error parsing weather data for popup:', error);
      return;
    }
    
    const popupContent = this.createDetailedWeatherPopup(weatherData);
    
    this.popup.setLngLat(e.lngLat)
             .setHTML(popupContent)
             .addTo(this.map);
  }

  /**
   * Create detailed weather popup content
   * @private
   */
  createDetailedWeatherPopup(rig) {
    const {
      rigName,
      temperature,
      windSpeed,
      windDirection,
      windGust,
      visibility,
      ceiling,
      flightCategory,
      cloudCoverage,
      conditions,
      dewPoint
    } = rig;

    // Wind display with gusts
    const windDisplay = windGust && windGust > windSpeed ? 
      `${Math.round(windSpeed)}G${Math.round(windGust)} kts @ ${Math.round(windDirection)}°` :
      `${Math.round(windSpeed)} kts @ ${Math.round(windDirection)}°`;

    // Flight category badge color
    const categoryColor = this.getVisibilityColor(flightCategory);

    return `
      <div style="padding: 8px; background-color: rgba(0,0,0,0.9); border-radius: 4px; border-left: 3px solid #40c8f0;">
        <strong style="color: #40c8f0; font-size: 14px;">🚁 ${rigName}</strong>
        
        <div style="margin-top: 8px; padding: 4px 8px; background-color: ${categoryColor}; border-radius: 3px; text-align: center;">
          <strong style="color: white; font-size: 12px;">${flightCategory || 'VFR'} CONDITIONS</strong>
        </div>
        
        <div style="font-size: 12px; color: #e0e0e0; margin-top: 8px; line-height: 1.4;">
          <strong>Ceiling:</strong> ${ceiling ? `${ceiling} ft AGL` : 'Unlimited'}<br>
          <strong>Visibility:</strong> ${visibility || 'N/A'} SM<br>
          <strong>Wind:</strong> ${windDisplay}<br>
          <strong>Cloud Coverage:</strong> ${cloudCoverage || 0}%<br>
          <strong>Temperature:</strong> ${Math.round(temperature || 0)}°F<br>
          ${dewPoint ? `<strong>Dew Point:</strong> ${Math.round(dewPoint)}°F<br>` : ''}
          <strong>Conditions:</strong> ${conditions || 'Clear'}<br>
        </div>
        
        <div style="font-size: 10px; color: #888; margin-top: 6px; text-align: center;">
          Aviation Weather • Updated: ${new Date().toLocaleTimeString()}
        </div>
      </div>
    `;
  }

  /**
   * Remove all rig weather graphics from map
   */
  removeRigWeatherGraphics() {
    try {
      // Remove ring layers
      if (this.map.getLayer(this.layerId + '-fill')) {
        this.map.removeLayer(this.layerId + '-fill');
      }
      if (this.map.getLayer(this.layerId + '-stroke')) {
        this.map.removeLayer(this.layerId + '-stroke');
      }

      // Remove wind arrow layers  
      if (this.map.getLayer(this.windArrowsLayerId)) {
        this.map.removeLayer(this.windArrowsLayerId);
      }
      if (this.map.getLayer(this.windArrowsLayerId + '-labels')) {
        this.map.removeLayer(this.windArrowsLayerId + '-labels');
      }

      // Remove sources
      if (this.map.getSource(this.sourceId)) {
        this.map.removeSource(this.sourceId);
      }
      if (this.map.getSource(this.sourceId + '-arrows')) {
        this.map.removeSource(this.sourceId + '-arrows');
      }

      // Remove event listeners
      this.map.off('mouseenter', this.layerId + '-fill');
      this.map.off('mouseleave', this.layerId + '-fill');
      this.map.off('mouseenter', this.windArrowsLayerId);
      this.map.off('mouseleave', this.windArrowsLayerId);
      this.map.off('mouseenter', this.windArrowsLayerId + '-labels');
      this.map.off('mouseleave', this.windArrowsLayerId + '-labels');

      // Remove popup
      if (this.popup) {
        this.popup.remove();
        this.popup = null;
      }

      this.currentGraphics = [];
      console.log('✅ Rig weather graphics removed');
      
    } catch (error) {
      console.error('Error removing rig weather graphics:', error);
    }
  }

  /**
   * Update graphics with new weather data
   */
  updateWeatherGraphics(rigWeatherData) {
    this.addRigWeatherGraphics(rigWeatherData);
  }

  /**
   * Toggle graphics visibility
   */
  toggleVisibility(visible) {
    const visibility = visible ? 'visible' : 'none';
    
    // Toggle ring layers
    if (this.map.getLayer(this.layerId + '-fill')) {
      this.map.setLayoutProperty(this.layerId + '-fill', 'visibility', visibility);
    }
    if (this.map.getLayer(this.layerId + '-stroke')) {
      this.map.setLayoutProperty(this.layerId + '-stroke', 'visibility', visibility);
    }

    // Toggle wind arrow layers
    if (this.map.getLayer(this.windArrowsLayerId)) {
      this.map.setLayoutProperty(this.windArrowsLayerId, 'visibility', visibility);
    }
    if (this.map.getLayer(this.windArrowsLayerId + '-labels')) {
      this.map.setLayoutProperty(this.windArrowsLayerId + '-labels', 'visibility', visibility);
    }
  }

  /**
   * Get current graphics data
   */
  getCurrentGraphics() {
    return this.currentGraphics;
  }

  /**
   * Check if graphics are currently displayed
   */
  hasGraphics() {
    return this.currentGraphics.length > 0;
  }
}

export default RigWeatherGraphics;