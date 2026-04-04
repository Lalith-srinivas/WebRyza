import React from 'react';
import './Hero.css';
import FluidGlassImage from './FluidGlassImage';
import heroImg from '../assets/hero.jpg';

const Hero = () => {
  return (
    <section id="home" className="hero">
      {/* Big Background Word moved outside container so it spans full viewport */}
      {/* Background text split to flank the image */}
      <div className="hero-bg-left reveal">
        WEB
      </div>
      <div className="hero-bg-right reveal">
        RYZA
      </div>

      <div className="container hero-container">
        {/* Top Text flanking the image */}
        <div className="hero-top-text reveal">
          <span className="font-cursive">I'm</span>
          <span className="spacer"></span>
          <span className="font-cursive text-neon">Lalith</span>
        </div>

        <div className="hero-image-wrapper reveal">
          <FluidGlassImage
            src={heroImg}
            alt="Lalith Srinivas"
            className="founder-img"
          />

          <div className="cta-overlay">
            <a href="#contact" className="btn btn-primary glow-btn">Let's Chat</a>
          </div>
        </div>

        {/* Side Text */}
        <div className="hero-bottom-info reveal">
          <div className="info-left">
            <p><strong>SPECIALIZED IN WEB DESIGN,</strong></p>
            <p>UI/UX, AND FRONT END DEVELOPMENT.</p>
          </div>

          <div className="info-right">
            <p>We Build Modern Websites & Scalable Applications for Businesses</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
