import React, { useState, useEffect } from 'react';

/**
 * SaveFlightCard Component
 * 
 * A panel card for collecting flight details to save to Palantir
 * Designed to slide in from the right side like other cards
 */
const SaveFlightCard = ({ 
  id,
  onSave, 
  onCancel,
  isSaving, 
  initialFlightName = '',
  waypoints,
  onRunDiagnostic = null,
  runAutomation = true, // Default to true to match current behavior
  selectedAircraft
}) => {
  // Form state
  const [flightName, setFlightName] = useState(initialFlightName);
  const [etd, setEtd] = useState('');
  const [captainId, setCaptainId] = useState('');
  const [copilotId, setCopilotId] = useState('');
  const [medicId, setMedicId] = useState('');
  const [soId, setSoId] = useState('');
  const [rswId, setRswId] = useState('');
  const [enableAutomation, setEnableAutomation] = useState(runAutomation);
  
  // Set up initial values when card is shown
  useEffect(() => {
    // Generate a default flight name based on waypoints if not provided
    if (!initialFlightName && waypoints && waypoints.length >= 2) {
      const origin = waypoints[0].name || 'Origin';
      const destination = waypoints[waypoints.length - 1].name || 'Destination';
      const todayDate = new Date().toISOString().split('T')[0];
      setFlightName(`${origin} to ${destination} - ${todayDate}`);
    } else {
      setFlightName(initialFlightName);
    }
    
    // Default ETD to current time
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    setEtd(formattedDate);
    
    // Set initial automation state from props
    setEnableAutomation(runAutomation);
  }, [initialFlightName, waypoints, runAutomation]);
  
  // Handle form submission
  const handleSubmit = () => {
    if (!flightName || !etd) {
      return; // Don't submit if required fields are missing
    }
    
    const flightData = {
      flightName,
      etd,
      captainId: captainId || null,
      copilotId: copilotId || null,
      medicId: medicId || null,
      soId: soId || null,
      rswId: rswId || null,
      runAutomation: enableAutomation // Add the automation flag
    };
    
    onSave(flightData);
  };
  
  return (
    <div className="tab-content" style={{ maxWidth: '100%', width: '100%' }}>
      <div className="panel-header">
        <h3>Save Flight to Palantir</h3>
      </div>
      
      <div className="control-section">
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            Flight Name:
          </label>
          <input 
            type="text" 
            value={flightName} 
            onChange={e => setFlightName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            ETD (Estimated Time of Departure):
          </label>
          <input 
            type="datetime-local" 
            value={etd} 
            onChange={e => setEtd(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            Captain:
          </label>
          <input 
            type="text" 
            value={captainId} 
            onChange={e => setCaptainId(e.target.value)}
            placeholder="Enter Captain ID"
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            Copilot:
          </label>
          <input 
            type="text" 
            value={copilotId} 
            onChange={e => setCopilotId(e.target.value)}
            placeholder="Enter Copilot ID"
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            Medic:
          </label>
          <input 
            type="text" 
            value={medicId} 
            onChange={e => setMedicId(e.target.value)}
            placeholder="Enter Medic ID"
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            SO (Winch Operator):
          </label>
          <input 
            type="text" 
            value={soId} 
            onChange={e => setSoId(e.target.value)}
            placeholder="Enter SO ID"
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal',
            fontSize: '14px'
          }}>
            Rescue Swimmer:
          </label>
          <input 
            type="text" 
            value={rswId} 
            onChange={e => setRswId(e.target.value)}
            placeholder="Enter Rescue Swimmer ID"
            style={{ 
              width: '100%', 
              padding: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              color: 'white'
            }}
          />
        </div>
        
        {/* Add automation toggle checkbox */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 30, 30, 0.6)',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)'
          }}>
            <input
              type="checkbox"
              id="enable-automation"
              checked={enableAutomation}
              onChange={() => setEnableAutomation(!enableAutomation)}
              style={{
                width: '18px',
                height: '18px',
                marginRight: '10px'
              }}
            />
            <label 
              htmlFor="enable-automation"
              style={{
                cursor: 'pointer',
                fontWeight: 'normal',
                fontSize: '14px',
                color: enableAutomation ? '#4caf50' : '#ccc'
              }}
            >
              Run automation after saving 
              <span style={{ 
                fontSize: '12px', 
                marginLeft: '5px', 
                opacity: 0.7, 
                display: 'block'
              }}>
                Will find best runway, calculate wind effects, find alternates, optimize fuel and passenger count
              </span>
            </label>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '7px' }}>
          {/* Diagnostic button only shown if onRunDiagnostic is provided */}
          {onRunDiagnostic && (
            <button
              onClick={() => {
                onRunDiagnostic();
              }}
              style={{
                backgroundColor: '#444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 'normal',
                fontSize: '12px',
                height: '32px'
              }}
              className="control-button"
            >
              Diagnose API
            </button>
          )}
          
          {/* Test API Connection button */}
          <button
            onClick={async () => {
              try {
                // Show that we're working
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator('Testing API connection...');
                }
                
                // Import the SDK directly
                const sdk = await import('@flight-app/sdk');
                
                // Check if the actions exist
                const hasFlightAction = !!sdk.createNewFlightFp2;
                const hasAutomationAction = !!sdk.singleFlightAutomation;
                
                // Log what we found
                console.log('SDK Loaded:', !!sdk);
                console.log('createNewFlightFp2 action available:', hasFlightAction);
                console.log('singleFlightAutomation action available:', hasAutomationAction);
                console.log('All available SDK objects:', Object.keys(sdk));
                
                // Show in the UI
                if (window.LoadingIndicator) {
                  if (hasFlightAction && hasAutomationAction) {
                    window.LoadingIndicator.updateStatusIndicator(
                      'API connection successful: Both actions found', 
                      'success'
                    );
                  } else if (hasFlightAction) {
                    window.LoadingIndicator.updateStatusIndicator(
                      'API connection partial: createNewFlightFp2 found, automation missing', 
                      'warning'
                    );
                  } else if (hasAutomationAction) {
                    window.LoadingIndicator.updateStatusIndicator(
                      'API connection partial: singleFlightAutomation found, flight creation missing', 
                      'warning'
                    );
                  } else {
                    window.LoadingIndicator.updateStatusIndicator(
                      'API connection issue: Both actions missing', 
                      'error'
                    );
                  }
                }
              } catch (error) {
                console.error('API connection test error:', error);
                
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(
                    `API connection failed: ${error.message}`, 
                    'error'
                  );
                }
              }
            }}
            style={{
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              marginRight: 'auto',
              cursor: 'pointer',
              fontWeight: 'normal',
              fontSize: '12px',
              height: '32px'
            }}
            className="control-button"
          >
            Test API
          </button>
          
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              cursor: 'pointer',
              fontWeight: 'normal',
              height: '32px',
              flex: 1
            }}
            className="control-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !flightName || !etd}
            style={{
              backgroundColor: isSaving || !flightName || !etd ? '#444' : '#038dde',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              cursor: isSaving || !flightName || !etd ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'normal',
              height: '32px',
              flex: 1
            }}
            className="control-button"
          >
            {isSaving ? (
              <>
                <span className="spinner" style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s ease-in-out infinite',
                  marginRight: '8px'
                }}></span>
                Saving...
              </>
            ) : (
              'Save Flight'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveFlightCard;