/**
 * Script to zero out hard-coded fuel and performance values
 * in the flight calculation code for safety reasons.
 */

const fs = require('fs');
const path = require('path');

// Files to modify
const filesToModify = [
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'calculations', 'FlightCalculations.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'calculations', 'WindCalculations.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'RouteCalculator.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'AircraftManager.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'FastPlannerApp.jsx')
];

// Patterns to replace and their replacements
const replacements = [
  {
    pattern: /fuelBurn\s*[:=]\s*(\d+)/g,
    replacement: (match, p1) => match.replace(p1, '0')
  },
  {
    pattern: /cruiseSpeed\s*[:=]\s*(\d+)/g,
    replacement: (match, p1) => match.replace(p1, '0')
  },
  {
    pattern: /maxTakeoffWeight\s*[:=]\s*(\d+)/g,
    replacement: (match, p1) => match.replace(p1, '0')
  },
  {
    pattern: /emptyWeight\s*[:=]\s*(\d+)/g,
    replacement: (match, p1) => match.replace(p1, '0')
  },
  {
    pattern: /passengerWeight\s*[:=]\s*(\d+)/g,
    replacement: (match, p1) => match.replace(p1, '0')
  },
  {
    pattern: /reserveFuel\s*[:=]\s*(\d+)/g,
    replacement: (match, p1) => match.replace(p1, '0')
  }
];

// Function to modify a file
function modifyFile(filePath) {
  console.log(`Modifying file: ${filePath}`);
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const fileName = path.basename(filePath);
    let modificationCount = 0;
    
    // Apply each replacement pattern
    replacements.forEach(({ pattern, replacement }) => {
      // Create a backup of the file before making changes
      const backupPath = `${filePath}.safety-backup`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, originalContent);
        console.log(`Created backup at: ${backupPath}`);
      }
      
      // Apply the replacement
      const updatedContent = content.replace(pattern, (match, p1) => {
        const result = replacement(match, p1);
        if (match !== result) {
          modificationCount++;
          console.log(`  Modified: ${match} -> ${result}`);
        }
        return result;
      });
      
      // Update the content for the next replacement
      content = updatedContent;
    });
    
    // Write the modified content back to the file
    if (modificationCount > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Made ${modificationCount} replacements in ${fileName}`);
    } else {
      console.log(`  ⚠️ No modifications made in ${fileName}`);
    }
    
    return modificationCount;
  } catch (error) {
    console.error(`Error modifying file ${filePath}: ${error.message}`);
    return 0;
  }
}

// Main function
function main() {
  console.log('=== Zeroing Out Fuel and Performance Values ===');
  console.log('This script replaces hard-coded values with zeros for safety reasons.');
  console.log('================================================\n');
  
  let totalModifications = 0;
  
  filesToModify.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const fileModifications = modifyFile(filePath);
      totalModifications += fileModifications;
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  });
  
  console.log('\n=== Modifications Complete ===');
  console.log(`Made a total of ${totalModifications} replacements.`);
  console.log('\nIMPORTANT: This script creates backups of modified files.');
  console.log('To restore originals, run: node scripts/restore-backups.cjs');
}

// Run the main function
main();
