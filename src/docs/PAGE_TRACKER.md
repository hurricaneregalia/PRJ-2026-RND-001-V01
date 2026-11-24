# Pelacakan Pembuatan Halaman

Proyek: AI-2026-017 — Aplikasi Absensi Bimbingan Belajar

Legenda: `[x]` sudah dibuat, `[ ]` belum dibuat.

## Login

- [x] Halaman Login

## Admin

### Dashboard

- [x] Ringkasan Kehadiran
- [x] Total Siswa dan Pengajar
- [ ] Jadwal Hari Ini (cancel)

### Manajemen Pengguna

- [x] Data Pengajar
  - [x] Daftar Pengajar
  - [x] Tambah Pengajar
  - [x] Edit Pengajar
  - [x] Detail Pengajar
- [x] Data Siswa
  - [x] Daftar Siswa
  - [x] Tambah Siswa
  - [x] Edit Siswa
  - [x] Detail Siswa

### Manajemen Kelas

- [x] Daftar Kelas
- [x] Tambah Kelas
- [x] Edit Kelas

### Manajemen Jadwal

- [x] Daftar Jadwal
- [x] Tambah Jadwal
- [x] Edit Jadwal

### Manajemen Absensi

- [x] Daftar Absensi
- [x] Detail Absensi
- [x] Edit Status Absensi

### Laporan Absensi

- [x] Dashboard Laporan
- [x] Laporan Kehadiran Siswa
- [x] Laporan Kehadiran Pengajar
- [x] Laporan Aktivitas Kelas
- [x] Laporan Rekap Pembelajaran
- [x] Hubungi Pengajar

### Profil

- [x] Lihat Profil
- [x] Edit Profil
- [ ] Ubah Foto Profil cancel, digabung ke edit profil
- [ ] Ubah Password cancel, akan diganti google auth dan next auth

## Pengajar

### Dashboard

- [x] Ringkasan Kehadiran Kelas
- [ ] Jadwal Mengajar Hari Ini (cancel)

### Kelas Saya

- [ ] Daftar Kelas (dipindah ke http://localhost:3000/pengajar)
- [x] Detail Kelas
  - [x] Daftar Siswa
  - [x] Riwayat Pertemuan

### Jadwal Mengajar

- [ ] Daftar Jadwal (dipindah ke http://localhost:3000/pengajar)
- [ ] Detail Jadwal (dipindah ke http://localhost:3000/pengajar)

### Absensi

- [x] Daftar Sesi Absensi
- [x] Daftar Siswa
- [x] Input Absensi
- [x] Detail Absensi
- [x] Edit Absensi
- [x] Riwayat Absensi
- [ ] Pilih Kelas (dipindah ke http://localhost:3000/pengajar)

### Laporan Absensi

- [x] Rekap Kehadiran Kelas
- [ ] Detail Laporan (dipindah ke http://localhost:3000/pengajar/kelas)

### Profil

- [x] Lihat Profil
- [x] Edit Profil
- [ ] Ubah Foto Profil (dipindah ke http://localhost:3000/pengajar/profil/edit)
- [ ] Ubah Password (cancel, diganti dengan google auth dan next auth nanti)
