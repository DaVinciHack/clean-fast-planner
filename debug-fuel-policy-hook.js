// Debug script to intercept and monitor the useFuelPolicy hook
// Run this in browser console to see what the hook is actually returning

(function() {
  console.log('🔍 INTERCEPTING FUEL POLICY HOOK...');
  console.log('=====================================');
  
  // Try to find React component with fuelPolicy
  function findReactComponent() {
    try {
      // Get all React fiber nodes
      const allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        const reactKey = Object.keys(el).find(key => 
          key.startsWith('__reactInternalInstance') || 
          key.startsWith('__reactFiber') ||
          key.startsWith('_reactInternals')
        );
        
        if (reactKey) {
          const fiberNode = el[reactKey];
          
          // Walk up the fiber tree to find FastPlannerApp
          let current = fiberNode;
          while (current) {
            if (current.type?.name === 'FastPlannerApp' || 
                current.stateNode?.constructor?.name === 'FastPlannerApp' ||
                (current.memoizedProps && Object.keys(current.memoizedProps).length > 10)) {
              
              console.log('Found potential FastPlannerApp component:', current);
              
              // Try to access props or state
              if (current.memoizedProps) {
                console.log('Component props keys:', Object.keys(current.memoizedProps));
              }
              
              if (current.memoizedState) {
                console.log('Component has state:', !!current.memoizedState);
              }
              
              return current;
            }
            current = current.return;
          }
        }
      }
    } catch (e) {
      console.log('Error walking React tree:', e.message);
    }
    return null;
  }
  
  // Check if we can find the component
  const component = findReactComponent();
  
  // Alternative: Check global React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools detected');
    
    const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    console.log('DevTools version:', reactDevTools.version);
    
    if (reactDevTools.renderers) {
      console.log('Available renderers:', reactDevTools.renderers.size);
    }
  }
  
  // Try to monkey-patch console.log to catch fuel policy logs
  const originalLog = console.log;
  let fuelPolicyLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('fuel') || message.includes('policy') || message.includes('Fuel') || message.includes('Policy')) {
      fuelPolicyLogs.push({
        timestamp: Date.now(),
        message: message,
        args: args
      });
    }
    return originalLog.apply(console, args);
  };
  
  // Restore console.log after 5 seconds and show results
  setTimeout(() => {
    console.log = originalLog;
    console.log('🔍 FUEL POLICY RELATED LOGS CAPTURED:');
    fuelPolicyLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.message}`);
    });
    console.log('=====================================');
  }, 5000);
  
  console.log('🔍 Monitoring fuel policy logs for 5 seconds...');
  
  // Also check for OSDK related globals
  console.log('OSDK related globals:');
  console.log('- window.osdk:', typeof window.osdk);
  console.log('- window.foundryClient:', typeof window.foundryClient);
  console.log('- window.client:', typeof window.client);
  
  // Check if there are any authentication issues
  if (window.localStorage) {
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth') || key.includes('token') || key.includes('osdk'))) {
        authKeys.push(key);
      }
    }
    console.log('Auth-related localStorage keys:', authKeys);
  }
  
})();