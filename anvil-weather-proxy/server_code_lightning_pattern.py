import anvil.server
import anvil.http
from datetime import datetime, timedelta, timezone
import traceback

# Copy the EXACT pattern from your working lightning endpoints

# =============================
# Health Check Endpoint (Following Lightning Pattern)
# =============================
@anvil.server.http_endpoint('/proxy-weather-health')
def proxy_weather_health(**kwargs):
    print("Weather health endpoint hit!")
    
    try:
        health_data = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'service': 'FastPlanner Weather Proxy',
            'version': '1.0.0'
        }
        
        return anvil.server.HttpResponse(
            200, health_data,
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        )
    except Exception as e:
        error_msg = str(e)
        print("Error in Weather health endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)

# =============================
# NOAA Weather Proxy (Following Lightning Pattern)  
# =============================
@anvil.server.http_endpoint('/proxy-noaa-weather')
def proxy_noaa_weather(**kwargs):
    print("NOAA weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    # Get the service path from parameters
    service_path = kwargs.get('path', '')
    if not service_path:
        print("Missing path parameter")
        return anvil.server.HttpResponse(400, "Missing 'path' parameter")
    
    # Build the NOAA URL (same pattern as lightning)
    base_url = "https://nowcoast.noaa.gov"
    if not service_path.startswith('/'):
        service_path = '/' + service_path
    
    request_url = base_url + service_path
    
    # Add any additional query parameters
    query_params = []
    for key, value in kwargs.items():
        if key != 'path':  # Skip the path parameter
            query_params.append(f"{key}={value}")
    
    if query_params:
        request_url += ('&' if '?' in request_url else '?') + '&'.join(query_params)
    
    print("Requesting NOAA URL:")
    print(request_url)
    
    try:
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got NOAA weather response!")
        
        # Determine content type like lightning does
        content_type = 'application/xml'
        if 'getmap' in request_url.lower():
            content_type = 'image/png'
        elif 'json' in request_url.lower():
            content_type = 'application/json'
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': content_type
            }
        )
    except Exception as e:
        error_msg = str(e)
        print("Error in NOAA weather endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)

# =============================
# Aviation Weather Proxy (Following Lightning Pattern)
# =============================
@anvil.server.http_endpoint('/proxy-aviation-weather')
def proxy_aviation_weather(**kwargs):
    print("Aviation weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    # Get the service path from parameters  
    service_path = kwargs.get('path', '')
    if not service_path:
        print("Missing path parameter")
        return anvil.server.HttpResponse(400, "Missing 'path' parameter")
    
    # Build the Aviation Weather URL
    base_url = "https://aviationweather.gov"
    if not service_path.startswith('/'):
        service_path = '/' + service_path
    
    request_url = base_url + service_path
    
    # Add any additional query parameters
    query_params = []
    for key, value in kwargs.items():
        if key != 'path':  # Skip the path parameter
            query_params.append(f"{key}={value}")
    
    if query_params:
        request_url += ('&' if '?' in request_url else '?') + '&'.join(query_params)
    
    print("Requesting Aviation Weather URL:")
    print(request_url)
    
    try:
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got aviation weather response!")
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        )
    except Exception as e:
        error_msg = str(e)
        print("Error in Aviation Weather endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)

# =============================
# Marine Buoy Proxy (Following Lightning Pattern)
# =============================
@anvil.server.http_endpoint('/proxy-buoy-weather')
def proxy_buoy_weather(**kwargs):
    print("Marine buoy endpoint hit!")
    print("Parameters received:", kwargs)
    
    # Get the service path from parameters
    service_path = kwargs.get('path', '')
    if not service_path:
        print("Missing path parameter")
        return anvil.server.HttpResponse(400, "Missing 'path' parameter")
    
    # Build the NOAA Buoy URL
    base_url = "https://www.ndbc.noaa.gov"
    if not service_path.startswith('/'):
        service_path = '/' + service_path
    
    request_url = base_url + service_path
    
    print("Requesting Marine Buoy URL:")
    print(request_url)
    
    try:
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got marine buoy response!")
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain'
            }
        )
    except Exception as e:
        error_msg = str(e)
        print("Error in Marine Buoy endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)

# =============================
# Lightning Weather Proxy (Following Lightning Pattern)
# =============================
@anvil.server.http_endpoint('/proxy-lightning-weather')
def proxy_lightning_weather(**kwargs):
    print("Lightning weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    # Build the NOAA Lightning URL (same as your working lightning)
    base_url = "https://nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows"
    request_url = base_url
    
    # Add query parameters
    query_params = []
    for key, value in kwargs.items():
        query_params.append(f"{key}={value}")
    
    if query_params:
        request_url += '?' + '&'.join(query_params)
    
    print("Requesting Lightning URL:")
    print(request_url)
    
    try:
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got lightning response!")
        
        # Determine content type
        content_type = 'application/xml'
        if 'getmap' in request_url.lower():
            content_type = 'image/png'
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
                'Content-Type': content_type
            }
        )
    except Exception as e:
        error_msg = str(e)
        print("Error in Lightning endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)