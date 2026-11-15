import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, Store, User, Phone, Mail, MapPin, Key, Lock, Eye, EyeOff, Hash } from 'lucide-react';
import { generateNextPartnerCode } from '../../../services/weddingService';

export default function PartnerModal({ partner, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    partnerCode: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsSubmitting(false);
      setShowPassword(false);

      if (partner) {
        setFormData({
          shopName: partner.shopName || '',
          ownerName: partner.ownerName || '',
          phone: partner.phone || '',
          email: partner.email || '',
          address: partner.address || '',
          partnerCode: partner.partnerCode || partner.id || '',
          username: partner.username || '',
          password: ''
        });
      } else {
        // Automatically fetch next sequential partner code (e.g. SHOP001)
        generateNextPartnerCode()
          .then((code) => {
            setFormData({
              shopName: '',
              ownerName: '',
              phone: '',
              email: '',
              address: '',
              partnerCode: code,
              username: '',
              password: ''
            });
          })
          .catch(() => {
            setFormData({
              shopName: '',
              ownerName: '',
              phone: '',
              email: '',
              address: '',
              partnerCode: 'SHOP001',
              username: '',
              password: ''
            });
          });
      }
    }
  }, [partner, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShopNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      // Suggest a username if username hasn't been manually typed yet
      const shouldSuggestUsername = !partner && (!prev.username || prev.username === prev.shopName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const suggestedUsername = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      return {
        ...prev,
        shopName: val,
        username: shouldSuggestUsername ? suggestedUsername : prev.username
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shopName.trim() || !formData.ownerName.trim() || !formData.phone.trim()) {
      setError('Shop Name, Owner Name, and Phone Number are required.');
      return;
    }

    if (!partner) {
      if (!formData.partnerCode.trim()) {
        setError('Unique Partner ID is required.');
        return;
      }
      if (!formData.username.trim()) {
        setError('Login Username is required.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
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
        style={{ maxWidth: '620px' }}
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
            : 'Register a partner shop, create their login credentials securely, and generate their referral QR & link.'}
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
          {/* Shop Information Section */}
          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Store size={16} color="var(--accent-neon)" /> Shop Name *
              </label>
              <input
                type="text"
                name="shopName"
                placeholder="e.g. Lakshmi Cards & Printers"
                value={formData.shopName}
                onChange={handleShopNameChange}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Hash size={16} color="var(--accent-neon)" /> Unique Partner ID *
              </label>
              <input
                type="text"
                name="partnerCode"
                placeholder="e.g. SHOP001"
                value={formData.partnerCode}
                onChange={handleChange}
                disabled={Boolean(partner)}
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  opacity: partner ? 0.7 : 1
                }}
                required
              />
            </div>
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

          <div className="form-row">
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
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--accent-neon)" /> Shop Address
            </label>
            <textarea
              name="address"
              rows="2"
              placeholder="Full shop address or area landmark"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Login Credentials Section (When creating new partner) */}
          {!partner && (
            <div style={{
              background: 'rgba(57, 255, 20, 0.04)',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-neon)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={16} /> Partner Login Credentials
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Partners log into their portal using their username and password. No email required.
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={15} color="var(--accent-neon)" /> Login Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. lakshmicards"
                    value={formData.username}
                    onChange={handleChange}
                    style={{ fontFamily: 'monospace' }}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Letters, numbers, underscores (e.g. lakshmicards)
                  </span>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={15} color="var(--accent-neon)" /> Set Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      style={{ paddingRight: '2.5rem' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Created securely in Firebase Auth (never stored in plaintext)
                  </span>
                </div>
              </div>
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
              {isSubmitting ? 'Creating Partner Account...' : partner ? 'Update Partner' : 'Create Partner Account'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
