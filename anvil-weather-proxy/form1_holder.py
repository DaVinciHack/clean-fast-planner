from ._anvil_designer import Form1Template
from anvil import *
import anvil.server  # Needed for get_app_origin

class Form1(Form1Template):
    def __init__(self, **properties):
        self.init_components(**properties)
        
        # Retrieve the published base URL explicitly.
        base_url = anvil.server.get_app_origin('published')
        print("Published base URL:", base_url)
        
        # Construct weather endpoint URLs.
        health_endpoint_url = base_url + "/_/api/proxy-weather-health"
        noaa_endpoint_url = base_url + "/_/api/proxy-noaa-weather"
        aviation_endpoint_url = base_url + "/_/api/proxy-aviation-weather"
        buoy_endpoint_url = base_url + "/_/api/proxy-buoy-weather"
        lightning_endpoint_url = base_url + "/_/api/proxy-lightning-weather"
        stats_endpoint_url = base_url + "/_/api/proxy-weather-stats"
        
        # Print the constructed URLs for debugging.
        print("Weather Health endpoint URL:", health_endpoint_url)
        print("NOAA Weather endpoint URL:", noaa_endpoint_url)
        print("Aviation Weather endpoint URL:", aviation_endpoint_url)
        print("Marine Buoy endpoint URL:", buoy_endpoint_url)
        print("Lightning Weather endpoint URL:", lightning_endpoint_url)
        print("Weather Stats endpoint URL:", stats_endpoint_url)
        
        # Create HTML content that displays the available endpoints.
        html_content = f"""
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #2E86AB;">🌦️ FastPlanner Weather Proxy API</h1>
          <p style="font-size: 16px; color: #666;">This app provides weather API proxy services for FastPlanner to handle CORS issues with government weather APIs.</p>
          
          <h2 style="color: #A23B72;">📡 Available Endpoints:</h2>
          
          <div style="background: #F18F01; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>🏥 Health Check</h3>
            <code style="background: rgba(255,255,255,0.2); padding: 5px; border-radius: 3px;">{health_endpoint_url}</code>
            <p>Test if the proxy server is running</p>
          </div>
          
          <div style="background: #C73E1D; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>🌤️ NOAA Weather Services</h3>
            <code style="background: rgba(255,255,255,0.2); padding: 5px; border-radius: 3px;">{noaa_endpoint_url}?path=...</code>
            <p>Satellite imagery, radar data, marine weather</p>
          </div>
          
          <div style="background: #2E86AB; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>✈️ Aviation Weather Center</h3>
            <code style="background: rgba(255,255,255,0.2); padding: 5px; border-radius: 3px;">{aviation_endpoint_url}?path=...</code>
            <p>METAR data, TAF forecasts, aviation alerts</p>
          </div>
          
          <div style="background: #3A86AB; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>🌊 Marine Buoy Data</h3>
            <code style="background: rgba(255,255,255,0.2); padding: 5px; border-radius: 3px;">{buoy_endpoint_url}?path=...</code>
            <p>Real-time offshore conditions, wave height, wind speed</p>
          </div>
          
          <div style="background: #A23B72; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>⚡ Lightning Detection</h3>
            <code style="background: rgba(255,255,255,0.2); padding: 5px; border-radius: 3px;">{lightning_endpoint_url}?path=...</code>
            <p>Real-time lightning strikes, safety alerts</p>
          </div>
          
          <div style="background: #666; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>📊 Proxy Statistics</h3>
            <code style="background: rgba(255,255,255,0.2); padding: 5px; border-radius: 3px;">{stats_endpoint_url}</code>
            <p>Usage statistics and service status</p>
          </div>
          
          <h2 style="color: #C73E1D;">🔧 Usage Examples:</h2>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace;">
            <p><strong>Health Check:</strong><br>
            GET {health_endpoint_url}</p>
            
            <p><strong>NOAA Satellite Data:</strong><br>
            GET {noaa_endpoint_url}?path=geoserver/observations/satellite/ows&service=WMS&request=GetCapabilities</p>
            
            <p><strong>Aviation Weather (METAR):</strong><br>
            GET {aviation_endpoint_url}?path=api/data/metar&ids=KHOU&format=json</p>
            
            <p><strong>Marine Buoy Data:</strong><br>
            GET {buoy_endpoint_url}?path=data/realtime2/42001.txt</p>
          </div>
          
          <div style="background: #e8f4fd; border-left: 4px solid #2E86AB; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2E86AB; margin-top: 0;">🎯 Integration with FastPlanner</h3>
            <p>Replace your weather API calls in FastPlanner with these proxy endpoints to resolve CORS issues in production.</p>
            <p><strong>Base URL:</strong> <code>{base_url}/_/api/</code></p>
          </div>
          
          <footer style="text-align: center; margin-top: 30px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
            <p>🚁 FastPlanner Weather Proxy Service v1.0</p>
            <p>Providing reliable weather data for aviation operations</p>
          </footer>
        </div>
        """
        
        # Create an HTMLPanel, set its HTML, and add it to the form.
        html_panel = HtmlPanel()
        html_panel.html = html_content
        self.add_component(html_panel)