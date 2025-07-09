// Debug region key mismatch
console.log('Debugging region keys...');

const aircraftManager = window.appManagers?.aircraftManagerRef?.current;

if (aircraftManager) {
  console.log('=== AIRCRAFT BY REGION DEBUG ===');
  
  const byRegion = aircraftManager.aircraftByRegion;
  console.log('aircraftByRegion object:', byRegion);
  
  // Check each key
  Object.keys(byRegion).forEach(key => {
    const count = byRegion[key]?.length || 0;
    console.log(`"${key}": ${count} aircraft`);
    
    // Check for Gulf variations
    if (key.toLowerCase().includes('gulf')) {
      console.log(`  GULF FOUND: "${key}" has ${count} aircraft`);
      
      // Try this key specifically
      const gulfAircraft = byRegion[key];
      if (gulfAircraft && gulfAircraft.length > 0) {
        console.log(`  Sample aircraft from "${key}":`, {
          first: gulfAircraft[0].modelType,
          count: gulfAircraft.length
        });
        
        // Try triggering callback with this data
        console.log(`  Testing callback with "${key}" aircraft...`);
        aircraftManager.triggerCallback('onAircraftFiltered', gulfAircraft, null);
        
        setTimeout(() => {
          const dropdown = document.querySelector('.aircraft-type-dropdown');
          console.log(`  Dropdown after "${key}" filter:`, {
            optionCount: dropdown?.options?.length || 0,
            options: Array.from(dropdown?.options || []).map(opt => opt.text)
          });
        }, 300);
      }
    }
  });
  
  // Also check current region setting
  console.log('=== CURRENT REGION CHECK ===');
  console.log('window.activeRegionFromContext:', window.activeRegionFromContext);
  
  // Check types by region too
  console.log('=== TYPES BY REGION DEBUG ===');
  const typesByRegion = aircraftManager.typesByRegion;
  Object.keys(typesByRegion).forEach(key => {
    if (key.toLowerCase().includes('gulf')) {
      console.log(`Types for "${key}":`, typesByRegion[key]);
    }
  });
  
} else {
  console.log('No aircraft manager found');
}