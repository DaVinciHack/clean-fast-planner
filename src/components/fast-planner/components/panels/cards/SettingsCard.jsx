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
  onDeckTimeChange = () => {},
  onDeckFuelChange = () => {},
  onDeckFuelFlowChange = () => {},
  onPassengerWeightChange = () => {},
  onCargoWeightChange = () => {},
  onTaxiFuelChange = () => {},
  onContingencyFuelPercentChange = () => {},
  onReserveMethodChange = () => {},
  // Selected aircraft info
  selectedAircraft,
  aircraftType
}) => {
  
  // Handler for settings changes
  const handleFlightSettingsChange = (newSettings) => {
    console.log("Flight settings changed:", newSettings);
    
    // Log each setting change for debugging
    Object.keys(newSettings).forEach(key => {
      console.log(`Setting ${key} changed to:`, newSettings[key]);
    });
    
    // Update the state for each setting
    if (newSettings.passengerWeight !== undefined) {
      onPassengerWeightChange(newSettings.passengerWeight);
    }
    
    if (newSettings.reserveFuel !== undefined) {
      onReserveFuelChange(newSettings.reserveFuel);
    }
    
    if (newSettings.deckTimePerStop !== undefined) {
      onDeckTimeChange(newSettings.deckTimePerStop);
    }
    
    if (newSettings.deckFuelFlow !== undefined) {
      onDeckFuelFlowChange(newSettings.deckFuelFlow);
    }
    
    if (newSettings.taxiFuel !== undefined) {
      onTaxiFuelChange(newSettings.taxiFuel);
    }
    
    if (newSettings.contingencyFuelPercent !== undefined) {
      onContingencyFuelPercentChange(newSettings.contingencyFuelPercent);
    }
  };
  
  // Prepare settings for FlightSettings component
  const flightSettings = {
    passengerWeight,
    taxiFuel,
    contingencyFuelPercent,
    deckTimePerStop,
    deckFuelFlow
  };
  
  return (
    <div className="tab-content settings-tab">
      <h3>Flight Settings</h3>
      <div className="control-section">
        {/* Render our new FlightSettings component */}
        <FlightSettings 
          settings={flightSettings}
          onSettingsChange={handleFlightSettingsChange}
        />
        
        {/* Additional settings */}
        <h4>Additional Settings</h4>
        
        <div className="input-group">
          <div>
            <label htmlFor="cargo-weight">Additional Cargo:</label>
            <input 
              type="number" 
              id="cargo-weight" 
              value={cargoWeight}
              min="0" 
              max="5000"
              onChange={(e) => onCargoWeightChange(parseInt(e.target.value, 10) || 0)}
            />
            <span className="unit">lbs</span>
          </div>
        </div>
      
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            className="control-button"
            onClick={() => {
              // Create a flash message to confirm settings are saved
              const loadingOverlay = document.getElementById('loading-overlay');
              if (loadingOverlay) {
                loadingOverlay.textContent = 'Global flight settings saved!';
                loadingOverlay.style.display = 'block';
                
                setTimeout(() => {
                  loadingOverlay.style.display = 'none';
                }, 1500);
              }
              
              // Save to localStorage for persistence as global settings
              try {
                localStorage.setItem('fastPlanner_deckTimePerStop', deckTimePerStop);
                localStorage.setItem('fastPlanner_deckFuelPerStop', deckFuelPerStop);
                localStorage.setItem('fastPlanner_deckFuelFlow', deckFuelFlow);
                localStorage.setItem('fastPlanner_passengerWeight', passengerWeight);
                localStorage.setItem('fastPlanner_cargoWeight', cargoWeight);
                localStorage.setItem('fastPlanner_reserveMethod', reserveMethod);
                localStorage.setItem('fastPlanner_reserveFuel', taxiFuel);
                localStorage.setItem('fastPlanner_taxiFuel', taxiFuel);
                localStorage.setItem('fastPlanner_contingencyFuelPercent', contingencyFuelPercent);
                console.log('Global flight settings saved to localStorage');
              } catch (error) {
                console.error('Error saving settings to localStorage:', error);
              }
            }}
          >
            Save as Global
          </button>
          
          {selectedAircraft && (
            <button 
              className="control-button"
              style={{ 
                backgroundColor: '#006644', 
                backgroundImage: 'linear-gradient(to bottom, #00aa77, #006644)'
              }}
              onClick={() => {
                // Get the key to use for storage
                const storageKey = `aircraft_${selectedAircraft.registration}`;
                
                // Create settings object
                const settings = {
                  deckTimePerStop,
                  deckFuelPerStop,
                  deckFuelFlow,
                  taxiFuel,
                  contingencyFuelPercent,
                  reserveMethod,
                  passengerWeight,
                  cargoWeight
                };
                
                // Show confirmation message
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                  loadingOverlay.textContent = `Settings saved for ${selectedAircraft.registration}!`;
                  loadingOverlay.style.display = 'block';
                  
                  setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                  }, 1500);
                }
                
                // Call the saveAircraftSettings function via a custom event
                const event = new CustomEvent('save-aircraft-settings', {
                  detail: { key: storageKey, settings }
                });
                window.dispatchEvent(event);
              }}
            >
              Save for {selectedAircraft?.registration?.split(' (')[0]}
            </button>
          )}
          
          {aircraftType && aircraftType !== '' && (
            <button 
              className="control-button"
              style={{ 
                backgroundColor: '#004488', 
                backgroundImage: 'linear-gradient(to bottom, #0066cc, #004488)'
              }}
              onClick={() => {
                // Create settings object
                const settings = {
                  deckTimePerStop,
                  deckFuelPerStop,
                  deckFuelFlow,
                  taxiFuel,
                  contingencyFuelPercent,
                  reserveMethod,
                  passengerWeight,
                  cargoWeight
                };
                
                // Show confirmation message
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                  loadingOverlay.textContent = `Settings saved for all ${aircraftType} aircraft!`;
                  loadingOverlay.style.display = 'block';
                  
                  setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                  }, 1500);
                }
                
                // Call the saveAircraftSettings function via a custom event
                const event = new CustomEvent('save-aircraft-settings', {
                  detail: { key: aircraftType, settings }
                });
                window.dispatchEvent(event);
              }}
            >
              Save for {aircraftType} Type
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsCard;