#!/bin/bash

# Create a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.timefix-backup

# Apply the fix using sed
sed -i.bak '
/console.error.🔄 Received invalid route stats with zero time/,/return; \/\/ Don.t update with invalid stats/ c\
        console.error("🔄 Received invalid route stats with zero time:", stats);\
        \
        // FIXED: Add manual time calculation when timeHours is zero\
        if (stats \&\& stats.totalDistance \&\& selectedAircraft) {\
          console.log("🔄 ATTEMPTING FIX: Manually calculating timeHours");\
          const totalDistance = parseFloat(stats.totalDistance);\
          if (totalDistance > 0 \&\& selectedAircraft.cruiseSpeed > 0) {\
            stats.timeHours = totalDistance / selectedAircraft.cruiseSpeed;\
            const hours = Math.floor(stats.timeHours);\
            const minutes = Math.floor((stats.timeHours - hours) * 60);\
            stats.estimatedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;\
            console.log("🔄 Manual calculation results:", {\
              distance: totalDistance,\
              cruiseSpeed: selectedAircraft.cruiseSpeed,\
              timeHours: stats.timeHours,\
              estimatedTime: stats.estimatedTime\
            });\
            // Continue processing with the fixed stats\
          } else {\
            console.error("🔄 Cannot fix time calculation: Invalid distance or cruise speed");\
            return; // Don'\''t update with invalid stats\
          }\
        } else {\
          console.error("🔄 Cannot fix time calculation: Missing required data");\
          return; // Don'\''t update with invalid stats\
        }
' /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Fix applied. A backup was created at FastPlannerApp.jsx.timefix-backup"
