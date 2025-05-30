// Quick diagnostic script to check fuel policy loading
// Run this in browser console when app is loaded

console.log('🔧 FUEL POLICY DIAGNOSTIC');
console.log('Current region:', window.currentRegion);
console.log('Available regions:', window.availableRegions);

// Check if we can access the fuel policy service
if (window.fuelPolicyService) {
  console.log('Cached regions:', window.fuelPolicyService.getCachedRegions());
} else {
  console.log('No fuel policy service found on window');
}

// Check current region context
if (window.regionContext) {
  console.log('Region context:', window.regionContext);
}

// Try to trigger fuel policy loading manually
console.log('Try running this to test Gulf policies:');
console.log('fuelPolicy.loadPoliciesForRegion("GULF OF MEXICO")');

console.log('Try running this to test Norway policies:');  
console.log('fuelPolicy.loadPoliciesForRegion("NORWAY")');
