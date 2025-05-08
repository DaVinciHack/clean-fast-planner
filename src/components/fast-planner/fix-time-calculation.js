const fs = require('fs');

const filePath = '/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx';

// Create backup
fs.copyFileSync(filePath, `${filePath}.timefix-backup`);
console.log(`Created backup at ${filePath}.timefix-backup`);

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define the pattern to look for
const oldPattern = `      // Check if stats are valid before updating
      if (!stats || !stats.timeHours || stats.timeHours === 0) {
        console.error('🔄 Received invalid route stats with zero time:', stats);
        return; // Don't update with invalid stats
      }`;

// Define the replacement
const newCode = `      // Check if stats are valid before updating
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
            stats.estimatedTime = \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}\`;
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
      }`;

// Replace the pattern in the content
if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newCode);
  console.log('Successfully replaced the validation code pattern.');
} else {
  console.log('Pattern not found. The file might have been modified already.');
}

// Write the modified content back to the file
fs.writeFileSync(filePath, content);
console.log(`Updated ${filePath} with the fix.`);
