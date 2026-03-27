import QRCode from 'qrcode';

/**
 * Generates a QR code as a base64-encoded PNG data URL.
 * @param data - The string to encode (usually a verification URL)
 * @returns base64 PNG data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
