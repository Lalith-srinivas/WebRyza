import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['cafe', 'bakery', 'clinic', 'school', 'tuition', 'ecommerce'];
const PROCESSES = ['building', 'deployed', 'submitted'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [formData, setFormData] = useState({
    projectName: '',
    category: 'cafe',
    price: '',
    offer: '',
    link: '',
    phone: '',
    process: 'building'
  });

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (project = null) => {
    if (project) {
      setEditId(project.id);
      setFormData({
        projectName: project.projectName,
        category: project.category,
        price: project.price,
        offer: project.offer,
        link: project.link || '',
        phone: project.phone || '',
        process: project.process
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
        process: 'building'
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
        deleted: false
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

  const filteredProjects = projects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <th>Price</th>
                <th>Offer</th>
                <th>Link</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project, index) => (
                  <tr key={project.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>{project.projectName}</td>
                    <td style={{ textTransform: 'capitalize' }}>{project.category}</td>
                    <td>₹{project.price?.toLocaleString()}</td>
                    <td>{project.offer || '-'}</td>
                    <td>
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-neon)', textDecoration: 'none' }}>
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td>{project.phone || '-'}</td>
                    <td>
                      <span className={`status-badge ${project.process}`}>
                        {project.process}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" onClick={() => openModal(project)} title="Edit">
                          <Edit2 size={18} />
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
    </div>
  );
}
