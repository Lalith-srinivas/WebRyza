import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { X, IndianRupee, CreditCard, Hash, Calendar, FileText } from 'lucide-react';
import { formatCurrency } from '../../../utils/weddingCommission';

export default function RecordPaymentModal({
  weddingCard,
  isOpen,
  onClose,
  onSavePayment
}) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'UPI',
    paymentReference: '',
    paymentDate: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pendingAmount = Math.max(0, (Number(weddingCard?.amountDueToWebryza) || Number(weddingCard?.webryzaShare) || 0) - (Number(weddingCard?.amountReceivedByWebryza) || 0));

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        // Default to pending amount if available
        amount: pendingAmount > 0 ? String(pendingAmount) : '',
        paymentMethod: 'UPI',
        paymentReference: '',
        paymentDate: today,
        notes: ''
      });
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, pendingAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSavePayment({
        weddingCardId: weddingCard.id,
        partnerId: weddingCard.partnerId || '',
        partnerShopName: weddingCard.partnerShopName || '',
        amount: amountNum,
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference,
        paymentDate: formData.paymentDate,
        notes: formData.notes
      });
      onClose();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setError(err.message || 'Error recording payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !weddingCard) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="modal-content bg-glass"
        style={{ maxWidth: '500px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>
          Record Payment Received
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          For {weddingCard.brideName} & {weddingCard.groomName} ({weddingCard.partnerShopName || 'Direct Registration'})
        </p>

        {/* Financial Context Banner */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>WebRyza Share</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-neon)' }}>
              {formatCurrency(weddingCard.webryzaShare)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Already Received</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#4caf50' }}>
              {formatCurrency(weddingCard.amountReceivedByWebryza)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Outstanding Due</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: pendingAmount > 0 ? '#ff4d4f' : '#4caf50' }}>
              {formatCurrency(pendingAmount)}
            </div>
          </div>
        </div>

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
          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IndianRupee size={16} color="var(--accent-neon)" /> Amount Received (₹) *
              </label>
              <input
                type="number"
                name="amount"
                min="1"
                step="any"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} color="var(--accent-neon)" /> Payment Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Hash size={16} color="var(--accent-neon)" /> UTR / Transaction Ref (Optional)
              </label>
              <input
                type="text"
                name="paymentReference"
                placeholder="e.g. UPI Ref / Txn ID"
                value={formData.paymentReference}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} color="var(--accent-neon)" /> Payment Date *
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="var(--accent-neon)" /> Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows="2"
              placeholder="e.g. Partial advance received from printing press"
              value={formData.notes}
              onChange={handleChange}
            />
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
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Motion.div>
    </div>
  );
}
