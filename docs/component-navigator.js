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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  'flightSettings': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderFlightSettings', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'flight/FlightSettings.jsx') }
  },
  'aircraftSelection': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderAircraftSelection', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'aircraft/AircraftSelection.jsx') }
  }
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
  
  // Generate HTML report
  generateHTMLReport(originalLines, refactoredAppLines, totalRefactoredLines);
}

// Generate HTML report
function generateHTMLReport(originalLines, refactoredAppLines, totalRefactoredLines) {
  // Count completed components
  let completedComponents = 0;
  let totalComponents = Object.keys(COMPONENT_MAP).length;
  
  Object.keys(COMPONENT_MAP).forEach(componentName => {
    const component = COMPONENT_MAP[componentName];
    if (component.refactored && fs.existsSync(component.refactored.file)) {
      completedComponents++;
    }
  });
  
  // Calculate percentages
  const refactoringRatio = (totalRefactoredLines / originalLines * 100).toFixed(1);
  const completionPercentage = (completedComponents / totalComponents * 100).toFixed(1);
  
  // Generate timestamp
  const timestamp = new Date().toLocaleString();
  
  // Collect component information for table
  const componentRows = Object.keys(COMPONENT_MAP).map(componentName => {
    const component = COMPONENT_MAP[componentName];
    let status = 'Not Started';
    let lines = 0;
    let description = '';
    
    // Default descriptions for components
    const descriptions = {
      'leftPanel': 'Displays and manages the route waypoints/stops list, including drag-and-drop reordering and waypoint editing.',
      'rightPanel': 'Contains controls for region selection, aircraft selection, and flight settings.',
      'routeStats': 'Displays route statistics including distance, fuel requirements, and flight duration.',
      'mapComponent': 'Renders the interactive map using MapLibre GL JS with layers for platforms, routes, and waypoints.',
      'flightSettings': 'Provides controls for configuring flight parameters like passenger weight, fuel settings, and deck time.',
      'aircraftSelection': 'Allows filtering and selection of aircraft by type and registration. Next component to be refactored.'
    };
    
    if (component.refactored && fs.existsSync(component.refactored.file)) {
      const content = fs.readFileSync(component.refactored.file, 'utf8');
      lines = content.split('\n').length;
      status = 'Refactored';
    }
    
    description = descriptions[componentName.toLowerCase()] || '';
    
    return {
      name: componentName.toLowerCase(),
      status,
      lines,
      description
    };
  });
  
  // Collect lines for each component for the code structure section
  let codeStructure = `ModularFastPlannerComponent.jsx: ${originalLines} lines\n`;
  codeStructure += `FastPlannerApp.jsx: ${refactoredAppLines} lines\n`;
  
  componentRows.forEach(component => {
    if (component.lines > 0) {
      codeStructure += `${component.name}.jsx: ${component.lines} lines\n`;
    }
  });
  
  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fast Planner Component Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .timestamp {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-left: 4px solid #3498db;
    }
    .card h3 {
      margin-top: 0;
      color: #3498db;
      font-size: 1em;
      font-weight: 600;
    }
    .card .value {
      font-size: 1.8em;
      font-weight: bold;
      margin: 10px 0;
      color: #2c3e50;
    }
    .progress-container {
      margin-bottom: 30px;
    }
    .progress-bar {
      height: 24px;
      background: #ecf0f1;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .progress-fill {
      height: 100%;
      background: #4CAF50;
      width: ${refactoringRatio}%;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 1s ease-in-out;
    }
    .components-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .components-table th, .components-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .components-table th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .components-table tr:hover {
      background-color: #f5f5f5;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 0.85em;
    }
    .chart-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .chart {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .chart h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }
    .pie-chart {
      position: relative;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: conic-gradient(
        #4CAF50 0% ${completionPercentage}%, 
        #f1f1f1 ${completionPercentage}% 100%
      );
      margin: 0 auto;
    }
    .pie-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2em;
    }
    .refactoring-status {
      margin-top: 20px;
      text-align: center;
    }
    .code-block {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      font-family: monospace;
      margin-bottom: 15px;
      overflow-x: auto;
    }
    .next-steps {
      background-color: #e8f4fd;
      border-left: 4px solid #3498db;
      padding: 15px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #3498db;
    }
    .next-steps ul {
      margin-bottom: 0;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media (max-width: 768px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }
      .chart-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Fast Planner Refactoring Dashboard</h1>
    <div class="timestamp">Last updated: ${timestamp}</div>
    
    <div class="summary-cards">
      <div class="card">
        <h3>Original Code</h3>
        <div class="value">${originalLines}</div>
        <div>lines of code</div>
      </div>
      <div class="card">
        <h3>Refactored Code</h3>
        <div class="value">${totalRefactoredLines}</div>
        <div>lines of code</div>
      </div>
      <div class="card">
        <h3>Code Ratio</h3>
        <div class="value">${refactoringRatio}%</div>
        <div>refactored / original</div>
      </div>
      <div class="card">
        <h3>Components Completed</h3>
        <div class="value">${completedComponents}/${totalComponents}</div>
        <div>components refactored</div>
      </div>
    </div>
    
    <div class="progress-container">
      <h2>Refactoring Progress</h2>
      <div class="progress-bar">
        <div class="progress-fill">${refactoringRatio}%</div>
      </div>
      <div>Based on total lines of code refactored compared to original.</div>
    </div>
    
    <div class="chart-container">
      <div class="chart">
        <h3>Component Completion</h3>
        <div class="pie-chart">
          <div class="pie-center">${completionPercentage}%</div>
        </div>
        <div class="refactoring-status">
          ${completedComponents} of ${totalComponents} components refactored
        </div>
      </div>
      
      <div class="chart">
        <h3>Code Structure</h3>
        <div class="code-block">
${codeStructure}
        </div>
      </div>
    </div>
    
    <div class="next-steps">
      <h3>Next Steps in Refactoring</h3>
      <ul>
        <li><strong>Aircraft Selection Component</strong>: Extract from RightPanel.jsx</li>
        <li><strong>WaypointEditor Component</strong>: Extract from LeftPanel.jsx</li>
        <li><strong>Add fuel consumption display</strong> to route line</li>
        <li><strong>Add passenger capacity information</strong> to route line</li>
        <li><strong>Add visual indicators</strong> to clearly show which version is being used</li>
      </ul>
    </div>
    
    <h2>Components Status</h2>
    <table class="components-table">
      <thead>
        <tr>
          <th>Component</th>
          <th>Status</th>
          <th>Lines</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${componentRows.map(component => `
        <tr>
          <td><a href="javascript:void(0)" onclick="alert('Run: node src/componentNavigator.js ${component.name}\\nto see detailed information about this component')">${component.name}</a></td>
          <td><span class="status" style="background-color: ${component.status === 'Refactored' ? '#4CAF50' : '#FF9800'}; color: white;">${component.status}</span></td>
          <td>${component.lines}</td>
          <td>${component.description}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>How to Use This Report</h2>
    <p>This dashboard provides a visual overview of the Fast Planner refactoring progress. For more detailed information:</p>
    <ul>
      <li>Run <code>node src/componentNavigator.js report</code> to see the text report</li>
      <li>Run <code>node src/componentNavigator.js componentName</code> to see details about a specific component</li>
      <li>Run <code>node src/componentNavigator.js search term</code> to find functions containing the search term</li>
      <li>Run <code>node src/componentNavigator.js html</code> to regenerate this HTML report</li>
    </ul>
    
    <p>See the <a href="application-map.md">Application Map</a> and <a href="knowledge-base.md">Knowledge Base</a> for more detailed documentation.</p>
  </div>
</body>
</html>`;

  // Write HTML to file
  const outputPath = path.join(PROJECT_ROOT, 'docs/component-report.html');
  fs.writeFileSync(outputPath, html);
  console.log(`\nHTML report generated at: ${outputPath}`);
  console.log(`View in browser: file://${outputPath}`);
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
  } else if (command === 'html') {
    // Just generate the HTML report
    const originalContent = fs.readFileSync(ORIGINAL_COMPONENT, 'utf8');
    const originalLines = originalContent.split('\n').length;
    const refactoredAppContent = fs.readFileSync(REFACTORED_APP, 'utf8');
    const refactoredAppLines = refactoredAppContent.split('\n').length;
    
    // Calculate total refactored lines
    let totalRefactoredLines = refactoredAppLines;
    Object.keys(COMPONENT_MAP).forEach(componentName => {
      const component = COMPONENT_MAP[componentName];
      if (component.refactored && fs.existsSync(component.refactored.file)) {
        const content = fs.readFileSync(component.refactored.file, 'utf8');
        totalRefactoredLines += content.split('\n').length;
      }
    });
    
    generateHTMLReport(originalLines, refactoredAppLines, totalRefactoredLines);
  } else {
    findComponent(command);
  }
}

// Run the program
main();