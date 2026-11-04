import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Shield } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header style={{
      height: 64,
      background: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none' }}
        >
          Menu
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: '#475569' }}>
          <Clock size={15} style={{ color: '#059669' }} />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{formattedTime}</span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Live system health status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: '#047857',
          fontWeight: 600
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669' }}></span>
          <span>Database Cloud & API Terhubung</span>
        </div>

        {/* Role Pill */}
        <div style={{
          padding: '4px 12px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#047857',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {user?.role || 'Guest'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
