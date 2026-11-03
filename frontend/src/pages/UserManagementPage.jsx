import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { UserCog, Plus, Edit2, Trash2, Shield, Search, User, Mail, Phone, Lock } from 'lucide-react';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'security',
    phone: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      };
      const res = await api.get('/users', { params });
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'security', phone: '', password: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      password: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteDialog.user.id}`);
      setDeleteDialog({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus user.');
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
            Manajemen Pengguna & Otoritas Sistem
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Kelola akses dan hak istimewa akun Admin, Security, Pimpinan, dan Kiosk Tamu
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filter */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Cari nama, email, atau no. telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Peran (Role)</option>
              <option value="admin">Admin</option>
              <option value="security">Security</option>
              <option value="pimpinan">Pimpinan</option>
              <option value="tamu">Tamu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Email Akun</th>
              <th>Peran / Role</th>
              <th>No. Telepon</th>
              <th>Dibuat Pada</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Memuat data pengguna...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: u.role === 'admin' ? '#fef2f2' : u.role === 'pimpinan' ? '#f5f3ff' : u.role === 'security' ? '#ecfdf5' : '#f1f5f9',
                      color: u.role === 'admin' ? '#b91c1c' : u.role === 'pimpinan' ? '#6d28d9' : u.role === 'security' ? '#047857' : '#475569',
                      border: u.role === 'admin' ? '1px solid #fecaca' : u.role === 'pimpinan' ? '1px solid #ddd6fe' : u.role === 'security' ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{u.phone || '-'}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, user: u })}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px', color: '#dc2626' }}
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
                {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
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
                  <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Login <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Peran (Role) Akses <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                    required
                  >
                    <option value="admin">Admin (Akses Penuh)</option>
                    <option value="security">Security (Operasional & Patroli)</option>
                    <option value="pimpinan">Pimpinan (Monitoring Read-Only)</option>
                    <option value="tamu">Tamu (Kiosk Form)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Kata Sandi {editingUser ? '(Kosongkan jika tidak diubah)' : <span className="required">*</span>}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimal 6 karakter..."
                    value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Akun Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun user "${deleteDialog.user?.name}" (${deleteDialog.user?.email})?`}
        confirmType="danger"
        confirmText="Hapus Akun"
        isLoading={deleting}
      />
    </div>
  );
};

export default UserManagementPage;
