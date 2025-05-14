#!/bin/bash
# Wind Input Verification Script
# Created: May 6, 2025
# 
# This script helps verify the wind input system and provides
# quick restoration of the working branch if needed.

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Wind Input System Verification Tool${NC}"
echo -e "${BLUE}====================================${NC}"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Currently on branch:${NC} $CURRENT_BRANCH"

# Display current status of wind input files
echo -e "\n${YELLOW}Checking wind input files:${NC}"

FILES=(
  "src/components/fast-planner/FastPlannerApp.jsx"
  "src/components/fast-planner/components/panels/RightPanel.jsx"
  "src/components/fast-planner/components/panels/cards/MainCard.jsx"
  "src/components/fast-planner/components/panels/cards/WeatherCard.jsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
    
    # Check for key indicators that the fix is in place
    if [[ "$file" == *"MainCard.jsx" ]]; then
      if grep -q "normalizedDirection" "$file"; then
        echo -e "  ${GREEN}✓${NC} Contains wind direction normalization"
      else
        echo -e "  ${RED}✗${NC} Missing wind direction normalization!"
      fi
    fi
    
    if [[ "$file" == *"RightPanel.jsx" ]]; then
      if grep -q "weather={weather}" "$file" && grep -q "onWeatherUpdate={onWeatherUpdate}" "$file"; then
        echo -e "  ${GREEN}✓${NC} Passes weather props to MainCard"
      else
        echo -e "  ${RED}✗${NC} May not be passing weather props to MainCard!"
      fi
    fi
  else
    echo -e "${RED}✗${NC} $file is missing!"
  fi
done

# Check for documentation
if [ -f "docs/WIND_INPUT_SYSTEM.md" ]; then
  echo -e "${GREEN}✓${NC} Wind input documentation exists"
else
  echo -e "${RED}✗${NC} Wind input documentation is missing!"
fi

# Offer to restore working branch
echo -e "\n${YELLOW}Options:${NC}"
echo "1. Reset to known working wind input branch (wind-input-fix-may2025)"
echo "2. Reset to original working branch (working-wind-calculations)"
echo "3. Show diff between current state and working branch"
echo "4. Exit without changes"

read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo -e "\n${YELLOW}Resetting to wind-input-fix-may2025 branch...${NC}"
    git checkout wind-input-fix-may2025
    echo -e "${GREEN}Done! Now on branch:${NC} $(git branch --show-current)"
    ;;
  2)
    echo -e "\n${YELLOW}Resetting to working-wind-calculations branch...${NC}"
    git checkout working-wind-calculations
    echo -e "${GREEN}Done! Now on branch:${NC} $(git branch --show-current)"
    ;;
  3)
    echo -e "\n${YELLOW}Showing diff between current state and wind-input-fix-may2025 branch...${NC}"
    git diff wind-input-fix-may2025 -- "${FILES[@]}"
    ;;
  4)
    echo -e "\n${GREEN}Exiting without changes. Current branch:${NC} $CURRENT_BRANCH"
    ;;
  *)
    echo -e "\n${RED}Invalid choice. Exiting without changes.${NC}"
    ;;
esac

echo -e "\n${BLUE}=================${NC}"
echo -e "${BLUE}Verification Done${NC}"
echo -e "${BLUE}=================${NC}"

echo -e "\n${YELLOW}Remember to check:${NC}"
echo "1. Wind direction inputs in both cards update each other"
echo "2. Wind speed inputs in both cards update each other"
echo "3. Route calculations update with new wind values"

exit 0