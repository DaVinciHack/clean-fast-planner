// Test OSDK connection and data loading
// Run this in browser console

(function() {
  console.log('🔍 TESTING OSDK CONNECTION...');
  console.log('=====================================');
  
  // Check authentication
  console.log('1. Authentication Status:');
  console.log('   - localStorage auth:', localStorage.getItem('authState'));
  console.log('   - localStorage token:', !!localStorage.getItem('accessToken'));
  
  // Check OSDK client
  console.log('2. OSDK Client Status:');
  console.log('   - window.client:', typeof window.client);
  console.log('   - window.foundryClient:', typeof window.foundryClient);
  
  // Check if we can access OSDK modules
  try {
    if (window.client) {
      console.log('3. OSDK Client Details:');
      console.log('   - Client type:', window.client.constructor.name);
      console.log('   - Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.client)));
    }
  } catch (e) {
    console.log('3. Error accessing client:', e.message);
  }
  
  // Test a simple OSDK call
  console.log('4. Testing simple OSDK call...');
  
  // Try to call a basic OSDK method
  const testOSDK = async () => {
    try {
      // Import the SDK modules if available
      if (typeof window !== 'undefined' && window.client) {
        console.log('   - Attempting to call OSDK...');
        
        // Try to get objects from a simple ontology call
        const result = await window.client.ontology.objects.Airport.fetchPage();
        console.log('   ✅ OSDK call successful:', result);
        console.log('   - Results count:', result.data?.length || 0);
        
      } else {
        console.log('   ❌ No OSDK client available');
      }
    } catch (error) {
      console.log('   ❌ OSDK call failed:', error.message);
      console.log('   - Error type:', error.constructor.name);
      console.log('   - Error details:', error);
    }
  };
  
  // Run the test
  testOSDK();
  
  console.log('=====================================');
})();