// backend/utils/qrHelper.js
const QRCode = require('qrcode');

/**
 * Generates a QR code as PNG buffer.
 * @param {string} text - The text to encode (e.g., IPFS URL)
 * @returns {Promise<Buffer>} - PNG image buffer
 */
async function generateQRCodeBuffer(text) {
  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
    });
    return qrBuffer;
  } catch (err) {
    throw new Error('Failed to generate QR code: ' + err.message);
  }
}

module.exports = { generateQRCodeBuffer };
