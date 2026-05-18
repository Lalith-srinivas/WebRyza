import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { IndianRupee, FolderKanban, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalProjects: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const q = query(collection(db, 'projects'), where('deleted', '==', false));
      const querySnapshot = await getDocs(q);
      
      let earnings = 0;
      let total = 0;
      let completed = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.process === 'deployed') {
          completed++;
          earnings += Number(data.price) || 0;
        }
      });

      setStats({
        totalEarnings: earnings,
        totalProjects: total,
        completedProjects: completed
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Dashboard</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading dashboard...
        </div>
      ) : (
        <motion.div 
          className="dashboard-cards"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="dashboard-card bg-glass" variants={itemVariants}>
            <div className="dashboard-card-icon" style={{ background: 'rgba(57, 255, 20, 0.1)', color: 'var(--accent-neon)' }}>
              <IndianRupee size={32} />
            </div>
            <div className="dashboard-card-info">
              <h3>Total Earnings</h3>
              <p>₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
          </motion.div>

          <motion.div className="dashboard-card bg-glass" variants={itemVariants}>
            <div className="dashboard-card-icon" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
              <FolderKanban size={32} />
            </div>
            <div className="dashboard-card-info">
              <h3>Total Projects</h3>
              <p>{stats.totalProjects}</p>
            </div>
          </motion.div>

          <motion.div className="dashboard-card bg-glass" variants={itemVariants}>
            <div className="dashboard-card-icon" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
              <CheckCircle2 size={32} />
            </div>
            <div className="dashboard-card-info">
              <h3>Completed Projects</h3>
              <p>{stats.completedProjects}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
