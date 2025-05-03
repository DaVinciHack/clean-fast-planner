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
  aircraftType
}) => {
  
  // Add state for approach fuel
  const [approachFuel, setApproachFuel] = React.useState(150);
  
  // Load saved approach fuel when a new aircraft is selected
  React.useEffect(() => {
    if (selectedAircraft) {
      // Try to load aircraft-specific approachFuel
      try {
        const storageKey = `aircraft_${selectedAircraft.registration}`;
        const savedSettingsJson = localStorage.getItem(`fastPlanner_settings_${storageKey}`);
        
        if (savedSettingsJson) {
          const savedSettings = JSON.parse(savedSettingsJson);
          if (savedSettings.approachFuel !== undefined) {
            setApproachFuel(savedSettings.approachFuel);
          }
        } else if (aircraftType) {
          // Try type-specific settings
          const typeSettingsJson = localStorage.getItem(`fastPlanner_settings_${aircraftType}`);
          if (typeSettingsJson) {
            const typeSettings = JSON.parse(typeSettingsJson);
            if (typeSettings.approachFuel !== undefined) {
              setApproachFuel(typeSettings.approachFuel);
            }
          }
        }
      } catch (error) {
        console.error('Error loading approach fuel setting:', error);
      }
    }
  }, [selectedAircraft, aircraftType]);
  
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
        />
        
        {/* Additional settings */}
        <h4>Additional Settings</h4>
        
        <div className="input-group">
          <div>
            <label htmlFor="cargo-weight">Payload:</label>
            <input 
              type="number" 
              id="cargo-weight" 
              defaultValue={cargoWeight || 0}
              min="0" 
              max="5000"
              step="10"
              onChange={(e) => onCargoWeightChange(parseInt(e.target.value, 10) || 0)}
            />
            <span className="unit">lbs</span>
          </div>
          <div>
            <label htmlFor="approach-fuel">Approach/ARA Fuel:</label>
            <input 
              type="number" 
              id="approach-fuel" 
              value={approachFuel}
              min="0" 
              max="1000"
              step="10"
              onChange={(e) => {
                // Update state value immediately
                const value = parseInt(e.target.value, 10) || 0;
                setApproachFuel(value);
                console.log(`Approach Fuel changed to ${value}`);
              }}
            />
            <span className="unit">lbs</span>
          </div>
        </div>
      
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* First priority: Save for specific aircraft */}
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
                
                // Create settings object with ALL settings
                const settings = {
                  deckTimePerStop,
                  deckFuelPerStop,
                  deckFuelFlow,
                  taxiFuel,
                  contingencyFuelPercent,
                  reserveMethod,
                  passengerWeight,
                  cargoWeight,
                  reserveFuel,
                  approachFuel
                };
                
                // Show confirmation message using LoadingIndicator
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(`Settings saved for ${selectedAircraft.registration}!`);
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
          
          {/* Second priority: Save for aircraft type */}
          {aircraftType && aircraftType !== '' && (
            <button 
              className="control-button"
              style={{ 
                backgroundColor: '#004488', 
                backgroundImage: 'linear-gradient(to bottom, #0066cc, #004488)'
              }}
              onClick={() => {
                // Create settings object with ALL settings
                const settings = {
                  deckTimePerStop,
                  deckFuelPerStop,
                  deckFuelFlow,
                  taxiFuel,
                  contingencyFuelPercent,
                  reserveMethod,
                  passengerWeight,
                  cargoWeight,
                  reserveFuel,
                  approachFuel
                };
                
                // Show confirmation message using LoadingIndicator
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(`Settings saved for all ${aircraftType} aircraft!`);
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
          
          {/* Third priority: Save as global */}
          <button 
            className="control-button"
            onClick={() => {
              // Show confirmation message using LoadingIndicator
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator('Global flight settings saved!');
              }
              
              // Save to localStorage for persistence as global settings
              try {
                localStorage.setItem('fastPlanner_deckTimePerStop', deckTimePerStop);
                localStorage.setItem('fastPlanner_deckFuelPerStop', deckFuelPerStop);
                localStorage.setItem('fastPlanner_deckFuelFlow', deckFuelFlow);
                localStorage.setItem('fastPlanner_passengerWeight', passengerWeight);
                localStorage.setItem('fastPlanner_cargoWeight', cargoWeight);
                localStorage.setItem('fastPlanner_reserveMethod', reserveMethod);
                localStorage.setItem('fastPlanner_reserveFuel', reserveFuel);
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
        </div>
      </div>
    </div>
  );
};

export default SettingsCard;