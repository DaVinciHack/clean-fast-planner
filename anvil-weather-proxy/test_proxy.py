import anvil.server
import requests
import json
import time

# Test script for the Anvil weather proxy server
# Run this to verify all endpoints are working

# Your Anvil app URL (replace with your actual app URL)
ANVIL_APP_URL = "https://YOUR-APP-NAME.anvil.app"

def test_endpoint(endpoint_path, description):
    """Test a single proxy endpoint"""
    print(f"\n🧪 Testing: {description}")
    print(f"📡 URL: {ANVIL_APP_URL}{endpoint_path}")
    
    try:
        start_time = time.time()
        response = requests.get(f"{ANVIL_APP_URL}{endpoint_path}", timeout=30)
        end_time = time.time()
        
        print(f"✅ Status: {response.status_code}")
        print(f"⏱️  Time: {end_time - start_time:.2f}s")
        print(f"📊 Size: {len(response.text)} bytes")
        
        if response.status_code == 200:
            print(f"✅ {description} - Working!")
            return True
        else:
            print(f"❌ {description} - Failed with status {response.status_code}")
            print(f"🔍 Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"⏰ {description} - Request timed out")
        return False
    except requests.exceptions.RequestException as e:
        print(f"🚨 {description} - Request failed: {str(e)}")
        return False

def run_all_tests():
    """Run comprehensive tests on all proxy endpoints"""
    print("🚀 FastPlanner Weather Proxy Tests")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        {
            'path': '/health',
            'description': 'Health Check'
        },
        {
            'path': '/api/noaa/geoserver/observations/satellite/ows?service=WMS&version=1.1.1&request=GetCapabilities',
            'description': 'NOAA Weather Service (WMS Capabilities)'
        },
        {
            'path': '/api/awc/api/data/metar?ids=KHOU&format=json&taf=false',
            'description': 'Aviation Weather Center (METAR)'
        },
        {
            'path': '/api/buoy/data/realtime2/42001.txt',
            'description': 'NOAA Buoy Data (Gulf of Mexico)'
        },
        {
            'path': '/api/lightning/ows?service=WMS&version=1.1.1&request=GetCapabilities',
            'description': 'Lightning Detection Service'
        },
        {
            'path': '/stats',
            'description': 'Proxy Statistics'
        }
    ]
    
    # Run tests
    successful_tests = 0
    total_tests = len(test_cases)
    
    for test_case in test_cases:
        if test_endpoint(test_case['path'], test_case['description']):
            successful_tests += 1
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {successful_tests}/{total_tests} endpoints working")
    
    if successful_tests == total_tests:
        print("🎉 All weather proxy endpoints are working correctly!")
        print("✅ Your FastPlanner app can now use this weather proxy")
        print(f"🌐 Proxy URL: {ANVIL_APP_URL}")
        
        print("\n🔧 Next steps:")
        print("1. Update your FastPlanner app to use this proxy URL")
        print("2. Test weather features in your main app")
        print("3. Monitor the /stats endpoint for usage")
        
    else:
        print("⚠️  Some endpoints failed. Check the Anvil app logs for details.")
        print("🔧 Make sure:")
        print("- Your Anvil app is published and running")
        print("- The server code is uploaded and working")
        print("- HTTP endpoints are properly configured")

def test_lightning_integration():
    """Test lightning detection specifically"""
    print("\n⚡ Testing Lightning Detection Integration")
    print("=" * 40)
    
    # Test lightning WMS capabilities
    lightning_tests = [
        {
            'path': '/api/lightning/ows?service=WMS&version=1.1.1&request=GetCapabilities',
            'description': 'Lightning WMS Capabilities'
        },
        {
            'path': '/api/lightning/ows?service=WMS&version=1.1.1&request=GetMap&layers=lightning_detection&styles=&format=image/png&transparent=true&height=256&width=256&srs=EPSG:4326&bbox=-98,25,-88,30',
            'description': 'Lightning Map Tile (Gulf of Mexico)'
        }
    ]
    
    for test in lightning_tests:
        test_endpoint(test['path'], test['description'])

if __name__ == '__main__':
    print("🌩️  FastPlanner Weather Proxy Test Suite")
    print("📝 Make sure to update ANVIL_APP_URL with your actual app URL")
    print(f"🔗 Current URL: {ANVIL_APP_URL}")
    
    if "YOUR-APP-NAME" in ANVIL_APP_URL:
        print("\n❌ Please update ANVIL_APP_URL with your actual Anvil app URL first!")
        print("Example: https://my-weather-proxy.anvil.app")
    else:
        # Run all tests
        run_all_tests()
        
        # Test lightning integration specifically
        test_lightning_integration()
        
        print("\n🎯 If all tests pass, your weather proxy is ready!")
        print("📱 You can now integrate this with your FastPlanner app")