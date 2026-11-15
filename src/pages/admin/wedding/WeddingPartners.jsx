import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Store, 
  User, 
  Phone, 
  QrCode, 
  Copy, 
  Edit2, 
  Power, 
  Eye, 
  Check, 
  Trash2,
  Key,
  Lock
} from 'lucide-react';
import { 
  createPartner, 
  updatePartner, 
  togglePartnerStatus, 
  deletePartner,
  changePartnerUsername,
  resetPartnerPassword,
  subscribeToPartners,
  subscribeToWeddingCards
} from '../../../services/weddingService';
import { formatCurrency } from '../../../utils/weddingCommission';
import PartnerModal from '../../../components/admin/wedding/PartnerModal';
import PartnerQrModal from '../../../components/admin/wedding/PartnerQrModal';
import PartnerDetailModal from '../../../components/admin/wedding/PartnerDetailModal';
import WeddingProjectDetailModal from '../../../components/admin/wedding/WeddingProjectDetailModal';
import ChangeUsernameModal from '../../../components/admin/wedding/ChangeUsernameModal';
import ResetPasswordModal from '../../../components/admin/wedding/ResetPasswordModal';
import Toast from '../../../components/admin/wedding/Toast';

export default function WeddingPartners() {
  const [partners, setPartners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [qrPartner, setQrPartner] = useState(null);
  const [detailPartner, setDetailPartner] = useState(null);
  const [usernamePartner, setUsernamePartner] = useState(null);
  const [passwordPartner, setPasswordPartner] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedUser, setCopiedUser] = useState(null);
  const [deleteConfirmPartner, setDeleteConfirmPartner] = useState(null);

  // Real-time synchronization
  useEffect(() => {
    const unsubscribePartners = subscribeToPartners(
      (partnersList) => {
        setPartners(partnersList);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to partners:', err);
        setLoading(false);
      }
    );

    const unsubscribeCards = subscribeToWeddingCards(
      (cardsList) => {
        setProjects(cardsList);
      },
      (err) => {
        console.error('Error subscribing to wedding cards:', err);
      }
    );

    return () => {
      unsubscribePartners();
      unsubscribeCards();
    };
  }, []);

  const handleSavePartner = async (partnerData, partnerId) => {
    if (partnerId) {
      await updatePartner(partnerId, partnerData);
      setToast({
        type: 'success',
        message: 'Partner details updated successfully!'
      });
    } else {
      const created = await createPartner(partnerData);
      setToast({
        type: 'success',
        message: `Registered partner ${created.shopName} (${created.partnerCode})! QR & credentials generated.`
      });
      // Show QR and link copy options immediately
      setQrPartner(created);
    }
  };

  const handleChangeUsername = async (partnerId, newUsername) => {
    await changePartnerUsername(partnerId, newUsername);
    setToast({
      type: 'success',
      message: `Username changed to "${newUsername}" successfully!`
    });
    // Update local state if partner details modal is open
    if (detailPartner && detailPartner.id === partnerId) {
      setDetailPartner((prev) => ({ ...prev, username: newUsername }));
    }
  };

  const handleResetPassword = async (partnerId, newPassword) => {
    await resetPartnerPassword(partnerId, newPassword);
    setToast({
      type: 'success',
      message: 'Partner password has been reset securely in Firebase Auth!'
    });
  };

  const handleToggleStatus = async (partnerId, newStatus) => {
    try {
      await togglePartnerStatus(partnerId, newStatus);
      setToast({
        type: 'success',
        message: newStatus ? 'Partner activated.' : 'Partner deactivated. Logins and new registrations are blocked.'
      });
      if (detailPartner && detailPartner.id === partnerId) {
        setDetailPartner((prev) => ({ ...prev, isActive: newStatus }));
      }
    } catch (err) {
      console.error('Failed to toggle partner status:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to update partner status.'
      });
    }
  };

  const handleCopyLink = (partner) => {
    const url = partner.registrationUrl || `https://cards.webryza.in/?ref=${partner.partnerCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(partner.id);
    setToast({
      type: 'success',
      message: `Copied registration link for ${partner.shopName}!`
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyUsername = (partner) => {
    const username = partner.username || partner.partnerCode.toLowerCase();
    navigator.clipboard.writeText(username);
    setCopiedUser(partner.id);
    setToast({
      type: 'success',
      message: `Copied username "${username}"!`
    });
    setTimeout(() => setCopiedUser(null), 2000);
  };

  const executeDeletePartner = async () => {
    if (!deleteConfirmPartner) return;
    try {
      await deletePartner(deleteConfirmPartner.id);
      setToast({
        type: 'success',
        message: `Partner "${deleteConfirmPartner.shopName}" deleted and username released successfully.`
      });
      setDeleteConfirmPartner(null);
      if (detailPartner?.id === deleteConfirmPartner.id) {
        setDetailPartner(null);
      }
    } catch (err) {
      console.error('Failed to delete partner:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete partner shop.'
      });
    }
  };

  const filteredPartners = partners.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const shop = (p.shopName || '').toLowerCase();
      const owner = (p.ownerName || '').toLowerCase();
      const code = (p.partnerCode || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const user = (p.username || '').toLowerCase();
      if (!shop.includes(term) && !owner.includes(term) && !code.includes(term) && !phone.includes(term) && !user.includes(term)) {
        return false;
      }
    }

    if (statusFilter === 'active' && p.isActive === false) return false;
    if (statusFilter === 'inactive' && p.isActive !== false) return false;

    return true;
  });

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Controls Bar */}
      <div className="wedding-controls-bar">
        <div className="wedding-search-input">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search partners by shop name, username, ID, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="wedding-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Partners</option>
          <option value="active">Active Only</option>
          <option value="inactive">Deactivated Only</option>
        </select>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingPartner(null);
            setIsAddEditModalOpen(true);
          }}
          style={{ marginLeft: 'auto' }}
        >
          <Plus size={18} style={{ marginRight: '0.4rem' }} /> Add Partner
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading printing partners...
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="dashboard-panel bg-glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--accent-neon)' }}>
            <Store size={32} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'Playfair Display' }}>
            No Partners Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchTerm || statusFilter !== 'all'
              ? 'No partner shops matched your search filter.'
              : 'You have not onboarded any printing shops or card vendors yet. Click Add Partner to get started.'}
          </p>
          {searchTerm || statusFilter !== 'all' ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingPartner(null);
                setIsAddEditModalOpen(true);
              }}
            >
              <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Partner
            </button>
          )}
        </div>
      ) : (
        <div className="partners-grid">
          {filteredPartners.map((partner) => {
            const partnerProjs = projects.filter(
              (p) => p.partnerId === partner.partnerCode || p.partnerId === partner.id
            );
            const totalProj = partnerProjs.length || partner.totalProjects || 0;
            const totalShare = partnerProjs.reduce((a, b) => a + (Number(b.webryzaShare) || 0), 0) || partner.totalAmountDue || 0;
            const totalPaid = partnerProjs.reduce((a, b) => a + (Number(b.amountReceivedByWebryza) || 0), 0) || partner.totalAmountPaid || 0;
            const outstanding = Math.max(0, totalShare - totalPaid);

            const isCopied = copiedId === partner.id;
            const isUserCopied = copiedUser === partner.id;

            return (
              <div key={partner.id} className="partner-card bg-glass">
                {/* Header */}
                <div className="partner-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span className="partner-code-tag">{partner.partnerCode}</span>
                      <span className={`status-badge ${partner.isActive !== false ? 'active' : 'suspended'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        {partner.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'white',
                        cursor: 'pointer',
                        marginTop: '0.25rem'
                      }}
                      onClick={() => setDetailPartner(partner)}
                      title="Click to view details"
                    >
                      {partner.shopName}
                    </h3>
                  </div>
                </div>

                {/* Login Username Display & Quick Copy */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                    <Key size={14} color="var(--accent-neon)" />
                    <span style={{ color: 'var(--text-secondary)' }}>Username:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'white' }}>
                      {partner.username || partner.partnerCode.toLowerCase()}
                    </strong>
                  </div>
                  <button
                    onClick={() => handleCopyUsername(partner)}
                    className="icon-btn"
                    style={{ width: '26px', height: '26px', padding: 0 }}
                    title="Copy Username"
                  >
                    {isUserCopied ? <Check size={13} color="var(--accent-neon)" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Owner and Phone */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={14} color="var(--accent-neon)" /> {partner.ownerName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="var(--accent-neon)" /> {partner.phone}
                  </div>
                </div>

                {/* Financial Summary Row */}
                <div className="partner-stats-row">
                  <div className="partner-stat-item">
                    <div className="label">Referred</div>
                    <div className="val">{totalProj}</div>
                  </div>
                  <div className="partner-stat-item">
                    <div className="label">Owed to Us</div>
                    <div className="val" style={{ color: 'var(--accent-neon)' }}>
                      {formatCurrency(totalShare)}
                    </div>
                  </div>
                  <div className="partner-stat-item">
                    <div className="label">Outstanding</div>
                    <div className="val" style={{ color: outstanding > 0 ? '#ff4d4f' : '#4caf50' }}>
                      {formatCurrency(outstanding)}
                    </div>
                  </div>
                </div>

                {/* Registration Link preview */}
                <div
                  style={{
                    background: 'var(--bg-tertiary)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: 'var(--accent-neon)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={partner.registrationUrl}
                >
                  {partner.registrationUrl}
                </div>

                {/* Partner Card Action Buttons */}
                <div className="partner-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setQrPartner(partner)}
                    title="Generate and download registration QR code"
                  >
                    <QrCode size={15} style={{ marginRight: '0.3rem' }} /> Download QR
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyLink(partner)}
                    title="Copy unique registration link"
                  >
                    {isCopied ? <Check size={15} color="var(--accent-neon)" /> : <Copy size={15} />}
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => setUsernamePartner(partner)}
                    title="Change Username"
                  >
                    <Key size={16} />
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => setPasswordPartner(partner)}
                    title="Reset Password"
                  >
                    <Lock size={16} />
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditingPartner(partner);
                      setIsAddEditModalOpen(true);
                    }}
                    title="Edit Partner Shop"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => setDetailPartner(partner)}
                    title="View Partner Details & Projects"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    className={`icon-btn ${partner.isActive !== false ? 'delete' : ''}`}
                    onClick={() => handleToggleStatus(partner.id, !(partner.isActive !== false))}
                    title={partner.isActive !== false ? 'Deactivate Partner' : 'Activate Partner'}
                    style={{ color: partner.isActive !== false ? undefined : '#4caf50' }}
                  >
                    <Power size={16} />
                  </button>

                  <button
                    className="icon-btn delete"
                    onClick={() => setDeleteConfirmPartner(partner)}
                    title="Delete Partner Shop"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Partner Modal */}
      <PartnerModal
        partner={editingPartner}
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingPartner(null);
        }}
        onSave={handleSavePartner}
      />

      {/* QR Modal (Download QR & Copy Link) */}
      <PartnerQrModal
        partner={qrPartner}
        onClose={() => setQrPartner(null)}
        onShowToast={(t) => setToast(t)}
      />

      {/* Change Username Modal */}
      <ChangeUsernameModal
        partner={usernamePartner}
        isOpen={Boolean(usernamePartner)}
        onClose={() => setUsernamePartner(null)}
        onChangeUsername={handleChangeUsername}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        partner={passwordPartner}
        isOpen={Boolean(passwordPartner)}
        onClose={() => setPasswordPartner(null)}
        onResetPassword={handleResetPassword}
      />

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        partner={detailPartner}
        partnerProjects={projects.filter(
          (p) => p.partnerId === detailPartner?.partnerCode || p.partnerId === detailPartner?.id
        )}
        isOpen={Boolean(detailPartner)}
        onClose={() => setDetailPartner(null)}
        onEdit={(partner) => {
          setDetailPartner(null);
          setEditingPartner(partner);
          setIsAddEditModalOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
        onDelete={(partnerToDelete) => {
          setDeleteConfirmPartner(partnerToDelete);
        }}
        onOpenQr={(p) => setQrPartner(p)}
        onCopyLink={handleCopyLink}
        onOpenChangeUsername={(p) => setUsernamePartner(p)}
        onOpenResetPassword={(p) => setPasswordPartner(p)}
        onSelectProject={(proj) => setSelectedProject(proj)}
      />

      {/* Project Details Modal if accessed from Partner Projects */}
      <WeddingProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        onShowToast={(t) => setToast(t)}
        onProjectUpdated={() => {}}
      />

      {/* Delete Partner Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmPartner && (
          <div className="modal-overlay">
            <Motion.div
              className="confirm-modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Delete Partner Shop?</h3>
              <p>
                Are you sure you want to permanently delete <strong>{deleteConfirmPartner.shopName}</strong> ({deleteConfirmPartner.partnerCode})? 
                Existing wedding projects and payment histories will be safely preserved.
              </p>
              <div className="confirm-modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmPartner(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={executeDeletePartner}
                >
                  Confirm Delete
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
