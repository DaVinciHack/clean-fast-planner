/**
 * region-management-fix.js
 * 
 * This is a comprehensive fix for the region management system.
 * It implements a single, reliable path for region initialization and changes.
 */

// Core fix functions
const fixRegionManagement = (window) => {
  console.log("🔧 Applying region management fix...");
  
  // Global reference storage for critical components
  window.fastPlannerRefs = window.fastPlannerRefs || {};
  
  // Single shared singleton for region state
  window.regionState = {
    currentRegion: null,
    isChangingRegion: false,
    pendingRegionChange: null,
    mapReady: false,
    platformsLoaded: false
  };
  
  // Extend Map's getLayer to safely handle non-existent layers
  const safelyPatchMapMethods = () => {
    try {
      if (window.mapboxgl && window.mapboxgl.Map) {
        const originalGetLayer = window.mapboxgl.Map.prototype.getLayer;
        
        window.mapboxgl.Map.prototype.getLayer = function(id) {
          try {
            return originalGetLayer.call(this, id);
          } catch (e) {
            // Instead of throwing, just return undefined
            return undefined;
          }
        };
        
        console.log("🔧 Successfully patched Map.getLayer for safety");
      }
    } catch (e) {
      console.error("❌ Error patching Map methods:", e);
    }
  };
  
  // Monitor map loading state
  const setupMapReadyMonitor = () => {
    // Listen for map initialization events
    window.addEventListener('map-ready', (event) => {
      console.log("🗺️ Map ready event received");
      window.regionState.mapReady = true;
      
      // If there's a pending region change, apply it now
      if (window.regionState.pendingRegionChange) {
        console.log("🔄 Applying pending region change to:", window.regionState.pendingRegionChange.name);
        changeRegion(window.regionState.pendingRegionChange);
        window.regionState.pendingRegionChange = null;
      }
    });
  };
  
  // Safely change region with proper sequencing
  const changeRegion = (region) => {
    if (!region) return;
    
    // Store the current operation
    window.regionState.isChangingRegion = true;
    window.regionState.currentRegion = region;
    
    console.log(`🔄 Starting region change to ${region.name}`);
    
    // If map is not ready, store for later
    if (!window.regionState.mapReady) {
      console.log(`⏳ Map not ready, storing region change for later: ${region.name}`);
      window.regionState.pendingRegionChange = region;
      return;
    }
    
    // Ensure references are available
    const refs = window.fastPlannerRefs;
    const mapManager = refs.mapManager;
    const platformManager = refs.platformManager;
    
    if (!mapManager || !mapManager.getMap) {
      console.error("❌ MapManager not available for region change");
      window.regionState.isChangingRegion = false;
      return;
    }
    
    const map = mapManager.getMap();
    if (!map) {
      console.error("❌ Map instance not available for region change");
      window.regionState.isChangingRegion = false;
      return;
    }
    
    // 1. First, clear existing platforms before map movement
    if (platformManager) {
      try {
        console.log("🧹 Clearing platforms before region change");
        // Set flag to prevent errors during region change
        platformManager.skipNextClear = true;
        
        // Hide all platform layers (don't remove yet)
        const layerIds = [
          'platforms-fixed-layer',
          'platforms-movable-layer',
          'airfields-layer',
          'platforms-fixed-labels',
          'platforms-movable-labels',
          'airfields-labels',
          'platforms-layer'
        ];
        
        layerIds.forEach(id => {
          try {
            if (map.getLayer(id)) {
              map.setLayoutProperty(id, 'visibility', 'none');
            }
          } catch (e) {
            // Ignore errors for individual layers
          }
        });
      } catch (e) {
        console.warn("⚠️ Error hiding platform layers:", e);
      }
    }
    
    // 2. Move map to new region
    try {
      console.log(`🗺️ Moving map to ${region.name} region bounds`);
      map.fitBounds(region.bounds, {
        padding: 50,
        maxZoom: region.zoom || 6,
        duration: 1000
      });
      
      // 3. After map movement, dispatch region changed event
      setTimeout(() => {
        console.log(`📣 Dispatching region-changed event for ${region.name}`);
        const event = new CustomEvent('region-changed', {
          detail: { region: region }
        });
        window.dispatchEvent(event);
        
        // Reset the changing flag
        window.regionState.isChangingRegion = false;
      }, 1200); // Slightly longer than the animation
    } catch (e) {
      console.error("❌ Error moving map to region:", e);
      window.regionState.isChangingRegion = false;
    }
  };
  
  // Apply all fixes
  safelyPatchMapMethods();
  setupMapReadyMonitor();
  
  // Export the safe region change function to window
  window.safeChangeRegion = changeRegion;
  
  console.log("✅ Region management fix applied successfully");
};

// Apply fix if running in browser
if (typeof window !== 'undefined') {
  // Delay to ensure document is loaded
  setTimeout(() => {
    fixRegionManagement(window);
  }, 500);
}

// Export for use in script tags or imports
export default fixRegionManagement;
