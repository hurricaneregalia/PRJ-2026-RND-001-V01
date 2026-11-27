# Persiapan Field `jenis_kelamin` pada Data Pengguna

Status: **audit selesai dan sudah diimplementasikan** pada 2026-11-27.
Bagian 1–8 mendokumentasikan kondisi sebelum implementasi. Ringkasan perubahan dan hasil verifikasi ada di bagian 13.
Sumber kebenaran: kode aktual di `src/` dan header/data aktual Google Spreadsheet `users`.

---

## 1. Ringkasan eksekutif

- Halaman `/admin/users/tambah` saat ini **belum memiliki input jenis kelamin**.
- Tabel `users` di Google Spreadsheet memiliki **11 kolom** dan **tidak memiliki** kolom `jenis_kelamin`.
- Repository `users` memvalidasi **seluruh baris setiap kali membaca**, sehingga menambahkan descriptor `required: true` akan membuat 5 pengguna lama gagal dibaca, termasuk proses login.
- `assertHeaderMatches` mewajibkan urutan dan jumlah kolom **persis sama** antara `src/lib/sheet-schema.js` dan sheet. Perubahan schema dan header sheet harus dilakukan bersamaan.
- Konvensi aplikasi sudah tersedia: `JENIS_KELAMIN = ['L', 'P']` di `src/lib/domain-constants.js`, dan tabel `siswa` memakai format yang sama.
- Rekomendasi utama: simpan `L`/`P`, wajibkan di form tambah dan server action, tetapi buat descriptor repository **opsional** agar data lama dan bootstrap Admin tetap aman.

---

## 2. Kondisi implementasi saat ini

### 2.1 Halaman tambah pengguna

File: `src/app/admin/users/tambah/page.js`

- Server action: `tambahPengguna(formData)` dengan directive `"use server"`.
- Field yang dibaca:
  - `name`
  - `email`
  - `no_hp`
  - `role`
  - `account_status`
  - `limit_kelas` (default `2` jika kosong)
- Field yang dikirim ke `createUser`:
  - `auth_user_id: email`
  - `email`, `name`, `role`, `account_status`
  - `photo_url: ""`
  - `no_hp`, `limit_kelas`
- Setelah create, server action memanggil `recordAuditCreate` lalu `redirect("/admin/users")`.
- Form memakai elemen native:
  - `name`, `email`: `required`
  - `no_hp`: opsional
  - `role`: komponen `RoleSelectWithLimit`
  - `account_status`: `select` dengan `defaultValue="active"`
- **Tidak ada** input `jenis_kelamin`.
- **Tidak ada** validasi server-side eksplisit di server action. Validasi utama dilakukan repository melalui `validateFields`.

### 2.2 Komponen form yang digunakan

- `src/components/ui/role-select-with-limit.js`
  - Client component.
  - `useState("Pengajar")`, merender `select` role dan input `limit_kelas`.
  - Tidak menangani jenis kelamin.
- Komponen input lain yang tersedia tetapi belum dipakai di halaman ini:
  - `src/components/ui/form-field.js`
  - `src/components/ui/text-input.js`
  - `src/components/ui/select-input.js`
  - `src/components/ui/form-actions.js`

### 2.3 Halaman edit pengguna

File: `src/app/admin/users/[userId]/edit/page.js`

- Server action: `simpanPengguna(formData)`.
- Field yang di-update:
  - `name`, `email`, `role`, `account_status`, `no_hp`, `limit_kelas`
  - `auth_user_id` ikut di-update jika `before.auth_user_id === before.email`.
- Form belum memiliki input `jenis_kelamin`.
- `updateUser` memakai validasi parsial (`partial: true`), sehingga penambahan field opsional tidak memaksa pengisian saat edit.

### 2.4 Halaman detail pengguna

File: `src/app/admin/users/[userId]/page.js`

- Menampilkan:
  - `user_id`, `email`, `role`, `account_status`, `no_hp`
  - Untuk Pengajar: `limit_kelas`, kelas aktif, sisa kuota, status kelas
- Belum menampilkan `jenis_kelamin`.
- Halaman ini sudah memetakan jenis kelamin **siswa** menjadi label:
  - baris 103: `siswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"`
- Pola pemetaan ini bisa dipakai ulang untuk pengguna.

### 2.5 Daftar pengguna

File: `src/app/admin/users/page.js`

- Memakai `listUsers()` dan `listKelas()`.
- Menampilkan `user_id`, nama/kapasitas, `role`, `account_status`, tautan Detail/Edit.
- Belum menampilkan `jenis_kelamin`.

### 2.6 Repository dan service pengguna

File: `src/repositories/user-repository.js`

Descriptor field saat ini:

```js
const fields = {
  auth_user_id: { type: 'string', required: true, maxLength: 200 },
  email: { type: 'email', required: true },
  name: { type: 'string', required: true, maxLength: 200 },
  role: { type: 'enum', required: true, allowedValues: USER_ROLES },
  account_status: { type: 'enum', required: true, allowedValues: ACCOUNT_STATUSES },
  photo_url: { type: 'string', maxLength: 1000 },
  no_hp: { type: 'string', maxLength: 30 },
  limit_kelas: { type: 'integer', min: 0, max: 10000 },
};
```

Fungsi yang diekspor:

- `listUsers`
- `getUserById`
- `findUserByEmail`
- `createUser`
- `updateUser`
- `deactivateUser`
- `findUserByAuthId`
- `isUserBootstrapAvailable`

File: `src/services/user-management-service.js`

- `connectGoogleAccount(email, authUserId, photoUrl)` hanya memperbarui `auth_user_id` dan `photo_url`.
- Tidak menyentuh `jenis_kelamin`; tidak perlu diubah jika field opsional.

### 2.7 Autentikasi dan bootstrap Admin

File: `src/auth.js`

- `signIn` memanggil `findUserByAuthId(authUserId)`.
- Jika belum ada pengguna dan `isUserBootstrapAvailable()` benar, `createUser` dipanggil dengan:
  - `auth_user_id`, `email`, `name`, `role: "Admin"`, `account_status: "active"`, `photo_url`
  - **tanpa** `jenis_kelamin`
- Jika descriptor repository dibuat `required`, bootstrap Admin pertama akan gagal.
- `src/app/admin/layout.js` memanggil `getUserById(user.id)` pada setiap request halaman admin. Kegagalan validasi baris lama akan memblokir seluruh halaman admin.

### 2.8 Fitur lain yang membaca data `users`

| File | Fungsi/Pemakaian | Butuh `jenis_kelamin`? |
|---|---|---|
| `src/app/admin/layout.js` | `getUserById` untuk nama/foto header | Tidak |
| `src/app/admin/page.js` | `listUsers` untuk daftar pengajar dan statistik | Tidak |
| `src/app/admin/jadwal/page.js` | `listUsers` untuk nama pengajar | Tidak |
| `src/app/admin/kelas/[kelasId]/edit/page.js` | `listUsers` untuk pilihan pengajar | Tidak |
| `src/app/admin/users/page.js` | `listUsers` untuk daftar pengguna | Tidak wajib |
| `src/app/admin/users/[userId]/page.js` | `getUserById` untuk detail | Tampilan opsional |
| `src/app/admin/profil/page.js` | `getUserById` untuk profil sendiri | Tampilan opsional |
| `src/app/admin/profil/edit/page.js` | `updateUser` untuk nama/email/no_hp | Opsional |
| `src/app/pengajar/profil/page.js` | `getUserById` untuk profil pengajar | Tampilan opsional |
| `src/app/pengajar/profil/edit/page.js` | `updateUser` untuk nama/email/no_hp | Opsional |
| `src/app/admin/absensi/[absensiId]/page.js` | `getUserById` untuk `created_by` | Tidak |
| `src/app/admin/jadwal/[jadwalId]/page.js` | `getUserById` untuk pengajar | Tidak |
| `src/app/admin/kelas/[kelasId]/page.js` | `getUserById` untuk pengajar | Tidak |

Kesimpulan: **tidak ada fitur yang secara fungsional membutuhkan `jenis_kelamin` pengguna**. Penambahan ini murni data identitas dan tampilan.

---

## 3. Temuan struktur data aktual

### 3.1 Header `users` aktual

Diambil read-only dari Google Spreadsheet:

```text
user_id,auth_user_id,email,name,role,account_status,photo_url,no_hp,limit_kelas,created_at,updated_at
```

- Jumlah kolom: **11** (sebelum implementasi)
- Jumlah baris data: **5**
- Lebar semua baris: **11** (sebelum implementasi)
- Kolom `jenis_kelamin`: **tidak ada** (sebelum implementasi)

Setelah implementasi, header menjadi 12 kolom:

```text
user_id,auth_user_id,email,name,jenis_kelamin,role,account_status,photo_url,no_hp,limit_kelas,created_at,updated_at
```

Kolom `jenis_kelamin` disisipkan setelah `name`. Lima baris lama tetap ada dan nilainya kosong.

Ringkasan aman:

| `user_id` | `role` | `account_status` | `limit_kelas` | Punya `jenis_kelamin` |
|---|---|---|---|---|
| `USR-0001` | Admin | active | 0 | Tidak |
| `USR-0002` | Pengajar | active | 2 | Tidak |
| `USR-0003` | Pengajar | active | 2 | Tidak |
| `USR-0004` | Pengajar | active | 3 | Tidak |
| `USR-0005` | Pengajar | active | 5 | Tidak |

### 3.2 Schema aplikasi

File: `src/lib/sheet-schema.js`

```js
users: Object.freeze([
  'user_id',
  'auth_user_id',
  'email',
  'name',
  'role',
  'account_status',
  'photo_url',
  'no_hp',
  'limit_kelas',
  'created_at',
  'updated_at',
]),
```

Schema ini **sudah cocok** dengan header sheet aktual.

### 3.3 Konvensi jenis kelamin yang sudah ada

File: `src/lib/domain-constants.js`

```js
export const JENIS_KELAMIN = Object.freeze(['L', 'P']);
```

File: `src/repositories/siswa-repository.js`

```js
jenis_kelamin: { type: 'enum', allowedValues: JENIS_KELAMIN },
```

- Descriptor `siswa` **tidak required**.
- Distribusi data `siswa`: `P = 57`, `L = 48`.
- Form siswa memakai:

```jsx
<select id="jenis_kelamin" name="jenis_kelamin" required>
  <option value="">Pilih</option>
  <option value="L">Laki-laki</option>
  <option value="P">Perempuan</option>
</select>
```

Kesimpulan: format penyimpanan yang konsisten adalah **`L` = Laki-laki, `P` = Perempuan**, bukan teks bebas.

### 3.4 Dokumentasi schema tidak sinkron

File: `src/docs/GOOGLE_SHEETS_SCHEMA.md`, bagian `### 3.2 users`, hanya mencantumkan:

- `user_id`, `auth_user_id`, `email`, `name`, `role`, `account_status`, `photo_url`, `created_at`, `updated_at`

Dokumen tersebut **belum mencantumkan `no_hp` dan `limit_kelas`** yang sudah ada di sheet dan repository. Dokumen ini perlu diperbarui saat implementasi, bukan hanya untuk `jenis_kelamin`.

---

## 4. Alur pembuatan dan penyimpanan user

### 4.1 Alur halaman tambah

1. Admin membuka `/admin/users/tambah`.
2. Form dikirim ke server action `tambahPengguna`.
3. `auth()` dipanggil untuk mendapatkan sesi.
4. Nilai form dibaca dengan `formData.get(...)`.
5. `createUser(data)` dipanggil.
6. `createTableRepository.create` menjalankan:
   - `readAll()`
   - `validateCreate(input)`
   - `nextRecordId(prefix, records, idColumn)`
   - `buildRecord(...)`
   - `appendWorksheetRow(tableName, rowValues(record, header))`
7. `recordAuditCreate` menulis snapshot pengguna baru ke `audit_log`.
8. `redirect("/admin/users")`.

### 4.2 Titik kritis di `src/repositories/sheet-table-repository.js`

- `readAll()` memanggil `readWorksheetRecords(tableName, header)`.
- `readWorksheetRecords` memanggil `assertHeaderMatches`.
- `assertHeaderMatches` mewajibkan:
  - jumlah kolom sama,
  - urutan sama,
  - nama kolom sama.
- Setelah header cocok, `validateStoredRows` memanggil `validateStoredFields` untuk **setiap baris**.
- `validateStoredFields` di `src/lib/field-validation.js`:
  - melewati field kosong **hanya jika** `descriptor.required` tidak aktif,
  - melempar `ValidationError` jika field wajib kosong.
- `buildRecord` mengisi kolom yang tidak ada di input dengan:
  - nilai lama saat update, atau
  - string kosong saat create.
- `rowValues` memetakan record ke urutan header, sehingga kolom baru otomatis ikut ditulis **hanya jika** header sheet dan schema sudah sama.

### 4.3 Alur login dan bootstrap

1. Google mengembalikan profil.
2. `signIn` memanggil `findUserByAuthId`.
3. `findUserByAuthId` memanggil `repository.findOne` → `readAll()` → validasi seluruh baris `users`.
4. Jika tidak ada user dan tabel kosong, `createUser` membuat Admin pertama tanpa `jenis_kelamin`.

Implikasi: kesalahan descriptor atau header akan berdampak pada **login seluruh pengguna**, bukan hanya halaman tambah.

---

## 5. Daftar file dan fungsi terdampak

| File | Fungsi/Bagian | Dampak | Wajib diubah? |
|---|---|---|---|
| `src/lib/sheet-schema.js` | `WORKSHEET_SCHEMAS.users` | Menambah kolom `jenis_kelamin` pada urutan header | Ya |
| Google Spreadsheet `users` | Header baris 1 | Harus sama persis dengan schema | Ya |
| `src/repositories/user-repository.js` | `fields`, `createUser`, `updateUser` | Menambah descriptor `jenis_kelamin` | Ya |
| `src/app/admin/users/tambah/page.js` | `tambahPengguna`, JSX form | Membaca, memvalidasi, mengirim `jenis_kelamin` | Ya |
| `src/app/admin/users/[userId]/edit/page.js` | `simpanPengguna`, JSX form | Menampilkan/mengubah nilai; keputusan wajib/opsional | Ya, jika edit diizinkan |
| `src/app/admin/users/[userId]/page.js` | JSX detail | Menampilkan label jenis kelamin | Disarankan |
| `src/app/admin/users/page.js` | JSX daftar | Menampilkan jenis kelamin | Opsional |
| `src/auth.js` | `signIn` bootstrap `createUser` | Tidak mengirim `jenis_kelamin` | Tidak, jika descriptor opsional |
| `src/services/user-management-service.js` | `connectGoogleAccount` | Hanya update `auth_user_id`/`photo_url` | Tidak |
| `src/app/admin/profil/page.js` | JSX profil | Menampilkan jenis kelamin sendiri | Keputusan |
| `src/app/admin/profil/edit/page.js` | `simpanProfil` | Mengubah jenis kelamin sendiri | Keputusan |
| `src/app/pengajar/profil/page.js` | JSX profil | Menampilkan jenis kelamin sendiri | Keputusan |
| `src/app/pengajar/profil/edit/page.js` | `simpanProfil` | Mengubah jenis kelamin sendiri | Keputusan |
| `src/docs/GOOGLE_SHEETS_SCHEMA.md` | Bagian `users` | Sinkronisasi dokumentasi | Ya |
| `src/docs/USER_GENDER_FIELD_PREPARATION.md` | Dokumen ini | Rencana audit | Sudah |

Catatan: `audit_log` tidak memerlukan perubahan schema karena menyimpan snapshot JSON generik. Nilai `jenis_kelamin` akan otomatis muncul di `data_sebelum`/`data_sesudah` setelah field ditambahkan ke record.

---

## 6. Rencana perubahan

### 6.1 Format nilai

- Simpan: `L` atau `P`.
- Tampilan: `L` → `Laki-laki`, `P` → `Perempuan`.
- Enum: `JENIS_KELAMIN` dari `src/lib/domain-constants.js`.
- Jangan menyimpan teks `"Laki-laki"`/`"Perempuan"` ke sheet.
- Nilai kosong pada data lama ditampilkan `-`.

### 6.2 Schema dan header sheet

Urutan yang diusulkan: **setelah `name`**, sehingga identitas terbaca berurutan:

```text
user_id,auth_user_id,email,name,jenis_kelamin,role,account_status,photo_url,no_hp,limit_kelas,created_at,updated_at
```

Alternatif yang lebih rendah risiko kolom bergeser: **sebelum `created_at`** atau **paling akhir**. Keputusan ada di bagian 9.

Langkah:

1. Ubah `WORKSHEET_SCHEMAS.users` di `src/lib/sheet-schema.js`.
2. Ubah header baris 1 sheet `users` pada posisi yang sama.
3. Lakukan keduanya dalam satu langkah. Jangan deploy schema baru sebelum header sheet diubah.
4. Jangan mengubah urutan kolom lain.

### 6.3 Repository

Di `src/repositories/user-repository.js`:

```js
import { ACCOUNT_STATUSES, JENIS_KELAMIN, USER_ROLES } from '@/lib/domain-constants';

const fields = {
  // ...
  jenis_kelamin: { type: 'enum', allowedValues: JENIS_KELAMIN },
  // ...
};
```

Rekomendasi: **tanpa `required: true`** pada descriptor.

Alasan:

- `validateStoredFields` memvalidasi seluruh baris saat dibaca.
- 5 pengguna lama belum memiliki nilai.
- `required` akan memblokir login, halaman admin, daftar pengguna, dan bootstrap.

Kewajiban input ditegakkan di form dan server action halaman tambah.

### 6.4 Form tambah

Tambahkan setelah field `name`:

```jsx
<p>
  <label htmlFor="jenis_kelamin">Jenis Kelamin (wajib)</label>
  <br />
  <select id="jenis_kelamin" name="jenis_kelamin" required defaultValue="">
    <option value="" disabled>
      Pilih
    </option>
    <option value="L">Laki-laki</option>
    <option value="P">Perempuan</option>
  </select>
</p>
```

Ketentuan:

- Tidak ada `defaultValue="L"` atau `"P"`.
- Opsi `Pilih` tidak otomatis terpilih sebagai nilai valid.
- `required` mencegah submit kosong di browser.
- Server action tetap harus memvalidasi ulang.

### 6.5 Server action tambah

Di `tambahPengguna`:

```js
const jenisKelamin = String(formData.get("jenis_kelamin") ?? "").trim();

if (!JENIS_KELAMIN.includes(jenisKelamin)) {
  throw new ValidationError("jenis_kelamin is required", {
    field: "jenis_kelamin",
  });
}

const created = await createUser({
  // ...
  jenis_kelamin: jenisKelamin,
});
```

Catatan:

- `ValidationError` berasal dari `src/lib/data-errors.js`.
- Saat ini halaman belum memiliki UI error khusus. Jika error dilempar, Next.js menampilkan error page. Untuk UX yang lebih baik, perlu keputusan apakah memakai `useActionState` atau redirect dengan query error.
- Validasi repository tetap menjadi lapisan terakhir, tetapi descriptor opsional membuat validasi wajib harus eksplisit di action.

### 6.6 Halaman edit

Opsi minimal:

```jsx
<p>
  <label htmlFor="jenis_kelamin">Jenis Kelamin</label>
  <br />
  <select
    id="jenis_kelamin"
    name="jenis_kelamin"
    defaultValue={user.jenis_kelamin}
  >
    <option value="">Pilih</option>
    <option value="L">Laki-laki</option>
    <option value="P">Perempuan</option>
  </select>
</p>
```

Dan di `simpanPengguna`:

```js
jenis_kelamin: formData.get("jenis_kelamin"),
```

Keputusan yang harus diambil:

- Jika edit **wajib**, pengguna lama harus diisi saat edit pertama. Form akan memaksa memilih.
- Jika edit **opsional**, data lama bisa tetap kosong dan ditampilkan `-`.

Rekomendasi: **opsional saat edit**, wajib saat tambah. Ini menghindari paksaan perubahan data lama.

### 6.7 Halaman detail dan daftar

Detail (`src/app/admin/users/[userId]/page.js`) tambahkan:

```jsx
<li>
  Jenis Kelamin:{" "}
  {user.jenis_kelamin === "L"
    ? "Laki-laki"
    : user.jenis_kelamin === "P"
      ? "Perempuan"
      : "-"}
</li>
```

Daftar (`src/app/admin/users/page.js`) opsional, misalnya setelah nama:

```jsx
{user.jenis_kelamin === "L"
  ? "Laki-laki"
  : user.jenis_kelamin === "P"
    ? "Perempuan"
    : "-"}
```

Jika pemetaan dipakai di banyak tempat, pertimbangkan helper kecil. Namun itu bukan keharusan dan bisa dianggap refactor; hindari sampai disetujui.

### 6.8 Profil Admin dan Pengajar

Keputusan terpisah:

- Tampilkan saja, atau
- Tampilkan dan izinkan edit.

Jika diizinkan edit, `simpanProfil` di dua halaman harus menambahkan `jenis_kelamin`. Jika tidak, tidak ada perubahan.

### 6.9 Dokumentasi

Perbarui `src/docs/GOOGLE_SHEETS_SCHEMA.md` bagian `users`:

- Tambahkan `jenis_kelamin` dengan tipe `string`, wajib untuk data baru, nilai `L`/`P`.
- Tambahkan `no_hp` dan `limit_kelas` yang saat ini belum terdokumentasi.
- Jelaskan bahwa data lama boleh kosong.

### 6.10 Pengujian

Lihat bagian 8.

---

## 7. Risiko kompatibilitas dengan data lama

| Risiko | Pemicu | Dampak | Mitigasi |
|---|---|---|---|
| Semua baris `users` gagal divalidasi | Descriptor `jenis_kelamin` memakai `required: true` | Login gagal, `/admin` gagal, daftar pengguna gagal | Buat descriptor opsional; wajibkan hanya di form/action |
| `SheetHeaderError` | Schema diubah tetapi header sheet belum | Semua operasi `users` gagal | Ubah schema dan header bersamaan; verifikasi dengan `assertWorksheetHeader` |
| Baris lama terbaca `undefined` | Kolom baru ditambahkan, baris lama belum punya nilai | Tampilan bisa kosong/`undefined` | `readWorksheetRecords` mengisi `''`; tampilkan `-` |
| Form edit memaksa pengisian | Edit dibuat wajib | Admin tidak bisa menyimpan tanpa mengisi data lama | Putuskan wajib/opsional; rekomendasi opsional |
| Bootstrap Admin gagal | `createUser` di `src/auth.js` tidak mengirim field wajib | Admin pertama tidak bisa dibuat | Descriptor opsional, atau kirim nilai eksplisit saat bootstrap |
| Audit berisi nilai kosong | Data lama di-update sebelum backfill | Snapshot audit mencatat `jenis_kelamin: ""` | Wajar; tidak merusak data |
| Dokumentasi menyesatkan | `GOOGLE_SHEETS_SCHEMA.md` belum diperbarui | Implementasi berikutnya salah asumsi | Perbarui dokumen saat implementasi |
| Data uji/operasional berubah | Backfill otomatis | Melanggar batasan | Tidak ada backfill otomatis; tunggu keputusan |

Catatan penting: penambahan kolom **tidak** membuat baris lama kehilangan data. Spreadsheet hanya menambah satu sel kosong per baris lama. Risiko utama bukan pada data lama itu sendiri, melainkan pada validasi `required` dan ketidakcocokan header.

---

## 8. Skenario pengujian

### 8.1 Uji schema dan header

1. Buka sheet `users`, pastikan header persis:
   ```text
   user_id,auth_user_id,email,name,jenis_kelamin,role,account_status,photo_url,no_hp,limit_kelas,created_at,updated_at
   ```
2. Jalankan `assertWorksheetHeader('users', WORKSHEET_SCHEMAS.users)`.
3. Pastikan tidak ada `SheetHeaderError`.
4. Pastikan 5 baris lama tetap terbaca dan `jenis_kelamin` bernilai `""`.

### 8.2 Uji tambah pengguna

| Kasus | Langkah | Hasil yang diharapkan |
|---|---|---|
| Tanpa pilih gender | Submit form dengan `Pilih` | Browser menolak karena `required`; server action juga menolak |
| Pilih Laki-laki | Isi form, pilih `Laki-laki`, submit | Baris baru tersimpan dengan `jenis_kelamin = "L"` |
| Pilih Perempuan | Isi form, pilih `Perempuan`, submit | Baris baru tersimpan dengan `jenis_kelamin = "P"` |
| Nilai dimanipulasi | Kirim `jenis_kelamin = "X"` | Ditolak `ValidationError` |
| Field hilang | Kirim tanpa `jenis_kelamin` | Ditolak `ValidationError` |
| Audit | Setelah create | `audit_log` mencatat `jenis_kelamin` di `data_sesudah` |

### 8.3 Uji data lama

1. Baca `listUsers()`.
2. Pastikan 5 pengguna lama tetap terbaca.
3. Pastikan `jenis_kelamin` kosong tidak menyebabkan error.
4. Login dengan akun lama.
5. Buka `/admin`, `/admin/users`, `/admin/users/USR-0001`.
6. Pastikan tidak ada error dan nilai kosong ditampilkan `-`.

### 8.4 Uji edit

1. Edit pengguna lama tanpa mengisi gender → simpan.
2. Pastikan data lain tidak berubah dan `jenis_kelamin` tetap kosong.
3. Edit pengguna baru, ubah `L` → `P` → simpan.
4. Pastikan sheet berubah dan audit mencatat `data_sebelum`/`data_sesudah`.

### 8.5 Uji regresi

- `npm run lint`
- `npm test`
- Buka halaman yang memakai `listUsers`/`getUserById`:
  - `/admin`
  - `/admin/users`
  - `/admin/users/[userId]`
  - `/admin/users/[userId]/edit`
  - `/admin/jadwal`
  - `/admin/kelas/[kelasId]/edit`
  - `/admin/profil`
  - `/pengajar/profil`
- Pastikan tidak ada `DataIntegrityError`, `SheetHeaderError`, atau `ValidationError` baru.

### 8.6 Uji integrasi repository (opsional)

Buat test sementara atau test permanen yang:

- membuat user dengan `jenis_kelamin: "L"`,
- membaca kembali,
- memastikan nilai `L`,
- memastikan user lama tanpa gender tetap terbaca.

Hapus data uji setelah selesai, atau tandai dengan ID yang jelas.

---

## 9. Keputusan yang sudah final

Keputusan yang diambil sebelum implementasi:

1. **Posisi kolom:** setelah `name`.
2. **Kewajiban di repository:** descriptor opsional; wajib divalidasi di form dan server action.
3. **Halaman edit:** jenis kelamin tidak dapat diubah.
4. **Bootstrap Admin:** tidak diubah; descriptor opsional menjaga login tetap aman.
5. **Profil Admin/Pengajar:** hanya menampilkan, tidak mengedit.
6. **Daftar pengguna:** tidak menampilkan jenis kelamin.
7. **Backfill data lama:** tidak dilakukan; nilai lama dibiarkan kosong.
8. **UX error validasi:** tombol submit dinonaktifkan sampai semua field `required` valid; server tetap memvalidasi ulang.
9. **Helper label:** memakai `src/lib/domain-labels.js`.

Opsi di bawah dipertahankan sebagai catatan proses pengambilan keputusan.

1. **Posisi kolom**
   - Opsi A: setelah `name` (rapi secara identitas, tetapi semua kolom setelahnya bergeser).
   - Opsi B: sebelum `created_at`.
   - Opsi C: paling akhir setelah `updated_at` (paling kecil risiko geser, tetapi kurang rapi).
   - Rekomendasi: A, dengan perubahan header dilakukan manual dan hati-hati.

2. **Kewajiban di repository**
   - Opsi A: descriptor opsional; wajib hanya di form/action. **Rekomendasi.**
   - Opsi B: descriptor `required: true`; harus backfill 5 user lebih dulu.
   - Opsi C: `required` hanya untuk create, bukan update/read. Perlu perubahan `validateStoredFields`/descriptor terpisah; lebih kompleks.

3. **Kewajiban di halaman edit**
   - Opsi A: opsional, data lama boleh kosong. **Rekomendasi.**
   - Opsi B: wajib, memaksa pengisian saat edit pertama.

4. **Bootstrap Admin di `src/auth.js`**
   - Opsi A: biarkan tanpa gender karena descriptor opsional. **Rekomendasi.**
   - Opsi B: isi nilai default eksplisit (melanggar semangat "tanpa default otomatis" jika diterapkan ke form, tetapi bootstrap bukan form).
   - Opsi C: ubah alur bootstrap agar meminta gender; perubahan besar.

5. **Profil Admin/Pengajar**
   - Opsi A: tidak menampilkan. **Rekomendasi awal, paling minimal.**
   - Opsi B: tampilkan saja.
   - Opsi C: tampilkan dan izinkan edit.

6. **Daftar pengguna**
   - Opsi A: tidak menampilkan.
   - Opsi B: tampilkan setelah nama. **Disarankan jika ingin visibilitas.**

7. **Backfill data lama**
   - Opsi A: biarkan kosong sampai data diverifikasi manual. **Rekomendasi.**
   - Opsi B: isi manual berdasarkan data HR/pengajar.
   - Opsi C: isi otomatis berdasarkan nama; **tidak disarankan**, rawan salah.

8. **UX error validasi**
   - Opsi A: andalkan `required` + `ValidationError` (error page). Paling sedikit perubahan.
   - Opsi B: `useActionState` + pesan error di form. Perlu komponen client.
   - Opsi C: redirect dengan query error. Perlu `searchParams` dan pesan.
   - Rekomendasi: A untuk implementasi awal, B jika UX ingin lebih baik.

9. **Helper label jenis kelamin**
   - Opsi A: pemetaan lokal di setiap halaman. **Rekomendasi, tanpa refactor.**
   - Opsi B: helper bersama di `src/lib`. Lebih rapi, tetapi menambah file baru.

---

## 10. Urutan implementasi yang diusulkan

Setelah disetujui:

1. Putuskan posisi kolom dan kewajiban edit.
2. Ubah `src/lib/sheet-schema.js`.
3. Ubah header sheet `users` pada posisi yang sama.
4. Verifikasi header dengan `assertWorksheetHeader`.
5. Ubah `src/repositories/user-repository.js` (descriptor opsional).
6. Ubah `src/app/admin/users/tambah/page.js` (form + action + validasi).
7. Ubah halaman edit jika disetujui.
8. Ubah halaman detail/daftar jika disetujui.
9. Perbarui `src/docs/GOOGLE_SHEETS_SCHEMA.md`.
10. Jalankan lint, test, dan uji manual.
11. Laporkan hasil; jangan backfill data lama tanpa persetujuan terpisah.

---

## 11. Bukti audit awal (read-only)

- Header `users` dibaca langsung dari Google Sheets API dengan scope `spreadsheets.readonly`.
- Schema aplikasi dibaca dari `src/lib/sheet-schema.js`.
- Perilaku validasi dibaca dari `src/lib/field-validation.js` dan `src/repositories/sheet-table-repository.js`.
- Alur login dibaca dari `src/auth.js`.
- Tidak ada operasi tulis ke sheet, tidak ada perubahan file kode, dan tidak ada perubahan data pengguna selama fase audit awal. Operasi tulis dilakukan saat implementasi; lihat bagian 13.

---

## 12. Kesimpulan

Penambahan `jenis_kelamin` pada pengguna **layak dilakukan** dengan format `L`/`P`, mengikuti konvensi `siswa`. Risiko terbesar bukan pada penambahan kolom, melainkan pada:

1. ketidakcocokan header schema vs sheet, dan
2. descriptor `required` yang akan memblokir pembacaan 5 pengguna lama.

Rencana yang aman: schema dan header diubah bersamaan, descriptor repository tetap opsional, kewajiban ditegakkan di form tambah dan server action, data lama dibiarkan kosong sampai ada keputusan backfill.

---

## 13. Hasil implementasi

### 13.1 Perubahan Google Spreadsheet

- Kolom `jenis_kelamin` disisipkan setelah `name` dengan `spreadsheets.batchUpdate` (`insertDimension`, kolom E).
- Header `users` menjadi:
  ```text
  user_id,auth_user_id,email,name,jenis_kelamin,role,account_status,photo_url,no_hp,limit_kelas,created_at,updated_at
  ```
- Lima baris lama tetap ada, nilainya kosong.
- Backup header dan baris sampel disimpan di:
  `/private/var/folders/p5/bzkf4nkd0sd6r999j32v6f7m0000gn/T/opencode/users-header-before-gender.json`

### 13.2 Perubahan kode

- `src/lib/sheet-schema.js`: `WORKSHEET_SCHEMAS.users` menambah `jenis_kelamin` setelah `name`.
- `src/repositories/user-repository.js`: import `JENIS_KELAMIN`; descriptor `jenis_kelamin` opsional dengan `allowedValues: JENIS_KELAMIN`.
- `src/app/admin/users/tambah/page.js`:
  - import `JENIS_KELAMIN` dan `requireEnum`;
  - server action membaca dan memvalidasi `jenis_kelamin`;
  - `createUser` mengirim `jenis_kelamin`;
  - form memakai `RequiredFieldsForm`;
  - select `Jenis Kelamin (wajib)` dengan opsi `Pilih`, `Laki-laki`, `Perempuan`, tanpa default terpilih.
- `src/components/ui/required-fields-form.js`: client component yang menonaktifkan tombol submit sampai `form.checkValidity()` bernilai true.
- `src/lib/domain-labels.js`: helper `formatJenisKelamin`.
- `src/app/admin/users/[userId]/page.js`: menampilkan Jenis Kelamin.
- `src/app/admin/profil/page.js`: menampilkan Jenis Kelamin.
- `src/app/pengajar/profil/page.js`: menampilkan Jenis Kelamin.
- `src/docs/GOOGLE_SHEETS_SCHEMA.md`: sinkronisasi kolom `users`.

### 13.3 Yang tidak diubah

- Halaman edit pengguna dan edit profil tidak memiliki input gender.
- Daftar pengguna tidak menampilkan gender.
- `auth.js` bootstrap Admin tetap tidak mengirim gender.
- `connectGoogleAccount` tidak diubah.
- Data lama tidak dibackfill.

### 13.4 Verifikasi

- `npm run lint`: lulus.
- `npm test`: 3 file lulus, 1 skip; 6 test lulus, 7 skip.
- `npm run build`: lulus.
- `listUsers()` tetap membaca 5 pengguna lama dengan `jenis_kelamin = ""`.
- Validasi `requireEnum`: menerima `L`/`P`, menolak kosong dan nilai lain.
- Header sheet diverifikasi: 12 kolom, 5 baris data, semua lebar 12.

### 13.5 Catatan

- Tombol submit dinonaktifkan berdasarkan validitas form, tetapi server action tetap menjadi lapisan validasi terakhir.
- Karena descriptor repository opsional, `createUser` yang dipanggil dari tempat lain selain halaman tambah tidak akan memaksa gender. Sumber utama input tetap halaman `/admin/users/tambah`.
- Data uji lama tidak dibuat dan data pengguna tidak dimodifikasi, selain penambahan kolom kosong.
