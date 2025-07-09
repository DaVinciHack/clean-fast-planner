/**
 * OSDK Aircraft Test Script
 * Paste this into browser console to test OSDK aircraft availability
 */

console.log('🚀 OSDK AIRCRAFT TEST STARTING...');
console.log('🌍 Environment:', window.location.hostname + ':' + window.location.port);
console.log('🕐 Time:', new Date().toLocaleTimeString());

async function testOSDKAircraft() {
  console.log('\n=== OSDK CLIENT CHECK ===');
  
  // Check if client exists
  const client = window.client;
  console.log('✈️ OSDK Client available:', !!client);
  
  if (!client) {
    console.log('❌ No OSDK client found - cannot test aircraft');
    return;
  }
  
  console.log('✈️ Client type:', typeof client);
  console.log('✈️ Client ready:', client.ready);
  console.log('✈️ Client initialized:', client.initialized);
  
  // Check ontology access
  console.log('\n=== ONTOLOGY ACCESS ===');
  console.log('✈️ Ontology available:', !!client.ontology);
  console.log('✈️ Objects API available:', !!client.ontology?.objects);
  
  if (!client.ontology?.objects) {
    console.log('❌ Ontology objects API not available');
    return;
  }
  
  // Test aircraft object type access
  console.log('\n=== AIRCRAFT OBJECT TYPE ===');
  try {
    const aircraftObjectType = client.ontology.objects.Aircraft;
    console.log('✈️ Aircraft object type available:', !!aircraftObjectType);
    
    if (aircraftObjectType) {
      console.log('✈️ Aircraft object type methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(aircraftObjectType)).slice(0, 10));
    }
  } catch (error) {
    console.log('❌ Error accessing Aircraft object type:', error.message);
    return;
  }
  
  // Test fetching aircraft data
  console.log('\n=== AIRCRAFT DATA FETCH ===');
  try {
    console.log('✈️ Attempting to fetch aircraft data...');
    
    // Try to get aircraft data
    const aircraftData = await client.ontology.objects.Aircraft.all().fetchPage({
      $pageSize: 10  // Start with small test
    });
    
    console.log('✅ Aircraft fetch successful!');
    console.log('✈️ Aircraft data type:', typeof aircraftData);
    console.log('✈️ Aircraft data structure:', Object.keys(aircraftData || {}));
    console.log('✈️ Aircraft count in page:', aircraftData?.data?.length || 0);
    
    if (aircraftData?.data?.length > 0) {
      const firstAircraft = aircraftData.data[0];
      console.log('✈️ First aircraft sample:', {
        id: firstAircraft.id,
        properties: Object.keys(firstAircraft).slice(0, 10)
      });
      
      // Check specific aircraft properties
      console.log('✈️ First aircraft details:', {
        modelType: firstAircraft.modelType,
        tailNumber: firstAircraft.tailNumber,
        region: firstAircraft.region,
        cruiseSpeed: firstAircraft.cruiseSpeed,
        fuelBurn: firstAircraft.fuelBurn
      });
    }
    
    // Try to get total count
    console.log('✈️ Attempting to get total aircraft count...');
    const totalCount = await client.ontology.objects.Aircraft.all().count();
    console.log('✈️ Total aircraft count:', totalCount);
    
  } catch (error) {
    console.log('❌ Error fetching aircraft data:', error.message);
    console.log('❌ Error details:', error);
    
    // Check if it's an authentication error
    if (error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('token')) {
      console.log('🔐 This appears to be an authentication error');
    }
    
    // Check if it's a permissions error
    if (error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('access')) {
      console.log('🚫 This appears to be a permissions error');
    }
  }
  
  console.log('\n=== OSDK AIRCRAFT TEST COMPLETE ===');
}

// Run the test
testOSDKAircraft().catch(error => {
  console.log('❌ Test failed with error:', error.message);
});

console.log('🔍 OSDK Aircraft test script loaded and running...');