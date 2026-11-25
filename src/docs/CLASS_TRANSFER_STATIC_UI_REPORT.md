# Laporan UI Statis Pemindahan Kelas

Tanggal: 2026-11-25

Ruang lingkup: dua halaman UI statis untuk evaluasi tampilan, informasi, kolom, dan kebutuhan data fitur Pemindahan Kelas. Tidak ada akses Google Spreadsheet, repository, service, API, server action, validasi backend, audit log, atau proses pemindahan yang dijalankan.

---

## 1. File yang Dibuat

| File | Jenis | Fungsi |
|---|---|---|
| `src/app/admin/siswa/[siswaId]/pindah-kelas/page.js` | Server Component | Halaman pemindahan siswa individual; metadata, breadcrumb, identitas siswa, kelas saat ini, keanggotaan, form statis, catatan. |
| `src/app/admin/kelas/[kelasId]/pindah-kelas/page.js` | Server Component | Halaman pemindahan siswa dari kelas; metadata, breadcrumb, identitas kelas asal, daftar anggota aktif, form statis, catatan. |

## 2. File yang Diubah

| File | Perubahan |
|---|---|
| `src/docs/CLASS_TRANSFER_PAGE_AUDIT.md` | Dua checkbox "Halaman ... dibuat" ditandai selesai dan diberi keterangan UI statis. Tidak ada perubahan desain atau aturan bisnis. |

Tidak diubah:

- `DEVELOPMENT_ROADMAP.md`
- `GOOGLE_SHEETS_SCHEMA.md`
- Struktur dan isi 13 worksheet
- Autentikasi dan otorisasi
- Navigasi halaman detail siswa/kelas
- Halaman atau fitur lain

---

## 3. Konten Halaman Siswa Individual

Route: `/admin/siswa/[siswaId]/pindah-kelas`

1. **Header**
   - Judul "Pindah Kelas Siswa".
   - Keterangan bahwa halaman statis dan data ilustrasi.
   - Breadcrumb: Dashboard / Manajemen Siswa / Detail Siswa / Pindah Kelas.

2. **Identitas Siswa**
   - Nama, NIS, ID siswa, jenis kelamin, tanggal lahir, nomor HP, status siswa.

3. **Kelas Saat Ini**
   - Kode kelas, nama kelas, pengajar, jadwal, ruangan, kapasitas, status kelas.

4. **Informasi Keanggotaan**
   - ID keanggotaan (`kelas_siswa_id`), tanggal mulai, status keanggotaan, tanggal selesai.

5. **Rencana Pemindahan (form statis)**
   - Dropdown kelas tujuan aktif selain kelas asal.
   - Input tanggal efektif (`type="date"`).
   - Ringkasan: kelas asal, kelas tujuan, pengajar/jadwal/ruangan tujuan, tanggal efektif, dampak keanggotaan.
   - Tombol "Konfirmasi Pemindahan".
   - Tombol "Batal" memakai `BackButton`.
   - Pratinjau konfirmasi lokal; tidak mengirim data.

6. **Catatan**
   - Riwayat lama tidak dihapus.
   - Keanggotaan lama menjadi `selesai`, baru menjadi `aktif`.
   - Absensi historis tidak berubah.
   - Belum ada operasi atau penyimpanan data.

---

## 4. Konten Halaman dari Kelas

Route: `/admin/kelas/[kelasId]/pindah-kelas`

1. **Header**
   - Judul "Pindah Kelas dari Kelas".
   - Keterangan bahwa halaman statis dan data ilustrasi.
   - Breadcrumb: Dashboard / Manajemen Kelas / Detail Kelas / Pindah Kelas.

2. **Identitas Kelas Asal**
   - Kode kelas, nama kelas, ID kelas, pengajar, jadwal, ruangan, kapasitas, status kelas.

3. **Daftar Siswa Aktif**
   - Ringkasan enam anggota aktif: nama, NIS, ID siswa, ID keanggotaan, status keanggotaan, tanggal mulai.
   - Keterangan bahwa hanya keanggotaan `aktif` yang dapat dipilih.

4. **Rencana Pemindahan (client form)**
   - Fieldset/legend dengan checkbox per siswa.
   - Label setiap checkbox berisi nama, NIS, ID siswa, ID keanggotaan, dan status keanggotaan.
   - Penghitung "Jumlah siswa terpilih: X dari 6" dengan `aria-live`.
   - Dropdown satu kelas tujuan aktif selain kelas asal.
   - Input tanggal efektif (`type="date"`).
   - Ringkasan: kelas asal, kelas tujuan, jumlah terpilih, daftar siswa terpilih, pengajar/jadwal/ruangan tujuan, tanggal efektif, dampak keanggotaan.
   - Tombol "Konfirmasi Pemindahan" dinonaktifkan jika belum ada siswa dipilih.
   - Tombol "Batal" memakai `BackButton`.
   - Pratinjau konfirmasi lokal; tidak mengirim data.

5. **Catatan**
   - Riwayat lama tidak dihapus.
   - Keanggotaan lama `selesai`, baru `aktif`.
   - Setiap siswa diproses terpisah; kegagalan satu siswa tidak membatalkan siswa lain.
   - Absensi historis tidak berubah.
   - Belum ada operasi atau penyimpanan data.

---

## 5. Data Ilustrasi

### Siswa individual

| Field | Nilai |
|---|---|
| `siswa_id` | `SIS-0001` |
| NIS | `2026001` |
| Nama | Andi Pratama |
| Jenis kelamin | Laki-laki |
| Tanggal lahir | 01 Januari 2010 |
| Nomor HP | 0812-3456-7890 |
| Status | aktif |

Kelas asal: `KLS-0001` / `MAT-A` / Matematika A, pengajar Budi Santoso, jadwal Senin 08:00 - 09:30, ruangan R-101, 15 dari 20 siswa.
Keanggotaan: `KRS-0001`, mulai 05 Januari 2026, status aktif.

### Kelas asal (halaman kelas)

| Field | Nilai |
|---|---|
| `kelas_id` | `KLS-0001` |
| `kode_kelas` | `MAT-A` |
| `nama_kelas` | Matematika A |
| Pengajar | Budi Santoso |
| Jadwal | Senin, 08:00 - 09:30 |
| Ruangan | R-101 |
| Kapasitas | 15 dari 20 siswa |
| Status | aktif |

### Anggota aktif

| Keanggotaan | Siswa | NIS | Nama | Mulai | Status |
|---|---|---|---|---|---|
| `KRS-0001` | `SIS-0001` | 2026001 | Andi Pratama | 05 Januari 2026 | aktif |
| `KRS-0002` | `SIS-0002` | 2026002 | Citra Lestari | 05 Januari 2026 | aktif |
| `KRS-0003` | `SIS-0003` | 2026003 | Dina Maulida | 05 Januari 2026 | aktif |
| `KRS-0004` | `SIS-0004` | 2026004 | Fajar Nugroho | 12 Januari 2026 | aktif |
| `KRS-0005` | `SIS-0005` | 2026005 | Gita Permata | 12 Januari 2026 | aktif |
| `KRS-0006` | `SIS-0006` | 2026006 | Hendra Wijaya | 19 Januari 2026 | aktif |

### Kelas tujuan (dipakai kedua halaman)

| ID | Kode | Nama | Pengajar | Jadwal | Ruangan | Isi |
|---|---|---|---|---|---|---|
| `KLS-0002` | `ENG-B` | Bahasa Inggris B | Siti Aminah | Selasa, 10:00 - 11:30 | R-102 | 12/18 |
| `KLS-0003` | `IPA-A` | IPA Dasar A | Rina Wati | Rabu, 13:00 - 14:30 | R-201 | 16/20 |
| `KLS-0004` | `MAT-B` | Matematika B | Budi Santoso | Kamis, 15:00 - 16:30 | R-103 | 14/20 |

Tanggal efektif awal: `2026-11-25`. Kelas asal `KLS-0001` tidak muncul sebagai kelas tujuan.

---

## 6. Komponen Reusable

| Komponen | Lokasi | Penggunaan |
|---|---|---|
| `BackButton` | `src/components/ui/back-button.js` | Tombol "Batal" pada kedua form; memakai `router.back()`. |
| `Link` (`next/link`) | Next.js | Breadcrumb internal. |

Tidak ada komponen baru di luar form client tiap halaman. Markup memakai elemen semantik yang sama dengan halaman admin lain: `main`, `header`, `section`, `h2`, `h3`, `ul`, `li`, `dl`, `dt`, `dd`, `fieldset`, `legend`, `label`, `select`, `input`, `button`. Tidak ada CSS custom, kelas Tailwind, atau tag `<table>`.

---

## 7. Hasil Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus, exit code 0. |
| `npm run build` | Lulus, exit code 0, `Compiled successfully`. |
| Route `/admin/siswa/[siswaId]/pindah-kelas` | Terdaftar pada build; HTTP 200 saat diuji dengan `next start`. |
| Route `/admin/kelas/[kelasId]/pindah-kelas` | Terdaftar pada build; HTTP 200 dan judul halaman tampil. |
| Error kompilasi | Tidak ada. |
| Import Google Sheets/backend | Tidak ada. Pencarian `google`, `sheets`, `repository`, `service`, `fetch(`, `use server` pada kedua folder menghasilkan tidak ada kecocokan. |
| Operasi Spreadsheet | Tidak ada pembacaan atau penulisan. |
| Proses pemindahan backend | Tidak ada. Konfirmasi hanya mengubah state lokal. |
| Data tersimpan | Tidak ada. Tidak ada request jaringan dari form. |

Catatan: kedua route memakai markup statis; build menandai route dinamis sebagai partial prerender karena parameter URL. Ini tidak mengubah data apa pun.

---

## 8. Yang Sengaja Belum Diimplementasikan

1. **Akses data nyata.** Kedua halaman memakai konstanta ilustrasi, bukan repository. Parameter `siswaId` dan `kelasId` belum dipakai untuk mengambil data.
2. **Service pemindahan kelas.** Tidak ada orkestrasi `pending → aktif`, penutupan keanggotaan lama, atau pemrosesan batch.
3. **Server action/API route.** Tidak ada endpoint atau action.
4. **Validasi backend.** Tidak ada pemeriksaan kapasitas, duplikasi keanggotaan, status kelas, atau tanggal pada server.
5. **Audit log.** Tidak ada penulisan `audit_log`.
6. **Recovery.** Tidak ada mekanisme pemulihan untuk kegagalan sebagian.
7. **Persistensi.** Konfirmasi hanya menampilkan pratinjau lokal; tidak ada data yang dikirim atau disimpan.
8. **Hasil per siswa.** Ringkasan berhasil/gagal/dilewati belum ada karena belum ada eksekusi.
9. **Navigasi fitur.** Tombol "Pindahkan Kelas" di detail siswa dan "Pindahkan Siswa" di detail kelas belum ditambahkan.
10. **Pencarian anggota.** Pencarian dalam daftar anggota belum dibuat; hanya checkbox dan penghitung.
11. **Autentikasi pelaku.** `user_id` pelaku belum tersedia karena autentikasi belum fungsional.
12. **Loading/error state data.** Tidak diperlukan karena tidak ada pengambilan data; error boundary global tetap berlaku.

---

## 9. Kesimpulan

Kedua halaman UI statis pemindahan kelas sudah dibuat, dapat dibuka, dan lolos lint serta build. Seluruh interaksi hanya berdampak pada state lokal di browser. Tidak ada koneksi Google Spreadsheet, repository, service, API, server action, validasi backend, audit log, atau operasi pemindahan yang berjalan.
