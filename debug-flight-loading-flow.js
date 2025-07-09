// Debug script to trace flight loading flow step by step
// Run this in console and then try to load a flight

console.log('🔬 FLIGHT LOADING FLOW TRACER - Setting up monitoring...');

// Monitor flight loading function calls
const originalConsoleLog = console.log;
let flightLoadingLogs = [];

console.log = function(...args) {
  const message = args.join(' ');
  
  // Capture flight loading related logs
  if (message.includes('handleFlightLoad') || 
      message.includes('FLIGHT LOAD') || 
      message.includes('Priority 1') || 
      message.includes('Priority 2') || 
      message.includes('Priority 3') || 
      message.includes('waypointsToProcess') || 
      message.includes('displayWaypoints') ||
      message.includes('onChange callback')) {
    
    flightLoadingLogs.push({
      timestamp: Date.now(),
      message: message,
      stack: new Error().stack
    });
  }
  
  originalConsoleLog.apply(console, args);
};

// Monitor waypoint manager callbacks
if (window.waypointManager && window.waypointManager.setCallback) {
  const originalSetCallback = window.waypointManager.setCallback;
  window.waypointManager.setCallback = function(type, callback) {
    console.log(`📡 MONITOR: WaypointManager.setCallback('${type}', ${!!callback})`);
    return originalSetCallback.call(this, type, callback);
  };
  
  const originalTriggerCallback = window.waypointManager.triggerCallback;
  window.waypointManager.triggerCallback = function(type, data) {
    console.log(`📡 MONITOR: WaypointManager.triggerCallback('${type}', ${data?.length || 'unknown'} items)`);
    return originalTriggerCallback.call(this, type, data);
  };
}

// Monitor React state setters
if (window.setWaypoints) {
  const originalSetWaypoints = window.setWaypoints;
  window.setWaypoints = function(waypoints) {
    console.log(`📡 MONITOR: setWaypoints called with ${waypoints?.length || 0} waypoints`);
    console.log('📡 MONITOR: setWaypoints data:', waypoints);
    return originalSetWaypoints.call(this, waypoints);
  };
}

// Function to show collected logs
window.showFlightLoadingLogs = function() {
  console.log('\n📊 FLIGHT LOADING LOGS COLLECTED:');
  console.log('='.repeat(50));
  
  flightLoadingLogs.forEach((log, i) => {
    console.log(`${i + 1}. [${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
  });
  
  if (flightLoadingLogs.length === 0) {
    console.log('❌ No flight loading logs captured');
  }
  
  console.log('\n🔬 Now load a flight and check what logs appear above...');
};

// Function to reset logs
window.resetFlightLoadingLogs = function() {
  flightLoadingLogs = [];
  console.log('🔄 Flight loading logs reset');
};

console.log('✅ Flight loading monitoring setup complete');
console.log('📝 Commands available:');
console.log('   - window.showFlightLoadingLogs() - Show captured logs');
console.log('   - window.resetFlightLoadingLogs() - Reset log collection');
console.log('\n🚀 Now try loading a flight and watch for monitoring messages...');