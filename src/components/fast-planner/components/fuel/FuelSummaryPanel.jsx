/**
 * FuelSummaryPanel.jsx
 * 
 * Live fuel summary panel that displays comprehensive fuel breakdown
 * and mimics Palantir's stopsMarkdownTable in a user-friendly format.
 * Updates in real-time as flight calculations change.
 * 
 * AVIATION SAFETY: Shows live fuel calculations with refuel stop handling.
 */

import React, { useState, useMemo } from 'react';
import FuelSaveBackService from '../../services/FuelSaveBackService';

const FuelSummaryPanel = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  currentFlightId = null
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  // Generate live fuel summary data
  const fuelSummaryData = useMemo(() => {
    if (!stopCards || stopCards.length === 0) {
      return {
        markdownTable: '',
        fuelBreakdown: '',
        totalSummary: {},
        hasData: false
      };
    }
    
    try {
      const markdownTable = FuelSaveBackService.generateMarkdownTable(stopCards);
      const fuelBreakdown = FuelSaveBackService.generateFuelBreakdown(stopCards[0]);
      
      // Calculate totals
      const departureCard = stopCards[0];
      const finalCard = stopCards[stopCards.length - 1];
      
      const totalSummary = {
        totalStops: stopCards.length,
        departureFuel: Math.round(departureCard?.totalFuel || 0),
        finalFuel: Math.round(finalCard?.totalFuel || 0),
        tripFuel: Math.round(routeStats.tripFuel || departureCard?.tripFuel || 0),
        reserveFuel: Math.round(flightSettings.reserveFuel || 0),
        contingencyFuel: Math.round(departureCard?.contingencyFuel || 0),
        weatherFuel: Math.round((weatherFuel.araFuel || 0) + (weatherFuel.approachFuel || 0)),
        extraFuel: Math.round(flightSettings.extraFuel || 0),
        refuelStops: stopCards.filter(card => 
          card.refuelMode || (card.maxPassengers && card.maxPassengers.toString().includes('refuel'))
        ).length
      };
      
      return {
        markdownTable,
        fuelBreakdown,
        totalSummary,
        hasData: true
      };
    } catch (error) {
      console.error('Error generating fuel summary:', error);
      return {
        markdownTable: '',
        fuelBreakdown: '',
        totalSummary: {},
        hasData: false
      };
    }
  }, [stopCards, flightSettings, weatherFuel, routeStats]);
  
  // Convert markdown table to HTML table for better display
  const renderFuelTable = () => {
    if (!fuelSummaryData.hasData || !fuelSummaryData.markdownTable) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No fuel data available. Create a route to see fuel summary.
        </div>
      );
    }
    
    const lines = fuelSummaryData.markdownTable.split('\n').filter(line => line.trim());
    if (lines.length < 3) return null; // Need header + separator + at least one data row
    
    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
    const dataRows = lines.slice(2).map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell)
    );
    
    return (
      <div style={{ overflowX: 'auto', marginTop: '10px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #333'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#333' }}>
              {headers.map((header, index) => (
                <th key={index} style={{
                  padding: '8px 6px',
                  textAlign: 'left',
                  color: '#4FC3F7',
                  fontWeight: '600',
                  borderBottom: '2px solid #4FC3F7',
                  fontSize: '11px'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{
                backgroundColor: rowIndex % 2 === 0 ? '#2a2a2a' : '#1a1a1a',
                borderBottom: '1px solid #333'
              }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{
                    padding: '6px',
                    color: cellIndex === 1 && cell.includes('REFUEL') ? '#FF6B35' : '#fff',
                    fontWeight: cellIndex === 1 && cell.includes('REFUEL') ? '600' : 'normal'
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render summary statistics
  const renderSummaryStats = () => {
    if (!fuelSummaryData.hasData) return null;
    
    const { totalSummary } = fuelSummaryData;
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        {/* Flight Overview */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #333'
        }}>
          <h4 style={{ color: '#4FC3F7', margin: '0 0 10px 0', fontSize: '14px' }}>Flight Overview</h4>
          <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
            <div><strong>Total Stops:</strong> {totalSummary.totalStops}</div>
            <div><strong>Refuel Stops:</strong> {totalSummary.refuelStops}</div>
            <div><strong>Aircraft:</strong> {selectedAircraft?.registration || 'Unknown'}</div>
            <div><strong>Policy:</strong> {fuelPolicy?.name || 'Unknown'}</div>
          </div>
        </div>
        
        {/* Fuel Totals */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #333'
        }}>
          <h4 style={{ color: '#4FC3F7', margin: '0 0 10px 0', fontSize: '14px' }}>Fuel Totals (LBS)</h4>
          <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
            <div><strong>Departure Fuel:</strong> {totalSummary.departureFuel.toLocaleString()}</div>
            <div><strong>Trip Fuel:</strong> {totalSummary.tripFuel.toLocaleString()}</div>
            <div><strong>Reserve Fuel:</strong> {totalSummary.reserveFuel.toLocaleString()}</div>
            <div><strong>Final Fuel:</strong> {totalSummary.finalFuel.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Fuel Components */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #333'
        }}>
          <h4 style={{ color: '#4FC3F7', margin: '0 0 10px 0', fontSize: '14px' }}>Fuel Components (LBS)</h4>
          <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
            <div><strong>Contingency:</strong> {totalSummary.contingencyFuel.toLocaleString()}</div>
            <div><strong>Weather Fuel:</strong> {totalSummary.weatherFuel.toLocaleString()}</div>
            <div><strong>Extra Fuel:</strong> {totalSummary.extraFuel.toLocaleString()}</div>
            <div><strong>Policy:</strong> {fuelPolicy?.currentPolicy?.name || 'Default'}</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Manual save fuel function
  const handleSaveFuel = async () => {
    if (!currentFlightId) {
      alert('No flight loaded. Please save a flight first.');
      return;
    }
    
    try {
      await FuelSaveBackService.autoSaveFuelData(
        currentFlightId,
        stopCards,
        flightSettings,
        weatherFuel,
        fuelPolicy?.currentPolicy || null,
        routeStats,
        selectedAircraft
      );
    } catch (error) {
      console.error('Failed to save fuel data:', error);
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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        width: '90%',
        maxWidth: '1200px',
        height: '80%',
        borderRadius: '8px',
        border: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#333',
          padding: '15px 20px',
          borderBottom: '1px solid #555',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#4FC3F7', margin: 0, fontSize: '18px' }}>
            💾 Live Fuel Summary
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentFlightId && (
              <button
                onClick={handleSaveFuel}
                style={{
                  backgroundColor: '#4FC3F7',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Save to Palantir
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#ccc',
                border: '1px solid #666',
                padding: '8px 15px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '0 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '20px'
        }}>
          {['summary', 'details', 'breakdown'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: activeTab === tab ? '#4FC3F7' : '#999',
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : 'normal',
                borderBottom: activeTab === tab ? '2px solid #4FC3F7' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          color: '#fff'
        }}>
          {activeTab === 'summary' && (
            <div>
              <h3 style={{ color: '#4FC3F7', marginTop: 0 }}>Flight Summary</h3>
              {renderSummaryStats()}
            </div>
          )}
          
          {activeTab === 'details' && (
            <div>
              <h3 style={{ color: '#4FC3F7', marginTop: 0 }}>Detailed Stop Breakdown</h3>
              {renderFuelTable()}
            </div>
          )}
          
          {activeTab === 'breakdown' && (
            <div>
              <h3 style={{ color: '#4FC3F7', marginTop: 0 }}>Fuel Component Breakdown</h3>
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #333',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                <div style={{ color: '#4FC3F7', marginBottom: '10px', fontWeight: '600' }}>
                  Departure Fuel Components:
                </div>
                <div style={{ color: '#ccc' }}>
                  {fuelSummaryData.fuelBreakdown || 'No breakdown available'}
                </div>
                
                {fuelSummaryData.markdownTable && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ color: '#4FC3F7', marginBottom: '10px', fontWeight: '600' }}>
                      Raw Markdown Table (for Palantir):
                    </div>
                    <pre style={{
                      backgroundColor: '#1a1a1a',
                      padding: '10px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      overflow: 'auto',
                      color: '#999'
                    }}>
                      {fuelSummaryData.markdownTable}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuelSummaryPanel;