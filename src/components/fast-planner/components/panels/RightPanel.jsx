import React from 'react';
import RightPanelContainer from './RightPanelContainer';
import {
  MainCard,
  SettingsCard,
  PerformanceCard,
  WeatherCard,
  FinanceCard,
  EvacuationCard,
  SaveFlightCard
} from './cards';
import '../../FastPlannerStyles.css';

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
  // Handle saving flight from SaveFlightCard
  const handleSaveFlightSubmit = (flightData) => {
    console.log('Save flight data from card:', flightData);
    // Implement your save logic here or pass it to parent component
  };
  
  // Handle cancel from SaveFlightCard
  const handleSaveFlightCancel = () => {
    // Switch back to main card
    if (rightPanelRef.current) {
      rightPanelRef.current.handleCardChange('main');
    }
  };
  
  // Reference to the RightPanelContainer for triggering card changes
  const rightPanelRef = React.useRef();
  
  return (
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
        isSaving={false}
      />
    </RightPanelContainer>
  );
};

export default RightPanel;