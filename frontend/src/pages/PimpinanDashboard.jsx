import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ImageModal from '../components/ImageModal';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  Sparkles,
  BarChart3,
  Eye,
  FileCheck2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const PimpinanDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error("Gagal memuat dashboard pimpinan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Memuat Dashboard Eksekutif Monitoring Pimpinan...
      </div>
    );
  }

  const { guest_stats, security_stats, recent_guests, recent_security_logs } = data || {};

  return (
    <div>
      {/* Executive Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 20, fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginBottom: 8 }}>
            <FileCheck2 size={13} />
            <span>Executive Read-Only Monitoring View</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.625rem', fontWeight: 700, color: '#0f172a' }}>
            Portal Pemantauan Direksi & Pimpinan Holding
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#475569' }}>
            Pantau arus tamu VIP/korporasi, kondisi keamanan tiap lantai, dan ringkasan kepatuhan protokol gedung.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/ai-analysis" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Sparkles size={16} />
            <span>Buka Analisis AI</span>
          </Link>
          <Link to="/reports" className="btn btn-secondary">
            <BarChart3 size={16} />
            <span>Rekap & Laporan</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard
          title="Tamu Hari Ini"
          value={guest_stats?.today || 0}
          icon={Users}
          color="blue"
          subtext="Kedatangan hari ini"
        />
        <StatCard
          title="Tamu Sedang di Gedung"
          value={guest_stats?.currently_in || 0}
          icon={Clock}
          color="green"
          subtext="Pengunjung aktif di area"
        />
        <StatCard
          title="Total Instansi Mitra"
          value={guest_stats?.total_institutions || 0}
          icon={Briefcase}
          color="purple"
          subtext="Perusahaan / stakeholder"
        />
        <StatCard
          title="Patroli Shift Hari Ini"
          value={security_stats?.checks_today || 0}
          icon={ShieldCheck}
          color="blue"
          subtext={`${security_stats?.checked_areas_count || 0} area diperiksa`}
        />
        <StatCard
          title="Status Perlu Perhatian"
          value={security_stats?.total_perlu_perhatian || 0}
          icon={AlertTriangle}
          color="amber"
          subtext="Temuan kondisi lapangan"
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
            Tren Kunjungan 7 Hari Terakhir
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={guest_stats?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={3} dot={{ fill: '#059669', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
            Lantai dengan Kunjungan Terbanyak
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={guest_stats?.by_floor || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="floor" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables View for Pimpinan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
        {/* Tamu */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Monitoring Tamu Terkini
            </h3>
            <Link to="/guests" className="btn btn-outline btn-sm">Buku Tamu</Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Tamu</th>
                  <th>Instansi</th>
                  <th>Tujuan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_guests?.map((g) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600 }}>{g.name}</td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{g.institution}</td>
                    <td>{g.destination_floor}</td>
                    <td>
                      <StatusBadge status={g.status} />
                      {g.status === 'Sudah Keluar' && (g.check_out_at || g.updated_at) && (
                        <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 3, fontWeight: 600 }}>
                          Keluar: {new Date(g.check_out_at || g.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Patrol Photos */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Inspeksi Keamanan Gedung
            </h3>
            <Link to="/security-book" className="btn btn-outline btn-sm">Security Book</Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Area / Lantai</th>
                  <th>Status</th>
                  <th>Dokumentasi</th>
                </tr>
              </thead>
              <tbody>
                {recent_security_logs?.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {new Date(l.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{l.area?.name}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      {l.photo_url ? (
                        <button
                          onClick={() => {
                            setSelectedPhoto(l.photo_url);
                            setPhotoTitle(`Inspeksi Area: ${l.area?.name} (${l.status})`);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} />
                          <span>Foto</span>
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ImageModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        src={selectedPhoto}
        title={photoTitle}
      />
    </div>
  );
};

export default PimpinanDashboard;
