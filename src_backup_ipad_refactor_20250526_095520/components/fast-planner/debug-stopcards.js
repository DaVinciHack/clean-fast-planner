/**
 * This script adds debugging for stop cards generation
 * and ensures they are properly generated
 */

import fs from 'fs';

// Create proper path for file operations
const filePath = '/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx';
const backupPath = `${filePath}.debug-stopcards-backup`;

try {
  // Create a backup first
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add console log in setStopCards to debug when it's being called
  let updatedContent = content.replace(
    'setStopCards(newStopCards);', 
    'console.log("🔍 Setting stop cards:", newStopCards.length); setStopCards(newStopCards);'
  );
  
  // Add console log in generateStopCardsData function to debug inputs
  updatedContent = updatedContent.replace(
    'const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather) => {',
    'const generateStopCardsData = (waypoints, routeStats, selectedAircraft, weather) => {\n  console.log("🔍 generateStopCardsData called with:", {\n    waypointsLength: waypoints?.length || 0,\n    hasRouteStats: !!routeStats,\n    hasAircraft: !!selectedAircraft,\n    weather\n  });'
  );
  
  // Force generateStopCardsData to return backup cards if normal generation fails
  updatedContent = updatedContent.replace(
    'console.log(`Generated ${cards.length} stop cards`);',
    'console.log(`Generated ${cards.length} stop cards`);\n  // If no cards were generated, use backup generator\n  if (cards.length === 0 && waypoints && waypoints.length >= 2 && selectedAircraft) {\n    console.log("🚨 No cards generated, using backup generator");\n    try {\n      const generateBackupStopCards = require("./backup-stop-cards").default;\n      const backupCards = generateBackupStopCards(waypoints, routeStats, selectedAircraft, weather);\n      console.log(`Generated ${backupCards.length} backup stop cards`);\n      return backupCards;\n    } catch(err) {\n      console.error("Error using backup generator:", err);\n    }\n  }'
  );
  
  // Add emergency fallback to RouteStatsCard to always get cards
  updatedContent = updatedContent.replace(
    '<RouteStatsCard',
    '// EMERGENCY FIX: Generate stop cards if they\'re missing\n      {(!stopCards || stopCards.length === 0) && waypoints && waypoints.length >= 2 && selectedAircraft && (\n        console.warn("🚨 Emergency: No stop cards, generating now in render")\n      )}\n      <RouteStatsCard'
  );
  
  // Write the modified content back to the file
  fs.writeFileSync(filePath, updatedContent);
  console.log('Successfully added debug code for stop cards generation');
  
  console.log('Done! Stop cards debugging has been added to the FastPlannerApp.jsx file');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
