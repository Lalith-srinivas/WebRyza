import React, { useState, useRef } from 'react';
import './FluidGlassImage.css';

const FluidGlassImage = ({ src, alt, className = '' }) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <div 
      className={`fluid-glass-container ${className}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base Black and White Image */}
      <img src={src} alt={alt} className="fg-base-img" />
      
      {/* Color Image revealed by glass lens mask */}
      <div 
        className="fg-lens-reveal"
        style={{
          opacity: isHovered ? 1 : 0,
          maskImage: `radial-gradient(circle 120px at ${pos.x}% ${pos.y}%, black 40%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 120px at ${pos.x}% ${pos.y}%, black 40%, transparent 100%)`
        }}
      >
        <img src={src} alt={alt} className="fg-color-img" />
        {/* Glass Edge Distortion Simulator */}
        <div className="fg-glass-effect"
             style={{
               background: `radial-gradient(circle 120px at ${pos.x}% ${pos.y}%, transparent 50%, rgba(255,255,255,0.15) 80%, transparent 100%)`,
             }}
        ></div>
      </div>
    </div>
  );
};

export default FluidGlassImage;
