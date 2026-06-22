import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Plus, Edit2, Trash2, X, UserCheck, UserX, Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['cafe', 'bakery', 'clinic', 'school', 'tuition', 'ecommerce'];
const PROCESSES = ['building', 'deployed', 'delivered', 'submitted'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendingProjectId, setExtendingProjectId] = useState(null);
  const [extendExpiryDate, setExtendExpiryDate] = useState('');
  
  const [formData, setFormData] = useState({
    projectName: '',
    category: 'cafe',
    price: '',
    offer: '',
    link: '',
    phone: '',
    process: 'building',
    clientStatus: 'active',
    deliveredDate: '',
    expiryDate: '',
    websiteUrl: ''
  });

  const formatDateForInput = (timestamp) => {
    if (!timestamp) return '';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (timestamp) => {
    if (!timestamp) return '-';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), where('deleted', '==', false));
      const querySnapshot = await getDocs(q);
      
      const projectsList = [];
      querySnapshot.forEach((doc) => {
        projectsList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by creation time manually if needed, or just rely on natural order
      projectsList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Automatically set deliveredDate to today's date if process becomes 'deployed' or 'delivered' and it is currently empty
      if (name === 'process' && (value === 'deployed' || value === 'delivered') && !prev.deliveredDate) {
        const today = new Date().toISOString().split('T')[0];
        updated.deliveredDate = today;
      }
      return updated;
    });
  };

  const openModal = (project = null) => {
    if (project) {
      setEditId(project.id);
      setFormData({
        projectName: project.projectName || '',
        category: project.category || 'cafe',
        price: project.price || '',
        offer: project.offer || '',
        link: project.link || '',
        phone: project.phone || '',
        process: project.process || 'building',
        clientStatus: project.clientStatus || 'active',
        deliveredDate: project.deliveredDate ? formatDateForInput(project.deliveredDate) : '',
        expiryDate: project.expiryDate ? formatDateForInput(project.expiryDate) : '',
        websiteUrl: project.websiteUrl || ''
      });
    } else {
      setEditId(null);
      setFormData({
        projectName: '',
        category: 'cafe',
        price: '',
        offer: '',
        link: '',
        phone: '',
        process: 'building',
        clientStatus: 'active',
        deliveredDate: '',
        expiryDate: '',
        websiteUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        ...formData,
        price: Number(formData.price),
        deleted: false,
        deliveredDate: formData.deliveredDate ? Timestamp.fromDate(new Date(formData.deliveredDate)) : null,
        expiryDate: formData.expiryDate ? Timestamp.fromDate(new Date(formData.expiryDate)) : null
      };

      if (editId) {
        await updateDoc(doc(db, 'projects', editId), projectData);
      } else {
        await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: serverTimestamp()
        });
      }
      
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const confirmSoftDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeSoftDelete = async () => {
    if (deleteConfirmId) {
      try {
        await updateDoc(doc(db, 'projects', deleteConfirmId), {
          deleted: true
        });
        setDeleteConfirmId(null);
        fetchProjects();
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const handleUpdateClientStatus = async (projectId, newStatus) => {
    try {
      const docRef = doc(db, 'projects', projectId);
      await updateDoc(docRef, {
        clientStatus: newStatus
      });
      fetchProjects();
    } catch (error) {
      console.error("Error updating client status:", error);
    }
  };

  const openExtendSubscription = (project) => {
    setExtendingProjectId(project.id);
    setExtendExpiryDate(project.expiryDate ? formatDateForInput(project.expiryDate) : '');
    setIsExtendModalOpen(true);
  };

  const handleExtendSubscription = async () => {
    if (extendingProjectId && extendExpiryDate) {
      try {
        const docRef = doc(db, 'projects', extendingProjectId);
        await updateDoc(docRef, {
          expiryDate: Timestamp.fromDate(new Date(extendExpiryDate))
        });
        setIsExtendModalOpen(false);
        setExtendingProjectId(null);
        setExtendExpiryDate('');
        fetchProjects();
      } catch (error) {
        console.error("Error extending subscription:", error);
      }
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterTerm === 'all') return true;
    if (filterTerm === 'active') return (p.clientStatus || 'active') === 'active';
    if (filterTerm === 'suspended') return p.clientStatus === 'suspended';
    if (filterTerm === 'building') return p.process === 'building';
    if (filterTerm === 'delivered') return p.process === 'delivered';
    if (filterTerm === 'deployed') return p.process === 'deployed';
    
    return true;
  });

  return (
    <div>
      <div className="admin-header">
        <h1>Projects</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={20} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={filterTerm} 
            onChange={(e) => setFilterTerm(e.target.value)}
            style={{
              padding: '0.75rem 2.5rem 0.75rem 1rem',
              borderRadius: '50px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'white',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '0.65rem auto',
            }}
          >
            <option value="all">All Projects</option>
            <option value="active">Active Clients</option>
            <option value="suspended">Suspended Clients</option>
            <option value="building">Building Projects</option>
            <option value="delivered">Delivered Projects</option>
            <option value="deployed">Deployed Projects</option>
          </select>

          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add Project
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading projects...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Project Name</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Price</th>
                <th>Process</th>
                <th>Client Status</th>
                <th>Delivered Date</th>
                <th>Expiry Date</th>
                <th>Website URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project, index) => (
                  <tr key={project.id}>
                    <td>{index + 1}</td>
                    <td 
                      style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--accent-neon)' }}
                      onClick={() => setSelectedProjectDetails(project)}
                      title="Click to view details"
                    >
                      {project.projectName}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{project.category}</td>
                    <td>{project.phone || '-'}</td>
                    <td>₹{project.price?.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${project.process}`}>
                        {project.process}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${project.clientStatus || 'active'}`}>
                        {project.clientStatus || 'active'}
                      </span>
                    </td>
                    <td>{formatDateForDisplay(project.deliveredDate)}</td>
                    <td>{formatDateForDisplay(project.expiryDate)}</td>
                    <td>
                      {project.websiteUrl ? (
                        <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-neon)', textDecoration: 'none' }}>
                          Visit
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" onClick={() => openModal(project)} title="Edit">
                          <Edit2 size={18} />
                        </button>
                        {(project.clientStatus || 'active') === 'suspended' ? (
                          <button className="icon-btn" onClick={() => handleUpdateClientStatus(project.id, 'active')} title="Activate Client" style={{ color: '#4caf50' }}>
                            <UserCheck size={18} />
                          </button>
                        ) : (
                          <button className="icon-btn" onClick={() => handleUpdateClientStatus(project.id, 'suspended')} title="Suspend Client" style={{ color: '#ff4d4f' }}>
                            <UserX size={18} />
                          </button>
                        )}
                        <button className="icon-btn" onClick={() => openExtendSubscription(project)} title="Extend Subscription" style={{ color: 'var(--accent-neon)' }}>
                          <Calendar size={18} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmSoftDelete(project.id)} title="Move to Trash">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
              
              <h2 style={{ marginBottom: '2rem', fontFamily: 'Playfair Display' }}>
                {editId ? 'Edit Project' : 'Add New Project'}
              </h2>
              
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                  <label>Project Name</label>
                  <input 
                    type="text" 
                    name="projectName" 
                    value={formData.projectName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Status (Process)</label>
                    <select name="process" value={formData.process} onChange={handleInputChange} required>
                      {PROCESSES.map(proc => (
                        <option key={proc} value={proc}>{proc.charAt(0).toUpperCase() + proc.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input 
                      type="number" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleInputChange} 
                      required 
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Offer (Optional)</label>
                    <input 
                      type="text" 
                      name="offer" 
                      value={formData.offer} 
                      onChange={handleInputChange} 
                      placeholder="e.g. 20% OFF"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Project Link (Optional)</label>
                    <input 
                      type="url" 
                      name="link" 
                      value={formData.link} 
                      onChange={handleInputChange} 
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="+91..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Client Status</label>
                    <select name="clientStatus" value={formData.clientStatus} onChange={handleInputChange} required>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Website URL (Optional)</label>
                    <input 
                      type="url" 
                      name="websiteUrl" 
                      value={formData.websiteUrl} 
                      onChange={handleInputChange} 
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Delivered Date (Optional)</label>
                    <input 
                      type="date" 
                      name="deliveredDate" 
                      value={formData.deliveredDate} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Expiry Date (Optional)</label>
                    <input 
                      type="date" 
                      name="expiryDate" 
                      value={formData.expiryDate} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  {editId ? 'Update Project' : 'Create Project'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="modal-overlay">
            <motion.div 
              className="confirm-modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Move to Trash?</h3>
              <p>Are you sure you want to move this project to the trash?</p>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={executeSoftDelete}>
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExtendModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="confirm-modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: '400px' }}
            >
              <button className="modal-close" onClick={() => setIsExtendModalOpen(false)}>
                <X size={24} />
              </button>
              <h3 style={{ marginBottom: '1rem', fontFamily: 'Playfair Display' }}>Extend Subscription</h3>
              <p style={{ marginBottom: '1.5rem' }}>Select a new expiry date for this client's subscription.</p>
              <div className="admin-form" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <div className="form-group">
                  <label>New Expiry Date</label>
                  <input 
                    type="date" 
                    value={extendExpiryDate} 
                    onChange={(e) => setExtendExpiryDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" onClick={() => setIsExtendModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleExtendSubscription} disabled={!extendExpiryDate}>
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProjectDetails && (
          <div className="modal-overlay" onClick={() => setSelectedProjectDetails(null)}>
            <motion.div 
              className="modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: '500px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedProjectDetails(null)}>
                <X size={24} />
              </button>
              
              <h2 style={{ marginBottom: '1.5rem', fontFamily: 'Playfair Display', color: 'var(--accent-neon)' }}>Project Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project Name</label>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedProjectDetails.projectName}</div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
                    <div style={{ textTransform: 'capitalize' }}>{selectedProjectDetails.category}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status (Process)</label>
                    <div>
                      <span className={`status-badge ${selectedProjectDetails.process}`}>
                        {selectedProjectDetails.process}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Price</label>
                    <div>₹{selectedProjectDetails.price?.toLocaleString() || '-'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Offer</label>
                    <div>{selectedProjectDetails.offer || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Client Status</label>
                    <div>
                      <span className={`status-badge ${selectedProjectDetails.clientStatus || 'active'}`}>
                        {selectedProjectDetails.clientStatus || 'active'}
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phone</label>
                    <div>{selectedProjectDetails.phone || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Delivered Date</label>
                    <div>{selectedProjectDetails.deliveredDate ? formatDateForDisplay(selectedProjectDetails.deliveredDate) : '-'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expiry Date</label>
                    <div>{selectedProjectDetails.expiryDate ? formatDateForDisplay(selectedProjectDetails.expiryDate) : '-'}</div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>GitHub Link</label>
                  <div>
                    {selectedProjectDetails.link ? (
                      <a href={selectedProjectDetails.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-neon)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {selectedProjectDetails.link} <ExternalLink size={14} />
                      </a>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Website URL</label>
                  <div>
                    {selectedProjectDetails.websiteUrl ? (
                      <a href={selectedProjectDetails.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-neon)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {selectedProjectDetails.websiteUrl} <ExternalLink size={14} />
                      </a>
                    ) : '-'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
