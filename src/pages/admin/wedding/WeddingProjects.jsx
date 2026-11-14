import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  CreditCard, 
  Calendar, 
  ArrowUpDown
} from 'lucide-react';
import { 
  fetchAllWeddingCards, 
  fetchAllPartners, 
  createWeddingCard, 
  recordWeddingPayment, 
  deleteWeddingCard 
} from '../../../services/weddingService';
import { 
  formatCurrency, 
  formatWeddingDate 
} from '../../../utils/weddingCommission';
import WeddingProjectDetailModal from '../../../components/admin/wedding/WeddingProjectDetailModal';
import WeddingProjectFormModal from '../../../components/admin/wedding/WeddingProjectFormModal';
import RecordPaymentModal from '../../../components/admin/wedding/RecordPaymentModal';
import Toast from '../../../components/admin/wedding/Toast';

export default function WeddingProjects() {
  const [projects, setProjects] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Popups
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentProject, setPaymentProject] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsList, partnersList] = await Promise.all([
        fetchAllWeddingCards(),
        fetchAllPartners()
      ]);
      setProjects(cardsList);
      setPartners(partnersList);
    } catch (err) {
      console.error('Error fetching wedding projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (formData) => {
    await createWeddingCard(formData);
    setToast({
      type: 'success',
      message: 'New wedding project created successfully!'
    });
    await loadData();
  };

  const handleSavePayment = async (paymentData) => {
    await recordWeddingPayment(paymentData);
    setToast({
      type: 'success',
      message: `Recorded payment of ${formatCurrency(paymentData.amount)}!`
    });
    await loadData();
  };

  const executeDeleteProject = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteWeddingCard(deleteConfirmId);
      setDeleteConfirmId(null);
      setToast({
        type: 'success',
        message: 'Wedding project permanently deleted.'
      });
      await loadData();
    } catch (err) {
      console.error('Failed to delete project:', err);
      setToast({
        type: 'error',
        message: 'Failed to delete wedding project.'
      });
    }
  };

  // Filter & Search Logic
  const filteredProjects = projects.filter((proj) => {
    // Search by Bride, Groom, or Phone
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower) {
      const bride = (proj.brideName || '').toLowerCase();
      const groom = (proj.groomName || '').toLowerCase();
      const phone = (proj.phone || '').toLowerCase();
      const id = (proj.id || '').toLowerCase();
      const matchesSearch = bride.includes(searchLower) || groom.includes(searchLower) || phone.includes(searchLower) || id.includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filter by Partner
    if (partnerFilter !== 'all') {
      if (partnerFilter === 'direct' && proj.partnerId) return false;
      if (partnerFilter !== 'direct' && proj.partnerId !== partnerFilter) return false;
    }

    // Filter by Project Status
    if (statusFilter !== 'all' && proj.status !== statusFilter) {
      return false;
    }

    // Filter by Payment Status
    if (paymentFilter !== 'all' && proj.paymentStatus !== paymentFilter) {
      return false;
    }

    // Filter by Wedding Date
    if (dateFilter !== 'all') {
      const projDate = proj.weddingDate?.toDate ? proj.weddingDate.toDate() : (proj.weddingDate ? new Date(proj.weddingDate) : null);
      if (!projDate || isNaN(projDate.getTime())) return false;

      const now = new Date();
      if (dateFilter === 'this_month') {
        if (projDate.getFullYear() !== now.getFullYear() || projDate.getMonth() !== now.getMonth()) {
          return false;
        }
      } else if (dateFilter === 'next_month') {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        if (projDate.getFullYear() !== nextMonth.getFullYear() || projDate.getMonth() !== nextMonth.getMonth()) {
          return false;
        }
      } else if (dateFilter === 'upcoming') {
        if (projDate < new Date(now.setHours(0, 0, 0, 0))) {
          return false;
        }
      } else if (dateFilter === 'past') {
        if (projDate >= new Date(now.setHours(0, 0, 0, 0))) {
          return false;
        }
      }
    }

    return true;
  });

  // Sorting
  filteredProjects.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Controls Bar */}
      <div className="wedding-controls-bar">
        {/* Search Input */}
        <div className="wedding-search-input">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search by bride, groom, phone or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filter by Partner */}
        <select
          className="wedding-select"
          value={partnerFilter}
          onChange={(e) => {
            setPartnerFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Partners / Sources</option>
          <option value="direct">Direct Registration Only</option>
          {partners.map((p) => (
            <option key={p.id} value={p.partnerCode || p.id}>
              {p.shopName} ({p.partnerCode})
            </option>
          ))}
        </select>

        {/* Filter by Project Status */}
        <select
          className="wedding-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Project Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="building">Building</option>
          <option value="completed">Completed</option>
        </select>

        {/* Filter by Payment Status */}
        <select
          className="wedding-select"
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
        </select>

        {/* Filter by Wedding Date */}
        <select
          className="wedding-select"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Wedding Dates</option>
          <option value="upcoming">Upcoming Weddings</option>
          <option value="this_month">This Month</option>
          <option value="next_month">Next Month</option>
          <option value="past">Past Weddings</option>
        </select>

        {/* Sort Order */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '42px' }}
        >
          <ArrowUpDown size={16} />
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </button>

        {/* Add Project Button */}
        <button
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{ marginLeft: 'auto' }}
        >
          <Plus size={18} style={{ marginRight: '0.4rem' }} /> Add Wedding Project
        </button>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading wedding projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="dashboard-panel bg-glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--accent-neon)' }}>
            <Calendar size={32} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'Playfair Display' }}>
            No Wedding Projects Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchTerm || partnerFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all'
              ? 'No projects matched your selected search filters. Try clearing some filters.'
              : 'There are no wedding card registrations yet. Add a new wedding project or share partner registration links.'}
          </p>
          {(searchTerm || partnerFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setPartnerFilter('all');
                setStatusFilter('all');
                setPaymentFilter('all');
                setDateFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Registration ID</th>
                <th>Bride Name</th>
                <th>Groom Name</th>
                <th>Phone</th>
                <th>Wedding Date</th>
                <th>Partner Shop</th>
                <th>Amount Charged</th>
                <th>WebRyza Share</th>
                <th>Received</th>
                <th>Pending</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((proj) => {
                const pendingAmt = Math.max(0, (Number(proj.webryzaShare) || 0) - (Number(proj.amountReceivedByWebryza) || 0));
                return (
                  <tr key={proj.id}>
                    {/* Registration ID */}
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}
                      title={proj.id}
                    >
                      {proj.id.length > 8 ? `${proj.id.slice(0, 8)}...` : proj.id}
                    </td>

                    {/* Bride */}
                    <td
                      style={{ fontWeight: 600, color: 'var(--accent-neon)', cursor: 'pointer' }}
                      onClick={() => setSelectedProject(proj)}
                      title="Click to view full project details"
                    >
                      {proj.brideName}
                    </td>

                    {/* Groom */}
                    <td
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setSelectedProject(proj)}
                      title="Click to view full project details"
                    >
                      {proj.groomName}
                    </td>

                    {/* Phone */}
                    <td>{proj.phone || '-'}</td>

                    {/* Wedding Date */}
                    <td>{formatWeddingDate(proj.weddingDate)}</td>

                    {/* Partner Shop */}
                    <td>
                      {proj.partnerShopName ? (
                        <span style={{ fontWeight: 500 }}>{proj.partnerShopName}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Direct</span>
                      )}
                    </td>

                    {/* Amount Charged */}
                    <td>{formatCurrency(proj.amountCharged)}</td>

                    {/* WebRyza Share */}
                    <td style={{ fontWeight: 600, color: 'var(--accent-neon)' }}>
                      {formatCurrency(proj.webryzaShare)}
                    </td>

                    {/* Amount Received */}
                    <td style={{ color: '#4caf50' }}>
                      {formatCurrency(proj.amountReceivedByWebryza)}
                    </td>

                    {/* Pending Amount */}
                    <td style={{ color: pendingAmt > 0 ? '#ff4d4f' : '#4caf50', fontWeight: 600 }}>
                      {formatCurrency(pendingAmt)}
                    </td>

                    {/* Project Status */}
                    <td>
                      <span className={`status-badge ${proj.status}`}>
                        {proj.status}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td>
                      <span className={`payment-badge ${proj.paymentStatus}`}>
                        {proj.paymentStatus}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td>{formatWeddingDate(proj.createdAt)}</td>

                    {/* Actions */}
                    <td>
                      <div className="action-btns">
                        <button
                          className="icon-btn"
                          title="View Details"
                          onClick={() => setSelectedProject(proj)}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="icon-btn"
                          title="Record Payment"
                          style={{ color: '#4caf50' }}
                          onClick={() => setPaymentProject(proj)}
                        >
                          <CreditCard size={18} />
                        </button>
                        <button
                          className="icon-btn delete"
                          title="Delete Project"
                          onClick={() => setDeleteConfirmId(proj.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProjects.length > itemsPerPage && (
        <div className="pagination-controls">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of{' '}
            {filteredProjects.length} projects
          </div>
          <div className="pagination-btns">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                className="pagination-btn"
                style={{
                  borderColor: currentPage === pageNum ? 'var(--accent-neon)' : undefined,
                  color: currentPage === pageNum ? 'var(--accent-neon)' : undefined
                }}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      <WeddingProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        onOpenRecordPayment={(proj) => setPaymentProject(proj)}
        onShowToast={(t) => setToast(t)}
        onProjectUpdated={loadData}
      />

      {/* Create Project Modal */}
      <WeddingProjectFormModal
        partners={partners}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        weddingCard={paymentProject}
        isOpen={Boolean(paymentProject)}
        onClose={() => setPaymentProject(null)}
        onSavePayment={handleSavePayment}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="modal-overlay">
            <Motion.div
              className="confirm-modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Delete Wedding Project?</h3>
              <p>
                Are you sure you want to permanently delete this wedding project and its associated payment records? This cannot be undone.
              </p>
              <div className="confirm-modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={executeDeleteProject}
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
