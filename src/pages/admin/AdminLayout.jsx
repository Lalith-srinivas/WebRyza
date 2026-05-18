import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Trash2, Home, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/webryza-admin/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>WebRyza Admin</h2>
        </div>
        
        <nav className="admin-nav">
          <NavLink to="/" className="admin-nav-item">
            <Home size={20} />
            <span>Back to Home</span>
          </NavLink>
          
          <NavLink 
            to="/webryza-admin" 
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/webryza-admin/projects" 
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FolderKanban size={20} />
            <span>Projects</span>
          </NavLink>
          
          <NavLink 
            to="/webryza-admin/trash" 
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Trash2 size={20} />
            <span>Trash</span>
          </NavLink>
        </nav>

        <div style={{ flex: 1 }}></div>

        <button onClick={handleLogout} className="admin-logout">
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </aside>
      
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
