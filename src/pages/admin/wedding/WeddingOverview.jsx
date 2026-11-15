import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  HeartHandshake, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';
import { 
  recordWeddingPayment,
  togglePartnerStatus,
  deletePartner,
  changePartnerUsername,
  subscribeToPartners,
  subscribeToWeddingCards
} from '../../../services/weddingService';
import { 
  formatCurrency, 
  formatWeddingDate 
} from '../../../utils/weddingCommission';
import MonthlyRevenueChart from '../../../components/admin/wedding/MonthlyRevenueChart';
import WeddingProjectDetailModal from '../../../components/admin/wedding/WeddingProjectDetailModal';
import RecordPaymentModal from '../../../components/admin/wedding/RecordPaymentModal';
import PartnerDetailModal from '../../../components/admin/wedding/PartnerDetailModal';
import PartnerQrModal from '../../../components/admin/wedding/PartnerQrModal';
import ChangeUsernameModal from '../../../components/admin/wedding/ChangeUsernameModal';
import ResetPasswordModal from '../../../components/admin/wedding/ResetPasswordModal';
import Toast from '../../../components/admin/wedding/Toast';

export default function WeddingOverview() {
  const [projects, setProjects] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [paymentProject, setPaymentProject] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [qrPartner, setQrPartner] = useState(null);
  const [usernamePartner, setUsernamePartner] = useState(null);
  const [passwordPartner, setPasswordPartner] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirmPartner, setDeleteConfirmPartner] = useState(null);

  const executeDeletePartner = async () => {
    if (!deleteConfirmPartner) return;
    try {
      const res = await deletePartner(deleteConfirmPartner.id);
      setToast({
        type: 'success',
        message: `Partner "${deleteConfirmPartner.shopName}" deleted and username "${res.releasedUsername}" released successfully.`
      });
      setDeleteConfirmPartner(null);
      if (selectedPartner?.id === deleteConfirmPartner.id) {
        setSelectedPartner(null);
      }
    } catch (err) {
      console.error('Failed to delete partner:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete partner shop.'
      });
    }
  };

  useEffect(() => {
    const unsubPartners = subscribeToPartners((partnersList) => {
      setPartners(partnersList);
      setLoading(false);
    }, () => setLoading(false));

    const unsubCards = subscribeToWeddingCards((cardsList) => {
      setProjects(cardsList);
    });

    return () => {
      unsubPartners();
      unsubCards();
    };
  }, []);

  // Calculations dynamically computed
  const totalProjects = projects.length;
  const confirmedCount = projects.filter((p) => p.status === 'confirmed').length;
  const buildingCount = projects.filter((p) => p.status === 'building').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  const totalCharged = projects.reduce((acc, p) => acc + (Number(p.amountCharged) || 0), 0);
  const totalWebRyzaRevenue = projects.reduce((acc, p) => acc + (Number(p.webryzaShare) || 0), 0);
  const totalReceived = projects.reduce((acc, p) => acc + (Number(p.amountReceivedByWebryza) || 0), 0);
  const pendingAmount = Math.max(0, totalWebRyzaRevenue - totalReceived);

  // Payment status breakdown
  const paidCount = projects.filter((p) => p.paymentStatus === 'paid').length;
  const partialCount = projects.filter((p) => p.paymentStatus === 'partial').length;
  const pendingPaymentCount = projects.filter((p) => p.paymentStatus === 'pending' || !p.paymentStatus).length;

  // Recent 6 registrations
  const recentRegistrations = [...projects].slice(0, 6);

  const handleSavePayment = async (paymentData) => {
    await recordWeddingPayment(paymentData);
    setToast({
      type: 'success',
      message: `Recorded payment of ${formatCurrency(paymentData.amount)} successfully!`
    });
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.08 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading Wedding Cards overview...
        </div>
      ) : (
        <Motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Top 8 Dynamic Statistics Cards */}
          <div className="wedding-stats-grid">
            {/* Total Projects */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(57, 255, 20, 0.1)', color: 'var(--accent-neon)' }}>
                <HeartHandshake size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Total Projects</h4>
                <div className="stat-value">{totalProjects}</div>
                <div className="stat-subtext">All time registrations</div>
              </div>
            </Motion.div>

            {/* Confirmed */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
                <Clock size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Confirmed Projects</h4>
                <div className="stat-value">{confirmedCount}</div>
                <div className="stat-subtext">Pending development</div>
              </div>
            </Motion.div>

            {/* Building */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
                <FolderKanban size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Building Projects</h4>
                <div className="stat-value">{buildingCount}</div>
                <div className="stat-subtext">Currently in development</div>
              </div>
            </Motion.div>

            {/* Completed */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                <CheckCircle2 size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Completed Projects</h4>
                <div className="stat-value">{completedCount}</div>
                <div className="stat-subtext">Live wedding websites</div>
              </div>
            </Motion.div>

            {/* Total Charged */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#ba68c8' }}>
                <IndianRupee size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Total Amount Charged</h4>
                <div className="stat-value">{formatCurrency(totalCharged)}</div>
                <div className="stat-subtext">Customer gross volume</div>
              </div>
            </Motion.div>

            {/* WebRyza Revenue */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(57, 255, 20, 0.12)', color: 'var(--accent-neon)' }}>
                <TrendingUp size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>WebRyza Revenue</h4>
                <div className="stat-value" style={{ color: 'var(--accent-neon)' }}>
                  {formatCurrency(totalWebRyzaRevenue)}
                </div>
                <div className="stat-subtext">WebRyza commission share</div>
              </div>
            </Motion.div>

            {/* Amount Received */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(76, 175, 80, 0.12)', color: '#4caf50' }}>
                <CreditCard size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Amount Received</h4>
                <div className="stat-value" style={{ color: '#4caf50' }}>
                  {formatCurrency(totalReceived)}
                </div>
                <div className="stat-subtext">Collected from partners</div>
              </div>
            </Motion.div>

            {/* Pending Amount */}
            <Motion.div className="wedding-stat-card bg-glass" variants={itemVariants}>
              <div className="wedding-stat-icon" style={{ background: 'rgba(255, 77, 79, 0.12)', color: '#ff4d4f' }}>
                <AlertCircle size={28} />
              </div>
              <div className="wedding-stat-info">
                <h4>Pending Amount</h4>
                <div className="stat-value" style={{ color: pendingAmount > 0 ? '#ff4d4f' : '#4caf50' }}>
                  {formatCurrency(pendingAmount)}
                </div>
                <div className="stat-subtext">Outstanding dues</div>
              </div>
            </Motion.div>
          </div>

          {/* 2-Column: Monthly Revenue Chart + Payment Breakdown */}
          <div className="dashboard-grid-2col">
            {/* Monthly Revenue Chart */}
            <Motion.div className="dashboard-panel bg-glass" variants={itemVariants}>
              <div className="dashboard-panel-header">
                <h3>
                  <TrendingUp size={20} color="var(--accent-neon)" />
                  Monthly WebRyza Revenue
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Commission only (Last 6 Months)
                </span>
              </div>
              <MonthlyRevenueChart projects={projects} />
            </Motion.div>

            {/* Payment Summary */}
            <Motion.div className="dashboard-panel bg-glass" variants={itemVariants}>
              <div className="dashboard-panel-header">
                <h3>
                  <CreditCard size={20} color="var(--accent-neon)" />
                  Payment Summary
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {totalProjects} Total Orders
                </span>
              </div>

              <div className="payment-breakdown-list">
                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <span className="breakdown-indicator paid"></span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Fully Paid</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {paidCount} projects ({totalProjects > 0 ? Math.round((paidCount / totalProjects) * 100) : 0}%)
                      </div>
                    </div>
                  </div>
                  <span className="payment-badge paid">Paid</span>
                </div>

                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <span className="breakdown-indicator partial"></span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Partially Paid</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {partialCount} projects ({totalProjects > 0 ? Math.round((partialCount / totalProjects) * 100) : 0}%)
                      </div>
                    </div>
                  </div>
                  <span className="payment-badge partial">Partial</span>
                </div>

                <div className="breakdown-row">
                  <div className="breakdown-left">
                    <span className="breakdown-indicator pending"></span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Pending Payment</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {pendingPaymentCount} projects ({totalProjects > 0 ? Math.round((pendingPaymentCount / totalProjects) * 100) : 0}%)
                      </div>
                    </div>
                  </div>
                  <span className="payment-badge pending">Pending</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(57, 255, 20, 0.04)', borderRadius: '14px', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Collected vs Due:</span>
                  <strong style={{ color: 'white' }}>
                    {totalWebRyzaRevenue > 0 ? Math.round((totalReceived / totalWebRyzaRevenue) * 100) : 100}% Collected
                  </strong>
                </div>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${totalWebRyzaRevenue > 0 ? Math.min(100, (totalReceived / totalWebRyzaRevenue) * 100) : 0}%`,
                      background: 'var(--accent-neon)',
                      boxShadow: '0 0 10px var(--accent-neon)'
                    }}
                  />
                </div>
              </div>
            </Motion.div>
          </div>

          {/* Partner-Wise Project Statistics Table */}
          <Motion.div className="dashboard-panel bg-glass" style={{ marginBottom: '2.5rem' }} variants={itemVariants}>
            <div className="dashboard-panel-header">
              <h3>
                <Users size={20} color="var(--accent-neon)" />
                Partner Performance Summary ({partners.length} Shops)
              </h3>
            </div>

            {partners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No partner shops registered yet. Go to the Partners tab to register your first printing partner.
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Partner Code</th>
                      <th>Shop Name</th>
                      <th>Owner</th>
                      <th>Projects</th>
                      <th>Total Charged</th>
                      <th>WebRyza Share</th>
                      <th>Amount Received</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => {
                      const partnerProjs = projects.filter((p) => p.partnerId === partner.partnerCode || p.partnerId === partner.id);
                      const projCount = partnerProjs.length || partner.totalProjects || 0;
                      const partnerCharged = partnerProjs.reduce((a, b) => a + (Number(b.amountCharged) || 0), 0) || partner.totalAmountCharged || 0;
                      const partnerShare = partnerProjs.reduce((a, b) => a + (Number(b.webryzaShare) || 0), 0) || partner.totalAmountDue || 0;
                      const partnerPaid = partnerProjs.reduce((a, b) => a + (Number(b.amountReceivedByWebryza) || 0), 0) || partner.totalAmountPaid || 0;
                      const partnerDue = Math.max(0, partnerShare - partnerPaid);

                      return (
                        <tr
                          key={partner.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedPartner(partner)}
                          title="Click to view partner details"
                        >
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-neon)' }}>
                            {partner.partnerCode}
                          </td>
                          <td style={{ fontWeight: 600 }}>{partner.shopName}</td>
                          <td>{partner.ownerName}</td>
                          <td>{projCount}</td>
                          <td>{formatCurrency(partnerCharged)}</td>
                          <td>{formatCurrency(partnerShare)}</td>
                          <td style={{ color: '#4caf50' }}>{formatCurrency(partnerPaid)}</td>
                          <td style={{ color: partnerDue > 0 ? '#ff4d4f' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {formatCurrency(partnerDue)}
                          </td>
                          <td>
                            <span className={`status-badge ${partner.isActive !== false ? 'active' : 'suspended'}`}>
                              {partner.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Motion.div>

          {/* Recent Wedding Registrations */}
          <Motion.div className="dashboard-panel bg-glass" variants={itemVariants}>
            <div className="dashboard-panel-header">
              <h3>
                <HeartHandshake size={20} color="var(--accent-neon)" />
                Recent Wedding Registrations
              </h3>
            </div>

            {recentRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No wedding projects registered yet.
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Couple</th>
                      <th>Wedding Date</th>
                      <th>Partner Shop</th>
                      <th>Amount Charged</th>
                      <th>WebRyza Share</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRegistrations.map((proj) => (
                      <tr key={proj.id}>
                        <td
                          style={{ fontWeight: 600, color: 'var(--accent-neon)', cursor: 'pointer' }}
                          onClick={() => setSelectedProject(proj)}
                        >
                          {proj.brideName} & {proj.groomName}
                        </td>
                        <td>{formatWeddingDate(proj.weddingDate)}</td>
                        <td>
                          {proj.partnerShopName || (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Direct</span>
                          )}
                        </td>
                        <td>{formatCurrency(proj.amountCharged)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(proj.webryzaShare)}</td>
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
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedProject(proj)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Motion.div>
        </Motion.div>
      )}

      {/* Detail Modal */}
      <WeddingProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        onOpenRecordPayment={(proj) => setPaymentProject(proj)}
        onShowToast={(t) => setToast(t)}
        onProjectUpdated={() => {}}
      />

      {/* Payment Recording Modal */}
      <RecordPaymentModal
        weddingCard={paymentProject}
        isOpen={Boolean(paymentProject)}
        onClose={() => setPaymentProject(null)}
        onSavePayment={handleSavePayment}
      />

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        partner={selectedPartner}
        partnerProjects={projects.filter((p) => p.partnerId === selectedPartner?.partnerCode || p.partnerId === selectedPartner?.id)}
        isOpen={Boolean(selectedPartner)}
        onClose={() => setSelectedPartner(null)}
        onEdit={() => {
          setSelectedPartner(null);
        }}
        onToggleStatus={async (pId, pActive) => {
          await togglePartnerStatus(pId, pActive);
          setToast({ type: 'success', message: pActive ? 'Partner activated.' : 'Partner deactivated.' });
          setSelectedPartner(null);
        }}
        onDelete={(p) => {
          setSelectedPartner(null);
          setDeleteConfirmPartner(p);
        }}
        onOpenQr={(p) => setQrPartner(p)}
        onCopyLink={(p) => {
          navigator.clipboard.writeText(p.registrationUrl);
          setToast({ type: 'success', message: 'Registration link copied!' });
        }}
        onOpenChangeUsername={(p) => setUsernamePartner(p)}
        onOpenResetPassword={(p) => setPasswordPartner(p)}
        onSelectProject={(proj) => {
          setSelectedPartner(null);
          setSelectedProject(proj);
        }}
      />

      {/* QR Modal */}
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
        onChangeUsername={async (partnerId, newUsername) => {
          await changePartnerUsername(partnerId, newUsername);
          setToast({ type: 'success', message: `Username updated to "${newUsername}"!` });
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        partner={passwordPartner}
        isOpen={Boolean(passwordPartner)}
        onClose={() => setPasswordPartner(null)}
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
