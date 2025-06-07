// apply-input-fix.js
// Script to apply the input fix

// Create directory if it doesn't exist
const fs = require('fs');
const path = require('path');

// Ensure the fixes directory exists
const fixesDir = path.join(__dirname, 'fixes');
if (!fs.existsSync(fixesDir)) {
  fs.mkdirSync(fixesDir);
  console.log('Created fixes directory');
}

// Copy input fix files
const inputFixJsPath = path.join(fixesDir, 'input-fix.js');
const inputFixCssPath = path.join(fixesDir, 'input-fix.css');

// Write the JS fix
fs.writeFileSync(inputFixJsPath, `
/**
 * @file input-fix.js
 * @description Fixes the waypoint input field issue where typing doesn't update the text.
 */

console.log('Loading input field fix...');

/**
 * Applies the fix for route input fields
 */
export function applyInputFix() {
  // Try to apply the fix after the components have mounted
  setTimeout(() => {
    console.log('Applying input field fix...');
    
    // Find all route input fields
    const routeInputs = document.querySelectorAll('.route-input');
    if (routeInputs.length === 0) {
      console.log('No route inputs found, will retry later...');
      setTimeout(applyInputFix, 1000);
      return;
    }
    
    console.log(\`Found \${routeInputs.length} route input fields\`);
    
    // Monitor each input field
    routeInputs.forEach((input, index) => {
      console.log(\`Applying fix to input #\${index + 1}:\`, input);
      
      // Store original onChange handler
      let originalOnChange = null;
      
      // Find React props
      const reactPropsKey = Object.keys(input).find(key => 
        key.startsWith('__reactProps$')
      );
      
      if (reactPropsKey) {
        originalOnChange = input[reactPropsKey].onChange;
        console.log(\`Found React props with onChange handler:\`, !!originalOnChange);
        
        // Replace the onChange handler
        input[reactPropsKey].onChange = function(event) {
          console.log('Enhanced onChange called:', event.target.value);
          
          // Call original handler
          if (originalOnChange) {
            originalOnChange(event);
          }
          
          // Ensure the input value is updated
          setTimeout(() => {
            if (input.value !== event.target.value) {
              console.log('Fixing input value:', event.target.value);
              input.value = event.target.value;
            }
          }, 10);
        };
        
        console.log('Successfully patched onChange handler');
      } else {
        console.log('Could not find React props, trying alternate method');
        
        // Add a direct input handler as fallback
        input.addEventListener('input', function(event) {
          console.log('Direct input event:', event.target.value);
          
          // Dispatch a React synthetic change event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          
          nativeInputValueSetter.call(input, event.target.value);
          
          const changeEvent = new Event('input', { bubbles: true });
          input.dispatchEvent(changeEvent);
        });
        
        console.log('Added direct input handler');
      }
    });
    
    // Add a global test function
    window.testInputField = function(text = 'test') {
      const input = document.querySelector('.route-input');
      if (input) {
        console.log('Testing input with:', text);
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        console.error('Input field not found');
      }
    };
    
    console.log('Input fix applied. Use window.testInputField() to test.');
  }, 2000); // Wait for components to mount
}

// Apply the fix automatically
applyInputFix();

// Export a function to manually apply the fix
export default applyInputFix;
`);

// Write the CSS fix
fs.writeFileSync(inputFixCssPath, `
/* src/components/fast-planner/fixes/input-fix.css */

/* Improve input field focus and visibility */
.route-input {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  background-color: var(--input-bg, #2a2a2a) !important;
  color: var(--input-text, white) !important;
  border: 1px solid var(--input-border, #444) !important;
  transition: all 0.2s ease !important;
}

.route-input:focus {
  background-color: var(--input-focus-bg, #333) !important;
  border-color: var(--accent-color, #0066cc) !important;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.3) !important;
  outline: none !important;
}

/* Ensure caret is visible */
.route-input::selection {
  background-color: var(--selection-bg, #0066cc) !important;
  color: var(--selection-text, white) !important;
}

/* Fix for any parent elements that might be causing issues */
.route-input-container,
.route-input-wrapper,
div:has(> .route-input) {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

/* Add a subtle indicator that input is receiving focus */
.route-input:focus::before {
  content: "";
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--accent-color, #0066cc);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}
`);

// Create FastPlannerApp.jsx import edit script 
const appJsxPath = path.join(__dirname, 'FastPlannerApp.jsx');
let appJsxContent = fs.readFileSync(appJsxPath, 'utf8');

// Add import for input fix CSS
if (!appJsxContent.includes("import './fixes/input-fix.css'")) {
  appJsxContent = appJsxContent.replace(
    "import './fixes/panel-interaction-fix.css'; // Keep CSS fixes",
    "import './fixes/panel-interaction-fix.css'; // Keep CSS fixes\nimport './fixes/input-fix.css'; // Import input fix CSS"
  );
}

// Add import for input fix JS
if (!appJsxContent.includes("import { applyInputFix }")) {
  appJsxContent = appJsxContent.replace(
    "import './fixes/input-fix.css'; // Import input fix CSS",
    "import './fixes/input-fix.css'; // Import input fix CSS\n\n// Import input fix\nimport { applyInputFix } from './fixes/input-fix';"
  );
}

// Add useEffect to apply the fix
if (!appJsxContent.includes("applyInputFix()")) {
  appJsxContent = appJsxContent.replace(
    "const cleanupInterval = setInterval(removeDebugUI, 3000);",
    "const cleanupInterval = setInterval(removeDebugUI, 3000);\n    \n    // Apply input fix after component mounts\n    setTimeout(() => {\n      console.log('Applying input fix from FastPlannerApp useEffect...');\n      applyInputFix();\n    }, 1000);"
  );
}

// Write back the updated file
fs.writeFileSync(appJsxPath, appJsxContent);

console.log('Input fix applied successfully!');
console.log('Please restart your application to see the changes.');
