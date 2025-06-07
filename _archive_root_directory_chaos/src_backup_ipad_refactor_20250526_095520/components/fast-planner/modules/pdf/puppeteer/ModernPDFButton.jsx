/**
 * ModernPDFButton.jsx
 * 
 * React component for generating cutting-edge PDFs using Puppeteer
 * Professional aviation documentation with modern design
 */

import React, { useState } from 'react';
import ModernPDFGenerator from './ModernPDFGenerator';
import FlightDataProcessor from '../FlightDataProcessor';

const ModernPDFButton = ({ 
  routeStats,
  stopCards, 
  selectedAircraft,
  waypoints,
  costData,
  className = '',
  buttonText = '📄 Generate Modern PDF Report',
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateModernPDF = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (!waypoints || waypoints.length < 2) {
        throw new Error('At least 2 waypoints are required to generate a flight report');
      }

      console.log('📄 Generating modern PDF with Puppeteer...');

      // Initialize processors
      const pdfGenerator = new ModernPDFGenerator();
      const dataProcessor = new FlightDataProcessor();

      // Process flight data
      const flightData = dataProcessor.processFlightData(
        routeStats,
        stopCards,
        selectedAircraft,
        waypoints,
        costData
      );

      console.log('📄 Flight data processed for modern PDF:', flightData);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const routeSummary = flightData.route.summary.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Bristow_Modern_Flight_Report_${routeSummary}_${timestamp}.pdf`;

      // Generate and download modern PDF
      await pdfGenerator.createDownloadLink(flightData, filename);
      
      console.log('📄 Modern PDF generated successfully!');

    } catch (err) {
      console.error('Modern PDF generation failed:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || !waypoints || waypoints.length < 2;

  return (
    <div className={`modern-pdf-button-container ${className}`}>
      <button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '14px 24px',
          background: isDisabled ? '#6b7280' : 'linear-gradient(135deg, #003366, #0066CC)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: isDisabled ? 0.6 : 1,
          boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(0, 51, 102, 0.3)',
        }}
        disabled={isDisabled || isGenerating}
        onClick={handleGenerateModernPDF}
        title={error || (isDisabled ? "Add at least 2 waypoints to generate a modern flight report" : "Generate cutting-edge PDF flight report")}
      >
        {isGenerating ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Generating...</span>
          </>
        ) : (
          <>
            📄
            <span>{isDisabled ? 
              (waypoints?.length < 2 ? 'Add 2+ waypoints for PDF' : 'Modern PDF Report') : 
              buttonText}
            </span>
          </>
        )}
      </button>
      
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          fontStyle: 'italic'
        }}>
          {error}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ModernPDFButton;
