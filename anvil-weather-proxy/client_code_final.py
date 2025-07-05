from ._anvil_designer import Form1Template
from anvil import *
import anvil.server
import anvil.http

class Form1(Form1Template):
    def __init__(self, **properties):
        # This line is auto-generated, don't edit
        self.init_components(**properties)

        # Get the app URL and extract just the domain part
        full_url = anvil.server.get_app_origin('published')
        # Extract just the domain: https://pkm5jqs3bpnr43dm.anvil.app
        base_url = '/'.join(full_url.split('/')[:3])
        
        # Simple HTML content
        html_content = f"""
        <div style="padding: 20px;">
          <h1>FastPlanner Weather Proxy</h1>
          <p>Weather API proxy service is running.</p>
          <p><strong>API Base URL:</strong> {base_url}</p>
          <ul>
            <li>Health: {base_url}/_/api/proxy-weather-health</li>
            <li>NOAA: {base_url}/_/api/proxy-noaa-weather</li>
            <li>Aviation: {base_url}/_/api/proxy-aviation-weather</li>
            <li>Buoy: {base_url}/_/api/proxy-buoy-weather</li>
            <li>Lightning: {base_url}/_/api/proxy-lightning-weather</li>
          </ul>
          <p><strong>Status:</strong> <span id="status">Testing...</span></p>
          <button id="test-cors">Test CORS</button>
        </div>
        
        <script>
        // Test CORS from client-side JavaScript
        document.getElementById('test-cors').onclick = function() {
            fetch('{base_url}/_/api/proxy-weather-health')
                .then(response => response.json())
                .then(data => {{
                    document.getElementById('status').innerHTML = 'CORS Working! ✅';
                    console.log('CORS test success:', data);
                }})
                .catch(error => {{
                    document.getElementById('status').innerHTML = 'CORS Failed ❌';
                    console.log('CORS test failed:', error);
                }});
        }};
        
        // Auto-test on load
        setTimeout(function() {{
            document.getElementById('test-cors').click();
        }}, 1000);
        </script>
        """
        
        # Add HTML to the form
        html_panel = HtmlPanel()
        html_panel.html = html_content
        self.add_component(html_panel)

# Try client-side routing as alternative to server endpoints
@anvil.routing.route('/_/api/proxy-weather-health')
def client_health_route():
    try:
        result = anvil.server.call('get_weather_health')
        return anvil.http.HttpResponse(
            json.dumps(result),
            headers={
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            }
        )
    except Exception as e:
        return anvil.http.HttpResponse(str(e), status=500)

@anvil.routing.route('/_/api/proxy-noaa-weather')  
def client_noaa_route():
    try:
        # Get query parameters from URL
        path = anvil.http.request.query_params.get('path', '')
        
        # Get all other parameters
        params = {}
        for key, value in anvil.http.request.query_params.items():
            if key != 'path':
                params[key] = value
        
        result = anvil.server.call('proxy_noaa_weather', path, **params)
        
        if result['success']:
            content_type = result.get('content_type', 'application/xml')
            return anvil.http.HttpResponse(
                result['data'],
                headers={
                    'Content-Type': content_type,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': '*'
                }
            )
        else:
            return anvil.http.HttpResponse(result['error'], status=500)
            
    except Exception as e:
        return anvil.http.HttpResponse(str(e), status=500)