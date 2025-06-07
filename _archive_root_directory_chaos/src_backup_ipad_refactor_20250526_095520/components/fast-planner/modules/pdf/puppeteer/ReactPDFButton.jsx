/**
 * ReactPDFButton.jsx
 * 
 * Modern PDF generation using @react-pdf for browser compatibility
 * Professional aviation documentation with full design control
 */

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import FlightDataProcessor from '../FlightDataProcessor';
import bristowLogoBase64 from './bristow-logo-base64';

// Professional Bristow-branded styles for PDFs
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#003366',
    borderBottomStyle: 'solid',
  },
  headerLeft: {
    flex: 2,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 36,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#4A5568',
    width: '50%',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    color: '#1A202C',
    width: '50%',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#003366',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderBottomStyle: 'solid',
  },
  tableCell: {
    fontSize: 11,
    color: '#1A202C',
    flex: 1,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#003366',
    borderStyle: 'solid',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
    width: '70%',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
    width: '30%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#718096',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
});

// Professional PDF Document Component
const FlightReportDocument = ({ flightData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>Bristow Helicopters</Text>
            <Text style={{ fontSize: 10, color: '#718096' }}>Professional Helicopter Services</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 10, color: '#718096' }}>Generated: {formatDate()}</Text>
            <Text style={{ fontSize: 10, color: '#718096', marginTop: 5 }}>
              Flight ID: {flightData.flightId || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Flight Plan Report</Text>
        <Text style={styles.subtitle}>{flightData.route?.summary || 'Flight Route'}</Text>

        {/* Aircraft Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aircraft Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Aircraft Type:</Text>
            <Text style={styles.value}>{flightData.aircraft?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registration:</Text>
            <Text style={styles.value}>{flightData.aircraft?.registration || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Passenger Capacity:</Text>
            <Text style={styles.value}>{flightData.aircraft?.passengerCapacity || 'N/A'}</Text>
          </View>
        </View>

        {/* Route Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Distance:</Text>
            <Text style={styles.value}>{flightData.route?.distance || 'N/A'} nm</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Flight Time:</Text>
            <Text style={styles.value}>{flightData.route?.flightTime || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Time:</Text>
            <Text style={styles.value}>{flightData.route?.totalTime || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fuel Required:</Text>
            <Text style={styles.value}>{flightData.route?.fuelRequired || 'N/A'} lbs</Text>
          </View>
        </View>

        {/* Cost Breakdown */}
        {flightData.costs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Analysis</Text>
            
            {flightData.costs.flightTimeCost > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Flight Time Cost:</Text>
                <Text style={styles.value}>{formatCurrency(flightData.costs.flightTimeCost)}</Text>
              </View>
            )}
            
            {flightData.costs.dayRate > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Day Rate:</Text>
                <Text style={styles.value}>{formatCurrency(flightData.costs.dayRate)}</Text>
              </View>
            )}
            
            {flightData.costs.fuelCost > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Fuel Cost:</Text>
                <Text style={styles.value}>{formatCurrency(flightData.costs.fuelCost)}</Text>
              </View>
            )}
            
            {flightData.costs.landingFees > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Landing Fees:</Text>
                <Text style={styles.value}>{formatCurrency(flightData.costs.landingFees)}</Text>
              </View>
            )}
            
            {flightData.costs.additionalCost > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Additional Costs:</Text>
                <Text style={styles.value}>{formatCurrency(flightData.costs.additionalCost)}</Text>
              </View>
            )}
            
            {flightData.costs.tax > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Tax:</Text>
                <Text style={styles.value}>{formatCurrency(flightData.costs.tax)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>{formatCurrency(flightData.costs.totalCost)}</Text>
            </View>
          </View>
        )}

        {/* Route Details Table */}
        {flightData.legs && flightData.legs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>From</Text>
                <Text style={styles.tableHeaderText}>To</Text>
                <Text style={styles.tableHeaderText}>Distance</Text>
                <Text style={styles.tableHeaderText}>Time</Text>
              </View>
              {flightData.legs.map((leg, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{leg.from || 'N/A'}</Text>
                  <Text style={styles.tableCell}>{leg.to || 'N/A'}</Text>
                  <Text style={styles.tableCell}>{leg.distance || 'N/A'} nm</Text>
                  <Text style={styles.tableCell}>{leg.time || 'N/A'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Bristow Helicopters • 3151 Briarpark Drive, Suite 700 7th Floor, Houston, Texas 77042{'\n'}
          Business Development: +1 337 288 6102 • business.development@bristowgroup.com • www.bristowgroup.com{'\n'}
          This document was generated automatically by the Bristow Flight Planning