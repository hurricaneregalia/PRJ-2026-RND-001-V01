# Laporan Status Data Halaman Admin

Tanggal pemeriksaan: 25 November 2026
Cakupan: seluruh file `page.js` di `src/app/admin/`

## 1. Ringkasan

- Total halaman diperiksa: **41**
- Dinamis: **30**
- Statis: **11**
- Campuran: **0**
- Belum dapat dipastikan: **0**

Pemeriksaan dilakukan dari kode yang ada di repository saat ini. Untuk halaman yang memakai repository, alur data ditelusuri sampai `createTableRepository` di `src/repositories/sheet-table-repository.js`, yang memanggil `readWorksheetRecords` dari `src/repositories/sheets-repository.js`. Halaman statis tidak memanggil repository/service pembaca data dan menampilkan nilai literal di dalam `page.js`.

## 2. Tabel Seluruh Halaman

| No | Path halaman | Status | Data yang ditampilkan | Sumber data | Bukti kode | Bagian statis / belum jelas |
|---:|---|---|---|---|---|---|
| 1 | `src/app/admin/page.js` | Statis | Sapaan, tanggal, grafik absensi, statistik, daftar kelas, daftar guru, daftar alfa, tautan | Nilai literal di file | Baris 7-116; angka dan nama ditulis langsung (mis. baris 33-45, 52-68, 75-88); tidak ada import/call repository | Seluruh konten utama statis |
| 2 | `src/app/admin/absensi/page.js` | Dinamis | Statistik sesi, entri siswa, status kehadiran, daftar absensi | Google Spreadsheet melalui `listAbsensi`, `listAbsensiDetail`, `listKelas` | Baris 16-19; hasil dipakai di baris 30-37 dan 45-94 | Tidak ada bagian data utama statis |
| 3 | `src/app/admin/absensi/[absensiId]/page.js` | Dinamis | Detail sesi, kelas, pencatat, statistik kehadiran, daftar siswa | Spreadsheet melalui `getAbsensiById`, `listAbsensiDetailByAbsensiId`, `getKelasById`, `getSiswaById`, `getUserById` | Baris 18-21, 33-47; data dipakai di baris 64-118 | Tidak ada bagian data utama statis |
| 4 | `src/app/admin/absensi/[absensiId]/edit/page.js` | Dinamis | Form edit sesi dan status kehadiran siswa | Spreadsheet melalui `getAbsensiById`, `listAbsensiDetailByAbsensiId`, `getKelasById`, `getSiswaById`; update melalui server action | Baris 24-44; nilai awal form dari baris 95-132; update baris 48-77 | Label dan pilihan status berasal dari konstanta, bukan data bisnis statis |
| 5 | `src/app/admin/absensi/tambah/page.js` | Dinamis | Daftar kelas aktif, kapasitas, jadwal default, daftar siswa aktif | Spreadsheet melalui `listKelas`, `listKelasSiswa`, `listJadwal`, `listKelasSiswaByKelasId`, `listSiswa` | Baris 25-60; opsi kelas baris 108-125; siswa baris 143-176; simpan baris 66-91 | Teks label form statis; data utama dinamis |
| 6 | `src/app/admin/jadwal/page.js` | Dinamis | Ringkasan jadwal dan daftar jadwal beserta kelas/pengajar | Spreadsheet melalui `listJadwal`, `listKelas`, `listUsers` | Baris 15-19; perhitungan baris 22-24; render baris 34-76 | Tidak ada bagian data utama statis |
| 7 | `src/app/admin/jadwal/[jadwalId]/page.js` | Dinamis | Detail jadwal, kelas, pengajar, waktu, ruangan, status | Spreadsheet melalui `getJadwalById`, `getKelasById`, `getUserById` | Baris 15-19; render baris 42-62 | Tidak ada bagian data utama statis |
| 8 | `src/app/admin/jadwal/[jadwalId]/edit/page.js` | Dinamis | Form edit jadwal dengan nilai awal data tersimpan dan opsi kelas | Spreadsheet melalui `getJadwalById`, `listKelas`; update melalui server action | Baris 18-22; nilai awal baris 70-135; update baris 35-50 | Label dan opsi hari berasal dari konstanta |
| 9 | `src/app/admin/jadwal/tambah/page.js` | Dinamis | Opsi kelas aktif yang belum punya jadwal, form jadwal | Spreadsheet melalui `listKelas`, `listJadwal`; simpan melalui `createJadwal` | Baris 18-24; opsi kelas baris 53-58; simpan baris 29-45 | Nilai form selain kelas adalah input/default statis |
| 10 | `src/app/admin/kelas/page.js` | Dinamis | Daftar kelas, kapasitas terisi, nama pengajar, kuota kelas pengajar, status | Spreadsheet melalui `listKelas`, `listKelasSiswa`, `listUsers` | Baris 17-20; hitung kapasitas baris 25-39; render baris 51-77 | Tidak ada bagian data utama statis |
| 11 | `src/app/admin/kelas/[kelasId]/page.js` | Dinamis | Detail kelas, pengajar, kapasitas, daftar siswa, ringkasan gender | Spreadsheet melalui `getKelasById`, `getUserById`, `listKelasSiswaByKelasId`, `listSiswa` | Baris 17-20; hitung baris 33-43; render baris 50-110 | Tidak ada bagian data utama statis |
| 12 | `src/app/admin/kelas/[kelasId]/edit/page.js` | Dinamis | Form edit kelas, pengajar yang masih tersedia, kapasitas, status | Spreadsheet melalui `getKelasById`, `listUsers`, `listKelas`; update melalui server action | Baris 16-20; filter pengajar baris 21-49; update baris 55-65 | Label/status pilihan adalah konstanta, data awal dinamis |
| 13 | `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` | Dinamis | Siswa aktif kelas asal, kelas tujuan yang masih tersedia, tanggal pemindahan | Spreadsheet melalui `getKelasById`, `listKelasSiswaByKelasId`, `listSiswa`, `listKelas`, `listKelasSiswa`, `getUserById`; transfer melalui service | Baris 27-35; target kelas baris 37-52; data siswa baris 102-115; simpan baris 68-90 | Tidak ada bagian data utama statis |
| 14 | `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js` | Statis | Nama kelas, pengajar, daftar siswa, jumlah siswa | Objek/array literal di file | Baris 8-23: `const kelas = {...}` dan `const siswa = [...]`; tidak ada import/call repository | Seluruh halaman statis; checkbox dan tombol belum terhubung data |
| 15 | `src/app/admin/kelas/tambah/page.js` | Dinamis | Opsi pengajar yang masih punya kuota, form kelas | Spreadsheet melalui `listUsers`, `listKelas`; simpan melalui `createKelas` | Baris 16-19; hitung kuota baris 21-36; opsi baris 80-89; simpan baris 39-49 | Nilai form kelas adalah input statis; data pengajar dinamis |
| 16 | `src/app/admin/laporan/page.js` | Dinamis | Statistik siswa/pengajar/kelas/sesi, rekap kehadiran, rekap per kelas | Spreadsheet melalui `listAbsensi`, `listAbsensiDetail`, `listKelas`, `listSiswa`, `listUsers` | Baris 17-23; agregasi baris 26-58; render baris 65-151 | Tidak ada bagian data utama statis |
| 17 | `src/app/admin/laporan/aktivitas-kelas/page.js` | Dinamis | Ringkasan kelas aktif, sesi, jadwal; rekap aktivitas per kelas | Spreadsheet melalui `listKelas`, `listAbsensi`, `listJadwal`, `listKelasSiswa`, `listUsers` | Baris 17-23; agregasi baris 25-48; render baris 55-97 | Tidak ada bagian data utama statis |
| 18 | `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js` | Statis | Nama/WhatsApp pengajar, data siswa, pesan WhatsApp | Konstanta literal `pesanDefault` dan nilai literal di JSX | Baris 8-12 `pesanDefault`; baris 24-48 data literal; tidak ada repository | Seluruh halaman statis; parameter `pengajarId` tidak dipakai untuk membaca data |
| 19 | `src/app/admin/laporan/kehadiran-pengajar/page.js` | Dinamis | Daftar pengajar, jumlah kelas/jadwal/sesi yang dicatat | Spreadsheet melalui `listUsers`, `listKelas`, `listJadwal`, `listAbsensi` | Baris 16-21; agregasi baris 22-49; render baris 62-91 | Catatan kaki bersifat penjelasan statis |
| 20 | `src/app/admin/laporan/kehadiran-siswa/page.js` | Dinamis | Rekap kehadiran per siswa dan total status | Spreadsheet melalui `listAbsensiDetail`, `listSiswa` | Baris 14-16; agregasi baris 18-44; render baris 51-92 | Tidak ada bagian data utama statis |
| 21 | `src/app/admin/laporan/rekap-pembelajaran/page.js` | Dinamis | Total sesi, catatan absensi, rata-rata kehadiran, rekap per tanggal | Spreadsheet melalui `listAbsensi`, `listAbsensiDetail` | Baris 14-16; agregasi baris 18-43; render baris 50-84 | Tidak ada bagian data utama statis |
| 22 | `src/app/admin/pemantauan/page.js` | Dinamis | Siswa dengan alfa minimal 3 dalam 30 hari terakhir | Spreadsheet melalui `listAbsensi`, `listAbsensiDetail`, `listKelas`, `listSiswa`; hasil dihitung ulang di halaman | Baris 23-28; filter periode/status baris 40-72; render baris 82-104 | `shiftDate` adalah helper tanggal statis; data monitoring dinamis |
| 23 | `src/app/admin/pemantauan/[pemantauanId]/page.js` | Dinamis | Detail pemantauan, siswa, kelas, status, aksi selesai | Spreadsheet melalui `getPemantauanById`, `getSiswaById`, `getKelasById`; update melalui `updatePemantauan` | Baris 22-26; render baris 63-82; aksi baris 41-58 | Tidak ada bagian data utama statis |
| 24 | `src/app/admin/pemantauan/tambah/page.js` | Statis | Tidak menampilkan data; langsung redirect | Tidak ada sumber data; hanya `connection()` lalu `redirect` | Baris 11-14 | Halaman tidak menampilkan konten data; bukan pembacaan data |
| 25 | `src/app/admin/profil/page.js` | Dinamis | Nama, email, nomor HP, role, foto admin yang login | Session auth dan Spreadsheet melalui `getUserById` | Baris 15-18; render baris 27-38 | Tidak ada bagian data utama statis |
| 26 | `src/app/admin/profil/[profilId]/page.js` | Statis | Foto, nama, email, nomor HP, jabatan, status akun | Nilai literal di JSX | Baris 8-43; tidak ada import/call repository | Seluruh halaman statis; `profilId` tidak dipakai untuk membaca data |
| 27 | `src/app/admin/profil/[profilId]/edit/page.js` | Statis | Form profil dengan nilai awal literal | Nilai literal pada `defaultValue` | Baris 9-50; tidak ada action/repository | Seluruh halaman statis; form belum menyimpan data |
| 28 | `src/app/admin/profil/edit/page.js` | Dinamis | Form edit nama, email, nomor HP admin yang login | Session auth dan Spreadsheet melalui `getUserById`; update melalui `updateUser` | Baris 16-18; nilai awal baris 57-84; update baris 33-47 | Label form statis; data utama dinamis |
| 29 | `src/app/admin/pengajar/page.js` | Statis | Statistik pengajar dan daftar pengajar contoh | Nilai literal di JSX | Baris 7-87; tidak ada repository | Seluruh halaman statis |
| 30 | `src/app/admin/pengajar/[pengajarId]/page.js` | Statis | Profil pengajar, daftar kelas, jadwal, ringkasan absensi | Nilai literal di JSX | Baris 7-?; data contoh Budi/Matematika; tidak ada repository | Seluruh halaman statis; `pengajarId` tidak dipakai untuk membaca data |
| 31 | `src/app/admin/pengajar/[pengajarId]/edit/page.js` | Statis | Form edit pengajar dengan nilai awal literal | Nilai literal pada `defaultValue` | Baris 8-?; tidak ada action/repository | Seluruh halaman statis |
| 32 | `src/app/admin/pengajar/tambah/page.js` | Statis | Form tambah pengajar; hanya tampilan | Nilai/label literal di JSX | Baris 7-?; form tanpa action/repository | Seluruh halaman statis; belum ada pembacaan/penyimpanan data |
| 33 | `src/app/admin/siswa/page.js` | Dinamis | Daftar siswa, NIS, kelas, pengajar, status | Spreadsheet melalui `listSiswa`, `listKelasSiswa`, `listKelas`, `listUsers` | Baris 16-21; relasi baris 23-27; render baris 49-84 | Tidak ada bagian data utama statis |
| 34 | `src/app/admin/siswa/[siswaId]/page.js` | Dinamis | Detail siswa, kelas aktif, riwayat absensi | Spreadsheet melalui `getSiswaById`, `findActiveKelasSiswaBySiswaId`, `getKelasById`, `listAbsensi`, `listAbsensiDetail` | Baris 17-24; render baris 47-95 | Tidak ada bagian data utama statis |
| 35 | `src/app/admin/siswa/[siswaId]/edit/page.js` | Dinamis | Form edit siswa dan pilihan kelas dengan kapasitas | Spreadsheet melalui `getSiswaById`, `findActiveKelasSiswaBySiswaId`, `getKelasById`, `listKelas`, `listKelasSiswa`; update melalui server action | Baris 29-50; nilai awal baris 151-218; pilihan kelas baris 231-255; simpan baris 75-140 | Label form statis; data utama dinamis |
| 36 | `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js` | Dinamis | Identitas siswa, kelas saat ini, kelas tujuan yang tersedia | Spreadsheet melalui `getSiswaById`, `findActiveKelasSiswaBySiswaId`, `getKelasById`, `listKelas`, `listKelasSiswa`; transfer melalui service | Baris 26-35; render baris 93-126; simpan baris 65-83 | Tidak ada bagian data utama statis |
| 37 | `src/app/admin/siswa/tambah/page.js` | Dinamis | Form siswa baru dan pilihan kelas dengan kapasitas tersedia | Spreadsheet melalui `listKelas`, `listKelasSiswa`; simpan melalui `createSiswa` dan `createKelasSiswa` | Baris 21-24; filter kelas baris 26-41; opsi baris 145-163; simpan baris 45-87 | Label form statis; data utama dinamis |
| 38 | `src/app/admin/users/page.js` | Dinamis | Daftar pengguna, role, status akun | Spreadsheet melalui `listUsers` | Baris 13-14; render baris 29-43 | Tidak ada bagian data utama statis |
| 39 | `src/app/admin/users/[userId]/page.js` | Dinamis | Detail pengguna, email, role, status, nomor HP, limit kelas | Spreadsheet melalui `getUserById` | Baris 13-16; render baris 37-51 | Tidak ada bagian data utama statis |
| 40 | `src/app/admin/users/[userId]/edit/page.js` | Dinamis | Form edit pengguna dengan nilai awal data tersimpan | Spreadsheet melalui `getUserById`; update melalui `updateUser` | Baris 16-19; nilai awal baris 66-125; simpan baris 32-61 | Label form statis; data utama dinamis |
| 41 | `src/app/admin/users/tambah/page.js` | Statis | Form tambah pengguna; tidak ada data awal dari database | Nilai/label literal di JSX; server action menulis melalui `createUser` | Baris 13-25 aksi tulis; render baris 40-75; tidak ada pembacaan data | Tampilan statis; aksi submit bukan bukti data tampilan dinamis |

## 3. Rincian Pemeriksaan Per Halaman

Berikut rincian kelompok status. Setiap baris tabel dirujuk pada bukti kode di bagian tabel.

### 3.1 Halaman Dinamis

1. `src/app/admin/absensi/page.js`
   - Data: statistik dan daftar absensi.
   - Alur: page membaca `listAbsensi`, `listAbsensiDetail`, `listKelas`, lalu hasilnya dipakai untuk menghitung dan merender.
   - Bukti: baris 16-19, pemakaian baris 30-37 dan 45-94.

2. `src/app/admin/absensi/[absensiId]/page.js`
   - Data: detail sesi, siswa, pencatat, statistik.
   - Alur: `getAbsensiById` lalu lookup detail dan entitas terkait.
   - Bukti: baris 18-21, 33-47.

3. `src/app/admin/absensi/[absensiId]/edit/page.js`
   - Data: nilai awal edit sesi dan status siswa.
   - Alur: `getAbsensiById`, `listAbsensiDetailByAbsensiId`, lookup entitas; update via server action.
   - Bukti: baris 24-44, nilai awal baris 95-132, update baris 48-77.

4. `src/app/admin/absensi/tambah/page.js`
   - Data: kelas aktif, kapasitas, jadwal, siswa aktif.
   - Alur: `listKelas`, `listKelasSiswa`, `listJadwal`, `listKelasSiswaByKelasId`, `listSiswa`; simpan via `createAbsensi` dan `createAbsensiDetail`.
   - Bukti: baris 25-60, opsi baris 108-125, siswa baris 143-176.

5. `src/app/admin/jadwal/page.js`
   - Data: jadwal, kelas, pengajar.
   - Alur: `listJadwal`, `listKelas`, `listUsers`; relasi dibangun lewat Map.
   - Bukti: baris 15-19, render baris 34-76.

6. `src/app/admin/jadwal/[jadwalId]/page.js`
   - Data: jadwal, kelas, pengajar.
   - Alur: `getJadwalById`, `getKelasById`, `getUserById`.
   - Bukti: baris 15-19.

7. `src/app/admin/jadwal/[jadwalId]/edit/page.js`
   - Data: jadwal, kelas.
   - Alur: `getJadwalById`, `listKelas`; update via server action.
   - Bukti: baris 18-22, nilai awal baris 70-135.

8. `src/app/admin/jadwal/tambah/page.js`
   - Data: kelas aktif belum punya jadwal, jadwal baru.
   - Alur: `listKelas`, `listJadwal`; filter dan simpan via `createJadwal`.
   - Bukti: baris 18-24, opsi baris 53-58.

9. `src/app/admin/kelas/page.js`
   - Data: kelas, keanggotaan aktif, pengajar, kuota.
   - Alur: `listKelas`, `listKelasSiswa`, `listUsers`; hitung kapasitas aktif dan kuota pengajar.
   - Bukti: baris 17-20, hitung baris 25-39, render baris 51-77.

10. `src/app/admin/kelas/[kelasId]/page.js`
   - Data: kelas, pengajar, anggota aktif, siswa, ringkasan gender.
   - Alur: `getKelasById`, `getUserById`, `listKelasSiswaByKelasId`, `listSiswa`.
   - Bukti: baris 17-20, hitung baris 33-43.

11. `src/app/admin/kelas/[kelasId]/edit/page.js`
   - Data: kelas, pengajar tersedia, kuota.
   - Alur: `getKelasById`, `listUsers`, `listKelas`; hitung kelas aktif per pengajar; update via server action.
   - Bukti: baris 16-20, filter baris 21-49, update baris 55-65.

12. `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js`
   - Data: siswa aktif, kelas tujuan tersedia.
   - Alur: `getKelasById`, `listKelasSiswaByKelasId`, `listSiswa`, `listKelas`, `listKelasSiswa`; transfer via `transferStudents`.
   - Bukti: baris 27-35, render baris 102-115, simpan baris 68-90.

13. `src/app/admin/kelas/tambah/page.js`
   - Data: pengajar, kuota aktif, kelas baru.
   - Alur: `listUsers`, `listKelas`; hitung kuota; simpan via `createKelas`.
   - Bukti: baris 16-19, hitung baris 21-36, opsi baris 80-89.

14. `src/app/admin/laporan/page.js`
   - Data: absensi, detail, kelas, siswa, pengajar.
   - Alur: `listAbsensi`, `listAbsensiDetail`, `listKelas`, `listSiswa`, `listUsers`; agregasi.
   - Bukti: baris 17-23, agregasi baris 26-58.

15. `src/app/admin/laporan/aktivitas-kelas/page.js`
   - Data: kelas, absensi, jadwal, keanggotaan, pengguna.
   - Alur: `listKelas`, `listAbsensi`, `listJadwal`, `listKelasSiswa`, `listUsers`; agregasi.
   - Bukti: baris 17-23, agregasi baris 25-48.

16. `src/app/admin/laporan/kehadiran-pengajar/page.js`
   - Data: pengguna pengajar, kelas, jadwal, absensi.
   - Alur: `listUsers`, `listKelas`, `listJadwal`, `listAbsensi`; agregasi.
   - Bukti: baris 16-21, agregasi baris 22-49.

17. `src/app/admin/laporan/kehadiran-siswa/page.js`
   - Data: detail absensi, siswa.
   - Alur: `listAbsensiDetail`, `listSiswa`; agregasi.
   - Bukti: baris 14-16, agregasi baris 18-44.

18. `src/app/admin/laporan/rekap-pembelajaran/page.js`
   - Data: absensi, detail absensi.
   - Alur: `listAbsensi`, `listAbsensiDetail`; agregasi per tanggal.
   - Bukti: baris 14-16, agregasi baris 18-43.

19. `src/app/admin/pemantauan/page.js`
   - Data: absensi, detail absensi, kelas, siswa.
   - Alur: `listAbsensi`, `listAbsensiDetail`, `listKelas`, `listSiswa`; perhitungan monitoring.
   - Bukti: baris 23-28, filter baris 40-72.

20. `src/app/admin/pemantauan/[pemantauanId]/page.js`
   - Data: pemantauan, siswa, kelas.
   - Alur: `getPemantauanById`, `getSiswaById`, `getKelasById`; update via server action.
   - Bukti: baris 22-26, aksi baris 41-58.

21. `src/app/admin/profil/page.js`
   - Data: profil admin login.
   - Alur: `auth`, `getUserById`; render dari data user.
   - Bukti: baris 15-18, render baris 27-38.

22. `src/app/admin/profil/edit/page.js`
   - Data: profil admin login.
   - Alur: `auth`, `getUserById`; update via `updateUser`.
   - Bukti: baris 16-18, nilai awal baris 57-84, update baris 33-47.

23. `src/app/admin/siswa/page.js`
   - Data: siswa, keanggotaan, kelas, pengajar.
   - Alur: `listSiswa`, `listKelasSiswa`, `listKelas`, `listUsers`; relasi.
   - Bukti: baris 16-21, render baris 49-84.

24. `src/app/admin/siswa/[siswaId]/page.js`
   - Data: siswa, kelas aktif, riwayat absensi.
   - Alur: `getSiswaById`, `findActiveKelasSiswaBySiswaId`, `getKelasById`, `listAbsensi`, `listAbsensiDetail`.
   - Bukti: baris 17-24, render baris 47-95.

25. `src/app/admin/siswa/[siswaId]/edit/page.js`
   - Data: siswa, kelas aktif, pilihan kelas.
   - Alur: `getSiswaById`, `findActiveKelasSiswaBySiswaId`, `getKelasById`, `listKelas`, `listKelasSiswa`; update via server action.
   - Bukti: baris 29-50, pilihan baris 231-255, simpan baris 75-140.

26. `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js`
   - Data: siswa, kelas asal, kelas tujuan.
   - Alur: `getSiswaById`, `findActiveKelasSiswaBySiswaId`, `getKelasById`, `listKelas`, `listKelasSiswa`; transfer via service.
   - Bukti: baris 26-35, render baris 93-126.

27. `src/app/admin/siswa/tambah/page.js`
   - Data: kelas aktif, kapasitas, siswa baru.
   - Alur: `listKelas`, `listKelasSiswa`; simpan via `createSiswa` dan `createKelasSiswa`.
   - Bukti: baris 21-24, opsi baris 145-163.

28. `src/app/admin/users/page.js`
   - Data: pengguna.
   - Alur: `listUsers`.
   - Bukti: baris 13-14, render baris 29-43.

29. `src/app/admin/users/[userId]/page.js`
   - Data: pengguna.
   - Alur: `getUserById`.
   - Bukti: baris 13-16, render baris 37-51.

30. `src/app/admin/users/[userId]/edit/page.js`
   - Data: pengguna, update via server action.
   - Alur: `getUserById`, `updateUser`.
   - Bukti: baris 16-19, nilai awal baris 66-125, simpan baris 32-61.

### 3.2 Halaman Statis

1. `src/app/admin/page.js`
   - Data: semua konten utama.
   - Sumber: literal di file.
   - Bukti: baris 7-116; angka baris 33-45; daftar baris 52-68.

2. `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js`
   - Data: kelas, siswa, jumlah.
   - Sumber: objek/array literal.
   - Bukti: baris 8-23.

3. `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js`
   - Data: pesan, penerima, siswa.
   - Sumber: konstanta `pesanDefault` dan literal.
   - Bukti: baris 8-12, 24-48.

4. `src/app/admin/pemantauan/tambah/page.js`
   - Data: tidak menampilkan data; redirect.
   - Sumber: tidak ada data.
   - Bukti: baris 11-14.

5. `src/app/admin/profil/[profilId]/page.js`
   - Data: profil admin contoh.
   - Sumber: literal.
   - Bukti: baris 8-43.

6. `src/app/admin/profil/[profilId]/edit/page.js`
   - Data: form dengan nilai literal.
   - Sumber: literal.
   - Bukti: baris 9-50.

7. `src/app/admin/pengajar/page.js`
   - Data: statistik dan daftar contoh.
   - Sumber: literal.
   - Bukti: baris 7-87.

8. `src/app/admin/pengajar/[pengajarId]/page.js`
   - Data: profil, kelas, jadwal, absensi contoh.
   - Sumber: literal.
   - Bukti: baris 7-53.

9. `src/app/admin/pengajar/[pengajarId]/edit/page.js`
   - Data: form dengan nilai literal.
   - Sumber: literal.
   - Bukti: baris 8-74.

10. `src/app/admin/pengajar/tambah/page.js`
   - Data: form tampilan statis.
   - Sumber: literal.
   - Bukti: baris 7-90.

11. `src/app/admin/users/tambah/page.js`
   - Data: form tampilan statis.
   - Sumber: literal.
   - Bukti: baris 13-93.

### 3.3 Status Campuran

Tidak ditemukan dalam cakupan halaman admin saat ini. Halaman yang secara keseluruhan memakai data dinamis tidak ditemukan bagian kontennya yang masih harus diganti literal statis; halaman statis tidak ditemukan sisi dinamisnya.

## 4. Daftar Halaman yang Sudah Sepenuhnya Dinamis

1. `src/app/admin/absensi/page.js`
2. `src/app/admin/absensi/[absensiId]/page.js`
3. `src/app/admin/absensi/[absensiId]/edit/page.js`
4. `src/app/admin/absensi/tambah/page.js`
5. `src/app/admin/jadwal/page.js`
6. `src/app/admin/jadwal/[jadwalId]/page.js`
7. `src/app/admin/jadwal/[jadwalId]/edit/page.js`
8. `src/app/admin/jadwal/tambah/page.js`
9. `src/app/admin/kelas/page.js`
10. `src/app/admin/kelas/[kelasId]/page.js`
11. `src/app/admin/kelas/[kelasId]/edit/page.js`
12. `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js`
13. `src/app/admin/kelas/tambah/page.js`
14. `src/app/admin/laporan/page.js`
15. `src/app/admin/laporan/aktivitas-kelas/page.js`
16. `src/app/admin/laporan/kehadiran-pengajar/page.js`
17. `src/app/admin/laporan/kehadiran-siswa/page.js`
18. `src/app/admin/laporan/rekap-pembelajaran/page.js`
19. `src/app/admin/pemantauan/page.js`
20. `src/app/admin/pemantauan/[pemantauanId]/page.js`
21. `src/app/admin/profil/page.js`
22. `src/app/admin/profil/edit/page.js`
23. `src/app/admin/siswa/page.js`
24. `src/app/admin/siswa/[siswaId]/page.js`
25. `src/app/admin/siswa/[siswaId]/edit/page.js`
26. `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js`
27. `src/app/admin/siswa/tambah/page.js`
28. `src/app/admin/users/page.js`
29. `src/app/admin/users/[userId]/page.js`
30. `src/app/admin/users/[userId]/edit/page.js`

## 5. Daftar Halaman yang Masih Sepenuhnya Statis

1. `src/app/admin/page.js`
2. `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js`
3. `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js`
4. `src/app/admin/pemantauan/tambah/page.js`
5. `src/app/admin/profil/[profilId]/page.js`
6. `src/app/admin/profil/[profilId]/edit/page.js`
7. `src/app/admin/pengajar/page.js`
8. `src/app/admin/pengajar/[pengajarId]/page.js`
9. `src/app/admin/pengajar/[pengajarId]/edit/page.js`
10. `src/app/admin/pengajar/tambah/page.js`
11. `src/app/admin/users/tambah/page.js`

## 6. Daftar Halaman Campuran

Tidak ada halaman yang diklasifikasikan campuran berdasarkan data utama yang ditampilkan.

## 7. Daftar Halaman yang Belum Dapat Dipastikan

Tidak ada halaman yang diklasifikasikan belum dapat dipastikan, karena akar alur data untuk halaman dinamis sudah jelas melalui repository dan untuk halaman statis sudah jelas berupa literal.

## 8. Ringkasan Halaman yang Perlu Dikerjakan Berikutnya

Prioritas berikutnya:

1. `src/app/admin/page.js` — perlu dikonsolidasikan menjadi pembacaan data dinamis.
2. `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js` — perlu dikoneksikan repository untuk daftar siswa dan kelas.
3. `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js` — perlu dikoneksikan data real dari absensi/pemantauan.
4. `src/app/admin/pemantauan/tambah/page.js` — perlu diputuskan apakah tetap redirect atau dibuat halaman dinamis.
5. `src/app/admin/profil/[profilId]/page.js` — perlu diputuskan apakah memakai profil admin yang login atau tetap contoh statis.
6. `src/app/admin/profil/[profilId]/edit/page.js` — perlu diputuskan apakah form ini memakai data dinamis atau tetap statis.
7. `src/app/admin/pengajar/*` — semua halaman daftar/detail/tambah/edit masih statis.
8. `src/app/admin/users/tambah/page.js` — tampilan statis, tetapi aksi submit sudah ada dan perlu dipisahkan antara tampilan dan alur dinamis.
