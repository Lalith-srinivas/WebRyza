import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Work from './components/Work';
import CTA from './components/CTA';
import Contact from './components/Contact';
import Footer from './components/Footer';
import useReveal from './utils/useReveal';
import './App.css';

function App() {
  // Initialize scroll reveal animations
  useReveal();

  return (
    <div className="App">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Work />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
