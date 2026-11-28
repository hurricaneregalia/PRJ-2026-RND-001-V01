# Desain Scoping Data Pengajar dan Admin

Status: **keputusan desain final; fondasi batch diimplementasikan, menunggu audit ulang**.

Keenam rekomendasi pada bagian 12 telah disetujui sebagai keputusan desain. Fondasi batch update Pengajar sudah diimplementasikan pada service dan repository yang tercantum di bagian 13.

Dokumen ini adalah analisis lanjutan dari `src/docs/TEACHER_DYNAMIC_DATA_PREPARATION.md`. Tidak ada kode, database, Google Spreadsheet, atau dokumen lain yang diubah.

Sumber kebenaran: kode aktual di `src/auth.js`, `src/app/pengajar`, `src/app/admin` (hanya dibaca), `src/repositories`, `src/services`, dan `src/lib`.

---

## 1. Ringkasan eksekutif

1. Penugasan kelas memakai satu kolom: `kelas.pengajar_id` berisi `users.user_id`.
2. Tidak ada tabel penugasan terpisah dan tidak ada dukungan lebih dari satu pengajar per kelas.
3. Satu-satunya pembeda data pengajar adalah filter `pengajar_id`. Tidak ada mekanisme scoping lain di repository maupun service.
4. Layout Pengajar hanya memeriksa role dan status akun. Layout tidak memeriksa apakah `kelasId` pada URL benar-benar milik pengajar yang login.
5. Layout Pengajar saat ini mengizinkan role `Admin` dan `Pengajar`. Keputusan desain final: Admin tidak boleh mengakses area `/pengajar` sama sekali dan harus diarahkan ke `/admin`.
6. Tidak ada `middleware` yang melakukan scoping.
7. Halaman Admin memang membaca seluruh data tanpa scoping karena Admin adalah pengelola global.
8. Risiko utama: pengajar dapat membuka, dan setelah integrasi juga mengubah, kelas atau absensi pengajar lain hanya dengan mengganti `kelasId`/`absensiId` di URL atau pada payload server action.
9. Rekomendasi utama: satu service otorisasi domain yang dipakai semua halaman dan server action Pengajar, dengan validasi berlapis: sesi, role, kepemilikan kelas, dan konsistensi `absensi.kelas_id`.

---

## 2. Fakta kode: identitas, role, dan sesi

### 2.1 Sumber identitas

| Fakta | Bukti |
|---|---|
| `session.user.id` diisi dari `token.userId` | `src/auth.js:158-163` |
| `token.userId` diisi dari `users.user_id` hasil `findUserByAuthId` | `src/auth.js:124-137` |
| Role dan status akun disimpan di token | `src/auth.js:131-135` |
| Akun nonaktif menghasilkan token kosong | `src/auth.js:127-129` |
| Login diarahkan ke `/dashboard` | `src/app/login/page.js:14` |
| `/dashboard` mengarahkan Admin ke `/admin` dan Pengajar ke `/pengajar` | `src/app/dashboard/page.js:15-21` |

Konsekuensi:

- `session.user.id` adalah `user_id` pada worksheet `users`, bukan `auth_user_id`.
- Perbandingan kepemilikan harus memakai `session.user.id === kelas.pengajar_id`.
- Role pada sesi berasal dari token. Callback `jwt` membaca ulang `users` setiap token dipakai (`src/auth.js:117-137`), sehingga perubahan role/status akun dapat tercermin pada permintaan berikutnya.
- Pengalihan `/dashboard` hanya terjadi setelah login. Akses langsung ke URL tidak melewati pengalihan role.

### 2.2 Guard layout aktual

| Layout | Aturan | Bukti |
|---|---|---|
| Admin | Wajib `role === "Admin"` dan `accountStatus === "active"` | `src/app/admin/layout.js:22-24` |
| Pengajar | Wajib `role` termasuk `["Pengajar", "Admin"]` dan `accountStatus === "active"` | `src/app/pengajar/layout.js:17-19` |

Konsekuensi:

- Admin dapat membuka seluruh route `/pengajar` tanpa pengalihan.
- Pengajar tidak dapat membuka `/admin`.
- Tidak ada layout bersarang di `/pengajar/kelas/[kelasId]` yang memeriksa kepemilikan kelas.
- Tidak ada `middleware` di root proyek.

---

## 3. Model data dan hubungan

### 3.1 Relasi aktual

```text
users (user_id)
  └── kelas.pengajar_id            (1 pengajar : banyak kelas)

kelas (kelas_id)
  ├── kelas_siswa.kelas_id         (1 kelas : banyak keanggotaan)
  ├── jadwal.kelas_id              (1 kelas : banyak jadwal)
  └── absensi.kelas_id             (1 kelas : banyak sesi absensi)

kelas_siswa
  ├── kelas_id  -> kelas
  └── siswa_id  -> siswa

absensi
  ├── kelas_id  -> kelas
  └── created_by -> users.user_id  (pencatat, bukan pemilik kelas)

absensi_detail
  ├── absensi_id -> absensi
  ├── siswa_id   -> siswa
  └── updated_by -> users.user_id
```

Bukti kolom: `src/lib/sheet-schema.js:15-93`.

### 3.2 Fakta penting

| Fakta | Bukti |
|---|---|
| `kelas.pengajar_id` wajib dan bertipe string | `src/repositories/kelas-repository.js:5-11` |
| Tidak ada kolom pengajar di `kelas_siswa` | `src/lib/sheet-schema.js:51-60` |
| Tidak ada tabel penugasan pengajar-kelas | Daftar worksheet `src/lib/sheet-schema.js` |
| Satu siswa hanya boleh punya satu keanggotaan aktif | `src/repositories/kelas-siswa-repository.js:132-162` |
| `listKelasSiswaByKelasId` mengembalikan semua status | `src/repositories/kelas-siswa-repository.js:172-175` |
| `findActiveKelasSiswaBySiswaId` hanya mencari satu aktif | `src/repositories/kelas-siswa-repository.js:176-184` |
| `absensi.created_by` mencatat pembuat sesi | `src/repositories/absensi-repository.js:18`, `src/app/admin/absensi/tambah/page.js:90` |
| `absensi_detail.updated_by` mencatat pengubah detail | `src/repositories/absensi-detail-repository.js:15`, `src/app/admin/absensi/tambah/page.js:107` |

### 3.3 Cara sistem menentukan kelas tanggung jawab pengajar

Satu-satunya definisi yang ada di kode:

```text
kelas.pengajar_id === session.user.id
```

Bukti penggunaan:

- `src/app/admin/users/[userId]/page.js:37` — filter kelas berdasarkan `pengajar_id` dan status aktif.
- `src/app/admin/kelas/page.js:35-39` — hitung kelas aktif per pengajar.
- `src/app/admin/kelas/tambah/page.js:23-36` — hitung sisa limit kelas per pengajar.
- `src/app/admin/page.js:117-121` — hitung kelas aktif per pengajar.

Tidak ada:

- penugasan berbasis jadwal,
- penugasan berbasis `created_by`,
- penugasan berbasis keanggotaan siswa,
- penugasan berbasis tim/co-teacher.

Kesimpulan: kepemilikan kelas bersifat **langsung, tunggal, dan berbasis kolom `kelas.pengajar_id`**.

### 3.4 Batas `limit_kelas`

`users.limit_kelas` hanya dipakai untuk menyaring pilihan pengajar di UI Admin:

- `src/app/admin/kelas/tambah/page.js:28-38`
- `src/app/admin/kelas/[kelasId]/edit/page.js:28-43`

Server action tidak memeriksa ulang limit:

- `src/app/admin/kelas/tambah/page.js:43-49`
- `src/app/admin/kelas/[kelasId]/edit/page.js:54-61`

Konsekuensi: limit kelas bukan aturan otorisasi dan tidak memengaruhi scoping. Ini risiko integritas data, bukan risiko akses pengajar.

---

## 4. Perilaku role Pengajar

### 4.1 Kondisi aktual

| Route | Perilaku sekarang | Setelah integrasi data |
|---|---|---|
| `/pengajar` | Statis | Harus menampilkan kelas milik sendiri |
| `/pengajar/absensi` | Statis | Harus menampilkan sesi kelas milik sendiri |
| `/pengajar/kelas` | Statis | Harus menampilkan kelas milik sendiri |
| `/pengajar/kelas/[kelasId]` | Objek lokal + fallback kelas `"3"` | Harus memvalidasi kepemilikan |
| `/pengajar/kelas/[kelasId]/absensi/tambah` | Statis, tanpa action | Harus memvalidasi kepemilikan sebelum baca dan tulis |
| `/pengajar/kelas/[kelasId]/absensi/[absensiId]` | Statis | Harus memvalidasi kelas dan kecocokan absensi |
| `/pengajar/kelas/[kelasId]/absensi/[absensiId]/edit` | Statis, tanpa action | Harus memvalidasi kepemilikan sebelum update |
| `/pengajar/kelas/[kelasId]/absensi/riwayat` | Statis | Harus memvalidasi kepemilikan |
| `/pengajar/laporan` | Statis | Harus dibatasi ke kelas milik sendiri |
| `/pengajar/profil` | Dinamis, diri sendiri | Tetap |
| `/pengajar/profil/edit` | Dinamis, diri sendiri | Tetap |

### 4.2 Perilaku yang benar untuk Pengajar

Aturan yang direkomendasikan:

1. Pengajar hanya boleh membaca kelas dengan `pengajar_id === session.user.id`.
2. Pengajar hanya boleh membaca sesi absensi yang `absensi.kelas_id` termasuk kelas miliknya.
3. Pengajar hanya boleh menulis absensi pada kelas miliknya.
4. Pengajar tidak boleh menulis data kelas, keanggotaan, siswa, jadwal, atau pengguna.
5. Pengajar hanya boleh mengubah profilnya sendiri.
6. Pengajar tidak boleh melihat data pengajar lain, termasuk melalui agregat laporan.

### 4.3 Perilaku saat ini jika Pengajar mengganti URL

| URL yang dicoba | Perilaku sekarang | Risiko |
|---|---|---|
| `/pengajar/kelas/KLS-0002` (milik pengajar lain) | Halaman statis atau fallback kelas `"3"` | Tidak ada penolakan |
| `/pengajar/kelas/KLS-0002/absensi/tambah` | Form statis | Tidak ada penolakan |
| `/pengajar/kelas/KLS-0002/absensi/ABS-0001` | Detail statis | Tidak ada penolakan |
| `/pengajar/kelas/KLS-0002/absensi/ABS-0001/edit` | Form statis | Tidak ada penolakan |
| `/pengajar/kelas/KLS-0002/absensi/riwayat` | Riwayat statis | Tidak ada penolakan |

Setelah integrasi tanpa guard, semua URL di atas akan menampilkan atau mengubah data nyata milik pengajar lain.

---

## 5. Perilaku role Admin

### 5.1 Fakta aktual

- `/dashboard` mengarahkan Admin ke `/admin` (`src/app/dashboard/page.js:15-17`).
- Layout Pengajar tetap mengizinkan Admin (`src/app/pengajar/layout.js:17`).
- Karena itu, Admin dapat membuka `/pengajar`, `/pengajar/kelas`, `/pengajar/profil`, dan seluruh route Pengajar secara langsung.
- Admin tidak memiliki `kelas.pengajar_id` yang menunjuk ke `user_id` Admin, kecuali ada data kelas yang salah konfigurasi.
- `/pengajar/profil` dan `/pengajar/profil/edit` akan menampilkan dan mengubah profil Admin sendiri, bukan profil pengajar.

### 5.2 Konsekuensi jika Admin dibiarkan masuk tanpa aturan

| Area | Konsekuensi |
|---|---|
| Dashboard Pengajar | Daftar kelas kosong karena tidak ada `kelas.pengajar_id = user_id Admin` |
| Daftar kelas | Kosong |
| Detail kelas | Bergantung pada guard; jika hanya cek role, Admin bisa melihat kelas siapa pun |
| Input absensi | Jika action hanya cek role, Admin dapat menulis dengan `created_by` Admin dari route Pengajar |
| Edit absensi | Sama; audit note dapat berbeda dari route Admin |
| Profil | Admin dapat mengedit profil melalui dua route berbeda |
| Konsistensi audit | Jejak "dari halaman admin" tidak lagi akurat |

Catatan: Admin memang berhak mengelola absensi melalui halaman Admin. Masalahnya bukan privilege Admin, melainkan **jalur ganda dan aturan yang tidak eksplisit**.

### 5.3 Pilihan aturan untuk Admin

#### Pilihan A — Admin dialihkan ke `/admin`

- Admin yang membuka `/pengajar` diarahkan ke `/admin`.
- Perlu perubahan guard layout Pengajar dari `["Pengajar", "Admin"]` menjadi `"Pengajar"`.
- **Kelebihan:** pemisahan role jelas; tidak ada jalur tulis ganda; audit konsisten; implementasi paling sederhana.
- **Kekurangan:** Admin tidak dapat melihat tampilan Pengajar untuk verifikasi; tidak ada mode "lihat sebagai pengajar".
- **Konsekuensi teknis:** seluruh route `/pengajar` hanya untuk role Pengajar. Server action Pengajar dapat menolak role selain Pengajar.

#### Pilihan B — Admin boleh masuk mode baca-saja dengan pemilih pengajar

- Admin membuka `/pengajar?pengajarId=USR-0002`.
- Halaman menampilkan data pengajar tersebut, tetapi seluruh aksi tulis disembunyikan dan ditolak di server action.
- **Kelebihan:** Admin dapat memeriksa tampilan dan data pengajar.
- **Kekurangan:** semua halaman butuh parameter tambahan; semua action butuh penolakan role; UI bertambah; risiko salah scoping lebih tinggi.
- **Konsekuensi teknis:** scoping tidak lagi hanya `session.user.id`, tetapi `pengajarId` yang dipilih Admin. Ini menambah cabang otorisasi di setiap halaman.

#### Pilihan C — Admin diperlakukan sebagai pengajar biasa

- Scoping tetap `session.user.id`.
- **Kelebihan:** tidak ada cabang kode tambahan.
- **Kekurangan:** Admin melihat halaman kosong; membingungkan; tidak berguna.
- **Kesimpulan:** tidak direkomendasikan.

#### Pilihan D — Admin bebas membuka semua kelas lewat route Pengajar

- Guard hanya memeriksa role, bukan kepemilikan.
- **Kelebihan:** Admin dapat melihat semua data.
- **Kekurangan:** duplikasi fungsi Admin; jalur tulis ganda; aturan akses tidak jelas; risiko audit tidak konsisten.
- **Kesimpulan:** tidak direkomendasikan.

### 5.4 Keputusan final

**Pilihan A ditetapkan sebagai keputusan desain.**

- Admin tidak boleh mengakses area `/pengajar` sama sekali.
- Admin hanya menggunakan area `/admin`, karena seluruh fungsi yang dibutuhkan Admin sudah tersedia di sana.
- Jika Admin membuka URL `/pengajar` secara langsung, arahkan ke `/admin`.
- Guard layout Pengajar harus menolak role selain `Pengajar` dan mengarahkan Admin ke `/admin`.
- Pilihan B, C, dan D tidak dipakai.

Alasannya:

- scoping menjadi satu aturan tunggal: pengajar hanya kelas sendiri;
- tidak ada jalur tulis kedua;
- tidak perlu parameter tambahan;
- audit tetap konsisten;
- implementasi paling sederhana dan paling mudah diuji.

---

## 6. Repository dan service yang diperlukan

### 6.1 Repository yang sudah ada

| Repository | Fungsi | Dipakai untuk |
|---|---|---|
| `kelas-repository.js` | `getKelasById`, `listKelas` | Validasi kepemilikan dan daftar kelas |
| `kelas-siswa-repository.js` | `listKelasSiswaByKelasId`, `listKelasSiswa` | Siswa aktif, hitung kapasitas |
| `jadwal-repository.js` | `listJadwalByKelasId`, `listJadwal` | Jadwal kelas |
| `absensi-repository.js` | `getAbsensiById`, `listAbsensiByKelasId`, `listAbsensi`, `createAbsensi`, `updateAbsensi` | Sesi dan tulis sesi |
| `absensi-detail-repository.js` | `listAbsensiDetailByAbsensiId`, `listAbsensiDetail`, `createAbsensiDetail`, `updateAbsensiDetail` | Detail kehadiran |
| `siswa-repository.js` | `listSiswa`, `getSiswaById` | Identitas siswa |
| `user-repository.js` | `getUserById`, `updateUser` | Profil |
| `audit-log-repository.js` | `recordAuditCreate`, `recordAuditUpdate` | Jejak tulis |

Tidak ada repository baru yang dibutuhkan untuk scoping.

### 6.2 Service yang sudah ada

| Service | Relevansi |
|---|---|
| `user-management-service.js` | Hanya koneksi akun Google, bukan otorisasi |
| `class-transfer-service.js` | Perpindahan kelas Admin, bukan scoping Pengajar |
| `sekolah-service.js` | Tidak relevan |

Tidak ada service otorisasi saat ini.

### 6.3 Service baru yang direkomendasikan

Kandidat: `src/services/teacher-scope-service.js`.

Tanggung jawab:

- menjadi satu-satunya tempat aturan kepemilikan kelas;
- tidak melakukan query sendiri selain memanggil repository;
- dipakai halaman dan server action;
- tidak bergantung pada komponen UI.

Kontrak yang direkomendasikan:

```js
// Mengembalikan kelas milik pengajar atau null.
getKelasForPengajar(pengajarId, kelasId)

// Mengembalikan daftar kelas milik pengajar.
listKelasForPengajar(pengajarId, { includeNonaktif = false })

// Mengembalikan absensi hanya jika absensi.kelas_id === kelasId
// dan kelas tersebut milik pengajar.
getAbsensiForPengajar(pengajarId, kelasId, absensiId)

// Mengembalikan himpunan kelas_id milik pengajar.
getKelasIdsForPengajar(pengajarId)
```

Kontrak hasil yang disarankan:

```js
{ status: "ok", data }
{ status: "not_found" }
{ status: "forbidden" }
```

Alasan memakai objek hasil, bukan melempar error:

- halaman dapat membedakan data tidak ada dan akses ditolak;
- server action dapat memilih redirect tanpa memicu error boundary;
- tidak ada pesan internal yang bocor ke pengguna.

### 6.4 Helper tambahan yang direkomendasikan

| Helper | Tujuan |
|---|---|
| `isPengajar(session)` | Memeriksa role dan status akun |
| `requirePengajarSession()` | Mengambil sesi dan mengalihkan ke login bila tidak valid |
| `assertAbsensiBelongsToKelas(absensi, kelasId)` | Mencegah pasangan URL yang tidak cocok |

`requirePengajarSession` tidak boleh menggantikan guard layout; ia hanya memastikan data sesi tersedia di halaman/action.

---

## 7. Risiko akses langsung lewat URL

### 7.1 Matriks serangan

| No | Skenario | Dampak tanpa guard | Validasi yang diperlukan |
|---|---|---|---|
| A1 | `/pengajar/kelas/{kelasLain}` | Melihat detail kelas pengajar lain | `kelas.pengajar_id === session.user.id` |
| A2 | `/pengajar/kelas/{kelasLain}/absensi/riwayat` | Melihat riwayat absensi pengajar lain | Kepemilikan kelas |
| A3 | `/pengajar/kelas/{kelasLain}/absensi/tambah` | Form input absensi kelas orang lain | Kepemilikan kelas sebelum render dan sebelum simpan |
| A4 | `/pengajar/kelas/{kelasLain}/absensi/{absensiLain}` | Melihat detail kehadiran siswa kelas lain | Kepemilikan kelas + kecocokan `absensi.kelas_id` |
| A5 | `/pengajar/kelas/{kelasLain}/absensi/{absensiLain}/edit` | Mengubah absensi kelas lain | Kepemilikan kelas + kecocokan absensi + validasi di action |
| A6 | `/pengajar/kelas/{kelasSendiri}/absensi/{absensiLain}` | Pasangan URL tidak cocok; data absensi lain tampil di kelas sendiri | `absensi.kelas_id === kelasId` |
| A7 | POST server action dengan `kelas_id` palsu | Menulis sesi ke kelas lain | Validasi ulang di action, bukan hanya hidden input |
| A8 | POST server action dengan `absensi_id` palsu | Mengubah detail absensi lain | Validasi ulang di action |
| A9 | POST server action dengan `siswa_id` di luar kelas | Menyisipkan siswa lain ke sesi | Rekomputasi daftar siswa dari `kelas_siswa` aktif di server |
| A10 | POST status di luar `KEHADIRAN_STATUSES` | Data tidak valid | Validasi repository sudah menolak |
| A11 | `/pengajar/laporan` tanpa parameter | Melihat agregat seluruh sekolah | Filter semua agregasi ke `kelasIds` milik pengajar |
| A12 | `/pengajar` setelah kelas dipindahkan ke pengajar lain | Masih melihat kelas lama | Scoping ulang setiap request; jangan cache kepemilikan |

### 7.2 Titik rawan khusus

1. **Server action adalah endpoint.** Validasi di render tidak cukup. Action harus mengulang pemeriksaan sesi, role, kepemilikan kelas, dan kecocokan absensi.
2. **Hidden input dapat diubah.** `kelas_id`, `absensi_id`, dan nama field `status_{siswa_id}` tidak boleh dipercaya.
3. **Daftar siswa harus dihitung ulang di action.** Action Admin saat ini memakai `students` hasil render (`src/app/admin/absensi/tambah/page.js:101`). Untuk halaman Pengajar, daftar siswa sebaiknya diambil ulang dari `kelas_siswa` aktif di dalam action.
4. **Jangan hanya memeriksa `kelasId`.** Harus ada pemeriksaan tambahan `absensi.kelas_id === kelasId`.
5. **Jangan memakai `created_by` sebagai dasar akses.** `created_by` adalah pencatat, bukan pemilik kelas.
6. **Jangan mengandalkan `/dashboard`.** Redirect role hanya berlaku pada alur login, bukan akses URL langsung.

### 7.3 Konsekuensi keputusan akses

| Keputusan | Konsekuensi |
|---|---|
| Akses ditolak dengan halaman 404 | Menyembunyikan keberadaan data; UX kurang informatif; konsisten untuk data sensitif |
| Akses ditolak dengan redirect ke `/pengajar` | UX lebih jelas; tetap tidak menampilkan data; tanpa pesan detail |
| Akses ditolak dengan 403 | Menyatakan data ada tetapi tidak boleh diakses; membocorkan keberadaan |
| Akses ditolak dengan error boundary | Berisiko menampilkan error umum; tidak disarankan untuk kasus otorisasi rutin |

Ketetapan:

- GET halaman: panggil `notFound()`.
- POST server action: jangan menulis apa pun; redirect ke `/pengajar`.
- Admin yang membuka `/pengajar`: redirect ke `/admin`.
- Jangan membedakan "tidak ada" dan "bukan milik Anda" pada respons GET.

---

## 8. Mekanisme validasi kepemilikan yang konsisten

### 8.1 Urutan pemeriksaan wajib

Untuk setiap halaman dan action Pengajar:

```text
1. auth() -> session
2. session.user.id ada dan role === "Pengajar"
3. kelasId dari params
4. kelas = getKelasById(kelasId)
5. kelas ada?
6. kelas.pengajar_id === session.user.id?
7. (khusus absensi) absensi = getAbsensiById(absensiId)
8. absensi ada?
9. absensi.kelas_id === kelasId?
10. baru baca/tulis data
```

Untuk action tulis, langkah 1-9 diulang di dalam action.

### 8.2 Aturan per route

| Route | Validasi |
|---|---|
| `/pengajar` | Filter daftar dengan `pengajar_id` |
| `/pengajar/absensi` | Filter sesi dengan himpunan `kelas_id` milik pengajar |
| `/pengajar/kelas` | Filter daftar dengan `pengajar_id` |
| `/pengajar/kelas/[kelasId]` | Kepemilikan kelas |
| `.../absensi/tambah` | Kepemilikan kelas, sebelum render dan di action |
| `.../absensi/[absensiId]` | Kepemilikan kelas + kecocokan absensi |
| `.../absensi/[absensiId]/edit` | Kepemilikan kelas + kecocokan absensi + validasi action |
| `.../absensi/riwayat` | Kepemilikan kelas |
| `/pengajar/laporan` | Filter agregat dengan himpunan `kelas_id` milik pengajar |
| `/pengajar/profil` | `session.user.id` saja |
| `/pengajar/profil/edit` | `session.user.id` saja + validasi action |

### 8.3 Aturan status kelas

| Kondisi kelas | Baca | Tulis absensi |
|---|---|---|
| `aktif` dan milik pengajar | Boleh | Boleh |
| `nonaktif` dan milik pengajar | Boleh untuk arsip | Tidak boleh |
| Milik pengajar lain | Tolak | Tolak |
| Tidak ada | Tolak | Tolak |

Konsekuensi: kelas nonaktif tidak muncul di daftar aktif, tetapi detail dan riwayatnya tetap dapat dibuka pemilik. Ini menjaga akses arsip tanpa membuka penulisan baru.

### 8.4 Aturan riwayat dan perpindahan kelas

| Kejadian | Rekomendasi | Konsekuensi |
|---|---|---|
| Kelas dipindahkan ke pengajar lain | Akses mengikuti `kelas.pengajar_id` saat ini | Pengajar lama kehilangan akses; pengajar baru melihat seluruh riwayat kelas |
| Sesi dibuat pengajar lama | Tetap terlihat oleh pemilik kelas saat ini | Riwayat kelas utuh; bukan riwayat pribadi pengajar |
| Siswa pindah kelas | Detail sesi lama tetap menampilkan siswa tersebut | Riwayat sesi tidak berubah |
| Siswa nonaktif | Tetap tampil di sesi lama, tidak di daftar siswa aktif | Konsisten dengan data historis |

Alternatif yang ditolak: scoping berdasarkan `absensi.created_by`. Alasan: pemilik kelas baru tidak dapat melihat riwayat kelas yang sekarang menjadi tanggung jawabnya, dan pengajar lama tetap melihat data kelas yang bukan tanggung jawabnya.

### 8.5 Konsistensi implementasi

Aturan yang disarankan:

- Tidak ada pengecekan `kelas.pengajar_id !== session.user.id` yang ditulis ulang di setiap halaman.
- Semua halaman memakai service yang sama.
- Semua action memakai service yang sama.
- Tidak ada pengecualian berdasarkan `created_by`.
- Tidak ada pengecualian berdasarkan `status_keanggotaan` siswa untuk akses kelas.

---

## 9. Aturan akses per role

### 9.1 Matriks final

| Route / aksi | Pengajar | Admin |
|---|---|---|
| `/pengajar` | Kelas sendiri | Dialihkan ke `/admin` |
| `/pengajar/kelas` | Kelas sendiri | Dialihkan ke `/admin` |
| `/pengajar/kelas/[kelasId]` | Hanya milik sendiri | Dialihkan ke `/admin` |
| `/pengajar/kelas/[kelasId]/absensi/*` | Hanya milik sendiri | Dialihkan ke `/admin` |
| `/pengajar/laporan` | Agregat kelas sendiri | Dialihkan ke `/admin` |
| `/pengajar/profil` | Diri sendiri | Dialihkan ke `/admin` |
| `/pengajar/profil/edit` | Diri sendiri | Dialihkan ke `/admin` |
| `/admin/*` | Ditolak | Boleh |

### 9.2 Konsekuensi matriks

| Pilihan | Kelebihan | Kekurangan | Perlu perubahan |
|---|---|---|---|
| Pengajar hanya kelas sendiri; Admin dialihkan | Aturan tunggal, aman, audit jelas | Admin tidak bisa melihat UI Pengajar | Guard layout Pengajar + service scoping |
| Pengajar hanya kelas sendiri; Admin baca-saja | Admin dapat memeriksa | Semua halaman butuh parameter dan cabang role | Guard layout + parameter + penolakan action |
| Pengajar hanya kelas sendiri; Admin bebas | Tidak perlu guard Admin | Duplikasi jalur tulis dan audit | Tidak disarankan |

### 9.3 Keputusan final aturan akses

| No | Keputusan | Aturan final |
|---|---|---|
| 1 | Admin di `/pengajar` | Admin tidak boleh mengakses area `/pengajar` sama sekali; URL langsung diarahkan ke `/admin` |
| 2 | Respons akses ditolak | GET memakai `notFound()`; POST server action tidak menulis dan redirect ke `/pengajar` |
| 3 | Kelas nonaktif | Pemilik boleh membaca arsip; tulis absensi ditolak |
| 4 | Dasar riwayat | Pemilik kelas saat ini (`kelas.pengajar_id`), bukan `created_by` |
| 5 | Lokasi service | `src/services/teacher-scope-service.js` |

Tidak ada pilihan lain yang dipertahankan sebagai alternatif implementasi.

---

## 10. Rencana pengujian scoping

| No | Kasus uji | Harapan |
|---|---|---|
| U1 | Pengajar membuka kelas sendiri | 200 dan data tampil |
| U2 | Pengajar membuka kelas pengajar lain | Ditolak, tanpa data |
| U3 | Pengajar membuka absensi kelas sendiri | 200 |
| U4 | Pengajar membuka absensi kelas lain | Ditolak |
| U5 | Pengajar memakai pasangan `kelasId` sendiri + `absensiId` lain | Ditolak |
| U6 | Pengajar mengirim action tambah dengan `kelas_id` lain | Tidak ada data tertulis |
| U7 | Pengajar mengirim action edit dengan `absensi_id` lain | Tidak ada data berubah |
| U8 | Pengajar mengirim `siswa_id` di luar kelas | Tidak ada detail tertulis |
| U9 | Admin membuka `/pengajar` | Dialihkan ke `/admin` |
| U10 | Pengajar membuka `/admin` | Dialihkan ke `/login` atau ditolak |
| U11 | Pengajar dinonaktifkan saat sesi aktif | Tidak dapat mengakses |
| U12 | Kelas dipindahkan ke pengajar lain | Pengajar lama ditolak, pengajar baru boleh |
| U13 | Pengajar membuka kelas nonaktif miliknya | Baca boleh, tulis ditolak |
| U14 | Pengajar membuka laporan | Hanya agregat kelas sendiri |

Pengujian ini belum ada di `tests/`. Tidak dibuat pada tahap ini.

---

## 11. Prioritas implementasi scoping

| Prioritas | Langkah | Alasan |
|---|---|---|
| P0 | Buat `teacher-scope-service` + unit test | Fondasi semua halaman |
| P0 | Terapkan pada halaman baca: dashboard, kelas, detail kelas | Risiko baca lebih dulu |
| P1 | Terapkan pada absensi baca: daftar, detail, riwayat | Data kehadiran sensitif |
| P2 | Terapkan pada action tulis: tambah dan edit absensi | Validasi ganda di action |
| P3 | Terapkan pada laporan | Agregat lintas kelas |
| P3 | Terapkan guard Admin: tolak `/pengajar`, arahkan ke `/admin` | Menghindari jalur ganda |
| P4 | Perbarui `PAGE_TRACKER.md` dan dokumen terkait | Status pekerjaan |

---

## 12. Keputusan desain final

Keenam keputusan berikut telah disetujui dan ditetapkan sebagai keputusan desain.

### 12.1 Model kepemilikan kelas

- **Keputusan:** `kelas.pengajar_id === session.user.id`.
- **Dasar:** `kelas.pengajar_id` adalah satu-satunya kolom penugasan pengajar pada skema.
- **Konsekuensi:** satu kelas satu pemilik; perpindahan pengajar langsung memindahkan akses; tidak ada field baru.
- **Konsistensi:** `session.user.id` sudah dipetakan ke `users.user_id` oleh `src/auth.js`.

### 12.2 Dasar akses riwayat absensi

- **Keputusan:** pemilik kelas saat ini, bukan `absensi.created_by`.
- **Dasar:** `created_by` adalah pencatat, termasuk Admin yang menginput absensi.
- **Konsekuensi:** pengajar baru melihat seluruh riwayat kelas; pengajar lama kehilangan akses setelah kelas dipindahkan.
- **Konsistensi:** memakai `absensi.kelas_id` dan `kelas.pengajar_id`; tidak ada field baru.

### 12.3 Perlakuan Admin di `/pengajar`

- **Keputusan:** Admin tidak boleh mengakses area `/pengajar` sama sekali.
- **Perilaku:** URL `/pengajar` yang dibuka Admin diarahkan ke `/admin`.
- **Dasar:** seluruh fungsi yang dibutuhkan Admin sudah tersedia di area `/admin`.
- **Konsekuensi:** tidak ada jalur tulis kedua; audit konsisten; Admin tidak dapat melihat UI Pengajar.
- **Konsistensi:** mengubah guard layout Pengajar agar hanya menerima role `Pengajar`; layout Admin tetap khusus `Admin`.

### 12.4 Respons akses ditolak

- **Keputusan:** GET memakai `notFound()`; POST server action tidak menulis dan redirect ke `/pengajar`.
- **Dasar:** respons tidak boleh membocorkan keberadaan kelas atau absensi milik pengajar lain.
- **Konsekuensi:** pengguna yang salah URL melihat halaman not found; tidak ada pesan yang membedakan "tidak ada" dan "bukan milik Anda".
- **Konsistensi:** `app/not-found.js` sudah tersedia; server action tidak merender halaman.

### 12.5 Lokasi service scoping

- **Keputusan:** `src/services/teacher-scope-service.js`.
- **Dasar:** aturan ini menggabungkan `kelas` dan `absensi`, sehingga termasuk aturan domain, bukan util murni.
- **Konsekuensi:** halaman dan server action memakai service yang sama; repository tetap murni akses data.
- **Konsistensi:** mengikuti pola `src/services/class-transfer-service.js` dan `user-management-service.js`.

### 12.6 Perlakuan kelas nonaktif

- **Keputusan:** pemilik boleh membaca arsip; tulis absensi ditolak.
- **Dasar:** `kelas.status_kelas` sudah tersedia; menonaktifkan kelas berarti menutup penulisan baru, bukan menghapus riwayat.
- **Konsekuensi:** kelas nonaktif tidak muncul di daftar aktif; detail dan riwayat tetap dapat dibuka pemilik; koreksi absensi harus melalui Admin dengan mengaktifkan kelas terlebih dahulu.
- **Konsistensi:** Admin hanya menampilkan kelas aktif pada pilihan input absensi; tidak ada field baru.

### 12.7 Ringkasan

| No | Keputusan | Ketetapan |
|---|---|---|
| 1 | Model kepemilikan | `kelas.pengajar_id === session.user.id` |
| 2 | Dasar riwayat | Pemilik kelas saat ini |
| 3 | Admin di `/pengajar` | Tidak boleh akses; redirect ke `/admin` |
| 4 | Respons ditolak | GET `notFound()`; POST redirect ke `/pengajar` |
| 5 | Lokasi service | `src/services/teacher-scope-service.js` |
| 6 | Kelas nonaktif | Baca boleh; tulis ditolak |

### 12.8 Konsistensi dengan skema dan arsitektur

| Kebutuhan | Sumber yang dipakai | Status |
|---|---|---|
| Identitas pengajar | `session.user.id` → `users.user_id` | Tersedia |
| Role | `users.role` melalui token | Tersedia |
| Status akun | `users.account_status` melalui token | Tersedia |
| Kepemilikan kelas | `kelas.pengajar_id` | Tersedia |
| Status kelas | `kelas.status_kelas` | Tersedia |
| Sesi absensi | `absensi.absensi_id`, `absensi.kelas_id` | Tersedia |
| Status sesi | `absensi.status_absensi` | Tersedia |
| Pencatat sesi | `absensi.created_by` | Tersedia, hanya metadata |
| Keanggotaan aktif | `kelas_siswa.status_keanggotaan` | Tersedia |
| Detail kehadiran | `absensi_detail.absensi_id`, `absensi_detail.siswa_id` | Tersedia |
| Guard halaman | Layout + service | Arsitektur saat ini |
| Server action | Validasi ulang di action | Arsitektur Next 16 |
| Repository | Tetap murni akses data | Arsitektur saat ini |

Tidak ada field baru, tabel baru, dependency baru, atau perubahan database/Spreadsheet dalam keputusan ini.

---

## 13. Status implementasi

Bagian 1-12 adalah keputusan desain. Fondasi batch update Pengajar berada di `src/repositories/attendance-batch-repository.js` dan `src/services/teacher-absensi-batch-service.js`. Halaman edit Pengajar dan alur Admin tidak diubah oleh fondasi ini.

---

## 14. Batasan fondasi batch update Pengajar

### 14.1 Lock bersama

`withAttendanceBatchLock` adalah satu lock dalam satu proses Node. Lock ini mengoordinasikan pemanggil batch Pengajar saja. Tidak ada lock lintas instance, worker, atau serverless. Dua instance yang memproses `operationId` sama tetap dapat membaca baseline yang sama dan mengirim dua `values.batchUpdate`.

### 14.2 Konflik dengan alur Admin

Admin tetap memakai `updateAbsensi()` dan `updateAbsensiDetail()` dengan lock per tabel. Admin tidak mengambil lock batch. Urutan batch adalah `baselineRead`, validasi, `guardRead`, lalu `updateRanges`.

`guardRead` membandingkan header, `rowNumber → id`, nilai baris yang disasar, dan tail `audit_log`. Perubahan yang terlihat sebelum pengiriman membatalkan operasi. Jika Admin menulis setelah `guardRead` tetapi sebelum API menerima request, perubahan Admin dapat tertimpa; `values.batchUpdate` tidak memiliki compare-and-set. Read-back setelah penulisan hanya melaporkan ketidaksesuaian, tidak membatalkan tulisan atau audit. Tidak ada koreksi otomatis saat konflik.

### 14.3 Idempotensi dan verifikasi

`already_applied` hanya dikembalikan jika audit lengkap untuk seluruh `operationId`, metadata audit cocok, setiap nilai `data_sesudah` sama dengan nilai yang diharapkan memakai `sameValue`, dan data saat ini sama dengan `nextRecords`. Audit sebagian, nilai `data_sesudah` beda, metadata beda, atau data tidak cocok menghasilkan `conflict`.

Operasi tanpa perubahan menghasilkan `status: 'ok'`, `unchanged: true`, dan `reason: 'no_changes_requested'`. Penanda ini membedakan kondisi tersebut dari `already_applied`, yang mensyaratkan bukti audit. Tidak ada penulisan dan tidak ada audit baru untuk operasi tanpa perubahan.

`operationId`, `operationTimestamp`, `audit_id`, range, dan values dipertahankan saat retry. Jika `commitAttendanceBatch` gagal dengan `SheetOperationError`, read-back dilakukan lebih dulu dan state hasil baca itu dipakai sebagai retry-guard. Retry hanya terjadi jika audit tidak ditemukan dan data belum berubah. Retry maksimal satu kali. Error deterministik tidak memicu retry.

### 14.4 Tidak diverifikasi

Tes mock membuktikan kontrak, urutan panggilan, dan payload. Tes mock tidak membuktikan atomisitas Google Sheets. Tes integrasi Google Sheets bersifat opt-in (`RUN_SHEETS_INTEGRATION=1`), menolak worksheet target yang sudah berisi data, dan tidak mensimulasikan kehilangan jaringan setelah API menerima request, konkurensi lintas instance, atau penulisan Admin di jendela `guardRead` → API. Skenario authenticated di browser belum diverifikasi.

### 14.5 Perbaikan temuan audit fondasi

- Identitas Pengajar dibaca dari `auth()` → `session.user.id`; `@/auth` dimuat saat pemanggilan, bukan saat modul service diimpor. Argumen `userId` tidak dipakai. Service menolak sesi tanpa id Pengajar aktif, role selain `Pengajar`, `accountStatus` selain `active`, dan `bootstrapPending: true`. Server action tetap melakukan pemeriksaan sesinya sendiri. Tidak ada import cycle dari `@/auth` ke service ini.
- `verifyCommitted` membandingkan metadata audit, setiap nilai `data_sesudah` dengan `nextRecords` memakai `sameValue`, seluruh `nextRecords` dengan data saat ini, dan himpunan id detail. `already_applied`, `conflict`, dan `no_changes_requested` tidak disamakan.
- `auditIds` harus berupa objek atau `undefined`. Kunci harus merupakan salah satu kunci `${operationId}:absensi:` atau `${operationId}:detail:` yang dihasilkan service. Nilai divalidasi dengan `assertRecordId` dan tidak boleh duplikat. Input tidak valid menghasilkan `invalid`, bukan `TypeError`.
- `readBatchState` tidak lagi memanggil `assertWorksheetHeader` secara terpisah; `readWorksheetRecords` sudah memeriksa header dalam satu baca. `baselineRead`, `guardRead`, retry-guard, dan read-back akhir tetap dipertahankan; state hasil read-back sebelum retry dipakai sebagai retry-guard sehingga tidak ada baca tambahan.
- Retry hanya untuk `SheetOperationError`, maksimal satu kali, dengan payload identik. `ValidationError`, `ConflictError`, `DataIntegrityError`, dan `SheetHeaderError` tidak memicu retry.
