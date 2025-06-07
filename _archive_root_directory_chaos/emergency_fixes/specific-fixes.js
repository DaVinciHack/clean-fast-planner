/**
 * Specific Fixes for Fast Planner
 * 
 * After analyzing the code, I've identified the exact issues that need to be fixed in both versions.
 */

/**
 * Fix #1: ModularFastPlannerComponent.jsx
 * 
 * The issue is that we have a circular dependency:
 * - regionManagerRef.current is initialized with platformManagerRef.current
 * - But when setting the default region, it tries to use platformManagerRef.current before it's properly initialized
 * 
 * Fix:
 * 1. Update the code around line 1691 to add a null check
 * 2. Ensure proper initialization order
 */

// Fix for the error at line 1691
// Add this check to prevent the null reference error:
if (platformManagerRef.current) {
  platformManagerRef.current.loadPlatformsFromFoundry(client, defaultRegion.osdkRegion)
    .then(platforms => {
      console.log(`Loaded ${platforms.length} platforms for ${defaultRegion.name}`);
      rigsAutoloadedRef.current = true;
      setPlatformsLoaded(true);
      setPlatformsVisible(true);
    })
    .catch(error => {
      console.error(`Error loading platforms: ${error}`);
    });
} else {
  console.error("Platform manager not initialized - try refreshing the page");
}

/**
 * Fix #2: FastPlannerApp.jsx
 * 
 * The issue is that the PlatformManager is being created with an uninitialized MapManager.
 * The map is never properly initialized which leads to the same errors in the refactored version.
 * 
 * Fix:
 * 1. Move the MapProvider initialization to ensure map is ready before creating contexts
 * 2. Wait for the map to be fully loaded before proceeding with other contexts
 */

// Add a proper initialization step to the MapConsumer component:
const MapConsumer = ({ mapManager, platformManager }) => {
  const { mapReady, platformManager: contextPlatformManager } = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Initialize the map first
  useEffect(() => {
    if (mapManager && !mapInitialized) {
      console.log('MapConsumer: Initializing map...');
      mapManager.loadScripts()
        .then(() => {
          return mapManager.initializeMap('fast-planner-map');
        })
        .then(() => {
          console.log('MapConsumer: Map initialized successfully');
          setMapInitialized(true);
        })
        .catch(err => {
          console.error('MapConsumer: Error initializing map:', err);
        });
    }
  }, [mapManager, mapInitialized]);
  
  // Only render the RegionProvider when map is ready
  if (!mapReady && !mapInitialized) {
    return <div>Initializing map...</div>;
  }
  
  // Use the effective platformManager
  const effectivePlatformManager = contextPlatformManager || platformManager;
  
  return (
    <RegionProvider 
      client={client} 
      mapManager={mapManager} 
      platformManager={effectivePlatformManager}>
      <RegionConsumer />
    </RegionProvider>
  );
};

/**
 * FIX #3: Debugging Assistance
 * 
 * Add a simple utility to help diagnose state of managers
 */

// Add this to both components (in a convenient place, like near the emergency fix button):

<button 
  onClick={() => {
    // Check map initialization status
    const mapInitialized = mapManager && mapManager.isMapLoaded();
    console.log("Map initialized:", mapInitialized);
    
    // Check platform manager
    const platformManagerValid = platformManager && platformManager.mapManager;
    console.log("Platform manager valid:", platformManagerValid);
    
    // Log all manager states
    console.log({
      mapManager,
      platformManager,
      mapInitialized,
      platformManagerValid
    });
    
    // Display status
    alert(`Map initialized: ${mapInitialized}\nPlatform manager valid: ${platformManagerValid}`);
  }}
  style={{
    position: 'absolute',
    bottom: '90px',
    right: '10px',
    zIndex: 1000,
    padding: '5px 10px',
    backgroundColor: '#4287f5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Check Managers
</button>
