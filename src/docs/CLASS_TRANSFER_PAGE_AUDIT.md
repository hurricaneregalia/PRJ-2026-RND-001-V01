# Audit Halaman Admin untuk Fitur Perpindahan Kelas — AI-2026-017

## A. Ringkasan Kondisi Aplikasi

1. Seluruh halaman Admin masih **preview statis**: data hardcode, tanpa `useState`, `fetch`, server action, API, atau akses Google Spreadsheet.
2. Tidak ada halaman Admin yang membaca `params` route dinamis (`[siswaId]`, `[kelasId]`, `[absensiId]`, dll.).
3. Tidak ada layout khusus Admin (`src/app/admin/layout.js` tidak ada).
4. Komponen reusable yang benar-benar dipakai: hanya `src/components/ui/back-button.js`.
5. Folder `src/components/common`, `dashboard`, `layout` kosong.
6. Repository/service Sheets sudah ada secara fondasi (`src/repositories/sheets-repository.js`, `src/repositories/user-repository.js`, `src/services/user-management-service.js`), tetapi **tidak dipakai** oleh halaman Admin.
7. Belum ada fitur, halaman, atau mekanisme perpindahan kelas.

## B. Struktur Aktual `src/app/admin/`

Total: 29 file `page.js`, tanpa `layout.js`, `loading.js`, atau `error.js` khusus Admin.

1. `src/app/admin/page.js` — Dashboard.
2. `src/app/admin/absensi/page.js`
3. `src/app/admin/absensi/[absensiId]/page.js`
4. `src/app/admin/absensi/[absensiId]/edit/page.js`
5. `src/app/admin/jadwal/page.js`
6. `src/app/admin/jadwal/tambah/page.js`
7. `src/app/admin/jadwal/[jadwalId]/page.js`
8. `src/app/admin/jadwal/[jadwalId]/edit/page.js`
9. `src/app/admin/kelas/page.js`
10. `src/app/admin/kelas/tambah/page.js`
11. `src/app/admin/kelas/[kelasId]/page.js`
12. `src/app/admin/kelas/[kelasId]/edit/page.js`
13. `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js`
14. `src/app/admin/laporan/page.js`
15. `src/app/admin/laporan/kehadiran-siswa/page.js`
16. `src/app/admin/laporan/kehadiran-pengajar/page.js`
17. `src/app/admin/laporan/aktivitas-kelas/page.js`
18. `src/app/admin/laporan/rekap-pembelajaran/page.js`
19. `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js`
20. `src/app/admin/pengajar/page.js`
21. `src/app/admin/pengajar/tambah/page.js`
22. `src/app/admin/pengajar/[pengajarId]/page.js`
23. `src/app/admin/pengajar/[pengajarId]/edit/page.js`
24. `src/app/admin/profil/[profilId]/page.js`
25. `src/app/admin/profil/[profilId]/edit/page.js`
26. `src/app/admin/siswa/page.js`
27. `src/app/admin/siswa/tambah/page.js`
28. `src/app/admin/siswa/[siswaId]/page.js`
29. `src/app/admin/siswa/[siswaId]/edit/page.js`

## C. Hasil Audit Halaman Terkait

### C.1 Dashboard Admin

- File: `src/app/admin/page.js`
- Fungsi: ringkasan absensi, statistik, daftar kelas, daftar guru, daftar siswa alfa, akses cepat.
- Informasi: angka hardcode (120 siswa, 12 pengajar, 8 kelas, persentase kehadiran).
- Tombol/aksi: link detail kelas, profil pengajar, hubungi guru, akses cepat.
- Komponen: `Link`; tanpa komponen bersama.
- Navigasi: link langsung; beberapa id hardcode (`/admin/kelas/2`, `/admin/pengajar/3`).
- Data: statis; tidak terhubung Spreadsheet.
- Kekurangan untuk perpindahan kelas: tidak ada indikator siswa pindah kelas, tidak ada akses ke riwayat keanggotaan.

### C.2 Data Siswa

- File: `src/app/admin/siswa/page.js`
- Fungsi: daftar siswa, ringkasan, rencana pencarian/filter.
- Informasi: nama, NIS, jenis kelamin, kelas, status.
- Tombol/aksi: Detail, Edit, Hapus (teks), Tambah Siswa.
- Komponen: `Link`.
- Navigasi: `/admin/siswa/4` dan `/admin/siswa/4/edit` (id hardcode).
- Data: statis; tidak terhubung Spreadsheet.
- Kekurangan: tidak ada kolom/aksi "Pindah Kelas"; tidak ada informasi kelas aktif vs riwayat; semua baris memakai id yang sama.

### C.3 Detail Siswa

- File: `src/app/admin/siswa/[siswaId]/page.js`
- Fungsi: informasi siswa + riwayat absensi.
- Informasi: foto, NIS, nama, jenis kelamin, tanggal lahir, alamat, HP, kelas yang diikuti, tanggal pendaftaran, riwayat absensi.
- Tombol/aksi: Edit.
- Komponen: `Link`.
- Navigasi: breadcrumb Dashboard / Manajemen Siswa / Detail Siswa.
- Data: statis; tidak membaca `params`; tidak terhubung Spreadsheet.
- Kekurangan: hanya satu kelas (bukan riwayat keanggotaan); tidak ada tombol pindah kelas; riwayat absensi tidak dikaitkan ke kelas historis.

### C.4 Data Kelas

- File: `src/app/admin/kelas/page.js`
- Fungsi: daftar kelas, ringkasan, rencana filter.
- Informasi: kode, nama, pengajar, jumlah siswa, status.
- Tombol/aksi: Detail, Edit, Hapus (teks), Tambah Kelas.
- Komponen: `Link`.
- Navigasi: `/admin/kelas/2` untuk semua baris.
- Data: statis.
- Kekurangan: tidak ada jumlah anggota aktif vs riwayat; tidak ada aksi pindah siswa.

### C.5 Detail Kelas

- File: `src/app/admin/kelas/[kelasId]/page.js`
- Fungsi: informasi kelas, daftar siswa terdaftar, riwayat absensi.
- Informasi: kode, nama, mata pelajaran, deskripsi, pengajar, jumlah siswa, jadwal.
- Tombol/aksi: "Keluarkan Siswa Terpilih" (tombol tanpa handler), "Tambah Siswa ke Kelas".
- Komponen: `Link`; checkbox HTML biasa.
- Navigasi: link tambah siswa menuju `/admin/kelas/3/tambah-siswa` (id hardcode, tidak konsisten dengan `2`).
- Data: statis.
- Kekurangan: daftar anggota tidak membedakan aktif vs riwayat; tidak ada tombol pindah kelas; tidak ada modal/dialog.

### C.6 Anggota Kelas (Tambah Siswa)

- File: `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js`
- Fungsi: memilih siswa untuk ditambahkan ke kelas.
- Informasi: data kelas hardcode, daftar 5 siswa hardcode, checkbox, ringkasan siswa terpilih.
- Tombol/aksi: Batal (`BackButton`), "Tambahkan Siswa (0)" disabled.
- Komponen: `BackButton`; checkbox dan input search HTML.
- Data: statis; tidak ada state; tidak terhubung Spreadsheet.
- Kekurangan: tidak ada validasi "satu siswa satu kelas aktif"; tidak ada pengecekan kelas aktif; tidak ada audit log.

### C.7 Data Absensi

- File: `src/app/admin/absensi/page.js`
- Fungsi: daftar sesi absensi + statistik + rencana filter.
- Informasi: kelas, tanggal, jam, pengajar, jumlah siswa, hadir/izin/sakit/alfa.
- Tombol/aksi: Detail absensi.
- Komponen: `Link`.
- Navigasi: `/admin/absensi/1`, `/admin/absensi/2`.
- Data: statis.
- Kekurangan: tidak ada informasi kelas historis vs kelas siswa saat ini; tidak ada penanda siswa yang sudah pindah kelas.

### C.8 Detail Absensi

- File: `src/app/admin/absensi/[absensiId]/page.js`
- Fungsi: detail sesi + statistik + daftar siswa + info pencatatan.
- Informasi: kelas, mata pelajaran, pengajar, hari, tanggal, waktu, ruangan, status; daftar siswa + status.
- Tombol/aksi: Edit.
- Komponen: `Link`.
- Data: statis; tidak membaca `params`.
- Kekurangan: tidak menampilkan `absensi.kelas_id` historis secara eksplisit; tidak ada catatan jika siswa sudah pindah kelas.

### C.9 Riwayat Absensi

- Tidak ada halaman khusus "Riwayat Absensi" Admin.
- Riwayat absensi hanya berupa bagian di `src/app/admin/siswa/[siswaId]/page.js` dan `src/app/admin/kelas/[kelasId]/page.js`, keduanya statis.
- Tidak ada filter periode/kelas, tidak ada data dinamis.

## D. Hasil Audit Komponen

1. **Tabel**: tidak ada komponen tabel reusable. Halaman memakai `<ul>`/`<li>` dan teks berpemisah `|`, bukan `<table>`.
2. **Formulir**: form HTML langsung (`<form>`, `<input>`, `<select>`, `<textarea>`), tanpa komponen field, tanpa state, tanpa submit handler.
3. **Dialog/modal**: tidak ada.
4. **Tombol aksi**: tombol HTML biasa; hanya `BackButton` yang reusable.
5. **Navigasi**: `Link` dari `next/link`; breadcrumb ditulis manual di setiap halaman.
6. **Komponen bersama**: hanya `src/components/ui/back-button.js`.
7. **Pencarian/filter**: hanya teks deskripsi dan satu `<input type="search">` tanpa state di halaman tambah siswa.

Komponen yang dapat digunakan kembali untuk perpindahan kelas (saat ini tersedia):
- `BackButton` untuk tombol batal/kembali.

Belum ada komponen reusable untuk:
- Tabel data.
- Filter/pencarian.
- Modal konfirmasi.
- Form field.
- Pemilih kelas/siswa.

## E. Kondisi Fitur Perpindahan Kelas Saat Ini

1. Melihat siswa berdasarkan kelas — **belum tersedia** (hanya teks statis).
2. Melihat kelas aktif yang diikuti siswa — **belum tersedia** (detail siswa hanya menampilkan satu kelas hardcode).
3. Melihat riwayat keanggotaan kelas siswa — **belum tersedia**.
4. Memindahkan siswa ke kelas lain — **belum tersedia**.
5. Melihat riwayat perpindahan siswa — **belum tersedia**.
6. Melihat anggota kelas berdasarkan periode keanggotaan — **belum tersedia**.

Tidak ada kode yang menulis/membaca `kelas_siswa`, `audit_log`, atau `absensi` dari Google Spreadsheet.

## F. Dua Jalur Akses Perpindahan Kelas (Keputusan Final)

Fitur perpindahan kelas dapat diakses melalui dua jalur dengan proses bisnis, validasi, dan penyimpanan yang sama.

1. **Jalur detail siswa** (individual)
   - Route: `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js` (belum ada).
   - Titik masuk: halaman detail siswa aktual `src/app/admin/siswa/[siswaId]/page.js`.
   - Digunakan untuk memindahkan satu siswa.

2. **Jalur detail kelas** (individual/kelompok)
   - Route: `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` (belum ada).
   - Titik masuk: halaman detail kelas aktual `src/app/admin/kelas/[kelasId]/page.js`.
   - Digunakan untuk memindahkan satu atau beberapa siswa dari kelas asal yang sama.

Kedua halaman memanggil service perpindahan yang sama; perbedaan hanya pada cara memilih siswa.

## G. Perbandingan Kedua Jalur

| Aspek | Jalur Detail Siswa | Jalur Detail Kelas |
|---|---|---|
| Konteks | Satu siswa | Kelas asal + anggota aktif |
| Pemilihan siswa | Otomatis (siswa dari URL) | Manual (checkbox dari anggota aktif) |
| Jumlah siswa | 1 | 1..N |
| Kelas asal | Diambil dari keanggotaan aktif siswa | Kelas dari URL |
| Validasi | Sama | Sama |
| Service | Sama | Sama |
| Struktur hasil | Sama (`kelas_siswa` lama ditutup + baru dibuat) | Sama |
| Audit log | Sama | Sama |
| Setelah selesai | Kembali ke detail siswa | Kembali ke detail kelas |

## H. Alur Pemindahan Individual (Detail Siswa)

1. Admin membuka detail siswa.
2. Admin klik "Pindahkan Kelas".
3. Halaman menampilkan identitas siswa (nama, NIS).
4. Sistem menampilkan kelas aktif siswa (dari `kelas_siswa` status `aktif`).
5. Admin memilih kelas tujuan (hanya `kelas.status_kelas = aktif`, bukan kelas asal).
6. Admin menentukan tanggal perpindahan.
7. Sistem menampilkan ringkasan: siswa, kelas asal, kelas tujuan, tanggal.
8. Admin konfirmasi.
9. Service memvalidasi ulang lalu memproses:
   - Tutup keanggotaan lama (`status_keanggotaan = selesai`, `tanggal_selesai`).
   - Buat keanggotaan baru (`status_keanggotaan = aktif`, `tanggal_mulai`).
   - Tulis `audit_log` (update lama + create baru).
10. Redirect ke detail siswa dengan pesan sukses dan riwayat terbaru.

## I. Alur Pemindahan Kelompok (Detail Kelas)

1. Admin membuka detail kelas.
2. Admin klik "Pindahkan Siswa".
3. Halaman menampilkan daftar **anggota aktif** kelas tersebut.
   - Hanya baris `kelas_siswa` dengan `kelas_id` = kelas URL dan `status_keanggotaan = aktif`.
   - Anggota yang sudah `selesai` tidak ditampilkan.
4. Admin memilih satu atau beberapa siswa (checkbox).
5. Admin memilih satu kelas tujuan (aktif, bukan kelas asal).
6. Admin menentukan tanggal perpindahan.
7. Sistem menampilkan ringkasan: kelas asal, daftar siswa terpilih, jumlah, kelas tujuan, tanggal.
8. Admin konfirmasi.
9. Service memproses setiap siswa dengan mekanisme yang sama seperti jalur individual.
10. Redirect ke detail kelas dengan ringkasan hasil (berhasil/gagal per siswa).

## J. Aturan Bisnis Bersama

1. Satu siswa hanya boleh memiliki satu keanggotaan `aktif`.
2. Validasi server-side: tidak boleh ada dua baris `aktif` untuk `siswa_id` yang sama setelah operasi.
3. Kelas tujuan harus ada dan `status_kelas = aktif`.
4. Kelas tujuan tidak boleh sama dengan kelas asal.
5. Keanggotaan lama wajib ditutup (`status_keanggotaan = selesai`, `tanggal_selesai = tanggal perpindahan`).
6. Keanggotaan baru wajib dibuat (`status_keanggotaan = aktif`, `tanggal_mulai = tanggal perpindahan`).
7. Riwayat lama tidak dihapus (update status, bukan delete).
8. Absensi historis tidak diubah; `absensi.kelas_id` immutable.
9. `absensi_detail` tetap tanpa `kelas_id`.
10. Setiap perpindahan menulis `audit_log`.
11. Tanggal perpindahan valid (`YYYY-MM-DD`) dan tidak lebih awal dari `tanggal_mulai` keanggotaan lama.
12. Untuk kelompok: semua siswa harus berasal dari kelas asal yang sama dan tujuan yang sama.

## K. Service Bersama dan Pencegahan Duplikasi Validasi

- Kedua halaman memanggil satu service perpindahan (nama file belum ada; rekomendasi `src/services/class-transfer-service.js`).
- Service menerima input:
  - `actorUserId`
  - `sourceClassId`
  - `targetClassId`
  - `studentIds[]`
  - `transferDate`
- Service melakukan:
  1. Validasi input.
  2. Baca keanggotaan aktif tiap siswa.
  3. Pastikan semua berasal dari `sourceClassId`.
  4. Pastikan target valid/aktif dan berbeda.
  5. Bangun rencana perubahan (old → selesai, new → aktif).
  6. Eksekusi dengan mekanisme pemulihan (bagian L).
  7. Tulis audit log.
- Halaman hanya menangani pemilihan siswa dan tampilan; tidak menduplikasi aturan bisnis.

## L. Strategi Penanganan Kegagalan (Tanpa Transaksi Atomik)

Google Spreadsheet tidak mendukung transaksi atomik seperti database relasional. Risiko utama: dua keanggotaan aktif, siswa kehilangan keanggotaan, riwayat tidak lengkap, audit tidak sesuai.

Rekomendasi pendekatan **intent + idempotent recovery**:

1. **Preflight**
   - Baca semua keanggotaan aktif siswa.
   - Validasi seluruh siswa sebelum menulis apa pun.
   - Tolak seluruh batch jika ada siswa yang tidak valid (kecuali diputuskan partial).

2. **Intent record**
   - Tulis satu entri `audit_log` awal (aksi `transfer`, `keterangan` berisi `transfer_batch_id` dan rencana) sebelum perubahan.
   - Ini menjadi write-ahead log untuk pemulihan.

3. **Urutan per siswa**
   - Tutup keanggotaan lama lebih dulu (`selesai`).
   - Baru buat keanggotaan baru (`aktif`).
   - Urutan ini mencegah dua keanggotaan aktif; risiko sementara adalah siswa tanpa keanggotaan aktif jika langkah kedua gagal.

4. **Idempotensi**
   - `transfer_batch_id` unik per operasi.
   - Sebelum menulis, cek apakah siswa sudah punya keanggotaan `aktif` di kelas tujuan dengan `tanggal_mulai` sama; jika ya, lewati (sudah selesai).
   - Sebelum menutup, cek apakah keanggotaan lama sudah `selesai`; jika ya, lewati.

5. **Pemulihan**
   - Jika pembuatan baru gagal setelah penutupan lama: retry pembuatan baru; jika tetap gagal, catat kegagalan di audit dan tampilkan siswa yang perlu ditangani.
   - Recovery membaca intent + status aktual, lalu melanjutkan langkah yang belum selesai.
   - Jangan pernah membuat keanggotaan baru sebelum keanggotaan lama ditutup (mencegah dua aktif).

6. **Audit log**
   - Satu entri `update` untuk penutupan lama dan satu entri `create` untuk keanggotaan baru per siswa.
   - `data_sebelum`/`data_sesudah` hanya kolom yang berubah.
   - Jika langkah data berhasil tetapi audit gagal, recovery menulis audit dari intent (idempotent berdasarkan `transfer_batch_id` + siswa + aksi).
   - Entri ringkasan batch berisi jumlah berhasil/gagal.

7. **Hasil sebagian**
   - Untuk kelompok, proses per siswa independen; kegagalan satu siswa tidak membatalkan siswa lain yang sudah selesai.
   - Tampilkan hasil: berhasil, gagal, perlu pemulihan.
   - Jangan menandai batch "selesai" jika masih ada siswa gagal.

8. **Pencegahan dua keanggotaan aktif**
   - Validasi akhir setelah batch: setiap siswa maksimal satu baris `aktif`.
   - Jika ditemukan dua aktif, hentikan dan tandai untuk pemulihan manual.

## M. Tampilan dan Informasi

### Jalur detail siswa
- Identitas siswa (nama, NIS).
- Kelas aktif (kelas asal).
- Dropdown kelas tujuan (aktif, bukan kelas asal).
- Input tanggal perpindahan.
- Ringkasan konfirmasi: siswa, kelas asal, kelas tujuan, tanggal.
- Tombol konfirmasi dan batal (`BackButton`).

### Jalur detail kelas
- Nama kelas asal dan pengajar.
- Daftar anggota aktif (checkbox; hanya `status_keanggotaan = aktif`).
- Pencarian dalam daftar anggota (opsional).
- Dropdown kelas tujuan (aktif, bukan kelas asal).
- Jumlah siswa terpilih.
- Input tanggal perpindahan.
- Ringkasan konfirmasi: kelas asal, daftar siswa, jumlah, kelas tujuan, tanggal.
- Tombol konfirmasi dan batal.

## N. Integrasi Navigasi (Rekomendasi, Belum Diubah)

1. Detail siswa (`src/app/admin/siswa/[siswaId]/page.js`):
   - Tombol "Pindahkan Kelas" di dekat informasi "Kelas yang diikuti".
2. Detail kelas (`src/app/admin/kelas/[kelasId]/page.js`):
   - Tombol "Pindahkan Siswa" di dekat "Tambah Siswa ke Kelas".
3. Setelah sukses:
   - Jalur siswa → kembali ke detail siswa; tampilkan kelas aktif baru + riwayat.
   - Jalur kelas → kembali ke detail kelas; tampilkan daftar anggota aktif terbaru + ringkasan hasil.
4. Riwayat perpindahan:
   - Di detail siswa: tabel riwayat keanggotaan (kelas, tanggal mulai, tanggal selesai, status).
   - Di detail kelas: bagian "Riwayat anggota" (anggota yang pernah masuk, termasuk `selesai`).

## O. Integrasi dengan Struktur Google Spreadsheet

Struktur final `kelas_siswa`:
`kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_mulai`, `tanggal_selesai`, `status_keanggotaan`, `created_at`, `updated_at`.

Hubungan:
- `kelas_siswa.siswa_id` → `siswa.siswa_id`.
- `kelas_siswa.kelas_id` → `kelas.kelas_id`.
- `absensi.kelas_id` → `kelas.kelas_id` (historis, tidak diubah saat pindah).
- `absensi_detail.absensi_id` → `absensi.absensi_id`; `absensi_detail.siswa_id` → `siswa.siswa_id`.
- `audit_log.user_id` → `users.user_id`; `nama_tabel = "kelas_siswa"`; `record_id` = `kelas_siswa_id` lama/baru sesuai aksi.

Catatan: Spreadsheet saat ini masih 10 worksheet; `audit_log` dan header final `kelas_siswa` belum diterapkan. Implementasi fitur harus menunggu penerapan struktur tersebut.

## P. Rekomendasi Tampilan Riwayat Kelas

1. **Detail siswa**:
   - Kelas aktif (badge).
   - Tabel riwayat: kelas, tanggal mulai, tanggal selesai, status.
   - Tombol "Pindahkan Kelas".
2. **Detail kelas**:
   - Daftar anggota aktif (periode berjalan).
   - Bagian "Riwayat anggota" (pernah masuk, termasuk `selesai`).
   - Jumlah anggota aktif.
3. **Riwayat perpindahan**:
   - Di detail siswa, urutkan `tanggal_mulai` terbaru.
   - Tampilkan asal → tujuan bila memungkinkan.
4. **Tanggal**:
   - `tanggal_selesai` kosong ditampilkan `-`.
5. **Absensi historis**:
   - Dikelompokkan berdasarkan `absensi.kelas_id`, bukan kelas aktif siswa saat ini.

## Q. Daftar File yang Terdampak

### Aktual (sudah ada)
- `src/app/admin/siswa/[siswaId]/page.js` — titik masuk jalur siswa.
- `src/app/admin/siswa/page.js` — daftar siswa.
- `src/app/admin/kelas/[kelasId]/page.js` — titik masuk jalur kelas + riwayat.
- `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js` — pola pemilihan siswa (statis; belum bisa dipakai langsung).
- `src/app/admin/absensi/[absensiId]/page.js` — konteks absensi historis.
- `src/components/ui/back-button.js` — komponen reusable tersedia.
- `src/repositories/sheets-repository.js` — fondasi akses Sheets (belum dipakai halaman).
- `src/repositories/user-repository.js` — placeholder.
- `src/services/user-management-service.js` — placeholder.
- `src/lib/google-sheets-client.js` — client Sheets.
- `src/config/google-sheets.js` — konfigurasi Sheets.

### Rekomendasi file baru (belum ada)
- Halaman jalur siswa: `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js`.
- Halaman jalur kelas: `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js`.
- Komponen form/konfirmasi/riwayat (nama belum ditentukan; jangan dianggap ada).
- Repository kelas_siswa/siswa/kelas/audit_log (nama belum ditentukan).
- Service perpindahan kelas (rekomendasi nama: `src/services/class-transfer-service.js`; belum ada).
- API/server action perpindahan (nama belum ditentukan).

### Rekomendasi file yang diubah (belum dilakukan)
- `src/app/admin/siswa/[siswaId]/page.js` — tombol + riwayat keanggotaan.
- `src/app/admin/kelas/[kelasId]/page.js` — tombol pindah + anggota aktif/riwayat.
- `src/app/admin/siswa/page.js` — kolom kelas aktif/riwayat.

## R. Risiko dan Potensi Masalah

1. **Struktur Spreadsheet belum final**: `audit_log` belum ada dan `kelas_siswa` masih header lama → fitur belum bisa diimplementasikan.
2. **Tidak ada transaksi atomik**: perlu intent/recovery; kegagalan sebagian bisa membuat siswa tanpa keanggotaan aktif sementara.
3. **Tidak ada validasi server-side saat ini**: semua form statis.
4. **Id hardcode**: link detail memakai id sama; pengujian perpindahan perlu id nyata.
5. **Absensi historis**: `absensi.kelas_id` tidak boleh diubah.
6. **Audit tidak sinkron**: jika audit ditulis setelah perubahan dan gagal, perlu recovery dari intent.
7. **Tidak ada komponen tabel/form/modal**: UI perpindahan memerlukan komponen baru.
8. **Pemilihan kelompok**: risiko siswa dari kelas berbeda jika query tidak difilter `kelas_id` + `status_keanggotaan = aktif`.

## S. Keputusan yang Masih Membutuhkan Persetujuan

1. Apakah dua route final disetujui:
   - `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js`
   - `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js`
2. Apakah tanggal perpindahan boleh manual atau selalu hari ini?
3. Untuk kelompok: jika satu siswa gagal, lanjutkan siswa lain (partial) atau batalkan seluruh batch?
4. Apakah `audit_log` mencatat per siswa (update + create) saja, atau juga satu entri ringkasan batch?
5. Bagaimana penanganan data lama yang sudah memiliki dua keanggotaan aktif?
6. Apakah perlu halaman riwayat perpindahan tersendiri atau cukup di detail siswa/kelas?
7. Kapan penerapan `audit_log` dan header final `kelas_siswa` ke Spreadsheet dilakukan?

Tidak ada perubahan kode, navigasi, dokumentasi lain, atau Google Spreadsheet dalam pembaruan rancangan ini.

---

## T. Audit Keamanan Proses Pemindahan

Pemeriksaan terhadap rancangan sebelumnya menemukan titik risiko berikut:

1. **Intent belum tersimpan sebagai data terstruktur.** Rancangan sebelumnya menyebut intent di `audit_log`, tetapi `audit_log` tidak memiliki status batch, daftar siswa, atau penanda lanjutan. Ini menyulitkan recovery yang dapat di-query.
2. **Status batch belum formal.** Belum ada definisi `pending` sampai `recovery_required`.
3. **Urutan operasi berisiko.** Jika keanggotaan baru dibuat sebelum lama ditutup, dua keanggotaan aktif dapat muncul. Rancangan menetapkan urutan: tutup lama → buat baru.
4. **Idempotensi belum cukup.** Belum ada kunci unik per siswa per batch untuk mencegah baris baru ganda saat retry.
5. **Audit ganda mungkin terjadi.** Retry dapat menulis audit yang sama dua kali jika tidak ada idempotency key.
6. **Pemrosesan paralel berisiko.** Google Sheets tidak mendukung locking; proses batch harus sekuensial.
7. **Aktor belum tersedia.** `user_id` pelaku belum bisa diambil karena autentikasi belum fungsional.
8. **Struktur Spreadsheet belum siap.** `audit_log` belum ada dan `kelas_siswa` masih header lama.

Kesimpulan: rancangan aman secara konsep, tetapi **belum aman untuk implementasi** tanpa intent terstruktur, status batch, idempotensi, dan recovery yang eksplisit.

## U. Desain Intent dan Recovery

### U.1 Worksheet Intent yang Direkomendasikan

Diperlukan worksheet khusus untuk intent. Rekomendasi (belum tersedia, belum diterapkan):

**`pemindahan_kelas`** (batch)

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `pemindahan_id` | string | Ya | PK. `PMK-NNNN`. |
| `kelas_asal_id` | string | Ya | FK → `kelas.kelas_id`. |
| `kelas_tujuan_id` | string | Ya | FK → `kelas.kelas_id`. |
| `tanggal_pemindahan` | date | Ya | `YYYY-MM-DD`. |
| `dilakukan_oleh` | string | Ya | FK → `users.user_id`. |
| `status` | string | Ya | `pending` / `processing` / `completed` / `partially_completed` / `failed` / `recovery_required`. |
| `total_siswa` | number | Ya | Jumlah siswa dalam batch. |
| `jumlah_berhasil` | number | Ya | Jumlah `completed`. |
| `jumlah_gagal` | number | Ya | Jumlah `failed`. |
| `jumlah_dilewati` | number | Ya | Jumlah `skipped`. |
| `waktu_mulai` | datetime | Ya | Waktu batch mulai diproses. |
| `waktu_selesai` | datetime | Tidak | Waktu batch selesai. |
| `error_message` | string | Tidak | Ringkasan kegagalan batch. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

**`pemindahan_kelas_detail`** (per siswa)

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `detail_id` | string | Ya | PK. `PMD-NNNN`. |
| `pemindahan_id` | string | Ya | FK → `pemindahan_kelas.pemindahan_id`. |
| `siswa_id` | string | Ya | FK → `siswa.siswa_id`. |
| `kelas_siswa_lama_id` | string | Ya | FK → `kelas_siswa.kelas_siswa_id` (baris lama). |
| `kelas_siswa_baru_id` | string | Tidak | FK → `kelas_siswa.kelas_siswa_id` (baris baru). |
| `status_siswa` | string | Ya | `pending` / `processing` / `completed` / `failed` / `skipped`. |
| `alasan` | string | Tidak | Alasan gagal/dilewati. |
| `waktu_mulai` | datetime | Tidak | Waktu siswa mulai diproses. |
| `waktu_selesai` | datetime | Tidak | Waktu siswa selesai. |
| `error_message` | string | Tidak | Detail error. |
| `created_at` | datetime | Ya | Timestamp pembuatan. |
| `updated_at` | datetime | Ya | Timestamp pembaruan. |

Constraint:
- Kombinasi `pemindahan_id` + `siswa_id` unik.
- Satu batch hanya untuk satu kelas asal dan satu kelas tujuan.

Catatan: penambahan 2 worksheet ini mengubah total worksheet final dari 11 menjadi 13. **Belum disetujui/diterapkan.**

### U.2 Identitas dan Isi Intent

Setiap pemindahan memiliki `pemindahan_id` unik yang mencatat:
- ID pemindahan.
- Daftar siswa (di `pemindahan_kelas_detail`).
- Kelas asal dan tujuan.
- Tanggal pemindahan.
- Pengguna pelaku (`dilakukan_oleh`).
- Status proses.
- Waktu mulai/selesai.
- Informasi kegagalan.

### U.3 Status Batch

| Status | Kapan digunakan | Perubahan berikutnya |
|---|---|---|
| `pending` | Batch dibuat, belum ada siswa diproses. | → `processing` |
| `processing` | Minimal satu siswa sedang diproses. | → `completed` / `partially_completed` / `failed` / `recovery_required` |
| `completed` | Semua siswa `completed` (atau `skipped` yang disetujui) tanpa kegagalan. | Final |
| `partially_completed` | Sebagian `completed`, sebagian `failed`/`skipped`. | → `completed` setelah recovery berhasil |
| `failed` | Tidak ada siswa berhasil; batch tidak dapat dilanjutkan tanpa perbaikan. | → `recovery_required` / `processing` setelah perbaikan |
| `recovery_required` | Ditemukan inkonsistensi data atau kegagalan tulis berulang. | → `processing` setelah tindakan Admin |

### U.4 Status per Siswa

| Status | Kapan digunakan |
|---|---|
| `pending` | Belum diproses. |
| `processing` | Sedang ditutup/dibuka. |
| `completed` | Keanggotaan lama `selesai`, baru `aktif`, audit tertulis. |
| `failed` | Gagal dan tidak dapat dilanjutkan otomatis. |
| `skipped` | Dilewati karena tidak valid (mis. bukan anggota aktif kelas asal). |

### U.5 Urutan Operasi Aman

1. Buat batch `pending` + detail `pending`.
2. Ubah batch → `processing`.
3. Untuk setiap siswa (sekuensial):
   1. Baca ulang keanggotaan aktif siswa.
   2. Validasi masih anggota aktif kelas asal.
   3. Cek idempotensi:
      - Jika detail sudah `completed`, lewati.
      - Jika keanggotaan lama sudah `selesai` dan keanggotaan baru sudah ada, tandai `completed`.
      - Jika keanggotaan lama sudah `selesai` tetapi baru belum ada, lanjut ke langkah 5.
   4. Tutup keanggotaan lama (`status_keanggotaan = selesai`, `tanggal_selesai`).
   5. Buat keanggotaan baru (`status_keanggotaan = aktif`, `tanggal_mulai`).
   6. Tulis audit `update` (lama) dan `create` (baru).
   7. Tandai detail `completed`.
4. Hitung hasil; set batch `completed` / `partially_completed` / `failed`.
5. Jika ada kegagalan yang tidak dapat diselesaikan otomatis → `recovery_required`.

Urutan ini mencegah dua keanggotaan aktif. Risiko sementara: siswa tanpa keanggotaan aktif jika langkah 5 gagal; ini ditangani recovery.

### U.6 Idempotensi

- Kunci unik: `pemindahan_id` + `siswa_id` (detail).
- Sebelum membuat baris baru, cek apakah sudah ada `kelas_siswa` `aktif` untuk siswa + kelas tujuan + `tanggal_mulai` yang sama.
- Sebelum menutup, cek apakah baris lama sudah `selesai`.
- Sebelum menulis audit, cek idempotency key (rekomendasi: tambah kolom `idempotency_key` pada `audit_log`, atau simpan kunci di `keterangan` dan cek sebelum append).
- Retry dengan `pemindahan_id` yang sama harus melanjutkan, bukan membuat batch baru.

### U.7 Kondisi yang Memerlukan Recovery Manual

1. Ditemukan lebih dari satu keanggotaan `aktif` untuk siswa yang sama.
2. Keanggotaan lama sudah `selesai`, tetapi keanggotaan baru tidak ada setelah retry.
3. Keanggotaan baru sudah ada, tetapi audit tidak tertulis setelah retry.
4. Status detail tidak cocok dengan kondisi aktual `kelas_siswa`.
5. Kelas tujuan berubah menjadi `nonaktif` di tengah proses.
6. Keanggotaan siswa diubah proses lain saat batch berjalan (konflik).
7. Kegagalan tulis Google Sheets berulang (rate limit/error server).

### U.8 Tindakan Recovery

1. Admin membuka batch `recovery_required` (halaman/aksi belum dirancang).
2. Sistem membaca ulang data aktual + intent.
3. Sistem menampilkan rencana lanjutan per siswa.
4. Admin mengonfirmasi recovery.
5. Service melanjutkan langkah yang belum selesai.
6. Setiap tindakan recovery ditulis ke `audit_log` (aksi `recovery`, `keterangan` berisi `pemindahan_id`, `siswa_id`, status).

## V. Desain Pemindahan Kelompok

1. Batch berisi 1..N siswa dari satu kelas asal.
2. Semua siswa diproses sekuensial (bukan paralel) untuk mengurangi konflik.
3. Setiap siswa punya baris `pemindahan_kelas_detail` sendiri.
4. Setiap siswa punya riwayat `kelas_siswa` sendiri (lama `selesai`, baru `aktif`).
5. Hasil batch menampilkan:
   - Jumlah berhasil.
   - Jumlah gagal.
   - Jumlah dilewati.
   - Status per siswa.
   - Alasan gagal/dilewati.
6. Kegagalan satu siswa tidak mengubah data siswa lain yang sudah `completed`.
7. Batch dengan sebagian gagal → `partially_completed`.
8. Batch tanpa keberhasilan → `failed`.
9. Inkonsistensi → `recovery_required`.
10. Daftar siswa hanya berasal dari `kelas_siswa` dengan `kelas_id` = kelas URL dan `status_keanggotaan = aktif`.

## W. Audit Log untuk Pemindahan

1. Setiap siswa yang berhasil:
   - Audit `update` untuk penutupan keanggotaan lama.
   - Audit `create` untuk keanggotaan baru.
2. Setiap kegagalan:
   - Audit `update`/`transfer_failed` dengan alasan.
3. Setiap recovery:
   - Audit `recovery` dengan `pemindahan_id`, `siswa_id`, dan hasil.
4. Audit batch:
   - Satu entri ringkasan batch (aksi `transfer`) berisi jumlah berhasil/gagal/dilewati.
5. Anti-duplikasi:
   - Idempotency key per `pemindahan_id` + `siswa_id` + aksi.
   - Cek audit existing sebelum append.
6. `data_sebelum`/`data_sesudah` hanya kolom yang berubah.
7. Tidak menyimpan rahasia.

## X. Rekomendasi Struktur Data Tambahan

### Sudah tersedia (aktual)
- 10 worksheet: `sekolah`, `users`, `siswa`, `kelas`, `kelas_siswa`, `jadwal`, `absensi`, `absensi_detail`, `pemantauan_ketidakhadiran`, `riwayat_kontak`.
- `kelas_siswa` masih memakai header lama (`tanggal_daftar`, `status`), belum header final.
- `audit_log` belum tersedia.

### Sudah direncanakan, belum diterapkan
- `audit_log` (9 kolom) — wajib untuk audit pemindahan.

### Rekomendasi baru (belum disetujui)
- `pemindahan_kelas` — intent batch (15 kolom).
- `pemindahan_kelas_detail` — intent per siswa (12 kolom).
- Kolom tambahan opsional `idempotency_key` pada `audit_log` — untuk mencegah audit ganda.

### Dampak
- Total worksheet final berubah dari 11 → 13 (jika intent disetujui).
- Perlu pembaruan `GOOGLE_SHEETS_SCHEMA.md` dan rencana penerapan setelah disetujui (belum dilakukan pada tahap ini).

## Y. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Dua keanggotaan aktif | Tutup lama sebelum buat baru; validasi akhir; recovery. |
| Siswa tanpa keanggotaan aktif sementara | Intent + recovery membuat baris baru jika hilang. |
| Baris baru ganda | Idempotency `pemindahan_id` + `siswa_id`; cek sebelum insert. |
| Audit ganda | Idempotency key; cek sebelum append. |
| Audit tidak sesuai data | Audit ditulis setelah setiap perubahan; recovery menulis audit yang hilang. |
| Proses berhenti di tengah | Status `processing` + detail per siswa; resume dari detail `pending`/`processing`. |
| Batch paralel/konflik | Proses sekuensial; validasi ulang sebelum menulis. |
| Rate limit Google Sheets | Retry backoff; batch kecil; status `recovery_required` jika berulang. |
| `user_id` pelaku tidak tersedia | Menunggu autentikasi fungsional. |
| Struktur Spreadsheet belum siap | Terapkan `audit_log` + header final `kelas_siswa` lebih dulu. |
| Data lama sudah punya dua aktif | Deteksi saat preflight; `recovery_required`; perbaikan manual Admin. |

## Z. Checklist Kesiapan Implementasi

### Rancangan
- [x] Dua jalur akses (detail siswa & detail kelas) ditetapkan.
- [x] Service dan aturan validasi bersama ditetapkan.
- [x] Urutan operasi (tutup lama → buat baru) ditetapkan.
- [x] Status batch dan status per siswa didefinisikan.
- [x] Idempotensi dan recovery dirancang.
- [x] Audit per siswa + audit batch dirancang.
- [x] Aturan bisnis dipertahankan.
- [x] Kondisi recovery manual diidentifikasi.

### Struktur Data
- [ ] Worksheet `audit_log` diterapkan ke Spreadsheet.
- [ ] Header final `kelas_siswa` diterapkan.
- [ ] Worksheet `pemindahan_kelas` disetujui/dibuat.
- [ ] Worksheet `pemindahan_kelas_detail` disetujui/dibuat.
- [ ] Kolom `idempotency_key` pada `audit_log` disetujui (opsional).

### Kode
- [x] Halaman `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js` dibuat (UI statis).
- [x] Halaman `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` dibuat (UI statis).
- [ ] Service perpindahan kelas dibuat.
- [ ] Repository `kelas_siswa`, `kelas`, `siswa`, `audit_log`, intent dibuat.
- [ ] Server action/API dibuat.
- [ ] Komponen form/konfirmasi/riwayat dibuat.
- [ ] Detail siswa & detail kelas dihubungkan ke fitur.

### Validasi & Pengujian
- [ ] Autentikasi fungsional (untuk `user_id` pelaku).
- [ ] Uji pemindahan individual.
- [ ] Uji pemindahan kelompok.
- [ ] Uji kegagalan di tengah proses.
- [ ] Uji recovery.
- [ ] Uji idempotensi (retry tidak menggandakan data).
- [ ] Uji audit tidak ganda.
- [ ] Uji absensi historis tidak berubah.
- [ ] Uji duplikasi keanggotaan aktif.

Tidak ada perubahan kode, navigasi, dokumentasi lain, atau Google Spreadsheet dalam pemeriksaan akhir ini.

---

## AA. Perbandingan Pendekatan Urutan Operasi

### Pendekatan 1 — Tutup lama, lalu buat baru

Urutan:
1. Tutup keanggotaan lama (`status_keanggotaan = selesai`).
2. Buat keanggotaan baru (`aktif`).

| Aspek | Penilaian |
|---|---|
| Dua keanggotaan aktif | Tidak terjadi (lama sudah ditutup sebelum baru dibuat). |
| Siswa kehilangan kelas aktif | **Berisiko**: ada jeda tanpa keanggotaan aktif jika langkah 2 gagal. |
| Recovery | Sederhana: jika baru belum ada, buat baru. |
| Duplikasi | Rendah jika idempotensi diterapkan. |
| Kesesuaian struktur saat ini | Cocok dengan status `aktif`/`selesai` yang ada. |

Kelemahan utama: melanggar prinsip "siswa tidak boleh kehilangan kelas aktif" selama jeda atau saat gagal.

### Pendekatan 2 — Buat baru sementara, verifikasi, lalu tukar status

Urutan:
1. Buat keanggotaan baru dengan status sementara (`pending`).
2. Verifikasi data baru.
3. Tutup keanggotaan lama dan aktifkan keanggotaan baru dalam satu operasi update gabungan.
4. Verifikasi hasil akhir.

| Aspek | Penilaian |
|---|---|
| Dua keanggotaan aktif | Tidak terjadi jika `pending` tidak dihitung aktif. |
| Siswa kehilangan kelas aktif | Tidak terjadi: lama tetap `aktif` sampai swap. |
| Recovery | Lebih kaya: bisa lanjut swap atau batalkan `pending`. |
| Duplikasi | Rendah jika `pending` dicek berdasarkan ID yang disimpan di detail. |
| Kesesuaian struktur saat ini | **Perlu status baru `pending`** pada `kelas_siswa`. |

Kelemahan: memerlukan perubahan status dan operasi swap gabungan. Jika swap tidak atomik, bisa muncul kondisi antara; recovery harus mendeteksi.

### Alternatif yang Lebih Aman

**Pendekatan 2 yang disempurnakan** (direkomendasikan):

1. Preflight validasi.
2. Buat intent batch + detail.
3. Buat baris `kelas_siswa` baru dengan `status_keanggotaan = pending`.
4. Verifikasi baris `pending`.
5. Swap dalam satu `values.batchUpdate`: set lama `selesai` + set baru `aktif`.
6. Verifikasi: tepat satu `aktif`, lama `selesai`, baru `aktif`.
7. Tulis audit per siswa.
8. Tandai detail `completed`.

Alasan:
- Tidak ada jeda tanpa kelas aktif (lama tetap aktif sampai swap).
- Tidak ada dua kelas aktif (baru `pending` sampai swap).
- Swap gabungan mengurangi jendela inkonsistensi.
- Recovery dapat memilih melanjutkan swap atau membatalkan `pending`.

Catatan: `values.batchUpdate` bukan jaminan transaksi atomik. Karena itu verifikasi dan recovery tetap wajib.

## AB. Keputusan Urutan Operasi Final

**Urutan final: Pendekatan 2 yang disempurnakan.**

1. Validasi seluruh input sebelum menulis.
2. Buat batch `pemindahan_kelas` (`pending`) + detail siswa (`pending`).
3. Ubah batch → `processing`.
4. Untuk setiap siswa (sekuensial):
   1. Baca ulang keanggotaan aktif.
   2. Validasi anggota aktif kelas asal.
   3. Jika detail `completed`, lewati (idempotent).
   4. Jika baris `pending` untuk siswa + batch sudah ada, gunakan baris itu.
   5. Jika belum ada, buat baris baru `status_keanggotaan = pending`.
   6. Verifikasi baris `pending` (ID, kelas tujuan, siswa, tanggal).
   7. Swap satu batch update: lama `selesai`, baru `aktif`.
   8. Verifikasi hasil akhir (tepat satu `aktif`).
   9. Tulis audit `update` lama + `create` baru.
   10. Tandai detail `completed`.
5. Hitung hasil batch → `completed` / `partially_completed` / `failed`.
6. Jika inkonsistensi → `recovery_required`.

Konsekuensi struktur:
- `status_keanggotaan` memerlukan nilai `pending` (dan idealnya `dibatalkan` untuk pending yang dibatalkan).
- Perlu kolom/penanda untuk mengaitkan baris `pending` ke intent (dapat memakai `pemindahan_kelas_detail.kelas_siswa_baru_id`).

## AC. Simulasi Kegagalan dan Recovery

### AC.1 Gagal sebelum proses dimulai

- Data: tidak ada perubahan.
- Intent: tidak ada batch.
- Recovery: tidak perlu. Admin mengulang dari awal.
- Duplikasi: tidak ada.
- Hasil: tidak ada data berubah.

### AC.2 Gagal setelah intent dibuat

- Data: `pemindahan_kelas` `pending`, detail `pending`; `kelas_siswa` belum berubah.
- Recovery: lanjutkan batch yang sama (`pemindahan_id`), bukan buat batch baru.
- Duplikasi: dicegah oleh `pemindahan_id` + `siswa_id`.
- Hasil: batch dilanjutkan sampai `completed`/`partially_completed`.

### AC.3 Gagal setelah keanggotaan baru (`pending`) dibuat

- Data: lama `aktif`, baru `pending`.
- Intent: detail `processing`; `kelas_siswa_baru_id` tersimpan.
- Recovery: verifikasi baris `pending`, lalu lanjutkan swap; atau batalkan `pending` jika Admin memilih batal.
- Duplikasi: cek `kelas_siswa_baru_id`; jangan buat baris baru lagi.
- Hasil: swap selesai (lama `selesai`, baru `aktif`) atau `pending` dibatalkan.

### AC.4 Gagal setelah keanggotaan lama ditutup

- Data: lama `selesai`; baru `pending` atau `aktif` (tergantung batch update).
- Intent: detail `processing`.
- Recovery:
  - Jika baru `pending` → aktifkan baru.
  - Jika baru `aktif` → verifikasi dan tandai `completed`.
  - Jika tidak ada baris baru → buat baru dari intent (ID sudah ditentukan).
- Duplikasi: gunakan `kelas_siswa_baru_id` dari detail.
- Hasil: tepat satu `aktif`.

### AC.5 Gagal ketika audit log ditulis

- Data: lama `selesai`, baru `aktif` (perubahan data berhasil).
- Intent: detail `processing`/`completed`; audit belum lengkap.
- Recovery: tulis audit dari intent dengan idempotency key; cek audit existing sebelum append.
- Duplikasi: dicegah oleh `idempotency_key` (`pemindahan_id` + `siswa_id` + aksi).
- Hasil: audit lengkap; tidak ada audit ganda.

### AC.6 Aplikasi berhenti di tengah pemindahan kelompok

- Data: sebagian siswa `completed`, sebagian `processing`, sebagian `pending`.
- Intent: batch `processing`; detail mencerminkan status per siswa.
- Recovery: lanjutkan hanya detail `pending`/`processing`; `completed` dilewati.
- Duplikasi: status detail + ID baru mencegah pengulangan.
- Hasil: batch `partially_completed` atau `completed` setelah semua selesai.

### AC.7 Admin menjalankan recovery lebih dari sekali

- Data: kondisi akhir atau sebagian.
- Recovery: idempotent; setiap langkah mengecek status aktual sebelum menulis.
- Duplikasi: tidak ada baris/audit baru jika sudah `completed`.
- Hasil: percobaan kedua tidak mengubah data yang sudah benar; audit recovery tambahan hanya jika ada tindakan nyata.

## AD. Struktur Worksheet Final yang Diperlukan

### Kondisi aktual
- 10 worksheet tersedia.
- `kelas_siswa` masih header lama.
- `audit_log` belum ada.
- `pemindahan_kelas` dan `pemindahan_kelas_detail` belum ada.

### Rekomendasi final (belum disetujui/diterapkan)

**`pemindahan_kelas`** — intent batch:

| Kolom | Fungsi |
|---|---|
| `pemindahan_id` | PK batch. |
| `kelas_asal_id` | Kelas asal. |
| `kelas_tujuan_id` | Kelas tujuan. |
| `tanggal_pemindahan` | Tanggal efektif. |
| `dilakukan_oleh` | User pelaku. |
| `status` | Status batch (`pending`..`recovery_required`). |
| `total_siswa` | Jumlah siswa. |
| `jumlah_berhasil` | Jumlah `completed`. |
| `jumlah_gagal` | Jumlah `failed`. |
| `jumlah_dilewati` | Jumlah `skipped`. |
| `waktu_mulai` | Waktu mulai. |
| `waktu_selesai` | Waktu selesai. |
| `error_message` | Ringkasan error. |
| `created_at` | Timestamp pembuatan. |
| `updated_at` | Timestamp pembaruan. |

**`pemindahan_kelas_detail`** — intent per siswa:

| Kolom | Fungsi |
|---|---|
| `detail_id` | PK detail. |
| `pemindahan_id` | FK batch. |
| `siswa_id` | FK siswa. |
| `kelas_siswa_lama_id` | FK baris lama. |
| `kelas_siswa_baru_id` | FK baris baru (`pending`/`aktif`). |
| `status_siswa` | Status per siswa. |
| `alasan` | Alasan gagal/dilewati. |
| `waktu_mulai` | Waktu proses siswa. |
| `waktu_selesai` | Waktu selesai siswa. |
| `error_message` | Detail error. |
| `created_at` | Timestamp pembuatan. |
| `updated_at` | Timestamp pembaruan. |

**`audit_log`** — tambahan opsional:

| Kolom | Fungsi |
|---|---|
| `idempotency_key` | Kunci unik untuk mencegah audit ganda. |

**`kelas_siswa`** — penyesuaian status:

| Nilai `status_keanggotaan` | Fungsi |
|---|---|
| `pending` | Baris baru sementara, belum aktif. |
| `aktif` | Keanggotaan aktif. |
| `selesai` | Keanggotaan historis. |
| `dibatalkan` | Pending yang dibatalkan (opsional). |

Catatan: penambahan `pending` dan `idempotency_key` memerlukan persetujuan; total worksheet berubah 11 → 13 jika intent disetujui.

## AE. Aturan Idempotensi Final

1. Kunci batch: `pemindahan_id`.
2. Kunci siswa: `pemindahan_id` + `siswa_id` (unik di detail).
3. Kunci baris baru: `kelas_siswa_baru_id` disimpan sebelum/sesudah insert.
4. Kunci audit: `idempotency_key` = `pemindahan_id` + `siswa_id` + aksi.
5. Sebelum menulis:
   - Cek detail `completed` → lewati.
   - Cek baris baru berdasarkan ID → jangan buat ulang.
   - Cek baris lama sudah `selesai` → lewati penutupan.
   - Cek audit existing → jangan append ulang.
6. Retry memakai `pemindahan_id` yang sama.
7. Recovery tidak membuat batch baru kecuali Admin memilih membatalkan batch lama.

## AF. Checklist Kesiapan Implementasi (Final)

### Rancangan
- [x] Perbandingan Pendekatan 1 vs 2 selesai.
- [x] Urutan final (Pendekatan 2 disempurnakan) ditetapkan.
- [x] Simulasi 7 kondisi kegagalan selesai.
- [x] Aturan idempotensi ditetapkan.
- [x] Dua route dan service bersama ditetapkan.
- [x] Pemrosesan kelompok sekuensial ditetapkan.
- [x] Status batch dan status siswa ditetapkan.
- [x] Audit per siswa + batch ditetapkan.
- [x] `absensi.kelas_id` immutable dipertahankan.

### Struktur Data
- [ ] Status `pending` pada `kelas_siswa` disetujui.
- [ ] Status `dibatalkan` disetujui (opsional).
- [ ] Worksheet `pemindahan_kelas` disetujui.
- [ ] Worksheet `pemindahan_kelas_detail` disetujui.
- [ ] Kolom `idempotency_key` pada `audit_log` disetujui.
- [ ] `audit_log` diterapkan ke Spreadsheet.
- [ ] Header final `kelas_siswa` diterapkan.

### Kode
- [ ] Halaman jalur siswa dibuat.
- [ ] Halaman jalur kelas dibuat.
- [ ] Service perpindahan dibuat.
- [ ] Repository intent/kelas_siswa/audit_log dibuat.
- [ ] Server action/API dibuat.
- [ ] Komponen form/konfirmasi/riwayat dibuat.
- [ ] Navigasi dihubungkan.

### Pengujian
- [ ] Uji individual.
- [ ] Uji kelompok.
- [ ] Uji kegagalan sebelum intent.
- [ ] Uji kegagalan setelah intent.
- [ ] Uji kegagalan setelah `pending` dibuat.
- [ ] Uji kegagalan setelah lama ditutup.
- [ ] Uji kegagalan audit.
- [ ] Uji recovery berulang.
- [ ] Uji tidak ada dua `aktif`.
- [ ] Uji tidak ada kehilangan keanggotaan.
- [ ] Uji audit tidak ganda.
- [ ] Uji absensi historis tidak berubah.

## AG. Ringkasan Status

### Kondisi aktual
- 10 worksheet; `audit_log` belum ada; `kelas_siswa` header lama; belum ada intent worksheet.
- Halaman Admin masih statis; belum ada service/route perpindahan.

### Keputusan rancangan
- Urutan final: buat `pending` → verifikasi → swap → verifikasi → audit.
- Dua route resmi; service bersama; proses sekuensial; partial completion diizinkan.
- Tanggal default hari ini, dapat manual.
- Recovery oleh Admin.

### Rekomendasi
- Tambah `pending`/`dibatalkan` pada `kelas_siswa`.
- Tambah `pemindahan_kelas` dan `pemindahan_kelas_detail`.
- Tambah `idempotency_key` pada `audit_log`.

### Masih membutuhkan persetujuan
1. Status `pending`/`dibatalkan`.
2. Dua worksheet intent.
3. `idempotency_key`.
4. Partial vs rollback seluruh batch (ditetapkan partial, perlu konfirmasi final).
5. Tanggal manual (ditetapkan boleh, perlu konfirmasi final).
6. Penerapan Spreadsheet dan implementasi kode.

Tidak ada perubahan kode, navigasi, dokumen lain, atau Google Spreadsheet dalam evaluasi teknis ini.
