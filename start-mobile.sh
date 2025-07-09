#!/bin/bash

echo "🚀 Starting FastPlanner Mobile Test Server..."
echo ""

cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV5

# Check if we need to build
if [ ! -d "dist" ]; then
    echo "📁 Building FastPlanner first..."
    npm run build
fi

# Start the mobile server
python3 mobile-server.py
