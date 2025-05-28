/**
 * WeatherSegmentsLayer.js
 * 
 * Map layer for displaying Norwegian weather segments with aviation-specific coloring
 */

class WeatherSegmentsLayer {
  constructor(map) {
    this.map = map;
    this.layerId = 'weather-segments-layer';
    this.alternateLayerId = 'alternate-segments-layer';
    this.isVisible = false;
    this.currentSegments = [];
    this.currentAlternates = [];
  }
  
  /**
   * Add weather segments to the map
   */
  addWeatherSegments(weatherData) {
    if (!weatherData || !this.map) return;
    
    this.currentSegments = weatherData.segments || [];
    this.currentAlternates = weatherData.alternates || [];
    
    this.addMainSegments();
    this.addAlternateSegments();
    
    this.isVisible = true;
  }
  
  /**
   * Add main route weather segments to map
   */
  addMainSegments() {
    if (!this.currentSegments.length) return;
    
    this.removeMainSegments();
    
    const features = this.currentSegments
      .filter(segment => segment.geoPoint)
      .map(segment => this.createSegmentFeature(segment, 'main'));
    
    if (features.length === 0) return;
    
    // Add source and layers for main segments
    this.map.addSource(this.layerId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });
    
    // Add circle layer for segment points with ranking colors
    this.map.addLayer({
      id: this.layerId,
      type: 'circle',
      source: this.layerId,
      paint: {
        'circle-radius': [
          'case',
          ['get', 'priority'], 1, 12, 2, 10, 3, 8, 6
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });
  }  
  /**
   * Create feature for a weather segment
   */
  createSegmentFeature(segment, type) {
    const coords = this.parseGeoPoint(segment.geoPoint);
    if (!coords) return null;
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords
      },
      properties: {
        airportIcao: segment.airportIcao || 'Unknown',
        color: segment.color || '#2196F3',
        priority: segment.priority || 5,
        windSpeed: segment.windSpeed || 0,
        windDirection: segment.windDirection || 0,
        ranking: segment.alternateRanking || 0,
        type: type,
        warnings: segment.warnings || '',
        isRig: segment.isRig || false,
        araRequired: segment.araRequired || false
      }
    };
  }
  
  /**
   * Parse geoPoint string to coordinates
   */
  parseGeoPoint(geoPoint) {
    if (!geoPoint) return null;
    
    try {
      const parts = geoPoint.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lon = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lon)) {
          return [lon, lat]; // GeoJSON format: [longitude, latitude]
        }
      }
    } catch (error) {
      console.error('WeatherSegmentsLayer: Error parsing geoPoint:', geoPoint, error);
    }
    
    return null;
  }
  
  /**
   * Add alternate segments
   */
  addAlternateSegments() {
    // Implementation for alternate segments
    console.log('WeatherSegmentsLayer: Adding alternate segments');
  }
  
  /**
   * Remove main segments
   */
  removeMainSegments() {
    try {
      if (this.map.getLayer(this.layerId)) {
        this.map.removeLayer(this.layerId);
      }
      if (this.map.getSource(this.layerId)) {
        this.map.removeSource(this.layerId);
      }
    } catch (error) {
      console.error('WeatherSegmentsLayer: Error removing main segments:', error);
    }
  }
  
  /**
   * Toggle layer visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    const visibility = this.isVisible ? 'visible' : 'none';
    
    if (this.map.getLayer(this.layerId)) {
      this.map.setLayoutProperty(this.layerId, 'visibility', visibility);
    }
  }
}

export default WeatherSegmentsLayer;