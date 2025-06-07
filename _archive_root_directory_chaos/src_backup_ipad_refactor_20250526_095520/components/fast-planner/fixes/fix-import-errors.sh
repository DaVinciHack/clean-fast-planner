#!/bin/bash

# This script fixes import statements in FastPlannerApp.jsx that are incorrectly placed
# inside the component body instead of at the top level.

# Set script to exit on error
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
APP_FILE="$APP_DIR/FastPlannerApp.jsx"
BACKUP_FILE="${APP_FILE}.import-fix-backup-$(date +%Y%m%d%H%M%S)"

# Create a backup of the file
echo "Creating backup at $BACKUP_FILE"
cp "$APP_FILE" "$BACKUP_FILE"

# Check for misplaced imports
if grep -q "import '\.\/fixes\/" "$APP_FILE"; then
    echo "Found potentially misplaced imports in $APP_FILE"
    
    # Create a temporary file for the fix script
    TMP_SCRIPT="$SCRIPT_DIR/temp/fix-imports.cjs"
    mkdir -p "$(dirname "$TMP_SCRIPT")"
    
    # Write the Node.js script to fix imports
    cat > "$TMP_SCRIPT" << 'EOF'
const fs = require('fs');
const path = require('path');

// File to process
const filePath = process.argv[2];

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find all import statements in the file
const allImports = [...content.matchAll(/import [^;]+;/g)];
const topLevelImportEndPos = allImports.reduce((lastPos, match) => {
  // Only consider imports at the top of the file (before the first component definition)
  if (match.index < content.indexOf('const FastPlannerApp = () => {')) {
    return Math.max(lastPos, match.index + match[0].length);
  }
  return lastPos;
}, 0);

// Find misplaced imports (especially the fix imports)
const fixImportsRegex = /\/\/ Import waypoint functionality fixes[\s\S]*?import '\.\/fixes\/[^']+';(\s*import '\.\/fixes\/[^']+';)*(\s*)/;
const match = content.match(fixImportsRegex);

if (match) {
  // Remove the imports from their current position
  const importBlock = match[0];
  const fixedContent = content.replace(fixImportsRegex, '');
  
  // Add the imports at the top level, after the last top-level import
  const newContent = 
    fixedContent.substring(0, topLevelImportEndPos) + 
    '\n\n' + importBlock + 
    fixedContent.substring(topLevelImportEndPos);
  
  // Write the file back
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Imports have been moved to the top level of the module');
} else {
  console.log('No waypoint fix imports found in incorrect locations');
}
EOF
    
    # Run the Node.js script
    echo "Running fix script..."
    node "$TMP_SCRIPT" "$APP_FILE"
    
    # Clean up
    rm "$TMP_SCRIPT"
    
    echo "Done! Import statements have been fixed."
else
    echo "No misplaced imports found in $APP_FILE"
fi
