import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import CameraCapture from '../components/CameraCapture';
import ImageModal from '../components/ImageModal';
import {
  ShieldCheck,
  PlusCircle,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  Filter,
  RotateCcw,
  X
} from 'lucide-react';

const SecurityBookPage = () => {
  const { user, isPimpinan, isSecurity } = useAuth();
  const [logs, setLogs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    building_id: '',
    area_id: '',
    status: 'Aman',
    description: '',
    photo: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Image zoom modal
  const [photoModal, setPhotoModal] = useState({ isOpen: false, src: '', title: '' });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        building_id: buildingFilter !== 'all' ? buildingFilter : undefined,
        area_id: areaFilter !== 'all' ? areaFilter : undefined,
        date: dateFilter || undefined,
        search: search || undefined,
      };
      const res = await api.get('/security-logs', { params });
      setLogs(res.data.data);
    } catch (err) {
      console.error("Gagal memuat riwayat security book:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings', { params: { active_only: true } });
      setBuildings(res.data);
      if (res.data.length > 0 && !formData.building_id) {
        setFormData(prev => ({ ...prev, building_id: res.data[0].id }));
      }
    } catch (err) {
      console.error("Gagal memuat daftar gedung:", err);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await api.get('/areas', { params: { active_only: true } });
      setAreas(res.data);
      if (res.data.length > 0 && !formData.area_id) {
        setFormData(prev => ({ ...prev, area_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, buildingFilter, areaFilter, dateFilter, search]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setBuildingFilter('all');
    setAreaFilter('all');
    setDateFilter('');
    setSearch('');
  };

  const isFiltered = statusFilter !== 'all' || buildingFilter !== 'all' || areaFilter !== 'all' || dateFilter !== '' || search !== '';
  const selectedBuilding = buildings.find(b => String(b.id) === String(buildingFilter));
  const filteredAreas = buildingFilter !== 'all'
    ? areas.filter(a => String(a.building_id || a.building?.id) === String(buildingFilter))
    : areas;

  const handleBuildingChange = (selectedBuildingId) => {
    const matchingAreas = selectedBuildingId
      ? areas.filter(a => String(a.building_id || a.building?.id) === String(selectedBuildingId))
      : areas;

    setFormData(prev => ({
      ...prev,
      building_id: selectedBuildingId,
      area_id: matchingAreas[0]?.id || '',
    }));
  };

  const handleOpenCreateModal = () => {
    const defaultBuildingId = formData.building_id || buildings[0]?.id || '';
    const matchingAreas = defaultBuildingId
      ? areas.filter(a => String(a.building_id || a.building?.id) === String(defaultBuildingId))
      : areas;

    setFormData({
      building_id: defaultBuildingId,
      area_id: matchingAreas[0]?.id || areas[0]?.id || '',
      status: 'Aman',
      description: '',
      photo: '',
      notes: '',
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isSecurity) {
      setFormError('Hanya petugas security yang berwenang mencatat pengecekan area.');
      return;
    }

    if (!formData.area_id) return setFormError('Pilih area yang diperiksa.');
    if (!formData.description.trim()) return setFormError('Deskripsi kondisi area wajib diisi.');
    if (!formData.photo) return setFormError('Foto dokumentasi kondisi area wajib diambil / diunggah.');

    setSubmitting(true);
    try {
      await api.post('/security-logs', formData);
      setIsCreateOpen(false);
      setFormData({
        building_id: buildings[0]?.id || '',
        area_id: areas[0]?.id || '',
        status: 'Aman',
        description: '',
        photo: '',
        notes: '',
      });
      fetchLogs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan catatan patroli.');
    } finally {
      setSubmitting(false);
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
            Security Book • Area Monitoring Gedung
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Dokumentasi Kondisi Tiap Lantai, Status Keamanan, dan Timestamp Pemeriksaan
          </p>
        </div>

        {isSecurity && (
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary btn-lg"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <PlusCircle size={18} />
            <span>Catat Pengecekan Area Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: 20 }}>
        {/* Row 1: Search & Reset */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38, paddingRight: search ? 36 : 12 }}
              placeholder="Cari deskripsi patroli, catatan tindak lanjut, security..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4
                }}
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <RotateCcw size={13} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Row 2: Gedung, Area Kerja (disampingnya), Status, Tanggal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          alignItems: 'end'
        }}>
          {/* Dropdown Gedung */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <Building2 size={13} style={{ color: '#059669' }} />
              <span>Gedung</span>
            </label>
            <select
              className="form-select"
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value);
                setAreaFilter('all');
              }}
              style={{
                borderColor: buildingFilter !== 'all' ? '#059669' : undefined,
                background: buildingFilter !== 'all' ? '#f0fdf4' : undefined,
                fontWeight: buildingFilter !== 'all' ? 600 : undefined
              }}
            >
              <option value="all">Semua Gedung</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Area Kerja (Disamping Gedung) */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <MapPin size={13} style={{ color: '#059669' }} />
              <span>Area Kerja</span>
              {buildingFilter !== 'all' && (
                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                  ({selectedBuilding?.name})
                </span>
              )}
            </label>
            <select
              className="form-select"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              style={{
                borderColor: areaFilter !== 'all' ? '#059669' : undefined,
                background: areaFilter !== 'all' ? '#f0fdf4' : undefined,
                fontWeight: areaFilter !== 'all' ? 600 : undefined
              }}
            >
              <option value="all">
                {buildingFilter !== 'all' ? `Semua Area Kerja (${selectedBuilding?.name || 'Gedung'})` : 'Semua Area Kerja'}
              </option>
              {filteredAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {buildingFilter === 'all' && a.building?.name ? `[${a.building.name}] ` : ''}
                  {a.name} ({a.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Status Kondisi */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <Filter size={13} style={{ color: '#64748b' }} />
              <span>Status Kondisi</span>
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                borderColor: statusFilter !== 'all' ? '#059669' : undefined,
                background: statusFilter !== 'all' ? '#f0fdf4' : undefined,
                fontWeight: statusFilter !== 'all' ? 600 : undefined
              }}
            >
              <option value="all">Semua Status Kondisi</option>
              <option value="Aman">Aman</option>
              <option value="Perlu Perhatian">Perlu Perhatian</option>
              <option value="Insiden">Insiden</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <Calendar size={13} style={{ color: '#64748b' }} />
              <span>Tanggal Pemeriksaan</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                borderColor: dateFilter ? '#059669' : undefined,
                background: dateFilter ? '#f0fdf4' : undefined
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Riwayat Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tanggal & Jam</th>
              <th>Petugas Security</th>
              <th>Gedung & Area Kerja</th>
              <th>Status Kondisi</th>
              <th>Deskripsi Pengamatan</th>
              <th>Catatan / Tindak Lanjut</th>
              <th>Dokumentasi Foto</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Memuat data riwayat security book...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Belum ada catatan pengecekan area yang sesuai filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(log.checked_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ color: '#059669', fontWeight: 600 }}>
                      {new Date(log.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {log.security?.name || 'Security'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {log.security?.phone || 'Regu Pengamanan'}
                    </div>
                  </td>
                  <td>
                    {/* Gedung Badge */}
                    <div style={{ marginBottom: 4 }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        color: log.area?.building?.name === 'Graha Nusa Tiga' ? '#1e40af' : '#065f46',
                        background: log.area?.building?.name === 'Graha Nusa Tiga' ? '#eff6ff' : '#ecfdf5',
                        border: `1px solid ${log.area?.building?.name === 'Graha Nusa Tiga' ? '#bfdbfe' : '#a7f3d0'}`,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Building2 size={11} />
                        <span>{log.area?.building?.name || 'Graha Nusa Tiga'}</span>
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.area?.name || 'Area Kerja'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {log.area?.floor}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td style={{ maxWidth: 260, fontSize: '0.875rem' }}>
                    {log.description}
                  </td>
                  <td style={{ maxWidth: 200, fontSize: '0.8125rem', color: '#475569' }}>
                    {log.notes || '-'}
                  </td>
                  <td>
                    {log.photo_url ? (
                      <div
                        onClick={() => setPhotoModal({
                          isOpen: true,
                          src: log.photo_url,
                          title: `Inspeksi ${log.area?.name} (${log.status}) - ${new Date(log.checked_at).toLocaleString('id-ID')}`
                        })}
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          background: '#ecfdf5',
                          borderRadius: 6,
                          border: '1px solid #a7f3d0',
                          fontSize: '0.75rem',
                          color: '#047857',
                          fontWeight: 500
                        }}
                      >
                        <Eye size={13} />
                        <span>Lihat Foto</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL INPUT FORM SECURITY BOOK */}
      {isCreateOpen && isSecurity && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Form Security Book / Monitoring Area</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Pemeriksa: {user?.name} (Shift Sekarang)
                  </div>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#b91c1c',
                    fontSize: '0.8125rem',
                    marginBottom: 16
                  }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Pilih Gedung */}
                <div className="form-group">
                  <label className="form-label">Gedung yang Diperiksa <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.building_id}
                    onChange={(e) => handleBuildingChange(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pilih Area Kerja */}
                <div className="form-group">
                  <label className="form-label">Area Kerja yang Diperiksa <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.area_id}
                    onChange={(e) => setFormData(p => ({ ...p, area_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Pilih Area Kerja Gedung --</option>
                    {(formData.building_id
                      ? areas.filter(a => String(a.building_id || a.building?.id) === String(formData.building_id))
                      : areas
                    ).map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.floor})</option>
                    ))}
                  </select>
                  {formData.building_id && areas.filter(a => String(a.building_id || a.building?.id) === String(formData.building_id)).length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#d97706', marginTop: 4, display: 'block' }}>
                      ⚠️ Belum ada checkpoint area yang terdaftar untuk gedung ini di Master Area.
                    </span>
                  )}
                </div>

                {/* Status Kondisi Radio Badges */}
                <div className="form-group">
                  <label className="form-label">Status Kondisi Keamanan <span className="required">*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div
                      onClick={() => setFormData(p => ({ ...p, status: 'Aman' }))}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: formData.status === 'Aman' ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: formData.status === 'Aman' ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.875rem' }}>Aman</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 4 }}>
                        Kondisi normal & terkendali
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData(p => ({ ...p, status: 'Perlu Perhatian' }))}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: formData.status === 'Perlu Perhatian' ? '2px solid #d97706' : '1px solid #cbd5e1',
                        background: formData.status === 'Perlu Perhatian' ? '#fffbeb' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#d97706', fontSize: '0.875rem' }}>Perlu Perhatian</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 4 }}>
                        Temuan non-kritis perlu atensi
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData(p => ({ ...p, status: 'Insiden' }))}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: formData.status === 'Insiden' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        background: formData.status === 'Insiden' ? '#fef2f2' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem' }}>Insiden</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 4 }}>
                        Kejadian darurat / butuh tindakan
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="form-group">
                  <label className="form-label">Deskripsi Pengamatan Kondisi <span className="required">*</span></label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Contoh: Area lantai 15 dalam kondisi aman dan tidak ditemukan kendala. Pintu darurat dan akses terkunci baik."
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    required
                  />
                </div>

                {/* Foto Kondisi Kamera / Upload */}
                <CameraCapture
                  label="Foto Dokumentasi Kondisi Lapangan"
                  required={true}
                  value={formData.photo}
                  onChange={(p) => setFormData(prev => ({ ...prev, photo: p }))}
                  placeholderText="Ambil foto kondisi area langsung dengan kamera atau upload file"
                />

                {/* Catatan / Tindak Lanjut */}
                <div className="form-group">
                  <label className="form-label">Catatan Tambahan / Tindak Lanjut (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Telah dikoordinasikan dengan teknisi building management..."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Menyimpan...' : 'Simpan Catatan Patroli'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      <ImageModal
        isOpen={photoModal.isOpen}
        onClose={() => setPhotoModal({ isOpen: false, src: '', title: '' })}
        src={photoModal.src}
        title={photoModal.title}
      />
    </div>
  );
};

export default SecurityBookPage;
