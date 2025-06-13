/**
 * Enhanced3DControls.js
 * 
 * Advanced camera controls for 3D flight simulation
 * Provides smooth, aviation-realistic camera movements for cloud penetration effects
 */

class Enhanced3DControls {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.isActive = false;
        this.isDragging = false;
        this.lastMousePos = null;
        
        // Camera constraints for aviation realism
        this.constraints = {
            minPitch: 0,      // Top-down view
            maxPitch: 85,     // Nearly vertical (like looking up from cockpit)
            minZoom: 1,       // Global view
            maxZoom: 20,      // Close terrain view
            pitchSensitivity: 0.3,  // Mouse sensitivity for pitch
            bearingSensitivity: 0.5, // Mouse sensitivity for bearing
            zoomSensitivity: 0.1     // Scroll sensitivity
        };
        
        // Current camera state
        this.camera = {
            pitch: 0,
            bearing: 0,
            zoom: 6,
            center: null
        };
        
        console.log('🎮 Enhanced 3D Controls initialized');
    }
    
    /**
     * Activate enhanced 3D controls
     */
    activate() {
        if (!this.map || this.isActive) return;
        
        this.isActive = true;
        
        // Store current camera state
        this.camera.pitch = this.map.getPitch();
        this.camera.bearing = this.map.getBearing();
        this.camera.zoom = this.map.getZoom();
        this.camera.center = this.map.getCenter();
        
        // Add custom mouse controls
        this.addMouseControls();
        this.addKeyboardControls();
        this.addScrollControls();
        
        // Create control panel
        this.createControlPanel();
        
        console.log('✅ Enhanced 3D controls activated');
    }
    
    /**
     * Deactivate enhanced controls and return to normal
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.removeEventListeners();
        this.removeControlPanel();
        
        // Reset to normal 2D view
        this.map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
        });
        
        console.log('📐 Enhanced 3D controls deactivated');
    }
    
    /**
     * Add advanced mouse controls for flight simulation
     */
    addMouseControls() {
        // Right-click drag for pitch/bearing (like flight simulator)
        this.onMouseDown = (e) => {
            if (e.button === 2) { // Right mouse button
                e.preventDefault();
                this.isDragging = true;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                this.map.getContainer().style.cursor = 'move';
            }
        };
        
        this.onMouseMove = (e) => {
            if (!this.isDragging || !this.lastMousePos) return;
            
            const deltaX = e.clientX - this.lastMousePos.x;
            const deltaY = e.clientY - this.lastMousePos.y;
            
            // Calculate new camera angles
            const newBearing = this.camera.bearing + (deltaX * this.constraints.bearingSensitivity);
            const newPitch = Math.max(
                this.constraints.minPitch,
                Math.min(
                    this.constraints.maxPitch,
                    this.camera.pitch - (deltaY * this.constraints.pitchSensitivity)
                )
            );
            
            // Apply smooth camera movement
            this.map.easeTo({
                bearing: newBearing,
                pitch: newPitch,
                duration: 0 // Immediate for smooth dragging
            });
            
            // Update camera state
            this.camera.bearing = newBearing;
            this.camera.pitch = newPitch;
            
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.updateControlPanel();
        };
        
        this.onMouseUp = (e) => {
            if (e.button === 2) {
                this.isDragging = false;
                this.lastMousePos = null;
                this.map.getContainer().style.cursor = '';
            }
        };
        
        // Prevent context menu on right-click
        this.onContextMenu = (e) => e.preventDefault();
        
        const container = this.map.getContainer();
        container.addEventListener('mousedown', this.onMouseDown);
        container.addEventListener('mousemove', this.onMouseMove);
        container.addEventListener('mouseup', this.onMouseUp);
        container.addEventListener('contextmenu', this.onContextMenu);
    }
    
    /**
     * Add keyboard controls for precise movements
     */
    addKeyboardControls() {
        this.onKeyDown = (e) => {
            if (!this.isActive) return;
            
            let handled = false;
            const pitchStep = 5;
            const bearingStep = 10;
            const zoomStep = 0.5;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    // Increase pitch (look up)
                    this.adjustPitch(pitchStep);
                    handled = true;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    // Decrease pitch (look down)
                    this.adjustPitch(-pitchStep);
                    handled = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    // Rotate left
                    this.adjustBearing(-bearingStep);
                    handled = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    // Rotate right
                    this.adjustBearing(bearingStep);
                    handled = true;
                    break;
                case 'q':
                case 'Q':
                    // Zoom in (lower altitude)
                    this.adjustZoom(zoomStep);
                    handled = true;
                    break;
                case 'e':
                case 'E':
                    // Zoom out (higher altitude)
                    this.adjustZoom(-zoomStep);
                    handled = true;
                    break;
                case ' ':
                    // Spacebar - reset to level flight
                    this.resetToLevelFlight();
                    handled = true;
                    break;
            }
            
            if (handled) {
                e.preventDefault();
                this.updateControlPanel();
            }
        };
        
        document.addEventListener('keydown', this.onKeyDown);
    }
    
    /**
     * Enhanced scroll controls for altitude simulation
     */
    addScrollControls() {
        this.onWheel = (e) => {
            if (!this.isActive) return;
            
            e.preventDefault();
            
            // Holding Shift = adjust pitch instead of zoom
            if (e.shiftKey) {
                const pitchDelta = e.deltaY * 0.1;
                this.adjustPitch(-pitchDelta);
            } else {
                // Normal zoom with enhanced sensitivity
                const zoomDelta = e.deltaY * -0.01 * this.constraints.zoomSensitivity;
                this.adjustZoom(zoomDelta);
            }
            
            this.updateControlPanel();
        };
        
        this.map.getContainer().addEventListener('wheel', this.onWheel, { passive: false });
    }
    
    /**
     * Adjust pitch with constraints
     */
    adjustPitch(delta) {
        const newPitch = Math.max(
            this.constraints.minPitch,
            Math.min(this.constraints.maxPitch, this.camera.pitch + delta)
        );
        
        this.map.easeTo({
            pitch: newPitch,
            duration: 200
        });
        
        this.camera.pitch = newPitch;
    }
    
    /**
     * Adjust bearing (rotation)
     */
    adjustBearing(delta) {
        const newBearing = (this.camera.bearing + delta) % 360;
        
        this.map.easeTo({
            bearing: newBearing,
            duration: 200
        });
        
        this.camera.bearing = newBearing;
    }
    
    /**
     * Adjust zoom (altitude simulation)
     */
    adjustZoom(delta) {
        const newZoom = Math.max(
            this.constraints.minZoom,
            Math.min(this.constraints.maxZoom, this.camera.zoom + delta)
        );
        
        this.map.easeTo({
            zoom: newZoom,
            duration: 200
        });
        
        this.camera.zoom = newZoom;
    }
    
    /**
     * Reset to level flight (0 pitch, 0 bearing)
     */
    resetToLevelFlight() {
        this.map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
        });
        
        this.camera.pitch = 0;
        this.camera.bearing = 0;
    }
    
    /**
     * Create on-screen control panel
     */
    createControlPanel() {
        if (document.getElementById('enhanced-3d-controls')) return;
        
        const panel = document.createElement('div');
        panel.id = 'enhanced-3d-controls';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 200px;
        `;
        
        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #4CAF50;">🎮 Flight Controls</div>
            <div id="camera-info">
                <div>Pitch: <span id="pitch-value">0°</span></div>
                <div>Bearing: <span id="bearing-value">0°</span></div>
                <div>Altitude: <span id="altitude-value">0ft</span></div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #ccc;">
                <div>🖱️ Right-click + drag: Look around</div>
                <div>⌨️ WASD/Arrows: Pitch/Turn</div>
                <div>🖱️ Scroll: Altitude</div>
                <div>⇧ Shift+Scroll: Pitch</div>
                <div>⎵ Space: Level flight</div>
                <div>🎚️ Q/E: Fine altitude</div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.updateControlPanel();
    }
    
    /**
     * Update control panel display
     */
    updateControlPanel() {
        const pitchEl = document.getElementById('pitch-value');
        const bearingEl = document.getElementById('bearing-value');
        const altitudeEl = document.getElementById('altitude-value');
        
        if (pitchEl) pitchEl.textContent = `${Math.round(this.camera.pitch)}°`;
        if (bearingEl) bearingEl.textContent = `${Math.round(this.camera.bearing)}°`;
        if (altitudeEl) {
            // Calculate approximate altitude from zoom
            const altitude = Math.round(Math.pow(2, 15 - this.camera.zoom) * 100);
            altitudeEl.textContent = `${altitude.toLocaleString()}ft`;
        }
    }
    
    /**
     * Remove control panel
     */
    removeControlPanel() {
        const panel = document.getElementById('enhanced-3d-controls');
        if (panel) {
            panel.remove();
        }
    }
    
    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        const container = this.map.getContainer();
        if (this.onMouseDown) container.removeEventListener('mousedown', this.onMouseDown);
        if (this.onMouseMove) container.removeEventListener('mousemove', this.onMouseMove);
        if (this.onMouseUp) container.removeEventListener('mouseup', this.onMouseUp);
        if (this.onContextMenu) container.removeEventListener('contextmenu', this.onContextMenu);
        if (this.onWheel) container.removeEventListener('wheel', this.onWheel);
        if (this.onKeyDown) document.removeEventListener('keydown', this.onKeyDown);
    }
    
    /**
     * Get current camera state
     */
    getCameraState() {
        return {
            ...this.camera,
            estimatedAltitude: Math.round(Math.pow(2, 15 - this.camera.zoom) * 100)
        };
    }
}

export default Enhanced3DControls;

// Make available globally
if (typeof window !== 'undefined') {
    window.Enhanced3DControls = Enhanced3DControls;
    console.log('🎮 Enhanced 3D Controls available at: window.Enhanced3DControls');
}