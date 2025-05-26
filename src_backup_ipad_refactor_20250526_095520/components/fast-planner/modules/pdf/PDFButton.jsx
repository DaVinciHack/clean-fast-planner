/**
 * PDFButton.jsx
 * 
 * React component for generating and downloading PDF flight reports
 * Integrates with existing Fast Planner application state
 */

import React, { useState } from 'react';
import PDFReportGenerator from './PDFReportGenerator';
import FlightDataProcessor from './FlightDataProcessor';

const PDFButton = ({ 
  routeStats,
  stopCards, 
  selectedAircraft,
  waypoints,
  costData,
  className = '',
  buttonText = '📄 Generate PDF Report',
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Add debugging
  console.log('📄 PDFButton render - waypoints:', waypoints?.length, 'aircraft:', selectedAircraft?.type);

  // Initialize processors
  const pdfGenerator = new PDFReportGenerator();
  const dataProcessor = new FlightDataProcessor();

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Validate that we have minimum required data
      if (!waypoints || waypoints.length < 2) {
        throw new Error('At least 2 waypoints are required to generate a flight report');
      }

      // Process flight data
      const flightData = dataProcessor.processFlightData(
        routeStats,
        stopCards,
        selectedAircraft,
        waypoints,
        costData
      );

      console.log('📄 Generated flight data for PDF:', flightData);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const routeSummary = flightData.route.summary.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Flight_Report_${routeSummary}_${timestamp}.pdf`;

      // Create and trigger download
      const downloadLink = pdfGenerator.createDownloadLink(flightData, filename);
      
      // Return the download link for rendering
      return downloadLink;

    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Default button styling that matches the application
  const defaultButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: disabled ? '#6b7280' : '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    opacity: disabled ? 0.6 : 1
  };

  const hoverStyle = {
    backgroundColor: disabled ? '#6b7280' : '#047857',
    transform: disabled ? 'none' : 'translateY(-1px)',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)'
  };

  // If we have valid data, render the PDF download link
  if (waypoints && waypoints.length >= 2 && !disabled) {
    try {
      const flightData = dataProcessor.processFlightData(
        routeStats,
        stopCards, 
        selectedAircraft,
        waypoints,
        costData
      );

      const downloadLink = pdfGenerator.createDownloadLink(flightData);
      
      console.log('📄 PDFButton - Rendering download link for', waypoints.length, 'waypoints');
      
      // Render the download link with custom styling
      return React.cloneElement(downloadLink, {
        style: {
          ...defaultButtonStyle,
          ...downloadLink.props.style
        },
        className: `pdf-download-button ${className}`,
        children: (
          <>
            📄
            <span>{buttonText}</span>
          </>
        )
      });
    } catch (error) {
      console.error('📄 PDFButton - Error generating PDF link:', error);
      // Fallback to disabled button
    }
  }

  // Always render something, even if disabled
  const isDisabled = disabled || !waypoints || waypoints.length < 2;
  const displayText = isDisabled ? 
    (waypoints?.length < 2 ? 'Add 2+ waypoints for PDF' : 'PDF Report') : 
    buttonText;

  // Render disabled button or error state
  return (
    <div className={`pdf-button-container ${className}`}>
      <button
        style={{
          ...defaultButtonStyle,
          backgroundColor: isDisabled ? '#6b7280' : '#059669',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1
        }}
        disabled={isDisabled}
        title={error || (isDisabled ? "Add at least 2 waypoints to generate a flight report" : "Generate PDF flight report")}
      >
        📄
        <span>{isGenerating ? 'Generating...' : displayText}</span>
      </button>
      {error && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#dc2626',
          fontStyle: 'italic'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default PDFButton;
