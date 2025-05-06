#!/bin/bash
# Cleanup Verification Script

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Fast Planner V3 Cleanup Verification${NC}"
echo -e "${BLUE}====================================${NC}"

# Check if key files exist
echo -e "\n${YELLOW}Checking key files:${NC}"

KEY_FILES=(
  "src/components/fast-planner/FastPlannerApp.jsx"
  "src/pages/FastPlannerPage.jsx"
  "src/client.ts"
)

for file in "${KEY_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${RED}✗${NC} $file is missing!"
  fi
done

# Check if old files are properly moved
echo -e "\n${YELLOW}Checking that old files are moved:${NC}"

OLD_FILES=(
  "src/_old_components/_old_ModularFastPlannerComponent.jsx"
  "src/_old_components/FastPlannerWithContexts.jsx"
  "src/_old_components/FastPlannerWithRegionContext.jsx"
)

for file in "${OLD_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file moved to _old_components"
  else
    echo -e "${RED}✗${NC} $file not found in _old_components"
  fi
done

# Check for localhost references in client.ts
echo -e "\n${YELLOW}Checking for hardcoded localhost references:${NC}"
if grep -q "getRedirectUrl" "src/client.ts"; then
  echo -e "${GREEN}✓${NC} client.ts uses dynamic redirect URL"
else
  echo -e "${RED}✗${NC} client.ts may still use hardcoded localhost"
fi

# Check if FastPlannerPage only imports FastPlannerApp
echo -e "\n${YELLOW}Checking FastPlannerPage imports:${NC}"
if grep -q "ModularFastPlannerComponent" "src/pages/FastPlannerPage.jsx"; then
  echo -e "${RED}✗${NC} FastPlannerPage still imports old components"
else
  echo -e "${GREEN}✓${NC} FastPlannerPage only imports FastPlannerApp"
fi

echo -e "\n${BLUE}=================${NC}"
echo -e "${BLUE}Verification Done${NC}"
echo -e "${BLUE}=================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Start the application to verify it works (npm run dev)"
echo "2. Check that authentication works with the dynamic redirect URL"
echo "3. Create a route and verify wind inputs still function properly"
echo "4. Continue with the next phase of cleanup if everything works"

exit 0