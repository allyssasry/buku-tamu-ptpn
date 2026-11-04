import React, { useState } from 'react';
import api from '../api/client';
import jsPDF from 'jspdf';
import {
  Sparkles,
  Users,
  ShieldCheck,
  Lightbulb,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const AiAnalysisPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleRunAnalysis = async (e) => {
    e?.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Silakan tentukan tanggal mulai dan tanggal selesai.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/ai/analyze', {
        start_date: startDate,
        end_date: endDate,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menjalankan analisis AI.');
    } finally {
      setLoading(false);
    }
  };

  const exportPdfReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("HOLDING MONITORING SYSTEM - AI ANALYSIS REPORT", 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode Analisis: ${result.period?.start_label} s/d ${result.period?.end_label}`, 14, 28);
    doc.text(`Tanggal Generate: ${new Date().toLocaleString('id-ID')}`, 14, 34);

    doc.setFontSize(12);
    doc.text("1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)", 14, 46);
    doc.setFontSize(9);
    const splitSummary = doc.splitTextToSize(result.narrative?.summary || '', 180);
    doc.text(splitSummary, 14, 54);

    let y = 54 + (splitSummary.length * 5) + 8;

    doc.setFontSize(12);
    doc.text("2. METRIK UTAMA ANALISIS TAMU & KEAMANAN", 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.text(`• Total Kunjungan Tamu: ${result.guest_analysis?.total_visits}`, 14, y); y += 5;
    doc.text(`• Jumlah Instansi Unik: ${result.guest_analysis?.total_institutions} (Terbanyak: ${result.guest_analysis?.top_institution})`, 14, y); y += 5;
    doc.text(`• Hari & Jam Terpadat: Hari ${result.guest_analysis?.busiest_day} (${result.guest_analysis?.busiest_hour})`, 14, y); y += 5;
    doc.text(`• Destinasi Terpadat: ${result.guest_analysis?.top_floor} (${result.guest_analysis?.top_division})`, 14, y); y += 5;
    doc.text(`• Total Security Check: ${result.security_analysis?.total_checks} kali (Aman: ${result.security_analysis?.status_aman}, Perlu Perhatian: ${result.security_analysis?.status_perlu_perhatian}, Insiden: ${result.security_analysis?.status_insiden})`, 14, y); y += 8;

    doc.setFontSize(12);
    doc.text("3. STRATEGIC INSIGHTS", 14, y);
    y += 8;
    doc.setFontSize(9);
    result.narrative?.insights?.forEach(ins => {
      const splitIns = doc.splitTextToSize(`- ${ins}`, 180);
      doc.text(splitIns, 14, y);
      y += (splitIns.length * 5);
    });

    y += 4;
    doc.setFontSize(12);
    doc.text("4. REKOMENDASI TINDAKAN OPERASIONAL", 14, y);
    y += 8;
    doc.setFontSize(9);
    result.narrative?.recommendations?.forEach(rec => {
      const splitRec = doc.splitTextToSize(`- ${rec}`, 180);
      doc.text(splitRec, 14, y);
      y += (splitRec.length * 5);
    });

    doc.save(`AI_Analysis_Report_${startDate}_${endDate}.pdf`);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.625rem', fontWeight: 700, color: '#0f172a' }}>
              AI Intelligence Analysis System
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Analisis Komprehensif Berbasis Data Riil Database Cloud • Executive Insights & Rekomendasi
            </p>
          </div>
        </div>

        {result && (
          <button onClick={exportPdfReport} className="btn btn-secondary btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}>
            <FileText size={16} />
            <span>Download Laporan AI (PDF)</span>
          </button>
        )}
      </div>

      {/* Date Range Selection Box */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>
          Pilih Periode Analisis Data
        </h2>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: '#fef2f2',
            borderRadius: 8,
            color: '#b91c1c',
            fontSize: '0.8125rem',
            marginBottom: 16
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRunAnalysis} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label className="form-label">Tanggal Mulai</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label className="form-label">Tanggal Selesai</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '11px 24px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)'
            }}
            disabled={loading}
          >
            <Sparkles size={18} />
            <span>{loading ? 'Menganalisis Data Cloud...' : 'Jalankan AI Analysis'}</span>
          </button>
        </form>
      </div>

      {/* Analysis Results View */}
      {result && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Executive Summary Narrative Card */}
          <div className="glass-card" style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #bbf7d0',
            boxShadow: '0 4px 15px rgba(5, 150, 105, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Sparkles size={20} style={{ color: '#059669' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#065f46' }}>
                Ringkasan Eksekutif AI ({result.period?.start_label} — {result.period?.end_label})
              </h3>
            </div>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0f172a' }}>
              {result.narrative?.summary}
            </p>
          </div>

          {/* TWO MAIN COLUMNS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, marginBottom: 28 }}>
            {/* Analisis Tamu Box */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <Users size={20} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a' }}>
                  Analisis Data Tamu (Database Cloud)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Kunjungan:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                    {result.guest_analysis?.total_visits} Kunjungan
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jumlah Tamu Unik:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#047857' }}>
                    {result.guest_analysis?.total_guests} Orang
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jumlah Instansi:</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                    {result.guest_analysis?.total_institutions} Mitra
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Instansi Terbanyak:</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {result.guest_analysis?.top_institution} ({result.guest_analysis?.top_institution_count}x)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hari Paling Ramai:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#059669' }}>
                    Hari {result.guest_analysis?.busiest_day} ({result.guest_analysis?.busiest_day_count} kunjungan)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jam Paling Ramai:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#d97706' }}>
                    Pukul {result.guest_analysis?.busiest_hour}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Lantai Terbanyak Dikunjungi:</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0284c7' }}>
                    {result.guest_analysis?.top_floor} ({result.guest_analysis?.top_floor_count}x)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Divisi Terbanyak:</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                    {result.guest_analysis?.top_division} ({result.guest_analysis?.top_division_count}x)
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              {result.guest_analysis?.daily_trend?.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8, fontWeight: 500 }}>
                    Tren Kunjungan Harian Selama Periode Ini:
                  </div>
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer>
                      <LineChart data={result.guest_analysis?.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Analisis Security Box */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <ShieldCheck size={20} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0f172a' }}>
                  Analisis Monitoring Security (Database Cloud)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jumlah Security Check:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                    {result.security_analysis?.total_checks} Kali Patroli
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Area Terbanyak Diperiksa:</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {result.security_analysis?.top_checked_area} ({result.security_analysis?.top_checked_area_count}x)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kondisi Aman:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                    {result.security_analysis?.status_aman} Laporan
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Perlu Perhatian:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>
                    {result.security_analysis?.status_perlu_perhatian} Temuan
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jumlah Insiden:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                    {result.security_analysis?.status_insiden} Kejadian
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Area Belum Diperiksa:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: result.security_analysis?.uninspected_areas_count > 0 ? '#b45309' : '#059669' }}>
                    {result.security_analysis?.uninspected_areas_count} Area
                  </div>
                </div>
              </div>

              {/* Ringkasan Keamanan */}
              <div style={{ marginTop: 18, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                  RINGKASAN INTEGRITAS KEAMANAN GEDUNG:
                </div>
                <div style={{ fontSize: '0.875rem', color: '#0f172a', lineHeight: 1.5 }}>
                  {result.security_analysis?.condition_summary}
                </div>
              </div>
            </div>
          </div>

          {/* INSIGHTS & REKOMENDASI SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
            {/* Insights */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Lightbulb size={20} style={{ color: '#d97706' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#b45309' }}>
                  Strategic Insights
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.narrative?.insights?.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.9375rem', color: '#334155', lineHeight: 1.5 }}>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>•</span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rekomendasi */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle size={20} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#047857' }}>
                  Rekomendasi Tindakan Operasional
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.narrative?.recommendations?.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.9375rem', color: '#334155', lineHeight: 1.5 }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisPage;
