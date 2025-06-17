/**
 * RegionalUnits.js
 * 
 * Utility for handling regional unit conversions for weather data
 * USA: Fahrenheit, Statute Miles
 * All other regions: Celsius, Meters
 */

/**
 * Determine if region uses US imperial units
 * @param {Object} region - Region object with name/id
 * @returns {boolean} True if US region (uses imperial), false for metric
 */
export function isUSRegion(region) {
  console.log('🌍 REGION DEBUG: Checking region for US detection:', region);
  
  if (!region) {
    console.log('🌍 REGION DEBUG: No region provided, defaulting to metric');
    return false;
  }
  
  const regionName = region.name || region.id || '';
  const lowerName = regionName.toLowerCase();
  
  console.log('🌍 REGION DEBUG: Region name:', regionName, 'Lowercase:', lowerName);
  
  // US regions: Gulf Coast, US territories, etc.
  const isUS = lowerName.includes('gulf') || 
         lowerName.includes('us') || 
         lowerName.includes('united states') ||
         lowerName.includes('america') ||
         lowerName.includes('texas') ||
         lowerName.includes('louisiana') ||
         lowerName.includes('florida');
         
  console.log('🌍 REGION DEBUG: Is US region?', isUS);
  return isUS;
}

/**
 * Format temperature for regional display
 * @param {number} tempCelsius - Temperature in Celsius
 * @param {Object} region - Region object
 * @returns {string} Formatted temperature with correct unit
 */
export function formatTemperature(tempCelsius, region) {
  if (!tempCelsius && tempCelsius !== 0) return 'Unknown';
  
  if (isUSRegion(region)) {
    // Convert C to F for US regions
    const tempF = Math.round((tempCelsius * 9/5) + 32);
    return `${tempF}°F`;
  } else {
    // Keep Celsius for other regions
    return `${Math.round(tempCelsius)}°C`;
  }
}

/**
 * Format visibility for regional display
 * @param {number} visibilityMeters - Visibility in meters
 * @param {Object} region - Region object
 * @returns {string} Formatted visibility with correct unit
 */
export function formatVisibility(visibilityMeters, region) {
  if (!visibilityMeters && visibilityMeters !== 0) return 'Unknown';
  
  if (isUSRegion(region)) {
    // Convert meters to statute miles for US regions
    const visibilitySM = Math.round(visibilityMeters / 1609.34 * 10) / 10; // Round to 1 decimal
    return `${visibilitySM} SM`;
  } else {
    // Use meters for other regions
    if (visibilityMeters >= 1000) {
      const visibilityKm = Math.round(visibilityMeters / 100) / 10; // Round to 1 decimal km
      return `${visibilityKm} km`;
    } else {
      return `${Math.round(visibilityMeters)} m`;
    }
  }
}

/**
 * Convert visibility from various input formats to meters
 * @param {number} visibility - Visibility value
 * @param {string} inputUnit - Input unit ('SM', 'km', 'm', or auto-detect)
 * @returns {number} Visibility in meters
 */
export function normalizeVisibilityToMeters(visibility, inputUnit = 'auto') {
  if (!visibility && visibility !== 0) return null;
  
  switch (inputUnit.toLowerCase()) {
    case 'sm':
    case 'mi':
    case 'miles':
      return Math.round(visibility * 1609.34); // SM to meters
    case 'km':
    case 'kilometers':
      return Math.round(visibility * 1000); // km to meters
    case 'm':
    case 'meters':
      return Math.round(visibility); // already meters
    case 'auto':
    default:
      // Auto-detect based on value range
      if (visibility > 50) {
        // Likely meters or km
        if (visibility > 10000) {
          return Math.round(visibility); // Assume meters
        } else {
          return Math.round(visibility * 1000); // Assume km
        }
      } else {
        // Likely statute miles
        return Math.round(visibility * 1609.34);
      }
  }
}

/**
 * Get current region from various sources
 * @returns {Object|null} Current region object
 */
export function getCurrentRegion() {
  console.log('🌍 REGION DEBUG: Looking for current region...');
  console.log('🌍 REGION DEBUG: window.activeRegionFromContext:', window.activeRegionFromContext);
  console.log('🌍 REGION DEBUG: window.currentRegion:', window.currentRegion);
  console.log('🌍 REGION DEBUG: window.regionManager?.getCurrentRegion():', window.regionManager?.getCurrentRegion());
  console.log('🌍 REGION DEBUG: window.appManagers?.regionManagerRef?.current?.getCurrentRegion():', window.appManagers?.regionManagerRef?.current?.getCurrentRegion());
  
  // Try multiple sources for region
  const region = window.activeRegionFromContext || 
         window.currentRegion || 
         window.regionManager?.getCurrentRegion() ||
         window.appManagers?.regionManagerRef?.current?.getCurrentRegion() ||
         null;
         
  console.log('🌍 REGION DEBUG: Selected region:', region);
  return region;
}

/**
 * Format weather data with regional units
 * @param {Object} weatherData - Raw weather data
 * @param {Object} region - Optional region (will auto-detect if not provided)
 * @returns {Object} Weather data with regionally-formatted units
 */
export function formatWeatherDataRegionally(weatherData, region = null) {
  const currentRegion = region || getCurrentRegion();
  
  return {
    ...weatherData,
    formattedTemperature: formatTemperature(weatherData.temperature, currentRegion),
    formattedVisibility: formatVisibility(weatherData.visibility || weatherData.visibilityMeters, currentRegion),
    isUSRegion: isUSRegion(currentRegion),
    region: currentRegion?.name || 'Unknown'
  };
}

export default {
  isUSRegion,
  formatTemperature,
  formatVisibility,
  normalizeVisibilityToMeters,
  getCurrentRegion,
  formatWeatherDataRegionally
};