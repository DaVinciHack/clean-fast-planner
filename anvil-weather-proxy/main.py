import anvil.server
import anvil.http
import requests
from anvil.tables import app_tables
import json
import time
from datetime import datetime
import traceback

# FastPlanner Weather Proxy Server for Anvil
# Handles CORS issues with government weather APIs

# Enable server module
anvil.server.enable_uplink()

# Rate limiting storage (simple in-memory cache)
request_cache = {}
RATE_LIMIT_WINDOW = 900  # 15 minutes in seconds
RATE_LIMIT_MAX = 1000    # requests per window

def rate_limit_check(client_ip):
    """Simple rate limiting check"""
    now = time.time()
    
    # Clean old entries
    request_cache[client_ip] = [
        req_time for req_time in request_cache.get(client_ip, [])
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if over limit
    if len(request_cache.get(client_ip, [])) >= RATE_LIMIT_MAX:
        return False
    
    # Add this request
    if client_ip not in request_cache:
        request_cache[client_ip] = []
    request_cache[client_ip].append(now)
    
    return True

def make_proxy_request(target_url, timeout=30):
    """Make HTTP request to external API with proper headers"""
    try:
        headers = {
            'User-Agent': 'FastPlanner-Weather-Proxy/1.0 (Aviation Weather Service)',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        
        print(f"📡 Proxying request to: {target_url}")
        
        response = requests.get(
            target_url,
            headers=headers,
            timeout=timeout,
            allow_redirects=True
        )
        
        return {
            'status': response.status_code,
            'content': response.text,
            'headers': dict(response.headers),
            'success': True
        }
        
    except requests.exceptions.Timeout:
        print(f"⏰ Request timeout: {target_url}")
        return {
            'status': 408,
            'content': json.dumps({'error': 'Request timeout', 'service': 'weather'}),
            'headers': {'Content-Type': 'application/json'},
            'success': False
        }
        
    except requests.exceptions.RequestException as e:
        print(f"🚨 Request error: {str(e)}")
        return {
            'status': 500,
            'content': json.dumps({'error': str(e), 'service': 'weather'}),
            'headers': {'Content-Type': 'application/json'},
            'success': False
        }

@anvil.server.callable
def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'FastPlanner Weather Proxy',
        'version': '1.0.0'
    }

@anvil.server.callable
def proxy_noaa_weather(path, client_ip='unknown'):
    """
    Proxy NOAA weather services
    Routes: /api/noaa/* -> https://nowcoast.noaa.gov/*
    """
    
    # Rate limiting
    if not rate_limit_check(client_ip):
        return {
            'status': 429,
            'content': json.dumps({'error': 'Rate limit exceeded', 'service': 'NOAA'}),
            'headers': {'Content-Type': 'application/json'},
            'success': False
        }
    
    # Build target URL
    target_url = f"https://nowcoast.noaa.gov/{path}"
    
    # Make request
    result = make_proxy_request(target_url)
    
    print(f"🌤️  NOAA Weather: {result['status']} - {len(result['content'])} bytes")
    return result

@anvil.server.callable
def proxy_aviation_weather(path, client_ip='unknown'):
    """
    Proxy Aviation Weather Center services
    Routes: /api/awc/* -> https://aviationweather.gov/*
    """
    
    # Rate limiting
    if not rate_limit_check(client_ip):
        return {
            'status': 429,
            'content': json.dumps({'error': 'Rate limit exceeded', 'service': 'AWC'}),
            'headers': {'Content-Type': 'application/json'},
            'success': False
        }
    
    # Build target URL
    target_url = f"https://aviationweather.gov/{path}"
    
    # Make request
    result = make_proxy_request(target_url)
    
    print(f"✈️  Aviation Weather: {result['status']} - {len(result['content'])} bytes")
    return result

@anvil.server.callable
def proxy_buoy_data(path, client_ip='unknown'):
    """
    Proxy NOAA buoy data services
    Routes: /api/buoy/* -> https://www.ndbc.noaa.gov/*
    """
    
    # Rate limiting
    if not rate_limit_check(client_ip):
        return {
            'status': 429,
            'content': json.dumps({'error': 'Rate limit exceeded', 'service': 'BUOY'}),
            'headers': {'Content-Type': 'application/json'},
            'success': False
        }
    
    # Build target URL
    target_url = f"https://www.ndbc.noaa.gov/{path}"
    
    # Make request
    result = make_proxy_request(target_url)
    
    print(f"🌊 Marine Buoys: {result['status']} - {len(result['content'])} bytes")
    return result

@anvil.server.callable
def proxy_lightning_data(path, client_ip='unknown'):
    """
    Proxy lightning detection services
    Routes: /api/lightning/* -> https://nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows*
    """
    
    # Rate limiting
    if not rate_limit_check(client_ip):
        return {
            'status': 429,
            'content': json.dumps({'error': 'Rate limit exceeded', 'service': 'LIGHTNING'}),
            'headers': {'Content-Type': 'application/json'},
            'success': False
        }
    
    # Build target URL for lightning detection
    target_url = f"https://nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows{path}"
    
    # Make request
    result = make_proxy_request(target_url)
    
    print(f"⚡ Lightning Detection: {result['status']} - {len(result['content'])} bytes")
    return result

@anvil.server.callable
def get_weather_stats():
    """Get proxy server statistics"""
    return {
        'active_clients': len(request_cache),
        'total_requests': sum(len(requests) for requests in request_cache.values()),
        'cache_size': len(request_cache),
        'rate_limit_window': RATE_LIMIT_WINDOW,
        'rate_limit_max': RATE_LIMIT_MAX,
        'timestamp': datetime.now().isoformat()
    }

# Keep server running
if __name__ == '__main__':
    print("🚀 FastPlanner Weather Proxy Server starting...")
    print("🌤️  NOAA Weather API proxy ready")
    print("✈️  Aviation Weather API proxy ready") 
    print("🌊 Marine Buoy API proxy ready")
    print("⚡ Lightning Detection API proxy ready")
    print("🔒 Rate limiting enabled (1000 req/15min)")
    print("📡 Waiting for requests...")
    
    # Keep the server running
    try:
        anvil.server.wait_forever()
    except KeyboardInterrupt:
        print("\n🛑 Weather proxy server stopped")
        anvil.server.disconnect()