import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, Heart, Calendar, IndianRupee } from 'lucide-react';
import { calculateCommission, formatCurrency, MINIMUM_CHARGE } from '../../../utils/weddingCommission';

export default function WeddingProjectFormModal({
  partners = [],
  isOpen,
  onClose,
  onCreateProject
}) {
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    brideParents: '',
    groomParents: '',
    phone: '',
    email: '',
    weddingDate: '',
    weddingTime: '',
    venueName: '',
    venueAddress: '',
    venueLocation: '',
    additionalDetails: '',
    partnerId: '',
    amountCharged: '2000',
    status: 'confirmed',
    websiteUrl: '',
    adminNotes: '',
    events: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const liveCommission = calculateCommission(formData.amountCharged, 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePartnerChange = (e) => {
    const selectedId = e.target.value;
    const selectedPartner = partners.find((p) => p.partnerCode === selectedId || p.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      partnerId: selectedId,
      partnerShopName: selectedPartner ? selectedPartner.shopName : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brideName.trim() || !formData.groomName.trim() || !formData.phone.trim()) {
      setError('Bride Name, Groom Name, and Phone Number are required.');
      return;
    }

    if (Number(formData.amountCharged) < MINIMUM_CHARGE) {
      setError(`Minimum charge to customer must be at least ₹${MINIMUM_CHARGE.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onCreateProject({
        ...formData,
        amountCharged: Number(formData.amountCharged)
      });
      onClose();
    } catch (err) {
      console.error('Error creating wedding project:', err);
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="wedding-modal-content bg-glass"
        style={{ maxWidth: '750px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>
          Add Wedding Card Project
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Manually register a wedding project and calculate WebRyza share automatically.
        </p>

        {error && (
          <div style={{
            background: 'rgba(255, 77, 79, 0.1)',
            border: '1px solid rgba(255, 77, 79, 0.3)',
            color: '#ff4d4f',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* Couple Details */}
          <div className="modal-section">
            <div className="modal-section-title">
              <Heart size={18} /> Couple Details
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Bride Name *</label>
                <input
                  type="text"
                  name="brideName"
                  placeholder="e.g. Ananya"
                  value={formData.brideName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Groom Name *</label>
                <input
                  type="text"
                  name="groomName"
                  placeholder="e.g. Rahul"
                  value={formData.groomName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bride's Parents</label>
                <input
                  type="text"
                  name="brideParents"
                  placeholder="Bride parent names"
                  value={formData.brideParents}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Groom's Parents</label>
                <input
                  type="text"
                  name="groomParents"
                  placeholder="Groom parent names"
                  value={formData.groomParents}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="couple@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Wedding Details */}
          <div className="modal-section">
            <div className="modal-section-title">
              <Calendar size={18} /> Wedding Event Details
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Wedding Date</label>
                <input
                  type="date"
                  name="weddingDate"
                  value={formData.weddingDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Wedding Time</label>
                <input
                  type="text"
                  name="weddingTime"
                  placeholder="e.g. 10:30 AM"
                  value={formData.weddingTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Venue Name</label>
                <input
                  type="text"
                  name="venueName"
                  placeholder="e.g. Royal Palace Hall"
                  value={formData.venueName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Google Maps Location Link</label>
                <input
                  type="url"
                  name="venueLocation"
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.venueLocation}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Venue Address</label>
              <textarea
                name="venueAddress"
                rows="2"
                placeholder="Full venue address"
                value={formData.venueAddress}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Partner & Pricing */}
          <div className="modal-section">
            <div className="modal-section-title">
              <IndianRupee size={18} /> Partner & Pricing Information
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Referral Partner</label>
                <select
                  name="partnerId"
                  value={formData.partnerId}
                  onChange={handlePartnerChange}
                >
                  <option value="">Direct Registration (No Partner)</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.partnerCode || p.id}>
                      {p.shopName} ({p.partnerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount Charged to Customer (₹) *</label>
                <input
                  type="number"
                  name="amountCharged"
                  min="1500"
                  step="any"
                  value={formData.amountCharged}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Live Commission Breakdown Preview */}
            <div className="partner-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '0.75rem' }}>
              <div className="partner-stat-item">
                <div className="label">WebRyza Share</div>
                <div className="val" style={{ color: 'var(--accent-neon)' }}>
                  {formatCurrency(liveCommission.webryzaShare)}
                </div>
              </div>
              <div className="partner-stat-item">
                <div className="label">Partner Commission</div>
                <div className="val" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(liveCommission.partnerCommission)}
                </div>
              </div>
              <div className="partner-stat-item">
                <div className="label">Initial Payment Status</div>
                <div className="val" style={{ color: '#ff4d4f' }}>
                  Pending
                </div>
              </div>
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Wedding Project'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
