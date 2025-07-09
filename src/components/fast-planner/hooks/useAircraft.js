// src/components/fast-planner/hooks/useAircraft.js

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing aircraft selection and data
 * ARCHITECTURAL FIX: Direct manager access instead of fragile callbacks
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
  
  // State for aircraft selection and data
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  
  // ARCHITECTURAL FIX: Direct data access interval instead of callbacks
  const dataPollingRef = useRef(null);

  // HYBRID APPROACH: Callbacks for local, polling for production
  const processAircraftData = useCallback(() => {
    if (!aircraftManagerInstanceRef.current?.filteredAircraft) {
      return false;
    }

    const filteredAircraft = aircraftManagerInstanceRef.current.filteredAircraft;
    // Processing aircraft data
    
    // Update aircraft list
    setAircraftList(filteredAircraft);
    
    // Organize by type
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
    
    // MINIFICATION PROTECTION: Force these setters to be preserved
    window.setAircraftTypes = setAircraftTypes;
    window.setAircraftsByType = setAircraftsByType;
    
    setAircraftTypes(availableTypes.sort());
    setAircraftsByType(byType);
    setAircraftLoading(false);
    
    // Updated aircraft state
    return true;
  }, []);

  // HYBRID: Setup callbacks for local dev compatibility
  const setupAircraftCallbacks = useCallback(() => {
    if (!aircraftManagerInstanceRef.current) {
      console.log('Cannot set up aircraft callbacks - manager not available');
      return;
    }

    console.log('Setting up aircraft manager callbacks');
    
    aircraftManagerInstanceRef.current.setCallback('onAircraftLoaded', (loadedAircraftList) => {
      console.log(`Loaded ${loadedAircraftList.length} total aircraft`);
      setAircraftList(loadedAircraftList);
      if (currentAircraftHookRegion) {
        aircraftManagerInstanceRef.current.filterAircraft(currentAircraftHookRegion.id);
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
        
        // MINIFICATION PROTECTION: Force these setters to be preserved
        window.setAircraftTypes = setAircraftTypes;
        window.setAircraftsByType = setAircraftsByType;
        
        setAircraftTypes(availableTypes.sort());
        setAircraftsByType(byType);
      }
      setAircraftLoading(false);
    });
  }, [currentAircraftHookRegion]);

  // HYBRID APPROACH: Callbacks + polling fallback
  useEffect(() => {
    if (aircraftManagerRef && aircraftManagerRef.current) {
      console.log('🔧 HYBRID: Setting up callbacks + polling fallback');
      aircraftManagerInstanceRef.current = aircraftManagerRef.current;
      
      // Setup callbacks for local development
      setupAircraftCallbacks();
      
      // Also start polling as fallback for production
      const startPollingFallback = () => {
        if (dataPollingRef.current) {
          clearInterval(dataPollingRef.current);
        }
        
        // Wait a bit to see if callbacks work first
        setTimeout(() => {
          if (aircraftTypes.length === 0) {
            console.log('🔧 FALLBACK: Callbacks failed, starting polling');
            dataPollingRef.current = setInterval(() => {
              const hasData = processAircraftData();
              if (hasData) {
                clearInterval(dataPollingRef.current);
                dataPollingRef.current = null;
              }
            }, 500);
          }
        }, 2000);
      };
      
      startPollingFallback();
      
      // Try immediate processing
      setTimeout(() => processAircraftData(), 100);
    }
    
    return () => {
      if (dataPollingRef.current) {
        clearInterval(dataPollingRef.current);
        dataPollingRef.current = null;
      }
    };
  }, [aircraftManagerRef, processAircraftData, setupAircraftCallbacks, aircraftTypes.length]);

  useEffect(() => {
    if (appSettingsManagerRef && appSettingsManagerRef.current) {
      appSettingsManagerInstanceRef.current = appSettingsManagerRef.current;
    }
  }, [appSettingsManagerRef]);

  // ARCHITECTURAL FIX: Region-based filtering with direct data access
  useEffect(() => {
    if (!aircraftManagerInstanceRef.current || !currentAircraftHookRegion?.id) {
      return;
    }
    
    const regionId = currentAircraftHookRegion.id;
    const currentType = aircraftType || '';
    
    console.log(`✅ FILTERING: Region ${currentAircraftHookRegion.name}, type: ${currentType || 'all'}`);
    
    setAircraftLoading(true);
    
    try {
      // Execute filter operation
      aircraftManagerInstanceRef.current.filterAircraft(regionId, currentType);
      
      // Start polling for updated data
      if (dataPollingRef.current) {
        clearInterval(dataPollingRef.current);
      }
      
      dataPollingRef.current = setInterval(() => {
        const hasData = processAircraftData();
        if (hasData) {
          clearInterval(dataPollingRef.current);
          dataPollingRef.current = null;
        }
      }, 200);
      
      // Try immediate processing
      setTimeout(() => processAircraftData(), 100);
      
    } catch (error) {
      console.error('Error filtering aircraft:', error);
      setAircraftLoading(false);
    }
  }, [currentAircraftHookRegion, aircraftType, processAircraftData]);

  const setAircraftManagers = useCallback((aircraftManager, appSettingsManager) => {
    console.log('✅ SETTING MANAGERS:', { 
      aircraftManager: !!aircraftManager, 
      appSettingsManager: !!appSettingsManager
    });
    
    aircraftManagerInstanceRef.current = aircraftManager;
    appSettingsManagerInstanceRef.current = appSettingsManager;
    
    // Start direct data processing if manager is available
    if (aircraftManager) {
      setTimeout(() => processAircraftData(), 100);
    }
  }, [processAircraftData]);

  const setCurrentAircraftRegion = useCallback((region) => {
    const hasNewRegion = region && region.id;
    const hasDifferentRegion = !currentAircraftHookRegion || 
                              (currentAircraftHookRegion.id !== region?.id);
    
    if (hasNewRegion && hasDifferentRegion) {
      console.log('✅ REGION CHANGE:', region?.name);
      setCurrentAircraftHookRegion(region);
      
      if (aircraftManagerInstanceRef.current && region.id) {
        setAircraftLoading(true);
      }
    } else if (!region && currentAircraftHookRegion) {
      console.log('✅ CLEARING REGION');
      setCurrentAircraftHookRegion(null);
      setAircraftLoading(false);
    }
  }, [currentAircraftHookRegion]);


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

  // ARCHITECTURAL FIX: Clean return object
  const returnObject = {
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
  
  // Store globally for debugging AND make functions available globally
  window.debugUseAircraftReturn = {
    aircraftTypes: aircraftTypes,
    aircraftsByType: aircraftsByType,
    aircraftTypesLength: aircraftTypes?.length || 0,
    aircraftsByTypeKeys: Object.keys(aircraftsByType || {}),
    aircraftLoading: aircraftLoading,
    managerHasData: !!aircraftManagerInstanceRef.current?.filteredAircraft?.length,
    timestamp: new Date().toISOString()
  };
  
  // CRITICAL: Make React functions globally available for flight loading
  console.log('🚁 AIRCRAFT DEBUG: Exposing global functions', {
    changeAircraftType: typeof changeAircraftType,
    changeAircraftRegistration: typeof changeAircraftRegistration,
    timestamp: new Date().toISOString()
  });
  window.changeAircraftType = changeAircraftType;
  window.changeAircraftRegistration = changeAircraftRegistration;
  console.log('🚁 AIRCRAFT DEBUG: Global functions exposed', {
    windowChangeAircraftType: typeof window.changeAircraftType,
    windowChangeAircraftRegistration: typeof window.changeAircraftRegistration
  });
  
  // Returning aircraft state
  
  return returnObject;
};

export default useAircraft;
