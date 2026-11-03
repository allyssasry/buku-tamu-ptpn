import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtext, trend, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    blue: {
      bg: '#ecfdf5',
      text: '#059669',
      border: '#a7f3d0',
      activeRing: 'rgba(5, 150, 105, 0.15)',
    },
    green: {
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
      activeRing: 'rgba(21, 128, 61, 0.15)',
    },
    amber: {
      bg: '#fffbeb',
      text: '#d97706',
      border: '#fde68a',
      activeRing: 'rgba(217, 119, 6, 0.15)',
    },
    red: {
      bg: '#fef2f2',
      text: '#dc2626',
      border: '#fecaca',
      activeRing: 'rgba(220, 38, 38, 0.15)',
    },
    purple: {
      bg: '#faf5ff',
      text: '#7c3aed',
      border: '#ddd6fe',
      activeRing: 'rgba(124, 58, 237, 0.15)',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;
  const isClickable = Boolean(onClick);

  return (
    <div
      className="stat-card"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        borderColor: isHovered && isClickable ? scheme.border : '#e2e8f0',
        cursor: isClickable ? 'pointer' : 'default',
        transform: isHovered && isClickable ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered && isClickable
          ? `0 10px 24px ${scheme.activeRing}, 0 2px 6px rgba(0,0,0,0.04)`
          : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div className="stat-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-card-title" style={{ color: '#64748b', fontWeight: 600 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isClickable && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: isHovered ? scheme.text : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                opacity: isHovered ? 1 : 0.6,
                transition: 'all 0.2s ease',
              }}
            >
              <span>Detail</span>
              <ArrowUpRight size={13} style={{ transform: isHovered ? 'translate(1px, -1px)' : 'none', transition: 'transform 0.2s ease' }} />
            </span>
          )}
          {Icon && (
            <div
              className="stat-card-icon"
              style={{
                background: scheme.bg,
                color: scheme.text,
                transform: isHovered && isClickable ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.2s ease',
              }}
            >
              <Icon size={18} />
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="stat-card-value" style={{ color: '#0f172a', fontWeight: 700 }}>{value}</div>
        {subtext && <div className="stat-card-sub" style={{ color: '#64748b' }}>{subtext}</div>}
      </div>
    </div>
  );
};

export default StatCard;
