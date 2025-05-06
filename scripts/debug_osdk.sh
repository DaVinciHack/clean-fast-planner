#!/bin/bash

# Debug OSDK Script
# This script helps identify issues with OSDK integration in the Fast Planner application

echo "==== OSDK Debugging Tool ===="
echo "Running diagnostics on Fast Planner V3..."

# Check if node_modules exist and OSDK packages are installed
echo -e "\n=== Checking OSDK Package Installation ==="
if [ -d "node_modules/@osdk" ]; then
  echo "✅ @osdk directory found in node_modules"
  
  # Check for specific OSDK packages
  for package in "@osdk/client" "@osdk/oauth" "@osdk/foundry.admin"; do
    if [ -d "node_modules/$package" ]; then
      echo "✅ $package is installed"
      
      # Check package.json version
      if [ -f "node_modules/$package/package.json" ]; then
        version=$(grep -m 1 '"version"' "node_modules/$package/package.json" | cut -d '"' -f 4)
        echo "   - Version: $version"
      fi
    else
      echo "❌ $package is NOT installed"
      echo "   - Run 'npm install $package' to fix this issue"
    fi
  done
  
  # Check @flight-app/sdk
  if [ -d "node_modules/@flight-app/sdk" ]; then
    echo "✅ @flight-app/sdk is installed"
    
    # Check package.json version
    if [ -f "node_modules/@flight-app/sdk/package.json" ]; then
      version=$(grep -m 1 '"version"' "node_modules/@flight-app/sdk/package.json" | cut -d '"' -f 4)
      echo "   - Version: $version"
    fi
  else
    echo "❌ @flight-app/sdk is NOT installed"
    echo "   - This package is required for the OSDK connection"
  fi
else
  echo "❌ @osdk directory NOT found in node_modules"
  echo "   - Run 'npm install' to install all dependencies"
fi

# Check vite.config.ts for OSDK configuration
echo -e "\n=== Checking Vite Configuration ==="
if [ -f "vite.config.ts" ]; then
  echo "✅ vite.config.ts found"
  
  # Check if optimize deps includes OSDK packages
  if grep -q "optimizeDeps" "vite.config.ts" && grep -q "@osdk/client" "vite.config.ts"; then
    echo "✅ OSDK packages included in optimizeDeps"
  else
    echo "❌ OSDK packages might not be properly included in optimizeDeps"
    echo "   - Check vite.config.ts and ensure @osdk packages are in the optimizeDeps section"
  fi
  
  # Check if manual chunks include OSDK packages
  if grep -q "manualChunks" "vite.config.ts" && grep -q "osdk" "vite.config.ts"; then
    echo "✅ OSDK packages included in manual chunks"
  else
    echo "⚠️ Manual chunks configuration not found for OSDK packages"
    echo "   - Consider adding manual chunks configuration for better bundle organization"
  fi
else
  echo "❌ vite.config.ts NOT found"
  echo "   - This file is essential for proper Vite configuration"
fi

# Check client.ts file
echo -e "\n=== Checking OSDK Client Configuration ==="
if [ -f "src/client.ts" ]; then
  echo "✅ client.ts found in src directory"
  
  # Check for proper imports
  if grep -q "import { Client, createClient } from \"@osdk/client\"" "src/client.ts"; then
    echo "✅ OSDK client import found"
  else
    echo "❌ OSDK client import missing or incorrect"
    echo "   - Check the imports in client.ts for proper OSDK client import"
  fi
  
  # Check for auth import
  if grep -q "import { createPublicOauthClient } from \"@osdk/oauth\"" "src/client.ts"; then
    echo "✅ OSDK OAuth import found"
  else
    echo "❌ OSDK OAuth import missing or incorrect"
    echo "   - Check the imports in client.ts for proper OSDK OAuth import"
  fi
  
  # Check for ontology import
  if grep -q "import { \$ontologyRid } from \"@flight-app/sdk\"" "src/client.ts"; then
    echo "✅ Flight app SDK import found"
  else
    echo "❌ Flight app SDK import missing or incorrect"
    echo "   - Check the imports in client.ts for proper Flight app SDK import"
  fi
  
  # Check for console logging
  if grep -q "console.log" "src/client.ts"; then
    echo "✅ Console logging found in client.ts"
    echo "   - This will help with debugging OSDK connection issues"
  else
    echo "⚠️ No console logging found in client.ts"
    echo "   - Consider adding console logging for debugging purposes"
  fi
  
  # Check for try/catch blocks
  if grep -q "try {" "src/client.ts" && grep -q "catch" "src/client.ts"; then
    echo "✅ Try/catch error handling found in client.ts"
  else
    echo "⚠️ No try/catch error handling found in client.ts"
    echo "   - Consider adding error handling for better debugging"
  fi
else
  echo "❌ client.ts NOT found in src directory"
  echo "   - This file is essential for OSDK connection"
fi

# Check for OSDK debugger component
echo -e "\n=== Checking OSDK Debugger ==="
if [ -f "src/components/OSDKDebugger.jsx" ]; then
  echo "✅ OSDKDebugger component found"
else
  echo "❌ OSDKDebugger component NOT found"
  echo "   - This component can help diagnose OSDK connection issues"
fi

# Check for debugger route in App.tsx
echo -e "\n=== Checking App Component ==="
if [ -f "src/App.tsx" ] && grep -q "OSDKDebugger" "src/App.tsx"; then
  echo "✅ OSDKDebugger component imported in App.tsx"
  
  if grep -q "/debug" "src/App.tsx"; then
    echo "✅ Debug route configured in App.tsx"
    echo "   - You can access the debugger at http://localhost:8080/debug"
  else
    echo "❌ Debug route NOT configured in App.tsx"
    echo "   - The debugger component is imported but not accessible via a route"
  fi
else
  echo "⚠️ OSDKDebugger component not imported in App.tsx"
  echo "   - Consider adding the debugger to help diagnose issues"
fi

# Analyze built files
echo -e "\n=== Analyzing Built Files ==="

if [ -d "dist" ]; then
  echo "✅ Build directory (dist) found"
  
  # Check if OSDK client is included in built files
  if grep -r "@osdk/client" "dist" --include="*.js" > /dev/null; then
    echo "✅ @osdk/client references found in built files"
  else
    echo "❌ No @osdk/client references found in built files"
    echo "   - This may indicate a build issue with OSDK packages"
  fi
  
  # Check for sourcemaps
  if ls dist/*.map 1> /dev/null 2>&1; then
    echo "✅ Source maps found in build directory"
    echo "   - This will help with debugging"
  else
    echo "⚠️ No source maps found in build directory"
    echo "   - Consider enabling source maps in the build for better debugging"
  fi
else
  echo "⚠️ Build directory (dist) not found"
  echo "   - Run 'npm run build' to create a production build"
fi

# Final recommendations
echo -e "\n=== Recommendations ==="
echo "1. Access the OSDK Debugger at http://localhost:8080/debug to run interactive tests"
echo "2. Make sure all OSDK packages are properly imported and exported in client.ts"
echo "3. Check the browser console when running the app for any OSDK-related errors"
echo "4. Ensure the vite.config.ts includes all OSDK packages in optimizeDeps"
echo "5. Add appropriate CORS settings in your Palantir Foundry instance"

echo -e "\n=== Done ==="
