/**
 * Cleanup script for fuel calculation issues
 * 
 * This script adds event listeners to handle settings changes and updates
 */

// Wait for the page to load
window.addEventListener('load', () => {
  console.log('Cleanup script loaded');
  
  // Wait for components to initialize
  setTimeout(() => {
    setupFuelCalculationFixes();
  }, 1000);
});

/**
 * Set up fixes for fuel calculation issues
 */
function setupFuelCalculationFixes() {
  // Find key elements
  const settingsTab = document.querySelector('.tab-settings');
  const routeStatsCard = document.querySelector('.route-stats-card');
  
  if (!settingsTab || !routeStatsCard) {
    console.log('Could not find settings tab or route stats card');
    // Try again later
    setTimeout(setupFuelCalculationFixes, 1000);
    return;
  }
  
  // Create an update button if it doesn't exist
  let updateButton = document.getElementById('force-update-button');
  if (!updateButton) {
    updateButton = document.createElement('button');
    updateButton.id = 'force-update-button';
    updateButton.className = 'control-button';
    updateButton.style.backgroundColor = '#007BFF';
    updateButton.style.color = 'white';
    updateButton.style.padding = '8px 15px';
    updateButton.style.border = 'none';
    updateButton.style.borderRadius = '4px';
    updateButton.style.margin = '10px 0';
    updateButton.style.cursor = 'pointer';
    updateButton.innerText = 'Force Update Calculations';
    
    // Add the button to the settings tab
    const controlSections = settingsTab.querySelectorAll('.control-section');
    if (controlSections.length > 0) {
      controlSections[0].appendChild(updateButton);
    }
  }
  
  // Add click handler to update button
  updateButton.addEventListener('click', () => {
    forceUpdateCalculations();
  });
  
  // Also listen for changes to input fields
  const settingsInputs = settingsTab.querySelectorAll('input');
  settingsInputs.forEach(input => {
    input.addEventListener('change', () => {
      // Add a slight delay to allow the React state to update
      setTimeout(() => {
        forceUpdateCalculations();
      }, 100);
    });
  });
  
  console.log('Fuel calculation fixes set up successfully');
}

/**
 * Force update of calculations when settings change
 */
function forceUpdateCalculations() {
  console.log('Forcing calculation update');
  
  // Show a visual indicator
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.textContent = 'Updating calculations...';
    overlay.style.display = 'block';
    
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 1500);
  }
  
  // Try to trigger route recalculation by simulating a waypoint change
  // This relies on the existing code structure
  try {
    // This is a bit of a hack, but it should work given the application structure
    const waypointEvent = new CustomEvent('route-updated');
    window.dispatchEvent(waypointEvent);
    
    // Also try to trigger the flight calculations directly
    const calcEvent = new CustomEvent('recalculate-route');
    window.dispatchEvent(calcEvent);
  } catch (err) {
    console.error('Error forcing calculation update:', err);
  }
}
