#!/bin/bash

# Glass Dock Checkpoint Restore Script
# Run this script to restore the working glass dock state

echo "🔄 Restoring Glass Dock Checkpoint..."

# Restore FastPlannerApp.jsx
echo "📁 Restoring FastPlannerApp.jsx..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_working/FastPlannerApp.jsx" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/FastPlannerApp.jsx"

# Restore GlassMenuDock.jsx
echo "📁 Restoring GlassMenuDock.jsx..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_working/GlassMenuDock.jsx" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/components/controls/GlassMenuDock.jsx"

# Restore GlassMenuDock.css
echo "📁 Restoring GlassMenuDock.css..."
cp "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/_checkpoint_glass_dock_working/GlassMenuDock.css" "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/components/controls/GlassMenuDock.css"

echo "✅ Glass Dock Checkpoint Restored Successfully!"
echo ""
echo "The following files have been restored:"
echo "- FastPlannerApp.jsx (always-visible dock)"
echo "- GlassMenuDock.jsx (expandable functionality)"  
echo "- GlassMenuDock.css (responsive styling)"
echo ""
echo "Your glass dock should now be back to the working state with:"
echo "- Always visible dock"
echo "- Expandable horizontal design"
echo "- Clean button styling (round Lock/Close, rectangular others)"
echo "- Responsive design for all screen sizes"
echo ""
echo "Ready to continue development from this stable checkpoint!"
