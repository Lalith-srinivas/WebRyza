import React from 'react';
import './CTA.css';

const CTA = () => {
  return (
    <section className="cta-section">
      <div className="cta-background">
        <div className="cta-glow"></div>
      </div>
      <div className="container cta-container reveal">
        <h2 className="cta-title">
          Ready to build your <span className="font-cursive text-neon">next big thing?</span>
        </h2>
        <p className="cta-subtext">
          Let WebRyza turn your ideas into powerful digital experiences that drive real results.
        </p>
        <a href="https://wa.me/919989831499" target="_blank" rel="noreferrer" className="btn btn-primary cta-btn">
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
};

export default CTA;
