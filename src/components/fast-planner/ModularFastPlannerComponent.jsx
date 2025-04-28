import React, { useRef, useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import our modular components
import { MapManager, WaypointManager, PlatformManager, RouteCalculator, RegionManager, FavoriteLocationsManager, AircraftManager } from './modules';
import { LeftPanel, RightPanel, MapComponent, RegionSelector } from './components';

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
  const aircraftManagerRef = useRef(null); // Add reference for AircraftManager
  
  // UI state
  const [forceUpdate, setForceUpdate] = useState(0); // Used to force component rerender
  const [routeInput, setRouteInput] = useState('');
  const [airportData, setAirportData] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]); // Add state for favorite locations
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
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
  const [aircraftType, setAircraftType] = useState('S92');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState(['S92', 'S76', 'S76D', 'AW139', 'AW189', 'H175', 'H160', 'EC135', 'EC225', 'AS350', 'A119']);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [payloadWeight, setPayloadWeight] = useState(2000);
  const [reserveFuel, setReserveFuel] = useState(600);
  const [routeStats, setRouteStats] = useState(null);
  
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
            
            // If no match found, use default bucket
            if (!found) {
              console.log(`No type match for aircraft: ${aircraft.registration}, defaulting to S92`);
              emptyByType['S92'].push(aircraft);
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
          
          // If we still can't find a match, use a default bucket
          console.log(`No bucket match for aircraft type: ${type}, defaulting to S92`);
          byType['S92'].push(aircraft);
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
  }, [platformManagerRef]);

  // Define loadStaticRigData and setupMapEventHandlers *before* handleMapReady
  // Load static rig data (without requiring authentication)
  const loadStaticRigData = useCallback(() => { 
    if (!platformManagerRef.current) return;
    
    console.log('Loading static platform data');
    
    // Define static platforms - Gulf of Mexico platforms
    const staticPlatforms = [
      { name: "Mars", coordinates: [-90.966, 28.1677], operator: "Platform Shell" },
      { name: "Perdido", coordinates: [-94.9025, 26.1347], operator: "Platform Shell" },
      { name: "Thunder Horse", coordinates: [-88.4957, 28.1912], operator: "Platform BP" },
      { name: "Olympus", coordinates: [-90.9772, 28.1516], operator: "Platform Shell" },
      { name: "Appomattox", coordinates: [-91.654, 28.968], operator: "Platform Shell" },
      { name: "Atlantis", coordinates: [-90.1675, 27.1959], operator: "Platform BP" },
      { name: "Mad Dog", coordinates: [-90.9122, 27.3389], operator: "Platform BP" },
      { name: "Auger", coordinates: [-92.4458, 27.5483], operator: "Platform Shell" },
      { name: "Hoover Diana", coordinates: [-94.6894, 26.9333], operator: "Platform ExxonMobil" },
      { name: "Genesis", coordinates: [-90.8597, 27.7778], operator: "Platform Chevron" },
      { name: "Ram Powell", coordinates: [-88.1111, 29.0736], operator: "Platform Shell" },
      { name: "Ursa", coordinates: [-89.7875, 28.1539], operator: "Platform Shell" },
      { name: "Holstein", coordinates: [-90.5397, 27.3217], operator: "Platform BHP" },
      { name: "Brutus", coordinates: [-90.6506, 27.7978], operator: "Platform Shell" },
      { name: "Amberjack", coordinates: [-90.5703, 28.5983], operator: "Platform Talos Energy" }
    ];
    
    // Apply the same filtering as we use for live data to ensure consistency
    const filteredPlatforms = staticPlatforms.filter(platform => {
      if (!platform.operator) return true; // Keep platforms without operator info
      
      const locType = platform.operator.toLowerCase();
      return locType.includes("platform") || 
             locType.includes("rig") || 
             locType.includes("vessel") || 
             locType.includes("ship") || 
             locType.includes("blocks") || 
             locType.includes("jackup") || 
             locType.includes("movable") || 
             locType.includes("moveable") || 
             locType.includes("fpso");
    });
    
    console.log(`Adding ${filteredPlatforms.length} filtered static platforms`);
    platformManagerRef.current.addPlatformsToMap(filteredPlatforms);
  }, [platformManagerRef]); // Dependency for useCallback
  
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
    
    // Set up dragging in the map manager
    mapManagerRef.current.setupRouteDragging(handleRouteDrag);
    
  }, [mapManagerRef, waypointManagerRef, platformManagerRef]);
  
  // Set up map event handlers
  const setupMapEventHandlers = useCallback((map) => { // Wrap in useCallback
    if (!map) return;
    
    console.log('Setting up map event handlers');
    
    // Map click for adding waypoints
    map.on('click', (e) => {
      console.log('Map clicked at:', e.lngLat);
      
      // Exit early if waypoint manager isn't initialized
      if (!waypointManagerRef.current) {
        console.error('Waypoint manager not initialized');
        return;
      }
      
      // Check if clicking on a platform marker
      try {
        const platformFeatures = map.queryRenderedFeatures(e.point, { layers: ['platforms-layer'] });
        if (platformFeatures && platformFeatures.length > 0) {
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
          // Find where to insert on the path
          const insertIndex = waypointManagerRef.current.findPathInsertIndex(e.lngLat);
          
          // Check for nearest rig when clicking on route line
          const nearestRig = platformManagerRef.current?.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);
          
          if (nearestRig) {
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
      const nearestRig = platformManagerRef.current?.findNearestPlatform(e.lngLat.lat, e.lngLat.lng);
      
      if (nearestRig) {
        console.log(`Found nearby rig: ${nearestRig.name} at distance ${nearestRig.distance.toFixed(2)} nm`);
        waypointManagerRef.current.addWaypoint([nearestRig.lng, nearestRig.lat], nearestRig.name);
      } else {
        waypointManagerRef.current.addWaypoint([e.lngLat.lng, e.lngLat.lat]);
      }
    });
    
    // Change cursor on hover over platforms
    map.on('mouseenter', 'platforms-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'platforms-layer', () => {
      map.getCanvas().style.cursor = '';
    });
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
        // Calculate route stats whenever the route changes
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

    // Use the MapManager's robust onMapLoaded to schedule load-dependent actions
    mapManagerRef.current.onMapLoaded(() => {
      console.log("Executing actions via onMapLoaded callback in handleMapReady.");
      const currentMap = mapManagerRef.current.getMap(); // Get potentially updated map ref
      if (!currentMap) {
        console.error("Map instance unavailable when onMapLoaded callback executed.");
        return;
      }
      // Initialize map event handlers now that map is loaded
      setupMapEventHandlers(currentMap);
      
      // Make sure the platform manager is set in the region manager
      if (regionManagerRef.current && platformManagerRef.current) {
        regionManagerRef.current.platformManager = platformManagerRef.current;
      }
      
      // Initialize route rubberband dragging
      setupRouteDragging();
      
      // Load static rig data if no platforms are loaded yet
      if (platformManagerRef.current && !platformsLoaded) {
        console.log("Loading static rig data after map initialization");
        loadStaticRigData();
      }
    });

  }, [mapManagerRef, waypointManagerRef, platformManagerRef, setupMapEventHandlers, loadStaticRigData, setupRouteDragging]); // Keep dependencies

  // Calculate route statistics 
  const calculateRouteStats = (coordinates) => {
    if (!routeCalculatorRef.current || !coordinates || coordinates.length < 2) {
      setRouteStats(null);
      return;
    }
    
    // If we have a specific aircraft registration selected, use its performance data
    let params = {
      aircraftType,
      payloadWeight,
      reserveFuel
    };
    
    // Add registration if available for specific aircraft performance data
    if (aircraftRegistration && aircraftManagerRef.current) {
      const aircraft = aircraftManagerRef.current.getAircraftByRegistration(aircraftRegistration);
      if (aircraft) {
        params.registration = aircraftRegistration;
        
        // Use the aircraft manager to calculate performance
        if (aircraftManagerRef.current) {
          const perfStats = aircraftManagerRef.current.calculateRoutePerformance(
            aircraftType,
            coordinates,
            params
          );
          
          setRouteStats(perfStats);
          return;
        }
      }
    }
    
    // Fall back to RouteCalculator if AircraftManager calculation not available
    const stats = routeCalculatorRef.current.calculateRouteStats(coordinates, params);
    setRouteStats(stats);
  };
  
  // Load aircraft data from OSDK
  const loadAircraftData = async (region = null) => {
    if (!aircraftManagerRef.current || !client) {
      console.error('Cannot load aircraft: AircraftManager or client not initialized');
      return;
    }
    
    setAircraftLoading(true);
    
    // Set a global flag that data loading has been attempted
    // This helps the auth system know we're authenticated if data loads
    window.aircraftLoadAttempted = true;
    
    // Create debug overlay
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
      // Define debug messages with styling for better visibility
      console.log(`%c===== LOADING AIRCRAFT DATA ${region ? `FOR REGION: ${region.name}` : ''} =====`, 
        'background: #007; color: #fff; font-size: 16px; font-weight: bold;');
      
      const regionInfo = region ? `${region.name} (${region.id})` : 'All Regions';
      showDebugMessage(`Loading aircraft data for ${regionInfo}...`);
      
      // Show loading message
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = `Loading aircraft data for ${regionInfo}...`;
        loadingOverlay.style.display = 'block';
      }
      
      // First verify the AircraftManager is properly initialized
      if (!aircraftManagerRef.current) {
        console.error('AircraftManager is not initialized!');
        throw new Error('AircraftManager is not initialized');
      }
      
      // Log current region and aircraft type
      console.log('Current state before loading:');
      console.log('- Current Region:', currentRegion ? `${currentRegion.name} (${currentRegion.id})` : 'None');
      console.log('- Current Aircraft Type:', aircraftType);
      console.log('- Existing aircraft count:', aircraftManagerRef.current.aircraftList.length);
      
      // Load aircraft data - if region is provided, use it for initial filtering
      const regionId = region ? region.id : null;
      await aircraftManagerRef.current.loadAircraftFromOSDK(client, regionId);
      
      // Get count after loading
      const loadedCount = aircraftManagerRef.current.aircraftList.length;
      console.log(`Loaded ${loadedCount} aircraft from OSDK`);
      
      // Set a global flag that aircraft data has been successfully loaded
      // This helps the auth system know we're authenticated
      window.aircraftLoaded = true;
      
      // CRITICAL FIX: Always do a region-only filter first to discover all available types
      if (currentRegion) {
        console.log(`%cDoing region-only filter for: ${currentRegion.id}`, 
          'background: #070; color: #fff; font-size: 14px;');
        
        const filteredAircraft = aircraftManagerRef.current.filterAircraft(currentRegion.id, null);
        showDebugMessage(`Found ${filteredAircraft.length} aircraft in ${currentRegion.name}`);
      } else if (region) {
        console.log(`%cDoing region-only filter for: ${region.id}`, 
          'background: #070; color: #fff; font-size: 14px;');
        
        const filteredAircraft = aircraftManagerRef.current.filterAircraft(region.id, null);
        showDebugMessage(`Found ${filteredAircraft.length} aircraft in ${region.name}`);
      } else {
        // If no filtering criteria, show raw counts by region and type
        console.log('%cNo filtering criteria provided, showing raw counts:', 'color: #f90; font-weight: bold;');
        const regionCounts = {};
        const typeCounts = {};
        
        aircraftManagerRef.current.aircraftList.forEach(aircraft => {
          // Count by region
          const region = aircraft.region || 'Unknown';
          regionCounts[region] = (regionCounts[region] || 0) + 1;
          
          // Count by type
          const type = aircraft.modelType || 'Unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        console.log('Aircraft counts by region:', regionCounts);
        console.log('Aircraft counts by type:', typeCounts);
      }
      
      console.log(`%c===== AIRCRAFT DATA LOADED AND FILTERED =====`, 
        'background: #007; color: #fff; font-size: 16px; font-weight: bold;');
      
      // Hide loading overlay
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading aircraft data:', error);
      
      // Show error message
      showDebugMessage(`Error loading aircraft data: ${error.message}`, false);
      
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = `Error loading aircraft data: ${error.message}`;
        loadingOverlay.style.display = 'block';
        
        // Hide after a delay
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 3000);
      }
    } finally {
      setAircraftLoading(false);
    }
  };
  
  // Load rig data from Foundry
  const loadRigData = async () => {
    if (!platformManagerRef.current) return;
    
    // Set a global flag that data loading has been attempted
    window.platformLoadAttempted = true;
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.textContent = 'Loading rig data...';
      loadingOverlay.style.display = 'block';
    }
    
    // Set loading state
    setRigsLoading(true);
    setRigsError(null);
    
    try {
      await platformManagerRef.current.loadPlatformsFromFoundry(client);
      
      // Set a global flag that platform data has been successfully loaded
      window.platformsLoaded = true;
    } catch (error) {
      console.error('Error loading platforms:', error);
      setRigsError(error.message);
      
      // Fall back to static data
      loadStaticRigData();
    } finally {
      // Hide loading overlay
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
      
      setRigsLoading(false);
    }
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

  // Handle aircraft type change
  const handleAircraftTypeChange = (type) => {
    console.log(`%cChanging aircraft type to: ${type}`, 'background: #070; color: #fff; font-size: 14px;');
    setAircraftType(type);
    
    // Save the selected aircraft type to localStorage
    saveToLocalStorage('lastAircraftType', type);
    
    // Reset aircraft registration when type changes
    setAircraftRegistration('');
    
    // Show loading state while filtering
    setAircraftLoading(true);
    
    // Create debug overlay
    const showTypeChangeMessage = (message) => {
      let debugOverlay = document.getElementById('type-change-overlay');
      if (!debugOverlay) {
        debugOverlay = document.createElement('div');
        debugOverlay.id = 'type-change-overlay';
        debugOverlay.style.position = 'fixed';
        debugOverlay.style.top = '120px';
        debugOverlay.style.left = '10px';
        debugOverlay.style.backgroundColor = 'rgba(0,70,130,0.9)';
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
        <div style="font-weight: bold; margin-bottom: 10px;">
          ${message}
        </div>
        <div style="font-size: 12px;">
          This message will disappear in 4 seconds
        </div>
      `;
      
      setTimeout(() => {
        if (debugOverlay && debugOverlay.parentNode) {
          debugOverlay.parentNode.removeChild(debugOverlay);
        }
      }, 4000);
    };
    
    // Filter aircraft by current region and new type
    if (aircraftManagerRef.current) {
      const regionId = currentRegion ? currentRegion.id : null;
      const regionName = currentRegion ? currentRegion.name : "All Regions";
      
      console.log(`Filtering aircraft by region: ${regionId} and new type: ${type}`);
      showTypeChangeMessage(`Filtering ${type} aircraft in ${regionName}...`);
      
      // Give a small delay to allow UI to update
      setTimeout(() => {
        try {
          // Count aircraft before filtering
          const beforeCount = aircraftManagerRef.current.aircraftList.length;
          console.log(`Total aircraft before filtering: ${beforeCount}`);
          
          // Apply the filter
          const filteredAircraft = aircraftManagerRef.current.filterAircraft(regionId, type);
          
          // Display results message
          showTypeChangeMessage(
            `Found ${filteredAircraft.length} ${type} aircraft in ${regionName}`
          );
          
          // Recalculate route stats with the new aircraft type
          const wps = waypointManagerRef.current?.getWaypoints() || [];
          if (wps.length >= 2) {
            const coordinates = wps.map(wp => wp.coords);
            calculateRouteStats(coordinates);
          }
          
          // Update UI state
          setAircraftLoading(false);
        } catch (error) {
          console.error('Error filtering aircraft:', error);
          showTypeChangeMessage(`Error filtering aircraft: ${error.message}`);
          setAircraftLoading(false);
        }
      }, 100);
    } else {
      setAircraftLoading(false);
      console.error('Cannot filter aircraft: AircraftManager not initialized');
      showTypeChangeMessage('Error: Aircraft manager not initialized');
    }
  };
  
  // Handle aircraft registration change
  const handleAircraftRegistrationChange = (registration) => {
    setAircraftRegistration(registration);
    
    // Select the aircraft in the AircraftManager
    if (aircraftManagerRef.current && registration) {
      aircraftManagerRef.current.selectAircraft(registration);
    }
    
    // Recalculate route stats with the selected aircraft
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };
  
  // Handle payload weight change
  const handlePayloadWeightChange = (weight) => {
    setPayloadWeight(weight);
    
    // Recalculate route stats with the new payload weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
    }
  };
  
  // Handle reserve fuel change
  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
    
    // Recalculate route stats with the new reserve fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      calculateRouteStats(coordinates);
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
  
  // Track authentication changes
  useEffect(() => {
    console.log(`Authentication state changed to: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    
    // Only log the change but don't automatically trigger data loading
    // This will prevent unwanted reloads that could interrupt user flow
  }, [isAuthenticated]); // This effect runs whenever isAuthenticated changes
  
  // Force login on component mount - this will run before the main data loading effect
  useEffect(() => {
    // Check if already authenticated by token
    const hasToken = typeof auth?.getAccessToken === 'function' && !!auth.getAccessToken();
    console.log('Initial auth check in ModularFastPlannerComponent - hasToken:', hasToken);
    
    if (hasToken) {
      console.log('Token found on initial load, ensuring authenticated state');
      // We have a token but state might not be set yet
      login(); // This will force an authentication state update
    } else {
      // Check localStorage as a fallback
      const storedAuth = localStorage.getItem('fastPlanner_isAuthenticated');
      if (storedAuth === 'true') {
        console.log('Found stored authentication state, logging in');
        login();
      }
    }
  }, []);
  
  // Load data when component mounts
  useEffect(() => {
    fetchAirportData();
    
    // Initialize FavoriteLocationsManager if it doesn't exist yet
    initializeFavoritesManager();
    
    // Try to load user preferences from localStorage
    const savedRegionId = getFromLocalStorage('lastRegionId', 'gulf-of-mexico');
    const savedAircraftType = getFromLocalStorage('lastAircraftType', 'S92');
    
    console.log(`Loading saved preferences - Region: ${savedRegionId}, Aircraft: ${savedAircraftType}`);
    
    // Set the aircraft type from storage
    if (savedAircraftType) {
      setAircraftType(savedAircraftType);
    }
    
    // If we have a region manager, set the region from storage
    if (regionManagerRef.current && savedRegionId) {
      // This will trigger the region change handler which will load aircraft
      const regionExists = regionManagerRef.current.getRegions().some(r => r.id === savedRegionId);
      
      if (regionExists) {
        console.log(`Setting initial region to saved value: ${savedRegionId}`);
        regionManagerRef.current.setRegion(savedRegionId);
      } else {
        console.log(`Saved region ${savedRegionId} not found in available regions`);
      }
    } else {
      // No region manager or saved region, so load aircraft data directly
      if (isAuthenticated && aircraftManagerRef.current && client) {
        console.log("Initial load of aircraft data...");
        
        // If we already have a current region set, use it
        if (currentRegion) {
          console.log(`Loading aircraft data for initial region: ${currentRegion.name}`);
          loadAircraftData(currentRegion);
        } else {
          // Otherwise just load all aircraft and we'll filter when region is set
          console.log(`Loading all aircraft data without region filter`);
          loadAircraftData();
        }
      }
    }
    
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
  
  // Handle region selection
  const handleRegionChange = (regionId) => {
    if (!regionManagerRef.current) return;
    
    console.log(`Changing region to: ${regionId}`);
    setRegionLoading(true);
    
    // Save selected region to localStorage
    saveToLocalStorage('lastRegionId', regionId);
    
    // Reset aircraft registration when changing regions
    setAircraftRegistration('');
    
    // Clear existing platforms and aircraft data before changing region
    if (platformManagerRef.current) {
      console.log('Clearing existing platforms before region change');
      try {
        // Clear existing platforms
        platformManagerRef.current.clearPlatforms();
        
        // Also reset aircraft data for the region
        if (aircraftManagerRef.current) {
          console.log('Resetting aircraft data for new region');
          // Clear the filtered aircraft for the region
          aircraftManagerRef.current.resetAircraftForRegion();
        }
      } catch (error) {
        console.error('Error clearing data for region change:', error);
      }
    }
    
    // Set the selected region
    const region = regionManagerRef.current.setRegion(regionId);
    
    if (region) {
      // Instead of using full-screen loading overlay, show loading in region selector
      console.log(`Flying to ${region.name} region...`);
      
      // Make sure FavoriteLocationsManager is initialized
      if (!favoriteLocationsManagerRef.current) {
        initializeFavoritesManager();
      }
      
      // Update favorite locations for this region
      if (favoriteLocationsManagerRef.current) {
        const favoritesForRegion = favoriteLocationsManagerRef.current.getFavoriteLocationsByRegion(regionId);
        console.log(`Loaded ${favoritesForRegion.length} favorites for region ${region.name}`);
        setFavoriteLocations(favoritesForRegion);
      }
      
      // If we have a platform manager, reload platforms for this region
      if (platformManagerRef.current) {
        // After a short delay to let the map move, load platforms for the new region
        setTimeout(() => {
          try {
            console.log(`Loading static data for region: ${region.name}`);
            // Load static data for this region first
            loadStaticRigDataForRegion(region);
            
            // Only try to load from Foundry if authenticated
            if (isAuthenticated && client) {
              console.log(`Loading platforms from Foundry for region: ${region.osdkRegion}`);
              
              // Debug message to observe the authentication state during region change
              console.log(`Auth state during region change - isAuthenticated: ${isAuthenticated}, client available: ${!!client}`);
              
              platformManagerRef.current.loadPlatformsFromFoundry(client, region.osdkRegion)
                .then(platforms => {
                  console.log(`Loaded ${platforms.length} platforms for ${region.name} from Foundry`);
                  setRegionLoading(false);
                  setPlatformsLoaded(true);
                  
                  // Load aircraft data for this region after platforms are loaded
                  if (aircraftManagerRef.current) {
                    console.log(`Loading aircraft data for region: ${region.name}`);
                    setAircraftLoading(true);
                    
                    // First do a region-only filter to find available types
                    if (aircraftManagerRef.current.aircraftList.length > 0) {
                      console.log(`Using existing aircraft data for region: ${region.id}`);
                      aircraftManagerRef.current.filterAircraft(region.id, null);
                    } else {
                      console.log(`Loading fresh aircraft data for region: ${region.id}`);
                      loadAircraftData(region);
                    }
                  }
                })
                .catch(error => {
                  console.error(`Error loading platforms from Foundry: ${error.message}`);
                  // Don't set auth state based on an error - this could be a network issue
                  // or other problem unrelated to authentication
                  
                  // Fall back to static data
                  loadStaticRigDataForRegion(region);
                  
                  setRigsError(error.message);
                  setRegionLoading(false);
                });
            } else {
              // If not authenticated, just load static data and continue
              loadStaticRigDataForRegion(region);
              setRegionLoading(false);
            }
          } catch (error) {
            console.error(`Error during region change to ${region.name}:`, error);
            setRegionLoading(false);
            setRigsError(`Error loading ${region.name}: ${error.message}`);
          }
        }, 1000);
      } else {
        setRegionLoading(false);
      }
    } else {
      setRegionLoading(false);
    }
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
  
  // Load static rig data for a specific region
  const loadStaticRigDataForRegion = (region) => {
    if (!platformManagerRef.current || !region) return;
    
    // If we already loaded static data for this region, don't reload
    if (window.staticDataLoaded === region.id) {
      console.log(`Static data already loaded for ${region.name}`);
      return;
    }
    
    // If we're authenticated and going to load from Foundry later, don't load static data
    if (isAuthenticated && client) {
      console.log(`Skipping static data load for ${region.name} as we'll load from Foundry`);
      return;
    }
    
    console.log(`Loading static platform data for ${region.name}`);
    
    // First, ensure existing platforms are cleared
    try {
      platformManagerRef.current.clearPlatforms();
    } catch (error) {
      console.error('Error clearing platforms before loading static data:', error);
    }
    
    // Helper function to enhance platform data
    const enhancePlatforms = (platforms, regionName) => {
      return platforms.map(platform => ({
        ...platform,
        operator: platform.operator || `Platform in ${regionName}`,
        // Add isAirfield and isMovable flags used by the platform manager
        isAirfield: platform.isAirfield || false,
        isMovable: platform.isMovable || platform.operator?.toLowerCase().includes('movable') || false
      }));
    };
    
    // Define static airports for each region
    const staticAirportsByRegion = {
      'gulf-of-mexico': [
        { name: "KHOU", coordinates: [-95.2789, 29.6451], operator: "Houston Hobby Airport", isAirfield: true },
        { name: "KMSY", coordinates: [-90.2594, 29.9934], operator: "New Orleans Intl Airport", isAirfield: true },
        { name: "KGLS", coordinates: [-94.8604, 29.2653], operator: "Galveston Airport", isAirfield: true }
      ],
      'norway': [
        { name: "ENZV", coordinates: [5.6317, 58.8767], operator: "Stavanger Airport", isAirfield: true },
        { name: "ENBR", coordinates: [5.2183, 60.2928], operator: "Bergen Airport", isAirfield: true },
        { name: "ENVA", coordinates: [10.9239, 63.4567], operator: "Trondheim Airport", isAirfield: true }
      ],
      'united-kingdom': [
        { name: "EGPD", coordinates: [-2.1997, 57.2019], operator: "Aberdeen Airport", isAirfield: true },
        { name: "EGTC", coordinates: [-0.6166, 52.0722], operator: "Cranfield Airport", isAirfield: true }
      ]
    };
    
    // Define region-specific static platforms
    const staticPlatformsByRegion = {
      'gulf-of-mexico': [
        { name: "Mars", coordinates: [-90.966, 28.1677], operator: "Platform Shell" },
        { name: "Perdido", coordinates: [-94.9025, 26.1347], operator: "Platform Shell" },
        { name: "Thunder Horse", coordinates: [-88.4957, 28.1912], operator: "Platform BP" },
        { name: "Olympus", coordinates: [-90.9772, 28.1516], operator: "Platform Shell" },
        { name: "Appomattox", coordinates: [-91.654, 28.968], operator: "Platform Shell" },
        { name: "Atlantis", coordinates: [-90.1675, 27.1959], operator: "Platform BP" },
        { name: "Mad Dog", coordinates: [-90.9122, 27.3389], operator: "Platform BP" },
        { name: "Auger", coordinates: [-92.4458, 27.5483], operator: "Platform Shell" },
        { name: "Hoover Diana", coordinates: [-94.6894, 26.9333], operator: "Platform ExxonMobil" },
        { name: "Genesis", coordinates: [-90.8597, 27.7778], operator: "Platform Chevron" },
        { name: "Ram Powell", coordinates: [-88.1111, 29.0736], operator: "Platform Shell" },
        { name: "Ursa", coordinates: [-89.7875, 28.1539], operator: "Platform Shell" },
        { name: "Holstein", coordinates: [-90.5397, 27.3217], operator: "Platform BHP" },
        { name: "Brutus", coordinates: [-90.6506, 27.7978], operator: "Platform Shell" },
        { name: "Amberjack", coordinates: [-90.5703, 28.5983], operator: "Platform Talos Energy" }
      ],
      'norway': [
        { name: "Troll A", coordinates: [3.6, 60.6], operator: "Platform Equinor" },
        { name: "Oseberg", coordinates: [2.8, 60.5], operator: "Platform Equinor" },
        { name: "Sleipner", coordinates: [1.9, 58.4], operator: "Platform Equinor" },
        { name: "Ekofisk", coordinates: [3.2, 56.5], operator: "Platform ConocoPhillips" },
        { name: "Johan Sverdrup", coordinates: [2.5, 58.9], operator: "Platform Equinor" },
        { name: "Gullfaks", coordinates: [2.3, 61.2], operator: "Platform Equinor" },
        { name: "Statfjord A", coordinates: [1.85, 61.2], operator: "Platform Equinor" },
        { name: "Statfjord B", coordinates: [1.83, 61.15], operator: "Platform Equinor" },
        { name: "Visund", coordinates: [2.4, 61.35], operator: "Platform Equinor" },
        { name: "Snorre A", coordinates: [2.15, 61.45], operator: "Platform Equinor" }
      ],
      'united-kingdom': [
        { name: "Brent Charlie", coordinates: [1.7, 61.1], operator: "Platform Shell" },
        { name: "Forties", coordinates: [0.9, 57.7], operator: "Platform Apache" },
        { name: "Buzzard", coordinates: [-0.3, 57.8], operator: "Platform CNOOC" },
        { name: "Ninian", coordinates: [1.7, 60.8], operator: "Platform EnQuest" },
        { name: "Bruce", coordinates: [-1.2, 59.7], operator: "Platform Serica Energy" },
        { name: "Alba", coordinates: [0.2, 58.2], operator: "Platform Ithaca Energy" },
        { name: "Beryl", coordinates: [1.5, 59.5], operator: "Platform Apache" },
        { name: "Elgin", coordinates: [1.9, 57.0], operator: "Platform Total" }
      ],
      'west-africa': [
        { name: "Bonga", coordinates: [4.5, 4.6], operator: "Platform Shell" },
        { name: "Agbami", coordinates: [5.0, 3.0], operator: "Platform Chevron" },
        { name: "Akpo", coordinates: [7.5, 3.2], operator: "Platform Total" },
        { name: "Girassol", coordinates: [8.4, -5.4], operator: "Platform Total" },
        { name: "Egina", coordinates: [6.7, 3.4], operator: "Platform Total" },
        { name: "Erha", coordinates: [4.9, 3.8], operator: "Platform ExxonMobil" }
      ],
      'brazil': [
        { name: "Lula", coordinates: [-39.1, -25.2], operator: "Platform Petrobras" },
        { name: "Buzios", coordinates: [-39.4, -24.8], operator: "Platform Petrobras" },
        { name: "Tupi", coordinates: [-38.8, -24.5], operator: "Platform Petrobras" },
        { name: "Sapinhoa", coordinates: [-40.1, -25.6], operator: "Platform Petrobras" },
        { name: "Marlim", coordinates: [-39.6, -22.4], operator: "Platform Petrobras" }
      ],
      'australia': [
        { name: "North Rankin", coordinates: [116.1, -19.6], operator: "Platform Woodside" },
        { name: "Goodwyn A", coordinates: [115.8, -19.9], operator: "Platform Woodside" },
        { name: "Angel", coordinates: [116.0, -19.5], operator: "Platform Woodside" },
        { name: "Pluto", coordinates: [116.2, -20.0], operator: "Platform Woodside" },
        { name: "Ichthys", coordinates: [115.3, -17.1], operator: "Platform INPEX" }
      ]
    };
    
    // Get platforms for the current region
    const platforms = staticPlatformsByRegion[region.id] || [];
    
    // Get airports for this region
    const airports = staticAirportsByRegion[region.id] || [];
    
    // Combine platforms and airports
    const allLocations = [
      ...enhancePlatforms(platforms, region.name),
      ...enhancePlatforms(airports, region.name)
    ];
    
    if (allLocations.length > 0) {
      console.log(`Adding ${allLocations.length} static locations for ${region.name}`);
      console.log(`- ${platforms.length} platforms`);
      console.log(`- ${airports.length} airports`);
      
      platformManagerRef.current.addPlatformsToMap(allLocations);
      
      // Update the UI state
      setPlatformsLoaded(true);
      setPlatformsVisible(true);
      
      // Mark this region as having static data loaded
      window.staticDataLoaded = region.id;
      console.log(`Static data loaded for ${region.name}`);
    } else {
      console.log(`No static locations defined for ${region.name}`);
    }
  };

  return (
    <div className="fast-planner-container">
      {/* User info display */}
      {isAuthenticated && (
        <div className="user-info" style={{
          position: 'absolute',
          top: '10px',
          right: '20px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
          fontWeight: 'bold'
        }}>
          Logged in as: Duncan Burbury
        </div>
      )}
      
      {/* Region Selector Component */}
      <div className={`region-selector-container ${regionLoading ? 'loading' : ''}`}>
        <RegionSelector
          regions={regions}
          currentRegion={currentRegion}
          onRegionChange={handleRegionChange}
          isLoading={regionLoading}
        />
      </div>
      
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
          }
        }}
        onLoadRigData={loadRigData}
        onToggleChart={togglePlatformsVisibility}
        onLoadCustomChart={() => {}}
        chartsVisible={platformsLoaded ? platformsVisible : null}
        aircraftType={aircraftType}
        onAircraftTypeChange={handleAircraftTypeChange}
        aircraftRegistration={aircraftRegistration}
        onAircraftRegistrationChange={handleAircraftRegistrationChange}
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
        authUserName={userName || "Duncan Burbury"}
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
      />
    </div>
  );
};

export default ModularFastPlannerComponent;