import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Building, Building2, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search } from 'lucide-react';

const MasterAreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    building_id: '',
    name: '',
    floor: '',
    description: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, area: null });
  const [deleting, setDeleting] = useState(false);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings', { params: { active_only: true } });
      setBuildings(res.data);
    } catch (err) {
      console.error('Gagal mengambil daftar gedung:', err);
    }
  };

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        building_id: buildingFilter !== 'all' ? buildingFilter : undefined,
      };
      const res = await api.get('/areas', { params });
      setAreas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [search, buildingFilter]);

  const handleOpenAdd = () => {
    setEditingArea(null);
    setFormData({
      building_id: buildings[0]?.id || '',
      name: '',
      floor: '',
      description: '',
      active: true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (area) => {
    setEditingArea(area);
    setFormData({
      building_id: area.building_id || area.building?.id || '',
      name: area.name,
      floor: area.floor,
      description: area.description || '',
      active: area.active,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingArea) {
        await api.put(`/areas/${editingArea.id}`, formData);
      } else {
        await api.post('/areas', formData);
      }
      setIsModalOpen(false);
      fetchAreas();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data area.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.area) return;
    setDeleting(true);
    try {
      await api.delete(`/areas/${deleteDialog.area.id}`);
      setDeleteDialog({ isOpen: false, area: null });
      fetchAreas();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus area.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
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
            Master Data Area & Lantai Gedung
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Daftar checkpoint monitoring dan destinasi kunjungan tamu perusahaan holding
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          <span>Tambah Area Baru</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Cari nama area, lantai, gedung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              className="form-select"
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
            >
              <option value="all">Semua Gedung</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>No</th>
              <th>Nama Area / Ruangan</th>
              <th>Gedung</th>
              <th>Lantai</th>
              <th>Deskripsi / Fungsi</th>
              <th>Status Aktif</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Memuat master area...
                </td>
              </tr>
            ) : areas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Belum ada area gedung yang terdaftar.
                </td>
              </tr>
            ) : (
              areas.map((area, idx) => (
                <tr key={area.id}>
                  <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{area.name}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: '#1e40af',
                      background: '#eff6ff',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      <Building2 size={13} style={{ color: '#2563eb' }} />
                      <span>{area.building?.name || 'Graha Nusa Tiga'}</span>
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>{area.floor}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#475569' }}>{area.description || '-'}</td>
                  <td>
                    {area.active ? (
                      <span className="badge badge-aman">Aktif</span>
                    ) : (
                      <span className="badge badge-selesai">Non-aktif</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(area)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px' }}
                        title="Edit Area"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, area })}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px', color: '#dc2626' }}
                        title="Hapus Area"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {editingArea ? 'Edit Area Monitoring' : 'Tambah Area Monitoring Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#b91c1c', fontSize: '0.8125rem', marginBottom: 14 }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Gedung <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.building_id}
                    onChange={(e) => setFormData(p => ({ ...p, building_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Area / Ruangan <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Lantai 15 - Executive Boardroom"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tingkat Lantai <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Lantai 15"
                    value={formData.floor}
                    onChange={(e) => setFormData(p => ({ ...p, floor: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi / Peruntukan</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Keterangan fungsi ruangan atau pintu akses..."
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <input
                    type="checkbox"
                    id="area-active-check"
                    checked={formData.active}
                    onChange={(e) => setFormData(p => ({ ...p, active: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <label htmlFor="area-active-check" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                    Status Aktif (Ditampilkan pada formulir patroli & tamu)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Data Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, area: null })}
        onConfirm={handleDelete}
        title="Hapus Area Monitoring"
        message={`Apakah Anda yakin ingin menghapus area "${deleteDialog.area?.name}"?`}
        confirmType="danger"
        confirmText="Hapus Permanen"
        isLoading={deleting}
      />
    </div>
  );
};

export default MasterAreasPage;
