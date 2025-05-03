/**
 * Fast Planner Component Navigator
 * 
 * This script helps identify and navigate between corresponding components
 * in the original and refactored versions of the Fast Planner.
 * 
 * Instructions:
 * 1. Run with: node src/componentNavigator.js [command]
 * 
 * Commands:
 *   - report: Generate a text report of component status
 *   - html: Generate an HTML report and open it in browser
 *   - [component-name]: Show details about a specific component
 *   - search [term]: Find functions containing the search term
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current file & directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ORIGINAL_COMPONENT = path.join(PROJECT_ROOT, 'src/components/fast-planner/ModularFastPlannerComponent.jsx');
const REFACTORED_APP = path.join(PROJECT_ROOT, 'src/components/fast-planner/FastPlannerApp.jsx');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'src/components/fast-planner/components');
const HTML_REPORT_PATH = path.join(PROJECT_ROOT, 'docs/component-report.html');

const COMPONENT_MAP = {
  'leftpanel': {
    original: { file: ORIGINAL_COMPONENT, startPattern: '<LeftPanel', endPattern: '/>' },
    refactored: { file: path.join(COMPONENTS_DIR, 'panels/LeftPanel.jsx') },
    description: 'Displays and manages the route waypoints/stops list, including drag-and-drop reordering and waypoint editing.'
  },
  'rightpanel': {
    original: { file: ORIGINAL_COMPONENT, startPattern: '<RightPanel', endPattern: '/>' },
    refactored: { file: path.join(COMPONENTS_DIR, 'panels/RightPanel.jsx') },
    description: 'Contains controls for region selection, aircraft selection, and flight settings.'
  },
  'routestats': {
    original: { file: ORIGINAL_COMPONENT, startPattern: '<RouteStatsCard', endPattern: '/>' },
    refactored: { file: path.join(COMPONENTS_DIR, 'flight/RouteStatsCard.jsx') },
    description: 'Displays route statistics including distance, fuel requirements, and flight duration.'
  },
  'mapcomponent': {
    original: { file: ORIGINAL_COMPONENT, startPattern: '<MapComponent', endPattern: '/>' },
    refactored: { file: path.join(COMPONENTS_DIR, 'map/MapComponent.jsx') },
    description: 'Renders the interactive map using MapLibre GL JS with layers for platforms, routes, and waypoints.'
  },
  'flightsettings': {
    original: { file: ORIGINAL_COMPONENT, startPattern: '<FlightSettings', endPattern: '/>' },
    refactored: { file: path.join(COMPONENTS_DIR, 'flight/FlightSettings.jsx') },
    description: 'Provides controls for configuring flight parameters like passenger weight, fuel settings, and deck time.'
  },
  'aircraftselection': {
    original: { file: ORIGINAL_COMPONENT, startPattern: 'const renderAircraftSelection', endPattern: 'return (' },
    refactored: { file: path.join(COMPONENTS_DIR, 'aircraft/AircraftSelection.jsx') },
    description: 'Allows filtering and selection of aircraft by type and registration. Next component to be refactored.'
  },
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
        endLine = i + 1; // Include the end pattern line
        break;
      }
    }

    return { startLine, endLine: endLine !== -1 ? endLine : lines.length };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { startLine: -1, endLine: -1 };
  }
}

// Format component name for display
function formatComponentName(name) {
  return name
    .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
}

// Find related functions and handlers for a component
function findRelatedFunctions(componentName) {
  const content = fs.readFileSync(ORIGINAL_COMPONENT, 'utf8');
  const lines = content.split('\n');
  const results = [];
  
  // Common prefixes for component-related functions
  const prefixes = [
    `handle${componentName}`,
    `toggle${componentName}`,
    `update${componentName}`,
    `${componentName.toLowerCase()}`,
    `on${componentName}`
  ];
  
  // Create regex pattern
  const pattern = new RegExp(`(const|function)\\s+(${prefixes.join('|')})\\w*\\s*=`, 'i');
  
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      const line = lines[i].trim();
      const start = Math.max(0, i - 1);
      const context = lines.slice(start, start + 3).join('\n');
      results.push({ line: i + 1, content: line, context });
    }
  }
  
  return results;
}

// Find the original component implementation
function findOriginalComponentImplementation(componentName) {
  // Default case checks for the component tag in the render method
  let { startPattern, endPattern } = COMPONENT_MAP[componentName.toLowerCase()].original;
  
  // Ensure pattern and endPattern are defined
  startPattern = startPattern || `<${formatComponentName(componentName).replace(/\s/g, '')}`;
  endPattern = endPattern || `/>`;
  
  const { startLine, endLine } = findPatternLineNumbers(ORIGINAL_COMPONENT, startPattern, endPattern);
  
  if (startLine === -1) {
    // If not found, try alternate patterns
    const alternatePrefixes = [
      `render${formatComponentName(componentName).replace(/\s/g, '')}`,
      `${componentName.toLowerCase()}`,
    ];
    
    for (const prefix of alternatePrefixes) {
      const { startLine: altStartLine, endLine: altEndLine } = 
        findPatternLineNumbers(ORIGINAL_COMPONENT, prefix);
      
      if (altStartLine !== -1) {
        return { startLine: altStartLine, endLine: altEndLine };
      }
    }
    
    // Last resort: Try to find related prop definitions
    const propPattern = `${componentName.toLowerCase()}Props`;
    const { startLine: propStartLine } = 
      findPatternLineNumbers(ORIGINAL_COMPONENT, propPattern);
    
    if (propStartLine !== -1) {
      return { startLine: propStartLine, endLine: propStartLine + 10 }; // Just show a few lines
    }
  }
  
  return { startLine, endLine };
}

// Find and display info about a component
function findComponent(componentName) {
  const normalizedName = componentName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const component = COMPONENT_MAP[normalizedName];
  
  if (!component) {
    console.log(`Component "${componentName}" not found in the mapping.`);
    console.log('Available components:');
    Object.keys(COMPONENT_MAP).forEach(key => {
      const displayName = formatComponentName(key);
      console.log(`- ${displayName}`);
    });
    return;
  }

  const displayName = formatComponentName(normalizedName);
  console.log(`\n=== Component: ${displayName} ===\n`);

  // Original component info
  if (component.original) {
    console.log('ORIGINAL VERSION:');
    console.log(`File: ${path.relative(PROJECT_ROOT, ORIGINAL_COMPONENT)}`);
    
    // Find the component in the original file
    const { startLine, endLine } = findOriginalComponentImplementation(normalizedName);
    
    if (startLine !== -1) {
      console.log(`Location: Lines ${startLine} to ${endLine}`);
      console.log(`Open in VSCode: code -g ${ORIGINAL_COMPONENT}:${startLine}`);
      
      // Show a snippet
      const content = fs.readFileSync(ORIGINAL_COMPONENT, 'utf8').split('\n');
      const snippetStart = Math.max(0, startLine - 1);
      const snippetEnd = Math.min(content.length, startLine + 9); // Show up to 10 lines
      const snippet = content.slice(snippetStart, snippetEnd).join('\n');
      
      console.log('\nSnippet:');
      console.log('```');
      console.log(snippet);
      console.log('```');
      
      // Find related functions
      const relatedFunctions = findRelatedFunctions(displayName.replace(/\s/g, ''));
      if (relatedFunctions.length > 0) {
        console.log('\nRelated Handler Functions:');
        relatedFunctions.forEach((func, index) => {
          console.log(`${index + 1}. Line ${func.line}: ${func.content}`);
        });
      }
    } else {
      console.log(`Component not found in original file.`);
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
function generateComponentReport(returnData = false) {
  if (!returnData) {
    console.log('\n=== Fast Planner Component Report ===\n');
  }
  
  let totalOriginalLines = 0;
  let totalRefactoredLines = 0;
  const componentData = [];
  
  // Get original file total lines
  const originalContent = fs.readFileSync(ORIGINAL_COMPONENT, 'utf8');
  const originalLines = originalContent.split('\n').length;
  
  if (!returnData) {
    console.log(`Original component: ${originalLines} lines`);
    console.log('\nComponent Status:');
    console.log('-----------------');
  }
  
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
    
    const displayName = formatComponentName(componentName);
    
    if (!returnData) {
      console.log(`${displayName.padEnd(20)}: ${status.padEnd(15)} ${refactoredLines} lines`);
    }
    
    componentData.push({
      name: displayName,
      normalizedName: componentName,
      status,
      lines: refactoredLines,
      description: component.description || ''
    });
  });
  
  // Refactored app lines
  const refactoredAppContent = fs.readFileSync(REFACTORED_APP, 'utf8');
  const refactoredAppLines = refactoredAppContent.split('\n').length;
  totalRefactoredLines += refactoredAppLines;
  
  const progressPercent = Math.min(100, (totalRefactoredLines / originalLines * 100).toFixed(1));
  
  if (!returnData) {
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Original ModularFastPlannerComponent: ${originalLines} lines`);
    console.log(`Refactored FastPlannerApp: ${refactoredAppLines} lines`);
    console.log(`Total refactored code: ${totalRefactoredLines} lines`);
    console.log(`Refactoring ratio: ${(totalRefactoredLines / originalLines * 100).toFixed(1)}%`);
    console.log(`Estimated refactoring progress: ${progressPercent}%`);
  }
  
  if (returnData) {
    return {
      originalLines,
      refactoredAppLines,
      totalRefactoredLines,
      components: componentData,
      ratio: (totalRefactoredLines / originalLines * 100).toFixed(1),
      progress: progressPercent
    };
  }
}

// Generate HTML report
function generateHtmlReport() {
  const reportData = generateComponentReport(true);
  const dateTime = new Date().toLocaleString();
  
  // Calculate color-coded progress percentages
  const getStatusColor = (status) => {
    if (status === 'Refactored') return '#4CAF50';
    return '#FF9800';
  };
  
  const getProgressColor = (percent) => {
    if (percent >= 70) return '#4CAF50';
    if (percent >= 40) return '#FFC107';
    return '#FF5722';
  };
  
  // Generate a current timestamp 
  const timeStamp = new Date().toLocaleString();
  
  // Create component progress graph data
  const completedComponents = reportData.components.filter(c => c.status === 'Refactored').length;
  const totalComponents = reportData.components.length;
  const componentProgressPercent = (completedComponents / totalComponents * 100).toFixed(1);
  
  // Generate HTML report
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
      background: ${getProgressColor(reportData.progress)};
      width: ${reportData.progress}%;
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
        #4CAF50 0% ${componentProgressPercent}%, 
        #f1f1f1 ${componentProgressPercent}% 100%
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
    <div class="timestamp">Last updated: ${timeStamp}</div>
    
    <div class="summary-cards">
      <div class="card">
        <h3>Original Code</h3>
        <div class="value">${reportData.originalLines}</div>
        <div>lines of code</div>
      </div>
      <div class="card">
        <h3>Refactored Code</h3>
        <div class="value">${reportData.totalRefactoredLines}</div>
        <div>lines of code</div>
      </div>
      <div class="card">
        <h3>Code Ratio</h3>
        <div class="value">${reportData.ratio}%</div>
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
        <div class="progress-fill">${reportData.progress}%</div>
      </div>
      <div>Based on total lines of code refactored compared to original.</div>
    </div>
    
    <div class="chart-container">
      <div class="chart">
        <h3>Component Completion</h3>
        <div class="pie-chart">
          <div class="pie-center">${componentProgressPercent}%</div>
        </div>
        <div class="refactoring-status">
          ${completedComponents} of ${totalComponents} components refactored
        </div>
      </div>
      
      <div class="chart">
        <h3>Code Structure</h3>
        <div class="code-block">
ModularFastPlannerComponent.jsx: ${reportData.originalLines} lines
FastPlannerApp.jsx: ${reportData.refactoredAppLines} lines
${reportData.components
  .filter(c => c.status === 'Refactored')
  .map(c => `${c.name}.jsx: ${c.lines} lines`)
  .join('\n')}
        </div>
      </div>
    </div>
    
    <div class="next-steps">
      <h3>Next Steps in Refactoring</h3>
      <ul>
        <li><strong>Aircraft Selection Component</strong>: Extract from RightPanel.jsx</li>
        <li><strong>WaypointEditor Component</strong>: Extract from LeftPanel.jsx</li>
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
        ${reportData.components.map(component => `
        <tr>
          <td><a href="javascript:void(0)" onclick="alert('Run: node src/componentNavigator.js ${component.normalizedName}\\nto see detailed information about this component')">${component.name}</a></td>
          <td><span class="status" style="background-color: ${getStatusColor(component.status)}; color: white;">${component.status}</span></td>
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

  fs.writeFileSync(HTML_REPORT_PATH, html);
  console.log(`HTML report generated at ${path.relative(PROJECT_ROOT, HTML_REPORT_PATH)}`);
  
  // Try to open the HTML file in the default browser
  try {
    let openCommand;
    
    if (process.platform === 'darwin') {  // macOS
      openCommand = `open "${HTML_REPORT_PATH}"`;
    } else if (process.platform === 'win32') {  // Windows
      openCommand = `start "" "${HTML_REPORT_PATH}"`;
    } else {  // Linux and others
      openCommand = `xdg-open "${HTML_REPORT_PATH}"`;
    }
    
    execSync(openCommand);
    console.log('Opened report in default browser');
  } catch (error) {
    console.log(`Could not automatically open the report in a browser. Please open it manually.`);
  }
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

// Show usage help
function showHelp() {
  console.log(`
Fast Planner Component Navigator

Usage:
  node src/componentNavigator.js [command]

Commands:
  report              - Generate a text report of component status
  html                - Generate an HTML report and open it in browser
  [component-name]    - Show details about a specific component
  search [term]       - Find functions containing the search term
  help                - Show this help message

Examples:
  node src/componentNavigator.js report
  node src/componentNavigator.js html
  node src/componentNavigator.js leftPanel
  node src/componentNavigator.js search waypoint
  `);
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    generateComponentReport();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  if (command === 'search' && args[1]) {
    findFunctionsInOriginal(args[1]);
  } else if (command === 'report') {
    generateComponentReport();
  } else if (command === 'html') {
    generateHtmlReport();
  } else if (command === 'help') {
    showHelp();
  } else {
    findComponent(command);
  }
}

// Run the program
main();