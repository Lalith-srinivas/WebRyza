import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { RefreshCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Trash() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchTrashProjects();
  }, []);

  const fetchTrashProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), where('deleted', '==', true));
      const querySnapshot = await getDocs(q);
      
      const projectsList = [];
      querySnapshot.forEach((doc) => {
        projectsList.push({ id: doc.id, ...doc.data() });
      });
      
      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching trash projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await updateDoc(doc(db, 'projects', id), {
        deleted: false
      });
      fetchTrashProjects();
    } catch (error) {
      console.error("Error restoring project:", error);
    }
  };

  const confirmPermanentDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executePermanentDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteDoc(doc(db, 'projects', deleteConfirmId));
        setDeleteConfirmId(null);
        fetchTrashProjects();
      } catch (error) {
        console.error("Error permanently deleting project:", error);
      }
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Trash</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading trash...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Project Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Trash is empty.
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr key={project.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{project.projectName}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{project.category}</td>
                    <td>
                      <span className={`status-badge ${project.process}`} style={{ opacity: 0.6 }}>
                        {project.process}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" onClick={() => handleRestore(project.id)} title="Restore">
                          <RefreshCcw size={18} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmPermanentDelete(project.id)} title="Delete Permanently">
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
        {deleteConfirmId && (
          <div className="modal-overlay">
            <motion.div 
              className="confirm-modal-content bg-glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Delete Permanently?</h3>
              <p>Are you sure you want to permanently delete this project? This cannot be undone.</p>
              <div className="confirm-modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={executePermanentDelete}>
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
