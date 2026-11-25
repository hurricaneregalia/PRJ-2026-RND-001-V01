# Laporan Penerapan Struktur Final Google Spreadsheet

Spreadsheet: `PRJ-2026-RND-001-V01-DATABASE`

Tanggal penerapan: 2026-11-25

Ruang lingkup: penerapan struktur database 13 worksheet sesuai `GOOGLE_SHEETS_SCHEMA.md` dan `CLASS_TRANSFER_PAGE_AUDIT.md`. Tidak ada perubahan kode aplikasi, halaman, service, navigasi, maupun konfigurasi autentikasi/environment pada tahap ini.

---

## 1. Backup

| Item | Hasil |
|---|---|
| Lokasi backup | `/private/var/folders/p5/bzkf4nkd0sd6r999j32v6f7m0000gn/T/opencode/spreadsheet-backup-final.json` |
| Format | JSON (spreadsheetId, title, createdAt, daftar worksheet + seluruh nilai) |
| Worksheet tercakup | 10 worksheet sebelum perubahan |
| Isi data | Seluruh baris setiap worksheet (`A:ZZ`) |
| Verifikasi baca ulang | Berhasil. Jumlah worksheet hasil baca ulang sama dengan jumlah worksheet Spreadsheet saat backup. |

Backup dibuat **sebelum** perubahan struktur. Backup tidak disimpan di Google Drive karena Google Drive API belum diaktifkan untuk project; backup disimpan sebagai file JSON lokal.

Catatan: seluruh worksheet sumber hanya berisi baris header (tanpa data), sehingga penggantian header `kelas_siswa` tidak berpotensi menghapus data. Jika ditemukan data pada `kelas_siswa` lama, proses akan dihentikan. Kondisi aktual: tidak ada data yang hilang.

---

## 2. Perbandingan Struktur Sebelum dan Sesudah

### Sebelum

10 worksheet: `sekolah`, `users`, `siswa`, `kelas`, `kelas_siswa`, `jadwal`, `absensi`, `absensi_detail`, `pemantauan_ketidakhadiran`, `riwayat_kontak`.

`kelas_siswa` memakai header lama:

```
kelas_siswa_id, kelas_id, siswa_id, tanggal_daftar, status
```

### Sesudah

13 worksheet, urutan final:

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
12. `pemindahan_kelas`
13. `pemindahan_kelas_detail`

---

## 3. Worksheet yang Ditambahkan

| Worksheet | Fungsi | Jumlah kolom |
|---|---|---|
| `audit_log` | Jejak audit perubahan data penting (append-only) | 10 |
| `pemindahan_kelas` | Intent dan status batch pemindahan kelas | 15 |
| `pemindahan_kelas_detail` | Intent dan status pemindahan per siswa | 12 |

Penambahan dilakukan dengan operasi `addSheet`; worksheet lama tidak dihapus dan tidak diubah namanya.

---

## 4. Header yang Diperbarui

### `kelas_siswa`

Header lama diganti menjadi struktur riwayat keanggotaan final:

```
kelas_siswa_id, kelas_id, siswa_id, tanggal_mulai, tanggal_selesai, status_keanggotaan, created_at, updated_at
```

Perubahan:
- `tanggal_daftar` diganti `tanggal_mulai`.
- Ditambah `tanggal_selesai`.
- `status` diganti `status_keanggotaan`.
- Ditambah `created_at`, `updated_at`.

Validasi data diterapkan pada kolom `status_keanggotaan` (kolom F, baris data mulai baris 2):

```
pending, aktif, selesai, dibatalkan
```

Validasi bersifat `strict` dengan dropdown UI.

### `audit_log` (baru)

```
audit_id, idempotency_key, user_id, aksi, nama_tabel, record_id, data_sebelum, data_sesudah, keterangan, created_at
```

`idempotency_key` berada di kolom kedua, sesuai keputusan final untuk mencegah audit ganda.

### `pemindahan_kelas` (baru)

```
pemindahan_id, kelas_asal_id, kelas_tujuan_id, tanggal_pemindahan, dilakukan_oleh, status, total_siswa, jumlah_berhasil, jumlah_gagal, jumlah_dilewati, waktu_mulai, waktu_selesai, error_message, created_at, updated_at
```

### `pemindahan_kelas_detail` (baru)

```
detail_id, pemindahan_id, siswa_id, kelas_siswa_lama_id, kelas_siswa_baru_id, status_siswa, alasan, waktu_mulai, waktu_selesai, error_message, created_at, updated_at
```

---

## 5. Hasil Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Total worksheet | 13 |
| Urutan worksheet sesuai skema final | Ya |
| Nama worksheet sesuai skema | Ya, seluruh 13 |
| Header sesuai urutan | Ya |
| Header ganda | Tidak ada |
| Jumlah baris per worksheet | 1 (baris header saja) |
| Data dummy | Tidak ada |
| Data lama hilang | Tidak ada; worksheet sumber hanya berisi header |
| Spreadsheet ID berubah | Tidak |
| Konfigurasi autentikasi/environment berubah | Tidak |
| Backup dapat dibaca ulang | Ya |
| Validasi `kelas_siswa.status_keanggotaan` | Terpasang (`pending`, `aktif`, `selesai`, `dibatalkan`) |

Header terverifikasi per worksheet:

| Worksheet | Jumlah kolom |
|---|---|
| `sekolah` | 6 |
| `users` | 9 |
| `siswa` | 10 |
| `kelas` | 8 |
| `kelas_siswa` | 8 |
| `jadwal` | 9 |
| `absensi` | 11 |
| `absensi_detail` | 7 |
| `pemantauan_ketidakhadiran` | 9 |
| `riwayat_kontak` | 17 |
| `audit_log` | 10 |
| `pemindahan_kelas` | 15 |
| `pemindahan_kelas_detail` | 12 |

---

## 6. Masalah dan Hal yang Belum Diselesaikan

1. **Backup bukan salinan Google Drive.** Google Drive API belum diaktifkan, sehingga backup berupa JSON lokal, bukan file di Drive.
2. **Batasan unik tidak dapat ditegakkan Spreadsheet.** Aturan `pemindahan_id` + `siswa_id` unik, satu kelas aktif per siswa, dan idempotensi audit harus ditegakkan di lapisan aplikasi.
3. **Validasi status baru sebagian.** Validasi dropdown baru diterapkan pada `kelas_siswa.status_keanggotaan`. `status` (`pemindahan_kelas`) dan `status_siswa` (`pemindahan_kelas_detail`) belum diberi validasi data.
4. **Autentikasi belum fungsional.** `user_id` pelaku pada `audit_log`, `dilakukan_oleh` pada `pemindahan_kelas`, dan `updated_by`/`created_by` terkait belum dapat diisi nilai nyata.
5. **Belum ada kode yang memakai struktur baru.** Repository, service, dan halaman terkait 13 worksheet belum diimplementasikan.
6. **Data lama berpotensi melanggar aturan baru.** Jika di kemudian hari ditemukan data dengan lebih dari satu keanggotaan `aktif`, diperlukan pemeriksaan dan perbaikan manual Admin. Saat ini tidak ada data.

---

## 7. Kesimpulan

Struktur database final 13 worksheet berhasil diterapkan dan diverifikasi. Backup tersedia dan dapat dibaca ulang. Tidak ada data yang dihapus. Implementasi kode aplikasi, termasuk pemindahan kelas, belum dimulai dan menunggu persetujuan.
