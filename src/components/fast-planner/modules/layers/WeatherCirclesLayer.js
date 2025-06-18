/**
 * WeatherCirclesLayer.js
 * 
 * 3D weather circles lying flat on the ground under all other elements
 * Color-coded by weather ranking using aviation-specific colors
 */

class WeatherCirclesLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'weather-circles-source';
    this.layerId = 'weather-circles-layer';
    this.isVisible = false;
    this.currentWeatherSegments = [];
  }

  /**
   * Add weather circles to the map
   * @param {Array} weatherSegments - Array of weather segments with coordinates and rankings
   */
  addWeatherCircles(weatherSegments) {
    if (!weatherSegments || !this.map) {
      console.warn('WeatherCirclesLayer: Missing weatherSegments or map');
      return;
    }
    
    // ENHANCED RACE CONDITION PROTECTION: Check if another process is already creating weather circles
    const lockStartTime = Date.now();
    if (window.weatherCirclesCreationInProgress) {
      const lockAge = Date.now() - (window.weatherCirclesLockTime || 0);
      console.log(`🔄 WeatherCirclesLayer: Creation lock active for ${lockAge}ms`);
      
      // If lock is older than 10 seconds OR this is a legitimate retry, clear it
      if (lockAge > 10000) {
        console.log('🔓 WeatherCirclesLayer: Clearing stale lock (older than 10s)');
        window.weatherCirclesCreationInProgress = false;
        window.weatherCirclesLockTime = null;
      } else {
        console.log('🔄 WeatherCirclesLayer: Recent lock detected, skipping duplicate request');
        return;
      }
    }
    
    // Set the lock with timestamp
    window.weatherCirclesCreationInProgress = true;
    window.weatherCirclesLockTime = lockStartTime;
    console.log(`🔒 WeatherCirclesLayer: Setting creation lock at ${lockStartTime}`);
    
    // Clear the lock after completion (with failsafe timeout)
    const clearLock = () => {
      if (window.weatherCirclesCreationInProgress && window.weatherCirclesLockTime === lockStartTime) {
        window.weatherCirclesCreationInProgress = false;
        window.weatherCirclesLockTime = null;
        console.log(`🔓 WeatherCirclesLayer: Clearing creation lock (held for ${Date.now() - lockStartTime}ms)`);
      }
    };
    
    // Failsafe: Clear lock after 5 seconds if something goes wrong
    setTimeout(clearLock, 5000);
    
    console.log('🟡 WeatherCirclesLayer: Adding', weatherSegments.length, 'weather circles to map');
    
    this.currentWeatherSegments = weatherSegments;
    this.removeWeatherCircles();
    
    // CONSOLIDATED ARROW SYSTEM: Collect all arrow data first, then create all arrows at once
    const allArrowData = [];
    
    // Rest of the method continues unchanged...
    // ENHANCED APPROACH: Handle alternates, rigs, and split points
    const validSegments = [];
    
    // DEDUPLICATION: First pass - identify all alternates to prioritize them
    const alternateLocations = new Set();
    const processedLocations = new Set();
    
    // First pass: collect all alternate locations
    weatherSegments.forEach(segment => {
      if (segment.alternateGeoShape && (segment.airportIcao || segment.locationName)) {
        alternateLocations.add(segment.airportIcao || segment.locationName);
      }
    });
    
    console.log('🔄 DEDUP: Found alternates for locations:', Array.from(alternateLocations));
    
    weatherSegments.forEach((segment, index) => {
      console.log(`🔍 Segment ${index}:`, {
        airportIcao: segment.airportIcao,
        locationName: segment.locationName,
        isRig: segment.isRig,
        alternateGeoShape: segment.alternateGeoShape,
        ranking2: segment.ranking2,
        hasAlternateCoords: !!(segment.alternateGeoShape?.coordinates?.length >= 2),
        hasGeoPoint: !!segment.geoPoint,
        geoPoint: segment.geoPoint
      });
      
      const hasValidRanking = (segment.ranking2 !== undefined && segment.ranking2 !== null);
      
      if (!hasValidRanking) {
        console.log(`❌ Invalid segment ${index}: no valid ranking`);
        return;
      }
      
      // DUPLICATE CHECK: Skip destinations if there's an alternate for the same location
      const locationKey = segment.airportIcao || segment.locationName;
      if (locationKey) {
        // If this is a destination (no alternateGeoShape) and there's an alternate for this location, skip it
        if (!segment.isRig && !segment.alternateGeoShape && alternateLocations.has(locationKey)) {
          console.log(`🔄 DEDUP: Skipping destination ${locationKey} - alternate exists for same location`);
          return;
        }
        
        // If we already processed this exact location, skip it
        if (processedLocations.has(locationKey)) {
          console.log(`🔄 DEDUP: Skipping duplicate ${locationKey} - already processed`);
          return;
        }
        
        // Mark this location as processed
        processedLocations.add(locationKey);
      }
      
      // Handle ALTERNATE destinations (have alternateGeoShape)
      if (segment.alternateGeoShape && 
          segment.alternateGeoShape.coordinates && 
          Array.isArray(segment.alternateGeoShape.coordinates) &&
          segment.alternateGeoShape.coordinates.length >= 2) {
        
        const ranking = segment.ranking2;
        
        // Add alternate destination circle (coordinates[1])
        const alternateSegment = {
          ...segment,
          ranking2: ranking,
          extractedCoordinates: segment.alternateGeoShape.coordinates[1],
          circleType: 'alternate'
        };
        validSegments.push(alternateSegment);
        console.log(`✅ Alternate ${index}: ${segment.airportIcao} at ${JSON.stringify(segment.alternateGeoShape.coordinates[1])} with ranking ${ranking}`);
        console.log(`🚨 COORDINATE DEBUG: Full alternateGeoShape.coordinates for ${segment.airportIcao}:`, JSON.stringify(segment.alternateGeoShape.coordinates, null, 2));
        
        // COLLECT ALTERNATE ARROW DATA: Store for batch creation later
        console.log(`🌬️ COLLECTING: Alternate arrow data for ${segment.airportIcao}`);
        
        // Extract wind data for this alternate
        let windSpeed = null, windDirection = null, windGust = null, windSource = 'Unknown';
        
        // Try METAR first (for airports)
        let comprehensiveMetarData = null;
        if (segment.rawMetar && window.weatherVisualizationManager) {
          const metarSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawMetar);
          const metarDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawMetar);
          const metarGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawMetar);
          
          // Parse comprehensive METAR data for alternates
          comprehensiveMetarData = window.weatherVisualizationManager.parseComprehensiveMetar(segment.rawMetar);
          
          if (metarSpeed !== null && metarDir !== null) {
            windSpeed = metarSpeed;
            windDirection = metarDir;
            windGust = metarGust;
            windSource = 'METAR';
          }
        }
        
        // Use segment wind data if no METAR
        if (windSpeed === null && segment.windSpeed) {
          windSpeed = segment.windSpeed;
          windDirection = segment.windDirection;
          windGust = segment.windGust;
          windSource = 'Segment';
        }
        
        if (windSpeed !== null) {
          allArrowData.push({
            rigName: segment.airportIcao,
            latitude: segment.alternateGeoShape.coordinates[1][1],
            longitude: segment.alternateGeoShape.coordinates[1][0],
            isAirport: !segment.isRig,
            windSpeed: windSpeed,
            windDirection: windDirection,
            windGust: windGust,
            windSource: windSource,
            flightCategory: segment.flightCategory || 'VFR',
            visibility: comprehensiveMetarData?.visibility || segment.visibility || 10,
            temperature: comprehensiveMetarData?.temperature || segment.temperature,
            conditions: segment.conditions || segment.weather || 'Clear',
            stationId: segment.airportIcao,
            locationType: 'alternate',
            // Enhanced METAR data for better popups
            comprehensiveMetar: comprehensiveMetarData,
            rawMetar: segment.rawMetar,
            rawTaf: segment.rawTaf,
            clouds: comprehensiveMetarData?.clouds || [],
            weatherConditions: comprehensiveMetarData?.conditions || [],
            altimeter: comprehensiveMetarData?.altimeter,
            dewpoint: comprehensiveMetarData?.dewpoint
          });
          console.log(`🌬️ COLLECTED: Alternate ${segment.airportIcao} arrow data`);
        } else {
          console.log(`🌬️ SKIP: No wind data for alternate ${segment.airportIcao}`);
        }
        
        // SKIP split point circles - they were creating unwanted rig weather
        console.log(`⏭️ Skipping split point for ${segment.airportIcao} - only showing alternate destination`);
      }
      
      // Handle RIGS - find coordinates from current waypoints/route
      else if (segment.isRig) {
        console.log(`🛢️ Processing rig weather: ${segment.airportIcao}`);
        
        // Try to get rig coordinates from multiple sources
        let rigCoordinates = null;
        
        // Method 1: Check current waypoints (most reliable)
        if (window.currentWaypoints && Array.isArray(window.currentWaypoints)) {
          const matchingWaypoint = window.currentWaypoints.find(wp => 
            wp.name === segment.airportIcao || 
            wp.name?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            rigCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from currentWaypoints:`, rigCoordinates);
          }
        }
        
        // Method 2: Check waypoint manager
        if (!rigCoordinates && window.waypointManager?.getWaypoints) {
          const waypoints = window.waypointManager.getWaypoints();
          const matchingWaypoint = waypoints.find(wp => 
            wp.name === segment.airportIcao || 
            wp.name?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            rigCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from waypointManager:`, rigCoordinates);
          }
        }
        
        // Method 3: Check global waypoints state (from React)
        if (!rigCoordinates && window.globalWaypoints && Array.isArray(window.globalWaypoints)) {
          const matchingWaypoint = window.globalWaypoints.find(wp => 
            wp.name === segment.airportIcao || 
            wp.name?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            rigCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from globalWaypoints:`, rigCoordinates);
          }
        }
        
        // Method 4: Check stop cards for coordinates (they have all the lat/lng data!)
        if (!rigCoordinates && window.debugStopCards && Array.isArray(window.debugStopCards)) {
          const matchingStopCard = window.debugStopCards.find(card => 
            card.name === segment.airportIcao || 
            card.name?.toUpperCase() === segment.airportIcao?.toUpperCase() ||
            card.stop === segment.airportIcao ||
            card.stop?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingStopCard && matchingStopCard.coordinates) {
            rigCoordinates = matchingStopCard.coordinates;
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from stopCards:`, rigCoordinates);
          }
        }
        
        if (rigCoordinates) {
          const rigSegment = {
            ...segment,
            ranking2: segment.ranking2,
            extractedCoordinates: rigCoordinates,
            circleType: 'rig'
          };
          validSegments.push(rigSegment);
          console.log(`✅ Rig ${segment.airportIcao}: Found coordinates ${JSON.stringify(rigCoordinates)} with ranking ${segment.ranking2}`);
          
          // COLLECT RIG ARROW DATA: Store for batch creation later
          console.log(`🌬️ COLLECTING: Rig arrow data for ${segment.airportIcao}`);
          
          // Extract wind data for this rig
          let windSpeed = null, windDirection = null, windGust = null, windSource = 'Unknown';
          
          // DEBUG: Log all available wind fields for rigs
          console.log(`🌬️ RIG DEBUG: Available wind fields for ${segment.airportIcao}:`, {
            rawMetar: segment.rawMetar,
            rawTaf: segment.rawTaf,
            windSpeed: segment.windSpeed,
            windDirection: segment.windDirection,
            windGust: segment.windGust,
            wind: segment.wind,
            allKeys: Object.keys(segment).filter(key => key.toLowerCase().includes('wind'))
          });
          
          // Try METAR first (for airports AND rigs - they both have METAR data!)
          let comprehensiveMetarData = null;
          if (segment.rawMetar && window.weatherVisualizationManager) {
            console.log(`🌬️ RIG METAR: Parsing METAR for ${segment.airportIcao}: "${segment.rawMetar}"`);
            
            // Parse wind data
            const metarSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawMetar);
            const metarDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawMetar);
            const metarGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawMetar);
            
            // Parse comprehensive METAR data  
            comprehensiveMetarData = window.weatherVisualizationManager.parseComprehensiveMetar(segment.rawMetar);
            
            console.log(`🌬️ RIG METAR: Parsed values - Speed: ${metarSpeed}, Dir: ${metarDir}, Gust: ${metarGust}`);
            console.log(`🌬️ RIG METAR: Comprehensive data:`, comprehensiveMetarData);
            
            if (metarSpeed !== null && metarDir !== null) {
              windSpeed = metarSpeed;
              windDirection = metarDir;
              windGust = metarGust;
              windSource = 'METAR';
              console.log(`🌬️ RIG METAR: ✅ Successfully extracted wind from METAR for ${segment.airportIcao}`);
            } else {
              console.log(`🌬️ RIG METAR: ❌ METAR parsing failed for ${segment.airportIcao}`);
            }
          }
          
          // Try TAF data for rigs (pseudo TAF)
          if (windSpeed === null && segment.rawTaf && window.weatherVisualizationManager) {
            console.log(`🌬️ RIG TAF: Parsing TAF for ${segment.airportIcao}: "${segment.rawTaf}"`);
            
            // TAF uses same wind format as METAR
            const tafSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawTaf);
            const tafDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawTaf);
            const tafGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawTaf);
            
            console.log(`🌬️ RIG TAF: Parsed values - Speed: ${tafSpeed}, Dir: ${tafDir}, Gust: ${tafGust}`);
            
            if (tafSpeed !== null && tafDir !== null) {
              windSpeed = tafSpeed;
              windDirection = tafDir;
              windGust = tafGust;
              windSource = 'Pseudo TAF';
              console.log(`🌬️ RIG TAF: ✅ Successfully extracted wind from TAF for ${segment.airportIcao}`);
            }
          }
          
          // Use direct segment wind data (for rigs)
          if (windSpeed === null && segment.windSpeed !== undefined && segment.windSpeed !== null) {
            windSpeed = segment.windSpeed;
            windDirection = segment.windDirection;
            windGust = segment.windGust;
            windSource = 'Rig Model Data';
          }
          
          // Try alternative wind field names for rigs
          if (windSpeed === null && segment.wind) {
            if (typeof segment.wind === 'object') {
              windSpeed = segment.wind.speed || segment.wind.windSpeed;
              windDirection = segment.wind.direction || segment.wind.windDirection;
              windGust = segment.wind.gust || segment.wind.windGust;
              windSource = 'Rig Wind Object';
            }
          }
          
          // Try other possible wind field names
          if (windSpeed === null) {
            const possibleSpeedFields = ['windSpeedKts', 'windSpeedMps', 'speed', 'wspd'];
            const possibleDirFields = ['windDirectionDeg', 'direction', 'wdir'];
            
            for (const field of possibleSpeedFields) {
              if (segment[field] !== undefined && segment[field] !== null) {
                windSpeed = segment[field];
                windSource = `Rig Field: ${field}`;
                break;
              }
            }
            
            for (const field of possibleDirFields) {
              if (segment[field] !== undefined && segment[field] !== null) {
                windDirection = segment[field];
                break;
              }
            }
          }
          
          if (windSpeed !== null) {
            allArrowData.push({
              rigName: segment.airportIcao,
              latitude: rigCoordinates[1],
              longitude: rigCoordinates[0],
              isAirport: false,
              windSpeed: windSpeed,
              windDirection: windDirection,
              windGust: windGust,
              windSource: windSource,
              flightCategory: segment.flightCategory || 'VFR',
              visibility: comprehensiveMetarData?.visibility || segment.visibility || 10,
              temperature: comprehensiveMetarData?.temperature || segment.temperature,
              conditions: segment.conditions || segment.weather || 'Clear',
              stationId: segment.airportIcao,
              locationType: 'rig',
              // Enhanced METAR data for better popups
              comprehensiveMetar: comprehensiveMetarData,
              rawMetar: segment.rawMetar,
              rawTaf: segment.rawTaf,
              clouds: comprehensiveMetarData?.clouds || [],
              weatherConditions: comprehensiveMetarData?.conditions || [],
              altimeter: comprehensiveMetarData?.altimeter,
              dewpoint: comprehensiveMetarData?.dewpoint
            });
            console.log(`🌬️ COLLECTED: Rig ${segment.airportIcao} arrow data`);
          } else {
            console.log(`🌬️ SKIP: No wind data for rig ${segment.airportIcao}`);
          }
        } else {
          console.log(`❌ Rig ${segment.airportIcao}: Could not find coordinates in any source`);
        }
      
      // Handle DESTINATIONS (airports that are not rigs)
      } else if (!segment.isRig) {
        console.log(`✈️ Processing destination weather: ${segment.airportIcao || segment.locationName}`);
        
        // Try to get destination coordinates from multiple sources
        let destinationCoordinates = null;
        
        // Method 1: Try geoPoint first if available
        if (segment.geoPoint) {
          destinationCoordinates = this.parseGeoPoint(segment.geoPoint);
          if (destinationCoordinates) {
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from geoPoint:`, destinationCoordinates);
          }
        }
        
        // Method 2: Check current waypoints if geoPoint failed
        if (!destinationCoordinates && window.currentWaypoints && Array.isArray(window.currentWaypoints)) {
          const matchingWaypoint = window.currentWaypoints.find(wp => 
            wp.name === segment.airportIcao || 
            wp.name?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            destinationCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from currentWaypoints:`, destinationCoordinates);
          }
        }
        
        // Method 3: Check waypoint manager
        if (!destinationCoordinates && window.waypointManager?.getWaypoints) {
          const waypoints = window.waypointManager.getWaypoints();
          const matchingWaypoint = waypoints.find(wp => 
            wp.name === segment.airportIcao || 
            wp.name?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            destinationCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from waypointManager:`, destinationCoordinates);
          }
        }
        
        // Method 4: Check stop cards for coordinates
        if (!destinationCoordinates && window.debugStopCards && Array.isArray(window.debugStopCards)) {
          const matchingStopCard = window.debugStopCards.find(card => 
            card.name === segment.airportIcao || 
            card.name?.toUpperCase() === segment.airportIcao?.toUpperCase() ||
            card.stop === segment.airportIcao ||
            card.stop?.toUpperCase() === segment.airportIcao?.toUpperCase()
          );
          if (matchingStopCard && matchingStopCard.coordinates) {
            destinationCoordinates = matchingStopCard.coordinates;
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from stopCards:`, destinationCoordinates);
          }
        }
        
        if (destinationCoordinates) {
          const destinationSegment = {
            ...segment,
            ranking2: segment.ranking2,
            extractedCoordinates: destinationCoordinates,
            circleType: 'destination'
          };
          validSegments.push(destinationSegment);
          console.log(`✅ Destination ${segment.airportIcao || segment.locationName}: Found coordinates ${JSON.stringify(destinationCoordinates)} with ranking ${segment.ranking2}`);
          
          // COLLECT DESTINATION ARROW DATA: Store for batch creation later
          console.log(`🌬️ COLLECTING: Destination arrow data for ${segment.airportIcao}`);
          
          // Extract wind data for this destination
          let windSpeed = null, windDirection = null, windGust = null, windSource = 'Unknown';
          
          // Try METAR first (airports should have METAR)
          let comprehensiveMetarData = null;
          if (segment.rawMetar && window.weatherVisualizationManager) {
            const metarSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawMetar);
            const metarDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawMetar);
            const metarGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawMetar);
            
            // Parse comprehensive METAR data for destinations
            comprehensiveMetarData = window.weatherVisualizationManager.parseComprehensiveMetar(segment.rawMetar);
            
            if (metarSpeed !== null && metarDir !== null) {
              windSpeed = metarSpeed;
              windDirection = metarDir;
              windGust = metarGust;
              windSource = 'METAR';
            }
          }
          
          // Use segment wind data if no METAR
          if (windSpeed === null && segment.windSpeed) {
            windSpeed = segment.windSpeed;
            windDirection = segment.windDirection;
            windGust = segment.windGust;
            windSource = 'Segment';
          }
          
          if (windSpeed !== null) {
            allArrowData.push({
              rigName: segment.airportIcao || segment.locationName,
              latitude: destinationCoordinates[1],
              longitude: destinationCoordinates[0],
              isAirport: true,
              windSpeed: windSpeed,
              windDirection: windDirection,
              windGust: windGust,
              windSource: windSource,
              flightCategory: segment.flightCategory || 'VFR',
              visibility: comprehensiveMetarData?.visibility || segment.visibility || 10,
              temperature: comprehensiveMetarData?.temperature || segment.temperature,
              conditions: segment.conditions || segment.weather || 'Clear',
              stationId: segment.airportIcao || segment.locationName,
              locationType: 'destination',
              // Enhanced METAR data for better popups
              comprehensiveMetar: comprehensiveMetarData,
              rawMetar: segment.rawMetar,
              rawTaf: segment.rawTaf,
              clouds: comprehensiveMetarData?.clouds || [],
              weatherConditions: comprehensiveMetarData?.conditions || [],
              altimeter: comprehensiveMetarData?.altimeter,
              dewpoint: comprehensiveMetarData?.dewpoint
            });
            console.log(`🌬️ COLLECTED: Destination ${segment.airportIcao} arrow data`);
          } else {
            console.log(`🌬️ SKIP: No wind data for destination ${segment.airportIcao}`);
          }
        } else {
          console.log(`❌ Destination ${segment.airportIcao || segment.locationName}: Could not find coordinates from any source (geoPoint: ${segment.geoPoint})`);
        }
      
      } else {
        console.log(`❌ Segment ${index} (${segment.airportIcao || segment.locationName}) has no coordinates and is not a rig or destination`);
      }
    });
    
    // DEDUPLICATE circles at same locations (only keep one circle per location)
    const deduplicatedSegments = this.deduplicateCirclesByLocation(validSegments);
    
    console.log(`🟡 Found ${validSegments.length} total segments, deduplicated to ${deduplicatedSegments.length} unique locations`);
    
    if (deduplicatedSegments.length === 0) {
      console.log('🔴 No valid segments found, adding test circles instead');
      clearLock(); // Clear lock before test circles
      this.addTestCircles();
      return;
    }
    
    console.log('🟢 WeatherCirclesLayer: Processing', deduplicatedSegments.length, 'deduplicated segments');
    
    // Create concentric ring features for each deduplicated weather segment (MORE RINGS!)
    const outerMostFeatures = deduplicatedSegments.map(segment => this.createRingFeature(segment, 'outermost')).filter(f => f !== null);
    const outerFeatures = deduplicatedSegments.map(segment => this.createRingFeature(segment, 'outer')).filter(f => f !== null);
    const middleFeatures = deduplicatedSegments.map(segment => this.createRingFeature(segment, 'middle')).filter(f => f !== null);
    const innerFeatures = deduplicatedSegments.map(segment => this.createRingFeature(segment, 'inner')).filter(f => f !== null);
    const innerMostFeatures = deduplicatedSegments.map(segment => this.createRingFeature(segment, 'innermost')).filter(f => f !== null);
    
    if (outerFeatures.length === 0) {
      console.log('🔴 No valid ring features created');
      clearLock(); // Clear lock on error
      return;
    }
    
    console.log(`🟢 Created ${outerFeatures.length} concentric ring sets`);
    
    // Also add dotted lines to alternate destinations if available (use ORIGINAL segments for lines)
    this.addAlternateLines(weatherSegments);
    
    // Add sources for each ring layer (MORE RINGS!)
    this.map.addSource(this.sourceId + '-outermost', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: outerMostFeatures
      }
    });
    
    this.map.addSource(this.sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: outerFeatures
      }
    });
    
    this.map.addSource(this.sourceId + '-middle', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: middleFeatures
      }
    });
    
    this.map.addSource(this.sourceId + '-inner', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: innerFeatures
      }
    });
    
    this.map.addSource(this.sourceId + '-innermost', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: innerMostFeatures
      }
    });
    
    // Determine layer type based on geometry type
    const hasCircleGeometry = outerFeatures.some(f => f.geometry.type === 'Polygon');
    const hasPointGeometry = outerFeatures.some(f => f.geometry.type === 'Point');
    
    console.log('WeatherCirclesLayer: Geometry types found:', { hasCircleGeometry, hasPointGeometry });
    
    // Add concentric ring layers for weather area effect (BELOW route layers)
    // Find the first route layer to insert weather rings before it
    let beforeLayer = this.findFirstRouteLayer();
    
    if (hasCircleGeometry) {
      // Add multiple ring layers for fading effect (MORE RINGS!)
      
      // Outermost ring (biggest, most transparent)
      this.map.addLayer({
        id: this.layerId + '-outermost',
        type: 'line',
        source: this.sourceId + '-outermost',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.15 // Very faint
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      // Outer ring (large, transparent)
      this.map.addLayer({
        id: this.layerId + '-outer',
        type: 'line',
        source: this.sourceId,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.25 // Faint
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      // Middle ring (medium opacity)
      this.map.addLayer({
        id: this.layerId + '-middle',
        type: 'line',
        source: this.sourceId + '-middle',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.5
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      // Inner ring (bright)
      this.map.addLayer({
        id: this.layerId + '-inner',
        type: 'line',
        source: this.sourceId + '-inner',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.75
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      // Innermost ring (brightest, most visible)
      this.map.addLayer({
        id: this.layerId + '-innermost',
        type: 'line',
        source: this.sourceId + '-innermost',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.95 // Brightest
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      console.log('WeatherCirclesLayer: Added 5 concentric ring layers');
      
      // Add hover popups for weather info
      this.addWeatherHoverPopups(deduplicatedSegments);
    }
    
    if (hasPointGeometry) {
      // Add concentric ring layers for point features
      const pointLayerId = this.layerId + '-points';
      
      // Outer ring
      this.map.addLayer({
        id: pointLayerId + '-outer',
        type: 'circle',
        source: this.sourceId,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': ['case', ['has', 'radius'], ['/', ['get', 'radius'], 80], 60],
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': 3,
          'circle-stroke-opacity': 0.3
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      // Middle ring
      this.map.addLayer({
        id: pointLayerId + '-middle',
        type: 'circle',
        source: this.sourceId,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': ['case', ['has', 'radius'], ['/', ['get', 'radius'], 120], 40],
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 0.5
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      // Inner ring (BRIGHTENED)
      this.map.addLayer({
        id: pointLayerId + '-inner',
        type: 'circle',
        source: this.sourceId,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': ['case', ['has', 'radius'], ['/', ['get', 'radius'], 160], 25],
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 0.95 // Brightened from 0.8 to 0.95
        },
        layout: {
          'visibility': 'visible'
        }
      }, beforeLayer);
      
      console.log('WeatherCirclesLayer: Added concentric ring layers for points');
      
      // Add hover popups for weather info (pass deduplicated segments)
      this.addWeatherHoverPopups(deduplicatedSegments);
    }
    
    this.isVisible = true;
    console.log('WeatherCirclesLayer: Added', outerFeatures.length, 'weather circles');
    
    // CONSOLIDATED ARROW SYSTEM: Create ALL arrows at once to prevent overwrites
    if (allArrowData.length > 0 && window.rigWeatherIntegration) {
      console.log(`🌬️ CONSOLIDATED: Creating ${allArrowData.length} wind arrows for all locations:`, 
        allArrowData.map(a => `${a.rigName}(${a.locationType})`));
      
      // DEBUG: Show detailed breakdown of all arrow data
      console.log(`🌬️ CONSOLIDATED DEBUG: Full arrow data:`, allArrowData.map(a => ({
        name: a.rigName,
        type: a.locationType,
        windSpeed: a.windSpeed,
        windDirection: a.windDirection,
        isAirport: a.isAirport
      })));
      
      try {
        // Create ALL arrows in one batch operation
        window.rigWeatherIntegration.updateRigWeather(allArrowData);
        console.log(`🌬️ CONSOLIDATED: ✅ Successfully created ${allArrowData.length} wind arrows`);
        
        // Debug: Log what types of arrows were created
        const arrowTypes = allArrowData.reduce((acc, arrow) => {
          acc[arrow.locationType] = (acc[arrow.locationType] || 0) + 1;
          return acc;
        }, {});
        console.log(`🌬️ CONSOLIDATED: Arrow breakdown:`, arrowTypes);
        
      } catch (error) {
        console.error(`🌬️ CONSOLIDATED: Error creating wind arrows:`, error);
      }
    } else {
      console.log(`🌬️ CONSOLIDATED: No wind arrows to create (${allArrowData.length} arrow data, rigWeatherIntegration: ${!!window.rigWeatherIntegration})`);
    }
    
    // Clear the creation lock on successful completion
    clearLock();
    
    // Debug: Check if layers were actually added
    setTimeout(() => {
      // Check for any of the weather circle layers that should exist
      const layersToCheck = [
        this.layerId + '-outermost',
        this.layerId + '-outer', 
        this.layerId + '-middle',
        this.layerId + '-inner',
        this.layerId + '-innermost',
        this.layerId + '-points-outer',
        this.layerId + '-points-middle',
        this.layerId + '-points-inner',
        this.layerId + '-lines'
      ];
      
      const foundLayers = layersToCheck.filter(layerId => this.map.getLayer(layerId));
      
      if (foundLayers.length > 0) {
        console.log(`✅ WeatherCirclesLayer: ${foundLayers.length} layers successfully added to map:`, foundLayers);
      } else {
        console.warn('⚠️ WeatherCirclesLayer: No weather circle layers found in map after adding - this may be normal if no features were created');
        console.log('🔍 WeatherCirclesLayer: Available layers:', layersToCheck.map(id => ({ id, exists: !!this.map.getLayer(id) })));
      }
    }, 200); // Slightly longer delay to ensure layers are fully processed
  }
  
  /**
   * Create a ring feature for a weather segment with specific size
   * @param {Object} segment - Weather segment with extractedCoordinates and ranking
   * @param {string} ringType - 'outer', 'middle', or 'inner'
   * @returns {Object} GeoJSON feature
   */
  createRingFeature(segment, ringType) {
    // FIXED: Use extractedCoordinates from alternateGeoShape instead of parsing geoPoint
    const coords = segment.extractedCoordinates;
    
    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      console.warn('WeatherCirclesLayer: Invalid extractedCoordinates:', coords);
      return null;
    }
    
    // Use ranking2 for color
    const ranking = segment.ranking2;
    const color = this.getAviationRankingColor(ranking);
    
    console.log(`🎨 RING CREATION: ${ringType} ring for ${segment.airportIcao} (${segment.circleType}) at ${coords} with ranking ${segment.ranking2} = COLOR ${color}`);
    
    // Get radius based on ring type (MORE RINGS!)
    const baseRadius = this.getCircleRadius(ranking);
    let radius;
    switch (ringType) {
      case 'outermost':
        radius = baseRadius * 1.8; // Biggest ring (new)
        break;
      case 'outer':
        radius = baseRadius * 1.4; // Large ring
        break;
      case 'middle':
        radius = baseRadius * 1.0; // Medium ring
        break;
      case 'inner':
        radius = baseRadius * 0.7; // Small ring
        break;
      case 'innermost':
        radius = baseRadius * 0.4; // Smallest ring (new)
        break;
      default:
        radius = baseRadius;
    }
    
    // Check if Turf.js is available for circles
    if (!window.turf) {
      console.warn('WeatherCirclesLayer: Turf.js not available, creating simple point feature');
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          airportIcao: segment.airportIcao || 'Unknown',
          ranking: ranking,
          color: color,
          isRig: segment.isRig || false,
          radius: radius * 1000, // Convert km to meters for point display
          ringType: ringType
        }
      };
    }
    
    // Create a circle polygon using Turf.js buffer
    const center = window.turf.point(coords);
    const circle = window.turf.buffer(center, radius, { units: 'kilometers' });
    
    return {
      type: 'Feature',
      geometry: circle.geometry,
      properties: {
        airportIcao: segment.airportIcao || 'Unknown',
        ranking: ranking,
        color: color,
        isRig: segment.isRig || false,
        ringType: ringType
      }
    };
  }
  
  /**
   * Parse geoPoint string to coordinates
   * @param {string} geoPoint - Comma-separated lat,lng string
   * @returns {Array} [longitude, latitude] coordinates or null
   */
  parseGeoPoint(geoPoint) {
    if (!geoPoint) return null;
    
    console.log('WeatherCirclesLayer: Parsing geoPoint:', geoPoint);
    
    try {
      const parts = geoPoint.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lon = parseFloat(parts[1].trim());
        
        console.log('WeatherCirclesLayer: Parsed coordinates:', { lat, lon, isValidLat: !isNaN(lat), isValidLon: !isNaN(lon) });
        
        if (!isNaN(lat) && !isNaN(lon)) {
          // GeoJSON format: [longitude, latitude]
          const coords = [lon, lat];
          console.log('WeatherCirclesLayer: Final coordinates (GeoJSON format):', coords);
          
          // Validate coordinates are in reasonable ranges
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            return coords;
          } else {
            console.warn('WeatherCirclesLayer: Coordinates out of valid range:', { lat, lon });
            return null;
          }
        }
      }
    } catch (error) {
      console.error('WeatherCirclesLayer: Error parsing geoPoint:', geoPoint, error);
    }
    
    return null;
  }
  
  /**
   * Get circle radius based on weather ranking
   * @param {number} ranking - Weather ranking (5, 8, 10, 15, 20)
   * @returns {number} Radius in kilometers
   */
  getCircleRadius(ranking) {
    // Base radius that makes circles visible but not overwhelming
    const baseRadius = 8; // 8km base radius
    
    // Adjust size slightly based on ranking importance
    switch (ranking) {
      case 5:  // Below minimums - larger, more attention
        return baseRadius * 1.2;
      case 8:  // ARA needed - slightly larger
        return baseRadius * 1.1;
      case 10: // Warning - normal size
        return baseRadius;
      case 15: // Good - slightly smaller
        return baseRadius * 0.9;
      case 20: // N/A - smaller, less prominent
        return baseRadius * 0.8;
      default:
        return baseRadius;
    }
  }
  
  /**
   * Get aviation ranking color using the centralized color system from WeatherCard.jsx
   * @param {number} ranking - Weather ranking
   * @returns {string} Hex color code
   */
  getAviationRankingColor(ranking) {
    switch (ranking) {
      case 5:
        return '#D32F2F'; // Red - Below alternate minimums
      case 8:
        return '#8E24AA'; // Brighter purple - ARA fuel needed at rig
      case 10:
        return '#F57C00'; // Orange - Warning conditions
      case 15:
        return '#66BB6A'; // Much brighter green - Good conditions
      case 20:
        return '#616161'; // Grey - Not applicable to landing time
      default:
        return '#1976D2'; // Blue - Default/unknown
    }
  }
  
  /**
   * Remove weather circles from map
   */
  removeWeatherCircles() {
    // Clear any creation lock when removing
    if (window.weatherCirclesCreationInProgress) {
      console.log('🔓 WeatherCirclesLayer: Clearing creation lock during removal');
      window.weatherCirclesCreationInProgress = false;
      window.weatherCirclesLockTime = null;
    }
    
    try {
      // Remove event listeners BEFORE removing layers
      const hoverLayer = this.layerId + '-hover-areas';
      if (this.map.getLayer(hoverLayer)) {
        this.map.off('mouseenter', hoverLayer);
        this.map.off('mouseleave', hoverLayer);
        console.log('🧹 Removed weather hover event listeners');
      }
      
      // Clean up popup instance
      if (this.popup) {
        this.popup.remove();
        this.popup = null;
        console.log('🧹 Removed weather popup instance');
      }
      
      // Remove all ring layers (polygon-based) - MORE RINGS!
      const ringLayers = ['-outermost', '-outer', '-middle', '-inner', '-innermost'];
      ringLayers.forEach(suffix => {
        if (this.map.getLayer(this.layerId + suffix)) {
          this.map.removeLayer(this.layerId + suffix);
        }
      });
      
      // Remove all point ring layers
      const pointRingLayers = ['-points-outer', '-points-middle', '-points-inner'];
      pointRingLayers.forEach(suffix => {
        if (this.map.getLayer(this.layerId + suffix)) {
          this.map.removeLayer(this.layerId + suffix);
        }
      });
      
      // Remove legacy layers if they exist
      if (this.map.getLayer(this.layerId)) {
        this.map.removeLayer(this.layerId);
      }
      if (this.map.getLayer(this.layerId + '-points')) {
        this.map.removeLayer(this.layerId + '-points');
      }
      
      // Remove alternate lines and their shadows
      if (this.map.getLayer(this.layerId + '-lines')) {
        this.map.removeLayer(this.layerId + '-lines');
      }
      if (this.map.getLayer(this.layerId + '-lines-shadow')) {
        this.map.removeLayer(this.layerId + '-lines-shadow');
      }
      if (this.map.getSource(this.sourceId + '-lines')) {
        this.map.removeSource(this.sourceId + '-lines');
      }
      if (this.map.getSource(this.sourceId + '-lines-shadow')) {
        this.map.removeSource(this.sourceId + '-lines-shadow');
      }
      
      // Remove hover areas
      if (this.map.getLayer(this.layerId + '-hover-areas')) {
        this.map.removeLayer(this.layerId + '-hover-areas');
      }
      if (this.map.getSource(this.sourceId + '-hover-areas')) {
        this.map.removeSource(this.sourceId + '-hover-areas');
      }

      // Remove all sources - MORE RINGS!
      const sources = ['-outermost', '', '-middle', '-inner', '-innermost'];
      sources.forEach(suffix => {
        if (this.map.getSource(this.sourceId + suffix)) {
          this.map.removeSource(this.sourceId + suffix);
        }
      });
    } catch (error) {
      console.error('WeatherCirclesLayer: Error removing weather circles:', error);
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
   * Add test weather circles for debugging
   */
  addTestCircles() {
    console.log('WeatherCirclesLayer: Adding test circles for debugging');
    console.log('WeatherCirclesLayer: Map state:', {
      hasMap: !!this.map,
      mapLoaded: this.map ? (this.map.loaded ? this.map.loaded() : 'checking...') : false,
      mapStyle: this.map ? this.map.getStyle() : null
    });
    
    // Create test weather segments for Gulf of Mexico
    // Format: "lat, lon" - these should appear in the Gulf of Mexico around Louisiana/Texas coast
    const testSegments = [
      {
        geoPoint: "27.5, -90.5", // Should be in Gulf of Mexico southwest of New Orleans
        airportIcao: "TEST1",
        ranking2: 5, // Use ranking2 to match real data structure
        isRig: false
      },
      {
        geoPoint: "28.0, -89.5", // Should be in Gulf of Mexico south of New Orleans
        airportIcao: "TEST2", 
        ranking2: 8, // Use ranking2 to match real data structure
        isRig: true
      },
      {
        geoPoint: "26.8, -91.2", // Should be in Gulf of Mexico southwest of Louisiana
        airportIcao: "TEST3",
        ranking2: 15, // Use ranking2 to match real data structure
        isRig: false
      },
      {
        geoPoint: "27.8, -88.5", // Should be in Gulf of Mexico southeast of New Orleans
        airportIcao: "TEST4",
        ranking2: 10, // Use ranking2 to match real data structure
        isRig: false
      }
    ];
    
    console.log('WeatherCirclesLayer: Created test segments:', testSegments);
    this.addWeatherCircles(testSegments);
  }
  
  /**
   * Add curved dotted lines from split points to alternate destinations
   * @param {Array} validSegments - Weather segments with coordinates
   */
  addAlternateLines(validSegments) {
    console.log('🔗 Adding curved dotted lines for weather alternate routes');
    
    // CRITICAL FIX: Get correct split point from flight data, not weather segments
    const flightAlternateData = window.flightAlternateData;
    let correctSplitPoint = null;
    
    if (flightAlternateData && flightAlternateData.splitPoint) {
      // Parse the split point from flight data
      if (typeof flightAlternateData.splitPoint === 'string') {
        const parts = flightAlternateData.splitPoint.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          correctSplitPoint = [lng, lat]; // GeoJSON format: [lng, lat]
          console.log('🎯 CORRECT SPLIT POINT: Using flight data split point:', correctSplitPoint);
        }
      } else if (Array.isArray(flightAlternateData.splitPoint)) {
        correctSplitPoint = flightAlternateData.splitPoint;
        console.log('🎯 CORRECT SPLIT POINT: Using flight data split point array:', correctSplitPoint);
      }
    }
    
    if (!correctSplitPoint) {
      console.warn('🎯 WARNING: No correct split point available from flight data - alternate lines may be incorrect');
      console.warn('🎯 Available flight alternate data:', flightAlternateData);
    }
    
    // Create curved line features for each weather segment with coordinates
    const lineFeatures = [];
    
    validSegments.forEach(segment => {
      if (segment.alternateGeoShape && segment.alternateGeoShape.coordinates && 
          segment.alternateGeoShape.coordinates.length >= 2) {
        
        // Use correct split point from flight data, fallback to segment data if unavailable
        const splitPoint = correctSplitPoint || segment.alternateGeoShape.coordinates[0];
        const destination = segment.alternateGeoShape.coordinates[1]; // End point
        
        console.log(`🔗 Creating curved line from split ${JSON.stringify(splitPoint)} to ${segment.airportIcao} ${JSON.stringify(destination)}`);
        console.log(`🎯 SPLIT POINT SOURCE: ${correctSplitPoint ? 'Flight Data (CORRECT)' : 'Weather Segment (FALLBACK)'}`);
        console.log(`🚨 LINE DEBUG: Full coordinates array for ${segment.airportIcao}:`, JSON.stringify(segment.alternateGeoShape.coordinates, null, 2));
        
        // Create straight line for alternate routes (cleaner look)
        const straightCoordinates = [splitPoint, destination];
        
        const lineFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: straightCoordinates
          },
          properties: {
            type: 'weather-alternate-line',
            airportIcao: segment.airportIcao,
            ranking: segment.ranking2,
            isRig: segment.isRig || false
          }
        };
        
        lineFeatures.push(lineFeature);
      }
    });
    
    if (lineFeatures.length > 0) {
      // Add alternate lines source and layer
      const linesSourceId = this.sourceId + '-lines';
      const linesLayerId = this.layerId + '-lines';
      
      try {
        // Remove existing lines
        if (this.map.getLayer(linesLayerId)) {
          this.map.removeLayer(linesLayerId);
        }
        if (this.map.getSource(linesSourceId)) {
          this.map.removeSource(linesSourceId);
        }
        
        // Add new lines with drop shadow
        this.map.addSource(linesSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: lineFeatures
          }
        });
        
        // Add STRAIGHT shadow layer first (3D effect) - FIXED FOR VISIBILITY
        this.map.addSource(linesSourceId + '-shadow', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: this.createStraightShadowLines(validSegments)
          }
        });
        
        this.map.addLayer({
          id: linesLayerId + '-shadow',
          type: 'line',
          source: linesSourceId + '-shadow',
          paint: {
            'line-color': 'rgba(0, 0, 0, 0.2)', // LIGHTER shadow (was 0.6, now 0.2)
            'line-width': 2, // THINNER shadow (was 3, now 2)
            'line-blur': 1 // BLURRIER shadow effect
            // REMOVED line-dasharray - solid line for shadow
          },
          layout: {
            'visibility': 'visible'
          }
        });
        
        // Add main line layer on top (BRIGHTENED)
        this.map.addLayer({
          id: linesLayerId,
          type: 'line',
          source: linesSourceId,
          paint: {
            'line-color': '#999999', // Brighter grey (was #666666)
            'line-width': 1, // Single pixel width
            'line-dasharray': [3, 3] // Dotted pattern
          },
          layout: {
            'visibility': 'visible'
          }
        });
        
        console.log('🔗 Added', lineFeatures.length, 'curved dotted weather alternate lines');
      } catch (error) {
        console.error('🔗 Error adding alternate lines:', error);
      }
    } else {
      console.log('🔗 No valid segments found for alternate lines');
    }
  }
  
  /**
   * Add hover popups to show weather information
   */
  addWeatherHoverPopups(deduplicatedSegments) {
    // 🔗 UNIFIED POPUP: OLD POPUP SYSTEM DISABLED
    // The old Palantir popup system has been disabled to prevent conflicts with the new unified popup system.
    // TAF/METAR data is now displayed in the unified rig weather graphics popup system instead.
    
    console.log('🔗 UNIFIED POPUP: Old weather circle popups disabled - using unified popup system for weather data');
    
    // Clean up any existing popup instances
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
    
    // Remove any existing event listeners
    const hoverLayer = this.layerId + '-hover-areas';
    if (this.map.getLayer(hoverLayer)) {
      this.map.off('mouseenter', hoverLayer);
      this.map.off('mouseleave', hoverLayer);
    }
    
    // Still create invisible hover areas for potential future use, but without popups
    // This maintains the layer structure but removes the competing popup system
    this.addInvisibleHoverAreas(deduplicatedSegments);
    
    console.log('🔗 UNIFIED POPUP: Weather circles maintained without competing popups');
  }

  /**
   * Add invisible filled circles for easy hover targeting
   */
  addInvisibleHoverAreas(segments) {
    // Use the passed segments (deduplicated)
    if (!segments || segments.length === 0) {
      console.warn('No weather segments provided for hover areas');
      return;
    }

    // Create filled circle features for each weather segment (using innermost size)
    const hoverFeatures = segments
      .filter(segment => segment.extractedCoordinates)
      .map(segment => this.createHoverAreaFeature(segment))
      .filter(f => f !== null);

    console.log(`🎯 Creating ${hoverFeatures.length} hover areas from ${segments.length} segments`);

    if (hoverFeatures.length === 0) {
      console.log('No hover area features to create');
      return;
    }

    // Add source for hover areas
    this.map.addSource(this.sourceId + '-hover-areas', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: hoverFeatures
      }
    });

    // Add invisible filled layer for hover detection
    this.map.addLayer({
      id: this.layerId + '-hover-areas',
      type: 'fill',
      source: this.sourceId + '-hover-areas',
      paint: {
        'fill-color': 'transparent',
        'fill-opacity': 0 // Completely invisible
      },
      layout: {
        'visibility': 'visible'
      }
    });

    console.log('🎯 Added invisible hover areas for easy targeting');
  }

  /**
   * Create a filled circle feature for hover detection
   * @param {Object} segment - Weather segment with coordinates
   * @returns {Object} GeoJSON feature for hover
   */
  createHoverAreaFeature(segment) {
    const coords = segment.extractedCoordinates;
    
    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      return null;
    }

    // Use innermost ring size for hover area
    const ranking = segment.ranking2;
    const baseRadius = this.getCircleRadius(ranking);
    const radius = baseRadius * 0.4; // Same as innermost ring

    // Check if Turf.js is available
    if (!window.turf) {
      console.warn('WeatherCirclesLayer: Turf.js not available for hover areas');
      return null;
    }

    // Create filled circle using Turf.js
    const center = window.turf.point(coords);
    const circle = window.turf.buffer(center, radius, { units: 'kilometers' });

    return {
      type: 'Feature',
      geometry: circle.geometry,
      properties: {
        airportIcao: segment.airportIcao || 'Unknown',
        ranking: segment.ranking2,
        isRig: segment.isRig || false,
        ringType: segment.circleType || 'weather'
      }
    };
  }

  /**
   * Find weather segment by ICAO code
   * @param {string} icao - Airport ICAO code
   * @returns {Object|null} Weather segment data
   */
  findWeatherSegmentByIcao(icao) {
    if (!this.currentWeatherSegments) return null;
    
    return this.currentWeatherSegments.find(segment => 
      segment.airportIcao === icao || segment.airportIcao === icao.replace('-SPLIT', '')
    );
  }

  /**
   * Create detailed weather popup content (same info as weather card)
   * @param {string} icao - Airport ICAO  
   * @param {number} ranking - Weather ranking
   * @param {Object} segment - Weather segment data
   * @param {string} circleType - Type of circle
   * @returns {string} HTML content
   */
  createDetailedWeatherPopup(icao, ranking, segment, circleType) {
    // Simple fuel status instead of technical ranking
    const fuelStatus = this.getFuelStatus(ranking);
    const color = this.getAviationRankingColor(ranking);
    
    let content = `
      <div class="weather-popup-content" style="font-size: 13px; line-height: 1.4;">
        <h4 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px;">
          ${icao}
        </h4>
    `;

    if (segment) {
      // Add arrival time if available
      if (segment.arrivalTime) {
        const arrivalTime = new Date(segment.arrivalTime).toLocaleTimeString();
        content += `
          <div style="margin-bottom: 6px; font-size: 13px;">
            <strong>Arrival:</strong> ${arrivalTime}
          </div>
        `;
      }

      // Add simple fuel status
      content += `
        <div style="margin-bottom: 8px; font-size: 13px; color: ${color};">
          <strong>${fuelStatus}</strong>
        </div>
      `;

      // Add full METAR if available
      if (segment.rawMetar) {
        content += `
          <div style="margin-bottom: 8px;">
            <strong>METAR:</strong><br>
            <span style="font-family: monospace; font-size: 11px; word-break: break-all;">${segment.rawMetar}</span>
          </div>
        `;
      }

      // Add FULL TAF if available (no truncation)
      if (segment.rawTaf) {
        content += `
          <div style="margin-bottom: 6px;">
            <strong>TAF:</strong><br>
            <span style="font-family: monospace; font-size: 11px; word-break: break-all;">${segment.rawTaf}</span>
          </div>
        `;
      }
    }

    content += `
      </div>
    `;

    return content;
  }

  /**
   * Get simple fuel status for users
   * @param {number} ranking - Weather ranking (5, 8, 10, 15, 20)
   * @returns {string} Simple fuel status
   */
  getFuelStatus(ranking) {
    switch (ranking) {
      case 5:
        return 'Below Minimums';
      case 8:
        return 'ARA Fuel Needed';
      case 10:
        return 'Approach Fuel Needed';
      case 15:
        return 'Good Conditions';
      case 20:
        return 'Good Conditions';
      default:
        return 'Weather Conditions';
    }
  }

  /**
   * Get weather description from ranking
   * @param {number} ranking - Weather ranking (5, 8, 10, 15, 20)
   * @returns {string} Human readable description
   */
  getWeatherDescription(ranking) {
    switch (ranking) {
      case 5:
        return 'Below Minimums - Cannot Land';
      case 8:
        return 'ARA Fuel Required - Poor Conditions';
      case 10:
        return 'Warning Conditions - Approach Fuel Needed';
      case 15:
        return 'Good Conditions - Safe to Land';
      case 20:
        return 'Not Applicable - No Landing Restrictions';
      default:
        return `Ranking ${ranking} - Custom Conditions`;
    }
  }

  /**
   * Deduplicate circles by location (only keep one circle per unique location)
   * @param {Array} segments - Array of weather segments with coordinates
   * @returns {Array} Deduplicated segments
   */
  deduplicateCirclesByLocation(segments) {
    const locationMap = new Map();
    
    segments.forEach(segment => {
      if (!segment.extractedCoordinates) return;
      
      // Create a location key from coordinates (rounded to avoid floating point issues)
      const [lng, lat] = segment.extractedCoordinates;
      const locationKey = `${Math.round(lng * 10000)},${Math.round(lat * 10000)}`;
      
      // If we haven't seen this location before, or this segment has higher priority, keep it
      const existing = locationMap.get(locationKey);
      
      if (!existing || this.getCirclePriority(segment) > this.getCirclePriority(existing)) {
        const color = this.getAviationRankingColor(segment.ranking2);
        locationMap.set(locationKey, segment);
        console.log(`🎯 Deduplicate: Keeping ${segment.airportIcao} (${segment.circleType}) at ${locationKey} with ranking ${segment.ranking2} = COLOR ${color}`);
      } else {
        const existingColor = this.getAviationRankingColor(existing.ranking2);
        const segmentColor = this.getAviationRankingColor(segment.ranking2);
        console.log(`🎯 Deduplicate: Skipping ${segment.airportIcao} (${segment.circleType}) ranking=${segment.ranking2} color=${segmentColor} - already have ${existing.airportIcao} (${existing.circleType}) ranking=${existing.ranking2} color=${existingColor}`);
      }
    });
    
    return Array.from(locationMap.values());
  }
  
  /**
   * Get priority for circle deduplication (higher number = higher priority)
   * @param {Object} segment - Weather segment
   * @returns {number} Priority score
   */
  getCirclePriority(segment) {
    // SIMPLIFIED: Since we're skipping rigs, only prioritize alternates vs splits
    let basePriority = 0;
    
    switch (segment.circleType) {
      case 'alternate':
        basePriority = 200; // Higher priority for alternates
        break;
      case 'split':
        basePriority = 100; // Lower priority for split points
        break;
      default:
        basePriority = 150;
    }
    
    // Add weather ranking priority (worse weather = higher priority)
    // Rankings: 5=worst, 8=ara, 10=warning, 15=good, 20=n/a
    const weatherPriority = segment.ranking2 ? (25 - segment.ranking2) : 0;
    
    return basePriority + weatherPriority;
  }

  /**
   * Find the first route layer to ensure weather rings go underneath
   * @returns {string|undefined} Layer ID to insert before, or undefined for top
   */
  findFirstRouteLayer() {
    if (!this.map) return undefined;
    
    // Common route layer names to look for (in order of preference)
    const routeLayerPatterns = [
      'route-shadow',      // Route shadows (lowest route layer)
      'route-glow',        // Route glow effects
      'route-line',        // Main route lines
      'route',             // Generic route layers
      'alternate-shadow',  // Alternate route shadows
      'alternate-glow',    // Alternate glow
      'alternate-line',    // Alternate lines
      'alternate',         // Generic alternate layers
      'waypoint',          // Waypoint layers
      'platform',          // Platform layers
      'airfield'           // Airfield layers
    ];
    
    // Get all layer IDs from the map
    const allLayers = this.map.getStyle()?.layers || [];
    
    // Find the first matching route layer
    for (const pattern of routeLayerPatterns) {
      const matchingLayer = allLayers.find(layer => 
        layer.id.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (matchingLayer) {
        console.log(`🎯 Weather rings will be placed before route layer: ${matchingLayer.id}`);
        return matchingLayer.id;
      }
    }
    
    console.log(`🎯 No route layers found, weather rings will be on top`);
    return undefined; // Add on top if no route layers found
  }

  /**
   * Get rig coordinates from waypoints data
   * @param {string} rigIcao - Rig ICAO code to find
   * @returns {Array|null} [lng, lat] coordinates or null
   */
  getRigCoordinatesFromWaypoints(rigIcao) {
    // FIXED: Use waypointManager to get coordinates
    console.log(`🔧 DEBUG: Looking for rig coordinates for ${rigIcao}...`);
    console.log(`🔧 DEBUG: Available window objects:`, Object.keys(window).filter(k => k.includes('waypoint') || k.includes('route')));
    
    // Try waypointManager first
    if (window.waypointManager) {
      try {
        // Check if waypointManager has a method to get waypoints
        const waypoints = window.waypointManager.waypoints || 
                         window.waypointManager.getWaypoints?.() ||
                         window.waypointManager.currentWaypoints;
        
        console.log(`🔧 DEBUG: WaypointManager waypoints:`, waypoints);
        
        if (waypoints && Array.isArray(waypoints)) {
          const matchingWaypoint = waypoints.find(wp => 
            wp.name === rigIcao || 
            wp.id === rigIcao ||
            wp.airportIcao === rigIcao
          );
          
          if (matchingWaypoint && matchingWaypoint.lat && matchingWaypoint.lng) {
            console.log(`✅ Found coordinates for rig ${rigIcao} in waypointManager:`, [matchingWaypoint.lng, matchingWaypoint.lat]);
            return [matchingWaypoint.lng, matchingWaypoint.lat]; // GeoJSON format
          }
        }
        
        // Try alternative waypoint manager properties
        const waypointManagerKeys = Object.keys(window.waypointManager);
        console.log(`🔍 WaypointManager available methods/properties:`, waypointManagerKeys);
        
        // Look for any property that might contain waypoints
        for (const key of waypointManagerKeys) {
          const value = window.waypointManager[key];
          if (Array.isArray(value) && value.length > 0) {
            console.log(`🔍 Checking waypointManager.${key}:`, value);
            const match = value.find(wp => 
              (wp.name === rigIcao || wp.id === rigIcao || wp.airportIcao === rigIcao) &&
              wp.lat && wp.lng
            );
            if (match) {
              console.log(`✅ Found coordinates for rig ${rigIcao} in waypointManager.${key}:`, [match.lng, match.lat]);
              return [match.lng, match.lat];
            }
          }
        }
      } catch (error) {
        console.warn(`Error accessing waypointManager:`, error);
      }
    }
    
    // Try route calculator as fallback
    if (window.routeCalculator) {
      try {
        const routeWaypoints = window.routeCalculator.waypoints || 
                              window.routeCalculator.getWaypoints?.() ||
                              window.routeCalculator.currentRoute?.waypoints;
        
        if (routeWaypoints && Array.isArray(routeWaypoints)) {
          const match = routeWaypoints.find(wp => 
            (wp.name === rigIcao || wp.id === rigIcao || wp.airportIcao === rigIcao) &&
            wp.lat && wp.lng
          );
          if (match) {
            console.log(`✅ Found coordinates for rig ${rigIcao} in routeCalculator:`, [match.lng, match.lat]);
            return [match.lng, match.lat];
          }
        }
      } catch (error) {
        console.warn(`Error accessing routeCalculator:`, error);
      }
    }
    
    console.warn(`❌ Could not find coordinates for rig ${rigIcao} in any waypoint source`);
    return null;
  }

  /**
   * Create straight shadow lines for 3D effect
   * @param {Array} validSegments - Weather segments with coordinates
   * @returns {Array} Array of straight line features for shadows
   */
  createStraightShadowLines(validSegments) {
    const shadowFeatures = [];
    
    // CRITICAL FIX: Get correct split point from flight data for shadows too
    const flightAlternateData = window.flightAlternateData;
    let correctSplitPoint = null;
    
    if (flightAlternateData && flightAlternateData.splitPoint) {
      // Parse the split point from flight data
      if (typeof flightAlternateData.splitPoint === 'string') {
        const parts = flightAlternateData.splitPoint.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          correctSplitPoint = [lng, lat]; // GeoJSON format: [lng, lat]
        }
      } else if (Array.isArray(flightAlternateData.splitPoint)) {
        correctSplitPoint = flightAlternateData.splitPoint;
      }
    }
    
    validSegments.forEach(segment => {
      if (segment.alternateGeoShape && segment.alternateGeoShape.coordinates && 
          segment.alternateGeoShape.coordinates.length >= 2) {
        
        // Use correct split point from flight data, fallback to segment data if unavailable
        const splitPoint = correctSplitPoint || segment.alternateGeoShape.coordinates[0];
        const destination = segment.alternateGeoShape.coordinates[1];
        
        // Create STRAIGHT line for shadow (3D effect)
        const shadowFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [splitPoint, destination] // Straight line for shadow
          },
          properties: {
            type: 'weather-alternate-shadow',
            airportIcao: segment.airportIcao
          }
        };
        
        shadowFeatures.push(shadowFeature);
      }
    });
    
    return shadowFeatures;
  }

  /**
   * Create curved line coordinates between two points (same as route curves)
   * @param {Array} start - [lng, lat] start coordinates
   * @param {Array} end - [lng, lat] end coordinates
   * @returns {Array} Array of curved coordinates
   */
  createCurvedLine(start, end) {
    // Simple curved line implementation
    // Uses a control point offset perpendicular to the line for the curve
    
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;
    
    // Calculate midpoint
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    
    // Calculate perpendicular offset for curve (smaller for weather lines)
    const deltaLng = endLng - startLng;
    const deltaLat = endLat - startLat;
    const distance = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
    
    // Curve offset proportional to distance (MUCH LOWER curve for weather alternate lines)
    const curveOffset = distance * 0.035; // Reduced from 0.075 to 0.035 (much flatter curves)
    
    // FIXED: Always curve upward/right - ensure positive direction
    // Calculate perpendicular direction and force it upward
    let perpLng = -deltaLat / distance * curveOffset;
    let perpLat = deltaLng / distance * curveOffset;
    
    // Force curve to always go "up" (positive latitude direction) or "right" (positive longitude)
    // This ensures consistent curve direction regardless of route direction
    if (perpLat < 0) {
      perpLng = -perpLng;
      perpLat = -perpLat;
    }
    
    // Control point offset from midpoint
    const controlLng = midLng + perpLng;
    const controlLat = midLat + perpLat;
    
    // Generate curved line with multiple points
    const steps = 25; // Increased steps for smoother curve
    const coordinates = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const t2 = t * t;
      const oneMinusT = 1 - t;
      const oneMinusT2 = oneMinusT * oneMinusT;
      
      // Quadratic Bezier curve formula
      const lng = oneMinusT2 * startLng + 2 * oneMinusT * t * controlLng + t2 * endLng;
      const lat = oneMinusT2 * startLat + 2 * oneMinusT * t * controlLat + t2 * endLat;
      
      coordinates.push([lng, lat]);
    }
    
    return coordinates;
  }
  
  /**
   * Update weather circles with new data
   * @param {Array} weatherSegments - New weather segments data
   */
  updateWeatherCircles(weatherSegments) {
    this.addWeatherCircles(weatherSegments);
  }

  /**
   * Static method to auto-create weather circles when segments are loaded
   * Call this when weather segments are first loaded for a new flight
   */
  static autoCreateOnWeatherLoad(map, weatherSegments) {
    if (!map || !weatherSegments || weatherSegments.length === 0) {
      return;
    }

    console.log('🔄 AUTO-CREATE: Weather segments loaded, creating weather circles automatically');
    
    // Create weather circles layer if it doesn't exist
    if (!window.currentWeatherCirclesLayer) {
      const weatherCirclesLayer = new WeatherCirclesLayer(map);
      weatherCirclesLayer.addWeatherCircles(weatherSegments);
      window.currentWeatherCirclesLayer = weatherCirclesLayer;
      console.log('🔄 AUTO-CREATE: Weather circles created automatically for new flight');
    } else {
      // Update existing layer
      window.currentWeatherCirclesLayer.addWeatherCircles(weatherSegments);
      console.log('🔄 AUTO-CREATE: Weather circles updated automatically');
    }
  }
  
  /**
   * Global helper function to refresh weather circles from any available data
   * Useful for debugging and manual testing
   */
  static refreshFromAvailableData(map) {
    try {
      console.log('🔄 REFRESH: Attempting to refresh weather circles from available data');
      
      // Find any available weather data
      let weatherData = null;
      let dataSource = 'none';
      
      if (window.loadedWeatherSegments?.length > 0) {
        weatherData = window.loadedWeatherSegments;
        dataSource = 'window.loadedWeatherSegments';
      }
      
      console.log(`🔄 REFRESH: Found data from ${dataSource}, segments:`, weatherData?.length || 0);
      
      if (weatherData && weatherData.length > 0 && map) {
        // Clean up existing layer
        if (window.currentWeatherCirclesLayer) {
          try {
            window.currentWeatherCirclesLayer.removeWeatherCircles();
          } catch (cleanupError) {
            console.warn('🔄 REFRESH: Error during cleanup:', cleanupError);
          }
        }
        
        // Create new layer
        const weatherCirclesLayer = new WeatherCirclesLayer(map);
        weatherCirclesLayer.addWeatherCircles(weatherData);
        window.currentWeatherCirclesLayer = weatherCirclesLayer;
        console.log('🔄 REFRESH: Weather circles refreshed successfully');
        return true;
      } else {
        console.log('🔄 REFRESH: No weather data available to refresh from');
        return false;
      }
    } catch (error) {
      console.error('🔄 REFRESH: Error refreshing weather circles:', error);
      return false;
    }
  }
}

// Make refresh function globally available for debugging
window.refreshWeatherCircles = () => {
  if (window.mapManager?.map) {
    return WeatherCirclesLayer.refreshFromAvailableData(window.mapManager.map);
  } else {
    console.error('🔄 REFRESH: Map not available for refresh');
    return false;
  }
};

// Global function to clear stuck locks
window.clearWeatherCirclesLock = () => {
  if (window.weatherCirclesCreationInProgress) {
    const lockAge = Date.now() - (window.weatherCirclesLockTime || 0);
    console.log(`🔓 MANUAL: Clearing weather circles lock (was active for ${lockAge}ms)`);
    window.weatherCirclesCreationInProgress = false;
    window.weatherCirclesLockTime = null;
    return true;
  } else {
    console.log('🔓 MANUAL: No active lock to clear');
    return false;
  }
};

// Global function to check lock status
window.checkWeatherCirclesLock = () => {
  if (window.weatherCirclesCreationInProgress) {
    const lockAge = Date.now() - (window.weatherCirclesLockTime || 0);
    console.log(`🔒 LOCK STATUS: Active for ${lockAge}ms (set at ${new Date(window.weatherCirclesLockTime).toLocaleTimeString()})`);
    return { active: true, ageMs: lockAge, setAt: window.weatherCirclesLockTime };
  } else {
    console.log('🔓 LOCK STATUS: No active lock');
    return { active: false };
  }
};

export default WeatherCirclesLayer;