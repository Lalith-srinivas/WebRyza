import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  X, 
  Heart, 
  Calendar, 
  Clock, 
  Store, 
  IndianRupee, 
  Globe, 
  Copy, 
  ExternalLink, 
  Send, 
  Plus, 
  Trash2, 
  Save, 
  Edit3
} from 'lucide-react';
import { 
  calculateCommission, 
  formatCurrency, 
  formatWeddingDate, 
  formatDateForInput,
  MINIMUM_CHARGE 
} from '../../../utils/weddingCommission';
import { 
  fetchPaymentsForCard, 
  updateWeddingCard, 
  deleteWeddingPayment 
} from '../../../services/weddingService';

export default function WeddingProjectDetailModal({
  project,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onShowToast,
  onProjectUpdated
}) {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form edit states
  const [editableDetails, setEditableDetails] = useState({
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
    amountCharged: '',
    status: 'confirmed',
    websiteUrl: '',
    adminNotes: '',
    events: []
  });

  // Event under edit / new event state
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    venueName: '',
    venueAddress: '',
    locationLink: '',
    description: ''
  });
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    if (!project || !isOpen) return;

    setEditableDetails({
      brideName: project.brideName || '',
      groomName: project.groomName || '',
      brideParents: project.brideParents || '',
      groomParents: project.groomParents || '',
      phone: project.phone || '',
      email: project.email || '',
      weddingDate: formatDateForInput(project.weddingDate),
      weddingTime: project.weddingTime || '',
      venueName: project.venueName || '',
      venueAddress: project.venueAddress || '',
      venueLocation: project.venueLocation || '',
      additionalDetails: project.additionalDetails || '',
      amountCharged: String(project.amountCharged || ''),
      status: project.status || 'confirmed',
      websiteUrl: project.websiteUrl || '',
      adminNotes: project.adminNotes || '',
      events: Array.isArray(project.events) ? JSON.parse(JSON.stringify(project.events)) : []
    });

    setIsEditing(false);
    setShowAddEvent(false);
    loadPayments(project.id);
  }, [project, isOpen]);

  const loadPayments = async (cardId) => {
    try {
      setLoadingPayments(true);
      const list = await fetchPaymentsForCard(cardId);
      setPayments(list);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventChange = (index, field, value) => {
    setEditableDetails((prev) => {
      const updatedEvents = [...prev.events];
      updatedEvents[index] = { ...updatedEvents[index], [field]: value };
      return { ...prev, events: updatedEvents };
    });
  };

  const handleRemoveEvent = (index) => {
    setEditableDetails((prev) => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }));
  };

  const handleAddEvent = () => {
    if (!newEvent.name.trim()) return;
    setEditableDetails((prev) => ({
      ...prev,
      events: [...prev.events, { ...newEvent }]
    }));
    setNewEvent({
      name: '',
      date: '',
      time: '',
      venueName: '',
      venueAddress: '',
      locationLink: '',
      description: ''
    });
    setShowAddEvent(false);
  };

  // Dynamically calculate live preview of commission if price changed
  const currentCharged = Number(editableDetails.amountCharged) || Number(project?.amountCharged) || 0;
  const currentReceived = Number(project?.amountReceivedByWebryza) || 0;
  const liveCommission = calculateCommission(currentCharged, currentReceived);

  const handleSaveChanges = async () => {
    if (Number(editableDetails.amountCharged) < MINIMUM_CHARGE) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: `Minimum customer charge is ₹${MINIMUM_CHARGE.toLocaleString('en-IN')}`
        });
      }
      return;
    }

    try {
      setIsSaving(true);
      const updateData = {
        brideName: editableDetails.brideName,
        groomName: editableDetails.groomName,
        brideParents: editableDetails.brideParents,
        groomParents: editableDetails.groomParents,
        phone: editableDetails.phone,
        email: editableDetails.email,
        weddingDate: editableDetails.weddingDate,
        weddingTime: editableDetails.weddingTime,
        venueName: editableDetails.venueName,
        venueAddress: editableDetails.venueAddress,
        venueLocation: editableDetails.venueLocation,
        additionalDetails: editableDetails.additionalDetails,
        amountCharged: Number(editableDetails.amountCharged),
        status: editableDetails.status,
        websiteUrl: editableDetails.websiteUrl,
        adminNotes: editableDetails.adminNotes,
        events: editableDetails.events
      };

      await updateWeddingCard(project.id, updateData);
      setIsEditing(false);

      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: 'Wedding project details saved successfully!'
        });
      }

      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: err.message || 'Failed to save changes'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this recorded payment? Financial balances will be recalculated.')) {
      return;
    }

    try {
      await deleteWeddingPayment(paymentId, project.id);
      await loadPayments(project.id);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: 'Payment record removed.'
        });
      }
      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: 'Failed to delete payment.'
        });
      }
    }
  };

  const handleCopyWebsiteLink = () => {
    if (!project?.websiteUrl && !editableDetails.websiteUrl) return;
    const url = editableDetails.websiteUrl || project.websiteUrl;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        message: 'Website URL copied to clipboard!'
      });
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const url = editableDetails.websiteUrl || project?.websiteUrl || '';
    if (!url) {
      if (onShowToast) {
        onShowToast({ type: 'error', message: 'Please enter a completed website URL first.' });
      }
      return;
    }

    const recipientPhone = (project?.partnerPhone || project?.phone || '').replace(/[^0-9]/g, '');
    const coupleText = `${project.brideName} & ${project.groomName}`;
    const shopGreeting = project.partnerShopName ? `Dear ${project.partnerShopName}, ` : '';
    const message = encodeURIComponent(
      `Hello ${shopGreeting}! The wedding website for ${coupleText} has been published and is now live.\n\nWebsite Link:\n${url}\n\nThank you for choosing WebRyza!`
    );

    const waLink = recipientPhone 
      ? `https://wa.me/${recipientPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        className="wedding-modal-content bg-glass"
        style={{ maxWidth: '850px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--accent-neon)', margin: 0 }}>
                {project.brideName} & {project.groomName}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Registration ID: <span style={{ fontFamily: 'monospace', color: 'white' }}>{project.id}</span>
              {' • '}
              Source: <span style={{ color: 'var(--accent-neon)' }}>{project.source === 'partner' ? project.partnerShopName || 'Partner' : 'Direct Registration'}</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`status-badge ${editableDetails.status}`}>
              {editableDetails.status}
            </span>
            <span className={`payment-badge ${project.paymentStatus}`}>
              {project.paymentStatus}
            </span>
            {!isEditing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <Edit3 size={15} style={{ marginRight: '0.3rem' }} /> Edit
              </button>
            ) : (
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleSaveChanges} 
                disabled={isSaving}
              >
                <Save size={15} style={{ marginRight: '0.3rem' }} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* SECTION A: COUPLE DETAILS */}
        <div className="modal-section">
          <div className="modal-section-title">
            <Heart size={18} /> A. Couple Details
          </div>
          {isEditing ? (
            <div className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Bride Name</label>
                  <input
                    type="text"
                    name="brideName"
                    value={editableDetails.brideName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Groom Name</label>
                  <input
                    type="text"
                    name="groomName"
                    value={editableDetails.groomName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bride's Parents</label>
                  <input
                    type="text"
                    name="brideParents"
                    value={editableDetails.brideParents}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Groom's Parents</label>
                  <input
                    type="text"
                    name="groomParents"
                    value={editableDetails.groomParents}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editableDetails.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={editableDetails.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="info-grid-3">
              <div className="info-item">
                <div className="info-label">Bride Name</div>
                <div className="info-value">{project.brideName || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Groom Name</div>
                <div className="info-value">{project.groomName || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Contact Phone</div>
                <div className="info-value">{project.phone || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Bride's Parents</div>
                <div className="info-value">{project.brideParents || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Groom's Parents</div>
                <div className="info-value">{project.groomParents || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Email Address</div>
                <div className="info-value">{project.email || '-'}</div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: WEDDING DETAILS */}
        <div className="modal-section">
          <div className="modal-section-title">
            <Calendar size={18} /> B. Wedding Details
          </div>
          {isEditing ? (
            <div className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Wedding Date</label>
                  <input
                    type="date"
                    name="weddingDate"
                    value={editableDetails.weddingDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Wedding Time</label>
                  <input
                    type="text"
                    name="weddingTime"
                    placeholder="e.g. 10:30 AM"
                    value={editableDetails.weddingTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Venue Name</label>
                  <input
                    type="text"
                    name="venueName"
                    value={editableDetails.venueName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Google Maps Location Link</label>
                  <input
                    type="url"
                    name="venueLocation"
                    placeholder="https://maps.app.goo.gl/..."
                    value={editableDetails.venueLocation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Venue Address</label>
                <textarea
                  name="venueAddress"
                  rows="2"
                  value={editableDetails.venueAddress}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Additional Details</label>
                <textarea
                  name="additionalDetails"
                  rows="2"
                  placeholder="Special instructions, dietary notes, etc."
                  value={editableDetails.additionalDetails}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          ) : (
            <div className="info-grid-2">
              <div className="info-item">
                <div className="info-label">Wedding Date</div>
                <div className="info-value">{formatWeddingDate(project.weddingDate)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Wedding Time</div>
                <div className="info-value">{project.weddingTime || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Venue Name</div>
                <div className="info-value">{project.venueName || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Location Map Link</div>
                <div className="info-value">
                  {project.venueLocation ? (
                    <a
                      href={project.venueLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-neon)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      Open Google Maps <ExternalLink size={14} />
                    </a>
                  ) : '-'}
                </div>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <div className="info-label">Venue Address</div>
                <div className="info-value">{project.venueAddress || '-'}</div>
              </div>
              {project.additionalDetails && (
                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <div className="info-label">Additional Details</div>
                  <div className="info-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    {project.additionalDetails}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION C: ADDITIONAL WEDDING EVENTS */}
        <div className="modal-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="modal-section-title" style={{ margin: 0 }}>
              <Clock size={18} /> C. Additional Wedding Events ({editableDetails.events.length})
            </div>
            {isEditing && !showAddEvent && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddEvent(true)}
              >
                <Plus size={14} style={{ marginRight: '0.3rem' }} /> Add Event
              </button>
            )}
          </div>

          {editableDetails.events.length === 0 && !showAddEvent ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No additional sub-events (e.g. Haldi, Sangeet, Reception) submitted for this wedding.
            </div>
          ) : (
            editableDetails.events.map((evt, idx) => (
              <div key={idx} className="wedding-event-card">
                <div className="wedding-event-card-header">
                  <div className="wedding-event-name" style={{ color: 'var(--accent-neon)' }}>
                    {idx + 1}. {evt.name || 'Unnamed Event'}
                  </div>
                  {isEditing && (
                    <button
                      className="icon-btn delete"
                      onClick={() => handleRemoveEvent(idx)}
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="admin-form" style={{ marginTop: '0.5rem' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Event Name</label>
                        <input
                          type="text"
                          value={evt.name || ''}
                          onChange={(e) => handleEventChange(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="text"
                          placeholder="e.g. 24 Dec 2026"
                          value={evt.date || ''}
                          onChange={(e) => handleEventChange(idx, 'date', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 6:00 PM"
                          value={evt.time || ''}
                          onChange={(e) => handleEventChange(idx, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Venue Name</label>
                        <input
                          type="text"
                          value={evt.venueName || ''}
                          onChange={(e) => handleEventChange(idx, 'venueName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Map Link</label>
                        <input
                          type="url"
                          value={evt.locationLink || ''}
                          onChange={(e) => handleEventChange(idx, 'locationLink', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Venue Address & Description</label>
                      <input
                        type="text"
                        value={evt.venueAddress || evt.description || ''}
                        onChange={(e) => handleEventChange(idx, 'venueAddress', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="info-grid-3" style={{ fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Date & Time: </span>
                      <span>{evt.date || '-'} {evt.time ? `at ${evt.time}` : ''}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Venue: </span>
                      <span>{evt.venueName || '-'}</span>
                    </div>
                    <div>
                      {evt.locationLink ? (
                        <a
                          href={evt.locationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-neon)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          Maps Location <ExternalLink size={12} />
                        </a>
                      ) : '-'}
                    </div>
                    {evt.venueAddress && (
                      <div style={{ gridColumn: 'span 3', color: 'var(--text-secondary)' }}>
                        Address: {evt.venueAddress}
                      </div>
                    )}
                    {evt.description && (
                      <div style={{ gridColumn: 'span 3', color: 'var(--text-secondary)' }}>
                        Note: {evt.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* New Event Form Drawer */}
          {showAddEvent && (
            <div className="wedding-event-card" style={{ borderColor: 'var(--accent-neon)' }}>
              <div className="wedding-event-card-header">
                <span style={{ fontWeight: 600, color: 'var(--accent-neon)' }}>Add New Event</span>
                <button className="icon-btn" onClick={() => setShowAddEvent(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="admin-form" style={{ marginTop: '0.5rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sangeet & Reception"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 25 Dec 2026"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 7:00 PM"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Venue Name</label>
                    <input
                      type="text"
                      placeholder="Hall or lawn name"
                      value={newEvent.venueName}
                      onChange={(e) => setNewEvent({ ...newEvent, venueName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Map Link</label>
                    <input
                      type="url"
                      placeholder="https://maps.app.goo.gl/..."
                      value={newEvent.locationLink}
                      onChange={(e) => setNewEvent({ ...newEvent, locationLink: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Venue Address</label>
                  <input
                    type="text"
                    placeholder="Full address"
                    value={newEvent.venueAddress}
                    onChange={(e) => setNewEvent({ ...newEvent, venueAddress: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddEvent(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddEvent}>
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION D: PARTNER INFORMATION */}
        <div className="modal-section">
          <div className="modal-section-title">
            <Store size={18} /> D. Partner Information
          </div>
          {project.partnerId ? (
            <div className="info-grid-2">
              <div className="info-item">
                <div className="info-label">Partner ID</div>
                <div className="info-value" style={{ fontFamily: 'monospace', color: 'var(--accent-neon)' }}>
                  {project.partnerId}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Shop Name</div>
                <div className="info-value">{project.partnerShopName || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Owner Name</div>
                <div className="info-value">{project.partnerOwnerName || '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Phone Number</div>
                <div className="info-value">{project.partnerPhone || '-'}</div>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <div className="info-label">Partner Registration Source</div>
                <div className="info-value">Referred through Partner QR / Link ({project.partnerId})</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
              <span className="partner-code-tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                Direct Registration
              </span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                This wedding card order was submitted directly without an affiliated partner printing shop.
              </p>
            </div>
          )}
        </div>

        {/* SECTION E: PRICING INFORMATION & COMMISSION */}
        <div className="modal-section">
          <div className="modal-section-title">
            <IndianRupee size={18} /> E. Pricing & WebRyza Commission Information
          </div>

          {isEditing && (
            <div className="admin-form" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Correct Amount Charged to Customer (Min ₹1,500) *</label>
                <input
                  type="number"
                  name="amountCharged"
                  min="1500"
                  step="any"
                  value={editableDetails.amountCharged}
                  onChange={handleInputChange}
                  required
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Under ₹2,000 = ₹1,000 WebRyza Share. ₹2,000 & above = ₹1,500 WebRyza Share.
                </span>
              </div>
            </div>
          )}

          <div className="partner-stats-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="partner-stat-item">
              <div className="label">Amount Charged</div>
              <div className="val" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(isEditing ? liveCommission.amountCharged : project.amountCharged)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">WebRyza Share</div>
              <div className="val" style={{ color: 'var(--accent-neon)' }}>
                {formatCurrency(isEditing ? liveCommission.webryzaShare : project.webryzaShare)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Partner Commission</div>
              <div className="val" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(isEditing ? liveCommission.partnerCommission : project.partnerCommission)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Received by WebRyza</div>
              <div className="val" style={{ color: '#4caf50' }}>
                {formatCurrency(project.amountReceivedByWebryza)}
              </div>
            </div>
            <div className="partner-stat-item">
              <div className="label">Remaining Due</div>
              <div className="val" style={{ color: (project.amountDueToWebryza || 0) > 0 ? '#ff4d4f' : '#4caf50' }}>
                {formatCurrency(isEditing ? liveCommission.amountDueToWebryza : project.amountDueToWebryza)}
              </div>
            </div>
          </div>

          {/* Payment History and Add Payment Action */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Recorded Payments ({payments.length})
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenRecordPayment(project)}
              >
                <Plus size={14} style={{ marginRight: '0.3rem' }} /> Add Payment
              </button>
            </div>

            {loadingPayments ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading payment history...</div>
            ) : payments.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
                No payments have been recorded for this project yet. WebRyza share is currently unpaid.
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="payment-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{formatWeddingDate(p.paymentDate || p.createdAt)}</td>
                        <td style={{ fontWeight: 600, color: '#4caf50' }}>{formatCurrency(p.amount)}</td>
                        <td>{p.paymentMethod}</td>
                        <td style={{ fontFamily: 'monospace' }}>{p.paymentReference || '-'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.notes || '-'}</td>
                        <td>
                          <button
                            className="icon-btn delete"
                            title="Delete Payment"
                            onClick={() => handleDeletePayment(p.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SECTION F: PROJECT INFORMATION & WEBSITE COMPLETION */}
        <div className="modal-section">
          <div className="modal-section-title">
            <Globe size={18} /> F. Project Information & Completion Actions
          </div>

          {isEditing ? (
            <div className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Project Status</label>
                  <select
                    name="status"
                    value={editableDetails.status}
                    onChange={handleInputChange}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="building">Building</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Completed Wedding Website URL</label>
                  <input
                    type="url"
                    name="websiteUrl"
                    placeholder="https://couple-wedding.netlify.app"
                    value={editableDetails.websiteUrl}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  name="adminNotes"
                  rows="3"
                  placeholder="Internal notes regarding website build, custom fonts, song requests, etc."
                  value={editableDetails.adminNotes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="info-grid-3" style={{ marginBottom: '1.25rem' }}>
                <div className="info-item">
                  <div className="info-label">Registration Date</div>
                  <div className="info-value">{formatWeddingDate(project.createdAt, true)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Project Status</div>
                  <div className="info-value">
                    <span className={`status-badge ${project.status}`}>{project.status}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Completion Date</div>
                  <div className="info-value">
                    {project.completedAt ? formatWeddingDate(project.completedAt, true) : 'Not completed yet'}
                  </div>
                </div>
              </div>

              {project.adminNotes && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div className="info-label">Admin Notes</div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {project.adminNotes}
                  </div>
                </div>
              )}

              {/* Completed Website Actions (Section 9) */}
              <div
                style={{
                  background: 'rgba(57, 255, 20, 0.04)',
                  border: '1px solid rgba(57, 255, 20, 0.25)',
                  borderRadius: '16px',
                  padding: '1.25rem'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--accent-neon)', marginBottom: '0.5rem' }}>
                  Live Wedding Website
                </div>

                {project.websiteUrl ? (
                  <div>
                    <div style={{ marginBottom: '1rem', wordBreak: 'break-all' }}>
                      <a
                        href={project.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'white', textDecoration: 'underline', fontSize: '0.95rem' }}
                      >
                        {project.websiteUrl}
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={handleCopyWebsiteLink}>
                        <Copy size={15} style={{ marginRight: '0.3rem' }} />
                        {copiedLink ? 'Copied' : 'Copy Website Link'}
                      </button>

                      <a
                        href={project.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <ExternalLink size={15} style={{ marginRight: '0.3rem' }} />
                        Open Website
                      </a>

                      <button className="btn-whatsapp btn-sm" onClick={handleSendWhatsApp}>
                        <Send size={15} />
                        Send via WhatsApp
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    No completed website URL has been saved yet. Click <strong>Edit</strong> above to paste your hosted Netlify link and mark as Completed.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
}
