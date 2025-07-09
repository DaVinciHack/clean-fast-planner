#!/usr/bin/env python3
"""
FastPlanner Mobile Dev Server - Uses existing localhost callback
This proxies your iPad requests to localhost to use existing OAuth setup
"""

import http.server
import socketserver
import os
import urllib.request
import urllib.parse
from urllib.error import URLError

# Change to FastPlanner root directory
fastplanner_dir = "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5"
os.chdir(fastplanner_dir)

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "localhost"

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve from the dist directory
        super().__init__(*args, directory=os.path.join(fastplanner_dir, "dist"), **kwargs)

    def do_GET(self):
        # Check if this is an OAuth callback or API request
        if '/auth/' in self.path or self.path.startswith('/api/'):
            # Proxy to localhost:8080 for OAuth/API calls
            self.proxy_to_localhost()
        else:
            # Handle /plan/ path routing for static files
            if self.path.startswith('/plan/'):
                # Remove /plan prefix for static files
                self.path = self.path[5:]
                if not self.path or self.path == '/':
                    self.path = '/index.html'
            elif self.path == '/':
                # Redirect root to /plan/
                self.send_response(302)
                self.send_header('Location', '/plan/')
                self.end_headers()
                return
                
            # Serve static files
            super().do_GET()

    def proxy_to_localhost(self):
        """Proxy OAuth and API requests to localhost:8080"""
        try:
            # Build the localhost URL
            localhost_url = f"http://localhost:8082{self.path}"
            if self.command == 'GET':
                # Forward the request to localhost
                with urllib.request.urlopen(localhost_url) as response:
                    # Copy response
                    self.send_response(response.getcode())
                    
                    # Copy headers
                    for header, value in response.headers.items():
                        if header.lower() not in ['server', 'date']:
                            self.send_header(header, value)
                    
                    self.end_headers()
                    
                    # Copy content
                    self.wfile.write(response.read())
                    
        except URLError as e:
            # If localhost:8080 is not running, return error
            self.send_response(502)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            error_html = f"""
            <h1>Development Server Required</h1>
            <p>Please start the FastPlanner development server first:</p>
            <pre>npm run dev</pre>
            <p>Error: {str(e)}</p>
            """
            self.wfile.write(error_html.encode())

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom logging
        super().log_message(format, *args)

if __name__ == "__main__":
    PORT = 9092
    local_ip = get_local_ip()
    
    print("🚀 FastPlanner Mobile Proxy Server")
    print("=" * 50)
    print("⚠️  REQUIREMENT: Start dev server first with: npm run dev")
    print("")
    print(f"📱 **iPad/iPhone URL**: http://{local_ip}:{PORT}/plan/")
    print(f"🖥️  **Desktop URL**: http://localhost:{PORT}/plan/")
    print("")
    print("🔐 **OAuth Strategy**: Proxies to localhost:8082 for auth")
    print("📁 **Static Files**: Served from dist/ directory")
    print("🌐 **Same WiFi Required**: Make sure mobile device is on same network")
    print("⏹️  **Stop Server**: Press Ctrl+C")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
            print(f"✅ Proxy server running on all interfaces, port {PORT}")
            print(f"📂 Serving static files from: {os.path.join(fastplanner_dir, 'dist')}")
            print(f"🔄 Proxying auth/API requests to: http://localhost:8082")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 FastPlanner proxy server stopped!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
