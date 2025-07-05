import anvil.server
import anvil.http
from datetime import datetime, timedelta, timezone
import traceback
import json

# Try using Anvil's enable_cors() function
anvil.http.enable_cors()

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
        
        return anvil.http.HttpResponse(
            json.dumps(health_data),
            status=200,
            headers={'Content-Type': 'application/json'}
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in health endpoint:", error_msg)
        return anvil.http.HttpResponse(error_msg, status=500)

@anvil.server.http_endpoint('/proxy-noaa-weather')
def proxy_noaa_weather(**kwargs):
    print("NOAA weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        service_path = kwargs.get('path', '')
        if not service_path:
            return anvil.http.HttpResponse("Missing 'path' parameter", status=400)
        
        base_url = "https://nowcoast.noaa.gov"
        if not service_path.startswith('/'):
            service_path = '/' + service_path
        
        request_url = base_url + service_path
        
        # Add additional query parameters
        query_params = []
        for key, value in kwargs.items():
            if key != 'path':
                query_params.append(f"{key}={value}")
        
        if query_params:
            request_url += ('&' if '?' in request_url else '?') + '&'.join(query_params)
        
        print("Requesting NOAA URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got NOAA response!")
        
        content_type = 'application/json'
        if 'wms' in request_url.lower() or 'getmap' in request_url.lower():
            content_type = 'image/png'
        elif 'xml' in request_url.lower() or 'capabilities' in request_url.lower():
            content_type = 'application/xml'
        
        return anvil.http.HttpResponse(
            response,
            status=200,
            headers={'Content-Type': content_type}
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in NOAA endpoint:", error_msg)
        return anvil.http.HttpResponse(error_msg, status=500)

@anvil.server.http_endpoint('/proxy-aviation-weather')
def proxy_aviation_weather(**kwargs):
    print("Aviation weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        service_path = kwargs.get('path', '')
        if not service_path:
            return anvil.http.HttpResponse("Missing 'path' parameter", status=400)
        
        base_url = "https://aviationweather.gov"
        if not service_path.startswith('/'):
            service_path = '/' + service_path
        
        request_url = base_url + service_path
        
        # Add additional query parameters
        query_params = []
        for key, value in kwargs.items():
            if key != 'path':
                query_params.append(f"{key}={value}")
        
        if query_params:
            request_url += ('&' if '?' in request_url else '?') + '&'.join(query_params)
        
        print("Requesting Aviation Weather URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got Aviation Weather response!")
        
        return anvil.http.HttpResponse(
            response,
            status=200,
            headers={'Content-Type': 'application/json'}
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in Aviation Weather endpoint:", error_msg)
        return anvil.http.HttpResponse(error_msg, status=500)

@anvil.server.http_endpoint('/proxy-buoy-weather')
def proxy_buoy_weather(**kwargs):
    print("Marine buoy endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        service_path = kwargs.get('path', '')
        if not service_path:
            return anvil.http.HttpResponse("Missing 'path' parameter", status=400)
        
        base_url = "https://www.ndbc.noaa.gov"
        if not service_path.startswith('/'):
            service_path = '/' + service_path
        
        request_url = base_url + service_path
        
        print("Requesting Marine Buoy URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got Marine Buoy response!")
        
        return anvil.http.HttpResponse(
            response,
            status=200,
            headers={'Content-Type': 'text/plain'}
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in Marine Buoy endpoint:", error_msg)
        return anvil.http.HttpResponse(error_msg, status=500)

@anvil.server.http_endpoint('/proxy-lightning-weather')
def proxy_lightning_weather(**kwargs):
    print("Lightning weather endpoint hit!")
    print("Parameters received:", kwargs)
    
    try:
        base_url = "https://nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows"
        request_url = base_url
        
        # Add query parameters
        query_params = []
        for key, value in kwargs.items():
            query_params.append(f"{key}={value}")
        
        if query_params:
            request_url += '?' + '&'.join(query_params)
        
        print("Requesting Lightning URL:", request_url)
        
        response = anvil.http.request(request_url, method="GET", timeout=60)
        print("Got Lightning response!")
        
        content_type = 'application/xml'
        if 'getmap' in request_url.lower():
            content_type = 'image/png'
        
        return anvil.http.HttpResponse(
            response,
            status=200,
            headers={'Content-Type': content_type}
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in Lightning endpoint:", error_msg)
        return anvil.http.HttpResponse(error_msg, status=500)

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
        
        return anvil.http.HttpResponse(
            json.dumps(stats_data),
            status=200,
            headers={'Content-Type': 'application/json'}
        )
        
    except Exception as e:
        error_msg = str(e)
        print("Error in stats endpoint:", error_msg)
        return anvil.http.HttpResponse(error_msg, status=500)