/**
 * Fix for Refactored Fast Planner (context=new)
 * 
 * Issue: Aircraft data is loading in logs but not displaying in the UI
 * Issue: Platforms/rigs are not loading properly
 */

// Fix 1: Add debugging in RightPanel component to log what's happening with aircraft data
// Add this to the AircraftConfiguration component in RightPanel.jsx:

useEffect(() => {
  console.log('AircraftConfiguration - Props received:', {
    aircraftType,
    aircraftRegistration,
    selectedAircraft,
    aircraftsByType: Object.keys(aircraftsByType).length > 0 ? 
      Object.keys(aircraftsByType).map(type => `${type}: ${aircraftsByType[type]?.length || 0}`) : 
      'Empty'
  });
  
  // Debug the aircraft type dropdown options
  const typeDropdown = document.getElementById('aircraft-type');
  if (typeDropdown) {
    console.log('Aircraft type dropdown options:', 
      Array.from(typeDropdown.options).map(opt => `${opt.value}: ${opt.text}`));
  }
}, [aircraftType, aircraftRegistration, selectedAircraft, aircraftsByType]);

// Fix 2: Ensure aircraftsByType data is passed properly to the dropdown
// Look for the following patterns in the RightPanel.jsx file:

// 1. Check if the options are being properly generated:
{Object.keys(aircraftsByType).map((type) => (
  <option key={type} value={type}>
    {type} ({aircraftsByType[type]?.length || 0})
  </option>
))}

// 2. Update aircraft type change handler to log changes:
const handleAircraftTypeChange = (e) => {
  const newType = e.target.value;
  console.log(`Aircraft type changing from ${aircraftType} to ${newType}`);
  onAircraftTypeChange(newType);
};

// Fix 3: Ensure MapContext is correctly handling platform loading
// Add a different map initialization approach in MapContext.jsx:

// Add this function inside the useEffect that loads platforms:
const attemptPlatformRefresh = () => {
  if (platformManagerInstance && client && currentRegion && mapReady) {
    console.log(`MapContext: Attempting platform refresh for region ${currentRegion.name || currentRegion.id}`);
    
    try {
      const regionName = currentRegion.osdkRegion || 
                        (currentRegion.id === 'gulf-of-mexico' ? "GULF OF MEXICO" : currentRegion.name);
      
      // Ensure platformManager has mapManager reference
      if (platformManagerInstance.mapManager !== mapManager) {
        console.log('MapContext: Fixing platformManager.mapManager reference');
        platformManagerInstance.mapManager = mapManagerInstance;
      }
      
      platformManagerInstance.loadPlatformsFromFoundry(client, regionName)
        .then(platforms => {
          console.log(`MapContext: Loaded ${platforms.length} platforms for region ${currentRegion.name}`);
          setPlatformsLoaded(true);
          setRigsLoading(false);
        })
        .catch(error => {
          console.error(`MapContext: Error loading platforms: ${error}`);
          setPlatformsLoaded(false);
          setRigsLoading(false);
          setRigsError(error.message);
        });
    } catch (error) {
      console.error('MapContext: Error in platform refresh:', error);
    }
  }
};

// Call this function after a short delay
setTimeout(attemptPlatformRefresh, 2000);

// Fix 4: Ensure proper aircraft dropdown population
// Add this to index.html or a new script file:

// Add event listener for aircraft dropdown population
window.addEventListener('load', function() {
  console.log('Setting up aircraft dropdown monitor...');
  
  // Monitor aircraft type dropdown for changes
  const checkAircraftDropdown = () => {
    const aircraftDropdown = document.getElementById('aircraft-type');
    if (aircraftDropdown) {
      const options = aircraftDropdown.querySelectorAll('option');
      console.log(`Aircraft dropdown has ${options.length} options`);
      
      // If no options, check if we have aircraft data available
      if (options.length <= 1) {
        // Trigger aircraft loading
        console.log('Triggering aircraft loading...');
        const event = new Event('refresh-aircraft');
        window.dispatchEvent(event);
      }
    }
  };
  
  // Check periodically
  setInterval(checkAircraftDropdown, 3000);
});

// Fix 5: Implement "Check Status" button in FastPlannerCore.jsx
// Add this button near the Debug button:

<button 
  onClick={() => {
    // Get state from contexts
    const aircraft = useAircraft();
    const region = useRegion();
    const map = useMap();
    
    // Log detailed status
    console.log('===== APP STATUS =====');
    console.log('Region:', region.currentRegion);
    console.log('Aircraft Type:', aircraft.aircraftType);
    console.log('Aircraft Registration:', aircraft.aircraftRegistration);
    console.log('Selected Aircraft:', aircraft.selectedAircraft);
    console.log('Aircraft By Type:', Object.keys(aircraft.aircraftsByType).map(
      type => `${type}: ${aircraft.aircraftsByType[type]?.length || 0}`
    ));
    console.log('Map Ready:', map.mapReady);
    console.log('Platforms Loaded:', map.platformsLoaded);
    console.log('Platforms Visible:', map.platformsVisible);
    
    // Display status in alert
    alert(
      `Status:\n` +
      `Region: ${region.currentRegion?.name || 'None'}\n` +
      `Aircraft Type: ${aircraft.aircraftType || 'None'}\n` +
      `Aircraft Count: ${Object.values(aircraft.aircraftsByType).flat().length}\n` +
      `Map Ready: ${map.mapReady ? 'Yes' : 'No'}\n` +
      `Platforms Loaded: ${map.platformsLoaded ? 'Yes' : 'No'}`
    );
  }}
  style={{
    position: 'absolute',
    bottom: '130px',
    right: '10px',
    zIndex: 1000,
    padding: '5px 10px',
    backgroundColor: '#00bfa5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Check Status
</button>
