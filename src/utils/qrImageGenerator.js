// ===================================
// src/utils/qrImageGenerator.js
// ===================================
const QRCode = require('qrcode');
const sharp = require('sharp');
const { FILE_LIMITS, URLS } = require('./constants');

class QRImageGenerator {
  /**
   * Genera imagen QR basica como buffer PNG
   */
  async generateQRImage(data, options = {}) {
    try {
      const defaultOptions = {
        type: 'png',
        quality: FILE_LIMITS.QR_IMAGE_QUALITY,
        margin: 1,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        width: FILE_LIMITS.QR_IMAGE_SIZE
      };

      const mergedOptions = { ...defaultOptions, ...options };

      return await QRCode.toBuffer(data, mergedOptions);
    } catch (error) {
      throw new Error(`Error generando imagen QR: ${error.message}`);
    }
  }

  /**
   * Genera QR con logo de la funeraria al centro
   */
  async generateCustomQRImage(data, options = {}) {
    try {
      const qrBuffer = await this.generateQRImage(data, {
        margin: 2,
        width: 600,
        darkColor: options.darkColor,
        lightColor: options.lightColor
      });

      let finalImage = sharp(qrBuffer);

      if (options.logoPath || options.logoBuffer) {
        const logoSource = options.logoPath || options.logoBuffer;
        const logoSize = 80;

        const processedLogo = await sharp(logoSource)
          .resize(logoSize, logoSize, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toBuffer();

        finalImage = finalImage.composite([{ input: processedLogo, gravity: 'center' }]);
      }

      return await finalImage
        .resize(FILE_LIMITS.QR_IMAGE_SIZE, FILE_LIMITS.QR_IMAGE_SIZE)
        .png({ quality: Math.floor(FILE_LIMITS.QR_IMAGE_QUALITY * 100) })
        .toBuffer();
    } catch (error) {
      throw new Error(`Error generando QR personalizado: ${error.message}`);
    }
  }

  /**
   * Genera el QR de una sala a partir de su codigo fijo
   */
  async generateSalaQR(code, options = {}) {
    const url = this.buildSalaUrl(code);
    return await this.generateCustomQRImage(url, options);
  }

  /**
   * Genera el QR como data URL (util para previsualizar en el panel)
   */
  async generateQRDataURL(data, options = {}) {
    try {
      return await QRCode.toDataURL(data, {
        margin: 1,
        width: FILE_LIMITS.QR_IMAGE_SIZE,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        }
      });
    } catch (error) {
      throw new Error(`Error generando QR data URL: ${error.message}`);
    }
  }

  /**
   * Construye la URL publica del pergamino de una sala
   */
  buildSalaUrl(code) {
    return `${URLS.QR_BASE}/${code}`;
  }
}

module.exports = { qrImageGenerator: new QRImageGenerator() };
