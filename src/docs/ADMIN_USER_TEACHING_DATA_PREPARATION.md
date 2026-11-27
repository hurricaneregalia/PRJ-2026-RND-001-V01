# Persiapan Data Pengajaran pada Detail Pengguna `/admin/users/[userId]`

## A. Kondisi halaman saat ini

Halaman target: `src/app/admin/users/[userId]/page.js`.

Bukti implementasi:
- `params.userId` dibaca, lalu `getUserById(userId)` (`src/repositories/user-repository.js`).
- Jika user tidak ditemukan, tampil "Pengguna tidak ditemukan".
- Data yang ditampilkan saat ini: `user_id`, `name`, `email`, `role`, `account_status`, `no_hp`, `limit_kelas`.
- Tidak ada pembacaan kelas, `kelas_siswa`, atau siswa.
- `connection()` dan `instant = false` sudah ada.
- Halaman berada di bawah `src/app/admin/layout.js`, yang sudah memaksa sesi Admin aktif sebelum render.

Contoh aktual yang dapat diverifikasi: `USR-0002` = Ela Nerla, role `Pengajar`, status `active` (dari `/admin/users/USR-0002`). Kode halaman tidak memeriksa role sebelum menampilkan data umum.

## B. Struktur relasi data yang ditemukan

### 1. Pengguna
- Sumber: tabel `users`, repository `src/repositories/user-repository.js`.
- Kolom relevan: `user_id`, `name`, `role`, `account_status`, `no_hp`, `limit_kelas`.
- Identitas pengajar = `users.user_id` (dipakai sebagai `pengajar_id` di tabel `kelas`).

### 2. Kelas
- Sumber: tabel `kelas`, repository `src/repositories/kelas-repository.js`.
- Kolom relevan: `kelas_id`, `kode_kelas`, `nama_kelas`, `pengajar_id`, `kapasitas`, `status_kelas`.
- Relasi: `kelas.pengajar_id` mengacu ke `users.user_id`.
- Tidak ada helper `listKelasByPengajarId`; harus filter hasil `listKelas()`.
- Status kelas: `aktif` / `nonaktif`; `deleteMode` soft delete ke `nonaktif`.

### 3. Keanggotaan siswa-kelas
- Sumber: tabel `kelas_siswa`, repository `src/repositories/kelas-siswa-repository.js`.
- Kolom relevan: `kelas_siswa_id`, `kelas_id`, `siswa_id`, `status_keanggotaan`, `tanggal_mulai`, `tanggal_selesai`.
- Relasi: `kelas_siswa.kelas_id` mengacu ke `kelas.kelas_id`; `kelas_siswa.siswa_id` mengacu ke `siswa.siswa_id`.
- Status keanggotaan: `pending`, `aktif`, `selesai`, `dibatalkan`.
- Helper tersedia: `listKelasSiswaByKelasId(kelasId)`.

### 4. Siswa
- Sumber: tabel `siswa`, repository `src/repositories/siswa-repository.js`.
- Kolom relevan: `siswa_id`, `nama`, `nis`, `jenis_kelamin`, `status`.
- Tidak ada relasi langsung pengajar-siswa; relasi hanya lewat `kelas` + `kelas_siswa`.

### 5. Bukti aliran data
- `src/app/admin/kelas/[kelasId]/page.js` sudah memakai pola yang sama:
  - `getKelasById(kelasId)`
  - `listKelasSiswaByKelasId(kelas.kelas_id)`
  - `listSiswa()` lalu `Map` by `siswa_id`
  - filter `status_keanggotaan === "aktif"`
- Ini bukti bahwa data kelas, keanggotaan, dan siswa dapat dibaca dengan repository yang ada.

## C. Data yang dapat ditampilkan dan sumbernya

### Kelas milik pengajar
Sumber: `listKelas()` filter `pengajar_id === userId`.
Kolom yang dapat ditampilkan:
- `kelas_id`
- `kode_kelas`
- `nama_kelas`
- `kapasitas`
- `status_kelas`
- opsional: jadwal dari `listJadwalByKelasId` (`hari`, `jam_mulai`, `jam_selesai`) jika ingin melengkapi.

### Siswa yang diajar
Sumber: `listKelasSiswa()` filter `kelas_id` milik pengajar + `status_keanggotaan === "aktif"`, lalu join ke `listSiswa()` by `siswa_id`.
Kolom yang dapat ditampilkan:
- `siswa_id`
- `nama`
- `nis`
- `jenis_kelamin`
- `status`
- kelas asal (`kelas_id` / `nama_kelas`)

### Pencegahan duplikasi
- Kelas unik berdasarkan `kelas_id`.
- Siswa aktif hanya boleh punya satu keanggotaan `aktif` (dijaga `validateRecords` di `kelas-siswa-repository.js`: `activeBySiswa`), sehingga siswa tidak muncul ganda pada status aktif.
- Untuk tampilan per kelas, gunakan `Map`/`Set` berdasarkan `kelas_id` dan `siswa_id`.

## D. Yang sudah tersedia dan yang masih perlu diubah

Sudah tersedia:
- `getUserById`
- `listKelas`
- `listKelasSiswa` dan `listKelasSiswaByKelasId`
- `listSiswa`
- `listJadwalByKelasId` (opsional)
- pola join dan filter di `src/app/admin/kelas/[kelasId]/page.js`

Masih perlu diubah (belum dilakukan):
- Halaman `src/app/admin/users/[userId]/page.js` belum membaca kelas/siswa.
- Belum ada filter role pengajar.
- Belum ada penanganan kelas kosong / siswa kosong.
- Belum ada pengelompokan siswa per kelas.

Tidak perlu repository/service baru.

## E. Rencana implementasi berurutan

1. Baca `user` dengan `getUserById(userId)` seperti sekarang.
2. Jika `user` tidak ditemukan, tampilkan state not-found yang sudah ada.
3. Jika `user.role !== "Pengajar"`:
   - tampilkan data pengguna umum saja, atau
   - tampilkan pesan "Pengguna ini bukan pengajar" untuk bagian pengajaran.
4. Jika pengajar:
   - `kelasPengajar = listKelas().filter(item => item.pengajar_id === user.user_id)`.
   - `kelasIds = new Set(kelasPengajar.map(item => item.kelas_id))`.
   - `memberships = listKelasSiswa().filter(item => kelasIds.has(item.kelas_id) && item.status_keanggotaan === "aktif")`.
   - `siswaList = listSiswa()`, buat `Map` by `siswa_id`.
   - Kelompokkan memberships by `kelas_id` untuk tampilan per kelas.
5. Render:
   - section "Kelas yang Diajar"
   - section "Siswa yang Diajar" atau siswa per kelas
   - empty state jika tidak ada kelas/siswa.
6. Pertahankan `connection()` dan `instant = false`.

## F. Daftar file yang diperkirakan perlu diubah

- `src/app/admin/users/[userId]/page.js`
  - tujuan: tambah pembacaan kelas, keanggotaan, dan siswa; tampilkan daftar; handle empty state dan role non-pengajar.

Tidak perlu ubah:
- `src/repositories/user-repository.js`
- `src/repositories/kelas-repository.js`
- `src/repositories/kelas-siswa-repository.js`
- `src/repositories/siswa-repository.js`
- `src/lib/sheet-schema.js`

## G. Hal yang belum dapat dipastikan dan perlu diputuskan

1. Apakah kelas `nonaktif` tetap ditampilkan sebagai riwayat pengajaran, atau hanya kelas `aktif`?
2. Apakah siswa dengan status `nonaktif` tetap ditampilkan jika membership-nya `aktif`?
3. Apakah keanggotaan `pending`, `selesai`, `dibatalkan` perlu ditampilkan sebagai riwayat, atau hanya `aktif`?
4. Apakah tampilan siswa digabung semua kelas, atau dikelompokkan per kelas?
5. Apakah jadwal (`hari`, `jam`) ikut ditampilkan per kelas?
6. Apakah perlu membatasi akses detail pengguna berdasarkan role pengguna yang dibuka? Saat ini halaman bisa dibuka untuk semua user oleh Admin.

Rekomendasi saya: tampilkan hanya kelas `aktif` dan membership `aktif`, siswa `aktif`, dikelompokkan per kelas, tanpa jadwal pada tahap pertama. Menunggu persetujuan sebelum implementasi.
