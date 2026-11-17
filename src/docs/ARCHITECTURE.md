# ARCHITECTURE.md

# Sistem Absensi Sekolah Terpusat

**Versi:** 1.0  
**Tanggal:** 17 November 2026  
**Status:** Rancangan arsitektur aplikasi

---

## 1. Teknologi Utama

| Komponen            | Teknologi           |
| ------------------- | ------------------- |
| Framework           | Next.js 16          |
| Routing             | App Router          |
| Bahasa              | JavaScript          |
| Backend             | Next.js Server-side |
| Authentication      | Auth.js             |
| OAuth               | Google OAuth        |
| Database awal       | Google Spreadsheet  |
| Database API        | Google Sheets API   |
| Validasi            | Zod                 |
| Hosting             | Vercel              |
| Repository          | GitHub              |
| Database masa depan | PostgreSQL          |

### Aturan implementasi

- Menggunakan JavaScript, bukan TypeScript.
- Tidak menggunakan custom CSS, Tailwind CSS, daisyUI, React Icons, atau Lenis sebelum mendapat persetujuan.
- Tidak menambahkan animasi atau dekorasi pada tahap awal.
- Fokus pada fungsi, validasi, keamanan, dan konsistensi data.
- Menggunakan komponen sederhana dan reusable.

## 2. Arsitektur Aplikasi

Aplikasi menggunakan pendekatan modular monolith.

Artinya, frontend dan backend berada dalam satu proyek Next.js, tetapi tanggung jawab setiap bagian dipisahkan berdasarkan fungsi.

Alur komunikasi:

Browser → Next.js → Authentication/Authorization → Service Layer → Repository Layer → Google Sheets API

Frontend tidak boleh mengakses Google Sheets secara langsung.

Seluruh akses database dilakukan melalui backend.

## 3. Struktur Folder

```text
school-attendance/
│
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── not-found.js
│   │
│   ├── login/
│   │   └── page.js
│   │
│   ├── admin/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── users/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── classes/
│   │   ├── academic-years/
│   │   ├── promotions/
│   │   ├── school-information/
│   │   ├── attendance/
│   │   └── audit-logs/
│   │
│   ├── teacher/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── attendance/
│   │   ├── history/
│   │   └── attention-list/
│   │
│   ├── kehadiran/
│   │   └── page.js
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       ├── students/
│       ├── teachers/
│       ├── classes/
│       ├── academic-years/
│       ├── attendance/
│       ├── dashboard/
│       ├── promotions/
│       ├── school-information/
│       └── public/
│
├── components/
│   ├── DataList.js
│   ├── SelectableList.js
│   ├── AttendanceList.js
│   ├── AttendanceForm.js
│   ├── AttendanceSummary.js
│   └── ...
│
├── lib/
│   ├── auth.js
│   ├── google-sheets.js
│   ├── validation.js
│   ├── permissions.js
│   ├── constants.js
│   └── utils.js
│
├── repositories/
│   ├── users.repository.js
│   ├── students.repository.js
│   ├── classes.repository.js
│   ├── academic-years.repository.js
│   ├── attendance.repository.js
│   └── ...
│
├── services/
│   ├── auth.service.js
│   ├── student.service.js
│   ├── teacher.service.js
│   ├── class.service.js
│   ├── academic-year.service.js
│   ├── attendance.service.js
│   ├── promotion.service.js
│   ├── dashboard.service.js
│   ├── contact.service.js
│   └── audit.service.js
│
├── schemas/
│   ├── user.schema.js
│   ├── student.schema.js
│   ├── class.schema.js
│   ├── attendance.schema.js
│   └── ...
│
├── config/
│   └── site.js
│
├── public/
│
├── .env.example
├── .gitignore
├── jsconfig.json
├── next.config.js
└── package.json
```

Struktur dapat disesuaikan selama proses pengembangan, tetapi pemisahan tanggung jawab harus dipertahankan.

## 4. Pembagian Tanggung Jawab

### 4.1 app/

Mengelola:

- Halaman aplikasi.
- Routing.
- Layout.
- API Routes.
- Server Components.
- Client Components jika diperlukan.

Tidak boleh memuat query Google Sheets yang tersebar di dalam halaman.

### 4.2 components/

Menyimpan komponen antarmuka yang digunakan berulang.

Komponen utama:

- DataList
- SelectableList
- AttendanceList
- AttendanceForm
- AttendanceSummary
- AttendanceChart
- ClassComparisonChart
- AttendanceTrendChart

Komponen harus berfokus pada tampilan dan interaksi, bukan aturan bisnis database.

### 4.3 repositories/

Bertanggung jawab atas operasi penyimpanan dan pengambilan data.

Contoh:

- Mengambil daftar siswa.
- Mencari siswa.
- Menyimpan siswa.
- Mengambil sesi absensi.
- Menyimpan record absensi.
- Mengambil riwayat audit.

Repository menjadi satu-satunya lapisan yang berkomunikasi langsung dengan penyimpanan data.

### 4.4 services/

Bertanggung jawab atas aturan bisnis.

Contoh:

- Memeriksa hak akses guru.
- Memastikan guru hanya bertanggung jawab maksimal dua kelas.
- Memastikan satu kelas hanya memiliki satu guru aktif.
- Memvalidasi periode keanggotaan siswa.
- Membuat absensi harian.
- Memproses kenaikan kelas.
- Menghitung statistik dashboard.
- Menyiapkan pesan WhatsApp.
- Menyimpan audit.

Service tidak boleh bergantung langsung pada format penyimpanan Google Sheets.

### 4.5 schemas/

Berisi validasi data menggunakan Zod.

Contoh:

- Validasi siswa.
- Validasi guru.
- Validasi kelas.
- Validasi tahun ajaran.
- Validasi absensi.
- Validasi perubahan data.

Validasi frontend hanya untuk kenyamanan pengguna. Validasi backend tetap wajib.

### 4.6 lib/

Berisi fungsi dan konfigurasi umum.

Contoh:

- Konfigurasi Auth.js.
- Koneksi Google Sheets.
- Pemeriksaan permission.
- Konstanta status.
- Utility tanggal.
- Utility ID.

## 5. Pola Komunikasi Antarmodul

Setiap operasi bisnis mengikuti pola:

1. Pengguna melakukan tindakan.
2. Frontend mengirim request ke API.
3. API memeriksa autentikasi.
4. API memeriksa otorisasi.
5. Input divalidasi dengan Zod.
6. Service menjalankan aturan bisnis.
7. Repository membaca atau menulis data.
8. API mengembalikan hasil.

Repository tidak boleh dipanggil langsung oleh komponen frontend.

## 6. Authentication dan Authorization

### Authentication

Menggunakan Auth.js dengan Google OAuth.

Proses:

1. Pengguna memilih login dengan Google.
2. Google mengembalikan identitas pengguna.
3. Backend membaca Google `sub`.
4. Backend mencari akun berdasarkan `auth_user_id`.
5. Backend memeriksa status akun.
6. Backend membuat session jika akun valid.
7. Role dan identitas internal pengguna dimuat dari database.

### Authorization

Hak akses ditentukan berdasarkan role dan data penugasan.

Administrator:

- Mengelola seluruh data sekolah.
- Mengelola seluruh absensi.
- Mengelola pengguna dan penugasan.
- Mengelola tahun ajaran.
- Melihat dashboard administrator.

Guru:

- Melihat kelas yang menjadi tanggung jawabnya.
- Membuat absensi kelas.
- Mengubah dan menghapus absensi yang dibuatnya sendiri.
- Melihat riwayat absensinya.
- Mengakses daftar perhatian kehadiran.

Publik:

- Tidak perlu login.
- Hanya mengakses endpoint publik.
- Tidak dapat mengakses data pribadi orang tua atau informasi internal.

Pemeriksaan authorization wajib dilakukan di backend.

## 7. Database Abstraction

Aplikasi menggunakan repository sebagai lapisan abstraksi database.

Tahap awal:

- Google Sheets Repository.

Tahap migrasi:

- PostgreSQL Repository.

Service harus tetap menggunakan kontrak operasi yang sama sehingga pergantian database tidak memerlukan perubahan besar pada aturan bisnis.

Contoh:

```text
attendance.service.js
        |
        v
attendance.repository.js
        |
        v
Google Sheets API
```

Setelah migrasi:

```text
attendance.service.js
        |
        v
attendance.repository.js
        |
        v
PostgreSQL
```

Format penyimpanan tidak boleh bocor ke frontend atau service.

## 8. Integrasi Google Sheets

Koneksi dilakukan menggunakan Google Sheets API dan Service Account.

Aturan:

- Kredensial hanya berada di server.
- Spreadsheet dibagikan kepada Service Account.
- Browser tidak pernah menerima kredensial.
- Semua operasi dilakukan melalui backend.
- Setiap worksheet mengikuti struktur DATABASE.md.
- ID record dibuat oleh backend.
- Backend melakukan validasi foreign key dan UNIQUE.
- Operasi multi-sheet harus memiliki mekanisme penguncian dan pemulihan.

Google Sheets tidak menyediakan transaksi database relasional. Karena itu, backend perlu menangani kemungkinan kegagalan sebagian dan perubahan bersamaan.

## 9. Penanganan Tanggal

Zona waktu operasional:

`Asia/Jakarta`

Backend menjadi sumber kebenaran waktu.

Aturan:

- Tanggal absensi diperoleh otomatis dari backend.
- `created_at` dan `updated_at` dibuat backend.
- Periode keanggotaan menggunakan DATE.
- Periode penugasan menggunakan DATE.
- Tahun ajaran menggunakan DATE.
- Jangan mengandalkan jam perangkat pengguna untuk menentukan tanggal absensi.

## 10. API Structure

Endpoint awal yang direncanakan:

| Method | Endpoint               | Fungsi                  |
| ------ | ---------------------- | ----------------------- |
| GET    | /api/students          | Daftar siswa            |
| POST   | /api/students          | Tambah siswa            |
| GET    | /api/teachers          | Daftar guru             |
| POST   | /api/teachers          | Tambah guru             |
| GET    | /api/classes           | Daftar kelas            |
| POST   | /api/classes           | Tambah kelas            |
| GET    | /api/academic-years    | Daftar tahun ajaran     |
| POST   | /api/academic-years    | Tambah tahun ajaran     |
| POST   | /api/attendance        | Membuat absensi         |
| GET    | /api/attendance        | Mengambil data absensi  |
| PATCH  | /api/attendance/[id]   | Mengubah absensi        |
| DELETE | /api/attendance/[id]   | Menghapus absensi       |
| GET    | /api/dashboard/admin   | Dashboard administrator |
| GET    | /api/dashboard/teacher | Dashboard guru          |
| POST   | /api/promotions        | Proses kenaikan kelas   |
| GET    | /api/public/students   | Pencarian siswa publik  |
| GET    | /api/public/attendance | Riwayat absensi publik  |

Endpoint tambahan dapat dibuat sesuai kebutuhan implementasi, tanpa mengubah aturan bisnis.

## 11. Keamanan

1. Session dikelola Auth.js.
2. Semua endpoint internal memerlukan autentikasi.
3. Semua endpoint memeriksa role dan hak akses.
4. Data publik hanya mengembalikan kolom yang disetujui.
5. Kredensial Google disimpan sebagai environment variables.
6. Tidak menyimpan secret di repository.
7. Input divalidasi di backend.
8. Operasi administratif dicatat dalam audit.
9. Operasi UPDATE dan DELETE absensi dicatat dalam audit.
10. Akun inactive tidak boleh mengakses endpoint internal.
11. Hindari mempercayai role atau identitas yang dikirim dari browser.
12. Batasi akses publik agar tidak dapat membaca worksheet secara langsung.

## 12. Environment Variables

File `.env.example` menjadi contoh konfigurasi.

Variabel yang direncanakan:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=

NEXT_PUBLIC_APP_URL=
```

Ketentuan:

- Semua secret hanya digunakan server.
- `NEXT_PUBLIC_` hanya digunakan untuk informasi yang memang aman dipublikasikan.
- Jangan memasukkan kredensial asli ke `.env.example`.
- Environment variables produksi diatur melalui Vercel.

## 13. Error Handling

API menggunakan format respons konsisten.

Contoh berhasil:

```json
{
  "success": true,
  "data": {},
  "message": "Data berhasil disimpan"
}
```

Contoh gagal:

```json
{
  "success": false,
  "data": null,
  "message": "Terjadi kesalahan saat menyimpan data",
  "code": "OPERATION_FAILED"
}
```

Error internal tidak boleh membocorkan:

- Kredensial.
- Token.
- Informasi rahasia.
- Detail konfigurasi server.

Pesan kepada pengguna harus mudah dipahami.

## 14. Deployment

Deployment menggunakan GitHub dan Vercel.

Alur:

1. Kode disimpan di repository GitHub.
2. Repository dihubungkan ke Vercel.
3. Environment variables dikonfigurasi.
4. Push ke branch produksi memicu deployment otomatis.
5. Vercel menyediakan domain aplikasi.

Tidak diperlukan pengelolaan server secara manual.

## 15. Prinsip Pengembangan

- Utamakan fungsi sebelum styling.
- Gunakan JavaScript.
- Gunakan struktur modular.
- Hindari duplikasi kode.
- Gunakan komponen reusable.
- Jangan menambahkan dependency tanpa kebutuhan.
- Jangan menambahkan tabel tanpa persetujuan.
- Jangan mengubah aturan bisnis yang telah disepakati.
- Lakukan pengujian setiap modul sebelum melanjutkan modul berikutnya.
- Pastikan aplikasi dapat berjalan sebelum menerapkan styling.

## 16. Status Dokumen

`ARCHITECTURE.md` versi 1.0 menjadi pedoman arsitektur awal aplikasi.

Perubahan arsitektur diperbolehkan selama tidak melanggar keputusan teknologi, struktur database, dan aturan bisnis yang telah disetujui.
