/**
 * 3DCloudManager.js
 * 
 * GENIUS 3D Cloud Visualization System
 * Creates altitude-based cloud opacity for realistic "flying through clouds" experience
 * 
 * This creates the visual illusion of flying under/over/through cloud layers
 * by dynamically adjusting opacity based on camera altitude vs cloud layer heights
 */

class ThreeDCloudManager {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.isActive = false;
        this.activeCloudLayers = new Map();
        this.cameraAltitude = 0; // feet above sea level
        this.animationFrame = null;
        
        // Cloud layer definitions (altitude in feet) - these can be updated with real weather data
        this.cloudLayers = {
            'LOW_CLOUDS': {
                name: 'Low Clouds & Fog',
                layerType: 'SHORTWAVE',
                baseAltitude: 0,      // Surface level
                topAltitude: 3000,    // 3,000ft (typical low clouds)
                mapLayerId: 'noaa-shortwave-layer',
                color: [200, 200, 200] // Light gray
            },
            'MID_CLOUDS': {
                name: 'Middle Clouds',
                layerType: 'LONGWAVE', 
                baseAltitude: 6000,   // 6,000ft
                topAltitude: 15000,   // 15,000ft (typical mid-level clouds)
                mapLayerId: 'noaa-longwave-layer',
                color: [180, 180, 200] // Slightly blue-gray
            },
            'HIGH_CLOUDS': {
                name: 'High Clouds',
                layerType: 'VISIBLE',
                baseAltitude: 20000,  // 20,000ft
                topAltitude: 40000,   // 40,000ft (cirrus level)
                mapLayerId: 'noaa-visible-layer',
                color: [255, 255, 255] // White
            }
        };
        
        console.log('🌩️ 3D Cloud Manager initialized with altitude-based opacity system');
    }
    
    /**
     * Initialize 3D cloud system
     */
    initialize() {
        if (!this.map) {
            console.error('❌ No map instance provided for 3D clouds');
            return false;
        }
        
        try {
            // Listen for camera movements to update cloud opacity
            this.map.on('move', () => this.updateCloudOpacity());
            this.map.on('zoom', () => this.updateCloudOpacity());
            this.map.on('pitch', () => this.updateCloudOpacity());
            
            // Start monitoring camera altitude
            this.startAltitudeMonitoring();
            
            console.log('✅ 3D Cloud system initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize 3D cloud system:', error);
            return false;
        }
    }
    
    /**
     * Enable 3D cloud effects for specific layer
     * @param {string} cloudLayerKey - Key from this.cloudLayers
     * @param {number} baseOpacity - Base opacity when above clouds
     */
    enableCloudLayer(cloudLayerKey, baseOpacity = 0.8) {
        const cloudLayer = this.cloudLayers[cloudLayerKey];
        if (!cloudLayer) {
            console.warn(`❌ Unknown cloud layer: ${cloudLayerKey}`);
            return false;
        }
        
        // Check if the map layer exists
        if (!this.map.getLayer(cloudLayer.mapLayerId)) {
            console.warn(`❌ Map layer not found: ${cloudLayer.mapLayerId}`);
            return false;
        }
        
        this.activeCloudLayers.set(cloudLayerKey, {
            ...cloudLayer,
            baseOpacity: baseOpacity,
            currentOpacity: baseOpacity
        });
        
        console.log(`🌩️ Enabled 3D cloud layer: ${cloudLayer.name} (${cloudLayer.baseAltitude}-${cloudLayer.topAltitude}ft)`);
        
        // Start the 3D effect
        if (!this.isActive) {
            this.activate();
        }
        
        // Initial opacity calculation
        this.updateCloudOpacity();
        
        return true;
    }
    
    /**
     * Disable 3D cloud effects for specific layer
     */
    disableCloudLayer(cloudLayerKey) {
        const cloudLayer = this.activeCloudLayers.get(cloudLayerKey);
        if (cloudLayer) {
            // Reset to normal opacity
            if (this.map.getLayer(cloudLayer.mapLayerId)) {
                this.map.setPaintProperty(cloudLayer.mapLayerId, 'raster-opacity', cloudLayer.baseOpacity);
            }
            
            this.activeCloudLayers.delete(cloudLayerKey);
            console.log(`🌩️ Disabled 3D cloud layer: ${cloudLayer.name}`);
            
            // Deactivate if no layers remain
            if (this.activeCloudLayers.size === 0) {
                this.deactivate();
            }
        }
    }
    
    /**
     * Calculate camera altitude from map zoom and pitch
     * This approximates the viewing altitude in feet above sea level
     */
    calculateCameraAltitude() {
        const zoom = this.map.getZoom();
        const pitch = this.map.getPitch();
        
        // FIXED: Much more responsive altitude calculation
        // Zoom levels: 6 = 50,000ft, 10 = 10,000ft, 14 = 2,000ft, 18 = 200ft
        let altitude;
        
        if (zoom <= 6) {
            altitude = 50000; // Very high
        } else if (zoom <= 8) {
            altitude = 25000; // High altitude
        } else if (zoom <= 10) {
            altitude = 10000; // Medium high
        } else if (zoom <= 12) {
            altitude = 5000;  // Medium
        } else if (zoom <= 14) {
            altitude = 2000;  // Low
        } else if (zoom <= 16) {
            altitude = 1000;  // Very low
        } else {
            altitude = 500;   // Ground level
        }
        
        // Pitch adjustment: Higher pitch = higher effective altitude
        const pitchBonus = (pitch / 60) * altitude * 0.5;
        
        const finalAltitude = altitude + pitchBonus;
        
        console.log(`🛩️ Altitude calc: zoom=${zoom.toFixed(1)}, pitch=${pitch.toFixed(1)}° → ${Math.round(finalAltitude)}ft`);
        
        return Math.max(0, Math.min(50000, finalAltitude));
    }
    
    /**
     * Calculate opacity based on camera altitude vs cloud layer
     * This creates the "flying through clouds" effect with proper altitude behavior
     */
    calculateCloudOpacity(cloudLayer, cameraAltitude) {
        const { baseAltitude, topAltitude, baseOpacity } = cloudLayer;
        
        console.log(`🌩️ Cloud calc: ${cloudLayer.name} (${baseAltitude}-${topAltitude}ft) vs camera ${Math.round(cameraAltitude)}ft`);
        
        // ABOVE CLOUDS: Camera is above cloud top - see clouds below you
        if (cameraAltitude > topAltitude + 500) {
            console.log(`☁️ ABOVE clouds: Full opacity (looking down)`);
            return baseOpacity; // Full visibility of clouds below
        }
        
        // BELOW CLOUDS: Camera is below cloud base - clear view (no clouds visible)
        if (cameraAltitude < baseAltitude - 500) {
            console.log(`☁️ BELOW clouds: Clear (no clouds visible)`);
            return 0; // No clouds visible when below them
        }
        
        // TRANSITION ZONES and IN-CLOUD behavior
        const layerThickness = topAltitude - baseAltitude;
        const transitionZone = Math.max(500, layerThickness * 0.1); // 10% transition zone
        
        let opacity;
        
        if (cameraAltitude >= topAltitude) {
            // Approaching cloud top from above - fade in as you get closer
            const distanceFromTop = cameraAltitude - topAltitude;
            const fadeIn = Math.min(1, distanceFromTop / transitionZone);
            opacity = baseOpacity * fadeIn;
            console.log(`☁️ Above cloud top: ${(opacity * 100).toFixed(0)}% opacity`);
            
        } else if (cameraAltitude <= baseAltitude) {
            // Approaching cloud base from below - fade in as you get closer
            const distanceFromBase = baseAltitude - cameraAltitude;
            const fadeIn = Math.max(0, 1 - (distanceFromBase / transitionZone));
            opacity = baseOpacity * fadeIn;
            console.log(`☁️ Below cloud base: ${(opacity * 100).toFixed(0)}% opacity`);
            
        } else {
            // INSIDE THE CLOUD LAYER - this is the key part!
            const positionInLayer = (cameraAltitude - baseAltitude) / layerThickness;
            
            // Inside clouds: reduce opacity significantly (you're IN the clouds, they're around you)
            // Bottom of layer: 80% opacity (entering clouds)
            // Middle of layer: 30% opacity (deep in clouds - poor visibility)
            // Top of layer: 60% opacity (exiting clouds)
            const inCloudCurve = 0.3 + 0.5 * Math.sin(positionInLayer * Math.PI);
            opacity = baseOpacity * inCloudCurve;
            console.log(`☁️ INSIDE clouds (${(positionInLayer * 100).toFixed(0)}%): ${(opacity * 100).toFixed(0)}% opacity`);
        }
        
        return Math.max(0, Math.min(baseOpacity, opacity));
    }
    
    /**
     * Update all active cloud layer opacities based on current camera position
     */
    updateCloudOpacity() {
        if (!this.isActive || this.activeCloudLayers.size === 0) return;
        
        try {
            this.cameraAltitude = this.calculateCameraAltitude();
            
            console.log(`🛩️ Camera altitude: ${Math.round(this.cameraAltitude)}ft`);
            
            // Update each active cloud layer
            for (const [layerKey, cloudLayer] of this.activeCloudLayers) {
                const newOpacity = this.calculateCloudOpacity(cloudLayer, this.cameraAltitude);
                
                // Always update (remove the threshold check for more responsive updates)
                cloudLayer.currentOpacity = newOpacity;
                
                // Apply to map layer
                if (this.map.getLayer(cloudLayer.mapLayerId)) {
                    this.map.setPaintProperty(cloudLayer.mapLayerId, 'raster-opacity', newOpacity);
                    console.log(`☁️ ${cloudLayer.name}: ${Math.round(this.cameraAltitude)}ft → ${(newOpacity * 100).toFixed(0)}% opacity`);
                } else {
                    console.warn(`⚠️ Map layer not found: ${cloudLayer.mapLayerId}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error updating cloud opacity:', error);
        }
    }
    
    /**
     * Start continuous altitude monitoring
     */
    startAltitudeMonitoring() {
        const monitor = () => {
            this.updateCloudOpacity();
            
            if (this.isActive) {
                this.animationFrame = requestAnimationFrame(monitor);
            }
        };
        
        monitor();
    }
    
    /**
     * Activate 3D cloud system
     */
    activate() {
        this.isActive = true;
        this.startAltitudeMonitoring();
        console.log('🌩️ 3D Cloud system ACTIVATED - Ready for flight simulation!');
    }
    
    /**
     * Deactivate 3D cloud system
     */
    deactivate() {
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Reset all cloud layers to their base opacity
        for (const [layerKey, cloudLayer] of this.activeCloudLayers) {
            if (this.map.getLayer(cloudLayer.mapLayerId)) {
                this.map.setPaintProperty(cloudLayer.mapLayerId, 'raster-opacity', cloudLayer.baseOpacity);
            }
        }
        
        console.log('🌩️ 3D Cloud system deactivated');
    }
    
    /**
     * Update cloud layer altitudes with real weather data
     * @param {Object} weatherData - Real weather data with cloud heights
     * Example: { cloudLayers: [{ type: 'SCT', base: 2500, top: 8000 }, { type: 'BKN', base: 12000, top: 18000 }] }
     */
    updateRealCloudHeights(weatherData) {
        if (!weatherData || !weatherData.cloudLayers) {
            console.warn('⚠️ No real cloud height data available, using generic heights');
            return;
        }
        
        console.log('🌩️ Updating cloud heights with real weather data:', weatherData.cloudLayers);
        
        // Map weather cloud layers to our visualization layers
        weatherData.cloudLayers.forEach((cloudData, index) => {
            const layerKey = this.getLayerKeyForCloudType(cloudData.type, index);
            if (layerKey && this.cloudLayers[layerKey]) {
                this.cloudLayers[layerKey].baseAltitude = cloudData.base;
                this.cloudLayers[layerKey].topAltitude = cloudData.top;
                this.cloudLayers[layerKey].coverage = cloudData.coverage || 'SCT';
                
                console.log(`☁️ Updated ${layerKey}: ${cloudData.base}-${cloudData.top}ft (${cloudData.type})`);
            }
        });
        
        // Recalculate opacities with new heights
        this.updateCloudOpacity();
    }
    
    /**
     * Map cloud type to our layer system
     */
    getLayerKeyForCloudType(cloudType, index) {
        // METAR cloud types: CLR, FEW, SCT, BKN, OVC
        const typeMap = {
            'FEW': index === 0 ? 'LOW_CLOUDS' : 'MID_CLOUDS',
            'SCT': index === 0 ? 'LOW_CLOUDS' : 'MID_CLOUDS', 
            'BKN': 'MID_CLOUDS',
            'OVC': 'LOW_CLOUDS'
        };
        return typeMap[cloudType] || (index === 0 ? 'LOW_CLOUDS' : 'MID_CLOUDS');
    }
    getStatus() {
        return {
            isActive: this.isActive,
            cameraAltitude: Math.round(this.cameraAltitude),
            activeCloudLayers: Array.from(this.activeCloudLayers.keys()),
            layerOpacities: Array.from(this.activeCloudLayers.entries()).map(([key, layer]) => ({
                name: layer.name,
                opacity: Math.round(layer.currentOpacity * 100),
                altitudeRange: `${layer.baseAltitude}-${layer.topAltitude}ft`
            }))
        };
    }
}

export default ThreeDCloudManager;

// Make available globally for console testing
if (typeof window !== 'undefined') {
    window.ThreeDCloudManager = ThreeDCloudManager;
    console.log('🌩️ 3D Cloud Manager available at: window.ThreeDCloudManager');
}