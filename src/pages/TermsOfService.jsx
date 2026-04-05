import React, { useEffect } from 'react';
import './Legal.css';
import { Mail, Shield, CheckCircle, FileText, CreditCard, Lock, Scale, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-header">
          <div className="legal-badge">Legal Information</div>
          <h1>Terms of <span className="text-neon">Service</span></h1>
          <p className="last-updated">Last Updated: April 5, 2026</p>
        </div>

        <div className="legal-content-card bg-glass">
          <div className="legal-intro">
            <p>By accessing or using WebRyza, you agree to these Terms.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><CheckCircle size={20} /></div> 1. Use of Services</h2>
            <p>You agree to:</p>
            <ul>
              <li>Use the platform legally</li>
              <li>Not misuse or attempt to hack the system</li>
              <li>Provide accurate information</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><FileText size={20} /></div> 2. Services Offered</h2>
            <p>WebRyza provides:</p>
            <ul>
              <li>Website development services</li>
              <li>E-commerce solutions</li>
              <li>Digital product and service integrations</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><CreditCard size={20} /></div> 3. Payments</h2>
            <ul>
              <li>All payments are processed via secure third-party gateways (e.g., Razorpay)</li>
              <li>Payments are non-refundable unless stated otherwise</li>
              <li>Pricing may change without prior notice</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Lock size={20} /></div> 4. User Accounts</h2>
            <ul>
              <li>You are responsible for maintaining account confidentiality</li>
              <li>We are not responsible for unauthorized access due to your negligence</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Scale size={20} /></div> 5. Intellectual Property</h2>
            <ul>
              <li>All content, design, and branding of WebRyza are owned by us</li>
              <li>You may not copy, reproduce, or distribute without permission</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><AlertCircle size={20} /></div> 6. Limitation of Liability</h2>
            <p>WebRyza is not liable for:</p>
            <ul>
              <li>Loss of data</li>
              <li>Business losses</li>
              <li>Service interruptions</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Shield size={20} /></div> 7. Termination</h2>
            <p>We reserve the right to:</p>
            <ul>
              <li>Suspend or terminate accounts that violate terms</li>
              <li>Remove content or restrict access without notice</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><CheckCircle size={20} /></div> 8. Third-Party Services</h2>
            <p>We integrate third-party tools (e.g., payment gateways, APIs). We are not responsible for their performance or issues.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><FileText size={20} /></div> 9. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use means you accept the changes.</p>
          </div>

          <div className="legal-section">
            <h2><div className="section-icon"><Scale size={20} /></div> 10. Governing Law</h2>
            <p>These Terms are governed by the laws of India.</p>
          </div>

          <div className="legal-section contact-section">
            <h2><div className="section-icon"><Mail size={20} /></div> 11. Contact</h2>
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

export default TermsOfService;
