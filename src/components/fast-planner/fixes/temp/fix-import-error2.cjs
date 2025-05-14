const fs = require('fs');
const path = require('path');

// Path to the FastPlannerApp.jsx file
const filePath = path.join(__dirname, '../../FastPlannerApp.jsx');

// First, make a backup
const backupPath = path.join(__dirname, '../../FastPlannerApp.jsx.import-fix-backup2');
try {
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup created at ${backupPath}`);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Check if there are still problematic imports in the file
const importRegex = /\/\/ Import waypoint functionality fixes[\s\S]*?import '\.\/fixes\/WaypointDebugger\.js';/;
const match = content.match(importRegex);

if (!match) {
  console.log("No problematic imports found in the file.");
  process.exit(0);
}

// Find the problematic imports section
console.log("Found problematic imports in the file.");

// Remove the imports from their current location (line 1095-1099)
content = content.replace(importRegex, '');

// Find the position of the last import statement at the top of the file
const lastImportPos = content.indexOf("import FlightCalculations from './modules/calculations/FlightCalculations'");
const endOfLastImport = content.indexOf(";", lastImportPos) + 1;

// Add the imports at the top level, right after the last import
const importsToAdd = `
// Import waypoint functionality fixes (NO STYLE CHANGES)
import './fixes/fix-waypoint-functionality.js';
import './fixes/fix-route-drag.js';
import './fixes/WaypointDebugger.js';
`;

const newContent = 
  content.substring(0, endOfLastImport) + 
  importsToAdd + 
  content.substring(endOfLastImport);

// Write the modified content back to the file
try {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully fixed import statements in FastPlannerApp.jsx');
} catch (error) {
  console.error('Error writing to file:', error);
  fs.copyFileSync(backupPath, filePath); // Restore backup on error
  console.log('Restored backup due to error.');
  process.exit(1);
}
