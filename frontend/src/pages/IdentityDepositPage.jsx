import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Search, RotateCcw, CheckCircle2 } from 'lucide-react';

const IdentityDepositPage = () => {
  const { isPimpinan } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Return dialog
  const [returnConfirm, setReturnConfirm] = useState({
    isOpen: false,
    deposit: null,
    notes: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      };
      const res = await api.get('/identity-deposits', { params });
      setDeposits(res.data.data);
    } catch (err) {
      console.error("Gagal memuat daftar penitipan ID:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter, search]);

  const handleOpenReturn = (deposit) => {
    setReturnConfirm({
      isOpen: true,
      deposit,
      notes: 'ID diserahkan kembali kepada pemilik dalam kondisi utuh.',
    });
  };

  const submitReturn = async () => {
    if (!returnConfirm.deposit) return;
    setActionLoading(true);
    try {
      await api.post(`/identity-deposits/${returnConfirm.deposit.id}/return`, {
        notes: returnConfirm.notes,
      });
      setReturnConfirm({ isOpen: false, deposit: null, notes: '' });
      fetchDeposits();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengembalikan ID.');
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
            Penitipan KTP & Identitas Tamu (Identity Deposit)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Pencatatan Loker Penitipan KTP/SIM/Paspor dan Tracking Pengembalian
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Cari nama tamu, instansi, atau no. ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status ID</option>
              <option value="Dititipkan">Sedang Dititipkan</option>
              <option value="Sudah Dikembalikan">Sudah Dikembalikan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Tamu & Instansi</th>
              <th>Jenis & No. Identitas</th>
              <th>Waktu Diterima</th>
              <th>Security Penerima</th>
              <th>Status ID</th>
              <th>Waktu Dikembalikan</th>
              <th>Security Pengembalian</th>
              <th>Catatan / Loker</th>
              {!isPimpinan && <th style={{ textAlign: 'right' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Memuat data penitipan ID...
                </td>
              </tr>
            ) : deposits.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Tidak ada catatan penitipan identitas saat ini.
                </td>
              </tr>
            ) : (
              deposits.map((dep) => (
                <tr key={dep.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {dep.guest?.name || 'Tamu Terhapus'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {dep.guest?.institution || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{dep.identity_type}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      {dep.masked_identity_number}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {dep.deposited_at ? new Date(dep.deposited_at).toLocaleString('id-ID') : '-'}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {dep.received_by?.name || 'Otomatis (Pos Security)'}
                  </td>
                  <td>
                    <StatusBadge status={dep.status} />
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {dep.returned_at ? new Date(dep.returned_at).toLocaleString('id-ID') : '-'}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {dep.returned_by?.name || '-'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', maxWidth: 180, color: '#475569' }}>
                    {dep.notes || '-'}
                  </td>
                  {!isPimpinan && (
                    <td style={{ textAlign: 'right' }}>
                      {dep.status === 'Dititipkan' ? (
                        <button
                          onClick={() => handleOpenReturn(dep)}
                          className="btn btn-success btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <RotateCcw size={13} />
                          <span>Kembalikan ID</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                          <CheckCircle2 size={13} />
                          <span>Selesai</span>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog for Return */}
      <ConfirmationDialog
        isOpen={returnConfirm.isOpen}
        onClose={() => setReturnConfirm({ isOpen: false, deposit: null, notes: '' })}
        onConfirm={submitReturn}
        title="Kembalikan KTP / ID ke Tamu"
        message={
          <div>
            <p style={{ marginBottom: 12 }}>
              Apakah Anda mengonfirmasi bahwa identitas milik <strong>{returnConfirm.deposit?.guest?.name}</strong> telah diserahkan kembali?
            </p>
            <div className="form-group">
              <label className="form-label">Catatan Pengembalian</label>
              <input
                type="text"
                className="form-input"
                value={returnConfirm.notes}
                onChange={(e) => setReturnConfirm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Kondisi dokumen saat dikembalikan..."
              />
            </div>
          </div>
        }
        confirmText="Konfirmasi Pengembalian ID"
        confirmType="success"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default IdentityDepositPage;
