import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

// Admin imports
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Projects from './pages/admin/Projects';
import Trash from './pages/admin/Trash';
import WeddingCardsLayout from './pages/admin/wedding/WeddingCardsLayout';
import WeddingOverview from './pages/admin/wedding/WeddingOverview';
import WeddingProjects from './pages/admin/wedding/WeddingProjects';
import WeddingPartners from './pages/admin/wedding/WeddingPartners';

// Public Layout
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/webryza-admin/login" element={<Login />} />
            <Route 
              path="/webryza-admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="wedding-cards" element={<WeddingCardsLayout />}>
                <Route index element={<WeddingOverview />} />
                <Route path="projects" element={<WeddingProjects />} />
                <Route path="partners" element={<WeddingPartners />} />
              </Route>
              <Route path="trash" element={<Trash />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
