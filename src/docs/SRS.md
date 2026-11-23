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

---

**Akhir Dokumen — AI-2026-017**
