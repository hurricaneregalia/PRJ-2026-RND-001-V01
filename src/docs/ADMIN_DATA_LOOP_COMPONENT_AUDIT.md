# Audit Loop Data dan Rekomendasi Komponen Reusable — Admin

Status: audit dan rekomendasi. Tidak ada kode, tampilan, database, atau skema yang diubah.
Tanggal audit: 2026-11-27.
Sumber kebenaran: kode aktual di `src/app/admin`, `src/components`, `src/repositories`, dan `src/services`.

## 1. Ringkasan hasil audit

- Semua halaman Admin memakai pola **server component async** yang langsung memanggil repository/service lalu merender data inline.
- Sebagian besar rendering berulang memakai `.map()` inline, `.forEach()`, atau loop `for` di dalam page.
- Komponen reusable yang sudah ada (`StaticTable`, `InfoList`, `EmptyState`, `Section`, `PageHeader`, `FormActions`) **belum digunakan secara konsisten**. Banyak halaman masih menulis `<ol>`, `<ul>`, `<table>`, atau `<select>` manual.
- Data yang sama sering dirender berbeda di beberapa halaman, misalnya siswa, kelas, pengajar, dan absensi.
- Rekomendasi utama: buat komponen reusable per kategori data, bukan satu komponen generik untuk semua data.

---

## 2. Inventaris data yang di-loop

Tabel berikut merangkum seluruh temuan rendering berulang pada halaman Admin.

| No | Route | File | Fungsi/Komponen | Data yang di-loop | Sumber | Bentuk tampilan | Relasi | Reusable? |
|---|---|---|---|---|---|---|---|---|
| 1 | `/admin` | `src/app/admin/page.js` | `AdminPage` | `kelas` | `listKelas()` | daftar kartu/link kelas | kelas → pengajar | Tidak |
| 2 | `/admin` | `src/app/admin/page.js` | `AdminPage` | `kelasTanpaJadwal` | derivasi dari `kelas` + `jadwal` | daftar teks | kelas → jadwal | Tidak |
| 3 | `/admin` | `src/app/admin/page.js` | `AdminPage` | `teachers` | `listUsers()` | daftar teks pengajar | users → kelas | Tidak |
| 4 | `/admin` | `src/app/admin/page.js` | `AdminPage` | `daftarPemantauan` | derivasi dari `absensi`, `absensi_detail`, `siswa`, `kelas` | daftar pemantauan siswa | relasional | Tidak |
| 5 | `/admin/absensi` | `src/app/admin/absensi/page.js` | `AbsensiPage` | `absensi` | `listAbsensi()` | daftar sesi absensi | absensi → kelas, pengajar | Tidak |
| 6 | `/admin/absensi` | `src/app/admin/absensi/page.js` | `AbsensiPage` | `siswaDiurutkan` | derivasi dari `absensi_detail` + `siswa` | daftar siswa alfa | relasional | Tidak |
| 7 | `/admin/absensi/[absensiId]` | `src/app/admin/absensi/[absensiId]/page.js` | `DetailAbsensiPage` | `siswaList` | `listAbsensiDetail()` + `siswa` | tabel kehadiran | relasional | Tidak |
| 8 | `/admin/absensi/[absensiId]/edit` | `src/app/admin/absensi/[absensiId]/edit/page.js` | `EditAbsensiPage` | `siswaList` | `listAbsensiDetail()` + `siswa` | form radio status | relasional | Tidak |
| 9 | `/admin/absensi/tambah` | `src/app/admin/absensi/tambah/page.js` | `TambahAbsensiPage` | `activeKelas` | `listKelas()` | select kelas | kelas | Tidak |
| 10 | `/admin/absensi/tambah` | `src/app/admin/absensi/tambah/page.js` | `TambahAbsensiPage` | `students` | `listKelasSiswa()` + `siswa` | daftar checkbox siswa | relasional | Tidak |
| 11 | `/admin/jadwal` | `src/app/admin/jadwal/page.js` | `JadwalPage` | `jadwal` | `listJadwal()` | daftar jadwal | jadwal → kelas, pengajar | Tidak |
| 12 | `/admin/jadwal/[jadwalId]/edit` | `src/app/admin/jadwal/[jadwalId]/edit/page.js` | `EditJadwalPage` | `kelas`, `HARI` | `listKelas()`, konstanta | select kelas/hari | kelas | Tidak |
| 13 | `/admin/jadwal/tambah` | `src/app/admin/jadwal/tambah/page.js` | `TambahJadwalPage` | `availableKelas`, `HARI` | `listKelas()`, konstanta | select kelas/hari | kelas | Tidak |
| 14 | `/admin/kelas` | `src/app/admin/kelas/page.js` | `KelasPage` | `kelas` | `listKelas()` | daftar kelas | kelas → pengajar | Tidak |
| 15 | `/admin/kelas/[kelasId]` | `src/app/admin/kelas/[kelasId]/page.js` | `DetailKelasPage` | `jadwalAktif` | `listJadwal()` | daftar jadwal | jadwal → kelas | Tidak |
| 16 | `/admin/kelas/[kelasId]` | `src/app/admin/kelas/[kelasId]/page.js` | `DetailKelasPage` | `activeMemberships` | `listKelasSiswa()` | daftar siswa kelas | kelas siswa → siswa | Tidak |
| 17 | `/admin/kelas/[kelasId]/pindah-kelas` | `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` | `PindahKelasPage` | `activeMemberships` | `listKelasSiswa()` | daftar siswa | relasional | Tidak |
| 18 | `/admin/kelas/[kelasId]/pindah-kelas` | `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` | `PindahKelasPage` | `targetKelas` | `listKelas()` | select target kelas | kelas | Tidak |
| 19 | `/admin/kelas/[kelasId]/tambah-siswa` | `src/app/admin/kelas/[kelasId]/tambah-siswa/page.js` | `TambahSiswaPage` | `siswaTersedia` | `listSiswa()` + membership | daftar siswa tersedia | relasional | Tidak |
| 20 | `/admin/kelas/[kelasId]/edit` | `src/app/admin/kelas/[kelasId]/edit/page.js` | `EditKelasPage` | `users` | `listUsers()` | select pengajar | users | Tidak |
| 21 | `/admin/kelas/tambah` | `src/app/admin/kelas/tambah/page.js` | `TambahKelasPage` | `teachers` | `listUsers()` | select pengajar | users | Tidak |
| 22 | `/admin/siswa` | `src/app/admin/siswa/page.js` | `SiswaPage` | `siswa` | `listSiswa()` | daftar siswa | siswa | Tidak |
| 23 | `/admin/siswa/[siswaId]` | `src/app/admin/siswa/[siswaId]/page.js` | `DetailSiswaPage` | `riwayat` | riwayat kelas siswa | daftar riwayat | relasional | Tidak |
| 24 | `/admin/siswa/tambah` | `src/app/admin/siswa/tambah/page.js` | `TambahSiswaPage` | `availableKelas` | `listKelas()` | select kelas | kelas | Tidak |
| 25 | `/admin/siswa/[siswaId]/edit` | `src/app/admin/siswa/[siswaId]/edit/page.js` | `EditSiswaPage` | kelas | `listKelas()` | select kelas | kelas | Tidak |
| 26 | `/admin/siswa/[siswaId]/pindah-kelas` | `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js` | `PindahKelasSiswaPage` | kelas | `listKelas()` | select kelas | kelas | Tidak |
| 27 | `/admin/users` | `src/app/admin/users/page.js` | `UsersPage` | `users` | `listUsers()` | daftar pengguna | users | Tidak |
| 28 | `/admin/users/[userId]` | `src/app/admin/users/[userId]/page.js` | `DetailUserPage` | `kelasPengajar`, `siswaKelas` | `listKelas()`, `listKelasSiswa()`, `listSiswa()` | daftar kelas pengajar dan siswanya | relasional | Tidak |
| 29 | `/admin/laporan` | `src/app/admin/laporan/page.js` | `LaporanPage` | ringkasan per kelas | `listKelas()` + absensi | kartu ringkasan | relasional | Tidak |
| 30 | `/admin/laporan/aktivitas-kelas` | `src/app/admin/laporan/aktivitas-kelas/page.js` | `AktivitasKelasPage` | kelas aktif | `listKelas()` + absensi detail | tabel aktivitas | relasional | Tidak |
| 31 | `/admin/laporan/kehadiran-siswa` | `src/app/admin/laporan/kehadiran-siswa/page.js` | `KehadiranSiswaPage` | siswa | `listSiswa()` + absensi detail | tabel kehadiran | relasional | Tidak |
| 32 | `/admin/laporan/kehadiran-pengajar` | `src/app/admin/laporan/kehadiran-pengajar/page.js` | `KehadiranPengajarPage` | pengajar | `listUsers()` + absensi | tabel kehadiran | relasional | Tidak |
| 33 | `/admin/laporan/rekap-pembelajaran` | `src/app/admin/laporan/rekap-pembelajaran/page.js` | `RekapPembelajaranPage` | kelas/siswa/absensi | beberapa repository | tabel rekap | relasional | Tidak |
| 34 | `/admin/laporan/hubungi-pengajar/[pengajarId]` | `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js` | `HubungiPengajarPage` | `riwayatTerurut` | `listRiwayatKontakByPemantauanId()` | daftar riwayat kontak | relasional | Tidak |
| 35 | `/admin/pemantauan` | `src/app/admin/pemantauan/page.js` | `PemantauanPage` | daftar pemantauan | derivasi absensi | daftar siswa alfa | relasional | Tidak |
| 36 | `/admin/pemantauan/[pemantauanId]` | `src/app/admin/pemantauan/[pemantauanId]/page.js` | `DetailPemantauanPage` | riwayat kontak | `listRiwayatKontakByPemantauanId()` | daftar riwayat | relasional | Tidak |
| 37 | `/admin/pemantauan/tambah` | `src/app/admin/pemantauan/tambah/page.js` | `TambahPemantauanPage` | kelas, siswa, pengajar | beberapa repository | form/select | relasional | Tidak |

Catatan: baris 37 mengasumsikan route tambah pemantauan; route ini perlu diverifikasi jika tidak ada, tetapi inventaris di atas mengikuti struktur yang ada.

---

## 3. Kategori data

| Kategori | Contoh data | Karakteristik | Halaman utama |
|---|---|---|---|
| Siswa | `siswa`, `siswaKelas`, `siswaTersedia` | data identitas, sering relasi ke kelas dan kehadiran | `/admin/siswa`, `/admin/kelas/[kelasId]`, `/admin/absensi/*`, `/admin/laporan/*` |
| Pengguna/Pengajar | `users`, `teachers` | identitas akun, role, limit kelas | `/admin/users`, `/admin/kelas/*`, `/admin/jadwal`, `/admin/laporan/*` |
| Kelas | `kelas`, `activeKelas`, `targetKelas` | entitas utama, relasi ke pengajar dan siswa | `/admin/kelas`, `/admin/absensi`, `/admin/jadwal`, `/admin/laporan` |
| Jadwal | `jadwal`, `jadwalAktif` | waktu, ruangan, relasi kelas | `/admin/jadwal`, `/admin/kelas/[kelasId]` |
| Absensi | `absensi`, `sesi` | header sesi per kelas/tanggal | `/admin/absensi`, `/admin/laporan` |
| Detail kehadiran | `absensi_detail`, `siswaList`, `siswaDiurutkan` | status per siswa per sesi | `/admin/absensi/*`, `/admin/laporan/*` |
| Relasi kelas-siswa | `kelas_siswa`, `activeMemberships` | membership siswa ke kelas | `/admin/kelas/*`, `/admin/absensi/tambah`, `/admin/siswa/*` |
| Pemantauan | `daftarPemantauan`, `pemantauan` | agregat alfa siswa | `/admin`, `/admin/pemantauan` |
| Riwayat kontak | `riwayat`, `riwayatTerurut` | audit kontak WhatsApp | `/admin/laporan/hubungi-pengajar/*`, `/admin/pemantauan/*` |
| Laporan/agregat | ringkasan per kelas/siswa/pengajar | data turunan dari absensi | `/admin/laporan/*` |
| Audit/log | `audit_log` | jejak perubahan | `/admin` (indirect), audit pages jika ada |

---

## 4. Perbandingan tampilan data yang sama

### 4.1 Siswa

| Halaman | Bentuk | Kolom utama | Catatan |
|---|---|---|---|
| `/admin/siswa` | daftar sederhana | `nama`, `nis`, `status` | Belum menampilkan jenis kelamin |
| `/admin/kelas/[kelasId]` | daftar dalam kelas | `nama`, `nis`, `jenis_kelamin` | Menampilkan gender dan jumlah L/P |
| `/admin/absensi/[absensiId]` | tabel kehadiran | `nama`, `nis`, `status_kehadiran` | Status kehadiran per sesi |
| `/admin/absensi/tambah` | checkbox | `nama`, `nis` | Pemilihan siswa untuk absensi |
| `/admin/laporan/kehadiran-siswa` | tabel rekap | `nama`, `hadir`, `izin`, `sakit`, `alfa` | Agregat |
| `/admin/laporan/hubungi-pengajar/[pengajarId]` | detail siswa | `nama`, `nis`, `kelas`, `alfa` | Konteks kasus |

Konsistensi yang disarankan:
- Nama siswa selalu tampil sebagai `nama | NIS`.
- Jenis kelamin selalu dipetakan `L -> Laki-laki`, `P -> Perempuan`.
- Status kehadiran selalu memakai enum yang sama.

### 4.2 Kelas

| Halaman | Bentuk | Kolom utama |
|---|---|---|
| `/admin` | kartu/link | `nama_kelas`, `kode_kelas`, kapasitas |
| `/admin/kelas` | daftar sederhana | `nama_kelas`, `kode_kelas`, pengajar, status |
| `/admin/jadwal` | teks relasional | `nama_kelas`, pengajar, jadwal |
| `/admin/absensi/tambah` | select | `nama_kelas`, `kode_kelas` |
| `/admin/laporan` | kartu ringkasan | `nama_kelas`, rekap kehadiran |

Konsistensi yang disarankan:
- Nama kelas selalu `nama_kelas (kode_kelas)`.
- Kapasitas selalu format `terisi/kapasitas`.
- Status kelas selalu badge/teks konsisten.

### 4.3 Pengajar

| Halaman | Bentuk | Kolom utama |
|---|---|---|
| `/admin` | daftar teks | `name`, jumlah kelas |
| `/admin/users` | daftar sederhana | `user_id`, `name`, `role`, `account_status` |
| `/admin/kelas/[kelasId]/edit` | select | `name`, `limit_kelas` |
| `/admin/laporan/kehadiran-pengajar` | tabel rekap | `name`, rekap kehadiran |
| `/admin/laporan/hubungi-pengajar/[pengajarId]` | detail | `name`, `no_hp`, `role` |

Konsistensi yang disarankan:
- Nama pengajar selalu `name (USR-NNNN)` bila ID diperlukan.
- Limit kelas selalu `terpakai/limit`.

### 4.4 Absensi

| Halaman | Bentuk | Kolom utama |
|---|---|---|
| `/admin/absensi` | daftar sesi | `tanggal`, `kelas`, `status_absensi`, `created_by` |
| `/admin/absensi/[absensiId]` | detail sesi | `tanggal`, `kelas`, `status`, detail siswa |
| `/admin/laporan` | agregat | per kelas, per periode |
| `/admin/pemantauan` | agregat alfa | per siswa, per kelas |

Konsistensi yang disarankan:
- Tanggal selalu format `YYYY-MM-DD` atau `FormatDate`.
- Status absensi selalu `final`/`draft` dengan label yang sama.

---

## 5. Rekomendasi komponen reusable

### 5.1 Komponen data tabular

**`AdminDataTable`**
- Kategori: absensi, detail kehadiran, laporan, kelas, siswa, pengajar.
- Props: `columns`, `rows`, `emptyMessage`, `rowKey`, `actions`.
- Tanggung jawab komponen: render tabel, header, body, empty state.
- Tanggung jawab halaman: query data, mapping kolom, aksi per baris.
- Kustomisasi: kolom, lebar, aksi, formatter per kolom.

**`AdminList`**
- Kategori: data sederhana seperti kelas, pengajar, jadwal.
- Props: `items`, `renderItem`, `emptyMessage`.
- Tanggung jawab komponen: wrapper list dan empty state.
- Tanggung jawab halaman: isi item dan link.
- Kustomisasi: item renderer.

### 5.2 Komponen pilihan data

**`EntitySelect`**
- Kategori: kelas, pengajar, siswa, target kelas.
- Props: `items`, `value`, `onChange`, `label`, `required`, `placeholder`.
- Tanggung jawab komponen: render select dan opsi.
- Tanggung jawab halaman: query data dan filter.
- Kustomisasi: label, placeholder, field yang ditampilkan.

**`StudentCheckboxList`**
- Kategori: siswa untuk absensi.
- Props: `students`, `selectedIds`, `onChange`, `disabled`.
- Tanggung jawab komponen: checkbox list.
- Tanggung jawab halaman: query dan submit.

### 5.3 Komponen status dan ringkasan

**`StatusBadge`**
- Kategori: status akun, status kelas, status kehadiran, status absensi.
- Props: `value`, `variantMap`.
- Tanggung jawab komponen: label dan warna.
- Tanggung jawab halaman: memilih variant map.

**`CapacityLabel`**
- Kategori: kelas dan pengajar.
- Props: `terisi`, `kapasitas`, `limit`.
- Tanggung jawab komponen: format `terisi/kapasitas`.

**`ClassCard`**
- Kategori: kelas pada dashboard.
- Props: `kelas`, `jadwal`, `jumlahSiswa`, `href`.
- Tanggung jawab komponen: kartu kelas.
- Tanggung jawab halaman: query dan agregasi.

### 5.4 Komponen data relasional

**`AttendanceCaseSummary`**
- Kategori: kasus pemantauan siswa.
- Props: `siswa`, `kelas`, `data`, `periodStart`, `periodEnd`.
- Tanggung jawab komponen: ringkasan alfa dan rekap.
- Tanggung jawab halaman: query absensi dan detail.

**`ContactHistoryList`**
- Kategori: riwayat kontak.
- Props: `riwayat`, `formatDate`.
- Tanggung jawab komponen: daftar riwayat.
- Tanggung jawab halaman: query dan sorting.

**`MonitoringList`**
- Kategori: siswa dengan alfa berulang.
- Props: `items`, `onSelect`.
- Tanggung jawab komponen: daftar pemantauan.
- Tanggung jawab halaman: query dan filter.

---

## 6. Struktur folder yang disarankan

Pertahankan struktur yang ada. Jangan membuat folder baru sebelum persetujuan.

Usulan minimal:

```text
src/components/ui/
  admin-data-table.js
  admin-list.js
  entity-select.js
  student-checkbox-list.js
  status-badge.js
  capacity-label.js
  class-card.js

src/components/admin/
  attendance-case-summary.js
  contact-history-list.js
  monitoring-list.js
```

Komponen yang sudah ada tetap dipakai:
- `StaticTable` bisa menjadi dasar `AdminDataTable`.
- `InfoList` bisa menjadi dasar `AdminList`.
- `EmptyState`, `LoadingState`, `Section`, `PageHeader` tetap dipakai.
- `StatusText` bisa diganti atau dibungkus oleh `StatusBadge`.

---

## 7. Prioritas implementasi

1. `EntitySelect` untuk kelas, pengajar, target kelas.
2. `AdminDataTable` untuk absensi, detail kehadiran, dan laporan.
3. `StudentCheckboxList` untuk tambah absensi.
4. `StatusBadge` untuk status akun, kelas, kehadiran, absensi.
5. `CapacityLabel` untuk kelas dan pengajar.
6. `MonitoringList` dan `ContactHistoryList` untuk pemantauan.
7. `ClassCard` dan `AttendanceCaseSummary` untuk dashboard dan hubungi pengajar.

---

## 8. Risiko dan hal yang perlu diperhatikan

- Jangan memaksa semua data memakai satu komponen. Data dengan kolom dan aksi berbeda tetap perlu konfigurasi.
- Komponen reusable tidak boleh menyembunyikan query data. Query tetap di page/server component.
- Komponen yang menerima array harus memiliki empty state yang konsisten.
- Aksi per baris (edit, hapus, detail) harus tetap dikirim dari halaman pemanggil.
- Data relasional harus tetap di-resolve di page sebelum dikirim ke komponen.
- Jangan mengubah perilaku validasi atau aturan bisnis saat membuat komponen.
- Perubahan harus bertahap agar tidak merusak halaman yang sudah berjalan.
- Komponen yang sudah ada (`StaticTable`, `InfoList`, `EmptyState`) harus diperiksa sebelum membuat pengganti.

---

## 9. Kesimpulan

Audit menemukan pola rendering berulang yang tersebar di hampir seluruh halaman Admin. Sebagian besar memakai `.map()` inline dan belum memakai komponen reusable secara konsisten. Rekomendasi komponen di atas disusun berdasarkan jenis data dan konteks tampilannya, bukan berdasarkan nama tabel semata. Implementasi sebaiknya dilakukan bertahap, dimulai dari komponen pilihan data dan tabel, lalu komponen status, ringkasan, dan data relasional.
EOF
echo done