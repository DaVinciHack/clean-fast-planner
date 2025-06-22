/**
 * SARCard.jsx
 * 
 * SAR (Search and Rescue) controls card component.
 * Provides user interface for SAR mode parameters and displays real-time calculations
 * using authentic OSDK aircraft performance data.
 * 
 * @aviation-safety: All displayed data is from real aircraft performance, no dummy values
 * @integration: Works with SARMode hook for state management and calculations
 */

import React, { useEffect } from 'react';
import BaseCard from './BaseCard';
import { useSARMode } from '../../../modes/SARMode';

/**
 * SARCard Component
 * @param {Object} props - Component props
 * @param {string} props.id - Card ID for DOM identification
 * @param {Object} props.selectedAircraft - OSDK aircraft data
 * @param {Object} props.routeStats - Main route statistics
 * @param {Object} props.alternateStats - Alternate route statistics
 * @param {Object} props.fuelPolicy - Current fuel policy
 * @param {Array} props.waypoints - Current route waypoints
 * @param {Function} props.onSARUpdate - Callback when SAR data updates
 */
const SARCard = ({ 
  id, 
  selectedAircraft, 
  routeStats, 
  alternateStats, 
  fuelPolicy,
  waypoints,
  stopCards,
  onSARUpdate 
}) => {
  
  console.log('🚁 SARCard MOUNTED/RENDERED - id:', id);
  console.log('🚁 SARCard render called with props:', {
    id,
    hasSelectedAircraft: !!selectedAircraft,
    hasRouteStats: !!routeStats,
    hasAlternateStats: !!alternateStats,
    hasFuelPolicy: !!fuelPolicy,
    waypointsCount: waypoints?.length || 0,
    stopCardsCount: stopCards?.length || 0,
    hasOnSARUpdate: !!onSARUpdate
  });
  
  const {
    // Core State
    sarEnabled,
    takeoffFuel,
    sarWeight,
    timeOnTask,
    
    // Advanced Options
    showAdvancedOptions,
    setShowAdvancedOptions,
    desiredRadius,
    setDesiredRadius,
    customReserveFuel,
    setCustomReserveFuel,
    
    // Control Functions
    toggleSARMode,
    updateTakeoffFuel,
    updateSARWeight,
    updateTimeOnTask,
    applyAircraftPresets,
    
    // Calculation Results
    sarCalculation,
    aircraftCapability,
    
    // Status Properties
    hasValidAircraft,
    isOperational,
    calculationInProgress,
    
    // Derived Data
    routeFuel,
    alternateFuel,
    reserveFuel,
    actualRemainingFuel,
    
    // UI Helpers
    getSARStatus,
    getParameterValidation
  } = useSARMode({
    selectedAircraft,
    routeStats,
    alternateStats,
    fuelPolicy,
    waypoints,
    stopCards,
    onSARUpdate
  });
  
  const sarStatus = getSARStatus();
  const validation = getParameterValidation();
  
  console.log('🚁 SARCard: sarCalculation from useSARMode:', sarCalculation);
  
  // Handle SAR updates to parent component (done here to avoid race conditions in hook)
  useEffect(() => {
    console.log('🚁 SARCard useEffect triggered:', {
      sarEnabled,
      waypointCount: waypoints?.length || 0,
      waypoints: waypoints?.map(wp => ({ name: wp.name, coords: wp.coords, id: wp.id })),
      hasSarCalculation: !!sarCalculation,
      sarCalculationRadius: sarCalculation?.operationalRadiusNM,
      hasOnSARUpdate: !!onSARUpdate,
      hasSelectedAircraft: !!selectedAircraft,
      hasRouteStats: !!routeStats,
      hasFuelPolicy: !!fuelPolicy
    });
    
    if (onSARUpdate && sarEnabled) {
      // Get the final waypoint from the current waypoints
      const finalWaypoint = waypoints && waypoints.length > 0 ? 
        (() => {
          const lastWaypoint = waypoints[waypoints.length - 1];
          console.log('🚁 SARCard checking last waypoint:', lastWaypoint);
          
          // Handle both coordinate formats: coords array [lng, lat] or direct lat/lng properties
          let lat, lng;
          if (lastWaypoint.coords && Array.isArray(lastWaypoint.coords) && lastWaypoint.coords.length >= 2) {
            lng = lastWaypoint.coords[0];
            lat = lastWaypoint.coords[1];
          } else if (lastWaypoint.lat && lastWaypoint.lng) {
            lat = lastWaypoint.lat;
            lng = lastWaypoint.lng;
          } else {
            console.warn('🚁 SARCard: Last waypoint has no valid coordinates:', lastWaypoint);
            return null;
          }
          
          console.log('🚁 SARCard: Using final waypoint coordinates:', { lat, lng, name: lastWaypoint.name });
          return {
            lat,
            lng,
            name: lastWaypoint.name || 'Final Waypoint'
          };
        })() : null;
      
      console.log('🚁 SARCard sending update:', {
        hasCalculation: !!sarCalculation,
        finalWaypoint,
        enabled: sarEnabled
      });
      
      onSARUpdate({
        calculation: sarCalculation,
        finalWaypoint,
        enabled: sarEnabled,
        parameters: {
          takeoffFuel,
          sarWeight,
          timeOnTask
        }
      });
    } else if (onSARUpdate && !sarEnabled) {
      // Send disabled state
      console.log('🚁 SARCard sending disabled state');
      onSARUpdate({
        calculation: null,
        finalWaypoint: null,
        enabled: false,
        parameters: null
      });
    }
  }, [
    sarEnabled,
    waypoints?.length, 
    waypoints?.[waypoints?.length - 1]?.coords?.[0], // Only track final waypoint lng
    waypoints?.[waypoints?.length - 1]?.coords?.[1], // Only track final waypoint lat
    sarCalculation?.operationalRadiusNM, // Only track the radius result
    takeoffFuel,
    sarWeight,
    timeOnTask
  ]);
  
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
              backgroundColor: 
                sarStatus.status === 'operational' ? 'var(--input-bg)' :
                sarStatus.status === 'error' ? 'var(--input-bg)' :
                sarStatus.status === 'calculating' ? 'var(--input-bg)' :
                'var(--input-bg)',
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
        
        {/* Real-World SAR Analysis */}
        {actualRemainingFuel && sarEnabled && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: 'var(--input-bg)', 
            borderRadius: '4px',
            border: `1px solid ${actualRemainingFuel.warningNoAlternate ? 'var(--accent-red)' : '#4caf50'}`
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-color)' }}>
              🎯 Real-World SAR Analysis
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text-color)', marginBottom: '6px' }}>
              <div>Route Fuel Used: {actualRemainingFuel.routeFuelUsed} lbs</div>
              <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                Fuel Remaining: {actualRemainingFuel.remainingFuel} lbs
              </div>
              <div>Operational Radius: {actualRemainingFuel.operationalRadius.toFixed(1)} NM</div>
            </div>
            
            {actualRemainingFuel.warningNoAlternate && (
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--accent-red)', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                padding: '4px 6px',
                borderRadius: '3px',
                marginTop: '6px'
              }}>
                ⚠️ No alternate set - Add alternate for safe SAR operations
              </div>
            )}
            
            {actualRemainingFuel.hasAlternate && (
              <div style={{ 
                fontSize: '11px', 
                color: '#4caf50', 
                marginTop: '6px' 
              }}>
                ✅ Alternate route configured - Safe for SAR operations
              </div>
            )}
          </div>
        )}
        
        {/* SAR Parameters */}
        {sarEnabled && (
          <>
            {/* Aircraft Presets Button */}
            {hasValidAircraft && (
              <button 
                onClick={applyAircraftPresets}
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
              onChange={(e) => updateTakeoffFuel(Number(e.target.value))}
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
              onChange={(e) => updateSARWeight(Number(e.target.value))}
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
              onChange={(e) => updateTimeOnTask(Number(e.target.value))}
              min="0.1"
              max="4.0"
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
                max="4.0"
                step="0.1"
                value={timeOnTask}
                onChange={(e) => updateTimeOnTask(Number(e.target.value))}
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
                <span>{Math.round(timeOnTask * 60)} min</span>
                <span>4 hrs</span>
              </div>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--label-color)', marginBottom: '15px' }}>
              Time spent in search pattern or rescue operations
            </div>
            
            {/* Advanced Options Toggle */}
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
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
                  placeholder={`Policy: ${reserveFuel} lbs`}
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
        
        {/* Results Display */}
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
                
                {/* Weight and Balance */}
                {sarCalculation.totalPayload && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ fontSize: '12px', cursor: 'pointer', color: 'var(--text-color)' }}>Weight & Balance</summary>
                    <div style={{ fontSize: '11px', marginTop: '4px', paddingLeft: '15px', color: 'var(--label-color)' }}>
                      <div>Total Payload: {sarCalculation.totalPayload} lbs</div>
                      <div>Useful Load: {sarCalculation.usefulLoad} lbs</div>
                      <div>Remaining Capacity: {sarCalculation.remainingPayloadCapacity} lbs</div>
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
            
            {calculationInProgress && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '10px' 
              }}>
                🔄 Calculating...
              </div>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default SARCard;