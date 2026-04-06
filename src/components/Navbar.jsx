import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'Work', href: '#work' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">

        {/* Left Links */}
        <div className="nav-group left-nav">
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#services">Services</a></li>
          </ul>
        </div>

        {/* Logo */}
        <Link to="/" className="logo" onClick={() => window.scrollTo(0,0)}>
          WebRyza<span className="text-neon">.</span>
        </Link>

        {/* Right Links */}
        <div className="nav-group right-nav">
          <ul className="nav-links">
            <li><a href="#work">Work</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="mobile-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                {link.name}
              </a>
            </li>
          ))}
        </ul>

        <a 
          href="#contact" 
          className="btn btn-primary" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Let's Talk
        </a>
      </div>
    </nav>
  );
};

export default Navbar;