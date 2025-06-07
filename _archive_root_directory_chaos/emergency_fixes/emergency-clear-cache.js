// Emergency localStorage clear for fuel policy issues
// Run this in browser console if fuel policies are still showing wrong data

console.log('🧹 EMERGENCY CLEANUP: Clearing localStorage and fuel policy cache');

// Clear localStorage
localStorage.removeItem('fastPlannerSettings');
localStorage.removeItem('fuelPolicyCache');
localStorage.removeItem('selectedRegion');
localStorage.removeItem('selectedAircraft');

// Clear any other fuel policy related storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('fuel') || key.includes('policy') || key.includes('region')) {
    console.log(`Removing localStorage key: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log('✅ Emergency cleanup complete. Please refresh the page.');
console.log('The app should now load fresh without any cached fuel policy data.');
