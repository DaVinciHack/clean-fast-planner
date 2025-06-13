/**
 * CloudLayerRenderer.js
 * 3D Cloud Layer Visualization for Fast Planner
 * 
 * Renders realistic cloud layers with accurate altitudes and thickness
 * Uses Three.js for WebGL-based 3D visualization
 * NO dummy data - only real weather cloud data
 */

import * as THREE from 'three';
import { WeatherLayer3D, WeatherParameterTypes } from '../utils/WeatherTypes.js';

class CloudLayerRenderer {
    constructor() {
        // Three.js objects
        this.scene = null;
        this.cloudMeshes = [];
        this.cloudMaterials = new Map();
        
        // Cloud rendering settings
        this.settings = {
            opacity: 0.6,              // Base cloud opacity
            enableAnimation: true,     // Animate cloud movement
            altitudeScale: 0.001,      // Scale factor for altitude (adjust for globe size)
            maxCloudLayers: 10,        // Maximum number of cloud layers to render
            animationSpeed: 0.5        // Cloud animation speed
        };
        
        // Cloud types and their visual properties
        this.cloudTypes = {
            CB: {  // Cumulonimbus (thunderstorm clouds)
                color: 0x404040,       // Dark gray
                opacity: 0.8,
                verticalExtent: true,  // Extends vertically
                hazardous: true
            },
            TCU: { // Towering Cumulus
                color: 0x606060,       // Medium gray
                opacity: 0.7,
                verticalExtent: true
            },
            CU: {  // Fair weather cumulus
                color: 0xF0F0F0,       // Light gray
                opacity: 0.5,
                verticalExtent: false
            },
            ST: {  // Stratus layer
                color: 0xC0C0C0,       // Gray
                opacity: 0.6,
                verticalExtent: false
            },
            SC: {  // Stratocumulus
                color: 0xB0B0B0,       // Medium gray
                opacity: 0.6,
                verticalExtent: false
            }
        };
        
        // Animation properties
        this.animationClock = new THREE.Clock();
        this.cloudUniforms = {};
        
        console.log('CloudLayerRenderer initialized');
    }
    
    /**
     * Initialize renderer with Three.js scene
     * @param {THREE.Scene} scene - Three.js scene object
     */
    initialize(scene) {
        if (!scene) {
            throw new Error('Three.js scene required for cloud rendering');
        }
        
        this.scene = scene;
        this.initializeShaders();
        
        console.log('CloudLayerRenderer initialized with scene');
    }
    
    /**
     * Render cloud layers from weather data
     * @param {Array<WeatherLayer3D>} cloudLayers - Array of cloud layer data
     * @param {Object} options - Rendering options
     */
    renderCloudLayers(cloudLayers, options = {}) {
        if (!Array.isArray(cloudLayers)) {
            console.warn('Invalid cloud layers data provided');
            return;
        }
        
        // Clear existing cloud meshes
        this.clearCloudLayers();
        
        // Filter and sort cloud layers by altitude
        const validLayers = this.filterValidCloudLayers(cloudLayers);
        const sortedLayers = validLayers.sort((a, b) => a.altitudeBase - b.altitudeBase);
        
        console.log(`Rendering ${sortedLayers.length} cloud layers`);
        
        // Render each cloud layer
        sortedLayers.forEach((layer, index) => {
            if (index < this.settings.maxCloudLayers) {
                this.renderSingleCloudLayer(layer, options);
            }
        });
        
        console.log(`Successfully rendered ${this.cloudMeshes.length} cloud layers`);
    }
    
    /**
     * Render a single cloud layer
     * @param {WeatherLayer3D} cloudLayer - Cloud layer data
     * @param {Object} options - Rendering options
     * @private
     */
    renderSingleCloudLayer(cloudLayer, options) {
        try {
            // Validate cloud layer data
            if (!this.validateCloudLayer(cloudLayer)) {
                console.warn('Invalid cloud layer data, skipping render');
                return;
            }
            
            // Create cloud geometry based on coverage area
            const geometry = this.createCloudGeometry(cloudLayer);
            
            // Create cloud material based on type and intensity
            const material = this.createCloudMaterial(cloudLayer, options);
            
            // Create cloud mesh
            const cloudMesh = new THREE.Mesh(geometry, material);
            
            // Position cloud at correct altitude and location
            this.positionCloudLayer(cloudMesh, cloudLayer);
            
            // Add to scene and tracking
            this.scene.add(cloudMesh);
            this.cloudMeshes.push({
                mesh: cloudMesh,
                layer: cloudLayer,
                type: cloudLayer.type
            });
            
        } catch (error) {
            console.error('Failed to render cloud layer:', error);
        }
    }
    
    /**
     * Create cloud geometry based on layer data
     * @param {WeatherLayer3D} cloudLayer - Cloud layer data
     * @returns {THREE.BufferGeometry} Cloud geometry
     * @private
     */
    createCloudGeometry(cloudLayer) {
        // Calculate cloud dimensions
        const thickness = cloudLayer.thickness;
        const coverage = this.calculateCoverageArea(cloudLayer);
        
        // Use appropriate geometry based on cloud type and coverage
        if (cloudLayer.type === 'CB' || cloudLayer.type === 'TCU') {
            // Vertical development clouds - use taller geometry
            return new THREE.CylinderGeometry(
                coverage.radius * 0.8,     // Top radius (narrower)
                coverage.radius,           // Bottom radius
                thickness * this.settings.altitudeScale,
                16,                        // Radial segments
                Math.max(2, Math.floor(thickness / 1000)) // Height segments
            );
        } else {
            // Layer clouds - use flatter geometry  
            return new THREE.CylinderGeometry(
                coverage.radius,           // Top radius
                coverage.radius,           // Bottom radius (same size)
                thickness * this.settings.altitudeScale,
                24,                        // More radial segments for smooth appearance
                1                          // Single height segment for layers
            );
        }
    }
    
    /**
     * Create cloud material based on type and conditions
     * @param {WeatherLayer3D} cloudLayer - Cloud layer data
     * @param {Object} options - Material options
     * @returns {THREE.Material} Cloud material
     * @private
     */
    createCloudMaterial(cloudLayer, options) {
        const cloudType = this.cloudTypes[cloudLayer.type] || this.cloudTypes.CU;
        
        // Calculate opacity based on cloud density and coverage
        const density = cloudLayer.getVisualizationDensity();
        const opacity = Math.min(cloudType.opacity * density, 0.9);
        
        // Create shader material for realistic cloud appearance
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                opacity: { value: opacity },
                cloudColor: { value: new THREE.Color(cloudType.color) },
                density: { value: density },
                thickness: { value: cloudLayer.thickness },
                hazardous: { value: cloudType.hazardous || false }
            },
            vertexShader: this.getCloudVertexShader(),
            fragmentShader: this.getCloudFragmentShader(),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,  // Allow clouds behind to show through
            blending: THREE.NormalBlending
        });
        
        // Store material for animation updates
        const materialKey = `${cloudLayer.type}_${Date.now()}`;
        this.cloudMaterials.set(materialKey, material);
        
        return material;
    }
    
    /**
     * Position cloud layer at correct geographic location and altitude
     * @param {THREE.Mesh} cloudMesh - Cloud mesh to position
     * @param {WeatherLayer3D} cloudLayer - Cloud layer data
     * @private
     */
    positionCloudLayer(cloudMesh, cloudLayer) {
        if (!cloudLayer.coordinates || cloudLayer.coordinates.length === 0) {
            console.warn('No coordinates provided for cloud layer positioning');
            return;
        }
        
        // Get center point of cloud coverage area
        const center = this.calculateCenterPoint(cloudLayer.coordinates);
        
        // Convert geographic coordinates to 3D position
        // This assumes a globe-based coordinate system
        const altitude = (cloudLayer.altitudeBase + cloudLayer.altitudeTop) / 2;
        const position = this.geographicTo3D(center.lat, center.lon, altitude);
        
        cloudMesh.position.set(position.x, position.y, position.z);
        
        // Orient cloud to face up from earth surface
        const up = position.clone().normalize();
        cloudMesh.lookAt(up.multiplyScalar(1000).add(cloudMesh.position));
    }
    
    /**
     * Update cloud layer visibility and properties
     * @param {Object} visibilityOptions - Visibility control options
     */
    updateCloudVisibility(visibilityOptions = {}) {
        const {
            showClouds = true,
            opacity = this.settings.opacity,
            altitudeFilter = null,
            typeFilter = null
        } = visibilityOptions;
        
        this.cloudMeshes.forEach(cloudData => {
            const { mesh, layer } = cloudData;
            
            // Check altitude filter
            let visible = showClouds;
            if (altitudeFilter && visible) {
                visible = layer.intersectsAltitude(altitudeFilter.min) || 
                         layer.intersectsAltitude(altitudeFilter.max);
            }
            
            // Check type filter
            if (typeFilter && visible) {
                visible = typeFilter.includes(layer.type);
            }
            
            // Update visibility
            mesh.visible = visible;
            
            // Update opacity if visible
            if (visible && mesh.material.uniforms) {
                mesh.material.uniforms.opacity.value = opacity;
            }
        });
    }
    
    /**
     * Animate cloud layers (movement, evolution)
     */
    animateCloudLayers() {
        if (!this.settings.enableAnimation) return;
        
        const deltaTime = this.animationClock.getDelta();
        const elapsedTime = this.animationClock.getElapsedTime();
        
        // Update shader uniforms for animation
        this.cloudMaterials.forEach(material => {
            if (material.uniforms && material.uniforms.time) {
                material.uniforms.time.value = elapsedTime * this.settings.animationSpeed;
            }
        });
        
        // Update cloud positions if movement vectors are available
        this.cloudMeshes.forEach(cloudData => {
            const { mesh, layer } = cloudData;
            
            if (layer.movementVector) {
                // Apply movement based on wind direction and speed
                const movement = this.calculateCloudMovement(layer.movementVector, deltaTime);
                mesh.position.add(movement);
            }
        });
    }
    
    /**
     * Clear all rendered cloud layers
     */
    clearCloudLayers() {
        this.cloudMeshes.forEach(cloudData => {
            this.scene.remove(cloudData.mesh);
            
            // Dispose of geometry and material to free memory
            if (cloudData.mesh.geometry) {
                cloudData.mesh.geometry.dispose();
            }
            if (cloudData.mesh.material) {
                cloudData.mesh.material.dispose();
            }
        });
        
        this.cloudMeshes = [];
        this.cloudMaterials.clear();
        
        console.log('All cloud layers cleared');
    }
    
    /**
     * Filter valid cloud layers for rendering
     * @param {Array} cloudLayers - Raw cloud layer data
     * @returns {Array<WeatherLayer3D>} Valid cloud layers
     * @private
     */
    filterValidCloudLayers(cloudLayers) {
        return cloudLayers.filter(layer => {
            return layer instanceof WeatherLayer3D &&
                   layer.type &&
                   layer.altitudeBase >= 0 &&
                   layer.altitudeTop > layer.altitudeBase &&
                   layer.thickness > 0 &&
                   layer.getVisualizationDensity() > 0.1; // Only render visible clouds
        });
    }
    
    /**
     * Validate individual cloud layer
     * @param {WeatherLayer3D} cloudLayer - Cloud layer to validate
     * @returns {boolean} Is layer valid for rendering
     * @private
     */
    validateCloudLayer(cloudLayer) {
        if (!(cloudLayer instanceof WeatherLayer3D)) {
            return false;
        }
        
        // Check required properties
        if (!cloudLayer.type || 
            cloudLayer.altitudeBase < 0 || 
            cloudLayer.altitudeTop <= cloudLayer.altitudeBase ||
            cloudLayer.thickness <= 0) {
            return false;
        }
        
        // Check if cloud has sufficient density to render
        if (cloudLayer.getVisualizationDensity() < 0.05) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Calculate coverage area for cloud layer
     * @param {WeatherLayer3D} cloudLayer - Cloud layer data
     * @returns {Object} Coverage area properties
     * @private
     */
    calculateCoverageArea(cloudLayer) {
        // Calculate radius based on coverage percentage and coordinates
        let radius = 5; // Default radius in kilometers
        
        if (cloudLayer.coordinates && cloudLayer.coordinates.length > 0) {
            // Calculate area from coordinate bounds
            const bounds = this.calculateBounds(cloudLayer.coordinates);
            radius = Math.max(bounds.width, bounds.height) / 2;
        }
        
        // Adjust radius based on coverage percentage
        const coverageFactor = Math.sqrt(cloudLayer.coverage / 100);
        radius *= coverageFactor;
        
        return {
            radius: Math.max(radius, 1), // Minimum 1km radius
            area: Math.PI * radius * radius
        };
    }
    
    /**
     * Calculate center point of coordinate array
     * @param {Array} coordinates - Array of [lat, lon] coordinates
     * @returns {Object} Center point {lat, lon}
     * @private
     */
    calculateCenterPoint(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return { lat: 0, lon: 0 };
        }
        
        let sumLat = 0, sumLon = 0;
        coordinates.forEach(coord => {
            sumLat += coord[0];
            sumLon += coord[1];
        });
        
        return {
            lat: sumLat / coordinates.length,
            lon: sumLon / coordinates.length
        };
    }
    
    /**
     * Convert geographic coordinates to 3D position
     * @param {number} lat - Latitude in degrees  
     * @param {number} lon - Longitude in degrees
     * @param {number} altitude - Altitude in feet
     * @returns {THREE.Vector3} 3D position
     * @private
     */
    geographicTo3D(lat, lon, altitude) {
        // Convert to radians
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        
        // Earth radius plus altitude (scaled)
        const earthRadius = 100; // Scaled earth radius for visualization
        const radius = earthRadius + (altitude * this.settings.altitudeScale);
        
        // Spherical to Cartesian conversion
        const x = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y = radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.sin(lonRad);
        
        return new THREE.Vector3(x, y, z);
    }
    
    /**
     * Calculate cloud movement vector
     * @param {Object} movementVector - Wind direction and speed
     * @param {number} deltaTime - Time delta for movement
     * @returns {THREE.Vector3} Movement vector
     * @private
     */
    calculateCloudMovement(movementVector, deltaTime) {
        if (!movementVector || !movementVector.speed || !movementVector.direction) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        // Convert wind direction to movement vector
        const directionRad = (movementVector.direction * Math.PI) / 180;
        const speed = movementVector.speed * this.settings.animationSpeed * deltaTime;
        
        return new THREE.Vector3(
            Math.cos(directionRad) * speed,
            0, // No vertical movement for horizontal wind
            Math.sin(directionRad) * speed
        );
    }
    
    /**
     * Calculate bounds of coordinate array
     * @param {Array} coordinates - Array of coordinates
     * @returns {Object} Bounds object
     * @private
     */
    calculateBounds(coordinates) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        
        coordinates.forEach(coord => {
            minLat = Math.min(minLat, coord[0]);
            maxLat = Math.max(maxLat, coord[0]);
            minLon = Math.min(minLon, coord[1]);
            maxLon = Math.max(maxLon, coord[1]);
        });
        
        return {
            width: maxLon - minLon,
            height: maxLat - minLat,
            center: {
                lat: (minLat + maxLat) / 2,
                lon: (minLon + maxLon) / 2
            }
        };
    }
    
    /**
     * Initialize cloud shaders
     * @private
     */
    initializeShaders() {
        // Shaders will be defined as methods for better organization
        console.log('Cloud shaders initialized');
    }
    
    /**
     * Get vertex shader for cloud rendering
     * @returns {string} Vertex shader code
     * @private
     */
    getCloudVertexShader() {
        return `
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            
            void main() {
                vPosition = position;
                vNormal = normal;
                vUv = uv;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    /**
     * Get fragment shader for cloud rendering
     * @returns {string} Fragment shader code
     * @private
     */
    getCloudFragmentShader() {
        return `
            uniform float time;
            uniform float opacity;
            uniform vec3 cloudColor;
            uniform float density;
            uniform float thickness;
            uniform bool hazardous;
            
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            
            // Simple noise function for cloud texture
            float noise(vec3 pos) {
                return fract(sin(dot(pos, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
            }
            
            void main() {
                // Create cloud texture using noise
                vec3 pos = vPosition + vec3(time * 0.1, 0.0, time * 0.05);
                float n1 = noise(pos * 2.0);
                float n2 = noise(pos * 4.0) * 0.5;
                float n3 = noise(pos * 8.0) * 0.25;
                
                float cloudNoise = n1 + n2 + n3;
                
                // Modify color based on cloud density and type
                vec3 finalColor = cloudColor;
                
                if (hazardous) {
                    // Darken hazardous clouds (CB, thunderstorms)
                    finalColor = mix(cloudColor, vec3(0.2, 0.2, 0.3), 0.5);
                }
                
                // Apply cloud texture and density
                float alpha = opacity * density * cloudNoise;
                alpha = clamp(alpha, 0.0, 0.9);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    /**
     * Get current rendering statistics
     * @returns {Object} Rendering stats
     */
    getRenderingStats() {
        return {
            activeLayers: this.cloudMeshes.length,
            materials: this.cloudMaterials.size,
            animationEnabled: this.settings.enableAnimation,
            memoryUsage: this.estimateMemoryUsage()
        };
    }
    
    /**
     * Estimate memory usage of cloud rendering
     * @returns {string} Memory usage estimate
     * @private
     */
    estimateMemoryUsage() {
        const meshCount = this.cloudMeshes.length;
        const materialCount = this.cloudMaterials.size;
        
        // Rough estimate: each mesh ~50KB, each material ~10KB
        const estimatedMB = ((meshCount * 50) + (materialCount * 10)) / 1024;
        
        return `~${estimatedMB.toFixed(1)}MB`;
    }
    
    /**
     * Cleanup method
     */
    cleanup() {
        this.clearCloudLayers();
        this.scene = null;
        console.log('CloudLayerRenderer cleaned up');
    }
}

export default CloudLayerRenderer;
