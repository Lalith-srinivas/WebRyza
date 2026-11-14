import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/weddingCommission';

export default function MonthlyRevenueChart({ projects = [] }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // Group WebRyza revenue by month for the last 6 months
  const now = new Date();
  const monthsData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-IN', { month: 'short' });
    const fullLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    
    monthsData.push({
      key: monthKey,
      label: monthLabel,
      fullLabel,
      year: d.getFullYear(),
      month: d.getMonth(),
      revenue: 0,
      projectCount: 0
    });
  }

  // Populate data using projects
  projects.forEach((proj) => {
    let date = null;
    if (proj.createdAt?.toDate) {
      date = proj.createdAt.toDate();
    } else if (proj.weddingDate?.toDate) {
      date = proj.weddingDate.toDate();
    } else if (proj.createdAt) {
      date = new Date(proj.createdAt);
    }

    if (date && !isNaN(date.getTime())) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const found = monthsData.find((m) => m.key === key);
      if (found) {
        // Commission only, not full customer price!
        found.revenue += Number(proj.webryzaShare) || 0;
        found.projectCount += 1;
      }
    }
  });

  const maxRevenue = Math.max(...monthsData.map((m) => m.revenue), 1000);
  const chartHeight = 180;
  const chartWidth = 500;
  const barWidth = 44;
  const spacing = (chartWidth - barWidth * monthsData.length) / (monthsData.length + 1);

  return (
    <div className="chart-container">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} 
        className="chart-svg"
      >
        <defs>
          <linearGradient id="barGlowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#39FF14" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#39FF14" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#39FF14" stopOpacity="1" />
            <stop offset="100%" stopColor="#39FF14" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = chartHeight - pct * (chartHeight - 20) + 10;
          return (
            <g key={idx}>
              <line
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              {pct > 0 && (
                <text
                  x={chartWidth - 5}
                  y={y - 4}
                  textAnchor="end"
                  fill="rgba(255, 255, 255, 0.3)"
                  fontSize="10"
                >
                  ₹{Math.round((maxRevenue * pct) / 100) * 100}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {monthsData.map((m, idx) => {
          const barHeight = m.revenue > 0 ? (m.revenue / maxRevenue) * (chartHeight - 30) : 4;
          const x = spacing + idx * (barWidth + spacing);
          const y = chartHeight - barHeight + 10;
          const isHovered = hoveredMonth?.key === m.key;

          return (
            <g
              key={m.key}
              onMouseEnter={() => setHoveredMonth(m)}
              onMouseLeave={() => setHoveredMonth(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area */}
              <rect
                x={x - 8}
                y="0"
                width={barWidth + 16}
                height={chartHeight + 40}
                fill="transparent"
              />

              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill={isHovered ? 'url(#barHoverGrad)' : 'url(#barGlowGrad)'}
                className="chart-bar"
                stroke={isHovered ? '#39FF14' : 'rgba(57, 255, 20, 0.4)'}
                strokeWidth={isHovered ? 2 : 1}
              />

              {/* Month label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 28}
                textAnchor="middle"
                fill={isHovered ? 'var(--accent-neon)' : 'var(--text-secondary)'}
                fontSize="11"
                fontWeight={isHovered ? '600' : '400'}
              >
                {m.label}
              </text>

              {/* Amount above bar on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 40}
                    y={y - 28}
                    width="80"
                    height="22"
                    rx="6"
                    fill="#141414"
                    stroke="#39FF14"
                    strokeWidth="1"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 14}
                    textAnchor="middle"
                    fill="#39FF14"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {formatCurrency(m.revenue)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {hoveredMonth && (
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          <strong style={{ color: 'white' }}>{hoveredMonth.fullLabel}:</strong> {formatCurrency(hoveredMonth.revenue)} WebRyza Share ({hoveredMonth.projectCount} projects)
        </div>
      )}
    </div>
  );
}
