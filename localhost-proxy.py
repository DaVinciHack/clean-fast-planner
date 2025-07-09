#!/usr/bin/env python3
"""
Localhost Proxy for iPad Testing
Makes iPad requests appear to come from localhost:8080
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

class LocalhostProxyHandler(http.server.BaseHTTPRequestHandler):
    
    def do_GET(self):
        self.proxy_request()
    
    def do_POST(self):
        self.proxy_request()
    
    def do_OPTIONS(self):
        self.proxy_request()
    
    def proxy_request(self):
        # Forward to localhost:8080 and make it think request came from localhost
        target_url = f"http://localhost:8080{self.path}"
        
        try:
            # Build headers - key is to set Host to localhost:8080
            headers = {
                'Host': 'localhost:8080',
                'Origin': 'http://localhost:8080',
                'Referer': 'http://localhost:8080/plan/'
            }
            
            # Copy other headers except host/origin
            for name, value in self.headers.items():
                if name.lower() not in ['host', 'origin', 'referer']:
                    headers[name] = value
            
            # Handle request body
            data = None
            if self.command in ['POST', 'PUT']:
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
                
                self.end_headers()
                
                # Send body
                self.wfile.write(response.read())
                
        except HTTPError as e:
            self.send_error(e.code, str(e))
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == "__main__":
    PORT = 9080
    local_ip = get_local_ip()
    
    print("🚀 FastPlanner Localhost Proxy")
    print("=" * 50)
    print(f"📱 iPad URL: http://{local_ip}:{PORT}/plan/")
    print(f"🔄 Proxying to: http://localhost:8080")
    print("🎭 Masquerading as localhost:8080")
    print("✅ Should bypass CORS restrictions")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), LocalhostProxyHandler) as httpd:
            print(f"✅ Localhost proxy running on port {PORT}")
            print("🔗 iPad requests will appear to come from localhost")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Localhost proxy stopped!")
    except Exception as e:
        print(f"❌ Error: {e}")