# Persiapan UI Pengelolaan Informasi Sekolah

Status: **disetujui dan diimplementasikan** pada 2026-11-27.
Perubahan kode, header worksheet `sekolah`, dan aset logo sudah diterapkan. Baris data sekolah masih kosong dan tidak diisi.

Sumber kebenaran: kode aktual di `src/` dan pembacaan read-only worksheet `sekolah` pada Google Spreadsheet.

---

## 1. Ringkasan eksekutif

- Nama tabel yang dipakai sudah benar: **`sekolah`**. Tidak ada referensi aktif ke `School_Information`.
- Header worksheet `sekolah` saat ini **6 kolom** dan **tidak memiliki** `logo` serta `email`.
- Tabel `sekolah` saat ini **kosong**: tidak ada baris data.
- Repository `sekolah` sudah tersedia di `src/repositories/sekolah-repository.js`, tetapi field descriptor baru mencakup `nama_sekolah`, `alamat`, dan `no_hp`.
- Halaman `/sekolah` bersifat read-only untuk publik, Admin, dan Pengajar. Tidak ada tombol tambah/edit di halaman ini.
- Form tambah/edit hanya tersedia dan hanya bisa dijalankan Admin.
- Validator URL sudah ditambahkan dan menerima `http`/`https` serta path lokal `/...`.
- Logo default memakai aset lokal `public/images/logo-sekolah.svg`.
- `assertHeaderMatches` mewajibkan jumlah, nama, dan urutan header **persis sama** antara `WORKSHEET_SCHEMAS.sekolah` dan worksheet `sekolah`. Perubahan schema dan header sheet harus dilakukan bersamaan, setelah persetujuan.
- Lokasi halaman yang disarankan: **`/sekolah`** sebagai halaman tampilan publik/internal untuk Admin dan Pengajar, dengan form terpisah di `/admin/sekolah/tambah` dan `/admin/sekolah/edit`.
- Sistem harus memaksa **satu record** `sekolah`. Pembuatan kedua harus ditolak, termasuk pada kasus konkurensi.

---

## 2. Kondisi tabel `sekolah` saat ini

### 2.1 Hasil audit read-only

Pembacaan dilakukan terhadap rentang `sekolah!A1:ZZ` tanpa menulis.

Header aktual:

```text
sekolah_id, nama_sekolah, alamat, no_hp, created_at, updated_at
```

Jumlah baris data: **0**.

Artinya:
- Belum ada record informasi sekolah.
- UI kosong harus menjadi kondisi default saat pertama kali halaman dibuka.
- Prefix ID `SCH` sudah terdaftar di `ID_PREFIXES.sekolah`.
- Record pertama akan mendapat `SCH-0001` melalui `nextRecordId`.

### 2.2 Schema aktual di kode

File: `src/lib/sheet-schema.js`

```js
sekolah: Object.freeze([
  'sekolah_id',
  'nama_sekolah',
  'alamat',
  'no_hp',
  'created_at',
  'updated_at',
]),
```

Schema ini **cocok** dengan header sheet aktual.

### 2.3 Repository aktual

File: `src/repositories/sekolah-repository.js`

```js
const fields = {
  nama_sekolah: { type: 'string', required: true, maxLength: 200 },
  alamat: { type: 'string', maxLength: 500 },
  no_hp: { type: 'string', maxLength: 30 },
};
```

Fungsi yang tersedia:
- `listSekolah()`
- `getSekolahById(sekolahId)`
- `createSekolah(data)`
- `updateSekolah(sekolahId, data)`
- `deleteSekolah(sekolahId)`

Konfigurasi penting:
- `tableName: 'sekolah'`
- `idColumn: 'sekolah_id'`
- `deleteMode: { type: 'clear' }`
- Validasi create: `validateFields(data, fields, { label: 'sekolah' })`
- Validasi update: `validateFields(data, fields, { partial: true, label: 'sekolah' })`

Belum ada:
- descriptor `logo`
- descriptor `email`
- validator URL
- jaminan satu record pada lapisan repository

### 2.4 Mekanisme header Google Spreadsheet

File: `src/repositories/sheets-repository.js`

`assertHeaderMatches` membandingkan:
- jumlah kolom,
- nama kolom,
- urutan kolom.

Jika berbeda, seluruh operasi `sekolah` akan gagal dengan `SheetHeaderError`. Tidak ada mekanisme otomatis yang menambah atau menggeser header.

Implikasi:
- Perubahan `WORKSHEET_SCHEMAS.sekolah` dan header sheet harus dilakukan dalam satu langkah yang sama.
- Jangan deploy schema baru sebelum header sheet diubah.
- Jangan mengubah urutan kolom lama tanpa kebutuhan yang jelas.

---

## 3. Rencana penambahan header `logo` dan `email`

### 3.1 Urutan yang disarankan

```text
sekolah_id, nama_sekolah, alamat, no_hp, logo, email, created_at, updated_at
```

Alasan:
- `logo` dan `email` ditempatkan setelah kontak `no_hp`.
- `created_at` dan `updated_at` tetap menjadi dua kolom terakhir, mengikuti pola tabel lain.
- Tabel saat ini kosong, sehingga risiko pergeseran data lama sangat rendah.

### 3.2 Langkah yang harus dilakukan setelah persetujuan

1. Ubah `WORKSHEET_SCHEMAS.sekolah` di `src/lib/sheet-schema.js` menjadi urutan di atas.
2. Ubah header baris 1 worksheet `sekolah` di Google Spreadsheet ke urutan yang sama persis.
3. Verifikasi dengan pembacaan `sekolah!A1:ZZ`.
4. Pastikan `assertWorksheetHeader('sekolah', WORKSHEET_SCHEMAS.sekolah)` lulus sebelum halaman diuji.

Tidak boleh:
- mengubah header sekarang,
- menambahkan kolom otomatis dari kode,
- mengisi data sekolah,
- memakai nama tabel `School_Information`.

---

## 4. Rancangan halaman

### 4.1 Lokasi

Disarankan:

```text
/sekolah
```

Alasan:
- `/admin/*` dilindungi `src/app/admin/layout.js` dan hanya dapat diakses Admin. Halaman di sana tidak bisa dipakai Pengajar sebagai viewer.
- `/pengajar/*` hanya cocok untuk Pengajar/Admin dan bercampur dengan dashboard Pengajar.
- `/siswa/*` saat ini khusus pencarian absensi siswa.
- `/sekolah` sebagai route mandiri memungkinkan role-aware rendering: semua role melihat data, hanya Admin yang melihat dan menjalankan aksi tulis.

Tautan yang disarankan:
- Tambah “Informasi Sekolah” ke Akses Cepat di `src/app/admin/page.js`.
- Tambah tautan “Informasi Sekolah” ke menu singkat di `src/app/pengajar/page.js`.

### 4.2 Otorisasi baca

Rancangan final: halaman `/sekolah` dapat dibaca tanpa login. Data informasi sekolah harus bisa diakses dari halaman publik, Admin, dan Pengajar. Tombol dan aksi tulis tetap hanya untuk Admin.

### 4.3 Kondisi tabel kosong

Teks yang harus tampil persis:

```text
Informasi sekolah belum tersedia.
```

- Halaman publik `/sekolah`: hanya teks `Informasi sekolah belum tersedia.`, tanpa tombol.
- Halaman kelola Admin `/admin/sekolah`: tombol **`Lengkapi Informasi Sekolah`**, menuju `/admin/sekolah/tambah`.

### 4.4 Kondisi tabel terisi

Data yang ditampilkan:
- nama sekolah,
- logo jika URL tersedia,
- alamat,
- nomor HP,
- email.

- Halaman publik `/sekolah`: hanya data, tanpa tombol edit.
- Halaman kelola Admin `/admin/sekolah`: tombol **`Edit Informasi Sekolah`**, menuju `/admin/sekolah/edit`.

Keputusan final:
- File `logoipsum-327.svg` dipindahkan ke `public/images/logo-sekolah.svg`.
- Form memakai path `/images/logo-sekolah.svg` sebagai nilai default.
- Tampilan memakai `<Image/>` dari `next/image` dengan `unoptimized` agar SVG lokal langsung dipakai tanpa `remotePatterns`.
- Validator `logo` menerima path root-relative selain `http`/`https`.

---

## 5. Rancangan form tambah dan edit

### 5.1 Lokasi form

- Tambah: `/admin/sekolah/tambah`
- Edit: `/admin/sekolah/edit`

Kedua halaman:
- Server-side guard: hanya Admin aktif yang boleh merender form.
- Jika data sudah ada, `/admin/sekolah/tambah` harus redirect ke `/admin/sekolah/edit` atau `/sekolah`.
- Jika data belum ada, `/admin/sekolah/edit` harus redirect ke `/admin/sekolah/tambah` atau `/sekolah`.

### 5.2 Input

| Urutan | Field | Label | Rekomendasi | Validasi server |
|---:|---|---|---|---|
| 1 | `nama_sekolah` | Nama Sekolah | Wajib | `requireString`, maksimal 200 karakter |
| 2 | `alamat` | Alamat | Wajib | `requireString`, maksimal 500 karakter |
| 3 | `no_hp` | Nomor HP | Wajib | `requireString`, maksimal 30 karakter |
| 4 | `logo` | URL Logo Sekolah | Opsional | URL absolut `http`/`https`, maksimal 1000 karakter |
| 5 | `email` | Email Sekolah | Wajib | `requireEmail`, maksimal 320 karakter |

Alasan rekomendasi:
- `nama_sekolah`, `alamat`, `no_hp`, dan `email` adalah identitas dan kontak resmi sekolah.
- `logo` bersifat aset pendukung dan dapat kosong sampai tersedia.

### 5.3 Validator URL

Belum tersedia. Perlu ditambahkan pada tahap implementasi:
- `requireUrl` / `optionalUrl` di `src/lib/validation.js`.
- Tipe `url` di `VALIDATORS` pada `src/lib/field-validation.js`.

Aturan yang diusulkan:
-必須 `http://` atau `https://`.
- Tolak `javascript:`, `data:`, `file:`, URL relatif, dan string tanpa host.
- Gunakan `new URL(value)` lalu pastikan `protocol` dan `hostname` valid.

### 5.4 Timestamp

- `created_at`: dibuat otomatis saat record pertama disimpan.
- `updated_at`: diperbarui otomatis setiap kali data diedit.
- Keduanya sudah ditangani `buildRecord` di `src/repositories/sheet-table-repository.js`.
- Form tidak boleh menyediakan input untuk keduanya.

### 5.5 Setelah penyimpanan

- Server action melakukan write lalu `redirect("/sekolah")`.
- Halaman `/sekolah` melakukan `listSekolah()` ulang dari database, bukan memakai state client.
- Data terbaru langsung tampil setelah redirect.

---

## 6. Aturan penyimpanan satu record

### 6.1 Perilaku yang diinginkan

- Jika tabel kosong: Admin dapat membuat satu record.
- Jika sudah ada satu record: Admin hanya dapat memperbarui record itu.
- Pembuatan record kedua harus ditolak.
- Data duplikat tidak boleh dibuat lewat server action, form, atau pemanggilan langsung.

### 6.2 Mekanisme yang disarankan

Tambahkan pada lapisan repository/service:

1. `validateRecords` pada `createTableRepository` untuk menolak kondisi `records.length > 1`.
2. `beforeCreate` pada repository `sekolah` untuk menolak create jika `records.length > 0`.
3. Service `sekolah` melakukan pengecekan awal:
   - `getInformasiSekolah()` mengembalikan record pertama atau `null`.
   - `simpanInformasiSekolah()` menentukan create/update berdasarkan hasil tersebut.
4. Server action memanggil service, bukan repository langsung.

Catatan konkurensi:
- `create()` pada `sheet-table-repository` sudah dibungkus `withTableLock(tableName, ...)`.
- `beforeCreate` berada di dalam lock setelah `readAll()`, sehingga aman terhadap dua create bersamaan.
- `validateRecords` memberi perlindungan tambahan jika sheet pernah berisi lebih dari satu baris secara manual.

---

## 7. Mekanisme otorisasi Admin

### 7.1 Aturan

Hanya Admin aktif yang boleh:
- membuka `/admin/sekolah/tambah`,
- membuka `/admin/sekolah/edit`,
- menjalankan server action create,
- menjalankan server action update.

Menyembunyikan tombol tidak cukup.

### 7.2 Pemeriksaan server-side

Pada setiap server action dan halaman form:

1. Panggil `auth()`.
2. Pastikan `session?.user?.id` ada.
3. Pastikan `session.user.role === "Admin"`.
4. Pastikan `session.user.accountStatus === "active"`.
5. Ambil `getUserById(session.user.id)` dari database.
6. Pastikan `dbUser?.role === "Admin"` dan `dbUser?.account_status === "active"`.
7. Jika gagal, `redirect("/login")` atau lempar error.

Alasan pengecekan database:
- JWT bisa basi terhadap perubahan role/status.
- Sumber kebenaran peran adalah tabel `users`.

### 7.3 Halaman tampilan

`/sekolah` boleh dirender untuk role bukan Admin, tetapi:
- tidak merender tombol tulis,
- tidak merender form,
- tidak memanggil action tulis.

---

## 8. Repository, service, dan server action yang diperlukan

### 8.1 Repository

Ubah `src/repositories/sekolah-repository.js`:

```js
const fields = {
  nama_sekolah: { type: 'string', required: true, maxLength: 200 },
  alamat: { type: 'string', required: true, maxLength: 500 },
  no_hp: { type: 'string', required: true, maxLength: 30 },
  logo: { type: 'url', maxLength: 1000 },
  email: { type: 'email', required: true },
};
```

Tambahkan:
- `validateRecords` untuk singleton,
- `beforeCreate` untuk menolak create jika data sudah ada.

Pertahankan:
- `tableName: 'sekolah'`,
- `idColumn: 'sekolah_id'`,
-prefix `SCH`,
- `deleteMode: { type: 'clear' }`.

### 8.2 Validation helpers

Ubah:
- `src/lib/validation.js`: tambah `requireUrl`, `optionalUrl`.
- `src/lib/field-validation.js`: tambah tipe `url` ke `VALIDATORS`.

Email memakai `requireEmail` yang sudah ada.

### 8.3 Service baru

Disarankan: `src/services/sekolah-service.js`

Fungsi:
- `getInformasiSekolah()` → record pertama dari `listSekolah()` atau `null`.
- `createInformasiSekolah(data, actor)` → validasi singleton lalu `createSekolah`.
- `updateInformasiSekolah(sekolahId, data, actor)` → `updateSekolah`.
- `simpanInformasiSekolah(data, actor)` → memilih create/update dan mengembalikan record terbaru.

Service juga mencatat audit:
- `recordAuditCreate` saat create.
- `recordAuditUpdate` saat update.

`actor` berisi `user_id` dari Admin yang sedang login.

### 8.4 Server action

Disarankan: `src/app/admin/sekolah/actions.js`

- `simpanInformasiSekolahAction(formData)`
  - otorisasi Admin,
  - baca `nama_sekolah`, `alamat`, `no_hp`, `logo`, `email`,
  - panggil service,
  - `redirect("/sekolah")`.

Bisa juga diletakkan inline di page, tetapi file terpisah menghindari duplikasi antara `/admin/sekolah/tambah` dan `/admin/sekolah/edit`.

---

## 9. Daftar file yang terdampak

### 9.1 Perubahan kode setelah persetujuan

| File | Jenis | Keterangan |
|---|---|---|
| `src/lib/sheet-schema.js` | Ubah | Tambah `logo`, `email` ke schema `sekolah` |
| `src/lib/validation.js` | Ubah | Tambah validator URL |
| `src/lib/field-validation.js` | Ubah | Tambah tipe `url` |
| `src/repositories/sekolah-repository.js` | Ubah | Descriptor + singleton guard |
| `src/services/sekolah-service.js` | Baru | Logika satu record dan orkestrasi audit |
| `src/app/sekolah/page.js` | Baru | Halaman tampilan dengan conditional Admin/non-Admin |
| `src/app/admin/sekolah/tambah/page.js` | Baru | Form tambah Admin |
| `src/app/admin/sekolah/edit/page.js` | Baru | Form edit Admin |
| `src/app/admin/sekolah/actions.js` | Baru | Server action create/update |
| `src/app/admin/page.js` | Ubah | Tautan ke `/sekolah` |
| `src/app/pengajar/page.js` | Ubah | Tautan ke `/sekolah`, jika disetujui |
| `src/docs/GOOGLE_SHEETS_SCHEMA.md` | Ubah | Dokumentasi header `sekolah` |
| `tests/` | Tambah/Ubah | Test validator URL, singleton, otorisasi |

### 9.2 Google Spreadsheet

| Objek | Perubahan |
|---|---|
| Worksheet `sekolah` | Header baris 1 ditambah `logo`, `email` sesuai urutan |
| Worksheet `sekolah` | Baris data tidak diisi pada tahap ini |

### 9.3 Tidak berubah

- Tabel tetap bernama `sekolah`.
- Tidak ada nama `School_Information`.
- Sistem autentikasi tidak diubah.
- Data sekolah tidak diisi.
- Header tidak diubah sebelum persetujuan.

---

## 10. Risiko dan skenario pengujian

### 10.1 Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Schema diubah tapi header sheet belum | `SheetHeaderError`, semua operasi `sekolah` gagal | Ubah keduanya bersamaan; verifikasi header sebelum uji halaman |
| Dua record sekolah masuk | UI dan aturan satu record rusak | `beforeCreate` + `validateRecords` + lock repository |
| Non-Admin memanggil server action langsung | Data bisa diubah tanpa izin | Cek session dan DB role/status di dalam action |
| JWT role basi | Admin lama tetap bisa menulis setelah role diubah | Cek ulang `getUserById` di server action |
| URL logo berbahaya atau relatif | Gambar gagal/XSS | Validator `http`/`https`, tolak skema lain |
| Logo arbitrary ditolak `next/image` | Gambar tidak tampil | Pakai `<img>` aman atau tambah `remotePatterns` yang disetujui |
| Email kosong diizinkan | Kontak sekolah tidak lengkap | Jadikan `email` wajib |
| `updated_at` tertimpa manual | Audit waktu rusak | Jangan kirim timestamp dari form; biarkan `buildRecord` |
| Redirect setelah save tapi data cache | Data lama tampil | Pastikan halaman `instant = false` dan baca `listSekolah()` saat render |

### 10.2 Skenario pengujian

1. **Header belum diubah**
   - Jalankan `assertWorksheetHeader('sekolah', WORKSHEET_SCHEMAS.sekolah)`.
   - Harus lulus setelah schema dan sheet disamakan.

2. **Tabel kosong, Admin**
   - Buka `/sekolah`.
   - Harus tampil `Informasi sekolah belum tersedia.`
   - Tombol `Lengkapi Informasi Sekolah` harus ada.

3. **Tabel kosong, Pengajar**
   - Buka `/sekolah`.
   - Harus tampil teks kosong.
   - Tidak ada tombol tambah/edit.

4. **Tabel terisi, Admin**
   - Buka `/sekolah`.
   - Nama, logo, alamat, no HP, email tampil.
   - Tombol `Edit Informasi Sekolah` ada.

5. **Tabel terisi, Pengajar**
   - Buka `/sekolah`.
   - Data tampil.
   - Tidak ada tombol tulis.

6. **Validasi tambah**
   - Nama kosong → ditolak.
   - Alamat kosong → ditolak.
   - No HP kosong → ditolak.
   - Email invalid → ditolak.
   - Logo `javascript:alert(1)` → ditolak.
   - Logo `https://...` → diterima.
   - Logo kosong → diterima.

7. **Validasi edit**
   - Semua field wajib harus terisi.
   - Logo bisa dikosongkan.
   - `created_at` tidak berubah.
   - `updated_at` berubah.

8. **Duplicate prevention**
   - Saat data ada, akses `/admin/sekolah/tambah` → redirect.
   - Panggil action create dua kali → yang kedua gagal.
   - Sheet dengan dua baris → `validateRecords` menolak.

9. **Otorisasi langsung**
   - Pengajar mengirim POST/server action create → ditolak.
   - User tanpa session mengirim action → ditolak.
   - Role di JWT Admin tetapi DB Pengajar → ditolak.

10. **Data terbaru**
   - Setelah edit, redirect ke `/sekolah`.
   - Nilai yang tampil berasal dari `listSekolah()` terbaru.

11. **Regresi**
   - `npm run lint` lulus.
   - `npm test` lulus.
   - Halaman `/admin`, `/pengajar`, `/siswa` tidak error setelah penambahan tautan.

---

## 11. Keputusan final

1. `/sekolah` dapat diakses publik; data tampil untuk publik, Admin, dan Pengajar.
2. Field wajib: `nama_sekolah`, `alamat`, `no_hp`, `email`. `logo` opsional.
3. Urutan header final:
   ```text
   sekolah_id, nama_sekolah, alamat, no_hp, logo, email, created_at, updated_at
   ```
4. Logo dirender dengan `<Image/>` dari `next/image` dan memakai aset lokal `public/images/logo-sekolah.svg`.
5. Edit informasi sekolah hanya bisa dilakukan akun Admin, dengan otorisasi server-side.

---

## 12. Kesimpulan

Implementasi selesai. Kondisi akhir:
- tabel `sekolah` kosong,
- header 8 kolom dengan `logo` dan `email`,
- UI `/sekolah` publik dengan tombolAdmin-only,
- form `/admin/sekolah/tambah` dan `/admin/sekolah/edit` Admin-only,
- validator URL tersedia,
- data belum diisi.
