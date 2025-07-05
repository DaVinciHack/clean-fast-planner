import anvil.server
import anvil.http
import anvil.media
from datetime import datetime
import json

# Alternative approach: Use @anvil.server.callable functions instead of HTTP endpoints

@anvil.server.callable
def get_weather_health():
    """Health check via callable function"""
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'FastPlanner Weather Proxy',
        'version': '1.0.0'
    }

@anvil.server.callable  
def proxy_noaa_weather(path, **params):
    """Proxy NOAA weather requests"""
    try:
        base_url = "https://nowcoast.noaa.gov"
        if not path.startswith('/'):
            path = '/' + path
        
        request_url = base_url + path
        
        # Add query parameters
        if params:
            query_params = []
            for key, value in params.items():
                query_params.append(f"{key}={value}")
            request_url += ('&' if '?' in request_url else '?') + '&'.join(query_params)
        
        print("Requesting NOAA URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        return {
            'success': True,
            'data': response,
            'content_type': 'application/xml' if 'xml' in request_url else 'image/png'
        }
        
    except Exception as e:
        print("NOAA proxy error:", str(e))
        return {
            'success': False,
            'error': str(e)
        }

@anvil.server.callable
def proxy_aviation_weather(path, **params):
    """Proxy aviation weather requests"""
    try:
        base_url = "https://aviationweather.gov"
        if not path.startswith('/'):
            path = '/' + path
        
        request_url = base_url + path
        
        # Add query parameters  
        if params:
            query_params = []
            for key, value in params.items():
                query_params.append(f"{key}={value}")
            request_url += ('&' if '?' in request_url else '?') + '&'.join(query_params)
        
        print("Requesting Aviation Weather URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        return {
            'success': True,
            'data': response,
            'content_type': 'application/json'
        }
        
    except Exception as e:
        print("Aviation weather proxy error:", str(e))
        return {
            'success': False,
            'error': str(e)
        }

@anvil.server.callable
def proxy_buoy_weather(path, **params):
    """Proxy marine buoy requests"""
    try:
        base_url = "https://www.ndbc.noaa.gov"
        if not path.startswith('/'):
            path = '/' + path
        
        request_url = base_url + path
        
        print("Requesting Marine Buoy URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        return {
            'success': True,
            'data': response,
            'content_type': 'text/plain'
        }
        
    except Exception as e:
        print("Buoy proxy error:", str(e))
        return {
            'success': False,
            'error': str(e)
        }