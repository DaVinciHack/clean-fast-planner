import React, { useState } from 'react';
import SaveFlightModal from './SaveFlightModal';
import PalantirFlightService from '../../services/PalantirFlightService';

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
  
  // Open the modal
  const openModal = () => {
    setShowModal(true);
  };
  
  // Close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  /**
   * Run a diagnostic test on the API connection
   * This helps identify what's causing the 400 Bad Request error
   */
  const runDiagnosticMode = async () => {
    try {
      setIsSaving(true);
      
      // Set a global flag to use minimal parameters
      window.OSDK_DIAGNOSTIC_MODE = true;
      
      // Alert the user
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Running API diagnostics...');
      }
      
      // Try with absolute minimal parameters to see if the API is accessible
      const minimalParams = {
        flightName: "Diagnostic Test Flight",
        aircraftRegion: currentRegion ? currentRegion.name : "NORWAY",
        aircraftId: "TEST123"
      };
      
      console.log('Diagnostic Mode: Using minimal parameters', minimalParams);
      
      // Try just to get a list of available SDK functions first
      try {
        const sdk = await import('@flight-app/sdk');
        console.log('Available SDK functions for flight creation:', 
          Object.keys(sdk).filter(key => 
            typeof key === 'string' && 
            key.toLowerCase().includes('flight') && 
            (key.toLowerCase().includes('create') || key.toLowerCase().includes('new'))
          )
        );
      } catch (sdkError) {
        console.error('Cannot load SDK in diagnostic mode:', sdkError);
      }
      
      // Now try the actual API call
      const result = await PalantirFlightService.createFlight(minimalParams);
      console.log('Diagnostic API result:', result);
      
      // Clear the diagnostic mode flag
      window.OSDK_DIAGNOSTIC_MODE = false;
      
      return true;
    } catch (error) {
      console.error('Diagnostic mode error:', error);
      
      // Format the error for display
      const errorMessage = `API Diagnostic Error: ${error.message || 'Unknown error'}`;
      
      // Clear the diagnostic mode flag
      window.OSDK_DIAGNOSTIC_MODE = false;
      
      // Show the user what happened
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles the flight data submitted from the modal
   * @param {Object} flightData - The flight data from the modal form
   */
  const handleFlightFormSubmit = async (flightData) => {
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
      const etdTimestamp = new Date(flightData.etd).toISOString();
      
      // Get aircraft registration without region information
      let aircraftRegistration = selectedAircraft.registration || '';
      // The registration might be in format "N123AB (REGION)"
      if (aircraftRegistration.includes('(')) {
        aircraftRegistration = aircraftRegistration.split('(')[0].trim();
      }
      
      // Debug output of IDs to help find issues
      console.log('OSDK Flight Creation - Debug Data:', {
        aircraftReg: aircraftRegistration,
        aircraftAssetId: selectedAircraft.assetId || '(none)',
        aircraftId: selectedAircraft.id || '(none)',
        captainId: flightData.captainId,
        copilotId: flightData.copilotId
      });
      
      // Create parameters for the API call using our service
      const flightParams = PalantirFlightService.formatFlightParams({
        aircraftRegion: currentRegion ? currentRegion.name : 'Unknown',
        country: 'Norway', // Default country
        flightName: flightData.flightName,
        locations: locations,
        alternateLocation: '', // Leave blank for auto-selection
        aircraftId: aircraftRegistration || selectedAircraft.assetId || selectedAircraft.id,
        region: currentRegion ? currentRegion.id : 'Unknown',
        etd: etdTimestamp,
        captainId: flightData.captainId,
        copilotId: flightData.copilotId,
        medicId: flightData.medicId,
        soId: flightData.soId,
        rswId: flightData.rswId,
        useDirectRoutes: false, // Use the actual route as planned
      });
      
      console.log('Sending flight data to Palantir:', flightParams);
      
      // Call the service to create the flight
      const result = await PalantirFlightService.createFlight(flightParams);
      console.log('Flight creation result:', result);
      
      // Check if the result is successful
      if (PalantirFlightService.isSuccessfulResult(result)) {
        // Extract the flight ID
        const flightId = PalantirFlightService.extractFlightId(result);
        
        // Show success message
        if (onSuccess) {
          onSuccess(`Flight "${flightData.flightName}" created successfully with ID: ${flightId}`);
        }
        
        // Close the modal
        closeModal();
      } else {
        throw new Error('Flight creation failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      
      // Format the error message using the service
      const errorMessage = PalantirFlightService.formatErrorMessage(error);
      
      // Display a more visible error message in the UI
      const errorContainer = document.createElement('div');
      errorContainer.className = 'api-error-notification';
      errorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ff4c4c;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        max-width: 80%;
        text-align: center;
        font-weight: bold;
      `;
      errorContainer.textContent = errorMessage;
      
      // Add a close button to the error message
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      `;
      closeButton.onclick = () => document.body.removeChild(errorContainer);
      errorContainer.appendChild(closeButton);
      
      // Add to body
      document.body.appendChild(errorContainer);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (document.body.contains(errorContainer)) {
          document.body.removeChild(errorContainer);
        }
      }, 8000);
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
      
      if (onError) {
        onError(errorMessage);
      }
      
      // Show a special message for 400 errors (likely due to API data format issues)
      if (error.message && error.message.includes('400')) {
        console.log('Detailed API error info to help debug the 400 Bad Request:');
        console.log('This might be due to incorrect field formatting or missing required fields.');
        console.log('Check the API documentation for exact field requirements.');
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
        className="control-button"
      >
        <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>save</span>
        Flight
      </button>
      
      {/* Using our modular SaveFlightModal component */}
      <SaveFlightModal 
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleFlightFormSubmit}
        isSaving={isSaving}
        waypoints={waypoints}
        onRunDiagnostic={runDiagnosticMode}
      />
    </>
  );
};

export default SaveFlightButton;