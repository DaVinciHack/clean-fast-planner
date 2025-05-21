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
  // Handle saving flight from SaveFlightCard
  const handleSaveFlightSubmit = (flightData) => {
    console.log('Save flight data from card:', flightData);
    // Implement your save logic here or pass it to parent component
    
    // Return to main card after saving
    setTimeout(() => {
      handleCardChange('main');
    }, 1000);
  };
  
  // Handle cancel from LoadFlightsCard
  const handleLoadFlightsCancel = () => {
    // Switch back to main card
    handleCardChange('main');
  };
  
  // Handle loading a flight from LoadFlightsCard
  const handleLoadFlight = (flight) => {
    console.log('Load flight data from card:', flight);
    // Implement your load logic here or pass it to parent component
    
    // Return to main card after loading
    setTimeout(() => {
      handleCardChange('main');
    }, 1000);
    
    // Show success message
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(
        `Flight "${flight.name}" loaded successfully`, 
        'success'
      );
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
      <FinanceCard id="finance" />
      
      {/* Evacuation Card */}
      <EvacuationCard id="evacuation" />
      
      // Map Layers Card
  <MapLayersCard
    id="maplayers"
    mapManagerRef={mapManagerRef}
    gulfCoastMapRef={gulfCoastMapRef}
    weatherLayerRef={weatherLayerRef}
    vfrChartsRef={vfrChartsRef}
    platformManagerRef={window.platformManagerRef}
    platformsVisible={chartsVisible}
    airfieldsVisible={window.platformManagerRef?.current?.airfieldsVisible || true}
    fixedPlatformsVisible={window.platformManagerRef?.current?.fixedPlatformsVisible || true}
    movablePlatformsVisible={window.platformManagerRef?.current?.movablePlatformsVisible || true}
    togglePlatformsVisibility={onToggleChart}
    toggleAirfieldsVisibility={() => {
      if (window.platformManagerRef?.current) {
        return window.platformManagerRef.current.toggleAirfieldsVisibility();
      }
      return false;
    }}
    toggleFixedPlatformsVisibility={() => {
      if (window.platformManagerRef?.current) {
        return window.platformManagerRef.current.toggleFixedPlatformsVisibility();
      }
      return false;
    }}
    toggleMovablePlatformsVisibility={() => {
      if (window.platformManagerRef?.current) {
        return window.platformManagerRef.current.toggleMovablePlatformsVisibility();
      }
      return false;
    }}
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
      />
    </RightPanelContainer>
    </PanelProvider>
  );
};

export default RightPanel;