import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion as Motion } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';

export default function PartnerQrModal({ partner, onClose, onShowToast }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const regUrl = partner?.registrationUrl || `https://cards.webryza.in/?ref=${partner?.partnerCode || ''}`;

  useEffect(() => {
    if (!canvasRef.current || !partner) return;

    QRCode.toCanvas(
      canvasRef.current,
      regUrl,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      },
      (err) => {
        if (!err) {
          setIsReady(true);
        } else {
          console.error("QR Code generation error:", err);
        }
      }
    );
  }, [partner, regUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(regUrl);
    setCopied(true);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        message: `Copied ${partner?.partnerCode} registration link!`
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!partner) return;

    // Create a high-res branded export canvas
    const exportCanvas = document.createElement('canvas');
    const width = 600;
    const height = 750;
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top Header Banner
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, 120);

    // Header Title
    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 32px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WebRyza Wedding Cards', width / 2, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Outfit, sans-serif';
    ctx.fillText('Official Printing Partner Registration', width / 2, 90);

    // Shop Name
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.fillText(partner.shopName || 'Partner Shop', width / 2, 180);

    // Partner Code
    ctx.fillStyle = '#555555';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText(`Partner Code: ${partner.partnerCode}`, width / 2, 215);

    // Draw QR Code centered
    if (canvasRef.current) {
      const qrSize = 380;
      const qrX = (width - qrSize) / 2;
      const qrY = 245;
      ctx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);
    }

    // Bottom Scan Instruction
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText('Scan QR Code to Register Wedding Card Order', width / 2, 660);

    // Bottom link
    ctx.fillStyle = '#777777';
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillText(regUrl, width / 2, 695);

    // Download PNG
    const link = document.createElement('a');
    link.download = `${partner.partnerCode}-${(partner.shopName || 'shop').replace(/\s+/g, '_')}-QR.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    if (onShowToast) {
      onShowToast({
        type: 'success',
        message: 'QR Code PNG downloaded successfully!'
      });
    }
  };

  if (!partner) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '440px', textAlign: 'center' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>
          Partner QR Code
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Scan to open the direct registration form for this partner.
        </p>

        <div className="qr-display-box">
          <canvas ref={canvasRef} style={{ display: isReady ? 'block' : 'none' }} />
          {!isReady && (
            <div style={{ height: 260, width: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
              Generating QR Code...
            </div>
          )}
          <div className="qr-partner-caption">{partner.shopName}</div>
          <div className="qr-partner-subcaption">Code: {partner.partnerCode}</div>
        </div>

        {/* Registration URL box */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            textAlign: 'left'
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>URL: </span>
            <span style={{ color: 'var(--accent-neon)', fontFamily: 'monospace' }}>{regUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="icon-btn"
            title="Copy Link"
            style={{ flexShrink: 0 }}
          >
            {copied ? <Check size={18} color="var(--accent-neon)" /> : <Copy size={18} />}
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleDownloadQr} style={{ flex: 1 }}>
            <Download size={18} style={{ marginRight: '0.5rem' }} />
            Download QR
          </button>
          <button className="btn btn-secondary" onClick={handleCopyLink} style={{ flex: 1 }}>
            {copied ? <Check size={18} style={{ marginRight: '0.5rem' }} /> : <Copy size={18} style={{ marginRight: '0.5rem' }} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </Motion.div>
    </div>
  );
}
