import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import CameraCapture from '../components/CameraCapture';
import { Shield, Building2, User, FileText, Send, AlertCircle, ArrowLeft, GraduationCap, CreditCard, Tag, Camera } from 'lucide-react';

const CARD_OPTIONS = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(3, '0'));

const GuestForm = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    category: 'tamu', // 'tamu' | 'magang'
    card_number: '',
    purpose: '',
    meeting_with: '',
    destination_division: '',
    destination_floor: '',
    identity_type: 'KTP',
    identity_number: '',
    identity_photo: '',
    guest_photo: '',
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCardsData, setActiveCardsData] = useState({ occupied: [], details: {} });

  const fetchActiveCards = async () => {
    try {
      const res = await api.get('/active-cards');
      setActiveCardsData(res.data || { occupied: [], details: {} });
    } catch (err) {
      console.error('Gagal mengambil status kartu akses:', err);
    }
  };

  useEffect(() => {
    fetchActiveCards();
  }, []);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isMagang = formData.category === 'magang';
    const isIdPegawai = formData.identity_type === 'ID Card' || formData.identity_type === 'ID Pegawai';

    // Validation
    if (!formData.name.trim()) {
      return setError(isMagang ? 'Nama lengkap siswa/mahasiswa wajib diisi.' : 'Nama lengkap wajib diisi.');
    }

    if (isMagang) {
      if (!formData.destination_division.trim()) {
        return setError('Divisi / Unit penempatan magang wajib dipilih.');
      }
      if (!formData.guest_photo) {
        return setError('Foto diri siswa/mahasiswa magang wajib diambil atau diunggah.');
      }
      if (!formData.consent) {
        return setError('Persetujuan penggunaan data wajib dicentang.');
      }
    } else {
      if (!formData.institution.trim()) return setError('Instansi / Perusahaan wajib diisi.');
      if (!formData.phone.trim()) return setError('Nomor HP / WhatsApp wajib diisi.');
      if (!/^\d+$/.test(formData.phone.trim())) return setError('Nomor HP / WhatsApp hanya boleh berisi angka.');
      if (!formData.purpose.trim()) return setError('Keperluan kunjungan wajib diisi.');
      if (!formData.meeting_with.trim()) return setError('Bertemu dengan wajib diisi.');
      if (!formData.destination_division.trim()) return setError('Direksi / Divisi / Unit yang dituju wajib dipilih.');
      if (!formData.destination_floor.trim()) return setError('Lantai tujuan wajib dipilih.');
      if (formData.identity_number.trim() && !/^\d+$/.test(formData.identity_number.trim())) {
        return setError('Nomor identitas / NIK hanya boleh berisi angka.');
      }
      if (!formData.guest_photo) return setError('Foto diri tamu wajib diambil atau diunggah.');
      if (!formData.consent) return setError('Persetujuan penggunaan data wajib dicentang.');
    }

    if (formData.card_number && activeCardsData.occupied?.includes(formData.card_number)) {
      const occupant = activeCardsData.details?.[formData.card_number];
      return setError(`Nomor kartu akses ${formData.card_number} sedang digunakan oleh tamu ${occupant?.name || ''} (${occupant?.institution || ''}) dan belum dikembalikan.`);
    }

    setLoading(true);

    const payload = isMagang ? {
      ...formData,
      institution: formData.institution.trim() || 'Siswa / Mahasiswa Magang',
      purpose: formData.purpose.trim() || 'Kegiatan Magang / PKL',
      meeting_with: formData.meeting_with.trim() || `Pembimbing ${formData.destination_division}`,
      destination_floor: formData.destination_floor.trim() || 'Lantai Penempatan',
      identity_type: 'ID Card',
    } : formData;

    try {
      const res = await api.post('/guests', payload);
      navigate('/guest-success', {
        state: {
          guest: res.data.guest,
          message: res.data.message
        }
      });
    } catch (err) {
      console.error(err);
      const valErrors = err.response?.data?.errors;
      if (valErrors && Object.keys(valErrors).length > 0) {
        const firstField = Object.keys(valErrors)[0];
        const errorMsg = valErrors[firstField]?.[0] || err.response?.data?.message;
        setError(errorMsg);
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan data kunjungan. Silakan periksa kembali kelengkapan form.');
      }
    } finally {
      setLoading(false);
    }
  };

  const divisionOptions = [
    'Direktur SDM dan Umum',
    'Direktur Keuangan dan Manajemen Risiko',
    'Direktur Aset',
    'Direktur Produksi dan Pengembangan',
    'Direktur Bisnis',
    'Divisi Akuntansi dan Perpajakan',
    'Divisi Aneka Tanaman',
    'Divisi Hubungan Kelembagaan dan Hukum',
    'Divisi Manajemen Risiko',
    'Divisi Keuangan Strategis dan Anggaran',
    'Divisi Kelapa Sawit dan Karet',
    'Divisi Manajemen Aset',
    'Divisi Strategi dan Pengembangan SDM',
    'Divisi Operasional SDM',
    'Divisi Pengadaan dan Umum',
    'PMO Pengembangan Komoditi dan Hilirisasi',
    'Divisi Transformasi Digital',
    'Divisi Pemasaran dan Penjualan',
    'Divisi Strategi dan Manajemen Kinerja Korporasi'
  ];

  const isIdPegawai = formData.identity_type === 'ID Card' || formData.identity_type === 'ID Pegawai';
  const isMagang = formData.category === 'magang';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '36px 16px',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              backgroundColor: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Shield size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Buku Tamu Gedung Holding
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 2 }}>
                Registrasi Kunjungan Tamu Dinas & Peserta Magang
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Portal Petugas</span>
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#b91c1c',
            fontSize: '0.875rem',
            marginBottom: 24,
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* PILIH KATEGORI KUNJUNGAN: TAMU UMUM VS ANAK MAGANG */}
          <div className="glass-card" style={{ marginBottom: 20, padding: '20px' }}>
            <label className="form-label" style={{ marginBottom: 12, fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
              <Tag size={16} style={{ color: '#047857' }} />
              <span>Pilih Kategori Kunjungan <span className="required">*</span></span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <button
                type="button"
                onClick={() => handleChange('category', 'tamu')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                  borderRadius: 10,
                  border: formData.category === 'tamu' ? '2px solid #047857' : '1px solid #e2e8f0',
                  background: formData.category === 'tamu' ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: formData.category === 'tamu' ? '#047857' : '#f1f5f9',
                  color: formData.category === 'tamu' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: formData.category === 'tamu' ? '#065f46' : '#1e293b' }}>
                    Tamu Umum / Dinas
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                    Kunjungan dinas, vendor, instansi & mitra kerja
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('category', 'magang')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                  borderRadius: 10,
                  border: formData.category === 'magang' ? '2px solid #047857' : '1px solid #e2e8f0',
                  background: formData.category === 'magang' ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: formData.category === 'magang' ? '#047857' : '#f1f5f9',
                  color: formData.category === 'magang' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: formData.category === 'magang' ? '#065f46' : '#1e293b' }}>
                    Anak Magang / PKL
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                    Mahasiswa magang, siswa SMK PKL & riset
                  </div>
                </div>
              </button>
            </div>
          </div>

          {isMagang ? (
            /* KHUSUS BUKU TAMU MAGANG: HANYA NAMA LENGKAP, DIVISI, DAN FOTO DIRI */
            <div className="glass-card" style={{ marginBottom: 24, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                <GraduationCap size={22} style={{ color: '#047857' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                  Formulir Buku Tamu Siswa / Mahasiswa Magang
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 20 }}>
                {/* 1. Nama Lengkap */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Nama Lengkap Siswa / Mahasiswa <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Muhammad Farhan"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                {/* 2. Divisi / Unit Penempatan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Divisi / Unit Penempatan Magang <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.destination_division}
                    onChange={(e) => handleChange('destination_division', e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Divisi / Unit Penempatan --</option>
                    {divisionOptions.map((div, i) => (
                      <option key={i} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Foto Diri Tamu Magang */}
              <div>
                <CameraCapture
                  label="Foto Diri / Wajah Siswa / Mahasiswa Magang"
                  required={true}
                  value={formData.guest_photo}
                  onChange={(photo) => handleChange('guest_photo', photo)}
                  placeholderText="Ambil foto wajah siswa/mahasiswa magang atau upload foto"
                />
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: INFORMASI TAMU */}
              <div className="glass-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                  <User size={20} style={{ color: '#059669' }} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                    1. Informasi Tamu
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Nama Lengkap <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Ir. Budi Santoso"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Instansi / Perusahaan <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: PT Pupuk Indonesia (Persero)"
                      value={formData.institution}
                      onChange={(e) => handleChange('institution', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nomor HP / WhatsApp <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="Contoh: 081234567890 (Hanya Angka)"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label">Email (Opsional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="budi@perusahaan.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label">Alamat Asal (Opsional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Kota / Alamat domisili"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: INFORMASI KUNJUNGAN */}
              <div className="glass-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                  <Building2 size={20} style={{ color: '#059669' }} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                    2. Informasi Kunjungan
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Keperluan Kunjungan <span className="required">*</span></label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Jelaskan maksud dan tujuan kunjungan secara singkat..."
                      value={formData.purpose}
                      onChange={(e) => handleChange('purpose', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bertemu Dengan <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama pejabat / staff yang dituju"
                      value={formData.meeting_with}
                      onChange={(e) => handleChange('meeting_with', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direksi / Divisi / Unit Tujuan <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={formData.destination_division}
                      onChange={(e) => handleChange('destination_division', e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Direksi / Divisi / Unit --</option>
                      {divisionOptions.map((div, i) => (
                        <option key={i} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lantai Tujuan <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={formData.destination_floor}
                      onChange={(e) => handleChange('destination_floor', e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Lantai --</option>
                      <option value="Lantai 11">Lantai 11</option>
                      <option value="Lantai 15">Lantai 15</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nomor surat tugas / info tambahan"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: IDENTITAS & FOTO DIRI */}
              <div className="glass-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                  <Camera size={20} style={{ color: '#059669' }} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                    3. Identitas & Foto Diri Tamu
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Jenis Identitas <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={formData.identity_type}
                      onChange={(e) => handleChange('identity_type', e.target.value)}
                      required
                    >
                      <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                      <option value="SIM">SIM (Surat Izin Mengemudi)</option>
                      <option value="ID Card">ID Card Pegawai / Mitra</option>
                      <option value="Passport">Passport</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Nomor Identitas <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="Nomor NIK KTP / SIM / Passport (Hanya Angka, opsional)"
                      value={formData.identity_number}
                      onChange={(e) => handleChange('identity_number', e.target.value.replace(/\D/g, ''))}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                      *Nomor identitas bersifat opsional (hanya boleh angka jika diisi).
                    </span>
                  </div>

                  {/* NOMOR KARTU AKSES / BADGE (DROPDOWN 001 - 050) */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, color: '#0f172a' }}>
                        <CreditCard size={18} style={{ color: '#059669' }} />
                        <span>No. Kartu Akses / Visitor Badge (Kartu Tamu)</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, background: '#e2e8f0', padding: '2px 8px', borderRadius: 4 }}>
                        Pilih Dropdown (Opsional)
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        className="form-select"
                        style={{
                          paddingLeft: 40,
                          borderColor: formData.card_number ? '#10b981' : undefined,
                          background: formData.card_number ? '#f0fdf4' : '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          cursor: 'pointer'
                        }}
                        value={formData.card_number}
                        onChange={(e) => handleChange('card_number', e.target.value)}
                      >
                        <option value="">-- Pilih No. Kartu Akses (001 - 050) / Kosongkan --</option>
                        {CARD_OPTIONS.map((num) => {
                          const isOccupied = activeCardsData.occupied?.includes(num);
                          const occupant = activeCardsData.details?.[num];
                          return (
                            <option
                              key={num}
                              value={num}
                              disabled={isOccupied}
                              style={isOccupied ? { color: '#94a3b8', background: '#f1f5f9' } : { color: '#0f172a' }}
                            >
                              {num} {isOccupied ? `(Sedang Dipakai - ${occupant?.name || 'Tamu Aktif'})` : ' (Tersedia)'}
                            </option>
                          );
                        })}
                      </select>
                      <CreditCard
                        size={18}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: formData.card_number ? '#047857' : '#94a3b8',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                    {(() => {
                      const occupiedCount = CARD_OPTIONS.filter(num => activeCardsData.occupied?.includes(num)).length;
                      const availableCount = CARD_OPTIONS.length - occupiedCount;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 6, fontSize: '0.75rem', color: '#64748b' }}>
                          <span>Nomor kartu fisik yang diserahkan petugas (001 - 050). Kartu yang sedang dipakai tamu lain dinonaktifkan sampai dikembalikan.</span>
                          <span style={{ fontWeight: 600, color: availableCount === 50 ? '#059669' : availableCount > 0 ? '#2563eb' : '#dc2626' }}>
                            ✓ Tersedia {availableCount} / 50 Kartu
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  {/* Photo Diri Tamu (Wajib) */}
                  <CameraCapture
                    label="Foto Diri / Wajah Tamu"
                    required={true}
                    value={formData.guest_photo}
                    onChange={(photo) => handleChange('guest_photo', photo)}
                    placeholderText="Ambil foto wajah tamu di meja resepsionis atau upload foto"
                  />
                </div>
              </div>
            </>
          )}

          {/* SECTION 4: PERSETUJUAN */}
          <div className="glass-card" style={{ marginBottom: 28, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={formData.consent}
                onChange={(e) => handleChange('consent', e.target.checked)}
                style={{ width: 20, height: 20, marginTop: 2, accentColor: '#059669', cursor: 'pointer' }}
                required
              />
              <label htmlFor="consent-checkbox" style={{ fontSize: '0.875rem', color: '#475569', cursor: 'pointer', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Persetujuan Data Kunjungan: </span>
                "Saya menyetujui penggunaan data yang saya berikan untuk keperluan administrasi dan keamanan kunjungan di lingkungan gedung perusahaan holding."
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '16px 24px', fontSize: '1.0625rem' }}
            disabled={loading}
          >
            <Send size={20} />
            <span>{loading ? 'Mengirim Data Kunjungan...' : 'Kirim Data Kunjungan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestForm;
