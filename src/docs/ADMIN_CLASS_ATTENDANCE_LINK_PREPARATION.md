# Persiapan Link Halaman Input Absensi dari Halaman Detail Kelas

## 1. Kondisi implementasi saat ini

### Halaman detail kelas

File: `src/app/admin/kelas/[kelasId]/page.js`

- Membaca `kelasId` dari `params`.
- Membaca kelas via `getKelasById(kelasId)`.
- Menampilkan info kelas, kapasitas, status, daftar siswa.
- Sudah punya link edit, pindah kelas, tambah siswa.
- **Belum punya link/menu ke halaman input absensi.**

### Halaman input absensi

File: `src/app/admin/absensi/tambah/page.js`

- Membaca `searchParams` via `const params = await searchParams;`.
- Saat ini membaca parameter:

```js
const selectedKelasId =
  typeof params?.kelasId === "string" ? params.kelasId : "";
```

- Membaca daftar kelas aktif dari `listKelas()`.
- Membaca daftar siswa aktif dari `listKelasSiswaByKelasId(selectedKelas.kelas_id)`.
- Menampilkan daftar siswa aktif dan form simpan absensi.
- Manual selection tetap ada lewat `<select id="kelasId" name="kelasId">`.

### Perbedaan parameter

- Saat ini: `params?.kelasId`.
- Diminta: `kelas_id`.
- Keduanya berbeda secara literal, sehingga URL target `http://localhost:3000/admin/absensi/tambah?kelas_id=KLS-0001` saat ini tidak akan memicu preselect.

## 2. Alur navigasi dan pembacaan parameter yang direkomendasikan

1. Admin buka halaman detail kelas: `/admin/kelas/KLS-0001`.
2. Klik link baru ke input absensi.
3. Link mengarah ke: `/admin/absensi/tambah?kelas_id=KLS-0001`.
4. Halaman input absensi membaca `params?.kelas_id`.
5. Jika valid, set `selectedKelasId` ke ID kelas.
6. Tampilkan kelas terpilih dan daftar siswa aktif.
7. Admin tetap bisa manual pilih kelas lewat dropdown; perilaku lama tetap berfungsi.

## 3. File yang perlu diubah dan tujuan perubahan

### 1. `src/app/admin/kelas/[kelasId]/page.js`

Tujuan: menambahkan link input absensi.

Contoh target:

```tsx
<Link href={`/admin/absensi/tambah?kelas_id=${kelas.kelas_id}`}>
  Input Absensi
</Link>
```

### 2. `src/app/admin/absensi/tambah/page.js`

Tujuan: membaca parameter `kelas_id` dan memilih kelas.

Kebutuhan perubahan:

```js
const selectedKelasId =
  typeof params?.kelas_id === "string"
    ? params.kelas_id
    : typeof params?.kelasId === "string"
      ? params.kelasId
      : "";
```

Penjelasan:
- `kelas_id` diprioritaskan untuk deep link dari detail kelas.
- `kelasId` dipakai sebagai fallback agar perilaku lama/manual selection tetap tidak rusak.

## 4. Langkah implementasi

1. Tambahkan link dari detail kelas ke input absensi.
2. Ubah pembacaan parameter di halaman input absensi.
3. Pastikan empty state tetap: jika ID tidak valid/tidak ada kelas aktif, halaman menampilkan pilihan manual/empty state.
4. Tidak mengubah alur penyimpanan absensi, skema, atau data.

## 5. Skenario pengujian

1. Buka `/admin/kelas/KLS-0001`.
2. Klik link "Input Absensi".
3. Harus sampai di `/admin/absensi/tambah?kelas_id=KLS-0001`.
4. Kelas terpilih otomatis.
5. Daftar siswa aktif sesuai kelas terpilih tampil.
6. Buka `/admin/absensi/tambah?kelasId=KLS-0001`; fallback tetap bekerja.
7. Buka `/admin/absensi/tambah` tanpa parameter; manual selection tetap berfungsi.
8. Buka dengan ID kelas tidak valid; tampilkan kondisi kelas tidak tersedia.

## 6. Hal yang belum dapat dipastikan atau perlu saya putuskan

1. Apakah `kelas_id` cukup diprioritaskan, atau parameter harus diubah semua menjadi `kelas_id` (termasuk nama field form)?
2. Apakah link dari detail kelas cukup ditambahkan di area aksi kelas, atau ingin tombol khusus?
3. Apakah untuk ID kelas yang tidak valid harus menampilkan pesan error eksplisit atau hanya state kosong.

## 7. Ringkasan

- Halaman input absensi untuk kelas sudah tersedia.
- Detail kelas saat ini belum punya link ke input absensi.
- Input absensi saat ini membaca `kelasId`, bukan `kelas_id`.
- Perubahan yang direkomendasikan: tambah link detail kelas ke `/admin/absensi/tambah?kelas_id=...`, lalu tambah pembacaan `kelas_id` di input absensi.
- Dokumen persiapan: `src/docs/ADMIN_CLASS_ATTENDANCE_LINK_PREPARATION.md`.
