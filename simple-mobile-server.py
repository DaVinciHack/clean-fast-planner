#!/usr/bin/env python3
"""
Simple Mobile Server for FastPlanner iPad Testing
Serves the built dist files directly with proper paths
"""

import http.server
import socketserver
import os
import socket

# Get local IP
def get_local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except:
        return "localhost"

# Change to dist directory
os.chdir("/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/dist")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle root redirect
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/plan/')
            self.end_headers()
            return
            
        # Handle /plan/ paths
        if self.path.startswith('/plan/'):
            # Remove /plan prefix
            self.path = self.path[5:]
            if not self.path or self.path == '/':
                self.path = '/index.html'
        
        # Serve the file
        super().do_GET()
    
    def end_headers(self):
        # Add headers for mobile compatibility
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == "__main__":
    PORT = 9091
    local_ip = get_local_ip()
    
    print("📱 FastPlanner Mobile Server")
    print("=" * 40)
    print(f"🌐 iPad/iPhone URL: http://{local_ip}:{PORT}/plan/")
    print(f"💻 Desktop URL: http://localhost:{PORT}/plan/")
    print("📁 Serving from: dist/ directory")
    print("⚠️  OAuth will use localhost callbacks")
    print("🔗 Same WiFi network required")
    print("=" * 40)
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print(f"✅ Server running on port {PORT}")
            print("Press Ctrl+C to stop")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
    except Exception as e:
        print(f"❌ Error: {e}")