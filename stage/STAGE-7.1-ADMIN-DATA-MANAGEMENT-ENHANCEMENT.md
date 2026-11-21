# Stage 7.1 – Admin Data Management Enhancement

## Penyempurnaan Pengelolaan Data Admin

Stage 7.1 merupakan tahap revisi dan penyempurnaan setelah Stage 7 selesai, sebelum memasuki Stage 8 – Attendance (Presensi).

Tujuan utamanya adalah meningkatkan efisiensi pengelolaan data, konsistensi UI, kemudahan pencarian, dan performa pemuatan data tanpa melakukan refactoring besar terhadap arsitektur yang sudah berjalan.

---

## 1. Ruang Lingkup per Halaman

### A. Users – `/admin/users`

**Filter:**

- Role.
- Account status.

**Sorting:**

- Nama pengguna.
- Role.
- Status akun.
- `updated_at DESC` sebagai pengurutan default.

**Bulk operation:**

- Tidak diterapkan.
- Pembuatan akun dan perubahan role/status tetap dilakukan secara individual untuk menjaga keamanan dan validasi identitas Administrator.

**Infinite scroll:**

- Diterapkan.
- Load awal 20 data.
- Load berikutnya 20 data setiap kali pengguna melakukan scroll mendekati akhir daftar.

### B. Classes – `/admin/classes`

**Filter:**

- Status kelas.

**Sorting:**

- Nama kelas.
- Status kelas.
- `updated_at DESC` sebagai pengurutan default.

**Bulk operation:**

- Bulk mengubah status beberapa kelas sekaligus.
- Validasi tetap dilakukan untuk setiap kelas.
- Data valid diproses, data tidak valid dilewati dengan alasan masing-masing.

**Infinite scroll:**

- Tidak menjadi prioritas karena jumlah kelas diperkirakan relatif sedikit.

### C. Assignments – `/admin/assignments`

**Filter:**

- Guru.
- Kelas.
- Status penugasan.
- Tanggal mulai (`effective_from`).

**Sorting:**

- Nama guru.
- Nama kelas.
- Tanggal mulai.
- Status penugasan.
- `updated_at DESC` sebagai pengurutan default.

**Bulk operation:**

- Bulk mengakhiri beberapa penugasan sekaligus.
- Setiap penugasan divalidasi secara individual.
- Data valid diproses, data tidak valid dilewati dengan alasan masing-masing.
- Bulk create belum menjadi prioritas karena membutuhkan validasi konflik guru, kelas, dan tanggal.

**Infinite scroll:**

- Diterapkan.
- Load awal 20 data.
- Load berikutnya 20 data setiap kali pengguna melakukan scroll mendekati akhir daftar.

### D. Students – `/admin/students`

Halaman ini menjadi referensi implementasi karena fitur bulk create, filter, dan sorting sudah tersedia.

**Perubahan:**

- Mempertahankan seluruh fitur yang sudah berjalan.
- Menambahkan infinite scroll.
- Load awal 20 siswa.
- Load berikutnya 20 siswa setiap kali pengguna melakukan scroll mendekati akhir daftar.

> Tidak perlu mengulang implementasi bulk create, filter, atau sorting yang sudah selesai.

---

## 2. Standar Sorting Seluruh Halaman

Semua halaman menggunakan standar berikut:

| Ketentuan | Aturan |
| --- | --- |
| Sorting default | `updated_at DESC` |
| Urutan | Terbaru diperbarui tampil paling atas |
| Sorting tambahan | Berdasarkan kolom yang relevan |
| Sorting sekunder | Identifier stabil jika nilai sorting utama sama |
| Perubahan data | `updated_at` harus diperbarui |
| Reset filter | Mengembalikan filter kosong dan sorting default |

> Filter dan sorting harus berlaku pada keseluruhan kumpulan data, bukan hanya data yang sedang terlihat.

---

## 3. Standar Infinite Scroll

Infinite scroll diterapkan pada Users, Students, dan Assignments.

**Disepakati.**

| Ketentuan | Aturan |
| --- | --- |
| Load pertama | 20 data |
| Load berikutnya | 20 data |
| Pemicu | Scroll mendekati akhir daftar |
| Pagination button | Tidak digunakan |
| Loading indicator | Ditampilkan saat pengambilan data |
| Data habis | Tidak ada permintaan berikutnya |
| Filter berubah | Mulai kembali dari data pertama |
| Sorting berubah | Mulai kembali dari data pertama |

**Ketentuan teknis:**

- Gunakan mekanisme cursor-based loading jika sesuai dengan struktur Repository.
- Hindari mengambil seluruh data sekaligus.
- Hindari data duplikat atau terlewat.
- Pastikan sorting `updated_at DESC` konsisten antarbatches.
- Evaluasi kemampuan Google Sheets Repository untuk mengambil data secara bertahap.
- Jangan sekadar menyembunyikan data yang sebenarnya sudah diambil seluruhnya.

---

## 4. Standar Bulk Operation

Bulk operation menggunakan pola hasil parsial yang telah disetujui.

Contoh:

- 10 kelas dipilih.
- 8 kelas valid.
- 2 kelas tidak valid.

Hasil:

- 8 kelas diproses.
- 2 kelas dilewati.
- Alasan kegagalan masing-masing ditampilkan.

**Ketentuan:**

1. Validasi dilakukan per item.
2. Kesalahan validasi satu item tidak menggagalkan item lainnya.
3. Kesalahan teknis atau kegagalan sistem tetap ditangani dengan aman.
4. Perubahan data dan audit log harus mengikuti mekanisme batch yang sudah digunakan.
5. Hasil operasi menampilkan jumlah berhasil, dilewati, dan alasan setiap item yang gagal.

---

## 5. Prinsip Arsitektur dan UI

Seluruh implementasi wajib mempertahankan kesepakatan proyek:

- Next.js App Router.
- JavaScript.
- Service Layer dan Repository Layer tetap terpisah.
- Server Actions berada pada file `actions.js` tersendiri.
- UI mobile-first.
- Tidak menggunakan HTML `<table>`.
- Tidak menggunakan horizontal scrolling untuk menampilkan data.
- Mempertahankan pola UI yang sudah diterapkan pada halaman Students.
- Tidak melakukan refactoring besar.
- Tidak mengubah fitur Stage 7 yang sudah berjalan tanpa kebutuhan jelas.

**Ketentuan pengembangan file:**

- Perubahan satu blok: gunakan patch lokal.
- Perubahan beberapa blok: berikan skrip lengkap.
- Skrip di bawah 500 baris tetap satu file.
- Skrip 500 baris atau lebih dapat dipisah berdasarkan tanggung jawab.
- Setiap perubahan diperiksa dengan ESLint atau `node --check` sesuai kebutuhan.

---

## 6. Urutan Pelaksanaan

| Urutan | Pekerjaan |
| --- | --- |
| 1 | Users: filter dan sorting |
| 2 | Users: infinite scroll |
| 3 | Classes: filter dan sorting |
| 4 | Classes: bulk update status |
| 5 | Assignments: filter dan sorting |
| 6 | Assignments: bulk end |
| 7 | Assignments: infinite scroll |
| 8 | Students: infinite scroll |
| 9 | Pemeriksaan konsistensi seluruh halaman |
| 10 | Pengujian akhir dan commit Stage 7.1 |

> Urutan tersebut dapat disesuaikan apabila hasil pemeriksaan teknis menunjukkan adanya ketergantungan antarfitur.

---

## 7. Batasan dan Hal yang Tidak Dikerjakan

- Tidak mengulang fitur bulk create Students.
- Tidak menambahkan bulk Users.
- Tidak menambahkan bulk create Assignments pada tahap ini.
- Tidak menambahkan infinite scroll Classes kecuali jumlah data aktual menunjukkan kebutuhan.
- Tidak melakukan refactoring besar.
- Tidak melakukan migrasi database tanpa persetujuan.
- Tidak mengubah aturan bisnis Stage 7 yang sudah disepakati.
- Tidak menjalankan production build berulang kali tanpa kebutuhan integrasi yang jelas.

---

## 8. Kriteria Selesai Stage 7.1

Stage 7.1 dinyatakan selesai apabila:

1. Filter dan sorting Users, Classes, dan Assignments berjalan benar.
2. Semua halaman menggunakan default sorting `updated_at DESC`.
3. Infinite scroll Users, Students, dan Assignments berjalan bertahap 20 data.
4. Bulk update Classes berjalan dengan hasil parsial.
5. Bulk end Assignments berjalan dengan hasil parsial.
6. Tidak ada duplikasi atau data terlewat saat infinite scroll.
7. Filter dan sorting tetap konsisten ketika dikombinasikan dengan infinite scroll.
8. Hak akses Admin dan Guru tidak berubah.
9. Audit log tetap benar.
10. ESLint dan production build berhasil.
11. Seluruh perubahan telah di-commit.

> **Catatan status:** Stage 7 sudah selesai dan di-commit. Stage 7.1 adalah tahap revisi baru yang belum dimulai implementasinya.
