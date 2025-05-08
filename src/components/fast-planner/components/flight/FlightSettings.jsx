import React, { useEffect } from 'react';

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
  // Add debug logging when settings change
  useEffect(() => {
    console.log('⚙️ FlightSettings received settings:', settings);
  }, [settings]);
  
  // Handler for input changes - enhanced with debugging
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Enhanced debug logging for changed values
    console.log(`⚙️ Input field "${name}" changed to "${value}" (${typeof value})`);
    
    // Allow any input to pass through (empty string or number)
    if (value === '') {
      // Allow empty string during editing
      console.log(`⚙️ Setting ${name} to empty string temporarily`);
      
      // For empty strings, still update the parent but with a default value
      // This ensures the UI remains responsive
      const updateObject = {
        [name]: 0 // Default to 0 when the field is emptied
      };
      
      console.log(`⚙️ Sending update to parent with default value:`, updateObject);
      onSettingsChange(updateObject);
      
    } else {
      // Always parse as integer to avoid number-to-string conversion issues
      // For example, "90" should be saved as 90 (number), not "90" (string)
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        console.log(`⚙️ Setting ${name} to ${numValue} (parsed as integer)`);
        
        // Send the updated value to the parent
        const updateObject = {
          [name]: numValue
        };
        
        // Log the update object
        console.log(`⚙️ Sending update to parent:`, updateObject);
        
        // Actually update
        onSettingsChange(updateObject);
      } else {
        console.warn(`⚙️ Warning: Could not parse "${value}" as a number for ${name}`);
        
        // Even with invalid input, send a default value to ensure UI updates
        const updateObject = {
          [name]: 0 // Default to 0 for invalid input
        };
        console.log(`⚙️ Sending default value to parent due to invalid input:`, updateObject);
        onSettingsChange(updateObject);
      }
    }
    
    // Force an immediate update globally
    const event = new Event('settings-changed');
    window.dispatchEvent(event);
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
              value={settings.passengerWeight || 0}
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
              value={settings.taxiFuel || 0}
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
              value={settings.reserveFuel || 0}
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
              value={settings.contingencyFuelPercent || 0}
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
              value={settings.deckTimePerStop || 0}
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
              value={settings.deckFuelFlow || 0}
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