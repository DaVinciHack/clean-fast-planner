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
  LoadFlightsCard
} from './cards';
import '../../FastPlannerStyles.css';
import { PanelProvider } from '../../context/PanelContext';
import PalantirFlightService from '../../services/PalantirFlightService';
import AutomationService from '../../services/AutomationService';

/**
 * Right Panel Component
 * 
 * Refactored to use a container with individual card components
 * that slide in and out when different tabs are selected.
 * Uses the existing animation system already in the CSS.
 */
const RightPanel = ({
  visible,
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
  waypoints,
  onRemoveWaypoint,
  isAuthenticated,
  authUserName,
  rigsLoading,
  onLogin,
  // Region selector props
  regions = [],
  currentRegion = null,
  onRegionChange = () => {},
  regionLoading = false,
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
  // Add state for saving and automating status
  const [isSaving, setIsSaving] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [savedFlightId, setSavedFlightId] = useState(null);
  
  // Handle saving flight from SaveFlightCard
  const handleSaveFlightSubmit = async (flightData) => {
    console.log('Save flight data from card:', flightData);
    
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      // Show error message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Cannot save flight: Missing aircraft or waypoints', 'error');
      }
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Start the loading indicator animation in the header
      // This uses the special route stats loader which has the blue bar animation
      if (window.LoadingIndicator && window.LoadingIndicator.startRouteStatsLoader) {
        window.LoadingIndicator.startRouteStatsLoader('Saving flight to Palantir...');
      } else {
        // Fallback to standard indicator if the route stats loader isn't available
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator('Saving flight to Palantir...');
        }
      }
      
      // Get waypoint locations for the API - clean up whitespace
      const locations = waypoints.map(wp => {
        // Clean up location names - trim whitespace to avoid issues
        const locationName = wp.name ? wp.name.trim() : `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
        return locationName;
      });
      
      // Format the ETD for Palantir
      const etdTimestamp = new Date(flightData.etd).toISOString();
      
      // We need to use the numeric ID which we've confirmed works
      // The assetId is likely the correct field based on our testing
      const finalAircraftId = selectedAircraft.assetId || "190"; // Fallback to 190 if assetId isn't available
      
      // Debug output of IDs to help find issues
      console.log('OSDK Flight Creation - Debug Data:', {
        aircraftId: finalAircraftId, // We'll use this value directly
        rawReg: selectedAircraft.rawRegistration,
        displayReg: selectedAircraft.registration,
        aircraftAssetId: selectedAircraft.assetId || '(none)',
        captainId: flightData.captainId,
        copilotId: flightData.copilotId
      });
      
      // Prepare parameters using the format that works (simple strings, not objects)
      const apiParams = {
        // Basic parameters - using the format that was successful in the API tester
        flightName: flightData.flightName,
        aircraftRegion: "NORWAY",
        new_parameter: "Norway",
        aircraftId: finalAircraftId, // Simple string, not an object
        region: "NORWAY",
        etd: etdTimestamp,
        locations: locations,
        alternateLocation: "",
        
        // Crew member IDs - also as simple strings
        captainId: flightData.captainId || null,
        copilotId: flightData.copilotId || null,
        medicId: flightData.medicId || null,
        soId: flightData.soId || null,
        rswId: flightData.rswId || null
      };
      
      console.log('Sending flight data to Palantir with params:', apiParams);
      
      // Call the service to create the flight
      const result = await PalantirFlightService.createFlight(apiParams);
      console.log('Flight creation result:', result);
      
      // Check if successful
      if (PalantirFlightService.isSuccessfulResult(result)) {
        // Extract the flight ID
        const flightId = PalantirFlightService.extractFlightId(result);
        
        // Set the saved flight ID to state
        setSavedFlightId(flightId);
        
        // Log success details
        console.log(`Flight created successfully with ID: ${flightId}`);
        
        // Show success message - don't complete the loader yet if we're going to run automation
        if (window.LoadingIndicator) {
          if (flightData.runAutomation && flightId && flightId !== 'Unknown ID') {
            // Update the indicator text but keep it running
            if (window.LoadingIndicator.updateRouteStatsLoaderText) {
              window.LoadingIndicator.updateRouteStatsLoaderText(`Flight "${flightData.flightName}" created successfully! Preparing automation...`);
            } else {
              window.LoadingIndicator.updateStatusIndicator(`Flight "${flightData.flightName}" created successfully! Preparing automation...`, 'success');
            }
          } else {
            // Complete the loader animation since we're done
            if (window.LoadingIndicator.completeRouteStatsLoader) {
              window.LoadingIndicator.completeRouteStatsLoader(`Flight "${flightData.flightName}" created successfully!`);
            } else {
              window.LoadingIndicator.updateStatusIndicator(`Flight "${flightData.flightName}" created successfully!`, 'success');
            }
          }
        }
        
        // Return to main card after saving
        setTimeout(() => {
          handleCardChange('main');
        }, 1000);
        
        // Run automation if enabled
        if (flightData.runAutomation && flightId && flightId !== 'Unknown ID') {
          console.log('Running automation for flight ID:', flightId);
          
          // Add a delay to ensure flight creation is fully processed on the server
          setTimeout(async () => {
            try {
              setIsAutomating(true);
              
              // Update loading indicator text for automation phase
              if (window.LoadingIndicator) {
                if (window.LoadingIndicator.updateRouteStatsLoaderText) {
                  window.LoadingIndicator.updateRouteStatsLoaderText('Running flight automation...');
                } else {
                  window.LoadingIndicator.updateStatusIndicator('Running flight automation...');
                }
              }
              
              // Call the automation service
              const automationResult = await AutomationService.runAutomation(flightId);
              console.log('Automation successful!', automationResult);
              
              // Show success message and complete the loader animation
              if (window.LoadingIndicator) {
                if (window.LoadingIndicator.completeRouteStatsLoader) {
                  window.LoadingIndicator.completeRouteStatsLoader('Flight automation completed successfully');
                } else {
                  window.LoadingIndicator.updateStatusIndicator('Flight automation completed successfully', 'success');
                }
              }
            } catch (autoError) {
              console.error('Error running automation:', autoError);
              
              // Format error message
              const errorMessage = AutomationService.formatErrorMessage(autoError);
              
              // Show warning message and complete the loader with an error
              if (window.LoadingIndicator) {
                if (window.LoadingIndicator.completeRouteStatsLoader) {
                  window.LoadingIndicator.completeRouteStatsLoader(`Flight saved but automation failed: ${errorMessage}`, 'warning');
                } else {
                  window.LoadingIndicator.updateStatusIndicator(`Flight saved but automation failed: ${errorMessage}`, 'warning');
                }
              }
            } finally {
              setIsAutomating(false);
            }
          }, 1000);
        }
      } else {
        console.error('Invalid response from server:', result);
        
        // Complete the loader with an error
        if (window.LoadingIndicator) {
          if (window.LoadingIndicator.completeRouteStatsLoader) {
            window.LoadingIndicator.completeRouteStatsLoader('Flight creation failed: Invalid response from server', 'error');
          } else {
            window.LoadingIndicator.updateStatusIndicator('Flight creation failed: Invalid response from server', 'error');
          }
        }
        
        throw new Error('Flight creation failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      
      // Format the error message
      const errorMessage = PalantirFlightService.formatErrorMessage(error);
      
      // Complete the loader with an error
      if (window.LoadingIndicator) {
        if (window.LoadingIndicator.completeRouteStatsLoader) {
          window.LoadingIndicator.completeRouteStatsLoader(errorMessage, 'error');
        } else {
          window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel from LoadFlightsCard
  const handleLoadFlightsCancel = () => {
    // Switch back to main card
    handleCardChange('main');
  };
  
  // Handle loading a flight from LoadFlightsCard
  const handleLoadFlight = (flight) => {
    console.log('Selected flight data:', flight);
    
    // TODO: Implement flight loading logic
    // This would include:
    // 1. Setting waypoints from flight.waypoints
    // 2. Setting the selected aircraft based on flight.aircraftId
    // 3. Updating other relevant flight parameters
    
    // For now, just show the flight was selected
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Flight "${flight.title}" selected. Loading functionality will be implemented in the next phase.`, 
        'info'
      );
    }
    
    // Return to main card after loading
    setTimeout(() => {
      handleCardChange('main');
    }, 2000);
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
        regions={regions}
        currentRegion={currentRegion}
        onRegionChange={onRegionChange}
        regionLoading={regionLoading}
        reserveFuel={reserveFuel}
        waypoints={waypoints}
        passengerWeight={passengerWeight}
        deckTimePerStop={deckTimePerStop}
        deckFuelFlow={deckFuelFlow}
        contingencyFuelPercent={contingencyFuelPercent} // Pass contingencyFuelPercent to MainCard
        taxiFuel={taxiFuel} // Pass taxiFuel to MainCard
        weather={weather}
        onWeatherUpdate={onWeatherUpdate}
        // Added cargoWeight for the Save Flight button to calculate payload
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
      <FinanceCard id="finance" />
      
      {/* Evacuation Card */}
      <EvacuationCard id="evacuation" />
      
      {/* Save Flight Card */}
      <SaveFlightCard
        id="saveflight"
        onSave={handleSaveFlightSubmit}
        onCancel={handleSaveFlightCancel}
        waypoints={waypoints}
        selectedAircraft={selectedAircraft}
        isSaving={isSaving || isAutomating}
        runAutomation={true}
      />
      
      {/* Load Flights Card */}
      <LoadFlightsCard 
        id="loadflights"
        onSelect={handleLoadFlight}
        onClose={handleLoadFlightsCancel}
        currentRegion={currentRegion}
      />
    </RightPanelContainer>
    </PanelProvider>
  );
};

export default RightPanel;