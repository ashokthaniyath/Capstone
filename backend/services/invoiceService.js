/**
 * Invoice Service
 * Generates PDF invoices with QR codes and barcodes
 * Uses pdfkit for PDF generation
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const barcodeService = require('./barcodeService');

// IPFS/Pinata integration - optional, graceful fallback
let pinata = null;
try {
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
    const pinataSDK = require('@pinata/sdk');
    pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
    console.log('✅ Pinata IPFS initialized');
  }
} catch (e) {
  console.log('⚠️  Pinata SDK not available — IPFS uploads disabled');
}

class InvoiceService {
  constructor() {
    // Invoice configuration
    this.config = {
      currency: '₹',
      currencyCode: 'INR',
      taxLabel: 'GST',
      company: {
        name: 'BlockERP Solutions Pvt. Ltd.',
        address: '123 Tech Park, Sector 15',
        city: 'Bangalore, Karnataka 560001',
        country: 'India',
        phone: '+91 80 1234 5678',
        email: 'billing@blockerp.com',
        gstin: '29AABCU9603R1ZM',
        website: 'www.blockerp.com'
      },
      colors: {
        primary: '#4361ee',
        secondary: '#6b7280',
        text: '#1f2937',
        light: '#f3f4f6',
        border: '#e5e7eb'
      }
    };

    // Ensure invoices directory exists
    this.invoicesDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  /**
   * Generate invoice PDF
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Generated invoice info with PDF path
   */
  async generateInvoice(invoiceData) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          bufferPages: true
        });

        const invoiceId = invoiceData.invoiceId || this.generateInvoiceId();
        const filename = `${invoiceId}.pdf`;
        const filePath = path.join(this.invoicesDir, filename);
        
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Generate QR code for invoice verification
        const qrData = {
          invoiceId,
          total: invoiceData.total,
          date: invoiceData.invoiceDate || new Date().toISOString(),
          verify: `https://blockerp.com/verify/${invoiceId}`
        };
        
        let qrCodeBuffer = null;
        try {
          const qrBase64 = await barcodeService.generateQRCode(qrData);
          qrCodeBuffer = Buffer.from(qrBase64.split(',')[1], 'base64');
        } catch (e) {
          console.log('QR code generation skipped:', e.message);
        }

        // Build PDF
        this.addHeader(doc, invoiceId, invoiceData.invoiceDate);
        this.addCompanyInfo(doc);
        this.addCustomerInfo(doc, invoiceData.customer);
        
        // Add QR code if generated
        if (qrCodeBuffer) {
          doc.image(qrCodeBuffer, doc.page.width - 130, 50, { width: 80 });
        }

        this.addItemsTable(doc, invoiceData.items);
        this.addTotals(doc, invoiceData);
        this.addFooter(doc, invoiceData);
        
        // Add blockchain reference if available
        if (invoiceData.blockchainTxHash) {
          this.addBlockchainInfo(doc, invoiceData.blockchainTxHash);
        }

        doc.end();

        writeStream.on('finish', () => {
          resolve({
            success: true,
            invoiceId,
            filename,
            filePath,
            pdfUrl: `/invoices/${filename}`
          });
        });

        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add invoice header
   */
  addHeader(doc, invoiceId, date) {
    const invoiceDate = date ? new Date(date) : new Date();
    
    // Title
    doc.fontSize(28)
       .fillColor(this.config.colors.primary)
       .text('INVOICE', 50, 50);
    
    // Invoice details
    doc.fontSize(10)
       .fillColor(this.config.colors.secondary)
       .text(`Invoice #: ${invoiceId}`, 50, 90)
       .text(`Date: ${invoiceDate.toLocaleDateString('en-IN', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, 50, 105);
    
    doc.moveDown(2);
  }

  /**
   * Add company information
   */
  addCompanyInfo(doc) {
    const company = this.config.company;
    
    doc.fontSize(12)
       .fillColor(this.config.colors.text)
       .font('Helvetica-Bold')
       .text('From:', 50, 140);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.config.colors.text)
       .text(company.name, 50, 158)
       .text(company.address, 50, 172)
       .text(company.city, 50, 186)
       .text(`Phone: ${company.phone}`, 50, 200)
       .text(`Email: ${company.email}`, 50, 214)
       .text(`GSTIN: ${company.gstin}`, 50, 228);
  }

  /**
   * Add customer information
   */
  addCustomerInfo(doc, customer) {
    if (!customer) return;
    
    const xPos = 300;
    
    doc.fontSize(12)
       .fillColor(this.config.colors.text)
       .font('Helvetica-Bold')
       .text('Bill To:', xPos, 140);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.config.colors.text);
    
    let yPos = 158;
    if (customer.name) {
      doc.text(customer.name, xPos, yPos);
      yPos += 14;
    }
    if (customer.company) {
      doc.text(customer.company, xPos, yPos);
      yPos += 14;
    }
    if (customer.address) {
      if (customer.address.street) {
        doc.text(customer.address.street, xPos, yPos);
        yPos += 14;
      }
      const cityLine = [customer.address.city, customer.address.state, customer.address.zipCode]
        .filter(Boolean).join(', ');
      if (cityLine) {
        doc.text(cityLine, xPos, yPos);
        yPos += 14;
      }
    }
    if (customer.email) {
      doc.text(`Email: ${customer.email}`, xPos, yPos);
      yPos += 14;
    }
    if (customer.gstin) {
      doc.text(`GSTIN: ${customer.gstin}`, xPos, yPos);
    }
  }

  /**
   * Add items table
   */
  addItemsTable(doc, items) {
    const tableTop = 280;
    const tableLeft = 50;
    const colWidths = {
      description: 200,
      quantity: 60,
      unitPrice: 80,
      tax: 60,
      total: 95
    };
    
    // Table header background
    doc.rect(tableLeft, tableTop, 495, 25)
       .fill(this.config.colors.primary);
    
    // Table headers
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold');
    
    let xPos = tableLeft + 10;
    doc.text('Description', xPos, tableTop + 8);
    xPos += colWidths.description;
    doc.text('Qty', xPos, tableTop + 8, { width: colWidths.quantity, align: 'center' });
    xPos += colWidths.quantity;
    doc.text('Unit Price', xPos, tableTop + 8, { width: colWidths.unitPrice, align: 'right' });
    xPos += colWidths.unitPrice;
    doc.text('Tax', xPos, tableTop + 8, { width: colWidths.tax, align: 'center' });
    xPos += colWidths.tax;
    doc.text('Total', xPos, tableTop + 8, { width: colWidths.total - 10, align: 'right' });
    
    // Table rows
    doc.font('Helvetica')
       .fillColor(this.config.colors.text);
    
    let yPos = tableTop + 35;
    
    (items || []).forEach((item, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(tableLeft, yPos - 5, 495, 25).fill(this.config.colors.light);
      }
      
      doc.fillColor(this.config.colors.text);
      
      xPos = tableLeft + 10;
      doc.fontSize(9)
         .text(item.description || item.productName || 'Item', xPos, yPos, { width: colWidths.description - 10 });
      xPos += colWidths.description;
      doc.text(item.quantity?.toString() || '1', xPos, yPos, { width: colWidths.quantity, align: 'center' });
      xPos += colWidths.quantity;
      doc.text(this.formatCurrency(item.unitPrice || 0), xPos, yPos, { width: colWidths.unitPrice, align: 'right' });
      xPos += colWidths.unitPrice;
      doc.text(`${item.taxRate || 0}%`, xPos, yPos, { width: colWidths.tax, align: 'center' });
      xPos += colWidths.tax;
      doc.text(this.formatCurrency(item.total || (item.quantity * item.unitPrice)), xPos, yPos, { width: colWidths.total - 10, align: 'right' });
      
      yPos += 25;
    });
    
    // Table bottom line
    doc.moveTo(tableLeft, yPos)
       .lineTo(tableLeft + 495, yPos)
       .strokeColor(this.config.colors.border)
       .stroke();
    
    doc.y = yPos + 10;
  }

  /**
   * Add totals section
   */
  addTotals(doc, invoice) {
    const startX = 350;
    let yPos = doc.y + 20;
    
    const totalsData = [
      { label: 'Subtotal', value: invoice.subtotal || 0 },
      { label: 'CGST (9%)', value: invoice.cgst || (invoice.totalTax / 2) || 0 },
      { label: 'SGST (9%)', value: invoice.sgst || (invoice.totalTax / 2) || 0 }
    ];
    
    if (invoice.discount > 0) {
      totalsData.push({ label: 'Discount', value: -invoice.discount, isNegative: true });
    }
    
    // Subtotals
    doc.fontSize(10).font('Helvetica');
    totalsData.forEach(row => {
      doc.fillColor(this.config.colors.secondary)
         .text(row.label, startX, yPos)
         .fillColor(this.config.colors.text)
         .text(this.formatCurrency(row.value), startX + 100, yPos, { width: 95, align: 'right' });
      yPos += 18;
    });
    
    // Total line
    doc.moveTo(startX, yPos)
       .lineTo(startX + 195, yPos)
       .strokeColor(this.config.colors.border)
       .stroke();
    
    yPos += 10;
    
    // Grand total
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.config.colors.primary)
       .text('Total', startX, yPos)
       .text(this.formatCurrency(invoice.total || 0), startX + 100, yPos, { width: 95, align: 'right' });
    
    // Amount in words
    if (invoice.total) {
      yPos += 30;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(this.config.colors.secondary)
         .text(`Amount in words: ${this.numberToWords(invoice.total)} only`, 50, yPos);
    }
    
    doc.y = yPos;
  }

  /**
   * Add footer
   */
  addFooter(doc, invoice) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 120;
    
    // Terms and conditions
    doc.fontSize(9)
       .fillColor(this.config.colors.secondary)
       .text('Terms & Conditions:', 50, footerY);
    
    doc.fontSize(8)
       .text(invoice.termsAndConditions || 'Payment due within 30 days. Thank you for your business!', 50, footerY + 15, {
         width: 300
       });
    
    // Payment info
    doc.fontSize(9)
       .text('Payment Methods:', 370, footerY);
    
    doc.fontSize(8)
       .text('Bank Transfer / UPI / Blockchain', 370, footerY + 15)
       .text('Account: BlockERP Solutions', 370, footerY + 27)
       .text('IFSC: ICIC0001234', 370, footerY + 39);
    
    // Footer line
    doc.moveTo(50, pageHeight - 50)
       .lineTo(doc.page.width - 50, pageHeight - 50)
       .strokeColor(this.config.colors.border)
       .stroke();
    
    // Company footer
    doc.fontSize(8)
       .fillColor(this.config.colors.secondary)
       .text(
         `${this.config.company.name} | ${this.config.company.email} | ${this.config.company.website}`,
         50, pageHeight - 40,
         { align: 'center', width: doc.page.width - 100 }
       );
  }

  /**
   * Add blockchain verification info
   */
  addBlockchainInfo(doc, txHash) {
    const y = doc.y + 30;
    
    doc.fontSize(8)
       .fillColor(this.config.colors.secondary)
       .text('Blockchain Verification:', 50, y);
    
    doc.fontSize(7)
       .font('Courier')
       .fillColor(this.config.colors.text)
       .text(`TX: ${txHash}`, 50, y + 12);
    
    doc.font('Helvetica');
  }

  /**
   * Generate invoice ID
   */
  generateInvoiceId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `INV-${year}-${random}`;
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return `${this.config.currency}${Number(amount).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  /**
   * Convert number to words (Indian numbering)
   */
  numberToWords(num) {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    };
    
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    
    let result = '';
    
    if (intPart >= 10000000) {
      result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
      num = intPart % 10000000;
    }
    if (intPart >= 100000) {
      result += convertLessThanThousand(Math.floor((intPart % 10000000) / 100000)) + ' Lakh ';
    }
    if (intPart >= 1000) {
      result += convertLessThanThousand(Math.floor((intPart % 100000) / 1000)) + ' Thousand ';
    }
    
    result += convertLessThanThousand(intPart % 1000);
    result += ' Rupees';
    
    if (decPart > 0) {
      result += ' and ' + convertLessThanThousand(decPart) + ' Paise';
    }
    
    return result.trim();
  }

  /**
   * Get invoice file path
   */
  getInvoicePath(invoiceId) {
    return path.join(this.invoicesDir, `${invoiceId}.pdf`);
  }

  /**
   * Check if invoice exists
   */
  invoiceExists(invoiceId) {
    return fs.existsSync(this.getInvoicePath(invoiceId));
  }

  /**
   * Upload invoice PDF to IPFS via Pinata
   * @param {string} filePath - Path to PDF file
   * @param {string} fileName - Original filename
   * @returns {Promise<Object|null>} IPFS result or null if Pinata not configured
   */
  async uploadToIPFS(filePath, fileName) {
    if (!pinata) {
      console.log('⚠️  Pinata not configured — skipping IPFS upload');
      return null;
    }

    try {
      const readableStream = fs.createReadStream(filePath);
      const options = {
        pinataMetadata: {
          name: fileName || path.basename(filePath),
          keyvalues: {
            type: 'invoice',
            generatedBy: 'BlockERP',
            timestamp: new Date().toISOString()
          }
        }
      };

      const result = await pinata.pinFileToIPFS(readableStream, options);
      const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

      return {
        ipfsCid: result.IpfsHash,
        ipfsGatewayUrl: `${gateway}/${result.IpfsHash}`,
        pinSize: result.PinSize,
        timestamp: result.Timestamp
      };
    } catch (error) {
      console.error('IPFS upload failed:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new InvoiceService();
