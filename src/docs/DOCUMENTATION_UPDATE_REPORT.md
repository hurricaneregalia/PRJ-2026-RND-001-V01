# Laporan Pembaruan Dokumentasi — AI-2026-017

## 1. Status Roadmap

### Sebelum
- Tahap 1–8 semuanya `[ ]`.
- Tahap 1 belum ditandai selesai meskipun build/lint sudah berhasil dan struktur Spreadsheet sudah diterapkan (dokumen belum diperbarui).

### Sesudah
- Tahap 1: `[x]` — build/lint berhasil, Google Auth diperiksa (belum fungsional), infrastruktur Sheets dibuat & struktur diterapkan, masalah teknis dicatat.
- Tahap 2: `[ ]`.
- Tahap 3: `[x]` — perancangan & struktur Spreadsheet diterapkan; kerangka repository/service ada.
- Tahap 4–8: `[ ]`.
- Catatan: autentikasi fungsional tetap pekerjaan Tahap 4; `audit_log` & riwayat keanggotaan belum diterapkan ke Spreadsheet.

## 2. Worksheet `audit_log`

Header: `audit_id`, `user_id`, `aksi`, `nama_tabel`, `record_id`, `data_sebelum`, `data_sesudah`, `keterangan`, `created_at`.

Aturan final:
- Append-only; tidak diubah/dihapus lewat aplikasi.
- Tidak menyimpan password, token, private key, atau rahasia.
- `data_sebelum`/`data_sesudah` hanya kolom yang berubah.
- Mencatat LOGIN, LOGOUT, CREATE, UPDATE, DELETE, dan perubahan penting lain oleh Admin/Pengajar.
- Disimpan selama mungkin tanpa penghapusan otomatis.
- Aktivitas wajib dicatat: users, siswa, kelas, kelas_siswa, jadwal, absensi, absensi_detail, pemantauan_ketidakhadiran, riwayat_kontak, sekolah.

## 3. Perubahan `kelas_siswa`

Header baru: `kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_mulai`, `tanggal_selesai`, `status_keanggotaan`, `created_at`, `updated_at`.

- Riwayat lama tidak dihapus.
- Final: satu siswa hanya boleh memiliki satu kelas aktif pada satu waktu.
- Pemindahan kelas menutup keanggotaan lama (`selesai`) dan membuat baris baru (`aktif`).

## 4. Dampak terhadap `absensi_detail`

Keputusan: **tidak menambahkan `kelas_id`** pada `absensi_detail`.

Alasan:
- Konteks kelas sudah tersimpan di `absensi.kelas_id`.
- `absensi` tidak diubah saat siswa pindah kelas, sehingga laporan historis tetap stabil.
- Duplikasi `kelas_id` di detail berisiko tidak konsisten.

Jika diinginkan snapshot eksplisit, opsi alternatif adalah menambahkan `kelas_id` (menunggu persetujuan).

## 5. Relasi Baru/Changing

- `users (1) — (N) audit_log` via `audit_log.user_id`.
- `kelas (1) — (N) kelas_siswa` via `kelas_siswa.kelas_id`.
- `siswa (1) — (N) kelas_siswa` via `kelas_siswa.siswa_id`.
- Relasi `absensi_detail` tetap ke `absensi` dan `siswa`.
- Total worksheet final: 11.

## 6. Dokumen yang Diperbarui

- `src/docs/GOOGLE_SHEETS_SCHEMA.md` — 11 worksheet, audit_log, kelas_siswa riwayat, aturan.
- `src/docs/SRS.md` — §9 Audit Trail, §10 Riwayat Keanggotaan Kelas.
- `src/docs/DEVELOPMENT_ROADMAP.md` — status Tahap 1 & 3.
- `src/docs/GOOGLE_SHEETS_IMPLEMENTATION_PLAN.md` — 11 worksheet, header baru, rencana audit_log.
- `src/docs/GOOGLE_SHEETS_IMPLEMENTATION_REPORT.md` — catatan rancangan baru belum diterapkan.
- `src/docs/DOCUMENTATION_UPDATE_REPORT.md` — laporan ini.

## 7. Keputusan Final

1. Satu siswa hanya satu kelas aktif pada satu waktu.
2. `audit_log` mencatat LOGIN, LOGOUT, CREATE, UPDATE, DELETE, dan perubahan penting lain.
3. `data_sebelum`/`data_sesudah` hanya kolom yang berubah.
4. `absensi_detail` tanpa `kelas_id`; `absensi.kelas_id` menjadi referensi historis.
5. Retensi `audit_log` dan `riwayat_kontak`: selama mungkin, tanpa penghapusan otomatis.
6. Penerapan `audit_log` dan header final `kelas_siswa` dilakukan pada tahap berikutnya (belum pada tahap dokumentasi ini).

Tidak ada perubahan pada Google Spreadsheet, kode, atau konfigurasi.
