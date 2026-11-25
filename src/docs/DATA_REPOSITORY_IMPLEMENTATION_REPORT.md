# Laporan Implementasi Fondasi Data dan Repository

Tanggal: 2026-11-25

Ruang lingkup: fondasi akses Google Spreadsheet, 13 repository, mekanisme ID, validasi, dan fondasi audit. Tidak ada halaman UI, navigasi, service pemindahan kelas, perubahan struktur worksheet, atau perubahan konfigurasi autentikasi.

---

## 1. Audit Kode yang Sudah Ada

File yang diperiksa:

- `src/config/google-sheets.js`
- `src/lib/google-sheets-client.js`
- `src/repositories/sheets-repository.js`
- `src/repositories/user-repository.js`
- `src/services/user-management-service.js`
- `src/auth.js`
- `src/docs/GOOGLE_SHEETS_SCHEMA.md`
- `src/docs/GOOGLE_SHEETS_FINAL_IMPLEMENTATION_REPORT.md`

Kondisi awal:

- Konfigurasi environment dan client Google Sheets sudah tersedia.
- `sheets-repository.js` sudah memiliki `readRange`, `appendRow`, `updateRange`, dan `clearRange`.
- `user-repository.js` masih placeholder.
- Belum ada repository untuk 12 worksheet lain.
- Belum ada validasi input, validasi header, generator ID, atau audit.

Fungsi lama yang dipertahankan dan digunakan kembali:

- `getGoogleSheetsClient()`
- `getSpreadsheetMetadata()`
- `GOOGLE_SHEETS_CONFIG`
- `readRange()`
- `appendRow()`
- `updateRange()`
- `clearRange()`

Tidak ada pembuatan ulang client atau konfigurasi environment.

---

## 2. File yang Dibuat

### Fondasi dan utilitas

| File | Fungsi |
|---|---|
| `src/lib/data-errors.js` | Tipe error data, validasi, konflik, integritas, header, dan operasi Sheets. |
| `src/lib/date-time.js` | Timestamp server `YYYY-MM-DDTHH:mm:ss` dan tanggal `YYYY-MM-DD`. |
| `src/lib/id-generator.js` | Format ID `<PREFIX>-NNNN`, pembacaan ID, deteksi duplikat. |
| `src/lib/sheet-schema.js` | 13 nama worksheet, urutan header final, prefix ID. |
| `src/lib/domain-constants.js` | Nilai status dan enum final seluruh domain. |
| `src/lib/validation.js` | Validasi string, email, enum, tanggal, waktu, datetime, integer, JSON. |
| `src/lib/field-validation.js` | Validasi record parsial/penuh dan validasi data yang dibaca dari Sheets. |
| `src/lib/repository-helpers.js` | Pencarian duplikat, pengecekan konflik, dan diff field. |
| `src/repositories/sheet-table-repository.js` | Factory CRUD generik untuk satu worksheet. |

### Repository per worksheet

| File | Worksheet |
|---|---|
| `src/repositories/sekolah-repository.js` | `sekolah` |
| `src/repositories/user-repository.js` | `users` |
| `src/repositories/siswa-repository.js` | `siswa` |
| `src/repositories/kelas-repository.js` | `kelas` |
| `src/repositories/kelas-siswa-repository.js` | `kelas_siswa` |
| `src/repositories/jadwal-repository.js` | `jadwal` |
| `src/repositories/absensi-repository.js` | `absensi` |
| `src/repositories/absensi-detail-repository.js` | `absensi_detail` |
| `src/repositories/pemantauan-ketidakhadiran-repository.js` | `pemantauan_ketidakhadiran` |
| `src/repositories/riwayat-kontak-repository.js` | `riwayat_kontak` |
| `src/repositories/audit-log-repository.js` | `audit_log` |
| `src/repositories/pemindahan-kelas-repository.js` | `pemindahan_kelas` |
| `src/repositories/pemindahan-kelas-detail-repository.js` | `pemindahan_kelas_detail` |

### Pengujian

| File | Fungsi |
|---|---|
| `tests/id-generator.test.js` | Format, increment, validasi, dan duplikat ID. |
| `tests/data-validation.test.js` | Validasi field, enum, tanggal, integer, partial update. |
| `tests/sheets-foundation.integration.test.js` | Uji koneksi dan CRUD nyata dengan data sementara. |

---

## 3. File yang Diubah

| File | Perubahan |
|---|---|
| `src/repositories/sheets-repository.js` | Ditambah validasi header, pembacaan record, operasi baris, batch update, metadata worksheet, dan normalisasi error. Fungsi lama dipertahankan. |
| `src/repositories/user-repository.js` | Placeholder diganti repository `users`; `findUserByAuthId()` dan `isUserBootstrapAvailable()` tetap tersedia. |
| `vitest.config.mjs` | Ditambah alias `@` ke `src` agar pengujian dapat memakai import aplikasi. |

Tidak diubah:

- `src/config/google-sheets.js`
- `src/lib/google-sheets-client.js`
- `src/auth.js`
- `src/services/user-management-service.js`
- Halaman, komponen, navigasi
- `GOOGLE_SHEETS_SCHEMA.md`
- Struktur dan isi 13 worksheet

---

## 4. Fondasi Google Sheets

Fungsi yang tersedia di `src/repositories/sheets-repository.js`:

| Fungsi | Kegunaan |
|---|---|
| `readRange(range)` | Membaca range mentah. |
| `appendRow(range, values)` | Menambah satu baris. |
| `updateRange(range, values)` | Memperbarui range. |
| `clearRange(range)` | Mengosongkan range. |
| `updateRanges(updates)` | Batch update beberapa range. |
| `listWorksheetNames()` | Daftar worksheet. |
| `worksheetExists(title)` | Cek keberadaan worksheet. |
| `readWorksheetHeader(title)` | Membaca header. |
| `assertWorksheetHeader(title, expected)` | Validasi header persis sesuai skema. |
| `readWorksheetRecords(title, expected)` | Validasi header dan membaca record. |
| `appendWorksheetRow(title, values)` | Append baris ke worksheet. |
| `updateWorksheetRow(title, row, values)` | Update satu baris. |
| `clearWorksheetRow(title, row, columns)` | Kosongkan satu baris. |
| `getWorksheetProperties(title)` | Metadata worksheet. |

Perilaku penting:

- Semua penulisan memakai `valueInputOption: 'RAW'`. Sebelumnya `USER_ENTERED` menyebabkan timestamp `YYYY-MM-DDTHH:mm:ss` ditafsirkan sebagai tanggal oleh Spreadsheet dan merusak validasi bacaan.
- `readWorksheetRecords()` memakai satu pembacaan `A1:ZZ` untuk header dan data. Ini mengurangi jumlah request dan mencegah kuota baca 60/menit terlampaui.
- Header yang tidak sesuai, kolom hilang, kolom tambahan, atau urutan berbeda menghasilkan `SheetHeaderError`. Data tidak dikembalikan diam-diam.
- Error API dibungkus `SheetOperationError` dengan operasi, range, status HTTP, dan kode API. Credential tidak disertakan dalam error.

---

## 5. Repository yang Tersedia

| Repository | Fungsi utama |
|---|---|
| `sekolah` | `listSekolah`, `getSekolahById`, `createSekolah`, `updateSekolah`, `deleteSekolah` |
| `users` | `listUsers`, `getUserById`, `findUserByEmail`, `findUserByAuthId`, `createUser`, `updateUser`, `deactivateUser`, `isUserBootstrapAvailable` |
| `siswa` | `listSiswa`, `getSiswaById`, `findSiswaByNis`, `createSiswa`, `updateSiswa`, `deactivateSiswa` |
| `kelas` | `listKelas`, `getKelasById`, `findKelasByKode`, `createKelas`, `updateKelas`, `deactivateKelas` |
| `kelas_siswa` | `listKelasSiswa`, `getKelasSiswaById`, `listKelasSiswaBySiswaId`, `listKelasSiswaByKelasId`, `findActiveKelasSiswaBySiswaId`, `createKelasSiswa`, `updateKelasSiswa`, `closeKelasSiswa` |
| `jadwal` | `listJadwal`, `getJadwalById`, `listJadwalByKelasId`, `createJadwal`, `updateJadwal`, `deactivateJadwal` |
| `absensi` | `listAbsensi`, `getAbsensiById`, `listAbsensiByKelasId`, `listAbsensiByTanggal`, `createAbsensi`, `updateAbsensi` |
| `absensi_detail` | `listAbsensiDetail`, `getAbsensiDetailById`, `listAbsensiDetailByAbsensiId`, `listAbsensiDetailBySiswaId`, `createAbsensiDetail`, `updateAbsensiDetail` |
| `pemantauan_ketidakhadiran` | `listPemantauan`, `getPemantauanById`, `findActivePemantauan`, `createPemantauan`, `updatePemantauan` |
| `riwayat_kontak` | `listRiwayatKontak`, `getRiwayatKontakById`, `listRiwayatKontakBySiswaId`, `listRiwayatKontakByPemantauanId`, `createRiwayatKontak` |
| `audit_log` | `logAudit`, `recordAuditCreate`, `recordAuditUpdate`, `recordAuditDelete`, `recordAuditLogin`, `recordAuditLogout`, `recordAuditAdmin`, `listAuditLog`, `getAuditLogById`, `findAuditByIdempotencyKey` |
| `pemindahan_kelas` | `listPemindahanKelas`, `getPemindahanKelasById`, `listPemindahanKelasByStatus`, `createPemindahanKelas`, `updatePemindahanKelas` |
| `pemindahan_kelas_detail` | `listPemindahanKelasDetail`, `getPemindahanKelasDetailById`, `listPemindahanKelasDetailByPemindahanId`, `listPemindahanKelasDetailBySiswaId`, `createPemindahanKelasDetail`, `updatePemindahanKelasDetail` |

Semua repository memakai `sheet-table-repository.js` sebagai fondasi yang sama. Tidak ada akses Google Sheets langsung dari repository domain.

### Kebijakan penghapusan

| Repository | Perilaku |
|---|---|
| `sekolah` | Baris dikosongkan. |
| `users` | Soft delete: `account_status = inactive`. |
| `siswa` | Soft delete: `status = nonaktif`. |
| `kelas` | Soft delete: `status_kelas = nonaktif`. |
| `jadwal` | Soft delete: `status_jadwal = nonaktif`. |
| `kelas_siswa` | Tidak boleh dihapus. |
| `absensi` | Tidak boleh dihapus untuk mencegah detail yatim. |
| `absensi_detail` | Tidak boleh dihapus. |
| `pemantauan_ketidakhadiran` | Tidak boleh dihapus. |
| `riwayat_kontak` | Append-only. |
| `audit_log` | Append-only. |
| `pemindahan_kelas` | Tidak boleh dihapus. |
| `pemindahan_kelas_detail` | Tidak boleh dihapus. |

---

## 6. ID dan Konsistensi Data

### ID

- Format: `<PREFIX>-NNNN`, 4 digit.
- ID dibuat server-side berdasarkan ID tertinggi yang ada.
- ID yang diberikan pemanggil hanya diterima melalui opsi internal `recordId`; format dan duplikat tetap divalidasi.
- Batas sequence per prefix: `0001` sampai `9999`.
- Setiap operasi tulis per worksheet diserialisasi dengan lock in-process. Ini mencegah dua request bersamaan memperoleh ID yang sama dalam satu proses Node.js.

### Validasi record

Saat membaca data:

- Header harus persis sesuai skema.
- ID wajib valid dan unik.
- Field wajib tidak boleh kosong.
- Enum, tanggal, waktu, datetime, dan integer divalidasi.
- Duplikat unique key terdeteksi.
- Baris tidak valid menghasilkan `DataIntegrityError` dengan nomor baris dan field. Baris tidak dilewati diam-diam.

Saat menulis:

- Field asing ditolak.
- Nilai enum di luar daftar ditolak.
- Duplikat unique key ditolak dengan `ConflictError`.
- Status `kelas_siswa` hanya boleh `pending`, `aktif`, `selesai`, `dibatalkan`.
- Satu siswa hanya boleh memiliki satu keanggotaan `aktif`.
- Transisi keanggotaan dibatasi: `pending → aktif/dibatalkan`, `aktif → selesai`; `selesai` dan `dibatalkan` final.
- `kelas_id`, `siswa_id`, dan `tanggal_mulai` pada `kelas_siswa` tidak boleh diubah.
- `absensi.kelas_id` tidak boleh diubah setelah dibuat.
- `absensi_detail.absensi_id` dan `siswa_id` tidak boleh diubah.
- `pemantauan_ketidakhadiran.siswa_id`, `kelas_id`, dan `tanggal_mulai` tidak boleh diubah.

### Unique key yang ditegakkan

| Worksheet | Kunci |
|---|---|
| `users` | `auth_user_id`; `email` |
| `kelas` | `kode_kelas` |
| `kelas_siswa` | `kelas_id + siswa_id + tanggal_mulai`; satu `aktif` per siswa |
| `absensi_detail` | `absensi_id + siswa_id` |
| `pemantauan_ketidakhadiran` | satu kasus `aktif` per `siswa_id + kelas_id` |
| `pemindahan_kelas_detail` | `pemindahan_id + siswa_id` |
| `audit_log` | `idempotency_key` (jika diisi) |

---

## 7. Audit Log

Fondasi audit tersedia melalui `audit-log-repository.js`.

Aksi yang didukung:

- `create`
- `update`
- `delete`
- `login`
- `logout`
- `admin`
- `recovery`
- `transfer`

Catatan: `recovery` dan `transfer` hanya nilai aksi audit yang diizinkan. Fitur pemindahan kelas dan recovery belum diimplementasikan.

Perilaku:

- `data_sebelum` dan `data_sesudah` hanya berisi field yang berubah.
- Untuk `create`, data sesudah berisi field baru.
- Untuk `delete`, data sebelum berisi field yang dihapus.
- Nilai sensitif diredaksi menjadi `[REDACTED]`: password, token, secret, private key, authorization, cookie, API key, credential.
- `idempotency_key` dicek sebelum append; pemanggilan ulang mengembalikan entri yang sama.
- `audit_log` tidak memiliki operasi update atau delete melalui aplikasi.
- `nama_tabel` wajib untuk aksi selain `login`/`logout`; `login`/`logout` default ke `users`.

Catatan: repository CRUD generik tidak menulis audit otomatis karena `user_id` pelaku belum tersedia dari autentikasi. Service pemanggil harus menyediakan `user_id` dan memanggil fungsi audit.

---

## 8. Hasil Pengujian

### Perintah yang dijalankan

```bash
npm run lint
npm run build
npm test
RUN_SHEETS_INTEGRATION=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run tests/sheets-foundation.integration.test.js
```

### Hasil

| Pengujian | Hasil |
|---|---|
| `npm run lint` | Lulus. |
| `npm run build` | Lulus. |
| `npm test` | 3 file lulus, 1 file di-skip; 6 test lulus, 7 test integrasi di-skip tanpa flag. |
| Uji integrasi Google Sheets | 7 test lulus. |
| Koneksi Google Sheets | Lulus. |
| Baca 13 worksheet | Lulus; seluruh header sesuai skema. |
| Validasi header salah | Lulus; menghasilkan `SheetHeaderError`. |
| Tambah data | Lulus. |
| Baca data | Lulus. |
| Ubah data | Lulus. |
| Hapus data uji | Lulus. |
| ID duplikat | Ditolak dengan `ConflictError`. |
| Create bersamaan | ID berbeda; lock in-process bekerja. |
| Unique key duplikat (`kelas.kode_kelas`) | Ditolak dengan `ConflictError`. |
| Dua keanggotaan `aktif` | Ditolak dengan `ConflictError`. |
| Tutup keanggotaan lalu pindah | Lulus; hanya satu `aktif`. |
| Audit idempotensi | Pemanggilan ulang tidak membuat entri baru. |
| Redaksi audit | Password dan token tidak tersimpan. |

### Pembersihan data uji

Data uji memakai penanda `TEST-FOUNDATION`, `TEST-SISWA-1`, `TEST-KELAS-1`, dan `TEST-ACTOR`. Pembersihan hanya dijalankan pada baris bertanda uji; jika ditemukan baris non-uji, pembersihan dihentikan.

Verifikasi akhir Spreadsheet:

```
sekolah=0 users=0 siswa=0 kelas=0 kelas_siswa=0 jadwal=0 absensi=0
absensi_detail=0 pemantauan_ketidakhadiran=0 riwayat_kontak=0
audit_log=0 pemindahan_kelas=0 pemindahan_kelas_detail=0
TOTAL_DATA_ROWS=0
```

Tidak ada data dummy permanen. Header 13 worksheet tidak berubah.

---

## 9. Masalah yang Ditemukan dan Diperbaiki

1. **Kuota baca Google Sheets terlampaui saat pengujian awal.**
   - Penyebab: setiap pembacaan melakukan metadata, header, dan data secara terpisah.
   - Perbaikan: `readWorksheetRecords()` memakai satu pembacaan `A1:ZZ`; metadata tidak dipanggil pada setiap operasi.

2. **Timestamp rusak karena `USER_ENTERED`.**
   - Penyebab: Spreadsheet menafsirkan `YYYY-MM-DDTHH:mm:ss` sebagai nilai tanggal.
   - Perbaikan: seluruh penulisan memakai `RAW`.

3. **Baris uji sempat ditulis sebelum perbaikan.**
   - Pembersihan dijalankan dan diverifikasi; seluruh worksheet kembali memiliki 0 baris data.

4. **Peringatan deprecation `credentials`.**
   - `googleapis` masih memberi peringatan penggunaan opsi `credentials` pada client lama.
   - Tidak diubah karena termasuk konfigurasi autentikasi dan di luar batas tugas.

---

## 10. Fitur yang Masih Belum Tersedia

1. **Lock lintas proses.** Lock hanya berlaku dalam satu proses Node.js. Google Sheets tidak memiliki transaksi atau lock database. Dua instance aplikasi dapat menghasilkan ID atau keputusan aktif yang bersamaan.
2. **Idempotensi persisten untuk semua entity.** Hanya `audit_log` yang memiliki kolom `idempotency_key`. Entity lain memakai unique key bisnis; tidak ada penyimpanan request key generik.
3. **Validasi foreign key lintas worksheet.** Repository belum memastikan `pengajar_id`, `kelas_id`, `siswa_id`, dan relasi lain benar-benar ada. Ini harus dilakukan service.
4. **Audit otomatis pada CRUD.** Pemanggilan audit masih manual karena `user_id` pelamar belum tersedia.
5. **Autentikasi fungsional.** `user_id` pelaku belum dapat diambil dari sesi nyata.
6. **Hapus `absensi` draft.** Repository sengaja melarang delete untuk mencegah detail yatim; mekanisme hapus terkontrol belum dibuat.
7. **Service pemindahan kelas.** Hanya repository data access `pemindahan_kelas` dan `pemindahan_kelas_detail`; belum ada service, intent recovery, route, atau UI.
8. **UI, halaman, navigasi, dan server action.** Tidak dibuat sesuai batasan.
9. **Optimasi baca skala besar.** Pembacaan `A1:ZZ` sederhana dan sesuai kuota saat ini, tetapi dapat menjadi berat jika data tumbuh sangat besar.
10. **Batas ID.** Sequence 4 digit habis pada 9999 record per prefix.

---

## 11. Kondisi Aktual Spreadsheet

- 13 worksheet tetap sesuai skema.
- Header tidak berubah.
- Semua data uji sudah dibersihkan.
- Tidak ada data dummy permanen.
- Tidak ada perubahan pada Spreadsheet ID, autentikasi, atau environment.
- Tidak ada credential yang ditampilkan dalam laporan atau output pengujian.
