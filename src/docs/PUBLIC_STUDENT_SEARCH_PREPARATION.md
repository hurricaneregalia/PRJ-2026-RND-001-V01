# Persiapan Halaman Pencarian Siswa Publik

Tanggal: 27 November 2026
Scope: rencana halaman `/siswa` dan keterkaitannya dengan `/siswa/[siswaId]`
Status: dokumen persiapan; tidak ada perubahan kode/data/skema.

## A. Kondisi Implementasi Saat Ini

### A.1 Route
- `/siswa/[siswaId]` ada di `src/app/siswa/[siswaId]/page.js`.
- `/siswa` (halaman pencarian) **belum ada**; saat ini hanya ada folder `[siswaId]`. Tanpa `page.js` di `src/app/siswa/`, route `/siswa` tidak memiliki halaman.
- Tidak ada `src/middleware.js`.

### A.2 Autentikasi dan otorisasi
- Halaman `/siswa/[siswaId]` tidak mengimpor `auth`, `redirect`, atau `session`, dan tidak memeriksa role. Halaman ini publik tanpa login.
- Guard Admin hanya ada di `src/app/admin/layout.js`; route `/siswa/*` berada di luar area tersebut.
- Root layout `src/app/layout.js` tidak menambahkan autentikasi.

### A.3 Skema `siswa`
Kolom (`src/lib/sheet-schema.js`):
- `siswa_id` (primary key, format `SIS-NNNN`)
- `nama`
- `nis`
- `jenis_kelamin`
- `tanggal_lahir`
- `alamat`
- `no_hp`
- `status`
- `created_at`
- `updated_at`

Catatan:
- `tanggal_lahir` adalah tanggal lahir, bukan tanggal aktivitas/absensi.
- `created_at`/`updated_at` adalah metadata record, bukan tanggal kegiatan.
- Filter periode tidak dapat memakai tabel `siswa` saja.

### A.4 Repository siswa
`src/repositories/siswa-repository.js` menyediakan:
- `listSiswa()`
- `getSiswaById(siswaId)` — exact match `siswa_id`
- `findSiswaByNis(nis)` — exact match
- `createSiswa`, `updateSiswa`, `deactivateSiswa`

Belum ada fungsi pencarian gabungan berdasarkan `siswa_id`/`nama`/`nis`.

### A.5 Detail siswa dan parameter
- `src/app/siswa/[siswaId]/page.js` memakai `getSiswaById(siswaId)`.
- `searchParams.periode` diterima dengan nilai `30`, `90`, `180`, `365`; default `30`.
- `src/components/siswa/periode-filter.js` langsung mengganti URL saat radio berubah.

### A.6 Data tanggal untuk filter periode
Filter periode memakai:
- `absensi.tanggal` (`src/repositories/absensi-repository.js`)
- Relasi `absensi_detail.siswa_id` → `absensi.absensi_id`
- Hanya sesi `final`.

## B. Rancangan Input, Filter, Tombol Cari, dan Hasil

### B.1 Input pencarian
- **Satu input teks** (`q`).
- Dicocokkan ke tiga kolom dengan logika OR:
  - `siswa_id`
  - `nis`
  - `nama`

Usulan semantik pencocokan:
- `siswa_id`: exact, case-insensitive.
- `nis`: exact, case-insensitive.
- `nama`: substring, case-insensitive (mis. `budi handoyo` cocok dengan `Budi Handoyo`).
- Input di-trim sebelum diproses.

### B.2 Filter periode
Radio button:
- 30 hari terakhir (default aktif)
- 3 bulan terakhir
- 6 bulan terakhir
- 1 tahun terakhir

Keputusan: **filter periode ikut memfilter hasil pencarian berdasarkan absensi**.
- Sumber: `absensi.tanggal` + `absensi_detail.siswa_id`, hanya `final`.
- Siswa hanya muncul jika memiliki minimal satu absensi pada rentang periode.
- Konsekuensi: siswa yang identitasnya cocok tetapi tidak punya absensi pada periode tersebut **tidak muncul**. Perilaku ini perlu disadari.

### B.3 Tombol Cari
- Form `method="get"` + tombol `Cari`.
- Hasil hanya dirender setelah tombol ditekan (penanda `cari=1`).
- Tanpa penanda, tidak ada data siswa.

### B.4 Hasil
Setiap hasil hanya menampilkan:
- Nama siswa
- NIS

Keduanya dibungkus satu `<Link>` ke detail, membawa periode terpilih.

Format link:
- `/siswa/{id}?periode=90`
- Untuk periode default 30, boleh tanpa parameter: `/siswa/{id}`.

### B.5 Kondisi khusus
- Input kosong lalu `Cari` → tampilkan teks persis: `tulis identitas siswa` (tanpa data siswa).
- Tidak ada hasil → tampilkan teks persis: `Siswa tidak ditemukan`.
- Hasil dibatasi 20.
- Jika hasil sebenarnya lebih dari 20, tampilkan satu baris info bahwa hasil dibatasi 20.

## C. Sumber Data dan Alur Pencarian

### C.1 Sumber data
- Identitas: `siswa` (`siswa_id`, `nama`, `nis`).
- Periode: `absensi.tanggal` + `absensi_detail.siswa_id`, `status_absensi = 'final'`.

### C.2 Alur
1. Buka `/siswa` → form, hasil kosong.
2. Isi input dan pilih periode (default 30).
3. Tekan `Cari` → form GET mengirim `q`, `periode`, `cari=1`.
4. Server membaca `searchParams`, mencari identitas, memfilter berdasarkan absensi periode, membatasi 20 hasil, lalu render.
5. Klik hasil → `/siswa/{id}?periode=...`.
6. Detail menerapkan periode ke rekap/riwayat.

### C.3 Repository/service
- Fungsi lama belum cukup.
- Rekomendasi: tambah fungsi repository (mis. `searchSiswa`) yang memakai `list()` internal dan menerima `{ q, periodeMulai, periodeAkhir }` atau daftar `siswa_id` yang valid.
- Tidak perlu service baru; repository adalah lapisan data yang ada.
- Untuk filter periode, repository absensi/detail yang ada dapat dipakai (`listAbsensi`, `listAbsensiDetail`).

## D. Mencegah Hasil Tampil Sebelum Tombol Cari

### D.1 Sebelum pencarian
- Hasil tidak dirender tanpa penanda `cari=1`.
- Mengetik tidak memicu navigasi karena form hanya dikirim saat `Cari` ditekan.

### D.2 Setelah hasil tampil
Persyaratan: perubahan input atau radio setelah pencarian harus menyembunyikan hasil lama sampai `Cari` ditekan lagi.

Karena form GET murni tidak memicu render ulang saat mengetik, diperlukan state client:
- Satu komponen client membungkus form dan blok hasil.
- Saat input/radio berubah → `dirty = true`.
- Selama `dirty`, blok hasil disembunyikan.
- Saat submit, navigasi terjadi dan halaman baru merender hasil.

Ini membutuhkan satu komponen client baru.

## E. Format Parameter Periode dan Link Hasil

### E.1 Format yang dipakai
Tetap memakai format yang sudah berjalan:
- `periode=30` (default)
- `periode=90`
- `periode=180`
- `periode=365`

### E.2 Alasan
- Konsisten dengan halaman detail dan `PeriodeFilter`.
- Tidak perlu mengubah halaman detail.
- Format label seperti `3-bulan` akan memaksa perubahan di detail + komponen filter.

### E.3 Link hasil
- Bawa `periode` yang dipilih.
- Default 30 boleh tanpa parameter.

## F. Temuan Keamanan dan Privasi

### F.1 Akses
- `/siswa` dan `/siswa/[siswaId]` publik tanpa login.
- Tidak ada pemeriksaan hak akses; sesuai keputusan pemilik produk.

### F.2 Data yang dipakai
- Pencarian hanya `siswa_id`, `nama`, `nis`.
- Hasil hanya `nama` dan `nis`.
- Jangan tampilkan `alamat`, `no_hp`, `tanggal_lahir`, `status`.

### F.3 Risiko enumeration
- Satu input dapat dipakai menebak nama/NIS/ID.
- Tanpa batas, satu request bisa mengembalikan banyak siswa.
- ID berurutan memudahkan percobaan sistematis.
- Filter periode memperkecil hasil, tetapi bukan kontrol keamanan.

Mitigasi yang direncanakan:
- Wajib input tidak kosong.
- Batas 20 hasil.
- ID/NIS exact; nama substring.
- Rate limiting tidak diminta saat ini (risiko diterima).

### F.4 Halaman detail
- Tidak mengandalkan ID sulit ditebak.
- Data sensitif tidak ditampilkan.
- Tidak ada autentikasi; ini keputusan produk.

## G. Dampak terhadap Rencana Penggantian ID (Opsi B)

Keputusan final: **`public_id` dibatalkan**. Pencarian dan link hasil tetap memakai `siswa_id`. Tidak ada migrasi kolom dan tidak ada perubahan skema.

Alasan:
- Risiko teknis kecil, tetapi manfaat keamanan terbatas karena pencarian berdasarkan nama/NIS tetap memungkinkan penemuan siswa.
- `public_id` hanya mencegah tebakan URL langsung, bukan menutup enumeration lewat pencarian.
- Fokus keamanan dialihkan ke validasi input, batas hasil, dan data minimization.

Dampak:
- `/siswa/[siswaId]` tetap memakai `siswa_id`.
- Link hasil tetap `/siswa/{siswa_id}?periode=...`.
- Tidak ada perubahan pada `src/lib/sheet-schema.js` atau repository untuk `public_id`.

## H. File yang Diperkirakan Perlu Diubah

- `src/app/siswa/page.js` (baru) — halaman pencarian, baca `searchParams`, render hasil.
- `src/components/siswa/student-search-form.js` (baru) — form client, state `dirty`, sembunyikan hasil lama.
- `src/repositories/siswa-repository.js` — tambah fungsi pencarian.
- `src/app/siswa/[siswaId]/page.js` — tidak berubah.
- `src/components/siswa/periode-filter.js` — tidak wajib; radio bisa dibuat di form pencarian.
- `src/lib/sheet-schema.js` — tidak berubah (public_id dibatalkan).

## I. Keputusan Final

1. Input: satu input teks.
2. Pencocokan: `siswa_id` exact, `nis` exact, `nama` substring; semuanya case-insensitive.
3. Filter periode ikut memfilter hasil berdasarkan absensi final; default 30 hari.
4. Konsekuensi: siswa tanpa absensi pada periode tidak muncul — diterima.
5. Batas hasil: 20, dengan info jika terpotong.
6. Input kosong: `tulis identitas siswa`.
7. Tidak ada hasil: `Siswa tidak ditemukan`.
8. Format periode: numerik `30|90|180|365`.
9. `public_id` dibatalkan; pencarian memakai `siswa_id`.

## J. Skenario Pengujian

1. Buka `/siswa` tanpa parameter → form, tanpa data siswa.
2. Ketik tanpa `Cari` → tidak ada data siswa.
3. `Cari` dengan ID valid → Nama + NIS tampil.
4. `Cari` dengan NIS valid → hasil sesuai.
5. `Cari` dengan nama beda kapital (`budi handoyo` vs `Budi Handoyo`) → hasil muncul.
6. `Cari` dengan kombinasi yang tidak cocok → `Siswa tidak ditemukan`.
7. `Cari` dengan input kosong → `tulis identitas siswa`.
8. Setelah hasil tampil, ubah input → hasil lama hilang sampai `Cari` ditekan.
9. Setelah hasil tampil, ubah radio periode → hasil lama hilang sampai `Cari` ditekan.
10. Tiap periode → link hasil membawa `periode` benar.
11. Buka link hasil → detail mengikuti periode.
12. Siswa tanpa absensi pada periode → tidak muncul.
13. Hasil > 20 → hanya 20 tampil + info bahwa hasil dibatasi.
14. HTML hasil/detail tidak memuat `alamat`, `no_hp`, `tanggal_lahir`, `status`.
15. Input berisi HTML/JS → di-escape React.
16. `periode` tidak valid → default 30.
17. `/admin/siswa/...` tanpa login → dialihkan ke `/login`.
