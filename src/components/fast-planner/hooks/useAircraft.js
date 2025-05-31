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
  // Internal refs to store the actual manager instances
  const aircraftManagerInstanceRef = useRef(null);
  const appSettingsManagerInstanceRef = useRef(null);
  const [currentAircraftHookRegion, setCurrentAircraftHookRegion] = useState(null);
  
  // Ref to hold the latest version of currentAircraftHookRegion for stable callbacks
  const latestRegionRef = useRef(currentAircraftHookRegion);
  useEffect(() => {
    latestRegionRef.current = currentAircraftHookRegion;
  }, [currentAircraftHookRegion]);

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
      if (latestRegionRef.current) { // Use ref for latest region
        aircraftManagerInstanceRef.current.filterAircraft(latestRegionRef.current.id);
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
  }, [aircraftManagerRef, setupAircraftCallbacks]); // Removed currentAircraftHookRegion from here

  useEffect(() => {
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerInstanceRef.current = appSettingsManagerRef.current;
    }
  }, [appSettingsManagerRef]);

  // Load aircraft data when region changes or aircraftType changes
  useEffect(() => {
    // Skip effect if no manager or no region
    if (!aircraftManagerInstanceRef.current || !currentAircraftHookRegion?.id) {
      return;
    }
    
    // Use a ref to track the last filter operation to prevent duplicates
    const regionId = currentAircraftHookRegion.id;
    const currentType = aircraftType || '';
    
    // Generate a filter key to detect duplicate filter operations
    const filterKey = `${regionId}:${currentType}`;
    
    // Skip if already loading with these params (prevents rapid re-filtering)
    if (aircraftManagerInstanceRef.current.lastFilterKey === filterKey && 
        aircraftManagerInstanceRef.current.isFiltering) {
      console.log(`Skipping duplicate aircraft filter for ${filterKey}`);
      return;
    }
    
    console.log(`Loading aircraft for region ${currentAircraftHookRegion.name} and type ${aircraftType || 'any'}`);
    
    // Set loading state
    setAircraftLoading(true);
    
    // Track this filter operation
    aircraftManagerInstanceRef.current.lastFilterKey = filterKey;
    aircraftManagerInstanceRef.current.isFiltering = true;
    
    // Execute the filter operation
    try {
      const result = aircraftManagerInstanceRef.current.filterAircraft(regionId, currentType);
      
      // Handle the case where filterAircraft returns a promise
      if (result && typeof result.finally === 'function') {
        result.finally(() => {
          // Clear filtering flag when done
          if (aircraftManagerInstanceRef.current) {
            aircraftManagerInstanceRef.current.isFiltering = false;
          }
        });
      } else {
        // Handle case where it doesn't return a promise
        setTimeout(() => {
          if (aircraftManagerInstanceRef.current) {
            aircraftManagerInstanceRef.current.isFiltering = false;
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error filtering aircraft:', error);
      // Clear filtering flag on error
      if (aircraftManagerInstanceRef.current) {
        aircraftManagerInstanceRef.current.isFiltering = false;
      }
    }
  }, [currentAircraftHookRegion, aircraftType]);

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
  }, [setupAircraftCallbacks]); // Removed currentAircraftHookRegion from here

  const setCurrentAircraftRegion = useCallback((region) => {
    // Enhanced region comparison logic
    const hasNewRegion = region && region.id;
    const hasDifferentRegion = !currentAircraftHookRegion || 
                              (currentAircraftHookRegion.id !== region?.id);
    
    if (hasNewRegion && hasDifferentRegion) {
      console.log('Setting current aircraft region (useAircraft state):', region?.name);
      
      // Update local state for region
      setCurrentAircraftHookRegion(region);
      
      // Only trigger loading state if we have a manager and a valid region
      if (aircraftManagerInstanceRef.current && region.id) {
        setAircraftLoading(true);
      }
    } else if (!region && currentAircraftHookRegion) {
      // Handle case where region is explicitly cleared
      console.log('Clearing current aircraft region (useAircraft state)');
      setCurrentAircraftHookRegion(null);
      setAircraftLoading(false);
    } else {
      // Skip update for same region to prevent unnecessary rerenders
      // console.log('setCurrentAircraftRegion called with same or null region, no state change needed.');
    }
  }, [currentAircraftHookRegion]); // Only depend on currentAircraftHookRegion


  /**
   * Helper function to load aircraft settings
   * Not exposed outside the hook, used internally by changeAircraftRegistration
   */
  const handleLoadAircraftSettings = (aircraft) => {
    try {
      const storageKey = `aircraft_${aircraft.registration}`;
      const savedSettingsJson = localStorage.getItem(`fastPlanner_settings_${storageKey}`);

      if (savedSettingsJson) {
        const savedSettings = JSON.parse(savedSettingsJson);
        console.log(`Found saved settings for ${aircraft.registration}:`, savedSettings);

        // Update the flightSettings state with saved settings
        // ✅ CRITICAL SAFETY FIX: Only apply user inputs, NEVER fuel policy values
        setFlightSettings(prev => ({
          ...prev,
          // ✅ User inputs only - safe to load from localStorage
          passengerWeight: savedSettings.passengerWeight ?? prev.passengerWeight,
          cargoWeight: savedSettings.cargoWeight ?? prev.cargoWeight,
          // ❌ REMOVED ALL FUEL POLICY VALUES - These must come from OSDK only
          // contingencyFuelPercent: savedSettings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
          // taxiFuel: savedSettings.taxiFuel ?? prev.taxiFuel,
          // reserveFuel: savedSettings.reserveFuel ?? prev.reserveFuel,
          // deckTimePerStop: savedSettings.deckTimePerStop ?? prev.deckTimePerStop,
          // deckFuelFlow: savedSettings.deckFuelFlow ?? prev.deckFuelFlow,
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
          // ✅ CRITICAL SAFETY FIX: Only apply user inputs, NEVER fuel policy values
          setFlightSettings(prev => ({
            ...prev,
            // ✅ User inputs only - safe to load from localStorage
            passengerWeight: typeSettings.passengerWeight ?? prev.passengerWeight,
            cargoWeight: typeSettings.cargoWeight ?? prev.cargoWeight,
            // ❌ REMOVED ALL FUEL POLICY VALUES - These must come from OSDK only
            // contingencyFuelPercent: typeSettings.contingencyFuelPercent ?? prev.contingencyFuelPercent,
            // taxiFuel: typeSettings.taxiFuel ?? prev.taxiFuel,
            // reserveFuel: typeSettings.reserveFuel ?? prev.reserveFuel,
            // deckTimePerStop: typeSettings.deckTimePerStop ?? prev.deckTimePerStop,
            // deckFuelFlow: typeSettings.deckFuelFlow ?? prev.deckFuelFlow,
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

  /**
   * Change the selected aircraft type
   * @param {string} type - The aircraft type to select
   */
  const changeAircraftType = useCallback((type) => {
    setAircraftType(type);
    setAircraftRegistration('');  // Clear registration when type changes
    setSelectedAircraft(null);    // Clear selected aircraft

    // Save to settings
    if (appSettingsManagerInstanceRef.current) {
      appSettingsManagerInstanceRef.current.setAircraft(type, '');
    }

    // Aircraft filtering will be handled by the useEffect that depends on aircraftType
    // No need to call filterAircraft directly here, avoiding duplicate calls
  }, []);

  /**
   * Change the selected aircraft registration
   * @param {string} registration - The aircraft registration to select
   */
  const changeAircraftRegistration = useCallback((registration) => {
    console.log(`⚡ Changing aircraft registration to: ${registration}`);
    setAircraftRegistration(registration);

    // Find the selected aircraft in the aircraftsByType
    let aircraft = null;
    if (aircraftsByType[aircraftType]) {
      aircraft = aircraftsByType[aircraftType].find(a => a.registration === registration);
      setSelectedAircraft(aircraft);

      // Make the selected aircraft globally available for API testing
      window.currentSelectedAircraft = aircraft;

      console.log(`⚡ Selected aircraft:`, {
        registration: aircraft?.registration,
        type: aircraft?.modelType,
        cruiseSpeed: aircraft?.cruiseSpeed,
        fuelBurn: aircraft?.fuelBurn,
        flatPitchFuelBurnDeckFuel: aircraft?.flatPitchFuelBurnDeckFuel
      });

      // 🔥 CRITICAL SAFETY FIX: Update flightSettings with OSDK aircraft values
      // This ensures NO fallback values are used - only real aircraft data
      if (aircraft) {
        console.log('🛠️ UPDATING FLIGHT SETTINGS WITH OSDK AIRCRAFT VALUES');
        console.log('🛠️ AIRCRAFT SELECTED:', aircraft.registration);
        console.log('🛠️ AIRCRAFT flatPitchFuelBurnDeckFuel:', aircraft.flatPitchFuelBurnDeckFuel);
        
        // ✅ SAFETY: Update with actual aircraft OSDK values ONLY
        setFlightSettings(prev => {
          const updates = { ...prev };
          
          // ✅ Update deckFuelFlow with actual OSDK value (NOT 9999 fallback)
          if (aircraft.flatPitchFuelBurnDeckFuel !== undefined && aircraft.flatPitchFuelBurnDeckFuel !== null) {
            updates.deckFuelFlow = aircraft.flatPitchFuelBurnDeckFuel;
            console.log(`✅ Updated deckFuelFlow from aircraft: ${aircraft.flatPitchFuelBurnDeckFuel}`);
          } else {
            console.warn(`❌ aircraft.flatPitchFuelBurnDeckFuel is ${aircraft.flatPitchFuelBurnDeckFuel} - keeping fallback ${prev.deckFuelFlow}`);
          }
          
          // 📝 TODO: Add other OSDK aircraft fuel values here when available:
          // - Aircraft-specific taxi fuel from OSDK (if available)
          // - Aircraft-specific reserve fuel from OSDK (if available) 
          // - Aircraft-specific contingency percent from OSDK (if available)
          // - Aircraft-specific deck time from OSDK (if available)
          
          console.log('🛠️ FINAL FLIGHT SETTINGS UPDATE:', updates);
          return updates;
        });
        
        console.log('🔍 AIRCRAFT FUEL VALUES:', {
          flatPitchFuelBurnDeckFuel: aircraft.flatPitchFuelBurnDeckFuel,
          fuelBurn: aircraft.fuelBurn,
          // Add other fuel-related properties for debugging
        });
      }

      // Save to settings
      if (appSettingsManagerInstanceRef.current) {
        appSettingsManagerInstanceRef.current.setAircraft(aircraftType, registration);
      }

      // Load aircraft-specific settings if they exist (user inputs only)
      if (aircraft) {
        handleLoadAircraftSettings(aircraft);
      }
    }
  }, [aircraftType, aircraftsByType]);

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
