#!/bin/bash

# start-clean.sh - Start the application with the clean implementation

# Directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📢 Starting Fast Planner with clean implementation..."

# Check if any process is running on port 8080
if lsof -i:8080 > /dev/null; then
  echo "⚠️  Port 8080 is already in use. Stopping the existing process..."
  lsof -t -i:8080 | xargs kill -9
  echo "✅ Stopped existing process on port 8080"
  # Wait a bit for the port to be released
  sleep 2
fi

# Change to the project directory
cd "$SCRIPT_DIR/../.."

# Verify the necessary files exist
if [ ! -f "./src/components/fast-planner/modules/MapInteractions.js" ] || 
   [ ! -f "./src/components/fast-planner/modules/WaypointInteractions.js" ] || 
   [ ! -f "./src/components/fast-planner/modules/InteractionController.js" ]; then
  echo "❌ Clean implementation files are missing. Make sure you've created the necessary modules."
  exit 1
fi

echo "✅ Clean implementation files are present"

# Start the application with dev mode
echo "🚀 Starting the application..."
npm run dev

# This script won't reach this point unless the npm command fails or is interrupted
echo "❌ Application stopped unexpectedly"
exit 1