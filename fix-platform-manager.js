/**
 * Fix Platform Manager Errors
 * 
 * This script will add safety checks around calls to platformManagerRef.current.loadPlatformsFromFoundry
 * to prevent "Cannot read properties of null" errors.
 */

const fs = require('fs');
const path = require('path');

// Path to the file containing the error
const filePath = path.join(__dirname, 'src', 'components', 'fast-planner', 'ModularFastPlannerComponent.jsx');

// Read the file
let fileContent = fs.readFileSync(filePath, 'utf8');

// Find and replace the problematic section - Line ~2150
const problematicSection = /const platforms = await platformManagerRef\.current\.loadPlatformsFromFoundry\(client, region\.osdkRegion\);/g;
const safetyCheck = `// Add safety check to prevent null reference errors
            if (platformManagerRef.current && platformManagerRef.current.loadPlatformsFromFoundry) {
              const platforms = await platformManagerRef.current.loadPlatformsFromFoundry(client, region.osdkRegion);`;

// Replace all occurrences
fileContent = fileContent.replace(problematicSection, safetyCheck);

// Fix any unclosed if statements by finding places where platforms is accessed after the call
const platformsAccessPattern = /console\.log\(`Successfully loaded \${platforms\.length} platforms/g;
const safeAccessCheck = `console.log(\`Successfully loaded \${platforms?.length || 0} platforms`;

fileContent = fileContent.replace(platformsAccessPattern, safeAccessCheck);

// Find all instances of setPlatformsLoaded and add safety checks
const platformsVisibilityPattern = /setPlatformsLoaded\(true\);\s+setPlatformsVisible\(true\);/g;
const safeVisibilityCode = `setPlatformsLoaded(true);\n              setPlatformsVisible(true);
            } else {
              console.error("Platform manager not initialized or loadPlatformsFromFoundry method not available");
              setPlatformsLoaded(false);
              setRigsLoading(false);
              setRigsError("Cannot load platforms: manager not initialized");
            }`;

fileContent = fileContent.replace(platformsVisibilityPattern, safeVisibilityCode);

// Write the changes back to the file
fs.writeFileSync(filePath, fileContent, 'utf8');

console.log('Fixed platform manager error checks in ModularFastPlannerComponent.jsx');
