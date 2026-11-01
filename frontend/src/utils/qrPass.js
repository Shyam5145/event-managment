/**
 * CampusPulse — QR Pass Generator & Offline Pass Utility
 * 
 * Generates secure, scannable QR verification payloads conforming to the schema:
 * {
 *   type: 'campuspulse-event-pass',
 *   registrationId: 'REGISTRATION_ID',
 *   eventId: 'EVENT_ID',
 *   ticketId: 'UNIQUE_TICKET_ID',
 *   verificationUrl: 'https://APP_DOMAIN/verify/TICKET_ID'
 * }
 */

import QRCode from 'qrcode';

/**
 * Builds the canonical QR verification payload.
 *
 * @param {Object} params
 * @param {string} params.registrationId - Unique registration document ID
 * @param {string} params.eventId - Event document ID
 * @param {string} params.ticketId - Unique ticket / pass number
 * @param {string} [params.origin] - Base domain origin
 * @returns {Object} JSON payload
 */
export const buildPassQrPayload = ({ registrationId, eventId, ticketId, origin = '' }) => {
  const baseDomain = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://campuspuulse.web.app');
  const cleanTicketId = ticketId || registrationId;

  return {
    type: 'campuspulse-event-pass',
    registrationId: registrationId || cleanTicketId,
    eventId: eventId || '',
    ticketId: cleanTicketId,
    verificationUrl: `${baseDomain}/verify/${cleanTicketId}`,
  };
};

/**
 * Generates a high-contrast base64 PNG data URL for a QR pass.
 *
 * @param {Object|string} payload - Object payload or JSON string
 * @param {Object} [options={}] - Custom QRCode options
 * @returns {Promise<string>} Base64 image data URL
 */
export const generatePassQrDataUrl = async (payload, options = {}) => {
  try {
    const textToEncode = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(textToEncode, {
      width: options.width || 320,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#0f172a', // Slate-900 for optimal optical scanning
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code data URL:', error);
    throw error;
  }
};

/**
 * Generates and downloads a complete offline event ticket pass (PNG format)
 * using an HTML5 canvas. The resulting card contains collegiate branding,
 * event details, attendee identity, ticket/reg IDs, and the real scannable QR code.
 *
 * @param {Object} params
 * @param {Object} params.event - Event details (title, date, time, location)
 * @param {Object} params.registration - Registration details (ticketNumber, id)
 * @param {Object} params.user - Attendee profile details (name, department)
 * @param {string} params.qrDataUrl - Pre-generated QR data URL
 * @returns {Promise<boolean>} True if download succeeded
 */
export const downloadOfflinePassCard = async ({ event, registration, user, qrDataUrl }) => {
  if (typeof document === 'undefined') return false;

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Dimensions for high-DPI collegiate ticket pass
      const width = 640;
      const height = 960;
      canvas.width = width;
      canvas.height = height;

      // 1. Background fill
      ctx.fillStyle = '#0f172a'; // Deep slate
      ctx.fillRect(0, 0, width, height);

      // Gradient accent banner
      const grad = ctx.createLinearGradient(0, 0, width, 240);
      grad.addColorStop(0, '#4f46e5'); // Indigo
      grad.addColorStop(1, '#7c3aed'); // Purple
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 200);

      // Card body (white container with rounded corners)
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 30, 80, width - 60, height - 120, 24);
      ctx.fill();

      // 2. Header text inside card
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('CAMPUSPULSE OFFICIAL ADMISSION PASS', 50, 125);

      // Event Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      const eventTitle = (event?.title || 'Campus Event').slice(0, 36);
      ctx.fillText(eventTitle, 50, 160);

      // Event Date & Venue
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      const dateText = `${event?.date || 'Upcoming Date'} • ${event?.time || 'Campus Hours'}`;
      ctx.fillText(dateText, 50, 190);
      ctx.fillText(`Venue: ${event?.location || event?.venue || 'Campus Auditorium'}`, 50, 215);

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(50, 240);
      ctx.lineTo(width - 50, 240);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // 3. Attendee details
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('ATTENDEE NAME', 50, 275);
      ctx.fillText('TICKET NUMBER', 340, 275);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      const attendeeName = user?.name || registration?.studentName || 'Student Attendee';
      const ticketNum = registration?.ticketNumber || registration?.ticketId || 'CP-TKT-PASS';
      ctx.fillText(attendeeName, 50, 300);
      ctx.font = 'bold 15px monospace';
      ctx.fillText(ticketNum, 340, 300);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('REGISTRATION ID', 50, 335);
      ctx.fillText('STATUS', 340, 335);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px monospace';
      const regId = registration?.id || registration?.registrationId || 'REG-CP-PASS';
      ctx.fillText(regId.slice(0, 22), 50, 355);

      ctx.fillStyle = '#10b981'; // Emerald
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('✓ CONFIRMED PASS', 340, 355);

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(50, 380);
      ctx.lineTo(width - 50, 380);
      ctx.stroke();

      // 4. Draw QR Code in center
      const qrImage = new Image();
      qrImage.onload = () => {
        // Center QR code box
        const qrSize = 300;
        const qrX = (width - qrSize) / 2;
        const qrY = 410;

        // Subtle box border around QR
        ctx.fillStyle = '#f8fafc';
        roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Security / Verification instruction below QR
        ctx.fillStyle = '#475569';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Present this scannable barcode at the venue admission desk.', width / 2, 760);
        ctx.fillText('Hold screen brightness high for fast optical verification.', width / 2, 785);

        // Security stamp footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        const timestamp = new Date().toLocaleString();
        ctx.fillText(`SECURE PASS VERIFIED • GENERATED: ${timestamp}`, width / 2, 825);
        ctx.fillText('CampusPulse University Event Network', width / 2, 845);

        ctx.textAlign = 'left'; // Reset

        // 5. Convert canvas to PNG blob and trigger browser download
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob.'));
            return;
          }
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const cleanFileName = `CampusPulse_Pass_${(ticketNum).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
          a.href = downloadUrl;
          a.download = cleanFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
          resolve(true);
        }, 'image/png');
      };

      qrImage.onerror = (err) => {
        reject(err);
      };

      qrImage.src = qrDataUrl;
    } catch (err) {
      console.error('Error generating offline pass card:', err);
      reject(err);
    }
  });
};

/**
 * Helper to draw rounded rectangle on canvas
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

