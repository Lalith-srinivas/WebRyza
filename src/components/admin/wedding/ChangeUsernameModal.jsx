import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, Key, User, Check, AlertCircle } from 'lucide-react';

export default function ChangeUsernameModal({ partner, isOpen, onClose, onChangeUsername }) {
  const [newUsername, setNewUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && partner) {
      setNewUsername('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, partner]);

  if (!isOpen || !partner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = newUsername.toLowerCase().trim();

    if (!clean) {
      setError('Please enter a new username.');
      return;
    }
    if (clean === (partner.username || '').toLowerCase().trim()) {
      setError('New username must be different from current username.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(clean)) {
      setError('Username must be 3-30 characters long (letters, numbers, hyphens, and underscores only).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onChangeUsername(partner.id, clean);
      onClose();
    } catch (err) {
      console.error('Error changing username:', err);
      let msg = err.message || 'Failed to update username.';
      if (msg.toLowerCase() === 'internal' || err.code === 'functions/internal') {
        msg = 'Cloud Function unavailable or encountered an error. Please verify backend functions or retry.';
      }
      setError(msg);
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
          Change Partner Username
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Update the login username for <strong>{partner.shopName}</strong> ({partner.partnerCode}).
        </p>

        {/* Current Username Info */}
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Username</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'white', fontSize: '1rem', marginTop: '0.2rem' }}>
              {partner.username || 'Not configured'}
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
              <User size={15} color="var(--accent-neon)" /> New Username *
            </label>
            <input
              type="text"
              placeholder="e.g. lakshmicards_new"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{ fontFamily: 'monospace' }}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Internal login address will update to: {newUsername ? `${newUsername.toLowerCase().trim()}@partner.webryza.in` : 'username@partner.webryza.in'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
              {isSubmitting ? 'Updating...' : 'Update Username'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
