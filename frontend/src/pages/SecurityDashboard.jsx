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
  GraduationCap,
  FileText,
  Building2,
  Wrench,
  Package
} from 'lucide-react';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('');

  // Quick verify modal state
  const [verifyingGuest, setVerifyingGuest] = useState(null);
  const [depositChecked, setDepositChecked] = useState(true);
  const [depositNotes, setDepositNotes] = useState('Disimpan di loker security.');
  const [verifyGuestNotes, setVerifyGuestNotes] = useState('');
  const [destinationFloor, setDestinationFloor] = useState('Lantai 11');
  const [actionLoading, setActionLoading] = useState(false);

  // Quick checkout modal state
  const [checkingOutGuest, setCheckingOutGuest] = useState(null);
  const [checkoutItemsBroughtOut, setCheckoutItemsBroughtOut] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.get('/dashboard', { timeout: 30000 });
      setData(res.data);
    } catch (err) {
      console.error("Gagal mengambil data dashboard security:", err);
      setErrorMessage(
        err.code === 'ECONNABORTED'
          ? 'Koneksi ke server dashboard melebihi batas waktu (timeout). Silakan klik Coba Lagi.'
          : (err.response?.data?.message || 'Gagal memuat data dashboard security dari server.')
      );
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
    setVerifyGuestNotes(guest.notes || '');
    const isMagang = guest.category === 'magang';
    const defaultFloor = guest.destination_floor && guest.destination_floor !== '-'
      ? guest.destination_floor
      : (isMagang ? 'Lantai Penempatan' : 'Lantai 11');
    setDestinationFloor(defaultFloor);
  };

  const submitVerify = async () => {
    if (!verifyingGuest) return;
    setActionLoading(true);
    try {
      await api.post(`/guests/${verifyingGuest.id}/verify`, {
        status: 'Sedang Berkunjung',
        deposit_id: depositChecked,
        deposit_notes: depositNotes,
        notes: verifyGuestNotes || undefined,
        destination_floor: destinationFloor || undefined,
        card_number: verifyingGuest.card_number || undefined,
      });
      setVerifyingGuest(null);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memverifikasi tamu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCheckoutModal = (guest) => {
    setCheckingOutGuest(guest);
    setCheckoutItemsBroughtOut(guest.items_brought_out || '');
  };

  const submitCheckout = async () => {
    if (!checkingOutGuest) return;
    setActionLoading(true);
    try {
      await api.post(`/guests/${checkingOutGuest.id}/checkout`, {
        items_brought_out: checkoutItemsBroughtOut || undefined,
      });
      setCheckingOutGuest(null);
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

  if (!loading && (!data || errorMessage)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 8 }}>
            Gagal Memuat Dashboard Security
          </div>
          <p style={{ color: '#7f1d1d', fontSize: '0.875rem', marginBottom: 18, lineHeight: 1.5 }}>
            {errorMessage || 'Tidak dapat terhubung ke server untuk memuat metrik security.'}
          </p>
          <button className="btn btn-primary" onClick={fetchDashboard} style={{ margin: '0 auto' }}>
            Coba Muat Ulang
          </button>
        </div>
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
                            background: g.category === 'magang' ? '#faf5ff' : (g.category === 'vendor' ? '#fefce8' : '#eff6ff'),
                            border: g.category === 'magang' ? '1px solid #d8b4fe' : (g.category === 'vendor' ? '1px solid #fef08a' : '1px solid #bfdbfe'),
                            borderRadius: 4,
                            color: g.category === 'magang' ? '#7e22ce' : (g.category === 'vendor' ? '#a16207' : '#1d4ed8'),
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
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: g.destination_floor && g.destination_floor !== '-' ? '#0284c7' : '#94a3b8' }}>
                          {g.destination_floor && g.destination_floor !== '-' ? g.destination_floor : 'Menunggu Verifikasi'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.destination_division}</div>
                      </td>
                      <td>
                        <StatusBadge status={g.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {g.status === 'Sedang Berkunjung' && (
                          <button
                            onClick={() => handleOpenCheckoutModal(g)}
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
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Instansi / Perusahaan:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{verifyingGuest.institution || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Divisi / Unit Tujuan:</div>
                  <div style={{ fontWeight: 700, color: '#047857' }}>{verifyingGuest.destination_division || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bertemu Dengan:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{verifyingGuest.meeting_with || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jenis Identitas:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{verifyingGuest.identity_type || 'KTP'}</div>
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

              {/* Info Khusus Vendor: No SPK & Barang Bawaan Masuk */}
              {verifyingGuest.category === 'vendor' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
                    📋 No. SPK / Surat Tugas / Surat Dinas:
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#78350f', fontFamily: 'monospace', marginBottom: 8 }}>
                    {verifyingGuest.work_order_number || '-'}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={14} style={{ color: '#b45309' }} />
                    <span>Daftar Barang Bawaan Masuk (Pemeriksaan Security):</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#78350f', background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #fef08a', whiteSpace: 'pre-line' }}>
                    {verifyingGuest.items_brought_in || 'Tidak ada catatan barang bawaan masuk'}
                  </div>
                </div>
              )}

              {/* 1. Pilihan Lantai Tujuan oleh Petugas Security */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 12
              }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={16} style={{ color: '#0284c7' }} />
                    <span>Lantai Tujuan:</span>
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4 }}>
                    Petugas Security Lt. 11
                  </span>
                </label>
                <select
                  className="form-select"
                  value={destinationFloor}
                  onChange={(e) => setDestinationFloor(e.target.value)}
                  style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}
                >
                  <option value="Lantai 11">Lantai 11</option>
                  <option value="Lantai 15">Lantai 15</option>
                  <option value="Lantai 16">Lantai 16</option>
                  <option value="Lantai Penempatan">Lantai Penempatan (Khusus Magang)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  *Petugas security lantai 11 yang memasukkan lantai tujuan (Lantai 11, 15, atau 16) dan memberikan kartu akses.
                </span>
              </div>

              {/* 2. Nomor Kartu Akses Fisik (Terkunci Otomatis Looping) */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 700, color: '#1e40af' }}>
                    <CreditCard size={16} />
                    <span>No. Kartu Akses Fisik (001 - 050):</span>
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 4 }}>
                    ⚡ Otomatis Looping
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #93c5fd',
                  borderRadius: 6,
                  fontWeight: 700,
                  color: '#1e40af'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '2px 8px',
                      background: verifyingGuest.category === 'magang' ? '#faf5ff' : (verifyingGuest.category === 'vendor' ? '#fefce8' : '#eff6ff'),
                      color: verifyingGuest.category === 'magang' ? '#7e22ce' : (verifyingGuest.category === 'vendor' ? '#a16207' : '#1d4ed8'),
                      border: verifyingGuest.category === 'magang' ? '1px solid #d8b4fe' : (verifyingGuest.category === 'vendor' ? '1px solid #fef08a' : '1px solid #bfdbfe'),
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {verifyingGuest.category === 'magang' ? '🎓 Kartu Magang' : (verifyingGuest.category === 'vendor' ? '🔧 Kartu Vendor' : '👤 Kartu Tamu')}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', letterSpacing: '0.05em' }}>
                      {verifyingGuest.card_number || '001'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Terkunci Otomatis
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  *Nomor kartu telah dialokasikan otomatis oleh sistem (looping 001 - 050). Petugas security cukup menyerahkan kartu fisik bernomor <strong>{verifyingGuest.card_number || '001'}</strong>.
                </span>
              </div>

              {/* 3. Penitipan ID checkbox */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: depositChecked ? 8 : 0 }}>
                  <input
                    type="checkbox"
                    id="deposit-check"
                    checked={depositChecked}
                    onChange={(e) => setDepositChecked(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#059669' }}
                  />
                  <label htmlFor="deposit-check" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#065f46' }}>
                    Titipkan KTP / ID di Pos Security
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

              {/* 4. Catatan Tambahan (Opsional) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FileText size={16} style={{ color: '#047857' }} />
                  <span>Catatan Tambahan (Opsional):</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nomor surat tugas / info tambahan tamu..."
                  value={verifyGuestNotes}
                  onChange={(e) => setVerifyGuestNotes(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  *Security dapat menginput nomor surat tugas atau catatan sebelum konfirmasi verifikasi.
                </span>
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

      {/* QUICK CHECK-OUT MODAL */}
      {checkingOutGuest && (
        <div className="modal-overlay" onClick={() => setCheckingOutGuest(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Check-Out Pengunjung: {checkingOutGuest.name}
              </h3>
              <button onClick={() => setCheckingOutGuest(null)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 16 }}>
                Konfirmasi bahwa {checkingOutGuest.category === 'magang' ? 'anak magang' : (checkingOutGuest.category === 'vendor' ? 'vendor' : 'tamu')} <strong>{checkingOutGuest.name}</strong> ({checkingOutGuest.institution}) telah selesai berkunjung dan keluar dari gedung. Kartu akses fisik dikembalikan dan identitas otomatis dicatat kembali.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nomor Kartu Akses:</div>
                  <div style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'monospace' }}>
                    {checkingOutGuest.card_number ? `No. ${checkingOutGuest.card_number}` : '-'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kategori Kunjungan:</div>
                  <div style={{ fontWeight: 700, color: checkingOutGuest.category === 'magang' ? '#7e22ce' : (checkingOutGuest.category === 'vendor' ? '#a16207' : '#047857') }}>
                    {checkingOutGuest.category === 'magang' ? '🎓 Anak Magang' : (checkingOutGuest.category === 'vendor' ? '🔧 Vendor / Kontraktor' : '👤 Tamu Umum')}
                  </div>
                </div>
              </div>

              {/* Tampilkan barang bawaan masuk jika ada */}
              {checkingOutGuest.items_brought_in && (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={14} style={{ color: '#047857' }} />
                    <span>Catatan Barang Bawaan Masuk Saat Registrasi:</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', whiteSpace: 'pre-line' }}>
                    {checkingOutGuest.items_brought_in}
                  </div>
                </div>
              )}

              {/* Pemeriksaan Barang Bawaan Keluar */}
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: 14, borderRadius: 8 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#713f12', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Package size={16} style={{ color: '#a16207' }} />
                  <span>Pemeriksaan Barang Bawaan Keluar (Security Check-Out):</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Catat peralatan / material yang dibawa keluar oleh tamu / vendor (misal: Sisa kabel bekas, modul lama, toolset lengkap)..."
                  value={checkoutItemsBroughtOut}
                  onChange={(e) => setCheckoutItemsBroughtOut(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#854d0e', marginTop: 4, display: 'block' }}>
                  *Security wajib memeriksa dan mencatat barang yang dibawa keluar sebelum konfirmasi check-out.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setCheckingOutGuest(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={submitCheckout} className="btn btn-warning" disabled={actionLoading} style={{ background: '#d97706', color: '#ffffff' }}>
                <LogOut size={16} />
                <span>{actionLoading ? 'Memproses...' : 'Konfirmasi Check-Out & Kembalikan ID'}</span>
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
