# ARCHITECTURE.md

# Sistem Absensi Sekolah Terpusat

**Versi:** 2.0  
**Tanggal:** 19 November 2026  
**Status:** Pedoman arsitektur aplikasi

---

## 1. Teknologi Utama

| Komponen            | Teknologi                           |
| ------------------- | ----------------------------------- |
| Framework           | Next.js 16                          |
| Routing             | App Router                          |
| Bahasa              | JavaScript                          |
| Backend             | Next.js Server-side                 |
| Authentication      | Auth.js v5                          |
| OAuth               | Google OAuth                        |
| Database awal       | Google Spreadsheet                  |
| Database API        | Google Sheets API                   |
| Validasi            | Validasi backend pada Service Layer |
| Hosting             | Vercel                              |
| Repository          | GitHub                              |
| Database masa depan | PostgreSQL                          |

### Aturan implementasi

1. Menggunakan JavaScript, bukan TypeScript.
2. Menggunakan Next.js App Router.
3. Menggunakan Server Components secara default.
4. Client Components hanya digunakan jika membutuhkan interaksi browser.
5. Akses database hanya dilakukan melalui backend.
6. Kredensial database tidak boleh dikirim ke browser.
7. Tidak menambahkan dependency tanpa kebutuhan.
8. Tidak menambahkan tabel database tanpa persetujuan.
9. Mengutamakan fungsi, validasi, keamanan, dan konsistensi data.
10. Styling dilakukan setelah fungsi aplikasi selesai dan disetujui.

---

## 2. Arsitektur Aplikasi

Aplikasi menggunakan pendekatan Modular Monolith.

Frontend dan backend berada dalam satu proyek Next.js, tetapi tanggung jawab setiap bagian dipisahkan berdasarkan fungsi.

### Alur komunikasi

```text
Browser
  |
  v
Next.js App Router
  |
  v
Authentication / Authorization
  |
  v
Server Actions / Server Components
  |
  v
Service Layer
  |
  v
Repository Layer
  |
  v
Google Sheets API


Prinsip utama
1. Browser tidak boleh mengakses Google Sheets secara langsung.
2. Client Component tidak boleh mengakses Repository Layer.
3. Aturan bisnis ditempatkan di Service Layer.
4. Operasi penyimpanan dan pengambilan data ditempatkan di Repository Layer.
5. Pemeriksaan hak akses dilakukan di backend.
6. Repository tidak boleh digunakan sebagai pengganti Service Layer.
7. Komunikasi antarlapisan harus mempertahankan validasi dan konsistensi data.

3. Struktur Folder
Struktur proyek menggunakan direktori src.

Struktur utama:
src/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── not-found.js
│   │
│   ├── login/
│   │
│   ├── admin/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── users/
│   │   ├── classes/
│   │   ├── assignments/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── setup/
│   │   └── audit-logs/
│   │
│   ├── teacher/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── attendance/
│   │   ├── history/
│   │   └── attention-list/
│   │
│   └── kehadiran/
│       └── page.js
│
├── components/
│
├── config/
│   ├── database-schema.js
│   ├── user-config.js
│   ├── class-config.js
│   ├── teacher-assignment-config.js
│   └── school-defaults.js
│
├── lib/
│   ├── auth.js
│   ├── authorization.js
│   └── google-sheets.js
│
├── repositories/
│   ├── user-repository.js
│   ├── class-repository.js
│   ├── teacher-assignment-repository.js
│   ├── school-information-repository.js
│   └── administrative-audit-repository.js
│
├── services/
│   ├── user-service.js
│   ├── class-service.js
│   ├── teacher-assignment-service.js
│   ├── school-initialization-service.js
│   └── database-setup-service.js
│
└── docs/
    ├── PRD.md
    ├── DATABASE.md
    ├── ARCHITECTURE.md
    └── IMPLEMENTATION_PLAN.md


Daftar di atas merupakan gambaran struktur modul utama, bukan daftar seluruh file yang wajib dibuat sekaligus.

Folder dan file tambahan dapat dibuat sesuai kebutuhan tahap implementasi.

Struktur harus tetap mempertahankan pemisahan tanggung jawab.

4. Pembagian Tanggung Jawab
4.1 App Layer
Lokasi:

src/app/

Bertanggung jawab atas:
- Halaman aplikasi.
- Routing.
- Layout.
- Server Components.
- Client Components.
- Server Actions.
- Pengambilan data melalui Service Layer.
- Penyajian hasil operasi kepada pengguna.
Ketentuan:
1. Halaman tidak boleh menjalankan query Google Sheets secara langsung.
2. Halaman tidak boleh mengakses Repository Layer secara langsung.
3. Server Actions harus memeriksa autentikasi dan otorisasi melalui Service Layer atau mekanisme backend yang sesuai.
4. Client Components hanya menangani tampilan dan interaksi pengguna.
5. Client Components tidak boleh menerima kredensial atau data rahasia server.
4.2 Components
Lokasi:

src/components/

Bertanggung jawab atas komponen antarmuka yang digunakan berulang.

Ketentuan:
- Fokus pada tampilan dan interaksi.
- Tidak memuat query database.
- Tidak menentukan hak akses sebagai satu-satunya lapisan keamanan.
- Tidak menjalankan aturan bisnis yang seharusnya berada di Service Layer.
4.3 Config
Lokasi:

src/config/

Bertanggung jawab atas konfigurasi dan konstanta aplikasi.

Contoh:
- Struktur header database.
- Status pengguna.
- Status kelas.
- Konfigurasi penugasan guru.
- Informasi default sekolah.
Konfigurasi database harus konsisten dengan DATABASE.md.
4.4 Lib
Lokasi:

src/lib/

Berisi fungsi infrastruktur dan utilitas umum.

Contoh:
- Konfigurasi Auth.js.
- Koneksi Google Sheets.
- Pemeriksaan authorization.
- Fungsi umum yang digunakan oleh beberapa modul.
File yang mengakses kredensial atau koneksi database harus berjalan di server.
4.5 Repositories
Lokasi:

src/repositories/

Bertanggung jawab atas operasi penyimpanan dan pengambilan data.

Contoh:
- Mengambil data pengguna.
- Membuat dan memperbarui kelas.
- Mengambil penugasan guru.
- Menyimpan informasi sekolah.
- Menyimpan audit administratif.
- Mengambil data absensi.
Ketentuan:
1. Repository menjadi satu-satunya lapisan yang berkomunikasi langsung dengan penyimpanan data.
2. Repository tidak menentukan hak akses pengguna.
3. Repository tidak menggantikan validasi aturan bisnis.
4. Repository bertanggung jawab menjaga kesesuaian struktur data dengan database.
5. Operasi perubahan data yang diwajibkan audit harus terintegrasi dengan mekanisme audit.
4.6 Services
Lokasi:

src/services/

Bertanggung jawab atas aturan bisnis aplikasi.

Contoh:
- Memeriksa role dan status pengguna.
- Memastikan guru hanya memiliki maksimal dua kelas aktif secara bersamaan.
- Mencegah penugasan guru yang bertabrakan pada kelas yang sama.
- Memvalidasi periode keanggotaan siswa.
- Menghitung tahun ajaran berdasarkan tanggal absensi.
- Mencegah absensi ganda dalam satu minggu.
- Memvalidasi perubahan data absensi.
- Mengelola audit perubahan.
- Menghitung statistik kehadiran.
- Menyiapkan informasi untuk laporan dan komunikasi WhatsApp.
Ketentuan:
1. Service menjadi pusat penerapan aturan bisnis.
2. Service tidak boleh bergantung langsung pada format penyimpanan Google Sheets.
3. Service wajib melakukan pemeriksaan hak akses sebelum menjalankan operasi yang dilindungi.
4. Validasi backend tetap wajib meskipun frontend telah melakukan validasi.
5. Perubahan data harus mengikuti aturan audit yang berlaku.

5. Authentication dan Authorization
5.1 Authentication
Menggunakan Auth.js v5 dengan Google OAuth.

Proses autentikasi:
1. Pengguna memilih login menggunakan Google.
2. Google mengembalikan identitas pengguna.
3. Backend memperoleh Google sub.
4. Backend mencari akun berdasarkan auth_user_id.
5. Backend memeriksa status akun.
6. Backend menentukan role berdasarkan database.
7. Session dibuat jika akun memenuhi persyaratan.
Identitas Google sub digunakan sebagai identitas eksternal yang stabil.

Role dan status pengguna tidak boleh dipercaya dari data yang dikirim browser.
5.2 Authorization
Hak akses ditentukan berdasarkan role, status akun, dan data penugasan.

Administrator

Berwenang untuk:
- Mengelola pengguna.
- Mengelola siswa.
- Mengelola kelas.
- Mengelola penugasan guru.
- Mengelola informasi sekolah.
- Mengakses data absensi sesuai kewenangan.
- Melihat audit administratif.
- Mengakses dashboard administrator.
Guru

Berwenang untuk:
- Melihat kelas yang menjadi tanggung jawabnya.
- Membuat absensi kelas yang ditugaskan.
- Memperbarui data absensi sesuai ketentuan.
- Melihat riwayat absensinya.
- Mengakses daftar perhatian kehadiran sesuai kewenangan.
Publik
- Tidak perlu login.
- Hanya dapat mengakses informasi yang memang disediakan untuk publik.
- Tidak dapat mengakses data pribadi orang tua.
- Tidak dapat mengakses informasi internal sekolah.
- Tidak dapat membaca worksheet secara langsung.
5.3 Ketentuan keamanan
1. Pemeriksaan authorization wajib dilakukan di backend.
2. Akun inactive tidak boleh melakukan operasi internal.
3. Pengguna tidak boleh mengubah role sendiri melalui browser.
4. Guru tidak boleh mengakses kelas yang tidak menjadi tanggung jawabnya.
5. Administrator tidak boleh menghapus permanen akun pengguna.
6. Akun yang tidak lagi digunakan dinonaktifkan.

6. Database Abstraction
Aplikasi menggunakan Repository Layer sebagai lapisan abstraksi database.
Tahap awal
Google Sheets API digunakan sebagai penyimpanan data.
Tahap migrasi
PostgreSQL direncanakan sebagai database berikutnya.

Alur:
Service Layer
     |
     v
Repository Layer
     |
     v
Google Sheets API


Setelah migrasi:
Service Layer
     |
     v
Repository Layer
     |
     v
PostgreSQL


Prinsip:
1. Service Layer tidak boleh bergantung pada struktur teknis Google Sheets.
2. Perubahan database diupayakan tidak mengharuskan perubahan besar pada aturan bisnis.
3. Struktur tabel harus mengacu pada DATABASE.md.
4. Relasi dan integritas data harus dijaga oleh backend.
5. Primary key dibuat oleh backend.
6. Perubahan database harus mempertahankan riwayat dan audit yang diwajibkan.

7. Struktur Database
Database awal menggunakan 11 worksheet.
1. Users
2. Students
3. Classes
4. Class_Members
5. Teacher_Assignments
6. Attendance_Sessions
7. Attendance_Records
8. Attendance_Audit_Logs
9. Student_Contact_Logs
10. School_Information
11. Administrative_Audit_Logs
Tidak terdapat worksheet Academic_Years.

Struktur lengkap setiap worksheet, kolom, primary key, foreign key, dan indeks mengacu pada:

src/docs/DATABASE.md
7.1 Relasi kelas
Kelas tidak terikat pada satu tahun ajaran.

class_id tetap digunakan meskipun tahun ajaran berubah.

Keanggotaan siswa dan penugasan guru memiliki periode berlaku masing-masing.
7.2 Relasi penugasan guru
Penugasan guru disimpan dalam Teacher_Assignments.

Periode penugasan menggunakan:
- effective_from
- effective_to
Penugasan dapat berlangsung lintas tahun ajaran.
7.3 Relasi absensi
Attendance_Sessions menyimpan informasi pertemuan.

Attendance_Records menyimpan status kehadiran setiap siswa.

Attendance_Audit_Logs menyimpan riwayat perubahan data absensi.

academic_year_id pada Attendance_Sessions merupakan identitas tahun ajaran yang dihitung berdasarkan tanggal pertemuan.

8. Aturan Tahun Ajaran
Tahun ajaran dihitung otomatis berdasarkan tanggal kalender operasional WIB.

Periode tahun ajaran:
- Dimulai pada 1 Juli.
- Berakhir pada 30 Juni tahun berikutnya.
Contoh:
Tanggal	Tahun Ajaran
30 Juni 2026	2025/2026
1 Juli 2026	2026/2027
19 November 2026	2026/2027
30 Juni 2027	2026/2027
1 Juli 2027	2027/2028

Ketentuan:
1. Tahun ajaran tidak dibuat secara manual oleh administrator.
2. Tahun ajaran tidak memerlukan proses aktivasi.
3. Tidak ada tabel Academic_Years.
4. Tahun ajaran dihitung berdasarkan attendance_date.
5. Nilai academic_year_id disimpan pada Attendance_Sessions.
6. Perubahan tanggal sekarang tidak boleh mengubah tahun ajaran pada absensi lama.
7. Riwayat absensi tetap terikat pada tahun ajaran ketika pertemuan berlangsung.
Format identitas:

YYYY/YYYY+1

Contoh:

2026/2027

9. Aturan Penugasan Guru
Penugasan guru memiliki periode berlaku.

Ketentuan:
1. Satu guru maksimal memiliki dua kelas aktif secara bersamaan.
2. Satu kelas tidak boleh memiliki lebih dari satu guru aktif pada periode yang sama.
3. Penugasan menggunakan tanggal mulai dan tanggal selesai.
4. Tanggal selesai boleh kosong untuk penugasan yang masih berlangsung.
5. Penugasan dapat melintasi pergantian tahun ajaran.
6. Riwayat penugasan tidak dihapus ketika penugasan berakhir.
7. Guru hanya dapat membuat absensi untuk kelas yang menjadi tanggung jawabnya pada tanggal pertemuan.
Validasi penugasan dilakukan di Service Layer.

10. Aturan Tanggal dan Waktu
Zona waktu operasional:

Asia/Jakarta

Backend menjadi sumber kebenaran untuk pencatatan waktu.

Ketentuan:
1. created_at dan updated_at dibuat oleh backend.
2. Periode keanggotaan siswa menggunakan tanggal.
3. Periode penugasan guru menggunakan tanggal.
4. Tahun ajaran dihitung menggunakan tanggal absensi.
5. Perhitungan minggu absensi menggunakan WIB.
6. Tanggal yang dikirim dari browser harus divalidasi.
7. Tanggal kalender tidak boleh berubah akibat konversi zona waktu yang keliru.
Untuk tanggal absensi berformat YYYY-MM-DD, tanggal tersebut diperlakukan sebagai tanggal kalender WIB.

11. Aturan Absensi
11.1 Jadwal pertemuan
Jadwal pembelajaran dapat berubah berdasarkan kesepakatan guru dan sekolah.

Pertemuan tidak harus berlangsung pada hari jadwal rutin.

Guru membuat absensi berdasarkan tanggal pertemuan yang benar-benar berlangsung.
11.2 Batas pertemuan
Maksimal satu sesi absensi untuk kombinasi guru dan kelas dalam satu minggu kalender.

Minggu kalender dihitung:
- Senin pukul 00.00 WIB.
- Sampai Minggu pukul 23.59 WIB.
Ketentuan:
1. Satu guru tidak boleh membuat dua sesi absensi untuk kelas yang sama dalam satu minggu.
2. Jika jadwal pertemuan berubah, absensi dibuat pada tanggal pengganti.
3. Jika pertemuan dibatalkan dan tidak ada absensi, tidak diperlukan pencatatan pembatalan khusus.
4. Tidak boleh membuat sesi kedua untuk kombinasi guru dan kelas yang sama dalam minggu tersebut.
11.3 Informasi pertemuan
Attendance_Sessions menyimpan:
- Kelas.
- Guru.
- Tahun ajaran.
- Tanggal pertemuan.
- Nama tempat kegiatan.
- Catatan tempat kegiatan.
- Materi pelajaran.
- Waktu pembuatan dan pembaruan.
Tempat kegiatan dapat berupa ruang kelas, area sekolah, atau lokasi di luar sekolah.

Materi pelajaran menjelaskan kegiatan pembelajaran pada pertemuan tersebut.

Contoh:
- Belajar komputer Microsoft Word.
- Praktik mencetak dokumen menggunakan printer.
- Pembelajaran di luar kelas.
Informasi tempat dan materi dapat diperbarui setelah sesi dibuat.
11.4 Status kehadiran
Status kehadiran setiap siswa disimpan dalam Attendance_Records.

Perubahan status dapat dilakukan lebih dari satu kali sesuai kewenangan.

Setiap perubahan status harus dicatat dalam Attendance_Audit_Logs.
11.5 Audit perubahan
Perubahan data absensi yang wajib dicatat meliputi:
- Perubahan status kehadiran.
- Perubahan nama tempat.
- Perubahan catatan tempat.
- Perubahan materi pelajaran.
- Penghapusan data absensi sesuai kewenangan.
Audit menyimpan informasi perubahan, pengguna yang melakukan perubahan, dan waktu perubahan.

Riwayat audit tidak boleh diubah atau dihapus melalui aplikasi.

12. Integrasi Google Sheets
Koneksi menggunakan Google Sheets API dan Service Account.

Ketentuan:
1. Kredensial hanya berada di server.
2. Spreadsheet dibagikan kepada Service Account.
3. Browser tidak pernah menerima kredensial.
4. Semua operasi database dilakukan melalui Repository Layer.
5. Setiap worksheet mengikuti DATABASE.md.
6. Header worksheet harus sesuai dengan DATABASE_SCHEMA.
7. Backend melakukan validasi foreign key dan aturan UNIQUE.
8. Operasi lintas worksheet harus memiliki mekanisme penanganan kegagalan sebagian.
9. Operasi bersamaan harus memperhatikan kemungkinan konflik perubahan data.
Google Sheets tidak menyediakan transaksi relasional seperti PostgreSQL.

Karena itu, Service dan Repository harus menangani kemungkinan kegagalan sebagian serta menjaga konsistensi data.

Perubahan struktur worksheet fisik harus dilakukan melalui prosedur migrasi yang aman.

Jangan menjalankan inisialisasi database pada spreadsheet yang masih memiliki struktur lama tanpa pemeriksaan dan migrasi terlebih dahulu.

13. API dan Server Actions
Aplikasi menggunakan Next.js App Router.

Operasi internal dapat menggunakan Server Actions atau Route Handlers sesuai kebutuhan modul.

Server Actions digunakan untuk operasi formulir dan mutasi data yang berasal dari antarmuka aplikasi.

Route Handlers digunakan apabila dibutuhkan endpoint HTTP, integrasi eksternal, atau akses publik.

Ketentuan:
1. Tidak semua operasi bisnis harus dibuat sebagai REST API.
2. Server Actions tidak boleh melewati validasi Service Layer.
3. Route Handlers wajib melakukan pemeriksaan autentikasi dan authorization.
4. Endpoint publik hanya mengembalikan data yang telah disetujui.
5. Repository tidak boleh dipanggil langsung oleh browser.
6. Kontrak respons dan penanganan error harus konsisten.
Struktur endpoint tambahan ditentukan berdasarkan kebutuhan implementasi, bukan dibuat tanpa kebutuhan.

14. Keamanan
1. Session dikelola oleh Auth.js.
2. Semua operasi internal memerlukan autentikasi.
3. Semua operasi memeriksa role dan hak akses.
4. Akun inactive tidak boleh melakukan operasi internal.
5. Data publik hanya mengembalikan kolom yang disetujui.
6. Kredensial Google disimpan sebagai environment variables.
7. Secret tidak boleh disimpan di repository.
8. Input wajib divalidasi di backend.
9. Operasi administratif dicatat dalam audit.
10. Perubahan data absensi dicatat dalam audit.
11. Role dan identitas pengguna tidak boleh dipercaya dari browser.
12. Akses database tidak boleh diberikan kepada Client Components.
13. Data pribadi siswa dan orang tua harus dilindungi.
14. Informasi rahasia tidak boleh ditampilkan pada pesan error.

15. Environment Variables
Konfigurasi menggunakan .env.local.

Contoh variabel:
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=

NEXT_PUBLIC_APP_URL=


Ketentuan:
1. Jangan memasukkan kredensial asli ke .env.example.
2. File .env.local tidak boleh di-commit.
3. Secret hanya boleh digunakan di server.
4. Variabel dengan prefix NEXT_PUBLIC_ hanya boleh berisi informasi yang aman dipublikasikan.
5. Environment variables produksi dikonfigurasi melalui Vercel.

16. Error Handling
Setiap operasi harus menghasilkan informasi keberhasilan atau kegagalan yang dapat dipahami.

Ketentuan:
1. Kesalahan validasi harus memberikan pesan yang jelas.
2. Kesalahan authorization tidak boleh membocorkan informasi internal.
3. Kesalahan database harus ditangani di backend.
4. Pesan error kepada pengguna tidak boleh menampilkan kredensial, token, atau konfigurasi server.
5. Detail teknis dapat dicatat pada log server untuk keperluan pemeriksaan.

17. Deployment
Deployment menggunakan GitHub dan Vercel.

Alur:
1. Kode dikembangkan dan diperiksa secara lokal.
2. Perubahan disimpan dalam Git.
3. Perubahan di-commit setelah tahap terkait selesai.
4. Repository disinkronkan dengan GitHub.
5. Vercel menjalankan deployment berdasarkan konfigurasi repository.
6. Environment variables produksi dikonfigurasi di Vercel.
7. Aplikasi diperiksa setelah deployment.
Sebelum deployment produksi, pastikan struktur Google Sheets sudah sesuai dengan versi aplikasi.

18. Prinsip Pengembangan
1. Utamakan fungsi sebelum styling.
2. Gunakan JavaScript.
3. Gunakan struktur modular.
4. Pisahkan App, Service, Repository, Config, dan Lib.
5. Hindari duplikasi kode.
6. Gunakan komponen reusable jika memang diperlukan.
7. Jangan menambahkan dependency tanpa kebutuhan.
8. Jangan menambahkan tabel tanpa persetujuan.
9. Jangan mengubah aturan bisnis yang telah disepakati tanpa persetujuan.
10. Setiap modul harus divalidasi sebelum melanjutkan modul berikutnya.
11. Perubahan struktur database harus diselaraskan dengan seluruh modul terkait.
12. Jangan menjalankan pengujian runtime terhadap spreadsheet sebelum migrasi struktur database selesai.
13. Dokumentasi harus mengikuti implementasi dan keputusan terbaru.

19. Tahapan Pengembangan
Pengembangan aplikasi dibagi menjadi sepuluh tahap.
1. Fondasi proyek dan konfigurasi.
2. Authentication dan authorization.
3. Database dan inisialisasi.
4. Manajemen pengguna.
5. Audit administratif dan fondasi administrasi.
6. Manajemen kelas dan penugasan guru.
7. Manajemen siswa dan keanggotaan kelas.
8. Modul absensi dan audit absensi.
9. Halaman publik, laporan, dan komunikasi WhatsApp.
10. Pengujian akhir, penyempurnaan, dan deployment.
Status dan rincian pekerjaan setiap tahap mengacu pada:

src/docs/IMPLEMENTATION_PLAN.md

20. Dokumen Acuan
Dokumen berikut merupakan acuan utama proyek:
Dokumen	Tanggung Jawab
PRD.md	Kebutuhan dan aturan produk
DATABASE.md	Struktur dan relasi database
ARCHITECTURE.md	Arsitektur dan pemisahan tanggung jawab
IMPLEMENTATION_PLAN.md	Tahapan dan urutan implementasi

Jika terdapat perbedaan antar dokumen:
1. Aturan bisnis yang telah disepakati menjadi acuan.
2. Struktur database harus mengikuti keputusan desain database terbaru.
3. Arsitektur harus diselaraskan dengan PRD dan DATABASE.
4. Implementasi tidak boleh diam-diam mengubah keputusan yang telah disetujui.

21. Status Dokumen
ARCHITECTURE.md versi 2.0 menggantikan versi 1.0.

Dokumen ini menjadi pedoman arsitektur aplikasi Sistem Absensi Sekolah Terpusat.

Perubahan berikutnya harus mempertahankan konsistensi dengan kebutuhan produk, struktur database, dan aturan bisnis yang telah disepakati.
```
