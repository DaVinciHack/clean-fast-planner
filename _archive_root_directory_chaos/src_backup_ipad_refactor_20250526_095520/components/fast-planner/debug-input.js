// debug-input.js
// This script will add event listeners to debug the route input field

console.log('Initializing route input debug script...');

function debugInputField() {
  // Try to find the route input field
  const inputField = document.querySelector('.route-input');
  if (!inputField) {
    console.error('Route input field not found. Will retry in 1 second...');
    setTimeout(debugInputField, 1000);
    return;
  }

  console.log('Found route input field:', inputField);

  // Add diagnostic event listeners
  inputField.addEventListener('focus', (e) => {
    console.log('Route input field focused:', e.target.value);
  });

  inputField.addEventListener('blur', (e) => {
    console.log('Route input field blurred:', e.target.value);
  });

  inputField.addEventListener('input', (e) => {
    console.log('Route input field input event:', e.target.value);
  });

  inputField.addEventListener('keydown', (e) => {
    console.log('Route input field keydown event:', e.key, e.target.value);
  });

  inputField.addEventListener('change', (e) => {
    console.log('Route input field change event:', e.target.value);
  });

  // Test if we can programmatically set the value
  setTimeout(() => {
    console.log('Attempting to set input value programmatically...');
    try {
      inputField.value = 'Test input';
      // Also dispatch an input event to simulate typing
      const event = new Event('input', { bubbles: true });
      inputField.dispatchEvent(event);
      console.log('Input value set to:', inputField.value);
    } catch (err) {
      console.error('Error setting input value:', err);
    }
  }, 3000);

  // Check if React is preventing the value from being set
  const originalSetValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  Object.defineProperty(inputField, 'value', {
    set(newValue) {
      console.log('Input value setter called with:', newValue);
      originalSetValue.call(this, newValue);
    }
  });

  console.log('Input debugging complete. Check console for events.');
}

// Start debugging when the document is loaded
if (document.readyState === 'complete') {
  debugInputField();
} else {
  window.addEventListener('load', debugInputField);
}

// Expose a global function to manually test the input field
window.testInputField = () => {
  const inputField = document.querySelector('.route-input');
  if (inputField) {
    console.log('Current input field value:', inputField.value);
    inputField.focus();
    inputField.value = 'Manual test ' + Date.now().toString().slice(-4);
    
    // Dispatch events to notify React
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
    inputField.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('New input field value:', inputField.value);
  } else {
    console.error('Input field not found for manual test');
  }
};

console.log('Route input debug script loaded. Use window.testInputField() to manually test.');
