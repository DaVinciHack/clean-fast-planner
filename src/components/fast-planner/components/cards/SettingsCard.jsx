import React from 'react';
import FlightSettings from '../flight/FlightSettings';
import '../../FastPlannerStyles.css';
import { useAircraft } from '../../context/AircraftContext';

/**
 * SettingsCard Component
 * 
 * Manages flight settings including passenger weight, taxi fuel, 
 * fuel reserve, contingency fuel, deck time, and other configuration options.
 */
const SettingsCard = () => {
  // Access aircraft context to get settings and methods
  const { 
    selectedAircraft,
    flightSettings,
    setDeckTimePerStop,
    setDeckFuelPerStop,
    setDeckFuelFlow,
    setPassengerWeight,
    setCargoWeight,
    setTaxiFuel,
    setContingencyFuelPercent,
    setReserveMethod,
    aircraftType
  } = useAircraft();
  
  // Handler for flight settings changes
  const handleFlightSettingsChange = (newSettings) => {
    console.log("Flight settings changed:", newSettings);
    
    // Log each setting change for debugging
    Object.keys(newSettings).forEach(key => {
      console.log(`Setting ${key} changed to:`, newSettings[key]);
    });
    
    // Update the state for each setting
    if (newSettings.passengerWeight !== undefined) {
      setPassengerWeight(newSettings.passengerWeight);
    }
    
    if (newSettings.reserveFuel !== undefined) {
      setReserveFuel(newSettings.reserveFuel);
    }
    
    if (newSettings.deckTimePerStop !== undefined) {
      setDeckTimePerStop(newSettings.deckTimePerStop);
    }
    
    if (newSettings.deckFuelFlow !== undefined) {
      setDeckFuelFlow(newSettings.deckFuelFlow);
    }
    
    if (newSettings.taxiFuel !== undefined) {
      setTaxiFuel(newSettings.taxiFuel);
    }
    
    if (newSettings.contingencyFuelPercent !== undefined) {
      setContingencyFuelPercent(newSettings.contingencyFuelPercent);
    }
  };
  
  return (
    <div className="tab-content settings-tab">
      <h3>Flight Settings</h3>
      <div className="control-section">
        {/* Render our FlightSettings component */}
        <FlightSettings 
          settings={flightSettings}
          onSettingsChange={handleFlightSettingsChange}
        />
      
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
                localStorage.setItem('fastPlanner_deckTimePerStop', flightSettings.deckTimePerStop);
                localStorage.setItem('fastPlanner_deckFuelPerStop', flightSettings.deckFuelPerStop);
                localStorage.setItem('fastPlanner_deckFuelFlow', flightSettings.deckFuelFlow);
                localStorage.setItem('fastPlanner_passengerWeight', flightSettings.passengerWeight);
                localStorage.setItem('fastPlanner_cargoWeight', flightSettings.cargoWeight);
                localStorage.setItem('fastPlanner_reserveMethod', flightSettings.reserveMethod);
                localStorage.setItem('fastPlanner_reserveFuel', flightSettings.reserveFuel);
                localStorage.setItem('fastPlanner_taxiFuel', flightSettings.taxiFuel);
                localStorage.setItem('fastPlanner_contingencyFuelPercent', flightSettings.contingencyFuelPercent);
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
                  deckTimePerStop: flightSettings.deckTimePerStop,
                  deckFuelPerStop: flightSettings.deckFuelPerStop,
                  deckFuelFlow: flightSettings.deckFuelFlow,
                  taxiFuel: flightSettings.taxiFuel,
                  contingencyFuelPercent: flightSettings.contingencyFuelPercent,
                  reserveFuel: flightSettings.reserveFuel,
                  reserveMethod: flightSettings.reserveMethod,
                  passengerWeight: flightSettings.passengerWeight,
                  cargoWeight: flightSettings.cargoWeight
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
                  deckTimePerStop: flightSettings.deckTimePerStop,
                  deckFuelPerStop: flightSettings.deckFuelPerStop,
                  deckFuelFlow: flightSettings.deckFuelFlow,
                  taxiFuel: flightSettings.taxiFuel,
                  contingencyFuelPercent: flightSettings.contingencyFuelPercent,
                  reserveFuel: flightSettings.reserveFuel,
                  reserveMethod: flightSettings.reserveMethod,
                  passengerWeight: flightSettings.passengerWeight,
                  cargoWeight: flightSettings.cargoWeight
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