/**
 * Quick test to verify PDF module integration
 */

import { PDFButton, PDFReportGenerator, FlightDataProcessor } from '../modules/pdf';

// Test data
const testFlightData = {
  waypoints: [
    { name: "KLCH", coordinates: [-93.2228, 30.1258] },
    { name: "KHUM", coordinates: [-90.6622, 29.5704] }
  ],
  selectedAircraft: {
    type: "Bell 407",
    registration: "N109DR",
    maxPassengers: 6
  },
  routeStats: {
    totalDistance: 150,
    totalTime: 90,
    totalFuel: 250
  }
};

console.log('✅ PDF Module Integration Test - All imports successful!');
console.log('📄 PDFButton available:', !!PDFButton);
console.log('📋 PDFReportGenerator available:', !!PDFReportGenerator);  
console.log('🔧 FlightDataProcessor available:', !!FlightDataProcessor);

// Test data processing
const processor = new FlightDataProcessor();
const processedData = processor.processFlightData(
  testFlightData.routeStats,
  null,
  testFlightData.selectedAircraft,
  testFlightData.waypoints
);

console.log('🧪 Test processed data:', processedData);
console.log('✅ PDF Module Integration Test Complete!');
