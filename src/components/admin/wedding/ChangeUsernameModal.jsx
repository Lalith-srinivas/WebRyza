import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, Key, User, ExternalLink } from 'lucide-react';
import { usernameToEmail, normalizeUsername } from '../../../services/weddingService';

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

  const currentClean = normalizeUsername(partner.username || partner.partnerCode);
  const prospectiveClean = normalizeUsername(newUsername);
  const prospectiveEmail = usernameToEmail(prospectiveClean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prospectiveClean) {
      setError('Please enter a new username.');
      return;
    }
    if (prospectiveClean === currentClean) {
      setError('New username must be different from current username.');
      return;
    }
    if (!/^[a-z0-9_-]{3,30}$/.test(prospectiveClean)) {
      setError('Username must be 3-30 characters long (lowercase letters, numbers, hyphens, and underscores only).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onChangeUsername(partner.id, prospectiveClean);
      onClose();
    } catch (err) {
      console.error('Error changing username:', err);
      setError(err.message || 'Failed to update username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '480px' }}
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
          Update the portal username for <strong>{partner.shopName}</strong> ({partner.partnerCode}).
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
              {currentClean || 'Not configured'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Email: <code>{usernameToEmail(currentClean)}</code>
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
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <User size={15} color="var(--accent-neon)" /> New Unique Username *
            </label>
            <input
              type="text"
              placeholder="e.g. lakshmicards_new"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{ fontFamily: 'monospace' }}
              required
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              New Login Address: <code style={{ color: 'var(--accent-neon)' }}>{prospectiveEmail || '...'}</code>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            <strong>Important Spark Note:</strong> Updating here immediately releases the old username in Firestore and reserves the new one. If you maintain this account in Firebase Console, update the user email to <code>{prospectiveEmail || 'new email'}</code> in Firebase Console as well.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !prospectiveClean}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Key size={16} />
              {isSubmitting ? 'Updating...' : 'Update Username'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
