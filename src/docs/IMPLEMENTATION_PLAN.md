# IMPLEMENTATION PLAN

## SISTEM ABSENSI SEKOLAH TERPUSAT

**Project ID:** PRJ-2026-RND-001-V01  
**Versi:** 2.0  
**Tanggal:** 19 November 2026  
**Status:** Tahap 6 sedang berjalan

---

# 1. TUJUAN

Dokumen ini menjadi panduan pelaksanaan pengembangan Sistem Absensi Sekolah Terpusat.

Implementasi dilakukan secara bertahap untuk memastikan:

1. Setiap modul memiliki fungsi yang jelas.
2. Relasi data konsisten.
3. Hak akses diterapkan di backend.
4. Perubahan data tercatat dengan benar.
5. Aplikasi dapat dikembangkan dan dipelihara.
6. Database awal dapat dimigrasikan ke PostgreSQL.

# 2. TEKNOLOGI

| Komponen            | Teknologi             |
| ------------------- | --------------------- |
| Framework           | Next.js 16 App Router |
| Bahasa              | JavaScript            |
| Authentication      | Auth.js v5            |
| OAuth               | Google OAuth          |
| Database awal       | Google Sheets         |
| Database API        | Google Sheets API     |
| Hosting             | Vercel                |
| Repository          | GitHub                |
| Database berikutnya | PostgreSQL            |

# 3. ARSITEKTUR

Alur aplikasi:

Frontend
↓
Next.js Server Actions / Server Components
↓
Authentication & Authorization
↓
Service Layer
↓
Repository Layer
↓
Google Sheets API

Ketentuan:

- Frontend tidak mengakses Google Sheets secara langsung.
- Business logic berada di Service Layer.
- Operasi database berada di Repository Layer.
- Semua validasi hak akses dilakukan di backend.
- Kredensial database hanya tersedia di server.
- Repository dirancang agar dapat diganti dengan adapter PostgreSQL.

# 4. STRUKTUR DATABASE

Sistem menggunakan 11 worksheet:

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

Tidak menggunakan worksheet Academic_Years.

Tahun ajaran dihitung otomatis berdasarkan tanggal absensi.

Format identifier:
YYYY/YYYY

Periode:
1 Juli sampai 30 Juni tahun berikutnya.

Identifier tahun ajaran disimpan pada Attendance_Sessions.academic_year_id.

# 5. TAHAP IMPLEMENTASI

## TAHAP 1 — PERSIAPAN PROYEK

Status: SELESAI

Pekerjaan:

- Membuat repository GitHub.
- Membuat proyek Next.js.
- Mengatur JavaScript.
- Mengatur struktur direktori.
- Menyiapkan konfigurasi lingkungan.
- Menyiapkan dependensi awal.
- Menyiapkan konfigurasi deployment.

Kriteria selesai:

- Proyek dapat dijalankan.
- Struktur direktori tersedia.
- Repository GitHub berfungsi.

## TAHAP 2 — PERSIAPAN GOOGLE SHEETS

Status: SELESAI

Pekerjaan:

- Membuat Google Spreadsheet.
- Menyiapkan Service Account.
- Mengaktifkan Google Sheets API.
- Memberikan akses spreadsheet kepada Service Account.
- Menyiapkan environment variables.
- Membuat koneksi Google Sheets dari backend.

Kriteria selesai:

- Backend dapat mengakses spreadsheet.
- Kredensial tidak terekspos ke frontend.
- Koneksi menggunakan Service Account.

## TAHAP 3 — FONDASI BACKEND DAN REPOSITORY

Status: SELESAI

Pekerjaan:

- Membuat konfigurasi database.
- Membuat Google Sheets client.
- Membuat database schema.
- Membuat repository dasar.
- Membuat service dasar.
- Membuat validasi header worksheet.
- Membuat administrative audit repository.
- Menyiapkan pemisahan Service dan Repository Layer.

Kriteria selesai:

- Struktur backend tersedia.
- Repository dapat mengakses Google Sheets.
- Validasi header tersedia.
- Audit administrasi memiliki fondasi.

## TAHAP 4 — AUTHENTICATION DAN AUTHORIZATION

Status: SELESAI

Pekerjaan:

- Mengintegrasikan Auth.js v5.
- Mengatur Google OAuth.
- Membuat konfigurasi session.
- Menggunakan Google sub sebagai identitas stabil.
- Membuat middleware atau pemeriksaan akses sesuai kebutuhan.
- Membuat fungsi requireRole.
- Memeriksa status pengguna.
- Membatasi akses berdasarkan role.

Kriteria selesai:

- Administrator dapat login.
- Guru dapat login.
- Pengguna tidak terdaftar ditolak.
- Pengguna inactive ditolak.
- Akses halaman dilindungi backend.

## TAHAP 5 — MANAJEMEN PENGGUNA

Status: SELESAI

Pekerjaan:

- Membuat konfigurasi Users.
- Membuat user repository.
- Membuat user service.
- Membuat halaman manajemen pengguna.
- Membuat Server Actions.
- Menambahkan pengguna.
- Mengubah informasi pengguna.
- Mengaktifkan dan menonaktifkan pengguna.
- Mengatur role Administrator dan Guru.
- Mencatat perubahan melalui Administrative_Audit_Logs.

Kriteria selesai:

- Administrator dapat mengelola pengguna.
- Pengguna tidak dapat dihapus permanen.
- Validasi role dan status berjalan.
- Audit administrasi tersimpan.

## TAHAP 6 — MANAJEMEN KELAS DAN PENUGASAN GURU

Status: SEDANG BERJALAN

### 6.1 Manajemen Kelas

Pekerjaan:

- Membuat konfigurasi Classes.
- Membuat class repository.
- Membuat class service.
- Membuat halaman daftar kelas.
- Membuat halaman detail kelas.
- Membuat Server Actions.
- Menambahkan kelas.
- Mengubah nama kelas.
- Mengaktifkan dan menonaktifkan kelas.
- Mencatat perubahan melalui Administrative_Audit_Logs.

Ketentuan:

- class_id permanen.
- Nama kelas unik.
- Kelas tidak terikat tahun ajaran.
- Kelas dapat digunakan lintas tahun ajaran.
- Kelas tidak dihapus permanen.

### 6.2 Penugasan Guru

Pekerjaan:

- Membuat konfigurasi Teacher_Assignments.
- Membuat teacher assignment repository.
- Membuat teacher assignment service.
- Membuat halaman penugasan guru.
- Membuat Server Actions.
- Menambahkan penugasan guru.
- Mengakhiri penugasan guru.
- Menampilkan riwayat penugasan.
- Mencatat perubahan melalui Administrative_Audit_Logs.

Ketentuan:

1. Satu kelas hanya memiliki satu guru penanggung jawab pada waktu yang sama.
2. Satu guru maksimal menangani dua kelas secara bersamaan.
3. Guru inactive tidak dapat menerima penugasan.
4. Kelas inactive tidak dapat menerima penugasan baru.
5. Penugasan menggunakan effective_from dan effective_to.
6. Penugasan tidak dibatasi tahun ajaran.
7. Riwayat penugasan tidak boleh ditimpa.

### 6.3 Kriteria Selesai

- Administrator dapat mengelola kelas.
- Administrator dapat mengelola penugasan guru.
- Validasi maksimal dua kelas per guru berjalan.
- Validasi satu guru per kelas berjalan.
- Riwayat penugasan tersimpan.
- Audit administrasi tersimpan.
- Halaman dapat digunakan melalui smartphone.

## TAHAP 7 — MANAJEMEN SISWA DAN KEANGGOTAAN KELAS

Status: BELUM DIMULAI

### 7.1 Manajemen Siswa

Pekerjaan:

- Membuat konfigurasi Students.
- Membuat student repository.
- Membuat student service.
- Membuat halaman daftar siswa.
- Membuat halaman detail siswa.
- Membuat Server Actions.
- Menambahkan siswa.
- Mengubah data siswa.
- Mengaktifkan dan menonaktifkan siswa.
- Mengubah status siswa.
- Mengelola informasi orang tua.
- Mencatat riwayat perubahan kontak.

Ketentuan:

- student_id permanen.
- student_number opsional.
- Data siswa tidak dihapus permanen.
- Satu nomor WhatsApp dapat digunakan beberapa siswa.

### 7.2 Keanggotaan Kelas

Pekerjaan:

- Membuat konfigurasi Class_Members.
- Membuat class member repository.
- Membuat class member service.
- Membuat pengelolaan keanggotaan siswa.
- Membuat perpindahan siswa.
- Membuat proses kenaikan kelas.
- Membuat preview perubahan kelas.
- Membuat konfirmasi perubahan.
- Mencatat audit administrasi.

Ketentuan:

- Menggunakan effective_from dan effective_to.
- Riwayat keanggotaan dipertahankan.
- Keanggotaan tidak boleh bertumpang tindih.
- Kenaikan kelas tidak mengubah student_id.
- Kelas dapat digunakan lintas tahun ajaran.

### 7.3 Kriteria Selesai

- Administrator dapat mengelola siswa.
- Administrator dapat mengelola keanggotaan kelas.
- Perpindahan kelas berjalan.
- Kenaikan kelas berjalan.
- Riwayat keanggotaan tersimpan.
- Validasi effective dates berjalan.
- Audit administrasi tersimpan.

## TAHAP 8 — MODUL ABSENSI DAN AUDIT

Status: BELUM DIMULAI

### 8.1 Perhitungan Tahun Ajaran

Pekerjaan:

- Membuat fungsi perhitungan tahun ajaran.
- Menggunakan zona waktu Asia/Jakarta.
- Menghitung periode 1 Juli sampai 30 Juni.
- Menghasilkan identifier YYYY/YYYY.
- Menghitung berdasarkan attendance_date.

Ketentuan:

- Tidak ada tabel Academic_Years.
- Tidak ada pengelolaan tahun ajaran manual.
- Riwayat tahun ajaran tersimpan pada sesi absensi.

### 8.2 Pembuatan Absensi

Pekerjaan:

- Membuat konfigurasi Attendance_Sessions.
- Membuat konfigurasi Attendance_Records.
- Membuat attendance session repository.
- Membuat attendance record repository.
- Membuat attendance service.
- Membuat halaman absensi guru.
- Membuat formulir absensi.
- Membuat daftar siswa berdasarkan keanggotaan kelas.
- Menyimpan status kehadiran.
- Menyimpan lokasi pembelajaran.
- Menyimpan materi pelajaran.

Ketentuan:

1. Guru hanya dapat membuat absensi untuk kelas yang ditugaskan kepadanya.
2. Tanggal absensi ditentukan backend.
3. Zona waktu menggunakan Asia/Jakarta.
4. Satu guru dan kelas maksimal memiliki satu sesi dalam satu minggu kalender.
5. Minggu dihitung Senin sampai Minggu.
6. Jadwal dapat digeser berdasarkan kesepakatan.
7. Absensi dibuat pada tanggal pertemuan aktual.
8. Semua siswa yang menjadi anggota kelas pada tanggal tersebut menjadi dasar absensi.
9. Status default siswa adalah Hadir.
10. Tidak ada sesi kedua untuk kombinasi guru dan kelas dalam minggu yang sama.

### 8.3 Lokasi dan Materi

Pekerjaan:

- Menyimpan location_name.
- Menyimpan location_note.
- Menyimpan lesson_material.
- Menampilkan informasi lokasi.
- Menampilkan materi pembelajaran.
- Mengizinkan perubahan setelah sesi dibuat.

### 8.4 Pengeditan Absensi

Pekerjaan:

- Mengubah status siswa.
- Mengoreksi status berkali-kali.
- Mengubah lokasi.
- Mengubah keterangan lokasi.
- Mengubah materi pembelajaran.
- Membatasi akses guru pada sesi miliknya.
- Memberikan akses administratif sesuai role.

### 8.5 Audit Absensi

Pekerjaan:

- Membuat attendance audit repository.
- Membuat attendance audit service.
- Mencatat perubahan status.
- Mencatat perubahan lokasi.
- Mencatat perubahan materi.
- Mencatat penghapusan sesi.
- Menyimpan data lama dan baru.
- Menyimpan actor_user_id.
- Menyimpan alasan perubahan sesuai aturan.

Audit harus tersimpan sebelum perubahan atau penghapusan dinyatakan berhasil.

### 8.6 Kriteria Selesai

- Guru dapat membuat absensi.
- Validasi satu sesi per minggu berjalan.
- Tahun ajaran dihitung otomatis.
- Lokasi tersimpan.
- Materi tersimpan.
- Koreksi status berjalan.
- Audit seluruh perubahan berjalan.
- Penghapusan mengikuti prosedur.
- Hak akses guru dan administrator benar.

## TAHAP 9 — HALAMAN PUBLIK, LAPORAN, DAN WHATSAPP

Status: BELUM DIMULAI

### 9.1 Halaman Publik

Pekerjaan:

- Membuat halaman pencarian siswa.
- Membuat pencarian berdasarkan nama.
- Menampilkan hasil nama yang sama.
- Menampilkan riwayat absensi.
- Menampilkan rekap kehadiran.
- Menampilkan filter periode.
- Menampilkan filter tahun ajaran.
- Mengatur informasi yang boleh diakses publik.

Ketentuan:

- Tidak memerlukan login.
- Tidak menampilkan nomor WhatsApp.
- Tidak menampilkan informasi sensitif.
- Riwayat siswa graduated dan transferred tetap dapat diakses sesuai kebijakan publikasi.

### 9.2 Daftar Perhatian Kehadiran

Pekerjaan:

- Membuat daftar siswa dengan Alpa berulang.
- Menghitung minimal tiga Alpa dalam 30 hari.
- Menghubungkan daftar dengan kelas guru.
- Menyiapkan laporan siswa.

### 9.3 WhatsApp

Pekerjaan:

- Membuat template pesan.
- Menggunakan sapaan berdasarkan hubungan orang tua.
- Menyertakan tautan publik siswa.
- Membuka WhatsApp dengan pesan yang telah disiapkan.
- Mencatat aktivitas pada Student_Contact_Logs.

Pengiriman pesan dilakukan secara manual oleh guru.

### 9.4 Dashboard dan Statistik

Pekerjaan:

- Dashboard administrator.
- Dashboard guru.
- Grafik komposisi kehadiran.
- Grafik tren kehadiran.
- Perbandingan kelas.
- Filter periode.
- Filter tahun ajaran.

### 9.5 Kriteria Selesai

- Halaman publik dapat digunakan.
- Informasi sensitif tidak bocor.
- Pencarian siswa berjalan.
- Rekap kehadiran benar.
- Daftar perhatian kehadiran benar.
- Persiapan WhatsApp berjalan.
- Dashboard administrator berjalan.
- Dashboard guru berjalan.
- Statistik dapat difilter berdasarkan tahun ajaran.

## TAHAP 10 — PENGUJIAN AKHIR, FINALISASI, DAN DEPLOYMENT

Status: BELUM DIMULAI

### 10.1 Pemeriksaan Database

Pekerjaan:

- Memeriksa 11 worksheet.
- Memeriksa header.
- Memeriksa primary key.
- Memeriksa relasi.
- Memeriksa data lama.
- Menyusun migrasi spreadsheet secara aman.

Perubahan fisik Google Sheets hanya dilakukan setelah seluruh struktur kode dan rencana migrasi siap.

### 10.2 Pengujian

Pekerjaan:

- Unit testing.
- Integration testing.
- End-to-end testing.
- Regression testing.
- Pengujian hak akses.
- Pengujian validasi.
- Pengujian audit.
- Pengujian integritas data.
- Pengujian mobile.

### 10.3 Keamanan

Pekerjaan:

- Memeriksa akses administrator.
- Memeriksa akses guru.
- Memeriksa akses publik.
- Memeriksa perlindungan kredensial.
- Memeriksa validasi backend.
- Memeriksa audit log.
- Memeriksa kemungkinan akses data lintas kelas.

### 10.4 Backup dan Pemulihan

Pekerjaan:

- Backup spreadsheet.
- Menguji pemulihan data.
- Memvalidasi hasil pemulihan.
- Menyusun prosedur backup rutin.

### 10.5 Finalisasi

Pekerjaan:

- Memeriksa konsistensi dokumentasi.
- Memeriksa seluruh modul.
- Memeriksa error build.
- Memeriksa konfigurasi environment.
- Menyusun catatan rilis.

### 10.6 Deployment

Pekerjaan:

- Menghubungkan GitHub dengan Vercel.
- Mengatur environment variables.
- Melakukan production build.
- Melakukan deployment.
- Menguji aplikasi production.
- Memeriksa log deployment.

### 10.7 Kriteria Selesai

- Build berhasil.
- Seluruh fitur utama berjalan.
- Hak akses benar.
- Database konsisten.
- Audit berfungsi.
- Backup dan pemulihan teruji.
- Aplikasi production dapat digunakan.

# 6. KEBIJAKAN PENGEMBANGAN

1. Kerjakan satu tahap sampai selesai sebelum berpindah.
2. Jangan mengubah aturan bisnis tanpa persetujuan.
3. Jangan menambah tabel tanpa persetujuan.
4. Jangan menghapus riwayat data.
5. Jangan melakukan perubahan database produksi tanpa backup.
6. Jangan melakukan commit sebelum tahap terkait selesai.
7. Berikan file lengkap ketika diperlukan penggantian kode.
8. Hindari pemeriksaan file yang sama berulang kali tanpa alasan teknis.
9. Utamakan fungsi sebelum styling.
10. Pertahankan konsistensi PRD, DATABASE.md, dan implementasi kode.

# 7. STATUS PROYEK

| Tahap                               | Status          |
| ----------------------------------- | --------------- |
| 1. Persiapan Proyek                 | Selesai         |
| 2. Persiapan Google Sheets          | Selesai         |
| 3. Fondasi Backend dan Repository   | Selesai         |
| 4. Authentication dan Authorization | Selesai         |
| 5. Manajemen Pengguna               | Selesai         |
| 6. Kelas dan Penugasan Guru         | Sedang berjalan |
| 7. Siswa dan Keanggotaan Kelas      | Belum dimulai   |
| 8. Absensi dan Audit                | Belum dimulai   |
| 9. Publik, Laporan, WhatsApp        | Belum dimulai   |
| 10. Pengujian dan Deployment        | Belum dimulai   |

Status ini merupakan catatan progres pada tanggal dokumen dibuat dan harus diperbarui ketika tahap berubah.

# 8. DOKUMEN ACUAN

Dokumen implementasi harus konsisten dengan:

- PRD.md
- DATABASE.md
- ARCHITECTURE.md

Jika terdapat konflik, keputusan bisnis terbaru yang telah disetujui menjadi acuan. Perubahan harus diselaraskan pada seluruh dokumen terkait.

---

**Akhir Dokumen**
