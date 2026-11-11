import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ImageModal from '../components/ImageModal';
import {
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle,
  PlusCircle,
  Building,
  LogOut,
  CreditCard,
  GraduationCap
} from 'lucide-react';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('');

  // Quick verify modal state
  const [verifyingGuest, setVerifyingGuest] = useState(null);
  const [depositChecked, setDepositChecked] = useState(true);
  const [depositNotes, setDepositNotes] = useState('Disimpan di loker security.');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error("Gagal mengambil data dashboard security:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenVerifyModal = (guest) => {
    setVerifyingGuest(guest);
    setDepositChecked(true);
    setDepositNotes('Disimpan di loker security.');
  };

  const submitVerify = async () => {
    if (!verifyingGuest) return;
    setActionLoading(true);
    try {
      await api.post(`/guests/${verifyingGuest.id}/verify`, {
        status: 'Sedang Berkunjung',
        deposit_id: depositChecked,
        deposit_notes: depositNotes,
      });
      setVerifyingGuest(null);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memverifikasi tamu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async (guest) => {
    const isMagang = guest.category === 'magang';
    const label = isMagang ? 'anak magang' : 'tamu';
    const cardStr = guest.card_number ? ` (Kartu: ${guest.card_number})` : '';
    if (!window.confirm(`Konfirmasi check-out untuk ${label} ${guest.name}${cardStr}?\n\nKartu akses akan dikembalikan dan KTP/identitas otomatis dicatat kembali.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/guests/${guest.id}/checkout`);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses check-out tamu.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Memuat Dashboard Security...
      </div>
    );
  }

  const { guest_stats, security_stats, recent_guests, recent_security_logs } = data || {};
  const waitingGuests = recent_guests?.filter(g => g.status === 'Menunggu Verifikasi') || [];

  return (
    <div>
      {/* Page Title & Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 28
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.625rem', fontWeight: 700, color: '#0f172a' }}>
            Security Operations Console
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Monitoring Kunjungan & Patroli Keamanan Gedung Real-Time
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/security-book" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Pengecekan Patroli Baru</span>
          </Link>
          <Link to="/guests" className="btn btn-secondary">
            <Users size={16} />
            <span>Daftar Tamu Lengkap</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard
          title="Tamu Hari Ini"
          value={guest_stats?.today || 0}
          icon={Users}
          color="blue"
          subtext="Total registrasi tamu hari ini"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={guest_stats?.by_status?.['Menunggu Verifikasi'] || 0}
          icon={Clock}
          color="amber"
          subtext="Membutuhkan tindakan security"
        />
        <StatCard
          title="Sedang di Gedung"
          value={guest_stats?.currently_in || 0}
          icon={ShieldCheck}
          color="green"
          subtext="Tamu aktif berkunjung"
        />
        <StatCard
          title="Patroli Area Hari Ini"
          value={security_stats?.checks_today || 0}
          icon={Building}
          color="purple"
          subtext={`${security_stats?.checked_areas_count || 0} dari ${security_stats?.total_areas || 0} area diperiksa`}
        />
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 }}>
        {/* Card 1: Kunjungan Terkini & Check-Out */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a' }}>
                Kunjungan Terkini & Check-Out
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Tamu umum & magang yang aktif berkunjung di gedung
              </p>
            </div>
            <Link to="/guests" className="btn btn-outline btn-sm">
              <span>Semua Tamu</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {!recent_guests || recent_guests.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              Belum ada data kunjungan tamu hari ini.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama & Instansi</th>
                    <th>No. Kartu</th>
                    <th>Tujuan</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_guests.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {g.category === 'magang' ? '🎓 ' : ''}{g.institution}
                        </div>
                      </td>
                      <td>
                        {g.card_number ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 6px',
                            background: g.category === 'magang' ? '#faf5ff' : '#eff6ff',
                            border: g.category === 'magang' ? '1px solid #d8b4fe' : '1px solid #bfdbfe',
                            borderRadius: 4,
                            color: g.category === 'magang' ? '#7e22ce' : '#1d4ed8',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                          }}>
                            {g.card_number}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>{g.destination_floor}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.destination_division}</div>
                      </td>
                      <td>
                        <StatusBadge status={g.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {g.status === 'Sedang Berkunjung' && (
                          <button
                            onClick={() => handleCheckout(g)}
                            disabled={actionLoading}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#b45309' }}
                            title="Check-Out tamu (KTP & Kartu dikembalikan)"
                          >
                            <LogOut size={13} />
                            <span>Check-Out</span>
                          </button>
                        )}
                        {g.status === 'Menunggu Verifikasi' && (
                          <button
                            onClick={() => handleOpenVerifyModal(g)}
                            className="btn btn-success btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <CheckCircle size={13} />
                            <span>Verifikasi</span>
                          </button>
                        )}
                        {g.status === 'Sudah Keluar' && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card 2: Riwayat Pengecekan Area Terkini */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a' }}>
                Patroli Area Terkini (Security Book)
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Dokumentasi foto & inspeksi shift hari ini
              </p>
            </div>
            <Link to="/security-book" className="btn btn-outline btn-sm">
              <span>Buka Buku Patroli</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Area / Lantai</th>
                  <th>Status</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {recent_security_logs?.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {new Date(log.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {log.security?.name?.split(' ')[0] || 'Security'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.area?.name || 'Area Gedung'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.area?.floor}</div>
                    </td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td>
                      {log.photo_url ? (
                        <button
                          onClick={() => {
                            setSelectedPhoto(log.photo_url);
                            setPhotoTitle(`Foto Pengecekan: ${log.area?.name} (${log.status})`);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} />
                          <span>Lihat</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK VERIFY MODAL */}
      {verifyingGuest && (
        <div className="modal-overlay" onClick={() => setVerifyingGuest(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Verifikasi Tamu: {verifyingGuest.name}
              </h3>
              <button onClick={() => setVerifyingGuest(null)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Instansi:</div>
                  <div style={{ fontWeight: 600 }}>{verifyingGuest.institution}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tujuan:</div>
                  <div style={{ fontWeight: 600 }}>{verifyingGuest.destination_floor} ({verifyingGuest.destination_division})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bertemu:</div>
                  <div>{verifyingGuest.meeting_with}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>No. Identitas ({verifyingGuest.identity_type}):</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{verifyingGuest.identity_number}</div>
                </div>
              </div>

              {/* Foto Diri Tamu / Identitas Preview */}
              {(verifyingGuest.guest_photo_url || verifyingGuest.identity_photo_url) && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 6 }}>
                    {verifyingGuest.guest_photo_url ? 'Foto Diri / Wajah Tamu:' : 'Dokumentasi KTP / Identitas:'}
                  </div>
                  <img
                    src={verifyingGuest.guest_photo_url || verifyingGuest.identity_photo_url}
                    alt="Foto Tamu"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}

              {/* Penitipan ID checkbox */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginTop: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    id="deposit-check"
                    checked={depositChecked}
                    onChange={(e) => setDepositChecked(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#059669' }}
                  />
                  <label htmlFor="deposit-check" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#065f46' }}>
                    Catat Penitipan KTP / ID di Pos Security
                  </label>
                </div>
                {depositChecked && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nomor loker penitipan / catatan..."
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    style={{ fontSize: '0.8125rem', marginTop: 6 }}
                  />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setVerifyingGuest(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={submitVerify} className="btn btn-success" disabled={actionLoading}>
                <CheckCircle size={16} />
                <span>{actionLoading ? 'Memproses...' : 'Konfirmasi & Izinkan Masuk'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      <ImageModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        src={selectedPhoto}
        title={photoTitle}
      />
    </div>
  );
};

export default SecurityDashboard;
