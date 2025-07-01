  // Handle field changes - SIMPLIFIED to avoid double-calls and timeout issues
  const handleFieldChange = useCallback((stopIndex, fieldType, value) => {
    const key = `${stopIndex}_${fieldType}`;
    
    console.log(`🛩️ Fuel Breakdown: *** FIELD CHANGE CALLED ***`);
    console.log(`🛩️ Fuel Breakdown: Field change ${fieldType} for stop ${stopIndex}:`, value);
    console.log(`🛩️ Fuel Breakdown: Key: ${key}`);
    
    // Update user overrides FIRST
    setUserOverrides(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Set field state to green immediately
    setFieldStates(prev => ({
      ...prev,
      [key]: 'user-override'
    }));
    
    // Call the appropriate callback DIRECTLY (no setTimeout)
    console.log(`🔄 DIRECT call for ${fieldType}:`, value);
    
    try {
      switch (fieldType) {
        case 'extraFuel':
          console.log(`✅ Calling onExtraFuelChange with:`, value);
          onExtraFuelChange(value);
          break;
        case 'deckTime':
          console.log(`✅ Calling onDeckTimeChange with:`, value);
          onDeckTimeChange(value);
          break;
        case 'araFuel':
          // Location-specific ARA/approach fuel
          console.log(`🌦️ Location-specific fuel change for stop ${stopIndex}:`, value);
          const stopCard = localStopCards[stopIndex];
          const stopName = stopCard?.name || stopCard?.stopName || `stop_${stopIndex}`;
          const isRig = stopCard?.isRig || stopCard?.type === 'rig' || stopCard?.stopType === 'rig';
          
          console.log(`✅ About to call onLocationFuelChange with:`, {
            stopName: stopName,
            stopIndex: stopIndex,
            fuelType: isRig ? 'araFuel' : 'approachFuel',
            value: value,
            isRig: isRig
          });
          
          onLocationFuelChange({
            stopName: stopName,
            stopIndex: stopIndex,
            fuelType: isRig ? 'araFuel' : 'approachFuel',
            value: value,
            isRig: isRig
          });
          
          console.log(`✅ onLocationFuelChange called successfully`);
          break;
        default:
          console.log(`⚠️ Unknown field type: ${fieldType}`);
      }
      console.log(`✅ Settings update completed for ${fieldType}`);
    } catch (error) {
      console.error(`❌ Error in settings update for ${fieldType}:`, error);
    }
  }, [localStopCards, onExtraFuelChange, onDeckTimeChange, onLocationFuelChange]);