import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  Building,
  Building2,
  BarChart3,
  Sparkles,
  UserCog,
  LogOut,
  History,
  QrCode,
  Shield
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin, isSecurity, isPimpinan } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#047857' : '#475569',
    background: isActive ? '#f0fdf4' : 'transparent',
    border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
    transition: 'all 0.15s ease',
    marginBottom: 4,
  });

  return (
    <aside style={{
      width: 270,
      background: '#ffffff',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      minHeight: '100vh',
      boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          backgroundColor: '#047857',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}>
          <Shield size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em', color: '#0f172a' }}>
            BUKU TAMU
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            GEDUNG HOLDING
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, padding: '16px 14px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', padding: '0 10px 8px' }}>
          Menu Operasional
        </div>

        {/* Dashboard by role */}
        {(isAdmin || isSecurity) && (
          <NavLink to={isAdmin ? "/admin/dashboard" : "/security/dashboard"} style={navItemStyle}>
            <LayoutDashboard size={18} />
            <span>Dashboard {isAdmin ? 'Admin' : 'Security'}</span>
          </NavLink>
        )}

        {isPimpinan && (
          <NavLink to="/pimpinan/dashboard" style={navItemStyle}>
            <LayoutDashboard size={18} />
            <span>Dashboard Pimpinan</span>
          </NavLink>
        )}

        {/* Guest module */}
        <NavLink to="/guests" style={navItemStyle}>
          <Users size={18} />
          <span>Buku Tamu {isSecurity ? 'Hari Ini' : 'Gedung'}</span>
        </NavLink>

        {/* Identity Deposit */}
        {(isSecurity || isAdmin || isPimpinan) && (
          <NavLink to="/deposits" style={navItemStyle}>
            <CreditCard size={18} />
            <span>Penitipan KTP/ID</span>
          </NavLink>
        )}

        {/* Security Book */}
        <NavLink to="/security-book" style={navItemStyle}>
          <ShieldCheck size={18} />
          <span>Security Book (Area)</span>
        </NavLink>

        {/* Reports & AI */}
        {(isAdmin || isPimpinan) && (
          <>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', padding: '16px 10px 8px' }}>
              Analitik & Laporan
            </div>

            <NavLink to="/reports" style={navItemStyle}>
              <BarChart3 size={18} />
              <span>Rekap & Laporan</span>
            </NavLink>

            <NavLink to="/ai-analysis" style={navItemStyle}>
              <Sparkles size={18} style={{ color: '#7c3aed' }} />
              <span style={{ color: '#6d28d9' }}>AI Analysis System</span>
            </NavLink>
          </>
        )}

        {/* Admin Management */}
        {isAdmin && (
          <>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', padding: '16px 10px 8px' }}>
              Master Data & Kontrol
            </div>

            <NavLink to="/admin/buildings" style={navItemStyle}>
              <Building2 size={18} />
              <span>Master Gedung</span>
            </NavLink>

            <NavLink to="/admin/areas" style={navItemStyle}>
              <Building size={18} />
              <span>Master Area Gedung</span>
            </NavLink>

            <NavLink to="/admin/users" style={navItemStyle}>
              <UserCog size={18} />
              <span>Manajemen User</span>
            </NavLink>

            <NavLink to="/admin/audit-logs" style={navItemStyle}>
              <History size={18} />
              <span>Audit Log Aktivitas</span>
            </NavLink>
          </>
        )}

        {/* Public Kiosk Form Link */}
        <div style={{ marginTop: 24, padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8, fontWeight: 500 }}>
            Kiosk Tamu Lobby:
          </div>
          <NavLink
            to="/guest-form"
            target="_blank"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', gap: 6 }}
          >
            <QrCode size={14} />
            <span>Buka Form Tamu</span>
          </NavLink>
        </div>
      </div>

      {/* User Footer Profile */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid var(--border-subtle)',
        background: '#f8fafc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              flexShrink: 0
            }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Tamu Pengguna'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'capitalize' }}>
                {user?.role || 'Guest'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ padding: 6, color: '#dc2626' }}
            title="Keluar dari Sistem"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
