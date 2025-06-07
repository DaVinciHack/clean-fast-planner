// Fix waypoint vs. stop issue

// Function to monitor ComprehensiveFuelCalculator and patch it
function patchComprehensiveFuelCalculator() {
  console.log('🔍 Checking ComprehensiveFuelCalculator for patch...');
  
  // Define a function to check if the patch is needed
  const needsPatch = () => {
    // Get ComprehensiveFuelCalculator from window
    const calculator = window.ComprehensiveFuelCalculator;
    
    if (!calculator || !calculator.calculateAllFuelData) {
      console.log('⚠️ ComprehensiveFuelCalculator not found or missing calculateAllFuelData method');
      return false;
    }
    
    // Check if the function body contains filtering for waypoints
    const fnStr = calculator.calculateAllFuelData.toString();
    
    // If the function already filters based on pointType or isWaypoint, no patch needed
    if (fnStr.includes('pointType') || fnStr.includes('filter(wp => !wp.isWaypoint)')) {
      console.log('✅ ComprehensiveFuelCalculator already has waypoint filtering');
      return false;
    }
    
    console.log('🔧 ComprehensiveFuel