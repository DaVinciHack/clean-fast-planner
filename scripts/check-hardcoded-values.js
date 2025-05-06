/**
 * Script to check for potentially dangerous hard-coded values
 * in the flight calculation code that could affect safety.
 */

const fs = require('fs');
const path = require('path');

// Define patterns to look for
const dangerousPatterns = [
  {
    pattern: /const\s+(\w+)\s*=\s*(\d+)\s*;\s*\/\/\s*(fuel|weight|speed|distance|altitude|time)/gi,
    description: 'Hard-coded values related to fuel, weight, speed, distance, altitude, or time'
  },
  { 
    pattern: /var\s+(\w+)\s*=\s*(\d+)\s*;\s*\/\/\s*(fuel|weight|speed|distance|altitude|time)/gi,
    description: 'Hard-coded variables related to fuel, weight, speed, distance, altitude, or time'
  },
  {
    pattern: /let\s+(\w+)\s*=\s*(\d+)\s*;\s*\/\/\s*(fuel|weight|speed|distance|altitude|time)/gi,
    description: 'Hard-coded let variables related to fuel, weight, speed, distance, altitude, or time'
  },
  {
    pattern: /return\s+(\d+)\s*;\s*\/\/\s*(fuel|weight|speed|distance|altitude|time)/gi,
    description: 'Hard-coded return values related to fuel, weight, speed, distance, altitude, or time'
  },
  {
    pattern: /defaultValue: (\d+)/gi,
    description: 'Hard-coded default values'
  },
  {
    pattern: /fuelBurn\s*[:=]\s*(\d+)/gi,
    description: 'Hard-coded fuel burn values'
  },
  {
    pattern: /cruiseSpeed\s*[:=]\s*(\d+)/gi,
    description: 'Hard-coded cruise speed values'
  },
  {
    pattern: /maxTakeoffWeight\s*[:=]\s*(\d+)/gi,
    description: 'Hard-coded max takeoff weight values'
  },
  {
    pattern: /emptyWeight\s*[:=]\s*(\d+)/gi,
    description: 'Hard-coded empty weight values'
  },
  {
    pattern: /passengerWeight\s*[:=]\s*(\d+)/gi,
    description: 'Hard-coded passenger weight values'
  },
  {
    pattern: /reserveFuel\s*[:=]\s*(\d+)/gi,
    description: 'Hard-coded reserve fuel values'
  }
];

// Files to check (focus on calculation modules)
const filesToCheck = [
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'calculations', 'FlightCalculations.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'calculations', 'WindCalculations.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'RouteCalculator.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'modules', 'AircraftManager.js'),
  path.join(__dirname, '..', 'src', 'components', 'fast-planner', 'FastPlannerApp.jsx')
];

// Function to check a file for hard-coded values
function checkFile(filePath) {
  console.log(`Checking file: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    let hasIssues = false;
    
    // Check for each pattern
    dangerousPatterns.forEach(({ pattern, description }) => {
      // Reset the regex lastIndex
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Get the line number
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        // Get the full line for context
        const lines = content.split('\n');
        const line = lines[lineNumber - 1];
        
        // Only report if not in a comment or UI element
        // Skip if the line has "// UI" or "// Safe" or is in a JSX component
        const isUIElement = line.includes('// UI') || 
                           line.includes('className=') ||
                           line.includes('<div') || 
                           line.includes('<span') ||
                           line.includes('<p');
        
        const isSafeValue = line.includes('// Safe') || 
                           line.includes('// Default') ||
                           line.includes('// Initial');
        
        const isConfigSetting = line.includes('flightSettings') ||
                              line.includes('appSettingsManager') ||
                              line.includes('config.');
        
        if (!isUIElement && !isSafeValue && !isConfigSetting) {
          console.log(`\n${fileName}:${lineNumber}: ${description}`);
          console.log(`  ${line.trim()}`);
          hasIssues = true;
        }
      }
    });
    
    if (!hasIssues) {
      console.log(`  ✅ No dangerous hard-coded values found.`);
    }
    
    return hasIssues;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Checking for Hard-Coded Values ===');
  console.log('This script checks for dangerous hard-coded values in flight calculation code.');
  console.log('================================\n');
  
  let hasIssues = false;
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const fileHasIssues = checkFile(filePath);
      hasIssues = hasIssues || fileHasIssues;
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  });
  
  console.log('\n=== Scan Complete ===');
  if (hasIssues) {
    console.log('⚠️ Potential dangerous hard-coded values found.');
    console.log('   Please review the code to ensure all values are properly sourced from configuration or data.');
  } else {
    console.log('✅ No dangerous hard-coded values detected.');
    console.log('   The application appears to be using proper configuration and data sources for calculations.');
  }
}

// Run the main function
main();
