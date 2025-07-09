#!/usr/bin/env python3
"""
Simple HTTP server for iPad testing
"""

import http.server
import socketserver
import os

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 9001

print(f"🚀 Starting server on port {PORT}")
print(f"📱 Open this URL on your iPad: http://YOUR_IP_ADDRESS:{PORT}")
print("🌐 To find your IP address, run: ifconfig | grep inet")
print("⏹️  Press Ctrl+C to stop")

try:
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n👋 Server stopped!")
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Try a different port if this one is in use")
