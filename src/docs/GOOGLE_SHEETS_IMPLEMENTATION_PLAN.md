# Rencana Penerapan Struktur Google Spreadsheet — AI-2026-017

Dokumen ini hanya rencana dan dokumentasi. Tidak ada perubahan yang dilakukan pada Google Spreadsheet.

## A. Ringkasan Kondisi Spreadsheet Saat Ini

- Spreadsheet: `PRJ-2026-RND-001-V01-DATABASE`.
- 10 worksheet final sudah diterapkan: `sekolah`, `users`, `siswa`, `kelas`, `kelas_siswa`, `jadwal`, `absensi`, `absensi_detail`, `pemantauan_ketidakhadiran`, `riwayat_kontak`.
- `audit_log` belum diterapkan; rencana ini mencakup penambahannya.
- 11 worksheet lama sudah dihapus; backup lokal tersedia.

## B. Daftar 11 Worksheet Final

1. `sekolah`
2. `users`
3. `siswa`
4. `kelas`
5. `kelas_siswa`
6. `jadwal`
7. `absensi`
8. `absensi_detail`
9. `pemantauan_ketidakhadiran`
10. `riwayat_kontak`
11. `audit_log`

## C. Tabel Header Lengkap (berurutan)

### sekolah
`sekolah_id`, `nama_sekolah`, `alamat`, `no_hp`, `created_at`, `updated_at`

### users
`user_id`, `auth_user_id`, `email`, `name`, `role`, `account_status`, `photo_url`, `created_at`, `updated_at`

### siswa
`siswa_id`, `nama`, `nis`, `jenis_kelamin`, `tanggal_lahir`, `alamat`, `no_hp`, `status`, `created_at`, `updated_at`

### kelas
`kelas_id`, `kode_kelas`, `nama_kelas`, `pengajar_id`, `kapasitas`, `status_kelas`, `created_at`, `updated_at`

### kelas_siswa
`kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_mulai`, `tanggal_selesai`, `status_keanggotaan`, `created_at`, `updated_at`

### jadwal
`jadwal_id`, `kelas_id`, `hari`, `jam_mulai`, `jam_selesai`, `ruangan`, `status_jadwal`, `created_at`, `updated_at`

### absensi
`absensi_id`, `kelas_id`, `jadwal_id`, `tanggal`, `jam_mulai`, `jam_selesai`, `topik`, `status_absensi`, `created_by`, `created_at`, `updated_at`

### absensi_detail
`absensi_detail_id`, `absensi_id`, `siswa_id`, `status_kehadiran`, `catatan`, `updated_by`, `updated_at`

### pemantauan_ketidakhadiran
`pemantauan_id`, `siswa_id`, `kelas_id`, `tanggal_mulai`, `tanggal_selesai`, `jumlah_alpa_terakhir`, `status_pemantauan`, `created_at`, `updated_at`

### riwayat_kontak
`kontak_id`, `pemantauan_id`, `siswa_id`, `kelas_id`, `pengajar_id`, `jenis_pengirim`, `jenis_penerima`, `penerima_id`, `nomor_whatsapp`, `pesan`, `jumlah_alpa_saat_kontak`, `periode_awal`, `periode_akhir`, `status_pengiriman`, `dikirim_oleh`, `tanggal_kontak`, `created_at`

### audit_log
`audit_id`, `user_id`, `aksi`, `nama_tabel`, `record_id`, `data_sebelum`, `data_sesudah`, `keterangan`, `created_at`

## D. Perubahan `kelas_siswa`

Header lama: `kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_daftar`, `status`.

Header baru: `kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_mulai`, `tanggal_selesai`, `status_keanggotaan`, `created_at`, `updated_at`.

Instruksi:
1. Jangan hapus worksheet `kelas_siswa`.
2. Ganti isi baris 1 (`A1:H1`) dengan header baru.
3. Hapus/ubah hanya header lama (`tanggal_daftar`, `status`) sesuai pemetaan:
   - `tanggal_daftar` → `tanggal_mulai`
   - `status` → `status_keanggotaan`
4. Tambahkan kolom `tanggal_selesai`, `created_at`, `updated_at` pada header.
5. Tidak mengisi data dummy.

## E. Penambahan `audit_log`

1. Tambah worksheet baru bernama `audit_log` (jangan mengubah 10 worksheet lain).
2. Isi baris 1 dengan header sesuai §C.
3. Verifikasi header.
4. Tidak mengisi data dummy.

## F. Urutan Langkah Penerapan (kondisi saat ini)

1. Backup Spreadsheet (wajib) dan verifikasi 10 worksheet tersimpan.
2. Tambah worksheet `audit_log`.
3. Isi header `audit_log`.
4. Ganti header `kelas_siswa` sesuai §D.
5. Jangan menghapus/membuat ulang 10 worksheet lain.
6. Verifikasi jumlah worksheet = 11 dan seluruh header.
7. Uji baca metadata/header.

## G. Rencana Verifikasi

- 11 worksheet ada dan sesuai urutan final.
- Header sesuai §C.
- `riwayat_kontak.pemantauan_id` wajib.
- `kelas_siswa` memakai kolom riwayat.
- `audit_log` memiliki 9 kolom sesuai rancangan.
- Tidak ada data dummy.

## H. Konfirmasi

Tidak ada perubahan yang dilakukan pada Google Spreadsheet dalam pembaruan dokumen ini. Penerapan `audit_log` dan penyesuaian `kelas_siswa` menunggu persetujuan.
