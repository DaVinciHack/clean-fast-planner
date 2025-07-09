#!/bin/bash

# Quick start script for the drag test server
# Run this to start testing on both desktop and iPad

echo "🚀 Starting Mapbox Drag Test..."
echo ""

cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3."
    exit 1
fi

echo "🐍 Python 3 found: $(python3 --version)"
echo ""

# Start the server
echo "🌐 Starting server..."
python3 server.py
