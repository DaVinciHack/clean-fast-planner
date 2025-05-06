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
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
      
      if (onError) {
        onError(errorMessage);
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
      />
    </>
  );
};

export default SaveFlightButton;
