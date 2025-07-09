#!/usr/bin/env python3
"""
HTTPS Proxy for iPad Testing with OAuth
Creates self-signed certificate for HTTPS support
"""

import http.server
import socketserver
import urllib.request
import ssl
import socket
import os
import subprocess
from urllib.error import HTTPError

def get_local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except:
        return "localhost"

def create_self_signed_cert(ip_address):
    """Create a self-signed certificate for the given IP address"""
    cert_file = "server.crt"
    key_file = "server.key"
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print("✅ Using existing certificate files")
        return cert_file, key_file
    
    print("🔐 Creating self-signed certificate...")
    
    # Create certificate with IP address
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:2048", 
        "-keyout", key_file, "-out", cert_file, 
        "-days", "365", "-nodes", "-subj", f"/CN={ip_address}",
        "-addext", f"subjectAltName=IP:{ip_address}"
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print("✅ Certificate created successfully")
        return cert_file, key_file
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create certificate: {e}")
        return None, None

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
                
                # Send headers with CORS
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
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == "__main__":
    PORT = 9443  # HTTPS port
    local_ip = get_local_ip()
    
    print("🚀 FastPlanner HTTPS Proxy")
    print("=" * 50)
    
    # Create certificate
    cert_file, key_file = create_self_signed_cert(local_ip)
    
    if not cert_file or not key_file:
        print("❌ Cannot create HTTPS server without certificate")
        exit(1)
    
    print(f"📱 iPad URL: https://{local_ip}:{PORT}/plan/")
    print(f"🔄 Proxying to: http://localhost:8080")
    print("🔐 HTTPS enabled for OAuth/CORS")
    print("⚠️  You'll need to accept the self-signed certificate")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
            # Add SSL
            context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            context.load_cert_chain(cert_file, key_file)
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            
            print(f"✅ HTTPS proxy running on port {PORT}")
            print("📋 On iPad, you'll need to:")
            print("   1. Accept the security warning")
            print("   2. Trust the certificate")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 HTTPS proxy stopped!")
    except Exception as e:
        print(f"❌ Error: {e}")