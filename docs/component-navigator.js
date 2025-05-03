/**
 * Fast Planner Component Navigator
 * 
 * This script helps identify and navigate between corresponding components
 * in the original and refactored versions of the Fast Planner.
 * 
 * Instructions:
 * 1. Save this file as src/componentNavigator.js
 * 2. Run with: node src/componentNavigator.js [component-name]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ORIGINAL_COMPONENT = path.join(PROJECT_ROOT, 'src/components/fast-planner/ModularFastPlannerComponent.jsx');
const REFACTORED_APP = path.join(PROJECT_ROOT, 'src/components/fast-planner/FastPlannerApp.jsx');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'src/components/fast-planner/components');

const COMPONENT_MAP = {
  // Map of component names to their locations in both original and refactored versions
  'leftPanel': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderLeftPanel', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'panels/LeftPanel.jsx') }
  },
  'rightPanel': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderRightPanel', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'panels/RightPanel.jsx') }
  },
  'routeStats': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderRouteStats', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'flight/RouteStatsCard.jsx') }
  },
  'mapComponent': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderMap', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'map/MapComponent.jsx') }
  },
  // Add more component mappings as needed
};

// Helper function to get line numbers for a pattern in a file
function findPatternLineNumbers(filePath, startPattern, endPattern = null) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let startLine = -1;
    let endLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (startLine === -1 && lines[i].includes(startPattern)) {
        startLine = i + 1;
      } else if (startLine !== -1 && endPattern && lines[i].includes(endPattern)) {
        endLine = i;
        break;
      }
    }

    return { startLine, endLine: endLine !== -1 ? endLine : lines.length };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { startLine: -1, endLine: -1 };
  }
}

// Find and display info about a component
function findComponent(componentName) {
  const component = COMPONENT_MAP[componentName.toLowerCase()];
  if (!component) {
    console.log(`Component "${componentName}" not found in the mapping.`);
    console.log('Available components:');
    Object.keys(COMPONENT_MAP).forEach(key => console.log(`- ${key}`));
    return;
  }

  console.log(`\n=== Component: ${componentName} ===\n`);

  // Original component info
  if (component.original) {
    const { file, startPattern, endPattern } = component.original;
    console.log('ORIGINAL VERSION:');
    console.log(`File: ${path.relative(PROJECT_ROOT, file)}`);
    
    if (startPattern) {
      const { startLine, endLine } = findPatternLineNumbers(file, startPattern, endPattern);
      console.log(`Location: Lines ${startLine} to ${endLine}`);
      console.log(`Open in VSCode: code -g ${file}:${startLine}`);
      
      // Show a snippet
      const content = fs.readFileSync(file, 'utf8').split('\n').slice(startLine - 1, startLine + 5).join('\n');
      console.log('\nSnippet:');
      console.log('```');
      console.log(content);
      console.log('```');
    }
  }

  console.log('\n---\n');

  // Refactored component info
  if (component.refactored) {
    const { file } = component.refactored;
    console.log('REFACTORED VERSION:');
    console.log(`File: ${path.relative(PROJECT_ROOT, file)}`);
    
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      console.log(`Lines: ${lines.length}`);
      console.log(`Open in VSCode: code -g ${file}:1`);
      
      // Show a snippet
      const snippet = lines.slice(0, Math.min(lines.length, 6)).join('\n');
      console.log('\nSnippet:');
      console.log('```');
      console.log(snippet);
      console.log('```');
    } else {
      console.log(`File does not exist yet. This component needs to be refactored.`);
      console.log(`Suggested location: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }
}

// Generate report of all components
function generateComponentReport() {
  console.log('\n=== Fast Planner Component Report ===\n');
  
  let totalOriginalLines = 0;
  let totalRefactoredLines = 0;
  
  // Get original file total lines
  const originalContent = fs.readFileSync(ORIGINAL_COMPONENT, 'utf8');
  const originalLines = originalContent.split('\n').length;
  console.log(`Original component: ${originalLines} lines`);
  
  console.log('\nComponent Status:');
  console.log('-----------------');
  
  // Check each component
  Object.keys(COMPONENT_MAP).forEach(componentName => {
    const component = COMPONENT_MAP[componentName];
    let status = 'Not Started';
    let refactoredLines = 0;
    
    if (component.refactored && fs.existsSync(component.refactored.file)) {
      const content = fs.readFileSync(component.refactored.file, 'utf8');
      refactoredLines = content.split('\n').length;
      totalRefactoredLines += refactoredLines;
      status = 'Refactored';
    }
    
    console.log(`${componentName.padEnd(15)}: ${status.padEnd(15)} ${refactoredLines} lines`);
  });
  
  // Refactored app lines
  const refactoredAppContent = fs.readFileSync(REFACTORED_APP, 'utf8');
  const refactoredAppLines = refactoredAppContent.split('\n').length;
  totalRefactoredLines += refactoredAppLines;
  
  console.log('\nSummary:');
  console.log('--------');
  console.log(`Original ModularFastPlannerComponent: ${originalLines} lines`);
  console.log(`Refactored FastPlannerApp: ${refactoredAppLines} lines`);
  console.log(`Total refactored code: ${totalRefactoredLines} lines`);
  console.log(`Refactoring ratio: ${(totalRefactoredLines / originalLines * 100).toFixed(1)}%`);
  console.log(`Estimated refactoring progress: ${Math.min(100, (totalRefactoredLines / originalLines * 100).toFixed(1))}%`);
}

// Find functions in the original component
function findFunctionsInOriginal(searchTerm) {
  try {
    const content = fs.readFileSync(ORIGINAL_COMPONENT, 'utf8');
    const lines = content.split('\n');
    const functionPattern = new RegExp(`(const|function)\\s+\\w*${searchTerm}\\w*\\s*=?\\s*\\(`);
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (functionPattern.test(lines[i])) {
        const line = lines[i].trim();
        const start = Math.max(0, i - 1);
        const context = lines.slice(start, start + 3).join('\n');
        results.push({ line: i + 1, content: line, context });
      }
    }
    
    if (results.length === 0) {
      console.log(`No functions containing "${searchTerm}" found.`);
      return;
    }
    
    console.log(`\n=== Functions containing "${searchTerm}" ===\n`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. Line ${result.line}: ${result.content}`);
      console.log(`   Context:\n${result.context}\n`);
    });
    
    console.log(`Open in VSCode: code -g ${ORIGINAL_COMPONENT}:${results[0].line}`);
  } catch (error) {
    console.error('Error searching for functions:', error);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    generateComponentReport();
    return;
  }
  
  const command = args[0];
  
  if (command === 'search' && args[1]) {
    findFunctionsInOriginal(args[1]);
  } else if (command === 'report') {
    generateComponentReport();
  } else {
    findComponent(command);
  }
}

// Run the program
main();