# Persiapan Auto-Final Penyimpanan Absensi Admin

Dokumen ini merangkum kondisi implementasi aktual, alur penyimpanan, penggunaan status `draft`/`final`, keputusan yang sudah dikonfirmasi, rencana perubahan, file yang terdampak, serta skenario pengujian. **Belum ada kode atau data yang diubah.**

## A. Kondisi implementasi saat ini (bukti kode)

### 1. Tempat status ditentukan saat membuat absensi

| Lapisan | Bukti | Perilaku |
| --- | --- | --- |
| UI | `src/app/admin/absensi/tambah/page.js:171-181` | `<select name="status_absensi" defaultValue="draft">` dengan opsi `draft` dan `final`. Admin harus memilih sendiri. |
| Server action | `src/app/admin/absensi/tambah/page.js:81` | `status_absensi: formData.get("status_absensi") \|\| "draft"` — fallback kedua ke draft. |
| Repository | `src/repositories/absensi-repository.js:36-45` | `validateCreate` mengisi `status_absensi: 'draft'` jika nilainya `undefined`. |
| Enum | `src/lib/domain-constants.js:7` | `ABSENSI_STATUSES = ['draft', 'final']`, keduanya valid. |
| Skema | `src/lib/sheet-schema.js:69-81` | Kolom `status_absensi` sudah ada di worksheet `absensi`. Tidak perlu perubahan skema Google Sheet. |
| Penulisan data | `src/repositories/sheet-table-repository.js:207-236` | `createUnlocked` memvalidasi, membuat ID, lalu `appendWorksheetRow`. Status ikut tersimpan. |

Kesimpulan: status saat ini ditentukan **oleh halaman**, dengan **fallback kedua di repository**. Tidak ada service absensi; `src/services` hanya berisi `class-transfer-service.js` dan `user-management-service.js`.

### 2. Alur server action tambah absensi

`src/app/admin/absensi/tambah/page.js:70-96`: `simpanAbsensi` → `createAbsensi(...)` → loop `createAbsensiDetail` per siswa aktif → `redirect('/admin/absensi/{id}')`. Parameter kelas dibaca di `baris 28-33`: `kelas_id` diprioritaskan, `kelasId` fallback.

### 3. Edit absensi (kode aktual terbaru)

`src/app/admin/absensi/[absensiId]/edit/page.js`:

- Server action `baris 46-77` memanggil `updateAbsensi` dengan `status_absensi: formData.get("status_absensi")` (`baris 56`).
- Select draft/final masih ada di `baris 105-110`. `validateUpdate` (`absensi-repository.js:46-60`) tidak membatasi `final → draft`.
- `recordAuditUpdate` dipanggil di `baris 67-74`.
- **Bug terkait:** jam ditampilkan sebagai teks (`baris 96`), tanpa input `name="jam_mulai"` / `name="jam_selesai"`, tetapi server action masih mengirim `formData.get("jam_mulai")` / `formData.get("jam_selesai")` (`baris 53-54`). Karena field tidak `required`, `field-validation.js:45-52` mengubah `null` menjadi `''`, lalu `buildRecord` menimpa jam tersimpan dengan kosong setiap kali edit disimpan. Sudah diverifikasi dari render: input jam tidak ada di DOM.

### 4. Tempat lain yang membuat/mengubah absensi

- Pencarian `createAbsensi|updateAbsensi|createAbsensiDetail|updateAbsensiDetail` di luar repository hanya menemukan dua halaman Admin di atas.
- Halaman Pengajar (`src/app/pengajar/kelas/[kelasId]/absensi/...`, `src/app/pengajar/absensi/page.js`) masih placeholder statis, tanpa repository absensi. Tidak ada jalur create/update dari Pengajar.

### 5. Audit

- `recordAuditCreate` tersedia (`audit-log-repository.js:143`) tetapi tidak dipanggil halaman tambah absensi.
- Halaman edit memanggil `recordAuditUpdate`, sehingga perubahan data/status tercatat.

## B. Alur penyimpanan saat ini (ringkas)

```
/admin/absensi/tambah?kelasId=KLS-0003
  → baca kelas_id / fallback kelasId
  → form select Status Absensi (default draft)
  → klik Simpan
  → simpanAbsensi: createAbsensi(status dari form || draft)
  → validateCreate (undefined → draft)
  → appendWorksheetRow('absensi')
  → createAbsensiDetail per siswa aktif → appendWorksheetRow('absensi_detail')
  → redirect ke /admin/absensi/{id}
  → jika draft: Admin buka Edit → ubah ke final → baru masuk pemantauan
```

## C. Penggunaan status `draft` / `final` di fitur lain

| Fitur | File | Perlakuan draft saat ini |
| --- | --- | --- |
| Grafik absensi dashboard | `src/app/admin/page.js:45-61` | Hitung semua `absensi_detail`, tanpa filter status |
| Tingkat Kehadiran Hari Ini | `src/app/admin/page.js:78-97` | Filter tanggal saja, tanpa filter status |
| Daftar pemantauan dashboard | `src/app/admin/page.js:119` | Hanya `final` |
| `/admin/pemantauan` | `src/app/admin/pemantauan/page.js:36` | Hanya `final`, 30 hari, ambang 3 alfa |
| Hubungi pengajar | `src/app/admin/laporan/hubungi-pengajar/[pengajarId]/page.js:71` | Hanya `final` + rentang tanggal |
| Aktivitas kelas | `src/app/admin/laporan/aktivitas-kelas/page.js` | Tanpa filter status |
| Kehadiran pengajar | `src/app/admin/laporan/kehadiran-pengajar/page.js` | Tanpa filter status |
| Kehadiran siswa | `src/app/admin/laporan/kehadiran-siswa/page.js` | Hitung dari detail, tanpa filter status |
| Rekap pembelajaran | `src/app/admin/laporan/rekap-pembelajaran/page.js` | Tanpa filter status |
| Daftar/detail absensi | `src/app/admin/absensi/page.js:94`, `[absensiId]/page.js:72` | Menampilkan status apa adanya |
| Edit absensi | `src/app/admin/absensi/[absensiId]/edit/page.js` | Select draft/final; final bisa dikembalikan ke draft |
| Halaman Pengajar | `src/app/pengajar/.../absensi/...` | Statis, tidak membaca status |

Kesimpulan: tidak ada fitur yang *membutuhkan* draft. Draft hanya menandakan "belum masuk pemantauan".

## D. Keputusan yang sudah dikonfirmasi

1. **G.1 — Diubah di repository.** Default create bukan lagi draft; status create dipaksa `final`. Alasan: tidak ada fallback diam-diam ke draft, dan halaman tidak menjadi satu-satunya penentu.
2. **G.2 — Tidak boleh ada status draft di manapun.**
   - Hapus pilihan draft/final dari tambah **dan** edit; status selalu final.
   - Hapus `'draft'` dari `ABSENSI_STATUSES` di `src/lib/domain-constants.js`.
   - Catatan risiko: `sheet-table-repository.js:101-125` memvalidasi semua baris tersimpan setiap kali data dibaca. Jika masih ada satu baris berstatus `draft`, halaman absensi/laporan/pemantauan akan error `DataIntegrityError`. Data saat ini sudah dikonfirmasi semua final, sehingga aman.
3. **G.3 — Audit create ditambahkan** pada create absensi.
4. **G.4 — Semua rekap/laporan hanya final.** Termasuk Grafik Absensi Siswa dan Tingkat Kehadiran Hari Ini di dashboard.
5. **G.5 — Tidak ada migrasi.** Semua data absensi sudah final; tidak ada draft lama yang perlu diselesaikan.
6. **G.6 — Risiko diterima.** Absensi baru langsung final dan alfa langsung dapat memicu pemantauan/hubungi pengajar dalam 30 hari.
7. **G.7 — Jam tidak boleh diedit.** Nilai jam diambil dari data tersimpan; bug penghapusan jam diperbaiki.
8. **G.8 — Dibiarkan di luar scope.** Create absensi dan detail tetap tidak atomik. Contoh kasus: `createAbsensi` menulis `ABS-0023` final, lalu loop 24 `createAbsensiDetail` gagal di siswa ke-10 → baris absensi tetap ada dengan 9 detail saja; rekap hanya menghitung 9 siswa. Tidak ada rollback karena setiap repository call langsung `appendWorksheetRow` dan lock hanya per-tabel dalam satu proses Node. Ini kondisi existing, tidak diperbaiki di perubahan ini.

## E. Rencana perubahan dan urutan implementasi

1. `src/lib/domain-constants.js` — ubah `ABSENSI_STATUSES` menjadi `['final']`.
2. `src/repositories/absensi-repository.js` — di `validateCreate`, paksa `status_absensi: 'final'`; hapus fallback draft.
3. `src/app/admin/absensi/tambah/page.js` — hapus label/select Status Absensi; kirim `status_absensi: "final"`; tambahkan `recordAuditCreate` setelah `createAbsensi` berhasil, mengikuti pola halaman tambah jadwal.
4. `src/app/admin/absensi/[absensiId]/edit/page.js` — hapus label/select Status Absensi; kirim `status_absensi: "final"`; perbaiki `jam_mulai`/`jam_selesai` agar diambil dari `before?.jam_mulai ?? absensi.jam_mulai` dan `before?.jam_selesai ?? absensi.jam_selesai`, bukan dari `formData`.
5. `src/app/admin/page.js` — filter `absensi_detail` hanya untuk absensi `final` pada grafik; filter `absensiHariIni` dengan `status_absensi === "final"`. Filter pemantauan sudah ada dan tidak diubah.
6. `src/app/admin/laporan/kehadiran-siswa/page.js` — tambahkan `listAbsensi`, bangun set ID absensi final, dan gunakan untuk memfilter `detail` sebelum menghitung per-siswa dan total.
7. `src/app/admin/laporan/rekap-pembelajaran/page.js` — filter `detail` berdasarkan set ID absensi final sebelum perhitungan `perDate` dan `totals`.
8. `src/app/admin/laporan/aktivitas-kelas/page.js` dan `kehadiran-pengajar/page.js` — filter `absensi` dengan `status_absensi === "final"` sebelum menghitung jumlah sesi.
9. Halaman Pengajar tidak diubah; tidak ada dependensi langsung.

## F. Daftar file yang diperkirakan perlu diubah

| File | Tujuan |
| --- | --- |
| `src/lib/domain-constants.js` | Enum status absensi hanya `final`. |
| `src/repositories/absensi-repository.js` | Paksa status `final` saat create; hapus fallback draft. |
| `src/app/admin/absensi/tambah/page.js` | Hapus pilihan status; kirim final; tambah audit create. |
| `src/app/admin/absensi/[absensiId]/edit/page.js` | Hapus pilihan status; paksa final; perbaiki nilai jam. |
| `src/app/admin/page.js` | Grafik & kehadiran hari ini hanya final. |
| `src/app/admin/laporan/kehadiran-siswa/page.js` | Rekap hanya detail dari absensi final. |
| `src/app/admin/laporan/rekap-pembelajaran/page.js` | Rekap hanya detail dari absensi final. |
| `src/app/admin/laporan/aktivitas-kelas/page.js` | Sesi kelas hanya absensi final. |
| `src/app/admin/laporan/kehadiran-pengajar/page.js` | Sesi pengajar hanya absensi final. |

Tidak ada perubahan skema Google Sheet, halaman Pengajar, repository baru, atau service baru.

## G. Skenario pengujian

1. Buka `/admin/absensi/tambah?kelasId=KLS-0003` → tidak ada pilihan Status Absensi.
2. Simpan absensi → detail dan daftar menampilkan `final`; baris worksheet `absensi` benar-benar `final`.
3. Pastikan tidak ada baris baru berstatus `draft` (tidak ada juga opsi draft di edit).
4. `audit_log` mencatat `create` untuk absensi baru dengan `user_id` Admin.
5. Edit absensi final: ubah topik/status kehadiran → tersimpan, **jam tidak berubah**, `audit_log` mencatat `update`.
6. Buat 3 sesi final dalam 30 hari dengan `alfa` pada siswa yang sama → muncul di `/admin/pemantauan` dan dashboard.
7. Hubungi pengajar: kasus terbentuk; tautan WA dan konfirmasi `riwayat_kontak` tetap berfungsi.
8. Cek Grafik Absensi Siswa, Tingkat Kehadiran Hari Ini, dan keempat halaman laporan → semuanya hanya menghitung absensi final.
9. Pastikan tidak ada `DataIntegrityError` saat membaca halaman mana pun (validasi enum hanya `final`).
10. Tambah absensi tanpa parameter kelas → pemilihan kelas manual tetap berjalan, status tetap final.
11. Halaman Pengajar tetap berfungsi seperti sebelumnya.

## Ringkasan

- Semua keputusan G.1–G.8 sudah dikonfirmasi.
- Perubahan mencakup enum, repository, halaman tambah/edit, dashboard, dan 4 halaman laporan.
- Tidak ada migrasi data, tidak ada perubahan Pengajar, tidak ada perubahan skema Sheet.
- Dokumen ini: `src/docs/ADMIN_ATTENDANCE_AUTO_FINAL_PREPARATION.md`.
