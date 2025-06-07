/**
 * PDFReportGenerator.js
 * 
 * Professional PDF flight report generator for client deliverables
 * Creates beautifully styled flight plans with complete route details
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
  Font,
  Image
} from '@react-pdf/renderer';
import bristowHeader from '../../../../assets/logos/header.png';

// Use built-in fonts instead of external URLs to avoid loading issues
// Helvetica is built into PDF viewers and always available
const fonts = {
  normal: 'Helvetica',
  bold: 'Helvetica-Bold'
};

// Professional Bristow-themed color palette - Clean & Modern
const colors = {
  primary: '#003366',      // Deep navy blue (Bristow brand color)
  secondary: '#0066CC',    // Bristow blue
  accent: '#003366',       // Changed from red to dark blue for lines
  text: '#2d3748',         // Darker gray for readability
  textLight: '#718096',    // Light gray
  textMuted: '#a0aec0',    // Very light gray
  background: '#f8fafc',   // Very subtle background
  white: '#ffffff',
  cardBorder: '#f1f5f9',   // Much lighter border (barely visible)
  cardBackground: '#ffffff'
};

// Elegant, refined styles for professional aviation reports
const styles = StyleSheet.create({
  page: {
    fontFamily: fonts.normal,
    fontSize: 10,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 35,
    backgroundColor: colors.white,
    color: colors.text
  },
  
  // Clean, elegant header with new header image - full width, no margins
  header: {
    flexDirection: 'column',
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 0,
    alignItems: 'center',
    width: '100%',
    marginTop: -8
  },
  
  // Professional header image - full width, proper height to show full design
  headerImage: {
    width: '100%',
    height: 120,
    marginBottom: 0,
    objectFit: 'contain'
  },
  
  // Content container with reduced padding and footer space
  contentContainer: {
    paddingTop: 15,
    paddingLeft: 35,
    paddingRight: 35,
    paddingBottom: 80,
    backgroundColor: colors.white
  },
  
  companyName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: 4,
    letterSpacing: 0.3
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: 8,
    fontStyle: 'italic'
  },
  reportInfo: {
    fontSize: 8,
    color: colors.textLight,
    marginBottom: 2,
    fontStyle: 'italic'
  },
  
  // Compact card-based overview section
  overviewSection: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginBottom: 10,
    borderBottom: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 3
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  overviewItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.cardBackground,
    padding: 8,
    borderRadius: 3,
    border: 0.25,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomColor: '#f8fafc',
    borderRightColor: '#f8fafc'
  },
  overviewLabel: {
    fontSize: 7,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontFamily: fonts.normal,
    letterSpacing: 0.5,
    fontStyle: 'italic'
  },
  overviewValue: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary
  },
  
  // Compact card-based route details
  routeSection: {
    marginBottom: 15
  },
  routeTable: {
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    border: 0.1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0.2,
    borderRightWidth: 0.2,
    borderBottomColor: '#f8fafc',
    borderRightColor: '#f8fafc'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    color: colors.white,
    padding: 8,
    fontFamily: fonts.bold,
    fontSize: 8
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 8,
    minHeight: 24,
    borderBottomWidth: 0.1,
    borderBottomColor: colors.cardBorder
  },
  tableRowAlt: {
    backgroundColor: colors.background
  },
  tableCell: {
    flex: 1,
    paddingRight: 6,
    justifyContent: 'center'
  },
  tableCellCenter: {
    textAlign: 'center'
  },
  tableCellRight: {
    textAlign: 'right'
  },
  
  // Compact cost breakdown section with modern card design
  costSection: {
    marginBottom: 20,
    backgroundColor: colors.background,
    borderRadius: 3,
    padding: 12,
    border: 0.1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0.2,
    borderRightWidth: 0.2,
    borderBottomColor: '#f8fafc',
    borderRightColor: '#f8fafc'
  },
  costGrid: {
    flexDirection: 'row',
    gap: 15
  },
  costColumn: {
    flex: 1
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.3,
    borderBottomColor: colors.cardBorder
  },
  costLabel: {
    fontSize: 9,
    color: colors.text,
    flex: 2,
    fontStyle: 'italic'
  },
  costValue: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.primary,
    textAlign: 'right',
    flex: 1
  },
  totalCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.primary
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary
  },
  totalValue: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.accent
  },
  
  // Elegant footer - anchored to bottom of page
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 35,
    right: 35,
    borderTop: 0.5,
    borderTopColor: colors.cardBorder,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 8,
    color: colors.textLight,
    fontStyle: 'italic'
  },
  footerBold: {
    fontSize: 9,
    color: colors.text,
    fontFamily: fonts.bold
  },
  disclaimer: {
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 60,
    fontStyle: 'italic',
    lineHeight: 1.4
  },
  
  // Flight overview section with grey background
  flightOverviewSection: {
    backgroundColor: colors.background,
    borderRadius: 3,
    padding: 15,
    marginBottom: 15,
    border: 0.1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0.2,
    borderRightWidth: 0.2,
    borderBottomColor: '#f8fafc',
    borderRightColor: '#f8fafc'
  },
  
  // Total cost styling - smaller font, blue
  totalCostText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.secondary,
    fontStyle: 'italic'
  }
});

class PDFReportGenerator {
  constructor() {
    this.companyInfo = {
      name: "Bristow Helicopters",
      header: bristowHeader,
      address: {
        street: "3151 Briarpark Drive, Suite 700 7th Floor",
        city: "Houston, Texas 77042"
      },
      contact: {
        businessDev1: "+1 337 288 6102",
        businessDev2: "+1 337 563 3511", 
        email: "business.development@bristowgroup.com",
        website: "www.bristowgroup.com"
      }
    };
  }

  /**
   * Generate PDF document component
   * @param {Object} flightData - Complete flight data including route, costs, aircraft
   * @returns {React.Component} - PDF Document component
   */
  generateFlightReport(flightData) {
    const FlightReportDocument = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Full-width professional header at very top */}
          <View style={styles.header}>
            <Image 
              style={styles.headerImage} 
              src={bristowHeader}
            />
          </View>
          
          {/* Content area with header info overlapping */}
          <View style={styles.contentContainer}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, marginTop: -25}}>
              <View>
                <Text style={styles.reportTitle}>Flight Quote & Planning Report</Text>
              </View>
              <View style={{alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 3}}>
                <Text style={styles.reportInfo}>Quote Reference: {flightData.flightId || 'FQ-' + Date.now()}</Text>
                <Text style={styles.reportInfo}>Generated: {new Date().toLocaleDateString()}</Text>
                <Text style={styles.reportInfo}>Date: {flightData.flightDate || new Date().toLocaleDateString()}</Text>
              </View>
            </View>

          {/* Elegant Flight Overview - 6 boxes only */}
          <View style={styles.flightOverviewSection}>
            <Text style={styles.sectionTitle}>Flight Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Total Distance</Text>
                <Text style={styles.overviewValue}>{flightData.totals?.distance || '0'} NM</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Flight Time</Text>
                <Text style={styles.overviewValue}>{flightData.totals?.flightTime || '00:00'}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Total Fuel</Text>
                <Text style={styles.overviewValue}>{flightData.totals?.fuel || '0'} lbs</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Passengers</Text>
                <Text style={styles.overviewValue}>{flightData.totals?.passengers || '0'}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Aircraft Type</Text>
                <Text style={styles.overviewValue}>{flightData.aircraft?.model || flightData.aircraft?.type || 'TBD'}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Registration</Text>
                <Text style={styles.overviewValue}>{flightData.aircraft?.registration || 'TBD'}</Text>
              </View>
            </View>
          </View>

          {/* Route Details */}
          <View style={styles.routeSection}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <View style={styles.routeTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>Leg</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>From</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>To</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Distance</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Time</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Fuel</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter]}>Pax</Text>
              </View>
              
              {flightData.legs?.map((leg, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{leg.from}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{leg.to}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{leg.distance} NM</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{leg.time}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{leg.fuel} lbs</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter]}>{leg.passengers}</Text>
                </View>
              )) || []}
            </View>
          </View>

          {/* Cost Breakdown */}
          <View style={styles.costSection}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={styles.costGrid}>
              <View style={styles.costColumn}>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Flight Time Cost:</Text>
                  <Text style={styles.costValue}>${flightData.costs?.flightTime?.toLocaleString() || '0.00'}</Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Fuel Cost:</Text>
                  <Text style={styles.costValue}>${flightData.costs?.fuel?.toLocaleString() || '0.00'}</Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Day Rate:</Text>
                  <Text style={styles.costValue}>${flightData.costs?.dayRate?.toLocaleString() || '0.00'}</Text>
                </View>
              </View>
              <View style={styles.costColumn}>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Additional Fees:</Text>
                  <Text style={styles.costValue}>${flightData.costs?.additional?.toLocaleString() || '0.00'}</Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Landing Fees:</Text>
                  <Text style={styles.costValue}>${flightData.costs?.landing?.toLocaleString() || '0.00'}</Text>
                </View>
                {flightData.costs?.tax && (
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Tax:</Text>
                    <Text style={styles.costValue}>${flightData.costs.tax.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.totalCost}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalCostText}>${flightData.totals?.cost?.toLocaleString() || '0.00'}</Text>
            </View>
          </View>

          {/* Elegant Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBold}>Bristow Helicopters</Text>
              <Text style={styles.footerText}>{this.companyInfo.address.street}</Text>
              <Text style={styles.footerText}>{this.companyInfo.address.city}</Text>
            </View>
            <View>
              <Text style={styles.footerText}>Business Development</Text>
              <Text style={styles.footerText}>{this.companyInfo.contact.businessDev1}</Text>
              <Text style={styles.footerText}>{this.companyInfo.contact.businessDev2}</Text>
            </View>
            <View>
              <Text style={styles.footerText}>Page 1 of 1</Text>
              <Text style={styles.footerText}>{this.companyInfo.contact.website}</Text>
            </View>
          </View>
          
            <Text style={styles.disclaimer}>
              This flight quote is subject to weather conditions, air traffic control clearances, and operational requirements. 
              All times and costs are estimates and may vary based on actual flight conditions. Quote valid for 30 days.
            </Text>
          </View>
        </Page>
      </Document>
    );

    return FlightReportDocument;
  }

  /**
   * Create PDF download link component
   * @param {Object} flightData - Flight data
   * @param {string} filename - PDF filename
   * @returns {React.Component} - Download link component
   */
  createDownloadLink(flightData, filename = null) {
    const defaultFilename = `Flight_Report_${flightData.flightId || Date.now()}.pdf`;
    const FlightReportDocument = this.generateFlightReport(flightData);

    return (
      <PDFDownloadLink
        document={<FlightReportDocument />}
        fileName={filename || defaultFilename}
        style={{
          textDecoration: 'none',
          padding: '10px 20px',
          color: colors.white,
          backgroundColor: colors.primary,
          borderRadius: '5px',
          fontWeight: '600',
          display: 'inline-block',
          transition: 'all 0.2s ease'
        }}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Generating PDF...' : 'Download Flight Report'
        }
      </PDFDownloadLink>
    );
  }

  /**
   * Set company logo
   * @param {string} logoUrl - URL or base64 string of logo
   */
  setCompanyLogo(logoUrl) {
    this.companyInfo.logo = logoUrl;
  }

  /**
   * Update company information
   * @param {Object} info - Company information object
   */
  updateCompanyInfo(info) {
    this.companyInfo = { ...this.companyInfo, ...info };
  }
}

export default PDFReportGenerator;
