# Audit Data Loop dan Komponen Reusable Halaman Admin

Status: **audit selesai, menunggu persetujuan implementasi**.

Tidak ada kode aplikasi, komponen, halaman, database, atau Google Spreadsheet yang diubah saat audit. Satu-satunya file baru adalah dokumen ini.

Sumber kebenaran: kode aktual di `src/app/admin`, `src/components`, `src/repositories`, dan `src/services`. Data Google Sheets dibaca melalui repository; tidak ada penulisan.

---

## 1. Ringkasan hasil audit

### 1.1 Lingkup

- **41 file** diperiksa di `src/app/admin`, terdiri dari 39 `page.js`, `layout.js`, dan `actions.js`.
- **40 komponen** diperiksa di `src/components`.
- **15 komponen** memiliki loop/iterasi array sendiri.
- **5 komponen loop** dipakai aktif di halaman Admin: `AdminDataTable`, `AdminList`, `MonitoringList`, `EntitySelect`, `ContactHistoryList`.
- **10 komponen loop** belum dipakai di `src/app` atau hanya di-import tanpa dirender: `StudentCheckboxList`, `SelectInput`, `StaticTable`, `InfoList`, `PageHeader`, `Breadcrumb`, `NoteBox`, `PeriodeFilter`, `StudentSearchForm`, `RoleSelectWithLimit` (loop konstanta).
- **38 temuan render berulang** dari data Google Sheets ditemukan di halaman Admin.
- **2 agregat array** juga ditemukan, tetapi dirender sebagai satu blok, bukan loop baris.

### 1.2 Alur data aktual

Seluruh data berasal dari Google Sheets lewat pola:

```text
page/server component
  -> repository atau service
  -> createTableRepository.readAll()
  -> readWorksheetRecords(tableName, header)
  -> sheets.spreadsheets.values.get
```

Bukti:

- `src/repositories/sheet-table-repository.js:178-193` — `readAll()` memanggil `readWorksheetRecords`.
- `src/repositories/sheets-repository.js:50-57` — `sheets.spreadsheets.values.get`.
- `src/lib/sheet-schema.js:4-167` — nama worksheet dan urutan header.

### 1.3 Temuan utama

1. **Tabel Data sudah punya komponen bersama, tapi belum merata.** `AdminDataTable` dipakai di 5 halaman laporan/detail, sementara banyak halaman lain masih memakai `<ol><li>` inline dengan pola `field | field | <Link>`.
2. **Daftar sederhana sudah punya `AdminList`, tapi baru dipakai di dashboard.** Halaman `/admin/users`, `/admin/siswa`, `/admin/kelas`, `/admin/jadwal`, `/admin/absensi`, dan `/admin/laporan` masih inline.
3. **Opsi form sudah konsisten via `EntitySelect`.** 9 halaman memakai komponen ini. Namun string label kapasitas masih duplikat di tiap halaman pemanggil.
4. **Checkbox siswa belum memakai komponen bersama.** `src/components/ui/student-checkbox-list.js` tersedia, tapi tidak dipakai; 2 halaman membuat checkbox list manual.
5. **Data absensi memiliki 5 bentuk berbeda**: sesi absensi, detail per siswa, rekap per siswa, rekap agregat, dan kasus pemantauan. Ini tidak sebaiknya disatukan dalam satu komponen.
6. **Data monitoring sudah konsisten** di `/admin` dan `/admin/pemantauan` lewat `MonitoringList`, meskipun sumber datanya sedikit berbeda.
7. **Riwayat kontak sudah konsisten** di `/admin/pemantauan/[pemantauanId]` dan `/admin/laporan/hubungi-pengajar/[pengajarId]` lewat `ContactHistoryList`.
8. **Kapasitas punya 3 komponen yang tumpang tindih**: `ClassCapacityLabel`, `TeacherCapacityLabel`, `CapacityInfo`. Ada juga `ClassCard` yang memakai format berbeda: `Tersedia: X Kursi`, bukan `Tersedia X Kursi`.
9. **Data `sekolah` bukan data loop.** Satu record saja; dibaca di layout, halaman kelola, form, dan action.
10. **Loop konstanta bukan temuan database**: `KEHADIRAN_STATUSES`, `HARI`, `[2,3,4,5]`, `PERIODE_OPTIONS`.

---

## 2. Tabel inventaris seluruh data yang di-loop

Catatan: `Bentuk` menyatakan bentuk tampilan aktual. `AdminDataTable` dan beberapa komponen lain merender `<ol>/<li>`, bukan tag `<table>`.

| ID | Route | File · Komponen | Jenis data | Sumber | Kolom ditampilkan | Bentuk | Relasi | Reusable aktif | Bukti kode |
|---|---|---|---|---|---|---|---|---|---|
| D01 | `/admin` | `src/app/admin/page.js` · `AdminDashboardPage` | `kelas[]` | `listKelas()`, `listKelasSiswa()`, `listJadwal()` | `nama_kelas`, `kode_kelas`, `kapasitas`, `terisi`, jadwal | Kartu per kelas | `kelas_id` ← `kelas_siswa.kelas_id`, `jadwal.kelas_id` | `ClassCard` | L212 `kelas.map(...)` → `<ClassCard ... />` |
| D02 | `/admin` | `src/app/admin/page.js` · `AdminDashboardPage` | `kelas[]` tanpa jadwal | `listKelas()`, `listJadwal()`, `listKelasSiswa()` | `nama_kelas`, kapasitas, link buat jadwal | Daftar | `kelas_id` ← `jadwal.kelas_id`, `kelas_siswa.kelas_id` | `AdminList`, `ClassCapacityLabel` | L229-235 `<AdminList items={kelasTanpaJadwal} ... />` |
| D03 | `/admin` | `src/app/admin/page.js` · `AdminDashboardPage` | `users[]` role Pengajar | `listUsers()`, `listKelas()` | `name`, kapasitas kelas | Daftar | `user_id` ← `kelas.pengajar_id` | `AdminList`, `TeacherCapacityLabel`, `LinkDetail` | L106 filter Pengajar; L246-251 `<AdminList items={teachers} ... />` |
| D04 | `/admin` | `src/app/admin/page.js` · `AdminDashboardPage` | Kasus alfa turunan | `listAbsensi()`, `listAbsensiDetail()`, `listSiswa()`, `listKelas()` | `siswa.nama`, `nis`, `kelas.nama_kelas`, `jumlah_alpa`, `terakhir`, aksi | Daftar monitoring | `absensi_id` ← `absensi_detail`; `siswa_id`; `kelas.pengajar_id` | `MonitoringList` | L126-159 loop + filter `>= 3`; L263-265 `<MonitoringList ... />` |
| D05 | `/admin/absensi` | `src/app/admin/absensi/page.js` · `DaftarAbsensiPage` | `absensi[]` | `listAbsensi()`, `listAbsensiDetail()`, `listKelas()` | kelas, `tanggal`, `jam_mulai`, `jam_selesai`, `topik`, status, jumlah status, Detail, Edit | Baris inline | `kelas_id` → `kelas`; `absensi_id` ← detail | `StatusBadge`, `LinkDetail` | L115-129 `absensi.map(...)` |
| D06 | `/admin/absensi` | `src/app/admin/absensi/page.js` · `DaftarAbsensiPage` | Rekap per siswa | `listSiswa()`, `listAbsensiDetail()`, `listAbsensi()`, `listKelasSiswa()`, `listKelas()` | `nama`, `nis`, kelas aktif, Hadir, Izin, Sakit, Alpa, Detail | Baris inline, diurutkan | `siswa_id` ← `kelas_siswa`, `absensi_detail` | Tidak ada list component | L36-51 agregat; L143-156 `siswaDiurutkan.map(...)` |
| D07 | `/admin/absensi/[absensiId]` | `src/app/admin/absensi/[absensiId]/page.js` · `DetailAbsensiPage` | `{detail, siswa}[]` | `listAbsensiDetailByAbsensiId()`, `getSiswaById()`, `getAbsensiById()` | NIS, Nama, Status, Catatan | Tabel-like `<ol>` | `absensi_detail.siswa_id` → `siswa`; `absensi_id` → `absensi` | `AdminDataTable`, `StatusBadge` | L40-45 join; L101 `rows={siswaList}` |
| D08 | `/admin/absensi/[absensiId]/edit` | `src/app/admin/absensi/[absensiId]/edit/page.js` · `EditAbsensiPage` | `{detail, siswa}[]` editable | `listAbsensiDetailByAbsensiId()`, `getSiswaById()`, `getKelasById()` | NIS, Nama, `<select>` status, `catatan` | Baris form inline | `siswa_id` → `siswa`; `kelas_id` → `kelas` | Tidak ada row component | L39-44 join; L111-122 `siswaList.map(...)` |
| D09 | `/admin/absensi/tambah` | `src/app/admin/absensi/tambah/page.js` · `TambahAbsensiPage` | `kelas[]` aktif | `listKelas()` | `nama_kelas` | Opsi `<select>` | Dipakai untuk filter `kelas_siswa`/`siswa` | `EntitySelect` | L37-43 filter; L134-138 `items={activeKelas}` |
| D10 | `/admin/absensi/tambah` | `src/app/admin/absensi/tambah/page.js` · `TambahAbsensiPage` | `siswa[]` dari keanggotaan aktif | `listKelasSiswaByKelasId()`, `listSiswa()`, `listJadwal()` | NIS, Nama, `<select>` status, catatan | Baris form inline | `kelas_siswa.siswa_id` → `siswa` | Tidak ada row component | L73-75 `students`; L193-213 `students.map(...)` |
| D11 | `/admin/jadwal` | `src/app/admin/jadwal/page.js` · `DaftarJadwalPage` | `jadwal[]` | `listJadwal()`, `listKelas()`, `listUsers()` | kelas, pengajar, hari, jam, ruangan, status, Detail, Edit | Baris inline | `kelas_id` → `kelas`; `pengajar_id` → `users` | `StatusBadge` | L57-70 `jadwal.map(...)` |
| D12 | `/admin/jadwal/[jadwalId]/edit` | `src/app/admin/jadwal/[jadwalId]/edit/page.js` · `EditJadwalPage` | `kelas[]` tersedia | `listKelas()`, `listKelasSiswa()`, `getJadwalById()` | `${nama_kelas} Tersedia X Kursi` | Opsi `<select>` | `kelas_id` ← `kelas_siswa` | `EntitySelect` | L84-98 `formatLabel` kapasitas |
| D13 | `/admin/jadwal/tambah` | `src/app/admin/jadwal/tambah/page.js` · `TambahJadwalPage` | `kelas[]` belum dijadwalkan | `listKelas()`, `listJadwal()`, `listKelasSiswa()` | `${nama_kelas} Tersedia X Kursi` | Opsi `<select>` | `kelas_id` ← `jadwal`, `kelas_siswa` | `EntitySelect` | L88 `items={availableKelas}` |
| D14 | `/admin/kelas` | `src/app/admin/kelas/page.js` · `DaftarKelasPage` | `kelas[]` | `listKelas()`, `listKelasSiswa()`, `listUsers()` | nama, kapasitas kelas, pengajar, kapasitas pengajar, status, Detail, Edit | Baris inline | `kelas_id` ← `kelas_siswa`; `pengajar_id` → `users` | `LinkDetail`, capacity labels, `StatusBadge` | L60-71 `kelas.map(...)` |
| D15 | `/admin/kelas/[kelasId]` | `src/app/admin/kelas/[kelasId]/page.js` · `DetailKelasPage` | `jadwal[]` aktif | `listJadwalByKelasId()`, `getKelasById()` | hari, jam_mulai, jam_selesai | `<li>` per jadwal | `jadwal.kelas_id` → `kelas` | Tidak ada | L39-42 filter; L70-74 `jadwalAktif.map(...)` |
| D16 | `/admin/kelas/[kelasId]` | `src/app/admin/kelas/[kelasId]/page.js` · `DetailKelasPage` | `kelas_siswa[]` aktif | `listKelasSiswaByKelasId()`, `listSiswa()` | NIS, Nama, jenis kelamin, tanggal mulai | Baris inline | `siswa_id` → `siswa`; `kelas_id` → `kelas` | `LinkDetail` hanya untuk pengajar | L92-99 `activeMemberships.map(...)` |
| D17 | `/admin/kelas/[kelasId]/edit` | `src/app/admin/kelas/[kelasId]/edit/page.js` · `EditKelasPage` | `users[]` Pengajar tersedia | `listUsers()`, `listKelas()` | `${name} Tersedia X Kelas` | Opsi `<select>` | `user_id` ← `kelas.pengajar_id` | `EntitySelect` | L107-121 `formatLabel` |
| D18 | `/admin/kelas/[kelasId]/pindah-kelas` | `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` · `PindahKelasKelasPage` | `kelas_siswa[]` aktif | `listKelasSiswaByKelasId()`, `listSiswa()`, `getKelasById()` | checkbox, Nama, NIS, status keanggotaan | Checkbox list | `siswa_id` → `siswa`; `kelas_id` → kelas asal | Tidak ada; `StudentCheckboxList` tidak dipakai | L109-114 `activeMemberships.map(...)` |
| D19 | `/admin/kelas/[kelasId]/pindah-kelas` | `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` · `PindahKelasKelasPage` | `kelas[]` target | `listKelas()`, `listKelasSiswa()` | `${nama_kelas} Tersedia X Kursi` | Opsi `<select>` | kapasitas dari `kelas_siswa` aktif | `EntitySelect` | L127-139 `formatLabel` |
| D20 | `/admin/kelas/[kelasId]/tambah-siswa` | `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js` · `TambahSiswaKelasPage` | `siswa[]` tersedia | `listSiswa()`, `listKelasSiswa()`, `getKelasById()`, `getUserById()` | index, NIS, Nama, jenis kelamin, checkbox, disabled | Checkbox list | `siswa_id` tidak ada di `kelas_siswa` aktif | Tidak ada; `StudentCheckboxList` tidak dipakai | L153-163 `siswaTersedia.map(...)` |
| D21 | `/admin/kelas/tambah` | `src/app/admin/kelas/tambah/page.js` · `TambahKelasPage` | `users[]` Pengajar tersedia | `listUsers()`, `listKelas()` | `${name} Tersedia X Kelas` | Opsi `<select>` | `user_id` ← `kelas.pengajar_id` | `EntitySelect` | L79-93 `formatLabel` |
| D22 | `/admin/laporan` | `src/app/admin/laporan/page.js` · `LaporanPage` | Rekap per kelas | `listAbsensi()`, `listAbsensiDetail()`, `listKelas()` | kelas, Sesi, Hadir, Izin, Sakit, Alpa | Baris inline | `absensi_detail.absensi_id` → `absensi.kelas_id` → `kelas` | Tidak ada | L96-101 `[...perKelas.entries()].map(...)` |
| D23 | `/admin/laporan/aktivitas-kelas` | `src/app/admin/laporan/aktivitas-kelas/page.js` · `LaporanAktivitasKelasPage` | `kelas[]` + count | `listKelas()`, `listUsers()`, `listJadwal()`, `listKelasSiswa()`, `listAbsensi()` | Nama Kelas, Kode, Pengajar, Siswa Aktif, Jadwal, Sesi Absensi, Status | Tabel-like `<ol>` | `pengajar_id`, `kelas_id` dari 3 tabel | `AdminDataTable`, `StatusBadge` | L85-98 `columns`, `rows={rows}` |
| D24 | `/admin/laporan/kehadiran-pengajar` | `src/app/admin/laporan/kehadiran-pengajar/page.js` · `LaporanKehadiranPengajarPage` | `users[]` Pengajar + count | `listUsers()`, `listKelas()`, `listJadwal()`, `listAbsensi()` | Nama, Kelas, Jadwal, Sesi Absensi Dicatat, Status Akun | Tabel-like `<ol>` | `user_id` ← `kelas.pengajar_id`; `created_by` → absensi | `AdminDataTable`, `StatusBadge` | L57-64 rows; L87-98 render |
| D25 | `/admin/laporan/kehadiran-siswa` | `src/app/admin/laporan/kehadiran-siswa/page.js` · `LaporanKehadiranSiswaPage` | Rekap per siswa | `listAbsensi()`, `listAbsensiDetail()`, `listSiswa()` | NIS, Nama, Sesi, Hadir, Izin, Sakit, Alpa, Persentase | Tabel-like `<ol>` | `siswa_id` ← detail; `absensi_id` → final absensi | `AdminDataTable` | L56-72 rows; L97-111 render |
| D26 | `/admin/laporan/rekap-pembelajaran` | `src/app/admin/laporan/rekap-pembelajaran/page.js` · `LaporanRekapPembelajaranPage` | Rekap per tanggal | `listAbsensi()`, `listAbsensiDetail()` | Tanggal, Total Sesi, Total Catatan, Rata-rata Kehadiran | Tabel-like `<ol>` | `absensi_detail.absensi_id` → `absensi.tanggal` | `AdminDataTable` | L58-65 rows; L88-98 render |
| D27 | `/admin/laporan/hubungi-pengajar/[pengajarId]` | `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js` · `HubungiPengajarPage` | `riwayat_kontak[]` | `listRiwayatKontakByPemantauanId()`, `findActivePemantauan()` | `tanggal_kontak`, `status_pengiriman`, `dikirim_oleh` | Daftar | `pemantauan_id` → `pemantauan_ketidakhadiran` | `ContactHistoryList` | L181-182 sort; L365-368 render |
| D28 | `/admin/laporan/hubungi-pengajar/[pengajarId]` | `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js` · `buildCaseData` | Agregat absensi 30 hari | `listAbsensi()`, `listAbsensiDetail()`, `getSiswaById()`, `getKelasById()` | Nama, NIS, kelas, Jumlah Alfa, rekap, periode | Blok tunggal, bukan loop baris | `absensi_detail.siswa_id`, `absensi.kelas_id` | `AttendanceCaseSummary` | L59-77 loop agregat; L340 render |
| D29 | `/admin/pemantauan` | `src/app/admin/pemantauan/page.js` · `DaftarPemantauanPage` | Kasus alfa + data tersimpan | `listAbsensi()`, `listAbsensiDetail()`, `listKelas()`, `listSiswa()`, `listPemantauan()` | Nama, NIS, kelas, jumlah alfa, terakhir, aksi Detail/Data sementara | Daftar monitoring | join `${siswa_id}\|${kelas_id}` ke `pemantauan` | `MonitoringList` | L68-76 derived; L94-101 render |
| D30 | `/admin/pemantauan/[pemantauanId]` | `src/app/admin/pemantauan/[pemantauanId]/page.js` · `DetailPemantauanPage` | `riwayat_kontak[]` | `listRiwayatKontakByPemantauanId()`, `getPemantauanById()` | `tanggal_kontak`, `status_pengiriman`, `dikirim_oleh` | Daftar | `pemantauan_id` → pemantauan | `ContactHistoryList` | L42-43 sort; L99-101 render |
| D31 | `/admin/siswa` | `src/app/admin/siswa/page.js` · `DaftarSiswaPage` | `siswa[]` | `listSiswa()`, `listKelasSiswa()`, `listKelas()`, `listUsers()` | NIS, Nama, kelas, pengajar, status, Detail, Edit | Baris inline | `siswa_id` ← `kelas_siswa`; `kelas.pengajar_id` → `users` | Tidak ada list component | L50-79 `siswa.map(...)` |
| D32 | `/admin/siswa/[siswaId]` | `src/app/admin/siswa/[siswaId]/page.js` · `DetailSiswaPage` | Riwayat `absensi[]` | `listAbsensi()`, `listAbsensiDetail()`, `getSiswaById()`, `findActiveKelasSiswaBySiswaId()`, `getKelasById()` | Tanggal, status kehadiran | Baris inline | `absensi_id` ← detail; `siswa_id` → siswa | Tidak ada | L54-60 filter/sort; L107-115 render |
| D33 | `/admin/siswa/[siswaId]/edit` | `src/app/admin/siswa/[siswaId]/edit/page.js` · `EditSiswaPage` | `kelas[]` tersedia | `listKelas()`, `listKelasSiswa()`, `findActiveKelasSiswaBySiswaId()` | `${nama_kelas} Tersedia X Kursi` | Opsi `<select>` | kapasitas dari `kelas_siswa` | `EntitySelect` | L233-246 `formatLabel` |
| D34 | `/admin/siswa/[siswaId]/pindah-kelas` | `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js` · `PindahKelasSiswaPage` | `kelas[]` target | `listKelas()`, `listKelasSiswa()`, `findActiveKelasSiswaBySiswaId()` | `${nama_kelas} Tersedia X Kursi` | Opsi `<select>` | kapasitas dari `kelas_siswa` aktif | `EntitySelect` | L115-127 `formatLabel` |
| D35 | `/admin/siswa/tambah` | `src/app/admin/siswa/tambah/page.js` · `TambahSiswaPage` | `kelas[]` tersedia | `listSiswa()`, `listKelas()`, `listKelasSiswa()` | `${nama_kelas} Tersedia X Kursi` | Opsi `<select>` | kapasitas dari `kelas_siswa` aktif | `EntitySelect` | L149-161 `formatLabel` |
| D36 | `/admin/users` | `src/app/admin/users/page.js` · `ManajemenPenggunaPage` | `users[]` | `listUsers()`, `listKelas()` | ID, Nama + kapasitas, role, status, Detail, Edit | Baris inline | `user_id` ← `kelas.pengajar_id` | `CapacityInfo`, `StatusBadge` | L50-59 `users.map(...)` |
| D37 | `/admin/users/[userId]` | `src/app/admin/users/[userId]/page.js` · `DetailUserPage` | `kelas[]` Pengajar | `listKelas()`, `listKelasSiswa()`, `listSiswa()` | nama kelas, kapasitas, kursi tersedia/penuh, ringkasan siswa, Isi Absensi | `<ol>` bertingkat | `user_id` ← `kelas.pengajar_id`; `kelas_id` ← `kelas_siswa` | Tidak ada list component | L107-118 `kelasPengajar.map(...)` |
| D38 | `/admin/users/[userId]` | `src/app/admin/users/[userId]/page.js` · `DetailUserPage` | `siswa[]` per kelas + rekap | `listSiswa()`, `listKelasSiswa()`, `listAbsensi()`, `listAbsensiDetail()` | Nama, NIS, jenis kelamin, Hadir, Izin, Sakit, Alpa | `<ol>` bertingkat | `siswa_id` ← `kelas_siswa`, `absensi_detail` | Tidak ada | L120-125 `siswaKelas.map(...)` |

### 2.1 Data turunan array dengan render tunggal

- D28 `buildCaseData` di `/admin/laporan/hubungi-pengajar/[pengajarId]` melakukan loop untuk agregat, tetapi hasilnya dirender sekali oleh `AttendanceCaseSummary`. Ini bukan daftar baris.
- Ringkasan statistik di dashboard, `/admin/absensi`, dan `/admin/laporan` memakai `reduce`/`forEach` untuk angka tunggal. Tidak termasuk temuan loop tampilan.

### 2.2 Halaman/file tanpa loop data Sheets

| Route/file | Fungsi | Alasan tidak masuk inventaris |
|---|---|---|
| `/admin` · `src/app/admin/layout.js` | `AdminLayout` | `getUserById()` dan `getInformasiSekolah()` adalah record tunggal |
| `/admin/jadwal/[jadwalId]` · `page.js` | `DetailJadwalPage` | Satu jadwal, satu kelas, satu user |
| `/admin/pemantauan/tambah` · `page.js` | `TambahPemantauanPage` | Hanya redirect |
| `/admin/profil` · `page.js` | `ProfilAdminPage` | Satu user |
| `/admin/profil/[profilId]` · `page.js` | `LihatProfilPage` | Nilai hardcoded, bukan Sheets |
| `/admin/profil/edit` · `page.js` | `EditProfilAdminPage` | Satu user, form |
| `/admin/sekolah` · `page.js` | `KelolaInformasiSekolahPage` | Satu record sekolah |
| `/admin/sekolah/tambah` · `page.js` | `TambahInformasiSekolahPage` | Form kosong + pengecekan eksistensi |
| `/admin/sekolah/edit` · `page.js` | `EditInformasiSekolahPage` | Satu record sekolah |
| `/admin/sekolah/actions.js` | `simpanInformasiSekolahAction` | Server action, tanpa render |
| `/admin/users/tambah` · `page.js` | `TambahPenggunaPage` | Form kosong |
| `/admin/users/[userId]/edit` · `page.js` | `EditPenggunaPage` | Satu user; `RoleSelectWithLimit` loop konstanta `[2,3,4,5]` |

---

## 3. Kategori data berdasarkan jenis dan karakteristik

| Kategori | Karakteristik | ID temuan | Tidak digabung dengan |
|---|---|---|---|
| K1 — Kelas & kapasitas | Record `kelas`, sering digabung `kelas_siswa` dan `users`. Butuh kapasitas, status, pengajar. | D01, D02, D12, D13, D14, D19, D21, D23, D33, D34, D35, D37 | Jadwal sebagai entitas utama; daftar siswa |
| K2 — Keanggotaan kelas (`kelas_siswa`) | Baris relasi `siswa_id ↔ kelas_id`; bisa tampil sebagai anggota, checkbox, atau kapasitas. | D16, D18, D20, D37, D38 | Data siswa murni; opsi kelas |
| K3 — Siswa | Identitas siswa: NIS, nama, jenis kelamin, status. | D06, D10, D16, D18, D20, D25, D31, D32, D38 | Rekap absensi; opsi kelas |
| K4 — Pengajar/users | Identitas user, role, status akun, `limit_kelas`. | D03, D17, D21, D24, D36, D37 | Siswa; admin sebagai user tunggal |
| K5 — Jadwal | Hari, jam, ruangan, status. Sering jadi substring Kartu Kelas atau daftar ringkas. | D01, D11, D15, D23, D24 | Kelas sebagai entitas utama |
| K6 — Sesi absensi | Record `absensi`: tanggal, jam, topik, statusfinal, `created_by`. | D05, D22, D23, D24, D26, D32 | Detail kehadiran; rekap |
| K7 — Detail kehadiran siswa | `absensi_detail` per siswa per sesi: status, catatan. | D07, D08, D10, D32 | Sesi absensi agregat |
| K8 — Rekap kehadiran turunan | Agregat Hadir/Izin/Sakit/Alfa per siswa, kelas, atau tanggal. | D06, D22, D25, D26, D28, D38 | Detail mentah; daftar siswa murni |
| K9 — Pemantauan ketidakhadiran | Kasus alfa `>= 3`; bisa sementara atau tersimpan di `pemantauan_ketidakhadiran`. | D04, D29 | Rekap kehadiran biasa |
| K10 — Riwayat kontak | `riwayat_kontak`: tanggal, status pengiriman, pengirim. | D27, D30 | Pemantauan sebagai induk |
| K11 — Opsi form entitas | Data dipakai sebagai `<option>`, bukan daftar tampilan. Urutan wajib alphabetik. | D09, D12, D13, D17, D19, D21, D33, D34, D35 | Tampilan tabel/list |
| K12 — Checkbox seleksi siswa | Data siswa dengan input checkbox, disabled, dan state pilihan. | D18, D20 | Opsi `<select>`; daftar siswa read-only |

---

## 4. Pemetaan kategori ke halaman

| Kategori | Halaman |
|---|---|
| K1 Kelas & kapasitas | `/admin`, `/admin/kelas`, `/admin/kelas/[kelasId]`, `/admin/kelas/[kelasId]/edit`, `/admin/kelas/tambah`, `/admin/jadwal/tambah`, `/admin/jadwal/[jadwalId]/edit`, `/admin/kelas/[kelasId]/pindah-kelas`, `/admin/siswa/tambah`, `/admin/siswa/[siswaId]/edit`, `/admin/siswa/[siswaId]/pindah-kelas`, `/admin/laporan/aktivitas-kelas`, `/admin/users/[userId]` |
| K2 Keanggotaan kelas | `/admin/kelas/[kelasId]`, `/admin/kelas/[kelasId]/pindah-kelas`, `/admin/kelas/[kelasId]/tambah-siswa`, `/admin/users/[userId]` |
| K3 Siswa | `/admin`, `/admin/absensi`, `/admin/absensi/tambah`, `/admin/kelas/[kelasId]`, `/admin/kelas/[kelasId]/pindah-kelas`, `/admin/kelas/[kelasId]/tambah-siswa`, `/admin/laporan/kehadiran-siswa`, `/admin/laporan/hubungi-pengajar/[pengajarId]`, `/admin/pemantauan`, `/admin/siswa`, `/admin/siswa/[siswaId]`, `/admin/users/[userId]` |
| K4 Pengajar/users | `/admin`, `/admin/jadwal`, `/admin/kelas`, `/admin/kelas/tambah`, `/admin/kelas/[kelasId]/edit`, `/admin/laporan/kehadiran-pengajar`, `/admin/laporan/hubungi-pengajar/[pengajarId]`, `/admin/users`, `/admin/users/[userId]` |
| K5 Jadwal | `/admin`, `/admin/jadwal`, `/admin/kelas/[kelasId]`, `/admin/laporan/aktivitas-kelas`, `/admin/laporan/kehadiran-pengajar` |
| K6 Sesi absensi | `/admin`, `/admin/absensi`, `/admin/laporan`, `/admin/laporan/aktivitas-kelas`, `/admin/laporan/kehadiran-pengajar`, `/admin/laporan/rekap-pembelajaran`, `/admin/siswa/[siswaId]` |
| K7 Detail kehadiran | `/admin/absensi/[absensiId]`, `/admin/absensi/[absensiId]/edit`, `/admin/absensi/tambah`, `/admin/siswa/[siswaId]` |
| K8 Rekap kehadiran | `/admin/absensi`, `/admin/laporan`, `/admin/laporan/kehadiran-siswa`, `/admin/laporan/rekap-pembelajaran`, `/admin/laporan/hubungi-pengajar/[pengajarId]`, `/admin/users/[userId]` |
| K9 Pemantauan | `/admin`, `/admin/pemantauan`, `/admin/laporan/hubungi-pengajar/[pengajarId]` |
| K10 Riwayat kontak | `/admin/pemantauan/[pemantauanId]`, `/admin/laporan/hubungi-pengajar/[pengajarId]` |
| K11 Opsi form | 9 halaman `EntitySelect` (D09, D12, D13, D17, D19, D21, D33, D34, D35) |
| K12 Checkbox siswa | `/admin/kelas/[kelasId]/pindah-kelas`, `/admin/kelas/[kelasId]/tambah-siswa` |

---

## 5. Perbandingan tampilan data yang sama di berbagai halaman

### 5.1 Data kelas

| Halaman | Bentuk | Elemen yang sudah konsisten | Perbedaan yang masih ada |
|---|---|---|---|
| `/admin` | `ClassCard` | Nama, kapasitas, jadwal | `ClassCard` memakai `Tersedia: X Kursi`, bukan `Tersedia X Kursi` |
| `/admin/kelas` | Baris inline | `LinkDetail`, `ClassCapacityLabel`, `TeacherCapacityLabel`, `StatusBadge` | Belum pakai `AdminList` |
| `/admin/laporan/aktivitas-kelas` | `AdminDataTable` | Status via `StatusBadge` | Kolom berupa count, bukan kartu |
| `/admin/users/[userId]` | `<ol>` bertingkat | Nama kelas + kapasitas | Teks `${available} kursi tersedia` / `Penuh` berbeda dari label kapasitas lain |
| Opsi form 9 halaman | `EntitySelect` | Urutan alphabetik, placeholder | String label dibuat manual di tiap halaman |

Kesimpulan: **nama kelas, kapasitas, dan status sebaiknya memakai pola yang sama**. Kartu, tabel, dan opsi tetap boleh berbeda karena konteksnya berbeda.

### 5.2 Data siswa

| Halaman | Bentuk | Perbedaan |
|---|---|---|
| `/admin/siswa` | Baris inline + link kelas/pengajar | Belum ada komponen list |
| `/admin/absensi` | Rekap Hadir/Izin/Sakit/Alpa, diurutkan | Fokus kehadiran, bukan identitas |
| `/admin/kelas/[kelasId]` | Anggota: NIS, nama, jenis kelamin, tanggal mulai | Fokus keanggotaan |
| `/admin/users/[userId]` | Siswa per kelas + rekap kehadiran | Fokus beban pengajar |
| `/admin/laporan/kehadiran-siswa` | `AdminDataTable` + persentase | Fokus laporan |
| Checkbox pages | Input checkbox manual | Fokus seleksi, bukan tampilan |

Kesimpulan: **identitas siswa (NIS, nama) boleh jadi field bersama**, tetapi rekap dan checkbox harus tetap terpisah.

### 5.3 Data absensi

| Bentuk | Halaman | Komponen |
|---|---|---|
| Sesi | `/admin/absensi`, `/admin/laporan`, `/admin/laporan/rekap-pembelajaran` | Inline / `AdminDataTable` |
| Detail per siswa | `/admin/absensi/[absensiId]` | `AdminDataTable` |
| Detail editable | `/admin/absensi/[absensiId]/edit`, `/admin/absensi/tambah` | Inline form |
| Rekap per siswa | `/admin/absensi`, `/admin/laporan/kehadiran-siswa`, `/admin/users/[userId]` | Inline / `AdminDataTable` |
| Kasus alfa | `/admin`, `/admin/pemantauan` | `MonitoringList` |
| Ringkasan kasus | `/admin/laporan/hubungi-pengajar/[pengajarId]` | `AttendanceCaseSummary` |

Kesimpulan: jangan disatukan. Yang bisa distandardisasi hanya **label status** (`StatusBadge`) dan **urutan status** `hadir, izin, sakit, alfa`.

### 5.4 Data users/Pengajar

| Halaman | Bentuk | Perbedaan |
|---|---|---|
| `/admin/users` | Baris inline + `CapacityInfo` | Role dan status akun |
| `/admin` | `AdminList` + `TeacherCapacityLabel` | Hanya Pengajar, ringkas |
| `/admin/kelas` | Baris kelas dengan `TeacherCapacityLabel` | Pengajar sebagai relasi |
| `/admin/laporan/kehadiran-pengajar` | `AdminDataTable` | Count absensi berdasar `created_by` |

Kesimpulan: **nama + sisa kapasitas + status** bisa memakai pola yang sama. Kolom laporan tetap terpisah.

### 5.5 Jadwal

| Halaman | Bentuk |
|---|---|
| `/admin/jadwal` | Baris inline lengkap |
| `/admin/kelas/[kelasId]` | `<li>` ringkas: hari + jam |
| `/admin` | Teks gabungan di dalam `ClassCard` |
| `/admin/laporan/...` | Count saja |

Kesimpulan: komponen ringkas `ScheduleList` hanya masuk akal untuk daftar jadwal, bukan untuk count.

### 5.6 Monitoring dan riwayat kontak

- `/admin` dan `/admin/pemantauan` sudah sama-sama memakai `MonitoringList`. Beda hanya aksi dan keberadaan `pemantauan_id`.
- `/admin/pemantauan/[pemantauanId]` dan `/admin/laporan/hubungi-pengajar/[pengajarId]` sudah sama-sama memakai `ContactHistoryList`.

Kesimpulan: dua komponen ini sudah mencapai tujuan konsistensi. Tidak perlu dibuat ulang.

### 5.7 Data sekolah

Bukan data loop. Muncul di `src/app/admin/layout.js`, `/admin/sekolah`, form tambah/edit, dan action. Tidak masuk rekomendasi komponen list/table.

---

## 6. Komponen reusable yang sudah ada

### 6.1 Komponen dengan loop aktif di Admin

| Komponen | Path | Loop | Dipakai di |
|---|---|---|---|
| `AdminDataTable` | `src/components/ui/admin-data-table.js` | `rows.map` + `columns.map` (L10-20) | D07, D23, D24, D25, D26 |
| `AdminList` | `src/components/ui/admin-list.js` | `items.map` (L10-14) | D02, D03 |
| `MonitoringList` | `src/components/ui/monitoring-list.js` | `items.map` (L8-17) | D04, D29 |
| `EntitySelect` | `src/components/ui/entity-select.js` | sort + `sortedItems.map` (L62-86) | D09, D12, D13, D17, D19, D21, D33, D34, D35 |
| `ContactHistoryList` | `src/components/ui/contact-history-list.js` | `riwayat.map` (L8-12) | D27, D30 |
| `RoleSelectWithLimit` | `src/components/ui/role-select-with-limit.js` | `[2,3,4,5].map` (L22) | Form user; loop konstanta, bukan Sheets |

### 6.2 Komponen loop yang belum dipakai atau hanya import

| Komponen | Path | Catatan aktual |
|---|---|---|
| `StudentCheckboxList` | `src/components/ui/student-checkbox-list.js` | Punya sorting + state checkbox; tidak di-import halaman mana pun |
| `SelectInput` | `src/components/ui/select-input.js` | Generic options; tidak dipakai |
| `StaticTable` | `src/components/ui/static-table.js` | Mirip `AdminDataTable`; tidak dipakai |
| `InfoList` | `src/components/ui/info-list.js` | Label/value list; tidak dipakai |
| `PageHeader` + `Breadcrumb` | `src/components/ui/page-header.js`, `src/components/layout/breadcrumb.js` | Loop breadcrumb; tidak dipakai |
| `NoteBox` | `src/components/layout/note-box.js` | Di-import di D18, tetapi tidak dirender |
| `PeriodeFilter`, `StudentSearchForm` | `src/components/siswa/*` | Loop konstanta `PERIODE_OPTIONS`; di luar scope Admin |
| `CapacityLabel` | `src/components/ui/capacity-label.js` | Tidak dipakai; teks `{filled}/{limit} batu` / `huntu` tidak sesuai konvensi |

### 6.3 Komponen field tanpa loop yang mendukung konsistensi

| Komponen | Fungsi |
|---|---|
| `ClassCard` | Satu kartu kelas |
| `ClassCapacityLabel` | `Tersedia X Kursi` / `Penuh` |
| `TeacherCapacityLabel` | `Tersedia X Kelas` / `Penuh` |
| `CapacityInfo` | Nama + `Tersedia X Kelas` / `Penuh` |
| `StatusBadge` | Label status aktif/nonaktif, final/draft, hadir/izin/sakit/alfa |
| `LinkDetail` | Link detail internal |
| `FormatDate` | Tanggal `id-ID` |
| `AttendanceCaseSummary` | Ringkasan satu kasus absensi |
| `EmptyState` | Empty state untuk `AdminDataTable` dan `AdminList` |

---

## 7. Rekomendasi komponen reusable

Semua poin di bagian ini adalah **rekomendasi**. Belum ada komponen yang dibuat atau diubah.

### R1 — `AdminDataTable` sebagai komponen tabel-like kanonik

1. **Nama:** `AdminDataTable` (sudah ada).
2. **Kategori:** K6, K7, K8, laporan tabular.
3. **Props aktual:** `columns`, `rows`, `rowKey`, `actions`, `emptyMessage`.
4. **Tanggung jawab:** header kolom, satu baris per record, empty state, aksi baris.
5. **Tanggung jawab halaman:** menyiapkan `rows`, menentukan `columns`, filter/sort, query repository, otorisasi.
6. **Kustomisasi aman:** `column.render` untuk sel khusus; `actions` untuk link; `emptyMessage` untuk konteks. Jangan menambah gaya/kelas baru.
7. **Target migrasi:** D05, D06, D11, D14, D22, D31, D32, D36.

### R2 — `AdminList` sebagai daftar sederhana kanonik

1. **Nama:** `AdminList` (sudah ada).
2. **Kategori:** K1, K3, K4, K5, K8.
3. **Props aktual:** `items`, `renderItem`, `emptyMessage`.
4. **Tanggung jawab:** `<ul>`, key tiap item, empty state.
5. **Tanggung jawab halaman:** isi baris melalui `renderItem`, field component, link, aksi.
6. **Kustomisasi aman:** `renderItem` boleh merangkai `LinkDetail`, `StatusBadge`, capacity label. Urutan dan filter tetap di halaman.
7. **Target migrasi:** baris inline di D05, D06, D11, D14, D16, D22, D31, D32, D36, D37.

### R3 — `StatusBadge` sebagai satu-satunya label status

1. **Nama:** `StatusBadge` (sudah ada).
2. **Kategori:** semua status.
3. **Props:** `value`, `labels`.
4. **Tanggung jawab:** normalisasi `active/aktif`, `inactive/nonaktif`, `final/draft`, `hadir/izin/sakit/alfa`.
5. **Tanggung jawab halaman:** memilih field status dan meneruskan nilai mentah.
6. **Kustomisasi aman:** `labels` hanya untuk label tambahan, bukan mengubah urutan status hadir/izin/sakit/alfa.
7. **Target:** D05, D07, D11, D14, D23, D24, D32, D36, dan field status lain yang masih teks biasa.

### R4 — `EntitySelect` + helper format label opsi

1. **Nama:** `EntitySelect` (sudah ada) + usulan helper `formatKelasOptionLabel`, `formatPengajarOptionLabel`.
2. **Kategori:** K11.
3. **Props `EntitySelect`:** `id`, `name`, `items`, `value`/`defaultValue`, `labelKey`, `valueKey`, `formatLabel`, `required`, `disabled`, `placeholder`.
4. **Tanggung jawab:** sorting alphabetik, placeholder, `<option>`.
5. **Tanggung jawab halaman:** filter data, hitung kapasitas, kirim helper label.
6. **Kustomisasi aman:** helper label boleh diubah di satu tempat; komponen tidak boleh tahu aturan bisnis kapasitas.
7. **Catatan:** `EntitySelect` saat ini selalu memakai `defaultValue={selected}`, bahkan saat `value` dikirim. Jangan diasumsikan sebagai controlled component.

### R5 — `StudentCheckboxList` sebagai daftar checkbox siswa

1. **Nama:** `StudentCheckboxList` (sudah ada, belum dipakai).
2. **Kategori:** K12.
3. **Props aktual:** `students`, `selectedIds`, `onChange`, `disabled`.
4. **Usulan penyesuaian:** `namePrefix`, `renderLabel`, `disabledIds`, `emptyMessage`, opsi uncontrolled untuk form server action.
5. **Tanggung jawab:** sorting, checkbox, state pilihan bila dipakai sebagai client component.
6. **Tanggung jawab halaman:** menentukan siswa tersedia, alasan disabled, nama input, server action.
7. **Target migrasi:** D18, D20.

### R6 — `ClassMemberList` untuk anggota kelas

1. **Nama:** `ClassMemberList` (usulan baru).
2. **Kategori:** K2 + K3.
3. **Props usulan:** `items` (`siswa_id`, `nis`, `nama`, `jenis_kelamin`, `tanggal_mulai`, `status_keanggotaan`), `showTanggalMulai`, `showJenisKelamin`, `rekapBySiswa`, `actions`.
4. **Tanggung jawab:** satu baris anggota dengan identitas dasar; opsional kolom rekap.
5. **Tanggung jawab halaman:** query `kelas_siswa`, join siswa, hitung rekap, filter aktif.
6. **Kustomisasi aman:** toggle kolom lewat props, bukan duplikat komponen.
7. **Target:** D16, D38; D18/D20 tetap memakai checkbox list.

### R7 — `AttendanceRecapList` untuk rekap per siswa

1. **Nama:** `AttendanceRecapList` (usulan baru).
2. **Kategori:** K3 + K8.
3. **Props usulan:** `items` (`siswa_id`, `nis`, `nama`, `kelas`, `hadir`, `izin`, `sakit`, `alfa`, `persentase`), `showClass`, `showPercentage`, `actions`.
4. **Tanggung jawab:** urutan label Hadir/Izin/Sakit/Alfa, format kosong `-`, baris ringkas.
5. **Tanggung jawab halaman:** agregasi, sort, filter final, link detail.
6. **Kustomisasi aman:** `showClass`, `showPercentage`, `actions`; jangan mengubah urutan status.
7. **Target:** D06, D38; D25 tetap `AdminDataTable` karena kebutuhannya tabular-laporan.

### R8 — `ScheduleList` untuk jadwal ringkas

1. **Nama:** `ScheduleList` (usulan baru).
2. **Kategori:** K5.
3. **Props usulan:** `items` (`jadwal_id`, `hari`, `jam_mulai`, `jam_selesai`), `emptyMessage`.
4. **Tanggung jawab:** satu `<li>` per jadwal: hari + jam.
5. **Tanggung jawab halaman:** filter aktif, penentuan empty message, konteks halaman.
6. **Kustomisasi aman:** `emptyMessage`; tidak menambah kolom ruangan/status di komponen ringkas.
7. **Target:** D15; D01 bisa memakai versi ringkas di dalam `ClassCard` bila disetujui.

### R9 — `MonitoringList` dan `ContactHistoryList` dipertahankan

1. **Nama:** keduanya sudah ada.
2. **Kategori:** K9, K10.
3. **Props:** sudah sesuai (`items`, `actions`; `riwayat`).
4. **Tanggung jawab:** format kasus alfa dan riwayat kontak.
5. **Tanggung jawab halaman:** filter `>= 3`, join `pemantauan_id`, sort `tanggal_kontak`, aksi.
6. **Kustomisasi aman:** `actions` di `MonitoringList`; jangan mengubah field inti Nama/NIS/Kelas/Jumlah Alfa/Terakhir.
7. **Keputusan:** tidak dibuat ulang.

### R10 — `ClassCard` + capacity label diselaraskan

1. **Nama:** `ClassCard`, `ClassCapacityLabel`, `TeacherCapacityLabel`, `CapacityInfo`.
2. **Kategori:** K1 + K4.
3. **Tanggung jawab:** ringkasan satu entitas dan kapasitas.
4. **Tanggung jawab halaman:** menghitung `terisi`, memilih label yang dipakai.
5. **Kustomisasi aman:** props angka; `formatLabel` untuk opsi.
6. **Perbaikan yang disarankan:** satukan teks kapasitas menjadi `Tersedia X Kursi` / `Tersedia X Kelas`; hilangkan variasi `Tersedia: X Kursi` dan `${available} kursi tersedia`.
7. **Target:** D01, D02, D03, D14, D36, D37, dan semua label opsi kapasitas.

### R11 — `AttendanceCaseSummary` dipertahankan

1. **Nama:** sudah ada.
2. **Kategori:** K8 kasus tunggal.
3. **Props:** `siswa`, `kelas`, `data`, `periodStart`, `periodEnd`.
4. **Tanggung jawab:** blok ringkasan satu kasus.
5. **Tanggung jawab halaman:** `buildCaseData`, periode, aksi WhatsApp.
6. **Kustomisasi aman:** props periode; jangan diubah jadi list.
7. **Target:** D28.

### R12 — Helper format tanggal/status/nilai kosong

1. **Nama usulan:** `formatCellValue`, `formatDateCell`, `formatAttendanceCounts` di `src/lib/formatters.js` atau `src/lib/admin-formatters.js`.
2. **Kategori:** lintas kategori.
3. **Props/argumen:** nilai mentah + opsi.
4. **Tanggung jawab:** konsistensi `-`, tanggal, persentase, urutan status.
5. **Tanggung jawab halaman:** tetap menentukan field dan konteks.
6. **Kustomisasi aman:** aturan format pusat; komponen tidak mengandung query data.
7. **Target:** mengurangi duplikasi di `renderItem` dan `column.render`.

---

## 8. Rekomendasi struktur folder dan penamaan

Struktur yang sudah ada:

```text
src/components/
  ui/          # komponen umum; sudah berisi sebagian besar komponen Admin
  layout/      # breadcrumb, note-box, page-actions
  siswa/       # komponen halaman siswa publik
  common/      # kosong
  dashboard/   # kosong
```

Rekomendasi:

```text
src/components/
  ui/                         # generic primitives; tetap di sini
    admin-data-table.js
    admin-list.js
    entity-select.js
    status-badge.js
    empty-state.js
    link-detail.js
    class-capacity-label.js
    teacher-capacity-label.js
  admin/                      # folder baru untuk komponen domain Admin
    absensi/
      attendance-recap-list.js
      attendance-status-options.js
    kelas/
      class-member-list.js
      schedule-list.js
    siswa/
      student-checkbox-list.js   # bila dipindahkan eventual; jangan pindah dulu tanpa persetujuan
    pemantauan/
      monitoring-list.js         # bila dipindahkan eventual; jangan pindah dulu tanpa persetujuan
      contact-history-list.js
  layout/
    breadcrumb.js
    note-box.js
  siswa/
    student-search-form.js
    periode-filter.js
```

Aturan penempatan:

1. **Jangan memindahkan komponen lama pada tahap pertama.** Pindah folder berarti mengubah import di banyak halaman dan meningkatkan risiko.
2. Komponen **baru** yang spesifik domain Admin masuk `src/components/admin/<domain>/`.
3. Komponen generik tetap di `src/components/ui/`.
4. Helper format murni masuk `src/lib/admin-formatters.js`.
5. Nama file kebab-case; nama fungsi PascalCase untuk komponen, camelCase untuk helper.
6. Hindari membuat komponen generik ketiga untuk tabel/list selama `AdminDataTable` dan `AdminList` masih cukup.

---

## 9. Prioritas implementasi

| Prioritas | Tindakan | Alasan | Dampak perubahan |
|---|---|---|---|
| P0 | Samakan teks kapasitas: `Tersedia X Kursi` / `Tersedia X Kelas` | Sudah menjadi konvensi; `ClassCard` dan user detail masih beda | Teks saja; risiko render rendah |
| P0 | Pakai `StatusBadge` di semua field status yang masih teks biasa | Konsistensi label aktif/final/hadir | Teks saja |
| P0 | Migrasi `/admin/laporan` ke `AdminDataTable` | Satu-satunya rekap inline yang mudah diseragamkan | Struktur list berubah |
| P1 | Migrasi baris inline sederhana ke `AdminList` | Mengurangi duplikasi pola `field | field | Link` | Banyak file, tapi perilaku bisa dijaga |
| P1 | Pakai ulang `StudentCheckboxList` untuk D18/D20 | Komponen sudah ada; checkbox manual rawan beda state | Perlu uji submit form |
| P1 | Tambah `AttendanceRecapList` untuk D06/D38 | Rekap siswa muncul di beberapa halaman | Perlu uji sort/filter tetap sama |
| P2 | Tambah `ClassMemberList` dan `ScheduleList` | Menyamakan anggota kelas dan jadwal ringkas | Komponen baru |
| P2 | Satukan helper format opsi kapasitas |label string masih duplikat di 9 halaman | Perlu uji label opsi alphabetik |
| P2 | Tinjau komponen loop yang belum dipakai | Ada duplikasi fungsi, tetapi dilarang menghapus pada tahap ini | Hanya inventarisasi, bukan hapus |
| P3 | Pindahkan komponen domain ke `src/components/admin/` | Merapikan arsitektur | Banyak import berubah; lakukan terakhir |

---

## 10. Risiko dan hal yang perlu diperhatikan

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Migrasi list mengubah struktur DOM | Bisa mengubah urutan/aksi yang diharapkan user | Pertahankan field, link, dan sort persis seperti sebelumnya; uji tiap route |
| `AdminDataTable` merender `<ol>`, bukan `<table>` | Sesuai aturan proyek, tapi mudah salah saat “perbaikan” | Jangan ganti ke tag `<table>` |
| `EntitySelect` memakai `defaultValue`, bukan controlled `value` | Perubahan nilai setelah render tidak otomatis | Jangan ubah perilaku tanpa uji form edit |
| `ClassCard` memakai `Tersedia: X Kursi` | Inkonsisten dengan `ClassCapacityLabel` | Samakan teks sebelum migrasi kartu |
| Kapasitas dihitung ulang di banyak halaman | Salah hitung bila filter aktif berbeda | Pindahkan hanya formatnya; jangan pindahkan logika hitung tanpa test |
| `MonitoringList` menerima beberapa alias field | Dashboard dan pemantauan punya shape berbeda | Pertahankan fallback field; jangan hapus alias |
| `ContactHistoryList` mengandalkan sort dari halaman | Urutan bisa berubah bila sort dihapus | Biarkan halaman melakukan sort `tanggal_kontak` menurun |
| `getSiswaById` per baris di detail page | Potensi N+1 read Sheets | Jangan memperbanyak query per baris saat membuat komponen baru |
| `StatusBadge` punya mapping `alfa`/`alpa` | Bisa tampil beda jika nilai baru masuk | Tambah label baru lewat props `labels`, bukan ubah aturan urutan |
| Komponen lama belum dipakai | Risiko duplikasi jika dibuat komponen kembar | Cek `src/components` dulu sebelum membuat komponen baru |
| Aturan proyek: tanpa CSS/Tailwind custom | Migrasi bisa tergoda menambah class | Gunakan struktur elemen existing saja |
| Aturan Next 16: data dinamis | Halaman bisa ter-prerender dengan data basi | Pertahankan `connection()` dan `instant = false` pada halaman data Sheets |
| Otorisasi Admin | Perubahan UI tidak boleh membuka aksi tulis | Jangan pindahkan atau melemahkan guard di `src/app/admin/layout.js` dan server action |
| `sekolah` adalah record tunggal | Tidak boleh ikut pola list/table | Kecualikan dari komponen reusable list |

---

## 11. Menunggu persetujuan

Audit selesai. Belum ada implementasi komponen, refactor, atau perubahan halaman.

Yang perlu diputuskan sebelum implementasi:

1. Apakah P0 dan P1 dijadikan satu batch implementasi, atau bertahap per prioritas?
2. Apakah komponen baru (R5–R8, R12) disetujui dibuat di `src/components/admin/`?
3. Apakah komponen lama yang belum dipakai boleh dipakai ulang tanpa dipindahkan foldernya?
4. Apakah teks kapasitas `ClassCard` dan `/admin/users/[userId]` disetujui disamakan ke `Tersedia X Kursi`?
