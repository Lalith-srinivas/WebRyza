import React from 'react';
import ScrollReveal from './ScrollReveal';
import './Work.css';

const projects = [
  {
    id: 1,
    title: 'Cafe / Restaurant Website',
    category: 'Demo',
    desc: 'Modern restaurant website with a mobile-friendly experience, WhatsApp integration, menu showcase, and image gallery.',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-cafe-demo.vercel.app/'
  },
  {
    id: 2,
    title: 'Bakery Website',
    category: 'Demo',
    desc: 'Delightful bakery website featuring product galleries, WhatsApp ordering, and an inviting mobile-first design.',
    img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-bakery-demo.vercel.app/'
  },
  {
    id: 3,
    title: 'Clinic Website',
    category: 'Demo',
    desc: 'Professional clinic website with appointment booking, doctor profiles, service listings, and WhatsApp integration.',
    img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-clinic-demo.vercel.app/'
  },
  {
    id: 4,
    title: 'Hotel Website',
    category: 'Demo',
    desc: 'Elegant hotel website with room showcases, photo gallery, virtual tour experience, and location map integration.',
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-hotel-demo.vercel.app/'
  },
  {
    id: 5,
    title: 'Tuition Center Website',
    category: 'Demo',
    desc: 'Comprehensive tuition center website with course listings, batch schedules, faculty showcase, and enquiry forms.',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-tuition-demo.vercel.app/'
  },
  {
    id: 6,
    title: 'School Website',
    category: 'Demo',
    desc: 'Feature-rich school website with admissions, events, faculty profiles, infrastructure showcase, and achievements gallery.',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-school-demo.vercel.app/'
  },
  {
    id: 7,
    title: 'Ecommerce Website',
    category: 'Demo',
    desc: 'Full-featured ecommerce platform with cart & checkout, secure payment gateway integration, and admin analytics dashboard.',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    link: 'https://webryza-ecommerce-demo.vercel.app/'
  },
  {
    id: 8,
    title: 'Digital Wedding Invitation',
    category: 'Demo',
    desc: 'An elegant interactive digital wedding invitation experience designed to showcase the couple\'s story, event details, gallery, and celebration moments.',
    img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    link: 'https://webwedding.vercel.app/'
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
            const offset = typeof window !== 'undefined' && window.innerWidth < 768 ? 80 : 40;
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
