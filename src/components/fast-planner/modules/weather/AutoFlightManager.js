/**
 * AutoFlightManager.js
 * 
 * REVOLUTIONARY Automatic Flight Simulation System
 * Flies your planned route automatically with realistic movements,
 * altitude changes, weather avoidance, and time-lapse effects
 */

class AutoFlightManager {
    constructor(mapInstance, enhanced3DControls) {
        this.map = mapInstance;
        this.controls = enhanced3DControls;
        this.isFlying = false;
        this.isPaused = false;
        this.currentWaypointIndex = 0;
        this.flightProgress = 0; // 0-1 between current waypoints
        this.animationFrame = null;
        
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
        if (!waypoints || waypoints.length < 2) {
            console.error('❌ Need at least 2 waypoints for flight route');
            return false;
        }
        
        this.route.waypoints = waypoints.map((wp, index) => ({
            lat: wp.lat || wp.latitude,
            lng: wp.lng || wp.longitude || wp.lon,
            name: wp.name || `WP${index + 1}`,
            altitude: wp.altitude || this.config.cruiseAltitude,
            index: index
        }));
        
        // Calculate total distance and flight time
        this.calculateRouteMetrics();
        
        // Set starting position
        this.route.currentPosition = { ...this.route.waypoints[0] };
        this.route.currentAltitude = this.route.waypoints[0].altitude;
        this.currentWaypointIndex = 0;
        this.flightProgress = 0;
        
        console.log(`🛩️ Route loaded: ${this.route.waypoints.length} waypoints, ${this.route.totalDistance.toFixed(1)}NM, ~${this.route.estimatedTime.toFixed(0)} minutes`);
        
        this.createFlightPanel();
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
        if (!this.route.waypoints.length) {
            console.error('❌ No route loaded for flight');
            return false;
        }
        
        if (this.isFlying) {
            console.warn('⚠️ Flight already in progress');
            return false;
        }
        
        this.isFlying = true;
        this.isPaused = false;
        this.state.phase = 'TAKEOFF';
        this.state.startTime = Date.now();
        this.currentWaypointIndex = 0;
        this.flightProgress = 0;
        
        // Move camera to departure position
        this.map.easeTo({
            center: [this.route.waypoints[0].lng, this.route.waypoints[0].lat],
            zoom: 12,
            pitch: 45,
            bearing: this.calculateInitialHeading(),
            duration: 2000
        });
        
        // Start flight animation
        setTimeout(() => {
            this.startFlightAnimation();
        }, 2500);
        
        console.log('🛫 Flight started! Automatic navigation engaged.');
        this.updateFlightPanel();
        
        return true;
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
     * Main flight animation loop
     */
    startFlightAnimation() {
        const animate = () => {
            if (!this.isFlying) return;
            
            if (!this.isPaused) {
                this.updateFlightPosition();
                this.updateCamera();
                this.updateFlightState();
            }
            
            this.updateFlightPanel();
            this.animationFrame = requestAnimationFrame(animate);
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
        if (!this.route.currentPosition) return;
        
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
            // Force cloud opacity update based on current altitude
            window.threeDCloudManager.cameraAltitude = this.route.currentAltitude;
            window.threeDCloudManager.updateCloudOpacity();
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
     * Create flight control panel
     */
    createFlightPanel() {
        if (document.getElementById('auto-flight-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'auto-flight-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            border: 1px solid rgba(0, 150, 255, 0.5);
            min-width: 280px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;
        
        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #00aaff;">✈️ Auto Flight Control</div>
            <div id="flight-info">
                <div>Phase: <span id="flight-phase">PREFLIGHT</span></div>
                <div>Waypoint: <span id="current-waypoint">-</span></div>
                <div>Position: <span id="current-position">-</span></div>
                <div>Altitude: <span id="current-altitude">0ft</span></div>
                <div>Heading: <span id="current-heading">0°</span></div>
                <div>Speed: <span id="flight-speed">${this.config.groundSpeed}kt</span></div>
                <div>Fuel: <span id="fuel-remaining">100%</span></div>
                <div>Time: <span id="flight-time">00:00</span></div>
            </div>
            <div style="margin-top: 10px;">
                <button id="start-flight-btn" style="margin-right: 5px; padding: 4px 8px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">🛫 Start</button>
                <button id="pause-flight-btn" style="margin-right: 5px; padding: 4px 8px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer;">⏸️ Pause</button>
                <button id="stop-flight-btn" style="margin-right: 5px; padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">🛑 Stop</button>
            </div>
            <div style="margin-top: 8px;">
                <label>Speed: </label>
                <input type="range" id="speed-slider" min="1" max="50" value="${this.config.speedMultiplier}" 
                       style="width: 100px; margin: 0 5px;"> 
                <span id="speed-value">${this.config.speedMultiplier}x</span>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('start-flight-btn').onclick = () => this.startFlight();
        document.getElementById('pause-flight-btn').onclick = () => this.togglePause();
        document.getElementById('stop-flight-btn').onclick = () => this.stopFlight();
        
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.oninput = (e) => {
            this.config.speedMultiplier = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.config.speedMultiplier}x`;
        };
    }
    
    /**
     * Update flight panel display
     */
    updateFlightPanel() {
        const phaseEl = document.getElementById('flight-phase');
        const waypointEl = document.getElementById('current-waypoint');
        const positionEl = document.getElementById('current-position');
        const altitudeEl = document.getElementById('current-altitude');
        const headingEl = document.getElementById('current-heading');
        const fuelEl = document.getElementById('fuel-remaining');
        const timeEl = document.getElementById('flight-time');
        
        if (phaseEl) phaseEl.textContent = this.state.phase;
        if (waypointEl && this.currentWaypointIndex < this.route.waypoints.length) {
            waypointEl.textContent = `${this.currentWaypointIndex + 1}/${this.route.waypoints.length} - ${this.route.waypoints[this.currentWaypointIndex].name}`;
        }
        if (positionEl && this.route.currentPosition) {
            positionEl.textContent = `${this.route.currentPosition.lat.toFixed(4)}, ${this.route.currentPosition.lng.toFixed(4)}`;
        }
        if (altitudeEl) altitudeEl.textContent = `${Math.round(this.route.currentAltitude)}ft`;
        if (headingEl) headingEl.textContent = `${Math.round(this.route.currentHeading)}°`;
        if (fuelEl) fuelEl.textContent = `${Math.round(this.state.fuelRemaining)}%`;
        if (timeEl) {
            const minutes = Math.floor(this.state.simulatedTime / 60);
            const seconds = Math.floor(this.state.simulatedTime % 60);
            timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
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
     * Remove flight panel
     */
    removeFlightPanel() {
        const panel = document.getElementById('auto-flight-panel');
        if (panel) panel.remove();
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
}