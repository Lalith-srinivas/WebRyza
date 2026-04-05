import React from 'react';
import ScrollReveal from './ScrollReveal';
import './Work.css';

const projects = [
  {
    id: 1,
    title: 'Cafe / Restaurant Website',
    category: 'Demo',
    desc: 'Starting from ₹2,999. Mobile-friendly design, WhatsApp integration, Menu & gallery showcase.',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-cafe-demo.vercel.app/'
  },
  {
    id: 2,
    title: 'Bakery Website',
    category: 'Demo',
    desc: 'Starting from ₹2,999. Mobile-friendly design, WhatsApp order integration, Product gallery & pricing.',
    img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-bakery-demo.vercel.app/'
  },
  {
    id: 3,
    title: 'Clinic Website',
    category: 'Demo',
    desc: 'Starting from ₹3,999. Appointment booking form, Doctor profiles & services, WhatsApp integration.',
    img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-clinic-demo.vercel.app/'
  },
  {
    id: 4,
    title: 'Hotel Website',
    category: 'Demo',
    desc: 'Starting from ₹6,999. Room showcase & booking, Photo gallery & virtual tour, Contact & location map.',
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-hotel-demo.vercel.app/'
  },
  {
    id: 5,
    title: 'Tuition Center Website',
    category: 'Demo',
    desc: 'Starting from ₹2,999. Course & batch listings, Enquiry form & WhatsApp, Faculty showcase.',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-tuition-demo.vercel.app/'
  },
  {
    id: 6,
    title: 'School Website',
    category: 'Demo',
    desc: 'Starting from ₹4,999. Admissions & events page, Faculty & infrastructure, Gallery & achievements.',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-school-demo.vercel.app/'
  },
  {
    id: 7,
    title: 'Ecommerce Website',
    category: 'Demo',
    desc: 'Starting from ₹14,999. Cart & checkout system, Payment gateway integration, Admin panel & analytics.',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    link: '#'
  }
];

const Work = () => {
  return (
    <section id="work" className="work">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            <ScrollReveal>Our Work</ScrollReveal>
          </h2>
          <p className="section-subtitle reveal">A selection of premium digital experiences crafted for top brands.</p>
        </div>

        <div className="scroll-stack-container">
          {projects.map((project, index) => {
            // Adaptive top offset for mobile vs desktop
            // Increased offset for mobile/tablet to ensure "View Demo" button is visible
            const offset = typeof window !== 'undefined' && window.innerWidth < 768 ? 160 : 40;
            return (
              <div 
                key={project.id} 
                className="scroll-stack-card reveal"
                style={{
                  top: `${120 + (index * offset)}px`,
                  zIndex: index,
                }}
              >
                <div className="card-inner bg-glass">
                  <div className="card-content">
                    <h3 className="card-title">{project.title}</h3>
                    <p className="card-desc">{project.desc}</p>
                    <a href={project.link} target="_blank" rel="noreferrer" className="btn btn-primary work-btn">View Demo</a>
                  </div>
                  <div className="card-image">
                    <img src={project.img} alt={project.title} loading="lazy" />
                    <div className="image-overlay"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Work;
