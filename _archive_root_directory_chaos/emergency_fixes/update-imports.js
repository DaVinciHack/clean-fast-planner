/**
 * update-imports.js
 * 
 * This script is a fallback method to update imports in FastPlannerApp.jsx
 * Run with: node update-imports.js
 */

const fs = require('fs');
const path = require('path');

// Path to FastPlannerApp.jsx
const fastPlannerAppPath = path.join(__dirname, 'src', 'components', 'fast-planner', 'FastPlannerApp.jsx');

// Read the file
try {
  console.log(`Reading file: ${fastPlannerAppPath}`);
  const content = fs.readFileSync(fastPlannerAppPath, 'utf8');
  
  // Create a backup
  const backupPath = `${fastPlannerAppPath}.backup-${Date.now()}`;
  fs.writeFileSync(backupPath, content);
  console.log(`Backup created at: ${backupPath}`);
  
  // Replace the imports
  const importRegex = /\/\/ Import waypoint functionality fixes[\s\S]*?import '\.\/fixes\/WaypointDebugger\.js';/;
  
  const newImports = `// Import waypoint functionality fixes (NO STYLE CHANGES)
import './fixes/fix-waypoint-functionality.js';
import './fixes/fix-route-drag.js';
import './fixes/WaypointDebugger.js';`;
  
  // Check if the fix imports already exist
  const fixImportsExist = content.includes("import './fixes/fix-waypoint-vs-stop-type.js';");
  
  let updatedContent;
  if (fixImportsExist) {
    console.log('Fix imports already exist, removing duplicates...');
    
    // Remove duplicate imports
    const importRegex = /import '\.\/fixes\/fix-stop-cards\.js';(\s*import '\.\/fixes\/fix-stop-cards\.js';)/g;
    updatedContent = content.replace(importRegex, "import './fixes/fix-stop-cards.js';");
  } else {
    console.log('Adding fix imports...');
    
    // Add new imports
    const fullImports = `// Import waypoint functionality fixes (NO STYLE CHANGES)
import './fixes/fix-waypoint-functionality.js';
import './fixes/fix-route-drag.js';
import './fixes/WaypointDebugger.js';
// Import new waypoint vs. landing stop distinction fixes
import './fixes/fix-waypoint-vs-stop-type.js';
import './fixes/fix-stop-cards.js';
// Import module ready monitor to ensure fixes are applied properly
import './fixes/fix-modules-ready.js';
// Import active waypoint monitor for debugging
import './fixes/active-waypoint-monitor.js';`;
    
    updatedContent = content.replace(importRegex, fullImports);
  }
  
  // Write the updated content
  fs.writeFileSync(fastPlannerAppPath, updatedContent);
  console.log('Successfully updated imports in FastPlannerApp.jsx');
  
} catch (error) {
  console.error('Error updating imports:', error);
}
