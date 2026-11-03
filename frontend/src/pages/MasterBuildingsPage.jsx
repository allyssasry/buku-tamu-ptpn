import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Layers, MapPin } from 'lucide-react';

const MasterBuildingsPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    description: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, building: null });
  const [deleting, setDeleting] = useState(false);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/buildings', { params: { search: search || undefined } });
      setBuildings(res.data);
    } catch (err) {
      console.error('Gagal mengambil data gedung:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingBuilding(null);
    setFormData({ name: '', code: '', address: '', description: '', active: true });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBuilding(b);
    setFormData({
      name: b.name,
      code: b.code || '',
      address: b.address || '',
      description: b.description || '',
      active: b.active,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingBuilding) {
        await api.put(`/buildings/${editingBuilding.id}`, formData);
      } else {
        await api.post('/buildings', formData);
      }
      setIsModalOpen(false);
      fetchBuildings();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data gedung.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.building) return;
    setDeleting(true);
    try {
      await api.delete(`/buildings/${deleteDialog.building.id}`);
      setDeleteDialog({ isOpen: false, building: null });
      fetchBuildings();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus gedung.');
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
            Master Data Gedung
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Daftar kompleks gedung perkantoran, holding, dan fasilitas penunjang
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          <span>Tambah Gedung Baru</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 38 }}
            placeholder="Cari nama gedung, kode, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>No</th>
              <th>Nama Gedung</th>
              <th>Kode</th>
              <th>Alamat / Lokasi</th>
              <th>Deskripsi</th>
              <th>Total Area</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Memuat data gedung...
                </td>
              </tr>
            ) : buildings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Belum ada data gedung yang terdaftar.
                </td>
              </tr>
            ) : (
              buildings.map((b, idx) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Building2 size={18} />
                      </div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.name}</div>
                    </div>
                  </td>
                  <td>
                    {b.code ? (
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '2px 8px',
                        borderRadius: 4
                      }}>
                        {b.code}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {b.address || '-'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: 260 }}>
                    {b.description || '-'}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: 6
                    }}>
                      <Layers size={12} />
                      <span>{b.areas_count || 0} Area</span>
                    </span>
                  </td>
                  <td>
                    {b.active ? (
                      <span className="badge badge-aman" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="badge badge-insiden" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={12} /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="Edit Data Gedung"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, building: b })}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="Hapus Gedung"
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

      {/* Modal Add / Edit Gedung */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                  {editingBuilding ? 'Edit Data Gedung' : 'Tambah Gedung Baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && (
                  <div style={{
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#b91c1c',
                    fontSize: '0.8125rem',
                    marginBottom: 16
                  }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nama Gedung <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Gedung Holding PTPN"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kode Gedung (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: GD-HOLDING, ANNEX-1"
                    value={formData.code}
                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat / Lokasi Gedung (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Sayap Barat Kompleks Kantor Pusat"
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Fasilitas / Fungsi (Opsional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Catatan tambahan seputar fungsi gedung atau peruntukan"
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <input
                    type="checkbox"
                    id="building-active-check"
                    checked={formData.active}
                    onChange={(e) => setFormData(p => ({ ...p, active: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <label htmlFor="building-active-check" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: '#0f172a' }}>
                    Gedung Aktif Digunakan (Dapat dipilih pada patroli & area)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Gedung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, building: null })}
        onConfirm={handleDelete}
        title="Hapus Data Gedung"
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.building?.name}"? Area yang terkait dengan gedung ini akan dilepaskan keterikatannya.`}
        confirmText="Hapus Gedung"
        confirmType="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default MasterBuildingsPage;
