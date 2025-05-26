const fs = require('fs');
const path = require('path');

// Path to the FastPlannerApp.jsx file
const filePath = path.join(__dirname, '../../FastPlannerApp.jsx');

// First, make a backup
const backupPath = path.join(__dirname, '../../FastPlannerApp.jsx.import-fix-backup');
try {
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup created at ${backupPath}`);
} catch (error) {
  console.error('Error creating backup:', error);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find the problematic imports in the middle of the file and extract them
const importRegex = /\/\/ Import waypoint functionality fixes[\s\S]*?import '\.\/fixes\/WaypointDebugger\.js';/;
const matches = content.match(importRegex);

if (!matches) {
  console.error('Could not find the problematic imports. Please check the file manually.');
  process.exit(1);
}

// Extract the imports
const importStatements = matches[0];

// Remove the imports from their current location
content = content.replace(importRegex, '');

// Add the imports to the top of the file, right after the last import statement
// Find the position of the last import statement
const lastImportIndex = content.lastIndexOf("import");
if (lastImportIndex === -1) {
  console.error("Could not find any import statements in the file.");
  process.exit(1);
}

// Find the end of the line containing the last import
const endOfLastImport = content.indexOf(";", lastImportIndex) + 1;
if (endOfLastImport === 0) {
  console.error("Could not find the end of the last import statement.");
  process.exit(1);
}

// Insert the extracted imports after the last import
const newContent = 
  content.substring(0, endOfLastImport) + 
  "\n\n" + 
  importStatements + 
  "\n" + 
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
