import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  X, 
  Store, 
  User, 
  Phone, 
  QrCode, 
  Copy, 
  Edit2, 
  Power, 
  FolderKanban, 
  IndianRupee,
  Trash2,
  Key,
  Lock,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatWeddingDate } from '../../../utils/weddingCommission';

export default function PartnerDetailModal({
  partner,
  partnerProjects = [],
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpenQr,
  onCopyLink,
  onOpenChangeUsername,
  onOpenResetPassword,
  onSelectProject
}) {
  const [copiedUser, setCopiedUser] = useState(false);

  if (!isOpen || !partner) return null;

  // Dynamically compute exact financial metrics
  const totalCharged = partnerProjects.reduce((acc, p) => acc + (Number(p.amountCharged) || 0), 0) || Number(partner.totalAmountCharged) || 0;
  const totalWebRyza = partnerProjects.reduce((acc, p) => acc + (Number(p.webryzaShare) || 0), 0) || Number(partner.totalAmountDue) || 0;
  const totalPaid = partnerProjects.reduce((acc, p) => acc + (Number(p.amountReceivedByWebryza) || 0), 0) || Number(partner.totalAmountPaid) || 0;
  const totalDue = Math.max(0, totalWebRyza - totalPaid);

  const pendingProjects = partnerProjects.filter((p) => p.paymentStatus !== 'paid');
  const pendingCount = pendingProjects.length;

  const handleCopyUsername = () => {
    if (partner.username) {
      navigator.clipboard.writeText(partner.username);
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="wedding-modal-content bg-glass"
        style={{ maxWidth: '980px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', margin: 0, fontSize: '1.8rem' }}>
                {partner.shopName}
              </h2>
              <span className="partner-code-tag">{partner.partnerCode}</span>
              <span
                className={`status-badge ${partner.isActive !== false ? 'active' : 'suspended'}`}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
              >
                {partner.isActive !== false ? 'Active Partner' : 'Deactivated'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Owned by <strong style={{ color: 'white' }}>{partner.ownerName}</strong> • Phone: <strong style={{ color: 'white' }}>{partner.phone}</strong>
            </p>
          </div>

          {/* Quick Username Pill */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Key size={16} color="var(--accent-neon)" />
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Username: </span>
              <strong style={{ fontFamily: 'monospace', color: 'white' }}>{partner.username || partner.partnerCode.toLowerCase()}</strong>
            </div>
            <button
              onClick={handleCopyUsername}
              className="icon-btn"
              title="Copy Username"
              style={{ width: '28px', height: '28px' }}
            >
              {copiedUser ? <Check size={14} color="var(--accent-neon)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenQr(partner)}>
            <QrCode size={15} style={{ marginRight: '0.4rem' }} /> View & Download QR
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onCopyLink(partner)}>
            <Copy size={15} style={{ marginRight: '0.4rem' }} /> Copy Link
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onOpenChangeUsername(partner)}>
            <Key size={15} style={{ marginRight: '0.4rem' }} /> Change Username
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onOpenResetPassword(partner)}>
            <Lock size={15} style={{ marginRight: '0.4rem' }} /> Reset Password
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(partner)}>
            <Edit2 size={15} style={{ marginRight: '0.4rem' }} /> Edit Shop
          </button>
          <button
            className={`btn btn-sm ${partner.isActive !== false ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => onToggleStatus(partner.id, !(partner.isActive !== false))}
          >
            <Power size={15} style={{ marginRight: '0.4rem' }} />
            {partner.isActive !== false ? 'Deactivate Partner' : 'Activate Partner'}
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(partner)}
            title="Permanently Delete Partner"
          >
            <Trash2 size={15} style={{ marginRight: '0.4rem' }} />
            Delete
          </button>
        </div>

        {/* SECTION 3: Summary Financial Highlights */}
        <div className="modal-section">
          <div className="modal-section-title">
            <IndianRupee size={18} /> Partner Financial Overview
          </div>
          <div className="partner-stats-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            <div className="partner-stat-item">
              <div className="label">Total Projects</div>
              <div className="val" style={{ color: 'var(--text-primary)' }}>
                {partnerProjects.length || partner.totalProjects || 0}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Total Charged</div>
              <div className="val" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(totalCharged)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">WebRyza Amount</div>
              <div className="val" style={{ color: 'var(--accent-neon)' }}>
                {formatCurrency(totalWebRyza)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Total Paid</div>
              <div className="val" style={{ color: '#4caf50' }}>
                {formatCurrency(totalPaid)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Total Amount Due</div>
              <div className="val" style={{ color: totalDue > 0 ? '#ff4d4f' : '#4caf50' }}>
                {formatCurrency(totalDue)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Pending Payments</div>
              <div className="val" style={{ color: pendingCount > 0 ? '#ff9800' : 'var(--text-secondary)' }}>
                {pendingCount} ({formatCurrency(totalDue)})
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Registration Link Info */}
        <div className="modal-section">
          <div className="modal-section-title">
            <Store size={18} /> Shop & Credential Information
          </div>
          <div className="info-grid-3">
            <div className="info-item">
              <div className="info-label">Shop Name</div>
              <div className="info-value">{partner.shopName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Partner ID</div>
              <div className="info-value" style={{ fontFamily: 'monospace', color: 'var(--accent-neon)' }}>
                {partner.partnerCode}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Login Username</div>
              <div className="info-value" style={{ fontFamily: 'monospace' }}>
                {partner.username || partner.partnerCode.toLowerCase()}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Owner Name</div>
              <div className="info-value">{partner.ownerName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Phone Number</div>
              <div className="info-value">{partner.phone}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Email Address</div>
              <div className="info-value">{partner.email || 'None recorded'}</div>
            </div>
            <div className="info-item" style={{ gridColumn: 'span 3' }}>
              <div className="info-label">Shop Address</div>
              <div className="info-value">{partner.address || 'None recorded'}</div>
            </div>
            <div className="info-item" style={{ gridColumn: 'span 3' }}>
              <div className="info-label">Permanent Registration Link</div>
              <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-neon)' }}>
                {partner.registrationUrl}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Partner Project Management Table */}
        <div className="modal-section">
          <div className="modal-section-title">
            <FolderKanban size={18} /> Partner Wedding Projects ({partnerProjects.length})
          </div>

          {partnerProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No wedding projects referred by this partner yet.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Couple Name</th>
                    <th>Wedding Date</th>
                    <th>Total Charged</th>
                    <th>WebRyza Amount</th>
                    <th>Amount Paid</th>
                    <th>Remaining Amount</th>
                    <th>Payment Status</th>
                    <th>Project Status</th>
                    <th>Website Link</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerProjects.map((proj) => {
                    const remaining = Number(proj.amountDueToWebryza) || Math.max(0, (Number(proj.webryzaShare) || 0) - (Number(proj.amountReceivedByWebryza) || 0));
                    return (
                      <tr
                        key={proj.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          onClose();
                          if (onSelectProject) onSelectProject(proj);
                        }}
                        title="Click to view wedding project"
                      >
                        {/* 1. Couple Name */}
                        <td style={{ fontWeight: 600, color: 'var(--accent-neon)' }}>
                          {proj.brideName} & {proj.groomName}
                        </td>

                        {/* 2. Wedding Date */}
                        <td>{formatWeddingDate(proj.weddingDate)}</td>

                        {/* 3. Total Charged */}
                        <td>{formatCurrency(proj.amountCharged)}</td>

                        {/* 4. WebRyza Amount */}
                        <td style={{ fontWeight: 600 }}>{formatCurrency(proj.webryzaShare)}</td>

                        {/* 5. Amount Paid */}
                        <td style={{ color: '#4caf50' }}>{formatCurrency(proj.amountReceivedByWebryza)}</td>

                        {/* 6. Remaining Amount */}
                        <td style={{ color: remaining > 0 ? '#ff4d4f' : '#4caf50', fontWeight: 600 }}>
                          {formatCurrency(remaining)}
                        </td>

                        {/* 7. Payment Status */}
                        <td>
                          <span className={`payment-badge ${proj.paymentStatus}`}>
                            {proj.paymentStatus}
                          </span>
                        </td>

                        {/* 8. Project Status */}
                        <td>
                          <span className={`status-badge ${proj.status}`}>
                            {proj.status}
                          </span>
                        </td>

                        {/* 9. Website Link */}
                        <td onClick={(e) => e.stopPropagation()}>
                          {proj.websiteUrl ? (
                            <a
                              href={proj.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--accent-neon)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              Visit <ExternalLink size={13} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
}
