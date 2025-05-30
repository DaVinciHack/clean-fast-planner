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
  
  // Enhanced debugging for region and policy data (reduced frequency)
  useEffect(() => {
    // Only log when something meaningful changes
    const hasChanges = currentRegion?.osdkRegion || availablePolicies.length > 0 || currentPolicy || selectedAircraft;
    if (hasChanges) {
      console.log('🔍 FlightSettings DEBUG: Component state check');
      console.log('  - currentRegion:', currentRegion?.name, currentRegion?.osdkRegion);
      console.log('  - availablePolicies count:', availablePolicies.length);
      console.log('  - currentPolicy:', currentPolicy?.name || 'NONE');
      console.log('  - selectedAircraft:', selectedAircraft?.registration || 'NONE');
    }
  }, [currentRegion?.osdkRegion, availablePolicies.length, currentPolicy?.name, selectedAircraft?.registration]);
  
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
    
  }, [filteredPolicies, selectedAircraft?.registration, currentPolicy?.uuid]); // Fixed dependencies
  
  // Filter policies by current region
  // Calculate reserve fuel based on policy type and aircraft
  const calculateReserveFuel = React.useMemo(() => {
    if (!currentPolicy || !selectedAircraft) {
      return { fuel: 0, time: 0, method: 'fixed' };
    }

    const reserveType = currentPolicy.fuelTypes.reserveFuel.type || 'fixed';
    const policyValue = currentPolicy.fuelTypes.reserveFuel.default || 0;

    if (reserveType === 'time' && selectedAircraft.fuelBurn) {
      // Time-based: time (minutes) × fuel flow (lbs/hour) ÷ 60
      const timeMinutes = policyValue;
      const fuelFlowPerHour = selectedAircraft.fuelBurn;
      const fuelAmount = Math.round((timeMinutes * fuelFlowPerHour) / 60);
      
      console.log(`🔧 Reserve Fuel Calc: ${timeMinutes} min × ${fuelFlowPerHour} lbs/hr = ${fuelAmount} lbs`);
      
      return {
        fuel: fuelAmount,
        time: timeMinutes,
        method: 'time'
      };
    } else {
      // Fixed amount
      return {
        fuel: policyValue,
        time: selectedAircraft.fuelBurn ? Math.round((policyValue * 60) / selectedAircraft.fuelBurn) : 0,
        method: 'fixed'
      };
    }
  }, [currentPolicy, selectedAircraft?.fuelBurn]);

  // Helper function to format contingency fuel display
  const formatContingencyFuel = React.useMemo(() => {
    return (value, type) => {
      if (!value) return '0';
      
      console.log(`🔧 CONTINGENCY FORMAT: value=${value}, type=${type}`);
      
      switch (type) {
        case 'percentage':
          return `${value}%`;
        case 'time':
          return `${value} min`;
        case 'fixed':
          return `${value} lbs`;
        default:
          // Fallback - if type is unclear, assume percentage for backwards compatibility
          console.log(`⚠️ CONTINGENCY: Unknown type "${type}", defaulting to percentage`);
          return `${value}%`;
      }
    };
  }, []);

  // Get all values from fuel policy (not browser storage)
  const policyValues = React.useMemo(() => {
    if (!policySettings) {
      return {
        taxiFuel: 0,
        contingencyFlightLegs: 5,
        contingencyFlightLegsType: 'percentage',
        contingencyAlternate: 5,
        contingencyAlternateType: 'percentage',
        deckTime: 15,
        approachFuel: 0,
        araFuel: 0
      };
    }

    return {
      taxiFuel: policySettings.taxiFuel ?? 0,
      contingencyFlightLegs: policySettings.contingencyFlightLegs ?? 0,
      contingencyFlightLegsType: policySettings.contingencyFlightLegsType ?? 'percentage',
      contingencyAlternate: policySettings.contingencyAlternate ?? 0,
      contingencyAlternateType: policySettings.contingencyAlternateType ?? 'percentage',
      deckTime: policySettings.deckTime ?? 15,
      approachFuel: policySettings.approachFuel ?? 0,
      araFuel: policySettings.araFuel || 0
    };
  }, [policySettings]);

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
            <span>{formatContingencyFuel(policyValues.contingencyFlightLegs, policyValues.contingencyFlightLegsType)}</span>
          </div>
          <div className="policy-box">
            <label>CONTINGENCY FUEL<br/>(ALTERNATE)</label>
            <span>{formatContingencyFuel(policyValues.contingencyAlternate, policyValues.contingencyAlternateType)}</span>
          </div>
          <div className="policy-box">
            <label>RESERVE FUEL</label>
            <span>
              {calculateReserveFuel.fuel} lbs
              <br/>
              ({calculateReserveFuel.time} min)
              {calculateReserveFuel.method === 'time' && (
                <>
                  <br/>
                  <small style={{color: '#9ca3af'}}>Time-based</small>
                </>
              )}
            </span>
          </div>
        </div>
        
        <div className="policy-row" style={{marginTop: '0.5rem'}}>
          <div className="policy-box">
            <label>TAXI FUEL</label>
            <span>{policyValues.taxiFuel} lbs</span>
          </div>
          <div className="policy-box">
            <label>DECK TIME</label>
            <span>{policyValues.deckTime} min</span>
          </div>
          <div className="policy-box">
            <label>APPROACH/ARA</label>
            <span>{policyValues.approachFuel} lbs</span>
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
              value={settings.passengerWeight || 220}
              onChange={(e) => handleInputChange('passengerWeight', e.target.value)}
            />
            <span>lbs</span>
          </div>
          
          <div className="override-field">
            <label>DECK TIME</label>
            <input 
              type="number" 
              value={settings.deckTimePerStop || policyValues.deckTime}
              onChange={(e) => handleInputChange('deckTimePerStop', e.target.value)}
              placeholder={policyValues.deckTime}
            />
            <span>min</span>
          </div>
          
          <div className="override-field">
            <label>TAXI FUEL</label>
            <input 
              type="number" 
              value={settings.taxiFuel || policyValues.taxiFuel}
              onChange={(e) => handleInputChange('taxiFuel', e.target.value)}
              placeholder={policyValues.taxiFuel}
            />
            <span>lbs</span>
          </div>
        </div>
        
        <div className="override-row" style={{marginTop: '0.5rem'}}>
          <div className="override-field">
            <label>EXTRA FUEL</label>
            <input 
              type="number" 
              value={settings.extraFuel || 0}
              onChange={(e) => handleInputChange('extraFuel', e.target.value)}
              placeholder="0"
            />
            <span>lbs</span>
          </div>
          
          <div className="override-field">
            <label>CARGO WEIGHT</label>
            <input 
              type="number" 
              value={settings.cargoWeight || 0}
              onChange={(e) => handleInputChange('cargoWeight', e.target.value)}
              placeholder="0"
            />
            <span>lbs</span>
          </div>
          
          <div className="override-field">
            <label>ADJUST FUEL</label>
            <input 
              type="number" 
              value={settings.adjustFuel || 0}
              onChange={(e) => handleInputChange('adjustFuel', e.target.value)}
              placeholder="0"
            />
            <span>lbs</span>
          </div>
        </div>
      </div>

      <div className="fuel-note">
        💡 Fuel policies auto-load with region/aircraft selection. Manual overrides saved with flight.
      </div>
    </div>
  );
};

export default FlightSettings;