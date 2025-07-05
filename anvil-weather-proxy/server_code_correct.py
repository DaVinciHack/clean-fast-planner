import anvil.server
import anvil.http
from datetime import datetime, timedelta, timezone
import traceback
import json

# FastPlanner Weather Proxy Server - Correct Anvil Pattern
# Using @anvil.server.http_endpoint like your working lightning code

# =============================
# Health Check Endpoint
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
            200, json.dumps(health_data),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Cache-Control': 'no-cache'
            }
        )
    except Exception as e:
        error_msg = str(e)
        print("Error in health endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)


# =============================
# NOAA Weather Proxy Endpoint
# =============================
@anvil.server.http_endpoint('/proxy-noaa-weather')
def proxy_noaa_weather(**kwargs):
    print("NOAA weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        # Get the service path from parameters
        service_path = kwargs.get('path', '')
        if not service_path:
            return anvil.server.HttpResponse(400, "Missing 'path' parameter")
        
        # Build the NOAA URL
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
        
        print("Requesting NOAA URL:", request_url)
        
        # Make the request
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got NOAA response!")
        
        # Determine content type
        content_type = 'application/json'
        if 'wms' in request_url.lower() or 'getmap' in request_url.lower():
            content_type = 'image/png'
        elif 'xml' in request_url.lower() or 'capabilities' in request_url.lower():
            content_type = 'application/xml'
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Content-Type': content_type,
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in NOAA endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)


# =============================
# Aviation Weather Proxy Endpoint
# =============================
@anvil.server.http_endpoint('/proxy-aviation-weather')
def proxy_aviation_weather(**kwargs):
    print("Aviation weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        # Get the service path from parameters
        service_path = kwargs.get('path', '')
        if not service_path:
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
        
        print("Requesting Aviation Weather URL:", request_url)
        
        # Make the request
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got Aviation Weather response!")
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in Aviation Weather endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)


# =============================
# Marine Buoy Proxy Endpoint
# =============================
@anvil.server.http_endpoint('/proxy-buoy-weather')
def proxy_buoy_weather(**kwargs):
    print("Marine buoy endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        # Get the service path from parameters
        service_path = kwargs.get('path', '')
        if not service_path:
            return anvil.server.HttpResponse(400, "Missing 'path' parameter")
        
        # Build the NOAA Buoy URL
        base_url = "https://www.ndbc.noaa.gov"
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
        
        print("Requesting Marine Buoy URL:", request_url)
        
        # Make the request
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got Marine Buoy response!")
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in Marine Buoy endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)


# =============================
# Lightning Weather Proxy Endpoint (Integrates with your existing lightning)
# =============================
@anvil.server.http_endpoint('/proxy-lightning-weather')
def proxy_lightning_weather(**kwargs):
    print("Lightning weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        # Get the service path from parameters
        service_path = kwargs.get('path', '')
        if not service_path:
            return anvil.server.HttpResponse(400, "Missing 'path' parameter")
        
        # Build the NOAA Lightning URL
        base_url = "https://nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows"
        
        request_url = base_url
        
        # Add query parameters
        query_params = []
        for key, value in kwargs.items():
            if key != 'path':  # Skip the path parameter
                query_params.append(f"{key}={value}")
        
        if query_params:
            request_url += '?' + '&'.join(query_params)
        
        print("Requesting Lightning URL:", request_url)
        
        # Make the request
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got Lightning response!")
        
        # Determine content type
        content_type = 'application/xml'
        if 'getmap' in request_url.lower():
            content_type = 'image/png'
        
        return anvil.server.HttpResponse(
            200, response,
            headers={
                'Content-Type': content_type,
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in Lightning endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)


# =============================
# Weather Stats Endpoint
# =============================
@anvil.server.http_endpoint('/proxy-weather-stats')
def proxy_weather_stats(**kwargs):
    print("Weather stats endpoint hit!")
    
    try:
        stats_data = {
            'service': 'FastPlanner Weather Proxy',
            'endpoints': [
                'proxy-weather-health',
                'proxy-noaa-weather',
                'proxy-aviation-weather',
                'proxy-buoy-weather',
                'proxy-lightning-weather'
            ],
            'timestamp': datetime.now().isoformat(),
            'status': 'operational'
        }
        
        return anvil.server.HttpResponse(
            200, json.dumps(stats_data),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:8080',
                'Cache-Control': 'no-cache'
            }
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in stats endpoint:", error_msg)
        return anvil.server.HttpResponse(500, error_msg)