import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Work from '../components/Work';
import CTA from '../components/CTA';
import Contact from '../components/Contact';
import useReveal from '../utils/useReveal';

const Home = () => {
  // Initialize scroll reveal animations
  useReveal();

  return (
    <main>
      <section id="home">
        <Hero />
      </section>
      <section id="services">
        <Services />
      </section>
      <section id="work">
        <Work />
      </section>
      <section id="cta">
        <CTA />
      </section>
      <section id="contact">
        <Contact />
      </section>
    </main>
  );
};

export default Home;
