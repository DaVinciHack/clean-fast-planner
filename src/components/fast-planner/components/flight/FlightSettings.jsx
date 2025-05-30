import React, { useEffect } from 'react';
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
  
  // Enhanced debugging for region and policy data
  useEffect(() => {
    console.log('🔍 FlightSettings DEBUG: Component state check');
    console.log('  - currentRegion:', currentRegion);
    console.log('  - currentRegion.osdkRegion:', currentRegion?.osdkRegion);
    console.log('  - availablePolicies count:', availablePolicies.length);
    console.log('  - availablePolicies regions:', availablePolicies.map(p => p.region));
    console.log('  - currentPolicy:', currentPolicy?.name || 'NONE');
    console.log('  - selectedAircraft:', selectedAircraft?.registration || 'NONE');
  }, [currentRegion, availablePolicies, currentPolicy, selectedAircraft]);
  
  // Filter policies by current region with enhanced matching
  const filteredPolicies = React.useMemo(() => {
    if (!currentRegion?.osdkRegion) {
      console.log('🔍 FlightSettings: No osdkRegion, returning all policies');
      return availablePolicies;
    }
    
    const targetRegion = currentRegion.osdkRegion;
    console.log(`🔍 FlightSettings: Filtering policies for region: "${targetRegion}"`);
    
    const filtered = availablePolicies.filter(policy => {
      const match = policy.region === targetRegion;
      console.log(`  - Policy "${policy.name}" (region: "${policy.region}") matches: ${match}`);
      return match;
    });
    
    console.log(`🔍 FlightSettings: Filtered to ${filtered.length} policies from ${availablePolicies.length} total`);
    
    if (filtered.length !== availablePolicies.length) {
      console.log(`🚨 FlightSettings: FILTERING APPLIED! Reduced from ${availablePolicies.length} to ${filtered.length} policies`);
      console.log(`🚨 FlightSettings: Expected region: "${targetRegion}"`);
      console.log(`🚨 FlightSettings: Available policy regions: [${availablePolicies.map(p => `"${p.region}"`).join(', ')}]`);
    }
    
    return filtered;
  }, [availablePolicies, currentRegion?.osdkRegion]);
  
  // Enhanced auto-selection logic with priority: flight → aircraft → region
  useEffect(() => {
    if (!filteredPolicies.length) {
      console.log('⚠️ FlightSettings: No filtered policies available for auto-selection');
      return;
    }
    
    console.log('🎯 FlightSettings: Running auto-selection logic...');
    console.log(`   Available policies: ${filteredPolicies.map(p => p.name).join(', ')}`);
    
    // Priority 1: Check if we already have a current policy that's still valid
    if (currentPolicy && filteredPolicies.find(p => p.uuid === currentPolicy.uuid)) {
      console.log(`✅ FlightSettings: Current policy "${currentPolicy.name}" is still valid, keeping it`);
      return;
    }
    
    // Priority 2: Aircraft-specific policy selection
    if (selectedAircraft && safeFuelPolicy.selectDefaultPolicyForAircraft) {
      console.log(`🛩️ FlightSettings: Attempting aircraft-specific policy selection for ${selectedAircraft.registration}`);
      const aircraftPolicy = safeFuelPolicy.selectDefaultPolicyForAircraft(selectedAircraft);
      if (aircraftPolicy && filteredPolicies.find(p => p.uuid === aircraftPolicy.uuid)) {
        console.log(`✅ FlightSettings: Selected aircraft-specific policy: ${aircraftPolicy.name}`);
        return; // selectDefaultPolicyForAircraft already calls selectPolicy
      }
    }
    
    // Priority 3: Default to first available policy in region
    console.log('🌍 FlightSettings: Using first available policy as default');
    const firstPolicy = filteredPolicies[0];
    if (firstPolicy && safeFuelPolicy.selectPolicy) {
      console.log(`✅ FlightSettings: Auto-selecting first policy: ${firstPolicy.name}`);
      safeFuelPolicy.selectPolicy(firstPolicy);
    }
    
  }, [filteredPolicies, selectedAircraft, currentPolicy, safeFuelPolicy]);
  
  // Filter policies by current region
  const handleInputChange = (field, value) => {
    console.log(`🔧 FlightSettings: Input change - ${field}: ${value}`);
    const numValue = Number(value) || 0;
    onSettingsChange({ [field]: numValue });
  };

  const handlePolicyChange = (e) => {
    const policyUuid = e.target.value;
    console.log(`🎯 FlightSettings: Policy dropdown changed to UUID: ${policyUuid}`);
    
    if (!policyUuid) {
      console.log('⚠️ FlightSettings: Empty UUID selected, clearing policy');
      return;
    }
    
    const selectedPolicy = filteredPolicies.find(p => p.uuid === policyUuid);
    console.log(`🔍 FlightSettings: Found policy:`, selectedPolicy?.name || 'NOT FOUND');
    
    if (selectedPolicy && safeFuelPolicy.selectPolicy) {
      console.log(`✅ FlightSettings: Selecting policy: ${selectedPolicy.name}`);
      safeFuelPolicy.selectPolicy(selectedPolicy);
    } else {
      console.error('❌ FlightSettings: Policy selection failed', {
        selectedPolicy: !!selectedPolicy,
        selectPolicyFunction: !!safeFuelPolicy.selectPolicy,
        policyUuid,
        availablePolicyUuids: filteredPolicies.map(p => p.uuid)
      });
    }
  };

  return (
    <div className="flight-settings">
      {/* Fuel Policy Section */}
      <div className="fuel-policy-section">
        <h5>FUEL POLICY</h5>
        <div className="region-display">
          REGION: {currentRegion?.name || currentRegion?.id || 'UNKNOWN'}
          {currentRegion?.osdkRegion && currentRegion.osdkRegion !== currentRegion.name && (
            <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}> (OSDK: {currentRegion.osdkRegion})</span>
          )}
        </div>
        
        {/* Debug information */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: '0.5rem' }}>
            Debug: {filteredPolicies.length} policies available, Current: {currentPolicy?.name || 'None'}
          </div>
        )}
        
        <select 
          value={currentPolicy?.uuid || ''} 
          onChange={handlePolicyChange}
          className="policy-dropdown"
          disabled={filteredPolicies.length === 0}
        >
          <option value="">
            {filteredPolicies.length === 0 ? 'No policies available' : 'Select Policy...'}
          </option>
          {filteredPolicies.map(policy => (
            <option key={policy.uuid} value={policy.uuid}>
              {policy.name}
            </option>
          ))}
        </select>
        
        {/* Show loading state */}
        {safeFuelPolicy.isLoading && (
          <div style={{ fontSize: '0.7rem', color: '#4FC3F7', marginTop: '0.5rem' }}>
            Loading policies...
          </div>
        )}
        
        {/* Show error state */}
        {safeFuelPolicy.error && (
          <div style={{ fontSize: '0.7rem', color: '#f44336', marginTop: '0.5rem' }}>
            Error: {safeFuelPolicy.error}
          </div>
        )}
        
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