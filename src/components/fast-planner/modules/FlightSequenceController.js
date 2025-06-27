/**
 * FlightSequenceController.js
 * 
 * Controls the map state sequence during flight loading.
 * Keeps track of: tilt state, map mode, edit mode, current step.
 * Works WITH existing flight loading, doesn't replace it.
 */

class FlightSequenceController {
  constructor(mapManagerRef, setCurrentMapMode = null) {
    this.mapManagerRef = mapManagerRef;
    this.setCurrentMapMode = setCurrentMapMode;
    this.currentStep = 'idle';
    this.isTilted = false;
    this.mapMode = 'dark'; // dark, satellite
    this.isEditMode = false;
    this.flightLoaded = false;
  }

  /**
   * Main sequence: Detect current state and choose appropriate animation
   */
  async startFlightLoadSequence(currentMapMode) {
    console.log('🎬 FlightSequenceController: Starting sequence - current mode:', currentMapMode);
    
    try {
      // Detect current state
      const isInStarlightMode = currentMapMode === '3d';
      
      console.log(`🎬 SEQUENCE DEBUG: Detected starlight mode: ${isInStarlightMode} (currentMapMode: "${currentMapMode}")`);
      
      if (isInStarlightMode) {
        console.log('🌪️ STARLIGHT MODE DETECTED - executing 360° spin sequence (will NOT apply tilt)');
        this.currentStep = 'spinning-360';
        await this.execute360Spin();
        this.needsTiltAfterData = false; // Don't tilt - stay in starlight mode
        console.log('🌪️ STARLIGHT MODE: needsTiltAfterData set to FALSE - will stay in starlight mode');
      } else {
        console.log('📐 EDIT MODE DETECTED - executing satellite + vertical sequence (will apply tilt)');
        this.currentStep = 'switching-to-satellite';
        await this.switchToSatelliteAndSetZoom();
        this.needsTiltAfterData = true; // Flag to tilt after data loads
        console.log('📐 EDIT MODE: needsTiltAfterData set to TRUE - will apply tilt after data loads');
      }
      
      this.currentStep = 'ready-for-data';
      console.log('🎬 Animation complete - proceeding with flight data loading');
      console.log(`🎬 SEQUENCE SUMMARY: needsTiltAfterData = ${this.needsTiltAfterData}`);
      
      return true;
    } catch (error) {
      console.error('🎬 FlightSequenceController: Sequence failed:', error);
      this.currentStep = 'error';
      return false;
    }
  }

  /**
   * Execute smooth 360° spin when already in starlight mode
   */
  async execute360Spin() {
    return new Promise((resolve) => {
      if (!this.mapManagerRef?.current) {
        console.warn('🎬 Map manager not available for 360° spin');
        resolve();
        return;
      }

      const map = this.mapManagerRef.current.getMap();
      if (!map) {
        console.warn('🎬 Map not available for 360° spin');
        resolve();
        return;
      }

      console.log('🌪️ Executing smooth 360° spin');
      
      const currentBearing = map.getBearing();
      const targetBearing = currentBearing + 360;
      
      map.flyTo({
        bearing: targetBearing,
        duration: 3000, // 3 seconds for full rotation
        easing: (t) => {
          // Super smooth easing - ease in-out with extra smoothness
          return t < 0.5 
            ? 2 * t * t * t * t
            : 1 - Math.pow(-2 * t + 2, 4) / 2;
        },
        essential: true
      });
      
      // Resolve when spin is mostly complete
      setTimeout(() => {
        console.log('🌪️ 360° spin complete');
        resolve();
      }, 3100);
    });
  }

  /**
   * Switch to satellite mode and set initial zoom (for edit mode)
   */
  async switchToSatelliteAndSetZoom() {
    return new Promise((resolve) => {
      if (!this.mapManagerRef?.current) {
        console.warn('🎬 Map manager not available for satellite switch');
        resolve();
        return;
      }

      const map = this.mapManagerRef.current.getMap();
      if (!map) {
        console.warn('🎬 Map not available for satellite switch');
        resolve();
        return;
      }

      console.log('🌟 Switching to satellite mode and setting zoom');
      map.setStyle('mapbox://styles/mapbox/satellite-v9');
      this.mapMode = 'satellite';
      
      // Wait for style to load, then set initial zoom
      setTimeout(() => {
        map.setZoom(6); // Set closer initial zoom
        console.log('🌟 Satellite mode and zoom set');
        resolve();
      }, 500);
    });
  }

  /**
   * Set initial closer zoom after wizard sets satellite mode
   */
  async setInitialZoom() {
    return new Promise((resolve) => {
      if (!this.mapManagerRef?.current) {
        console.warn('🎬 Map manager not available for initial zoom');
        resolve();
        return;
      }

      const map = this.mapManagerRef.current.getMap();
      if (!map) {
        console.warn('🎬 Map not available for initial zoom');
        resolve();
        return;
      }

      console.log('🌟 Setting closer initial zoom level');
      map.setZoom(6); // Set closer initial zoom
      this.mapMode = 'satellite'; // Track that we're in satellite mode
      
      setTimeout(() => {
        console.log('🌟 Initial zoom set');
        resolve();
      }, 100);
    });
  }

  /**
   * Called after flight data is loaded, before zoom
   */
  async executeDataLoadedSequence() {
    // Only apply tilt if coming from edit mode
    if (this.needsTiltAfterData) {
      console.log('🎬 Flight data loaded - applying tilt before zoom (from edit mode)');
      
      try {
        this.currentStep = 'applying-tilt';
        await this.applyTilt();
        this.needsTiltAfterData = false;
        
        this.currentStep = 'ready-for-zoom';
        console.log('🎬 Tilt complete - ready for zoom');
        
        return true;
      } catch (error) {
        console.error('🎬 Tilt sequence failed:', error);
        this.currentStep = 'tilt-error';
        return false;
      }
    } else {
      console.log('🎬 Flight data loaded - already in starlight mode, skipping tilt (staying in starlight)');
      this.currentStep = 'ready-for-zoom';
      return true;
    }
  }

  /**
   * Step 1: Switch to satellite mode
   */
  async switchToSatellite() {
    return new Promise((resolve) => {
      if (!this.mapManagerRef?.current) {
        console.warn('🎬 Map manager not available for satellite switch');
        resolve();
        return;
      }

      const map = this.mapManagerRef.current.getMap();
      if (!map) {
        console.warn('🎬 Map not available for satellite switch');
        resolve();
        return;
      }

      console.log('🌟 Switching to satellite mode');
      map.setStyle('mapbox://styles/mapbox/satellite-v9');
      this.mapMode = 'satellite';
      
      // Wait for style to load, then set initial closer zoom
      setTimeout(() => {
        // Set a closer initial zoom level
        map.setZoom(6); // Start closer (was whatever the current zoom was)
        console.log('🌟 Satellite mode active with closer initial zoom');
        resolve();
      }, 500);
    });
  }

  /**
   * Step 2: Apply 60° tilt with smooth easing
   */
  async applyTilt() {
    return new Promise((resolve) => {
      if (!this.mapManagerRef?.current) {
        console.warn('🎬 Map manager not available for tilt');
        resolve();
        return;
      }

      const map = this.mapManagerRef.current.getMap();
      if (!map) {
        console.warn('🎬 Map not available for tilt');
        resolve();
        return;
      }

      console.log('🎭 Applying 60° tilt with smooth easing');
      map.flyTo({
        pitch: 60,
        duration: 1500,  // Slower for smoother feel (was 1000)
        easing: (t) => {
          // Custom smooth easing - ease out cubic
          return 1 - Math.pow(1 - t, 3);
        },
        essential: true
      });
      
      this.isTilted = true;
      
      // Resolve earlier so zoom can start overlapping with end of tilt
      setTimeout(() => {
        console.log('🎭 Tilt ready for zoom overlap');
        resolve();
      }, 1000); // Start zoom while tilt is finishing (was 1100)
    });
  }

  /**
   * Called by main flight loading when ready to zoom
   */
  async executeZoom(waypoints, alternateRouteData = null) {
    if (this.currentStep !== 'ready-for-zoom') {
      console.warn('🎬 Zoom called but sequence not ready. Current step:', this.currentStep);
    }

    this.currentStep = 'zooming';
    
    if (!this.mapManagerRef?.current || !waypoints?.length) {
      console.warn('🎬 Cannot zoom - missing map or waypoints');
      this.currentStep = 'zoom-failed';
      return false;
    }

    console.log('🔍 Executing zoom to flight (including alternates)');
    console.log(`🔍 ZOOM DEBUG: needsTiltAfterData was ${this.needsTiltAfterData} - should preserve current tilt`);
    
    // Get current map pitch to preserve it during zoom
    const map = this.mapManagerRef.current.getMap();
    const currentPitch = map ? map.getPitch() : 60;
    console.log(`🔍 ZOOM DEBUG: Current map pitch: ${currentPitch}° - will preserve this during zoom`);
    
    // Combine main waypoints with alternate route coordinates for bounds calculation
    let allCoordinates = [...waypoints];
    
    // Add alternate route coordinates if available
    if (alternateRouteData?.coordinates) {
      console.log('🔍 Including alternate route coordinates in zoom bounds');
      const alternateWaypoints = alternateRouteData.coordinates.map(coord => ({
        lng: coord[0],
        lat: coord[1],
        name: 'Alternate'
      }));
      allCoordinates = [...allCoordinates, ...alternateWaypoints];
      console.log(`🔍 Zoom bounds now include ${waypoints.length} main + ${alternateWaypoints.length} alternate points`);
    }
    
    const zoomSuccess = this.mapManagerRef.current.autoZoomToFlight(allCoordinates, {
      padding: 80,      // Slightly more padding to accommodate alternates
      maxZoom: 10,      // Slightly less close to fit everything
      duration: 2500,   // Slightly slower for smoother flow
      animate: true,
      pitch: currentPitch, // Preserve current pitch (60° for starlight mode, or current tilt)
      easing: (t) => {
        // Custom smooth easing - ease in-out cubic
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
    });

    if (zoomSuccess) {
      this.currentStep = 'zoom-complete';
      console.log('🔍 Zoom complete');
    } else {
      this.currentStep = 'zoom-failed';
      console.warn('🔍 Zoom failed');
    }

    return zoomSuccess;
  }

  /**
   * Final step: Mark sequence complete and ready for weather
   */
  markSequenceComplete() {
    this.currentStep = 'complete';
    this.flightLoaded = true;
    
    // Update app state to show we're in starlight mode (3d = satellite + tilt)
    if (this.setCurrentMapMode) {
      this.setCurrentMapMode('3d');
      console.log('🎬 Updated app state to 3d mode (starlight)');
    }
    
    console.log('🎬 Flight sequence complete - ready for weather/alternates');
    
    // NOW load weather and alternates AFTER sequence is complete
    this.loadWeatherAndAlternates();
    
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('flight-sequence-complete'));
  }

  /**
   * Load weather and alternates AFTER the flight sequence completes
   */
  async loadWeatherAndAlternates() {
    console.log('🌤️ SEQUENCE CONTROLLER: Now loading weather and alternates after flight sequence complete');
    
    // Use already loaded weather segments if available, otherwise load them
    if (window.loadedWeatherSegments && window.loadedWeatherSegments.length > 0) {
      console.log('🌤️ SEQUENCE CONTROLLER: Using already loaded weather segments:', window.loadedWeatherSegments.length);
      this.createWeatherCircles(window.loadedWeatherSegments);
    } else if (window.currentFlightData?.flightId) {
      console.log('🌤️ SEQUENCE CONTROLLER: Loading weather segments for flight:', window.currentFlightData.flightId);
      
      // Load weather segments quickly
      (async () => {
        try {
          const sdk = await import('@flight-app/sdk');
          const { default: client } = await import('../../../client');
          
          if (!sdk.NorwayWeatherSegments) {
            throw new Error('NorwayWeatherSegments not found in SDK');
          }
          
          // Fetch weather segments
          const weatherResult = await client(sdk.NorwayWeatherSegments)
            .where({ flightUuid: window.currentFlightData.flightId })
            .fetchPage({ $pageSize: 1000 });
            
          const loadedWeatherSegments = weatherResult.data || [];
          console.log(`🌤️ SEQUENCE CONTROLLER: Fetched ${loadedWeatherSegments.length} weather segments`);
          
          if (loadedWeatherSegments.length > 0) {
            window.loadedWeatherSegments = loadedWeatherSegments;
            this.createWeatherCircles(loadedWeatherSegments);
          }
        } catch (error) {
          console.error('🌤️ SEQUENCE CONTROLLER: Error loading weather segments:', error);
        }
      })();
    }
  }

  createWeatherCircles(weatherSegments) {
    const hasMap = window.mapManager?.map || this.mapManagerRef?.current?.map;
    if (weatherSegments && weatherSegments.length > 0 && hasMap) {
      console.log('🌤️ SEQUENCE CONTROLLER: Creating weather circles immediately');
      
      import('./layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
        // Clean up existing layer
        if (window.currentWeatherCirclesLayer) {
          try {
            window.currentWeatherCirclesLayer.removeWeatherCircles();
          } catch (e) { 
            console.warn('Weather cleanup warning:', e.message); 
          }
        }
        
        // Create new layer
        const weatherCirclesLayer = new WeatherCirclesLayer(hasMap);
        weatherCirclesLayer.addWeatherCircles(weatherSegments);
        window.currentWeatherCirclesLayer = weatherCirclesLayer;
        console.log('🌤️ SEQUENCE CONTROLLER: Weather circles created immediately - SUCCESS');
        
      }).catch(error => {
        console.error('🌤️ SEQUENCE CONTROLLER: Error creating weather circles:', error);
      });
    }
    
    // Load alternate routes immediately
    if (window.currentFlightData?.alternateRouteData) {
      console.log('🟠 SEQUENCE CONTROLLER: Loading alternate routes immediately');
      
      // Process alternate route data immediately
      const alternateData = window.currentFlightData.alternateRouteData;
      
      if (window.appManagers?.waypointManagerRef?.current && alternateData) {
        window.appManagers.waypointManagerRef.current.updateRoute(window.currentRouteStats, alternateData);
        console.log('🟠 SEQUENCE CONTROLLER: Alternate route rendered immediately');
      }
    }
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      step: this.currentStep,
      tilted: this.isTilted,
      mapMode: this.mapMode,
      editMode: this.isEditMode,
      flightLoaded: this.flightLoaded
    };
  }

  /**
   * Reset for new flight or clear
   */
  reset() {
    this.currentStep = 'idle';
    this.isTilted = false;
    this.mapMode = 'dark';
    this.isEditMode = false;
    this.flightLoaded = false;
    console.log('🎬 FlightSequenceController reset');
  }
}

export default FlightSequenceController;