// Debug script to check fuel policy loading status
// Run this in browser console: copy and paste the entire script

(function() {
  console.log('🔍 FUEL POLICY DEBUG SCRIPT STARTING...');
  console.log('=====================================');
  
  // Check if FastPlannerApp has fuelPolicy data
  const fuelPolicyFromApp = window.fuelPolicyDebug || null;
  console.log('1. fuelPolicy from window.fuelPolicyDebug:', fuelPolicyFromApp);
  
  // Try to access from React DevTools if available
  try {
    const reactFiberNode = document.querySelector('#root')._reactInternalFiber || 
                          document.querySelector('#root')._reactInternals;
    console.log('2. React fiber found:', !!reactFiberNode);
  } catch (e) {
    console.log('2. React fiber access failed:', e.message);
  }
  
  // Check if useFuelPolicy hook data is available globally
  console.log('3. window.currentFuelPolicy:', window.currentFuelPolicy);
  console.log('4. window.fuelPolicyService:', window.fuelPolicyService);
  
  // Try to access fuel policy service directly
  if (window.fuelPolicyService) {
    const service = window.fuelPolicyService;
    console.log('5. FuelPolicyService status:');
    console.log('   - hasCurrentPolicy:', service.hasCurrentPolicy?.());
    console.log('   - getCurrentPolicy:', service.getCurrentPolicy?.());
    console.log('   - isLoading:', service.isLoading);
    console.log('   - availablePolicies length:', service.availablePolicies?.length || 0);
    console.log('   - currentRegion:', service.getCurrentRegion?.());
  }
  
  // Check for any fuel policy data in localStorage
  console.log('6. localStorage fuelPolicy keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().includes('fuel')) {
      console.log(`   - ${key}:`, localStorage.getItem(key)?.substring(0, 100) + '...');
    }
  }
  
  // Set up a watcher to monitor fuel policy changes
  let changeCount = 0;
  const originalLog = console.log;
  
  // Store original fuelPolicy reference
  let lastFuelPolicy = window.currentFuelPolicy;
  let lastTimestamp = Date.now();
  
  // Monitor changes every 100ms for 10 seconds
  const monitor = setInterval(() => {
    const currentFuelPolicy = window.currentFuelPolicy;
    const now = Date.now();
    
    if (currentFuelPolicy !== lastFuelPolicy) {
      changeCount++;
      console.log(`🔄 CHANGE #${changeCount} at ${now - lastTimestamp}ms:`, {
        from: lastFuelPolicy ? 'exists' : 'null',
        to: currentFuelPolicy ? 'exists' : 'null',
        hasCurrentPolicy: currentFuelPolicy?.hasCurrentPolicy,
        isLoading: currentFuelPolicy?.isLoading,
        currentPolicyUuid: currentFuelPolicy?.currentPolicy?.uuid
      });
      lastFuelPolicy = currentFuelPolicy;
      lastTimestamp = now;
    }
  }, 100);
  
  // Stop monitoring after 10 seconds
  setTimeout(() => {
    clearInterval(monitor);
    console.log(`🏁 MONITORING COMPLETE - Total changes detected: ${changeCount}`);
    console.log('=====================================');
  }, 10000);
  
  console.log('🔍 Monitoring fuel policy changes for 10 seconds...');
  
})();