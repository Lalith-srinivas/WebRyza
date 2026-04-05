import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const waNumber = "919989831499"; // Based on the WebRyza reference

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Hello WebRyza!%0A%0A*Name:* ${formData.name}%0A*Email:* ${formData.email}%0A*Message:* ${formData.message}`;
    const url = `https://wa.me/${waNumber}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info reveal">
            <h2 className="section-title">Get in <span className="font-cursive text-neon">Touch</span></h2>
            <p className="contact-desc">
              Have a project in mind? Let's discuss how we can help your brand grow and succeed in the digital space.
            </p>
            
            <div className="contact-methods">
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="contact-method-card bg-glass">
                <span className="method-label text-neon">Primary</span>
                <h4 className="method-title">WhatsApp</h4>
                <p className="method-detail">+91 99898 31499</p>
              </a>
              
              <a href="mailto:hello@webryza.com" className="contact-method-card bg-glass">
                <span className="method-label">Email</span>
                <h4 className="method-title">Drop a line</h4>
                <p className="method-detail">webryza@gmail.com</p>
              </a>
            </div>
          </div>

          <div className="contact-form-container reveal" style={{ transitionDelay: '0.2s' }}>
            <form className="contact-form bg-glass" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" placeholder="Lalith Srinivas" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="lalith@example.com" required value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" rows="5" placeholder="Tell us about your project..." required value={formData.message} onChange={handleChange}></textarea>
              </div>
              <button type="submit" className="btn btn-primary submit-btn">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
