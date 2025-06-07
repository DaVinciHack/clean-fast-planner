/**
 * This script fixes the syntax error in FastPlannerApp.jsx
 * by ensuring the export default is properly preserved at the end of the file
 */

const fs = require('fs');

// Create proper path for file operations
const filePath = '/Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx';
const backupPath = `${filePath}.syntax-fix-backup`;

try {
  // Create a backup first
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at ${backupPath}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the export statement exists at the end
  if (!content.includes('export default FastPlannerApp;')) {
    console.error('Could not find export default statement');
    process.exit(1);
  }
  
  // Fix the file to ensure export is at the end
  const fixedContent = content.replace('export default FastPlannerApp;', '') + '\nexport default FastPlannerApp;\n';
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent);
  console.log('Successfully fixed the syntax error in FastPlannerApp.jsx');
  
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
