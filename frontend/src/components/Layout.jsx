import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(5, 150, 105, 0.2)',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.875rem' }}>Memuat Sistem Monitoring...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
