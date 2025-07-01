/**
 * EnhancedFuelSummary.jsx
 * 
 * Interactive fuel summary with real-time adjustments
 * Allows pilots to override fuel components with live recalculation
 */

import React, { useState, useMemo, useCallback } from 'react';

const EnhancedFuelSummary = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  waypoints = [],
  onFuelAdjustment = () => {} // Callback for real-time updates
}) => {
  
  // State for fuel adjustments per stop
  const [fuelAdjustments, setFuelAdjustments] = useState({});
  
  // Determine stop types (rig vs airport)
  const getStopType = (stopName) => {
    // Simple heuristic - rigs usually have numbers, airports have 4-letter codes
    if (stopName && stopName.match(/\d/)) return 'rig';
    if (stopName && stopName.length === 4 && stopName.match(/^[A-Z]+$/)) return 'airport';
    return 'unknown';
  };
  
  // Handle adjustment changes
  const handleAdjustment = useCallback((stopIndex, fuelType, value) => {
    const numValue = parseInt(value) || 0;
    
    setFuelAdjustments(prev => ({
      ...prev,
      [stopIndex]: {
        ...prev[stopIndex],
        [fuelType]: numValue
      }
    }));
    
    // Trigger real-time recalculation
    onFuelAdjustment(stopIndex, fuelType, numValue);
  }, [onFuelAdjustment]);
  
  // Reset adjustments for a stop
  const resetStop = useCallback((stopIndex) => {
    setFuelAdjustments(prev => {
      const newAdj = { ...prev };
      delete newAdj[stopIndex];
      return newAdj;
    });
    
    // Trigger reset in parent
    onFuelAdjustment(stopIndex, 'reset', null);
  }, [onFuelAdjustment]);
  
  // Process stop data with adjustments
  const processedStops = useMemo(() => {
    return stopCards.map((card, index) => {
      const stopType = getStopType(card.name);
      const adjustments = fuelAdjustments[index] || {};
      const isDeparture = index === 0;
      const isRefuelStop = card.refuelMode === true;
      const canAddExtraFuel = isDeparture || isRefuelStop;
      
      return {
        ...card,
        index,
        stopType,
        isDeparture,
        isRefuelStop,
        canAddExtraFuel,
        adjustments,
        
        // Adjusted fuel values (original + adjustments)
        adjustedExtraFuel: (card.extraFuel || 0) + (adjustments.extraFuel || 0),
        adjustedAraFuel: (card.araFuel || 0) + (adjustments.araFuel || 0),
        adjustedApproachFuel: (card.approachFuel || 0) + (adjustments.approachFuel || 0),
        adjustedDeckTime: (card.deckTime || 15) + (adjustments.deckTime || 0), // Default 15 min
      };
    });
  }, [stopCards, fuelAdjustments]);
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        width: '1200px',
        overflow: 'hidden',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: '#4FC3F7',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            🛩️ Interactive Fuel Summary
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#333',
              border: '1px solid #666',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '20px',
          maxHeight: 'calc(90vh - 120px)',
          overflowY: 'auto',
          color: '#fff'
        }}>
          
          {/* Interactive Fuel Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#333' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '80px' }}>Stop</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '100px' }}>Required Fuel</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '80px' }}>Extra Fuel</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '80px' }}>ARA Fuel</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '80px' }}>Approach</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '80px' }}>Deck Time</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '12px', minWidth: '60px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedStops.map((stop, index) => (
                  <tr key={index} style={{
                    backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#1e1e1e',
                    borderBottom: '1px solid #333'
                  }}>
                    
                    {/* Stop Name */}
                    <td style={{ padding: '12px 8px', color: '#fff', fontWeight: '600', fontSize: '12px' }}>
                      <div>{stop.name}</div>
                      {stop.isDeparture && <div style={{ color: '#4FC3F7', fontSize: '10px' }}>(Departure)</div>}
                      {stop.isRefuelStop && <div style={{ color: '#FF6B35', fontSize: '10px' }}>(REFUEL)</div>}
                      {stop.isDestination && <div style={{ color: '#66BB6A', fontSize: '10px' }}>(Destination)</div>}
                    </td>
                    
                    {/* Required Fuel */}
                    <td style={{ padding: '12px 8px', color: '#fff', fontSize: '12px' }}>
                      <div style={{ fontWeight: '600' }}>
                        {Math.round(stop.totalFuel || 0).toLocaleString()} lbs
                      </div>
                    </td>
                    
                    {/* Extra Fuel Input */}
                    <td style={{ padding: '8px' }}>
                      {stop.canAddExtraFuel ? (
                        <input
                          type="number"
                          min="0"
                          value={stop.adjustments.extraFuel || ''}
                          onChange={(e) => handleAdjustment(index, 'extraFuel', e.target.value)}
                          placeholder={Math.round(stop.extraFuel || 0).toString()}
                          style={{
                            width: '60px',
                            padding: '4px 6px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#fff',
                            fontSize: '11px',
                            textAlign: 'center'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#666', fontSize: '11px' }}>-</span>
                      )}
                      {stop.canAddExtraFuel && (
                        <div style={{ color: '#999', fontSize: '9px', marginTop: '2px' }}>
                          Default: {Math.round(stop.extraFuel || 0)}
                        </div>
                      )}
                    </td>
                    
                    {/* ARA Fuel Input (rigs only) */}
                    <td style={{ padding: '8px' }}>
                      {stop.stopType === 'rig' ? (
                        <input
                          type="number"
                          min="0"
                          value={stop.adjustments.araFuel || ''}
                          onChange={(e) => handleAdjustment(index, 'araFuel', e.target.value)}
                          placeholder={Math.round(stop.araFuel || 0).toString()}
                          style={{
                            width: '60px',
                            padding: '4px 6px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#fff',
                            fontSize: '11px',
                            textAlign: 'center'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#666', fontSize: '11px' }}>-</span>
                      )}
                      {stop.stopType === 'rig' && (
                        <div style={{ color: '#999', fontSize: '9px', marginTop: '2px' }}>
                          Auto: {Math.round(stop.araFuel || 0)}
                        </div>
                      )}
                    </td>
                    
                    {/* Approach Fuel Input (airports only) */}
                    <td style={{ padding: '8px' }}>
                      {stop.stopType === 'airport' ? (
                        <input
                          type="number"
                          min="0"
                          value={stop.adjustments.approachFuel || ''}
                          onChange={(e) => handleAdjustment(index, 'approachFuel', e.target.value)}
                          placeholder={Math.round(stop.approachFuel || 0).toString()}
                          style={{
                            width: '60px',
                            padding: '4px 6px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#fff',
                            fontSize: '11px',
                            textAlign: 'center'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#666', fontSize: '11px' }}>-</span>
                      )}
                      {stop.stopType === 'airport' && (
                        <div style={{ color: '#999', fontSize: '9px', marginTop: '2px' }}>
                          Auto: {Math.round(stop.approachFuel || 0)}
                        </div>
                      )}
                    </td>
                    
                    {/* Deck Time Input (all stops except destination) */}
                    <td style={{ padding: '8px' }}>
                      {!stop.isDestination ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={stop.adjustments.deckTime || ''}
                            onChange={(e) => handleAdjustment(index, 'deckTime', e.target.value)}
                            placeholder="15"
                            style={{
                              width: '40px',
                              padding: '4px 6px',
                              backgroundColor: '#333',
                              border: '1px solid #555',
                              borderRadius: '3px',
                              color: '#fff',
                              fontSize: '11px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ color: '#999', fontSize: '9px', marginTop: '2px' }}>min</span>
                        </div>
                      ) : (
                        <span style={{ color: '#666', fontSize: '11px' }}>-</span>
                      )}
                    </td>
                    
                    {/* Reset Button */}
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => resetStop(index)}
                        disabled={!stop.adjustments || Object.keys(stop.adjustments).length === 0}
                        style={{
                          background: Object.keys(stop.adjustments || {}).length > 0 ? '#FF6B35' : '#444',
                          border: 'none',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          cursor: Object.keys(stop.adjustments || {}).length > 0 ? 'pointer' : 'not-allowed',
                          opacity: Object.keys(stop.adjustments || {}).length > 0 ? 1 : 0.5
                        }}
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#ccc'
          }}>
            <div style={{ color: '#4FC3F7', fontWeight: '600', marginBottom: '8px' }}>Legend:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div>• <strong>Extra Fuel:</strong> Only at departure + refuel stops</div>
              <div>• <strong>ARA Fuel:</strong> Only for rig approaches</div>
              <div>• <strong>Approach Fuel:</strong> Only for airport approaches</div>
              <div>• <strong>Deck Time:</strong> Ground time per stop (minutes)</div>
            </div>
            <div style={{ marginTop: '8px', color: '#999' }}>
              💡 Values update in real-time. Empty fields use calculated defaults.
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default EnhancedFuelSummary;