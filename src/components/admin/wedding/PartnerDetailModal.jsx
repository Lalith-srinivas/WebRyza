import React from 'react';
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
  IndianRupee
} from 'lucide-react';
import { formatCurrency, formatWeddingDate } from '../../../utils/weddingCommission';

export default function PartnerDetailModal({
  partner,
  partnerProjects = [],
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onOpenQr,
  onCopyLink,
  onSelectProject
}) {
  if (!isOpen || !partner) return null;

  const totalOwed = Number(partner.totalAmountDue) || 0;
  const totalPaid = Number(partner.totalAmountPaid) || 0;
  const outstanding = Math.max(0, (Number(partner.totalAmountDue) || 0) - totalPaid);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="wedding-modal-content bg-glass"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', margin: 0 }}>
                {partner.shopName}
              </h2>
              <span className="partner-code-tag">{partner.partnerCode}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Managed by {partner.ownerName}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              className={`status-badge ${partner.isActive !== false ? 'active' : 'suspended'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              {partner.isActive !== false ? 'Active Partner' : 'Deactivated'}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenQr(partner)}>
            <QrCode size={16} style={{ marginRight: '0.4rem' }} /> View & Download QR
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onCopyLink(partner)}>
            <Copy size={16} style={{ marginRight: '0.4rem' }} /> Copy Link
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(partner)}>
            <Edit2 size={16} style={{ marginRight: '0.4rem' }} /> Edit Details
          </button>
          <button
            className={`btn btn-sm ${partner.isActive !== false ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => onToggleStatus(partner.id, !(partner.isActive !== false))}
          >
            <Power size={16} style={{ marginRight: '0.4rem' }} />
            {partner.isActive !== false ? 'Deactivate Partner' : 'Activate Partner'}
          </button>
        </div>

        {/* Financial Highlights */}
        <div className="modal-section">
          <div className="modal-section-title">
            <IndianRupee size={18} /> Partner Financial Summary
          </div>
          <div className="partner-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="partner-stat-item">
              <div className="label">Total Projects</div>
              <div className="val" style={{ color: 'var(--text-primary)' }}>
                {partner.totalProjects || partnerProjects.length || 0}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">WebRyza Share Owed</div>
              <div className="val" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(totalOwed)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Amount Received</div>
              <div className="val" style={{ color: '#4caf50' }}>
                {formatCurrency(totalPaid)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Outstanding Due</div>
              <div className="val" style={{ color: outstanding > 0 ? '#ff4d4f' : 'var(--text-secondary)' }}>
                {formatCurrency(outstanding)}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="modal-section">
          <div className="modal-section-title">
            <Store size={18} /> Shop & Owner Information
          </div>
          <div className="info-grid-2">
            <div className="info-item">
              <div className="info-label">Shop Name</div>
              <div className="info-value">{partner.shopName}</div>
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
            <div className="info-item" style={{ gridColumn: 'span 2' }}>
              <div className="info-label">Shop Address</div>
              <div className="info-value">{partner.address || 'None recorded'}</div>
            </div>
            <div className="info-item" style={{ gridColumn: 'span 2' }}>
              <div className="info-label">Registration Link</div>
              <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-neon)' }}>
                {partner.registrationUrl}
              </div>
            </div>
          </div>
        </div>

        {/* Partner Project History */}
        <div className="modal-section">
          <div className="modal-section-title">
            <FolderKanban size={18} /> Referred Wedding Projects ({partnerProjects.length})
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
                    <th>Couple</th>
                    <th>Wedding Date</th>
                    <th>Customer Charge</th>
                    <th>WebRyza Share</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerProjects.map((proj) => (
                    <tr
                      key={proj.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onClose();
                        if (onSelectProject) onSelectProject(proj);
                      }}
                      title="Click to view wedding project"
                    >
                      <td style={{ fontWeight: 600, color: 'var(--accent-neon)' }}>
                        {proj.brideName} & {proj.groomName}
                      </td>
                      <td>{formatWeddingDate(proj.weddingDate)}</td>
                      <td>{formatCurrency(proj.amountCharged)}</td>
                      <td>{formatCurrency(proj.webryzaShare)}</td>
                      <td>{formatCurrency(proj.amountReceivedByWebryza)}</td>
                      <td>
                        <span className={`status-badge ${proj.status}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-badge ${proj.paymentStatus}`}>
                          {proj.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
}
