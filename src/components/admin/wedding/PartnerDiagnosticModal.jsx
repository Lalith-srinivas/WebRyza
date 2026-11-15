import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  X, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Link, 
  ExternalLink,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';
import { 
  diagnosePartnerDataConsistency, 
  releaseOrphanedUsername, 
  linkPartnerAuthUid
} from '../../../services/weddingService';

export default function PartnerDiagnosticModal({ isOpen, onClose, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [uidInputs, setUidInputs] = useState({});
  const [copiedEmail, setCopiedEmail] = useState(null);

  const runScan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await diagnosePartnerDataConsistency();
      setData(res);
    } catch (err) {
      console.error('Diagnostic scan error:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', message: 'Failed to complete consistency scan.' });
      }
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    if (isOpen) {
      runScan();
    }
  }, [isOpen, runScan]);

  if (!isOpen) return null;

  const handleRelease = async (username) => {
    try {
      setActionLoading((prev) => ({ ...prev, [username]: true }));
      await releaseOrphanedUsername(username);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: `Released stale username "${username}". It is now available!`
        });
      }
      await runScan();
    } catch (err) {
      console.error('Failed to release username:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', message: err.message || 'Failed to release username.' });
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [username]: false }));
    }
  };

  const handleLinkUid = async (partnerId) => {
    const uidVal = (uidInputs[partnerId] || '').trim();
    if (!uidVal) {
      if (onShowToast) onShowToast({ type: 'error', message: 'Please enter a valid Firebase Auth UID.' });
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [partnerId]: true }));
      await linkPartnerAuthUid(partnerId, uidVal);
      if (onShowToast) {
        onShowToast({ type: 'success', message: 'Linked Auth UID successfully!' });
      }
      await runScan();
    } catch (err) {
      console.error('Failed to link UID:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', message: err.message || 'Failed to link UID.' });
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [partnerId]: false }));
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(id);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Activity size={24} /> System Consistency Diagnostics
          </h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={runScan}
            disabled={loading}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Scanning...' : 'Re-scan'}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Audit tool for Firebase Spark plan: detects orphaned username mappings, unlinked accounts, and stale data.
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--accent-neon)' }} />
            Analyzing Firestore collections and username mappings...
          </div>
        )}

        {!loading && data && (
          <div>
            {/* Quick Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Partners</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>{data.totalPartners}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mappings</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>{data.totalUsernames}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', border: `1px solid ${data.orphanedUsernames.length > 0 ? '#ff4d4f' : 'var(--border-color)'}`, borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: data.orphanedUsernames.length > 0 ? '#ff4d4f' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Stale Mappings</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.orphanedUsernames.length > 0 ? '#ff4d4f' : 'var(--accent-neon)', marginTop: '0.2rem' }}>
                  {data.orphanedUsernames.length}
                </div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unlinked UIDs</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.unlinkedPartners.length > 0 ? '#ffb300' : 'white', marginTop: '0.2rem' }}>
                  {data.unlinkedPartners.length}
                </div>
              </div>
            </div>

            {/* Section 1: Orphaned / Stale Usernames */}
            <div style={{
              background: data.orphanedUsernames.length > 0 ? 'rgba(255, 77, 79, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${data.orphanedUsernames.length > 0 ? 'rgba(255, 77, 79, 0.3)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: data.orphanedUsernames.length > 0 ? '#ff4d4f' : 'white', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {data.orphanedUsernames.length > 0 ? <AlertTriangle size={18} color="#ff4d4f" /> : <CheckCircle2 size={18} color="var(--accent-neon)" />}
                  Orphaned Stale Usernames ({data.orphanedUsernames.length})
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                {data.orphanedUsernames.length > 0 
                  ? 'These username documents exist in partner_usernames, but their partner shops were deleted. This causes "The username is already taken" errors when recreating them. Click "Release Username" to free them up.'
                  : 'All username documents correspond to active partner shops. No orphaned usernames detected.'}
              </p>

              {data.orphanedUsernames.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {data.orphanedUsernames.map((item) => (
                    <div
                      key={item.username}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff4d4f', fontSize: '0.95rem' }}>
                          {item.username}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {item.reason}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={actionLoading[item.username]}
                        onClick={() => handleRelease(item.username)}
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                        {actionLoading[item.username] ? 'Releasing...' : 'Release Username'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Unlinked Partners */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="var(--accent-neon)" /> Unlinked Firebase Auth Accounts ({data.unlinkedPartners.length})
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                Partners on Firebase Spark plan need an account created in the Firebase Console with their login email. Once created, paste their User UID below to link ownership.
              </p>

              {data.unlinkedPartners.length === 0 ? (
                <div style={{ color: 'var(--accent-neon)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> All partner shops have an Auth UID recorded!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.unlinkedPartners.map((item) => (
                    <div
                      key={item.partnerId}
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div>
                          <strong style={{ color: 'white', fontSize: '0.9rem' }}>{item.shopName}</strong>
                          <span className="partner-code-tag" style={{ marginLeft: '0.5rem' }}>{item.partnerId}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <code style={{ fontSize: '0.75rem', color: 'var(--accent-neon)', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                            {item.loginEmail}
                          </code>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => copyToClipboard(item.loginEmail, item.partnerId)}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          >
                            {copiedEmail === item.partnerId ? <Check size={12} color="var(--accent-neon)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Paste Firebase Auth User UID"
                          value={uidInputs[item.partnerId] || ''}
                          onChange={(e) => setUidInputs({ ...uidInputs, [item.partnerId]: e.target.value })}
                          style={{
                            flex: 1,
                            fontSize: '0.8rem',
                            padding: '0.4rem 0.6rem',
                            fontFamily: 'monospace'
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleLinkUid(item.partnerId)}
                          disabled={actionLoading[item.partnerId]}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Link size={13} />
                          {actionLoading[item.partnerId] ? 'Saving...' : 'Link UID'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Firebase Console Quick Link */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a
                href="https://console.firebase.google.com/project/webryza-admin/authentication/users"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
              >
                Open Firebase Authentication Console <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: '100%' }}
          >
            Close Diagnostics
          </button>
        </div>
      </Motion.div>
    </div>
  );
}
