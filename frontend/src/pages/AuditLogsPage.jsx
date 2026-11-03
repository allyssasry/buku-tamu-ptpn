import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { History, Shield, Clock, Search, Terminal } from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.625rem', fontWeight: 700, color: '#0f172a' }}>
          Audit Log Aktivitas Sistem
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Pencatatan Jejak Digital dan Kepatuhan Keamanan Operasional Holding
        </p>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Waktu Audit</th>
              <th>Pengguna</th>
              <th>Modul</th>
              <th>Aksi</th>
              <th>Deskripsi Aktivitas</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Memuat audit log...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Belum ada log aktivitas tercatat.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(log.created_at).toLocaleDateString('id-ID')}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleTimeString('id-ID')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.user?.name || 'Sistem / Anonim'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.user?.role || 'Guest'}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {log.module}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.75rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: 4 }}>
                      {log.action}
                    </code>
                  </td>
                  <td style={{ maxWidth: 360, fontSize: '0.8125rem' }}>{log.description}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
