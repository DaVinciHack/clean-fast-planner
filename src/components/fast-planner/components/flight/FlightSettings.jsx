import React from 'react';

/**
 * Flight Settings Component
 * 
 * A component that provides inputs for configuring flight calculations:
 * - Passenger weight
 * - Fuel settings (contingency, taxi, reserve)
 * - Deck operation settings
 */
const FlightSettings = ({
  settings,
  onSettingsChange
}) => {
  // Handler for input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Allow any input to pass through (empty string or number)
    if (value === '') {
      // Allow empty string during editing
      console.log(`Setting ${name} to empty string temporarily`);
      e.target.value = '';
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        console.log(`Setting ${name} to ${numValue}`);
        // Send the updated value to the parent
        onSettingsChange({
          [name]: numValue
        });
      }
    }
  };
  
  return (
    <div className="flight-settings">
      <h4>Flight Settings</h4>
      
      {/* Passenger Settings */}
      <div className="settings-group">
        <div>
          <label htmlFor="passengerWeight">Passenger Weight</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="passengerWeight"
              name="passengerWeight"
              defaultValue={settings.passengerWeight || 220}
              onChange={handleChange}
              min="100"
              max="300"
              step="5"
            />
            <span className="unit">lbs</span>
          </div>
          <div className="small-hint">Including baggage</div>
        </div>
      </div>
      
      {/* Fuel Settings */}
      <h4>Fuel Settings</h4>
      <div className="settings-group">
        <div>
          <label htmlFor="taxiFuel">Taxi Fuel</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="taxiFuel"
              name="taxiFuel"
              defaultValue={settings.taxiFuel || 50}
              onChange={handleChange}
              min="0"
              max="500"
              step="5"
            />
            <span className="unit">lbs</span>
          </div>
        </div>
        <div>
          <label htmlFor="reserveFuel">Reserve Fuel</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="reserveFuel"
              name="reserveFuel"
              defaultValue={settings.reserveFuel || 600}
              onChange={handleChange}
              min="0"
              max="2000"
              step="10"
            />
            <span className="unit">lbs</span>
          </div>
        </div>
      </div>
      
      <div className="settings-group">
        <div>
          <label htmlFor="contingencyFuelPercent">Contingency</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="contingencyFuelPercent"
              name="contingencyFuelPercent"
              defaultValue={settings.contingencyFuelPercent || 10}
              onChange={handleChange}
              min="0"
              max="100"
              step="1"
            />
            <span className="unit">%</span>
          </div>
        </div>
      </div>
      
      {/* Deck Operations Settings */}
      <h4>Deck Operations</h4>
      <div className="settings-group">
        <div>
          <label htmlFor="deckTimePerStop">Deck Time</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="deckTimePerStop"
              name="deckTimePerStop"
              defaultValue={settings.deckTimePerStop || 5}
              onChange={handleChange}
              min="1"
              max="60"
              step="1"
            />
            <span className="unit">mins</span>
          </div>
        </div>
        <div>
          <label htmlFor="deckFuelFlow">Deck Fuel Flow</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="deckFuelFlow"
              name="deckFuelFlow"
              defaultValue={settings.deckFuelFlow || 400}
              onChange={handleChange}
              min="100"
              max="1000"
              step="10"
            />
            <span className="unit">lbs/hr</span>
          </div>
        </div>
      </div>
      
      <div className="small-hint">
        Note: Deck fuel is not applied to the final destination
      </div>
    </div>
  );
};

export default FlightSettings;