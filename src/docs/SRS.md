## AI-2026-017 — Aplikasi Absensi Bimbingan Belajar

| Informasi     | Keterangan                              |
| ------------- | --------------------------------------- |
| Kode proyek   | `AI-2026-017`                           |
| Nama proyek   | Aplikasi Absensi Bimbingan Belajar      |
| Jenis dokumen | Spesifikasi awal / panduan pengembangan |
| Versi         | 1.0                                     |
| Status        | Rancangan awal yang disepakati          |

## 1. Tujuan dan Ruang Lingkup

Aplikasi ini digunakan untuk mengelola data dasar bimbingan belajar dan mencatat kehadiran siswa. Versi awal menggunakan dua role pengguna: **Admin** dan **Pengajar**.

Dokumen ini menjadi acuan awal untuk struktur halaman, navigasi, autentikasi, dan pembatasan akses.

## 2. Role Pengguna

### 2.1 Admin

Admin mengelola seluruh data dan aktivitas aplikasi, termasuk akun pengajar, data siswa, kelas, jadwal, absensi, serta laporan seluruh kelas.

### 2.2 Pengajar

Pengajar mengakses kelas dan jadwal yang menjadi tanggung jawabnya, melakukan absensi, memperbarui status absensi pada kelas sendiri, serta melihat riwayat dan laporan kelas tersebut.

## 3. Matriks Hak Akses

| Fitur / Hak Akses       | Admin       | Pengajar      | Batasan                                                          |
| ----------------------- | ----------- | ------------- | ---------------------------------------------------------------- |
| Login dan logout        | Ya          | Ya            | Akun masing-masing                                               |
| Melihat profil sendiri  | Ya          | Ya            | Hanya profil sendiri                                             |
| Mengubah profil sendiri | Ya          | Ya            | Hanya profil sendiri                                             |
| Mengubah foto profil    | Ya          | Ya            | Hanya foto profil sendiri                                        |
| Mengubah password       | Ya          | Ya            | Password akun sendiri                                            |
| Mengelola akun pengajar | Ya          | Tidak         | Admin dapat menambah, mengubah, dan menghapus/menonaktifkan akun |
| Mengelola data siswa    | Ya          | Tidak         | Pengajar hanya dapat melihat siswa di kelasnya                   |
| Mengelola kelas         | Ya          | Tidak         | Pengajar hanya dapat melihat kelas yang diajar                   |
| Mengelola jadwal        | Ya          | Tidak         | Pengajar hanya dapat melihat jadwal sendiri                      |
| Melakukan absensi       | Ya          | Ya            | Pengajar hanya untuk kelas yang diajar                           |
| Mengubah status absensi | Ya          | Ya            | Pengajar hanya untuk kelas yang diajar                           |
| Menghapus data absensi  | Ya          | Tidak         | Pengajar tidak memiliki akses hapus                              |
| Melihat riwayat absensi | Semua kelas | Kelas sendiri | Data dibatasi berdasarkan penugasan                              |
| Melihat laporan absensi | Semua kelas | Kelas sendiri | Data dibatasi berdasarkan penugasan                              |

## 4. Sitemap

### 4.1 Sitemap Admin

```text
Admin
├── Dashboard
│   ├── Ringkasan Kehadiran
│   ├── Total Siswa dan Pengajar
│   └── Jadwal Hari Ini
├── Manajemen Pengguna
│   ├── Data Pengajar
│   │   ├── Daftar Pengajar
│   │   ├── Tambah Pengajar
│   │   └── Edit Pengajar
│   └── Data Siswa
│       ├── Daftar Siswa
│       ├── Tambah Siswa
│       └── Edit Siswa
├── Manajemen Kelas
│   ├── Daftar Kelas
│   ├── Tambah Kelas
│   └── Edit Kelas
├── Manajemen Jadwal
│   ├── Daftar Jadwal
│   ├── Tambah Jadwal
│   └── Edit Jadwal
├── Manajemen Absensi
│   ├── Daftar Absensi
│   ├── Detail Absensi
│   └── Edit Status Absensi
├── Laporan Absensi
│   ├── Rekap Kehadiran
│   └── Detail Laporan
└── Profil
    ├── Lihat Profil
    ├── Edit Profil
    ├── Ubah Foto Profil
    └── Ubah Password
```

### 4.2 Sitemap Pengajar

```text
Pengajar
├── Dashboard
│   ├── Ringkasan Kehadiran Kelas
│   └── Jadwal Mengajar Hari Ini
├── Kelas Saya
│   ├── Daftar Kelas
│   └── Detail Kelas
│       └── Daftar Siswa
├── Jadwal Mengajar
│   ├── Daftar Jadwal
│   └── Detail Jadwal
├── Absensi
│   ├── Pilih Kelas
│   ├── Daftar Siswa
│   ├── Input Absensi
│   └── Riwayat Absensi
├── Laporan Absensi
│   ├── Rekap Kehadiran Kelas
│   └── Detail Laporan
└── Profil
    ├── Lihat Profil
    ├── Edit Profil
    ├── Ubah Foto Profil
    └── Ubah Password
```

## 5. Aturan Pembatasan Akses

1. Admin dapat mengakses dan mengelola seluruh data aplikasi.
2. Pengajar hanya dapat mengakses kelas, jadwal, siswa, absensi, dan laporan yang terkait dengan kelas yang ditugaskan kepadanya.
3. Pengajar tidak dapat membuat atau menghapus akun pengguna.
4. Pengajar tidak dapat mengubah data kelas maupun jadwal.
5. Pengajar tidak dapat mengubah role atau hak akses akunnya sendiri.
6. Pengajar hanya dapat mengubah profil dan password miliknya sendiri.
7. Perubahan data absensi sebaiknya menyimpan informasi pelaku dan waktu perubahan untuk kebutuhan audit.

## 6. Catatan Pengembangan

Dokumen ini merupakan spesifikasi awal berdasarkan keputusan proyek saat ini, bukan spesifikasi teknis lengkap. Detail seperti metode autentikasi, status absensi yang tersedia, aturan keterlambatan, format laporan, serta teknologi yang digunakan dapat ditentukan pada tahap berikutnya.

Halaman yang telah dibuat dan statusnya dicatat di `src/docs/PAGE_TRACKER.md`.

## 7. Struktur Projek

```text
src
├── app
│   ├── admin
│   │   ├── absensi
│   │   │   ├── [absensiId]
│   │   │   │   ├── edit
│   │   │   │   │   └── page.js
│   │   │   │   └── page.js
│   │   │   └── page.js
│   │   ├── jadwal
│   │   │   ├── [jadwalId]
│   │   │   │   ├── edit
│   │   │   │   │   └── page.js
│   │   │   │   └── page.js
│   │   │   ├── page.js
│   │   │   └── tambah
│   │   │       └── page.js
│   │   ├── kelas
│   │   │   ├── [kelasId]
│   │   │   │   ├── edit
│   │   │   │   │   └── page.js
│   │   │   │   ├── page.js
│   │   │   │   └── tambah-siswa
│   │   │   │       └── page.js
│   │   │   ├── page.js
│   │   │   └── tambah
│   │   │       └── page.js
│   │   ├── laporan
│   │   │   ├── aktivitas-kelas
│   │   │   │   └── page.js
│   │   │   ├── hubungi-pengajar
│   │   │   │   └── [pengajarId]
│   │   │   │       └── page.js
│   │   │   ├── kehadiran-pengajar
│   │   │   │   └── page.js
│   │   │   ├── kehadiran-siswa
│   │   │   │   └── page.js
│   │   │   ├── page.js
│   │   │   └── rekap-pembelajaran
│   │   │       └── page.js
│   │   ├── page.js
│   │   ├── pengajar
│   │   │   ├── [pengajarId]
│   │   │   │   ├── edit
│   │   │   │   │   └── page.js
│   │   │   │   └── page.js
│   │   │   ├── page.js
│   │   │   └── tambah
│   │   │       └── page.js
│   │   ├── profil
│   │   │   └── [profilId]
│   │   │       ├── edit
│   │   │       │   └── page.js
│   │   │       └── page.js
│   │   └── siswa
│   │       ├── [siswaId]
│   │       │   ├── edit
│   │       │   │   └── page.js
│   │       │   └── page.js
│   │       ├── page.js
│   │       └── tambah
│   │           └── page.js
│   ├── api
│   │   └── auth
│   │       └── [...nextauth]
│   │           └── route.js
│   ├── login/
│   │   └── page.js
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── auth.js
├── components
│   ├── common
│   ├── dashboard
│   ├── layout
│   └── ui
├── config
├── docs
│   ├── PAGE_TRACKER.md
│   └── SRS.md
├── hooks
├── lib
└── services
```

---

## 8. Fitur Pemantauan Ketidakhadiran Siswa

- Sistem menghitung jumlah alfa setiap siswa dalam 30 hari terakhir.
- Jika jumlah alfa > 2, siswa masuk daftar "Daftar Tindak Lanjut Ketidakhadiran".
- Tampil: nama siswa, NIS/ID, jumlah alfa, status dihubungi (Belum/Sudah N kali), terakhir dihubungi, tindakan (Tangani/Hubungi).
- Pengajar: tombol "Tangani" → pesan ke WhatsApp siswa.
- Admin: tombol "Hubungi" → pesan ke WhatsApp pengajar penanggung jawab.
- Pengiriman via tautan wa.me; sistem tidak menganggap pesan otomatis terkirim.
- Riwayat komunikasi disimpan di worksheet `riwayat_kontak` (append-only).
- Pemantauan menggunakan worksheet `pemantauan_ketidakhadiran` untuk membedakan kasus lama dan baru; `riwayat_kontak` memiliki `pemantauan_id`.

## 9. Audit Trail

- Perubahan data penting dicatat di worksheet `audit_log` (append-only).
- Setiap catatan berisi pelaku (`user_id`), aksi, tabel, record, data sebelum/sesudah, keterangan, dan waktu.
- Aktivitas dicatat: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, dan perubahan penting lainnya oleh Admin/Pengajar.
- `data_sebelum`/`data_sesudah` hanya menyimpan kolom yang berubah.
- Audit tidak dapat diubah/dihapus melalui aplikasi.
- Tidak menyimpan password, token, private key, atau rahasia lain.
- Disimpan selama mungkin tanpa penghapusan otomatis.

## 10. Riwayat Keanggotaan Kelas

- Worksheet `kelas_siswa` menyimpan riwayat keanggotaan, bukan hanya daftar saat ini.
- Kolom: `kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_mulai`, `tanggal_selesai`, `status_keanggotaan`, `created_at`, `updated_at`.
- Pemindahan kelas menutup keanggotaan lama (`selesai`) dan membuat keanggotaan baru (`aktif`).
- Riwayat lama tidak dihapus.
- Satu siswa hanya boleh memiliki satu kelas aktif pada satu waktu.
- `absensi_detail` tidak memiliki `kelas_id`; `absensi.kelas_id` menjadi referensi kelas historis dan tidak berubah saat siswa pindah kelas.
- Laporan historis tidak berubah akibat pemindahan kelas.

**Akhir Dokumen — AI-2026-017**
