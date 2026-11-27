# Audit Keamanan ID Siswa pada Halaman Detail Siswa Publik

Tanggal audit: 27 November 2026
Scope: `src/app/siswa/[siswaId]/page.js` dan dependensi langsungnya
Batasan: audit dan dokumentasi saja; tidak ada perubahan kode/data/skema.

## 1. Ringkasan Temuan

Halaman `/siswa/SIS-0039` dapat dibuka **tanpa login** dan menampilkan data siswa berdasarkan ID yang diberikan pada URL. Tidak ada autentikasi atau otorisasi sebelum data ditampilkan. ID siswa berbentuk `SIS-NNNN` berurutan dan mudah ditebak, sehingga siapa pun yang mengetahui pola ID dapat mencoba ID lain untuk melihat data siswa lain.

ID yang mudah ditebak **merupakan risiko nyata** pada halaman ini, tetapi **mengganti ID saja tidak cukup**. Halaman ini memang dirancang untuk diakses publik/anonim, sehingga kerahasiaan data bergantung pada:
- pemilihan data yang boleh ditampilkan (least privilege), dan
- mekanisme kontrol akses tambahan bila diperlukan.

## 2. Bukti Implementasi Halaman

### 2.1 Route dan guard
- File: `src/app/siswa/[siswaId]/page.js`
- Tidak ada `import { auth }`, `redirect`, `session`, atau pemeriksaan role.
- Tidak ada `src/middleware.js`.
- Guard hanya ada di `src/app/admin/layout.js` untuk area `/admin`; route `/siswa/*` berada di luar area tersebut.
- Root layout `src/app/layout.js` tidak menambahkan autentikasi.

Kesimpulan: halaman dapat diakses tanpa autentikasi.

### 2.2 Pengambilan data
Di `src/app/siswa/[siswaId]/page.js`:

```js
const { siswaId } = await params;
const siswa = await getSiswaById(siswaId);
...
const membership = await findActiveKelasSiswaBySiswaId(siswaId);
const kelas = membership ? await getKelasById(membership.kelas_id) : null;
const pengajar = kelas?.pengajar_id ? await getUserById(kelas.pengajar_id) : null;
```

- `siswaId` dari URL langsung dipakai sebagai primary key.
- Jika ID valid, data siswa, kelas aktif, guru pengajar, rekap kehadiran, dan riwayat absensi ditampilkan.
- Jika ID tidak valid, ditampilkan "Siswa tidak ditemukan".
- Tidak ada pemeriksaan hak akses sebelum data ditampilkan.

### 2.3 Data yang ditampilkan
- NIS
- Nama lengkap
- Jenis kelamin
- Kelas yang diikuti
- Nama Guru
- Rekap kehadiran (Hadir, Izin, Sakit, Alpa)
- Riwayat absensi (tanggal | status)

### 2.4 Data yang disembunyikan
Tidak dirender sama sekali:
- Tanggal lahir
- Alamat
- Nomor HP
- Status

### 2.5 Filter periode
- Parameter `?periode=30|90|180|365`.
- Default `30` jika kosong/tidak valid.
- Hanya sesi absensi berstatus `final` yang dihitung.
- Filter diterapkan ke rekap dan riwayat.

### 2.6 Endpoint/API langsung
- Tidak ada route API publik yang menerima ID siswa. Satu-satunya API adalah `src/app/api/auth/[...nextauth]/route.js`.
- Akses data dilakukan langsung via repository di Server Component, bukan melalui API terpisah.

## 3. Penggunaan ID Siswa di Seluruh Aplikasi

### 3.1 Skema dan generator
- Tabel: `siswa`, kolom primary key: `siswa_id`.
- Prefix: `SIS` (lihat `src/lib/sheet-schema.js`, baris prefix `siswa: 'SIS'`).
- Format: `SIS-NNNN` (regex `/^([A-Z]{3})-(\d{4})$/` di `src/lib/id-generator.js`).
- Generator: `nextRecordId(prefix, records, idColumn)` memilih sequence tertinggi + 1, maksimum 9999.
- Tidak ada komponen acak; ID berurutan dan mudah ditebak.

### 3.2 Relasi data
`siswa_id` digunakan sebagai foreign key di:
- `kelas_siswa` (`src/repositories/kelas-siswa-repository.js`)
- `absensi_detail` (`src/repositories/absensi-detail-repository.js`)
- `pemantauan_ketidakhadiran`
- `riwayat_kontak`
- `pemindahan_kelas_detail`

### 3.3 Penggunaan di route dan halaman
- `/admin/siswa/[siswaId]` (detail lengkap, termasuk 4 field sensitif)
- `/admin/siswa/[siswaId]/edit`
- `/admin/siswa/[siswaId]/pindah-kelas`
- `/admin/absensi/[absensiId]` (menampilkan siswa per absensi)
- `/admin/laporan/kehadiran-siswa`
- `/admin/laporan/hubungi-pengajar/[pengajarId]`
- `/admin/absensi` (rekap per siswa)
- `/admin/absensi/tambah` (input absensi per siswa)
- `/siswa/[siswaId]` (halaman publik ini)

### 3.4 Penggunaan lain
- `siswa.nis` adalah nomor identitas yang ditampilkan kepada pengguna, berbeda dari `siswa_id`.
- `siswa_id` juga dipakai sebagai React key dan parameter query (`siswaId`).

## 4. Evaluasi Opsi ID

### A. Pertahankan ID saat ini + perkuat autentikasi/otorisasi
Kelebihan:
- Tidak ada migrasi data.
- Tidak ada perubahan route atau relasi.
- Risiko terendah terhadap integritas data.

Kekurangan:
- ID tetap mudah ditebak; enumeration tetap mungkin jika halaman publik/anonim.
- Tidak menyelesaikan masalah enumeration pada halaman publik.

Dampak: rendah.
Risiko: enumeration tetap ada, tetapi bisa dikurangi dengan pembatasan data dan kontrol akses.

### B. ID publik acak untuk URL, pertahankan ID internal
Kelebihan:
- URL tidak mudah ditebak.
- ID internal dan relasi data tetap stabil.
- Migrasi data lebih kecil (tambah kolom `public_id`).

Kekurangan:
- Perlu menambah kolom dan generator ID acak.
- Perlu memastikan tidak ada generator baru jika yang tersedia cukup; saat ini generator hanya berbasis sequence, bukan acak.
- Perlu memperbarui semua route publik dan query.

Dampak: sedang.
Risiko: medium; perlu disiplin agar ID internal tidak bocor.

### C. Ganti ID internal siswa dengan ID acak
Kelebihan:
- URL dan internal ID konsisten.

Kekurangan:
- Migrasi besar pada Google Spreadsheet dan seluruh relasi (`kelas_siswa`, `absensi_detail`, dll.).
- Risiko tinggi terhadap integritas data.
- Perlu memperbarui banyak file dan query.

Dampak: tinggi.
Risiko: tinggi; tidak disarankan tanpa kebutuhan kuat.

## 5. Rekomendasi

### 5.1 Apakah ID yang mudah ditebak merupakan risiko nyata?
Ya, pada halaman publik ini. Karena:
- Halaman dapat dibuka tanpa login.
- Tidak ada pemeriksaan hak akses.
- ID berurutan (`SIS-0001` ... `SIS-0105`).
- Data yang ditampilkan (nama, NIS, kelas, guru, rekap, riwayat) dapat dienumerasi.

Namun, halaman ini sengaja publik dan data sensitif utama sudah disembunyikan. Risiko utama adalah **enumeration data identitas dan kehadiran**, bukan kebocoran data sensitif.

### 5.2 Apakah mengganti ID saja cukup?
Tidak. ID acak hanya mengurangi kemudahan enumeration, tetapi:
- tidak menggantikan autentikasi/otorisasi;
- tidak mencegah akses jika ID bocor;
- tidak melindungi data jika endpoint lain terbuka.

### 5.3 Pilihan yang paling sesuai
**Opsi A (pertahankan ID + perkuat kontrol)** sebagai langkah utama, dengan opsi B (ID publik acak) sebagai peningkatan bertahap jika diperlukan.

Alasan:
- Proyek menggunakan Google Spreadsheet dengan ID berbasis sequence yang konsisten.
- Relasi data luas; migrasi ID internal berisiko tinggi.
- Halaman publik sudah membatasi data yang ditampilkan.
- Belum ada generator ID acak; membuatnya sekarang akan menambah kompleksitas.

### 5.4 Apakah perlu dilakukan sekarang?
Tidak harus sekarang. Langkah bertahap lebih aman:
1. Audit dan pastikan data yang ditampilkan memang aman untuk publik (sudah dilakukan).
2. Tambahkan rate limiting / pembatasan akses jika memungkinkan.
3. Pertimbangkan ID publik acak hanya jika enumeration menjadi masalah nyata.
4. Jika diperlukan, implementasikan Opsi B dengan migrasi bertahap.

### 5.5 Dampak terhadap data yang sudah ada
- Opsi A: tidak ada dampak.
- Opsi B: perlu tambah kolom `public_id` dan generator; migrasi data existing.
- Opsi C: migrasi besar; berisiko tinggi.

## 6. Daftar File yang Kemungkinan Perlu Diubah (jika implementasi nanti)

Jika memilih Opsi B/C:
- `src/repositories/siswa-repository.js`
- `src/lib/sheet-schema.js` (skema dan prefix)
- `src/lib/id-generator.js` (jika diperlukan generator baru)
- `src/app/siswa/[siswaId]/page.js`
- `src/app/admin/siswa/[siswaId]/page.js`
- `src/app/admin/siswa/[siswaId]/edit/page.js`
- `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js`
- `src/app/admin/absensi/page.js`
- `src/app/admin/absensi/[absensiId]/page.js`
- `src/app/admin/absensi/tambah/page.js`
- `src/app/admin/laporan/kehadiran-siswa/page.js`
- `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js`
- `src/repositories/kelas-siswa-repository.js`
- `src/repositories/absensi-detail-repository.js`
- `src/repositories/pemantauan-ketidakhadiran-repository.js`
- `src/repositories/riwayat-kontak-repository.js`
- `src/repositories/pemindahan-kelas-detail-repository.js`

## 7. Hal yang Perlu Diputuskan Sebelum Implementasi

1. Apakah halaman `/siswa/[siswaId]` memang harus publik, atau perlu login minimal?
2. Apakah data rekap/riwayat boleh ditampilkan publik, atau hanya identitas?
3. Apakah akan menambahkan rate limiting atau token akses?
4. Apakah akan menerapkan Opsi A saja, atau juga Opsi B?
5. Jika Opsi B, apakah ID publik akan digenerate saat pembuatan siswa atau secara bertahap?

## 8. Catatan Bukti yang Belum Dapat Dipastikan

- Tidak ada middleware atau pembatasan IP/rate limit yang terlihat di kode.
- Tidak ada mekanisme token rahasia pada URL.
- Tidak ada generator ID acak yang tersedia saat ini.
- Tidak ada uji keamanan otomatis yang diperiksa.

## 9. Kesimpulan

Halaman ini publik dan tidak memiliki autentikasi/otorisasi. ID siswa yang berurutan memudahkan enumeration. Namun, data sensitif utama sudah disembunyikan. Rekomendasi utama adalah mempertahankan ID internal dan memperkuat kontrol akses/pembatasan data, dengan opsi ID publik acak sebagai peningkatan bertahap jika diperlukan.
