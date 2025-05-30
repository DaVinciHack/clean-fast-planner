import React from 'react';
import './FlightSettings.css';

const FlightSettings = ({
  settings = {},
  onSettingsChange = () => {},
  fuelPolicy = null,
  currentRegion = null,
  selectedAircraft = null
}) => {
  
  const safeFuelPolicy = fuelPolicy || {};
  const availablePolicies = safeFuelPolicy.availablePolicies || [];
  const currentPolicy = safeFuelPolicy.currentPolicy;
  const policySettings = safeFuelPolicy.getCurrentPolicySettings?.() || {};
  
  const handleInputChange = (field, value) => {
    const numValue = Number(value) || 0;
    onSettingsChange({ [field]: numValue });
  };

  const handlePolicyChange = (e) => {
    const policyUuid = e.target.value;
    const selectedPolicy = availablePolicies.find(p => p.uuid === policyUuid);
    if (selectedPolicy && safeFuelPolicy.selectPolicy) {
      safeFuelPolicy.selectPolicy(selectedPolicy);
    }
  };

  return (
    <div className="flight-settings">
      {/* Fuel Policy Section */}
      <div className="fuel-policy-section">
        <h5>FUEL POLICY</h5>
        <div className="region-display">REGION: {currentRegion?.name || currentRegion?.id || 'UNKNOWN'}</div>
        
        <select 
          value={currentPolicy?.uuid || ''} 
          onChange={handlePolicyChange}
          className="policy-dropdown"
        >
          <option value="">Select Policy...</option>
          {availablePolicies.map(policy => (
            <option key={policy.uuid} value={policy.uuid}>
              {policy.name}
            </option>
          ))}
        </select>
        
        {currentPolicy?.description && (
          <div className="policy-desc">{currentPolicy.description}</div>
        )}
      </div>

      {/* Policy Settings Read-Only */}
      <div className="policy-settings">
        <h5>POLICY SETTINGS (READ-ONLY)</h5>
        <div className="policy-row">
          <div className="policy-box">
            <label>CONTINGENCY FUEL<br/>(FLIGHT LEGS)</label>
            <span>{policySettings.contingencyFlightLegs || 0}%</span>
          </div>
          <div className="policy-box">
            <label>CONTINGENCY FUEL<br/>(ALTERNATE)</label>
            <span>{policySettings.contingencyAlternate || 0}%</span>
          </div>          <div className="policy-box">
            <label>RESERVE FUEL</label>
            <span>{policySettings.reserveFuel || 0} lbs<br/>({policySettings.reserveTime || 0} min)</span>
          </div>
        </div>
      </div>

      {/* Flight Overrides */}
      <div className="flight-overrides">
        <h5>FLIGHT OVERRIDES (EDITABLE)</h5>
        <div className="override-row">
          <div className="override-field">
            <label>PAX WEIGHT</label>
            <input 
              type="number" 
              value={settings.passengerWeight || 0}
              onChange={(e) => handleInputChange('passengerWeight', e.target.value)}
            />
            <span>lbs</span>
          </div>
          
          <div className="override-field">
            <label>DECK TIME</label>
            <input 
              type="number" 
              value={settings.deckTimePerStop || 0}
              onChange={(e) => handleInputChange('deckTimePerStop', e.target.value)}
            />
            <span>min</span>
          </div>
          
          <div className="override-field">
            <label>TAXI FUEL</label>
            <input 
              type="number" 
              value={settings.taxiFuel || 0}
              onChange={(e) => handleInputChange('taxiFuel', e.target.value)}
            />
            <span>lbs</span>
          </div>
        </div>
      </div>

      {/* Adjust Fuel */}
      <div className="adjust-fuel">
        <h5>ADJUST FUEL</h5>
        <div className="adjust-input">
          <input 
            type="number" 
            value={settings.adjustFuel || 0}
            onChange={(e) => handleInputChange('adjustFuel', e.target.value)}
          />
          <span>lbs</span>
        </div>
      </div>

      <div className="fuel-note">
        💡 Fuel policies auto-load with region/aircraft selection. Manual overrides saved with flight.
      </div>
    </div>
  );
};

export default FlightSettings;