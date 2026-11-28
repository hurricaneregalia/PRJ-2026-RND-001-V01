# Rancangan Struktur Google Spreadsheet — AI-2026-017

> Catatan: Spreadsheet `PRJ-2026-RND-001-V01-DATABASE` telah memiliki 13 worksheet final, termasuk `audit_log`, `pemindahan_kelas`, dan `pemindahan_kelas_detail`. Header `kelas_siswa` sudah memakai struktur riwayat keanggotaan.

Dokumen ini adalah acuan struktur data (worksheet, kolom, relasi, aturan format) untuk Google Spreadsheet sebagai sumber data utama aplikasi.

## 1. Entitas yang Dibutuhkan

1. `sekolah` — informasi lembaga.
2. `users` — akun pengguna (Admin/Pengajar) + Google Auth.
3. `siswa` — data siswa.
4. `kelas` — data kelas.
5. `kelas_siswa` — riwayat keanggotaan siswa di kelas.
6. `jadwal` — jadwal mengajar per kelas.
7. `absensi` — sesi absensi per kelas/pertemuan.
8. `absensi_detail` — detail kehadiran per siswa per sesi.
9. `pemantauan_ketidakhadiran` — kasus pemantauan alfa.
10. `riwayat_kontak` — riwayat komunikasi tindak lanjut.
11. `audit_log` — jejak audit perubahan data penting (append-only).
12. `pemindahan_kelas` — intent batch pemindahan kelas.
13. `pemindahan_kelas_detail` — intent pemindahan per siswa.

Laporan/rekap dihitung dari data absensi; tidak disimpan sebagai entitas.

## 2. Aturan Umum

### 2.1 Format ID

- Format: `<PREFIX>-<NNNN>` (4 digit, zero-padded).
- Prefix:
  - `sekolah`: `SCH`
  - `users`: `USR`
  - `siswa`: `SIS`
  - `kelas`: `KLS`
  - `kelas_siswa`: `KRS`
  - `jadwal`: `JDL`
  - `absensi`: `ABS`
  - `absensi_detail`: `ABD`
  - `pemantauan_ketidakhadiran`: `PMN`
  - `riwayat_kontak`: `KTK`
  - `audit_log`: `AUD`
  - `pemindahan_kelas`: `PMK`
  - `pemindahan_kelas_detail`: `PMD`
- ID unik, dibuat server-side, dicek duplikat sebelum insert.

### 2.2 Format Tanggal dan Waktu

- Tanggal: `YYYY-MM-DD`.
- Waktu: `HH:mm` (24 jam).
- Timestamp: `YYYY-MM-DDTHH:mm:ss` (ISO 8601, server time).

### 2.3 Nilai Status

- `role` (users): `Admin` | `Pengajar`.
- `account_status` (users): `active` | `inactive`.
- `status` (siswa): `aktif` | `nonaktif`.
- `status_kelas` (kelas): `aktif` | `nonaktif`.
- `status_keanggotaan` (kelas_siswa): `pending` | `aktif` | `selesai` | `dibatalkan`.
- `status` (pemindahan_kelas): `pending` | `processing` | `completed` | `partially_completed` | `failed` | `recovery_required`.
- `status_siswa` (pemindahan_kelas_detail): `pending` | `processing` | `completed` | `failed` | `skipped`.
- `status_jadwal` (jadwal): `aktif` | `nonaktif`.
- `status_absensi` (absensi): `draft` | `final`.
- `status_kehadiran` (absensi_detail): `hadir` | `izin` | `sakit` | `alfa`.
- `status_pemantauan` (pemantauan_ketidakhadiran): `aktif` | `selesai`.
- `status_pengiriman` (riwayat_kontak): `disiapkan` | `dikonfirmasi_terkirim`.

### 2.4 Data Kosong

- Kolom opsional kosong = string kosong `""`.
- Kolom wajib tidak boleh kosong; validasi server-side.

### 2.5 Pencegahan ID Duplikat

- ID dibuat server-side (counter/UUID short); cek duplikat sebelum insert.

### 2.6 Konsistensi Relasi dan Penghapusan

- FK harus merujuk ID yang ada.
- Gunakan soft delete (status nonaktif/selesai) untuk data yang memiliki riwayat.
- Riwayat (`riwayat_kontak`, `audit_log`, `kelas_siswa`) tidak dihapus.

### 2.7 Keputusan yang Sudah Ditentukan

1. Nama worksheet: Indonesia.
2. `kode_kelas` wajib unik.
3. Soft delete untuk data beriwayat.
4. `absensi.jadwal_id` opsional.
5. `role` menggunakan `Admin` / `Pengajar`.
6. `audit_log` ditambahkan sebagai worksheet append-only (menggantikan keputusan sebelumnya).
7. `kelas_siswa` menyimpan riwayat keanggotaan (bukan hanya daftar saat ini).
8. Satu siswa hanya boleh memiliki satu keanggotaan `aktif` total pada satu waktu.
9. `audit_log` mencatat LOGIN, LOGOUT, CREATE, UPDATE, DELETE, dan perubahan penting lainnya.
10. `data_sebelum`/`data_sesudah` hanya menyimpan kolom yang berubah.
11. `audit_log` dan `riwayat_kontak` disimpan selama mungkin tanpa penghapusan otomatis.
12. `absensi_detail` tidak memiliki `kelas_id`; `absensi.kelas_id` adalah referensi kelas historis dan tidak berubah saat siswa pindah kelas.

## 3. Rancangan Worksheet

### 3.1 `sekolah`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `sekolah_id` | string | Ya | PK. `SCH-NNNN`. |
| `nama_sekolah` | string | Ya | Nama lembaga. |
| `alamat` | string | Ya | Alamat. |
| `no_hp` | string | Ya | Nomor kontak. |
| `logo` | string | Tidak | URL atau path logo sekolah. |
| `email` | email | Ya | Email sekolah. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

### 3.2 `users`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `user_id` | string | Ya | PK. `USR-NNNN`. |
| `auth_user_id` | string | Ya | Google `sub`. Unik. |
| `email` | string | Ya | Email Google. Unik. |
| `name` | string | Ya | Nama lengkap. |
| `jenis_kelamin` | string | Ya (data baru) | `L` / `P`. Data lama boleh kosong. |
| `role` | string | Ya | `Admin` / `Pengajar`. |
| `account_status` | string | Ya | `active` / `inactive`. |
| `photo_url` | string | Tidak | URL foto. |
| `no_hp` | string | Tidak | Nomor HP/WhatsApp. |
| `limit_kelas` | integer | Tidak | Batas jumlah kelas untuk Pengajar. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

Catatan: `jenis_kelamin` wajib di form tambah pengguna, tetapi descriptor repository dibuat opsional agar 5 baris lama tanpa nilai tetap dapat dibaca. Nilai tidak dapat diubah dari halaman edit.

### 3.3 `siswa`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `siswa_id` | string | Ya | PK. `SIS-NNNN`. |
| `nama` | string | Ya | Nama siswa. |
| `nis` | string | Tidak | NIS. |
| `jenis_kelamin` | string | Tidak | `L` / `P`. |
| `tanggal_lahir` | date | Tidak | `YYYY-MM-DD`. |
| `alamat` | string | Tidak | Alamat. |
| `no_hp` | string | Tidak | Nomor HP/WhatsApp. |
| `status` | string | Ya | `aktif` / `nonaktif`. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

### 3.4 `kelas`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `kelas_id` | string | Ya | PK. `KLS-NNNN`. |
| `kode_kelas` | string | Ya | Kode unik. |
| `nama_kelas` | string | Ya | Nama kelas. |
| `pengajar_id` | string | Ya | FK → `users.user_id`. |
| `kapasitas` | number | Tidak | Kapasitas. |
| `status_kelas` | string | Ya | `aktif` / `nonaktif`. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

### 3.5 `kelas_siswa`

Fungsi: riwayat keanggotaan siswa di kelas. Pemindahan kelas menutup keanggotaan lama dan membuat keanggotaan baru.

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `kelas_siswa_id` | string | Ya | PK. `KRS-NNNN`. |
| `kelas_id` | string | Ya | FK → `kelas.kelas_id`. |
| `siswa_id` | string | Ya | FK → `siswa.siswa_id`. |
| `tanggal_mulai` | date | Ya | Tanggal mulai keanggotaan. |
| `tanggal_selesai` | date | Tidak | Tanggal selesai; kosong jika aktif. |
| `status_keanggotaan` | string | Ya | `aktif` / `selesai`. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

Constraint:
- Hanya satu keanggotaan `aktif` per siswa pada satu waktu.
- Pemindahan kelas: set baris lama `status_keanggotaan = selesai` + `tanggal_selesai`, lalu buat baris baru `aktif`.
- Riwayat lama tidak dihapus.

### 3.6 `jadwal`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `jadwal_id` | string | Ya | PK. `JDL-NNNN`. |
| `kelas_id` | string | Ya | FK → `kelas.kelas_id`. |
| `hari` | string | Ya | `Senin`..`Minggu`. |
| `jam_mulai` | time | Ya | `HH:mm`. |
| `jam_selesai` | time | Ya | `HH:mm`. |
| `ruangan` | string | Tidak | Ruangan. |
| `status_jadwal` | string | Ya | `aktif` / `nonaktif`. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

### 3.7 `absensi`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `absensi_id` | string | Ya | PK. `ABS-NNNN`. |
| `kelas_id` | string | Ya | FK → `kelas.kelas_id` (snapshot kelas saat sesi). |
| `jadwal_id` | string | Tidak | FK → `jadwal.jadwal_id`. |
| `tanggal` | date | Ya | Tanggal sesi. |
| `jam_mulai` | time | Tidak | Jam mulai. |
| `jam_selesai` | time | Tidak | Jam selesai. |
| `topik` | string | Tidak | Topik. |
| `status_absensi` | string | Ya | `draft` / `final`. |
| `created_by` | string | Ya | FK → `users.user_id`. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

### 3.8 `absensi_detail`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `absensi_detail_id` | string | Ya | PK. `ABD-NNNN`. |
| `absensi_id` | string | Ya | FK → `absensi.absensi_id`. |
| `siswa_id` | string | Ya | FK → `siswa.siswa_id`. |
| `status_kehadiran` | string | Ya | `hadir` / `izin` / `sakit` / `alfa`. |
| `catatan` | string | Tidak | Catatan. |
| `updated_by` | string | Ya | FK → `users.user_id`. |
| `updated_at` | datetime | Ya | Timestamp perubahan. |

Constraint: kombinasi `absensi_id` + `siswa_id` unik.

Catatan historis: `absensi_detail` **tidak** menambahkan `kelas_id`. Konteks kelas sudah tersimpan di `absensi.kelas_id` dan `absensi` tidak diubah saat siswa pindah kelas, sehingga laporan historis tetap stabil. Duplikasi `kelas_id` di detail berisiko tidak konsisten.

### 3.9 `pemantauan_ketidakhadiran`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `pemantauan_id` | string | Ya | PK. `PMN-NNNN`. |
| `siswa_id` | string | Ya | FK → `siswa.siswa_id`. |
| `kelas_id` | string | Ya | FK → `kelas.kelas_id`. |
| `tanggal_mulai` | date | Ya | Tanggal kasus mulai. |
| `tanggal_selesai` | date | Tidak | Tanggal selesai; kosong jika aktif. |
| `jumlah_alpa_terakhir` | number | Ya | Jumlah alfa saat diperiksa. |
| `status_pemantauan` | string | Ya | `aktif` / `selesai`. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

Constraint:
- Hanya satu kasus `aktif` per siswa dan kelas.
- Kasus baru hanya dibuat setelah kasus sebelumnya `selesai`.
- Komunikasi kasus lama tidak dihitung pada kasus baru.

### 3.10 `riwayat_kontak`

Fungsi: mencatat setiap komunikasi tindak lanjut (append-only).

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `kontak_id` | string | Ya | PK. `KTK-NNNN`. |
| `pemantauan_id` | string | Ya | FK → `pemantauan_ketidakhadiran.pemantauan_id` (wajib). |
| `siswa_id` | string | Ya | FK → `siswa.siswa_id`. |
| `kelas_id` | string | Ya | FK → `kelas.kelas_id`. |
| `pengajar_id` | string | Tidak | FK → `users.user_id`. |
| `jenis_pengirim` | string | Ya | `Pengajar` / `Admin`. |
| `jenis_penerima` | string | Ya | `Siswa` / `Pengajar`. |
| `penerima_id` | string | Ya | `siswa_id` atau `user_id`. |
| `nomor_whatsapp` | string | Ya | Nomor penerima. |
| `pesan` | string | Ya | Teks pesan. |
| `jumlah_alpa_saat_kontak` | number | Ya | Jumlah alfa saat kontak. |
| `periode_awal` | date | Ya | Awal rentang 30 hari. |
| `periode_akhir` | date | Ya | Akhir rentang 30 hari. |
| `status_pengiriman` | string | Ya | `disiapkan` / `dikonfirmasi_terkirim`. |
| `dikirim_oleh` | string | Ya | FK → `users.user_id`. |
| `tanggal_kontak` | date | Ya | Tanggal kontak. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |

Constraint: append-only; `pemantauan_id` wajib.

### 3.11 `audit_log`

Fungsi: jejak audit perubahan data penting. Append-only; tidak diubah/dihapus lewat aplikasi.

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `audit_id` | string | Ya | PK. `AUD-NNNN`. |
| `idempotency_key` | string | Tidak | Kunci unik pencegahan audit ganda. |
| `user_id` | string | Ya | FK → `users.user_id` (pelaku). |
| `aksi` | string | Ya | `create` / `update` / `delete` / `login` / `logout`. |
| `nama_tabel` | string | Ya | Nama worksheet terdampak. |
| `record_id` | string | Ya | ID record terdampak. |
| `data_sebelum` | string (JSON) | Tidak | Snapshot sebelum perubahan (JSON string). |
| `data_sesudah` | string (JSON) | Tidak | Snapshot sesudah perubahan (JSON string). |
| `keterangan` | string | Tidak | Konteks tambahan. |
| `created_at` | datetime | Ya | Timestamp audit. |

Aturan:
- Append-only; tidak ada update/delete.
- Jangan menyimpan password, token, private key, atau rahasia.
- `data_sebelum`/`data_sesudah` hanya berisi kolom yang berubah (bukan seluruh record, bukan data sensitif).
- Disimpan selama mungkin; tidak ada penghapusan otomatis.
- Mencatat aktivitas Admin dan Pengajar.

Aktivitas wajib dicatat (minimal):
- `users`: tambah/ubah/nonaktifkan akun, perubahan role/status.
- `siswa`: tambah/ubah/nonaktifkan siswa.
- `kelas`: tambah/ubah/nonaktifkan kelas.
- `kelas_siswa`: pemindahan/penutupan keanggotaan.
- `jadwal`: tambah/ubah/nonaktifkan jadwal.
- `absensi`: buat/ubah/status final.
- `absensi_detail`: ubah status kehadiran.
- `pemantauan_ketidakhadiran`: buka/tutup kasus.
- `riwayat_kontak`: pembuatan dan konfirmasi terkirim.
- `sekolah`: ubah informasi lembaga.

### 3.12 `pemindahan_kelas`

Fungsi: intent/status batch pemindahan kelas.

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `pemindahan_id` | string | Ya | PK. `PMK-NNNN`. |
| `kelas_asal_id` | string | Ya | FK → `kelas.kelas_id`. |
| `kelas_tujuan_id` | string | Ya | FK → `kelas.kelas_id`. |
| `tanggal_pemindahan` | date | Ya | `YYYY-MM-DD`. |
| `dilakukan_oleh` | string | Ya | FK → `users.user_id`. |
| `status` | string | Ya | `pending` / `processing` / `completed` / `partially_completed` / `failed` / `recovery_required`. |
| `total_siswa` | number | Ya | Jumlah siswa. |
| `jumlah_berhasil` | number | Ya | Jumlah `completed`. |
| `jumlah_gagal` | number | Ya | Jumlah `failed`. |
| `jumlah_dilewati` | number | Ya | Jumlah `skipped`. |
| `waktu_mulai` | datetime | Ya | Waktu mulai. |
| `waktu_selesai` | datetime | Tidak | Waktu selesai. |
| `error_message` | string | Tidak | Ringkasan error. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

### 3.13 `pemindahan_kelas_detail`

Fungsi: intent/status pemindahan per siswa dalam satu batch.

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `detail_id` | string | Ya | PK. `PMD-NNNN`. |
| `pemindahan_id` | string | Ya | FK → `pemindahan_kelas.pemindahan_id`. |
| `siswa_id` | string | Ya | FK → `siswa.siswa_id`. |
| `kelas_siswa_lama_id` | string | Ya | FK → `kelas_siswa.kelas_siswa_id`. |
| `kelas_siswa_baru_id` | string | Tidak | FK → `kelas_siswa.kelas_siswa_id`. |
| `status_siswa` | string | Ya | `pending` / `processing` / `completed` / `failed` / `skipped`. |
| `alasan` | string | Tidak | Alasan gagal/dilewati. |
| `waktu_mulai` | datetime | Tidak | Waktu proses siswa. |
| `waktu_selesai` | datetime | Tidak | Waktu selesai siswa. |
| `error_message` | string | Tidak | Detail error. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

Constraint: `pemindahan_id` + `siswa_id` unik.

## 4. Relasi Antarworksheet

- `sekolah` berdiri sendiri.
- `users (1) — (N) kelas` via `kelas.pengajar_id`.
- `kelas (1) — (N) kelas_siswa` via `kelas_siswa.kelas_id`.
- `siswa (1) — (N) kelas_siswa` via `kelas_siswa.siswa_id`.
- `kelas (1) — (N) jadwal` via `jadwal.kelas_id`.
- `kelas (1) — (N) absensi` via `absensi.kelas_id`.
- `jadwal (1) — (N) absensi` via `absensi.jadwal_id` (opsional).
- `absensi (1) — (N) absensi_detail` via `absensi_detail.absensi_id`.
- `siswa (1) — (N) absensi_detail` via `absensi_detail.siswa_id`.
- `users (1) — (N) absensi` via `absensi.created_by`.
- `users (1) — (N) absensi_detail` via `absensi_detail.updated_by`.
- `siswa (1) — (N) pemantauan_ketidakhadiran` via `pemantauan_ketidakhadiran.siswa_id`.
- `kelas (1) — (N) pemantauan_ketidakhadiran` via `pemantauan_ketidakhadiran.kelas_id`.
- `pemantauan_ketidakhadiran (1) — (N) riwayat_kontak` via `riwayat_kontak.pemantauan_id`.
- `siswa (1) — (N) riwayat_kontak` via `riwayat_kontak.siswa_id`.
- `kelas (1) — (N) riwayat_kontak` via `riwayat_kontak.kelas_id`.
- `users (1) — (N) riwayat_kontak` via `riwayat_kontak.dikirim_oleh`/`pengajar_id`.
- `users (1) — (N) audit_log` via `audit_log.user_id`.
- `kelas (1) — (N) pemindahan_kelas` via `pemindahan_kelas.kelas_asal_id` dan `kelas_tujuan_id`.
- `users (1) — (N) pemindahan_kelas` via `pemindahan_kelas.dilakukan_oleh`.
- `pemindahan_kelas (1) — (N) pemindahan_kelas_detail` via `pemindahan_kelas_detail.pemindahan_id`.
- `siswa (1) — (N) pemindahan_kelas_detail` via `pemindahan_kelas_detail.siswa_id`.
- `kelas_siswa (1) — (N) pemindahan_kelas_detail` via `kelas_siswa_lama_id`/`kelas_siswa_baru_id`.

## 5. Aturan Pemantauan Ketidakhadiran

### 5.1 Perhitungan Alfa 30 Hari

- Rentang 30 hari terakhir.
- Hitung `absensi_detail` dengan `status_kehadiran = alfa` dan `absensi.tanggal` dalam rentang.
- > 2 → masuk daftar; ≤ 2 → tidak.

### 5.2 Status Dihubungi

- Hitung `riwayat_kontak` relevan (siswa sama, `status_pengiriman = dikonfirmasi_terkirim`, `tanggal_kontak` dalam 30 hari terakhir, `pemantauan_id` = kasus aktif).
- 0 → "Belum"; >0 → "Sudah (N kali)".

### 5.3 Terakhir Dihubungi

- `MAX(tanggal_kontak)` dari komunikasi relevan; "-" jika belum ada.

### 5.4 Mekanisme Kasus

- Masuk daftar tanpa kasus aktif → buat kasus baru.
- Masuk daftar dengan kasus aktif → gunakan kasus yang sama.
- Alfa ≤ 2 → set kasus aktif `selesai`.
- Kembali masuk setelah selesai → buat kasus baru.
- `riwayat_kontak.pemantauan_id` wajib sesuai kasus aktif.

### 5.5 Simulasi Januari–Maret

- Januari: alfa 3 → PMN-0001 aktif; komunikasi → "Sudah (1 kali)".
- Februari: alfa 1 → PMN-0001 selesai; keluar daftar.
- Maret: alfa 3 → PMN-0002 baru; "Belum"; riwayat Januari tidak dihitung.

## 6. Contoh Data (Fiktif)

### kelas_siswa

| kelas_siswa_id | kelas_id | siswa_id | tanggal_mulai | tanggal_selesai | status_keanggotaan | created_at | updated_at |
|---|---|---|---|---|---|---|---|
| KRS-0001 | KLS-0001 | SIS-0001 | 2026-01-04 | 2026-03-31 | selesai | 2026-01-04T08:00:00 | 2026-03-31T08:00:00 |
| KRS-0002 | KLS-0002 | SIS-0001 | 2026-04-01 | | aktif | 2026-04-01T08:00:00 | 2026-04-01T08:00:00 |

### audit_log

| audit_id | user_id | aksi | nama_tabel | record_id | data_sebelum | data_sesudah | keterangan | created_at |
|---|---|---|---|---|---|---|---|---|
| AUD-0001 | USR-0002 | update | absensi_detail | ABD-0001 | {"status_kehadiran":"izin"} | {"status_kehadiran":"hadir"} | Koreksi kehadiran | 2026-01-06T09:35:00 |

## 7. Daftar Worksheet Final (13)

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

## 8. Keputusan Final

1. Satu siswa hanya boleh memiliki satu kelas aktif pada satu waktu.
2. Pemindahan kelas menutup keanggotaan lama dan membuat keanggotaan baru; riwayat tidak dihapus.
3. `audit_log` mencatat LOGIN, LOGOUT, CREATE, UPDATE, DELETE, dan perubahan penting lainnya oleh Admin/Pengajar.
4. `data_sebelum`/`data_sesudah` hanya menyimpan kolom yang berubah.
5. `audit_log` append-only; tidak menyimpan rahasia; disimpan selama mungkin tanpa penghapusan otomatis.
6. `riwayat_kontak` disimpan selama mungkin tanpa penghapusan otomatis.
7. `absensi_detail` tanpa `kelas_id`; `absensi.kelas_id` menjadi referensi kelas historis dan tidak berubah saat siswa pindah kelas.
8. Total worksheet final: 13 (termasuk `audit_log`, `pemindahan_kelas`, `pemindahan_kelas_detail`).
9. `status_keanggotaan` mendukung `pending`, `aktif`, `selesai`, `dibatalkan`.
10. `audit_log` memiliki `idempotency_key` untuk mencegah audit ganda.

Seluruh 13 worksheet dan header final telah diterapkan ke Spreadsheet pada tahap penerapan.
