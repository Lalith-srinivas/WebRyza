import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion as Motion } from 'framer-motion';
import { X, Download, Copy, Check, ExternalLink, Key, User, Lock } from 'lucide-react';
import { usernameToEmail } from '../../../services/weddingService';

export default function PartnerQrModal({ partner, onClose, onShowToast }) {
  const canvasRef = useRef(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const regUrl = partner?.registrationUrl || `https://cards.webryza.in/?ref=${partner?.partnerCode || ''}`;
  const username = (partner?.username || partner?.partnerCode || '').toLowerCase().trim();
  const loginEmail = partner?.loginEmail || usernameToEmail(username);

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
    setCopiedLink(true);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        message: `Copied ${partner?.partnerCode} registration link!`
      });
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(loginEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPassword = () => {
    if (partner?.intendedPassword) {
      navigator.clipboard.writeText(partner.intendedPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!partner) return;

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
        style={{ maxWidth: '480px', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>
          Partner Registration &amp; QR
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Registration QR code and portal credentials for <strong>{partner.shopName}</strong>.
        </p>

        {/* QR Code Canvas Card */}
        <div className="qr-display-box" style={{ margin: '0 auto 1.25rem' }}>
          <canvas ref={canvasRef} style={{ display: isReady ? 'block' : 'none' }} />
          {!isReady && (
            <div style={{ height: 260, width: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
              Generating QR Code...
            </div>
          )}
          <div className="qr-partner-caption">{partner.shopName}</div>
          <div className="qr-partner-subcaption">Code: {partner.partnerCode}</div>
        </div>

        {/* Registration URL Box */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            textAlign: 'left'
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Permanent Registration URL:</span>
            <span style={{ color: 'var(--accent-neon)', fontFamily: 'monospace' }}>{regUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="icon-btn"
            title="Copy Link"
            style={{ flexShrink: 0 }}
          >
            {copiedLink ? <Check size={18} color="var(--accent-neon)" /> : <Copy size={18} />}
          </button>
        </div>

        {/* Credentials & Spark Plan Auth Card */}
        <div style={{
          background: 'rgba(57, 255, 20, 0.04)',
          border: '1px solid rgba(57, 255, 20, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.25rem',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-neon)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={15} /> Partner Login Credentials
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={13} /> Username:
              </span>
              <code style={{ color: 'white', fontWeight: 600 }}>{username}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auth Login Email:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <code style={{ color: 'var(--accent-neon)', fontSize: '0.75rem' }}>{loginEmail}</code>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="icon-btn"
                  title="Copy Login Email"
                  style={{ padding: '2px', background: 'transparent' }}
                >
                  {copiedEmail ? <Check size={13} color="var(--accent-neon)" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {partner.intendedPassword && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Lock size={13} /> Chosen Password:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <code style={{ color: 'white' }}>{partner.intendedPassword}</code>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="icon-btn"
                    title="Copy Password"
                    style={{ padding: '2px', background: 'transparent' }}
                  >
                    {copiedPassword ? <Check size={13} color="var(--accent-neon)" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
            <a
              href="https://console.firebase.google.com/project/webryza-admin/authentication/users"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent-neon)',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none'
              }}
            >
              Add User in Firebase Console Authentication <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleDownloadQr} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Download size={16} />
            Download QR
          </button>
          <button className="btn btn-secondary" onClick={handleCopyLink} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {copiedLink ? <Check size={16} color="var(--accent-neon)" /> : <Copy size={16} />}
            {copiedLink ? 'Copied Link' : 'Copy Link'}
          </button>
        </div>
      </Motion.div>
    </div>
  );
}
