import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ImageModal from '../components/ImageModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  FileText,
  Users,
  ShieldCheck,
  Clock,
  Eye,
  AlertTriangle,
  GraduationCap,
  CreditCard
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('guests');
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'tamu', 'magang'

  const [guestReport, setGuestReport] = useState(null);
  const [securityReport, setSecurityReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [photoModal, setPhotoModal] = useState({ isOpen: false, src: '', title: '' });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        period,
        start_date: period === 'custom' ? startDate : undefined,
        end_date: period === 'custom' ? endDate : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      };

      if (activeTab === 'guests') {
        const res = await api.get('/reports/guests', { params });
        setGuestReport(res.data);
      } else {
        const res = await api.get('/reports/security', { params });
        setSecurityReport(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat rekap laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, period, startDate, endDate, statusFilter, categoryFilter]);

  const exportGuestsExcel = () => {
    if (!guestReport?.data) return;
    const excelRows = guestReport.data.map((g) => ({
      'ID Registrasi': g.id,
      'Waktu Pengisian': new Date(g.submitted_at).toLocaleString('id-ID'),
      'Kategori': g.category === 'magang' ? 'Anak Magang / PKL' : 'Tamu Umum',
      'Nama Pengunjung': g.name,
      'Instansi / Kampus': g.institution,
      'No. Kartu Akses': g.card_number || '-',
      'Jabatan / Jurusan': g.position || '-',
      'Nomor HP': g.phone || '-',
      'Keperluan': g.purpose,
      'Bertemu': g.meeting_with,
      'Divisi': g.destination_division,
      'Lantai': g.destination_floor,
      'Jenis Identitas': g.identity_type,
      'Nomor Identitas': g.identity_number,
      'Status': g.status,
      'Waktu Check-In': g.check_in_at ? new Date(g.check_in_at).toLocaleString('id-ID') : '-',
      'Waktu Check-Out': g.check_out_at ? new Date(g.check_out_at).toLocaleString('id-ID') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Tamu & Magang");
    XLSX.writeFile(wb, `Laporan_Rekap_Tamu_Magang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportGuestsPDF = () => {
    if (!guestReport?.data) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("HOLDING MONITORING SYSTEM - REKAP LAPORAN BUKU TAMU & MAGANG", 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${period} | Kategori: ${categoryFilter} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const headers = [["No", "Waktu", "Kategori", "Nama Pengunjung", "Instansi / Kampus", "No. Kartu", "Tujuan", "Lantai", "Status"]];
    const data = guestReport.data.map((g, i) => [
      i + 1,
      new Date(g.submitted_at).toLocaleString('id-ID'),
      g.category === 'magang' ? 'Magang' : 'Tamu',
      g.name,
      g.institution,
      g.card_number || '-',
      `${g.meeting_with} (${g.destination_division})`,
      g.destination_floor,
      g.status === 'Sudah Keluar' && (g.check_out_at || g.updated_at)
        ? `Sudah Keluar (${new Date(g.check_out_at || g.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)`
        : g.status,
    ]);

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Laporan_Buku_Tamu_Magang_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportSecurityExcel = () => {
    if (!securityReport?.data) return;
    const excelRows = securityReport.data.map((l) => ({
      'ID Log': l.id,
      'Tanggal & Jam': new Date(l.checked_at).toLocaleString('id-ID'),
      'Petugas Security': l.security?.name || '-',
      'Area': l.area?.name || '-',
      'Lantai': l.area?.floor || '-',
      'Status Kondisi': l.status,
      'Deskripsi': l.description,
      'Catatan': l.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Security Book");
    XLSX.writeFile(wb, `Laporan_Security_Book_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportSecurityPDF = () => {
    if (!securityReport?.data) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("HOLDING MONITORING SYSTEM - REKAP SECURITY BOOK & PATROLI", 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${period} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const headers = [["No", "Waktu Inspeksi", "Petugas", "Area / Lantai", "Status", "Deskripsi Pengamatan", "Tindak Lanjut"]];
    const data = securityReport.data.map((l, i) => [
      i + 1,
      new Date(l.checked_at).toLocaleString('id-ID'),
      l.security?.name || '-',
      `${l.area?.name} (${l.area?.floor})`,
      l.status,
      l.description,
      l.notes || '-',
    ]);

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(`Laporan_Security_Book_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div>
      {/* Header */}
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
            Rekap Data & Laporan Holding
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Rekap Harian, Mingguan, Bulanan Kunjungan Tamu dan Patroli Keamanan
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={activeTab === 'guests' ? exportGuestsExcel : exportSecurityExcel}
            className="btn btn-secondary btn-sm"
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={activeTab === 'guests' ? exportGuestsPDF : exportSecurityPDF}
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
          >
            <FileText size={16} />
            <span>Export PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('guests')}
          className={`btn ${activeTab === 'guests' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={16} />
          <span>Rekap Data Tamu</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ShieldCheck size={16} />
          <span>Rekap Security Book</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <select
              className="form-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="today">Hari Ini</option>
              <option value="this_week">Minggu Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="custom">Pilih Rentang Tanggal</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: 160 }}
              />
              <span style={{ color: '#64748b' }}>s/d</span>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: 160 }}
              />
            </>
          )}

          {activeTab === 'guests' && (
            <div>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  minWidth: 160,
                  fontWeight: 600,
                  color: categoryFilter === 'magang' ? '#7e22ce' : (categoryFilter === 'tamu' ? '#047857' : undefined),
                  background: categoryFilter === 'magang' ? '#faf5ff' : (categoryFilter === 'tamu' ? '#f0fdf4' : undefined)
                }}
              >
                <option value="all">Semua Kategori (Tamu & Magang)</option>
                <option value="tamu">👤 Tamu Umum</option>
                <option value="magang">🎓 Anak Magang / PKL</option>
              </select>
            </div>
          )}

          <div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="all">Semua Status</option>
              {activeTab === 'guests' ? (
                <>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Terverifikasi">Terverifikasi</option>
                  <option value="Sedang Berkunjung">Sedang Berkunjung</option>
                  <option value="Sudah Keluar">Sudah Keluar</option>
                </>
              ) : (
                <>
                  <option value="Aman">Aman</option>
                  <option value="Perlu Perhatian">Perlu Perhatian</option>
                  <option value="Insiden">Insiden</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: REKAP TAMU */}
      {activeTab === 'guests' && guestReport && (
        <div>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Kunjungan</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb' }}>{guestReport.summary?.total_visits || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Pada periode terpilih</div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Anak Magang / PKL</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7e22ce' }}>{guestReport.summary?.total_magang || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Siswa / Mahasiswa PKL</div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tamu Umum</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857' }}>{guestReport.summary?.total_tamu || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Dinas, vendor & mitra</div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Aktif di Gedung</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>{guestReport.summary?.currently_in || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Sedang berkunjung aktif</div>
            </div>

          </div>

          {/* Jam Kunjungan Paling Ramai Chart */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={18} style={{ color: '#059669' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Jam Kunjungan Paling Ramai (Histogram Kedatangan Tamu & Magang)
              </h3>
            </div>
            <div style={{ width: '100%', height: 230 }}>
              <ResponsiveContainer>
                <BarChart data={guestReport.peak_hours || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="count" name="Jumlah Kedatangan" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Waktu</th>
                  <th>Kategori</th>
                  <th>Nama Pengunjung</th>
                  <th>Instansi / Kampus</th>
                  <th>No. Kartu</th>
                  <th>Bertemu / Divisi</th>
                  <th>Lantai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {guestReport.data?.map((g, idx) => (
                  <tr key={g.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(g.submitted_at).toLocaleString('id-ID')}</td>
                    <td>
                      {g.category === 'magang' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 7px',
                          borderRadius: 5,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#f3e8ff',
                          color: '#7e22ce',
                          border: '1px solid #d8b4fe'
                        }}>
                          <GraduationCap size={12} />
                          <span>Magang</span>
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 7px',
                          borderRadius: 5,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#f0fdf4',
                          color: '#047857',
                          border: '1px solid #a7f3d0'
                        }}>
                          <span>Tamu</span>
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{g.name}</td>
                    <td>{g.institution}</td>
                    <td>
                      {g.card_number ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 4,
                          color: '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          fontFamily: 'monospace'
                        }}>
                          <CreditCard size={11} />
                          <span>{g.card_number}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                    <td>{g.meeting_with} ({g.destination_division})</td>
                    <td>{g.destination_floor}</td>
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
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REKAP SECURITY */}
      {activeTab === 'security' && securityReport && (
        <div>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Pengecekan</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb' }}>{securityReport.summary?.total_checks || 0}</div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Kondisi Aman</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>{securityReport.summary?.status_aman || 0}</div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Perlu Perhatian</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706' }}>{securityReport.summary?.status_perlu_perhatian || 0}</div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Insiden Tercatat</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626' }}>{securityReport.summary?.status_insiden || 0}</div>
            </div>
          </div>

          {/* Area Belum Diperiksa Alert */}
          {securityReport.uninspected_areas?.length > 0 && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#b45309', fontSize: '0.875rem' }}>
                  {securityReport.uninspected_areas.length} Area Belum Diperiksa pada Periode Ini:
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 2 }}>
                  {securityReport.uninspected_areas.map(a => `${a.name} (${a.floor})`).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Security Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Waktu</th>
                  <th>Petugas Security</th>
                  <th>Area / Lantai</th>
                  <th>Status</th>
                  <th>Deskripsi</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {securityReport.data?.map((l, idx) => (
                  <tr key={l.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(l.checked_at).toLocaleString('id-ID')}</td>
                    <td>{l.security?.name}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.area?.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: '0.6875rem', color: '#1e40af', background: '#eff6ff', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                          {l.area?.building?.name || 'Graha Nusa Tiga'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.area?.floor}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={l.status} /></td>
                    <td style={{ maxWidth: 280 }}>{l.description}</td>
                    <td>
                      {l.photo_url ? (
                        <button
                          onClick={() => setPhotoModal({ isOpen: true, src: l.photo_url, title: `Patroli: ${l.area?.name}` })}
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
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={photoModal.isOpen}
        onClose={() => setPhotoModal({ isOpen: false, src: '', title: '' })}
        src={photoModal.src}
        title={photoModal.title}
      />
    </div>
  );
};

export default ReportsPage;
