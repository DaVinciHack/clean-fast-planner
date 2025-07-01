/**
 * PassengerInputStep.jsx
 * 
 * Clean, simple wizard step for passenger input after aircraft selection.
 * Dark mode, matching existing UI colors.
 */

import React, { useState, useEffect, useRef } from 'react';

const PassengerInputStep = ({
  flightData = {},
  onFlightDataUpdate = () => {},
  className = ''
}) => {
  const [wantsPassengers, setWantsPassengers] = useState(false);
  const [passengerData, setPassengerData] = useState({});
  
  // Use ref to track current flight data without causing re-renders
  const flightDataRef = useRef(flightData);
  flightDataRef.current = flightData;

  // Get aircraft max passengers for validation
  const maxPassengers = flightData.aircraft?.maxPassengers || 19;
  const standardPassengerWeight = 220; // From regional settings

  // Build flight legs from current flight data
  const flightLegs = React.useMemo(() => {
    const legs = [];
    
    if (flightData.departure) {
      // Departure leg
      legs.push({
        id: 'departure',
        name: `${flightData.departure.name || flightData.departure.id} → ${flightData.landings?.[0]?.name || flightData.landings?.[0]?.id || 'First Stop'}`,
        type: 'departure'
      });
      
      // Intermediate legs
      if (flightData.landings && flightData.landings.length > 1) {
        for (let i = 0; i < flightData.landings.length - 1; i++) {
          legs.push({
            id: `leg-${i}`,
            name: `${flightData.landings[i].name || flightData.landings[i].id} → ${flightData.landings[i + 1].name || flightData.landings[i + 1].id}`,
            type: 'intermediate'
          });
        }
      }
    }
    
    return legs;
  }, [flightData.departure, flightData.landings]);

  // Initialize passenger data for each leg
  useEffect(() => {
    const initialData = {};
    flightLegs.forEach(leg => {
      initialData[leg.id] = {
        passengerCount: 0,
        totalWeight: 0,
        bagWeight: 0,
        separateBags: false
      };
    });
    setPassengerData(initialData);
  }, [flightLegs]);

  // Update flight data when passenger data changes
  useEffect(() => {
    // Only update if we have meaningful data or state changes
    if (Object.keys(passengerData).length > 0 || wantsPassengers) {
      onFlightDataUpdate({
        ...flightDataRef.current,
        passengers: {
          enabled: wantsPassengers,
          legData: passengerData
        }
      });
    }
  }, [wantsPassengers, passengerData, onFlightDataUpdate]);

  const handlePassengerCountChange = (legId, count) => {
    const passengerCount = Math.max(0, Math.min(maxPassengers, parseInt(count) || 0));
    const autoWeight = passengerCount * standardPassengerWeight;
    
    setPassengerData(prev => ({
      ...prev,
      [legId]: {
        ...prev[legId],
        passengerCount,
        totalWeight: prev[legId].separateBags ? autoWeight : autoWeight // Auto-fill unless user override
      }
    }));
  };

  const handleTotalWeightChange = (legId, weight) => {
    setPassengerData(prev => ({
      ...prev,
      [legId]: {
        ...prev[legId],
        totalWeight: Math.max(0, parseInt(weight) || 0)
      }
    }));
  };

  const handleBagWeightChange = (legId, weight) => {
    setPassengerData(prev => ({
      ...prev,
      [legId]: {
        ...prev[legId],
        bagWeight: Math.max(0, parseInt(weight) || 0)
      }
    }));
  };

  const handleSeparateBagsChange = (legId, separate) => {
    setPassengerData(prev => ({
      ...prev,
      [legId]: {
        ...prev[legId],
        separateBags: separate,
        bagWeight: separate ? prev[legId].bagWeight : 0
      }
    }));
  };

  if (!wantsPassengers) {
    return (
      <div className={`passenger-input-step ${className}`} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        color: 'white'
      }}>
        <h2 style={{ 
          color: '#4FC3F7', 
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          Want to add passengers?
        </h2>
        
        <button
          onClick={() => setWantsPassengers(true)}
          style={{
            padding: '12px 24px',
            border: '1px solid #4FC3F7',
            borderRadius: '6px',
            background: 'linear-gradient(to bottom, #1f2937, #111827)',
            color: '#4FC3F7',
            fontSize: '1em',
            fontWeight: 'normal',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(to bottom, #2a3a47, #1a2a37)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
          }}
        >
          Add Passengers
        </button>
      </div>
    );
  }

  return (
    <div className={`passenger-input-step ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ color: '#4FC3F7', marginBottom: '2px', fontSize: '1.1em' }}>
          Passenger Details
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.8em', margin: '0' }}>
          Max {maxPassengers} passengers for this aircraft
        </p>
      </div>

      {/* Flight Legs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {flightLegs.map((leg) => {
          const legData = passengerData[leg.id] || {};
          
          return (
            <div
              key={leg.id}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {/* Leg Name */}
              <div style={{ 
                color: '#4FC3F7', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                fontSize: '0.9em',
                textAlign: 'center'
              }}>
                {leg.name}
              </div>
              
              {/* Inputs - Centered and Friendly */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                alignItems: 'center'
              }}>
                {!legData.separateBags ? (
                  /* Simple Mode - Passengers and Total Weight */
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    {/* Passenger Count */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.8em', 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        Passengers
                      </label>
                      <input
                        type="number"
                        value={legData.passengerCount || 0}
                        onChange={(e) => handlePassengerCountChange(leg.id, e.target.value)}
                        min="0"
                        max={maxPassengers}
                        className="wizard-input"
                        style={{
                          width: '100px',
                          padding: '8px 12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'white',
                          fontSize: '16px',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#6a5acd';
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>

                    {/* Total Weight */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.8em', 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        Total Weight (lbs)
                      </label>
                      <input
                        type="number"
                        value={legData.totalWeight || 0}
                        onChange={(e) => handleTotalWeightChange(leg.id, e.target.value)}
                        min="0"
                        className="wizard-input"
                        style={{
                          width: '140px',
                          padding: '8px 12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'white',
                          fontSize: '16px',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#6a5acd';
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Advanced Mode - Passengers | Pax Weight | Bag Weight | Total */
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    {/* Passenger Count */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.8em', 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        Passengers
                      </label>
                      <input
                        type="number"
                        value={legData.passengerCount || 0}
                        onChange={(e) => handlePassengerCountChange(leg.id, e.target.value)}
                        min="0"
                        max={maxPassengers}
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'white',
                          fontSize: '16px',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#6a5acd';
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>

                    {/* Combined Passenger Weight (all passengers together) */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.8em', 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        Pax Weight
                      </label>
                      <input
                        type="number"
                        value={legData.totalWeight - (legData.bagWeight || 0)}
                        onChange={(e) => {
                          const paxWeight = parseInt(e.target.value) || 0;
                          const newTotal = paxWeight + (legData.bagWeight || 0);
                          handleTotalWeightChange(leg.id, newTotal);
                        }}
                        min="0"
                        style={{
                          width: '90px',
                          padding: '8px 12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'white',
                          fontSize: '16px',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#6a5acd';
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>

                    {/* Combined Bag Weight (all bags together) */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.8em', 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        Bag Weight
                      </label>
                      <input
                        type="number"
                        value={legData.bagWeight || 0}
                        onChange={(e) => {
                          const bagWeight = parseInt(e.target.value) || 0;
                          const paxWeight = legData.totalWeight - (legData.bagWeight || 0);
                          const newTotal = paxWeight + bagWeight;
                          setPassengerData(prev => ({
                            ...prev,
                            [leg.id]: {
                              ...prev[leg.id],
                              bagWeight,
                              totalWeight: newTotal
                            }
                          }));
                        }}
                        min="0"
                        style={{
                          width: '90px',
                          padding: '8px 12px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'white',
                          fontSize: '16px',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#6a5acd';
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>

                    {/* Total Display - Same Height */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.8em', 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        Total
                      </label>
                      <div style={{
                        width: '90px',
                        padding: '8px 12px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        color: '#4FC3F7',
                        fontSize: '16px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                        height: '39px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {legData.totalWeight || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Separate Bags Checkbox - Centered */}
                <div style={{ marginTop: '8px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    color: 'rgba(255, 255, 255, 0.8)',
                    justifyContent: 'center'
                  }}>
                    <input
                      type="checkbox"
                      checked={legData.separateBags || false}
                      onChange={(e) => handleSeparateBagsChange(leg.id, e.target.checked)}
                      style={{ 
                        cursor: 'pointer', 
                        transform: 'scale(1.1)',
                        accentColor: '#4FC3F7'
                      }}
                    />
                    Add bags separately
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PassengerInputStep;