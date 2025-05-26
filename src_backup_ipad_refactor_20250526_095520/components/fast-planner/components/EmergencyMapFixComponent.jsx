import React, { useEffect } from 'react';
import { applyEmergencyFix } from '../modules/emergency-map-fix';

/**
 * EmergencyMapFixComponent
 * 
 * A simple component that applies the emergency map fix
 * This bypasses all complex handlers and implements a direct,
 * reliable map click handler
 */
const EmergencyMapFixComponent = () => {
  // Apply the fix on component mount
  useEffect(() => {
    console.log('🚑 EmergencyMapFixComponent: Mounted, applying fix');
    
    // Try to apply the fix immediately
    let success = applyEmergencyFix();
    
    // If it fails, try again with delays
    if (!success) {
      console.log('🚑 EmergencyMapFixComponent: Initial application failed, trying with delay');
      
      // Try after 1 second
      setTimeout(() => {
        let success = applyEmergencyFix();
        
        // If still fails, try again after 3 seconds
        if (!success) {
          console.log('🚑 EmergencyMapFixComponent: Second attempt failed, trying one more time');
          
          setTimeout(() => {
            applyEmergencyFix();
          }, 3000);
        }
      }, 1000);
    }
  }, []);
  
  // Component doesn't render anything
  return null;
};

export default EmergencyMapFixComponent;
