import React from 'react';
import { LayoutTemplate, Code2, MonitorPlay, ShoppingCart, Rocket, chart-no-axes-combined} from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import './Services.css';

const servicesData = [
  {
    title: 'Web Design',
    desc: 'Bespoke, high-end designs tailored to your brand identity, ensuring a lasting digital impression.',
    icon: <LayoutTemplate size={32} />
  },
  {
    title: 'Web Development',
    desc: 'Scalable, lightning-fast, and secure websites built with modern technologies like React and Next.js.',
    icon: <Code2 size={32} />
  },
  {
    title: 'UI/UX Design',
    desc: 'Intuitive user experiences that engage visitors and guide them seamlessly toward conversion.',
    icon: <MonitorPlay size={32} />
  },
  {
    title: 'E-commerce Solutions',
    desc: 'Robust online stores optimized for sales, integrated seamlessly with secure payment gateways.',
    icon: <ShoppingCart size={32} />
  },
  {
    title: 'Landing Pages',
    desc: 'High-converting, laser-focused landing pages designed to maximize your marketing ROI.',
    icon: <Rocket size={32} />
  },
  {
    title: 'Business Growth',
    desc: 'Helping your business grow with conversion-focused websites, WhatsApp integration, and strategies that turn visitors into real customers.',
    icon: <chart-no-axes-combined size={32}/>
  }
];

const Services = () => {
  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            <ScrollReveal>What We Do</ScrollReveal>
          </h2>
          <p className="section-subtitle reveal">Delivering premium digital solutions to elevate your brand.</p>
        </div>

        <div className="services-grid">
          {servicesData.map((service, index) => (
            <div 
              key={index} 
              className="service-card reveal bg-glass"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
