/**
 * DetailedFuelBreakdown.jsx
 * 
 * Professional fuel breakdown modal designed for tablet and mobile viewing.
 * Mimics Palantir's fuel breakdown interface with responsive design.
 * Accessible from MainCard where "ROUTE STOPS (UNIFIED FUEL)" is displayed.
 */

import React, { useState, useMemo } from 'react';
import FuelSaveBackService from '../../services/FuelSaveBackService';
import StopCardCalculator from '../../modules/calculations/flight/StopCardCalculator';

const DetailedFuelBreakdown = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  currentFlightId = null,
  alternateRouteData = null,
  alternateStopCard = null,
  waypoints = [],
  weather = { windSpeed: 0, windDirection: 0 }
}) => {
  // Remove tab switching - show combined view
  
  // Clean up fuel components text to remove duplicates and format nicely
  const cleanupFuelComponents = (componentText) => {
    if (!componentText || componentText === 'No breakdown available') {
      return componentText;
    }
    
    // Split by common separators and clean up duplicates
    const parts = componentText.split(/[,\s]+/).filter(part => part.length > 0);
    const seen = new Set();
    const cleaned = [];
    
    for (const part of parts) {
      // Extract fuel type and amount (e.g., "Trip:1114" -> "Trip")
      const match = part.match(/^([A-Za-z]+):/);
      if (match) {
        const fuelType = match[1];
        if (!seen.has(fuelType)) {
          seen.add(fuelType);
          cleaned.push(part);
        }
      } else {
        cleaned.push(part);
      }
    }
    
    return cleaned.join(' ');
  };

  // Calculate fuel breakdown data
  const fuelData = useMemo(() => {
    if (!stopCards || stopCards.length === 0) {
      return { stopBreakdown: [], minimalFuel: null, hasData: false };
    }
    
    // Process stop cards for detailed breakdown
    const stopBreakdown = stopCards.map((card, index) => {
      // Calculate refuel amount needed
      let refuelAmount = 0;
      let refuelText = '-';
      
      if (card.refuelMode === true && index > 0) {
        // For refuel stops, the refuel amount is the difference between what's needed and what's available
        // Look at the Required Fuel vs what would be available without refueling
        const requiredFuel = Math.round(card.totalFuel || 0);
        
        // For a refuel stop, we need to find how much fuel was actually consumed to get here
        // and how much more is needed to continue. The refuel amount is what needs to be added.
        
        // If this is marked as a refuel stop, it means we NEED to refuel here
        // The card.totalFuel shows the minimum fuel needed to continue from here
        // So the refuel amount should be showing this as the minimum to add
        
        refuelText = `Minimum +${requiredFuel.toLocaleString()} lbs to continue`;
        console.log(`🛩️ REFUEL CALC: Stop ${card.stopName} needs minimum ${requiredFuel} lbs to continue`);
      }
      
      return {
        stop: card.stopName || card.name || `Stop ${index + 1}`,
        requiredFuel: Math.round(card.totalFuel || 0),
        maxPassengers: typeof card.maxPassengers === 'string' ? card.maxPassengers : 
                       card.maxPassengers !== null && card.maxPassengers !== undefined ? 
                       `${card.maxPassengers} (${Math.round((card.maxPassengers * (flightSettings.passengerWeight || 220)) || 0)} Lbs)` : 
                       'Final Stop',
        fuelComponents: cleanupFuelComponents(card.componentText || card.fuelComponents || 'No breakdown available'),
        refuelAmount: refuelText,
        isRefuel: card.refuelMode === true,
        isDestination: card.isDestination === true,
        isDeparture: index === 0
      };
    });
    
    // Use the alternateStopCard passed from the app level
    let minimalFuel = null;
    if (alternateStopCard) {
      console.log('🔍 DEBUG: Using alternate stop card from app level:', {
        totalFuel: alternateStopCard.totalFuel,
        totalDistance: alternateStopCard.totalDistance,
        totalTime: alternateStopCard.totalTime,
        totalTimeType: typeof alternateStopCard.totalTime,
        maxPassengers: alternateStopCard.maxPassengers,
        maxPassengersDisplay: alternateStopCard.maxPassengersDisplay,
        componentText: alternateStopCard.componentText,
        fuelComponents: alternateStopCard.fuelComponents,
        routeDescription: alternateStopCard.routeDescription,
        timeCalculation: `${Math.floor((alternateStopCard.totalTime || 0) / 60)}:${((alternateStopCard.totalTime || 0) % 60).toString().padStart(2, '0')}`,
        fullCard: alternateStopCard
      });
      
      // Parse fuel components to extract reserve, contingency, and extra fuel
      const componentText = alternateStopCard.componentText || alternateStopCard.fuelComponents || '';
      console.log('🔍 DEBUG: Parsing alternate fuel components:', componentText);
      
      // Extract fuel values from component text (e.g., "Res:475 Extra:200")
      const reserveMatch = componentText.match(/Res:(\d+)/);
      const contingencyMatch = componentText.match(/Cont:(\d+)/);
      const extraMatch = componentText.match(/Extra:(\d+)/);
      
      const reserveFuel = reserveMatch ? parseInt(reserveMatch[1]) : 0;
      const contingencyFuel = contingencyMatch ? parseInt(contingencyMatch[1]) : 0; 
      const extraFuel = extraMatch ? parseInt(extraMatch[1]) : 0;
      const expectedLandingFuel = reserveFuel + contingencyFuel + extraFuel;
      
      console.log('🔍 DEBUG: Alternate fuel breakdown:', {
        reserve: reserveFuel,
        contingency: contingencyFuel,
        extra: extraFuel,
        expectedLanding: expectedLandingFuel
      });

      minimalFuel = {
        requiredFuel: Math.round(alternateStopCard.totalFuel || 0),
        maxPassengers: alternateStopCard.maxPassengersDisplay || alternateStopCard.maxPassengers || 'Unknown',
        fuelComponents: cleanupFuelComponents(componentText || 'Trip fuel + Reserves + Contingency'),
        route: alternateStopCard.routeDescription || alternateRouteData?.name || 'Alternate route',
        distance: Math.round(alternateStopCard.totalDistance || 0),
        time: Math.round(alternateStopCard.totalTime || 0), // Time in minutes
        timeFormatted: alternateStopCard.totalTime ? (() => {
          const rawTime = alternateStopCard.totalTime;
          console.log('🕐 TIME DEBUG - Raw value:', rawTime, 'Type:', typeof rawTime);
          
          // Check if time is in hours (like 1.6) or minutes (like 96)
          let totalMinutes;
          if (rawTime < 10) {
            // Likely in hours (e.g., 1.6 hours = 96 minutes)
            totalMinutes = Math.round(rawTime * 60);
            console.log('🕐 TIME DEBUG - Treating as HOURS:', rawTime, 'hours =', totalMinutes, 'minutes');
          } else {
            // Likely in minutes
            totalMinutes = Math.round(rawTime);
            console.log('🕐 TIME DEBUG - Treating as MINUTES:', totalMinutes, 'minutes');
          }
          
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          console.log('🕐 TIME DEBUG - Final:', { hours, minutes, formatted: `${hours}:${minutes.toString().padStart(2, '0')}` });
          return `${hours}:${minutes.toString().padStart(2, '0')}`;
        })() : 'Unknown',
        contingencyFuel: contingencyFuel,
        reserveFuel: reserveFuel,
        extraFuel: extraFuel,
        expectedLandingFuel: expectedLandingFuel
      };
    }
    
    return { stopBreakdown, minimalFuel, hasData: true };
  }, [stopCards, flightSettings, alternateStopCard]);
  
  // Save flight function - saves complete flight without automation
  const handleSaveFlight = async () => {
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      alert('Please select an aircraft and add waypoints before saving.');
      return;
    }
    
    try {
      // Import SaveFlightButton functionality
      const { saveFlightData } = await import('../controls/SaveFlightButton');
      
      // Create flight data object with current settings
      const flightData = {
        // Use existing flight name/time or generate defaults
        flightName: currentFlightId ? `Flight ${currentFlightId}` : `Fast Planner Flight ${new Date().toLocaleDateString()}`,
        etd: new Date().toISOString(), // Current time as departure
        
        // Flight settings from flightSettings prop
        passengerWeight: flightSettings?.passengerWeight || 220,
        cargoWeight: flightSettings?.cargoWeight || 0,
        extraFuel: flightSettings?.extraFuel || 0,
        
        // Pilot settings (defaults for Fast Planner)
        captainId: "1", // Default Fast Planner pilot
        copilotId: "1", // Default Fast Planner pilot
        
        // Automation settings - DISABLED for manual save
        enableAutomation: false, // Don't run automation
        useOnlyFastPlannerWaypoints: true // Use only our waypoints
      };
      
      // Save the complete flight
      const result = await saveFlightData(
        flightData,
        selectedAircraft,
        waypoints,
        routeStats,
        false, // Don't run automation
        () => {}, // Success callback
        () => {} // Error callback
      );
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Flight saved successfully', 'success');
      } else {
        alert('Flight saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save flight:', error);
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Failed to save flight: ${error.message}`, 'error');
      } else {
        alert(`Failed to save flight: ${error.message}`);
      }
    }
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        width: '90%',
        maxWidth: '1000px',
        height: '80%',
        maxHeight: '650px',
        borderRadius: '12px',
        border: '2px solid #4FC3F7',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: '13px'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '16px 24px',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Fuel Requirements and Passenger Capacity by Stop
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedAircraft && waypoints && waypoints.length >= 2 && (
              <button
                onClick={handleSaveFlight}
                style={{
                  background: 'linear-gradient(to bottom, #1f2937, #111827)',
                  color: 'white',
                  border: '1px solid #4FC3F7',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(to bottom, #2a3a47, #1a2a37)';
                  e.target.style.borderColor = '#4FC3F7';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
                  e.target.style.borderColor = '#4FC3F7';
                }}
              >
                💾 Save Flight
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(to bottom, #1f2937, #111827)',
                color: '#ccc',
                border: '1px solid #666',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#333';
                e.target.style.borderColor = '#999';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
                e.target.style.borderColor = '#666';
                e.target.style.color = '#ccc';
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
        
        {/* Combined View - No Tabs */}
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {!fuelData.hasData ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
              fontSize: '16px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⛽</div>
              <div>No fuel data available</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                Create a route with waypoints to see detailed fuel breakdown
              </div>
            </div>
          ) : (
            <>
              {/* Detailed Breakdown Section */}
                <div>
                  {/* Detailed Breakdown Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#333' }}>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px', minWidth: '80px' }}>Stop</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px', minWidth: '140px' }}>Required Fuel</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px', minWidth: '160px' }}>Max Passengers</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px', minWidth: '200px' }}>Fuel Components</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px', minWidth: '140px' }}>Refuel Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fuelData.stopBreakdown.map((stop, index) => (
                          <tr key={index} style={{
                            backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#1e1e1e',
                            borderBottom: '1px solid #333'
                          }}>
                            <td style={{ 
                              padding: '14px 12px', 
                              color: '#fff', 
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              {stop.stop}
                              {stop.isRefuel && (
                                <div style={{ 
                                  color: '#FF6B35', 
                                  fontSize: '11px', 
                                  fontWeight: '600',
                                  marginTop: '2px'
                                }}>
                                  (REFUEL)
                                </div>
                              )}
                            </td>
                            <td style={{ 
                              padding: '14px 12px', 
                              color: '#fff',
                              fontSize: '13px'
                            }}>
                              <div style={{ fontWeight: '600' }}>
                                {stop.requiredFuel.toLocaleString()} Lbs
                              </div>
                              {stop.isRefuel && (
                                <div style={{ color: '#FF6B35', fontSize: '11px', marginTop: '2px' }}>
                                  Refuel needed+{Math.round(stop.requiredFuel * 0.1)} Lbs
                                </div>
                              )}
                            </td>
                            <td style={{ 
                              padding: '14px 12px', 
                              color: '#fff',
                              fontSize: '13px'
                            }}>
                              {stop.maxPassengers}
                            </td>
                            <td style={{ 
                              padding: '14px 12px', 
                              color: '#ccc',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}>
                              {stop.fuelComponents}
                            </td>
                            <td style={{ 
                              padding: '14px 12px', 
                              color: stop.isRefuel ? '#FF6B35' : '#999',
                              fontSize: '12px',
                              fontWeight: stop.isRefuel ? '600' : 'normal'
                            }}>
                              {stop.refuelAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              
              {/* Alternate Route Fuel Summary Section */}
              {fuelData.minimalFuel ? (
                <div>
                  <h3 style={{ 
                    color: '#ffffff', 
                    marginTop: 0, 
                    marginBottom: '24px',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    Alternate Route Fuel Requirements
                  </h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      marginBottom: '24px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#333' }}>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Required Fuel</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Max Passengers</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Distance/Time</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Fuel Components</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ backgroundColor: '#2a2a2a' }}>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#fff', 
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {fuelData.minimalFuel.requiredFuel.toLocaleString()} LBS
                          </td>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#fff',
                            fontSize: '13px'
                          }}>
                            {fuelData.minimalFuel.maxPassengers}
                          </td>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#fff',
                            fontSize: '13px'
                          }}>
                            <div style={{ fontWeight: '600' }}>
                              {fuelData.minimalFuel.distance > 0 ? `${Math.round(fuelData.minimalFuel.distance)} NM` : 'Unknown'}
                            </div>
                            <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                              {fuelData.minimalFuel.timeFormatted || 'Unknown'}
                            </div>
                          </td>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#ccc',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            {fuelData.minimalFuel.fuelComponents}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#2a2a2a',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    color: '#ccc',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#4FC3F7' }}>Alternate Route:</strong> {fuelData.minimalFuel.route}
                    </div>
                    <div>
                      <strong style={{ color: '#4FC3F7' }}>Expected Landing Fuel:</strong> {fuelData.minimalFuel.expectedLandingFuel} LBS (Reserve:{fuelData.minimalFuel.reserveFuel}{fuelData.minimalFuel.contingencyFuel > 0 ? `, Contingency:${fuelData.minimalFuel.contingencyFuel}` : ''}{fuelData.minimalFuel.extraFuel > 0 ? `, Extra:${fuelData.minimalFuel.extraFuel}` : ''})
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#1a2a1a',
                    border: '1px solid #2a4a2a',
                    borderRadius: '6px',
                    color: '#66BB6A',
                    fontSize: '13px'
                  }}>
                    <strong>✅ No significant Triggered Lightning or waves detected</strong>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#2a2a2a',
                  padding: '20px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  color: '#999',
                  fontSize: '14px',
                  textAlign: 'center',
                  marginTop: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>No Alternate Route Available</div>
                  <div>Create an alternate route to see IFR fuel requirements</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedFuelBreakdown;