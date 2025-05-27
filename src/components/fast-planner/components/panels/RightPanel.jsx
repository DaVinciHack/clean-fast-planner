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

/**
 * Right Panel Component
 * 
 * Refactored to use a container with individual card components
 * that slide in and out when different tabs are selected.
 * Uses the existing animation system already in the CSS.
 * Region management is now handled by RegionContext.
 */
const RightPanel = ({
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
  stopCards,
  waypoints,
  onRemoveWaypoint,
  isAuthenticated,
  authUserName,
  rigsLoading,
  onLogin,
  onFlightLoad, // Callback for when a flight is loaded
  // Flight settings props
  deckTimePerStop = 5,
  deckFuelPerStop = 100,
  deckFuelFlow = 400,
  passengerWeight = 220,
  cargoWeight = 0,
  taxiFuel = 50,
  contingencyFuelPercent = 10,
  reserveMethod = 'fixed',
  onDeckTimeChange = () => {},
  onDeckFuelChange = () => {},
  onDeckFuelFlowChange = () => {},
  onPassengerWeightChange = () => {},
  onCargoWeightChange = () => {},
  onTaxiFuelChange = () => {},
  onContingencyFuelPercentChange = () => {},
  onReserveMethodChange = () => {},
  // Weather props
  weather = { windSpeed: 15, windDirection: 270 },
  onWeatherUpdate = () => {}
}) => {
  // Get current region from context
  const { currentRegion } = useRegion();
  
  // Handle saving flight from SaveFlightCard
  const handleSaveFlightSubmit = async (flightData) => {
    console.log('Save flight data from card:', flightData);
    
    // Import the PalantirFlightService
    try {
      const PalantirFlightService = (await import('../../services/PalantirFlightService')).default;
      
      // Update loading indicator if available
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Saving flight to Palantir...');
      }
      
      // Get waypoint locations for the API - ONLY include landing stops, NOT navigation waypoints
      // DEBUG: Check waypoint structure to understand types
      console.log('=== WAYPOINT DEBUG INFO (RightPanel) ===');
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
      console.log('=== END WAYPOINT DEBUG ===');
      
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
      console.log('DEBUG: Waypoint objects structure:', waypoints.map(wp => ({
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
          id: wp.id
        };
      });
      
      // Get the current region for the flight
      const regionCode = currentRegion?.osdkRegion || currentRegion?.id || "NORWAY"; // Fallback to NORWAY only if no region
      
      // Prepare parameters for the Palantir API
      const apiParams = {
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
        // Extract the flight ID
        const flightId = PalantirFlightService.extractFlightId(result);
        
        console.log(`Flight created successfully with ID: ${flightId}`);
        
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
            
            // Update loading indicator for automation
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
              } catch (automationError) {
                console.error('Automation failed:', automationError);
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(`Flight saved but automation failed: ${automationError.message}`, 'warning');
                }
              }
            }, 1000);
            
          } catch (importError) {
            console.error('Failed to import AutomationService:', importError);
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
    console.log('Load flight data from card:', flight);
    
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
        
        // Other flight data
        etd: flight.date,
        region: flight.region,
        alternateLocation: flight.alternateLocation,
        
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
    
    // Return to main card after loading
    setTimeout(() => {
      handleCardChange('main');
    }, 500);
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
          console.log(`Adding waypoint: ${cleanName}`);
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
      />
      
      {/* Settings Card */}
      <SettingsCard
        id="settings"
        deckTimePerStop={deckTimePerStop}
        deckFuelPerStop={deckFuelPerStop}
        deckFuelFlow={deckFuelFlow}
        passengerWeight={passengerWeight}
        cargoWeight={cargoWeight}
        taxiFuel={taxiFuel}
        contingencyFuelPercent={contingencyFuelPercent}
        reserveMethod={reserveMethod}
        reserveFuel={reserveFuel}
        onDeckTimeChange={onDeckTimeChange}
        onDeckFuelChange={onDeckFuelChange}
        onDeckFuelFlowChange={onDeckFuelFlowChange}
        onPassengerWeightChange={onPassengerWeightChange}
        onCargoWeightChange={onCargoWeightChange}
        onTaxiFuelChange={onTaxiFuelChange}
        onContingencyFuelPercentChange={onContingencyFuelPercentChange}
        onReserveMethodChange={onReserveMethodChange}
        onReserveFuelChange={onReserveFuelChange}
        selectedAircraft={selectedAircraft}
        aircraftType={aircraftType}
      />
      
      {/* Performance Card */}
      <PerformanceCard id="performance" />
      
      {/* Weather Card */}
      <WeatherCard 
        id="weather" 
        weather={weather}
        onWeatherUpdate={onWeatherUpdate}
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
    </PanelProvider>
  );
};

export default RightPanel;