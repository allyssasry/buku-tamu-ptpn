import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, PlusCircle, CreditCard } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const GuestSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const guest = location.state?.guest;
  const message = location.state?.message || "Data kunjungan berhasil dicatat. Silakan menunggu proses verifikasi oleh security.";

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Success Card */}
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#ecfdf5',
            border: '1px solid #bbf7d0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#047857',
            marginBottom: 16,
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>
            Pendaftaran Kunjungan Berhasil
          </h1>

          <div style={{
            padding: '12px 16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            color: '#15803d',
            fontSize: '0.875rem',
            marginBottom: 24,
            lineHeight: 1.5
          }}>
            {message}
          </div>

          {/* Guest Registration Summary */}
          {guest && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              textAlign: 'left',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Registrasi #{guest.id}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: guest.category === 'magang' ? '#f3e8ff' : '#ecfdf5',
                    color: guest.category === 'magang' ? '#6b21a8' : '#047857',
                    border: guest.category === 'magang' ? '1px solid #e9d5ff' : '1px solid #bbf7d0'
                  }}>
                    {guest.category === 'magang' ? 'Peserta Magang' : 'Tamu Umum'}
                  </span>
                </div>
                <StatusBadge status={guest.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Nama {guest.category === 'magang' ? 'Mahasiswa/Siswa' : 'Tamu'}:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{guest.name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{guest.category === 'magang' ? 'Status' : 'Instansi'}:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{guest.institution}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Tujuan / Lantai:</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{guest.destination_floor || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Tujuan Kunjungan:</div>
                  <div style={{ color: '#0f172a' }}>{guest.destination_division}</div>
                </div>
                {guest.card_number && (
                  <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CreditCard size={18} style={{ color: '#047857' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nomor Kartu Akses:</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{guest.card_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/guest-form')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <PlusCircle size={16} />
              <span>Isi Form Tamu Baru</span>
            </button>

            <Link
              to="/login"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px' }}
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Halaman Utama</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestSuccess;
