import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AircraftManager } from '../modules';

// Create the context
const AircraftContext = createContext(null);

/**
 * AircraftProvider component
 * Manages aircraft state and provides it to all child components
 */
export const AircraftProvider = ({ children, client, currentRegion }) => {
  // Aircraft state
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [aircraftManagerInstance, setAircraftManagerInstance] = useState(null);
  
  // Flight parameters state
  const [payloadWeight, setPayloadWeight] = useState(2000);
  const [reserveFuel, setReserveFuel] = useState(600);
  
  // Additional settings from the full component
  const [deckTimePerStop, setDeckTimePerStop] = useState(5);
  const [deckFuelPerStop, setDeckFuelPerStop] = useState(100);
  const [deckFuelFlow, setDeckFuelFlow] = useState(400);
  const [passengerWeight, setPassengerWeight] = useState(220);
  const [cargoWeight, setCargoWeight] = useState(0);
  const [taxiFuel, setTaxiFuel] = useState(50);
  const [contingencyFuelPercent, setContingencyFuelPercent] = useState(10);
  const [reserveMethod, setReserveMethod] = useState('fixed');

  // Initialize the aircraft manager
  useEffect(() => {
    const manager = new AircraftManager();
    
    // Set up callbacks
    manager.setCallback('onAircraftLoaded', (allAircraft) => {
      setAircraftList(allAircraft);
      setAircraftLoading(false);
    });
    
    manager.setCallback('onAircraftFiltered', (filteredAircraft) => {
      // Prepare the aircraft by type mapping
      const byType = {};
      filteredAircraft.forEach(aircraft => {
        const type = aircraft.modelType || 'S92';
        if (!byType[type]) {
          byType[type] = [];
        }
        byType[type].push(aircraft);
      });
      
      setAircraftsByType(byType);
      setAircraftLoading(false);
    });
    
    manager.setCallback('onAircraftSelected', (aircraft) => {
      setSelectedAircraft(aircraft);
    });
    
    manager.setCallback('onError', (error) => {
      console.error('AircraftManager error:', error);
      setAircraftLoading(false);
    });
    
    setAircraftManagerInstance(manager);
  }, []);

  // Load all aircraft when client is available
  useEffect(() => {
    if (aircraftManagerInstance && client) {
      setAircraftLoading(true);
      aircraftManagerInstance.loadAircraftFromOSDK(client);
    }
  }, [aircraftManagerInstance, client]);

  // Filter aircraft when region changes
  useEffect(() => {
    if (aircraftManagerInstance && currentRegion) {
      setAircraftLoading(true);
      aircraftManagerInstance.filterAircraftByRegion(currentRegion.id);
      
      // Reset aircraft selection when region changes
      setAircraftType('');
      setAircraftRegistration('');
      setSelectedAircraft(null);
    }
  }, [aircraftManagerInstance, currentRegion]);

  // Handle aircraft type change
  const changeAircraftType = useCallback((type) => {
    setAircraftType(type);
    setAircraftRegistration('');
    
    if (aircraftManagerInstance && currentRegion) {
      aircraftManagerInstance.filterAircraft(currentRegion.id, type);
    }
  }, [aircraftManagerInstance, currentRegion]);

  // Handle aircraft registration change
  const changeAircraftRegistration = useCallback((registration) => {
    setAircraftRegistration(registration);
    
    if (aircraftManagerInstance && registration) {
      aircraftManagerInstance.selectAircraft(registration);
    } else {
      setSelectedAircraft(null);
    }
  }, [aircraftManagerInstance]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const loadSettings = () => {
        const deckTime = localStorage.getItem('fastPlanner_deckTimePerStop');
        if (deckTime) setDeckTimePerStop(parseInt(deckTime, 10));
        
        const deckFuel = localStorage.getItem('fastPlanner_deckFuelPerStop');
        if (deckFuel) setDeckFuelPerStop(parseInt(deckFuel, 10));
        
        const fuelFlow = localStorage.getItem('fastPlanner_deckFuelFlow');
        if (fuelFlow) setDeckFuelFlow(parseInt(fuelFlow, 10));
        
        const paxWeight = localStorage.getItem('fastPlanner_passengerWeight');
        if (paxWeight) setPassengerWeight(parseInt(paxWeight, 10));
        
        const cargo = localStorage.getItem('fastPlanner_cargoWeight');
        if (cargo) setCargoWeight(parseInt(cargo, 10));
        
        const reserve = localStorage.getItem('fastPlanner_reserveFuel');
        if (reserve) setReserveFuel(parseInt(reserve, 10));
        
        const taxi = localStorage.getItem('fastPlanner_taxiFuel');
        if (taxi) setTaxiFuel(parseInt(taxi, 10));
        
        const contingency = localStorage.getItem('fastPlanner_contingencyFuelPercent');
        if (contingency) setContingencyFuelPercent(parseInt(contingency, 10));
        
        const method = localStorage.getItem('fastPlanner_reserveMethod');
        if (method) setReserveMethod(method);
      };
      
      loadSettings();
      
      // Event listener for save-aircraft-settings events
      const saveHandler = (event) => {
        if (event.detail && event.detail.key && event.detail.settings) {
          localStorage.setItem(`fastPlanner_${event.detail.key}`, JSON.stringify(event.detail.settings));
          console.log(`Saved settings for ${event.detail.key}`);
        }
      };
      
      window.addEventListener('save-aircraft-settings', saveHandler);
      
      // Cleanup
      return () => {
        window.removeEventListener('save-aircraft-settings', saveHandler);
      };
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  // Helper functions for settings
  const handlePayloadWeightChange = (weight) => {
    setPayloadWeight(weight);
  };

  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
  };

  const handleDeckTimeChange = (time) => {
    setDeckTimePerStop(time);
  };

  const handleDeckFuelPerStopChange = (fuel) => {
    setDeckFuelPerStop(fuel);
  };

  const handleDeckFuelFlowChange = (flow) => {
    setDeckFuelFlow(flow);
  };

  const handlePassengerWeightChange = (weight) => {
    setPassengerWeight(weight);
  };

  const handleCargoWeightChange = (weight) => {
    setCargoWeight(weight);
  };

  const handleTaxiFuelChange = (fuel) => {
    setTaxiFuel(fuel);
  };

  const handleContingencyFuelPercentChange = (percent) => {
    setContingencyFuelPercent(percent);
  };

  const handleReserveMethodChange = (method) => {
    setReserveMethod(method);
  };

  // Create a settings object that can be passed to components
  const flightSettings = {
    deckTimePerStop,
    deckFuelPerStop,
    deckFuelFlow,
    passengerWeight,
    cargoWeight,
    reserveFuel,
    taxiFuel,
    contingencyFuelPercent,
    reserveMethod,
    payloadWeight
  };

  // Provider value object
  const value = {
    // Aircraft state
    aircraftType,
    aircraftRegistration,
    selectedAircraft,
    aircraftList,
    aircraftsByType,
    aircraftLoading,
    changeAircraftType,
    changeAircraftRegistration,
    aircraftManager: aircraftManagerInstance,
    
    // Flight parameters
    payloadWeight,
    reserveFuel,
    setPayloadWeight: handlePayloadWeightChange,
    setReserveFuel: handleReserveFuelChange,
    
    // Full settings
    flightSettings,
    setDeckTimePerStop: handleDeckTimeChange,
    setDeckFuelPerStop: handleDeckFuelPerStopChange,
    setDeckFuelFlow: handleDeckFuelFlowChange,
    setPassengerWeight: handlePassengerWeightChange,
    setCargoWeight: handleCargoWeightChange,
    setTaxiFuel: handleTaxiFuelChange,
    setContingencyFuelPercent: handleContingencyFuelPercentChange,
    setReserveMethod: handleReserveMethodChange
  };

  return (
    <AircraftContext.Provider value={value}>
      {children}
    </AircraftContext.Provider>
  );
};

// Custom hook for using the aircraft context
export const useAircraft = () => {
  const context = useContext(AircraftContext);
  if (!context) {
    throw new Error('useAircraft must be used within an AircraftProvider');
  }
  return context;
};

export default AircraftContext;