<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Area;
use App\Models\Guest;
use App\Models\IdentityDeposit;
use App\Models\SecurityLog;
use App\Models\AuditLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Ensure storage folders exist
        Storage::disk('public')->makeDirectory('identities');
        Storage::disk('public')->makeDirectory('guests');
        Storage::disk('public')->makeDirectory('security_checks');

        // Helper to generate a clean sample SVG/image if not present
        $createSampleImage = function ($path, $text, $bgColor = '#1e293b', $textColor = '#38bdf8') {
            $fullPath = storage_path('app/public/' . $path);
            if (!file_exists($fullPath)) {
                $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
                    <rect width="600" height="400" fill="' . $bgColor . '"/>
                    <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="' . $textColor . '" stroke-width="2" stroke-dasharray="8 4"/>
                    <circle cx="300" cy="160" r="45" fill="' . $textColor . '" opacity="0.2"/>
                    <text x="300" y="168" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="' . $textColor . '" text-anchor="middle">HOLDING MONITORING</text>
                    <text x="300" y="220" font-family="Arial, sans-serif" font-size="18" fill="#e2e8f0" text-anchor="middle">' . htmlspecialchars($text) . '</text>
                    <text x="300" y="250" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Dokumentasi Terverifikasi Otomatis</text>
                </svg>';
                file_put_contents($fullPath, $svg);
            }
        };

        $createSampleImage('identities/sample_ktp_1.svg', 'KTP REPUBLIK INDONESIA - BUDI SANTOSO', '#0f172a', '#3b82f6');
        $createSampleImage('identities/sample_ktp_2.svg', 'KTP REPUBLIK INDONESIA - SITI RAHMAWATI', '#0f172a', '#10b981');
        $createSampleImage('identities/sample_ktp_3.svg', 'PASSPORT - MICHAEL CHEN', '#0f172a', '#f59e0b');
        $createSampleImage('security_checks/lobby_aman.svg', 'INSPEKSI LOBBY UTAMA - STATUS AMAN', '#064e3b', '#34d399');
        $createSampleImage('security_checks/lantai15_aman.svg', 'INSPEKSI LANTAI 15 DIREKSI - STATUS AMAN', '#064e3b', '#34d399');
        $createSampleImage('security_checks/lantai2_perhatian.svg', 'LANTAI 2 - KABEL LOOSE PERLU PERHATIAN', '#78350f', '#fbbf24');
        $createSampleImage('security_checks/server_insiden.svg', 'RUANG SERVER - ALARM PINTU SEMPAT TERBUKA', '#7f1d1d', '#f87171');

        // 2. Seed Users
        $admin = User::firstOrCreate(
            ['email' => 'adminptpn@gmail.com'],
            [
                'name' => 'Super Administrator',
                'role' => 'admin',
                'phone' => '081234567890',
                'password' => Hash::make('adminptpn'),
            ]
        );

        $sec1 = User::firstOrCreate(
            ['email' => 'securityptpn@gmail.com'],
            [
                'name' => 'Security Officer',
                'role' => 'security',
                'phone' => '081234567891',
                'password' => Hash::make('securityptpn'),
            ]
        );

        // 3. Seed Areas
        $areasData = [
            ['name' => 'Lobby Utama & Receptionist', 'floor' => 'Lantai Dasar (GF)', 'description' => 'Area pintu masuk tamu dan checkpoint security utama'],
            ['name' => 'Lantai 1 - Kantor Operasional', 'floor' => 'Lantai 1', 'description' => 'Divisi Operasional & Customer Support'],
            ['name' => 'Lantai 2 - Divisi Keuangan & Legal', 'floor' => 'Lantai 2', 'description' => 'Ruang Akuntansi, Pajak, dan Legal Corporate'],
            ['name' => 'Lantai 3 - Data Center & IT Infrastructure', 'floor' => 'Lantai 3', 'description' => 'Ruang server utama berpendingin khusus dengan akses kartu RFID'],
            ['name' => 'Lantai 11 - Divisi Human Capital & Pengadaan', 'floor' => 'Lantai 11', 'description' => 'Ruang HRD, Training Center, dan Procurement'],
            ['name' => 'Lantai 15 - Executive Boardroom & Direksi', 'floor' => 'Lantai 15', 'description' => 'Ruang Dewan Komisaris, Direksi Utama, & VVIP Lounge'],
            ['name' => 'Area Parkir VIP & Basement 1', 'floor' => 'Basement 1', 'description' => 'Akses parkir tamu VIP dan gate logistik'],
            ['name' => 'Rooftop & Fasilitas Helipad', 'floor' => 'Lantai 16 (Rooftop)', 'description' => 'Area genset cadangan, panel chiller, dan helipad'],
        ];

        $areas = [];
        foreach ($areasData as $item) {
            $areas[] = Area::firstOrCreate(['name' => $item['name']], array_merge($item, ['active' => true]));
        }

        // 4. Seed Realistic Guests
        $now = Carbon::now();
        $sampleGuests = [
            [
                'name' => 'Ir. Bambang Trihatmodjo',
                'institution' => 'PT Pertamina (Persero)',
                'position' => 'Senior Vice President Supply Chain',
                'phone' => '08119876543',
                'email' => 'bambang.t@pertamina.com',
                'purpose' => 'Rapat Evaluasi Kerjasama Pengadaan Energi',
                'meeting_with' => 'Direktur Operasional',
                'destination_division' => 'Direksi',
                'destination_floor' => 'Lantai 15',
                'identity_type' => 'KTP',
                'identity_number' => '3171012304850001',
                'identity_photo' => 'identities/sample_ktp_1.svg',
                'status' => 'Sedang Berkunjung',
                'submitted_at' => $now->copy()->subHours(2),
                'verified_at' => $now->copy()->subHours(2)->addMinutes(5),
                'check_in_at' => $now->copy()->subHours(2)->addMinutes(10),
                'check_out_at' => null,
                'verified_by' => $sec1->id,
            ],
            [
                'name' => 'Siti Rahmawati, M.Sc',
                'institution' => 'Kementerian Keuangan RI',
                'position' => 'Auditor Utama',
                'phone' => '081287654321',
                'email' => 'siti.rahmawati@kemenkeu.go.id',
                'purpose' => 'Audit Kepatuhan Pajak & Rekonsiliasi Fiskal',
                'meeting_with' => 'Kepala Divisi Keuangan',
                'destination_division' => 'Keuangan',
                'destination_floor' => 'Lantai 2',
                'identity_type' => 'KTP',
                'identity_number' => '3273055509900004',
                'identity_photo' => 'identities/sample_ktp_2.svg',
                'status' => 'Sedang Berkunjung',
                'submitted_at' => $now->copy()->subHours(3),
                'verified_at' => $now->copy()->subHours(3)->addMinutes(4),
                'check_in_at' => $now->copy()->subHours(3)->addMinutes(8),
                'check_out_at' => null,
                'verified_by' => $sec1->id,
            ],
            [
                'name' => 'Michael Chen',
                'institution' => 'Oracle Indonesia',
                'position' => 'Principal Enterprise Architect',
                'phone' => '081377889900',
                'email' => 'michael.chen@oracle.com',
                'purpose' => 'Maintenance Core Cloud Database & Disaster Recovery Test',
                'meeting_with' => 'Head of IT & Security',
                'destination_division' => 'IT Infrastructure',
                'destination_floor' => 'Lantai 3',
                'identity_type' => 'Passport',
                'identity_number' => 'E98124451',
                'identity_photo' => 'identities/sample_ktp_3.svg',
                'status' => 'Sudah Keluar',
                'submitted_at' => $now->copy()->subHours(6),
                'verified_at' => $now->copy()->subHours(6)->addMinutes(5),
                'check_in_at' => $now->copy()->subHours(6)->addMinutes(12),
                'check_out_at' => $now->copy()->subHours(1),
                'verified_by' => $sec1->id,
                'checked_out_by' => $sec1->id,
            ],
            [
                'name' => 'Ahmad Fauzan Nugroho',
                'institution' => 'PT Telekomunikasi Selular (Telkomsel)',
                'position' => 'Account Manager Corporate',
                'phone' => '081122334455',
                'email' => 'ahmad.fauzan@telkomsel.co.id',
                'purpose' => 'Presentasi Solusi IoT & Private Network',
                'meeting_with' => 'Divisi Pengadaan & IT',
                'destination_division' => 'IT Infrastructure',
                'destination_floor' => 'Lantai 11',
                'identity_type' => 'KTP',
                'identity_number' => '3174091508880003',
                'identity_photo' => 'identities/sample_ktp_1.svg',
                'status' => 'Sudah Keluar',
                'submitted_at' => $now->copy()->subDays(1)->setHour(10)->setMinute(15),
                'verified_at' => $now->copy()->subDays(1)->setHour(10)->setMinute(20),
                'check_in_at' => $now->copy()->subDays(1)->setHour(10)->setMinute(25),
                'check_out_at' => $now->copy()->subDays(1)->setHour(12)->setMinute(30),
                'verified_by' => $sec1->id,
                'checked_out_by' => $sec1->id,
            ],
            [
                'name' => 'Dewi Sartika, S.H.',
                'institution' => 'Kantor Hukum HHP Law Firm',
                'position' => 'Senior Legal Counsel',
                'phone' => '081299887766',
                'email' => 'dewi.sartika@bakermckenzie.com',
                'purpose' => 'Konsultasi Perjanjian Kerjasama Holding & Akuisisi',
                'meeting_with' => 'Corporate Secretary & Head of Legal',
                'destination_division' => 'Legal',
                'destination_floor' => 'Lantai 2',
                'identity_type' => 'KTP',
                'identity_number' => '3172084501920002',
                'identity_photo' => 'identities/sample_ktp_2.svg',
                'status' => 'Sudah Keluar',
                'submitted_at' => $now->copy()->subDays(2)->setHour(13)->setMinute(45),
                'verified_at' => $now->copy()->subDays(2)->setHour(13)->setMinute(50),
                'check_in_at' => $now->copy()->subDays(2)->setHour(13)->setMinute(55),
                'check_out_at' => $now->copy()->subDays(2)->setHour(16)->setMinute(10),
                'verified_by' => $sec1->id,
                'checked_out_by' => $sec1->id,
            ],
            [
                'name' => 'Hendra Setiawan',
                'institution' => 'Schneider Electric Indonesia',
                'position' => 'Field Service Engineer',
                'phone' => '081809112233',
                'email' => 'hendra.setiawan@se.com',
                'purpose' => 'Pemeriksaan Rutin UPS & Panel Daya Genset',
                'meeting_with' => 'Building Management',
                'destination_division' => 'Operasional',
                'destination_floor' => 'Lantai 16 (Rooftop)',
                'identity_type' => 'KTP',
                'identity_number' => '3276012005870005',
                'identity_photo' => 'identities/sample_ktp_1.svg',
                'status' => 'Terverifikasi',
                'submitted_at' => $now->copy()->subMinutes(45),
                'verified_at' => $now->copy()->subMinutes(30),
                'check_in_at' => null,
                'check_out_at' => null,
                'verified_by' => $sec1->id,
            ],
            [
                'name' => 'Rina Marlina, S.Psi',
                'institution' => 'Kandidat Head of Human Capital',
                'position' => 'Kandidat',
                'phone' => '081311224466',
                'email' => 'rina.marlina@gmail.com',
                'purpose' => 'Wawancara Direksi Tahap Akhir',
                'meeting_with' => 'Direktur Operasional & HC Manager',
                'destination_division' => 'Human Capital',
                'destination_floor' => 'Lantai 11',
                'identity_type' => 'KTP',
                'identity_number' => '3175066010940008',
                'identity_photo' => 'identities/sample_ktp_2.svg',
                'status' => 'Menunggu Verifikasi',
                'submitted_at' => $now->copy()->subMinutes(12),
                'verified_at' => null,
                'check_in_at' => null,
                'check_out_at' => null,
            ],
            [
                'name' => 'Doni Kusuma',
                'institution' => 'PT Sucofindo (Persero)',
                'position' => 'Lead Inspector K3',
                'phone' => '081566778899',
                'email' => 'doni.k@sucofindo.co.id',
                'purpose' => 'Inspeksi Berkala Sertifikasi Keselamatan Kerja Gedung',
                'meeting_with' => 'Kepala K3 & Security',
                'destination_division' => 'Operasional',
                'destination_floor' => 'Lantai 1',
                'identity_type' => 'SIM',
                'identity_number' => '940312001922',
                'identity_photo' => 'identities/sample_ktp_1.svg',
                'status' => 'Sudah Keluar',
                'submitted_at' => $now->copy()->subDays(3)->setHour(9)->setMinute(10),
                'verified_at' => $now->copy()->subDays(3)->setHour(9)->setMinute(15),
                'check_in_at' => $now->copy()->subDays(3)->setHour(9)->setMinute(20),
                'check_out_at' => $now->copy()->subDays(3)->setHour(14)->setMinute(00),
                'verified_by' => $sec1->id,
                'checked_out_by' => $sec1->id,
            ]
        ];

        foreach ($sampleGuests as $gData) {
            $guest = Guest::create(array_merge($gData, [
                'consent' => true,
            ]));

            // Seed Identity Deposit if guest is visiting or checked out
            if (in_array($guest->status, ['Sedang Berkunjung', 'Sudah Keluar'])) {
                IdentityDeposit::create([
                    'guest_id' => $guest->id,
                    'identity_type' => $guest->identity_type,
                    'identity_number' => $guest->identity_number,
                    'received_by' => $sec1->id,
                    'deposited_at' => $guest->check_in_at ?? $guest->verified_at,
                    'returned_by' => $guest->status === 'Sudah Keluar' ? $sec1->id : null,
                    'returned_at' => $guest->check_out_at,
                    'status' => $guest->status === 'Sudah Keluar' ? 'Sudah Dikembalikan' : 'Dititipkan',
                    'notes' => $guest->status === 'Sudah Keluar' ? 'ID diserahkan kembali dalam kondisi utuh.' : 'ID disimpan di loker penitipan A-04.',
                ]);
            }
        }

        // 5. Seed Security Logs (Security Book)
        $securityLogsData = [
            [
                'security_id' => $sec1->id,
                'area_id' => $areas[0]->id, // Lobby
                'status' => 'Aman',
                'description' => 'Patroli shift pagi. Area lobby utama dan meja resepsionis kondusif, gate barrier berfungsi normal.',
                'photo' => 'security_checks/lobby_aman.svg',
                'checked_at' => $now->copy()->subHours(4),
                'notes' => 'Pintu darurat barat terkunci aman.',
            ],
            [
                'security_id' => $sec1->id,
                'area_id' => $areas[5]->id, // Lantai 15
                'status' => 'Aman',
                'description' => 'Area lantai 15 executive boardroom dalam kondisi aman dan steril menjelang rapat direksi.',
                'photo' => 'security_checks/lantai15_aman.svg',
                'checked_at' => $now->copy()->subHours(3),
                'notes' => 'Akses lift VIP beroperasi sesuai otorisasi.',
            ],
            [
                'security_id' => $sec1->id,
                'area_id' => $areas[2]->id, // Lantai 2
                'status' => 'Perlu Perhatian',
                'description' => 'Ditemukan kabel sambungan lantai di lorong divisi keuangan sedikit terbuka dan dapat memicu tersandung.',
                'photo' => 'security_checks/lantai2_perhatian.svg',
                'checked_at' => $now->copy()->subHours(2),
                'notes' => 'Telah dipasang safety cone dan dikoordinasikan dengan teknisi gedung (GA).',
            ],
            [
                'security_id' => $sec1->id,
                'area_id' => $areas[3]->id, // Lantai 3 - Server
                'status' => 'Insiden',
                'description' => 'Sensor pintu masuk ruang data center membunyikan alarm karena kartu tidak terbaca berulang kali.',
                'photo' => 'security_checks/server_insiden.svg',
                'checked_at' => $now->copy()->subDays(1)->setHour(22)->setMinute(15),
                'notes' => 'Telah dilakukan verifikasi fisik bersama petugas vendor Oracle. Sistem alarm telah di-reset aman.',
            ],
            [
                'security_id' => $sec1->id,
                'area_id' => $areas[6]->id, // Basement
                'status' => 'Aman',
                'description' => 'Pemeriksaan rutin area parkir basement 1. Sirkulasi blower aktif, tidak ada tumpahan oli atau kendaraan mencurigakan.',
                'photo' => 'security_checks/lobby_aman.svg',
                'checked_at' => $now->copy()->subDays(1)->setHour(15)->setMinute(30),
                'notes' => 'Pencahayaan lorong timur normal.',
            ],
        ];

        foreach ($securityLogsData as $logData) {
            SecurityLog::create($logData);
        }

        // 6. Seed Audit Logs
        AuditLog::log($admin->id, 'SYSTEM_INIT', 'SYSTEM', 'Database initialized and default seed data loaded.', '127.0.0.1');
        AuditLog::log($sec1->id, 'VERIFY_GUEST', 'GUEST', 'Verifikasi data tamu Ir. Bambang Trihatmodjo (PT Pertamina)', '127.0.0.1');
        AuditLog::log($sec1->id, 'DEPOSIT_ID', 'IDENTITY', 'Penerimaan penitipan KTP untuk tamu PT Pertamina', '127.0.0.1');
        AuditLog::log($sec1->id, 'CREATE_SECURITY_LOG', 'SECURITY_BOOK', 'Pelaporan patroli Lantai 2 dengan status Perlu Perhatian', '127.0.0.1');
    }
}
