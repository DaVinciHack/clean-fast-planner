#!/bin/bash

# restart-server.sh
#
# This script applies the waypoint vs. stop distinction fix by restarting the server.

echo "Applying waypoint vs. stop distinction fix..."
echo "Restarting server to apply changes..."

# Kill the current server process (this will find the vite process)
echo "Stopping current server process..."
pkill -f "vite" || echo "No server process found"

# Wait a moment
sleep 2

# Change to the project directory
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV5

# Start the server in the background
echo "Starting new server with fixed code..."
npm run dev &

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Show success message
echo "Server restarted with waypoint vs. stop distinction fix applied!"
echo "Open http://localhost:8080 in your browser to see the changes."
echo ""
echo "The fix addresses the following issues:"
echo "- Navigation waypoints are properly distinguished from landing stops"
echo "- Stop cards are only generated for landing stops, not navigation waypoints"
echo "- Fuel calculations only consider landing stops, not navigation waypoints"
echo "- Waypoints and stops have different visual styling"
echo ""
echo "If you encounter any issues, please check the browser console for error messages."
