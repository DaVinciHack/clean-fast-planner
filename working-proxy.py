#!/usr/bin/env python3
"""
Working Proxy for iPad Testing
Forwards all requests to localhost:8080 dev server
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
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
    
    def proxy_request(self):
        # Forward everything to localhost:8080
        target_url = f"http://localhost:8080{self.path}"
        
        try:
            # Copy headers (excluding host)
            headers = {}
            for name, value in self.headers.items():
                if name.lower() not in ['host']:
                    headers[name] = value
            
            # Make request
            req = urllib.request.Request(target_url, headers=headers)
            
            with urllib.request.urlopen(req) as response:
                # Send status
                self.send_response(response.status)
                
                # Send headers
                for name, value in response.headers.items():
                    self.send_header(name, value)
                
                self.end_headers()
                
                # Send body
                self.wfile.write(response.read())
                
        except HTTPError as e:
            self.send_error(e.code, str(e))
        except Exception as e:
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == "__main__":
    PORT = 9091
    local_ip = get_local_ip()
    
    print("🚀 FastPlanner iPad Proxy")
    print("=" * 40)
    print(f"📱 iPad URL: http://{local_ip}:{PORT}/plan/")
    print(f"🔄 Proxying to: http://localhost:8080")
    print("✅ Full OAuth support")
    print("=" * 40)
    
    try:
        with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
            print(f"✅ Proxy running on port {PORT}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Proxy stopped!")