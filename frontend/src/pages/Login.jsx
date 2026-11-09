import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, QrCode } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'security') {
        navigate('/security/dashboard');
      } else if (user.role === 'pimpinan') {
        navigate('/pimpinan/dashboard');
      } else {
        navigate('/guest-form');
      }
    } catch (err) {
      if (!err.response) {
        setError('Tidak dapat terhubung ke server backend (port 8000 mati). Silakan jalankan "php artisan serve" di terminal backend.');
      } else {
        setError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demEmail, demPass) => {
    setEmail(demEmail);
    setPassword(demPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: '#047857',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            marginBottom: 14,
          }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
            Buku Tamu Gedung Holding
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 4 }}>
            Sistem Informasi Kunjungan & Keamanan Gedung
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-card" style={{ padding: '36px 32px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 20, color: '#0f172a' }}>
            Masuk ke Portal Monitoring
          </h2>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#b91c1c',
              fontSize: '0.8125rem',
              marginBottom: 20,
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Akun</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#94a3b8' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="adminptpn@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#94a3b8' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: 16 }}
              disabled={loading}
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20, marginTop: 10 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>
              AKSES CEPAT DEMO ROLE:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDemoCredentials('adminptpn@gmail.com', 'adminptpn')}
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              >
                Super Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDemoCredentials('securityptpn@gmail.com', 'securityptpn')}
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              >
                Security Officer
              </button>
            </div>
          </div>
        </div>

        {/* Public Kiosk Form Shortcut */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link
            to="/guest-form"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-full)' }}
          >
            <QrCode size={16} />
            <span>Kiosk Mandiri: Isi Buku Tamu di Lobby</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
