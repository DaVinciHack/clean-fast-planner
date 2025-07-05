import anvil.server
import anvil.http
import json

# FastPlanner Weather Proxy - Client Side Code
# This code runs in the browser and provides the HTTP endpoints

# Enable HTTP routes
anvil.http.enable_cors()

@anvil.http.route('/_/api/proxy-health', methods=['GET'])
def health_endpoint():
    """Health check endpoint accessible via HTTP"""
    try:
        result = anvil.server.call('health_check')
        return anvil.http.HttpResponse(
            json.dumps(result),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'status': 'error'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/_/api/proxy-noaa', methods=['GET'])
def noaa_proxy_endpoint():
    """NOAA weather proxy endpoint"""
    try:
        # Get the path from query parameters
        path = anvil.http.request.query_params.get('path', '')
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        # Call server function
        result = anvil.server.call('proxy_noaa_weather', path, client_ip)
        
        # Return response
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'application/json'),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'NOAA'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/api/awc/<path:path>', methods=['GET'])
def awc_proxy_endpoint(path):
    """Aviation Weather Center proxy endpoint"""
    try:
        # Get client IP for rate limiting
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        # Call server function
        result = anvil.server.call('proxy_aviation_weather', path, client_ip)
        
        # Return response
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'application/json'),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'AWC'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/api/buoy/<path:path>', methods=['GET'])
def buoy_proxy_endpoint(path):
    """Marine buoy data proxy endpoint"""
    try:
        # Get client IP for rate limiting
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        # Call server function
        result = anvil.server.call('proxy_buoy_data', path, client_ip)
        
        # Return response
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'text/plain'),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'BUOY'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/api/lightning/<path:path>', methods=['GET'])
def lightning_proxy_endpoint(path):
    """Lightning detection proxy endpoint"""
    try:
        # Get client IP for rate limiting
        client_ip = anvil.http.request.remote_addr or 'unknown'
        
        # Call server function
        result = anvil.server.call('proxy_lightning_data', path, client_ip)
        
        # Return response
        return anvil.http.HttpResponse(
            result['content'],
            status=result['status'],
            headers={
                'Content-Type': result['headers'].get('Content-Type', 'application/xml'),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
        
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'service': 'LIGHTNING'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

@anvil.http.route('/stats', methods=['GET'])
def stats_endpoint():
    """Get proxy server statistics"""
    try:
        result = anvil.server.call('get_weather_stats')
        return anvil.http.HttpResponse(
            json.dumps(result),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
    except Exception as e:
        return anvil.http.HttpResponse(
            json.dumps({'error': str(e), 'status': 'error'}),
            status=500,
            headers={'Content-Type': 'application/json'}
        )

# Handle OPTIONS requests for CORS preflight
@anvil.http.route('/api/noaa/<path:path>', methods=['OPTIONS'])
@anvil.http.route('/api/awc/<path:path>', methods=['OPTIONS'])
@anvil.http.route('/api/buoy/<path:path>', methods=['OPTIONS'])
@anvil.http.route('/api/lightning/<path:path>', methods=['OPTIONS'])
@anvil.http.route('/health', methods=['OPTIONS'])
@anvil.http.route('/stats', methods=['OPTIONS'])
def handle_cors_preflight(path=None):
    """Handle CORS preflight requests"""
    return anvil.http.HttpResponse(
        '',
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
        }
    )