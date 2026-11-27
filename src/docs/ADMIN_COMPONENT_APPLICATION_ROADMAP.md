# Roadmap Penerapan Komponen Reusable Admin

Status: rencana bertahap. Item yang sudah selesai ditandai `[x]`.

## Tahapan

1. `[x]` **EntitySelect** — ganti select kelas, pengajar, target kelas di:
   - `[x]` `src/app/admin/jadwal/tambah`
   - `[x]` `src/app/admin/jadwal/[jadwalId]/edit`
   - `[x]` `src/app/admin/kelas/tambah`
   - `[x]` `src/app/admin/kelas/[kelasId]/edit`
   - `[x]` `src/app/admin/kelas/[kelasId]/pindah-kelas`
   - `[x]` `src/app/admin/siswa/tambah`
   - `[x]` `src/app/admin/siswa/[siswaId]/edit`
   - `[x]` `src/app/admin/siswa/[siswaId]/pindah-kelas`
   - `[x]` `src/app/admin/absensi/tambah`

2. `[ ]` **StudentCheckboxList** — tidak berlaku untuk `src/app/admin/absensi/tambah` karena halaman memakai `select` status kehadiran per siswa, bukan checkbox.
   - `[ ]` Buat komponen reusable baru, misalnya `AttendanceStudentStatusList`, jika ingin menyeragamkan tampilan tersebut.

3. `[x]` **AdminDataTable** — ganti tabel/detail list di:
   - `[x]` `src/app/admin/absensi/[absensiId]`
   - `[x]` `src/app/admin/absensi/[absensiId]/edit` (tidak diganti karena berisi input form status/catatan per siswa)
   - `[x]` `src/app/admin/laporan/kehadiran-siswa`
   - `[x]` `src/app/admin/laporan/kehadiran-pengajar`
   - `[x]` `src/app/admin/laporan/aktivitas-kelas`
   - `[x]` `src/app/admin/laporan/rekap-pembelajaran`

4. `[x]` **StatusBadge** — ganti tampilan status akun, kelas, kehadiran, dan absensi di:
   - `[x]` halaman daftar/detail yang memakai status (absensi, users, kelas, jadwal, dan laporan)

5. `[x]` **CapacityLabel** — ganti tampilan kapasitas/limit di:
   - `[x]` `src/app/admin/kelas`
   - `[x]` `src/app/admin/kelas/[kelasId]`
   - `[x]` `src/app/admin/users`
   - `[x]` `src/app/admin/users/[userId]`

6. `[x]` **MonitoringList** — ganti daftar pemantauan di:
   - `[x]` `src/app/admin`
   - `[x]` `src/app/admin/pemantauan`

7. `[x]` **ContactHistoryList** — ganti daftar riwayat kontak di:
   - `[x]` `src/app/admin/laporan/hubungi-pengajar/[pengajarId]`
   - `[x]` `src/app/admin/pemantauan/[pemantauanId]`

8. `[x]` **ClassCard** — ganti kartu kelas di:
   - `[x]` `src/app/admin`

9. `[x]` **AttendanceCaseSummary** — ganti ringkasan kasus di:
   - `[x]` `src/app/admin/laporan/hubungi-pengajar/[pengajarId]`

10. `[x]` **AdminList** — ganti daftar sederhana di:
    - `[x]` kelas
    - `[x]` jadwal
    - `[x]` pengguna
    - `[x]` siswa
    - `[x]` jadwal aktif kelas

## Aturan pengerjaan

- Setelah tiap tahap: jalankan `npm run lint` dan `npm test`.
- Uji manual halaman yang diubah sebelum lanjut ke tahap berikutnya.
- Jangan ubah perilaku validasi, aturan bisnis, atau query data saat mengganti komponen.
- Perubahan harus bertahap agar tidak merusak halaman yang sudah berjalan.
