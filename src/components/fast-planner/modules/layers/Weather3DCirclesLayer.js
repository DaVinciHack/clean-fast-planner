/**
 * Weather3DCirclesLayer.js
 * 
 * True 3D weather circles using Three.js, lying flat on the ground
 * Integrates with existing Three.js setup from PlatformManager
 */

class Weather3DCirclesLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'weather-3d-circles-source';
    this.layerId = 'weather-3d-circles-layer';
    this.isVisible = false;
    this.currentWeatherSegments = [];
    
    // Three.js setup
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.weatherMeshes = [];
    
    this.initializeThreeJS();
  }

  /**
   * Initialize Three.js scene for 3D weather circles
   */
  initializeThreeJS() {
    if (typeof THREE === 'undefined') {
      console.error('Weather3DCirclesLayer: THREE.js not available');
      return;
    }
    
    console.log('Weather3DCirclesLayer: Initializing Three.js scene');
    
    // Create scene, camera, and renderer like PlatformManager does
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    
    // Create WebGL renderer that can overlay on the map
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.map.getCanvas(), // Use the map's canvas
      context: this.map.painter.context.gl, // Use map's WebGL context
      antialias: true,
      alpha: true // Enable transparency
    });
    
    this.renderer.autoClear = false; // Don't clear automatically - map handles this
    this.renderer.setSize(this.map.getCanvas().clientWidth, this.map.getCanvas().clientHeight);
    
    // Set up camera projection matrix to match MapBox
    this.camera.projectionMatrix = new THREE.Matrix4()
      .makePerspective(
        THREE.MathUtils.degToRad(this.map.transform.fov),
        this.map.transform.width / this.map.transform.height,
        0.1,
        1000
      );
  }

  /**
   * Add 3D weather circles to the map
   * @param {Array} weatherSegments - Array of weather segments with coordinates and rankings
   */
  addWeatherCircles(weatherSegments) {
    if (!weatherSegments || !this.map || !this.scene) return;
    
    console.log('Weather3DCirclesLayer: Adding 3D weather circles for', weatherSegments.length, 'segments');
    
    this.currentWeatherSegments = weatherSegments;
    this.removeWeatherCircles();
    
    // Filter segments that have coordinates and rankings
    const validSegments = weatherSegments.filter(segment => 
      segment.geoPoint && 
      segment.alternateRanking !== undefined && 
      segment.alternateRanking !== null
    );
    
    if (validSegments.length === 0) {
      console.log('Weather3DCirclesLayer: No valid segments with coordinates and rankings');
      return;
    }
    
    console.log('Weather3DCirclesLayer: Processing', validSegments.length, 'valid segments');
    
    // Create 3D circle meshes for each weather segment
    validSegments.forEach(segment => {
      const mesh = this.create3DCircleMesh(segment);
      if (mesh) {
        this.scene.add(mesh);
        this.weatherMeshes.push(mesh);
      }
    });
    
    // Add custom layer to MapBox that renders our Three.js scene
    this.addMapboxCustomLayer();
    
    this.isVisible = true;
    console.log('Weather3DCirclesLayer: Added', this.weatherMeshes.length, '3D weather circles');
  }

  /**
   * Create a 3D circle mesh for a weather segment
   * @param {Object} segment - Weather segment with geoPoint and ranking
   * @returns {THREE.Mesh} 3D circle mesh
   */
  create3DCircleMesh(segment) {
    const coords = this.parseGeoPoint(segment.geoPoint);
    if (!coords) return null;
    
    // Convert lat/lng to world coordinates
    const worldCoords = this.latLngToWorld(coords[1], coords[0]);
    
    // Create circle geometry lying flat on the ground
    const radius = this.getCircleRadius(segment.alternateRanking);
    const segments = 32; // Smooth circle
    
    const geometry = new THREE.CircleGeometry(radius, segments);
    
    // Rotate geometry to lie flat on the ground (facing up)
    geometry.rotateX(-Math.PI / 2);
    
    // Create material with aviation ranking color
    const color = this.getAviationRankingColor(segment.alternateRanking);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide // Visible from both sides
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position the mesh at the world coordinates
    mesh.position.set(worldCoords.x, worldCoords.y, 0); // Z=0 for ground level
    
    // Store metadata
    mesh.userData = {
      airportIcao: segment.airportIcao || 'Unknown',
      ranking: segment.alternateRanking,
      isRig: segment.isRig || false,
      araRequired: segment.araRequired || false
    };
    
    return mesh;
  }

  /**
   * Convert lat/lng to Three.js world coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} {x, y} world coordinates
   */
  latLngToWorld(lat, lng) {
    // Use MapBox's transform to convert coordinates
    const point = this.map.project([lng, lat]);
    
    // Convert to Three.js coordinate system
    // MapBox uses pixels, we need to scale appropriately
    const scale = 0.001; // Adjust scale as needed
    
    return {
      x: (point.x - this.map.getCanvas().width / 2) * scale,
      y: -(point.y - this.map.getCanvas().height / 2) * scale, // Flip Y axis
      z: 0
    };
  }

  /**
   * Add MapBox custom layer that renders Three.js scene
   */
  addMapboxCustomLayer() {
    const customLayer = {
      id: this.layerId,
      type: 'custom',
      renderingMode: '3d',
      
      onAdd: (map, gl) => {
        console.log('Weather3DCirclesLayer: Custom layer added to map');
      },
      
      render: (gl, matrix) => {
        // Update camera matrix to match MapBox's camera
        this.camera.projectionMatrix.elements = matrix;
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        
        // Update mesh positions based on current map view
        this.updateMeshPositions();
        
        // Render the scene
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
      }
    };
    
    this.map.addLayer(customLayer);
  }

  /**
   * Update mesh positions when map view changes
   */
  updateMeshPositions() {
    this.weatherMeshes.forEach(mesh => {
      // Update position based on current map projection
      // This ensures circles stay in the correct geographic location as the map moves
      const userData = mesh.userData;
      if (userData.originalCoords) {
        const worldCoords = this.latLngToWorld(userData.originalCoords.lat, userData.originalCoords.lng);
        mesh.position.set(worldCoords.x, worldCoords.y, 0);
      }
    });
  }

  /**
   * Parse geoPoint string to coordinates
   * @param {string} geoPoint - Comma-separated lat,lng string
   * @returns {Array} [longitude, latitude] coordinates or null
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
      console.error('Weather3DCirclesLayer: Error parsing geoPoint:', geoPoint, error);
    }
    
    return null;
  }

  /**
   * Get circle radius based on weather ranking
   * @param {number} ranking - Weather ranking (5, 8, 10, 15, 20)
   * @returns {number} Radius in world units
   */
  getCircleRadius(ranking) {
    // Base radius for 3D circles (adjust scale as needed)
    const baseRadius = 0.05;
    
    // Adjust size based on ranking importance
    switch (ranking) {
      case 5:  // Below minimums - larger
        return baseRadius * 1.5;
      case 8:  // ARA needed - slightly larger
        return baseRadius * 1.2;
      case 10: // Warning - normal size
        return baseRadius;
      case 15: // Good - slightly smaller
        return baseRadius * 0.8;
      case 20: // N/A - smaller
        return baseRadius * 0.6;
      default:
        return baseRadius;
    }
  }

  /**
   * Get aviation ranking color
   * @param {number} ranking - Weather ranking
   * @returns {string} Hex color code
   */
  getAviationRankingColor(ranking) {
    switch (ranking) {
      case 5:
        return '#D32F2F'; // Red - Below alternate minimums
      case 8:
        return '#8E24AA'; // Purple - ARA fuel needed at rig
      case 10:
        return '#F57C00'; // Orange - Warning conditions
      case 15:
        return '#66BB6A'; // Green - Good conditions
      case 20:
        return '#616161'; // Grey - Not applicable
      default:
        return '#1976D2'; // Blue - Default
    }
  }

  /**
   * Remove 3D weather circles from map
   */
  removeWeatherCircles() {
    // Remove meshes from scene
    this.weatherMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.weatherMeshes = [];
    
    // Remove MapBox layer
    if (this.map.getLayer(this.layerId)) {
      this.map.removeLayer(this.layerId);
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

  /**
   * Add test 3D weather circles for debugging
   */
  addTestCircles() {
    console.log('Weather3DCirclesLayer: Adding test 3D circles for debugging');
    
    // Create test weather segments for Gulf of Mexico
    const testSegments = [
      {
        geoPoint: "27.5, -90.5",
        airportIcao: "TEST1",
        alternateRanking: 5,
        isRig: false
      },
      {
        geoPoint: "28.0, -89.5", 
        airportIcao: "TEST2",
        alternateRanking: 8,
        isRig: true
      },
      {
        geoPoint: "26.8, -91.2",
        airportIcao: "TEST3", 
        alternateRanking: 15,
        isRig: false
      },
      {
        geoPoint: "27.8, -88.5",
        airportIcao: "TEST4",
        alternateRanking: 10,
        isRig: false
      }
    ];
    
    this.addWeatherCircles(testSegments);
  }

  /**
   * Update weather circles with new data
   * @param {Array} weatherSegments - New weather segments data
   */
  updateWeatherCircles(weatherSegments) {
    this.addWeatherCircles(weatherSegments);
  }
}

export default Weather3DCirclesLayer;