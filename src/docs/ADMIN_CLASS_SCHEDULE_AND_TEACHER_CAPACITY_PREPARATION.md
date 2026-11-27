# Persiapan Pengelolaan Jadwal, Kelas, dan Kapasitas Pengajar

Dokumen ini menyusun kondisi implementasi, aturan yang terbukti, rencana perubahan, alur data, dan skenario pengujian untuk tiga kebutuhan:

1. Halaman tambah jadwal.
2. Link tambah kelas pada detail pengguna pengajar.
3. Penyembunyian informasi kapasitas kelas untuk Admin.
4. Integrasi parameter `user_id` pada halaman tambah kelas.

## A. Kondisi implementasi saat ini

### 1. Halaman tambah jadwal

File: `src/app/admin/jadwal/tambah/page.js`

- Membaca daftar kelas dan jadwal.
- Membuat `scheduledKelasIds` dari `listJadwal()`.
- Membuat `availableKelas` dari kelas aktif yang `kelas_id` belum ada di `jadwal`.
- Saat ini, form tetap dirender. Kotak info “semua kelas sudah memiliki jadwal” dan link ke `/admin/kelas/tambah` **belum ada**.
- Submit menggunakan server action `simpanJadwal` dengan `createJadwal`.
- Validasi repository jadwal memeriksa field wajib dan rentang jam, tetapi tidak ditemukan aturan pemilikan satu jadwal per kelas.

### 2. Detail pengguna pengajar

File: `src/app/admin/users/[userId]/page.js`

- Saat ini sudah membaca kelas pengajar aktif berdasarkan `user.user_id`.
- Sudah menghitung jumlah kelas aktif, membership aktif, dan siswa aktif.
- Informasi kapasitas (`Limit Kelas`, `Kelas Aktif`, `Sisa Kuota Kelas`, `Status Kelas`) ditampilkan untuk akun yang sudah ada, tetapi **belum terstruktur khusus hanya untuk role Pengajar**.
- Belum ada link tambah kelas pada halaman detail pengguna.
- Halaman ini belum membaca parameter `user_id` karena fungsinya detail user, bukan tambah kelas.

### 3. Halaman tambah kelas

File: `src/app/admin/kelas/tambah/page.js`

- Membaca semua user dan kelas.
- Menghitung `activeCountByTeacher` dari kelas aktif.
- Membuat `availableTeachers` dari user dengan role `Pengajar`, `limit_kelas > 0`, dan `active < limit`.
- Saat ini tidak membaca parameter search `user_id`.
- Form memakai `<select id="pengajar_id" name="pengajar_id">` dan opsi hanya dari `availableTeachers`.
- Kapasitas kelas disimpan melalui `kapasitas` pada `kelas`.

### 4. Halaman detail kelas

File: `src/app/admin/kelas/[kelasId]/page.js`

- Sudah menampilkan data kelas, pengajar, kapasitas, jadwal, status, dan siswa aktif.
- Sudah menambahkan link ke input absensi:
  `/admin/absensi/tambah?kelas_id=${kelas.kelas_id}`.

## B. Aturan bisnis yang sudah terbukti tersedia

- Pengajar memiliki `limit_kelas` pada tabel `users`.
- Kelas dimiliki oleh pengajar melalui `kelas.pengajar_id` menunjuk ke `users.user_id`.
- Kelas aktif ditandai `status_kelas: "aktif"`.
- Siswa aktif dalam kelas ditandai `kelas_siswa.status_keanggotaan: "aktif"`.
- Siswa aktif ditandai `siswa.status: "aktif"`.
- Kapasitas pengajar diputuskan dari jumlah kelas aktif dibandingkan `limit_kelas`.
- Tambah kelas hanya menampilkan pengajar dengan `limit_kelas > 0` dan jumlah kelas aktif kurang dari limit.

## C. Aturan bisnis yang belum jelas dan perlu konfirmasi

1. Apakah satu kelas boleh memiliki lebih dari satu jadwal? Saat ini tidak ada aturan pemilikan satu jadwal per kelas yang terbukti.
2. Apakah kapasitas kelas (`kapasitas`) dibatasi oleh kapasitas pengajar (`limit_kelas`) atau independen?
3. Apakah link tambah kelas harus tampil untuk pengajar yang belum punya kelas tetapi masih punya kuota, atau hanya untuk pengajar yang sudah punya kelas?
4. Apakah informasi kapasitas harus disembunyikan untuk Admin karena Admin tidak memiliki kuota kelas, atau karena Admin tidak berperan sebagai pengajar?
5. Apakah parameter `user_id` harus memilih pengajar yang sudah tersedia (`availableTeachers`) atau langsung memilih berdasarkan ID setelah validasi role dan kuota.

## D. Rencana perubahan untuk kebutuhan di atas

### 1. Tambah jadwal

Jika `availableKelas.length === 0`:

- Jangan render form.
- Tampilkan: “Semua kelas sudah memiliki jadwal.”
- Tampilkan link ke: `/admin/kelas/tambah`.

Jika `availableKelas.length > 0`:

- Render form seperti sekarang.

### 2. Link tambah kelas pada detail pengguna pengajar

- Pada halaman detail user, untuk `user.role === "Pengajar"`.
- Tampilkan link jika `user.limit_kelas > 0` dan `kelasPengajar.length < user.limit_kelas`.
- Link target: `/admin/kelas/tambah?user_id=${user.user_id}`.
- Nilai `user_id` berasal dari data user aktif, bukan hardcoded.

### 3. Sembunyikan informasi kapasitas untuk Admin

- Render blok informasi kapasitas hanya jika `user.role === "Pengajar"`.

### 4. Integrasi parameter `user_id` pada tambah kelas

- Baca `searchParams`.
- Jika `user_id` tersedia, validasi ke pengajar.
- Jika valid dan tersedia, pilih pengajar tersebut.
- Jika tidak valid/tidak pengajar/tidak tersedia, jangan memilih secara sembarangan.

## E. Alur data dan navigasi

- Detail user pengajar → baca kelas aktif → hitung kuota → tampilkan/sembunyikan info → link tambah kelas.
- Halaman tambah kelas → baca `user_id` → validasi → pilih pengajar → simpan kelas.
- Halaman tambah jadwal → baca kelas dan jadwal → tentukan kelas tanpa jadwal → render form atau info.

## F. Daftar file yang diperkirakan perlu diubah

1. `src/app/admin/jadwal/tambah/page.js`
   - Tujuan: tampilkan info/link jika tidak ada kelas tanpa jadwal.
2. `src/app/admin/users/[userId]/page.js`
   - Tujuan: tambah link tambah kelas untuk pengajar berkuota; sembunyikan info kapasitas untuk Admin.
3. `src/app/admin/kelas/tambah/page.js`
   - Tujuan: baca parameter `user_id` dan preselect pengajar valid.

## G. Skenario pengujian

1. Semua kelas sudah memiliki jadwal.
   - URL: `/admin/jadwal/tambah`.
   - Harus tampil info, bukan form.
2. Masih ada kelas yang belum memiliki jadwal.
   - URL: `/admin/jadwal/tambah`.
   - Harus tampil form.
3. Pengajar memiliki kapasitas lebih dari 0.
   - Detail user pengajar.
   - Link tambah kelas harus tampil jika kuota tersisa.
4. Pengajar memiliki kapasitas 0.
   - Tidak tampil link/opsi tambah kelas.
5. Kapasitas pengajar sudah penuh.
   - Tidak tampil link/opsi tambah kelas.
6. Detail user dengan role Admin.
   - Informasi kapasitas tidak ditampilkan.
7. Detail user dengan role Pengajar.
   - Informasi kapasitas ditampilkan.
8. URL tambah kelas dengan `user_id`.
   - `/admin/kelas/tambah?user_id=USR-0005`.
9. URL tambah kelas tanpa `user_id`.
   - Perilaku manual selection tetap berjalan.
10. Parameter `user_id` tidak valid atau bukan pengajar.
    - Tidak memilih secara sembarangan.

## H. Hal yang perlu diputuskan sebelum implementasi

1. Apakah halaman tambah jadwal harus menampilkan link ke halaman tambah kelas, atau tautan lain.
2. Apakah link tambah kelas wajib ada untuk pengajar tanpa kelas aktif tetapi masih punya kuota.
3. Apakah informasi kapasitas harus disembunyikan untuk semua akun non-pengajar.
4. Apakah parameter `user_id` harus berfungsi sebagai deep link khusus atau harus dipakai juga untuk validasi kuota.

## Ringkasan

- Halaman tambah jadwal sudah mendekati kebutuhan, tetapi belum menampilkan state “semua kelas sudah memiliki jadwal”.
- Detail pengguna pengajar belum punya link tambah kelas.
- Informasi kapasitas belum disembunyikan secara bersih berdasarkan role.
- Halaman tambah kelas belum membaca parameter `user_id`.
- Dokumen persiapan: `src/docs/ADMIN_CLASS_SCHEDULE_AND_TEACHER_CAPACITY_PREPARATION.md`.
