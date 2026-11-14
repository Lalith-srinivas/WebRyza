import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, Store, User, Phone, Mail, MapPin } from 'lucide-react';

export default function PartnerModal({ partner, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (partner) {
      setFormData({
        shopName: partner.shopName || '',
        ownerName: partner.ownerName || '',
        phone: partner.phone || '',
        email: partner.email || '',
        address: partner.address || ''
      });
    } else {
      setFormData({
        shopName: '',
        ownerName: '',
        phone: '',
        email: '',
        address: ''
      });
    }
    setError('');
    setIsSubmitting(false);
  }, [partner, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shopName.trim() || !formData.ownerName.trim() || !formData.phone.trim()) {
      setError('Shop Name, Owner Name, and Phone Number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave(formData, partner?.id);
      onClose();
    } catch (err) {
      console.error('Error saving partner:', err);
      setError(err.message || 'Failed to save partner details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '550px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.5rem' }}>
          {partner ? 'Edit Partner Shop' : 'Add New Partner Shop'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {partner 
            ? `Update details for ${partner.shopName} (${partner.partnerCode})`
            : 'Register a new printing press or wedding card partner to generate referral QR & links.'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(255, 77, 79, 0.1)',
            border: '1px solid rgba(255, 77, 79, 0.3)',
            color: '#ff4d4f',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Store size={16} color="var(--accent-neon)" /> Shop Name *
            </label>
            <input
              type="text"
              name="shopName"
              placeholder="e.g. Royal Wedding Printers"
              value={formData.shopName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} color="var(--accent-neon)" /> Owner Name *
              </label>
              <input
                type="text"
                name="ownerName"
                placeholder="Owner's full name"
                value={formData.ownerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={16} color="var(--accent-neon)" /> Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} color="var(--accent-neon)" /> Email Address (Optional)
            </label>
            <input
              type="email"
              name="email"
              placeholder="shop@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--accent-neon)" /> Shop Address (Optional)
            </label>
            <textarea
              name="address"
              rows="2"
              placeholder="Full shop address or area landmark"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {!partner && (
            <div style={{
              background: 'rgba(57, 255, 20, 0.05)',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              A unique Partner ID (e.g. SHOP001) and registration link will be generated automatically.
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : partner ? 'Update Partner' : 'Create Partner'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
