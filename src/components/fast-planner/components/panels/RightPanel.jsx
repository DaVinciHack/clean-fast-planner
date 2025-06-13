import React, { useState, useCallback } from 'react';
import RightPanelContainer from './RightPanelContainer';
import {
  MainCard,
  SettingsCard,
  PerformanceCard,
  WeatherCard,
  FinanceCard,
  EvacuationCard,
  SaveFlightCard,
  LoadFlightsCard,
  MapLayersCard
} from './cards';
import '../../FastPlannerStyles.css';
import { PanelProvider } from '../../context/PanelContext';
import { useRegion } from '../../context/region'; // Import region context
import FlightAutomationLoader from '../loaders/FlightAutomationLoader';

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
  taxiFuel = 9999, // ⚠️ SAFETY: Obvious error value - real values must come from OSDK
  contingencyFuelPercent = 9999, // ⚠️ CRITICAL SAFETY: No defaults! Real policy values or obvious error
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
  fuelPolicy = null
}, ref) => {
  // Get current region from context
  const { currentRegion } = useRegion();
  
  // Flight automation loader state
  const [showAutomationLoader, setShowAutomationLoader] = useState(false);
  const [automationFlightData, setAutomationFlightData] = useState(null);
  
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
    
    // 🎯 IMMEDIATE POPUP: Show automation loader immediately if automation is enabled
    if (flightData.runAutomation) {
      console.log('🚀 RIGHTPANEL: Showing automation loader IMMEDIATELY on save');
      
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
      
      // Show automation loader immediately
      setShowAutomationLoader(true);
    }
    
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
          const locationName = wp.name ? wp.name.trim() : `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
          return locationName;
        });
      
      // DEBUG: Check waypoint structure to understand types
      console.log('Debug waypoint types:', waypoints.map((wp, index) => ({
        name: wp.name,
        type: wp.type,
        isWaypoint: wp.isWaypoint,
        isStop: wp.isStop,
        allProperties: Object.keys(wp)
      })));
      
      // CRITICAL FIX: Use the aircraft tail number (rawRegistration) first, then assetId as fallback
      // The automation expects the aircraft's tail number to look up the aircraft in the system
      const finalAircraftId = selectedAircraft?.rawRegistration || selectedAircraft?.assetId || "190";
      
      // Prepare waypoints with leg structure
      const waypointsWithLegs = waypoints.map((wp, index) => {
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
      const apiParams = {
        // CRITICAL FIX: Include flight ID for updates instead of always creating new flights
        ...(currentFlightId && { flightId: currentFlightId }),
        
        // Basic parameters
        flightName: flightData.flightName,
        aircraftRegion: regionCode, // Use current region
        aircraftId: finalAircraftId,
        region: regionCode, // Use current region
        etd: new Date(flightData.etd).toISOString(), // Ensure proper ISO format
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
        rswId: flightData.rswId || null
      };
      
      console.log('Sending flight data to Palantir:', apiParams);
      
      // Call the service to create the flight
      const result = await PalantirFlightService.createFlight(apiParams);
      console.log('Flight creation result:', result);
      
      // Check if the result is successful
      if (PalantirFlightService.isSuccessfulResult(result)) {
        // For updates, use the existing flight ID; for creates, extract from result
        const flightId = currentFlightId || PalantirFlightService.extractFlightId(result);
        
        console.log(`Flight ${currentFlightId ? 'updated' : 'created'} successfully with ID: ${flightId}`);
        
        // Show success message
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Flight "${flightData.flightName}" created successfully!`, 'success');
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
              try {
                const automationResult = await AutomationService.runAutomation(flightId);
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
                      }
                      
                      if (onFlightLoad) {
                        // ✅ CRITICAL FIX: Use the same handleLoadFlight function that manual loading uses
                        console.log('🔄 AUTOMATION: Using handleLoadFlight (same as manual loading)');
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
                            console.log('🎯 PROFESSIONAL: All data ready, creating weather circles immediately');
                            
                            // Dispatch force-enable event to MapLayersCard
                            window.dispatchEvent(new CustomEvent('weather-circles-force-enabled'));
                            
                            // Create weather circles with proper data
                            import('../../modules/layers/WeatherCirclesLayer').then(({ default: WeatherCirclesLayer }) => {
                              // Clean up existing layer
                              if (window.currentWeatherCirclesLayer) {
                                try {
                                  window.currentWeatherCirclesLayer.removeWeatherCircles();
                                  console.log('🎯 PROFESSIONAL: Cleaned up existing weather layer');
                                } catch (e) { 
                                  console.warn('🎯 PROFESSIONAL: Cleanup warning (non-fatal):', e.message);
                                }
                              }
                              
                              // Create new layer with complete data
                              console.log('🎯 PROFESSIONAL: Creating WeatherCirclesLayer with', weatherSegments.length, 'segments');
                              const weatherCirclesLayer = new WeatherCirclesLayer(hasMap);
                              weatherCirclesLayer.addWeatherCircles(weatherSegments);
                              window.currentWeatherCirclesLayer = weatherCirclesLayer;
                              console.log('🎯 PROFESSIONAL: Weather circles created successfully via event-driven trigger!');
                              
                              // Remove the event listener as it's no longer needed
                              window.removeEventListener('weather-data-ready', handleWeatherDataReady);
                              
                            }).catch(error => {
                              console.error('🎯 PROFESSIONAL: Error creating weather circles:', error);
                            });
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
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(`Flight saved but automation failed: ${automationError.message}`, 'warning');
                }
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
      
      // Format the error message using the service
      const PalantirFlightService = (await import('../../services/PalantirFlightService')).default;
      const errorMessage = PalantirFlightService.formatErrorMessage(error);
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
    }
  };
  
  // Handle cancel from LoadFlightsCard
  const handleLoadFlightsCancel = () => {
    // Switch back to main card
    handleCardChange('main');
  };
  
  // Handle loading a flight from LoadFlightsCard
  const handleLoadFlight = (flight) => {
    console.log('🟠 RIGHTPANEL LOAD: Load flight data from card:', flight);
    console.log('🟠 RIGHTPANEL LOAD: Raw flight available:', !!flight._rawFlight);
    
    // DEBUG: Check for alternate data in the loaded flight
    if (flight._rawFlight) {
      const rawFlight = flight._rawFlight;
      console.log('🟠 RIGHTPANEL LOAD: alternateSplitPoint:', rawFlight.alternateSplitPoint);
      console.log('🟠 RIGHTPANEL LOAD: alternateName:', rawFlight.alternateName);
      console.log('🟠 RIGHTPANEL LOAD: alternateFullRouteGeoShape:', !!rawFlight.alternateFullRouteGeoShape);
      console.log('🟠 RIGHTPANEL LOAD: alternateLegIds:', rawFlight.alternateLegIds);
      console.log('🟠 RIGHTPANEL LOAD: alternateGeoPoint:', rawFlight.alternateGeoPoint);
    }
    
    try {
      // Extract flight data for the main application
      const flightData = {
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        
        // Extract stops (landing locations) from the stops array
        stops: flight.stops || [],
        
        // Extract waypoints by separating them from stops using displayWaypoints
        waypoints: extractWaypointsFromFlight(flight),
        
        // Aircraft and crew information
        aircraftId: flight.aircraftId,
        captainId: flight.captainId,
        copilotId: flight.copilotId,
        medicId: flight.medicId,
        soId: flight.soId,
        rswId: flight.rswId,
        
        // CRITICAL FIX: Extract wind data from flight if available - use avgWindSpeed/avgWindDirection
        windData: {
          windSpeed: flight._rawFlight?.avgWindSpeed || flight._rawFlight?.windSpeed || flight.avgWindSpeed || flight.windSpeed || 0,
          windDirection: flight._rawFlight?.avgWindDirection || flight._rawFlight?.windDirection || flight.avgWindDirection || flight.windDirection || 0,
          source: 'loaded_flight'
        },
        
        // Other flight data
        etd: flight.date,
        region: flight.region,
        alternateLocation: flight.alternateLocation,
        
        // 🟠 CRITICAL FIX: Extract full alternate route data from raw flight
        alternateRouteData: (() => {
          if (flight._rawFlight?.alternateFullRouteGeoShape) {
            console.log('🟠 RIGHTPANEL LOAD: ✅ Extracting alternate route data for FastPlannerApp');
            
            const rawFlight = flight._rawFlight;
            const alternateGeoShape = rawFlight.alternateFullRouteGeoShape.toGeoJson ? 
              rawFlight.alternateFullRouteGeoShape.toGeoJson() : rawFlight.alternateFullRouteGeoShape;
            
            if (alternateGeoShape?.coordinates) {
              const alternateData = {
                coordinates: alternateGeoShape.coordinates,
                splitPoint: rawFlight.alternateSplitPoint || null,
                name: rawFlight.alternateName || 'Alternate Route',
                geoPoint: rawFlight.alternateGeoPoint || null,
                legIds: rawFlight.alternateLegIds || []
              };
              
              console.log('🟠 RIGHTPANEL LOAD: ✅ Created alternateRouteData:', {
                coordinateCount: alternateData.coordinates.length,
                splitPoint: alternateData.splitPoint,
                name: alternateData.name
              });
              
              return alternateData;
            }
          }
          
          console.log('🟠 RIGHTPANEL LOAD: ❌ No alternate route data found');
          return null;
        })(),
        
        // Include raw flight for reference
        _rawFlight: flight._rawFlight
      };
      
      console.log('Processed flight data for loading:', flightData);
      
      // Call the parent's flight loading handler if available
      if (onFlightLoad) {
        onFlightLoad(flightData);
      }
      
      // Update loading indicator
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Loaded flight: ${flight.name}`, 
          'success'
        );
      }
      
    } catch (error) {
      console.error('Error processing flight data:', error);
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to load flight: ${error.message}`, 
          'error'
        );
      }
    }
    
    // 🚫 DISABLED: Don't automatically return to main card after loading
    // The user has chosen to close all panels when loading a flight
    // setTimeout(() => {
    //   handleCardChange('main');
    // }, 500);
  };
  
  /**
   * Extract waypoints from flight data, separating them from stops
   * This addresses the core challenge of waypoint vs stop separation
   */
  const extractWaypointsFromFlight = (flight) => {
    try {
      const waypoints = [];
      const stops = flight.stops || [];
      
      // Use displayWaypoints if available (newer format with labels)
      if (flight.displayWaypoints && flight.displayWaypoints.length > 0) {
        console.log('Using displayWaypoints to extract waypoints');
        
        flight.displayWaypoints.forEach((wp, index) => {
          // Remove labels like "(Dep)", "(Stop1)", "(Des)" to get clean waypoint name
          const cleanName = wp.replace(/\s*\([^)]*\)\s*$/, '').trim();
          
          // Skip if this is a stop (departure, intermediate stops, or destination)
          if (stops.includes(cleanName)) {
            console.log(`Skipping stop: ${cleanName}`);
            return;
          }
          
          // This is a navigation waypoint
          waypoints.push({
            name: cleanName,
            type: 'waypoint',
            legIndex: 0, // Will be determined by the routing logic
            coords: null, // Will be looked up when loading
            isStop: false
          });
        });
      }
      // Fallback to combinedWaypoints if displayWaypoints not available
      else if (flight.combinedWaypoints && flight.combinedWaypoints.length > 0) {
        console.log('Using combinedWaypoints to extract waypoints');
        
        flight.combinedWaypoints.forEach((wp) => {
          // Skip stops
          if (stops.includes(wp)) {
            return;
          }
          
          waypoints.push({
            name: wp,
            type: 'waypoint',
            legIndex: 0,
            coords: null,
            isStop: false
          });
        });
      }
      
      console.log(`Extracted ${waypoints.length} waypoints from flight`);
      return waypoints;
      
    } catch (error) {
      console.error('Error extracting waypoints from flight:', error);
      return [];
    }
  };
  
  // Handle cancel from SaveFlightCard
  const handleSaveFlightCancel = () => {
    // Switch back to main card
    handleCardChange('main');
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

  // Expose handleCardChange method through ref for GlassMenuDock
  React.useImperativeHandle(ref, () => ({
    handleCardChange
  }), [handleCardChange]);

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
        stopCards={stopCards}
        fuelPolicy={fuelPolicy}
        onFlightLoad={onFlightLoad}
        toggleWaypointMode={toggleWaypointMode}
        waypointModeActive={waypointModeActive}
        weatherSegments={weatherSegments}
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
      
      {/* Evacuation Card */}
      <EvacuationCard id="evacuation" />
      
      {/* Map Layers Card */}
      <MapLayersCard
        id="maplayers"
        mapManagerRef={mapManagerRef}
        gulfCoastMapRef={gulfCoastMapRef}
        weatherLayerRef={weatherLayerRef}
        vfrChartsRef={vfrChartsRef}
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
      />
      
      {/* Save Flight Card */}
      <SaveFlightCard
        id="saveflight"
        onSave={handleSaveFlightSubmit}
        onCancel={handleSaveFlightCancel}
        waypoints={waypoints}
        selectedAircraft={selectedAircraft}
        isSaving={false}
      />
      
      {/* Load Flights Card */}
      <LoadFlightsCard 
        id="loadflights"
        onLoad={handleLoadFlight}
        onCancel={handleLoadFlightsCancel}
        isLoading={false}
        currentRegion={currentRegion?.osdkRegion || currentRegion?.id} // Pass OSDK region for filtering
      />
    </RightPanelContainer>
    
    {/* Professional Flight Automation Loader */}
    <FlightAutomationLoader
      isVisible={showAutomationLoader}
      flightNumber={automationFlightData?.flightNumber}
      departureIcao={automationFlightData?.departureIcao}
      destinationIcao={automationFlightData?.destinationIcao}
      onComplete={handleAutomationComplete}
    />
    </PanelProvider>
  );
});

export default RightPanel;