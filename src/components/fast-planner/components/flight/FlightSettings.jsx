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
    
    // Convert to number and update (allow empty string for better UX)
    if (value === '') {
      // Allow empty string during editing, send 0 to maintain number type
      onSettingsChange({
        ...settings,
        [name]: 0
      });
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onSettingsChange({
          ...settings,
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
              value={settings.passengerWeight || ''}
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
              value={settings.taxiFuel || ''}
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
              value={settings.reserveFuel || ''}
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
              value={settings.contingencyFuelPercent || ''}
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
              value={settings.deckTimePerStop || ''}
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
              value={settings.deckFuelFlow || ''}
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