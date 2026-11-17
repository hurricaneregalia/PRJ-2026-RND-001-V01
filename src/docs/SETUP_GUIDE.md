# SETUP_GUIDE.md

# Sistem Absensi Sekolah Terpusat

**Versi:** 1.0  
**Tanggal:** 17 November 2026  
**Status:** Panduan persiapan lingkungan

## 1. Tujuan

Dokumen ini menjadi panduan persiapan layanan dan akun yang diperlukan untuk membangun serta menjalankan aplikasi.

Layanan yang digunakan:

1. Google Cloud.
2. Google Sheets.
3. Google Service Account.
4. Google OAuth.
5. GitHub.
6. Vercel.

Tidak diperlukan server VPS atau pengelolaan server secara manual.

---

## 2. Persiapan Google Account

Siapkan akun Google yang akan digunakan sebagai pemilik layanan proyek.

Akun ini digunakan untuk:

- Mengelola Google Cloud Project.
- Membuat Google Spreadsheet.
- Mengatur Service Account.
- Mengatur OAuth.
- Mengelola akses spreadsheet.

Sebaiknya gunakan akun sekolah atau akun khusus proyek, bukan akun pribadi yang digunakan untuk kebutuhan sehari-hari.

---

## 3. Google Cloud Project

### 3.1 Membuat Project

1. Buka Google Cloud Console.
2. Login menggunakan akun Google proyek.
3. Buat project baru.
4. Gunakan nama:

`school-attendance-system`

5. Simpan project ID yang diberikan Google.

Project ID digunakan untuk mengidentifikasi konfigurasi layanan Google Cloud.

### 3.2 Mengaktifkan Google Sheets API

1. Buka Google Cloud Console.
2. Pilih project yang telah dibuat.
3. Buka API & Services.
4. Pilih Library.
5. Cari Google Sheets API.
6. Klik Enable.

Google Sheets API diperlukan agar backend Next.js dapat membaca dan menulis spreadsheet.

---

## 4. Membuat Google Spreadsheet

### 4.1 Membuat Spreadsheet

1. Buka Google Sheets.
2. Buat spreadsheet baru.
3. Berikan nama:

`School Attendance Database`

4. Salin Spreadsheet ID dari URL.

Contoh URL:

`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

Bagian di antara `/d/` dan `/edit` merupakan Spreadsheet ID.

### 4.2 Membuat Worksheet

Buat 12 worksheet berikut:

1. `Users`
2. `Students`
3. `Academic_Years`
4. `Classes`
5. `Class_Members`
6. `Teacher_Assignments`
7. `Attendance_Sessions`
8. `Attendance_Records`
9. `Attendance_Audit_Logs`
10. `Student_Contact_Logs`
11. `School_Information`
12. `Administrative_Audit_Logs`

Baris pertama setiap worksheet berisi nama kolom persis seperti yang tercantum dalam `DATABASE.md`.

Jangan mengubah nama kolom tanpa memperbarui dokumentasi dan mendapatkan persetujuan.

---

## 5. Membuat Google Service Account

Service Account digunakan khusus oleh backend untuk mengakses Google Sheets.

### 5.1 Membuat Service Account

1. Buka Google Cloud Console.
2. Pilih project.
3. Buka IAM & Admin.
4. Pilih Service Accounts.
5. Klik Create Service Account.
6. Gunakan nama:

`school-attendance-backend`

7. Selesaikan proses pembuatan.

### 5.2 Membuat Credentials

1. Buka Service Account yang telah dibuat.
2. Masuk ke bagian Keys.
3. Buat key baru dengan format JSON.
4. Unduh file credentials.

File JSON berisi informasi sensitif.

**Jangan:**

- Mengunggah file credentials ke GitHub.
- Menaruh file di folder `public`.
- Mengirimkan isi private key ke frontend.
- Membagikan credentials melalui percakapan atau pesan publik.

Credentials hanya boleh digunakan oleh backend.

### 5.3 Memberikan Akses Spreadsheet

1. Buka Google Spreadsheet.
2. Klik Share.
3. Masukkan email Service Account.
4. Berikan akses Editor.
5. Simpan perubahan.

Service Account sekarang dapat membaca dan mengubah spreadsheet.

---

## 6. Google OAuth

Google OAuth digunakan untuk login administrator dan guru.

Google OAuth berbeda dari Service Account.

- OAuth mengidentifikasi pengguna manusia.
- Service Account memberikan akses backend ke Google Sheets.

Keduanya memiliki fungsi dan credentials berbeda.

### 6.1 Konfigurasi OAuth Consent Screen

1. Buka Google Cloud Console.
2. Pilih Google Auth Platform.
3. Konfigurasikan branding aplikasi.
4. Masukkan nama aplikasi:

`School Attendance System`

5. Masukkan email dukungan.
6. Atur audience sesuai kebutuhan deployment.
7. Tambahkan akun pengujian jika aplikasi masih dalam mode pengujian.

Untuk penggunaan produksi, konfigurasi audience dan verifikasi harus disesuaikan dengan kebijakan Google dan kebutuhan akun sekolah.

### 6.2 Membuat OAuth Client

1. Buka Google Cloud Console.
2. Masuk ke Clients.
3. Buat OAuth Client ID.
4. Pilih Web Application.
5. Masukkan nama:

`School Attendance Web`

6. Tambahkan Authorized JavaScript Origins.

Untuk pengembangan lokal:

`http://localhost:3000`

Untuk produksi, gunakan domain Vercel yang sebenarnya.

### 6.3 Authorized Redirect URI

Untuk Auth.js dengan Google Provider, gunakan callback URI:

`http://localhost:3000/api/auth/callback/google`

Untuk produksi:

`https://DOMAIN-VERCEL/api/auth/callback/google`

Pastikan domain dan redirect URI sesuai dengan konfigurasi aplikasi.

### 6.4 Menyimpan OAuth Credentials

Simpan:

- Google Client ID.
- Google Client Secret.

Keduanya akan dimasukkan ke environment variables.

Jangan menaruh credentials di source code.

---

## 7. GitHub

GitHub digunakan untuk menyimpan source code dan menghubungkan repository ke Vercel.

### 7.1 Membuat Repository

1. Login ke GitHub.
2. Buat repository baru.
3. Gunakan nama:

`school-attendance-system`

4. Pilih Private.
5. Jangan mengunggah credentials atau file rahasia.
6. Hubungkan repository dengan proyek lokal.

### 7.2 File yang Tidak Boleh Diunggah

Pastikan `.gitignore` mengecualikan:

- `node_modules`
- `.next`
- `.env`
- `.env.local`
- File credentials Google.
- File hasil build.
- File rahasia lainnya.

File `.env.example` boleh diunggah selama hanya berisi nama variabel tanpa nilai rahasia.

---

## 8. Vercel

Vercel digunakan untuk hosting dan deployment.

### 8.1 Menghubungkan GitHub

1. Login ke Vercel.
2. Hubungkan akun GitHub.
3. Pilih Add New Project.
4. Import repository `school-attendance-system`.
5. Pilih framework Next.js.
6. Periksa konfigurasi build.
7. Deploy.

### 8.2 Environment Variables

Masukkan variabel berikut di Vercel:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=

NEXT_PUBLIC_APP_URL=
```

Nilai diisi berdasarkan credentials dan konfigurasi yang telah dibuat.

Perhatikan:

- Private key harus disimpan dengan format yang dapat dibaca oleh aplikasi.
- Environment variables tidak boleh ditampilkan kepada browser.
- Setelah mengubah environment variables, lakukan deployment ulang agar konfigurasi baru digunakan.

### 8.3 Domain

Vercel menyediakan domain default untuk aplikasi.

Contoh:

`school-attendance-system.vercel.app`

Domain dapat digunakan untuk pengujian dan penggunaan awal.

Domain khusus dapat ditambahkan kemudian jika diperlukan.

### 8.4 Deployment Otomatis

Alur deployment:

1. Perubahan kode disimpan.
2. Kode di-push ke GitHub.
3. Vercel mendeteksi perubahan.
4. Vercel menjalankan build.
5. Aplikasi diperbarui jika build berhasil.

Tidak diperlukan konfigurasi CI/CD tambahan untuk alur dasar ini.

---

## 9. Konfigurasi Lokal

Setelah layanan eksternal siap, buat file `.env.local` di root proyek.

Isi menggunakan credentials yang telah dibuat.

Contoh:

```env
AUTH_SECRET=isi_secret_acak
AUTH_GOOGLE_ID=isi_google_client_id
AUTH_GOOGLE_SECRET=isi_google_client_secret

GOOGLE_SERVICE_ACCOUNT_EMAIL=isi_email_service_account
GOOGLE_PRIVATE_KEY="isi_private_key"
GOOGLE_SHEETS_SPREADSHEET_ID=isi_spreadsheet_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

File `.env.local` tidak boleh diunggah ke GitHub.

---

## 10. Checklist Persiapan

### Google Cloud

- [ ] Akun Google proyek tersedia.
- [ ] Google Cloud Project dibuat.
- [ ] Google Sheets API aktif.
- [ ] Service Account dibuat.
- [ ] Credentials Service Account tersedia dengan aman.

### Google Sheets

- [ ] Spreadsheet dibuat.
- [ ] Spreadsheet ID tersedia.
- [ ] Dua belas worksheet dibuat.
- [ ] Header kolom sesuai DATABASE.md.
- [ ] Service Account memiliki akses Editor.

### Google OAuth

- [ ] OAuth Consent Screen dikonfigurasi.
- [ ] OAuth Client dibuat.
- [ ] Client ID tersedia.
- [ ] Client Secret tersedia.
- [ ] Redirect URI lokal dikonfigurasi.
- [ ] Redirect URI produksi dikonfigurasi saat domain tersedia.

### GitHub

- [ ] Repository dibuat.
- [ ] Repository bersifat Private.
- [ ] `.gitignore` tersedia.
- [ ] Credentials tidak masuk repository.

### Vercel

- [ ] Akun Vercel tersedia.
- [ ] GitHub terhubung.
- [ ] Repository di-import.
- [ ] Environment variables dikonfigurasi saat diperlukan.
- [ ] Domain tersedia.

---

## 11. Urutan Pelaksanaan

Persiapan dapat dilakukan dengan urutan berikut:

1. Siapkan akun Google.
2. Buat Google Cloud Project.
3. Aktifkan Google Sheets API.
4. Buat Google Spreadsheet.
5. Buat dua belas worksheet.
6. Buat Service Account.
7. Berikan akses spreadsheet kepada Service Account.
8. Konfigurasikan Google OAuth.
9. Buat repository GitHub.
10. Buat akun Vercel dan hubungkan repository.
11. Siapkan environment variables.
12. Mulai implementasi aplikasi.

Tidak semua konfigurasi harus diselesaikan sebelum kode dibuat. Konfigurasi Vercel dan redirect URI produksi dapat diselesaikan ketika aplikasi sudah siap untuk deployment.

## 12. Keamanan dan Pengelolaan Credentials

1. Jangan pernah menyimpan secret di GitHub.
2. Jangan pernah mengirim private key melalui frontend.
3. Batasi akses Google Spreadsheet.
4. Batasi hak akses Service Account pada resource yang diperlukan.
5. Gunakan akun administrator khusus.
6. Lakukan rotasi credentials jika terjadi kebocoran.
7. Jangan menggunakan credentials produksi untuk pengujian yang tidak diperlukan.
8. Pastikan environment variables produksi hanya tersedia pada lingkungan yang sesuai.

---

## 13. Status Dokumen

`SETUP_GUIDE.md` versi 1.0 menjadi panduan persiapan layanan eksternal sebelum implementasi.

Dokumen ini dapat diperbarui jika terdapat perubahan konfigurasi Google, GitHub, atau Vercel tanpa mengubah struktur database dan aturan bisnis proyek.
