# Persiapan Integrasi Data Dinamis Halaman Pengajar

Status: **audit selesai, menunggu persetujuan implementasi**.

Dokumen ini disusun tanpa mengubah kode aplikasi, database, Google Spreadsheet, autentikasi, otorisasi, atau dokumen lain.

Sumber kebenaran: kode aktual di `src/app/pengajar`, `src/app/admin` (hanya dibaca), `src/repositories`, `src/services`, `src/lib`, dan `src/components`.

---

## 1. Ringkasan

### 1.1 Kondisi aktual

- `src/app/pengajar` berisi **12 file route** (`page.js`) dan **1 layout**.
- **9 dari 11 halaman** masih memakai data statis/hardcoded.
- **2 halaman sudah dinamis**: `/pengajar/profil` dan `/pengajar/profil/edit`.
- **3 halaman menulis data statis**: `/pengajar/kelas/[kelasId]/absensi/tambah`, `.../[absensiId]/edit`, dan `.../[absensiId]` (tombol edit). Tidak ada server action pada dua halaman absensi tersebut.
- **1 halaman memakai objek lokal** sebagai pengganti database: `/pengajar/kelas/[kelasId]` (`kelasData`).
- **Tidak ada pengecekan kepemilikan kelas** pada seluruh halaman Pengajar. Layout hanya memeriksa role, bukan relasi `kelas.pengajar_id`.
- **Tidak ada komponen data dinamis** yang dipakai di halaman Pengajar selain `AvatarImage`, `BackButton`, `formatJenisKelamin`, `getUserById`, dan `updateUser`.

### 1.2 Kesimpulan utama

1. Seluruh kebutuhan baca sudah tersedia di repository yang ada. Tidak perlu repository baru untuk membaca.
2. Seluruh kebutuhan tulis absensi sudah tersedia lewat `createAbsensi`, `createAbsensiDetail`, `updateAbsensi`, dan `updateAbsensiDetail`.
3. Risiko terbesar bukan query, melainkan **pembatasan data per pengajar**. Halaman Admin membaca seluruh tabel; halaman Pengajar tidak boleh melakukan hal yang sama.
4. Ada **kekosongan field** antara UI statis dan skema Sheets: `mata pelajaran`, `pelajaran`, dan status pertemuan `Selesai` tidak ada di skema.
5. `src/docs/PAGE_TRACKER.md` sudah menandai `[x]` beberapa halaman Pengajar yang sebenarnya masih statis. Ini tidak sesuai aturan proyek "halaman tidak boleh ditandai selesai sebelum informasinya dimasukkan".

---

## 2. Batas audit

| Area | Perlakuan |
|---|---|
| `src/app/admin/` | Dibaca sebagai referensi. Tidak diubah. |
| `src/app/pengajar/` | Target audit. Tidak diubah pada tahap ini. |
| Repository, service, lib, komponen | Diidentifikasi sebagai kandidat. Tidak diubah. |
| Database / Google Spreadsheet | Tidak disentuh. |
| Autentikasi / otorisasi | Tidak diubah. Perilaku aktual dicatat sebagai risiko. |
| Dokumen lain | Tidak diubah. |

---

## 3. Halaman Pengajar yang diperiksa

| No | Route | File | Fungsi | Sumber data aktual | Status |
|---|---|---|---|---|---|
| T01 | `/pengajar` | `src/app/pengajar/page.js` | `DashboardPengajarPage` | Statis | Perlu integrasi |
| T02 | `/pengajar/absensi` | `src/app/pengajar/absensi/page.js` | `AbsensiPengajarPage` | Statis | Perlu integrasi |
| T03 | `/pengajar/kelas` | `src/app/pengajar/kelas/page.js` | `KelasSayaPage` | Statis | Perlu integrasi |
| T04 | `/pengajar/kelas/[kelasId]` | `src/app/pengajar/kelas/[kelasId]/page.js` | `DetailKelasPengajarPage` | Objek lokal `kelasData` | Perlu integrasi |
| T05 | `/pengajar/kelas/[kelasId]/absensi/tambah` | `src/app/pengajar/kelas/[kelasId]/absensi/tambah/page.js` | `BuatAbsensiPage` | Statis, tanpa action | Perlu integrasi + tulis |
| T06 | `/pengajar/kelas/[kelasId]/absensi/[absensiId]` | `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/page.js` | `DetailAbsensiPengajarKelasPage` | Statis | Perlu integrasi |
| T07 | `/pengajar/kelas/[kelasId]/absensi/[absensiId]/edit` | `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/edit/page.js` | `EditAbsensiPengajarPage` | Statis, tanpa action | Perlu integrasi + tulis |
| T08 | `/pengajar/kelas/[kelasId]/absensi/riwayat` | `src/app/pengajar/kelas/[kelasId]/absensi/riwayat/page.js` | `RiwayatAbsensiPage` | Statis | Perlu integrasi |
| T09 | `/pengajar/laporan` | `src/app/pengajar/laporan/page.js` | `LaporanPengajarPage` | Statis | Perlu integrasi |
| T10 | `/pengajar/profil` | `src/app/pengajar/profil/page.js` | `ProfilPengajarPage` | `auth()` + `getUserById()` | Sudah dinamis |
| T11 | `/pengajar/profil/edit` | `src/app/pengajar/profil/edit/page.js` | `EditProfilPengajarPage` | `auth()` + `getUserById()` + `updateUser()` | Sudah dinamis |
| T12 | `/pengajar/*` | `src/app/pengajar/layout.js` | `PengajarLayout` | `auth()` + `getUserById()` | Sudah dinamis |

Bukti kondisi statis:

- T01 `src/app/pengajar/page.js:13-16` — nama `Budi`, tanggal `Senin, 24 November 2026`, foto `https://i.pravatar.cc/150?img=12`.
- T01 `src/app/pengajar/page.js:22-28` — dua kelas hardcoded dengan link `/pengajar/kelas/3` dan `/pengajar/kelas/2`.
- T01 `src/app/pengajar/page.js:36-39` — empat baris siswa hardcoded.
- T02 `src/app/pengajar/absensi/page.js:19-23` — rekap siswa hardcoded.
- T02 `src/app/pengajar/absensi/page.js:29-59` — sepuluh sesi absensi hardcoded.
- T03 `src/app/pengajar/kelas/page.js:19-27` — dua kelas hardcoded.
- T04 `src/app/pengajar/kelas/[kelasId]/page.js:9-38` — objek `kelasData` lokal.
- T04 `src/app/pengajar/kelas/[kelasId]/page.js:42` — fallback `kelasData[kelasId] ?? kelasData["3"]`.
- T05 `src/app/pengajar/kelas/[kelasId]/absensi/tambah/page.js:21-43` — siswa hardcoded; `form` tanpa `action` pada baris 18.
- T06 `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/page.js:20-23` — pertemuan hardcoded.
- T06 `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/page.js:40-43` — siswa hardcoded.
- T06 `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/page.js:53` — link edit hardcoded `/pengajar/kelas/3/absensi/3/edit`.
- T07 `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/edit/page.js:24-58` — siswa dan status hardcoded; tombol submit di baris 74 berada di luar `<form>`.
- T08 `src/app/pengajar/kelas/[kelasId]/absensi/riwayat/page.js:20-21` — nama kelas dan pengajar hardcoded.
- T08 `src/app/pengajar/kelas/[kelasId]/absensi/riwayat/page.js:29-37` — tiga sesi hardcoded.
- T09 `src/app/pengajar/laporan/page.js:19-24` — total sesi dan kehadiran hardcoded.

---

## 4. Halaman Admin yang dijadikan referensi

Halaman Admin hanya dibaca. Tidak ada perubahan pada file berikut.

| No | Route Admin | File referensi | Pola yang diambil |
|---|---|---|---|
| R01 | `/admin` | `src/app/admin/page.js` | Agregasi absensi final, `ClassCard`, `AdminList`, `MonitoringList` |
| R02 | `/admin/absensi` | `src/app/admin/absensi/page.js` | Daftar sesi + rekap per siswa + hitungan per sesi |
| R03 | `/admin/absensi/tambah` | `src/app/admin/absensi/tambah/page.js` | Server action `createAbsensi` + `createAbsensiDetail`, `created_by`/`updated_by`, audit |
| R04 | `/admin/absensi/[absensiId]` | `src/app/admin/absensi/[absensiId]/page.js` | Join detail + siswa, statistik, `AdminDataTable`, `StatusBadge` |
| R05 | `/admin/absensi/[absensiId]/edit` | `src/app/admin/absensi/[absensiId]/edit/page.js` | Server action `updateAbsensi` + `updateAbsensiDetail`, audit |
| R06 | `/admin/kelas` | `src/app/admin/kelas/page.js` | Daftar kelas, kapasitas, status, pengajar |
| R07 | `/admin/kelas/[kelasId]` | `src/app/admin/kelas/[kelasId]/page.js` | Detail kelas, anggota aktif, jadwal, kapasitas |
| R08 | `/admin/users/[userId]` | `src/app/admin/users/[userId]/page.js` | Kelas per pengajar, anggota, rekap kehadiran |
| R09 | `/admin/laporan` | `src/app/admin/laporan/page.js` | Rekap per kelas |
| R10 | `/admin/laporan/kehadiran-siswa` | `src/app/admin/laporan/kehadiran-siswa/page.js` | Rekap per siswa + persentase |
| R11 | `/admin/laporan/aktivitas-kelas` | `src/app/admin/laporan/aktivitas-kelas/page.js` | Rekap per kelas dengan `AdminDataTable` |
| R12 | `/admin/laporan/rekap-pembelajaran` | `src/app/admin/laporan/rekap-pembelajaran/page.js` | Rekap per tanggal |
| R13 | `/admin/layout.js` | `src/app/admin/layout.js` | Guard role + `connection()` + `instant = false` |

Bukti pola penting:

- R01 `src/app/admin/page.js:37-49` — membaca `absensi`, `absensi_detail`, `kelas`, `kelas_siswa`, `siswa`, `users`, `jadwal`.
- R01 `src/app/admin/page.js:126-159` — agregasi kasus alfa 30 hari.
- R01 `src/app/admin/page.js:212-223` — `ClassCard` per kelas.
- R02 `src/app/admin/absensi/page.js:36-58` — rekap final per siswa dan urutan berdasarkan hadir.
- R02 `src/app/admin/absensi/page.js:115-131` — baris sesi absensi.
- R03 `src/app/admin/absensi/tambah/page.js:78-112` — action menyimpan sesi lalu detail per siswa.
- R03 `src/app/admin/absensi/tambah/page.js:193-215` — `select` status dari `KEHADIRAN_STATUSES`.
- R04 `src/app/admin/absensi/[absensiId]/page.js:40-52` — join detail dengan siswa dan hitung status.
- R05 `src/app/admin/absensi/[absensiId]/edit/page.js:46-77` — update sesi dan detail.
- R07 `src/app/admin/kelas/[kelasId]/page.js:36-46` — pengajar, keanggotaan aktif, jadwal aktif, siswa.
- R07 `src/app/admin/kelas/[kelasId]/page.js:65` — `ClassCapacityLabel`.
- R08 `src/app/admin/users/[userId]/page.js:37-63` — filter kelas berdasarkan `pengajar_id` lalu rekap.
- R10 `src/app/admin/laporan/kehadiran-siswa/page.js:30-72` — agregasi per siswa dan persentase.
- R13 `src/app/admin/layout.js:22-24` — guard `role !== "Admin"`.

---

## 5. Alur data aktual dan relasi tabel

### 5.1 Alur baca

```text
page.js (server component)
  -> repository
  -> createTableRepository.readAll()
  -> readWorksheetRecords(tableName, header)
  -> Google Sheets values.get
```

Bukti:

- `src/repositories/sheet-table-repository.js:178-193` — `readAll()`.
- `src/repositories/sheets-repository.js:50-57` — `values.get`.
- `src/lib/sheet-schema.js:15-115` — nama kolom per worksheet.

### 5.2 Relasi yang dibutuhkan halaman Pengajar

| Kebutuhan | Relasi |
|---|---|
| Kelas milik pengajar | `kelas.pengajar_id` = `session.user.id` |
| Siswa aktif per kelas | `kelas_siswa.kelas_id` → `kelas.kelas_id`, filter `status_keanggotaan = "aktif"`, lalu `kelas_siswa.siswa_id` → `siswa.siswa_id` |
| Jadwal per kelas | `jadwal.kelas_id` → `kelas.kelas_id`, filter `status_jadwal = "aktif"` |
| Sesi absensi per kelas | `absensi.kelas_id` → `kelas.kelas_id`, filter `status_absensi = "final"` |
| Detail kehadiran | `absensi_detail.absensi_id` → `absensi.absensi_id`, `absensi_detail.siswa_id` → `siswa.siswa_id` |
| Rekap per siswa | agregasi `absensi_detail` yang hanya terkait `absensi` final dan kelas milik pengajar |
| Profil pengajar | `users.user_id` = `session.user.id` |

### 5.3 Field yang tersedia di skema

| Tabel | Kolom relevan |
|---|---|
| `users` | `user_id`, `email`, `name`, `jenis_kelamin`, `role`, `account_status`, `photo_url`, `no_hp`, `limit_kelas` |
| `siswa` | `siswa_id`, `nama`, `nis`, `jenis_kelamin`, `tanggal_lahir`, `alamat`, `no_hp`, `status` |
| `kelas` | `kelas_id`, `kode_kelas`, `nama_kelas`, `pengajar_id`, `kapasitas`, `status_kelas` |
| `kelas_siswa` | `kelas_siswa_id`, `kelas_id`, `siswa_id`, `tanggal_mulai`, `tanggal_selesai`, `status_keanggotaan` |
| `jadwal` | `jadwal_id`, `kelas_id`, `hari`, `jam_mulai`, `jam_selesai`, `ruangan`, `status_jadwal` |
| `absensi` | `absensi_id`, `kelas_id`, `jadwal_id`, `tanggal`, `jam_mulai`, `jam_selesai`, `topik`, `status_absensi`, `created_by` |
| `absensi_detail` | `absensi_detail_id`, `absensi_id`, `siswa_id`, `status_kehadiran`, `catatan`, `updated_by` |

Bukti: `src/lib/sheet-schema.js:15-93`.

### 5.4 Kekosongan field antara UI statis dan skema

| Elemen UI statis | Lokasi | Kondisi skema | Dampak |
|---|---|---|---|
| `Mata Pelajaran` / `Pelajaran` | T01 baris 22-28, T03 baris 19-27, T04 baris 56 | Tidak ada kolom di `kelas` maupun `jadwal` | Tidak dapat diisi tanpa keputusan pemetaan |
| `Status pertemuan: Selesai` | T06 baris 22 | `absensi.status_absensi` hanya `final` | Label harus mengikuti `StatusBadge` (`Final`) atau diputuskan lain |
| `Ruangan` pada detail kelas | T04 baris 60 | `ruangan` ada di `jadwal`, bukan `kelas` | Harus diambil dari jadwal aktif |
| `Materi yang dibahas` | T05 baris 49, T07 baris 65 | `absensi.topik` | Bisa dipetakan ke `topik` |
| `Catatan singkat pengajar` | T05 baris 53, T07 baris 69 | `absensi.topik` atau `absensi_detail.catatan` | Perlu keputusan: catatan sesi atau catatan per siswa |
| `Jumlah siswa` | T01, T03, T04 | Turunan `kelas_siswa` aktif | Bukan kolom tersimpan |
| `Persentase kehadiran` | T09 baris 24 | Turunan `absensi_detail` | Bukan kolom tersimpan |

Catatan: ketidaksesuaian ini adalah **fakta skema**, bukan rekomendasi perubahan database.

---

## 6. Target perubahan di `src/app/pengajar`

Semua baris di bawah adalah rencana. Belum ada implementasi.

### 6.1 Ringkasan target per file

| No | File | Jenis perubahan | Data yang dihubungkan | Komponen/helper kandidat |
|---|---|---|---|---|
| T01 | `src/app/pengajar/page.js` | Baca | `auth`, `users`, `kelas`, `kelas_siswa`, `jadwal`, `siswa`, `absensi`, `absensi_detail` | `AdminList`, `ClassCard`, `ClassCapacityLabel`, `AvatarImage`, `FormatDate` |
| T02 | `src/app/pengajar/absensi/page.js` | Baca | `kelas`, `kelas_siswa`, `siswa`, `absensi`, `absensi_detail`, `jadwal` | `AdminDataTable`, `StatusBadge`, `FormatDate` |
| T03 | `src/app/pengajar/kelas/page.js` | Baca | `kelas`, `kelas_siswa`, `jadwal` | `AdminList`, `ClassCapacityLabel`, `StatusBadge` |
| T04 | `src/app/pengajar/kelas/[kelasId]/page.js` | Baca + hapus objek lokal | `kelas`, `kelas_siswa`, `siswa`, `jadwal`, `absensi`, `absensi_detail` | `StatusBadge`, `ClassCapacityLabel`, `FormatDate`, `AdminDataTable` |
| T05 | `src/app/pengajar/kelas/[kelasId]/absensi/tambah/page.js` | Baca + tulis | `kelas`, `kelas_siswa`, `siswa`, `jadwal`, `absensi`, `absensi_detail` | `KEHADIRAN_STATUSES`, `ClassCapacityLabel`, `BackButton` |
| T06 | `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/page.js` | Baca | `absensi`, `absensi_detail`, `kelas`, `siswa` | `AdminDataTable`, `StatusBadge`, `FormatDate` |
| T07 | `src/app/pengajar/kelas/[kelasId]/absensi/[absensiId]/edit/page.js` | Baca + tulis | `absensi`, `absensi_detail`, `kelas`, `siswa` | `KEHADIRAN_STATUSES`, `FormatDate`, `BackButton` |
| T08 | `src/app/pengajar/kelas/[kelasId]/absensi/riwayat/page.js` | Baca | `kelas`, `absensi`, `absensi_detail` | `AdminDataTable`, `FormatDate` |
| T09 | `src/app/pengajar/laporan/page.js` | Baca | `kelas`, `kelas_siswa`, `siswa`, `absensi`, `absensi_detail` | `AdminDataTable` atau ringkasan angka |
| T10 | `src/app/pengajar/profil/page.js` | Verifikasi | Sudah `auth` + `getUserById` | `StatusBadge` opsional untuk status akun |
| T11 | `src/app/pengajar/profil/edit/page.js` | Verifikasi | Sudah `auth` + `updateUser` + audit | `BackButton` |
| T12 | `src/app/pengajar/layout.js` | Verifikasi | Sudah `auth` + `getUserById` | `AvatarImage` |

### 6.2 Detail target T01 — Dashboard

- **Kondisi sekarang:** nama, tanggal, foto, dua kelas, dan empat siswa statis.
- **Hasil dituju:**
  - Nama dan foto dari `getUserById(session.user.id)`.
  - Tanggal hari ini dari `todayDate()`.
  - Kelas dari `listKelas()` difilter `pengajar_id === session.user.id` dan `status_kelas === "aktif"`.
  - Jumlah siswa dari `kelas_siswa` aktif.
  - Jadwal dari `listJadwal()` per `kelas_id`.
  - Rekap siswa dibatasi pada kelas milik pengajar dan `absensi.status_absensi === "final"`.
- **Tidak diubah:** struktur navigasi, aturan role.
- **Catatan:** field `Pelajaran` tidak tersedia di skema.

### 6.3 Detail target T02 — Absensi

- **Kondisi sekarang:** rekap 4 siswa dan 10 sesi statis.
- **Hasil dituju:**
  - Rekap per siswa hanya dari kelas milik pengajar.
  - Daftar sesi hanya `absensi` dengan `kelas_id` milik pengajar.
  - Hitungan Hadir/Izin/Sakit/Alfa dari `absensi_detail`.
  - Link detail memakai `absensi_id` dan `kelas_id` aktual.
- **Tidak diubah:** urutan status `hadir, izin, sakit, alfa`.

### 6.4 Detail target T03 — Kelas Saya

- **Kondisi sekarang:** dua kelas statis.
- **Hasil dituju:** daftar `kelas` milik pengajar, jumlah siswa aktif, jadwal rutin dari `jadwal` aktif, status kelas via `StatusBadge`.
- **Catatan:** `Mata Pelajaran` tidak tersedia; kolom perlu diputuskan sebelum implementasi.

### 6.5 Detail target T04 — Detail Kelas

- **Kondisi sekarang:** objek `kelasData` lokal, fallback ke kelas `"3"` untuk ID tak dikenal.
- **Hasil dituju:**
  - `getKelasById(kelasId)`.
  - Validasi kepemilikan: `kelas.pengajar_id` harus sama dengan `session.user.id`.
  - Anggota dari `listKelasSiswaByKelasId(kelasId)` filter `aktif`, join `siswa`.
  - Jadwal aktif dari `listJadwalByKelasId(kelasId)`.
  - Kapasitas dari `ClassCapacityLabel`.
  - Rekap kehadiran per siswa dari `absensi` final + `absensi_detail`.
- **Wajib dihapus:** fallback `?? kelasData["3"]`; ID tidak valid harus menghasilkan halaman tidak ditemukan, bukan data kelas lain.
- **Catatan:** `Ruangan` diambil dari jadwal, bukan kelas.

### 6.6 Detail target T05 — Buat Absensi

- **Kondisi sekarang:** tidak memakai `params`, form tanpa `action`, siswa statis, tidak ada penyimpanan.
- **Hasil dituju:**
  - `params.kelasId`, `getKelasById`, validasi kepemilikan.
  - Siswa aktif dari `kelas_siswa` + `siswa`.
  - Server action memanggil `createAbsensi` dan `createAbsensiDetail`.
  - `created_by` dan `updated_by` diisi `session.user.id`.
  - Status default `hadir`, opsi dari `KEHADIRAN_STATUSES`.
  - Audit create mengikuti pola R03.
  - Redirect ke detail absensi yang baru dibuat.
- **Tidak diubah:** validasi repository, aturan status final.

### 6.7 Detail target T06 — Detail Absensi

- **Kondisi sekarang:** pertemuan, ringkasan, dan siswa statis; link edit hardcoded.
- **Hasil dituju:**
  - `getAbsensiById(absensiId)`, `listAbsensiDetailByAbsensiId(absensiId)`.
  - Pastikan `absensi.kelas_id` milik pengajar.
  - Join siswa dengan `listSiswa()` + Map, bukan `getSiswaById` per baris.
  - Statistik dihitung dari detail.
  - Link edit memakai `kelasId` dan `absensiId` aktual.
- **Catatan:** status `Selesai` tidak ada; gunakan `StatusBadge` untuk `final`.

### 6.8 Detail target T07 — Edit Absensi

- **Kondisi sekarang:** tidak memakai `params`, select statis, tombol submit di luar `<form>`.
- **Hasil dituju:**
  - Muat `absensi` dan detail berdasarkan `absensiId`.
  - Validasi kepemilikan.
  - `<form action={...}>` membungkus seluruh input.
  - Server action `updateAbsensi` + `updateAbsensiDetail` + audit update.
  - `updated_by` diisi `session.user.id`.
  - Redirect ke detail absensi.
- **Tidak diubah:** aturan bahwa `kelas_id` tidak boleh berubah (sudah dijaga repository).

### 6.9 Detail target T08 — Riwayat Absensi

- **Kondisi sekarang:** tiga sesi statis dan nama kelas hardcoded.
- **Hasil dituju:** `params.kelasId`, validasi kepemilikan, `listAbsensiByKelasId`, hitungan detail per sesi, `FormatDate`, link detail aktual.

### 6.10 Detail target T09 — Laporan

- **Kondisi sekarang:** total statis.
- **Hasil dituju:** agregasi `absensi_detail` yang hanya berasal dari `absensi` final pada kelas milik pengajar; total sesi, hadir, izin, sakit, alfa, persentase.
- **Catatan:** `Persentase kehadiran` dihitung dari `hadir / total`, mengikuti R10.

### 6.11 T10–T12 — Profil dan Layout

- T10 dan T11 sudah membaca/menulis data nyata.
- T11 sudah memakai `updateUser` dan `recordAuditUpdate`.
- T12 sudah memakai `auth()` dan `getUserById`.
- Kandidat perubahan hanya konsistensi tampilan status; bukan kebutuhan integrasi data.
- **Jangan ubah aturan role** pada layout tanpa keputusan terpisah.

---

## 7. File pendukung di luar `src/app/pengajar`

Bagian ini hanya identifikasi. Tidak ada perubahan.

### 7.1 Repository yang sudah tersedia dan relevan

| File | Fungsi yang dipakai |
|---|---|
| `src/repositories/kelas-repository.js` | `listKelas`, `getKelasById` |
| `src/repositories/kelas-siswa-repository.js` | `listKelasSiswa`, `listKelasSiswaByKelasId` |
| `src/repositories/jadwal-repository.js` | `listJadwal`, `listJadwalByKelasId` |
| `src/repositories/siswa-repository.js` | `listSiswa`, `getSiswaById` |
| `src/repositories/absensi-repository.js` | `listAbsensi`, `getAbsensiById`, `listAbsensiByKelasId`, `createAbsensi`, `updateAbsensi` |
| `src/repositories/absensi-detail-repository.js` | `listAbsensiDetail`, `listAbsensiDetailByAbsensiId`, `createAbsensiDetail`, `updateAbsensiDetail` |
| `src/repositories/user-repository.js` | `getUserById`, `updateUser` |
| `src/repositories/audit-log-repository.js` | `recordAuditCreate`, `recordAuditUpdate` |

Catatan: `listKelasSiswaByKelasId` mengembalikan semua keanggotaan, bukan hanya aktif (`src/repositories/kelas-siswa-repository.js:172-175`). Filter aktif harus dilakukan pemanggil.

### 7.2 Library yang sudah tersedia

| File | Fungsi |
|---|---|
| `src/lib/domain-constants.js` | `KEHADIRAN_STATUSES`, `ABSENSI_STATUSES`, `KELAS_STATUSES` |
| `src/lib/date-time.js` | `todayDate` |
| `src/lib/domain-labels.js` | `formatJenisKelamin` |
| `src/lib/field-validation.js`, `src/lib/validation.js` | Validasi field oleh repository |
| `src/lib/sheet-schema.js` | Definisi kolom worksheet |

### 7.3 Komponen yang sudah tersedia

| Komponen | Path | Relevansi |
|---|---|---|
| `AdminDataTable` | `src/components/ui/admin-data-table.js` | Daftar sesi, detail kehadiran, rekap |
| `AdminList` | `src/components/ui/admin-list.js` | Daftar kelas dan siswa |
| `StatusBadge` | `src/components/ui/status-badge.js` | Status kelas, absensi, kehadiran |
| `FormatDate` | `src/components/ui/format-date.js` | Tanggal sesi |
| `ClassCapacityLabel` | `src/components/ui/class-capacity-label.js` | Kapasitas kelas |
| `EntitySelect` | `src/components/ui/entity-select.js` | Tidak wajib untuk halaman Pengajar |
| `LinkDetail` | `src/components/ui/link-detail.js` | Link detail |
| `AvatarImage` | `src/components/ui/avatar-image.js` | Foto profil |
| `BackButton` | `src/components/ui/back-button.js` | Tombol batal |
| `EmptyState` | `src/components/ui/empty-state.js` | Dipakai internal `AdminDataTable`/`AdminList` |

### 7.4 Kandidat file baru (belum dibuat)

| Kandidat | Tujuan | Alasan |
|---|---|---|
| `src/services/teacher-scope-service.js` | Helper `getTeacherKelasIds(userId)` dan `assertTeacherOwnsKelas` | Menghindari duplikasi filter kepemilikan di 9 halaman |
| `src/lib/attendance-summary.js` | Agregasi Hadir/Izin/Sakit/Alfa dan persentase | Duplikasi perhitungan saat ini tersebar di banyak halaman |

Kandidat ini hanya usulan. Belum ada persetujuan untuk membuat.

### 7.5 Dokumen yang perlu diperbarui nanti (bukan sekarang)

| File | Alasan |
|---|---|
| `src/docs/PAGE_TRACKER.md` | Beberapa item Pengajar sudah `[x]` padahal masih statis |
| `src/docs/SRS.md` | Bila keputusan field `mata pelajaran` dan status pertemuan diambil |

---

## 8. Perbandingan Admin dan Pengajar

| Fungsi | Halaman Admin | Halaman Pengajar | Perbedaan yang wajib |
|---|---|---|---|
| Daftar kelas | Semua kelas | Hanya `pengajar_id = session.user.id` | Cakupan data |
| Detail kelas | Semua kelas | Hanya kelas milik pengajar | Cakupan data + validasi kepemilikan |
| Daftar absensi | Semua sesi | Hanya sesi kelas milik pengajar | Cakupan data |
| Input absensi | Pilih kelas dari semua kelas | Kelas sudah ditentukan oleh URL dan harus milik pengajar | Cakupan data |
| Edit absensi | Semua absensi | Hanya absensi kelas milik pengajar | Cakupan data |
| Rekap siswa | Semua siswa | Siswa pada kelas milik pengajar | Cakupan data |
| Profil | Profil sendiri | Profil sendiri | Sama |
| Status | `StatusBadge` | Masih teks biasa | Konsistensi tampilan |
| Kapasitas | `ClassCapacityLabel` | Belum dipakai | Konsistensi tampilan |

Yang **tidak boleh** disamakan:
- Admin boleh memilih semua kelas; Pengajar tidak.
- Admin dapat mengelola pengguna dan kelas; Pengajar tidak.
- Pengajar tidak boleh mendapat akses tulis ke data kelas/siswa di luar absensi.

---

## 9. Prioritas implementasi

| Prioritas | Lingkup | File | Alasan |
|---|---|---|---|
| P0 | Fondasi pembatasan data pengajar | Kandidat `src/services/teacher-scope-service.js` | Semua halaman bergantung pada scoping yang benar |
| P0 | Halaman baca tanpa tulis | T01, T03, T04 | Risiko rendah, tidak mengubah data |
| P1 | Halaman baca absensi | T02, T06, T08 | Bergantung pada scoping dan agregasi |
| P2 | Halaman tulis absensi | T05, T07 | Perlu uji simpan, validasi, audit, dan redirect |
| P3 | Laporan | T09 | Agregasi lintas kelas |
| P3 | Konsistensi tampilan | T01–T09 | `StatusBadge`, `AdminDataTable`, `FormatDate` |
| P4 | Verifikasi profil dan layout | T10, T11, T12 | Sudah dinamis; hanya verifikasi |
| P4 | Pembaruan dokumen | `PAGE_TRACKER.md`, `SRS.md` | Dilakukan setelah implementasi disetujui |

Urutan ini menempatkan scoping lebih dulu karena tanpa scoping, integrasi data justru membuka seluruh data ke pengajar.

---

## 10. Risiko dan hal yang perlu diperhatikan

| Risiko | Dampak | Mitigasi yang perlu diputuskan |
|---|---|---|
| Tidak ada pengecekan kepemilikan | Pengajar dapat membuka kelas/absensi pengajar lain lewat URL | Validasi `kelas.pengajar_id` di setiap halaman |
| Layout Pengajar mengizinkan Admin | Admin membuka `/pengajar` dengan `user_id` Admin, sehingga daftar kelas kosong | Putuskan perilaku sebelum implementasi |
| Fallback `kelasData["3"]` | ID salah menampilkan kelas lain | Hapus fallback; gunakan halaman tidak ditemukan |
| Breadcrumb dan link hardcoded | Link menuju kelas/absensi yang salah | Gunakan `kelasId` dan `absensiId` aktual |
| Tombol submit di luar form | Edit absensi tidak dapat disimpan | Bungkus dengan `<form>` |
| Form tanpa action | Input absensi tidak menyimpan apa pun | Tambahkan server action |
| `created_by`/`updated_by` wajib | Penyimpanan gagal bila kosong | Isi dari `session.user.id` |
| Audit log dilakukan di halaman | Bila tidak ditambahkan, perubahan tidak tercatat | Ikuti pola R03/R05 |
| N+1 pembacaan Sheets | Detail absensi memanggil `getSiswaById` per baris | Gunakan `listSiswa()` + Map |
| Field `mata pelajaran` tidak ada | Kolom tidak dapat diisi | Putuskan pemetaan atau hapus kolom |
| Status `Selesai` tidak ada | Label tidak sesuai nilai `final` | Gunakan `StatusBadge` atau sepakati label |
| `PAGE_TRACKER.md` menandai `[x]` | Status pekerjaan menyesatkan | Perbarui setelah implementasi |
| Aturan proyek melarang `<table>` | `AdminDataTable` memakai `<ol>` | Jangan mengganti ke `<table>` |
| Data dinamis Next 16 | Halaman dapat ter-prerender dengan data basi | Pertahankan `connection()` dan `instant = false` |
| Foto statis `pravatar.cc` | Tidak memakai foto pengguna | Gunakan `AvatarImage` + `photo_url` |

---

## 11. Menunggu persetujuan

Audit dan dokumen selesai. Belum ada implementasi.

Yang perlu diputuskan sebelum implementasi:

1. Apakah scoping pengajar dibuat sebagai service baru atau helper di `src/lib`.
2. Apakah Admin yang membuka `/pengajar` diarahkan ke dashboard Admin atau tetap memakai halaman Pengajar.
3. Bagaimana pemetaan kolom `Mata Pelajaran`/`Pelajaran` yang tidak ada di skema.
4. Apakah status pertemuan memakai label `Final` dari `StatusBadge`.
5. Apakah catatan pertemuan disimpan di `absensi.topik` atau `absensi_detail.catatan`.
6. Urutan batch implementasi: P0 saja, atau P0–P1.
