// src/components/fast-planner/hooks/useAircraft.js

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing aircraft selection and data
 */
const useAircraft = ({
  aircraftManagerRef,
  currentRegion,
  appSettingsManagerRef,
  setFlightSettings
}) => {
  // Internal refs to store the real managers once they're available
  const internalAircraftManagerRef = useRef(aircraftManagerRef);
  const internalAppSettingsManagerRef = useRef(appSettingsManagerRef);
  const internalCurrentRegion = useRef(currentRegion);

  // State for aircraft selection and data
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);

  // Setup aircraft loading/filtering callbacks
  useEffect(() => {
    if (internalAircraftManagerRef.current?.current) {
      // Set up aircraft manager callbacks if they haven't been set
      setupAircraftCallbacks();
    }
  }, [internalAircraftManagerRef.current?.current]);

  // Load aircraft data when region changes
  useEffect(() => {
    if (internalAircraftManagerRef.current?.current && internalCurrentRegion.current?.id) {
      console.log(`Loading aircraft for region ${internalCurrentRegion.current.name}`);
      setAircraftLoading(true);

      // Filter aircraft for the current region
      internalAircraftManagerRef.current.current.filterAircraft(internalCurrentRegion.current.id, aircraftType);
    }
  }, [internalCurrentRegion.current?.id, aircraftType]);

  /**
   * Update the internal manager references
   * 
   * @param {Object} aircraftManager - The aircraft manager reference
   * @param {Object} appSettingsManager - The app settings manager reference
   */
  const setAircraftManagers = (aircraftManager, appSettingsManager) => {
    console.log('Setting aircraft managers:', { 
      aircraftManager: !!aircraftManager, 
      appSettingsManager: !!appSettingsManager
    });
    
    internalAircraftManagerRef.current = { current: aircraftManager };
    internalAppSettingsManagerRef.current = { current: appSettingsManager };
    
    // Set up callbacks now that we have the managers
    setupAircraftCallbacks();
  };

  /**
   * Update the current region reference
   * 
   * @param {Object} region - The current region
   */
  const setCurrentAircraftRegion = (region) => {
    console.log('Setting current aircraft region:', region?.name);
    internalCurrentRegion.current = region;
    
    // If we have the aircraft manager, filter aircraft for this region
    if (internalAircraftManagerRef.current?.current && region?.id) {
      internalAircraftManagerRef.current.current.filterAircraft(region.id, aircraftType);
    }
  };

  /**
   * Set up callbacks for the AircraftManager
   */
  const setupAircraftCallbacks = () => {
    if (!internalAircraftManagerRef.current?.current) {
      console.log('Cannot set up aircraft callbacks - manager not available');
      return;
    }

    console.log('Setting up aircraft manager callbacks');
    
    // Callback for when aircraft are loaded from OSDK
    internalAircraftManagerRef.current.current.setCallback('onAircraftLoaded', (aircraftList) => {
      console.log(`Loaded ${aircraftList.length} total aircraft`);
      setAircraftList(aircraftList);

      // After loading all aircraft, filter by region if we have a current region
      if (internalCurrentRegion.current) {
        internalAircraftManagerRef.current.current.filterAircraft(internalCurrentRegion.current.id);
      }
    });

    // Callback for when aircraft are filtered by type or region
    internalAircraftManagerRef.current.current.setCallback('onAircraftFiltered', (filteredAircraft, type) => {
      console.log(`Filtered to ${filteredAircraft.length} aircraft of type ${type || 'all'}`);

      if (type) {
        // Update the aircraftsByType with the filtered aircraft for this type
        setAircraftsByType(prev => ({
          ...prev,
          [type]: filteredAircraft
        }));
      } else {
        // If no type specified, organize all aircraft by type
        const byType = {};
        const availableTypes = [];

        // Create empty buckets for each type
        filteredAircraft.forEach(aircraft => {
          const type = aircraft.modelType || 'Unknown';
          if (!byType[type]) {
            byType[type] = [];
            availableTypes.push(type);
          }
          byType[type].push(aircraft);
        });

        console.log(`Available aircraft types: ${availableTypes.join(', ')}`);
        setAircraftTypes(availableTypes);
        setAircraftsByType(byType);
      }

      setAircraftLoading(false);
    });
  };

  /**
   * Change the selected aircraft type
   * 
   * @param {string} type - The aircraft type to select
   */
  const changeAircraftType = (type) => {
    setAircraftType(type);
    setAircraftRegistration('');  // Clear registration when type changes
    setSelectedAircraft(null);    // Clear selected aircraft

    // Save to settings
    if (internalAppSettingsManagerRef.current?.current) {
      internalAppSettingsManagerRef.current.current.setAircraft(type, '');
    }

    if (internalAircraftManagerRef.current?.current && internalCurrentRegion.current) {
      setAircraftLoading(true);
      internalAircraftManagerRef.current.current.filterAircraft(internalCurrentRegion.current.id, type);
    }
  };

  /**
   * Change the selected aircraft registration
   * 
   * @param {string} registration - The aircraft registration to select
   */
  const changeAircraftRegistration = (registration) => {
    console.log(`⚡ Changing aircraft registration to: ${registration}`);
    setAircraftRegistration(registration);

    // Find the selected aircraft in the aircraftsByType
    let aircraft = null;
    if (aircraftsByType[aircraftType]) {
      aircraft = aircraftsByType[aircraftType].find(a => a.registration === registration);
      setSelectedAircraft(aircraft);

      // CRITICAL: Make the selected aircraft globally available for API testing
      window.currentSelectedAircraft = aircraft;

      console.log(`⚡ Selected aircraft:`, {
        registration: aircraft?.registration,
        type: aircraft?.modelType,
        cruiseSpeed: aircraft?.cruiseSpeed,
        fuelBurn: aircraft?.fuelBurn
      });

      // Save to settings
      if (internalAppSettingsManagerRef.current?.current) {
        internalAppSettingsManagerRef.current.current.setAircraft(aircraftType, registration);
      }

      // Load aircraft-specific settings if they exist
      if (aircraft) {
        loadAircraftSettings(aircraft);
      }

      // Handle the case when an aircraft is selected (non-empty registration)
      if (registration) {
        // After selecting an aircraft, reset dropdown values for next selection
        // but maintain the actual selected aircraft in state
        setTimeout(() => {
          // Reset type dropdown value but DO NOT change state
          setAircraftType('');
          // Reset registration dropdown value but DO NOT clear selected aircraft
          setAircraftRegistration('');

          console.log("Reset dropdowns after aircraft selection while keeping selectedAircraft");
        }, 100);
      }
    }
  };

  /**
   * Load aircraft-specific settings
   * 
   * @param {Object} aircraft - The selected aircraft
   */
  const loadAircraftSettings = (aircraft) => {
    try {
      const storageKey = `aircraft_${aircraft.registration}`;
      const savedSettingsJson = localStorage.getItem(`fastPlanner_settings_${storageKey}`);

      if (savedSettingsJson) {
        const savedSettings = JSON.parse(savedSettingsJson);
        console.log(`Found saved settings for ${aircraft.registration}:`, savedSettings);

        // Update the flightSettings state with saved settings
        setFlightSettings(prev => ({
          ...prev,
          passengerWeight: savedSettings.passengerWeight ?? prev.passengerWeight,
          contingencyFuelPercent: savedSettings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
          taxiFuel: savedSettings.taxiFuel ?? prev.taxiFuel,
          reserveFuel: savedSettings.reserveFuel ?? prev.reserveFuel,
          deckTimePerStop: savedSettings.deckTimePerStop ?? prev.deckTimePerStop,
          deckFuelFlow: savedSettings.deckFuelFlow ?? prev.deckFuelFlow,
          cargoWeight: savedSettings.cargoWeight ?? prev.cargoWeight,
        }));

        // Show a message that settings were loaded
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Loaded saved settings for ${aircraft.registration}`);
        }
      } else {
        // If no aircraft-specific settings, try to load type-specific settings
        const typeSettingsJson = localStorage.getItem(`fastPlanner_settings_${aircraftType}`);

        if (typeSettingsJson) {
          const typeSettings = JSON.parse(typeSettingsJson);
          console.log(`Found saved settings for aircraft type ${aircraftType}:`, typeSettings);

          // Update the flightSettings state with type settings
          setFlightSettings(prev => ({
            ...prev,
            passengerWeight: typeSettings.passengerWeight ?? prev.passengerWeight,
            contingencyFuelPercent: typeSettings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
            taxiFuel: typeSettings.taxiFuel ?? prev.taxiFuel,
            reserveFuel: typeSettings.reserveFuel ?? prev.reserveFuel,
            deckTimePerStop: typeSettings.deckTimePerStop ?? prev.deckTimePerStop,
            deckFuelFlow: typeSettings.deckFuelFlow ?? prev.deckFuelFlow,
            cargoWeight: typeSettings.cargoWeight ?? prev.cargoWeight,
          }));

          // Show a message that type settings were loaded
          if (window.LoadingIndicator) {
            window.LoadingIndicator.updateStatusIndicator(`Loaded ${aircraftType} type settings`);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading saved settings for ${aircraft.registration}:`, error);
    }
  };

  return {
    aircraftType,
    setAircraftType,
    aircraftRegistration, 
    setAircraftRegistration,
    selectedAircraft,
    setSelectedAircraft,
    aircraftList,
    aircraftTypes,
    aircraftsByType,
    aircraftLoading,
    setAircraftLoading,
    changeAircraftType,
    changeAircraftRegistration,
    setAircraftManagers,
    setCurrentAircraftRegion
  };
};

export default useAircraft;