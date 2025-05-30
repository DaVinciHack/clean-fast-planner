import React from 'react';
import FlightSettings from '../../flight/FlightSettings';

/**
 * SettingsCard Component
 * 
 * Contains flight settings controls from the original RightPanel component.
 */
const SettingsCard = ({
  // Flight settings props
  deckTimePerStop = 5,
  deckFuelPerStop = 100,
  deckFuelFlow = 400,
  passengerWeight = 220,
  cargoWeight = 0,
  taxiFuel = 50,
  contingencyFuelPercent = 10,
  reserveMethod = 'fixed',
  reserveFuel = 600,
  onDeckTimeChange = () => {},
  onDeckFuelChange = () => {},
  onDeckFuelFlowChange = () => {},
  onPassengerWeightChange = () => {},
  onCargoWeightChange = () => {},
  onTaxiFuelChange = () => {},
  onContingencyFuelPercentChange = () => {},
  onReserveMethodChange = () => {},
  onReserveFuelChange = () => {},
  // Selected aircraft info
  selectedAircraft,
  aircraftType,
  // Fuel policy props
  fuelPolicy = null,
  currentRegion = null
}) => {
  
  // REMOVED: localStorage loading - all values now come from fuel policy
  // Only browser storage allowed is user's last region preference
  
  // Handler for settings changes
  const handleFlightSettingsChange = (newSettings) => {
    console.log("Flight settings changed:", newSettings);
    
    // Log each setting change for debugging
    Object.keys(newSettings).forEach(key => {
      console.log(`Setting ${key} changed to:`, newSettings[key]);
    });
    
    // Update the state for each setting
    if (newSettings.passengerWeight !== undefined) {
      console.log(`Calling onPassengerWeightChange with:`, newSettings.passengerWeight);
      onPassengerWeightChange(newSettings.passengerWeight);
    }
    
    if (newSettings.reserveFuel !== undefined) {
      console.log(`Calling onReserveFuelChange with:`, newSettings.reserveFuel);
      onReserveFuelChange(newSettings.reserveFuel);
    }
    
    if (newSettings.deckTimePerStop !== undefined) {
      console.log(`Calling onDeckTimeChange with:`, newSettings.deckTimePerStop);
      onDeckTimeChange(newSettings.deckTimePerStop);
    }
    
    if (newSettings.deckFuelFlow !== undefined) {
      console.log(`Calling onDeckFuelFlowChange with:`, newSettings.deckFuelFlow);
      onDeckFuelFlowChange(newSettings.deckFuelFlow);
    }
    
    if (newSettings.taxiFuel !== undefined) {
      console.log(`Calling onTaxiFuelChange with:`, newSettings.taxiFuel);
      onTaxiFuelChange(newSettings.taxiFuel);
    }
    
    if (newSettings.contingencyFuelPercent !== undefined) {
      console.log(`Calling onContingencyFuelPercentChange with:`, newSettings.contingencyFuelPercent);
      onContingencyFuelPercentChange(newSettings.contingencyFuelPercent);
    }
    
    // Force update UI after settings change
    const event = new Event('settings-changed');
    window.dispatchEvent(event);
  };
  
  // Prepare settings for FlightSettings component
  const flightSettings = {
    passengerWeight,
    taxiFuel,
    contingencyFuelPercent,
    deckTimePerStop,
    deckFuelFlow,
    reserveFuel
  };
  
  return (
    <div className="tab-content settings-tab">
      <h3>Flight Settings</h3>
      <div className="control-section">
        {/* Render our new FlightSettings component */}
        <FlightSettings 
          settings={flightSettings}
          onSettingsChange={handleFlightSettingsChange}
          fuelPolicy={fuelPolicy}
          currentRegion={currentRegion}
          selectedAircraft={selectedAircraft}
        />
        
        <div style={{ marginTop: '15px', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '6px' }}>
          <h5 style={{ color: '#4FC3F7', margin: '0 0 0.5rem 0', fontSize: '0.7rem' }}>
            FUEL POLICY INTEGRATION
          </h5>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: '1.4' }}>
            ✅ All fuel values now come from OSDK fuel policies<br/>
            ✅ Settings automatically load by region and aircraft<br/>
            ✅ No browser storage conflicts - aviation standard data flow<br/>
            💡 Flight-specific overrides are saved with the flight plan
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsCard;