/**
 * mode-handler-fix.js
 * 
 * Emergency fix for waypoint mode vs normal mode clicking
 * This creates and initializes the handlers directly when imported
 */

import { createSeparateHandlers, toggleMode } from './separate-mode-handler';

let handlers = null;
let initialized = false;

/**
 * Initialize handlers directly, bypassing React component lifecycle
 * @returns {Object} The handlers object if successful, null if failed
 */
export function initializeHandlers() {
  console.log('MODE HANDLER FIX: Initializing handlers directly');
  
  // Use global references created in FastPlannerApp
  if (!window.mapManager || !window.waypointManager || !window.platformManager) {
    console.error('MODE HANDLER FIX: Required managers not available globally');
    return null;
  }
  
  try {
    // Create handlers using global references
    handlers = createSeparateHandlers(
      window.mapManager,
      window.waypointManager,
      window.platformManager
    );
    
    if (!handlers) {
      console.error('MODE HANDLER FIX: Failed to create handlers');
      return null;
    }
    
    // Activate normal mode by default
    handlers.waypointModeHandler.deactivate();
    handlers.normalModeHandler.activate();
    
    // Make toggle function available globally
    window.toggleMapMode = (mode) => {
      console.log(`MODE HANDLER FIX: Global toggle to ${mode} mode`);
      return toggleMode(handlers, mode === 'waypoint');
    };
    
    initialized = true;
    console.log('MODE HANDLER FIX: Handlers initialized successfully');
    return handlers;
  } catch (error) {
    console.error('MODE HANDLER FIX: Error initializing handlers:', error);
    return null;
  }
}

/**
 * Force reinitialization of handlers
 * @returns {Object} The handlers object if successful, null if failed
 */
export function reinitializeHandlers() {
  console.log('MODE HANDLER FIX: Forcing reinitialization');
  
  // Clean up existing handlers if possible
  if (handlers) {
    try {
      handlers.normalModeHandler.deactivate();
      handlers.waypointModeHandler.deactivate();
    } catch (error) {
      console.error('MODE HANDLER FIX: Error cleaning up handlers:', error);
    }
  }
  
  // Reset handlers
  handlers = null;
  initialized = false;
  
  // Reinitialize
  return initializeHandlers();
}

/**
 * Get the current handlers
 * @returns {Object} The handlers object or null if not initialized
 */
export function getHandlers() {
  return handlers;
}

/**
 * Check if handlers are initialized
 * @returns {boolean} True if initialized, false otherwise
 */
export function isInitialized() {
  return initialized;
}

// Export the module as default as well
export default {
  initializeHandlers,
  reinitializeHandlers,
  getHandlers,
  isInitialized
};
