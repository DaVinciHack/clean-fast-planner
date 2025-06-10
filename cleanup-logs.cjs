#!/usr/bin/env node

/**
 * Script to clean up excessive console.log statements
 * Removes debugging logs while keeping essential error/warning logs
 */

const fs = require('fs');
const path = require('path');

const filesToClean = [
  'src/components/fast-planner/modules/PlatformManager.js',
  'src/components/fast-planner/FastPlannerApp.jsx',
  'src/components/fast-planner/modules/AircraftManager.js',
  'src/components/fast-planner/modules/WaypointManager.js',
  'src/components/fast-planner/modules/calculations/flight/StopCardCalculator.js',
  'src/components/fast-planner/hooks/useManagers.js',
  'src/components/fast-planner/components/panels/RightPanel.jsx',
  'src/components/fast-planner/hooks/useWaypoints.js',
  'src/components/fast-planner/context/AircraftContext.jsx',
  'src/components/fast-planner/modules/waypoints/WaypointModeHandler.js'
];

function cleanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let removedCount = 0;
  const cleanedLines = lines.filter((line, index) => {
    const trimmedLine = line.trim();
    
    // Keep essential logs (errors, warnings, important status)
    if (trimmedLine.includes('console.error') || 
        trimmedLine.includes('console.warn') || 
        trimmedLine.includes('console.info') ||
        trimmedLine.includes('// KEEP:') ||
        trimmedLine.includes('Essential:') ||
        trimmedLine.includes('CRITICAL:') ||
        trimmedLine.includes('ERROR:') ||
        trimmedLine.includes('WARNING:')) {
      return true;
    }
    
    // Remove debug console.log statements
    if (trimmedLine.includes('console.log') && 
        (trimmedLine.includes('DEBUG') || 
         trimmedLine.includes('debug') ||
         trimmedLine.includes('Processing') ||
         trimmedLine.includes('Found') ||
         trimmedLine.includes('Adding') ||
         trimmedLine.includes('Loading') ||
         trimmedLine.includes('Checking') ||
         trimmedLine.includes('Setting') ||
         trimmedLine.includes('Getting') ||
         trimmedLine.includes('Updating') ||
         trimmedLine.includes('forEach') ||
         trimmedLine.includes('map(') ||
         trimmedLine.includes('filter(') ||
         trimmedLine.includes('JSON.stringify') ||
         trimmedLine.includes('Sample') ||
         trimmedLine.includes('Region distribution') ||
         trimmedLine.includes('Query returned') ||
         trimmedLine.includes('State change') ||
         trimmedLine.includes('Hook') ||
         trimmedLine.includes('Effect') ||
         trimmedLine.includes('Render'))) {
      removedCount++;
      return false;
    }
    
    return true;
  });
  
  if (removedCount > 0) {
    const cleanedContent = cleanedLines.join('\n');
    fs.writeFileSync(filePath, cleanedContent);
    console.log(`✅ Cleaned ${filePath}: Removed ${removedCount} debug logs`);
  } else {
    console.log(`ℹ️  ${filePath}: No debug logs to remove`);
  }
}

console.log('🧹 Starting log cleanup...\n');

filesToClean.forEach(cleanFile);

console.log('\n✅ Log cleanup complete!');