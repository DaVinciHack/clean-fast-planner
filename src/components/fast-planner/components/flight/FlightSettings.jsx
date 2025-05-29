import React, { useEffect, useState } from 'react';
import './FlightSettings.css';

/**
 * Flight Settings Component
 * 
 * Enhanced with fuel policy integration:
 * - Fuel Policy dropdown (region-specific)
 * - Policy-driven defaults with manual overrides
 * - Read-only policy values display
 * - Editable flight-specific settings
 */
const FlightSettings = ({
  settings,
  onSettingsChange,
  fuelPolicy = null,
  currentRegion = null,
  selectedAircraft = null
}) => {
  // Get available policies and current policy info
  const availablePolicies = fuelPolicy?.availablePolicies || [];
  const currentPolicy = fuelPolicy?.currentPolicy;
  const policySettings = fuelPolicy?.getCurrentPolicySettings();
  
  // Local state for display values that might be overridden
  const [localDeckTime, setLocalDeckTime] = useState(settings?.deckTimePerStop || 15);
  const [localTaxiFuel, setLocalTaxiFuel] = useState(settings?.taxiFuel || 50);
  const [localReserveFuel, setLocalReserveFuel] = useState(settings?.reserveFuel || 600);
  
  // Update local state when settings change from parent
  useEffect(() => {
    if (settings?.deckTimePerStop !== undefined) setLocalDeckTime(settings.deckTimePerStop);
    if (settings?.taxiFuel !== undefined) setLocalTaxiFuel(settings.taxiFuel);
    if (settings?.reserveFuel !== undefined) setLocalReserveFuel(settings.reserveFuel);
  }, [settings]);
  
  // Handle fuel policy selection
  const handlePolicyChange = (e) => {
    const policyUuid = e.target.value;
    const selectedPolicy = availablePolicies.find(p => p.uuid === policyUuid);
    
    if (selectedPolicy && fuelPolicy?.selectPolicy) {
      console.log(`Switching to fuel policy: ${selectedPolicy.name}`);
      fuelPolicy.selectPolicy(selectedPolicy);
      
      // Update local settings with new policy defaults
      setLocalDeckTime(selectedPolicy.deckFuelTime || 15);
      setLocalTaxiFuel(selectedPolicy.fuelTypes.taxiFuel.default || 50);
      setLocalReserveFuel(selectedPolicy.fuelTypes.reserveFuel.default || 600);
      
      // Also notify parent of the changes
      onSettingsChange({
        deckTimePerStop: selectedPolicy.deckFuelTime || 15,
        taxiFuel: selectedPolicy.fuelTypes.taxiFuel.default || 50,
        reserveFuel: selectedPolicy.fuelTypes.reserveFuel.default || 600
      });
    }
  };

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
      
      {/* Fuel Policy Selection */}
      {availablePolicies.length > 0 && (
        <div className="settings-group fuel-policy-section">
          <div>
            <label htmlFor="fuelPolicy">Fuel Policy</label>
            <select
              id="fuelPolicy"
              value={currentPolicy?.uuid || ''}
              onChange={handlePolicyChange}
              className="fuel-policy-select"
            >
              <option value="">Select Policy...</option>
              {availablePolicies.map(policy => (
                <option key={policy.uuid} value={policy.uuid}>
                  {policy.name}
                </option>
              ))}
            </select>
            {currentPolicy && (
              <div className="policy-info">
                <small>Region: {currentPolicy.region}</small>
                {currentPolicy.description && (
                  <small className="policy-description">{currentPolicy.description}</small>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Policy-Driven Settings Display (Read-Only) */}
      {policySettings && (
        <div className="settings-group policy-settings">
          <h5>Policy Settings (Read-Only)</h5>
          <div className="policy-display-grid">
            <div className="policy-item">
              <label>Contingency Fuel (Flight Legs)</label>
              <span className="policy-value">{policySettings.contingencyFlightLegs}%</span>
            </div>
            <div className="policy-item">
              <label>Contingency Fuel (Alternate)</label>
              <span className="policy-value">{policySettings.contingencyAlternate}%</span>
            </div>
            {selectedAircraft && (
              <div className="policy-item">
                <label>Aircraft Type</label>
                <span className="policy-value">{selectedAircraft.type || selectedAircraft.aircraftType || 'Unknown'}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Editable Flight-Specific Settings */}
      <div className="settings-group editable-settings">
        <h5>Flight Overrides (Editable)</h5>
        
        {/* Deck Time */}
        <div className="input-group">
          <label htmlFor="deckTime">Deck Time</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="deckTime"
              name="deckTimePerStop"
              value={localDeckTime}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setLocalDeckTime(value);
                onSettingsChange({ deckTimePerStop: value });
              }}
              min="0"
              max="120"
              step="5"
            />
            <span className="unit">min</span>
          </div>
          <div className="small-hint">
            {policySettings ? `Policy default: ${policySettings.deckTime} min` : 'Minutes per stop'}
          </div>
        </div>
        
        {/* Taxi Fuel */}
        <div className="input-group">
          <label htmlFor="taxiFuel">Taxi Fuel</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="taxiFuel"
              name="taxiFuel"
              value={localTaxiFuel}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setLocalTaxiFuel(value);
                onSettingsChange({ taxiFuel: value });
              }}
              min="0"
              max="200"
              step="10"
            />
            <span className="unit">lbs</span>
          </div>
          <div className="small-hint">
            {policySettings ? `Policy default: ${policySettings.taxiFuel} lbs` : 'Taxi and ground operations'}
          </div>
        </div>
        
        {/* Reserve Fuel */}
        <div className="input-group">
          <label htmlFor="reserveFuel">Reserve Fuel</label>
          <div className="input-with-unit">
            <input
              type="number"
              id="reserveFuel"
              name="reserveFuel"
              value={localReserveFuel}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setLocalReserveFuel(value);
                onSettingsChange({ reserveFuel: value });
              }}
              min="0"
              max="2000"
              step="50"
            />
            <span className="unit">lbs</span>
          </div>
          <div className="small-hint">
            {policySettings ? `Policy default: ${policySettings.reserveFuel} lbs` : 'Emergency reserve fuel'}
          </div>
        </div>
      </div>
      
      {/* Passenger Settings */}
      <div className="settings-group passenger-settings">
        <h5>Passenger Settings</h5>
        <div className="input-group">
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
      
      <div className="small-hint fuel-note">
        💡 Fuel policies auto-load with region/aircraft selection. Manual overrides saved with flight.
      </div>
    </div>
  );
};

export default FlightSettings;