/**
 * CorridorSearcher.js
 * 
 * Creates and manages search corridors along flight routes for fuel stop optimization.
 * Handles geometry calculations for finding platforms within route corridors.
 */

export class CorridorSearcher {
  
  /**
   * Creates a search corridor from route start toward split point or destination
   * @param {Array} waypoints - Route waypoints
   * @param {Object} alternateSplitPoint - Split point coordinates (if exists)
   * @param {Object} options - Search options
   * @returns {Object} Search corridor geometry
   */
  createSearchCorridor(waypoints, alternateSplitPoint, options = {}) {
    const { maxOffTrack = 100, minFromStart = 20 } = options;
    
    if (!waypoints || waypoints.length < 2) {
      throw new Error('Insufficient waypoints for corridor creation');
    }

    const startPoint = waypoints[0];
    
    // 🚨 CRITICAL FIX: Check if alternateSplitPoint has valid coordinates
    let endPoint;
    if (alternateSplitPoint && alternateSplitPoint.lat && alternateSplitPoint.lng) {
      endPoint = alternateSplitPoint;
    } else {
      endPoint = waypoints[waypoints.length - 1]; // Use last waypoint
      console.log('🔍 CORRIDOR: Using last waypoint as end point (alternateSplitPoint invalid)');
    }
    
    // 🚨 CRITICAL FIX: Validate waypoint coordinates
    if (!startPoint.lat || !startPoint.lng) {
      console.error('❌ CORRIDOR: Start point missing coordinates:', startPoint);
      throw new Error(`Start point ${startPoint.name} missing lat/lng coordinates`);
    }
    
    if (!endPoint.lat || !endPoint.lng) {
      console.error('❌ CORRIDOR: End point missing coordinates:', endPoint);
      throw new Error(`End point ${endPoint.name || 'undefined'} missing lat/lng coordinates`);
    }
    
    console.log('Creating search corridor:', {
      start: `${startPoint.name} (${startPoint.lat}, ${startPoint.lng})`,
      end: alternateSplitPoint ? `Split Point (${endPoint.lat}, ${endPoint.lng})` : `${waypoints[waypoints.length - 1].name} (${endPoint.lat}, ${endPoint.lng})`,
      maxOffTrack: `${maxOffTrack}nm`,
      minFromStart: `${minFromStart}nm`,
      totalDistance: `${this.calculateDistance(startPoint, endPoint).toFixed(1)}nm`
    });

    // Create corridor segments for better coverage
    const corridorSegments = this.generateCorridorSegments(
      startPoint, 
      endPoint, 
      maxOffTrack,
      minFromStart
    );

    // Reduced logging for corridor segments
    console.log(`🗺️ CORRIDOR SEGMENTS: Created ${corridorSegments.length} segments, radius=${maxOffTrack}nm each`);

    return {
      startPoint,
      endPoint,
      maxOffTrack,
      minFromStart,
      segments: corridorSegments,
      totalDistance: this.calculateDistance(startPoint, endPoint)
    };
  }

  /**
   * Generates corridor segments for comprehensive platform search
   * @param {Object} start - Start coordinates
   * @param {Object} end - End coordinates  
   * @param {Number} corridorWidth - Max distance from route (nm)
   * @param {Number} minFromStart - Minimum distance from start (nm)
   * @returns {Array} Corridor segments
   */
  generateCorridorSegments(start, end, corridorWidth, minFromStart) {
    const segments = [];
    const totalDistance = this.calculateDistance(start, end);
    
    console.log(`🗺️ SEGMENT GENERATION: ${totalDistance.toFixed(1)}nm route, minFromStart=${minFromStart}nm`);
    
    // 🚨 SPECIAL CASE: Round trip or very short route
    if (totalDistance < minFromStart * 2) {
      console.log('🗺️ SHORT/ROUND TRIP: Creating radial search pattern around start point');
      
      // Create radial segments around the start point for short routes
      const radialSegments = [
        { center: { lat: start.lat + 0.05, lng: start.lng }, radius: corridorWidth, distanceFromStart: minFromStart + 5 },
        { center: { lat: start.lat - 0.05, lng: start.lng }, radius: corridorWidth, distanceFromStart: minFromStart + 5 },
        { center: { lat: start.lat, lng: start.lng + 0.05 }, radius: corridorWidth, distanceFromStart: minFromStart + 5 },
        { center: { lat: start.lat, lng: start.lng - 0.05 }, radius: corridorWidth, distanceFromStart: minFromStart + 5 }
      ];
      
      return radialSegments;
    }
    
    const numSegments = 10; // Divide corridor into 10 segments
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const segmentCenter = this.interpolatePoint(start, end, t);
      const distanceFromStart = this.calculateDistance(start, segmentCenter);
      
      // Skip segments too close to departure
      if (distanceFromStart < minFromStart) {
        continue;
      }
      
      segments.push({
        center: segmentCenter,
        radius: corridorWidth,
        distanceFromStart,
        segmentIndex: i
      });
    }
    
    console.log(`🗺️ GENERATED ${segments.length} corridor segments`);
    return segments;
  }

  /**
   * Checks if a platform is within the search corridor
   * @param {Object} platform - Platform with lat/lng coordinates
   * @param {Object} corridor - Search corridor
   * @returns {Boolean} True if platform is within corridor
   */
  isPlatformInCorridor(platform, corridor) {
    if (!platform.lat || !platform.lng) {
      console.warn('❌ CORRIDOR: Platform missing coordinates:', platform.name);
      return false;
    }

    // Check distance from start point
    const distanceFromStart = this.calculateDistance(corridor.startPoint, platform);
    if (distanceFromStart < corridor.minFromStart) {
      console.log(`❌ CORRIDOR: ${platform.name} too close to start (${distanceFromStart.toFixed(1)}nm < ${corridor.minFromStart}nm)`);
      console.log(`  🔍 START POINT: [${corridor.startPoint.lat}, ${corridor.startPoint.lng}]`);
      console.log(`  🔍 PLATFORM: [${platform.lat}, ${platform.lng}]`);
      return false; // Too close to departure
    }

    // Check if platform is within any corridor segment
    let closestSegmentDistance = Infinity;
    let inAnySegment = false;
    
    corridor.segments.forEach((segment, index) => {
      const distanceFromSegment = this.calculateDistance(segment.center, platform);
      closestSegmentDistance = Math.min(closestSegmentDistance, distanceFromSegment);
      
      if (distanceFromSegment <= segment.radius) {
        inAnySegment = true;
        // Only log successful corridor matches to reduce noise
        console.log(`✅ CORRIDOR: ${platform.name} in segment ${index} (${distanceFromSegment.toFixed(1)}nm from center)`);
      }
    });
    
    // Only log segment rejection for first few platforms
    if (!inAnySegment && Math.random() < 0.1) {
      console.log(`❌ CORRIDOR: ${platform.name} outside all segments (closest: ${closestSegmentDistance.toFixed(1)}nm, radius: ${corridor.maxOffTrack}nm)`);
    }

    return inAnySegment;
  }

  /**
   * Finds the closest point on route to a given platform
   * @param {Object} platform - Platform coordinates
   * @param {Object} corridor - Search corridor
   * @returns {Object} Closest route point and distance
   */
  findClosestPointOnRoute(platform, corridor) {
    let closestPoint = null;
    let minDistance = Infinity;
    let closestSegment = null;

    corridor.segments.forEach((segment, index) => {
      const distance = this.calculateDistance(platform, segment.center);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = segment.center;
        closestSegment = index;
      }
    });

    return {
      point: closestPoint,
      distance: minDistance,
      segmentIndex: closestSegment
    };
  }

  /**
   * Interpolates between two geographic points
   * @param {Object} start - Start point {lat, lng}
   * @param {Object} end - End point {lat, lng}
   * @param {Number} t - Interpolation parameter (0-1)
   * @returns {Object} Interpolated point
   */
  interpolatePoint(start, end, t) {
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    return { lat, lng };
  }

  /**
   * Calculates great circle distance between two points (nautical miles)
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {Number} Distance in nautical miles
   */
  calculateDistance(point1, point2) {
    if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
      console.warn('❌ DISTANCE: Missing coordinates', { 
        point1: { lat: point1?.lat, lng: point1?.lng }, 
        point2: { lat: point2?.lat, lng: point2?.lng } 
      });
      return 0;
    }

    const R = 3440.065; // Earth radius in nautical miles
    const dLat = this.degreesToRadians(point2.lat - point1.lat);
    const dLng = this.degreesToRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degreesToRadians(point1.lat)) * 
              Math.cos(this.degreesToRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Only log distance calculation issues during optimization debugging
    if (distance < 1 && (point1.name || point2.name)) {
      console.log(`📏 SUSPICIOUS DISTANCE: ${distance.toFixed(4)}nm between [${point1.lat}, ${point1.lng}] and [${point2.lat}, ${point2.lng}]`);
    }
    
    return distance;
  }

  /**
   * Converts degrees to radians
   * @param {Number} degrees 
   * @returns {Number} Radians
   */
  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculates bearing from one point to another
   * @param {Object} from - Start point {lat, lng}
   * @param {Object} to - End point {lat, lng}
   * @returns {Number} Bearing in degrees
   */
  calculateBearing(from, to) {
    const dLng = this.degreesToRadians(to.lng - from.lng);
    const lat1 = this.degreesToRadians(from.lat);
    const lat2 = this.degreesToRadians(to.lat);
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x);
    return (bearing * 180 / Math.PI + 360) % 360; // Normalize to 0-360
  }
}

export default CorridorSearcher;