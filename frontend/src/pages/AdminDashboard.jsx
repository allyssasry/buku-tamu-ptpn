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
  Info,
  Building2,
  Layers,
  ChevronRight
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
  const [errorMessage, setErrorMessage] = useState('');
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

  // 19 Official Divisions Matrix filter & search
  const [divisionFilter, setDivisionFilter] = useState('all'); // 'all', 'direksi', 'divisi'
  const [divisionSearch, setDivisionSearch] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.get('/dashboard', { timeout: 30000 });
      setData(res.data);
    } catch (err) {
      console.error("Gagal memuat dashboard admin:", err);
      setErrorMessage(
        err.code === 'ECONNABORTED'
          ? 'Koneksi ke server dashboard melebihi batas waktu (timeout). Silakan klik Coba Lagi.'
          : (err.response?.data?.message || 'Gagal memuat data metrik dashboard dari server.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCardClick = async (type, extraParams = {}) => {
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
      const res = await api.get('/dashboard/drilldown', {
        params: { type, ...extraParams },
        timeout: 30000
      });
      setDrilldownModal({
        isOpen: true,
        loading: false,
        type: res.data.type,
        title: res.data.title,
        subtitle: res.data.subtitle,
        category: res.data.category,
        linkTo: res.data.link_to || res.data.linkTo || '',
        items: res.data.items || [],
        searchQuery: '',
      });
    } catch (err) {
      console.error("Gagal memuat drilldown dashboard:", err);
      setDrilldownModal(prev => ({
        ...prev,
        loading: false,
        title: 'Gagal Memuat Data',
        subtitle: err.code === 'ECONNABORTED'
          ? 'Koneksi ke server melebihi batas waktu (timeout). Silakan coba kembali.'
          : (err.response?.data?.message || 'Terjadi kendala saat mengambil rincian data. Silakan coba kembali.'),
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

  if (!loading && (!data || errorMessage)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 8 }}>
            Gagal Memuat Metrik Dashboard
          </div>
          <p style={{ color: '#7f1d1d', fontSize: '0.875rem', marginBottom: 18, lineHeight: 1.5 }}>
            {errorMessage || 'Tidak dapat terhubung ke server untuk memuat metrik kunjungan dan keamanan.'}
          </p>
          <button className="btn btn-primary" onClick={fetchDashboard} style={{ margin: '0 auto' }}>
            Coba Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const { guest_stats, security_stats, recent_guests, recent_security_logs } = data || {};
  const { key_floors, floor_monitoring, key_divisions, division_monitoring } = guest_stats || {};

  // Other floors calculation (floors other than 11, 15, 16)
  const otherFloorsList = (floor_monitoring || []).filter(f => {
    const fl = (f.floor || '').toLowerCase();
    return !fl.includes('11') && !fl.includes('15') && !fl.includes('16');
  });
  const otherFloorsTotal = otherFloorsList.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const otherFloorsActive = otherFloorsList.reduce((acc, curr) => acc + (curr.currently_in || 0), 0);

  // Filtered 19 Official Divisions
  const filteredDivisions = (division_monitoring || []).filter(div => {
    const isDireksi = Boolean(div.is_direksi || div.division?.startsWith('Direktur'));
    if (divisionFilter === 'direksi' && !isDireksi) return false;
    if (divisionFilter === 'divisi' && isDireksi) return false;
    if (divisionSearch) {
      return (div.division || '').toLowerCase().includes(divisionSearch.toLowerCase().trim());
    }
    return true;
  });

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
        (item.work_order_number && item.work_order_number.toLowerCase().includes(query)) ||
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

      {/* SECTION: MONITORING KUNJUNGAN PER LANTAI (HOLDING TOWER) */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={18} style={{ color: '#0284c7' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.04em' }}>
            Monitoring Kunjungan Per Lantai (Holding Tower)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
          *Klik kotak lantai untuk melihat rekap & rincian daftar tamu
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard
          title="Lantai 11"
          value={key_floors?.floor_11?.total || 0}
          icon={Building2}
          color="sky"
          subtext={`${key_floors?.floor_11?.currently_in || 0} aktif saat ini • ${key_floors?.floor_11?.today || 0} hari ini`}
          onClick={() => handleCardClick('floor_11')}
        />
        <StatCard
          title="Lantai 15 (Direksi)"
          value={key_floors?.floor_15?.total || 0}
          icon={Briefcase}
          color="indigo"
          subtext={`${key_floors?.floor_15?.currently_in || 0} aktif saat ini • ${key_floors?.floor_15?.today || 0} hari ini`}
          onClick={() => handleCardClick('floor_15')}
        />
        <StatCard
          title="Lantai 16 (Rooftop)"
          value={key_floors?.floor_16?.total || 0}
          icon={Building}
          color="amber"
          subtext={`${key_floors?.floor_16?.currently_in || 0} aktif saat ini • ${key_floors?.floor_16?.today || 0} hari ini`}
          onClick={() => handleCardClick('floor_16')}
        />
        <StatCard
          title="Lantai Lainnya"
          value={otherFloorsTotal}
          icon={MapPin}
          color="teal"
          subtext={`${otherFloorsActive} aktif di lantai lainnya`}
          onClick={() => {
            if (otherFloorsList.length > 0) {
              handleCardClick('floor', { floor: otherFloorsList[0].floor });
            } else {
              handleCardClick('currently_in');
            }
          }}
        />
      </div>

      {/* SECTION: MONITORING KUNJUNGAN PER DIVISI & DIREKSI */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={18} style={{ color: '#7c3aed' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#6d28d9', letterSpacing: '0.04em' }}>
            Monitoring Kunjungan Per Divisi & Direksi
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
          *Klik kotak divisi untuk melihat daftar tamu dan agenda rapat
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard
          title="Jajaran Direksi (5 Direktur)"
          value={key_divisions?.direksi?.total || 0}
          icon={Briefcase}
          color="purple"
          subtext={`${key_divisions?.direksi?.currently_in || 0} aktif • ${key_divisions?.direksi?.today || 0} hari ini`}
          onClick={() => handleCardClick('direksi')}
        />
        <StatCard
          title="Divisi Transformasi Digital"
          value={key_divisions?.ti?.total || 0}
          icon={Sparkles}
          color="blue"
          subtext={`${key_divisions?.ti?.currently_in || 0} aktif • ${key_divisions?.ti?.today || 0} hari ini`}
          onClick={() => handleCardClick('division', { division: 'Divisi Transformasi Digital' })}
        />
        <StatCard
          title="Divisi Keuangan Strategis"
          value={key_divisions?.keuangan?.total || 0}
          icon={TrendingUp}
          color="green"
          subtext={`${key_divisions?.keuangan?.currently_in || 0} aktif • ${key_divisions?.keuangan?.today || 0} hari ini`}
          onClick={() => handleCardClick('division', { division: 'Divisi Keuangan Strategis dan Anggaran' })}
        />
        <StatCard
          title="Divisi Pengadaan dan Umum"
          value={key_divisions?.pengadaan?.total || 0}
          icon={Users}
          color="amber"
          subtext={`${key_divisions?.pengadaan?.currently_in || 0} aktif • ${key_divisions?.pengadaan?.today || 0} hari ini`}
          onClick={() => handleCardClick('division', { division: 'Divisi Pengadaan dan Umum' })}
        />
      </div>

      {/* SECTION: REKAPAN KORELASI LANTAI 11, 15, 16 & DIVISI TUJUAN */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.04em' }}>
              Rekapan Kunjungan Lantai 11, 15, 16 & Divisi Tujuan
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Rincian jumlah orang per lantai beserta alokasi divisi yang dikunjungi
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16
        }}>
          {/* Card Rekapan Lantai 11 */}
          <div className="glass-card" style={{ padding: 18, borderTop: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  Lantai 11
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  Area Kantor
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                  {key_floors?.floor_11?.total || 0} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Orang</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                  {key_floors?.floor_11?.currently_in || 0} Sedang di Lantai
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Divisi yang Dikunjungi di Lantai 11:
            </div>
            {key_floors?.floor_11?.divisions && key_floors?.floor_11?.divisions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {key_floors.floor_11.divisions.map((d, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8125rem'
                  }}>
                    <span style={{ fontWeight: 500, color: '#334155' }}>{d.division}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {d.currently_in > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600, background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                          {d.currently_in} aktif
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.total} Tamu</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: 14 }}>
                Belum ada pembagian divisi spesifik untuk lantai ini.
              </div>
            )}

            <button
              onClick={() => handleCardClick('floor_11')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <span>Lihat Rincian Tamu Lantai 11</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card Rekapan Lantai 15 */}
          <div className="glass-card" style={{ padding: 18, borderTop: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#e0e7ff',
                  color: '#4338ca',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  Lantai 15
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  Area Kantor dan Area Direksi
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5' }}>
                  {key_floors?.floor_15?.total || 0} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Orang</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                  {key_floors?.floor_15?.currently_in || 0} Sedang di Lantai
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Divisi yang Dikunjungi di Lantai 15:
            </div>
            {key_floors?.floor_15?.divisions && key_floors?.floor_15?.divisions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {key_floors.floor_15.divisions.map((d, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8125rem'
                  }}>
                    <span style={{ fontWeight: 500, color: '#334155' }}>{d.division}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {d.currently_in > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600, background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                          {d.currently_in} aktif
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.total} Tamu</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: 14 }}>
                Belum ada pembagian divisi spesifik untuk lantai ini.
              </div>
            )}

            <button
              onClick={() => handleCardClick('floor_15')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <span>Lihat Rincian Tamu Lantai 15</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card Rekapan Lantai 16 */}
          <div className="glass-card" style={{ padding: 18, borderTop: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  Lantai 16
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  Area Kantor
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>
                  {key_floors?.floor_16?.total || 0} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Orang</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                  {key_floors?.floor_16?.currently_in || 0} Sedang di Lantai
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Divisi yang Dikunjungi di Lantai 16:
            </div>
            {key_floors?.floor_16?.divisions && key_floors?.floor_16?.divisions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {key_floors.floor_16.divisions.map((d, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8125rem'
                  }}>
                    <span style={{ fontWeight: 500, color: '#334155' }}>{d.division}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {d.currently_in > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600, background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                          {d.currently_in} aktif
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.total} Tamu</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: 14 }}>
                Belum ada pembagian divisi spesifik untuk lantai ini.
              </div>
            )}

            <button
              onClick={() => handleCardClick('floor_16')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <span>Lihat Rincian Tamu Lantai 16</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Tabel Rekapan Seluruh 19 Divisi Resmi & Jajaran Direksi */}
        {division_monitoring && division_monitoring.length > 0 && (
          <div className="glass-card" style={{ marginTop: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Matriks Rekapan 19 Divisi Resmi & Jajaran Direksi</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12 }}>
                    {filteredDivisions.length} Unit Kerja
                  </span>
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Monitoring seluruh 19 divisi & dewan direktur: sebaran lantai, status aktif saat ini, dan akumulasi kunjungan
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
                  <button
                    onClick={() => setDivisionFilter('all')}
                    style={{
                      border: 'none',
                      background: divisionFilter === 'all' ? '#ffffff' : 'transparent',
                      color: divisionFilter === 'all' ? '#0f172a' : '#64748b',
                      fontWeight: divisionFilter === 'all' ? 700 : 500,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      boxShadow: divisionFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Semua (19)
                  </button>
                  <button
                    onClick={() => setDivisionFilter('direksi')}
                    style={{
                      border: 'none',
                      background: divisionFilter === 'direksi' ? '#ffffff' : 'transparent',
                      color: divisionFilter === 'direksi' ? '#7c3aed' : '#64748b',
                      fontWeight: divisionFilter === 'direksi' ? 700 : 500,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      boxShadow: divisionFilter === 'direksi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    👑 Jajaran Direktur (5)
                  </button>
                  <button
                    onClick={() => setDivisionFilter('divisi')}
                    style={{
                      border: 'none',
                      background: divisionFilter === 'divisi' ? '#ffffff' : 'transparent',
                      color: divisionFilter === 'divisi' ? '#0284c7' : '#64748b',
                      fontWeight: divisionFilter === 'divisi' ? 700 : 500,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      boxShadow: divisionFilter === 'divisi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🏢 Divisi & PMO (14)
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Cari nama divisi..."
                    value={divisionSearch}
                    onChange={(e) => setDivisionSearch(e.target.value)}
                    style={{
                      padding: '4px 8px 4px 28px',
                      fontSize: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      outline: 'none',
                      width: 160
                    }}
                  />
                  {divisionSearch && (
                    <button
                      onClick={() => setDivisionSearch('')}
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="table-container" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th>Divisi / Jajaran Direksi</th>
                    <th>Kategori</th>
                    <th>Sebaran Lantai</th>
                    <th>Sedang Aktif</th>
                    <th>Hari Ini</th>
                    <th>Total Tamu</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDivisions.length > 0 ? (
                    filteredDivisions.map((div, idx) => {
                      const isDirektur = Boolean(div.is_direksi || div.division?.startsWith('Direktur'));
                      const isPmo = Boolean(div.division?.startsWith('PMO'));
                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                            {idx + 1}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{div.division}</div>
                          </td>
                          <td>
                            {isDirektur ? (
                              <span style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                background: '#faf5ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe',
                                padding: '1px 6px',
                                borderRadius: 4
                              }}>
                                👑 Direksi
                              </span>
                            ) : isPmo ? (
                              <span style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '1px 6px',
                                borderRadius: 4
                              }}>
                                💼 PMO
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                background: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                padding: '1px 6px',
                                borderRadius: 4
                              }}>
                                🏢 Divisi
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {div.floors && div.floors.length > 0 ? (
                                div.floors.map((fl, fIdx) => (
                                  <span key={fIdx} style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    border: '1px solid #cbd5e1'
                                  }}>
                                    {fl.floor} ({fl.total})
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {div.currently_in > 0 ? (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#059669',
                                background: '#dcfce7',
                                padding: '2px 8px',
                                borderRadius: 6
                              }}>
                                {div.currently_in} Aktif
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>0</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: div.today > 0 ? 700 : 400 }}>
                              {div.today || 0}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                              {div.total}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleCardClick('division', { division: div.division })}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title={`Lihat rincian tamu ${div.division}`}
                            >
                              <Eye size={13} />
                              <span style={{ marginLeft: 4 }}>Lihat</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.8125rem' }}>
                        Tidak ditemukan divisi dengan kata kunci "{divisionSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                          color: g.category === 'magang' ? '#7e22ce' : '#1d4ed8',
                          background: g.category === 'magang' ? '#faf5ff' : '#eff6ff',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: g.category === 'magang' ? '1px solid #d8b4fe' : '1px solid #bfdbfe',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          {g.category === 'magang' ? <GraduationCap size={11} /> : <CreditCard size={11} />}
                          <span>{g.category === 'magang' ? `Magang ${g.card_number}` : `Tamu ${g.card_number}`}</span>
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
                    onClick={() => setDrilldownModal(p => ({ ...p, isOpen: false }))}
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
                                        background: g.category === 'magang' ? '#faf5ff' : (g.category === 'vendor' ? '#fefce8' : '#f0fdf4'),
                                        color: g.category === 'magang' ? '#7c3aed' : (g.category === 'vendor' ? '#a16207' : '#059669'),
                                        border: `1px solid ${g.category === 'magang' ? '#ddd6fe' : (g.category === 'vendor' ? '#fde68a' : '#bbf7d0')}`
                                      }}>
                                        {g.category === 'magang' ? '🎓 Magang / PKL' : (g.category === 'vendor' ? '🔧 Vendor / Kontraktor' : '👤 Tamu Umum')}
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
                {drilldownModal.title === 'Gagal Memuat Data' && (
                  <button
                    type="button"
                    onClick={() => handleCardClick(drilldownModal.type)}
                    className="btn btn-secondary"
                    style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                  >
                    Coba Lagi
                  </button>
                )}
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
                    onClick={() => setDrilldownModal(p => ({ ...p, isOpen: false }))}
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
