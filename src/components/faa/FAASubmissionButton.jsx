// FAA Submission Button - Simplified for FastPlanner Integration
import React, { useState } from 'react';

const FAASubmissionButton = ({ 
  flightPlanData, 
  onSubmissionSuccess = () => {}, 
  style = {},
  className = ""
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just simulate success
    const mockFlightPlanId = 'FP' + Date.now().toString().slice(-6);
    alert(`✈️ Flight Plan Submitted Successfully!\n\nFlight Plan ID: ${mockFlightPlanId}\n\n(This is a demo - backend integration needed for actual FAA submission)`);
    onSubmissionSuccess(mockFlightPlanId);
    setIsModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        style={{
          flex: 1,
          background: 'linear-gradient(to bottom, #1f2937, #111827)',
          color: '#ffffff',
          border: '1px solid #6b7280',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '11px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#6b7280';
          e.target.style.borderColor = '#6b7280';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
          e.target.style.borderColor = '#6b7280';
        }}
        className={className}
      >
        <span style={{ marginRight: '4px' }}>✈️</span>
        Submit Flight Plan
      </button>
      
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(8px)'
          }}
          onClick={handleClose}
        >
          <div 
            style={{
              background: '#2d2d2d',
              borderRadius: '16px',
              width: '520px',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
              border: '1px solid #404040'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem 2rem 1rem 2rem',
              borderBottom: '1px solid #404040',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Submit Flight Plan to FAA</h2>
              <button 
                onClick={handleClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'white',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '1.25rem', background: '#1c1c1e', color: '#e5e5e7' }}>
              {/* Remove the ICAO preview wrapper - just show the cards directly */}
              <h3 style={{ margin: '0 0 1rem 0', color: '#e5e5e7', fontSize: '0.95rem', fontWeight: '600' }}>📋 ICAO Flight Plan Preview</h3>
              
              {/* Aircraft Details */}
              <div style={{
                background: '#2c2c2e',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
                border: '1px solid #38383a'
              }}>
                <div style={{ color: '#64b5f6', fontWeight: '600', marginBottom: '0.6rem', fontSize: '0.8rem' }}>Aircraft & Flight Details</div>
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {/* Single column for long registration */}
                  <div style={{ marginBottom: '0.4rem' }}><span style={{ color: '#8e8e93' }}>Registration:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.tailNumber}</span></div>
                  {/* Two columns for shorter fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><span style={{ color: '#8e8e93' }}>Aircraft Type:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.aircraftType}</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Flight Rules:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.flightRules}</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Equipment:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.equipment || 'SG'}</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Wake Category:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.wakeCategory || 'L'}</span></div>
                  </div>
                </div>
              </div>
              
              {/* Route Information */}
              <div style={{
                background: '#2c2c2e',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
                border: '1px solid #38383a'
              }}>
                <div style={{ color: '#4ade80', fontWeight: '600', marginBottom: '0.6rem', fontSize: '0.8rem' }}>Route Information</div>
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {/* Two columns for departure/destination */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div><span style={{ color: '#8e8e93' }}>Departure:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.departure?.airport} at {flightPlanData?.departure?.time}Z</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Destination:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.destination?.airport}</span></div>
                  </div>
                  {/* Single column for long route */}
                  <div style={{ marginBottom: '0.4rem' }}><span style={{ color: '#8e8e93' }}>Route:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.route?.replace(/\s+/g, ', ')}</span></div>
                  {/* Two columns for shorter fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><span style={{ color: '#8e8e93' }}>Altitude:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.altitude} ft</span></div>
                    <div><span style={{ color: '#8e8e93' }}>True Airspeed:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.airspeed} kts</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Flight Time:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.destination?.estimatedTime}</span></div>
                    {flightPlanData?.alternateAirport && (
                      <div><span style={{ color: '#8e8e93' }}>Alternate:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData.alternateAirport}</span></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Pilot & Passenger Info */}
              <div style={{
                background: '#2c2c2e',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
                border: '1px solid #38383a'
              }}>
                <div style={{ color: '#fbbf24', fontWeight: '600', marginBottom: '0.6rem', fontSize: '0.8rem' }}>Pilot & Passenger Info</div>
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {/* Single column for pilot name */}
                  <div style={{ marginBottom: '0.4rem' }}><span style={{ color: '#8e8e93' }}>Pilot in Command:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.pilotName}</span></div>
                  {/* Two columns for shorter fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {flightPlanData?.pilotPhone && (
                      <div><span style={{ color: '#8e8e93' }}>Contact:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData.pilotPhone}</span></div>
                    )}
                    <div><span style={{ color: '#8e8e93' }}>Persons on Board:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.personsOnBoard || 1}</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Fuel on Board:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.fuelOnBoard}</span></div>
                    {flightPlanData?.endurance && (
                      <div><span style={{ color: '#8e8e93' }}>Endurance:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData.endurance}</span></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Emergency & Remarks */}
              <div style={{
                background: '#2c2c2e',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #38383a'
              }}>
                <div style={{ color: '#f87171', fontWeight: '600', marginBottom: '0.6rem', fontSize: '0.8rem' }}>Emergency & Remarks</div>
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {/* Two columns for emergency equipment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div><span style={{ color: '#8e8e93' }}>Emergency Equipment:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.emergencyEquipment || 'R/V/S/J'}</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Life Jackets:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.lifeJackets || 'L/F/U/V'}</span></div>
                    <div><span style={{ color: '#8e8e93' }}>Dinghies:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData?.dinghies || 'D/4/C'}</span></div>
                  </div>
                  {/* Single column for remarks */}
                  {flightPlanData?.remarks && (
                    <div><span style={{ color: '#8e8e93' }}>Remarks:</span> <span style={{ color: '#e5e5e7' }}>{flightPlanData.remarks}</span></div>
                  )}
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f9fafb', fontSize: '1rem' }}>🔐 Pilot Credentials</h3>
                <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Enter your 1800WX-BRIEF / Leidos Flight Service credentials
                </p>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#f9fafb', fontSize: '0.9rem' }}>
                    Username:
                  </label>
                  <input 
                    type="text" 
                    placeholder="Your pilot username"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      background: '#374151',
                      color: '#f9fafb'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#f9fafb', fontSize: '0.9rem' }}>
                    Password:
                  </label>
                  <input 
                    type="password" 
                    placeholder="Your pilot password"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      background: '#374151',
                      color: '#f9fafb'
                    }}
                    required
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #374151'
                }}>
                  <button 
                    type="button" 
                    onClick={handleClose}
                    style={{
                      padding: '0.6rem 1.2rem',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      background: '#374151',
                      color: '#f9fafb'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      padding: '0.6rem 1.2rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    ✈️ Submit to FAA
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FAASubmissionButton;
