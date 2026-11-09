import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ImageModal from '../components/ImageModal';
import {
  Users,
  Building,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Sparkles,
  BarChart2,
  Eye,
  Calendar,
  GraduationCap,
  CreditCard,
  Search,
  X,
  ExternalLink,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('');

  // Interactive Drilldown Modal state
  const [drilldownModal, setDrilldownModal] = useState({
    isOpen: false,
    loading: false,
    type: '',
    title: '',
    subtitle: '',
    category: '',
    linkTo: '',
    items: [],
    searchQuery: '',
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error("Gagal memuat dashboard admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCardClick = async (type) => {
    setDrilldownModal({
      isOpen: true,
      loading: true,
      type,
      title: 'Memuat Rincian Data...',
      subtitle: 'Mengambil data dari server...',
      category: '',
      linkTo: '',
      items: [],
      searchQuery: '',
    });

    try {
      const res = await api.get('/dashboard/drilldown', { params: { type } });
      setDrilldownModal({
        isOpen: true,
        loading: false,
        type: res.data.type,
        title: res.data.title,
        subtitle: res.data.subtitle,
        category: res.data.category,
        linkTo: res.data.link_to,
        items: res.data.items || [],
        searchQuery: '',
      });
    } catch (err) {
      console.error("Gagal memuat drilldown dashboard:", err);
      setDrilldownModal(prev => ({
        ...prev,
        loading: false,
        title: 'Gagal Memuat Data',
        subtitle: 'Terjadi kendala saat mengambil rincian data. Silakan coba kembali.',
      }));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Memuat Metrik Dashboard Perusahaan...
      </div>
    );
  }

  const { guest_stats, security_stats, recent_guests, recent_security_logs } = data || {};

  const SECURITY_PIE_COLORS = ['#059669', '#d97706', '#dc2626'];
  const securityPieData = [
    { name: 'Aman', value: security_stats?.total_aman || 0 },
    { name: 'Perlu Perhatian', value: security_stats?.total_perlu_perhatian || 0 },
    { name: 'Insiden', value: security_stats?.total_insiden || 0 },
  ];

  // Filtering for Drilldown Modal
  const filteredDrilldownItems = (drilldownModal.items || []).filter(item => {
    const query = drilldownModal.searchQuery.toLowerCase().trim();
    if (!query) return true;

    if (drilldownModal.category === 'guest') {
      return (
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.institution && item.institution.toLowerCase().includes(query)) ||
        (item.purpose && item.purpose.toLowerCase().includes(query)) ||
        (item.meeting_with && item.meeting_with.toLowerCase().includes(query)) ||
        (item.destination_division && item.destination_division.toLowerCase().includes(query)) ||
        (item.destination_floor && item.destination_floor.toLowerCase().includes(query)) ||
        (item.card_number && item.card_number.toLowerCase().includes(query)) ||
        (item.status && item.status.toLowerCase().includes(query))
      );
    }

    if (drilldownModal.category === 'institution') {
      return item.institution && item.institution.toLowerCase().includes(query);
    }

    if (drilldownModal.category === 'security') {
      return (
        (item.area?.name && item.area.name.toLowerCase().includes(query)) ||
        (item.area?.floor && item.area.floor.toLowerCase().includes(query)) ||
        (item.security?.name && item.security.name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.notes && item.notes.toLowerCase().includes(query)) ||
        (item.status && item.status.toLowerCase().includes(query))
      );
    }

    if (drilldownModal.category === 'area_checked' || drilldownModal.category === 'area_unchecked') {
      return (
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.floor && item.floor.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.security_name && item.security_name.toLowerCase().includes(query)) ||
        (item.latest_status && item.latest_status.toLowerCase().includes(query))
      );
    }

    return true;
  });

  return (
    <div>
      {/* Top Header */}
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
            Executive Monitoring Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Holding Security & Corporate Visitor Intelligence
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/ai-analysis" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Sparkles size={16} />
            <span>AI Analysis Insights</span>
          </Link>
          <Link to="/reports" className="btn btn-secondary">
            <BarChart2 size={16} />
            <span>Laporan Lengkap</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: STATISTIK TAMU */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} style={{ color: '#059669' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em' }}>
            Statistik Buku Tamu
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
          *Klik setiap kotak untuk melihat daftar data lengkap
        </span>
      </div>

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
          subtext="Registrasi kunjungan hari ini"
          onClick={() => handleCardClick('today_guests')}
        />
        <StatCard
          title="Anak Magang / PKL"
          value={guest_stats?.total_magang_month || 0}
          icon={GraduationCap}
          color="purple"
          subtext={`${guest_stats?.magang_currently_in || 0} magang aktif saat ini`}
          onClick={() => handleCardClick('magang')}
        />
        <StatCard
          title="Tamu Bulan Ini"
          value={guest_stats?.this_month || 0}
          icon={Calendar}
          color="blue"
          subtext="Akumulasi bulan berjalan"
          onClick={() => handleCardClick('month_guests')}
        />
        <StatCard
          title="Sedang di Gedung"
          value={guest_stats?.currently_in || 0}
          icon={ShieldCheck}
          color="green"
          subtext="Pengunjung aktif di area"
          onClick={() => handleCardClick('currently_in')}
        />
      </div>

      {/* SECTION 2: STATISTIK SECURITY */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} style={{ color: '#059669' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em' }}>
            Statistik Monitoring Keamanan (Security Book)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
          *Klik setiap kotak untuk melihat rincian patroli & inspeksi
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <StatCard
          title="Pengecekan Hari Ini"
          value={security_stats?.checks_today || 0}
          icon={ShieldCheck}
          color="blue"
          subtext="Total patroli tercatat"
          onClick={() => handleCardClick('checks_today')}
        />
        <StatCard
          title="Area Sudah Diperiksa"
          value={security_stats?.checked_areas_count || 0}
          icon={Building}
          color="green"
          subtext={`Dari ${security_stats?.total_areas || 0} area terdaftar`}
          onClick={() => handleCardClick('checked_areas')}
        />
        <StatCard
          title="Area Belum Diperiksa"
          value={security_stats?.unchecked_areas_count || 0}
          icon={AlertTriangle}
          color="amber"
          subtext="Perlu pengecekan shift ini"
          onClick={() => handleCardClick('unchecked_areas')}
        />
        <StatCard
          title="Status Aman (All-time)"
          value={security_stats?.total_aman || 0}
          icon={ShieldCheck}
          color="green"
          subtext="Inspeksi tanpa temuan masalah"
          onClick={() => handleCardClick('all_aman')}
        />
        <StatCard
          title="Perlu Perhatian"
          value={security_stats?.total_perlu_perhatian || 0}
          icon={AlertTriangle}
          color="amber"
          subtext="Temuan non-kritis"
          onClick={() => handleCardClick('perlu_perhatian')}
        />
        <StatCard
          title="Insiden Keamanan"
          value={security_stats?.total_insiden || 0}
          icon={AlertCircle}
          color="red"
          subtext="Insiden membutuhkan tindak lanjut"
          onClick={() => handleCardClick('insiden')}
        />
      </div>

      {/* CHARTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Trend 7 Hari (Line Chart) */}
        <div className="glass-card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Tren Kunjungan Tamu (7 Hari Terakhir)
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Fluktuasi kedatangan tamu harian ke gedung holding
            </p>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={guest_stats?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Jumlah Pengunjung"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Distribution (Pie Chart) */}
        <div className="glass-card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Status Keamanan Patroli (All-Time)
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Komposisi hasil inspeksi area oleh tim security
            </p>
          </div>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={securityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {securityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECURITY_PIE_COLORS[index % SECURITY_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {securityPieData.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: SECURITY_PIE_COLORS[idx] }} />
                  <div style={{ fontSize: '0.8125rem' }}>
                    <div style={{ color: '#64748b' }}>{item.name}</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.value} Inspeksi</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY GRIDS (Floor & Division Distribution) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Lantai Tujuan (Bar Chart) */}
        <div className="glass-card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Distribusi Kunjungan Berdasarkan Lantai
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Konsentrasi area tujuan tamu di gedung holding
            </p>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={guest_stats?.by_floor || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="floor" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Jumlah Tamu" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Divisi Tujuan (Bar Chart) */}
        <div className="glass-card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Divisi Paling Sering Dikunjungi
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Unit kerja penerima kunjungan terbanyak
            </p>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={(guest_stats?.by_division || []).slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <YAxis
                  dataKey="division"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={150}
                  tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 18)}...` : val}
                />
                <Tooltip />
                <Bar dataKey="count" name="Jumlah Tamu" fill="#047857" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES (Split Table View) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
        {/* Recent Guests */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Registrasi Tamu Terkini
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                5 data kedatangan tamu & magang terbaru
              </p>
            </div>
            <Link to="/guests" className="btn btn-secondary btn-sm">
              Semua Tamu
            </Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tamu / Kategori</th>
                  <th>Instansi & Tujuan</th>
                  <th>No. Kartu</th>
                  <th>Status</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {recent_guests?.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: g.category === 'magang' ? '#faf5ff' : '#f0fdf4',
                          color: g.category === 'magang' ? '#7c3aed' : '#059669',
                          border: `1px solid ${g.category === 'magang' ? '#ddd6fe' : '#bbf7d0'}`
                        }}>
                          {g.category === 'magang' ? '🎓 Magang' : '👤 Tamu'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{g.institution}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.destination_division}</div>
                    </td>
                    <td>
                      {g.card_number ? (
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#1d4ed8',
                          background: '#eff6ff',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid #bfdbfe',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <CreditCard size={11} />
                          <span>{g.card_number}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={g.status} />
                      {g.status === 'Sudah Keluar' && (g.check_out_at || g.updated_at) && (
                        <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 3, fontWeight: 600 }}>
                          Keluar: {new Date(g.check_out_at || g.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      )}
                      {g.status === 'Sedang Berkunjung' && g.check_in_at && (
                        <div style={{ fontSize: '0.6875rem', color: '#0284c7', marginTop: 3, fontWeight: 500 }}>
                          Masuk: {new Date(g.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      )}
                    </td>
                    <td>
                      {g.guest_photo_url || g.identity_photo_url ? (
                        <button
                          onClick={() => {
                            setSelectedPhoto(g.guest_photo_url || g.identity_photo_url);
                            setPhotoTitle(`Foto Tamu: ${g.name} (${g.institution})`);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} />
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Security Logs */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Log Patroli Keamanan Terkini
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                5 riwayat inspeksi ruangan & lantai terbaru
              </p>
            </div>
            <Link to="/security-book" className="btn btn-secondary btn-sm">
              Security Book
            </Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Foto</th>
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

      {/* ============================================================== */}
      {/* INTERACTIVE DRILLDOWN MODAL (KETIKA KOTAK STATISTIK DI-KLIK) */}
      {/* ============================================================== */}
      {drilldownModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDrilldownModal(p => ({ ...p, isOpen: false }))}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 1040,
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ background: '#f8fafc', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  flexShrink: 0
                }}>
                  <BarChart2 size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {drilldownModal.title}
                    </h2>
                    {!drilldownModal.loading && (
                      <span style={{
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 9px',
                        borderRadius: 12
                      }}>
                        {drilldownModal.items.length} Data
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    {drilldownModal.subtitle}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {drilldownModal.linkTo && (
                  <Link
                    to={drilldownModal.linkTo}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
                  >
                    <span>Buka Halaman Lengkap</span>
                    <ExternalLink size={14} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setDrilldownModal(p => ({ ...p, isOpen: false }))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', borderRadius: 8 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {drilldownModal.loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>
                    Memuat Rincian Data...
                  </div>
                  <p style={{ fontSize: '0.875rem' }}>Mengambil informasi data secara real-time dari database holding.</p>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 18,
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ketik kata kunci untuk mencari dalam tabel ini..."
                        value={drilldownModal.searchQuery}
                        onChange={(e) => setDrilldownModal(p => ({ ...p, searchQuery: e.target.value }))}
                        style={{ paddingLeft: 38, background: '#ffffff', fontSize: '0.875rem' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      Menampilkan <strong>{filteredDrilldownItems.length}</strong> dari <strong>{drilldownModal.items.length}</strong> entri
                    </div>
                  </div>

                  {filteredDrilldownItems.length === 0 ? (
                    <div style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px dashed #cbd5e1',
                      color: '#64748b'
                    }}>
                      <Info size={32} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        Tidak Ada Data
                      </div>
                      <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                        {drilldownModal.searchQuery
                          ? 'Tidak ditemukan data yang cocok dengan pencarian kata kunci.'
                          : 'Belum ada data tercatat untuk metrik kotak ini.'}
                      </p>
                    </div>
                  ) : (
                    <div className="table-container" style={{ maxHeight: '52vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        {/* 1. GUEST DRILLDOWN TABLE */}
                        {drilldownModal.category === 'guest' && (
                          <>
                            <thead>
                              <tr>
                                <th style={{ width: 55 }}>Foto</th>
                                <th>Nama & Kategori</th>
                                <th>Instansi / Kampus</th>
                                <th>Tujuan & Lantai</th>
                                <th>No. Kartu</th>
                                <th>Waktu Datang</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDrilldownItems.map(g => (
                                <tr key={g.id}>
                                  <td>
                                    {g.guest_photo_url || g.identity_photo_url ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedPhoto(g.guest_photo_url || g.identity_photo_url);
                                          setPhotoTitle(`Foto Tamu: ${g.name}`);
                                        }}
                                        style={{
                                          width: 38,
                                          height: 38,
                                          borderRadius: 8,
                                          overflow: 'hidden',
                                          border: '1px solid #e2e8f0',
                                          padding: 0,
                                          cursor: 'pointer',
                                          display: 'block'
                                        }}
                                        title="Klik untuk memperbesar foto tamu"
                                      >
                                        <img src={g.guest_photo_url || g.identity_photo_url} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </button>
                                    ) : (
                                      <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <Users size={18} />
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                      <span style={{
                                        fontSize: '0.6875rem',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        background: g.category === 'magang' ? '#faf5ff' : '#f0fdf4',
                                        color: g.category === 'magang' ? '#7c3aed' : '#059669',
                                        border: `1px solid ${g.category === 'magang' ? '#ddd6fe' : '#bbf7d0'}`
                                      }}>
                                        {g.category === 'magang' ? '🎓 Magang / PKL' : '👤 Tamu Umum'}
                                      </span>
                                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.identity_type}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{g.institution}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Keperluan: {g.purpose}</div>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{g.destination_division}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{g.destination_floor}</div>
                                  </td>
                                  <td>
                                    {g.card_number ? (
                                      <span style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        fontSize: '0.8125rem',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        border: '1px solid #bfdbfe',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        <CreditCard size={12} />
                                        <span>{g.card_number}</span>
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>-</span>
                                    )}
                                  </td>
                                  <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                    <div>{new Date(g.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{new Date(g.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                                  </td>
                                  <td>
                                    <StatusBadge status={g.status} />
                                    {g.status === 'Sudah Keluar' && (g.check_out_at || g.updated_at) && (
                                      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 3, fontWeight: 600 }}>
                                        Keluar: {new Date(g.check_out_at || g.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                      </div>
                                    )}
                                    {g.status === 'Sedang Berkunjung' && g.check_in_at && (
                                      <div style={{ fontSize: '0.6875rem', color: '#0284c7', marginTop: 3, fontWeight: 500 }}>
                                        Masuk: {new Date(g.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {/* 2. INSTITUTION DRILLDOWN TABLE */}
                        {drilldownModal.category === 'institution' && (
                          <>
                            <thead>
                              <tr>
                                <th style={{ width: 50 }}>No</th>
                                <th>Nama Instansi / Universitas / Perusahaan</th>
                                <th>Total Kunjungan</th>
                                <th>Kunjungan Magang</th>
                                <th>Sedang di Gedung</th>
                                <th>Kunjungan Terakhir</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDrilldownItems.map((inst, idx) => (
                                <tr key={inst.institution}>
                                  <td style={{ fontWeight: 700, color: '#94a3b8' }}>{idx + 1}</td>
                                  <td>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>{inst.institution}</div>
                                  </td>
                                  <td>
                                    <span style={{
                                      background: '#f0fdf4',
                                      color: '#166534',
                                      border: '1px solid #bbf7d0',
                                      fontWeight: 700,
                                      padding: '3px 10px',
                                      borderRadius: 8,
                                      fontSize: '0.8125rem'
                                    }}>
                                      {inst.total_visits} Kunjungan
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{
                                      background: inst.magang_visits > 0 ? '#faf5ff' : '#f8fafc',
                                      color: inst.magang_visits > 0 ? '#7c3aed' : '#94a3b8',
                                      fontWeight: 600,
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                      fontSize: '0.8125rem'
                                    }}>
                                      {inst.magang_visits || 0} Magang
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{
                                      background: inst.currently_in > 0 ? '#ecfdf5' : '#f8fafc',
                                      color: inst.currently_in > 0 ? '#059669' : '#94a3b8',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                      fontSize: '0.8125rem'
                                    }}>
                                      {inst.currently_in || 0} Sedang Aktif
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                    {inst.last_visit ? new Date(inst.last_visit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {/* 3. SECURITY PATROL LOGS DRILLDOWN TABLE */}
                        {drilldownModal.category === 'security' && (
                          <>
                            <thead>
                              <tr>
                                <th style={{ width: 55 }}>Foto</th>
                                <th>Area & Lantai</th>
                                <th>Petugas Security</th>
                                <th>Waktu Patroli</th>
                                <th>Status Kondisi</th>
                                <th>Deskripsi / Temuan Masalah</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDrilldownItems.map(l => (
                                <tr key={l.id}>
                                  <td>
                                    {l.photo_url ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedPhoto(l.photo_url);
                                          setPhotoTitle(`Inspeksi Area: ${l.area?.name} (${l.status})`);
                                        }}
                                        style={{
                                          width: 38,
                                          height: 38,
                                          borderRadius: 8,
                                          overflow: 'hidden',
                                          border: '1px solid #e2e8f0',
                                          padding: 0,
                                          cursor: 'pointer',
                                          display: 'block'
                                        }}
                                        title="Klik untuk memperbesar foto inspeksi"
                                      >
                                        <img src={l.photo_url} alt={l.area?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </button>
                                    ) : (
                                      <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <Building size={18} />
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{l.area?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{l.area?.floor}</div>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{l.security?.name || '-'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Petugas Patroli</div>
                                  </td>
                                  <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                    <div>{new Date(l.checked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{new Date(l.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                                  </td>
                                  <td>
                                    <StatusBadge status={l.status} />
                                  </td>
                                  <td>
                                    <div style={{ fontSize: '0.8125rem', color: '#1e293b' }}>{l.description}</div>
                                    {l.notes && <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>Catatan: {l.notes}</div>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {/* 4. AREA SUDAH DIPERIKSA HARI INI */}
                        {drilldownModal.category === 'area_checked' && (
                          <>
                            <thead>
                              <tr>
                                <th style={{ width: 55 }}>Foto</th>
                                <th>Nama Area Gedung</th>
                                <th>Lantai</th>
                                <th>Status Pengecekan</th>
                                <th>Petugas Pemeriksa</th>
                                <th>Waktu Pengecekan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDrilldownItems.map(a => (
                                <tr key={a.id}>
                                  <td>
                                    {a.photo_url ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedPhoto(a.photo_url);
                                          setPhotoTitle(`Inspeksi Area: ${a.name} (${a.latest_status})`);
                                        }}
                                        style={{
                                          width: 38,
                                          height: 38,
                                          borderRadius: 8,
                                          overflow: 'hidden',
                                          border: '1px solid #e2e8f0',
                                          padding: 0,
                                          cursor: 'pointer',
                                          display: 'block'
                                        }}
                                        title="Klik untuk memperbesar foto inspeksi"
                                      >
                                        <img src={a.photo_url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </button>
                                    ) : (
                                      <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <Building size={18} />
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.description}</div>
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 600, color: '#059669', fontSize: '0.8125rem' }}>{a.floor}</span>
                                  </td>
                                  <td>
                                    <StatusBadge status={a.latest_status} />
                                  </td>
                                  <td style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {a.security_name}
                                  </td>
                                  <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                    {a.checked_at ? new Date(a.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}

                        {/* 5. AREA BELUM DIPERIKSA HARI INI */}
                        {drilldownModal.category === 'area_unchecked' && (
                          <>
                            <thead>
                              <tr>
                                <th style={{ width: 50 }}>No</th>
                                <th>Nama Area Gedung</th>
                                <th>Lantai</th>
                                <th>Deskripsi Area</th>
                                <th>Status Shift</th>
                                <th>Tindakan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDrilldownItems.map((a, idx) => (
                                <tr key={a.id}>
                                  <td style={{ fontWeight: 700, color: '#94a3b8' }}>{idx + 1}</td>
                                  <td>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.name}</div>
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 600, color: '#059669', fontSize: '0.8125rem' }}>{a.floor}</span>
                                  </td>
                                  <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                    {a.description || '-'}
                                  </td>
                                  <td>
                                    <span style={{
                                      background: '#fffbeb',
                                      color: '#b45309',
                                      border: '1px solid #fde68a',
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      padding: '3px 8px',
                                      borderRadius: 6,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}>
                                      ⚠️ Belum Diperiksa
                                    </span>
                                  </td>
                                  <td>
                                    <Link
                                      to="/security-book"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <span>Lihat Security Book</span>
                                      <ArrowRight size={12} />
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                💡 Klik foto untuk melihat dokumen identitas atau foto patroli dalam ukuran besar.
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDrilldownModal(p => ({ ...p, isOpen: false }))}
                  className="btn btn-secondary"
                >
                  Tutup
                </button>
                {drilldownModal.linkTo && (
                  <Link
                    to={drilldownModal.linkTo}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Buka Halaman Lengkap</span>
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
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

export default AdminDashboard;
