const http = require('http');
const https = require('https');
const url = require('url');

// Test script to verify all proxy endpoints are working
const BASE_URL = 'http://localhost:3001';

// Test cases for each weather API endpoint
const testCases = [
  {
    name: 'Health Check',
    url: `${BASE_URL}/health`,
    expectedStatus: 200
  },
  {
    name: 'NOAA Weather Service',
    url: `${BASE_URL}/api/noaa/geoserver/observations/satellite/ows?service=WMS&version=1.1.1&request=GetCapabilities`,
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'Aviation Weather Center',
    url: `${BASE_URL}/api/awc/api/data/metar?ids=KHOU&format=json&taf=false`,
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'NOAA Buoy Data',
    url: `${BASE_URL}/api/buoy/data/realtime2/42001.txt`,
    expectedStatus: 200,
    timeout: 10000
  }
];

// Function to make HTTP request and return promise
function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(testCase.url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'GET',
      timeout: testCase.timeout || 5000,
      headers: {
        'User-Agent': 'FastPlanner-Weather-Proxy-Test/1.0'
      }
    };

    const request = http.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          name: testCase.name,
          status: response.statusCode,
          expectedStatus: testCase.expectedStatus,
          success: response.statusCode === testCase.expectedStatus,
          dataLength: data.length,
          headers: response.headers
        });
      });
    });

    request.on('error', (error) => {
      resolve({
        name: testCase.name,
        status: 'ERROR',
        expectedStatus: testCase.expectedStatus,
        success: false,
        error: error.message
      });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({
        name: testCase.name,
        status: 'TIMEOUT',
        expectedStatus: testCase.expectedStatus,
        success: false,
        error: 'Request timed out'
      });
    });

    request.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing FastPlanner Weather Proxy Endpoints...\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}...`);
    const result = await makeRequest(testCase);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.status} (${result.dataLength} bytes)`);
    } else {
      console.log(`❌ ${result.name}: ${result.status} - ${result.error || 'Unexpected status'}`);
    }
    console.log('');
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log('='.repeat(50));
  console.log(`📊 Test Results: ${successful}/${total} endpoints working`);
  
  if (successful === total) {
    console.log('🎉 All weather proxy endpoints are working correctly!');
    console.log('✅ Your FastPlanner app should have full weather functionality');
  } else {
    console.log('⚠️  Some endpoints failed. Check the server logs for details.');
    console.log('🔧 Make sure the proxy server is running: npm start');
  }
  
  console.log('\n🌐 Next steps:');
  console.log('1. Update your FastPlanner app to use this proxy server URL');
  console.log('2. Deploy this proxy server to your production environment');
  console.log('3. Update CORS origins in server.js for your production domains');
}

// Check if server is running first
console.log('🔍 Checking if proxy server is running...');
makeRequest({ name: 'Server Check', url: `${BASE_URL}/health`, expectedStatus: 200 })
  .then(result => {
    if (result.success) {
      console.log('✅ Proxy server is running, starting tests...\n');
      runTests();
    } else {
      console.log('❌ Proxy server is not running!');
      console.log('🚀 Please start the server first: npm start');
      console.log('📍 Make sure it\'s running on port 3001');
    }
  })
  .catch(error => {
    console.error('🚨 Error checking server:', error);
  });