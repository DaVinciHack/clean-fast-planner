/**
 * PlatformEvaluator.js
 * 
 * Evaluates platform suitability for fuel stops based on location, capabilities,
 * and operational status. Searches through all location objects for rigs with fuel.
 */

export class PlatformEvaluator {

  /**
   * Searches all location objects for rigs with fuel capability
   * @param {Object} allLocations - Complete location dataset
   * @param {Object} corridor - Search corridor
   * @returns {Array} Fuel-capable rigs within corridor
   */
  findFuelCapableRigs(allLocations, corridor) {
    console.log('Searching all locations for fuel-capable rigs...');
    
    const fuelCapableRigs = [];
    
    // Search through all location object types
    if (allLocations.platforms) {
      fuelCapableRigs.push(...this.searchPlatformCollection(allLocations.platforms, corridor));
    }
    
    if (allLocations.rigs) {
      fuelCapableRigs.push(...this.searchPlatformCollection(allLocations.rigs, corridor));
    }
    
    if (allLocations.helidecks) {
      fuelCapableRigs.push(...this.searchPlatformCollection(allLocations.helidecks, corridor));
    }
    
    if (allLocations.oilPlatforms) {
      fuelCapableRigs.push(...this.searchPlatformCollection(allLocations.oilPlatforms, corridor));
    }

    // Search any additional location collections
    Object.keys(allLocations).forEach(key => {
      if (!['platforms', 'rigs', 'helidecks', 'oilPlatforms'].includes(key)) {
        const collection = allLocations[key];
        if (Array.isArray(collection)) {
          fuelCapableRigs.push(...this.searchPlatformCollection(collection, corridor));
        }
      }
    });

    console.log(`Found ${fuelCapableRigs.length} fuel-capable rigs in corridor`);
    return fuelCapableRigs;
  }

  /**
   * Searches a platform collection for fuel-capable rigs
   * @param {Array} platforms - Platform collection
   * @param {Object} corridor - Search corridor
   * @returns {Array} Filtered platforms
   */
  searchPlatformCollection(platforms, corridor) {
    if (!Array.isArray(platforms)) {
      return [];
    }

    return platforms.filter(platform => {
      // Check fuel capability
      if (!this.hasFuelCapability(platform)) {
        return false;
      }

      // Check operational status
      if (!this.isOperational(platform)) {
        return false;
      }

      // Check coordinates
      if (!this.hasValidCoordinates(platform)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Determines if platform has fuel capability
   * @param {Object} platform - Platform data
   * @returns {Boolean} True if platform can provide fuel
   */
  hasFuelCapability(platform) {
    // 🛢️ USE SAME LOGIC AS PLATFORMMANAGER (lines 832-838)
    // Check fuelAvailable string field exactly like PlatformManager does
    if (platform.fuelAvailable === 'Y' || 
        platform.fuelAvailable === 'Yes' || 
        platform.fuelAvailable === 'YES' ||
        platform.fuel_available === 'Y' ||
        platform.fuel_available === 'Yes' ||
        platform.fuel_available === 'YES') {
      return true;
    }

    // Check if hasFuel property was already set by PlatformManager
    if (platform.hasFuel === true) {
      return true;
    }

    // Check various other fuel capability indicators (boolean)
    const fuelIndicators = [
      platform.canRefuel,
      platform.refuel_capability,
      platform.services?.includes('fuel'),
      platform.services?.includes('FUEL'),
      platform.facilities?.fuel,
      platform.capabilities?.fuel
    ];

    // Check if any fuel indicator is true
    if (fuelIndicators.some(indicator => indicator === true)) {
      return true;
    }

    // Check fuel capacity indicators
    const fuelCapacityIndicators = [
      platform.fuelCapacity,
      platform.fuel_capacity,
      platform.maxFuel,
      platform.fuel_storage
    ];

    // If has fuel capacity > 0, assume fuel capability
    if (fuelCapacityIndicators.some(capacity => capacity && capacity > 0)) {
      return true;
    }

    // Check platform type - oil rigs typically have fuel
    const platformType = (platform.type || platform.platformType || '').toLowerCase();
    const fuelCapableTypes = ['oil_rig', 'drilling_platform', 'production_platform', 'fpso'];
    
    if (fuelCapableTypes.some(type => platformType.includes(type))) {
      return true;
    }

    return false;
  }

  /**
   * Checks if platform is operational
   * @param {Object} platform - Platform data
   * @returns {Boolean} True if operational
   */
  isOperational(platform) {
    // Check status indicators
    const status = (platform.status || platform.operationalStatus || '').toLowerCase();
    const nonOperationalStatuses = ['inactive', 'decommissioned', 'maintenance', 'closed'];
    
    if (nonOperationalStatuses.some(badStatus => status.includes(badStatus))) {
      return false;
    }

    // Check active indicators
    if (platform.active === false || platform.operational === false) {
      return false;
    }

    // Default to operational if no negative indicators
    return true;
  }

  /**
   * Validates platform coordinates
   * @param {Object} platform - Platform data
   * @returns {Boolean} True if has valid coordinates
   */
  hasValidCoordinates(platform) {
    // Check various coordinate field names
    let lat = platform.lat || platform.latitude || platform.coord?.lat;
    let lng = platform.lng || platform.longitude || platform.coord?.lng || 
                platform.lon || platform.coord?.lon;

    // 🚨 CRITICAL FIX: Handle coordinates array format [longitude, latitude]
    if (!lat && !lng && platform.coordinates && Array.isArray(platform.coordinates) && platform.coordinates.length >= 2) {
      lng = platform.coordinates[0]; // longitude is first
      lat = platform.coordinates[1]; // latitude is second
      // Coordinate conversion successful
    }

    if (!lat || !lng) {
      return false;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    return true;
  }

  /**
   * Normalizes platform data for consistent processing
   * @param {Object} platform - Raw platform data
   * @returns {Object} Normalized platform
   */
  normalizePlatform(platform) {
    // Normalize coordinates
    let lat = platform.lat || platform.latitude || platform.coord?.lat;
    let lng = platform.lng || platform.longitude || platform.coord?.lng || 
                platform.lon || platform.coord?.lon;

    // 🚨 CRITICAL FIX: Handle coordinates array format [longitude, latitude]
    if (!lat && !lng && platform.coordinates && Array.isArray(platform.coordinates) && platform.coordinates.length >= 2) {
      lng = platform.coordinates[0]; // longitude is first
      lat = platform.coordinates[1]; // latitude is second
      // Platform normalized with coordinates array
    }

    // Normalize identification
    const name = platform.name || platform.platformName || platform.id || platform.code;
    const id = platform.id || platform.platformId || platform.code || name;

    // Normalize fuel data
    const fuelCapacity = platform.fuelCapacity || platform.fuel_capacity || 
                        platform.maxFuel || platform.fuel_storage || 5000; // Default capacity

    return {
      ...platform,
      lat,
      lng,
      name,
      id,
      fuelCapacity,
      hasFuel: this.hasFuelCapability(platform),
      isOperational: this.isOperational(platform),
      platformType: platform.type || platform.platformType || 'unknown'
    };
  }

  /**
   * Calculates platform suitability score for fuel stop
   * @param {Object} platform - Normalized platform
   * @param {Object} route - Route information
   * @returns {Number} Suitability score (higher is better)
   */
  calculateSuitabilityScore(platform, route) {
    let score = 0;

    // Distance from route factor (closer is better)
    const distanceFromRoute = route.distanceFromRoute || 0;
    score += Math.max(0, 10 - distanceFromRoute); // 10 points max for being on route

    // Distance from split point factor (closer to split is better)
    const distanceFromSplit = route.distanceFromSplit || 0;
    score += Math.max(0, 5 - (distanceFromSplit / 10)); // 5 points max

    // Fuel capacity factor
    const fuelCapacity = platform.fuelCapacity || 5000;
    score += Math.min(5, fuelCapacity / 1000); // 5 points max for large fuel capacity

    // Platform type bonus
    const platformType = (platform.platformType || '').toLowerCase();
    if (platformType.includes('production')) score += 3;
    if (platformType.includes('drilling')) score += 2;
    if (platformType.includes('fpso')) score += 4;

    // Operational status bonus
    if (platform.isOperational) score += 2;

    return score;
  }

  /**
   * Filters platforms by minimum requirements
   * @param {Array} platforms - Platform list
   * @param {Object} requirements - Minimum requirements
   * @returns {Array} Filtered platforms
   */
  filterByRequirements(platforms, requirements = {}) {
    const {
      minFuelCapacity = 1000,
      maxDistanceFromRoute = 10,
      requireOperational = true
    } = requirements;

    return platforms.filter(platform => {
      if (requireOperational && !platform.isOperational) {
        return false;
      }

      if (platform.fuelCapacity < minFuelCapacity) {
        return false;
      }

      if (platform.distanceFromRoute > maxDistanceFromRoute) {
        return false;
      }

      return true;
    });
  }
}

export default PlatformEvaluator;