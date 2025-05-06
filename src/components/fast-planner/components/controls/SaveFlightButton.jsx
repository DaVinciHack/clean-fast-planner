import React, { useState } from 'react';
import client from '../../../../client';

/**
 * SaveFlightButton Component
 * Creates a button that sends the current route data to Palantir to create a new flight
 */
const SaveFlightButton = ({ 
  selectedAircraft, 
  waypoints, 
  routeStats,
  currentRegion,
  onSuccess,
  onError
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [flightName, setFlightName] = useState('');
  const [captainId, setCaptainId] = useState('');
  const [copilotId, setCopilotId] = useState('');
  const [medicId, setMedicId] = useState('');
  const [soId, setSoId] = useState('');
  const [rswId, setRswId] = useState('');
  const [etd, setEtd] = useState('');
  
  // Modal toggle
  const openModal = () => {
    // Generate a default flight name based on first and last waypoint
    if (waypoints && waypoints.length >= 2) {
      const origin = waypoints[0].name || 'Origin';
      const destination = waypoints[waypoints.length - 1].name || 'Destination';
      const todayDate = new Date().toISOString().split('T')[0];
      setFlightName(`${origin} to ${destination} - ${todayDate}`);
    }
    
    // Default ETD to current time
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    setEtd(formattedDate);
    
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };
  
  /**
   * Sends flight data to Palantir OSDK to create a new flight
   */
  const saveFlightToPalantir = async () => {
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      onError('Cannot save flight: Missing aircraft or waypoints');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update loading indicator if available
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Saving flight to Palantir...');
      }
      
      // Get waypoint locations for the API
      const locations = waypoints.map(wp => wp.name || `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`);
      
      // Format the ETD for Palantir
      const etdTimestamp = new Date(etd).toISOString();
      
      // Get aircraft registration without region information
      let aircraftRegistration = selectedAircraft.registration || '';
      // The registration might be in format "N123AB (REGION)"
      if (aircraftRegistration.includes('(')) {
        aircraftRegistration = aircraftRegistration.split('(')[0].trim();
      }
      
      // Create parameters for the API call
      const flightParams = {
        aircraftRegion: currentRegion ? currentRegion.name : 'Unknown',
        new_parameter: 'Norway', // Default country
        flightName: flightName,
        locations: locations,
        alternateLocation: '', // Leave blank for auto-selection
        aircraftId: {
          $primaryKey: aircraftRegistration || selectedAircraft.assetId || selectedAircraft.id
        },
        region: currentRegion ? currentRegion.id : 'Unknown',
        etd: etdTimestamp,
        captainId: captainId ? { $primaryKey: captainId } : null,
        copilotId: copilotId ? { $primaryKey: copilotId } : null,
        medicId: medicId ? { $primaryKey: medicId } : null,
        soId: soId ? { $primaryKey: soId } : null,
        rswId: rswId ? { $primaryKey: rswId } : null,
        useDirectRoutes: false, // Use the actual route as planned
        displayWaypoints: locations // Same as locations for now
      };
      
      console.log('Sending flight data to Palantir:', flightParams);
      
      // Check if we have a valid client before proceeding
      if (!client) {
        throw new Error('OSDK client not available. Try logging in again.');
      }
      
      try {
        // Import the SDK
        const sdk = await import('@flight-app/sdk');
        
        // For debugging - log available SDK functions
        console.log('Available SDK functions:', Object.keys(sdk).filter(key => 
          typeof sdk[key] === 'function' || 
          (typeof sdk[key] === 'object' && sdk[key] !== null)
        ));
        
        // Check if createNewFlightFp2 is available in the SDK
        if (!sdk.createNewFlightFp2) {
          console.error('createNewFlightFp2 action not found in SDK. Available keys:', Object.keys(sdk));
          
          // Check for similar functions that might be the correct one
          const possibleMatches = Object.keys(sdk).filter(key => 
            key.toLowerCase().includes('flight') && 
            (key.toLowerCase().includes('create') || key.toLowerCase().includes('new'))
          );
          
          if (possibleMatches.length > 0) {
            console.log('Possible matching functions found:', possibleMatches);
            
            // Try to use the first match
            const firstMatch = possibleMatches[0];
            console.log(`Attempting to use ${firstMatch} instead of createNewFlightFp2`);
            
            // Call the API with the first matching function
            const result = await client(sdk[firstMatch]).applyAction({
              ...flightParams,
              $returnEdits: true
            });
            
            console.log('Flight creation result:', result);
            
            // Handle success
            if (result && (result.type === 'edits' || result.editedObjectTypes)) {
              const flightId = result.editedObjectTypes && result.editedObjectTypes[0] ? 
                result.editedObjectTypes[0].id || 'Unknown ID' : 'Unknown ID';
              
              if (onSuccess) {
                onSuccess(`Flight "${flightName}" created successfully with ID: ${flightId}`);
              }
              
              closeModal();
              return;
            }
          } else {
            throw new Error('createNewFlightFp2 action not found and no alternatives available');
          }
        } else {
          // Standard path - using createNewFlightFp2
          const { createNewFlightFp2 } = sdk;
          
          // Call the API
          const result = await client(createNewFlightFp2).applyAction({
            ...flightParams,
            $returnEdits: true
          });
          
          console.log('Flight creation result:', result);
          
          if (result && (result.type === 'edits' || result.editedObjectTypes)) {
            // Success - flight was created
            const flightId = result.editedObjectTypes && result.editedObjectTypes[0] ? 
              result.editedObjectTypes[0].id || 'Unknown ID' : 'Unknown ID';
            
            // Show success message
            if (onSuccess) {
              onSuccess(`Flight "${flightName}" created successfully with ID: ${flightId}`);
            }
            
            // Close the modal
            closeModal();
          } else {
            throw new Error('Flight creation failed: Invalid response from server');
          }
        }
      } catch (sdkError) {
        console.error('SDK error:', sdkError);
        throw new Error(`SDK Error: ${sdkError.message}`);
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Error: ${error.message}`, 'error');
      }
      
      if (onError) {
        onError(`Failed to create flight: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check if we can save a flight (have aircraft and 2+ waypoints)
  const canSaveFlight = selectedAircraft && waypoints && waypoints.length >= 2;
  
  // Button style for main button - match the app's existing styles
  const buttonStyle = {
    backgroundColor: canSaveFlight ? '#038dde' : '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: canSaveFlight ? 'pointer' : 'not-allowed',
    fontSize: '14px',
    margin: '0 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  };
  
  return (
    <>
      <button 
        style={buttonStyle}
        onClick={openModal}
        disabled={!canSaveFlight}
        title={canSaveFlight ? 'Save route to Palantir as a flight' : 'Select aircraft and add waypoints to save flight'}
      >
        <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>save</span>
        Save Flight
      </button>
      
      {/* Modal for flight details */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ marginTop: 0 }}>Save Flight to Palantir</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Flight Name:
              </label>
              <input 
                type="text" 
                value={flightName} 
                onChange={e => setFlightName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                ETD (Estimated Time of Departure):
              </label>
              <input 
                type="datetime-local" 
                value={etd} 
                onChange={e => setEtd(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveFlightToPalantir}
                disabled={isSaving || !flightName || !etd}
                style={{
                  backgroundColor: isSaving || !flightName || !etd ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: isSaving || !flightName || !etd ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSaving ? (
                  <>
                    <span className="spinner" style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
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
            
            {/* Add animation for spinner */}
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveFlightButton;
