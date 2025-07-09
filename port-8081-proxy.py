#!/usr/bin/env python3
"""
HTTP Proxy on Port 8081 for iPad Testing
Uses port 8081 which is already in your CORS list
"""

import http.server
import socketserver
import urllib.request
import socket
from urllib.error import HTTPError

def get_local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except:
        return "localhost"

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    
    def do_GET(self):
        self.proxy_request()
    
    def do_POST(self):
        self.proxy_request()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
    
    def proxy_request(self):
        # Forward everything to localhost:8080
        target_url = f"http://localhost:8080{self.path}"
        
        try:
            # Copy headers (excluding host)
            headers = {}
            for name, value in self.headers.items():
                if name.lower() not in ['host']:
                    headers[name] = value
            
            # Handle POST data
            data = None
            if self.command == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    data = self.rfile.read(content_length)
            
            # Make request
            req = urllib.request.Request(target_url, data=data, headers=headers, method=self.command)
            
            with urllib.request.urlopen(req) as response:
                # Send status
                self.send_response(response.status)
                
                # Send headers
                for name, value in response.headers.items():
                    self.send_header(name, value)
                
                # Add CORS headers
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', '*')
                
                self.end_headers()
                
                # Send body
                self.wfile.write(response.read())
                
        except HTTPError as e:
            self.send_error(e.code, str(e))
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == "__main__":
    PORT = 3000  # Use port 3000 which is already in CORS
    local_ip = get_local_ip()
    
    print("🚀 FastPlanner HTTP Proxy (Port 3000)")
    print("=" * 50)
    print(f"📱 iPad URL: http://{local_ip}:{PORT}/plan/")
    print(f"🔄 Proxying to: http://localhost:8080")
    print("✅ Using port 3000 (already in CORS)")
    print("✅ HTTP (no certificate needed)")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
            print(f"✅ HTTP proxy running on port {PORT}")
            print("🔗 No certificate warnings on iPad!")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 HTTP proxy stopped!")
    except Exception as e:
        print(f"❌ Error: {e}")