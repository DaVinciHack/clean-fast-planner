/**
 * EMERGENCY DOM CLEANUP
 * Run this in browser console to clean contaminated DOM state
 */

console.log('🧹 EMERGENCY DOM CLEANUP - Starting comprehensive cleanup...');

// 1. Clear all global FastPlanner variables
const globalVarsToClean = [
  'mapManager', 'waypointManager', 'platformManager', 'aircraftManager',
  'interactionController', 'mapInteractionHandler', 'routeCalculator',
  'mapIsReady', 'REGION_CHANGE_IN_PROGRESS', 'regionState',
  'addWaypointClean', 'removeWaypointClean', 'setWaypointModeClean',
  'toggleWaypointMode', '_originalToggleWaypointMode', '_setWaypointsState',
  'registerWaypointsStateSetter', 'LoadingIndicator'
];

globalVarsToClean.forEach(varName => {
  if (window[varName]) {
    console.log(`🧹 Cleaning global variable: ${varName}`);
    delete window[varName];
  }
});

// 2. Clear all localStorage for this domain
console.log('🧹 Clearing localStorage...');
try {
  localStorage.clear();
} catch (e) {
  console.warn('Could not clear localStorage:', e);
}

// 3. Clear all sessionStorage
console.log('🧹 Clearing sessionStorage...');
try {
  sessionStorage.clear();
} catch (e) {
  console.warn('Could not clear sessionStorage:', e);
}

// 4. Remove all custom event listeners
console.log('🧹 Removing custom event listeners...');
const eventsToClean = [
  'map-ready', 'waypoint-added', 'waypoint-removed', 'route-updated',
  'region-changed', 'aircraft-selected', 'fuel-updated'
];

eventsToClean.forEach(eventName => {
  // Remove all listeners for this event
  const oldListeners = window._listeners && window._listeners[eventName];
  if (oldListeners) {
    console.log(`🧹 Removing ${oldListeners.length} listeners for ${eventName}`);
    delete window._listeners[eventName];
  }
});

// 5. Clear any Mapbox GL map instances
console.log('🧹 Destroying any existing Mapbox GL maps...');
if (window.mapboxgl && window.mapboxgl.Map) {
  // Find all map containers and clean them
  const mapContainers = document.querySelectorAll('[id*="map"], [class*="map"]');
  mapContainers.forEach(container => {
    if (container.innerHTML) {
      console.log(`🧹 Clearing map container: ${container.id || container.className}`);
      container.innerHTML = '';
    }
  });
}

// 6. Clear any cached map data
console.log('🧹 Clearing cached map data...');
if (window.caches) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      if (cacheName.includes('mapbox') || cacheName.includes('planner')) {
        console.log(`🧹 Clearing cache: ${cacheName}`);
        caches.delete(cacheName);
      }
    });
  });
}

// 7. Reset CSS that might be contaminated
console.log('🧹 Resetting potentially contaminated CSS...');
const stylesToReset = [
  'cursor', 'pointer-events', 'user-select', 'touch-action'
];

stylesToReset.forEach(style => {
  document.body.style[style] = '';
});

// 8. Clear any intervals/timeouts that might be running
console.log('🧹 Clearing intervals and timeouts...');
// Clear all timeouts up to ID 1000 (brute force but effective)
for (let i = 1; i < 1000; i++) {
  clearTimeout(i);
  clearInterval(i);
}

// 9. Force garbage collection if available
console.log('🧹 Forcing garbage collection...');
if (window.gc) {
  window.gc();
}

console.log('✅ EMERGENCY DOM CLEANUP COMPLETE!');
console.log('🔄 Please close ALL browser tabs and restart your browser for full cleanup.');
console.log('🧹 After restart, the drag functionality should work again.');