#!/usr/bin/env python3
"""
FastPlanner Mobile Test Server
Serves FastPlanner on network for iPad/iPhone testing
"""

import http.server
import socketserver
import os
import sys
import subprocess

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

def build_fastplanner():
    """Build FastPlanner for production"""
    print("🔨 Building FastPlanner...")
    try:
        result = subprocess.run(["npm", "run", "build"], 
                              capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            print("✅ Build successful!")
            return True
        else:
            print(f"❌ Build failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Build timed out after 2 minutes")
        return False
    except FileNotFoundError:
        print("❌ npm not found. Make sure Node.js is installed.")
        return False

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve from the dist directory
        super().__init__(*args, directory=os.path.join(fastplanner_dir, "dist"), **kwargs)

    def do_GET(self):
        # Handle /plan/ path routing for FastPlanner
        if self.path.startswith('/plan/'):
            # Remove /plan prefix
            self.path = self.path[5:]
            if not self.path or self.path == '/':
                self.path = '/index.html'
        elif self.path == '/':
            # Redirect root to /plan/
            self.send_response(302)
            self.send_header('Location', '/plan/')
            self.end_headers()
            return
            
        # Call parent handler
        super().do_GET()

    def end_headers(self):
        # Add CORS headers to allow access from mobile devices
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom logging to show mobile-friendly info
        super().log_message(format, *args)

if __name__ == "__main__":
    PORT = 9090  # Use a high port that's definitely free
    local_ip = get_local_ip()
    
    print("🚀 FastPlanner Mobile Test Server")
    print("=" * 50)
    
    # Check if dist directory exists, if not, build
    dist_dir = os.path.join(fastplanner_dir, "dist")
    if not os.path.exists(dist_dir):
        print("📁 No dist directory found, building FastPlanner...")
        if not build_fastplanner():
            print("❌ Cannot start server without successful build")
            sys.exit(1)
    else:
        print("📁 Using existing dist directory")
        
    print(f"📱 **iPad/iPhone URL**: http://{local_ip}:{PORT}/plan/")
    print(f"🖥️  **Desktop URL**: http://localhost:{PORT}/plan/")
    print("")
    print("🔐 **OSDK Authentication**: Will work automatically!")
    print("🌐 **Same WiFi Required**: Make sure mobile device is on same network")
    print("⏹️  **Stop Server**: Press Ctrl+C")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"✅ Server running on all interfaces, port {PORT}")
            print(f"📂 Serving from: {dist_dir}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 FastPlanner server stopped!")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
