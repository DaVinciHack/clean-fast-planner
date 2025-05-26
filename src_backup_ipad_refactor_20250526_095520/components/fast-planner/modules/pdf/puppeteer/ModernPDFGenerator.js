/**
 * ModernPDFGenerator.js
 * 
 * Cutting-edge PDF generation using Puppeteer with full CSS control
 * Professional aviation documentation with modern design principles
 */

import bristowLogoBase64 from './bristow-logo-base64';

class ModernPDFGenerator {
  constructor() {
    this.companyInfo = {
      name: "Bristow Helicopters",
      logoBase64: bristowLogoBase64,
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
   * Generate modern CSS styles for professional aviation PDF
   * @returns {string} - Complete CSS stylesheet
   */
  generateModernCSS() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      :root {
        --bristow-primary: #003366;
        --bristow-blue: #0066CC;
        --bristow-red: #CC0000;
        --text-primary: #1a202c;
        --text-secondary: #4a5568;
        --text-muted: #718096;
        --background: #f7fafc;
        --card-background: #ffffff;
        --border-light: #e2e8f0;
        --border-medium: #cbd5e0;
        --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
        --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1);
        --shadow-large: 0 10px 15px rgba(0, 0, 0, 0.1);
        --radius-small: 6px;
        --radius-medium: 8px;
        --radius-large: 12px;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-primary);
        background: var(--background);
        padding: 40px;
      }

      .pdf-container {
        max-width: 210mm;
        min-height: 297mm;
        background: white;
        margin: 0 auto;
        padding: 40px;
        box-shadow: var(--shadow-large);
        border-radius: var(--radius-medium);
      }

      /* Header Section */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
        padding-bottom: 30px;
        border-bottom: 3px solid var(--bristow-primary);
      }

      .header-left {
        flex: 2;
      }

      .header-right {
        flex: 1;
        text-align: right;
      }

      .logo {
        width: 180px;
        height: auto;
        margin-bottom: 16px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .company-name {
        font-size: 24px;
        font-weight: 700;
        color: var(--bristow-primary);
        margin-bottom: 8px;
        letter-spacing: -0.025em;
      }

      .report-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--bristow-blue);
        font-style: italic;
        margin-bottom: 20px;
      }

      .report-info {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 4px;
        font-style: italic;
      }

      /* Section Titles */
      .section-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--bristow-primary);
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 3px solid var(--bristow-red);
        position: relative;
      }

      .section-title::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 0;
        width: 60px;
        height: 3px;
        background: var(--bristow-blue);
      }

      /* Modern Card Grid */
      .overview-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 40px;
      }

      .overview-card {
        background: var(--card-background);
        padding: 20px;
        border-radius: var(--radius-medium);
        box-shadow: var(--shadow-medium);
        border: 1px solid var(--border-light);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .overview-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--bristow-blue), var(--bristow-red));
      }

      .overview-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-large);
      }

      .card-label {
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        margin-bottom: 8px;
        font-style: italic;
      }

      .card-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--bristow-primary);
        line-height: 1.2;
      }

      /* Modern Table Design */
      .route-table-container {
        background: var(--card-background);
        border-radius: var(--radius-large);
        box-shadow: var(--shadow-medium);
        overflow: hidden;
        margin-bottom: 40px;
        border: 1px solid var(--border-light);
      }

      .route-table {
        width: 100%;
        border-collapse: collapse;
      }

      .table-header {
        background: linear-gradient(135deg, var(--bristow-primary), #004080);
        color: white;
      }

      .table-header th {
        padding: 16px 12px;
        font-weight: 600;
        font-size: 12px;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .table-row {
        border-bottom: 1px solid var(--border-light);
        transition: background-color 0.2s ease;
      }

      .table-row:nth-child(even) {
        background: #f8fafc;
      }

      .table-row:hover {
        background: #e6f3ff;
      }

      .table-row td {
        padding: 12px;
        font-size: 13px;
        color: var(--text-primary);
      }

      .table-cell-center {
        text-align: center;
      }

      .table-cell-right {
        text-align: right;
      }

      /* Cost Breakdown Section */
      .cost-section {
        background: var(--card-background);
        border-radius: var(--radius-large);
        box-shadow: var(--shadow-medium);
        padding: 30px;
        margin-bottom: 40px;
        border: 1px solid var(--border-light);
        position: relative;
      }

      .cost-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--bristow-red), var(--bristow-blue));
        border-radius: var(--radius-large) var(--radius-large) 0 0;
      }

      .cost-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 24px;
      }

      .cost-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-light);
      }

      .cost-label {
        font-size: 14px;
        color: var(--text-secondary);
        font-style: italic;
        font-weight: 500;
      }

      .cost-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--bristow-primary);
      }

      .total-cost {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 0;
        border-top: 3px solid var(--bristow-primary);
        margin-top: 20px;
      }

      .total-label {
        font-size: 18px;
        font-weight: 700;
        color: var(--bristow-primary);
      }

      .total-value {
        font-size: 24px;
        font-weight: 800;
        color: var(--bristow-red);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      /* Footer */
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid var(--border-medium);
        font-size: 11px;
        color: var(--text-muted);
      }

      .footer-section {
        flex: 1;
      }

      .footer-bold {
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      .disclaimer {
        font-size: 10px;
        color: var(--text-muted);
        text-align: center;
        margin-top: 30px;
        font-style: italic;
        line-height: 1.5;
        max-width: 80%;
        margin-left: auto;
        margin-right: auto;
      }

      /* Responsive adjustments for PDF */
      @media print {
        .pdf-container {
          box-shadow: none;
          border-radius: 0;
          margin: 0;
          padding: 30px;
        }
      }

      /* Animation classes for future interactivity */
      .fade-in {
        animation: fadeIn 0.5s ease-in;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .slide-up {
        animation: slideUp 0.6s ease-out;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
  }

  /**
   * Generate modern HTML template for flight report
   * @param {Object} flightData - Complete flight data
   * @returns {string} - Complete HTML document
   */
  generateModernHTML(flightData) {
    const css = this.generateModernCSS();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flight Report - ${flightData.flightId}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="pdf-container">
          <!-- Header Section -->
          <header class="header">
            <div class="header-left">
              <img src="data:image/png;base64,${this.companyInfo.logoBase64}" alt="Bristow Logo" class="logo" />
              <h1 class="company-name">${this.companyInfo.name}</h1>
              <h2 class="report-title">Flight Quote & Planning Report</h2>
            </div>
            <div class="header-right">
              <div class="report-info">Quote Reference: ${flightData.flightId}</div>
              <div class="report-info">Generated: ${new Date().toLocaleDateString()}</div>
              <div class="report-info">Route: ${flightData.route?.summary || 'Custom Route'}</div>
              <div class="report-info">Aircraft: ${flightData.aircraft?.registration || 'TBD'}</div>
              <div class="report-info">Date: ${flightData.flightDate}</div>
            </div>
          </header>

          <!-- Flight Overview -->
          <section>
            <h3 class="section-title">Flight Overview</h3>
            <div class="overview-grid">
              <div class="overview-card fade-in">
                <div class="card-label">Total Distance</div>
                <div class="card-value">${flightData.totals?.distance || '0'} NM</div>
              </div>
              <div class="overview-card fade-in">
                <div class="card-label">Flight Time</div>
                <div class="card-value">${flightData.totals?.flightTime || '00:00'}</div>
              </div>
              <div class="overview-card fade-in">
                <div class="card-label">Total Fuel</div>
                <div class="card-value">${flightData.totals?.fuel || '0'} lbs</div>
              </div>
              <div class="overview-card fade-in">
                <div class="card-label">Passengers</div>
                <div class="card-value">${flightData.totals?.passengers || '0'}</div>
              </div>
              <div class="overview-card fade-in">
                <div class="card-label">Aircraft Type</div>
                <div class="card-value">${flightData.aircraft?.model || flightData.aircraft?.type || 'TBD'}</div>
              </div>
              <div class="overview-card fade-in">
                <div class="card-label">Registration</div>
                <div class="card-value">${flightData.aircraft?.registration || 'TBD'}</div>
              </div>
            </div>
          </section>

          <!-- Route Details -->
          <section>
            <h3 class="section-title">Route Details</h3>
            <div class="route-table-container slide-up">
              <table class="route-table">
                <thead class="table-header">
                  <tr>
                    <th>Leg</th>
                    <th>From</th>
                    <th>To</th>
                    <th class="table-cell-center">Distance</th>
                    <th class="table-cell-center">Time</th>
                    <th class="table-cell-center">Fuel</th>
                    <th class="table-cell-center">Pax</th>
                  </tr>
                </thead>
                <tbody>
                  ${flightData.legs?.map((leg, index) => `
                    <tr class="table-row">
                      <td>${index + 1}</td>
                      <td><strong>${leg.from}</strong></td>
                      <td><strong>${leg.to}</strong></td>
                      <td class="table-cell-center">${leg.distance} NM</td>
                      <td class="table-cell-center">${leg.time}</td>
                      <td class="table-cell-center">${leg.fuel} lbs</td>
                      <td class="table-cell-center">${leg.passengers}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="7">No route data available</td></tr>'}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Cost Breakdown -->
          <section>
            <h3 class="section-title">Cost Breakdown</h3>
            <div class="cost-section slide-up">
              <div class="cost-grid">
                <div>
                  <div class="cost-item">
                    <span class="cost-label">Flight Time Cost:</span>
                    <span class="cost-value">$${flightData.costs?.flightTime?.toLocaleString() || '0.00'}</span>
                  </div>
                  <div class="cost-item">
                    <span class="cost-label">Fuel Cost:</span>
                    <span class="cost-value">$${flightData.costs?.fuel?.toLocaleString() || '0.00'}</span>
                  </div>
                  <div class="cost-item">
                    <span class="cost-label">Day Rate:</span>
                    <span class="cost-value">$${flightData.costs?.dayRate?.toLocaleString() || '0.00'}</span>
                  </div>
                </div>
                <div>
                  <div class="cost-item">
                    <span class="cost-label">Additional Fees:</span>
                    <span class="cost-value">$${flightData.costs?.additional?.toLocaleString() || '0.00'}</span>
                  </div>
                  <div class="cost-item">
                    <span class="cost-label">Landing Fees:</span>
                    <span class="cost-value">$${flightData.costs?.landing?.toLocaleString() || '0.00'}</span>
                  </div>
                  ${flightData.costs?.tax ? `
                    <div class="cost-item">
                      <span class="cost-label">Tax:</span>
                      <span class="cost-value">$${flightData.costs.tax.toLocaleString()}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              <div class="total-cost">
                <span class="total-label">Total Cost:</span>
                <span class="total-value">$${flightData.totals?.cost?.toLocaleString() || '0.00'}</span>
              </div>
            </div>
          </section>

          <!-- Footer -->
          <footer class="footer">
            <div class="footer-section">
              <div class="footer-bold">Bristow Helicopters</div>
              <div>${this.companyInfo.address.street}</div>
              <div>${this.companyInfo.address.city}</div>
            </div>
            <div class="footer-section" style="text-align: center;">
              <div class="footer-bold">Business Development</div>
              <div>${this.companyInfo.contact.businessDev1}</div>
              <div>${this.companyInfo.contact.businessDev2}</div>
            </div>
            <div class="footer-section" style="text-align: right;">
              <div class="footer-bold">Page 1 of 1</div>
              <div>${this.companyInfo.contact.website}</div>
            </div>
          </footer>

          <div class="disclaimer">
            This flight quote is subject to weather conditions, air traffic control clearances, and operational requirements. 
            All times and costs are estimates and may vary based on actual flight conditions. Quote valid for 30 days.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF using Puppeteer with cutting-edge styling
   * @param {Object} flightData - Flight data
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generatePDF(flightData, options = {}) {
    const puppeteer = await import('puppeteer');
    
    const defaultOptions = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      ...options
    };

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Generate the HTML content
      const htmlContent = this.generateModernHTML(flightData);
      
      // Set the HTML content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });

      // Generate PDF
      const pdfBuffer = await page.pdf(defaultOptions);
      
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Create download link for modern PDF
   * @param {Object} flightData - Flight data
   * @param {string} filename - PDF filename
   * @returns {Promise<string>} - Download URL
   */
  async createDownloadLink(flightData, filename = null) {
    const defaultFilename = `Bristow_Flight_Report_${flightData.flightId || Date.now()}.pdf`;
    
    try {
      const pdfBuffer = await this.generatePDF(flightData);
      
      // Create blob URL for download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || defaultFilename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return url;
    } catch (error) {
      console.error('Failed to generate modern PDF:', error);
      throw error;
    }
  }
}

export default ModernPDFGenerator;
