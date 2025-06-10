import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AircraftManager } from '../modules';
import LoadingIndicator from '../modules/LoadingIndicator';

// Create the context
const AircraftContext = createContext(null);

/**
 * AircraftProvider component
 * Manages aircraft state and provides it to all child components
 */
export const AircraftProvider = ({ children, client, currentRegion }) => {
  // Aircraft state
  const [aircraftType, setAircraftType] = useState('');  // IMPORTANT: Initial state is empty string
  const [aircraftRegistration, setAircraftRegistration] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [aircraftsByType, setAircraftsByType] = useState({});
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [aircraftManagerInstance, setAircraftManagerInstance] = useState(null);
  
  // Flag to track first load
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
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
      // CRITICAL FIX: Do NOT update the aircraft type when an aircraft is selected
      // This is key to preventing the dropdown from being locked to one type
      if (aircraft) {
        console.log(`Aircraft selected: ${aircraft.registration} (${aircraft.modelType})`);
        // Don't set the type here - this allows viewing all types even when aircraft is selected
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
      // Set loading state
      setAircraftLoading(true);
      console.log('AircraftContext: Client and manager available, loading aircraft');
      
      // Use the LoadingIndicator module for showing loading status
      const loaderId = LoadingIndicator.show('.route-stats-title', 'Loading aircraft data...', { position: 'bottom' });
      
      // ALWAYS load aircraft data - don't use global flag
      // This is critical for the application to work correctly
      
      // Reset the global flag to force a load
      window.aircraftLoadedGlobally = false;
      
      // Now load all aircraft
      aircraftManagerInstance.loadAircraftFromOSDK(client)
        .then(aircraft => {
          window.aircraftLoadedGlobally = true;
          console.log(`Successfully loaded ${aircraft.length} aircraft from OSDK`);
          
          // Update the loading indicator text
          LoadingIndicator.updateText(loaderId, `Loaded ${aircraft.length} aircraft`);
          
          // Hide the loader after a short delay
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
          }, 2000);
          
          // If we have a region, immediately filter to show aircraft in that region
          if (currentRegion) {
            try {
              console.log(`Filtering loaded aircraft for ${currentRegion.name}`);
              
              // Get aircraft for the current region
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
                'A109E': []
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
              
              // CRITICAL CHANGE: NEVER auto-select a type on first load
              // This keeps the dropdown showing all aircraft types
              setAircraftType('');
              
              // IMPORTANT: Reset the dropdown visually
              setTimeout(() => {
                const typeDropdown = document.getElementById('aircraft-type');
                if (typeDropdown) {
                  typeDropdown.value = 'select';
                  console.log('Set type dropdown to "-- Change Aircraft Type --"');
                }
              }, 50);
            } catch (error) {
              console.error('Error filtering aircraft for region:', error);
            }
          }
          
          // Always end loading state
          setAircraftLoading(false);
        })
        .catch(error => {
          console.error('Error loading aircraft from OSDK:', error);
          
          // Show error message with the loading indicator
          LoadingIndicator.updateText(loaderId, `Error loading aircraft: ${error.message}`);
          
          // Hide the loader after a short delay
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
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
        
        // CRITICAL: Always ensure the type is empty on region change
        // This forces the dropdown to show "-- Change Aircraft Type --"
        setAircraftType('');
        
        // Reset UI elements via DOM manipulation to ensure dropdowns show the right values
        setTimeout(() => {
          // Reset the type dropdown to "-- Change Aircraft Type --"
          const typeDropdown = document.getElementById('aircraft-type');
          if (typeDropdown) {
            typeDropdown.value = 'select';
            console.log('Reset type dropdown to "-- Change Aircraft Type --"');
          }
        }, 50);
        
        // Create a visual indicator for the user using LoadingIndicator
        const typesWithAircraft = Object.keys(allTypes).filter(t => allTypes[t].length > 0).length;
        const totalAircraft = Object.values(allTypes).flat().length;
        if (totalAircraft > 0) {
          const loaderId = LoadingIndicator.show('.route-stats-title', 
            `Found ${totalAircraft} aircraft in ${typesWithAircraft} types for ${currentRegion.name}`, 
            { position: 'bottom' });
          
          // Hide the loader after a short delay
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
          }, 2000);
        }
      } catch (error) {
        console.error('AircraftContext: Error filtering aircraft by region:', error);
      }
      
      // Reset aircraft selection when region changes
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
    
    // Important: Only clear the selected aircraft when changing to a specific type
    // If the user is selecting "-- Change Aircraft Type --" (empty type),
    // we want to preserve the selected aircraft
    if (type && type !== '' && selectedAircraft) {
      // User is selecting a specific aircraft type
      console.log('Specific type selected, clearing previous aircraft selection');
      setSelectedAircraft(null);
      setAircraftRegistration('');
    } else if (!type && selectedAircraft) {
      // User is selecting "-- Change Aircraft Type --" but we have a selected aircraft
      console.log('Empty type selected but keeping selected aircraft:', selectedAircraft.registration);
      // Don't clear selectedAircraft here - preserve it in the "Selected Aircraft:" display
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
          
          // IMPORTANT: If we have a selected aircraft, keep it selected even when showing all types
          if (selectedAircraft) {
            console.log('Keeping selected aircraft even when showing all types');
            
            // This ensures the registration dropdown stays populated correctly
            setTimeout(() => {
              const regDropdown = document.getElementById('aircraft-registration');
              if (regDropdown && regDropdown.value !== aircraftRegistration) {
                regDropdown.value = aircraftRegistration;
                console.log(`Reset registration dropdown to: ${aircraftRegistration}`);
              }
            }, 50);
          }
        } catch (error) {
          console.error('Error updating aircraft types:', error);
        }
      }
      // If a type is selected, filter to that type
      else if (type && type !== '') {
        console.log(`Filtering to type ${type}`);
        
        try {
          // When a specific type is selected, we need to:
          // 1. Create buckets for ALL types for consistent dropdown behavior
          // 2. But only fill the selected type's bucket with aircraft
          // 3. Ensure the type is properly selected in the dropdown
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
          
          // Put them in the correct bucket
          allTypes[type] = filteredAircraft;
          
          // Update the state with ALL types, but only the selected one has aircraft
          setAircraftsByType(allTypes);
          
          // Ensure the type dropdown shows the correct value
          setTimeout(() => {
            const typeDropdown = document.getElementById('aircraft-type');
            if (typeDropdown && typeDropdown.value !== type) {
              typeDropdown.value = type;
              console.log(`Ensured type dropdown displays: ${type}`);
            }
          }, 50);
        } catch (error) {
          console.error('Error filtering aircraft by type:', error);
        }
      }
    }
  }, [aircraftManagerInstance, currentRegion, selectedAircraft, aircraftRegistration]);

  // Handle aircraft registration change
  const changeAircraftRegistration = useCallback((registration) => {
    console.log(`AircraftContext: Changing aircraft registration to ${registration}`);
    
    if (aircraftManagerInstance && registration) {
      const aircraft = aircraftManagerInstance.getAircraftByRegistration(registration);
      if (aircraft) {
        // STORE THE AIRCRAFT - This is critical to keep the aircraft info
        setSelectedAircraft(aircraft);
        console.log('Selected aircraft:', aircraft);
        
        // Set a global reference for debugging
        window.currentAircraftRegistration = registration;
        window.currentAircraftType = aircraft.modelType;
        window.selectedAircraftObject = aircraft;
        
        // CRITICAL: Completely clear both dropdown selections in state
        // This forces a FULL RESET of both dropdown contents
        setAircraftType('');  // <-- Critical: Empty string forces showing ALL types
        
        // IMPORTANT: We still want to preserve the selectedAircraft in state
        // but need to clear the registration dropdown. We should set this to empty
        // for UI purposes only, but NOT clear selectedAircraft state
        setAircraftRegistration(''); // <-- Clear registration input but keep selectedAircraft
        
        // CRITICAL: Update the selected aircraft display after a short delay
        // This ensures the UI reflects the proper selection state
        setTimeout(() => {
          const selectedAircraftDisplay = document.querySelector('.selected-aircraft-display');
          if (selectedAircraftDisplay) {
            if (aircraft) {
              // Force update the content to show the selected aircraft
              selectedAircraftDisplay.innerHTML = `${aircraft.registration.split(' (')[0]} ${aircraft.modelType ? `(${aircraft.modelType})` : ''}`;
              selectedAircraftDisplay.style.color = '#006699';
            }
          }
        }, 200);
        
        // Force reload ALL aircraft in the current region
        if (currentRegion) {
          try {
            // Get ALL aircraft in current region
            const allAircraftInRegion = aircraftManagerInstance.getAircraftByRegion(currentRegion.id);
            
            // Create empty buckets for ALL standard types - crucial for dropdown to work correctly
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
            
            // Fill buckets with all aircraft in this region
            allAircraftInRegion.forEach(a => {
              const type = a.modelType || 'S92';
              if (allTypes[type]) {
                allTypes[type].push(a);
              } else {
                allTypes[type] = [a];
              }
            });
            
            // Update state with ALL aircraft types
            // This is critical for resetting the dropdown contents
            setAircraftsByType(allTypes);
            
            // Show a notification with what's happening
            // This helps debug the dropdown state
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '100px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(0, 90, 150, 0.9)';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '10000';
            notification.style.fontFamily = 'sans-serif';
            notification.style.fontSize = '14px';
            notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            notification.textContent = `Aircraft types loaded: ${Object.keys(allTypes).filter(t => allTypes[t].length > 0).length}`;
            document.body.appendChild(notification);
            
            // Remove after 2 seconds
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 2000);
          } catch (error) {
            console.error('Error updating aircraft types after selection:', error);
          }
        }
        
        // CRITICAL: Force dropdown UI reset via DOM
        // This needs to happen after the state updates to ensure the dropdowns show the right options
        setTimeout(() => {
          // Reset type dropdown to show all available types again
          const typeDropdown = document.getElementById('aircraft-type');
          if (typeDropdown) {
            // Set visual display to "-- Change Aircraft Type --"
            typeDropdown.value = 'select';
            console.log('Reset type dropdown to "-- Change Aircraft Type --"');
            
            // Force a change event to refresh the dropdown contents
            // This is critical for making the dropdown show all types
            const event = new Event('change', { bubbles: true });
            typeDropdown.dispatchEvent(event);
            
            // Log the dropdown options to verify it's showing all types
            if (typeDropdown.options) {
              console.log(`Type dropdown now has ${typeDropdown.options.length} options`);
              
              // Force a re-render by adding a class and removing it
              typeDropdown.classList.add('force-refresh');
              setTimeout(() => typeDropdown.classList.remove('force-refresh'), 10);
            }
          }
          
          // Also reset registration dropdown
          const regDropdown = document.getElementById('aircraft-registration');
          if (regDropdown) {
            // Set to "-- Select Aircraft --"
            regDropdown.value = '';
            console.log('Reset registration dropdown to show all aircraft');
            
            // Force a change event to refresh dropdown
            const event = new Event('change', { bubbles: true });
            regDropdown.dispatchEvent(event);
            
            // Add and remove class to force re-render
            regDropdown.classList.add('force-refresh');
            setTimeout(() => regDropdown.classList.remove('force-refresh'), 10);
          }
          
          // CRITICAL: Directly update the Selected Aircraft display
          const selectedAircraftDisplay = document.getElementById('selected-aircraft-display');
          if (selectedAircraftDisplay && aircraft) {
            // Update both the content and style to indicate selection
            selectedAircraftDisplay.innerHTML = `${aircraft.registration.split(' (')[0]} ${aircraft.modelType ? `(${aircraft.modelType})` : ''}`;
            selectedAircraftDisplay.style.color = '#4285f4';
            console.log('Manually updated selected aircraft display');
            
            // Also update the TOP CARD with aircraft info
            const topCardTitle = document.querySelector('.route-stats-title');
            if (topCardTitle) {
              // Format like in image 2: "N159RB • AW139" with type in blue
              topCardTitle.innerHTML = `<span style="color: white">${aircraft.registration.split(' (')[0]} • </span><span style="color: #4285f4">${aircraft.modelType}</span>`;
              console.log('Updated top card title with aircraft info');
            }
          }
          
          // Use LoadingIndicator to show selection confirmation
          const loaderId = LoadingIndicator.show('.route-stats-title', `Aircraft Selected: ${aircraft.registration.split(' (')[0]} (${aircraft.modelType})`, { position: 'bottom' });
          
          // Hide the loader after showing the message for a moment
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
          }, 2000);
          
          // Create STRONG visual indicator that aircraft is selected but dropdowns are now reset
          const message = document.createElement('div');
          message.style.position = 'fixed';
          message.style.top = '20px';
          message.style.left = '50%';
          message.style.transform = 'translateX(-50%)';
          message.style.backgroundColor = 'rgba(0, 100, 0, 0.9)';
          message.style.color = 'white';
          message.style.padding = '15px 25px';
          message.style.borderRadius = '8px';
          message.style.zIndex = '10000';
          message.style.fontFamily = 'sans-serif';
          message.style.fontSize = '16px';
          message.style.fontWeight = 'bold';
          message.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
          message.innerHTML = `
            <div style="text-align:center; margin-bottom: 5px;">✅ Aircraft Selected: ${registration} (${aircraft.modelType})</div>
            <div style="font-size:12px; text-align:center; font-weight:normal;">Dropdowns reset to initial state</div>
          `;
          document.body.appendChild(message);
          
          // Remove after 3 seconds
          setTimeout(() => {
            if (message.parentNode) {
              message.parentNode.removeChild(message);
            }
          }, 3000);
          
          // CRITICAL - Set global flag for debugging
          window.dropdownsReset = true;
          window.selectedAircraftAfterReset = registration;
          
          // Force re-render the entire component tree
          // This is an extreme measure to make sure everything is rendered properly
          const event = new CustomEvent('force-rerender-dropdowns', {
            detail: { 
              reset: true,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(event);
        }, 100);
        
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
        setAircraftRegistration('');
      }
    } else if (!registration) {
      setSelectedAircraft(null);
      setAircraftRegistration('');
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

  // Track selectedAircraft changes
  useEffect(() => {
    if (selectedAircraft) {
      console.log('SELECTED AIRCRAFT STATE CHANGED:', selectedAircraft.registration);
      
      // When selected aircraft changes, force update the display
      setTimeout(() => {
        // Update the Selected Aircraft display
        const selectedAircraftDisplay = document.getElementById('selected-aircraft-display');
        if (selectedAircraftDisplay) {
          selectedAircraftDisplay.innerHTML = `${selectedAircraft.registration.split(' (')[0]} ${selectedAircraft.modelType ? `(${selectedAircraft.modelType})` : ''}`;
          selectedAircraftDisplay.style.color = '#4285f4';
          console.log('Updated selected aircraft display from state change');
        }
        
        // CRITICAL FIX: Update the TOP CARD with aircraft info
        const topCardTitle = document.querySelector('.route-stats-title');
        if (topCardTitle) {
          // Format like in image 2: "N159RB • AW139" with type in blue 
          topCardTitle.innerHTML = `<span style="color: white">${selectedAircraft.registration.split(' (')[0]} • </span><span style="color: #4285f4">${selectedAircraft.modelType}</span>`;
          console.log('Updated top card title with aircraft info');
        }
      }, 100);
    } else {
      console.log('selectedAircraft state cleared to null');
      
      // Also update display to "None Selected" when cleared
      setTimeout(() => {
        // Reset the Selected Aircraft display
        const selectedAircraftDisplay = document.getElementById('selected-aircraft-display');
        if (selectedAircraftDisplay) {
          selectedAircraftDisplay.innerHTML = 'None Selected';
          selectedAircraftDisplay.style.color = '#666';
        }
        
        // Reset the top card title
        const topCardTitle = document.querySelector('.route-stats-title');
        if (topCardTitle) {
          topCardTitle.innerHTML = 'Route Statistics';
          console.log('Reset top card title to default');
        }
      }, 100);
    }
  }, [selectedAircraft]);

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