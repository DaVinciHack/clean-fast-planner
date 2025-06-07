/**
 * This script extracts the actual function code from stopCardsDataFix.js
 * and saves it to a clean file for application
 */

const fs = require('fs');

const sourcePath = '/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/stopCardsDataFix.js';
const outputPath = '/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/clean-function.js';

try {
  // Read the source file
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  
  // Find the start of the actual function code
  const functionStart = sourceContent.indexOf('const generateStopCardsData');
  if (functionStart === -1) {
    console.error('Function definition not found in stopCardsDataFix.js');
    process.exit(1);
  }
  
  // Extract just the function code
  const functionCode = sourceContent.substring(functionStart);
  
  // Write the clean function to a new file
  fs.writeFileSync(outputPath, functionCode);
  
  console.log(`Successfully extracted clean function code to ${outputPath}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
