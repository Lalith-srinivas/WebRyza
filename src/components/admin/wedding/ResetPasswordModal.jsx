import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, ExternalLink, Mail, Copy, Check, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import { usernameToEmail, sendPartnerPasswordResetEmail } from '../../../services/weddingService';

export default function ResetPasswordModal({ partner, isOpen, onClose }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !partner) return null;

  const loginUsername = (partner.username || partner.partnerCode || '').toLowerCase().trim();
  const loginEmail = partner.loginEmail || usernameToEmail(loginUsername);
  const contactEmail = (partner.email || '').trim();

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(loginEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendResetEmail = async () => {
    if (!contactEmail) {
      setError('This partner has no contact email recorded. Please use the Firebase Console option below or edit partner details.');
      return;
    }

    try {
      setIsSendingEmail(true);
      setError('');
      await sendPartnerPasswordResetEmail(contactEmail);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to send reset email:', err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '520px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>
          Partner Password Management
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Manage credentials for <strong>{partner.shopName}</strong> ({partner.partnerCode}) on the Firebase Spark plan.
        </p>

        {/* Partner Identity Card */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Portal Username
            </span>
            <span className="partner-code-tag">{partner.partnerCode}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'white', fontSize: '1.05rem', marginBottom: '0.75rem' }}>
            {loginUsername}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Firebase Authentication Login Email:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                color: 'var(--accent-neon)',
                fontSize: '0.85rem',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {loginEmail}
              </code>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyEmail}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copiedEmail ? <Check size={14} color="var(--accent-neon)" /> : <Copy size={14} />}
                {copiedEmail ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 77, 79, 0.1)',
            border: '1px solid rgba(255, 77, 79, 0.3)',
            color: '#ff4d4f',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {emailSuccess && (
          <div style={{
            background: 'rgba(57, 255, 20, 0.1)',
            border: '1px solid rgba(57, 255, 20, 0.3)',
            color: 'var(--accent-neon)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} /> Password reset email sent successfully!
          </div>
        )}

        {/* Option 1: Manual Console Workflow */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <KeyRound size={16} color="var(--accent-neon)" /> Option 1: Set New Password in Firebase Console
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
            On the Firebase Spark plan, administrator-initiated password resets are securely performed directly in the Firebase Console:
          </p>
          <ol style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', paddingLeft: '1.25rem', margin: 0, lineHeight: '1.5' }}>
            <li>Copy the login email: <code>{loginEmail}</code></li>
            <li>Open the Firebase Console Users tab using the button below.</li>
            <li>Locate the user, click the <strong>three dots (⋮)</strong>, and select <strong>Reset password</strong> or <strong>Change password</strong>.</li>
          </ol>
          <div style={{ marginTop: '0.85rem' }}>
            <a
              href="https://console.firebase.google.com/project/webryza-admin/authentication/users"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.85rem',
                padding: '0.6rem 1rem'
              }}
            >
              Open Firebase Console Authentication <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Option 2: Email Reset Link */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mail size={16} color="#2196f3" /> Option 2: Send Password Reset Link to Contact Email
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
            {contactEmail ? (
              <>Sends a secure Firebase reset link to partner&apos;s personal email: <strong>{contactEmail}</strong></>
            ) : (
              <>No personal contact email on record for this shop. You can add one in Edit Partner.</>
            )}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSendResetEmail}
            disabled={!contactEmail || isSendingEmail}
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            {isSendingEmail ? 'Sending Reset Link...' : 'Send Password Reset Email'}
          </button>
        </div>

        {/* Security Note */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          lineHeight: '1.4',
          padding: '0.5rem 0.25rem'
        }}>
          <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ffb300' }} />
          <span>
            Partners can also change their password themselves after logging in at{' '}
            <strong style={{ color: 'white' }}>cards.webryza.in/admin</strong>.
          </span>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: '100%' }}
          >
            Close
          </button>
        </div>
      </Motion.div>
    </div>
  );
}
