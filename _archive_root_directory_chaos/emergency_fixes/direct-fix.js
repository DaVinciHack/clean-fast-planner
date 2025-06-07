/**
 * Direct Fix for Fast Planner Refactored Version
 * 
 * The key issue is that the map is not being properly initialized in the refactored version.
 * The working original version uses MapComponent.jsx to initialize the map with 'fast-planner-map' ID,
 * but the refactored version isn't consistently doing this.
 */

// 1. First, update FastPlannerApp.jsx to remove the map initialization from MapConsumer
// This should be done in the MapComponent instead, as in the original version

// MODIFY MapConsumer in FastPlannerApp.jsx
const MapConsumer = ({ mapManager, platformManager }) => {
  const { mapReady, platformManager: contextPlatformManager } = useMap();
  
  // Remove the map initialization code from here - it should be in MapComponent
  // Just debug and ensure references are correct
  useEffect(() => {
    console.log('MapConsumer: Map ready =', mapReady);
    console.log('MapConsumer: Platform manager =', contextPlatformManager || platformManager);
    
    // Ensure platformManager has mapManager reference
    if (platformManager && mapManager) {
      platformManager.mapManager = mapManager;
    }
  }, [mapReady, contextPlatformManager, platformManager, mapManager]);
  
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

// 2. Make sure the MapProvider is correctly passing mapManager to MapComponent
// Ensure FastPlannerCore.jsx uses the MapComponent properly:

// MODIFY the MapComponent usage in FastPlannerCore.jsx to match original:
{mapManager ? (
  <MapComponent
    mapManagerRef={{ current: mapManager }}
    onMapReady={(mapInstance) => {
      console.log("Map is ready in FastPlannerCore");
      
      // When map is ready, trigger region and platform loading
      if (platformManager && currentRegion) {
        console.log("Manually triggering platform load for region:", currentRegion.id);
        setTimeout(() => {
          platformManager.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
            .then(platforms => {
              console.log(`Loaded ${platforms.length} platforms for ${currentRegion.name}`);
              // Force refresh
              setForceUpdate(prev => prev + 1);
            })
            .catch(err => console.error("Error loading platforms:", err));
        }, 500);
      }
      
      handleMapReady(mapInstance);
    }}
  />
) : (
  <div className="loading-message">Loading map manager...</div>
)}

// 3. Ensure AircraftContext uses the proper method to load aircraft:

// MODIFY AircraftContext.jsx useEffect to immediately filter aircraft when region changes:
useEffect(() => {
  if (aircraftManagerInstance && currentRegion) {
    setAircraftLoading(true);
    console.log(`AircraftContext: Filtering aircraft for region ${currentRegion.id}`);
    
    // First ensure all aircraft are loaded
    if (!aircraftManagerInstance.allAircraftLoaded || aircraftManagerInstance.aircraftList.length === 0) {
      console.log("Aircraft not loaded yet, loading from OSDK first");
      
      // Load all aircraft first, then filter
      aircraftManagerInstance.loadAircraftFromOSDK(client)
        .then(() => {
          console.log("Aircraft loaded, now filtering by region");
          filterAircraftByRegion();
        })
        .catch(error => {
          console.error("Error loading aircraft:", error);
          setAircraftLoading(false);
        });
    } else {
      // Aircraft already loaded, just filter
      filterAircraftByRegion();
    }
  }
  
  function filterAircraftByRegion() {
    try {
      // Get the aircraft by region
      const aircraftInRegion = aircraftManagerInstance.getAircraftByRegion(currentRegion.id);
      console.log(`AircraftContext: Found ${aircraftInRegion.length} aircraft in region ${currentRegion.id}`);
      
      // Get the aircraft by type for UI display
      const types = aircraftManagerInstance.getAvailableTypesInRegion(currentRegion.id);
      console.log(`AircraftContext: Available types in region: ${types.join(', ')}`);
      
      // Create aircraft by type mapping for the UI
      const byType = {};
      types.forEach(type => {
        const aircraftOfType = aircraftManagerInstance.filterAircraft(currentRegion.id, type);
        console.log(`AircraftContext: Type ${type} has ${aircraftOfType.length} aircraft`);
        byType[type] = aircraftOfType;
      });
      
      // Update the state
      setAircraftsByType(byType);
    } catch (error) {
      console.error('AircraftContext: Error filtering aircraft by region:', error);
    }
    
    // Reset aircraft selection when region changes
    setAircraftType('');
    setAircraftRegistration('');
    setSelectedAircraft(null);
    
    setAircraftLoading(false);
  }
}, [aircraftManagerInstance, currentRegion, client]);

// 4. Add a dedicated debug function to FastPlannerCore.jsx to validate state:

const validateAndFixState = () => {
  console.log("Validating application state...");
  
  // Check map initialization
  if (mapManager && !mapManager.getMap()) {
    console.error("Map not initialized yet");
    // The map should be initialized by MapComponent, not here
  }
  
  // Check platform manager
  if (platformManager) {
    if (!platformManager.mapManager) {
      console.error("Platform manager missing map manager reference");
      platformManager.mapManager = mapManager;
      console.log("Fixed: Set mapManager on platformManager");
    }
    
    // Check if platforms are loaded
    if (currentRegion && !platformsLoaded) {
      console.log("Platforms not loaded for region, forcing load");
      platformManager.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
        .then(platforms => {
          console.log(`Loaded ${platforms.length} platforms`);
        })
        .catch(err => console.error("Error loading platforms:", err));
    }
  }
  
  // Check aircraft data
  if (Object.keys(aircraftsByType).length === 0) {
    console.log("No aircraft loaded yet");
    // Cannot fix directly as we need the AircraftContext to handle this
  }
};

// Add this function to a button in FastPlannerCore.jsx
<button 
  onClick={validateAndFixState}
  style={{
    position: 'absolute',
    bottom: '130px',
    right: '10px',
    zIndex: 1000,
    padding: '5px 10px',
    backgroundColor: '#9c27b0',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  Validate & Fix
</button>
