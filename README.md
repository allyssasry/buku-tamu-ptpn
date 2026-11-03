# Holding GateKeeper — Guest & Security Monitoring System

Aplikasi web Enterprise **Guest & Security Monitoring System** untuk kebutuhan perusahaan holding, dirancang dengan arsitektur modern:
- **Frontend**: React.js (Vite), React Router, Axios, Recharts, jsPDF, XLSX, Lucide Icons, Vanilla CSS Design System.
- **Backend**: Laravel REST API, Laravel Sanctum (Token Auth), Laravel Storage.
- **Database**: PostgreSQL 18.

---

## 🚀 Status Servis & Port Lokal

| Komponen | Status | Port / URL |
| :--- | :--- | :--- |
| **Frontend React** | Running (Vite) | `http://localhost:5173` |
| **Backend API** | Running (Laravel) | `http://127.0.0.1:8000` |
| **Database** | Running (PostgreSQL 18) | `127.0.0.1:5433` (DB: `buku_tamu`) |

---

## 👥 Akun & Hak Akses (Default Seed)

Pada halaman login (`http://localhost:5173/login`), tersedia tombol **Akses Cepat Demo** untuk berpindah peran:

| Role | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Admin** | `adminptpn@gmail.com` | `adminptpn` | Akses penuh: Dashboard, Semua Tamu, Security Book, Master Area, Manajemen User, Laporan, AI Analysis, Audit Log |
| **Security** | `securityptpn@gmail.com` | `securityptpn` | Operasional: Daftar Tamu Hari Ini, Verifikasi Tamu, Penitipan KTP/ID, Input Patroli Security Book & Foto |
| **Tamu** | *Kiosk Mandiri* | *Tanpa login* | Akses langsung di `http://localhost:5173/guest-form` untuk input buku tamu di lobby |

---

## 🌟 Fitur Utama & Modul

### 1. Modul Buku Tamu (Kiosk Lobby)
- **Halaman**: `http://localhost:5173/guest-form`
- Form sederhana dengan section:
  - *Informasi Tamu*: Nama lengkap (*), Instansi (*), Jabatan, No HP, Email, Alamat.
  - *Informasi Kunjungan*: Keperluan (*), Bertemu dengan (*), Divisi tujuan (*), Lantai tujuan (*), Catatan.
  - *Identitas & Dokumentasi*: Jenis identitas (*), No Identitas (*), Foto KTP/ID (*) via Webcam langsung / Upload, Foto Tamu opsional.
  - *Persetujuan*: Checkbox persetujuan data kunjungan (*).
- **Halaman Konfirmasi**: `http://localhost:5173/guest-success` dengan ringkasan status registrasi.

### 2. Modul Verifikasi & Penitipan KTP/ID (Security)
- Security dapat melihat tamu hari ini, detail data, dan foto KTP.
- Tombol **Verifikasi** sekaligus opsi penitipan KTP/ID (otomatis dicatat nama security, waktu titip, nomor loker).
- Pengembalian ID dengan satu klik tombol **Kembalikan ID** (mencatat waktu pengembalian & security yang menyerahkan).
- Nomor identitas otomatis di-masking (`3171**********01`) untuk perlindungan privasi.

### 3. Modul Security Book (Area Monitoring & Patroli)
- Pengecekan area/lantai gedung (Lobby, Lantai 1, Lantai 2, Lantai 11, Lantai 15, Parkir Basement, Ruang Server, Rooftop).
- Status Kondisi:
  - 🟢 **Aman**: Kondisi normal & terkendali.
  - 🟡 **Perlu Perhatian**: Temuan non-kritis yang perlu atensi.
  - 🔴 **Insiden**: Kejadian yang membutuhkan tindak lanjut segera.
- Dokumentasi foto langsung dari kamera perangkat atau upload file dengan timestamp presisi.

### 4. Modul Dashboard (Admin & Pimpinan)
- Kartu statistik tamu: Hari ini, minggu ini, bulan ini, tamu aktif di gedung, total instansi.
- Kartu statistik security: Pengecekan hari ini, area diperiksa vs belum diperiksa, breakdown status aman/perhatian/insiden.
- Visualisasi grafik:
  - Line Chart: Tren kunjungan 7 hari.
  - Bar Chart: Kunjungan per divisi & kunjungan per lantai.
  - Donut Chart: Komposisi status keamanan patroli.

### 5. Modul Rekap & Laporan
- Filter periode: Hari ini, minggu ini, bulan ini, custom rentang tanggal, filter divisi, lantai, security, status.
- Histogram jam kunjungan paling ramai (07:00 - 18:00).
- **Export Data**:
  - Export ke Microsoft Excel (`.xlsx`)
  - Export ke PDF (`.pdf`) dengan tabel terformat rapi.

### 6. Modul AI Analysis
- Input: Tanggal Mulai dan Tanggal Selesai.
- Analisis statistik murni berbasis data nyata dari PostgreSQL (AI tidak mengarang angka).
- Menghasilkan:
  - Ringkasan Eksekutif Terpadu (Executive Summary).
  - Analisis Tamu: Total kunjungan, tamu unik, instansi, instansi terbanyak, hari paling ramai, jam paling ramai, lantai & divisi terbanyak, tren harian.
  - Analisis Security: Jumlah check, area terpadat, area belum diperiksa, rasio aman/perhatian/insiden.
  - Strategic Insights & Rekomendasi Tindakan Operasional.
  - Tombol Download Laporan AI dalam format PDF.

---

## 🛠️ Perintah Menjalankan Manual (Jika Ingin Dijalankan Ulang)

### 1. Jalankan PostgreSQL
PostgreSQL berjalan pada port `5433` data cluster `C:\Users\Allyssa\pgdata`.

### 2. Jalankan Backend (Laravel)
```bash
cd backend
php artisan serve --port=8000
```

### 3. Jalankan Frontend (React Vite)
```bash
cd frontend
npm run dev
```
Akses di browser: `http://localhost:5173/`
