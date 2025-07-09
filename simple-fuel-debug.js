// Simple fuel policy debug - copy/paste into browser console
// No imports needed - uses existing globals

console.log('🔍 CHECKING FUEL POLICY LOADING...');

// Check if useFuelPolicy hook is being called
console.log('1. FastPlannerApp fuelPolicy status:');
console.log('   - Check React DevTools for fuelPolicy prop');

// Check for fuel policy related logs
console.log('2. Looking for fuel policy logs in console history...');
console.log('   Look for: "Loading fuel policies for region"');
console.log('   Look for: "🔍 OSDK QUERY: Looking for fuel policies"');
console.log('   Look for: "🔍 OSDK RESULT: Found X fuel policies"');

// Check localStorage for auth
console.log('3. Auth status:');
console.log('   - authState:', localStorage.getItem('authState'));
console.log('   - accessToken exists:', !!localStorage.getItem('accessToken'));

// Check for region data
console.log('4. Region context:');
console.log('   - Check if region is selected in the app');
console.log('   - Fuel policies need a region to load');

// Set up monitoring for fuel policy logs
console.log('5. Monitoring for fuel policy activity for 10 seconds...');

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

let fuelLogs = [];

const logInterceptor = (...args) => {
  const message = args.join(' ');
  if (message.includes('fuel') || message.includes('policy') || 
      message.includes('Fuel') || message.includes('Policy') ||
      message.includes('OSDK') || message.includes('region')) {
    fuelLogs.push({
      type: 'log',
      timestamp: Date.now(),
      message: message
    });
  }
  return originalLog.apply(console, args);
};

const warnInterceptor = (...args) => {
  const message = args.join(' ');
  if (message.includes('fuel') || message.includes('policy') || 
      message.includes('Fuel') || message.includes('Policy') ||
      message.includes('OSDK') || message.includes('region')) {
    fuelLogs.push({
      type: 'warn',
      timestamp: Date.now(),
      message: message
    });
  }
  return originalWarn.apply(console, args);
};

const errorInterceptor = (...args) => {
  const message = args.join(' ');
  if (message.includes('fuel') || message.includes('policy') || 
      message.includes('Fuel') || message.includes('Policy') ||
      message.includes('OSDK') || message.includes('region')) {
    fuelLogs.push({
      type: 'error',
      timestamp: Date.now(),
      message: message
    });
  }
  return originalError.apply(console, args);
};

console.log = logInterceptor;
console.warn = warnInterceptor;  
console.error = errorInterceptor;

setTimeout(() => {
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  
  console.log('🔍 FUEL POLICY MONITORING RESULTS:');
  console.log('=====================================');
  
  if (fuelLogs.length === 0) {
    console.log('❌ NO FUEL POLICY LOGS DETECTED');
    console.log('   This means fuel policy loading is not being called');
    console.log('   Check: 1) Region selection 2) useFuelPolicy hook 3) Authentication');
  } else {
    console.log(`✅ DETECTED ${fuelLogs.length} FUEL POLICY LOGS:`);
    fuelLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.message}`);
    });
  }
  
  console.log('=====================================');
}, 10000);