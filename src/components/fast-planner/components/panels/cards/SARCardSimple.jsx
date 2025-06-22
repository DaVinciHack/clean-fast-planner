/**
 * SARCardSimple.jsx
 * 
 * Simplified SAR controls card component using the new SARManager architecture.
 * Pure UI component with no complex state management or calculations.
 * 
 * @aviation-safety: All displayed data is from real aircraft performance, no dummy values
 * @architecture: Pure UI component using SARManager for state
 */

import React from 'react';
import BaseCard from './BaseCard';
import { useSARManager } from '../../../managers/SARManager';

/**
 * Simplified SARCard Component
 * @param {Object} props - Component props
 * @param {string} props.id - Card ID for DOM identification
 * @param {Object} props.selectedAircraft - OSDK aircraft data
 * @param {Object} props.sarCalculation - SAR calculation results from parent
 */
const SARCardSimple = ({ 
  id, 
  selectedAircraft,
  sarCalculation = null
}) => {
  
  const {
    // Core State
    sarEnabled,
    takeoffFuel,
    sarWeight,
    timeOnTask,
    
    // Advanced Options
    showAdvancedOptions,
    desiredRadius,
    customReserveFuel,
    
    // Actions
    toggleSARMode,
    setTakeoffFuel,
    setSARWeight,
    setTimeOnTask,
    toggleAdvancedOptions,
    setDesiredRadius,
    setCustomReserveFuel,
    applyAircraftPresets,
    
    // Manager instance
    manager
  } = useSARManager();
  
  // Get status and validation from manager
  const sarStatus = manager.getStatus(selectedAircraft);
  const validation = manager.validateParameters(selectedAircraft);
  const aircraftCapability = manager.getAircraftCapability(selectedAircraft);
  
  // Check if aircraft has valid performance data
  const hasValidAircraft = selectedAircraft && 
    selectedAircraft.fuelBurn && 
    selectedAircraft.cruiseSpeed;
  
  return (
    <BaseCard title="SAR Range Calculator" id={id}>
      <div className="control-section">
        
        {/* SAR Mode Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input 
              type="checkbox" 
              checked={sarEnabled}
              onChange={toggleSARMode}
              style={{ marginRight: '8px' }}
            />
            <strong>Enable SAR Mode</strong>
          </label>
          
          {/* Status Display */}
          <div 
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: 'var(--input-bg)',
              color:
                sarStatus.status === 'operational' ? '#4caf50' :
                sarStatus.status === 'error' ? 'var(--accent-red)' :
                sarStatus.status === 'calculating' ? '#ffaa00' :
                'var(--label-color)',
              border: `1px solid ${
                sarStatus.status === 'operational' ? '#4caf50' :
                sarStatus.status === 'error' ? 'var(--accent-red)' :
                sarStatus.status === 'calculating' ? '#ffaa00' :
                'var(--input-border)'
              }`
            }}
          >
            {sarStatus.message}
          </div>
        </div>
        
        {/* Aircraft Information */}
        {selectedAircraft ? (
          <div style={{ marginBottom: '15px', padding: '8px', backgroundColor: 'var(--input-bg)', borderRadius: '4px', border: '1px solid var(--input-border)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color)' }}>
              {selectedAircraft.registration || selectedAircraft.rawRegistration || 'Unknown Registration'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--label-color)' }}>
              {selectedAircraft.modelType || selectedAircraft.modelName || 'Unknown Model'}
            </div>
            {hasValidAircraft ? (
              <div style={{ fontSize: '11px', color: 'var(--label-color)', marginTop: '4px' }}>
                Cruise: {selectedAircraft.cruiseSpeed} kts | Fuel Flow: {selectedAircraft.fuelBurn} lbs/hr
                {selectedAircraft.flatPitchFuelBurnDeckFuel && (
                  <>
                    <br />
                    Hover: {selectedAircraft.flatPitchFuelBurnDeckFuel} lbs/hr
                  </>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--accent-red)', marginTop: '4px' }}>
                ⚠️ Missing performance data
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            marginBottom: '15px', 
            padding: '8px', 
            backgroundColor: 'var(--input-bg)', 
            borderRadius: '4px',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            fontSize: '14px'
          }}>
            ⚠️ No aircraft selected
          </div>
        )}
        
        {/* SAR Parameters */}
        {sarEnabled && (
          <>
            {/* Aircraft Presets Button */}
            {hasValidAircraft && (
              <button 
                onClick={() => applyAircraftPresets(selectedAircraft)}
                style={{
                  width: '100%',
                  padding: '6px',
                  marginBottom: '10px',
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--button-bg)',
                  borderRadius: '4px',
                  color: 'var(--button-bg)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Auto-fill fuel and equipment weights based on aircraft type"
              >
                Apply Aircraft-Specific Presets
              </button>
            )}
            
            {/* Takeoff Fuel */}
            <label htmlFor="takeoff-fuel" style={{ display: 'block', marginBottom: '4px' }}>
              Takeoff Fuel (lbs):
            </label>
            <input 
              type="number" 
              id="takeoff-fuel"
              value={takeoffFuel}
              onChange={(e) => setTakeoffFuel(Number(e.target.value))}
              min="0"
              max={selectedAircraft?.maxFuel || 10000}
              step="50"
              className="route-input"
              style={{ 
                marginBottom: '8px',
                borderColor: validation.fuel.valid ? 'var(--input-border)' : 'var(--accent-red)'
              }}
            />
            {!validation.fuel.valid && (
              <div style={{ fontSize: '11px', color: 'var(--accent-red)', marginBottom: '8px' }}>
                {validation.fuel.message}
              </div>
            )}
            {selectedAircraft?.maxFuel && (
              <div style={{ fontSize: '11px', color: 'var(--label-color)', marginBottom: '10px' }}>
                Max capacity: {selectedAircraft.maxFuel} lbs ({Math.round(takeoffFuel / selectedAircraft.maxFuel * 100)}%)
              </div>
            )}
            
            {/* SAR Equipment Weight */}
            <label htmlFor="sar-weight" style={{ display: 'block', marginBottom: '4px' }}>
              SAR Equipment Weight (lbs):
            </label>
            <input 
              type="number" 
              id="sar-weight"
              value={sarWeight}
              onChange={(e) => setSARWeight(Number(e.target.value))}
              min="0"
              max="5000"
              step="10"
              className="route-input"
              style={{ 
                marginBottom: '8px',
                borderColor: validation.weight.valid ? 'var(--input-border)' : 'var(--accent-red)'
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--label-color)', marginBottom: '10px' }}>
              Includes rescue equipment, medical supplies, survivors
            </div>
            
            {/* Time on Task */}
            <label htmlFor="time-on-task" style={{ display: 'block', marginBottom: '4px' }}>
              Time on Task (hours):
            </label>
            <input 
              type="number" 
              id="time-on-task"
              value={timeOnTask}
              onChange={(e) => setTimeOnTask(Number(e.target.value))}
              min="0.1"
              max="10.0"
              step="0.1"
              className="route-input"
              style={{ 
                marginBottom: '8px',
                borderColor: validation.time.valid ? 'var(--input-border)' : 'var(--accent-red)'
              }}
            />
            
            {/* Time Slider */}
            <div style={{ marginBottom: '8px' }}>
              <style>{`
                .sar-time-slider {
                  width: 100%;
                  height: 6px;
                  border-radius: 3px;
                  background: var(--input-border);
                  outline: none;
                  opacity: 0.8;
                  transition: opacity 0.2s;
                  -webkit-appearance: none;
                  appearance: none;
                }
                .sar-time-slider:hover {
                  opacity: 1;
                }
                .sar-time-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: var(--button-bg);
                  cursor: pointer;
                }
                .sar-time-slider::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: var(--button-bg);
                  cursor: pointer;
                  border: none;
                }
              `}</style>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={timeOnTask}
                onChange={(e) => setTimeOnTask(Number(e.target.value))}
                className="sar-time-slider"
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '10px', 
                color: 'var(--label-color)',
                marginTop: '2px'
              }}>
                <span>6 min</span>
                <span>{Math.floor(timeOnTask)}h {Math.round((timeOnTask % 1) * 60)}m</span>
                <span>10 hrs</span>
              </div>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--label-color)', marginBottom: '15px' }}>
              Time spent in search pattern or rescue operations
            </div>
            
            {/* Advanced Options Toggle */}
            <button
              onClick={toggleAdvancedOptions}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {showAdvancedOptions ? '▼' : '▶'} Advanced Options
            </button>
            
            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--input-bg)', borderRadius: '4px' }}>
                <label htmlFor="desired-radius" style={{ display: 'block', marginBottom: '4px' }}>
                  Desired Radius (NM):
                </label>
                <input 
                  type="number" 
                  id="desired-radius"
                  value={desiredRadius}
                  onChange={(e) => setDesiredRadius(Number(e.target.value))}
                  min="1"
                  max="200"
                  step="1"
                  className="route-input"
                  style={{ marginBottom: '10px' }}
                />
                
                <label htmlFor="custom-reserve" style={{ display: 'block', marginBottom: '4px' }}>
                  Custom Reserve Fuel (lbs):
                </label>
                <input 
                  type="number" 
                  id="custom-reserve"
                  value={customReserveFuel || ''}
                  onChange={(e) => setCustomReserveFuel(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Use fuel policy default"
                  min="0"
                  className="route-input"
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--label-color)' }}>
                  Leave empty to use fuel policy reserve
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Results Display - uses calculation passed from parent */}
        {sarCalculation && sarEnabled && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ marginBottom: '10px' }}>SAR Calculation Results</h4>
            
            {sarCalculation.error ? (
              <div style={{ 
                padding: '10px',
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--accent-red)',
                borderRadius: '4px',
                color: 'var(--accent-red)'
              }}>
                <strong>❌ {sarCalculation.error}</strong>
                {sarCalculation.details && (
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    {typeof sarCalculation.details === 'object' ? (
                      Object.entries(sarCalculation.details).map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                      ))
                    ) : (
                      <div>{sarCalculation.details}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                padding: '10px',
                backgroundColor: 'var(--input-bg)',
                border: '1px solid #4caf50',
                borderRadius: '4px',
                color: 'var(--text-color)'
              }}>
                <div style={{ marginBottom: '8px', color: '#4caf50' }}>
                  <strong>🎯 Operational Radius: {sarCalculation.operationalRadiusNM} NM</strong>
                </div>
                
                <div style={{ fontSize: '12px', lineHeight: '1.4', color: 'var(--text-color)' }}>
                  <div>Remaining Fuel: {sarCalculation.remainingFuelLbs} lbs</div>
                  <div>SAR Endurance: {sarCalculation.sarEnduranceHours} hrs ({sarCalculation.sarEnduranceMinutes} min)</div>
                  <div>One-way Flight Time: {sarCalculation.oneWayFlightTime} min</div>
                </div>
                
                {/* Fuel Breakdown */}
                {sarCalculation.fuelBreakdown && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ fontSize: '12px', cursor: 'pointer', color: 'var(--text-color)' }}>Fuel Breakdown</summary>
                    <div style={{ fontSize: '11px', marginTop: '4px', paddingLeft: '15px', color: 'var(--label-color)' }}>
                      <div>Takeoff: {sarCalculation.fuelBreakdown.takeoffFuel} lbs</div>
                      <div>Route: {sarCalculation.fuelBreakdown.routeFuel} lbs</div>
                      <div>Alternate: {sarCalculation.fuelBreakdown.alternateFuel} lbs</div>
                      <div>Reserve: {sarCalculation.fuelBreakdown.reserveFuel} lbs</div>
                      <div>SAR Task: {sarCalculation.fuelBreakdown.taskFuel} lbs</div>
                      <div><strong>Available: {sarCalculation.fuelBreakdown.operationalFuel} lbs</strong></div>
                    </div>
                  </details>
                )}
              </div>
            )}
            
            {/* Capability Analysis */}
            {aircraftCapability && aircraftCapability.hasCapabilityData && showAdvancedOptions && (
              <div style={{ marginTop: '10px' }}>
                <h5 style={{ marginBottom: '8px', color: 'var(--text-color)' }}>Aircraft Capability Analysis</h5>
                
                {aircraftCapability.maxWeight?.success && (
                  <div style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--label-color)' }}>
                    Max SAR Weight: {aircraftCapability.maxWeight.maxSARWeight} lbs
                  </div>
                )}
                
                {aircraftCapability.minFuel?.success && (
                  <div style={{ fontSize: '12px', color: 'var(--label-color)' }}>
                    Min Fuel for {desiredRadius} NM radius: {aircraftCapability.minFuel.minimumFuel} lbs
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default SARCardSimple;