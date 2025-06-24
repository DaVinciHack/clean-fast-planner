/**
 * AutoFlightManager.js
 * 
 * REVOLUTIONARY Automatic Flight Simulation System
 * Flies your planned route automatically with realistic movements,
 * altitude changes, weather avoidance, and time-lapse effects
 */

class AutoFlightManager {
    constructor(mapInstance, enhanced3DControls) {
        // Validate map instance
        if (!mapInstance) {
            throw new Error('❌ AutoFlightManager requires a valid map instance');
        }
        
        // Validate map is loaded
        if (!mapInstance.isStyleLoaded || !mapInstance.isStyleLoaded()) {
            console.warn('⚠️ Map style not loaded yet - AutoFlight may not work correctly');
        }
        
        this.map = mapInstance;
        this.controls = enhanced3DControls;
        this.isFlying = false;
        this.isPaused = false;
        this.currentWaypointIndex = 0;
        this.flightProgress = 0; // 0-1 between current waypoints
        this.animationFrame = null;
        this.hasError = false; // Track error state
        
        // Flight configuration
        this.config = {
            speedMultiplier: 5,     // 1x to 50x speed
            cruiseAltitude: 3000,   // Default cruise altitude (feet)
            climbRate: 500,         // Feet per minute climb
            turnRate: 2,            // Degrees per second turn rate
            groundSpeed: 120,       // Knots ground speed
            frameRate: 60          // Animation frames per second
        };
        
        // Flight data
        this.route = {
            waypoints: [],          // [{ lat, lng, name, altitude? }]
            totalDistance: 0,       // Nautical miles
            estimatedTime: 0,       // Minutes
            currentPosition: null,  // Current lat/lng
            currentAltitude: 0,     // Current altitude
            currentHeading: 0       // Current magnetic heading
        };
        
        // Flight state
        this.state = {
            phase: 'PREFLIGHT',     // PREFLIGHT, TAXI, TAKEOFF, CRUISE, APPROACH, LANDED
            startTime: null,
            elapsedTime: 0,         // Real elapsed seconds
            simulatedTime: 0,       // Simulated flight time
            fuelRemaining: 100      // Percentage
        };
        
        console.log('🛩️ AutoFlight Manager initialized - Ready for automatic flight simulation!');
    }
    
    /**
     * Load flight route from waypoints
     * @param {Array} waypoints - Array of waypoint objects
     */
    loadRoute(waypoints) {
        console.log('🛩️ Loading route with waypoints:', waypoints);
        
        if (!waypoints || waypoints.length < 2) {
            console.error('❌ Need at least 2 waypoints for flight route, got:', waypoints?.length || 0);
            return false;
        }
        
        // Validate waypoint data
        const validWaypoints = waypoints.filter(wp => {
            const hasLat = wp.lat !== undefined || wp.latitude !== undefined;
            const hasLng = wp.lng !== undefined || wp.longitude !== undefined || wp.lon !== undefined;
            
            if (!hasLat || !hasLng) {
                console.warn('⚠️ Invalid waypoint (missing coordinates):', wp);
                return false;
            }
            return true;
        });
        
        if (validWaypoints.length < 2) {
            console.error('❌ Not enough valid waypoints after validation:', validWaypoints.length);
            return false;
        }
        
        this.route.waypoints = validWaypoints.map((wp, index) => ({
            lat: wp.lat || wp.latitude,
            lng: wp.lng || wp.longitude || wp.lon,
            name: wp.name || `WP${index + 1}`,
            altitude: wp.altitude || this.config.cruiseAltitude,
            index: index
        }));
        
        console.log('🛩️ Processed waypoints:', this.route.waypoints);
        
        // Calculate total distance and flight time
        this.calculateRouteMetrics();
        
        // Set starting position
        this.route.currentPosition = { ...this.route.waypoints[0] };
        this.route.currentAltitude = this.route.waypoints[0].altitude;
        this.currentWaypointIndex = 0;
        this.flightProgress = 0;
        
        console.log(`✅ Route loaded: ${this.route.waypoints.length} waypoints, ${this.route.totalDistance.toFixed(1)}NM, ~${this.route.estimatedTime.toFixed(0)} minutes`);
        console.log(`🛩️ Route: ${this.route.waypoints.map(wp => wp.name).join(' → ')}`);
        
        // Don't create DOM panel - use React panel instead
        console.log('🛩️ Route ready for flight simulation');
        return true;
    }
    
    /**
     * Calculate route distance and estimated flight time
     */
    calculateRouteMetrics() {
        this.route.totalDistance = 0;
        
        for (let i = 0; i < this.route.waypoints.length - 1; i++) {
            const from = this.route.waypoints[i];
            const to = this.route.waypoints[i + 1];
            const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
            this.route.totalDistance += distance;
        }
        
        // Estimate flight time (distance / ground speed * 60 for minutes)
        this.route.estimatedTime = (this.route.totalDistance / this.config.groundSpeed) * 60;
    }
    
    /**
     * Start automatic flight simulation
     */
    startFlight() {
        console.log('🛩️ Starting auto flight...');
        
        // Validate prerequisites
        if (!this.route.waypoints.length) {
            console.error('❌ No route loaded for flight');
            this.hasError = true;
            return false;
        }
        
        if (this.isFlying) {
            console.warn('⚠️ Flight already in progress');
            return false;
        }
        
        if (!this.map || !this.map.isStyleLoaded()) {
            console.error('❌ Map not ready for flight simulation');
            this.hasError = true;
            return false;
        }
        
        try {
            this.isFlying = true;
            this.isPaused = false;
            this.hasError = false;
            this.state.phase = 'TAKEOFF';
            this.state.startTime = Date.now();
            
            // DON'T reset position if we already have one (preserve scrubbed position)
            if (this.currentWaypointIndex === undefined || this.currentWaypointIndex === null) {
                this.currentWaypointIndex = 0;
                this.flightProgress = 0;
            }
            
            console.log(`🛩️ Starting flight from waypoint ${this.currentWaypointIndex + 1}, progress: ${Math.round(this.flightProgress * 100)}%`);
            
            console.log(`🛫 Starting flight with ${this.route.waypoints.length} waypoints`);
            console.log(`🛫 Route: ${this.route.waypoints.map(wp => wp.name).join(' → ')}`);
            
            // Move camera to current position (not always departure)
            let currentPosition;
            if (this.route.currentPosition) {
                // Use existing current position (from scrubbing)
                currentPosition = this.route.currentPosition;
                console.log('🛫 Moving camera to current position:', currentPosition);
            } else {
                // Fall back to departure if no current position
                currentPosition = { lat: this.route.waypoints[0].lat, lng: this.route.waypoints[0].lng };
                this.route.currentPosition = currentPosition;
                console.log('🛫 Moving camera to departure:', currentPosition);
            }
            
            this.map.easeTo({
                center: [currentPosition.lng, currentPosition.lat],
                zoom: 12,
                pitch: 45,
                bearing: this.calculateInitialHeading(),
                duration: 2000
            });
            
            // Start flight animation after camera move
            setTimeout(() => {
                if (this.isFlying && !this.hasError) {
                    console.log('🛫 Starting flight animation...');
                    this.startFlightAnimation();
                }
            }, 2500);
            
            console.log('✅ Flight started! Automatic navigation engaged.');
            this.updateFlightPanel();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error starting flight:', error);
            this.hasError = true;
            this.isFlying = false;
            return false;
        }
    }
    
    /**
     * Pause/resume flight
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(`${this.isPaused ? '⏸️ Flight paused' : '▶️ Flight resumed'}`);
        this.updateFlightPanel();
    }
    
    /**
     * Stop flight and return to normal view
     */
    stopFlight() {
        this.isFlying = false;
        this.isPaused = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.state.phase = 'LANDED';
        console.log('🛬 Flight stopped');
        this.updateFlightPanel();
    }
    
    /**
     * Set flight progress to specific point (0-100%)
     */
    setFlightProgress(percent) {
        if (!this.route.waypoints.length) return;
        
        console.log(`🛩️ Setting flight progress to ${percent}%`);
        
        // Convert percentage to waypoint index and progress
        const totalProgress = (percent / 100) * (this.route.waypoints.length - 1);
        this.currentWaypointIndex = Math.floor(totalProgress);
        this.flightProgress = totalProgress - this.currentWaypointIndex;
        
        // Ensure we don't exceed bounds
        if (this.currentWaypointIndex >= this.route.waypoints.length - 1) {
            this.currentWaypointIndex = this.route.waypoints.length - 2;
            this.flightProgress = 1;
        }
        
        // Calculate new position
        if (this.currentWaypointIndex < this.route.waypoints.length - 1) {
            const currentWP = this.route.waypoints[this.currentWaypointIndex];
            const nextWP = this.route.waypoints[this.currentWaypointIndex + 1];
            
            // Interpolate position
            const lat = currentWP.lat + (nextWP.lat - currentWP.lat) * this.flightProgress;
            const lng = currentWP.lng + (nextWP.lng - currentWP.lng) * this.flightProgress;
            const altitude = currentWP.altitude + (nextWP.altitude - currentWP.altitude) * this.flightProgress;
            
            this.route.currentPosition = { lat, lng };
            this.route.currentAltitude = altitude;
            
            // Update camera to new position
            if (this.map && this.map.isStyleLoaded()) {
                this.map.easeTo({
                    center: [lng, lat],
                    duration: 1000
                });
            }
        }
        
        console.log(`🛩️ Jumped to waypoint ${this.currentWaypointIndex + 1}/${this.route.waypoints.length}, progress: ${Math.round(this.flightProgress * 100)}%`);
    }
    
    /**
     * Main flight animation loop
     */
    startFlightAnimation() {
        const animate = () => {
            if (!this.isFlying || this.hasError) {
                console.log('🛩️ Animation stopped - flying:', this.isFlying, 'error:', this.hasError);
                return;
            }
            
            try {
                if (!this.isPaused) {
                    this.updateFlightPosition();
                    this.updateCamera();
                    this.updateFlightState();
                }
                
                this.updateFlightPanel();
                this.animationFrame = requestAnimationFrame(animate);
                
            } catch (error) {
                console.error('❌ Error in flight animation:', error);
                this.hasError = true;
                this.stopFlight();
            }
        };
        
        animate();
    }
    
    /**
     * Update aircraft position along route
     */
    updateFlightPosition() {
        const deltaTime = (1000 / this.config.frameRate) * this.config.speedMultiplier;
        
        // Check if we've reached the destination
        if (this.currentWaypointIndex >= this.route.waypoints.length - 1) {
            this.completeFlight();
            return;
        }
        
        const currentWP = this.route.waypoints[this.currentWaypointIndex];
        const nextWP = this.route.waypoints[this.currentWaypointIndex + 1];
        
        // Calculate distance between current waypoints
        const segmentDistance = this.calculateDistance(currentWP.lat, currentWP.lng, nextWP.lat, nextWP.lng);
        
        // Calculate how far we should move this frame (in nautical miles)
        const speedNMPerMs = this.config.groundSpeed / (60 * 60 * 1000); // NM per millisecond
        const distanceThisFrame = speedNMPerMs * deltaTime;
        const progressThisFrame = distanceThisFrame / segmentDistance;
        
        // Update progress along current segment
        this.flightProgress += progressThisFrame;
        
        if (this.flightProgress >= 1.0) {
            // Reached next waypoint
            this.currentWaypointIndex++;
            this.flightProgress = 0;
            
            if (this.currentWaypointIndex < this.route.waypoints.length) {
                console.log(`📍 Reached waypoint: ${this.route.waypoints[this.currentWaypointIndex].name}`);
            }
        } else {
            // Interpolate position between waypoints
            const lat = this.lerp(currentWP.lat, nextWP.lat, this.flightProgress);
            const lng = this.lerp(currentWP.lng, nextWP.lng, this.flightProgress);
            const altitude = this.lerp(currentWP.altitude, nextWP.altitude, this.flightProgress);
            
            this.route.currentPosition = { lat, lng };
            this.route.currentAltitude = altitude;
            
            // Calculate current heading
            this.route.currentHeading = this.calculateBearing(currentWP.lat, currentWP.lng, nextWP.lat, nextWP.lng);
        }
        
        // Update simulated time
        this.state.elapsedTime = (Date.now() - this.state.startTime) / 1000;
        this.state.simulatedTime = this.state.elapsedTime * this.config.speedMultiplier;
        
        // Update fuel (simple linear consumption)
        const totalFlightTime = this.route.estimatedTime * 60; // seconds
        this.state.fuelRemaining = Math.max(0, 100 - (this.state.simulatedTime / totalFlightTime) * 100);
    }
    
    /**
     * Update camera to follow aircraft
     */
    updateCamera() {
        if (!this.route.currentPosition || !this.map) return;
        
        try {
            // Calculate camera altitude based on flight altitude + offset
            const cameraZoom = this.altitudeToZoom(this.route.currentAltitude + 2000);
            
            // Smooth camera following
            this.map.easeTo({
                center: [this.route.currentPosition.lng, this.route.currentPosition.lat],
                zoom: cameraZoom,
                bearing: this.route.currentHeading,
                pitch: 60, // Good angle for following flight
                duration: 100 // Smooth but responsive
            });
            
            // Update 3D cloud effects if active
            if (window.threeDCloudManager && window.threeDCloudManager.isActive) {
                try {
                    window.threeDCloudManager.cameraAltitude = this.route.currentAltitude;
                    window.threeDCloudManager.updateCloudOpacity();
                } catch (cloudError) {
                    console.warn('⚠️ 3D cloud update error:', cloudError);
                }
            }
            
        } catch (error) {
            console.error('❌ Camera update error:', error);
            // Don't stop flight for camera errors, just log them
        }
    }
    
    /**
     * Update flight state and phase
     */
    updateFlightState() {
        const progressPercent = ((this.currentWaypointIndex + this.flightProgress) / (this.route.waypoints.length - 1)) * 100;
        
        // Update flight phase based on progress
        if (progressPercent < 5) {
            this.state.phase = 'TAKEOFF';
        } else if (progressPercent < 95) {
            this.state.phase = 'CRUISE';
        } else {
            this.state.phase = 'APPROACH';
        }
    }
    
    /**
     * Complete flight sequence
     */
    completeFlight() {
        this.isFlying = false;
        this.state.phase = 'LANDED';
        
        // Final approach to destination
        const destination = this.route.waypoints[this.route.waypoints.length - 1];
        this.map.easeTo({
            center: [destination.lng, destination.lat],
            zoom: 14,
            pitch: 30,
            bearing: 0,
            duration: 3000
        });
        
        console.log('🛬 Flight completed! Welcome to your destination.');
        this.updateFlightPanel();
    }
    
    /**
     * Flight control panel handled by React component
     * This function is kept for compatibility but doesn't create DOM elements
     */
    createFlightPanel() {
        console.log('🛩️ Flight panel creation handled by React component');
        // Panel is now handled by the React MapLayersCard component
        // No DOM manipulation needed
    }
    
    /**
     * Update flight panel display - now handled by React component
     */
    updateFlightPanel() {
        // Flight panel updates are now handled by React component
        // The MapLayersCard component reads the flight state directly from this manager
        console.log('🛩️ Flight panel update: React component handles display');
    }
    
    /**
     * Utility functions
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3440.065; // Earth radius in nautical miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
                  Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }
    
    calculateInitialHeading() {
        if (this.route.waypoints.length < 2) return 0;
        return this.calculateBearing(
            this.route.waypoints[0].lat, this.route.waypoints[0].lng,
            this.route.waypoints[1].lat, this.route.waypoints[1].lng
        );
    }
    
    altitudeToZoom(altitude) {
        // Convert altitude to appropriate zoom level
        return Math.max(8, Math.min(16, 18 - Math.log2(altitude / 1000)));
    }
    
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }
    
    /**
     * Remove flight panel - now handled by React component
     */
    removeFlightPanel() {
        console.log('🛩️ Flight panel removal handled by React component');
        // Panel cleanup is now handled by the React MapLayersCard component
    }
    
    /**
     * Debug method to check current state
     */
    debugStatus() {
        console.log('🛩️ ===== AUTO FLIGHT DEBUG STATUS =====');
        console.log('Map instance:', this.map);
        console.log('Map style loaded:', this.map?.isStyleLoaded?.());
        console.log('Is flying:', this.isFlying);
        console.log('Is paused:', this.isPaused);
        console.log('Has error:', this.hasError);
        console.log('Route waypoints:', this.route.waypoints.length);
        console.log('Current waypoint index:', this.currentWaypointIndex);
        console.log('Flight progress:', this.flightProgress);
        console.log('Current position:', this.route.currentPosition);
        console.log('Flight state:', this.state);
        console.log('Animation frame:', this.animationFrame);
        console.log('Flight panel exists:', !!document.getElementById('auto-flight-panel'));
        console.log('🛩️ ===== END DEBUG STATUS =====');
    }
    
    /**
     * Clean up
     */
    destroy() {
        this.stopFlight();
        this.removeFlightPanel();
    }
}

export default AutoFlightManager;

// Make available globally
if (typeof window !== 'undefined') {
    window.AutoFlightManager = AutoFlightManager;
    console.log('🛩️ AutoFlight Manager available at: window.AutoFlightManager');
    
    // Add global debug function
    window.debugAutoFlight = () => {
        if (window.autoFlightManager) {
            window.autoFlightManager.debugStatus();
        } else {
            console.log('🛩️ No active auto flight manager found');
            console.log('🛩️ Available:', {
                AutoFlightManager: !!window.AutoFlightManager,
                mapManager: !!window.mapManager,
                enhanced3DControls: !!window.enhanced3DControls
            });
        }
    };
}