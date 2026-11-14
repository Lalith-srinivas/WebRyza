import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CalendarHeart } from 'lucide-react';
import WeddingSubNav from '../../../components/admin/wedding/WeddingSubNav';
import { fetchAllWeddingCards, fetchAllPartners } from '../../../services/weddingService';
import './WeddingCards.css';

export default function WeddingCardsLayout() {
  const [projectCount, setProjectCount] = useState(0);
  const [partnerCount, setPartnerCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Refresh count badges whenever route changes or on mount
    const loadCounts = async () => {
      try {
        const [cards, partners] = await Promise.all([
          fetchAllWeddingCards(),
          fetchAllPartners()
        ]);
        setProjectCount(cards.length);
        setPartnerCount(partners.length);
      } catch (err) {
        console.error("Error loading counts for wedding cards nav:", err);
      }
    };

    loadCounts();
  }, [location.pathname]);

  return (
    <div className="wedding-cards-page">
      <div className="wedding-header">
        <div className="wedding-title-row">
          <h1>
            <CalendarHeart size={32} />
            Wedding Cards
          </h1>
        </div>

        <WeddingSubNav 
          projectCount={projectCount} 
          partnerCount={partnerCount} 
        />
      </div>

      <Outlet />
    </div>
  );
}
