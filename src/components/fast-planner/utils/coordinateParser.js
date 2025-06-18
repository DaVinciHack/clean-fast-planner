// src/components/fast-planner/utils/coordinateParser.js

/**
 * Coordinate parsing utility for aviation coordinate formats
 */

/**
 * Parse coordinates from various aviation formats
 */
export const parseCoordinates = (input) => {
  if (!input || typeof input !== 'string') {
    return { coordinates: null, isValid: false, format: null, error: 'Invalid input' };
  }

  const trimmed = input.trim();
  
  // Try different coordinate formats
  const formats = [
    parseDecimalDegrees,
    parseDegreesDecimalMinutes,
    parseDegreesMinutesSeconds,
    parseCommaDelimited
  ];

  for (const parseFormat of formats) {
    const result = parseFormat(trimmed);
    if (result.isValid) {
      return result;
    }
  }

  return { 
    coordinates: null, 
    isValid: false, 
    format: null, 
    error: 'Unrecognized coordinate format' 
  };
};

/**
 * Check if a string could be coordinates
 */
export const looksLikeCoordinates = (input) => {
  if (!input || typeof input !== 'string') return false;
  const patterns = [
    /^\s*[+-]?\d{1,3}(?:\.\d+)?\s*,\s*[+-]?\d{1,3}(?:\.\d+)?\s*$/, // Comma-separated: "27.73333, -91.99383"
    /^\s*[+-]?\d{1,3}(?:\.\d+)?\s+[+-]?\d{1,3}(?:\.\d+)?\s*$/,     // Space-separated: "27.73333 -91.99383"
    /\d+°.*[NSEW]/i // Degrees format: "27°44'N 91°59'W"
  ];
  return patterns.some(pattern => pattern.test(input.trim()));
};

/**
 * Parse decimal degrees format
 * Examples: "60.7917, 5.3417", "60.7917 5.3417", "-80.1918, 25.7617"
 */
const parseDecimalDegrees = (input) => {
  const patterns = [
    /^([+-]?\d{1,3}(?:\.\d+)?)\s*,\s*([+-]?\d{1,3}(?:\.\d+)?)$/,
    /^([+-]?\d{1,3}(?:\.\d+)?)\s+([+-]?\d{1,3}(?:\.\d+)?)$/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      if (isValidLatitude(lat) && isValidLongitude(lng)) {
        return { coordinates: [lng, lat], isValid: true, format: 'Decimal Degrees' };
      }
    }
  }
  
  return { coordinates: null, isValid: false, format: null };
};

/**
 * Parse degrees decimal minutes format
 * Examples: "60° 47.502' N, 5° 20.502' E", "N 60° 47.502' E 5° 20.502'"
 */
const parseDegreesDecimalMinutes = (input) => {
  const pattern = /(\d{1,3})°?\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])\s*,?\s*(\d{1,3})°?\s*(\d{1,2}(?:\.\d+)?)'?\s*([NSEW])/i;
  const match = input.match(pattern);
  
  if (match) {
    const [, deg1, min1, dir1, deg2, min2, dir2] = match;
    
    const coord1 = parseInt(deg1) + parseFloat(min1) / 60;
    const coord2 = parseInt(deg2) + parseFloat(min2) / 60;
    
    let lat, lng;
    if (['N', 'S'].includes(dir1.toUpperCase())) {
      lat = dir1.toUpperCase() === 'S' ? -coord1 : coord1;
      lng = dir2.toUpperCase() === 'W' ? -coord2 : coord2;
    } else {
      lng = dir1.toUpperCase() === 'W' ? -coord1 : coord1;
      lat = dir2.toUpperCase() === 'S' ? -coord2 : coord2;
    }
    
    if (isValidLatitude(lat) && isValidLongitude(lng)) {
      return { coordinates: [lng, lat], isValid: true, format: 'Degrees Decimal Minutes' };
    }
  }
  
  return { coordinates: null, isValid: false, format: null };
};

/**
 * Parse degrees minutes seconds format
 * Examples: "60° 47' 30.12\" N, 5° 20' 30.12\" E"
 */
const parseDegreesMinutesSeconds = (input) => {
  const pattern = /(\d{1,3})°?\s*(\d{1,2})'?\s*(\d{1,2}(?:\.\d+)?)\"?\s*([NSEW])\s*,?\s*(\d{1,3})°?\s*(\d{1,2})'?\s*(\d{1,2}(?:\.\d+)?)\"?\s*([NSEW])/i;
  const match = input.match(pattern);
  
  if (match) {
    const [, deg1, min1, sec1, dir1, deg2, min2, sec2, dir2] = match;
    
    const coord1 = parseInt(deg1) + parseInt(min1) / 60 + parseFloat(sec1) / 3600;
    const coord2 = parseInt(deg2) + parseInt(min2) / 60 + parseFloat(sec2) / 3600;
    
    let lat, lng;
    if (['N', 'S'].includes(dir1.toUpperCase())) {
      lat = dir1.toUpperCase() === 'S' ? -coord1 : coord1;
      lng = dir2.toUpperCase() === 'W' ? -coord2 : coord2;
    } else {
      lng = dir1.toUpperCase() === 'W' ? -coord1 : coord1;
      lat = dir2.toUpperCase() === 'S' ? -coord2 : coord2;
    }
    
    if (isValidLatitude(lat) && isValidLongitude(lng)) {
      return { coordinates: [lng, lat], isValid: true, format: 'Degrees Minutes Seconds' };
    }
  }
  
  return { coordinates: null, isValid: false, format: null };
};

/**
 * Parse simple comma-delimited coordinates
 */
const parseCommaDelimited = (input) => {
  const parts = input.split(',').map(part => part.trim());
  
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    
    if (!isNaN(lat) && !isNaN(lng) && isValidLatitude(lat) && isValidLongitude(lng)) {
      return { coordinates: [lng, lat], isValid: true, format: 'Comma Delimited' };
    }
  }
  
  return { coordinates: null, isValid: false, format: null };
};

/**
 * Validate latitude (-90 to 90)
 */
const isValidLatitude = (lat) => {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
};

/**
 * Validate longitude (-180 to 180)
 */
const isValidLongitude = (lng) => {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
};