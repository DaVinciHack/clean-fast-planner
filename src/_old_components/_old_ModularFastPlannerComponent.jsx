import React, { useRef, useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import our modular components
import { MapManager, WaypointManager, PlatformManager, RouteCalculator, RegionManager, FavoriteLocationsManager, AircraftManager } from './modules';
import { LeftPanel, RightPanel, MapComponent, RegionSelector, RouteStatsCard, FlightSettings } from './components';
import FlightCalculations from './modules/calculations/FlightCalculations';

/**
 * Modular Fast Planner Component
 * 
 * A refactored version of FastPlannerComponent that uses modular architecture
 * for better maintainability and easier future enhancements.
 */
const ModularFastPlannerComponent = () => {
    const { isAuthenticated, userDetails, userName, login } = useAuth();
  
  // Core modules refs
  const mapManagerRef = useRef(null);
  const waypointManagerRef = useRef(null);
  const platformManagerRef = useRef(null);
  const routeCalculatorRef = useRef(null);
  const regionManagerRef = useRef(null);
  const favoriteLocationsManagerRef = useRef(null);
  const aircraftManagerRef = useRef(null); 
  const flightCalculationsRef = useRef(null); // Add reference for FlightCalculations

  
  // UI state
  const [forceUpdate, setForceUpdate] = useState(0); // Used to force component rerender
  const [routeInput, setRouteInput] = useState('');
  const [airportData, setAirportData] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]); // Add state for favorite locations
  const [leftPanelVisible, setLeftPanelVisible] = useState(false); // Start with left panel closed
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [platformsVisible, setPlatformsVisible] = useState(true);
  const [platformsLoaded, setPlatformsLoaded] = useState(false);
  const [rigsLoading, setRigsLoading] = useState(false);
  const [rigsError, setRigsError] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  
  // Region state
  const [regions, setRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [regionLoading, setRegionLoading] = useState(false);
  
  // Aircraft and route state
  const [aircraftType, setAircraftType] = useState(''); // Start with empty selection
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  
  // Add a third field to store the selected aircraft independently of the dropdowns
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState(['S92', 'S76', 'S76D', 'AW139', 'AW189', 'H175', 'H160', 'EC135', 'EC225', 'AS350', 'A119']);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [payloadWeight, setPayloadWeight] = useState(2000);
  const [reserveFuel, setReserveFuel] = useState(600);
  const [routeStats, setRouteStats] = useState(null);
  
  // Flight calculation settings
  const [flightSettings, setFlightSettings] = useState({
    passengerWeight: 220, // lbs per passenger including baggage
    contingencyFuelPercent: 10, // 10% contingency fuel
    taxiFuel: 50, // lbs
    reserveFuel: 600, // lbs
    deckTimePerStop: 5, // minutes
    deckFuelFlow: 400, // lbs per hour during deck operations
  });
  
  // Maintain backwards compatibility with existing code
  const [deckTimePerStop, setDeckTimePerStop] = useState(5); 
  const [deckFuelPerStop, setDeckFuelPerStop] = useState(100);
  const [deckFuelFlow, setDeckFuelFlow] = useState(400); // lbs per hour during deck operations
  const [passengerWeight, setPassengerWeight] = useState(220);
  const [cargoWeight, setCargoWeight] = useState(0);
  const [taxiFuel, setTaxiFuel] = useState(50); // lbs of taxi fuel
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10); // % of trip fuel
  const [reserveMethod, setReserveMethod] = useState('fixed');
  
  // Initialize managers
  useEffect(() => {
    // Create managers if they don't exist
    if (!mapManagerRef.current) {
      mapManagerRef.current = new MapManager();
    }
    
    if (!routeCalculatorRef.current) {
      routeCalculatorRef.current = new RouteCalculator();
      
      // Set up route calculator callbacks
      routeCalculatorRef.current.setCallback('onCalculationComplete', (stats) => {
        setRouteStats(stats);
      });
    }
    
    // Initialize the flight calculations module
    if (!flightCalculationsRef.current) {
      flightCalculationsRef.current = new FlightCalculations();
      
      // Update with current settings
      flightCalculationsRef.current.updateConfig(flightSettings);
      
      // Set up callback to receive calculation results
      flightCalculationsRef.current.setCallback('onCalculationComplete', (stats) => {
        setRouteStats(stats);
        console.log("New flight calculations completed:", stats);
      });
    }
    
    // Initialize aircraft manager
    if (!aircraftManagerRef.current) {
      aircraftManagerRef.current = new AircraftManager();
      
      // Set up aircraft manager callbacks
      aircraftManagerRef.current.setCallback('onAircraftLoaded', (aircraftList) => {
        console.log(`%c===== AIRCRAFT LOADED FROM OSDK =====`, 'background: #00a; color: #fff; font-size: 16px; font-weight: bold;');
        console.log(`Loaded ${aircraftList.length} total aircraft`);
        setAircraftList(aircraftList);
        
        // CRITICAL FIX: If we have a current region, filter by REGION ONLY first 
        // (not by type) to see what types are available in the region
        if (currentRegion) {
          console.log(`%cFirst doing a region-only filter to determine available aircraft types in ${currentRegion.name}`, 
                      'color: #00a; font-weight: bold;');
          
          // This is the key fix - filter by region only (pass null as type)
          // This will trigger onAircraftFiltered with all aircraft in the region
          aircraftManagerRef.current.filterAircraft(currentRegion.id, null);
        } else {
          // No region selected yet - create empty buckets for all aircraft types
          console.log(`No region selected yet, organizing all aircraft by type`);
          
          const allTypes = ['S92', 'S76', 'S76D', 'AW139', 'AW189', 'H175', 'H160', 'EC135', 'EC225', 'AS350', 'A119'];
          const emptyByType = {};
          allTypes.forEach(type => {
            emptyByType[type] = [];
          });
          
          // Sort aircraft into type buckets
          aircraftList.forEach(aircraft => {
            let found = false;
            const type = aircraft.modelType || 'S92';
            
            // Try direct match first
            if (emptyByType.hasOwnProperty(type)) {
              emptyByType[type].push(aircraft);
              found = true;
            } 
            // Try type matching if direct match fails
            else if (aircraftManagerRef.current && typeof aircraftManagerRef.current.typesMatch === 'function') {
              for (const knownType of allTypes) {
                if (aircraftManagerRef.current.typesMatch(type, knownType)) {
                  emptyByType[knownType].push(aircraft);
                  found = true;
                  break;
                }
              }
            }
            
            // If no match found, create a new bucket for its actual type instead of defaulting to S92
            if (!found) {
              // Use the aircraft's actual type or create a new category
              const actualType = aircraft.modelType || 'UNKNOWN';
              console.log(`No type match for aircraft: ${aircraft.registration}, using actual type: ${actualType}`);
              
              // Create a new bucket if needed
              if (!emptyByType[actualType]) {
                emptyByType[actualType] = [];
              }
              
              // Add to the correct bucket
              emptyByType[actualType].push(aircraft);
            }
          });
          
          // Find which types actually have aircraft
          const availableTypes = [];
          Object.keys(emptyByType).forEach(type => {
            if (emptyByType[type].length > 0) {
              availableTypes.push(type);
              console.log(`- Type ${type}: ${emptyByType[type].length} aircraft`);
            }
          });
          
          console.log(`Available aircraft types: ${availableTypes.join(', ') || 'None'}`);
          
          // Only show types with aircraft in them
          if (availableTypes.length > 0) {
            setAircraftTypes(availableTypes);
            
            // If current type isn't available, switch to first available type
            if (aircraftType && !availableTypes.includes(aircraftType) && availableTypes.length > 0) {
              setAircraftType(availableTypes[0]);
            }
          }
          
          setAircraftsByType(emptyByType);
          setAircraftLoading(false);
        }
      });
      
      aircraftManagerRef.current.setCallback('onAircraftFiltered', (filteredAircraft) => {
        console.log(`%c===== AIRCRAFT FILTERING RESULTS =====`, 'background: #070; color: #fff; font-size: 16px; font-weight: bold;');
        console.log(`Filtered to ${filteredAircraft.length} total aircraft for current region`);
        
        // Store the current registration to preserve it during filtering
        const currentRegistration = aircraftRegistration;
        
        // Debug: print what's being filtered
        const region = currentRegion ? currentRegion.name : 'Unknown region';
        const filterType = aircraftType || 'All types';
        console.log(`Current filtering context - Region: ${region}, Type: ${filterType}`);
        
        // Create a new object with empty arrays for each type
        const byType = {
          'S92': [],
          'S76': [],
          'S76D': [],
          'AW139': [],
          'AW189': [],
          'H175': [],
          'H160': [],
          'EC135': [],
          'EC225': [],
          'AS350': [],
          'A119': []
        };
        
        // STEP 1: Categorize ALL aircraft from the filtered results
        // This must work regardless of whether we filtered by region only or region+type
        console.log(`Categorizing ${filteredAircraft.length} aircraft by type...`);
        
        filteredAircraft.forEach(aircraft => {
          // Get the aircraft's model type (or use a default)
          let type = aircraft.modelType || 'S92';
          
          // If we have a bucket for this exact type, use it
          if (byType.hasOwnProperty(type)) {
            byType[type].push(aircraft);
            return;
          }
          
          // If there's no exact match bucket, find the closest match
          if (aircraftManagerRef.current && typeof aircraftManagerRef.current.typesMatch === 'function') {
            for (const knownType of Object.keys(byType)) {
              if (aircraftManagerRef.current.typesMatch(type, knownType)) {
                byType[knownType].push(aircraft);
                return;
              }
            }
          }
          
          // If we still can't find a match, create a bucket for this type
          const actualType = aircraft.modelType || "UNKNOWN";
          console.log(`No bucket match for aircraft type: ${type}, using actual type: ${actualType}`);
          
          // Create the bucket if it doesn't exist
          if (!byType[actualType]) {
            byType[actualType] = [];
          }
          
          // Add to the correct bucket
          byType[actualType].push(aircraft);
        });
        
        // STEP 2: Figure out which aircraft types are available in this region
        // We need to log and count everything regardless of the current filter
        const availableTypes = [];
        let totalClassified = 0;
        
        console.log(`%cAvailable Aircraft Types in ${region}:`, 'color: #0a0; font-weight: bold;');
        Object.keys(byType).forEach(type => {
          const count = byType[type].length;
          totalClassified += count;
          
          if (count > 0) {
            console.log(`- Type ${type}: ${count} aircraft`);
            availableTypes.push(type);
          }
        });
        
        // Sanity check to ensure we classified all aircraft correctly
        if (totalClassified !== filteredAircraft.length) {
          console.warn(`Warning: Classified ${totalClassified} aircraft but had ${filteredAircraft.length} filtered aircraft`);
        }
        
        // STEP 3: Check if we're filtering by a specific type, and if so, make sure other types are still shown
        console.log(`%cCurrent filtering context:`, 'color: #00c; font-weight: bold;');
        console.log(`- Current aircraft type selection: ${aircraftType}`);
        console.log(`- Available types in region: ${availableTypes.join(', ') || 'None'}`);
        
        // Make sure the UI always shows all available aircraft types in the region
        if (availableTypes.length > 0) {
          console.log(`Setting available aircraft types to: ${availableTypes.join(', ')}`);
          
          // CRITICAL FIX: Update the dropdown with ALL available types in this region
          setAircraftTypes(availableTypes);
          
          // If current aircraft type is not available in this region, switch to first available
          if (!availableTypes.includes(aircraftType) && availableTypes.length > 0) {
            const newType = availableTypes[0];
            console.log(`Current type ${aircraftType} not available in region, switching to ${newType}`);
            setAircraftType(newType);
            saveToLocalStorage('lastAircraftType', newType);
          }
        } else {
          console.warn('No aircraft types available in this region');
          // Set to empty list if truly none are available
          setAircraftTypes([]);
        }
        
        // Update state with the correctly categorized aircraft
        console.log(`Updating aircraft type buckets in state...`);
        setAircraftsByType(byType);
        setAircraftLoading(false);
        
        // If we had a registration selected, and we're resetting the type but keeping the registration,
        // make sure we don't clear the registration field
        if (currentRegistration && aircraftType === '') {
          console.log(`Preserving registration selection: ${currentRegistration}`);
          // The registration will remain in state because we're not resetting it
        }
      });
      
      aircraftManagerRef.current.setCallback('onAircraftSelected', (aircraft) => {
        console.log(`Aircraft selected: ${aircraft.registration}`);
        
        // Recalculate route with the selected aircraft's data
        const wps = waypointManagerRef.current?.getWaypoints() || [];
        if (wps.length >= 2) {
          const coordinates = wps.map(wp => wp.coords);
          calculateRouteStats(coordinates);
        }
      });
      
      aircraftManagerRef.current.setCallback('onError', (error) => {
        console.error('Error loading aircraft:', error);
        setAircraftLoading(false);
      });
    }
    
    // Initialize favorite locations manager
    if (!favoriteLocationsManagerRef.current) {
      favoriteLocationsManagerRef.current = new FavoriteLocationsManager();
      
      // Set up callback to update state when favorites change
      favoriteLocationsManagerRef.current.setCallback('onChange', (allFavoriteLocations) => {
        // Update state with favorites for the current region
        if (currentRegion) {
          setFavoriteLocations(favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(currentRegion.id) || []);
        }
        setForceUpdate(prev => prev + 1); // Force rerender
      });
      
      // Initialize favorite locations state with data for the default region
      const defaultRegionId = 'gulf-of-mexico'; // Assuming this is the initial region
      setFavoriteLocations(favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(defaultRegionId));
    }
    
    // Create region manager once mapManager is initialized
    if (mapManagerRef.current && !regionManagerRef.current) {
      // If we have a platform manager already, pass it to the region manager
      regionManagerRef.current = new RegionManager(mapManagerRef.current, platformManagerRef.current);
      
      // Set up region manager callbacks
      regionManagerRef.current.setCallback('onRegionChanged', (region) => {
        console.log(`Region changed to: ${region.name}`);
        setCurrentRegion(region);
        setRegionLoading(true);
        
        // Automatically trigger platform loading when region changes
        // but only during initialization, not during manual region changes
        if (initialLoadRef.current && isAuthenticated && client && platformManagerRef.current) {
          console.log(`Automatic platform loading for region change to ${region.name}`);
          
          // Let the UI update first
          setTimeout(() => {
            platformManagerRef.current.loadPlatformsFromFoundry(client, region.osdkRegion)
              .then(() => {
                console.log(`Successfully loaded platforms for ${region.name}`);
              })
              .catch(error => {
                console.error(`Error auto-loading platforms for ${region.name}:`, error);
              });
          }, 1000);
        }
      });
      
      regionManagerRef.current.setCallback('onRegionLoaded', (data) => {
        console.log(`Region ${data.region.name} loaded with ${data.platforms.length} platforms`);
        setRegionLoading(false);
        setPlatformsLoaded(true);
      });
      
      regionManagerRef.current.setCallback('onError', (error) => {
        console.error('Region manager error:', error);
        setRegionLoading(false);
        setRigsError(error);
      });
      
      // Get available regions
      setRegions(regionManagerRef.current.getRegions());
      
      // Initialize with a default region
      regionManagerRef.current.initialize('gulf-of-mexico');
    }
  }, [currentRegion, aircraftType]);

  // Calculate route statistics is now defined at the top of the file

  // Define loadStaticRigData and setupMapEventHandlers *before* handleMapReady
  // Dummy function for static rig data - empty implementation
  const loadStaticRigData = useCallback(() => {
    // Do nothing - no static data
    console.log('Static data loading disabled');
    return [];
  }, []);
  
  // Setup route rubber-band dragging functionality
  const setupRouteDragging = useCallback(() => {
    console.log('Setting up route rubber-band dragging');
    
    if (!mapManagerRef.current || !waypointManagerRef.current || !platformManagerRef.current) {
      console.error('Cannot setup route dragging: Required managers are not initialized');
      return;
    }
    
    const handleRouteDrag = (insertIndex, coords) => {
      console.log(`Route dragged: inserting at index ${insertIndex}, coords:`, coords);
      
      // Check for nearest rig to snap to
      const nearestRig = platformManagerRef.current.findNearestPlatform(coords[1], coords[0]);
      
      if (nearestRig) {
        console.log(`Found nearby rig: ${nearestRig.name} at distance ${nearestRig.distance.toFixed(2)} nm`);
        waypointManagerRef.current.addWaypointAtIndex(
          [nearestRig.lng, nearestRig.lat], 
          nearestRig.name, 
          insertIndex
        );
      } else {
        console.log('No nearby rig found, creating standard waypoint');
        waypointManagerRef.current.addWaypointAtIndex(
          coords, 
          `Stop ${insertIndex + 1}`, 
          insertIndex
        );
      }
    };
    
    // Critical: Ensure the map is available
    const map = mapManagerRef.current.getMap();
    if (!map) {
      console.error('Cannot setup route dragging: Map not initialized');
      
      // Schedule a retry attempt after a short delay
      setTimeout(() => {
        console.log('Retrying route dragging setup...');
        if (mapManagerRef.current && mapManagerRef.current.getMap()) {
          mapManagerRef.current.setupRouteDragging(handleRouteDrag);
          console.log('✅ Route dragging successfully set up on retry');
        }
      }, 1500);
      return;
    }
    
    // Set up dragging in the map manager
    mapManagerRef.current.setupRouteDragging(handleRouteDrag);
    console.log('✅ Route dragging successfully set up');
    
  }, [mapManagerRef, waypointManagerRef, platformManagerRef]);
  
  // Set up map event handlers
  const setupMapEventHandlers = useCallback((map) => { // Wrap in useCallback
    if (!map) {
      console.error("Cannot setup map event handlers: Map is null");
      return;
    }
    
    console.log('📍 Setting up map click event handlers');
    
    // CRITICAL: Remove any existing click handler to prevent duplicates
    map.off('click');
    
    // Map click for adding waypoints
    map.on('click', (e) => {
      console.log('🗺️ MAP CLICK DETECTED:', e.lngLat);
      
      // Ensure left panel is shown when clicking on map
      if (!leftPanelVisible) {
        console.log('Opening left panel due to map click');
        setLeftPanelVisible(true);
      }
      
      // Exit early if waypoint manager isn't initialized
      if (!waypointManagerRef.current) {
        console.error('❌ Waypoint manager not initialized');
        return;
      }
      
      // Check if clicking on a platform marker
      try {
        // CRITICAL: Check ALL platform-related layers
        const platformFeatures = map.queryRenderedFeatures(e.point, { 
          layers: [
            'platforms-fixed-layer', 
            'platforms-movable-layer',
            'airfields-layer'
          ] 
        });
        
        if (platformFeatures && platformFeatures.length > 0) {
          console.log('✅ Clicked on platform:', platformFeatures[0].properties.name);
          const props = platformFeatures[0].properties;
          const coordinates = platformFeatures[0].geometry.coordinates.slice();
          
          // Add the platform as a waypoint
          waypointManagerRef.current.addWaypoint(coordinates, props.name);
          return;
        }
      } catch (err) {
        console.error('Error handling platform click:', err);
      }
      
      // Check if clicking on the route line
      try {
        const routeFeatures = map.queryRenderedFeatures(e.point, { layers: ['route'] });
        if (routeFeatures && routeFeatures.length > 0) {
          console.log('✅ Clicked on route line');
          // Find where to insert on the path
          const insertIndex = waypointManagerRef.current.findPathInsertIndex(e.lngLat);
          
          // Check for nearest rig when clicking on route line
          const nearestRig = platformManagerRef.current?.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);
          
          if (nearestRig) {
            console.log(`Found nearby rig: ${nearestRig.name}`);
            // Add the nearest rig at the insertion point
            waypointManagerRef.current.addWaypointAtIndex([nearestRig.lng, nearestRig.lat], nearestRig.name, insertIndex);
          } else {
            waypointManagerRef.current.addWaypointAtIndex([e.lngLat.lng, e.lngLat.lat], `Stop ${insertIndex + 1}`, insertIndex);
          }
          return;
        }
      } catch (err) {
        console.error('Error handling route click:', err);
      }
      
      // Regular map click - Check for nearest rig first
      try {
        console.log('⭐ Processing regular map click');
        const nearestRig = platformManagerRef.current?.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);
        
        if (nearestRig) {
          console.log(`Found nearby rig: ${nearestRig.name} at distance ${nearestRig.distance.toFixed(2)} nm`);
          waypointManagerRef.current.addWaypoint([nearestRig.lng, nearestRig.lat], nearestRig.name);
        } else {
          // Create a basic waypoint at clicked location
          console.log('Creating generic waypoint at clicked location');
          waypointManagerRef.current.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
        }
      } catch (err) {
        // Fallback to direct waypoint placement if anything fails
        console.error('Error in regular map click handling:', err);
        waypointManagerRef.current.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
      }
    });
    
    // Change cursor on hover over platforms
    map.on('mouseenter', 'platforms-fixed-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'platforms-fixed-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'platforms-movable-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'platforms-movable-layer', () => {
      map.getCanvas().style.cursor = '';
    });
    
    // CRITICAL: Add route hover effect for rubber-band functionality
    map.on('mouseenter', 'route', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'route', () => {
      map.getCanvas().style.cursor = '';
    });
    
    // Confirm handlers are set up with a diagnostic log
    console.log('✅ All map click and hover handlers are now active');
  }, [waypointManagerRef, platformManagerRef]); // Dependencies for useCallback

  // Handle map instance creation (called before map is fully loaded)
  // Use useCallback to stabilize the function reference
  const handleMapReady = useCallback((mapInstance) => {
    console.log('Map instance received by parent component.');

    if (!mapInstance) {
      console.error("Received null map instance in handleMapReady");
      return;
    }
      
    // Initialize managers that only need the mapManagerRef immediately
    // Create waypoint manager if it doesn't exist
    if (!waypointManagerRef.current) {
      waypointManagerRef.current = new WaypointManager(mapManagerRef.current);
      
      // Set up waypoint manager callbacks
      waypointManagerRef.current.setCallback('onChange', (waypoints) => {
        console.log('Waypoints changed, updating state', waypoints.length);
        setWaypoints([...waypoints]);
        setForceUpdate(prev => prev + 1);
      });
      
      waypointManagerRef.current.setCallback('onWaypointAdded', (waypoint) => {
        console.log('New waypoint added:', waypoint.name);
        // We don't need to update state here as the onChange callback will handle that
      });
      
      waypointManagerRef.current.setCallback('onRouteUpdated', (routeData) => {
        // Simply calculate route stats whenever the route changes
        // Don't call updateRoute again to avoid infinite loop
        calculateRouteStats(routeData.coordinates);
      });
    }
      
    // Create platform manager if it doesn't exist
    if (!platformManagerRef.current) {
      platformManagerRef.current = new PlatformManager(mapManagerRef.current);
      
      // Set up platform manager callbacks
      platformManagerRef.current.setCallback('onPlatformsLoaded', (platforms) => {
        console.log(`Platform manager loaded ${platforms.length} platforms`);
        setPlatformsLoaded(true);
        setPlatformsVisible(true);
        setForceUpdate(prev => prev + 1);
      });
      
      platformManagerRef.current.setCallback('onVisibilityChanged', (visible) => {
        setPlatformsVisible(visible);
      });
      
      platformManagerRef.current.setCallback('onError', (error) => {
        setRigsError(error);
        console.error('Platform loading error:', error);
      });
    }

    // CRITICAL FIX: Add global event listener for map handlers reinitialization
    // This will be triggered by the MapComponent or the Fix button if needed
    const handleReinitializeEvent = () => {
      // Check if handlers have already been initialized
      if (window.mapHandlersInitialized) {
        console.log("⚠️ Map handlers already initialized - SKIPPING to prevent duplicates");
        return;
      }
      
      console.log("🔄 CAUGHT EVENT: Initializing map handlers");
      
      // Get fresh map reference
      const currentMap = mapManagerRef.current?.getMap();
      if (!currentMap) {
        console.error("Cannot initialize handlers: Map instance not available");
        return;
      }
      
      // First remove any existing handlers to avoid duplicates
      currentMap.off('click');
      
      // Then set up the event handlers fresh
      console.log("Applying click handlers...");
      setupMapEventHandlers(currentMap);
      
      // Set up route dragging
      console.log("Setting up route dragging...");
      setupRouteDragging();
      
      console.log("✅ Map handlers successfully initialized from event");
      
      // Mark as initialized
      window.mapHandlersInitialized = true;
    };
    
    // Add the event listener
    window.addEventListener('reinitialize-map-handlers', handleReinitializeEvent);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('reinitialize-map-handlers', handleReinitializeEvent);
    };
  }, [mapManagerRef, waypointManagerRef, platformManagerRef, setupMapEventHandlers, setupRouteDragging]);

  // Use the MapManager's robust onMapLoaded to schedule load-dependent actions
  useEffect(() => {
    if (mapManagerRef.current) {
      mapManagerRef.current.onMapLoaded(() => {
        console.log("Executing actions via onMapLoaded callback in handleMapReady.");
        const currentMap = mapManagerRef.current.getMap(); // Get potentially updated map ref
        if (!currentMap) {
          console.error("Map instance unavailable when onMapLoaded callback executed.");
          return;
        }
        
        console.log("========== SETTING UP MAP CLICK HANDLERS ===========");
        
        // Make sure the platform manager is set in the region manager
        if (regionManagerRef.current && platformManagerRef.current) {
          regionManagerRef.current.platformManager = platformManagerRef.current;
        }
        
        // Don't load static rig data at all
        console.log("Static rig data loading disabled");
        
        // SIMPLIFIED FIX: Clean and thorough handler initialization
        // Multiple/duplicate initializations are causing duplicate handlers
        
        // First remove any existing handlers to avoid duplicates
        currentMap.off('click');
            
        // Reset initialization flag to ensure fresh setup
        window.mapHandlersInitialized = false;
            
        // Then set up the event handlers fresh
        console.log("🔄 INITIALIZING CLICK HANDLERS (once only)");
        setupMapEventHandlers(currentMap);
        
        // Initialize route rubberband dragging
        setupRouteDragging();
            
        // Diagnostic log
        console.log("✅ Map click handlers successfully initialized");
        
        // Set a global flag to indicate handlers have been set up
        window.mapHandlersInitialized = true;
      });
    }
  }, [mapManagerRef, regionManagerRef, platformManagerRef, setupMapEventHandlers, setupRouteDragging]);

  // Calculate route statistics 
  // Initialize FlightCalculations module

  
  // Initialize the flight calculations module
  useEffect(() => {
    if (!flightCalculationsRef.current) {
      flightCalculationsRef.current = new FlightCalculations();
      
      // Set callback to receive calculation results
      flightCalculationsRef.current.setCallback('onCalculationComplete', (result) => {
        console.log('Flight calculations completed:', result);
      });
    }
    
    // Update the configuration when relevant state changes
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent
      });
    }
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelPerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent]);


  // Ensure flight calculation settings are synchronized with the module
  useEffect(() => {
    if (flightCalculationsRef.current) {
      // Sync all state values to the calculator when they change
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight
      });
      
      console.log("Flight calculation settings synchronized with calculator module");
      
      // Recalculate route if we have waypoints
      const wps = waypointManagerRef.current?.getWaypoints() || [];
      if (wps.length >= 2) {
        const coordinates = wps.map(wp => wp.coords);
        calculateRouteStats(coordinates);
      }
    }
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent, payloadWeight]);
  
  // Calculate route statistics using our enhanced module
  const calculateRouteStats = (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
      setRouteStats(null);
      return null;
    }
    
    // Ensure flight calculator is initialized
    if (!flightCalculationsRef.current) {
      flightCalculationsRef.current = new FlightCalculations();
      
      // Update with current settings
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight
      });
    }
    
    // Get aircraft data
    let aircraftData = selectedAircraft;
    
    // If no aircraft is selected, get default data
    if (!aircraftData && aircraftType && routeCalculatorRef.current) {
      const defaultAircraft = routeCalculatorRef.current.getAircraftType(aircraftType.toLowerCase());
      aircraftData = defaultAircraft;
    }
    
    // Log what we're using for calculations
    console.log("Using aircraft for calculations:", aircraftData?.registration || "default aircraft", 
                "with max passengers:", aircraftData?.maxPassengers || "unknown");
    
    // Simply delegate ALL calculation to the FlightCalculations module
    const stats = flightCalculationsRef.current.calculateFlightStats(
      coordinates, 
      aircraftData || {}, // Pass the actual aircraft data
      { 
        payloadWeight: payloadWeight + cargoWeight
      }
    );
    
    // Update route stats state
    setRouteStats(stats);
    window.currentRouteStats = stats;
    
    return stats;
  };
  
  /**
   * Load all aircraft once, then filter by region
   * This new implementation does one big load and then filters without additional API calls
   */
  const loadAircraftData = async (region = null) => {
    // Return a promise so we can chain with .then() and .catch()
    return new Promise(async (resolve, reject) => {
      if (!aircraftManagerRef.current || !client) {
        console.error('Cannot load aircraft: AircraftManager or client not initialized');
        reject(new Error('AircraftManager or client not initialized'));
        return;
      }
      
      setAircraftLoading(true);
      
      // Set a global flag that data loading has been attempted
      window.aircraftLoadAttempted = true;
      
      // Create a simple debug overlay
      const showDebugMessage = (message, success = true) => {
        let debugOverlay = document.getElementById('aircraft-debug-overlay');
        if (!debugOverlay) {
          debugOverlay = document.createElement('div');
          debugOverlay.id = 'aircraft-debug-overlay';
          debugOverlay.style.position = 'fixed';
          debugOverlay.style.top = '50px';
          debugOverlay.style.left = '10px';
          debugOverlay.style.backgroundColor = success ? 'rgba(0,100,0,0.8)' : 'rgba(100,0,0,0.8)';
          debugOverlay.style.color = 'white';
          debugOverlay.style.padding = '15px';
          debugOverlay.style.borderRadius = '5px';
          debugOverlay.style.zIndex = '10000';
          debugOverlay.style.fontSize = '14px';
          debugOverlay.style.fontFamily = 'monospace';
          debugOverlay.style.maxWidth = '80%';
          debugOverlay.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
          document.body.appendChild(debugOverlay);
        }
        
        debugOverlay.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 10px;">${message}</div>
          <div style="font-size: 12px;">This message will disappear in 5 seconds</div>
        `;
        
        setTimeout(() => {
          if (debugOverlay && debugOverlay.parentNode) {
            debugOverlay.parentNode.removeChild(debugOverlay);
          }
        }, 5000);
      };
      
      try {
        // Use a specific timeout to prevent getting stuck
        const loadingTimeout = setTimeout(() => {
          console.log("Aircraft loading timeout reached");
          setAircraftLoading(false);
          showDebugMessage("Aircraft loading timed out. Please try again.", false);
          resolve([]);
        }, 15000);
        
        // Show initial loading message
        if (region) {
          const regionInfo = region ? `${region.name} (${region.id})` : 'All Regions';
          showDebugMessage(`Loading aircraft data for ${regionInfo}...`);
        } else {
          showDebugMessage(`Loading all aircraft data...`);
        }
        
        // STEP 1: Load ALL aircraft once (if not already loaded)
        await aircraftManagerRef.current.loadAircraftFromOSDK(client);
        
        // Set a global flag that aircraft data has been successfully loaded
        window.aircraftLoaded = true;
        
        // Log the loaded aircraft count
        console.log(`Loaded ${aircraftManagerRef.current.aircraftList.length} total aircraft into memory`);
        
        // Now update the full aircraft list in state
        setAircraftList(aircraftManagerRef.current.aircraftList);
        
        // STEP 2: Filter by region if specified
        let regionAircraft = [];
        let regionTypes = [];
        
        if (region) {
          // Get all aircraft for this region
          regionAircraft = aircraftManagerRef.current.getAircraftByRegion(region.id);
          
          // Get available types in this region
          regionTypes = aircraftManagerRef.current.getAvailableTypesInRegion(region.id);
          
          // Filter by the current region without a type to show all aircraft in that region
          const filteredByRegion = aircraftManagerRef.current.filterAircraft(region.id, null);
          
          // Show success message with counts
          showDebugMessage(`Found ${filteredByRegion.length} aircraft in ${region.name} with ${regionTypes.length} types`);
          
          // Update available types
          setAircraftTypes(regionTypes.length > 0 ? regionTypes : ['S92']);
          
          // If current type isn't available in this region, switch to first available
          if (regionTypes.length > 0 && !regionTypes.includes(aircraftType)) {
            console.log(`Current type ${aircraftType} not available in region ${region.name}, switching to ${regionTypes[0]}`);
            setAircraftType(regionTypes[0]);
            saveToLocalStorage('lastAircraftType', regionTypes[0]);
          }
          
          // Now apply the current type filter if applicable
          if (aircraftType) {
            console.log(`Filtering region's aircraft to show only ${aircraftType}`);
            aircraftManagerRef.current.filterAircraft(region.id, aircraftType);
          }
        } else {
          // No region specified, so show all aircraft types
          const allTypes = aircraftManagerRef.current.getAvailableTypes();
          setAircraftTypes(allTypes);
          
          showDebugMessage(`Loaded ${aircraftManagerRef.current.aircraftList.length} aircraft with ${allTypes.length} types`);
        }
        
        // Clear the timeout since we finished successfully
        clearTimeout(loadingTimeout);
        
        // Resolve with the filtered aircraft
        resolve(aircraftManagerRef.current.filteredAircraft);
      } catch (error) {
        console.error('Error loading aircraft data:', error);
        showDebugMessage(`Error loading aircraft: ${error.message}`, false);
        reject(error);
      } finally {
        setAircraftLoading(false);
      }
    });
  };
  
  // Load rig data from Foundry
  const loadRigData = async () => {
    // Return a promise so we can chain with .then() and .catch()
    return new Promise(async (resolve, reject) => {
      if (!platformManagerRef.current) {
        reject(new Error('Platform manager not initialized'));
        return;
      }
      
      // Set a global flag that data loading has been attempted
      window.platformLoadAttempted = true;
      
      // Don't show any loading overlays - just log to console
      console.log('Loading rig data...');
      
      // Set loading state
      setRigsLoading(true);
      setRigsError(null);
      
      try {
        const platforms = await platformManagerRef.current.loadPlatformsFromFoundry(client);
        
        // Set a global flag that platform data has been successfully loaded
        window.platformsLoaded = true;
        
        // Nothing to hide
        
        setRigsLoading(false);
        resolve(platforms);
      } catch (error) {
        console.error('Error loading platforms:', error);
        setRigsError(error.message);
        
        // Don't fall back to static data
        console.log("Error loading platforms, not falling back to static data");
        
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
        
        setRigsLoading(false);
        reject(error);
      }
    });
  };
  
  // Toggle platforms visibility
  const togglePlatformsVisibility = () => {
    if (platformManagerRef.current) {
      const isVisible = platformManagerRef.current.toggleVisibility();
      setPlatformsVisible(isVisible);
    }
  };
  
  // Helper function to group aircraft by type - simplified version
  const groupAircraftByType = (aircraftList) => {
    // Initialize type buckets with all aircraft
    const byType = {
      'S92': aircraftList,
      'AW139': aircraftList,
      'H175': aircraftList,
      'H160': aircraftList
    };
    
    // Log what we're doing
    console.log(`Setting all ${aircraftList.length} aircraft for each type`);
    
    // Update state with all aircraft for all types
    setAircraftsByType(byType);
  };

  /**
   * Handle aircraft type change - simplified version that preserves registration
   */
  const handleAircraftTypeChange = (type) => {
    console.log(`%c===== CHANGING AIRCRAFT TYPE TO: ${type || 'EMPTY'} =====`, 'background: #070; color: #fff; font-size: 14px;');
    
    // Preserve the current registration
    const currentReg = aircraftRegistration;
    
    // If same type selected, no change needed (except for empty which means "Change Type")
    if (type === aircraftType && type !== '') {
      console.log("Type already selected, no change needed");
      return;
    }
    
    // Show loading state for feedback
    setAircraftLoading(true);
    
    // Save current settings for the previous aircraft type
    if (aircraftType && aircraftType !== '') {
      const currentSettings = {
        deckTimePerStop,
        deckFuelPerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        reserveFuel,
        reserveMethod,
        passengerWeight,
        cargoWeight
      };
      saveAircraftSettings(aircraftType, currentSettings);
      console.log(`Saved settings for ${aircraftType} before switching to ${type}`);
    }
    
    // Update the type - always
    setAircraftType(type);
    
    // Clear registration only if type changed to another actual type
    if (type !== '' && type !== aircraftType) {
      setAircraftRegistration('');
    }
    
    // Save preference only for non-empty types
    if (type) {
      saveToLocalStorage('lastAircraftType', type);
      
      // Load settings for the new aircraft type if available
      const aircraftSettings = loadAircraftSettings(type);
      if (aircraftSettings) {
        console.log(`Loading settings for ${type}:`, aircraftSettings);
        
        // Update state with aircraft-specific settings
        if (aircraftSettings.deckTimePerStop !== undefined) setDeckTimePerStop(aircraftSettings.deckTimePerStop);
        if (aircraftSettings.deckFuelPerStop !== undefined) setDeckFuelPerStop(aircraftSettings.deckFuelPerStop);
        if (aircraftSettings.deckFuelFlow !== undefined) setDeckFuelFlow(aircraftSettings.deckFuelFlow);
        if (aircraftSettings.taxiFuel !== undefined) setTaxiFuel(aircraftSettings.taxiFuel);
        if (aircraftSettings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(aircraftSettings.contingencyFuelPercent);
        if (aircraftSettings.reserveFuel !== undefined) setReserveFuel(aircraftSettings.reserveFuel);
        if (aircraftSettings.reserveMethod !== undefined) setReserveMethod(aircraftSettings.reserveMethod);
        if (aircraftSettings.passengerWeight !== undefined) setPassengerWeight(aircraftSettings.passengerWeight);
        if (aircraftSettings.cargoWeight !== undefined) setCargoWeight(aircraftSettings.cargoWeight);
      }
    } else {
      // Clear saved preference
      try {
        localStorage.removeItem('fast-planner-lastAircraftType');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }
    
    // Apply the appropriate filtering
    if (aircraftManagerRef.current) {
      try {
        const regionId = currentRegion ? currentRegion.id : null;
        const regionName = currentRegion ? currentRegion.name : "All Regions";
        
        // If "Change Aircraft Type" was selected (empty type)
        if (!type) {
          console.log("Change Aircraft Type selected - showing all aircraft types");
          
          // Get all aircraft for the region
          aircraftManagerRef.current.filterAircraft(regionId, null);
          
          // Don't clear the registration selection
          if (currentReg) {
            console.log(`Preserving registration selection: ${currentReg}`);
          }
        }
        // Normal type selection
        else {
          console.log(`Filtering for ${type} aircraft in ${regionName}`);
          
          // Apply the filter
          const filteredAircraft = aircraftManagerRef.current.filterAircraft(regionId, type);
          console.log(`Found ${filteredAircraft.length} ${type} aircraft in ${regionName}`);
        }
        
        // Update route calculations
        const wps = waypointManagerRef.current?.getWaypoints() || [];
        if (wps.length >= 2) {
          const coordinates = wps.map(wp => wp.coords);
          const stats = calculateRouteStats(coordinates);
          
          // CRITICAL FIX: Force update the route with new leg info
          if (waypointManagerRef.current) {
            setTimeout(() => {
              waypointManagerRef.current.updateRoute(stats);
            }, 50);
          }
        }
      } catch (error) {
        console.error('Error filtering aircraft:', error);
      }
    }
    
    // Reset loading state
    setTimeout(() => {
      setAircraftLoading(false);
    }, 300);
  };
  
  // Add a ref to store the last selected aircraft registration
  const lastSelectedRegistrationRef = useRef('');

  // Handler for aircraft registration change - stores selection and resets dropdowns
  const handleAircraftRegistrationChange = (registration) => {
    console.log(`Selecting aircraft: ${registration}`);
    
    // Save settings for previous aircraft if it exists
    if (selectedAircraft) {
      const currentReg = selectedAircraft.registration;
      const currentSettings = {
        deckTimePerStop,
        deckFuelPerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        reserveFuel,
        reserveMethod,
        passengerWeight,
        cargoWeight
      };
      saveAircraftSettings(`aircraft_${currentReg}`, currentSettings);
      console.log(`Saved settings for aircraft ${currentReg} before switching`);
    }
    
    // IMPORTANT: First get the aircraft object
    let aircraftObject = null;
    if (aircraftManagerRef.current && registration) {
      aircraftObject = aircraftManagerRef.current.getAircraftByRegistration(registration);
      if (aircraftObject) {
        console.log(`Found aircraft object: ${JSON.stringify(aircraftObject)}`);
      }
    }
    
    // Store the aircraft object in our third field
    if (aircraftObject) {
      setSelectedAircraft(aircraftObject);
      console.log(`Saved complete aircraft object to selectedAircraft state`);
      
      // Also save to window for persistence across re-renders
      window.selectedAircraftObject = aircraftObject;
      
      // CRITICAL: Select the aircraft in the manager
      aircraftManagerRef.current.selectedAircraft = aircraftObject;
      aircraftManagerRef.current.selectAircraft(registration);
      
      // IMPORTANT: After selecting an aircraft, reset BOTH dropdowns
      // Reset type dropdown to empty (will show "-- Change Aircraft Type --")
      setAircraftType('');
      // Reset registration dropdown to empty
      setAircraftRegistration('');
      
      // Load settings for this specific aircraft if available
      const aircraftSettingsKey = `aircraft_${registration}`;
      const aircraftSettings = loadAircraftSettings(aircraftSettingsKey);
      
      if (aircraftSettings) {
        console.log(`Loading settings for aircraft ${registration}:`, aircraftSettings);
        
        // Update state with aircraft-specific settings
        if (aircraftSettings.deckTimePerStop !== undefined) setDeckTimePerStop(aircraftSettings.deckTimePerStop);
        if (aircraftSettings.deckFuelPerStop !== undefined) setDeckFuelPerStop(aircraftSettings.deckFuelPerStop);
        if (aircraftSettings.deckFuelFlow !== undefined) setDeckFuelFlow(aircraftSettings.deckFuelFlow);
        if (aircraftSettings.taxiFuel !== undefined) setTaxiFuel(aircraftSettings.taxiFuel);
        if (aircraftSettings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(aircraftSettings.contingencyFuelPercent);
        if (aircraftSettings.reserveFuel !== undefined) setReserveFuel(aircraftSettings.reserveFuel);
        if (aircraftSettings.reserveMethod !== undefined) setReserveMethod(aircraftSettings.reserveMethod);
        if (aircraftSettings.passengerWeight !== undefined) setPassengerWeight(aircraftSettings.passengerWeight);
        if (aircraftSettings.cargoWeight !== undefined) setCargoWeight(aircraftSettings.cargoWeight);
      } else {
        // If no specific aircraft settings, try to load type settings
        const typeSettings = loadAircraftSettings(aircraftObject.modelType);
        if (typeSettings) {
          console.log(`No settings for ${registration}, using type settings for ${aircraftObject.modelType}`);
          
          // Update state with type-specific settings
          if (typeSettings.deckTimePerStop !== undefined) setDeckTimePerStop(typeSettings.deckTimePerStop);
          if (typeSettings.deckFuelPerStop !== undefined) setDeckFuelPerStop(typeSettings.deckFuelPerStop);
          if (typeSettings.deckFuelFlow !== undefined) setDeckFuelFlow(typeSettings.deckFuelFlow);
          if (typeSettings.taxiFuel !== undefined) setTaxiFuel(typeSettings.taxiFuel);
          if (typeSettings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(typeSettings.contingencyFuelPercent);
          if (typeSettings.reserveFuel !== undefined) setReserveFuel(typeSettings.reserveFuel);
          if (typeSettings.reserveMethod !== undefined) setReserveMethod(typeSettings.reserveMethod);
          if (typeSettings.passengerWeight !== undefined) setPassengerWeight(typeSettings.passengerWeight);
          if (typeSettings.cargoWeight !== undefined) setCargoWeight(typeSettings.cargoWeight);
        }
      }
      
      // Recalculate route stats
      const wps = waypointManagerRef.current?.getWaypoints() || [];
      if (wps.length >= 2) {
        const coordinates = wps.map(wp => wp.coords);
        const stats = calculateRouteStats(coordinates);
        
        // CRITICAL FIX: Force update the route with new leg info
        if (waypointManagerRef.current) {
          setTimeout(() => {
            waypointManagerRef.current.updateRoute(stats);
          }, 50);
        }
      }
      
      // Force update immediately for visible feedback
      setForceUpdate(prev => prev + 1);
      
      // Directly update DOM for immediate visual feedback
      setTimeout(() => {
        // Force DOM reset for the type dropdown using both React state and direct DOM manipulation
        const typeDropdown = document.getElementById('aircraft-type');
        if (typeDropdown) {
          // Set the DOM value directly first
          typeDropdown.value = 'select';
          
          // Then dispatch a synthetic change event to ensure React's handlers run
          const event = new Event('change', { bubbles: true });
          typeDropdown.dispatchEvent(event);
          
          console.log('Forced aircraft type dropdown reset to "-- Change Aircraft Type --"');
        }
        
        // Reset registration dropdown to "-- Select Aircraft --"
        const regDropdown = document.getElementById('aircraft-registration');
        if (regDropdown) {
          regDropdown.value = '';
          console.log('Reset registration dropdown to empty');
        }
        
        // Extra check - force React state update again
        setAircraftType('');
      }, 50);
    }
  };
  
  // Handle payload weight change
  /**
   * Unified function to handle flight settings changes
   * Updates both individual state variables and the flight calculations module
   */
  const handleFlightSettingChange = (settingName, value) => {
    console.log(`Updating flight setting: ${settingName} = ${value}`);
    
    // Update the flightSettings object
    setFlightSettings(prevSettings => ({
      ...prevSettings,
      [settingName]: value
    }));
    
    // Update the flight calculations module if it exists
    if (flightCalculationsRef.current) {
      flightCalculationsRef.current.updateConfig({
        [settingName]: value
      });
    }
  };

  const handlePayloadWeightChange = (weight) => {
    setPayloadWeight(weight);
    handleFlightSettingChange('payloadWeight', weight);
    
    // Recalculate route stats with the new payload weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRouteInfoFromStats(stats);
        }, 50);
      }
    }
  };
  
  // Handle reserve fuel change
  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
    handleFlightSettingChange('reserveFuel', fuel);
    
    // Recalculate route stats with the new reserve fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // CRITICAL FIX: Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRouteInfoFromStats(stats);
        }, 50);
      }
    }
  };

  // Handle deck fuel flow change
  const handleDeckFuelFlowChange = (fuelFlow) => {
    setDeckFuelFlow(fuelFlow);
    
    // Recalculate route stats with the new deck fuel flow
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRoute(stats);
        }, 50);
      }
    }
  };

  // Handle taxi fuel change
  const handleTaxiFuelChange = (fuel) => {
    setTaxiFuel(fuel);
    
    // Recalculate route stats with the new taxi fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRoute(stats);
        }, 50);
      }
    }
  };

  // Handle contingency fuel percentage change
  const handleContingencyFuelPercentChange = (percent) => {
    setContingencyFuelPercent(percent);
    
    // Recalculate route stats with the new contingency fuel percentage
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRoute(stats);
        }, 50);
      }
    }
  };
  
  // Handle waypoint name change
  const handleWaypointNameChange = (id, name, updatedWaypoints) => {
    if (waypointManagerRef.current) {
      if (updatedWaypoints) {
        // This is a reordering operation
        waypointManagerRef.current.waypoints = updatedWaypoints;
        waypointManagerRef.current.updateRoute();
      } else {
        // This is just a name change
        waypointManagerRef.current.updateWaypointName(id, name);
      }
    }
  };
  
  // Add a waypoint from the UI (not from map click)
  const handleAddWaypoint = (name, coords) => {
    if (!waypointManagerRef.current) return;
    
    // Ensure left panel is visible when adding waypoints
    if (!leftPanelVisible) {
      console.log('Opening left panel due to adding waypoint');
      setLeftPanelVisible(true);
    }
    
    // If name is provided but no coords, first try to find a platform with that name
    if (!coords && name && platformManagerRef.current) {
      // Use the searchPlatformsByName function to find matches
      const matches = platformManagerRef.current.searchPlatformsByName(name, 1);
      
      if (matches.length > 0) {
        const matchingPlatform = matches[0];
        console.log(`Found platform matching "${name}": ${matchingPlatform.name}`);
        
        // Show a message to the user
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
          loadingOverlay.textContent = `Found rig: ${matchingPlatform.name}`;
          loadingOverlay.style.display = 'block';
          
          // Hide message after 1.5 seconds
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
          }, 1500);
        }
        
        waypointManagerRef.current.addWaypoint(
          matchingPlatform.coordinates, 
          matchingPlatform.name
        );
        setRouteInput('');
        return;
      }
    }
    
    if (coords) {
      // If coordinates are provided, use them
      waypointManagerRef.current.addWaypoint(coords, name);
    } else {
      // Otherwise, add at center of current view
      const map = mapManagerRef.current.getMap();
      if (map) {
        const center = map.getCenter();
        waypointManagerRef.current.addWaypoint([center.lng, center.lat], name);
      }
    }
    
    // Clear the input after adding
    setRouteInput('');
  };
  
  // Function to fetch airport data
  const fetchAirportData = async () => {
    // Mock airport data for now - with Gulf of Mexico coordinates
    const mockAirports = [
      { icao: 'KHOU', name: 'Houston Hobby', coordinates: [-95.2789, 29.6451] },
      { icao: 'KMSY', name: 'New Orleans Intl', coordinates: [-90.2594, 29.9934] },
      { icao: 'KIAH', name: 'Houston Bush', coordinates: [-95.3414, 29.9844] },
      { icao: 'KMOB', name: 'Mobile Regional', coordinates: [-88.2428, 30.6910] },
      { icao: 'KGLS', name: 'Galveston', coordinates: [-94.8604, 29.2653] },
      { icao: 'KEFD', name: 'Ellington Field', coordinates: [-95.1587, 29.6073] },
      { icao: 'KBPT', name: 'Beaumont', coordinates: [-94.0207, 29.9508] },
      { icao: 'KLCH', name: 'Lake Charles', coordinates: [-93.2232, 30.1261] }
    ];
    
    setAirportData(mockAirports);
  };
  
  // Initialize FavoriteLocationsManager if not already done
  const initializeFavoritesManager = () => {
    if (!favoriteLocationsManagerRef.current) {
      console.log("Creating new FavoriteLocationsManager");
      favoriteLocationsManagerRef.current = new FavoriteLocationsManager();
      
      // Set up callback to update state when favorites change
      favoriteLocationsManagerRef.current.setCallback('onChange', (allFavoriteLocations) => {
        console.log("Favorites changed, updating state");
        // Use default region if currentRegion is null
        const regionId = currentRegion ? currentRegion.id : 'gulf-of-mexico';
        setFavoriteLocations(favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId));
        setForceUpdate(prev => prev + 1); // Force rerender
      });
      
      // Always initialize with default region
      const defaultRegionId = 'gulf-of-mexico';
      console.log(`Getting favorites for region: ${defaultRegionId}`);
      const regionFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(defaultRegionId);
      console.log(`Found ${regionFavorites.length} favorites for default region`);
      setFavoriteLocations(regionFavorites);
    }
  };
  
  // Helper functions for localStorage
  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(`fast-planner-${key}`, JSON.stringify(value));
      console.log(`Saved to localStorage: ${key}`);
    } catch (error) {
      console.error(`Error saving to localStorage: ${error}`);
    }
  };
  
  const getFromLocalStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(`fast-planner-${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading from localStorage: ${error}`);
      return defaultValue;
    }
  };
  
  // Create refs outside of effects for tracking state
  const dataLoadedRef = useRef(false);
  const initialLoadRef = useRef(false);
  const rigsAutoloadedRef = useRef(false); // Track if rigs have been auto-loaded
  
  // Ensure aircraft type starts empty on initial load
  // and restore selected aircraft if available
  useEffect(() => {
    console.log('Initial component setup - setting default aircraft state');
    
    // Clear aircraft type on initial component mount
    setAircraftType('');
    console.log('Set default aircraft type to empty');
    
    // Remove saved aircraft type from localStorage
    try {
      localStorage.removeItem('fast-planner-lastAircraftType');
      console.log('Cleared saved aircraft type preference');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // CRITICAL FIX: Restore selected aircraft registration if available
    try {
      const savedRegistration = localStorage.getItem('fast-planner-selectedAircraftRegistration');
      if (savedRegistration) {
        console.log(`Found saved aircraft registration: "${savedRegistration}"`);
        setAircraftRegistration(savedRegistration);
        
        // Wait for component to render, then update the dropdown directly
        setTimeout(() => {
          const registrationDropdown = document.getElementById('aircraft-registration');
          if (registrationDropdown) {
            registrationDropdown.value = savedRegistration;
            console.log(`Restored saved aircraft registration: "${savedRegistration}"`);
          }
        }, 500);
      }
    } catch (e) {
      console.error('Error restoring saved aircraft registration:', e);
    }
  }, []); // Empty dependency array means this runs once on mount
  
  // Use useCallback to memoize functions used in effects to prevent stale closures
  const memoizedLoadRigData = useCallback(loadRigData, [client, platformManagerRef.current]);
  const memoizedLoadAircraftData = useCallback(loadAircraftData, [client, aircraftManagerRef.current, currentRegion]);
  const memoizedFetchAirportData = useCallback(fetchAirportData, []);
  const memoizedInitializeFavoritesManager = useCallback(initializeFavoritesManager, []);
  const memoizedGetFromLocalStorage = useCallback(getFromLocalStorage, []);
  
  // REMOVED: User interaction listener was causing duplicate handlers

  // Track authentication changes and load data automatically when authenticated
  useEffect(() => {
    console.log(`Authentication state changed to: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    
    // Only load data if we're authenticated AND haven't loaded data yet
    if (isAuthenticated && client && (!dataLoadedRef.current || !rigsAutoloadedRef.current)) {
      console.log('Authentication detected - automatically loading data');
      dataLoadedRef.current = true; // Mark that we've loaded data
      
      // Show loading message
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = 'Loading platform data...';
        loadingOverlay.style.display = 'block';
      }
      
      // Try to load user preferences from localStorage
      const savedAircraftType = getFromLocalStorage('lastAircraftType', 'S92');
      console.log(`Using saved aircraft type preference: ${savedAircraftType}`);
      
      // Set the aircraft type from storage
      if (savedAircraftType) {
        setAircraftType(savedAircraftType);
      }
      
      // Load both platforms AND aircraft data
      console.log("======= NORMAL MODE: LOADING PLATFORMS AND AIRCRAFT =======");
      
      // If we have a current region, ensure we load region-specific rigs and aircraft
      if (currentRegion && platformManagerRef.current) {
        console.log(`Loading rigs for current region: ${currentRegion.name}`);
        platformManagerRef.current.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
          .then(platforms => {
            console.log(`Loaded ${platforms.length} platforms for ${currentRegion.name}`);
            rigsAutoloadedRef.current = true;
            setPlatformsLoaded(true);
            setPlatformsVisible(true);
            
            // Force visibility in the manager if method exists
            if (platformManagerRef.current.setVisibility) {
              platformManagerRef.current.setVisibility(true);
            }
            
            // Now load aircraft for this region
            console.log(`Now loading aircraft for ${currentRegion.name}`);
            return loadAircraftData(currentRegion);
          })
          .then(aircraft => {
            if (aircraft) {
              console.log(`Successfully loaded ${aircraft.length} aircraft for ${currentRegion.name}`);
            }
          })
          .catch(error => {
            console.error('Error loading region-specific platforms:', error);
            // Don't load static data as fallback
            console.log("Not falling back to static data");
          })
          .finally(() => {
            // Hide loading overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
              loadingOverlay.style.display = 'none';
            }
          });
      } else {
        // No current region, load general data for default region
        console.log("No current region, loading data for default region (Gulf of Mexico)");
        
        // First set the default region
        if (regionManagerRef.current) {
          const defaultRegion = regionManagerRef.current.setRegion('gulf-of-mexico');
          
          if (defaultRegion) {
            console.log(`Set default region to ${defaultRegion.name}`);
            
            // Don't load static data, just load from Foundry
            platformManagerRef.current.loadPlatformsFromFoundry(client, defaultRegion.osdkRegion)
              .then(platforms => {
                console.log(`Loaded ${platforms.length} platforms for ${defaultRegion.name}`);
                rigsAutoloadedRef.current = true;
                setPlatformsLoaded(true);
                setPlatformsVisible(true);
                
                // Force visibility in the manager if method exists
                if (platformManagerRef.current.setVisibility) {
                  platformManagerRef.current.setVisibility(true);
                }
              })
              .catch(error => {
                console.error('Error loading platforms from Foundry:', error);
                // Static data already loaded as fallback
              })
              .finally(() => {
                // Hide loading overlay
                if (loadingOverlay) {
                  loadingOverlay.style.display = 'none';
                }
              });
          } else {
            console.error("Failed to set default region");
            // Hide loading overlay
            if (loadingOverlay) {
              loadingOverlay.style.display = 'none';
            }
          }
        } else {
          console.error("Region manager not available");
          // Hide loading overlay
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
        }
      }
    }
  }, [isAuthenticated, client, currentRegion]); // Removed aircraft loading dependencies
  
  // Function to save aircraft-specific settings
  const saveAircraftSettings = useCallback((aircraftType, settings) => {
    try {
      // Get existing aircraft settings or initialize empty object
      const storedSettingsStr = localStorage.getItem('fastPlanner_aircraftSettings');
      const aircraftSettings = storedSettingsStr ? JSON.parse(storedSettingsStr) : {};
      
      // Update settings for this aircraft type
      aircraftSettings[aircraftType] = {
        ...aircraftSettings[aircraftType],
        ...settings
      };
      
      // Save back to localStorage
      localStorage.setItem('fastPlanner_aircraftSettings', JSON.stringify(aircraftSettings));
      console.log(`Saved settings for ${aircraftType}:`, settings);
    } catch (error) {
      console.error('Error saving aircraft settings to localStorage:', error);
    }
  }, []);
  
  // Function to load aircraft-specific settings
  const loadAircraftSettings = useCallback((aircraftType) => {
    try {
      // Get stored aircraft settings
      const storedSettingsStr = localStorage.getItem('fastPlanner_aircraftSettings');
      if (!storedSettingsStr) return null;
      
      const aircraftSettings = JSON.parse(storedSettingsStr);
      
      // Get settings for this aircraft type
      const settings = aircraftSettings[aircraftType];
      
      console.log(`Loaded settings for ${aircraftType}:`, settings);
      return settings || null;
    } catch (error) {
      console.error('Error loading aircraft settings from localStorage:', error);
      return null;
    }
  }, []);
  
  // Load global flight settings from localStorage on component mount
  useEffect(() => {
    try {
      const storedDeckTime = localStorage.getItem('fastPlanner_deckTimePerStop');
      const storedDeckFuel = localStorage.getItem('fastPlanner_deckFuelPerStop');
      const storedPassengerWeight = localStorage.getItem('fastPlanner_passengerWeight');
      const storedCargoWeight = localStorage.getItem('fastPlanner_cargoWeight');
      const storedReserveMethod = localStorage.getItem('fastPlanner_reserveMethod');
      const storedReserveFuel = localStorage.getItem('fastPlanner_reserveFuel');
      const storedDeckFuelFlow = localStorage.getItem('fastPlanner_deckFuelFlow');
      const storedTaxiFuel = localStorage.getItem('fastPlanner_taxiFuel');
      const storedContingencyFuelPercent = localStorage.getItem('fastPlanner_contingencyFuelPercent');
      
      // Load global settings if available
      if (storedDeckTime) setDeckTimePerStop(parseInt(storedDeckTime, 10));
      if (storedDeckFuel) setDeckFuelPerStop(parseInt(storedDeckFuel, 10));
      if (storedPassengerWeight) setPassengerWeight(parseInt(storedPassengerWeight, 10));
      if (storedCargoWeight) setCargoWeight(parseInt(storedCargoWeight, 10));
      if (storedReserveMethod) setReserveMethod(storedReserveMethod);
      if (storedReserveFuel) setReserveFuel(parseInt(storedReserveFuel, 10));
      if (storedDeckFuelFlow) setDeckFuelFlow(parseInt(storedDeckFuelFlow, 10));
      if (storedTaxiFuel) setTaxiFuel(parseInt(storedTaxiFuel, 10));
      if (storedContingencyFuelPercent) setContingencyFuelPercent(parseInt(storedContingencyFuelPercent, 10));
      
      console.log('Global flight settings loaded from localStorage');
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  // Force auth check on component mount - but don't auto-login
  useEffect(() => {
    console.log('Initial component mount - checking auth state');
    
    // Check localStorage as a fallback
    const storedAuth = localStorage.getItem('fastPlanner_isAuthenticated');
    if (storedAuth === 'true') {
      console.log('Found authenticated state in localStorage');
      // Just updating the UI elements directly
      const authMessage = document.getElementById('auth-message');
      if (authMessage) {
        authMessage.innerHTML = 'Connected to Foundry';
        authMessage.className = 'auth-success';
      }
      
      // Hide login button if we're authenticated
      const loginBtn = document.getElementById('login-button');
      if (loginBtn) {
        loginBtn.style.display = 'none';
      }
    }
    
    // CRITICAL FIX: Add a direct event listener to handle dropdown issues
    // This will ensure the aircraft type dropdown shows "Change Aircraft Type" after selecting an aircraft
    setTimeout(() => {
      const registrationDropdown = document.getElementById('aircraft-registration');
      if (registrationDropdown) {
        console.log('Adding direct event listener to aircraft registration dropdown');
        
        registrationDropdown.addEventListener('change', (e) => {
          console.log('Aircraft registration changed via DOM event');
          
          // Force the type dropdown to show "-- Change Aircraft Type --"
          const typeDropdown = document.getElementById('aircraft-type');
          if (typeDropdown) {
            typeDropdown.value = 'select';
            console.log('Set aircraft type dropdown to "select" from direct event listener');
          }
        });
      }
    }, 1000);
  }, []);
  
  // Load data when component mounts - simplified approach
  useEffect(() => {
    // Only run once
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    
    console.log("Starting simplified initial load sequence");
    
    // Clear aircraft type selection on initial load
    setAircraftType('');
    console.log("Resetting aircraft type to empty on initial load");
    
    // Remove any saved aircraft type from localStorage
    try {
      localStorage.removeItem('fast-planner-lastAircraftType');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Set a very simple loading message
    const showMessage = (message) => {
      console.log(message);
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = message;
        loadingOverlay.style.display = 'block';
      }
    };
    
    const hideMessage = () => {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    };
    
    // Load airport data
    memoizedFetchAirportData();
    
    // Initialize FavoriteLocationsManager
    memoizedInitializeFavoritesManager();
    
    // Always start with Gulf of Mexico
    const defaultRegion = 'gulf-of-mexico';
    
    // Don't load any saved aircraft type
    console.log("Starting with empty aircraft type selection");
    
    // Simple sequential loading with delays and basic error handling
    const simpleLoadSequence = async () => {
      try {
        // Step 1: Set the region (always Gulf of Mexico first)
        showMessage("Setting up Gulf of Mexico region...");
        console.log("Setting region to Gulf of Mexico");
        
        if (!regionManagerRef.current) {
          console.error("Region manager not available");
          hideMessage();
          return;
        }
        
        const region = regionManagerRef.current.setRegion(defaultRegion);
        if (!region) {
          console.error("Failed to set region to Gulf of Mexico");
          hideMessage();
          return;
        }
        
        // Wait to ensure region is set
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Skip static data loading - wait for the real data
        console.log("Skipping static data, waiting for real data");
        setPlatformsVisible(true);
        
        // Short delay before continuing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: If authenticated, load platforms from Foundry
        if (isAuthenticated && client && platformManagerRef.current) {
          showMessage("Loading platforms from Foundry...");
          console.log("Loading platforms from Foundry for Gulf of Mexico");
          
          try {
            // Log the platform manager state before loading
            console.log("Initial load - platform manager before loading:", 
              platformManagerRef.current ? "Exists" : "Missing");
            console.log("Initial load - platform count before loading:", 
              platformManagerRef.current && platformManagerRef.current.getPlatformCount ? 
              platformManagerRef.current.getPlatformCount() : "Not available");
            
            const platforms = await platformManagerRef.current.loadPlatformsFromFoundry(client, region.osdkRegion);
            console.log(`Loaded ${platforms.length} platforms from Foundry`);
            
            // Force visibility states
            setPlatformsLoaded(true);
            setPlatformsVisible(true);
            
            // If the platform manager has a setVisibility method, ensure it's visible
            if (platformManagerRef.current && platformManagerRef.current.setVisibility) {
              platformManagerRef.current.setVisibility(true);
              console.log("Initial load - forced platform visibility using manager's setVisibility method");
            }
            
            // Log what's actually in the platform manager now
            console.log("Initial load - platform manager after loading:", 
              platformManagerRef.current ? "Exists" : "Missing");
            console.log("Initial load - platform count after loading:", 
              platformManagerRef.current && platformManagerRef.current.getPlatformCount ? 
              platformManagerRef.current.getPlatformCount() : "Not available");
            
            // Wait longer to ensure platforms are rendered
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Re-enable aircraft loading
            showMessage("Loading aircraft data...");
            console.log("Loading aircraft data for Gulf of Mexico");
            
            if (aircraftManagerRef.current) {
              try {
                const aircraft = await loadAircraftData(region);
                console.log(`Loaded ${aircraft.length} aircraft`);
                
                // Wait to ensure aircraft data is processed
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (aircraftError) {
                console.error("Error loading aircraft:", aircraftError);
              }
            }
          } catch (platformError) {
            console.error("Error loading platforms from Foundry:", platformError);
          }
        }
        
        // Final cleanup
        setRegionLoading(false);
        setAircraftLoading(false);
        hideMessage();
        console.log("Initial load sequence completed");
        
      } catch (error) {
        console.error("Error in load sequence:", error);
        setRegionLoading(false);
        setAircraftLoading(false);
        hideMessage();
      }
    };
    
    // Start the loading sequence with a small delay
    setTimeout(simpleLoadSequence, 1000);
    
    // Add global function for adding favorites from map popups
    window.addToFavorites = (name, coords) => {
      console.log(`addToFavorites called from map popup: ${name} at ${coords}`);
      
      if (!favoriteLocationsManagerRef.current) {
        console.log("Initializing favorites manager from window.addToFavorites");
        initializeFavoritesManager();
      }
      
      // Get the current region from state, not from dependency
      const region = currentRegion || { id: 'gulf-of-mexico', name: 'Gulf of Mexico' };
      
      if (favoriteLocationsManagerRef.current) {
        // Create a location object with proper formatting
        const location = {
          name: name,
          coords: coords // This is already in [lng, lat] format from the popup
        };
        
        // Add to favorites using current region
        console.log(`Adding favorite to region ${region.id} from popup`);
        favoriteLocationsManagerRef.current.addFavoriteLocation(region.id, location);
        
        // Force update UI
        setForceUpdate(prev => prev + 1);
        
        // Update favorites list
        const updatedFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(region.id);
        setFavoriteLocations(updatedFavorites);
        
        // Show confirmation toast
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
          loadingOverlay.textContent = `Added ${name} to favorites`;
          loadingOverlay.style.display = 'block';
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
          }, 1500);
        }
      } else {
        console.error('Cannot add to favorites: Missing manager');
      }
    };
    
    // Cleanup function
    return () => {
      delete window.addToFavorites;
    };
  }, [isAuthenticated]); // Only re-run when authentication status changes
  
  // Handle region selection - using in-memory aircraft data
  const handleRegionChange = (regionId) => {
    if (!regionManagerRef.current) return;
    
    console.log(`\n======================================`);
    console.log(`CHANGING REGION TO: ${regionId.toUpperCase()}`);
    console.log(`======================================\n`);
    
    setRegionLoading(true);
    
    // IMPORTANT: Clean up map event handlers before changing region
    // This prevents duplicate handlers from accumulating
    const map = mapManagerRef.current?.getMap();
    if (map) {
      console.log('Cleaning up map event handlers during region change');
      map.off('click');
      
      // Reset the handler initialization flag
      window.mapHandlersInitialized = false;
    }
    
    // IMPORTANT: Reset aircraft selection when changing regions
    setAircraftType(''); // Set to empty to force user to choose
    setAircraftRegistration(''); // Clear aircraft registration too
    
    // Remove saved aircraft type from localStorage
    try {
      localStorage.removeItem('fast-planner-lastAircraftType');
      console.log('Cleared saved aircraft type preference');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Simple status message in console only, no UI overlays
    const showMessage = (message) => {
      console.log(message);
    };
    
    // Save selected region to localStorage
    saveToLocalStorage('lastRegionId', regionId);
    
    // Enhanced region change with memory-based aircraft filtering
    const loadRegionData = async () => {
      try {
        // Step 1: Initial setup
        showMessage(`Changing to ${regionId}...`);
        
        // Step 2: Clear existing platforms
        if (platformManagerRef.current) {
          console.log('Clearing existing platforms');
          try {
            // Log platform count before clearing
            const beforeCount = platformManagerRef.current.getPlatformCount ? 
                                platformManagerRef.current.getPlatformCount() : 
                                "unknown";
            console.log(`Platform count before clearing: ${beforeCount}`);
            
            platformManagerRef.current.clearPlatforms();
          } catch (error) {
            console.error('Error clearing platforms:', error);
          }
        }
        
        // Step 3: Set the region
        console.log(`Setting region to ${regionId}`);
        const region = regionManagerRef.current.setRegion(regionId);
        
        if (!region) {
          console.error(`Failed to set region to ${regionId}`);
          setRegionLoading(false);
          return;
        }
        
        // Step 4: Update favorites for this region
        if (favoriteLocationsManagerRef.current) {
          const favoritesForRegion = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
          console.log(`Loaded ${favoritesForRegion.length} favorites for ${region.name}`);
          setFavoriteLocations(favoritesForRegion);
        }
        
        // Wait for region change to finalize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set platforms visible
        setPlatformsVisible(true);
        
        // If authenticated, load platforms from Foundry
        if (isAuthenticated && client && platformManagerRef.current) {
          showMessage(`Loading rigs for ${region.name}...`);
          console.log(`Loading platforms from Foundry for ${region.name}`);
          
          try {
            // Set a flag to prevent double loading which causes layer issues
            window.isLoadingPlatforms = true;
            
            // Set the skipNextClear flag to prevent duplicate layer errors
            if (platformManagerRef.current && typeof platformManagerRef.current.skipNextClear !== 'undefined') {
              platformManagerRef.current.skipNextClear = true;
              console.log("Set skipNextClear flag to prevent duplicate source errors");
            }
            
            const platforms = await platformManagerRef.current.loadPlatformsFromFoundry(client, region.osdkRegion);
            console.log(`Successfully loaded ${platforms.length} platforms for ${region.name} from Foundry`);
            
            // Force visibility states
            setPlatformsLoaded(true);
            setPlatformsVisible(true);
            
            // Force visibility in the manager
            if (platformManagerRef.current && platformManagerRef.current.setVisibility) {
              platformManagerRef.current.setVisibility(true);
              console.log("Forced platform visibility using manager's setVisibility method");
            }
            
            // Clear the loading flag
            window.isLoadingPlatforms = false;
            
            // Set a safeguard timeout to ensure layers stay visible
            setTimeout(() => {
              try {
                const map = mapManagerRef.current?.getMap();
                if (map) {
                  console.log('Setting explicit visibility on all platform layers - SAFEGUARD');
                  const platformLayers = [
                    'platforms-fixed-layer',
                    'platforms-movable-layer',
                    'platforms-fixed-labels',
                    'platforms-movable-labels',
                    'airfields-layer',
                    'airfields-labels'
                  ];
                  
                  platformLayers.forEach(layerId => {
                    if (map.getLayer(layerId)) {
                      map.setLayoutProperty(layerId, 'visibility', 'visible');
                      console.log(`Set ${layerId} to visible`);
                    }
                  });
                }
                
                // Log final platform count
                if (platformManagerRef.current && platformManagerRef.current.getPlatformCount) {
                  console.log(`Final platform count: ${platformManagerRef.current.getPlatformCount()}`);
                }
              } catch (e) {
                console.warn('Error in safeguard visibility setting:', e);
              }
            }, 2000);
            
            // AIRCRAFT FILTERING FROM MEMORY - This is the key part for your issue
            console.log(`\n===== FILTERING AIRCRAFT FOR ${region.name} FROM MEMORY =====`);
            try {
              if (aircraftManagerRef.current && aircraftManagerRef.current.allAircraftLoaded) {
                setAircraftLoading(true);
                
                // Log aircraft counts by type in this region
                const typeCounts = aircraftManagerRef.current.getAircraftCountsByType(region.id);
                console.log('Aircraft counts by type in this region:', typeCounts);
                
                // Get all available aircraft types for this region from memory
                const availableTypes = aircraftManagerRef.current.getAvailableTypesInRegion(region.id);
                console.log(`Available aircraft types in ${region.name}:`, availableTypes);
                
                // Only show types that actually have aircraft in this region
                const typesWithAircraft = availableTypes.filter(type => typeCounts[type] && typeCounts[type] > 0);
                console.log(`Types with aircraft in ${region.name}:`, typesWithAircraft);
                
                // Update the aircraft types dropdown with all available types
                // Don't set any defaults - user must make a selection
                console.log(`Available aircraft types in ${region.name}:`, typesWithAircraft);
                setAircraftTypes(typesWithAircraft.length > 0 ? typesWithAircraft : []);
                
                // FORCE empty aircraft type - this is critical to fix the dropdown
                setAircraftType('');
                
                // Clear any locally stored preference
                try {
                  localStorage.removeItem('fast-planner-lastAircraftType');
                  console.log('Cleared saved aircraft type preference');
                } catch (e) {
                  console.error('Error clearing localStorage:', e);
                }
                
                // Don't apply type filtering - show all aircraft for the region
                console.log(`Showing all aircraft in ${region.name} without type filtering`);
                const regionAircraft = aircraftManagerRef.current.filterAircraft(region.id, null);
                console.log(`Showing ${regionAircraft.length} total aircraft in ${region.name}`);
                
                // Print type counts for debugging
                const regionTypeCounts = aircraftManagerRef.current.getAircraftCountsByType(region.id);
                console.log(`Type counts in ${region.name}:`, regionTypeCounts);
                
                setAircraftLoading(false);
              } else {
                // Aircraft not loaded yet, so load them now
                console.log('Aircraft not loaded in memory yet, will attempt to load them');
                
                if (client && aircraftManagerRef.current) {
                  // First load all aircraft if they're not already loaded
                  await aircraftManagerRef.current.loadAircraftFromOSDK(client);
                  
                  // Then filter for this region
                  const availableTypes = aircraftManagerRef.current.getAvailableTypesInRegion(region.id);
                  console.log(`Available aircraft types after loading: ${availableTypes.join(', ')}`);
                  
                  // Update the UI with available types
                  setAircraftTypes(availableTypes.length > 0 ? availableTypes : ['S92']);
                  
                  // Select first available type if current not available
                  if (availableTypes.length > 0 && !availableTypes.includes(aircraftType)) {
                    const newType = availableTypes[0];
                    setAircraftType(newType);
                    saveToLocalStorage('lastAircraftType', newType);
                  }
                  
                  // Apply filtering
                  aircraftManagerRef.current.filterAircraft(region.id, aircraftType);
                }
                
                setAircraftLoading(false);
              }
            } catch (aircraftError) {
              console.error(`Error filtering aircraft for ${region.name}:`, aircraftError);
              setAircraftLoading(false);
            }
          } catch (error) {
            console.error(`Error loading platforms from Foundry: ${error.message}`);
            setAircraftLoading(false);
          }
        }
        
        // Final cleanup
        console.log(`\n=======================================`);
        console.log(`REGION CHANGE TO ${region.name.toUpperCase()} COMPLETE`);
        console.log(`=======================================\n`);
        
        setRegionLoading(false);
        
      } catch (error) {
        console.error(`Error during region change: ${error.message}`);
        setRegionLoading(false);
      }
    };
    
    // Start the region change process
    loadRegionData();
  };
  
  // Handle adding a favorite location
  const handleAddFavoriteLocation = (location) => {
    console.log("handleAddFavoriteLocation called with:", location);
    
    if (!favoriteLocationsManagerRef.current) {
      console.log("Initializing favorites manager");
      initializeFavoritesManager();
    }
    
    // Use default region if currentRegion is null
    const regionId = currentRegion ? currentRegion.id : 'gulf-of-mexico';
    
    if (favoriteLocationsManagerRef.current) {
      console.log(`Adding favorite to region ${regionId}`);
      favoriteLocationsManagerRef.current.addFavoriteLocation(regionId, location);
      
      // Force update to refresh UI
      setForceUpdate(prev => prev + 1);
      
      // Reloading favorites list to ensure it's updated
      const updatedFavorites = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      console.log(`Updated favorites list now has ${updatedFavorites.length} items`);
      setFavoriteLocations(updatedFavorites);
      
      // Show success message
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = `Added ${location.name} to favorites`;
        loadingOverlay.style.display = 'block';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 1500);
      }
    } else {
      console.error("Cannot add favorite: No favorites manager");
      console.log("Current region:", currentRegion);
      console.log("Favorites manager exists:", !!favoriteLocationsManagerRef.current);
    }
  };

  // Handle removing a favorite location
  const handleRemoveFavoriteLocation = (locationId) => {
    console.log("handleRemoveFavoriteLocation called with ID:", locationId);
    
    if (!favoriteLocationsManagerRef.current) {
      console.log("Initializing favorites manager");
      initializeFavoritesManager();
    }
    
    // Use default region if currentRegion is null
    const regionId = currentRegion ? currentRegion.id : 'gulf-of-mexico';
    
    if (favoriteLocationsManagerRef.current) {
      console.log(`Removing favorite with ID ${locationId} from region ${regionId}`);
      
      // Get the list before removal for comparison
      const beforeList = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      console.log(`Before removal: ${beforeList.length} favorites`);
      
      // Check if the locationId actually exists
      const locationExists = beforeList.some(loc => loc.id === locationId);
      if (!locationExists) {
        console.error(`Location ID ${locationId} not found in region ${regionId}`);
        return;
      }
      
      // Get the name for the toast message
      const locationToRemove = beforeList.find(loc => loc.id === locationId);
      const locationName = locationToRemove ? locationToRemove.name : 'location';
      
      // Remove the favorite
      favoriteLocationsManagerRef.current.removeFavoriteLocation(regionId, locationId);
      
      // Force update to refresh UI
      setForceUpdate(prev => prev + 1);
      
      // Get and set the updated list
      const afterList = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
      console.log(`After removal: ${afterList.length} favorites`);
      setFavoriteLocations(afterList);
      
      // Show success message
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = `Removed ${locationName} from favorites`;
        loadingOverlay.style.display = 'block';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 1500);
      }
    } else {
      console.error("Cannot remove favorite: No favorites manager");
      console.log("Current region:", currentRegion);
      console.log("Favorites manager exists:", !!favoriteLocationsManagerRef.current);
    }
  };
  
  // Dummy function - disabled
  const loadStaticRigDataForRegion = (region) => {
    // Do nothing - no static data
    console.log(`Static data loading for region ${region?.name || 'unknown'} disabled`);
    return [];
  };

  return (
    <div className="fast-planner-container">
      {/* Route Stats Card Component */}
      <RouteStatsCard 
        routeStats={routeStats}
        selectedAircraft={selectedAircraft}
        waypoints={waypoints}
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
      />
      
      {/* Region Selector is now fully integrated within the RightPanel */}
      
      {/* Left Panel Component */}
      <LeftPanel
        visible={leftPanelVisible}
        waypoints={waypoints}
        onRemoveWaypoint={(id, index) => {
          if (waypointManagerRef.current) {
            waypointManagerRef.current.removeWaypoint(id, index);
          }
        }}
        onWaypointNameChange={handleWaypointNameChange}
        onAddWaypoint={handleAddWaypoint}
        onToggleVisibility={() => setLeftPanelVisible(!leftPanelVisible)}
        airports={airportData}
        routeInput={routeInput}
        onRouteInputChange={setRouteInput}
        favoriteLocations={favoriteLocations}
        onAddFavoriteLocation={handleAddFavoriteLocation}
        onRemoveFavoriteLocation={handleRemoveFavoriteLocation}
        currentRegion={currentRegion}
      />
      
      {/* Map Component */}
      <MapComponent 
        mapManagerRef={mapManagerRef}
        onMapReady={handleMapReady}
        className="fast-planner-map"
      />
      
      {/* Right Panel Component */}
      <RightPanel
        visible={rightPanelVisible}
        onToggleVisibility={() => setRightPanelVisible(!rightPanelVisible)}
        onClearRoute={() => {
          if (waypointManagerRef.current) {
            waypointManagerRef.current.clearRoute();
            
            // Reset route statistics to zero
            setRouteStats(null);
            
            // Also clear the global route stats
            window.currentRouteStats = null;
            
            console.log('Route cleared and statistics reset');
          }
        }}
        onLoadRigData={loadRigData}
        onToggleChart={togglePlatformsVisibility}
        onLoadCustomChart={() => {
          // Fix map click handlers - but do it directly rather than via event
          console.log("MANUALLY REFRESHING MAP CLICK HANDLERS");
          
          // Get the map
          const map = mapManagerRef.current?.getMap();
          if (!map) {
            console.error("Cannot refresh handlers: Map not available");
            return;
          }
          
          // Reset the initialization flag
          window.mapHandlersInitialized = false;
          
          // Remove existing handlers
          map.off('click');
          
          // Set up handlers directly
          setupMapEventHandlers(map);
          setupRouteDragging();
          
          // Reset the flag
          window.mapHandlersInitialized = true;
          
          // Show confirmation message
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) {
            loadingOverlay.textContent = "Map click handlers and route dragging refreshed";
            loadingOverlay.style.display = 'block';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
            }, 1500);
          }
        }}
        chartsVisible={platformsLoaded ? platformsVisible : null}
        aircraftType={aircraftType}
        onAircraftTypeChange={handleAircraftTypeChange}
        aircraftRegistration={aircraftRegistration}
        onAircraftRegistrationChange={handleAircraftRegistrationChange}
        selectedAircraft={selectedAircraft || window.selectedAircraftObject} // Pass the third field
        forceUpdate={forceUpdate} // Pass the forceUpdate counter to trigger re-renders
        aircraftsByType={aircraftsByType}
        aircraftLoading={aircraftLoading}
        payloadWeight={payloadWeight}
        onPayloadWeightChange={handlePayloadWeightChange}
        reserveFuel={reserveFuel}
        onReserveFuelChange={handleReserveFuelChange}
        routeStats={routeStats}
        waypoints={waypoints}
        onRemoveWaypoint={(id, index) => {
          if (waypointManagerRef.current) {
            waypointManagerRef.current.removeWaypoint(id, index);
          }
        }}
        isAuthenticated={isAuthenticated}
        authUserName={userName || "User"} // Don't use hardcoded name
        rigsLoading={rigsLoading}
        onLogin={() => {
          console.log('Connecting to Foundry...');
          
          // Simply call the login function from auth context
          login();
          
          // After login, the auth flow will redirect the page
          // But we can try to load data immediately to at least show something
          setTimeout(() => {
            console.log('Trying to load data...');
            loadRigData();
            loadAircraftData(currentRegion || null);
            setForceUpdate(prev => prev + 1);
          }, 500);
        }}
        // Pass region props to the RightPanel
        regions={regions}
        currentRegion={currentRegion}
        onRegionChange={handleRegionChange}
        regionLoading={regionLoading}
        // Flight settings props
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        deckFuelFlow={deckFuelFlow}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
        taxiFuel={taxiFuel}
        contingencyFuelPercent={contingencyFuelPercent}
        reserveMethod={reserveMethod}
        onDeckTimeChange={setDeckTimePerStop}
        onDeckFuelChange={setDeckFuelPerStop}
        onDeckFuelFlowChange={handleDeckFuelFlowChange}
        onPassengerWeightChange={setPassengerWeight}
        onCargoWeightChange={setCargoWeight}
        onTaxiFuelChange={handleTaxiFuelChange}
        onContingencyFuelPercentChange={handleContingencyFuelPercentChange}
        onReserveMethodChange={setReserveMethod}
      />
    </div>
  );
  // Add event listener for saving aircraft settings
  useEffect(() => {
    // Add event listener for saving aircraft settings from RightPanel
    const handleSaveAircraftSettings = (e) => {
      const { key, settings } = e.detail;
      console.log(`Saving settings for ${key}:`, settings);
      saveAircraftSettings(key, settings);
    };
    
    window.addEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    
    // Cleanup function
    return () => {
      window.removeEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    };
  }, [saveAircraftSettings]);
};

export default ModularFastPlannerComponent;