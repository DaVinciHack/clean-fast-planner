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
    console.log("AircraftContext: Creating new AircraftManager instance");
    const manager = new AircraftManager();
    
    // Add to window for debugging
    window.aircraftManager = manager;
    
    // Set up callbacks
    manager.setCallback('onAircraftLoaded', (allAircraft) => {
      console.log(`AircraftContext: Loaded ${allAircraft.length} aircraft`);
      setAircraftList(allAircraft);
      
      // IMMEDIATELY create the empty type buckets after loading all aircraft
      const allTypes = {
        'S92': [],
        'S76': [],
        'S76D': [],
        'AW139': [],
        'AW189': [],
        'H175': [],
        'H160': [],
        'EC135': [],
        'EC225': [],
        'AS350': [],
        'A119': [],
        'A109E': [], // Add this type to match the original
      };
      
      // Fill the buckets with matching aircraft
      allAircraft.forEach(aircraft => {
        const type = aircraft.modelType || 'S92';
        if (allTypes[type]) {
          allTypes[type].push(aircraft);
        } else {
          // Create a new bucket for unknown types
          allTypes[type] = [aircraft];
        }
      });
      
      // Log the counts to help with debugging
      Object.keys(allTypes).forEach(type => {
        console.log(`Type ${type}: ${allTypes[type].length} aircraft`);
      });
      
      // Update the state with ALL types, including empty ones
      setAircraftsByType(allTypes);
      setAircraftLoading(false);
      
      // Show a debug message with total aircraft count
      const message = document.createElement('div');
      message.style.position = 'fixed';
      message.style.bottom = '50px';
      message.style.right = '20px';
      message.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
      message.style.color = 'white';
      message.style.padding = '10px 15px';
      message.style.borderRadius = '5px';
      message.style.zIndex = '10000';
      message.style.fontFamily = 'sans-serif';
      message.textContent = `All aircraft loaded! Total: ${allAircraft.length}`;
      document.body.appendChild(message);
      
      // Remove the message after 3 seconds
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 3000);
    });
    
    manager.setCallback('onAircraftFiltered', (filteredAircraft) => {
      console.log(`AircraftContext: Filtered to ${filteredAircraft.length} aircraft`);
      
      // If we get detailed data with byType, use it
      if (filteredAircraft.byType) {
        console.log('AircraftContext: Received detailed type data from manager');
        setAircraftsByType(filteredAircraft.byType);
      } else {
        // Group the filtered aircraft by type manually
        // Always include ALL the standard aircraft types
        const byType = {
          'S92': [],
          'S76': [],
          'S76D': [],
          'AW139': [],
          'AW189': [],
          'H175': [],
          'H160': [],
          'EC135': [],
          'EC225': [],
          'AS350': [],
          'A119': []
        };
        
        // Then add any aircraft from the filtered list to the appropriate bucket
        filteredAircraft.forEach(aircraft => {
          const type = aircraft.modelType || 'UNKNOWN';
          if (byType[type]) {
            byType[type].push(aircraft);
          } else {
            byType[type] = [aircraft];
          }
        });
        
        console.log(`AircraftContext: Grouped aircraft by ${Object.keys(byType).length} types`);
        console.log('Aircraft by type:', Object.fromEntries(
          Object.entries(byType).map(([type, aircraft]) => [type, aircraft.length])
        ));
        
        setAircraftsByType(byType);
      }
      
      setAircraftLoading(false);
    });
    
    manager.setCallback('onAircraftSelected', (aircraft) => {
      console.log('AircraftContext: Aircraft selected from manager:', aircraft);
      setSelectedAircraft(aircraft);
      if (aircraft) {
        // Ensure the aircraft type is updated to match the selected aircraft
        console.log(`Setting aircraft type to match selected aircraft: ${aircraft.modelType}`);
        setAircraftType(aircraft.modelType);
      }
    });
    
    manager.setCallback('onError', (error) => {
      console.error('AircraftManager error:', error);
      setAircraftLoading(false);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.style.position = 'fixed';
      errorMessage.style.top = '20px';
      errorMessage.style.left = '20px';
      errorMessage.style.backgroundColor = 'rgba(200, 0, 0, 0.8)';
      errorMessage.style.color = 'white';
      errorMessage.style.padding = '10px 15px';
      errorMessage.style.borderRadius = '5px';
      errorMessage.style.zIndex = '10000';
      errorMessage.style.fontFamily = 'sans-serif';
      errorMessage.textContent = `Error loading aircraft: ${error.message}`;
      document.body.appendChild(errorMessage);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (errorMessage.parentNode) {
          errorMessage.parentNode.removeChild(errorMessage);
        }
      }, 5000);
    });
    
    setAircraftManagerInstance(manager);
  }, []);

  // Load all aircraft when client is available - IMMEDIATELY
  useEffect(() => {
    if (aircraftManagerInstance && client) {
      // Set loading state and show visual feedback
      setAircraftLoading(true);
      console.log('AircraftContext: Client and manager available, loading aircraft');
      
      // Create immediate visual feedback
      const loadingMessage = document.createElement('div');
      loadingMessage.style.position = 'fixed';
      loadingMessage.style.top = '50%';
      loadingMessage.style.left = '50%';
      loadingMessage.style.transform = 'translate(-50%, -50%)';
      loadingMessage.style.padding = '20px 25px';
      loadingMessage.style.backgroundColor = 'rgba(0, 50, 100, 0.9)';
      loadingMessage.style.color = 'white';
      loadingMessage.style.borderRadius = '8px';
      loadingMessage.style.zIndex = '10000';
      loadingMessage.style.fontFamily = 'sans-serif';
      loadingMessage.style.fontSize = '18px';
      loadingMessage.style.fontWeight = 'bold';
      loadingMessage.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
      loadingMessage.textContent = 'Loading aircraft data...';
      document.body.appendChild(loadingMessage);
      
      // ALWAYS load aircraft data - don't use global flag
      // This is critical for the application to work correctly
      console.log('AircraftContext: Loading all aircraft from OSDK');
      
      // Reset the global flag to force a load
      window.aircraftLoadedGlobally = false;
      
      // Now load all aircraft
      aircraftManagerInstance.loadAircraftFromOSDK(client)
        .then(aircraft => {
          window.aircraftLoadedGlobally = true;
          console.log(`Successfully loaded ${aircraft.length} aircraft from OSDK`);
          
          // Update the loading message
          loadingMessage.textContent = `Loaded ${aircraft.length} aircraft successfully!`;
          loadingMessage.style.backgroundColor = 'rgba(0, 100, 50, 0.9)';
          
          // Remove the message after a short delay
          setTimeout(() => {
            if (loadingMessage.parentNode) {
              loadingMessage.parentNode.removeChild(loadingMessage);
            }
          }, 2000);
          
          // If we have a region, immediately filter to show aircraft in that region
          if (currentRegion) {
            try {
              console.log(`Filtering loaded aircraft for ${currentRegion.name}`);
              
              // Get aircraft for the current region
              const aircraftInRegion = aircraftManagerInstance.getAircraftByRegion(currentRegion.id);
              console.log(`Found ${aircraftInRegion.length} aircraft in ${currentRegion.name}`);
              
              // Create buckets for all standard types
              const allTypes = {
                'S92': [],
                'S76': [],
                'S76D': [],
                'AW139': [],
                'AW189': [],
                'H175': [],
                'H160': [],
                'EC135': [],
                'EC225': [],
                'AS350': [],
                'A119': []
              };
              
              // Fill the buckets with actual aircraft
              aircraftInRegion.forEach(aircraft => {
                const type = aircraft.modelType || 'S92';
                if (allTypes[type]) {
                  allTypes[type].push(aircraft);
                } else {
                  // If unknown type, add a new bucket
                  allTypes[type] = [aircraft];
                }
              });
              
              // Update state with all types
              setAircraftsByType(allTypes);
              
              // Add a message showing aircraft counts
              console.log(`Aircraft counts in ${currentRegion.name}:`, 
                Object.entries(allTypes).reduce((acc, [type, aircraft]) => {
                  if (aircraft.length > 0) {
                    acc[type] = aircraft.length;
                  }
                  return acc;
                }, {})
              );
              
              // If no aircraft type is selected yet, auto-select first type with aircraft
              if (!aircraftType) {
                const firstTypeWithAircraft = Object.keys(allTypes).find(
                  type => allTypes[type] && allTypes[type].length > 0
                );
                
                if (firstTypeWithAircraft) {
                  console.log(`Auto-selecting first type with aircraft: ${firstTypeWithAircraft}`);
                  setAircraftType(firstTypeWithAircraft);
                }
              }
            } catch (error) {
              console.error('Error filtering aircraft for region:', error);
            }
          }
          
          // Always end loading state
          setAircraftLoading(false);
        })
        .catch(error => {
          console.error('Error loading aircraft from OSDK:', error);
          
          // Update the loading message to show the error
          loadingMessage.textContent = `Error loading aircraft: ${error.message}`;
          loadingMessage.style.backgroundColor = 'rgba(200, 0, 0, 0.9)';
          
          // Remove the message after a short delay
          setTimeout(() => {
            if (loadingMessage.parentNode) {
              loadingMessage.parentNode.removeChild(loadingMessage);
            }
          }, 3000);
          
          // End loading state
          setAircraftLoading(false);
        });
    }
  }, [aircraftManagerInstance, client]);

  // Filter aircraft when region changes
  useEffect(() => {
    if (aircraftManagerInstance && currentRegion) {
      setAircraftLoading(true);
      console.log(`AircraftContext: Filtering aircraft for region ${currentRegion.id}`);
      
      try {
        // Get the aircraft by region
        const aircraftInRegion = aircraftManagerInstance.getAircraftByRegion(currentRegion.id);
        console.log(`AircraftContext: Found ${aircraftInRegion.length} aircraft in region ${currentRegion.id}`);
        
        // IMPORTANT: Create an object with ALL possible aircraft types (empty arrays)
        // This is the key trick from the original component - always show all types
        const allTypes = {
          'S92': [],
          'S76': [],
          'S76D': [],
          'AW139': [],
          'AW189': [],
          'H175': [],
          'H160': [],
          'EC135': [],
          'EC225': [],
          'AS350': [],
          'A119': [],
          'A109E': [] // Add this type to match the original
        };
        
        // Now fill in the types with actual aircraft in this region
        aircraftInRegion.forEach(aircraft => {
          const type = aircraft.modelType || 'S92';
          if (allTypes[type]) {
            allTypes[type].push(aircraft);
          } else {
            // If we encounter an unknown type, create a new bucket
            allTypes[type] = [aircraft];
          }
        });
        
        // Log counts for debugging
        Object.keys(allTypes).forEach(type => {
          console.log(`Type ${type}: ${allTypes[type].length} aircraft`);
        });
        
        // Update the state with ALL types, even empty ones
        setAircraftsByType(allTypes);
        
        // Create a visual indicator for the user
        const showMessage = (message) => {
          const messageBox = document.createElement('div');
          messageBox.style.position = 'fixed';
          messageBox.style.bottom = '20px';
          messageBox.style.right = '20px';
          messageBox.style.backgroundColor = 'rgba(0, 50, 100, 0.9)';
          messageBox.style.color = 'white';
          messageBox.style.padding = '10px 15px';
          messageBox.style.borderRadius = '5px';
          messageBox.style.zIndex = '10000';
          messageBox.style.fontFamily = 'sans-serif';
          messageBox.style.fontSize = '14px';
          messageBox.textContent = message;
          document.body.appendChild(messageBox);
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            if (messageBox.parentNode) {
              messageBox.parentNode.removeChild(messageBox);
            }
          }, 3000);
        };
        
        // Show a message with aircraft counts
        const typesWithAircraft = Object.keys(allTypes).filter(t => allTypes[t].length > 0).length;
        const totalAircraft = Object.values(allTypes).flat().length;
        if (totalAircraft > 0) {
          showMessage(`Loaded ${totalAircraft} aircraft in ${typesWithAircraft} types for ${currentRegion.name}`);
        }
      } catch (error) {
        console.error('AircraftContext: Error filtering aircraft by region:', error);
      }
      
      // Reset aircraft selection when region changes
      setAircraftType('');
      setAircraftRegistration('');
      setSelectedAircraft(null);
      
      setAircraftLoading(false);
    }
  }, [aircraftManagerInstance, currentRegion]);

  // Handle aircraft type change
  const changeAircraftType = useCallback((type) => {
    console.log(`AircraftContext: Changing aircraft type to ${type}`);
    
    // Store the current state for reference
    const hadSelectedAircraft = selectedAircraft !== null;
    
    // Important: Clear the selected aircraft when changing type
    // This maintains the original behavior from ModularFastPlannerComponent
    if (type && type !== '' && selectedAircraft) {
      console.log('Clearing selected aircraft because type is changing');
      setSelectedAircraft(null);
      setAircraftRegistration('');
    }
    
    // Update the type filter
    setAircraftType(type);
    
    if (aircraftManagerInstance && currentRegion) {
      // IMPORTANT: If empty type (user selected "-- Change Aircraft Type --"), 
      // always show all aircraft types regardless of whether an aircraft was selected
      if (!type) {
        console.log('Empty type selected, showing all types in current region');
        
        try {
          // Get all aircraft in the current region
          const aircraftInRegion = aircraftManagerInstance.getAircraftByRegion(currentRegion.id);
          
          // Create buckets for all standard types
          const allTypes = {
            'S92': [],
            'S76': [],
            'S76D': [],
            'AW139': [],
            'AW189': [],
            'H175': [],
            'H160': [],
            'EC135': [],
            'EC225': [],
            'AS350': [],
            'A119': [],
            'A109E': [] // Add this type to match the original
          };
          
          // Fill the buckets with actual aircraft
          aircraftInRegion.forEach(a => {
            const aType = a.modelType || 'S92';
            if (allTypes[aType]) {
              allTypes[aType].push(a);
            } else {
              allTypes[aType] = [a];
            }
          });
          
          // Update the aircraft buckets state
          setAircraftsByType(allTypes);
          console.log('Updated aircraft buckets to show all types');
        } catch (error) {
          console.error('Error updating aircraft types:', error);
        }
      }
      // If a type is selected, filter to that type
      else if (type && type !== '') {
        console.log(`Filtering to type ${type}`);
        
        try {
          // This is the trick - when a specific type is selected,
          // we still create buckets for ALL types, but only fill
          // the selected type's bucket with aircraft
          const allTypes = {
            'S92': [],
            'S76': [],
            'S76D': [],
            'AW139': [],
            'AW189': [],
            'H175': [],
            'H160': [],
            'EC135': [],
            'EC225': [],
            'AS350': [],
            'A119': [],
            'A109E': [] // Add this type to match the original
          };
          
          // Get all aircraft of this type in the current region
          const filteredAircraft = aircraftManagerInstance.filterAircraft(currentRegion.id, type);
          console.log(`Found ${filteredAircraft.length} aircraft of type ${type}`);
          
          // Put them in the correct bucket
          allTypes[type] = filteredAircraft;
          
          // Update the state with ALL types, but only the selected one has aircraft
          setAircraftsByType(allTypes);
        } catch (error) {
          console.error('Error filtering aircraft by type:', error);
        }
      }
    }
  }, [aircraftManagerInstance, currentRegion, selectedAircraft]);

  // Handle aircraft registration change
  const changeAircraftRegistration = useCallback((registration) => {
    console.log(`AircraftContext: Changing aircraft registration to ${registration}`);
    setAircraftRegistration(registration);
    
    if (aircraftManagerInstance && registration) {
      const aircraft = aircraftManagerInstance.getAircraftByRegistration(registration);
      if (aircraft) {
        // Store selected aircraft
        setSelectedAircraft(aircraft);
        console.log('Selected aircraft:', aircraft);
        
        // Set a global reference for the current registration and type
        window.currentAircraftRegistration = registration;
        window.currentAircraftType = aircraft.modelType;
        window.selectedAircraftObject = aircraft;
        
        // CRITICAL FIX: When an aircraft is selected, we need to:
        // 1. Keep the actual aircraft type in state (don't clear it)
        // 2. Load ALL available types from the current region
        // 3. Reset the type dropdown to visual "-- Change Aircraft Type --"
        // This ensures when the dropdown is clicked, it shows all types
        
        // Store the current type for reference
        const currentAircraftType = aircraft.modelType;
        console.log(`Selected aircraft is type: ${currentAircraftType}`);
        
        // IMPORTANT: Load all aircraft from the current region
        // This ensures all types are available when the dropdown is clicked
        if (currentRegion) {
          try {
            // Get all aircraft in the current region
            const allAircraftInRegion = aircraftManagerInstance.getAircraftByRegion(currentRegion.id);
            console.log(`Found ${allAircraftInRegion.length} aircraft in region ${currentRegion.name}`);
            
            // Create empty buckets for ALL standard types
            const allTypes = {
              'S92': [],
              'S76': [],
              'S76D': [],
              'AW139': [],
              'AW189': [],
              'H175': [],
              'H160': [],
              'EC135': [],
              'EC225': [],
              'AS350': [],
              'A119': [],
              'A109E': []
            };
            
            // Fill in the buckets with actual aircraft
            allAircraftInRegion.forEach(a => {
              const type = a.modelType || 'S92';
              if (allTypes[type]) {
                allTypes[type].push(a);
              } else {
                // If unknown type, create a new bucket
                allTypes[type] = [a];
              }
            });
            
            // CRITICAL: We maintain the type filter in state
            // but update the buckets to include ALL types
            setAircraftsByType(allTypes);
            
            // Don't change the aircraftType state - keep it as the selected aircraft's type
            // This allows the registration dropdown to stay filtered to the aircraft type
            console.log(`Keeping state aircraft type as: ${currentAircraftType}`);
            
            // Log available types for debugging
            Object.keys(allTypes).filter(t => allTypes[t].length > 0).forEach(t => {
              console.log(`Type ${t}: ${allTypes[t].length} aircraft`);
            });
          } catch (error) {
            console.error('Error updating aircraft types after selection:', error);
          }
        }
        
        // Reset UI elements via DOM manipulation - not state
        setTimeout(() => {
          // Reset the type dropdown to "-- Change Aircraft Type --"
          const typeDropdown = document.getElementById('aircraft-type');
          if (typeDropdown) {
            // Set the DOM value directly - this affects the visual display only
            typeDropdown.value = 'select';
            console.log('Reset type dropdown visual display to "-- Change Aircraft Type --"');
            
            // No need to dispatch event - we don't want to change the state
            // Just visually change the dropdown
          }
          
          // Make sure the registration dropdown still shows the selected registration
          const regDropdown = document.getElementById('aircraft-registration');
          if (regDropdown) {
            // Ensure registration dropdown shows the selected value
            regDropdown.value = registration;
            console.log('Ensured registration dropdown shows selected aircraft');
          }
        }, 50);
        
        // Load any saved settings for this aircraft
        try {
          const savedSettings = localStorage.getItem(`aircraft_${registration}`);
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            console.log(`Loaded saved settings for ${registration}`, settings);
            
            // Apply the saved settings
            if (settings.deckTimePerStop !== undefined) setDeckTimePerStop(settings.deckTimePerStop);
            if (settings.deckFuelFlow !== undefined) setDeckFuelFlow(settings.deckFuelFlow);
            if (settings.reserveFuel !== undefined) setReserveFuel(settings.reserveFuel);
            if (settings.passengerWeight !== undefined) setPassengerWeight(settings.passengerWeight);
            if (settings.cargoWeight !== undefined) setCargoWeight(settings.cargoWeight);
            if (settings.taxiFuel !== undefined) setTaxiFuel(settings.taxiFuel);
            if (settings.contingencyFuelPercent !== undefined) setContingencyFuelPercent(settings.contingencyFuelPercent);
            if (settings.reserveMethod !== undefined) setReserveMethod(settings.reserveMethod);
          }
        } catch (error) {
          console.error('Error loading aircraft settings:', error);
        }
      } else {
        console.warn(`Aircraft with registration ${registration} not found`);
        setSelectedAircraft(null);
      }
    } else if (!registration) {
      setSelectedAircraft(null);
    }
  }, [aircraftManagerInstance, currentRegion, setDeckTimePerStop, setDeckFuelFlow, setReserveFuel, 
      setPassengerWeight, setCargoWeight, setTaxiFuel, setContingencyFuelPercent, setReserveMethod]);

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