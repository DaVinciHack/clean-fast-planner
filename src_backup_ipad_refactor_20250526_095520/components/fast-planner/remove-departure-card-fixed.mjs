/**
 * This script contains the minimal changes needed to remove the departure card
 * while preserving the wind and fuel calculation improvements.
 * 
 * The key issue is in the generateStopCardsData function where we're adding a departure card,
 * which is breaking the stop cards functionality.
 */

import fs from 'fs';

// Create proper path for file operations
const filePath = '/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx';
const backupPath = `${filePath}.remove-departure-card-backup`;

try {
  // Create a backup first
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the departure card section using the exact pattern found
  const departureCardStart = content.indexOf('// Create departure card');
  if (departureCardStart === -1) {
    console.log('Could not find departure card section. It might have been removed already.');
    process.exit(0);
  }
  
  // Find the end of the departure card section (before the next section starts)
  const nextSectionStart = content.indexOf('// Now create cards for each stop', departureCardStart);
  if (nextSectionStart === -1) {
    console.log('Could not find the end of the departure card section.');
    process.exit(1);
  }
  
  // Remove the departure card section
  const modifiedContent = 
    content.substring(0, departureCardStart) + 
    '// MODIFIED: Removed departure card section to fix stop cards functionality\n\n' +
    content.substring(nextSectionStart);
  
  // Write the modified content back to the file
  fs.writeFileSync(filePath, modifiedContent);
  console.log('Successfully removed the departure card section.');
  
  console.log('Done! The departure card has been removed while preserving all wind and fuel calculations.');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
