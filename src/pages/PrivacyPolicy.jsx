import React, { useEffect } from 'react';
import './Legal.css';
import { Mail, Shield, Cookie, Users, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-header">
          <div className="legal-badge">Legal Information</div>
          <h1>Privacy <span className="text-neon">Policy</span></h1>
          <p className="last-updated">Last Updated: April 5, 2026</p>
        </div>

        <div className="legal-content-card bg-glass">
          <div className="legal-intro">
            <p>Welcome to WebRyza. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Eye size={20} /></div> 1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number</li>
              <li><strong>Account Data:</strong> Login credentials (if account system exists)</li>
              <li><strong>Payment Information:</strong> Processed securely via third-party providers (e.g., Razorpay)</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, browser type, IP address</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Shield size={20} /></div> 2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Process payments and orders</li>
              <li>Improve website performance and user experience</li>
              <li>Communicate updates, offers, or support</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Users size={20} /></div> 3. Data Sharing</h2>
            <p>We do not sell your data. We may share data with:</p>
            <ul>
              <li>Payment gateways (e.g., Razorpay)</li>
              <li>Hosting and backend services (e.g., Firebase)</li>
              <li>Legal authorities if required by law</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Lock size={20} /></div> 4. Data Security</h2>
            <p>We implement industry-standard security practices to protect your data. However, no system is 100% secure.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Cookie size={20} /></div> 5. Cookies</h2>
            <p>We may use cookies to:</p>
            <ul>
              <li>Enhance user experience</li>
              <li>Track analytics</li>
              <li>Store user preferences</li>
            </ul>
            <p>You can disable cookies in your browser settings.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><FileText size={20} /></div> 6. User Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your data</li>
              <li>Request corrections or deletion</li>
              <li>Withdraw consent</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Shield size={20} /></div> 7. Third-Party Links</h2>
            <p>Our website may contain links to external sites. We are not responsible for their privacy practices.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Shield size={20} /></div> 8. Updates to Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page.</p>
          </div>

          <div className="legal-section contact-section">
            <h2><div className="section-icon"><Mail size={20} /></div> 9. Contact Us</h2>
            <p>For any questions:</p>
            <div className="contact-card">
              <Mail className="text-neon" size={20} />
              <a href="mailto:webryza@gmail.com">webryza@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
