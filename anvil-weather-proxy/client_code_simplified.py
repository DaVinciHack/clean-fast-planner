import anvil.server
import anvil.http
import json

# FastPlanner Weather Proxy - Client Code (Simplified like your lightning setup)

@anvil.http.route('/_/api/proxy-weather-health', methods=['GET'])
def weather_health_endpoint():
    """Health check endpoint - matches your lightning pattern"""
    try:
        result = anvil.server.call('health_check')
        return anvil.http.HttpResponse(
            json.dumps(result),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'status': 'error'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/_/api/proxy-noaa-weather', methods=['GET'])
def noaa_weather_endpoint():
    """NOAA weather proxy - simplified endpoint"""
    try:
        # Get full query string from request
        query_string = anvil.http.request.query_string or ''
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        # Call server function with full query
        result = anvil.server.call('proxy_noaa_weather', query_string, client_ip)
        
        # Return the actual content (image, JSON, etc.)
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'application/json'),
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'NOAA'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/_/api/proxy-aviation-weather', methods=['GET'])
def aviation_weather_endpoint():
    """Aviation weather proxy - simplified endpoint"""
    try:
        query_string = anvil.http.request.query_string or ''
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        result = anvil.server.call('proxy_aviation_weather', query_string, client_ip)
        
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'application/json'),
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'AWC'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/_/api/proxy-buoy-weather', methods=['GET'])
def buoy_weather_endpoint():
    """Marine buoy proxy - simplified endpoint"""
    try:
        query_string = anvil.http.request.query_string or ''
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        result = anvil.server.call('proxy_buoy_data', query_string, client_ip)
        
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'text/plain'),
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'BUOY'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/_/api/proxy-lightning-weather', methods=['GET'])
def lightning_weather_endpoint():
    """Lightning detection proxy - matches your existing lightning setup"""
    try:
        query_string = anvil.http.request.query_string or ''
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        result = anvil.server.call('proxy_lightning_data', query_string, client_ip)
        
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'application/xml'),
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'LIGHTNING'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/_/api/proxy-weather-stats', methods=['GET'])
def weather_stats_endpoint():
    """Weather proxy statistics"""
    try:
        result = anvil.server.call('get_weather_stats')
        return anvil.http.HttpResponse(
            json.dumps(result),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        )
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'status': 'error'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )