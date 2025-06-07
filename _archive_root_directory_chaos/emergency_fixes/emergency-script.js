// emergency-script.js
// This script can be run directly in the browser console to apply our fix

// Import the emergency fix
import { applyEmergencyFix } from './src/components/fast-planner/modules/emergency-map-fix';

// Function to apply the emergency fix
function applyEmergencyMapFix() {
  console.log('🚨 Running emergency map fix from script');
  
  // Apply the fix
  const success = applyEmergencyFix();
  
  if (success) {
    console.log('🚨 Emergency map fix applied successfully');
  } else {
    console.error('🚨 Failed to apply emergency map fix');
  }
  
  return success;
}

// Make the function available globally
window.applyEmergencyMapFix = applyEmergencyMapFix;

// Export the function
export default applyEmergencyMapFix;
