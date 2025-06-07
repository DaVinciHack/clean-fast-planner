/**
 * MapInitHelper.js
 * 
 * Helper utilities for safely working with map initialization and interactions
 */

/**
 * Check if a map object is fully initialized and ready for use
 * @param {Object} map - The map object to check
 * @returns {boolean} - True if the map is ready for use
 */
export const isMapReady = (map) => {
  if (!map) return false;
  
  // Check if critical methods exist
  return typeof map.on === 'function' && 
         typeof map.off === 'function' && 
         typeof map.fitBounds === 'function';
};

/**
 * Safely add an event listener to a map
 * @param {Object} map - The map object
 * @param {string} eventName - The event name to listen for
 * @param {Function} handler - The event handler function
 * @param {number} maxRetries - Maximum number of retries if map not ready
 * @returns {boolean} - True if the event was successfully added
 */
export const safeAddMapEvent = (map, eventName, handler, maxRetries = 3) => {
  if (isMapReady(map)) {
    map.on(eventName, handler);
    return true;
  } else if (maxRetries > 0) {
    console.log(`Map not ready for ${eventName} event, retrying in 500ms... (${maxRetries} retries left)`);
    setTimeout(() => {
      safeAddMapEvent(map, eventName, handler, maxRetries - 1);
    }, 500);
    return false;
  } else {
    console.error(`Failed to add ${eventName} event after multiple retries - map not ready`);
    return false;
  }
};

/**
 * Safely execute a map method with retries
 * @param {Object} map - The map object
 * @param {string} methodName - The name of the method to call
 * @param {Array} args - Arguments to pass to the method
 * @param {number} maxRetries - Maximum number of retries if map not ready
 * @returns {Promise} - Resolves with method result or rejects after max retries
 */
export const safeExecuteMapMethod = (map, methodName, args = [], maxRetries = 3) => {
  return new Promise((resolve, reject) => {
    if (map && typeof map[methodName] === 'function') {
      try {
        const result = map[methodName](...args);
        resolve(result);
      } catch (error) {
        console.error(`Error executing map method ${methodName}:`, error);
        reject(error);
      }
    } else if (maxRetries > 0) {
      console.log(`Map not ready for ${methodName} method, retrying in 500ms... (${maxRetries} retries left)`);
      setTimeout(() => {
        safeExecuteMapMethod(map, methodName, args, maxRetries - 1)
          .then(resolve)
          .catch(reject);
      }, 500);
    } else {
      const error = new Error(`Failed to execute ${methodName} after multiple retries - map not ready`);
      reject(error);
    }
  });
};

/**
 * Queue a function to run when the map is ready
 * @param {Function} getMapFn - Function that returns the map object
 * @param {Function} runFn - Function to run when map is ready
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} retryInterval - Time between retries in ms
 */
export const runWhenMapReady = (getMapFn, runFn, maxRetries = 5, retryInterval = 500) => {
  let attempts = 0;
  
  const checkAndRun = () => {
    const map = getMapFn();
    if (isMapReady(map)) {
      runFn(map);
      return true;
    } else if (attempts < maxRetries) {
      attempts++;
      setTimeout(checkAndRun, retryInterval);
      return false;
    } else {
      console.error(`Map not ready after ${maxRetries} attempts`);
      return false;
    }
  };
  
  return checkAndRun();
};

/**
 * Create a resilient map interaction handler
 * @param {Object} mapManager - The map manager instance
 * @param {Function} setupFn - Function to set up handlers when map is ready
 */
export const createResilientMapHandler = (mapManager, setupFn) => {
  if (!mapManager) {
    console.error('Map manager is required for resilient map handler');
    return;
  }
  
  // Handler for when the map becomes available
  const handleMapReady = (map) => {
    if (isMapReady(map)) {
      setupFn(map);
    } else {
      console.error('Map is not fully initialized');
    }
  };
  
  // Approach 1: Try immediately
  const map = mapManager.getMap();
  if (isMapReady(map)) {
    handleMapReady(map);
    return true;
  }
  
  // Approach 2: Use the onMapLoaded callback if available
  if (typeof mapManager.onMapLoaded === 'function') {
    mapManager.onMapLoaded(handleMapReady);
    return true;
  }
  
  // Approach 3: Use the retry method
  runWhenMapReady(
    () => mapManager.getMap(),
    handleMapReady
  );
  
  return true;
};

export default {
  isMapReady,
  safeAddMapEvent,
  safeExecuteMapMethod,
  runWhenMapReady,
  createResilientMapHandler
};
