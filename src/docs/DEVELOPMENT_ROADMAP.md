# DEVELOPMENT_ROADMAP — AI-2026-017

## Tahap Pengembangan

### 1. Audit Fondasi Teknis

- [x] Periksa kondisi build dan runtime. (build & lint berhasil)
- [x] Periksa konfigurasi Google Auth. (konfigurasi diperiksa; autentikasi belum berfungsi penuh)
- [x] Periksa konfigurasi Google Spreadsheet. (infrastruktur dibuat; struktur 10 worksheet diterapkan)
- [x] Identifikasi masalah teknis dan dependensi yang hilang. (masalah dicatat/diperbaiki)

Status tahap: [x] — audit selesai; autentikasi fungsional tetap menjadi pekerjaan Tahap 4.

### 2. Perancangan Komponen Reusable

- [x] Audit komponen yang sudah tersedia.
- [x] Identifikasi pola tampilan yang berulang.
- [x] Tentukan komponen global dan komponen khusus fitur.
- [x] Tentukan lokasi file dan cara penggunaan komponen.

Status tahap: [x]

### 3. Perancangan Integrasi Google Spreadsheet

- [x] Periksa struktur spreadsheet dan worksheet.
- [x] Tentukan struktur data yang dibutuhkan.
- [x] Tentukan mekanisme akses server-side.
- [x] Tentukan struktur repository dan service. (kerangka awal; implementasi penuh di Tahap 5)
- [x] Terapkan `audit_log` dan header final `kelas_siswa` ke Spreadsheet.

Status tahap: [x] — struktur final 13 worksheet sudah diterapkan dan diverifikasi; TOTAL_DATA_ROWS=0.

### 4. Implementasi Autentikasi dan Hak Akses

- [x] Selesaikan konfigurasi Google Auth.
- [x] Implementasikan login dan logout.
- [x] Implementasikan pemeriksaan sesi.
- [x] Terapkan pembatasan akses Admin dan Pengajar.
- [x] Uji akses langsung melalui URL.

Status tahap: [x]

### 5. Implementasi Repository dan Service

- [ ] Implementasikan repository Google Spreadsheet.
- [ ] Implementasikan service sesuai kebutuhan.
- [ ] Tangani data kosong dan kegagalan akses.
- [ ] Uji proses pengambilan dan penyimpanan data.

Status tahap: [ ]

### 6. Implementasi Data Dinamis

- [ ] Hubungkan halaman prioritas dengan sumber data.
- [ ] Gunakan parameter URL untuk data detail.
- [ ] Pastikan konsistensi data antarhalaman.
- [ ] Tangani loading, error, dan data kosong.

Status tahap: [ ]

### 7. Implementasi Formulir dan CRUD

- [ ] Implementasikan input dan state.
- [ ] Tambahkan validasi.
- [ ] Implementasikan proses tambah, baca, dan ubah.
- [ ] Implementasikan hapus jika sesuai kebutuhan SRS.
- [ ] Uji penyimpanan dan perubahan data.

Status tahap: [ ]

### 8. Pengujian dan Penyempurnaan

- [ ] Uji navigasi seluruh rute.
- [ ] Uji autentikasi dan hak akses.
- [ ] Uji pengambilan dan penyimpanan data.
- [ ] Uji formulir dan validasi.
- [ ] Perbarui PAGE_TRACKER.md sesuai kondisi aktual.

Status tahap: [ ]

## Catatan Status

- Tahap 1 selesai berdasarkan audit, build/lint, dan pemeriksaan konfigurasi.
- Tahap 3 selesai: `audit_log`, `pemindahan_kelas`, `pemindahan_kelas_detail`, dan header final `kelas_siswa` sudah diterapkan/diuji pada Spreadsheet.
- Spreadsheet saat ini 13 worksheet final; TOTAL_DATA_ROWS=0.
- Autentikasi Google fungsional: login/logout, pemeriksaan sesi, dan pembatasan akses Admin/Pengajar diterapkan.
