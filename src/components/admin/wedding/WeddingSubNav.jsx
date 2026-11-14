import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HeartHandshake, Users } from 'lucide-react';

export default function WeddingSubNav({ projectCount = 0, partnerCount = 0 }) {
  return (
    <nav className="wedding-subnav">
      <NavLink
        to="/webryza-admin/wedding-cards"
        end
        className={({ isActive }) => `wedding-subnav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={18} />
        <span>Overview</span>
      </NavLink>

      <NavLink
        to="/webryza-admin/wedding-cards/projects"
        className={({ isActive }) => `wedding-subnav-item ${isActive ? 'active' : ''}`}
      >
        <HeartHandshake size={18} />
        <span>All Wedding Projects</span>
        {projectCount > 0 && <span className="nav-counter-pill">{projectCount}</span>}
      </NavLink>

      <NavLink
        to="/webryza-admin/wedding-cards/partners"
        className={({ isActive }) => `wedding-subnav-item ${isActive ? 'active' : ''}`}
      >
        <Users size={18} />
        <span>Partners</span>
        {partnerCount > 0 && <span className="nav-counter-pill">{partnerCount}</span>}
      </NavLink>
    </nav>
  );
}
