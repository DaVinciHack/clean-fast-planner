#!/bin/bash

# Glass Dock Connected Checkpoint Restore Script
# Run this script to restore the fully connected glass dock state

echo "🔄 Restoring Glass Dock Connected Checkpoint..."

# Restore FastPlannerApp.jsx
echo "📁 Restoring FastPlannerApp.jsx..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_connected/FastPlannerApp.jsx" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx"

# Restore RightPanel.jsx  
echo "📁 Restoring RightPanel.jsx..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_connected/RightPanel.jsx" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/components/panels/RightPanel.jsx"

# Restore GlassMenuDock.jsx
echo "📁 Restoring GlassMenuDock.jsx..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_connected/GlassMenuDock.jsx" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/components/controls/GlassMenuDock.jsx"

# Restore GlassMenuDock.css
echo "📁 Restoring GlassMenuDock.css..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_connected/GlassMenuDock.css" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/components/controls/GlassMenuDock.css"

echo "✅ Glass Dock Connected Checkpoint Restored Successfully!"
echo ""
echo "The following files have been restored:"
echo "- FastPlannerApp.jsx (card handlers & refs)"
echo "- RightPanel.jsx (forwardRef with useImperativeHandle)"
echo "- GlassMenuDock.jsx (connected functionality)"  
echo "- GlassMenuDock.css (responsive styling)"
echo ""
echo "Your glass dock should now be fully functional with:"
echo "- Always visible expandable dock"
echo "- All buttons connected to cards"
echo "- Automatic panel opening"
echo "- Smooth animations"
echo "- Responsive design"
echo ""
echo "🚀 Ready to tackle the next development challenge!"
