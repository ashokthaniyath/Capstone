/**
 * Barcode Service
 * Generates and manages barcodes for products
 * Uses bwip-js for barcode generation
 */

const bwipjs = require('bwip-js');

class BarcodeService {
  constructor() {
    this.barcodeTypes = {
      CODE128: {
        bcid: 'code128',
        options: { height: 10, includetext: true }
      },
      EAN13: {
        bcid: 'ean13',
        options: { height: 10, includetext: true }
      },
      QR: {
        bcid: 'qrcode',
        options: { scale: 3, padding: 2 }
      },
      DATAMATRIX: {
        bcid: 'datamatrix',
        options: { scale: 3, padding: 2 }
      }
    };
  }

  /**
   * Generate a unique barcode string
   * @param {string} prefix - Optional prefix (e.g., 'SKU', 'PRD')
   * @returns {string} Generated barcode string
   */
  generateBarcodeString(prefix = '') {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const checkDigit = this.calculateCheckDigit(timestamp + random);
    
    const barcode = prefix ? `${prefix}${timestamp}${random}${checkDigit}` : `${timestamp}${random}${checkDigit}`;
    return barcode;
  }

  /**
   * Generate EAN-13 compatible barcode
   * @returns {string} 13-digit barcode
   */
  generateEAN13() {
    // Country code (690-699 for custom use) + product code
    const countryCode = '200'; // UPC-A compatible internal use
    const manufacturerCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const productCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    const partial = countryCode + manufacturerCode + productCode;
    const checkDigit = this.calculateEAN13CheckDigit(partial);
    
    return partial + checkDigit;
  }

  /**
   * Calculate EAN-13 check digit
   */
  calculateEAN13CheckDigit(code) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return ((10 - (sum % 10)) % 10).toString();
  }

  /**
   * Calculate simple check digit
   */
  calculateCheckDigit(code) {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      sum += parseInt(code[i]) || 0;
    }
    return (sum % 10).toString();
  }

  /**
   * Generate barcode image as buffer
   * @param {string} code - Barcode string
   * @param {string} type - Barcode type (CODE128, EAN13, QR, DATAMATRIX)
   * @param {Object} customOptions - Custom options to override defaults
   * @returns {Promise<Buffer>} PNG image buffer
   */
  async generateBarcodeImage(code, type = 'CODE128', customOptions = {}) {
    try {
      const barcodeConfig = this.barcodeTypes[type] || this.barcodeTypes.CODE128;
      
      const options = {
        bcid: barcodeConfig.bcid,
        text: code,
        ...barcodeConfig.options,
        ...customOptions
      };

      const png = await bwipjs.toBuffer(options);
      return png;
    } catch (error) {
      console.error('Barcode generation error:', error.message);
      throw new Error(`Failed to generate barcode: ${error.message}`);
    }
  }

  /**
   * Generate barcode as base64 data URL
   * @param {string} code - Barcode string
   * @param {string} type - Barcode type
   * @returns {Promise<string>} Base64 data URL
   */
  async generateBarcodeBase64(code, type = 'CODE128') {
    try {
      const buffer = await this.generateBarcodeImage(code, type);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate QR code containing product/order data
   * @param {Object} data - Data to encode in QR
   * @returns {Promise<string>} Base64 data URL
   */
  async generateQRCode(data) {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      
      const png = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: jsonString,
        scale: 4,
        padding: 10,
        eclevel: 'M' // Error correction level
      });
      
      return `data:image/png;base64,${png.toString('base64')}`;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Validate barcode format
   * @param {string} code - Barcode to validate
   * @param {string} type - Expected barcode type
   * @returns {Object} Validation result
   */
  validateBarcode(code, type = 'CODE128') {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Barcode is required' };
    }

    switch (type) {
      case 'EAN13':
        if (code.length !== 13) {
          return { valid: false, error: 'EAN-13 must be exactly 13 digits' };
        }
        if (!/^\d{13}$/.test(code)) {
          return { valid: false, error: 'EAN-13 must contain only digits' };
        }
        // Verify check digit
        const expectedCheck = this.calculateEAN13CheckDigit(code.slice(0, 12));
        if (code[12] !== expectedCheck) {
          return { valid: false, error: 'Invalid EAN-13 check digit' };
        }
        return { valid: true, type: 'EAN13' };

      case 'CODE128':
        if (code.length < 1 || code.length > 48) {
          return { valid: false, error: 'CODE128 must be 1-48 characters' };
        }
        return { valid: true, type: 'CODE128' };

      case 'QR':
        return { valid: true, type: 'QR' };

      default:
        return { valid: true, type: 'UNKNOWN' };
    }
  }

  /**
   * Parse barcode and extract information
   * @param {string} code - Scanned barcode
   * @returns {Object} Parsed barcode info
   */
  parseBarcode(code) {
    if (!code) {
      return { success: false, error: 'No barcode provided' };
    }

    // Detect barcode type
    let type = 'UNKNOWN';
    let info = {};

    if (/^\d{13}$/.test(code)) {
      type = 'EAN13';
      info = {
        countryCode: code.slice(0, 3),
        manufacturerCode: code.slice(3, 7),
        productCode: code.slice(7, 12),
        checkDigit: code[12]
      };
    } else if (/^\d{12}$/.test(code)) {
      type = 'UPC-A';
      info = {
        systemDigit: code[0],
        manufacturerCode: code.slice(1, 6),
        productCode: code.slice(6, 11),
        checkDigit: code[11]
      };
    } else if (code.startsWith('{') || code.startsWith('[')) {
      // Likely QR code with JSON data
      type = 'QR_JSON';
      try {
        info = JSON.parse(code);
      } catch {
        info = { raw: code };
      }
    } else {
      type = 'CODE128';
      info = { raw: code };
    }

    return {
      success: true,
      code,
      type,
      info
    };
  }

  /**
   * Generate product label with barcode
   * @param {Object} product - Product data
   * @returns {Promise<Object>} Label data with barcode
   */
  async generateProductLabel(product) {
    try {
      const barcode = product.barcode || this.generateBarcodeString('PRD');
      const barcodeImage = await this.generateBarcodeBase64(barcode, 'CODE128');
      
      // Generate QR with full product info
      const qrData = {
        sku: product.sku,
        name: product.name,
        barcode,
        price: product.price
      };
      const qrCode = await this.generateQRCode(qrData);

      return {
        success: true,
        product: {
          name: product.name,
          sku: product.sku,
          price: product.price,
          barcode
        },
        barcodeImage,
        qrCode
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch generate barcodes
   * @param {number} count - Number of barcodes to generate
   * @param {string} type - Barcode type
   * @returns {Array} Array of barcode strings
   */
  batchGenerate(count, type = 'CODE128') {
    const barcodes = [];
    for (let i = 0; i < count; i++) {
      if (type === 'EAN13') {
        barcodes.push(this.generateEAN13());
      } else {
        barcodes.push(this.generateBarcodeString());
      }
    }
    return barcodes;
  }
}

// Export singleton instance
module.exports = new BarcodeService();
