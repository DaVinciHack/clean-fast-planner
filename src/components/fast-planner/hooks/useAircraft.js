// src/components/fast-planner/hooks/useAircraft.js

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing aircraft selection and data
 */
const useAircraft = ({
  aircraftManagerRef,
  appSettingsManagerRef,
  setFlightSettings
}) => {
  // Internal refs to store the actual manager instances and current region instance
  const aircraftManagerInstanceRef = useRef(null);
  const appSettingsManagerInstanceRef = useRef(null);
  const currentRegionInstanceRef = useRef(null);

  // State for aircraft selection and data
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);

  // Memoized setupAircraftCallbacks
  const setupAircraftCallbacks = useCallback(() => {
    if (!aircraftManagerInstanceRef.current) {
      console.log('Cannot set up aircraft callbacks - manager not available');
      return;
    }

    console.log('Setting up aircraft manager callbacks');
    
    aircraftManagerInstanceRef.current.setCallback('onAircraftLoaded', (loadedAircraftList) => {
      console.log(`Loaded ${loadedAircraftList.length} total aircraft`);
      setAircraftList(loadedAircraftList);
      if (currentRegionInstanceRef.current) {
        aircraftManagerInstanceRef.current.filterAircraft(currentRegionInstanceRef.current.id);
      }
    });

    aircraftManagerInstanceRef.current.setCallback('onAircraftFiltered', (filteredAircraft, type) => {
      console.log(`Filtered to ${filteredAircraft.length} aircraft of type ${type || 'all'}`);
      if (type) {
        setAircraftsByType(prev => ({ ...prev, [type]: filteredAircraft }));
      } else {
        const byType = {};
        const availableTypes = [];
        filteredAircraft.forEach(aircraft => {
          const modelType = aircraft.modelType || 'Unknown';
          if (!byType[modelType]) {
            byType[modelType] = [];
            availableTypes.push(modelType);
          }
          byType[modelType].push(aircraft);
        });
        setAircraftTypes(availableTypes.sort());
        setAircraftsByType(byType);
      }
      setAircraftLoading(false);
    });
  }, []);

  // Update managers when refs change
  useEffect(() => {
    if (aircraftManagerRef && aircraftManagerRef.current) {
      aircraftManagerInstanceRef.current = aircraftManagerRef.current;
      setupAircraftCallbacks();
    }
  }, [aircraftManagerRef, setupAircraftCallbacks]);

  useEffect(() => {
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerInstanceRef.current = appSettingsManagerRef.current;
    }
  }, [appSettingsManagerRef]);

  // Load aircraft data when region changes or aircraftType changes
  useEffect(() => {
    if (aircraftManagerInstanceRef.current && currentRegionInstanceRef.current?.id) {
      console.log(`Loading aircraft for region ${currentRegionInstanceRef.current.name} and type ${aircraftType || 'any'}`);
      setAircraftLoading(true);
      aircraftManagerInstanceRef.current.filterAircraft(currentRegionInstanceRef.current.id, aircraftType);
    }
  }, [currentRegionInstanceRef.current?.id, aircraftType]);

  const setAircraftManagers = useCallback((aircraftManager, appSettingsManager) => {
    console.log('Setting aircraft managers:', { 
      aircraftManager: !!aircraftManager, 
      appSettingsManager: !!appSettingsManager
    });
    
    aircraftManagerInstanceRef.current = aircraftManager;
    appSettingsManagerInstanceRef.current = appSettingsManager;
    
    // Call setupAircraftCallbacks if managers are now available
    if (aircraftManager) {
        setupAircraftCallbacks();
    }
  }, [setupAircraftCallbacks]);

  const setCurrentAircraftRegion = useCallback((region) => {
    console.log('Setting current aircraft region:', region?.name);
    currentRegionInstanceRef.current = region; // Update the ref for the current region
    
    // Trigger aircraft filtering for the new region
    if (aircraftManagerInstanceRef.current && region?.id) {
      setAircraftLoading(true); // Set loading true before filtering
      aircraftManagerInstanceRef.current.filterAircraft(region.id, aircraftType);
    }
  }, [aircraftType]);

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
    if (appSettingsManagerInstanceRef.current) {
      appSettingsManagerInstanceRef.current.setAircraft(type, '');
    }

    if (aircraftManagerInstanceRef.current && currentRegionInstanceRef.current) {
      setAircraftLoading(true);
      aircraftManagerInstanceRef.current.filterAircraft(currentRegionInstanceRef.current.id, type);
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
      if (appSettingsManagerInstanceRef.current) {
        appSettingsManagerInstanceRef.current.setAircraft(aircraftType, registration);
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
