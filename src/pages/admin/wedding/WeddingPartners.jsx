import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { 
  fetchAllPartners, 
  fetchAllWeddingCards, 
  createPartner, 
  updatePartner, 
  togglePartnerStatus 
} from '../../../services/weddingService';
import { formatCurrency } from '../../../utils/weddingCommission';
import PartnerModal from '../../../components/admin/wedding/PartnerModal';
import PartnerQrModal from '../../../components/admin/wedding/PartnerQrModal';
import PartnerDetailModal from '../../../components/admin/wedding/PartnerDetailModal';
import WeddingProjectDetailModal from '../../../components/admin/wedding/WeddingProjectDetailModal';
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
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partnersList, cardsList] = await Promise.all([
        fetchAllPartners(),
        fetchAllWeddingCards()
      ]);
      setPartners(partnersList);
      setProjects(cardsList);
    } catch (err) {
      console.error('Error loading partners data:', err);
    } finally {
      setLoading(false);
    }
  };

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
        message: `Registered partner ${created.shopName} (${created.partnerCode})!`
      });
    }
    await loadData();
  };

  const handleToggleStatus = async (partnerId, newStatus) => {
    try {
      await togglePartnerStatus(partnerId, newStatus);
      setToast({
        type: 'success',
        message: newStatus ? 'Partner activated.' : 'Partner deactivated. New registrations will be blocked.'
      });
      await loadData();
      if (detailPartner && detailPartner.id === partnerId) {
        setDetailPartner((prev) => ({ ...prev, isActive: newStatus }));
      }
    } catch (err) {
      console.error('Failed to toggle partner status:', err);
      setToast({
        type: 'error',
        message: 'Failed to update partner status.'
      });
    }
  };

  const handleCopyLink = (partner) => {
    const url = partner.registrationUrl || `https://cards.webryza.in/?ref=${partner.partnerCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(partner.id);
    setToast({
      type: 'success',
      message: `Copied link for ${partner.shopName}!`
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPartners = partners.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const shop = (p.shopName || '').toLowerCase();
      const owner = (p.ownerName || '').toLowerCase();
      const code = (p.partnerCode || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      if (!shop.includes(term) && !owner.includes(term) && !code.includes(term) && !phone.includes(term)) {
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
            placeholder="Search partners by shop name, owner, code, phone..."
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
          <Plus size={18} style={{ marginRight: '0.4rem' }} /> Add Partner Shop
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
              : 'You have not onboarded any printing shops or card vendors yet. Click Add Partner Shop to get started.'}
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
              <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Partner Shop
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

            return (
              <div key={partner.id} className="partner-card bg-glass">
                {/* Header */}
                <div className="partner-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="partner-code-tag">{partner.partnerCode}</span>
                      <span className={`status-badge ${partner.isActive !== false ? 'active' : 'suspended'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        {partner.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '1.2rem',
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

                {/* Required Buttons: Download QR, Copy Link, Edit Partner, Deactivate Partner */}
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
                    onClick={() => {
                      setEditingPartner(partner);
                      setIsAddEditModalOpen(true);
                    }}
                    title="Edit Partner"
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
        onOpenQr={(p) => setQrPartner(p)}
        onCopyLink={handleCopyLink}
        onSelectProject={(proj) => setSelectedProject(proj)}
      />

      {/* Project Details Modal if accessed from Partner Projects */}
      <WeddingProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        onShowToast={(t) => setToast(t)}
        onProjectUpdated={loadData}
      />
    </div>
  );
}
