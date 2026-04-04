import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({ children, className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const words = el.querySelectorAll('.scroll-word');
    
    gsap.fromTo(
      words,
      { opacity: 0.1, filter: 'blur(10px)', y: 20 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 1,
        stagger: 0.05,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'bottom 50%',
          scrub: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ').map((word, index) => (
    <span key={index} className="scroll-word" style={{ display: 'inline-block', marginRight: '0.25em' }}>
      {word}
    </span>
  ));

  return (
    <span ref={containerRef} className={`scroll-reveal-text ${className}`}>
      {typeof children === 'string' ? words : children}
    </span>
  );
};

export default ScrollReveal;
