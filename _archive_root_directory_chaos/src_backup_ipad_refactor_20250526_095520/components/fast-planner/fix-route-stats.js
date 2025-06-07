/**
 * This script contains a fix for the issue where route stats are being rejected
 * due to zero time, which prevents stop cards from being generated.
 * 
 * This file should be used to modify the FastPlannerApp.jsx file.
 */

// Find this code in FastPlannerApp.jsx in the onCalculationComplete callback:
// Original code:
/*
      // Check if stats are valid before updating
      if (!stats || !stats.timeHours || stats.timeHours === 0) {
        console.error('🔄 Received invalid route stats with zero time:', stats);
        return; // Don't update with invalid stats
      }
*/

// Replace with this fixed code:
/*
      // Check if stats are valid before updating
      if (!stats || !stats.timeHours || stats.timeHours === 0) {
        console.error('🔄 Received invalid route stats with zero time:', stats);
        
        // FIXED: Add manual time calculation when timeHours is zero
        if (stats && stats.totalDistance && selectedAircraft) {
          console.log('🔄 ATTEMPTING FIX: Manually calculating timeHours');
          const totalDistance = parseFloat(stats.totalDistance);
          if (totalDistance > 0 && selectedAircraft.cruiseSpeed > 0) {
            stats.timeHours = totalDistance / selectedAircraft.cruiseSpeed;
            const hours = Math.floor(stats.timeHours);
            const minutes = Math.floor((stats.timeHours - hours) * 60);
            stats.estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            console.log('🔄 Manual calculation results:', {
              distance: totalDistance,
              cruiseSpeed: selectedAircraft.cruiseSpeed,
              timeHours: stats.timeHours,
              estimatedTime: stats.estimatedTime
            });
            // Continue processing with the fixed stats
          } else {
            console.error('🔄 Cannot fix time calculation: Invalid distance or cruise speed');
            return; // Don't update with invalid stats
          }
        } else {
          console.error('🔄 Cannot fix time calculation: Missing required data');
          return; // Don't update with invalid stats
        }
      }
*/
