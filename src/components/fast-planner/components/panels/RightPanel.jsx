import React, { useState, useCallback, useImperativeHandle, useEffect } from 'react';
import RightPanelContainer from './RightPanelContainer';
import {
  MainCard,
  SettingsCard,
  PerformanceCard,
  WeatherCard,
  FinanceCard,
  EvacuationCard,
  SARCard,
  SaveFlightCard,
  LoadFlightsCard,
  AutoPlanCard,
  MapLayersCard
} from './cards';
import '../../FastPlannerStyles.css';
import { PanelProvider } from '../../context/PanelContext';
import { useRegion } from '../../context/region'; // Import region context
import FlightAutomationLoader from '../loaders/FlightAutomationLoader';
import FuelSaveBackService from '../../services/FuelSaveBackService';
import FlightLoader from '../../services/FlightLoader';

/**
 * Right Panel Component
 * 
 * Refactored to use a container with individual card components
 * that slide in and out when different tabs are selected.
 * Uses the existing animation system already in the CSS.
 * Region management is now handled by RegionContext.
 */
const RightPanel = React.forwardRef(({
  visible,
  mapManagerRef,
  gulfCoastMapRef,
  weatherLayerRef,
  vfrChartsRef,
  observedWeatherStationsRef,  // NEW: Add observed weather stations ref prop
  platformManagerRef,
  airfieldsVisible,
  fixedPlatformsVisible, // Legacy
  movablePlatformsVisible,
  blocksVisible, // New prop
  basesVisible, // New prop for bases
  fuelAvailableVisible, // New prop
  toggleAirfieldsVisibility,
  toggleFixedPlatformsVisibility, // Legacy
  toggleMovablePlatformsVisibility,
  toggleBlocksVisibility, // New prop
  toggleBasesVisibility, // New prop for bases
  toggleFuelAvailableVisibility, // New prop
  onToggleVisibility,
  onClearRoute,
  onLoadRigData,
  onToggleChart,
  onLoadCustomChart,
  onWaiveAlternatesChange, // 🛩️ VFR OPERATIONS: Callback for alternate route visibility
  waiveAlternates = false, // 🛩️ VFR OPERATIONS: Current waive alternates state
  chartsVisible,
  aircraftType,
  onAircraftTypeChange,
  aircraftRegistration,
  onAircraftRegistrationChange,
  selectedAircraft,
  forceUpdate,
  aircraftsByType,
  aircraftLoading,
  payloadWeight,
  onPayloadWeightChange,
  reserveFuel,
  onReserveFuelChange,
  routeStats,
  alternateRouteData, // Add alternate route data for alternate stop card
  alternateRouteInput, // Add alternate route input for save functionality
  loadedFlightData, // Add loaded flight data for MainCard responsive display
  loadedFuelObject, // 🎯 Stored fuel object to avoid duplicate lookups
  stopCards,
  waypoints,
  onRemoveWaypoint,
  isAuthenticated,
  authUserName,
  rigsLoading,
  onLogin,
  onFlightLoad, // Callback for when a flight is loaded
  toggleWaypointMode, // Function to toggle waypoint mode
  waypointModeActive, // Current waypoint mode state
  // Flight settings props
  deckTimePerStop = 5,
  deckFuelPerStop = 100,
  deckFuelFlow = 400,
  passengerWeight = 220,
  cargoWeight = 0,
  extraFuel = 0,
  araFuel = 0, // 🔧 ADDED: ARA fuel from weather analysis
  approachFuel = 0, // 🔧 ADDED: Approach fuel from weather analysis
  taxiFuel, // 🚨 AVIATION SAFETY: NO DEFAULT - Must come from OSDK fuel policy  
  contingencyFuelPercent, // 🚨 AVIATION SAFETY: NO DEFAULT - Must come from OSDK fuel policy
  reserveMethod = 'fixed',
  onDeckTimeChange = () => {},
  onDeckFuelChange = () => {},
  onDeckFuelFlowChange = () => {},
  onPassengerWeightChange = () => {},
  onCargoWeightChange = () => {},
  onExtraFuelChange = () => {},
  onTaxiFuelChange = () => {},
  onContingencyFuelPercentChange = () => {},
  onReserveMethodChange = () => {},
  // Weather props
  weather = { windSpeed: 15, windDirection: 270 },
  onWeatherUpdate = () => {},
  // Flight ID for weather segments
  currentFlightId = null,
  weatherSegments = null,
  weatherSegmentsHook = null, // Full weather segments hook for layer controls
  // Fuel policy props
  fuelPolicy = null,
  // SAR mode callback
  onSARUpdate,
  // SAR calculation data
  sarData = null,
  // ETD from flight settings (wizard departure time)
  etd = null,
  // 🛩️ HEADER SYNC: Callback for stop cards synchronization
  onStopCardsCalculated = null,
  // 📊 FUEL BREAKDOWN: Callback to show fuel breakdown modal
  onShowFuelBreakdown = null,
  // 🔧 NEW: Callback to receive alternate card data
  onAlternateCardCalculated = null,
  // 🔧 NEW: Alternate card data for fuel save operations
  alternateStopCard = null,
  // ✅ SYNC FIX: Location-specific fuel overrides for stop card synchronization
  locationFuelOverrides = {},
  // 🚫 REFUEL SYNC: Current refuel stops from DetailedFuelBreakdown
  currentRefuelStops = [],
  // ✅ SEGMENT-AWARE: Segment-specific extra fuel handler
  onSegmentExtraFuelChange = () => {},
  // ✅ SEGMENT-AWARE: Function to get current segment information
  getCurrentSegmentInfo = () => [],
  // 🔥 DIRECT CALLBACK: Function to register fuel overrides callback
  onFuelOverridesChanged = null,
  // 🔄 REFUEL SYNC: Callback for refuel stops synchronization
  onRefuelStopsChanged = null,
  // 🌩️ LIVE Weather state synchronization
  onLiveWeatherStateChange = null,
  // 🚨 NUCLEAR RESET: Component key for forcing remounts
  componentKey = 0
}, ref) => {
  // Get current region from context
  const { currentRegion } = useRegion();
  
  // Flight automation loader state
  const [showAutomationLoader, setShowAutomationLoader] = useState(false);
  const [automationFlightData, setAutomationFlightData] = useState(null);
  const [automationProgressCallback, setAutomationProgressCallback] = useState(null);
  
  // Handle automation loader completion
  const handleAutomationComplete = () => {
    console.log('🎉 RightPanel: FlightAutomationLoader completed, hiding loader');
    setShowAutomationLoader(false);
    setAutomationFlightData(null);
  };
  
  // AGGRESSIVE CLEANUP: Reset automation loader when clearing flights
  const resetAutomationLoader = useCallback(() => {
    console.log('🧹 RightPanel: Resetting automation loader state');
    setShowAutomationLoader(false);
    setAutomationFlightData(null);
  }, []);
  
  // Handle saving flight from SaveFlightCard
  const handleSaveFlightSubmit = async (flightData) => {
    console.log('Save flight data from card:', flightData);
    
    // 🎯 ALWAYS SHOW LOADER: Show loader for ALL saves (automation or regular)
    console.log('🚀 RIGHTPANEL: Showing loader for save operation');
    
    // Extract flight details for the loader
    const departureIcao = waypoints?.[0]?.name || 'DEP';
    const destinationIcao = waypoints?.[waypoints.length - 1]?.name || 'DEST';
    const flightNumber = flightData?.flightName || 'Flight Plan';
    
    // Store flight data for loader
    setAutomationFlightData({
      flightNumber,
      departureIcao,
      destinationIcao
    });
    
    // Show automation loader immediately for all saves
    setShowAutomationLoader(true);
    
    // Send initial "saving flight" message (setup callback if needed)
    const initialMessage = flightData.runAutomation ? 
      'Saving flight to Palantir...' : 
      'Saving flight to Palantir...';
    
    const progressCallback = (progressUpdate) => {
      console.log('Progress update:', progressUpdate);
      setAutomationProgressCallback(() => progressCallback);
    };
    
    // Set up the progress callback
    setAutomationProgressCallback(() => progressCallback);
    
    // Send initial progress update
    progressCallback({
      type: 'step',
      message: initialMessage,
      detail: `Creating flight "${flightNumber}" with ${waypoints?.length || 0} waypoints`,
      progress: 5
    });
    
    // Import the PalantirFlightService
    try {
      const PalantirFlightService = (await import('../../services/PalantirFlightService')).default;
      
      // Update loading indicator if available
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Saving flight to Palantir...');
      }
      
      // Get waypoint locations for the API - ONLY include landing stops, NOT navigation waypoints
      // DEBUG: Check waypoint structure to understand types
      waypoints.forEach((wp, index) => {
        console.log(`Waypoint ${index} (${wp.name}):`, {
          name: wp.name,
          type: wp.type,
          pointType: wp.pointType,
          isWaypoint: wp.isWaypoint,
          coords: wp.coords,
          id: wp.id
        });
      });
      
      const locations = waypoints
        .filter(wp => {
          // Use the same logic as the left panel to determine waypoint type
          const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
          
          console.log(`Filtering ${wp.name}: isWaypoint=${wp.isWaypoint}, type=${wp.type}, classified as waypoint=${isWaypointType}`);
          
          // Only include in locations if it's NOT a waypoint (i.e., it's a landing stop)
          return !isWaypointType;
        })
        .map(wp => {
          // Clean up location names - trim whitespace to avoid issues
          // COORDINATE SAFETY: Check if waypoint has valid coordinates before accessing them
          if (wp.name && wp.name.trim()) {
            return wp.name.trim();
          } else if (wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2 && 
                     typeof wp.coords[0] === 'number' && typeof wp.coords[1] === 'number') {
            return `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
          } else if (wp.coordinates && Array.isArray(wp.coordinates) && wp.coordinates.length === 2 && 
                     typeof wp.coordinates[0] === 'number' && typeof wp.coordinates[1] === 'number') {
            return `${wp.coordinates[1].toFixed(6)},${wp.coordinates[0].toFixed(6)}`;
          } else {
            console.warn('🚨 SAVE FLIGHT: Waypoint has invalid coordinates:', wp);
            return wp.name || 'Invalid Waypoint';
          }
        });
      
      // DEBUG: Check waypoint structure to understand types
      console.log('Debug waypoint types:', waypoints.map((wp, index) => ({
        name: wp.name,
        type: wp.type,
        isWaypoint: wp.isWaypoint,
        isStop: wp.isStop,
        allProperties: Object.keys(wp)
      })));
      
      // 🎯 AIRCRAFT SAVE DEBUG: Check what aircraft data we have available
      console.log('🎯 AIRCRAFT SAVE DATA ANALYSIS:', {
        selectedAircraft: selectedAircraft,
        registration: selectedAircraft?.registration,
        rawRegistration: selectedAircraft?.rawRegistration, 
        assetId: selectedAircraft?.assetId,
        id: selectedAircraft?.id,
        aircraftId: selectedAircraft?.aircraftId,
        allKeys: Object.keys(selectedAircraft || {})
      });
      
      // 🎯 AIRCRAFT FIX: Use aircraftId (tail number) only - assetIdx removed to fix save failures
      const aircraftTailNumber = selectedAircraft?.assetIdentifier ||  // ✅ PRIMARY: Clean tail number like "N109DR"
                                 selectedAircraft?.rawRegistration ||  // ✅ Backup: Raw tail number like "N123AB"
                                 selectedAircraft?.registration ||     // ✅ Backup: Full registration (may include description)
                                 "UNKNOWN";                             // ❌ Fallback
      
      console.log('🎯 AIRCRAFT DATA FOR SAVE:', {
        aircraftId: aircraftTailNumber,              // STRING: "N123AB" 
        aircraftIdType: typeof aircraftTailNumber,
        tailNumberSource: selectedAircraft?.assetIdentifier ? 'assetIdentifier' :
                         selectedAircraft?.rawRegistration ? 'rawRegistration' :
                         selectedAircraft?.registration ? 'registration' : 'fallback',
        aircraftIdValid: aircraftTailNumber !== "UNKNOWN"
      });
      
      // 🎯 FUEL OBJECT FIX: Get existing fuel object ID early for API params
      const existingFuelObjectId = loadedFuelObject?.$primaryKey || null;
      console.log('💾 FUEL OBJECT ID: Retrieved for reuse:', existingFuelObjectId);
      
      // Prepare waypoints with leg structure
      const waypointsWithLegs = waypoints.map((wp, index) => {
        // 🔍 DEBUG: Log waypoint classification for debugging
        console.log(`🔍 WAYPOINT ${index} (${wp.name}):`, {
          pointType: wp.pointType,
          isWaypoint: wp.isWaypoint,
          type: wp.type,
          hasClassification: !!(wp.pointType || wp.isWaypoint !== undefined || wp.type)
        });
        
        return {
          legIndex: wp.legIndex || 0,
          name: wp.name || `Waypoint ${index + 1}`,
          coords: wp.coords,
          id: wp.id,
          // Preserve type classification properties for Palantir waypoint processing
          type: wp.type,
          pointType: wp.pointType,
          isWaypoint: wp.isWaypoint
        };
      });
      
      // Get the current region for the flight
      const regionCode = currentRegion?.osdkRegion || currentRegion?.id || "NORWAY"; // Fallback to NORWAY only if no region
      
      // Prepare parameters for the Palantir API
      // 🎯 FLIGHT SAVE VALIDATION: Log save operation type
      const isUpdate = currentFlightId && currentFlightId.trim() !== '';
      console.log('🎯 FLIGHT SAVE OPERATION:', {
        operation: isUpdate ? 'UPDATE' : 'CREATE',
        currentFlightId: currentFlightId,
        hasCurrentFlightId: !!currentFlightId,
        flightIdLength: currentFlightId?.length || 0
      });
      
      if (!isUpdate) {
        console.warn('⚠️ CREATING NEW FLIGHT instead of updating - this may cause waypoint duplication');
      } else {
        console.log('✅ UPDATING EXISTING FLIGHT - waypoints should be preserved');
      }
      
      const apiParams = {
        // CRITICAL FIX: Include flight ID for updates instead of always creating new flights
        ...(currentFlightId && { flightId: currentFlightId }),
        
        // Basic parameters
        flightName: (() => {
          // 🔧 PRESERVE EXISTING FLIGHT NAMES: Check if this is an existing flight update
          if (currentFlightId && loadedFlightData) {
            // For existing flights, preserve the original name unless explicitly changed
            const existingFlightName = loadedFlightData.flightNumber || 
                                     loadedFlightData.flightName || 
                                     loadedFlightData.name || 
                                     loadedFlightData.title || 
                                     loadedFlightData.displayName;
            
            if (existingFlightName && existingFlightName.trim()) {
              console.log('🔧 SAVE: Preserving existing flight name:', existingFlightName);
              return existingFlightName.trim();
            }
          }
          
          // For new flights or when no existing name found, use provided name
          console.log('🔧 SAVE: Using provided flight name:', flightData.flightName);
          return flightData.flightName;
        })(),
        aircraftRegion: regionCode, // Use current region
        aircraftId: aircraftTailNumber,      // ✅ Tail number like "N123AB"
        // NOTE: Testing without assetIdx field for wizard
        region: regionCode, // Use current region
        etd: new Date(flightData.etd).toISOString(), // Ensure proper ISO format
        // 🧙‍♂️ DEBUG: Log ETD conversion for debugging
        ...(console.log('🧙‍♂️ SAVE DEBUG: flightData.etd =', flightData.etd) || {}),
        ...(console.log('🧙‍♂️ SAVE DEBUG: new Date(flightData.etd) =', new Date(flightData.etd)) || {}),
        ...(console.log('🧙‍♂️ SAVE DEBUG: toISOString() =', new Date(flightData.etd).toISOString()) || {}),
        locations: locations,
        alternateLocation: flightData.alternateLocation || "",
        
        // Structured waypoints for the new API
        waypoints: waypointsWithLegs,
        
        // CRITICAL FIX: Include wind data in saved flight - use MainFlightObjectFp2 field names
        avgWindSpeed: weather?.windSpeed || 0,
        avgWindDirection: weather?.windDirection || 0,
        windSpeed: weather?.windSpeed || 0,  // Keep both for compatibility
        windDirection: weather?.windDirection || 0,
        
        // Crew member IDs
        captainId: flightData.captainId || null,
        copilotId: flightData.copilotId || null,
        medicId: flightData.medicId || null,
        soId: flightData.soId || null,
        rswId: flightData.rswId || null,
        
        // 🎯 FUEL OBJECT: Include existing fuel object ID for updates (not new creation)
        ...(existingFuelObjectId && { fuelPlanId: existingFuelObjectId }),
        
        // 🛩️ FUEL POLICY: Add fuel policy UUID for FastPlanner-created flights
        policyUuid: (() => {
          // Priority 1: User-selected fuel policy (if user overrode it)
          if (flightData.policyUuid) {
            console.log('🛩️ SAVE FLIGHT: Using user-selected fuel policy:', flightData.policyUuid);
            return flightData.policyUuid;
          }
          
          // Priority 2: Current fuel policy from state (if user selected one)
          if (fuelPolicy?.currentPolicy?.uuid) {
            console.log('🛩️ SAVE FLIGHT: Using current fuel policy:', fuelPolicy.currentPolicy.uuid, fuelPolicy.currentPolicy.name);
            return fuelPolicy.currentPolicy.uuid;
          }
          
          // Priority 3: Aircraft default fuel policy
          if (selectedAircraft?.defaultFuelPolicyId) {
            console.log('🛩️ SAVE FLIGHT: Using aircraft default fuel policy (by name):', selectedAircraft.defaultFuelPolicyId);
            // Need to find the UUID for the aircraft's default policy name
            const aircraftPolicy = fuelPolicy?.availablePolicies?.find(p => p.name === selectedAircraft.defaultFuelPolicyId);
            if (aircraftPolicy) {
              console.log('🛩️ SAVE FLIGHT: Found aircraft policy UUID:', aircraftPolicy.uuid);
              return aircraftPolicy.uuid;
            }
          }
          
          console.warn('🛩️ SAVE FLIGHT: No fuel policy UUID found - this will cause issues!');
          return null;
        })()
      };
      
      console.log('Sending flight data to Palantir:', apiParams);
      
      // Call the service to create the flight
      // 🧙‍♂️ DEBUG: Log final API params being sent to Palantir
      console.log('🧙‍♂️ SAVE DEBUG: Final apiParams.etd being sent to Palantir:', apiParams.etd);
      console.log('🧙‍♂️ SAVE DEBUG: Full apiParams object:', apiParams);
      
      const result = await PalantirFlightService.createFlight(apiParams);
      console.log('Flight creation result:', result);
      
      // Check if the result is successful
      if (PalantirFlightService.isSuccessfulResult(result)) {
        // For updates, use the existing flight ID; for creates, extract from result
        const flightId = currentFlightId || PalantirFlightService.extractFlightId(result);
        
        console.log('🔍 FLIGHT ID DEBUG:', {
          currentFlightId: currentFlightId,
          extractedFlightId: PalantirFlightService.extractFlightId(result),
          finalFlightId: flightId,
          isUpdate: !!currentFlightId
        });
        
        console.log(`Flight ${currentFlightId ? 'updated' : 'created'} successfully with ID: ${flightId}`);
        
        // 🎯 PROGRESS UPDATE: Show save success in loader (for both automation and regular saves)
        if (automationProgressCallback) {
          automationProgressCallback({
            type: 'step',
            message: `Flight "${flightData.flightName}" saved successfully`,
            detail: flightData.runAutomation 
              ? `Flight ID: ${flightId} - preparing to run automation`
              : `Flight ID: ${flightId} - save complete`,
            progress: flightData.runAutomation ? 15 : 50
          });
        }
        
        // Show success message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Flight "${flightData.flightName}" created successfully!`, 'success');
        }
        
        // 💾 FUEL SAVE-BACK: Save fuel data to Palantir after successful flight save
        console.log('🔍 DEBUG: Reached fuel save section. Flight ID:', flightId, 'Stop cards:', stopCards?.length);
        
        try {
          console.log('💾 FUEL SAVE-BACK: Starting fuel save for flight ID:', flightId);
          
          // Import FuelSaveBackService
          const FuelSaveBackService = (await import('../../services/FuelSaveBackService')).default;
          
          // Gather current fuel data from props and context
          const currentFlightSettings = {
            extraFuel: extraFuel || 0,
            extraFuelReason: '', // Could be extracted from UI if available
            araFuel: araFuel || 0,
            approachFuel: approachFuel || 0,
            taxiFuel: taxiFuel || 0,
            deckFuelPerStop: deckFuelPerStop || 0,
            contingencyFuelPercent: contingencyFuelPercent || 0,
            passengerWeight: passengerWeight || 0,
            cargoWeight: cargoWeight || 0,
            reserveFuel: reserveFuel || 0
          };
          
          console.log('💾 FUEL SAVE DEBUG: About to save fuel data:', {
            flightId: flightId,
            extraFuel: extraFuel,
            currentFlightSettingsExtraFuel: currentFlightSettings.extraFuel,
            stopCardsCount: stopCards?.length
          });
          
          const currentWeatherFuel = {
            araFuel: araFuel || 0,
            approachFuel: approachFuel || 0
          };
          
          // 🎯 FUEL SAVE-BACK: Using stored fuel object ID (already retrieved above)
          console.log('💾 FUEL SAVE-BACK: Using stored fuel object ID:', existingFuelObjectId);
          console.log('💾 FUEL SAVE-BACK: Current data being saved:', {
            flightId,
            stopCardsCount: stopCards?.length,
            extraFuel: currentFlightSettings.extraFuel,
            stopCards: stopCards?.map(card => ({
              name: card?.name,
              totalFuel: card?.totalFuel,
              extraFuel: card?.extraFuel
            }))
          });
          
          // Use the existing method but pass the known fuel object ID
          const fuelSaveResult = await FuelSaveBackService.saveFuelDataWithExistingId(
            flightId,
            stopCards,
            currentFlightSettings,
            currentWeatherFuel,
            fuelPolicy?.currentPolicy || null,
            routeStats,
            selectedAircraft,
            existingFuelObjectId,  // Pass the stored fuel object ID to prevent search
            alternateStopCard  // 🔧 NEW: Pass alternate card data for fuel save operations
          );
          
          console.log('✅ FUEL SAVE-BACK: Fuel data saved successfully:', {
            fuelObjectUuid: fuelSaveResult?.fuelObjectUuid,
            updated: fuelSaveResult?.updated,
            message: fuelSaveResult?.message
          });
          
        } catch (fuelSaveError) {
          console.error('❌ FUEL SAVE-BACK: Failed to save fuel data:', fuelSaveError);
          // Don't block the main flow if fuel save fails
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(
              'Flight saved, but fuel data save failed. Check console for details.',
              'warning',
              4000
            );
          }
        }
        
        // Run automation if enabled
        if (flightData.runAutomation && flightId && flightId !== 'Unknown ID') {
          console.log('Running automation for flight ID:', flightId);
          
          // Import and use AutomationService
          try {
            const AutomationService = (await import('../../services/AutomationService')).default;
            
            // Loader already shown at the beginning of save process
            
            // Update loading indicator for automation (fallback)
            if (window.LoadingIndicator) {
              window.LoadingIndicator.updateStatusIndicator('Running flight automation...');
            }
            
            // Add a slight delay to ensure flight creation is fully processed
            setTimeout(async () => {
              // 🧹 CRITICAL FIX: Clear flight state before automation to ensure clean reload
              console.log('🧹 AUTOMATION PREP: Clearing flight state before automation to prevent contamination');
              if (onFlightLoad) {
                // Pass null to trigger complete state reset (same as closing flight)
                console.log('🧹 AUTOMATION PREP: Calling onFlightLoad(null) to clear state');
                onFlightLoad(null);
                
                // Brief delay to ensure state clearing completes
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log('🧹 AUTOMATION PREP: State clearing complete, proceeding with automation');
              }
              
              try {
                const automationResult = await AutomationService.runAutomation(flightId, automationProgressCallback);
                console.log('Automation successful!', automationResult);
                
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator('Flight automation completed successfully', 'success');
                }
                
                // AUTO-RELOAD: Load the flight back into the planner after automation completes
                console.log('🔄 AUTO-RELOAD: Starting auto-reload process...');
                console.log('🔄 AUTO-RELOAD: Flight ID:', flightId);
                console.log('🔄 AUTO-RELOAD: onFlightLoad available:', typeof onFlightLoad);
                console.log('🔄 AUTO-RELOAD: waypointModeActive:', waypointModeActive);
                console.log('🔄 AUTO-RELOAD: toggleWaypointMode available:', typeof toggleWaypointMode);
                
                // Switch to stops mode if currently in waypoint mode (for proper display)
                if (waypointModeActive && toggleWaypointMode) {
                  console.log('🔄 AUTO-RELOAD: Switching from waypoint mode to stops mode...');
                  toggleWaypointMode();
                }
                
                // Load all flights to find our newly created flight
                try {
                  const FlightService = (await import('../../services/FlightService')).default;
                  const currentRegionCode = currentRegion?.osdkRegion || "GULF OF MEXICO";
                  const flightsResult = await FlightService.loadFlights(currentRegionCode, 200);
                  
                  if (flightsResult.success && flightsResult.flights) {
                    console.log('🔄 AUTO-RELOAD: Loaded flights list, searching for flight ID:', flightId);
                    
                    // Find our specific flight by ID
                    const targetFlight = flightsResult.flights.find(f => f.id === flightId);
                    
                    if (targetFlight) {
                      console.log('🔄 AUTO-RELOAD: Target flight object keys:', Object.keys(targetFlight));
                      console.log('🔄 AUTO-RELOAD: Raw flight available:', !!targetFlight._rawFlight);
                      
                      // DEBUG: Check what's in the raw flight object
                      if (targetFlight._rawFlight) {
                        const rawFlight = targetFlight._rawFlight;
                        console.log('🔄 AUTO-RELOAD: Raw flight object keys:', Object.keys(rawFlight));
                        console.log('🔄 AUTO-RELOAD: alternateSplitPoint:', rawFlight.alternateSplitPoint);
                        console.log('🔄 AUTO-RELOAD: alternateName:', rawFlight.alternateName);
                        console.log('🔄 AUTO-RELOAD: alternateFullRouteGeoShape:', !!rawFlight.alternateFullRouteGeoShape);
                        console.log('🔄 AUTO-RELOAD: alternateLegIds:', rawFlight.alternateLegIds);
                        console.log('🔄 AUTO-RELOAD: alternateGeoPoint:', rawFlight.alternateGeoPoint);
                        
                        // Check wind data too
                        console.log('🌬️ AUTO-RELOAD: Wind data check:');
                        console.log('🌬️ AUTO-RELOAD: avgWindSpeed:', rawFlight.avgWindSpeed);
                        console.log('🌬️ AUTO-RELOAD: avgWindDirection:', rawFlight.avgWindDirection);
                        console.log('🌬️ AUTO-RELOAD: windSpeed:', rawFlight.windSpeed);
                        console.log('🌬️ AUTO-RELOAD: windDirection:', rawFlight.windDirection);
                        console.log('🌬️ AUTO-RELOAD: ALL WIND FIELDS:', {
                          avgWindSpeed: rawFlight.avgWindSpeed,
                          avgWindDirection: rawFlight.avgWindDirection,
                          windSpeed: rawFlight.windSpeed,
                          windDirection: rawFlight.windDirection
                        });
                      }
                      
                      if (onFlightLoad) {
                        // ✅ CRITICAL FIX: Use the same handleLoadFlight function that manual loading uses
                        console.log('🔄 AUTOMATION: Using unified handleLoadFlight (same as manual loading)');
                        console.log('🔄 AUTOMATION: This should use FlightLoader.extractFlightData and unified fuel policy system');
                        console.log('🔄 AUTOMATION: Target flight aircraft ID:', targetFlight.aircraftId);
                        console.log('🔄 AUTOMATION: Target flight has _rawFlight:', !!targetFlight._rawFlight);
                        handleLoadFlight(targetFlight);
                        
                        // Final success message
                        setTimeout(() => {
                          if (window.LoadingIndicator) {
                            window.LoadingIndicator.updateStatusIndicator(`Flight "${flightData.flightName}" saved, automated, and loaded successfully!`, 'success');
                          }
                        }, 5000); // Wait longer to show after layers are created
                        
                        // PROFESSIONAL SOLUTION: Listen for actual data-ready event instead of timeouts
                        console.log('🎯 PROFESSIONAL: Setting up weather-data-ready event listener for automation');
                        
                        const handleWeatherDataReady = (event) => {
                          console.log('🎯 PROFESSIONAL: Received weather-data-ready event:', event.detail);
                          
                          const { weatherSegments, flightAlternateData } = event.detail;
                          const hasMap = window.mapManager?.map || window.mapManagerRef?.current?.map;
                          
                          if (weatherSegments && weatherSegments.length > 0 && hasMap) {
                            console.log('🚁 AUTOMATION HYBRID: All data ready, creating hybrid weather display');
                            
                            // Split segments into airports vs rigs
                            const airportSegments = weatherSegments.filter(segment => !segment.isRig);
                            const rigSegments = weatherSegments.filter(segment => segment.isRig === true);
                            
                            console.log(`🚁 AUTOMATION HYBRID: Found ${airportSegments.length} airports and ${rigSegments.length} rigs`);
                            
                            // DISABLED: Force-enable event dispatch - let user control weather layers
                            // window.dispatchEvent(new CustomEvent('weather-circles-force-enabled'));
                            console.log('🚫 DISABLED: Weather circles force-enable via automation');
                            
                            // DISABLED: Auto-create weather circles - let user manually enable
                            console.log('🚫 DISABLED: Auto-creation of weather circles via automation');
                            console.log('🚫 Available data:', {
                              airportSegments: airportSegments.length,
                              rigSegments: rigSegments.length,
                              message: 'User can manually enable weather circles in Map Layers panel'
                            });
                            // if (airportSegments.length > 0) {
                            //   import('../../modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                            //     // Clean up existing layer
                            //     if (window.currentWeatherCirclesLayer) {
                            //       try {
                            //         window.currentWeatherCirclesLayer.removeWeatherCircles();
                            //         console.log('🎯 AUTOMATION HYBRID: Cleaned up existing weather layer');
                            //       } catch (e) { 
                            //         console.warn('🎯 AUTOMATION HYBRID: Cleanup warning (non-fatal):', e.message);
                            //       }
                            //     }
                            //     
                            //     // Create new layer with airport data only
                            //     console.log('🎯 AUTOMATION HYBRID: Creating WeatherCirclesLayer with', airportSegments.length, 'airports');
                            //     const weatherCirclesLayer = new WeatherCirclesLayer(hasMap);
                            //     weatherCirclesLayer.addWeatherCircles(airportSegments); // Only airports
                            //     window.currentWeatherCirclesLayer = weatherCirclesLayer;
                            //     console.log('🎯 AUTOMATION HYBRID: ✅ Weather circles created for airports via automation!');
                            //     
                            //   }).catch(error => {
                            //     console.error('🎯 AUTOMATION HYBRID: Error creating weather circles:', error);
                            //   });
                            // }
                            
                            // 2. DISABLED: Old separate rig graphics - now using unified weather arrows
                            console.log(`🚁 AUTOMATION HYBRID: Unified system handles ${rigSegments.length} rigs automatically`);
                            // The WeatherCirclesLayer auto-creates arrows for ALL locations including rigs
                            
                            // Remove the event listener as it's no longer needed
                            window.removeEventListener('weather-data-ready', handleWeatherDataReady);
                          } else {
                            console.warn('🎯 PROFESSIONAL: Data not ready yet:', {
                              hasWeatherSegments: !!(weatherSegments && weatherSegments.length > 0),
                              hasMap: !!hasMap,
                              weatherCount: weatherSegments?.length || 0
                            });
                          }
                        };
                        
                        // Set up the event listener - Working system for automation
                        window.addEventListener('weather-data-ready', handleWeatherDataReady);
                        console.log('🎯 AUTOMATION: Weather data ready listener enabled for automation');
                        
                        // Clean up listener after reasonable time (failsafe)
                        setTimeout(() => {
                          window.removeEventListener('weather-data-ready', handleWeatherDataReady);
                          console.log('🎯 AUTOMATION: Cleaned up weather-data-ready event listener');
                        }, 60000); // 60 seconds failsafe
                      }
                      
                    } else {
                      console.error('🔄 AUTO-RELOAD: Flight not found in loaded flights list. Flight ID:', flightId);
                      if (window.LoadingIndicator) {
                        window.LoadingIndicator.updateStatusIndicator('Automation completed but flight not found for auto-reload', 'warning');
                      }
                    }
                  } else {
                    console.error('🔄 AUTO-RELOAD: Failed to load flights list:', flightsResult.error);
                    if (window.LoadingIndicator) {
                      window.LoadingIndicator.updateStatusIndicator('Automation completed but auto-reload failed', 'warning');
                    }
                  }
                } catch (loadError) {
                  console.error('🔄 AUTO-RELOAD: Error loading flights:', loadError);
                  if (window.LoadingIndicator) {
                    window.LoadingIndicator.updateStatusIndicator('Automation completed but auto-reload failed', 'warning');
                  }
                }
                
              } catch (automationError) {
                console.error('Automation failed:', automationError);
                
                // Enhanced automation error handling
                let automationErrorMessage = 'Flight saved successfully, but automation failed';
                let automationAdvice = '';
                
                if (automationError.message?.includes('401') || automationError.message?.includes('unauthorized')) {
                  automationAdvice = 'Authentication expired during automation. Try logging in again and running automation manually.';
                } else if (automationError.message?.includes('timeout')) {
                  automationAdvice = 'Automation timed out. The flight was saved - you can try running automation again manually.';
                } else if (automationError.message?.includes('not found')) {
                  automationAdvice = 'Automation service temporarily unavailable. Your flight was saved successfully.';
                } else {
                  automationAdvice = `Automation error: ${automationError.message}. Your flight was saved - try running automation manually from the flight list.`;
                }
                
                const fullAutomationError = [
                  `⚠️ ${automationErrorMessage}`,
                  '',
                  automationAdvice,
                  '',
                  'The flight is saved and can be found in Load Flights. You can run automation manually if needed.'
                ].join('\n');
                
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(fullAutomationError, 'warning');
                }
                
                // Log automation error details
                console.group('⚠️ AUTOMATION ERROR DETAILS');
                console.error('Automation error:', automationError);
                console.log('Flight was saved successfully with ID:', flightId);
                console.log('User can run automation manually');
                console.groupEnd();
              } finally {
                // Note: Loader will be hidden by onComplete callback from FlightAutomationLoader
                console.log('🚀 RIGHTPANEL: Automation finally block (loader will be hidden by onComplete callback)');
              }
            }, 1000);
            
          } catch (importError) {
            console.error('Failed to import AutomationService:', importError);
            // Hide automation loader on import error
            setShowAutomationLoader(false);
            setAutomationFlightData(null);
          }
        } else if (flightData.runAutomation && (!flightId || flightId === 'Unknown ID')) {
          console.log('Automation requested but no valid flight ID available');
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator('Flight saved but automation skipped - no valid flight ID', 'warning');
          }
        } else if (!flightData.runAutomation) {
          // 🎯 NON-AUTOMATION SAVE: Complete the loader for regular saves AND reload flight data
          console.log('Flight saved successfully without automation - reloading flight data');
          
          // 🔄 RELOAD: Load the saved flight to refresh stop cards (same as automation path)
          try {
            const FlightService = (await import('../../services/FlightService')).default;
            const currentRegionCode = currentRegion?.osdkRegion || "GULF OF MEXICO";
            const flightsResult = await FlightService.loadFlights(currentRegionCode, 200);
            
            if (flightsResult.success && flightsResult.flights) {
              console.log('🔄 NON-AUTOMATION RELOAD: Loaded flights list, searching for flight ID:', flightId);
              
              // Find our specific flight by ID
              const targetFlight = flightsResult.flights.find(f => f.id === flightId);
              
              if (targetFlight) {
                console.log('🔄 NON-AUTOMATION RELOAD: Found flight, reloading to refresh stop cards');
                handleLoadFlight(targetFlight);
              } else {
                console.warn('🔄 NON-AUTOMATION RELOAD: Could not find saved flight in list');
              }
            }
          } catch (reloadError) {
            console.error('🔄 NON-AUTOMATION RELOAD: Failed to reload flight data:', reloadError);
          }
          
          if (automationProgressCallback) {
            // Show final completed step (this will auto-hide the loader)
            automationProgressCallback({
              type: 'completed',
              message: `Flight "${flightData.flightName}" saved to Palantir`,
              detail: `Flight successfully created with ID: ${flightId}`,
              progress: 100
            });
          }
        }
        
        // Return to main card after successful save (and automation if enabled)
        setTimeout(() => {
          handleCardChange('main');
        }, flightData.runAutomation ? 3000 : 1000); // Wait longer if automation is running
      } else {
        console.error('Invalid response from server:', result);
        throw new Error('Flight creation failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      
      // Enhanced error handling with detailed context
      const PalantirFlightService = (await import('../../services/PalantirFlightService')).default;
      const baseErrorMessage = PalantirFlightService.formatErrorMessage(error);
      
      // Add context-specific guidance based on the error type
      let enhancedMessage = baseErrorMessage;
      let recoveryAdvice = '';
      
      // Check what type of operation failed
      const operationType = currentFlightId ? 'update' : 'create';
      const hasAutomation = flightData.runAutomation;
      
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        recoveryAdvice = '→ Try logging out and back in to refresh your authentication';
      } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        recoveryAdvice = `→ Check: aircraft selected (${selectedAircraft?.registration || 'none'}), valid waypoints (${waypoints?.length || 0} total)`;
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        recoveryAdvice = '→ Check your internet connection and try again';
      } else if (error.message?.includes('not found') || error.message?.includes('404')) {
        recoveryAdvice = '→ The API may be temporarily unavailable - try again in a few minutes';
      } else {
        // Generic recovery advice based on operation
        if (operationType === 'update') {
          recoveryAdvice = '→ Try loading the flight again and making your changes';
        } else {
          recoveryAdvice = '→ Try using simpler flight data or contact support if the problem persists';
        }
      }
      
      // Create comprehensive error message
      const contextInfo = [
        `Operation: ${operationType} flight${hasAutomation ? ' with automation' : ''}`,
        `Aircraft: ${selectedAircraft?.registration || 'Not selected'}`,
        `Waypoints: ${waypoints?.length || 0}`,
        `Region: ${currentRegion?.name || 'Unknown'}`
      ].join(' | ');
      
      const fullErrorMessage = [
        `❌ Flight ${operationType} failed`,
        '',
        baseErrorMessage,
        '',
        recoveryAdvice,
        '',
        `Context: ${contextInfo}`
      ].join('\n');
      
      // Update loading indicator with comprehensive error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(fullErrorMessage, 'error');
      }
      
      // 🚨 SAVE ERROR: Send error to loader (for both automation and regular saves)
      if (automationProgressCallback) {
        automationProgressCallback({
          type: 'error',
          message: `Flight ${operationType} failed`,
          detail: baseErrorMessage,
          progress: 0,
          error
        });
      }
      
      // Log detailed error information for debugging
      console.group('🚨 FLIGHT SAVE ERROR DETAILS');
      console.error('Original error:', error);
      console.log('Operation type:', operationType);
      console.log('Has automation:', hasAutomation);
      console.log('Flight data:', flightData);
      console.log('Selected aircraft:', selectedAircraft);
      console.log('Waypoints count:', waypoints?.length);
      console.log('Current region:', currentRegion);
      console.groupEnd();
      
      // Note: Don't hide automation loader here - let the error callback handle it
    }
  };
  
  // Handle cancel from LoadFlightsCard
  const handleLoadFlightsCancel = () => {
    // Switch back to main card
    handleCardChange('main');
  };
  
  // Handle loading a flight from LoadFlightsCard or FlightWizard
  const handleLoadFlight = (flight) => {
    console.log('🟠 RIGHTPANEL LOAD: Load flight data from card:', flight);
    console.log('🟠 RIGHTPANEL LOAD: Raw flight available:', !!flight._rawFlight);
    
    // 🧹 CRITICAL: Clear all old weather graphics before loading new flight
    console.log('🧹 FLIGHT LOAD: Clearing old weather graphics');
    if (window.clearRigWeatherGraphics) {
      window.clearRigWeatherGraphics();
    }
    
    try {
      // 🛩️ UNIFIED EXTRACTION: Use centralized FlightLoader service
      const flightData = FlightLoader.extractFlightData(flight);
      
      console.log('🛩️ FLIGHT LOADER: Extracted flight data successfully:', {
        flightId: flightData.flightId,
        policyUuid: flightData.policyUuid,
        fuelPlanId: flightData.fuelPlanId,
        waypointCount: flightData.waypoints.length
      });
      
      // 🛩️ FUEL POLICY: Resolve and apply fuel policy using unified system
      const policyResolution = FlightLoader.resolveFuelPolicy(flightData, fuelPolicy, selectedAircraft);
      
      if (policyResolution.success) {
        console.log(`🛩️ FLIGHT LOADER: Fuel policy resolved from ${policyResolution.source}:`, policyResolution.policy.name);
        FlightLoader.applyFuelPolicy(policyResolution, fuelPolicy);
      } else {
        console.warn('🛩️ FLIGHT LOADER: No suitable fuel policy found - will use region defaults');
      }
      
      console.log('🛩️ FLIGHT LOADER: Processed flight data for loading:', flightData);
      
      // Call the parent's flight loading handler if available
      if (onFlightLoad) {
        console.log('🟠 RIGHTPANEL LOAD: About to call onFlightLoad (FastPlannerApp.handleFlightLoad)');
        console.log('🟠 RIGHTPANEL LOAD: Flight data being passed:', flightData);
        onFlightLoad(flightData);
      } else {
        console.error('🟠 RIGHTPANEL LOAD: onFlightLoad not available!');
      }
      
      // 🎯 CENTRALIZED: Use AppStateManager for coordinated camera control
      console.log('🎯 RightPanel: Using centralized camera control');
      
      // 🎬 NEW: RightPanel no longer controls map transitions
      // All map state changes now handled by AppStateManager in FastPlannerApp.handleFlightLoad()
      console.log('🎬 RightPanel: Flight loading delegated to FastPlannerApp AppStateManager integration');
      console.log('🎬 RightPanel: No manual map control - state synchronization handled centrally');
      
      // STEP 2: Flight loading happens here (in the main flow) between style change and angle application
      
      // 🚁 DISABLED: Old separate rig weather system - now using unified weather arrows
      // The WeatherCirclesLayer now automatically adds arrows to ALL weather circles (airports, rigs, alternates)
      console.log('🚁 UNIFIED: Using unified weather arrow system (no separate rig weather needed)');
      
      // Update loading indicator
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Loaded flight: ${flight.name}`, 
          'success'
        );
      }
      
      // 🎯 SMART EDIT: Emit flight-loaded event for edit button detection
      setTimeout(() => {
        const flightLoadedEvent = new CustomEvent('flight-loaded', {
          detail: { flightData, flightName: flight.name }
        });
        window.dispatchEvent(flightLoadedEvent);
        console.log('🎯 SMART EDIT: Emitted flight-loaded event for:', flight.name);
      }, 1200); // Wait for satellite mode to complete
      
    } catch (error) {
      console.error('Error processing flight data:', error);
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to load flight: ${error.message}`, 
          'error'
        );
      }
    }
    
    // ✅ RE-ENABLED: Return to main card after loading flight to show stop cards
    setTimeout(() => {
      handleCardChange('main');
    }, 500);
  };
  
  /**
   * Extract waypoints from flight data, separating them from stops
   * This addresses the core challenge of waypoint vs stop separation
   */
  // extractWaypointsFromFlight function moved to FlightLoader service for centralization
  
  // Handle cancel from SaveFlightCard
  const handleSaveFlightCancel = () => {
    // Switch back to main card
    handleCardChange('main');
  };

  // 🛩️ SIMPLE SAVE: Direct save without popup - replaces SaveFlightCard workflow
  const handleDirectSave = async () => {
    console.log('🛩️ DIRECT SAVE: Starting simple save without popup');
    
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Cannot save: Missing aircraft or waypoints', 'error', 3000);
      }
      return;
    }

    // Generate default flight name if not already loaded
    const defaultFlightName = loadedFlightData?.name || 
                             loadedFlightData?.flightName || 
                             `Fast Planner Flight ${new Date().toLocaleDateString()}`;

    // Generate default ETD (1 hour from now)
    const defaultETD = new Date();
    defaultETD.setHours(defaultETD.getHours() + 1);

    // Create flight data with simple defaults
    const flightData = {
      flightName: defaultFlightName,
      etd: defaultETD.toISOString(),
      captainId: null,
      copilotId: null,
      medicId: null,
      soId: null,
      rswId: null,
      alternateLocation: alternateRouteData?.name || null,
      runAutomation: false, // 🚫 NO AUTOMATION - that's what AutoPlan is for
      useOnlyProvidedWaypoints: false, // ✅ LET PALANTIR ADD WAYPOINTS if needed
      policyUuid: fuelPolicy?.currentPolicy?.uuid || null // 🛩️ INCLUDE CURRENT FUEL POLICY
    };

    console.log('🛩️ DIRECT SAVE: Flight data:', flightData);

    // Use existing save logic but without automation
    await handleSaveFlightSubmit(flightData);
  };

  // Handle Auto Plan action
  const handleAutoPlan = async (autoPlanData) => {
    console.log('🎯 AUTO PLAN: Starting auto plan with data:', autoPlanData);
    console.log('🎯 AUTO PLAN: RightPanel waypoints prop:', waypoints);
    console.log('🎯 AUTO PLAN: Current flight ID:', currentFlightId);
    console.log('🎯 AUTO PLAN: Loaded flight data:', loadedFlightData);
    
    // 🧙‍♂️ WIZARD FIX: Check for wizard custom flight name from global storage
    const wizardFlightName = window.wizardCustomFlightName;
    if (wizardFlightName) {
      console.log('🧙‍♂️ Found wizard custom flight name:', wizardFlightName);
      // Clear it after use to prevent it affecting future flights
      delete window.wizardCustomFlightName;
    }
    
    const { isNewFlight, hasWaypoints, skipWaypointGeneration } = autoPlanData;
    
    // 🔧 DEBUG: Log the flight detection logic
    console.log('🔧 AUTO PLAN DEBUG: Flight detection analysis:', {
      isNewFlight: isNewFlight,
      currentFlightId: currentFlightId,
      hasCurrentFlightId: !!currentFlightId,
      loadedFlightDataExists: !!loadedFlightData,
      loadedFlightName: loadedFlightData?.name,
      autoPlanDataIsNewFlight: autoPlanData.isNewFlight
    });
    
    if (isNewFlight) {
      // For new flights: Save first, then run automation
      console.log('🎯 AUTO PLAN: New flight - saving and running automation');
      console.log(`🎯 AUTO PLAN: skipWaypointGeneration = ${skipWaypointGeneration} (user ${hasWaypoints ? 'has' : 'has no'} waypoints)`);
      
      // Create flight data exactly like SaveFlightCard but with auto-generated name
      // 🧙‍♂️ WIZARD FIX: Use wizard ETD if available, otherwise default to 1 hour from now
      let departureTime;
      if (etd && etd instanceof Date) {
        console.log('🧙‍♂️ Using wizard departure time:', etd);
        departureTime = etd;
      } else {
        console.log('🧙‍♂️ No wizard ETD found, defaulting to 1 hour from now');
        departureTime = new Date();
        departureTime.setHours(departureTime.getHours() + 1);
      }
      
      // Create short date format: YY-MM-DD, HH:MM using departure time
      const shortDate = departureTime.toISOString().slice(2, 16).replace('T', ', ');
      
      // CRITICAL FIX: Build locations array just like regular save flight
      console.log('🎯 AUTO PLAN: All waypoints before filtering:', waypoints);
      console.log('🎯 AUTO PLAN: Waypoints length:', waypoints.length);
      console.log('🎯 AUTO PLAN: Waypoints type:', typeof waypoints);
      
      const filtered = waypoints.filter(wp => {
        // Only include landing stops, not navigation waypoints
        const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
        console.log(`🎯 AUTO PLAN: Waypoint "${wp.name}" - isWaypoint: ${wp.isWaypoint}, type: ${wp.type}, isWaypointType: ${isWaypointType}, included: ${!isWaypointType}`);
        return !isWaypointType;
      });
      
      console.log('🎯 AUTO PLAN: Filtered waypoints:', filtered);
      
      const locations = filtered.map(wp => {
        // COORDINATE SAFETY: Check if waypoint has valid coordinates before accessing them
        if (wp.name && wp.name.trim()) {
          return wp.name.trim();
        } else if (wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2 && 
                   typeof wp.coords[0] === 'number' && typeof wp.coords[1] === 'number') {
          return `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
        } else if (wp.coordinates && Array.isArray(wp.coordinates) && wp.coordinates.length === 2 && 
                   typeof wp.coordinates[0] === 'number' && typeof wp.coordinates[1] === 'number') {
          return `${wp.coordinates[1].toFixed(6)},${wp.coordinates[0].toFixed(6)}`;
        } else {
          console.warn('🚨 AUTO PLAN: Waypoint has invalid coordinates:', wp);
          return wp.name || 'Invalid Waypoint';
        }
      });
      
      console.log('🎯 AUTO PLAN: Built locations array:', locations);
      
      // 🧙‍♂️ WIZARD FIX: Use wizard custom flight name if provided, otherwise generate default
      let flightName;
      if (wizardFlightName && wizardFlightName.trim()) {
        console.log('🧙‍♂️ Using wizard custom flight name:', wizardFlightName);
        flightName = wizardFlightName.trim();
      } else {
        // Generate flight name using departure + first location + short date format
        const departure = locations[0] || 'Unknown';
        const firstLocation = locations[1] || 'Direct';
        flightName = `${departure} ${firstLocation} ${shortDate}`;
        console.log('🧙‍♂️ Generated default flight name:', flightName);
      }
      
      const flightData = {
        flightName: flightName, // Use departure + first location + short date format
        locations: locations, // CRITICAL FIX: Add locations array
        waypoints: waypoints, // Add waypoints for processing
        etd: departureTime, // Use wizard ETD or 1 hour from now
        captainId: null, // No crew for auto-generated flights
        copilotId: null,
        medicId: null,
        soId: null,
        rswId: null,
        alternateLocation: alternateRouteData?.name || null, // Include alternate if available
        runAutomation: true,
        useOnlyProvidedWaypoints: skipWaypointGeneration, // Use correct field name
        policyUuid: (() => {
          // WIZARD: Always use aircraft default policy (wizard has no UI for fuel policy selection)
          // First try direct UUID (if aircraft.defaultFuelPolicyId is already a UUID)
          if (selectedAircraft?.defaultFuelPolicyId) {
            // Check if it's already a UUID (contains hyphens)
            if (selectedAircraft.defaultFuelPolicyId.includes('-')) {
              console.log('🧙‍♂️ WIZARD: Using aircraft default policy UUID directly:', selectedAircraft.defaultFuelPolicyId);
              return selectedAircraft.defaultFuelPolicyId;
            }
            
            // Otherwise, look up by name
            const aircraftPolicy = fuelPolicy?.availablePolicies?.find(p => p.name === selectedAircraft.defaultFuelPolicyId);
            if (aircraftPolicy?.uuid) {
              console.log('🧙‍♂️ WIZARD: Found aircraft policy by name:', aircraftPolicy.name, aircraftPolicy.uuid);
              return aircraftPolicy.uuid;
            }
            console.log('🧙‍♂️ WIZARD: Aircraft default policy not found by name:', selectedAircraft.defaultFuelPolicyId);
          }
          console.log('🧙‍♂️ WIZARD: No aircraft default fuel policy available');
          return null;
        })() // 🧙‍♂️ WIZARD: Always use aircraft default (no UI for policy selection)
      };
      
      console.log('🎯 AUTO PLAN: Calling handleSaveFlightSubmit with:', flightData);
      
      // 🚨 AUTOPLAN DEBUG: Check aircraft data that will be used (moved here to fix initialization error)
      const wizardTailNumber = selectedAircraft?.assetIdentifier || selectedAircraft?.rawRegistration || selectedAircraft?.registration || "UNKNOWN";
      
      // Get the current region for the flight (moved here to fix regionCode error)
      const regionCode = currentRegion?.osdkRegion || currentRegion?.id || "NORWAY";
      
      // 🔍 VALIDATION: Check for common automation failure causes
      console.log('🔍 AUTOMATION VALIDATION CHECK:', {
        hasValidAircraftId: wizardTailNumber !== "UNKNOWN",
        aircraftIdFormat: wizardTailNumber,
        aircraftIdLength: wizardTailNumber.length,
        hasValidETD: flightData.etd && !isNaN(new Date(flightData.etd)),
        etdValue: flightData.etd,
        hasLocations: flightData.locations && flightData.locations.length > 0,
        locationCount: flightData.locations?.length,
        hasWaypoints: flightData.waypoints && flightData.waypoints.length > 0,
        waypointCount: flightData.waypoints?.length,
        hasValidRegion: regionCode && regionCode !== "",
        regionValue: regionCode
      });
      
      console.log('🚨 AUTOPLAN DEBUG: Aircraft and policy data:', {
        selectedAircraft: !!selectedAircraft,
        aircraftReg: selectedAircraft?.registration,
        aircraftAssetIdentifier: selectedAircraft?.assetIdentifier,  // ✅ This should be the clean tail number
        tailNumberUsed: wizardTailNumber,  // ✅ Show what tail number will be sent
        allAircraftKeys: Object.keys(selectedAircraft || {}),
        fuelPolicyAvailable: !!fuelPolicy,
        fuelPolicyPolicies: fuelPolicy?.availablePolicies?.length,
        flightDataPolicyUuid: flightData.policyUuid,
        locationsArray: flightData.locations,
        waypointsCount: flightData.waypoints?.length,
        // 🔍 CRITICAL: Check if flightData has any assetIdx field
        flightDataHasAssetIdx: 'assetIdx' in flightData,
        flightDataAssetIdx: flightData.assetIdx,
        flightDataKeys: Object.keys(flightData)
      });
      
      // Use existing save flight logic
      await handleSaveFlightSubmit(flightData);
    } else {
      // For existing flights: Save first, then run automation WITH weather update
      console.log('🎯 AUTO PLAN: Existing flight - saving changes first, then running automation with weather update');
      console.log('🎯 AUTO PLAN: useOnlyProvidedWaypoints = false (allow Palantir to update weather and replan)');
      
      // For existing flights in Auto Plan, we want Palantir to update weather and replan
      // but keep the user's waypoints and route structure
      // 🧙‍♂️ WIZARD FIX: Use wizard ETD if available, otherwise default to 1 hour from now
      let existingFlightTime;
      if (etd && etd instanceof Date) {
        console.log('🧙‍♂️ Using wizard departure time for existing flight:', etd);
        existingFlightTime = etd;
      } else {
        console.log('🧙‍♂️ No wizard ETD for existing flight, defaulting to 1 hour from now');
        existingFlightTime = new Date();
        existingFlightTime.setHours(existingFlightTime.getHours() + 1);
      }
      
      // Create short date format: YY-MM-DD, HH:MM
      const shortDate = existingFlightTime.toISOString().slice(2, 16).replace('T', ', ');
      
      // CRITICAL FIX: Build locations array for existing flights too
      const locations = waypoints
        .filter(wp => {
          // Only include landing stops, not navigation waypoints
          const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
          return !isWaypointType;
        })
        .map(wp => {
          // COORDINATE SAFETY: Check if waypoint has valid coordinates before accessing them
          if (wp.name && wp.name.trim()) {
            return wp.name.trim();
          } else if (wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2 && 
                     typeof wp.coords[0] === 'number' && typeof wp.coords[1] === 'number') {
            return `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
          } else if (wp.coordinates && Array.isArray(wp.coordinates) && wp.coordinates.length === 2 && 
                     typeof wp.coordinates[0] === 'number' && typeof wp.coordinates[1] === 'number') {
            return `${wp.coordinates[1].toFixed(6)},${wp.coordinates[0].toFixed(6)}`;
          } else {
            console.warn('🚨 AUTO PLAN EXISTING: Waypoint has invalid coordinates:', wp);
            return wp.name || 'Invalid Waypoint';
          }
        });
      
      console.log('🎯 AUTO PLAN: Built locations array for existing flight:', locations);
      
      // 🔧 FIX: Preserve existing flight name when updating, don't overwrite it
      let flightName;
      if (wizardFlightName && wizardFlightName.trim()) {
        console.log('🧙‍♂️ Using wizard custom flight name for existing flight:', wizardFlightName);
        flightName = wizardFlightName.trim();
      } else if (currentFlightId && loadedFlightData) {
        // 🎯 PRESERVE EXISTING: Use the loaded flight's existing name (same logic as SaveFlightCard)
        const foundFlightName = loadedFlightData.flightNumber || // 🔧 CORRECT PROPERTY!
                               loadedFlightData.flightName || 
                               loadedFlightData.name || 
                               loadedFlightData.title || 
                               loadedFlightData.displayName;
        
        if (foundFlightName && foundFlightName.trim()) {
          console.log('🔧 PRESERVING: Using existing flight name:', foundFlightName);
          flightName = foundFlightName.trim();
        } else {
          console.log('🔧 PRESERVING: Flight ID exists but no name found in loadedFlightData');
          flightName = "Existing Flight"; // Safe fallback
        }
      } else if (currentFlightId) {
        // 🔧 FALLBACK: If we have a flight ID but no name, preserve it by not generating a new one
        console.log('🔧 PRESERVING: Flight ID exists but no loaded name - keeping original name');
        flightName = "Existing Flight"; // Use a safe fallback instead of generating a new name
      } else {
        // Generate flight name using departure + first location + short date format (only for truly new flights)
        const departure = locations[0] || 'Unknown';
        const firstLocation = locations[1] || 'Direct';
        flightName = `${departure} ${firstLocation} ${shortDate}`;
        console.log('🧙‍♂️ Generated default flight name for new flight:', flightName);
      }
      
      const flightData = {
        flightName: flightName, // Use departure + first location + short date format
        locations: locations, // CRITICAL FIX: Add locations array
        waypoints: waypoints, // Add waypoints for processing
        etd: existingFlightTime, // Use wizard ETD or 1 hour from now
        captainId: null, // No crew for auto-generated flights
        copilotId: null,
        medicId: null,
        soId: null,
        rswId: null,
        alternateLocation: alternateRouteData?.name || null, // Include alternate if available
        runAutomation: true,
        useOnlyProvidedWaypoints: false, // 🔧 FIX: Allow Palantir to update weather and replan for Auto Plan
        policyUuid: (() => {
          // WIZARD: Always use aircraft default policy (wizard has no UI for fuel policy selection)
          // First try direct UUID (if aircraft.defaultFuelPolicyId is already a UUID)
          if (selectedAircraft?.defaultFuelPolicyId) {
            // Check if it's already a UUID (contains hyphens)
            if (selectedAircraft.defaultFuelPolicyId.includes('-')) {
              console.log('🧙‍♂️ WIZARD: Using aircraft default policy UUID directly:', selectedAircraft.defaultFuelPolicyId);
              return selectedAircraft.defaultFuelPolicyId;
            }
            
            // Otherwise, look up by name
            const aircraftPolicy = fuelPolicy?.availablePolicies?.find(p => p.name === selectedAircraft.defaultFuelPolicyId);
            if (aircraftPolicy?.uuid) {
              console.log('🧙‍♂️ WIZARD: Found aircraft policy by name:', aircraftPolicy.name, aircraftPolicy.uuid);
              return aircraftPolicy.uuid;
            }
            console.log('🧙‍♂️ WIZARD: Aircraft default policy not found by name:', selectedAircraft.defaultFuelPolicyId);
          }
          console.log('🧙‍♂️ WIZARD: No aircraft default fuel policy available');
          return null;
        })() // 🧙‍♂️ WIZARD: Always use aircraft default (no UI for policy selection)
      };
      
      console.log('🎯 AUTO PLAN: Saving existing flight changes with:', flightData);
      
      // 🚨 AUTOPLAN DEBUG: Check aircraft data for existing flight
      const wizardTailNumber2 = selectedAircraft?.assetIdentifier || selectedAircraft?.rawRegistration || selectedAircraft?.registration || "UNKNOWN";
      
      console.log('🚨 AUTOPLAN EXISTING DEBUG: Aircraft data:', {
        tailNumberUsed: wizardTailNumber2,
        flightDataPolicyUuid: flightData.policyUuid,
        // 🔍 CRITICAL: Check if flightData has any assetIdx field  
        flightDataHasAssetIdx: 'assetIdx' in flightData,
        flightDataAssetIdx: flightData.assetIdx,
        flightDataKeys: Object.keys(flightData)
      });
      
      // Use existing save flight logic
      await handleSaveFlightSubmit(flightData);
    }
  };
  
  // Reference to the RightPanelContainer for triggering card changes
  const rightPanelRef = React.useRef();
  
  // Track active card state within the RightPanel component
  const [activeCard, setActiveCard] = useState('main');
  
  // Create a handler for card changes that will be exposed through context
  const handleCardChange = useCallback((cardId) => {
    if (rightPanelRef.current) {
      // Log the card change for debugging
      console.log(`Panel context: changing card to ${cardId}`);
      
      // Call the actual method on the container
      rightPanelRef.current.handleCardChange(cardId);
      
      // Update our internal state
      setActiveCard(cardId);
    } else {
      console.warn('Panel context: rightPanelRef not available');
    }
  }, []);

  // FIXED: Expose BOTH handleAutoPlan and handleCardChange methods via ref
  React.useImperativeHandle(ref, () => ({
    handleAutoPlan,
    handleCardChange
  }), [handleCardChange]);

  // 🎯 FIX: Expose handleLoadFlight to window for FlightWizard access
  useEffect(() => {
    window.rightPanelHandleLoadFlight = handleLoadFlight;
    
    // Cleanup on unmount
    return () => {
      window.rightPanelHandleLoadFlight = null;
    };
  }, [handleLoadFlight]);

  return (
    <PanelProvider value={{
      handleCardChange,
      activeCard
    }}>
      <RightPanelContainer
        visible={visible}
        onToggleVisibility={onToggleVisibility}
        initialActiveCard="main"
        ref={rightPanelRef}
      >
      {/* Main Card */}
      <MainCard
        id="main"
        onClearRoute={onClearRoute}
        onLoadRigData={onLoadRigData}
        onToggleChart={onToggleChart}
        onAutoPlan={handleAutoPlan}
        onWaiveAlternatesChange={onWaiveAlternatesChange} // 🛩️ Pass callback through
        waiveAlternates={waiveAlternates} // 🛩️ VFR OPERATIONS: Pass waive alternates state
        chartsVisible={chartsVisible}
        aircraftType={aircraftType}
        onAircraftTypeChange={onAircraftTypeChange}
        aircraftRegistration={aircraftRegistration}
        onAircraftRegistrationChange={onAircraftRegistrationChange}
        selectedAircraft={selectedAircraft}
        aircraftsByType={aircraftsByType}
        aircraftLoading={aircraftLoading}
        routeStats={routeStats}
        isAuthenticated={isAuthenticated}
        authUserName={authUserName}
        rigsLoading={rigsLoading}
        onLogin={onLogin}
        reserveFuel={reserveFuel}
        waypoints={waypoints}
        passengerWeight={passengerWeight}
        deckTimePerStop={deckTimePerStop}
        deckFuelFlow={deckFuelFlow}
        contingencyFuelPercent={contingencyFuelPercent}
        taxiFuel={taxiFuel}
        weather={weather}
        onWeatherUpdate={onWeatherUpdate}
        cargoWeight={cargoWeight}
        extraFuel={extraFuel} // 🔧 ADDED: Missing extraFuel prop
        araFuel={araFuel} // 🔧 ADDED: ARA fuel from weather analysis
        approachFuel={approachFuel} // 🔧 ADDED: Approach fuel from weather analysis
        alternateRouteData={alternateRouteData}
        loadedFlightData={loadedFlightData} // Pass flight data for responsive display
        stopCards={stopCards}
        fuelPolicy={fuelPolicy}
        onFlightLoad={onFlightLoad}
        toggleWaypointMode={toggleWaypointMode}
        waypointModeActive={waypointModeActive}
        weatherSegments={weatherSegments}
        currentFlightId={currentFlightId} // 🔧 FIX: Pass flight ID for Auto Plan detection
        onStopCardsCalculated={onStopCardsCalculated} // 🛩️ HEADER SYNC: Pass callback to MainCard
        onShowFuelBreakdown={onShowFuelBreakdown} // 📊 FUEL BREAKDOWN: Pass callback to MainCard
        onAlternateCardCalculated={onAlternateCardCalculated} // 🔧 NEW: Pass alternate card callback to MainCard
        locationFuelOverrides={locationFuelOverrides} // ✅ SYNC FIX: Pass location fuel overrides to MainCard
        currentRefuelStops={currentRefuelStops} // 🚫 REFUEL SYNC: Pass synced refuel stops to MainCard
        onSegmentExtraFuelChange={onSegmentExtraFuelChange} // ✅ SEGMENT-AWARE: Pass segment extra fuel handler to MainCard
        getCurrentSegmentInfo={getCurrentSegmentInfo} // ✅ SEGMENT-AWARE: Pass segment info getter to MainCard
        onFuelOverridesChanged={onFuelOverridesChanged} // 🔥 DIRECT CALLBACK: Pass fuel overrides callback to MainCard
        onRefuelStopsChanged={onRefuelStopsChanged} // 🔄 REFUEL SYNC: Pass refuel stops callback to MainCard
        onDirectSave={handleDirectSave} // 🛩️ SIMPLE SAVE: Pass direct save function to MainCard
        componentKey={componentKey} // 🚨 NUCLEAR RESET: Force component remount on flight loads
      />
      
      {/* Settings Card */}
      <SettingsCard
        id="settings"
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        deckFuelFlow={deckFuelFlow}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
        extraFuel={extraFuel}
        taxiFuel={taxiFuel}
        contingencyFuelPercent={contingencyFuelPercent}
        reserveMethod={reserveMethod}
        reserveFuel={reserveFuel}
        onDeckTimeChange={onDeckTimeChange}
        onDeckFuelChange={onDeckFuelChange}
        onDeckFuelFlowChange={onDeckFuelFlowChange}
        onPassengerWeightChange={onPassengerWeightChange}
        onCargoWeightChange={onCargoWeightChange}
        onExtraFuelChange={onExtraFuelChange}
        onTaxiFuelChange={onTaxiFuelChange}
        onContingencyFuelPercentChange={onContingencyFuelPercentChange}
        onReserveMethodChange={onReserveMethodChange}
        onReserveFuelChange={onReserveFuelChange}
        selectedAircraft={selectedAircraft}
        aircraftType={aircraftType}
        fuelPolicy={fuelPolicy}
        currentRegion={currentRegion}
        currentFlightId={currentFlightId}
        stopCards={stopCards}
        routeStats={routeStats}
        araFuel={araFuel}
        approachFuel={approachFuel}
      />
      
      {/* Performance Card */}
      <PerformanceCard id="performance" />
      
      {/* Weather Card */}
      <WeatherCard 
        id="weather" 
        weather={weather}
        onWeatherUpdate={onWeatherUpdate}
        flightId={currentFlightId}
      />
      
      {/* Finance Card */}
      <FinanceCard 
        id="finance"
        routeStats={routeStats}
        stopCards={stopCards}
        selectedAircraft={selectedAircraft}
        waypoints={waypoints}
      />
      
      {/* SAR Range Calculator Card */}
      <SARCard 
        id="sar"
        selectedAircraft={selectedAircraft}
        routeStats={routeStats}
        alternateStats={alternateRouteData?.stats}
        alternateRouteData={alternateRouteData}
        fuelPolicy={fuelPolicy}
        reserveFuel={reserveFuel}
        waypoints={waypoints}
        stopCards={stopCards}
        onSARUpdate={onSARUpdate}
      />
      
      {/* Map Layers Card */}
      <MapLayersCard
        id="maplayers"
        mapManagerRef={mapManagerRef}
        gulfCoastMapRef={gulfCoastMapRef}
        weatherLayerRef={weatherLayerRef}
        vfrChartsRef={vfrChartsRef}
        observedWeatherStationsRef={observedWeatherStationsRef}  // NEW: Pass observed weather stations ref
        platformManagerRef={platformManagerRef}
        platformsVisible={chartsVisible}
        airfieldsVisible={airfieldsVisible}
        fixedPlatformsVisible={fixedPlatformsVisible} // Legacy
        movablePlatformsVisible={movablePlatformsVisible}
        blocksVisible={blocksVisible} // New prop
        basesVisible={basesVisible} // New prop for bases
        fuelAvailableVisible={fuelAvailableVisible} // New prop
        togglePlatformsVisibility={onToggleChart}
        toggleAirfieldsVisibility={toggleAirfieldsVisibility}
        toggleFixedPlatformsVisibility={toggleFixedPlatformsVisibility} // Legacy
        toggleMovablePlatformsVisibility={toggleMovablePlatformsVisibility}
        toggleBlocksVisibility={toggleBlocksVisibility} // New prop
        toggleBasesVisibility={toggleBasesVisibility} // New prop for bases
        toggleFuelAvailableVisibility={toggleFuelAvailableVisibility} // New prop
        weatherSegmentsHook={weatherSegmentsHook} // Pass weather segments hook for layer controls
        waypoints={waypoints} // Pass current flight waypoints for rig weather graphics
        routeStats={routeStats} // Pass route statistics for rig weather graphics
        onLiveWeatherToggled={onLiveWeatherStateChange} // Pass live weather state callback
      />
      
      {/* Save Flight Card */}
      <SaveFlightCard
        id="saveflight"
        onSave={handleSaveFlightSubmit}
        onCancel={handleSaveFlightCancel}
        waypoints={waypoints}
        selectedAircraft={selectedAircraft}
        isSaving={false}
        alternateRouteData={alternateRouteData}
        alternateRouteInput={alternateRouteInput}
        initialETD={etd} // 🧙‍♂️ WIZARD FIX: Pass wizard ETD to save card
        loadedFlightData={loadedFlightData} // 🧙‍♂️ SAVE CARD FIX: Pass loaded flight data for existing flight names
        fuelPolicy={fuelPolicy} // 🛩️ FUEL POLICY: Pass fuel policy for selection
      />
      
      {/* Load Flights Card */}
      <LoadFlightsCard 
        id="loadflights"
        onLoad={handleLoadFlight}
        onCancel={handleLoadFlightsCancel}
        isLoading={false}
        currentRegion={currentRegion?.osdkRegion || currentRegion?.id} // Pass OSDK region for filtering
      />
      
      {/* AutoPlan Card - Removed: Using MainCard AutoPlan button instead */}
    </RightPanelContainer>
    
    {/* Professional Flight Automation Loader */}
    <FlightAutomationLoader
      isVisible={showAutomationLoader}
      flightNumber={automationFlightData?.flightNumber}
      departureIcao={automationFlightData?.departureIcao}
      destinationIcao={automationFlightData?.destinationIcao}
      onComplete={handleAutomationComplete}
      onProgressUpdate={useCallback((callback) => {
        console.log('🚀 RightPanel: Setting automation progress callback');
        setAutomationProgressCallback(() => callback);
      }, [])}
    />
    </PanelProvider>
  );
});

export default RightPanel;