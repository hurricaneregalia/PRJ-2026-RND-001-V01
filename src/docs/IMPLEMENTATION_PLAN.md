# IMPLEMENTATION_PLAN.md

# Sistem Absensi Sekolah Terpusat

**Versi:** 1.0  
**Tanggal:** 17 November 2026  
**Status:** Rencana implementasi

## 1. Tujuan

Dokumen ini menjadi panduan pelaksanaan teknis berdasarkan tiga dokumen utama:

1. `PRD.md`
2. `DATABASE.md`
3. `ARCHITECTURE.md`

Implementasi dilakukan secara bertahap. Setiap tahap harus selesai dan diuji sebelum melanjutkan ke tahap berikutnya.

Prinsip utama:

- Fungsi didahulukan daripada styling.
- Tidak menggunakan custom CSS, Tailwind CSS, daisyUI, React Icons, atau Lenis sebelum ada persetujuan.
- Tidak menambahkan tabel database.
- Tidak mengubah aturan bisnis yang telah disepakati.
- Menggunakan JavaScript.
- Mengutamakan mobile-first.
- Menggunakan Google Sheets sebagai database awal.
- Deployment menggunakan GitHub dan Vercel.

---

## 2. Tahapan Implementasi

### Tahap 1 — Persiapan Proyek

**Pekerjaan:**

- Membuat repository GitHub.
- Membuat proyek Next.js 16.
- Mengaktifkan App Router.
- Menggunakan JavaScript.
- Menyiapkan struktur folder.
- Membuat `.env.example`.
- Menyiapkan `.gitignore`.
- Menjalankan aplikasi secara lokal.

**Hasil:**

- Proyek Next.js berjalan.
- Repository siap digunakan.
- Struktur dasar tersedia.

**Kriteria selesai:**

- Aplikasi berhasil dijalankan.
- Tidak ada error konfigurasi.
- Kode berhasil di-push ke GitHub.

### Tahap 2 — Integrasi Google Sheets

**Pekerjaan:**

- Membuat Google Spreadsheet.
- Membuat 12 worksheet.
- Menentukan header setiap worksheet sesuai `DATABASE.md`.
- Menyiapkan Google Service Account.
- Mengintegrasikan Google Sheets API.
- Membuat fungsi membaca dan menulis data.
- Membuat fungsi pencarian berdasarkan ID.
- Membuat validasi ID dan relasi.
- Menyiapkan mekanisme pengamanan operasi multi-sheet.

**Hasil:**

- Backend dapat membaca dan menulis seluruh 12 worksheet.

**Kriteria selesai:**

- Semua worksheet dapat diakses backend.
- Data dapat ditambah, dibaca, diperbarui, dan diambil berdasarkan ID.
- Tidak ada akses database langsung dari browser.
- Validasi dasar berhasil.

### Tahap 3 — Authentication dan Authorization

**Pekerjaan:**

- Mengintegrasikan Auth.js.
- Mengatur Google OAuth.
- Membuat proses bootstrap administrator pertama.
- Menonaktifkan bootstrap setelah administrator pertama dibuat.
- Menghubungkan Google `sub` dengan `auth_user_id`.
- Memeriksa status akun.
- Memuat role dari database.
- Membuat pemeriksaan hak akses.
- Membatasi akses halaman berdasarkan role.

**Hasil:**

- Login administrator dan guru berfungsi.

**Kriteria selesai:**

- Administrator dapat login.
- Guru terdaftar dapat login.
- Akun tidak terdaftar ditolak.
- Akun inactive ditolak.
- Role tidak dapat dimanipulasi melalui browser.
- Halaman internal terlindungi.

### Tahap 4 — Modul Pengguna dan Guru

**Pekerjaan:**

- Menambahkan akun guru.
- Mengedit data guru.
- Mengaktifkan dan menonaktifkan akun.
- Mengelola informasi pengguna.
- Menampilkan daftar guru.
- Mengelola identitas Google OAuth.
- Mencatat perubahan administratif.

**Hasil:**

- Modul pengelolaan pengguna dan guru tersedia.

**Kriteria selesai:**

- Administrator dapat mengelola akun guru.
- Akun inactive tidak dapat digunakan.
- Data guru tidak dapat dihapus permanen.
- Perubahan tercatat di `Administrative_Audit_Logs`.

### Tahap 5 — Modul Tahun Ajaran dan Kelas

**Pekerjaan:**

- Membuat tahun ajaran.
- Mengedit periode tahun ajaran.
- Memvalidasi periode agar tidak bertumpang tindih.
- Menentukan tahun ajaran aktif.
- Mengelola informasi sekolah.
- Membuat kelas.
- Mengedit kelas.
- Mengaktifkan dan menonaktifkan kelas.
- Menyinkronkan status tahun ajaran.

**Hasil:**

- Pengelolaan tahun ajaran dan kelas berfungsi.

**Kriteria selesai:**

- Hanya satu tahun ajaran aktif.
- `School_Information.active_academic_year_id` menjadi sumber kebenaran.
- Periode tahun ajaran tidak bertumpang tindih.
- Nama kelas unik dalam satu tahun ajaran.
- Perubahan administratif tercatat.

### Tahap 6 — Modul Siswa dan Keanggotaan Kelas

**Pekerjaan:**

- Menambah siswa.
- Mengedit data siswa.
- Mengaktifkan dan menonaktifkan siswa.
- Menyimpan informasi orang tua.
- Mengelola keanggotaan siswa dalam kelas.
- Mengelola tanggal efektif keanggotaan.
- Menampilkan riwayat kelas siswa.
- Mencatat perubahan administratif.

**Hasil:**

- Pengelolaan siswa dan keanggotaan kelas berfungsi.

**Kriteria selesai:**

- Siswa memiliki ID permanen.
- Satu siswa tidak memiliki keanggotaan kelas yang bertumpang tindih.
- Informasi orang tua tersimpan dengan benar.
- Data siswa tidak dapat dihapus permanen.

### Tahap 7 — Modul Penugasan Guru

**Pekerjaan:**

- Menugaskan guru ke kelas.
- Mengganti guru penanggung jawab.
- Mengakhiri penugasan.
- Memvalidasi periode efektif.
- Membatasi satu guru maksimal dua kelas aktif.
- Membatasi satu kelas memiliki satu guru aktif.
- Menampilkan daftar guru yang tersedia.
- Menyimpan riwayat penugasan.

**Hasil:**

- Sistem penugasan guru berfungsi.

**Kriteria selesai:**

- Guru maksimal memiliki dua kelas aktif.
- Satu kelas hanya memiliki satu guru penanggung jawab.
- Guru dengan dua kelas aktif tidak muncul dalam pilihan penugasan baru.
- Riwayat penugasan tetap tersedia.

### Tahap 8 — Modul Absensi

**Pekerjaan:**

- Menampilkan kelas yang menjadi tanggung jawab guru.
- Mengambil daftar siswa berdasarkan keanggotaan kelas.
- Membuat sesi absensi.
- Menghasilkan tanggal otomatis dari backend.
- Mengisi status default Hadir.
- Mengubah status menjadi Sakit, Izin, atau Alpa.
- Menyimpan seluruh record dalam satu operasi.
- Mengedit sesi menggunakan `session_id` yang sama.
- Menampilkan riwayat absensi.
- Menerapkan hak akses guru dan administrator.
- Menerapkan penghapusan permanen dengan konfirmasi dan alasan.
- Menyimpan audit UPDATE dan DELETE.

**Hasil:**

- Proses absensi harian berfungsi.

**Kriteria selesai:**

- Satu kelas hanya memiliki satu absensi per hari.
- Guru hanya membuat absensi untuk kelas tanggung jawabnya.
- Guru hanya mengedit atau menghapus sesi yang dibuatnya.
- Administrator dapat mengelola seluruh sesi.
- Audit tersimpan sebelum perubahan atau penghapusan.
- Tidak terjadi penyimpanan sebagian yang tidak konsisten.

### Tahap 9 — Modul Kenaikan Kelas

**Pekerjaan:**

- Memilih tahun ajaran sumber dan tujuan.
- Memilih kelas sumber.
- Menampilkan seluruh siswa.
- Menandai seluruh siswa secara default.
- Memungkinkan administrator mengubah pilihan siswa.
- Memungkinkan perubahan kelas tujuan per siswa.
- Memproses beberapa kelas dalam satu operasi.
- Menutup keanggotaan lama.
- Membuat keanggotaan baru.
- Mempertahankan siswa yang tidak dicentang di tingkat kelas yang sama.
- Menyimpan audit administratif.

**Hasil:**

- Kenaikan kelas massal berfungsi.

**Kriteria selesai:**

- Siswa yang dicentang naik kelas.
- Siswa yang tidak dicentang tetap pada tingkat kelas yang sama.
- Semua siswa menggunakan `student_id` yang sama.
- Perubahan berlangsung konsisten tanpa hasil sebagian.

### Tahap 10 — Dashboard dan Statistik

**Pekerjaan:**

- Membuat dashboard administrator.
- Membuat dashboard guru.
- Menghitung komposisi Hadir, Sakit, Izin, Alpa.
- Menghitung tren kehadiran harian.
- Membuat perbandingan antarkelas untuk administrator.
- Membuat ringkasan per kelas.
- Membatasi data guru berdasarkan penugasan aktif.
- Menggunakan tahun ajaran aktif.

**Hasil:**

- Dashboard dan statistik tersedia.

**Kriteria selesai:**

- Dashboard guru hanya menampilkan kelas tanggung jawabnya.
- Dashboard administrator menampilkan seluruh kelas aktif.
- Statistik berasal dari record absensi tersimpan.
- Hari tanpa sesi absensi tidak dihitung sebagai Alpa.
- Grafik dapat menyesuaikan lebar layar.

### Tahap 11 — Halaman Publik dan WhatsApp

**Pekerjaan halaman publik:**

- Pencarian siswa berdasarkan nama.
- Menampilkan beberapa hasil jika nama sama.
- Menampilkan kelas dan guru penanggung jawab.
- Menampilkan riwayat absensi.
- Memilih periode riwayat.
- Menampilkan ringkasan status kehadiran.
- Membatasi kolom data yang dapat diakses publik.

**Pekerjaan WhatsApp:**

- Menghitung siswa dengan minimal tiga Alpa dalam 30 hari.
- Menampilkan daftar perhatian kehadiran.
- Membuat pesan dengan sapaan sesuai hubungan orang tua.
- Menyertakan tautan publik.
- Membuka WhatsApp untuk pengiriman manual.
- Menyimpan log tindakan.

**Hasil:**

- Halaman publik dan fitur tindak lanjut WhatsApp tersedia.

**Kriteria selesai:**

- Publik tidak perlu login.
- Data pribadi orang tua tidak terekspos.
- Riwayat siswa dapat dicari.
- Pesan WhatsApp tersusun dengan benar.
- Aplikasi tidak mengklaim pesan sudah terkirim tanpa bukti.

### Tahap 12 — Pengujian Akhir dan Deployment

**Pekerjaan:**

- Menguji seluruh alur administrator.
- Menguji seluruh alur guru.
- Menguji akses publik.
- Menguji validasi data.
- Menguji konsistensi relasi.
- Menguji audit.
- Menguji operasi multi-sheet.
- Menguji tampilan mobile.
- Memperbaiki bug.
- Menghubungkan GitHub dengan Vercel.
- Mengatur environment variables produksi.
- Melakukan deployment.

**Hasil:**

- Aplikasi siap digunakan.

**Kriteria selesai:**

- Seluruh fungsi utama berjalan.
- Tidak ada bug kritis.
- Hak akses berjalan sesuai ketentuan.
- Data tersimpan konsisten.
- Aplikasi dapat diakses melalui domain Vercel.

---

## 3. Urutan Ketergantungan Modul

Urutan pengerjaan wajib memperhatikan dependensi berikut:

1. Persiapan proyek.
2. Integrasi Google Sheets.
3. Authentication dan Authorization.
4. Pengelolaan pengguna dan guru.
5. Tahun ajaran dan kelas.
6. Siswa dan keanggotaan kelas.
7. Penugasan guru.
8. Absensi.
9. Kenaikan kelas.
10. Dashboard.
11. Publik dan WhatsApp.
12. Pengujian akhir dan deployment.

Tahapan tertentu dapat memiliki pekerjaan internal paralel, tetapi fitur yang bergantung pada modul sebelumnya tidak boleh difinalisasi sebelum dependensinya tersedia.

## 4. Strategi Pengujian

Setiap tahap memiliki pengujian sesuai fungsi yang dibangun.

Kategori pengujian:

- Functional testing.
- Validation testing.
- Authorization testing.
- Data integrity testing.
- Integration testing.
- Mobile usability testing.
- Deployment testing.

Pengujian harus menggunakan alur normal yang tersedia pada antarmuka pengguna. Pemeriksaan backend juga wajib memastikan request yang tidak sah ditolak.

## 5. Aturan Pengembangan Kode

1. Selesaikan satu modul sebelum berpindah ke modul berikutnya.
2. Jangan menulis seluruh aplikasi sekaligus.
3. Jangan membuat fungsi yang belum dibutuhkan tahap berjalan.
4. Jangan menambahkan dependency tanpa alasan teknis.
5. Jangan menambahkan tabel database tanpa persetujuan.
6. Jangan mengubah nama kolom atau relasi tanpa persetujuan.
7. Gunakan fungsi backend yang dapat digunakan kembali.
8. Pastikan semua operasi penting memiliki validasi.
9. Setiap perubahan kode harus dapat dijelaskan dan diuji.
10. Catat status penyelesaian setiap tahap.

## 6. Estimasi Waktu

Estimasi awal pengerjaan:

| Tahap                        |   Estimasi |
| ---------------------------- | ---------: |
| 1. Persiapan proyek          | 0,5–1 hari |
| 2. Integrasi Google Sheets   |   2–3 hari |
| 3. Authentication            |   1–2 hari |
| 4. Pengguna dan guru         |   1–2 hari |
| 5. Tahun ajaran dan kelas    |   1–2 hari |
| 6. Siswa dan keanggotaan     |   1–2 hari |
| 7. Penugasan guru            |   1–2 hari |
| 8. Absensi                   |   3–4 hari |
| 9. Kenaikan kelas            |   2–3 hari |
| 10. Dashboard                |   2–3 hari |
| 11. Publik dan WhatsApp      |   2–3 hari |
| 12. Pengujian dan deployment |   2–3 hari |

**Total estimasi: 19,5–30 hari kerja.**

Estimasi ini merupakan perkiraan untuk implementasi dan pengujian, bukan jaminan tanggal selesai. Perbaikan bug atau kendala integrasi dapat memengaruhi durasi.

## 7. Status Proyek

| Dokumen                | Status        |
| ---------------------- | ------------- |
| PRD.md                 | Selesai       |
| DATABASE.md            | Selesai       |
| ARCHITECTURE.md        | Selesai       |
| IMPLEMENTATION_PLAN.md | Selesai       |
| Implementasi kode      | Belum dimulai |

Dokumen ini menjadi panduan resmi urutan implementasi proyek.
