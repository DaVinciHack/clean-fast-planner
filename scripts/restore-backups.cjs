/**
 * Script to restore backups created by the zero-fuel-values.cjs script.
 */

const fs = require('fs');
const path = require('path');

// Files that might have backups
const filesToRestore = [
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'calculations', 'FlightCalculations.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'calculations', 'WindCalculations.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'RouteCalculator.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'AircraftManager.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'FastPlannerApp.jsx')
];

// Function to restore a backup file
function restoreBackup(filePath) {
  const backupPath = `${filePath}.safety-backup`;
  const fileName = path.basename(filePath);
  
  console.log(`Checking for backup of: ${fileName}`);
  
  if (fs.existsSync(backupPath)) {
    try {
      // Read the backup content
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      
      // Write the backup content to the original file
      fs.writeFileSync(filePath, backupContent);
      
      console.log(`  ✅ Restored ${fileName} from backup`);
      
      // Remove the backup file
      fs.unlinkSync(backupPath);
      console.log(`  ✅ Removed backup file`);
      
      return true;
    } catch (error) {
      console.error(`  ❌ Error restoring ${fileName}: ${error.message}`);
      return false;
    }
  } else {
    console.log(`  ⚠️ No backup found for ${fileName}`);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Restoring Files from Backups ===');
  console.log('This script restores files that were modified by the zero-fuel-values.cjs script.');
  console.log('=================================\n');
  
  let restoredCount = 0;
  
  filesToRestore.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const restored = restoreBackup(filePath);
      if (restored) {
        restoredCount++;
      }
    } else {
      console.log(`⚠️ Original file not found: ${filePath}`);
    }
  });
  
  console.log('\n=== Restoration Complete ===');
  console.log(`Restored ${restoredCount} files to their original state.`);
}

// Run the main function
main();
