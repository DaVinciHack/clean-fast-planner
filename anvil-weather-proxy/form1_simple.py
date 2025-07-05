from ._anvil_designer import Form1Template
from anvil import *
import anvil.server

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
          <p><strong>Correct API Base URL:</strong> {base_url}</p>
          <ul>
            <li>Health: {base_url}/_/api/proxy-weather-health</li>
            <li>NOAA: {base_url}/_/api/proxy-noaa-weather</li>
            <li>Aviation: {base_url}/_/api/proxy-aviation-weather</li>
            <li>Buoy: {base_url}/_/api/proxy-buoy-weather</li>
            <li>Lightning: {base_url}/_/api/proxy-lightning-weather</li>
          </ul>
          <p><strong>Note:</strong> API endpoints work from app root, not form path.</p>
        </div>
        """
        
        # Add HTML to the form
        html_panel = HtmlPanel()
        html_panel.html = html_content
        self.add_component(html_panel)