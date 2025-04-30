// IMPORTANT FUEL CALCULATION UPDATES

// State variables in ModularFastPlannerComponent
const [settings, setSettings] = useState({
  deckTimePerStop: 5,
  deckFuelPerStop: 100,
  deckFuelFlow: 400,
  passengerWeight: 220,
  cargoWeight: 0,
  taxiFuel: 50,
  contingencyFuelPercent: 10,
  reserveMethod: 'fixed'
});

// Update flight calculations when settings change
useEffect(() => {
  if (flightCalculationsRef.current) {
    flightCalculationsRef.current.updateConfig({
      passengerWeight: settings.passengerWeight,
      reserveFuel,
      deckTimePerStop: settings.deckTimePerStop,
      deckFuelFlow: settings.deckFuelFlow,
      taxiFuel: settings.taxiFuel,
      contingencyFuelPercent: settings.contingencyFuelPercent
    });
    
    console.log('Updated FlightCalculations config:', {
      passengerWeight: settings.passengerWeight,
      reserveFuel,
      deckTimePerStop: settings.deckTimePerStop,
      deckFuelFlow: settings.deckFuelFlow,
      taxiFuel: settings.taxiFuel,
      contingencyFuelPercent: settings.contingencyFuelPercent
    });
  }
}, [settings, reserveFuel]);

// Calculate route statistics
const calculateRouteStats = (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    setRouteStats(null);
    return null;
  }
  
  // Ensure flight calculator is initialized
  if (!flightCalculationsRef.current) {
    flightCalculationsRef.current = new FlightCalculations();
    
    // Set callback
    flightCalculationsRef.current.setCallback('onCalculationComplete', (result) => {
      setRouteStats(result);
    });
  }
  
  // Update with current settings
  flightCalculationsRef.current.updateConfig({
    passengerWeight: settings.passengerWeight,
    reserveFuel,
    deckTimePerStop: settings.deckTimePerStop,
    deckFuelFlow: settings.deckFuelFlow,
    taxiFuel: settings.taxiFuel,
    contingencyFuelPercent: settings.contingencyFuelPercent
  });
  
  // Create aircraft data
  let aircraftData;
  
  if (selectedAircraft) {
    aircraftData = {
      cruiseSpeed: selectedAircraft.cruiseSpeed || selectedAircraft.cruseSpeed || 145,
      fuelBurn: selectedAircraft.fuelBurn || 1100,
      maxFuelCapacity: selectedAircraft.maxFuel || 5000,
      dryOperatingWeightLbs: selectedAircraft.dryOperatingWeightLbs || 15000,
      usefulLoad: selectedAircraft.usefulLoad || 7000,
      maxPassengers: selectedAircraft.maxPassengers || 19,
      ...selectedAircraft
    };
  } else {
    aircraftData = {
      cruiseSpeed: 145,
      fuelBurn: 1100,
      maxFuelCapacity: 5000,
      dryOperatingWeightLbs: 15000,
      usefulLoad: 7000,
      maxPassengers: 19
    };
  }
  
  // Calculate stats
  const result = flightCalculationsRef.current.calculateFlightStats(coordinates, aircraftData, { payloadWeight });
  
  return result;
};

// Setting handlers
const handleSettingsChange = (newSettings) => {
  setSettings(prev => ({...prev, ...newSettings}));
};

// Handler for RouteStatsCard
// In the return statement:
{routeStats && (
  <div className={`route-stats-container ${rougeStatsVisible ? '' : 'hidden'}`}>
    <RouteStatsCard
      routeStats={routeStats}
      selectedAircraft={selectedAircraft}
      waypoints={waypoints}
      deckTimePerStop={settings.deckTimePerStop}
      deckFuelPerStop={settings.deckFuelPerStop}
      passengerWeight={settings.passengerWeight}
      cargoWeight={settings.cargoWeight}
    />
  </div>
)}

// Props for RightPanel
deckTimePerStop={settings.deckTimePerStop}
deckFuelPerStop={settings.deckFuelPerStop}
deckFuelFlow={settings.deckFuelFlow}
passengerWeight={settings.passengerWeight}
cargoWeight={settings.cargoWeight}
taxiFuel={settings.taxiFuel}
contingencyFuelPercent={settings.contingencyFuelPercent}
reserveMethod={settings.reserveMethod}
onDeckTimeChange={(value) => handleSettingsChange({ deckTimePerStop: value })}
onDeckFuelChange={(value) => handleSettingsChange({ deckFuelPerStop: value })}
onDeckFuelFlowChange={(value) => handleSettingsChange({ deckFuelFlow: value })}
onPassengerWeightChange={(value) => handleSettingsChange({ passengerWeight: value })}
onCargoWeightChange={(value) => handleSettingsChange({ cargoWeight: value })}
onTaxiFuelChange={(value) => handleSettingsChange({ taxiFuel: value })}
onContingencyFuelPercentChange={(value) => handleSettingsChange({ contingencyFuelPercent: value })}
onReserveMethodChange={(value) => handleSettingsChange({ reserveMethod: value })}