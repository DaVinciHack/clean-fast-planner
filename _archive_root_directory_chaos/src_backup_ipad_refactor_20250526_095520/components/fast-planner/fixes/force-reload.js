/**
 * Force a reload of the browser when the fuel fix is applied
 */
console.log('🔄 Forcing reload to apply fuel calculator fix...');

// Set up event listener for a custom event to force recalculation
window.addEventListener('force-route-recalculation', function(event) {
  console.log('🔄 Received force-route-recalculation event:', event.detail);
  
  // Add a visual indicator
  const notification = document.createElement('div');
  notification.style = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 20px;
    border-radius: 5px;
    z-index: 9999;
    text-align: center;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  `;
  notification.innerHTML = `
    <h3>Waypoint/Stop Fix Applied</h3>
    <p>The fix for proper waypoint vs. stop handling has been applied.</p>
    <p>Recalculating route...</p>
  `;
  document.body.appendChild(notification);
  
  // Wait a bit and then force a recalculation
  setTimeout(function() {
    // If we have waypoints and a selected aircraft, trigger a recalculation
    if (window.waypointManager && window.waypointManager.getWaypoints && 
        window.waypointManager.getWaypoints().length >= 2 && 
        window.currentSelectedAircraft) {
      // Dispatch event to trigger the centralized fuel calculation
      const waypointsEvent = new Event('settings-changed');
      window.dispatchEvent(waypointsEvent);
      
      // Update status
      notification.innerHTML = `
        <h3>Waypoint/Stop Fix Applied</h3>
        <p>Route recalculated with proper waypoint handling!</p>
        <p>Only landing stops will be counted in fuel calculations now.</p>
      `;
      
      // Remove notification after a few seconds
      setTimeout(function() {
        document.body.removeChild(notification);
      }, 3000);
    } else {
      // If we don't have waypoints, just show a message
      notification.innerHTML = `
        <h3>Waypoint/Stop Fix Applied</h3>
        <p>The fix for proper waypoint vs. stop handling has been applied.</p>
        <p>Add waypoints and select an aircraft to see the effect.</p>
      `;
      
      // Remove notification after a few seconds
      setTimeout(function() {
        document.body.removeChild(notification);
      }, 3000);
    }
  }, 2000);
});

// Dispatch the force recalculation event
setTimeout(function() {
  const event = new CustomEvent('force-route-recalculation', {
    detail: {
      source: 'apply-fuel-calc-fix.sh',
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
}, 3000);
