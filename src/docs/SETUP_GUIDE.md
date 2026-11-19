# SETUP_GUIDE.md

# Panduan Persiapan dan Konfigurasi Sistem

**Nama Proyek:** Sistem Absensi Sekolah Terpusat  
**Versi:** 2.0  
**Tanggal:** 19 November 2026  
**Status:** Panduan konfigurasi

---

## 1. Tujuan

Dokumen ini menjelaskan persiapan lingkungan pengembangan, konfigurasi layanan Google, database Google Sheets, autentikasi, dan deployment aplikasi.

Panduan ini digunakan sebagai acuan sebelum aplikasi dijalankan dan dipublikasikan.

---

## 2. Teknologi yang Digunakan

| Komponen             | Teknologi         |
| -------------------- | ----------------- |
| Framework            | Next.js 16.4.6    |
| Bahasa               | JavaScript        |
| Routing              | App Router        |
| Autentikasi          | Auth.js v5        |
| Database awal        | Google Sheets     |
| Google API           | Google Sheets API |
| Autentikasi pengguna | Google OAuth      |
| Deployment           | Vercel            |
| Repository           | GitHub            |

---

## 3. Persiapan Lingkungan Pengembangan

### 3.1 Perangkat Lunak

Pastikan perangkat pengembangan memiliki:

1. Node.js versi LTS yang kompatibel.
2. npm.
3. Git.
4. Browser modern.
5. Akun Google.
6. Akun GitHub.
7. Akun Vercel.

### 3.2 Memeriksa Instalasi

Periksa versi Node.js:

```bash
node -v
```

Periksa npm:

```bash
npm -v
```

Periksa Git:

```bash
git --version
```

### 3.3 Menjalankan Proyek

Masuk ke direktori proyek:

```bash
cd PRJ-2026-RND-001-V01
```

Instal dependensi:

```bash
npm install
```

Jalankan aplikasi dalam mode pengembangan:

```bash
npm run dev
```

Aplikasi dapat diakses melalui:

```text
http://localhost:3000
```

---

## 4. Persiapan Google Sheets

### 4.1 Membuat Spreadsheet

1. Buka Google Sheets.
2. Buat spreadsheet baru.
3. Berikan nama yang sesuai, misalnya:

   `Database Sistem Absensi Sekolah`

4. Salin Spreadsheet ID dari URL.

Contoh URL:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

Bagian `SPREADSHEET_ID` merupakan ID yang digunakan aplikasi.

### 4.2 Membuat Worksheet

Buat 11 worksheet berikut:

1. `Users`
2. `Students`
3. `Classes`
4. `Class_Members`
5. `Teacher_Assignments`
6. `Attendance_Sessions`
7. `Attendance_Records`
8. `Attendance_Audit_Logs`
9. `Student_Contact_Logs`
10. `School_Information`
11. `Administrative_Audit_Logs`

Tidak diperlukan worksheet `Academic_Years`.

Tahun ajaran dihitung otomatis oleh aplikasi berdasarkan tanggal kegiatan, dengan ketentuan:

- Dimulai setiap 1 Juli.
- Berakhir setiap 30 Juni tahun berikutnya.
- Menggunakan zona waktu Asia/Jakarta.
- Identifier tahun ajaran menggunakan format `YYYY/YYYY`.

Contoh:

- 30 Juni 2026 termasuk tahun ajaran `2025/2026`.
- 1 Juli 2026 termasuk tahun ajaran `2026/2027`.

### 4.3 Struktur Header Worksheet

Header setiap worksheet harus mengikuti definisi pada:

```text
src/config/database-schema.js
```

Dokumen acuan struktur database:

```text
src/docs/DATABASE.md
```

Jangan membuat header berdasarkan perkiraan atau mengubah urutan kolom secara manual.

Aplikasi menyediakan fungsi pemeriksaan dan inisialisasi header melalui:

```text
src/services/database-setup-service.js
```

Fungsi inisialisasi header hanya menambahkan header pada worksheet yang sudah tersedia dan belum memiliki header.

Fungsi tersebut tidak membuat worksheet yang belum tersedia.

### 4.4 Spreadsheet yang Sudah Pernah Digunakan

Jika spreadsheet sudah berisi data atau menggunakan struktur database versi sebelumnya:

1. Jangan langsung menghapus worksheet lama.
2. Jangan langsung menghapus kolom.
3. Jangan mengganti urutan kolom tanpa pemeriksaan.
4. Buat salinan atau backup spreadsheet.
5. Periksa data yang sudah tersimpan.
6. Susun rencana migrasi berdasarkan struktur terbaru di `DATABASE.md`.
7. Pastikan data lama tetap dapat dipertahankan sebelum melakukan perubahan.

Worksheet `Academic_Years` yang sudah ada pada spreadsheet lama tidak lagi digunakan oleh aplikasi versi terbaru.

Namun, penghapusan worksheet tersebut harus dilakukan setelah dipastikan tidak ada data lama yang masih diperlukan.

Perubahan struktur `Classes` dan `School_Information` juga harus mengikuti prosedur migrasi, bukan sekadar mengganti header.

---

## 5. Konfigurasi Google Cloud

### 5.1 Membuat Google Cloud Project

1. Buka Google Cloud Console.
2. Buat project baru atau gunakan project yang tersedia.
3. Berikan nama yang sesuai.
4. Pastikan project yang benar sedang dipilih.

### 5.2 Mengaktifkan Google Sheets API

1. Buka menu APIs & Services.
2. Pilih Library.
3. Cari Google Sheets API.
4. Buka halaman Google Sheets API.
5. Klik Enable.

### 5.3 Membuat Service Account

1. Buka IAM & Admin.
2. Pilih Service Accounts.
3. Buat Service Account baru.
4. Berikan nama yang sesuai.
5. Selesaikan proses pembuatan.

### 5.4 Membuat Service Account Key

1. Buka Service Account yang telah dibuat.
2. Masuk ke bagian Keys.
3. Pilih Add Key.
4. Pilih Create new key.
5. Pilih JSON.
6. Simpan file JSON dengan aman.

File tersebut berisi kredensial rahasia.

Jangan:

- Mengunggah file JSON ke GitHub.
- Memasukkan kredensial ke source code.
- Membagikan private key.
- Menyimpan kredensial pada folder publik aplikasi.

### 5.5 Memberikan Akses Spreadsheet

1. Buka spreadsheet database.
2. Klik Share.
3. Masukkan email Service Account.
4. Berikan izin Editor.
5. Simpan perubahan.

Email Service Account dapat ditemukan pada file JSON di properti:

```text
client_email
```

---

## 6. Konfigurasi Google OAuth

### 6.1 Membuat OAuth Client

1. Buka Google Cloud Console.
2. Pilih APIs & Services.
3. Buka Google Auth Platform atau halaman konfigurasi OAuth.
4. Konfigurasikan OAuth Consent Screen.
5. Buat OAuth Client ID.
6. Pilih Web Application.

### 6.2 Authorized JavaScript Origins

Untuk pengembangan lokal:

```text
http://localhost:3000
```

Untuk produksi, tambahkan domain aplikasi yang digunakan.

### 6.3 Authorized Redirect URIs

Untuk pengembangan lokal:

```text
http://localhost:3000/api/auth/callback/google
```

Untuk produksi:

```text
https://DOMAIN-APLIKASI/api/auth/callback/google
```

Ganti `DOMAIN-APLIKASI` dengan domain produksi yang sebenarnya.

---

## 7. Konfigurasi Environment Variables

Buat file:

```text
.env.local
```

Contoh konfigurasi:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

Isi setiap variabel menggunakan kredensial yang sesuai.

Ketentuan:

1. `AUTH_SECRET` digunakan untuk keamanan sesi Auth.js.
2. `AUTH_GOOGLE_ID` berasal dari OAuth Client.
3. `AUTH_GOOGLE_SECRET` berasal dari OAuth Client.
4. `GOOGLE_SHEETS_SPREADSHEET_ID` berasal dari URL spreadsheet.
5. `GOOGLE_SERVICE_ACCOUNT_EMAIL` berasal dari Service Account.
6. `GOOGLE_PRIVATE_KEY` berasal dari private key Service Account.

Jangan pernah membagikan isi `.env.local`.

Pastikan file tersebut tidak masuk ke repository GitHub.

---

## 8. Konfigurasi Aplikasi

### 8.1 Pemeriksaan Database

Aplikasi menggunakan definisi struktur database dari:

```text
src/config/database-schema.js
```

Pemeriksaan header dilakukan melalui:

```text
src/services/database-setup-service.js
```

Sebelum aplikasi menggunakan database, pastikan:

- Spreadsheet ID benar.
- Service Account memiliki akses Editor.
- Semua worksheet tersedia.
- Header setiap worksheet sesuai.
- Struktur spreadsheet sudah sesuai dengan versi aplikasi.

### 8.2 Inisialisasi Informasi Sekolah

Informasi sekolah diinisialisasi melalui halaman setup administrator.

Informasi tersebut disimpan pada worksheet:

```text
School_Information
```

Tidak ada konfigurasi tahun ajaran aktif yang perlu diisi administrator.

### 8.3 Tahun Ajaran Otomatis

Aplikasi menentukan tahun ajaran berdasarkan tanggal kegiatan.

Tidak diperlukan:

- Pembuatan tahun ajaran secara manual.
- Aktivasi tahun ajaran.
- Penonaktifan tahun ajaran.
- Pergantian tahun ajaran oleh administrator.
- Worksheet khusus tahun ajaran.

Pergantian tahun ajaran berlangsung otomatis setiap tanggal 1 Juli.

---

## 9. Konfigurasi GitHub dan Vercel

### 9.1 Repository GitHub

Pastikan proyek telah memiliki repository GitHub.

Periksa agar file rahasia tidak ikut diunggah, terutama:

```text
.env.local
```

dan file kredensial Service Account.

### 9.2 Menghubungkan Vercel

1. Masuk ke Vercel.
2. Pilih Add New Project.
3. Hubungkan akun GitHub.
4. Pilih repository proyek.
5. Konfigurasikan deployment.

### 9.3 Environment Variables Vercel

Masukkan semua variabel lingkungan yang diperlukan:

```text
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

Gunakan nilai yang sama dengan konfigurasi produksi yang telah disiapkan.

Pastikan private key disimpan dalam format yang dapat dibaca aplikasi.

### 9.4 Deployment

Setelah konfigurasi selesai:

1. Periksa pengaturan build.
2. Jalankan deployment.
3. Periksa log deployment.
4. Pastikan aplikasi dapat diakses.
5. Uji autentikasi dan koneksi database.

---

## 10. Checklist Persiapan

### 10.1 Lingkungan Pengembangan

- [ ] Node.js terpasang.
- [ ] npm tersedia.
- [ ] Git tersedia.
- [ ] Dependensi proyek terpasang.
- [ ] Aplikasi dapat dijalankan secara lokal.

### 10.2 Google Sheets

- [ ] Spreadsheet database dibuat.
- [ ] Spreadsheet ID tersedia.
- [ ] Sebelas worksheet tersedia.
- [ ] Header sesuai `database-schema.js`.
- [ ] Tidak ada ketergantungan pada worksheet `Academic_Years`.
- [ ] Backup tersedia jika menggunakan spreadsheet lama.

### 10.3 Google Cloud

- [ ] Google Cloud Project tersedia.
- [ ] Google Sheets API aktif.
- [ ] Service Account tersedia.
- [ ] Service Account Key tersedia.
- [ ] Service Account memiliki akses ke spreadsheet.

### 10.4 Google OAuth

- [ ] OAuth Consent Screen dikonfigurasi.
- [ ] OAuth Client ID tersedia.
- [ ] Authorized Origins dikonfigurasi.
- [ ] Redirect URI dikonfigurasi.

### 10.5 Aplikasi

- [ ] Environment Variables tersedia.
- [ ] Koneksi Google Sheets dapat digunakan.
- [ ] Header database telah diverifikasi.
- [ ] Informasi sekolah dapat diinisialisasi.
- [ ] Autentikasi dapat diuji.

### 10.6 Deployment

- [ ] Repository GitHub tersedia.
- [ ] Tidak ada kredensial rahasia di repository.
- [ ] Proyek terhubung ke Vercel.
- [ ] Environment Variables produksi dikonfigurasi.
- [ ] Deployment berhasil.

---

## 11. Urutan Pelaksanaan

Urutan persiapan sistem:

1. Menyiapkan lingkungan pengembangan.
2. Membuat Google Cloud Project.
3. Mengaktifkan Google Sheets API.
4. Membuat Service Account.
5. Memberikan akses Service Account ke spreadsheet.
6. Membuat spreadsheet database.
7. Membuat sebelas worksheet.
8. Memastikan header sesuai struktur database.
9. Mengonfigurasi Google OAuth.
10. Mengatur Environment Variables.
11. Menjalankan aplikasi secara lokal.
12. Melakukan pemeriksaan database.
13. Menginisialisasi informasi sekolah.
14. Melakukan pengujian aplikasi.
15. Menghubungkan repository ke Vercel.
16. Mengatur Environment Variables produksi.
17. Melakukan deployment.

Untuk spreadsheet lama, lakukan backup dan migrasi terencana sebelum aplikasi menggunakan struktur database terbaru.

---

## 12. Dokumen Acuan

Dokumen berikut menjadi acuan konfigurasi dan pengembangan:

| Dokumen                  | Keterangan                         |
| ------------------------ | ---------------------------------- |
| `PRD.md`                 | Kebutuhan dan ruang lingkup sistem |
| `ARCHITECTURE.md`        | Arsitektur aplikasi                |
| `DATABASE.md`            | Struktur dan aturan database       |
| `IMPLEMENTATION_PLAN.md` | Tahapan implementasi               |
| `SETUP_GUIDE.md`         | Panduan persiapan dan konfigurasi  |

Jika terdapat perbedaan antara panduan setup dan struktur database, gunakan `DATABASE.md` serta implementasi aktual sebagai acuan teknis.

---

**Akhir Dokumen SETUP_GUIDE.md**
