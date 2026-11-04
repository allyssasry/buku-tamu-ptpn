import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ImageModal from '../components/ImageModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import {
  Users,
  Search,
  Eye,
  CheckCircle,
  LogIn,
  LogOut,
  Trash2,
  Calendar,
  GraduationCap,
  CreditCard,
  User,
  Tag,
  Clock
} from 'lucide-react';

const CARD_OPTIONS = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(3, '0'));

const GuestList = () => {
  const { isAdmin, isPimpinan } = useAuth();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all'); // 'all', 'tamu', 'magang'
  const [floor, setFloor] = useState('all');
  const [date, setDate] = useState('');

  // Selected Detail Modal
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [photoModal, setPhotoModal] = useState({ isOpen: false, src: '', title: '' });

  // Action dialogs
  const [actionConfirm, setActionConfirm] = useState({
    isOpen: false,
    type: '',
    guest: null,
    title: '',
    message: '',
    notes: '',
    depositId: true,
    cardNumber: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [editingCard, setEditingCard] = useState({ isEditing: false, cardNumber: '' });
  const [savingCard, setSavingCard] = useState(false);
  const [activeCardsData, setActiveCardsData] = useState({ occupied: [], details: {} });

  const fetchActiveCards = async () => {
    try {
      const res = await api.get('/active-cards');
      setActiveCardsData(res.data || { occupied: [], details: {} });
    } catch (err) {
      console.error('Gagal memuat status kartu aktif:', err);
    }
  };

  useEffect(() => {
    fetchActiveCards();
  }, []);

  const fetchGuests = async (page = 1) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {
        page,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        category: category !== 'all' ? category : undefined,
        floor: floor !== 'all' ? floor : undefined,
        date: date || undefined,
      };
      const res = await api.get('/guests', { params });
      setGuests(res.data.data || []);
      setPagination({
        current_page: res.data.current_page || 1,
        last_page: res.data.last_page || 1,
        total: res.data.total || 0,
      });
    } catch (err) {
      console.error("Gagal memuat daftar tamu:", err);
      setErrorMessage(err.response?.data?.message || err.message || 'Gagal memuat data tamu dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests(1);
  }, [search, status, category, floor, date]);

  const handleViewDetail = async (guestId) => {
    try {
      const res = await api.get(`/guests/${guestId}`);
      setSelectedGuest(res.data);
      setEditingCard({ isEditing: false, cardNumber: res.data.card_number || '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCardManual = async () => {
    if (!selectedGuest) return;
    setSavingCard(true);
    try {
      const trimmedCard = editingCard.cardNumber.trim();
      await api.put(`/guests/${selectedGuest.id}`, {
        card_number: trimmedCard || null,
      });
      setSelectedGuest(prev => ({
        ...prev,
        card_number: trimmedCard || null,
      }));
      setEditingCard({ isEditing: false, cardNumber: trimmedCard });
      fetchGuests(pagination.current_page);
      fetchActiveCards();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menyimpan nomor kartu.');
    } finally {
      setSavingCard(false);
    }
  };

  const handleOpenAction = (type, guest) => {
    const isMagang = guest.category === 'magang';
    const labelUser = isMagang ? 'Anak Magang' : 'Tamu';

    if (type === 'verify') {
      setActionConfirm({
        isOpen: true,
        type: 'verify',
        guest,
        title: `Verifikasi ${labelUser}: ${guest.name}`,
        message: `Apakah Anda yakin ingin memverifikasi kedatangan ${labelUser.toLowerCase()} ${guest.name} dari ${guest.institution}?`,
        notes: 'Disimpan di loker security.',
        depositId: true,
        cardNumber: guest.card_number || '',
      });
    } else if (type === 'checkin') {
      setActionConfirm({
        isOpen: true,
        type: 'checkin',
        guest,
        title: `Check-In ${labelUser}: ${guest.name}`,
        message: `Tandai ${labelUser.toLowerCase()} sebagai "Sedang Berkunjung" di area gedung?`,
        notes: 'Disimpan di loker security.',
        depositId: true,
        cardNumber: guest.card_number || '',
      });
    } else if (type === 'checkout') {
      setActionConfirm({
        isOpen: true,
        type: 'checkout',
        guest,
        title: `Check-Out ${labelUser}: ${guest.name}`,
        message: `Konfirmasi bahwa ${labelUser.toLowerCase()} ${guest.name} telah selesai berkunjung dan keluar dari gedung. Kartu akses dikembalikan dan identitas otomatis dicatat kembali.`,
        notes: '',
        depositId: false,
        cardNumber: guest.card_number || '',
      });
    } else if (type === 'delete') {
      setActionConfirm({
        isOpen: true,
        type: 'delete',
        guest,
        title: `Hapus Data ${labelUser}: ${guest.name}`,
        message: `Data registrasi ${labelUser.toLowerCase()} ini akan dihapus secara permanen dari sistem database.`,
        notes: '',
        depositId: false,
        cardNumber: guest.card_number || '',
      });
    }
  };

  const handleConfirmAction = async () => {
    const { type, guest, depositId, notes, cardNumber } = actionConfirm;
    if (!guest) return;
    setActionLoading(true);

    try {
      if (type === 'verify') {
        await api.post(`/guests/${guest.id}/verify`, {
          status: 'Terverifikasi',
          deposit_id: depositId,
          deposit_notes: notes,
          card_number: cardNumber || undefined,
        });
      } else if (type === 'checkin') {
        await api.post(`/guests/${guest.id}/checkin`, {
          deposit_id: depositId,
          deposit_notes: notes,
          card_number: cardNumber || undefined,
        });
      } else if (type === 'checkout') {
        await api.post(`/guests/${guest.id}/checkout`);
      } else if (type === 'delete') {
        await api.delete(`/guests/${guest.id}`);
      }

      setActionConfirm({ isOpen: false, type: '', guest: null, title: '', message: '', cardNumber: '' });
      if (selectedGuest && selectedGuest.id === guest.id) {
        handleViewDetail(guest.id);
      }
      fetchGuests(pagination.current_page);
      fetchActiveCards();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengeksekusi aksi.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.625rem', fontWeight: 700, color: '#0f172a' }}>
            Buku Tamu Gedung Holding
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Pendataan, Verifikasi Identitas, dan Monitoring Tamu Berkunjung
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setSearch('');
              setStatus('all');
              setFloor('all');
              setDate(new Date().toISOString().split('T')[0]);
            }}
            className="btn btn-secondary btn-sm"
          >
            <Calendar size={14} />
            <span>Tamu Hari Ini Saja</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Cari nama, instansi/kampus, no. kartu, NIK, keperluan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                fontWeight: 600,
                color: category === 'magang' ? '#7e22ce' : (category === 'tamu' ? '#047857' : undefined),
                background: category === 'magang' ? '#faf5ff' : (category === 'tamu' ? '#f0fdf4' : undefined),
              }}
            >
              <option value="all">Semua Kategori</option>
              <option value="tamu">👤 Tamu Umum</option>
              <option value="magang">🎓 Anak Magang / PKL</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Terverifikasi">Terverifikasi</option>
              <option value="Sedang Berkunjung">Sedang Berkunjung</option>
              <option value="Sudah Keluar">Sudah Keluar</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Floor Filter */}
          <div>
            <select
              className="form-select"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            >
              <option value="all">Semua Lantai</option>
              <option value="Lantai Dasar (GF)">Lantai Dasar (GF)</option>
              <option value="Lantai 1">Lantai 1</option>
              <option value="Lantai 2">Lantai 2</option>
              <option value="Lantai 3">Lantai 3</option>
              <option value="Lantai 11">Lantai 11</option>
              <option value="Lantai 15">Lantai 15</option>
              <option value="Lantai 16 (Rooftop)">Lantai 16 (Rooftop)</option>
              <option value="Basement 1">Basement 1</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Kategori</th>
              <th>Nama Pengunjung</th>
              <th>Instansi / Kampus</th>
              <th>No. Kartu</th>
              <th>Keperluan & Tujuan</th>
              <th>Lantai</th>
              <th>No. Identitas</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Memuat data tamu...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 30, color: '#ef4444' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{errorMessage}</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => fetchGuests(pagination.current_page)}>
                    Coba Muat Ulang
                  </button>
                </td>
              </tr>
            ) : guests.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Tidak ada data tamu yang sesuai dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              guests.map((g) => (
                <tr key={g.id}>
                  <td style={{ fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(g.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </div>
                    <div style={{ color: '#64748b' }}>
                      {new Date(g.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    {g.category === 'magang' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#f3e8ff',
                        color: '#7e22ce',
                        border: '1px solid #d8b4fe'
                      }}>
                        <GraduationCap size={13} />
                        <span>Magang</span>
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#f0fdf4',
                        color: '#047857',
                        border: '1px solid #a7f3d0'
                      }}>
                        <User size={13} />
                        <span>Tamu</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                    {g.position && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.position}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{g.institution}</div>
                  </td>
                  <td>
                    {g.card_number ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 6,
                        color: '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}>
                        <CreditCard size={12} />
                        <span>{g.card_number}</span>
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={g.purpose}>
                      {g.purpose}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Bertemu: {g.meeting_with} ({g.destination_division})
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: '#0284c7', fontWeight: 600 }}>
                      {g.destination_floor}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      {g.masked_identity_number}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={g.status} />
                    {g.status === 'Sudah Keluar' && (g.check_out_at || g.updated_at) && (
                      <div style={{
                        fontSize: '0.6875rem',
                        color: '#64748b',
                        marginTop: 4,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3.5
                      }}>
                        <Clock size={11} style={{ color: '#94a3b8' }} />
                        <span>Keluar: {new Date(g.check_out_at || g.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    )}
                    {g.status === 'Sedang Berkunjung' && g.check_in_at && (
                      <div style={{
                        fontSize: '0.6875rem',
                        color: '#0284c7',
                        marginTop: 4,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3.5
                      }}>
                        <Clock size={11} style={{ color: '#0ea5e9' }} />
                        <span>Masuk: {new Date(g.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewDetail(g.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px' }}
                        title="Lihat Detail Tamu & Foto"
                      >
                        <Eye size={14} />
                      </button>

                      {!isPimpinan && g.status === 'Menunggu Verifikasi' && (
                        <button
                          onClick={() => handleOpenAction('verify', g)}
                          className="btn btn-success btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        >
                          <CheckCircle size={13} />
                          <span>Verifikasi</span>
                        </button>
                      )}

                      {!isPimpinan && g.status === 'Terverifikasi' && (
                        <button
                          onClick={() => handleOpenAction('checkin', g)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        >
                          <LogIn size={13} />
                          <span>Check-In</span>
                        </button>
                      )}

                      {!isPimpinan && g.status === 'Sedang Berkunjung' && (
                        <button
                          onClick={() => handleOpenAction('checkout', g)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#b45309' }}
                        >
                          <LogOut size={13} />
                          <span>Check-Out</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleOpenAction('delete', g)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px', color: '#dc2626' }}
                          title="Hapus Data Tamu"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* GUEST DETAIL MODAL */}
      {selectedGuest && (
        <div className="modal-overlay" onClick={() => setSelectedGuest(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: selectedGuest.category === 'magang' ? '#f3e8ff' : '#ecfdf5',
                  color: selectedGuest.category === 'magang' ? '#7e22ce' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedGuest.category === 'magang' ? <GraduationCap size={20} /> : <Users size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                    Detail Kunjungan {selectedGuest.category === 'magang' ? 'Anak Magang / PKL' : 'Tamu'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID Registrasi: #{selectedGuest.id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: selectedGuest.category === 'magang' ? '#f3e8ff' : '#ecfdf5',
                  color: selectedGuest.category === 'magang' ? '#7e22ce' : '#047857',
                  border: selectedGuest.category === 'magang' ? '1px solid #d8b4fe' : '1px solid #a7f3d0'
                }}>
                  {selectedGuest.category === 'magang' ? '🎓 Magang / PKL' : '👤 Tamu Umum'}
                </span>
                <StatusBadge status={selectedGuest.status} />
              </div>
            </div>

            <div className="modal-body">
              {/* Highlight Card Number if present */}
              <div style={{
                marginBottom: 18,
                padding: '12px 16px',
                borderRadius: 10,
                background: selectedGuest.card_number ? '#eff6ff' : '#f8fafc',
                border: selectedGuest.card_number ? '1px solid #bfdbfe' : '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={20} style={{ color: selectedGuest.card_number ? '#1d4ed8' : '#94a3b8' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      No. Kartu Akses / Visitor Badge {selectedGuest.category === 'magang' ? '(Kartu Magang)' : '(Kartu Tamu)'}
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: selectedGuest.card_number ? '#1e40af' : '#94a3b8'
                    }}>
                      {selectedGuest.card_number || 'Belum diisi'}
                    </div>
                  </div>
                </div>

                {editingCard.isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 8 }}>
                    <select
                      className="form-select"
                      style={{ maxWidth: 220, fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}
                      value={editingCard.cardNumber}
                      onChange={(e) => setEditingCard(p => ({ ...p, cardNumber: e.target.value }))}
                      autoFocus
                    >
                      <option value="">-- Tanpa Kartu --</option>
                      {CARD_OPTIONS.map((num) => {
                        const isOccupied = activeCardsData.occupied?.includes(num) && selectedGuest?.card_number !== num;
                        const occupant = activeCardsData.details?.[num];
                        return (
                          <option
                            key={num}
                            value={num}
                            disabled={isOccupied}
                            style={isOccupied ? { color: '#94a3b8', background: '#f1f5f9' } : { color: '#0f172a' }}
                          >
                            {num} {isOccupied ? `(Sedang Dipakai - ${occupant?.name || 'Tamu'})` : ''}
                          </option>
                        );
                      })}
                      {editingCard.cardNumber && !CARD_OPTIONS.includes(editingCard.cardNumber) && (
                        <option value={editingCard.cardNumber}>{editingCard.cardNumber}</option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveCardManual}
                      disabled={savingCard}
                      className="btn btn-primary btn-sm"
                    >
                      {savingCard ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCard({ isEditing: false, cardNumber: selectedGuest.card_number || '' })}
                      className="btn btn-secondary btn-sm"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {selectedGuest.card_number ? '✅ Kartu Aktif Digunakan' : '⚠️ Harap serahkan kartu saat verifikasi'}
                    </span>
                    {!isPimpinan && (
                      <button
                        type="button"
                        onClick={() => setEditingCard({ isEditing: true, cardNumber: selectedGuest.card_number || '' })}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <span>✏️ {selectedGuest.card_number ? 'Ubah No. Kartu' : 'Isi No. Kartu Manual'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <span className="form-label">Nama {selectedGuest.category === 'magang' ? 'Mahasiswa/Siswa' : 'Lengkap'}</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{selectedGuest.name}</div>
                </div>
                <div>
                  <span className="form-label">{selectedGuest.category === 'magang' ? 'Asal Kampus / Sekolah' : 'Instansi / Perusahaan'}</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedGuest.institution}</div>
                </div>
                <div>
                  <span className="form-label">{selectedGuest.category === 'magang' ? 'Jurusan / Posisi' : 'Jabatan'}</span>
                  <div>{selectedGuest.position || '-'}</div>
                </div>
                <div>
                  <span className="form-label">Kontak (HP & Email)</span>
                  <div style={{ fontSize: '0.8125rem' }}>{selectedGuest.phone || '-'} • {selectedGuest.email || '-'}</div>
                </div>
                <div>
                  <span className="form-label">Keperluan Kunjungan</span>
                  <div style={{ fontWeight: 500 }}>{selectedGuest.purpose}</div>
                </div>
                <div>
                  <span className="form-label">Bertemu Dengan</span>
                  <div>{selectedGuest.meeting_with} ({selectedGuest.destination_division})</div>
                </div>
                <div>
                  <span className="form-label">Lantai Tujuan</span>
                  <div style={{ color: '#0284c7', fontWeight: 600 }}>{selectedGuest.destination_floor}</div>
                </div>
                <div>
                  <span className="form-label">Identitas ({selectedGuest.identity_type})</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedGuest.identity_number || '-'}</div>
                </div>
              </div>

              {/* Photos Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <span className="form-label" style={{ marginBottom: 6, display: 'block' }}>Foto KTP / Identitas</span>
                  {selectedGuest.identity_photo_url ? (
                    <div
                      onClick={() => setPhotoModal({ isOpen: true, src: selectedGuest.identity_photo_url, title: `KTP: ${selectedGuest.name}` })}
                      style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', maxHeight: 180, display: 'flex', justifyContent: 'center' }}
                    >
                      <img src={selectedGuest.identity_photo_url} alt="KTP" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 8 }}>
                      Tidak ada foto KTP
                    </div>
                  )}
                </div>

                <div>
                  <span className="form-label" style={{ marginBottom: 6, display: 'block' }}>Foto Wajah / Tamu</span>
                  {selectedGuest.guest_photo_url ? (
                    <div
                      onClick={() => setPhotoModal({ isOpen: true, src: selectedGuest.guest_photo_url, title: `Foto Wajah: ${selectedGuest.name}` })}
                      style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc', maxHeight: 180, display: 'flex', justifyContent: 'center' }}
                    >
                      <img src={selectedGuest.guest_photo_url} alt="Guest" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 8 }}>
                      Tidak ada foto diri tamu
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps audit */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                fontSize: '0.75rem',
              }}>
                <div>
                  <div style={{ color: '#64748b' }}>Waktu Pengisian:</div>
                  <div style={{ fontWeight: 600 }}>{new Date(selectedGuest.submitted_at).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Waktu Diverifikasi:</div>
                  <div style={{ fontWeight: 600 }}>{selectedGuest.verified_at ? new Date(selectedGuest.verified_at).toLocaleString('id-ID') : '-'}</div>
                  {selectedGuest.verified_by_user && <div style={{ color: '#64748b' }}>Oleh: {selectedGuest.verified_by_user.name}</div>}
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Waktu Masuk (Check-In):</div>
                  <div style={{ fontWeight: 600 }}>{selectedGuest.check_in_at ? new Date(selectedGuest.check_in_at).toLocaleString('id-ID') : '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b' }}>Waktu Keluar (Check-Out):</div>
                  <div style={{ fontWeight: 600 }}>{selectedGuest.check_out_at ? new Date(selectedGuest.check_out_at).toLocaleString('id-ID') : '-'}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedGuest(null)} className="btn btn-secondary">
                Tutup
              </button>

              {!isPimpinan && selectedGuest.status === 'Menunggu Verifikasi' && (
                <button
                  onClick={() => { setSelectedGuest(null); handleOpenAction('verify', selectedGuest); }}
                  className="btn btn-success"
                >
                  <CheckCircle size={16} />
                  <span>Verifikasi Tamu</span>
                </button>
              )}

              {!isPimpinan && selectedGuest.status === 'Terverifikasi' && (
                <button
                  onClick={() => { setSelectedGuest(null); handleOpenAction('checkin', selectedGuest); }}
                  className="btn btn-primary"
                >
                  <LogIn size={16} />
                  <span>Check-In Masuk</span>
                </button>
              )}

              {!isPimpinan && selectedGuest.status === 'Sedang Berkunjung' && (
                <button
                  onClick={() => { setSelectedGuest(null); handleOpenAction('checkout', selectedGuest); }}
                  className="btn btn-secondary"
                  style={{ color: '#b45309' }}
                >
                  <LogOut size={16} />
                  <span>Check-Out Keluar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={actionConfirm.isOpen}
        onClose={() => setActionConfirm({ isOpen: false, type: '', guest: null, title: '', message: '' })}
        onConfirm={handleConfirmAction}
        title={actionConfirm.title}
        message={
          <div>
            <p style={{ marginBottom: 14 }}>{actionConfirm.message}</p>
            {(actionConfirm.type === 'verify' || actionConfirm.type === 'checkin') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 8 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <CreditCard size={15} />
                    <span>No. Kartu Akses Fisik (001 - 050):</span>
                  </label>
                  <select
                    className="form-select"
                    value={actionConfirm.cardNumber}
                    onChange={(e) => setActionConfirm(p => ({ ...p, cardNumber: e.target.value }))}
                    style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}
                  >
                    <option value="">-- Pilih No. Kartu Akses (001 - 050) / Kosongkan --</option>
                    {CARD_OPTIONS.map((num) => {
                      const isOccupied = activeCardsData.occupied?.includes(num) && actionConfirm.guest?.card_number !== num;
                      const occupant = activeCardsData.details?.[num];
                      return (
                        <option
                          key={num}
                          value={num}
                          disabled={isOccupied}
                          style={isOccupied ? { color: '#94a3b8', background: '#f1f5f9' } : { color: '#0f172a' }}
                        >
                          {num} {isOccupied ? `(Sedang Dipakai - ${occupant?.name || 'Tamu'})` : ''}
                        </option>
                      );
                    })}
                    {actionConfirm.cardNumber && !CARD_OPTIONS.includes(actionConfirm.cardNumber) && (
                      <option value={actionConfirm.cardNumber}>{actionConfirm.cardNumber}</option>
                    )}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                    *Pilih nomor kartu fisik (001 s.d. 050) yang diserahkan ke tamu saat verifikasi/check-in.
                  </span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      id="dep-confirm-check"
                      checked={actionConfirm.depositId}
                      onChange={(e) => setActionConfirm(p => ({ ...p, depositId: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#059669' }}
                    />
                    <label htmlFor="dep-confirm-check" style={{ fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', color: '#0f172a' }}>
                      Titipkan KTP / ID di Pos Security
                    </label>
                  </div>
                  {actionConfirm.depositId && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nomor loker penitipan / catatan..."
                      value={actionConfirm.notes}
                      onChange={(e) => setActionConfirm(p => ({ ...p, notes: e.target.value }))}
                      style={{ fontSize: '0.8125rem' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        }
        confirmText="Ya, Lanjutkan"
        confirmType={actionConfirm.type === 'delete' ? 'danger' : 'primary'}
        isLoading={actionLoading}
      />

      {/* Zoom Photo Modal */}
      <ImageModal
        isOpen={photoModal.isOpen}
        onClose={() => setPhotoModal({ isOpen: false, src: '', title: '' })}
        src={photoModal.src}
        title={photoModal.title}
      />
    </div>
  );
};

export default GuestList;
