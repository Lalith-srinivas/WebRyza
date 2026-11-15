import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ResetPasswordModal({ partner, isOpen, onClose, onResetPassword }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && partner) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, partner]);

  if (!isOpen || !partner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onResetPassword(partner.id, newPassword);
      onClose();
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset partner password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '460px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>
          Reset Partner Password
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Set a new login password for <strong>{partner.shopName}</strong> ({partner.partnerCode}).
        </p>

        {/* Partner Credential Target Info */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Login Account</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-neon)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
              {partner.username || partner.partnerCode.toLowerCase()}
            </div>
          </div>
          <span className="partner-code-tag">{partner.partnerCode}</span>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 77, 79, 0.1)',
            border: '1px solid rgba(255, 77, 79, 0.3)',
            color: '#ff4d4f',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={15} color="var(--accent-neon)" /> New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={15} color="var(--accent-neon)" /> Confirm New Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{
            background: 'rgba(57, 255, 20, 0.04)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem'
          }}>
            Passwords are updated securely in Firebase Authentication. They are never saved or exposed in plaintext.
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
