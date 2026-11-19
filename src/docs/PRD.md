# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## SISTEM ABSENSI SEKOLAH TERPUSAT

**Project ID:** PRJ-2026-RND-001-V01  
**Versi:** 2.0  
**Tanggal:** 19 November 2026  
**Status:** Spesifikasi produk  
**Status Implementasi:** Tahap 6 sedang berjalan  
**Bahasa:** Indonesia

---

# 1. PENDAHULUAN

## 1.1 Latar Belakang

Sekolah membutuhkan sistem absensi terpusat yang dapat digunakan administrator dan guru untuk mengelola kehadiran siswa secara digital.

Sistem menyediakan akses bagi siswa, orang tua, dan masyarakat untuk melihat informasi kehadiran yang diizinkan tanpa harus memiliki akun.

Aplikasi dirancang agar mudah digunakan melalui smartphone, memiliki pembatasan akses berdasarkan peran, menyimpan riwayat perubahan, serta memungkinkan migrasi database pada masa mendatang.

## 1.2 Tujuan Produk

1. Memusatkan pengelolaan absensi sekolah.
2. Mempermudah guru melakukan pencatatan kehadiran.
3. Mempermudah administrator mengelola data sekolah.
4. Menyediakan informasi kehadiran yang dapat diakses publik.
5. Membantu guru mengidentifikasi siswa dengan ketidakhadiran Alpa berulang.
6. Menyediakan statistik kehadiran untuk administrator dan guru.
7. Mempertahankan riwayat data siswa, kelas, penugasan, dan absensi.
8. Menyiapkan arsitektur yang memungkinkan migrasi Google Sheets ke PostgreSQL.

---

# 2. RUANG LINGKUP PRODUK

## 2.1 Fitur yang Termasuk

- Autentikasi administrator dan guru.
- Manajemen pengguna.
- Manajemen siswa.
- Manajemen kelas.
- Perhitungan tahun ajaran otomatis.
- Manajemen keanggotaan siswa dalam kelas.
- Manajemen penugasan guru.
- Pembuatan dan pengelolaan absensi.
- Informasi lokasi pelaksanaan pembelajaran.
- Informasi materi pelajaran.
- Audit perubahan absensi.
- Dashboard administrator.
- Dashboard guru.
- Halaman publik untuk pencarian absensi siswa.
- Daftar perhatian kehadiran.
- Persiapan pesan WhatsApp.
- Statistik kehadiran.
- Pengelolaan informasi sekolah.
- Backup dan pemulihan data.

## 2.2 Fitur yang Tidak Termasuk

Hal-hal berikut tidak menjadi bagian dari ruang lingkup awal:

- Pengiriman WhatsApp otomatis melalui WhatsApp Business API.
- Sistem pendaftaran akun publik.
- Penghapusan permanen data siswa, guru, kelas, dan pengguna.
- Sistem pembayaran sekolah.
- Sistem penilaian akademik.
- Sistem pengelolaan jadwal pelajaran otomatis.
- Aplikasi native Android atau iOS.
- Migrasi langsung ke PostgreSQL pada implementasi pertama.
- Pengelolaan tahun ajaran secara manual.

---

# 3. PENGGUNA DAN HAK AKSES

Sistem memiliki tiga kategori pengguna.

## 3.1 Administrator

Administrator memiliki kewenangan untuk:

- Mengelola informasi sekolah.
- Mengelola pengguna.
- Mengelola data guru.
- Mengelola data siswa.
- Mengelola kelas.
- Mengelola keanggotaan siswa.
- Mengelola penugasan guru.
- Melihat seluruh absensi.
- Mengedit dan menghapus absensi.
- Melihat audit log.
- Melihat dashboard dan statistik seluruh kelas.

Tahun ajaran tidak dikelola secara manual oleh administrator.

## 3.2 Guru

Guru memiliki kewenangan untuk:

- Melihat dashboard kelas yang menjadi tanggung jawabnya.
- Membuat absensi kelas yang menjadi tanggung jawabnya.
- Melihat absensi yang dibuatnya.
- Mengedit absensi yang dibuatnya sendiri.
- Mengubah status kehadiran siswa.
- Memperbarui lokasi dan materi pembelajaran.
- Melihat daftar perhatian kehadiran.
- Menyiapkan pesan WhatsApp untuk orang tua siswa.
- Melihat statistik kelas yang menjadi tanggung jawabnya.

Guru tidak memiliki akses untuk mengelola kelas lain atau absensi yang dibuat guru lain.

Setiap permintaan backend tetap diperiksa berdasarkan penugasan dan kepemilikan sesi absensi.

## 3.3 Publik

Publik terdiri dari:

- Siswa.
- Orang tua.
- Keluarga siswa.
- Masyarakat umum.

Publik dapat mencari siswa berdasarkan nama dan melihat riwayat absensi yang diizinkan.

Publik tidak membutuhkan login.

---

# 4. AUTENTIKASI DAN OTORISASI

## 4.1 Mekanisme Login

- Administrator dan guru login menggunakan Google OAuth.
- Authentication menggunakan Auth.js.
- Tidak ada pendaftaran akun mandiri.
- Akun harus terdaftar di tabel Users.
- Akun inactive tidak dapat mengakses sistem.

## 4.2 Identitas Pengguna

Identitas Google menggunakan nilai `sub` sebagai `auth_user_id`.

Email tidak digunakan sebagai identitas utama karena dapat berubah.

Backend mencocokkan identitas Google dengan data pengguna yang tersimpan.

## 4.3 Administrator Pertama

Administrator pertama dibuat melalui proses bootstrap atau seeding yang aman.

Setelah administrator pertama berhasil dibuat, mekanisme bootstrap harus dinonaktifkan.

## 4.4 Keamanan

- Hak akses diperiksa di backend.
- Frontend tidak menentukan hak akses.
- Role dan status akun berasal dari database.
- Service Account Google hanya digunakan di backend.
- Kredensial tidak boleh dikirim ke frontend.
- Akun inactive tidak boleh mengakses halaman dan layanan yang dilindungi.

---

# 5. KEBUTUHAN FUNGSIONAL

## 5.1 Manajemen Informasi Sekolah

Administrator dapat mengelola:

- Nama sekolah.
- Alamat sekolah.
- Nomor telepon.
- Email sekolah.
- Logo sekolah.
- Nama kepala sekolah.

Ketentuan:

- School_Information hanya memiliki satu baris data.
- Hanya administrator yang dapat mengubah informasi sekolah.
- Informasi tahun ajaran aktif tidak disimpan di School_Information.

## 5.2 Perhitungan Tahun Ajaran Otomatis

Tahun ajaran ditentukan secara otomatis berdasarkan tanggal kalender dengan zona waktu Asia/Jakarta.

Ketentuan:

1. Tahun ajaran dimulai pada 1 Juli.
2. Tahun ajaran berakhir pada 30 Juni tahun berikutnya.
3. Sistem menghitung tahun ajaran berdasarkan tanggal absensi.
4. Tidak ada proses pembuatan tahun ajaran secara manual.
5. Tidak ada proses aktivasi atau deaktivasi tahun ajaran.
6. Tidak diperlukan tabel Academic_Years.
7. Pergantian tanggal 30 Juni ke 1 Juli berlangsung otomatis berdasarkan perhitungan tanggal.

Contoh:

| Tanggal          | Tahun Ajaran |
| ---------------- | ------------ |
| 30 Juni 2026     | 2025/2026    |
| 1 Juli 2026      | 2026/2027    |
| 19 November 2026 | 2026/2027    |
| 30 Juni 2027     | 2026/2027    |
| 1 Juli 2027      | 2027/2028    |

Format identifier tahun ajaran:

`YYYY/YYYY`

Contoh:

`2026/2027`

Identifier tersebut disimpan pada Attendance_Sessions melalui kolom `academic_year_id`.

Nilai tahun ajaran harus dihitung berdasarkan `attendance_date`, bukan tanggal saat data dibaca atau laporan dibuka.

## 5.3 Manajemen Pengguna dan Guru

Administrator dapat:

- Menambahkan pengguna.
- Mengubah informasi pengguna.
- Mengaktifkan pengguna.
- Menonaktifkan pengguna.
- Menetapkan role Administrator atau Guru.

Pengguna tidak boleh dihapus permanen.

## 5.4 Manajemen Penugasan Guru

Ketentuan:

1. Satu kelas hanya memiliki satu guru penanggung jawab pada waktu yang sama.
2. Satu guru maksimal bertanggung jawab atas dua kelas secara bersamaan.
3. Guru yang sudah menangani dua kelas tidak dapat menerima penugasan baru yang menyebabkan jumlah penugasan aktif melebihi dua.
4. Guru inactive tidak dapat menerima penugasan baru.
5. Penugasan menggunakan effective dates.
6. Riwayat penugasan tidak boleh ditimpa.
7. Penugasan tidak dibatasi oleh periode tahun ajaran.
8. Penugasan dapat berlangsung melewati pergantian tahun ajaran.

`effective_to` merupakan tanggal akhir yang inklusif.

## 5.5 Manajemen Siswa

Data siswa:

- student_id
- student_number
- full_name
- gender
- parent_name
- parent_relation
- parent_whatsapp
- student_status
- created_at
- updated_at

Ketentuan:

- student_id bersifat permanen.
- student_number bersifat opsional.
- student_number dapat berubah.
- Nama orang tua wajib diisi.
- Hubungan orang tua wajib diisi.
- Nomor WhatsApp wajib diisi.
- Nomor WhatsApp disimpan dalam format internasional tanpa tanda plus.
- Satu nomor WhatsApp boleh digunakan oleh beberapa siswa bersaudara.

Status siswa:

- active
- inactive
- graduated
- transferred

Data siswa tidak dapat dihapus permanen.

Perubahan informasi kontak orang tua dicatat melalui Student_Contact_Logs sesuai kebutuhan riwayat komunikasi.

## 5.6 Manajemen Kelas

Administrator dapat:

- Membuat kelas.
- Mengubah nama kelas.
- Mengaktifkan kelas.
- Menonaktifkan kelas.

Ketentuan:

1. Kelas tidak terikat pada tahun ajaran tertentu.
2. class_id bersifat permanen dan stabil.
3. Kelas yang sama dapat digunakan kembali pada tahun ajaran berikutnya.
4. Nama kelas harus unik.
5. Kelas tidak dapat dihapus permanen.
6. Perubahan status kelas tidak menghapus riwayat kelas dan absensi.

## 5.7 Keanggotaan Siswa dalam Kelas

Hubungan siswa dan kelas disimpan dalam Class_Members.

Ketentuan:

- Menggunakan effective dates.
- Riwayat kelas siswa dipertahankan.
- Satu siswa tidak boleh memiliki keanggotaan kelas yang bertumpang tindih.
- Perpindahan kelas tidak mengubah student_id.
- Keanggotaan lama ditutup dan keanggotaan baru dibuat.
- Periode keanggotaan dapat melewati pergantian tahun ajaran.
- Riwayat keanggotaan tidak boleh ditimpa.

## 5.8 Kenaikan dan Perpindahan Kelas

Kenaikan kelas dilakukan melalui perubahan keanggotaan siswa.

Alur:

1. Administrator memilih kelas asal.
2. Sistem menampilkan siswa yang masih menjadi anggota kelas tersebut.
3. Administrator memilih kelas tujuan.
4. Sistem menampilkan daftar siswa dan perubahan yang akan dilakukan.
5. Administrator dapat mengubah tujuan masing-masing siswa.
6. Sistem menampilkan preview.
7. Administrator melakukan konfirmasi.
8. Sistem menutup keanggotaan lama.
9. Sistem membuat keanggotaan baru.
10. Sistem mempertahankan seluruh riwayat sebelumnya.

Ketentuan teknis:

- student_id tetap sama.
- Membership lama ditutup pada tanggal yang sesuai.
- Membership baru dimulai pada tanggal efektif perpindahan.
- Tidak boleh ada periode keanggotaan yang bertumpang tindih.
- Kegagalan operasi tidak boleh meninggalkan perubahan sebagian.

Proses kenaikan kelas tidak memerlukan pembuatan kelas baru apabila kelas tujuan sudah tersedia.

## 5.9 Pembuatan Absensi

Status absensi:

- Hadir
- Sakit
- Izin
- Alpa

Ketentuan:

1. Guru membuat absensi pada tanggal pertemuan yang benar-benar berlangsung.
2. Tanggal absensi ditentukan otomatis oleh backend.
3. Zona waktu menggunakan Asia/Jakarta.
4. Guru tidak memilih tanggal absensi secara manual.
5. Maksimal satu sesi absensi untuk kombinasi guru dan kelas dalam satu minggu kalender.
6. Minggu kalender dihitung dari Senin sampai Minggu.
7. Pergeseran jadwal pertemuan diperbolehkan berdasarkan kesepakatan guru dan sekolah.
8. Jika pertemuan pada jadwal biasa tidak berlangsung, guru dapat membuat absensi pada tanggal pengganti.
9. Tidak diperlukan pencatatan pembatalan apabila tidak ada sesi absensi yang dibuat.
10. Sesi kedua untuk guru dan kelas yang sama dalam minggu kalender yang sama tidak diperbolehkan.
11. Semua siswa yang termasuk dalam keanggotaan kelas pada tanggal pertemuan menjadi dasar pembuatan absensi.
12. Semua siswa secara default berstatus Hadir.
13. Guru mengubah status siswa yang tidak hadir.
14. Data baru disimpan setelah proses dikonfirmasi.
15. Formulir yang belum disimpan tidak menghasilkan record absensi.

Pemeriksaan batas minggu menggunakan zona waktu Asia/Jakarta:

- Awal minggu: Senin pukul 00.00.
- Akhir minggu: Minggu pukul 23.59.59.

Identitas sesi absensi harus mempertimbangkan:

- teacher_user_id
- class_id
- Minggu kalender berdasarkan attendance_date

## 5.10 Lokasi Pelaksanaan Pembelajaran

Setiap Attendance_Sessions menyimpan informasi lokasi pembelajaran.

Kolom:

- location_name
- location_note

Ketentuan:

1. Lokasi dapat berupa ruang kelas.
2. Lokasi dapat berupa tempat lain di dalam area sekolah.
3. Lokasi dapat berupa tempat di luar area sekolah.
4. location_name menyimpan nama lokasi.
5. location_note menyimpan keterangan tambahan apabila diperlukan.
6. Lokasi dapat diubah setelah sesi absensi dibuat.
7. Perubahan lokasi harus dicatat dalam Attendance_Audit_Logs.

Contoh:

- Ruang Kelas 1.
- Laboratorium Komputer.
- Perpustakaan.
- Lapangan Sekolah.
- Rumah Siswa.
- Lokasi kegiatan di luar sekolah.

## 5.11 Materi Pelajaran

Setiap Attendance_Sessions menyimpan informasi materi pembelajaran melalui kolom `lesson_material`.

Ketentuan:

1. Guru mengisi materi yang diajarkan pada pertemuan tersebut.
2. Materi dapat berbeda pada setiap pertemuan.
3. Materi dapat diperbarui setelah absensi dibuat.
4. Perubahan materi harus dicatat dalam Attendance_Audit_Logs.
5. Materi pelajaran merupakan bagian dari riwayat kegiatan pembelajaran.

Contoh:

| Pertemuan | Materi                              |
| --------- | ----------------------------------- |
| Minggu 1  | Belajar komputer Microsoft Word     |
| Minggu 2  | Belajar mencetak dokumen ke printer |
| Minggu 3  | Membuat dan menyimpan dokumen       |
| Minggu 4  | Latihan pengolahan dokumen          |

## 5.12 Pengeditan Absensi

- Guru dapat mengedit absensi yang dibuatnya sendiri.
- Administrator dapat mengedit seluruh absensi.
- Pengeditan menggunakan session_id yang sama.
- Tidak ada batas waktu pengeditan yang disepakati.
- Status kehadiran siswa dapat dikoreksi berkali-kali.
- Lokasi pembelajaran dapat diubah.
- Materi pelajaran dapat diubah.
- Setiap perubahan harus dicatat dalam Attendance_Audit_Logs.
- Audit menyimpan data sebelum dan sesudah perubahan.
- Jika audit gagal disimpan, perubahan tidak boleh dinyatakan berhasil.

## 5.13 Penghapusan Absensi

Hanya data absensi yang boleh dihapus permanen sesuai prosedur.

Prosedur:

1. Pengguna memilih penghapusan absensi.
2. Sistem menampilkan konfirmasi penghapusan permanen.
3. Pengguna memasukkan alasan.
4. Sistem meminta konfirmasi sesuai prosedur.
5. Sistem menyimpan audit.
6. Setelah audit berhasil, sesi dan seluruh record siswa dihapus.

Penghapusan harus konsisten.

Jika audit gagal, penghapusan tidak dilanjutkan.

Penghapusan permanen tidak berlaku untuk data siswa, pengguna, kelas, dan riwayat administratif.

## 5.14 Audit Absensi

Attendance_Audit_Logs mencatat:

- Perubahan status kehadiran siswa.
- Perubahan lokasi pembelajaran.
- Perubahan keterangan lokasi.
- Perubahan materi pelajaran.
- Penghapusan sesi absensi.
- Penghapusan record kehadiran siswa.

Ketentuan:

1. Setiap koreksi status harus menghasilkan catatan audit.
2. Koreksi dapat dilakukan berkali-kali.
3. Setiap perubahan menyimpan snapshot data sebelum dan sesudah perubahan.
4. Audit menyimpan actor_user_id.
5. Audit menyimpan alasan perubahan apabila diwajibkan.
6. Audit tidak boleh diubah atau dihapus melalui aplikasi.
7. Audit penghapusan harus tersimpan sebelum data absensi dihapus.

ID sesi dan record dalam audit bersifat historis agar audit tetap tersedia setelah data absensi dihapus.

## 5.15 Halaman Publik

URL publik direncanakan menggunakan:

`/kehadiran`

Fitur:

- Pencarian berdasarkan nama siswa.
- Mendukung pencarian sebagian nama.
- Menampilkan seluruh hasil jika terdapat nama yang sama.
- Menampilkan kelas dan guru penanggung jawab sesuai informasi yang diizinkan.
- Menampilkan riwayat absensi.
- Menampilkan rekap Hadir, Sakit, Izin, dan Alpa.
- Menampilkan lokasi dan materi pembelajaran apabila ditetapkan sebagai informasi publik.

Periode:

- Default 30 hari terakhir.
- Pengguna dapat memilih periode yang tersedia.
- Riwayat dapat difilter berdasarkan tahun ajaran.

Informasi publik tidak boleh mencakup:

- Nomor WhatsApp.
- Data autentikasi.
- Informasi sensitif orang tua.
- Informasi administratif internal.

Siswa dengan status graduated atau transferred tetap dapat dicari untuk melihat riwayat kehadiran.

Tidak adanya sesi absensi bukan berarti siswa Alpa.

URL publik dapat dibagikan dan menggunakan query parameters untuk mempertahankan pencarian serta periode.

## 5.16 Daftar Perhatian Kehadiran

Dashboard guru memiliki halaman Daftar Perhatian Kehadiran.

Ketentuan:

- Menampilkan siswa dengan minimal 3 Alpa dalam 30 hari berjalan.
- Data dihitung secara dinamis dari Attendance_Records.
- Jika jumlah Alpa turun di bawah 3, siswa tidak lagi ditampilkan.
- Jika jumlah Alpa mencapai 3, siswa ditampilkan.

Informasi:

- Nama siswa.
- Kelas.
- Jumlah Alpa.
- Aksi menyiapkan laporan.

## 5.17 Integrasi WhatsApp

Guru dapat menyiapkan pesan WhatsApp untuk orang tua siswa.

Sapaan:

- Hubungan Ibu: Ibu [nama].
- Hubungan Ayah: Bapak [nama].

Pesan memuat tautan halaman publik siswa.

Sistem membuka WhatsApp dengan pesan yang sudah disiapkan.

Pengiriman tetap dilakukan secara manual oleh guru.

Sistem tidak boleh menyatakan pesan terkirim atau dibaca tanpa konfirmasi.

Aktivitas disimpan di Student_Contact_Logs dengan status:

- prepared
- whatsapp_open_requested

## 5.18 Dashboard Administrator

Menampilkan statistik seluruh kelas aktif.

Statistik dapat difilter berdasarkan periode dan tahun ajaran.

Grafik:

- Komposisi Hadir, Sakit, Izin, dan Alpa.
- Tren kehadiran.
- Perbandingan antar kelas.
- Ringkasan masing-masing kelas.

## 5.19 Dashboard Guru

Menampilkan statistik kelas yang menjadi tanggung jawab guru.

Guru maksimal memiliki dua kelas yang ditugaskan secara bersamaan.

Grafik:

- Komposisi Hadir, Sakit, Izin, dan Alpa.
- Tren kehadiran.
- Ringkasan per kelas.

## 5.20 Aturan Perhitungan Statistik

- Data dihitung dari sesi dan record absensi yang tersimpan.
- Hari tanpa sesi tidak dihitung sebagai Alpa.
- Denominator menggunakan jumlah Attendance_Records yang valid.
- Statistik dapat difilter berdasarkan tahun ajaran.
- Tahun ajaran setiap sesi mengikuti academic_year_id yang tersimpan pada saat sesi dibuat.
- Riwayat tahun ajaran tidak berubah ketika tahun ajaran berjalan berganti.

Endpoint yang direncanakan:

- GET /api/dashboard/admin
- GET /api/dashboard/teacher

---

# 6. STRUKTUR DATABASE

Sistem menggunakan 11 tabel.

| No. | Tabel                     | Fungsi               |
| --- | ------------------------- | -------------------- |
| 1   | Users                     | Pengguna sistem      |
| 2   | Students                  | Data siswa           |
| 3   | Classes                   | Data kelas           |
| 4   | Class_Members             | Keanggotaan siswa    |
| 5   | Teacher_Assignments       | Penugasan guru       |
| 6   | Attendance_Sessions       | Sesi absensi         |
| 7   | Attendance_Records        | Data kehadiran siswa |
| 8   | Attendance_Audit_Logs     | Audit absensi        |
| 9   | Student_Contact_Logs      | Riwayat komunikasi   |
| 10  | School_Information        | Informasi sekolah    |
| 11  | Administrative_Audit_Logs | Audit administrasi   |

Tidak terdapat tabel Academic_Years.

## 6.1 Primary Key

- Users.user_id
- Students.student_id
- Classes.class_id
- Class_Members.membership_id
- Teacher_Assignments.assignment_id
- Attendance_Sessions.session_id
- Attendance_Records.attendance_id
- Attendance_Audit_Logs.audit_id
- Student_Contact_Logs.contact_log_id
- School_Information.school_id
- Administrative_Audit_Logs.admin_audit_id

## 6.2 Relasi Utama

- Users 1:N Teacher_Assignments.
- Users 1:N Attendance_Sessions.
- Users 1:N Attendance_Audit_Logs.
- Users 1:N Student_Contact_Logs.
- Users 1:N Administrative_Audit_Logs.
- Students 1:N Class_Members.
- Students 1:N Attendance_Records.
- Students 1:N Student_Contact_Logs.
- Classes 1:N Class_Members.
- Classes 1:N Teacher_Assignments.
- Classes 1:N Attendance_Sessions.
- Attendance_Sessions 1:N Attendance_Records.
- Class_Members 1:N Attendance_Records.

academic_year_id pada Attendance_Sessions merupakan identifier hasil perhitungan otomatis, bukan foreign key ke tabel Academic_Years.

Attendance_Audit_Logs menyimpan ID sesi dan record secara historis agar audit tetap tersedia setelah data absensi dihapus.

## 6.3 Constraint Penting

- UNIQUE Users.auth_user_id.
- UNIQUE Users.username.
- UNIQUE Classes.class_name.
- UNIQUE Attendance_Records(session_id, student_id).
- Maksimal satu sesi untuk kombinasi teacher_user_id dan class_id dalam satu minggu kalender.
- Effective date membership tidak boleh tumpang tindih.
- Effective date penugasan harus memenuhi aturan satu guru per kelas.
- Satu guru maksimal memiliki dua penugasan kelas yang aktif secara bersamaan.

Validasi konsistensi relasi dilakukan backend pada Google Sheets.

PostgreSQL nantinya dapat memperkuat integritas melalui foreign key, unique constraint, dan constraint tambahan.

---

# 7. PERSYARATAN ANTARMUKA

## 7.1 Pendekatan Mobile First

Aplikasi mengutamakan smartphone.

Ketentuan:

- Data ditampilkan dalam daftar vertikal.
- Menghindari tabel HTML tradisional sebagai tampilan utama.
- Tidak mengandalkan horizontal scrolling.
- Navigasi mudah digunakan.
- Formulir absensi mudah digunakan pada smartphone.
- Grafik responsif.
- Tampilan tablet dan desktop menyesuaikan setelah pengalaman mobile terpenuhi.

## 7.2 Komponen Reusable

Komponen dibuat sesuai kebutuhan implementasi, bukan seluruhnya sekaligus.

Contoh komponen:

- DataList.
- SelectableList.
- AttendanceList.
- AttendanceForm.
- DetailView.
- Form.
- Dialog.
- Navigation.
- AttendanceSummary.
- AttendanceChart.
- AttendanceTrendChart.

## 7.3 Kebijakan Styling

Tahap awal tidak menggunakan styling tambahan sebelum fungsi utama selesai dan mendapatkan persetujuan pemilik proyek.

---

# 8. PERSYARATAN NONFUNGSIONAL

## 8.1 Keamanan

- Autentikasi Google OAuth.
- Otorisasi berdasarkan role dan penugasan.
- Validasi backend.
- Perlindungan kredensial.
- Pemisahan akses publik dan internal.
- Audit perubahan data.
- Tidak mengekspos data sensitif.

## 8.2 Konsistensi Data

Google Sheets tidak menyediakan transaksi dan foreign key seperti database relasional.

Backend wajib menangani:

- Validasi relasi.
- Pencegahan duplikasi.
- Penguncian operasi yang diperlukan.
- Idempotency.
- Pemeriksaan hasil penyimpanan.
- Pemulihan kegagalan operasi multi-sheet.
- Konsistensi penyimpanan data dan audit.

## 8.3 Performa

- Menghindari pembacaan spreadsheet yang tidak diperlukan.
- Menggunakan pagination untuk daftar besar.
- Menerapkan pencarian dan filter di backend.
- Menghindari permintaan API berulang untuk setiap siswa.
- Menggunakan batch operation jika sesuai.

## 8.4 Penanganan Error

Sistem harus menampilkan pesan yang dapat dipahami pengguna.

Sistem tidak boleh mengklaim penyimpanan berhasil ketika operasi gagal.

Log internal tidak boleh memuat kredensial atau informasi rahasia.

## 8.5 Backup

- Backup harian.
- Backup sebelum perubahan besar.
- Backup sebelum migrasi database.
- Validasi data setelah pemulihan.
- Pemulihan dilakukan terlebih dahulu pada salinan.

---

# 9. TEKNOLOGI DAN ARSITEKTUR

| Komponen            | Teknologi             |
| ------------------- | --------------------- |
| Frontend            | Next.js 16 App Router |
| Backend             | Next.js Server-side   |
| Bahasa              | JavaScript            |
| Authentication      | Auth.js               |
| OAuth               | Google OAuth          |
| Database awal       | Google Sheets         |
| Integrasi database  | Google Sheets API     |
| Hosting             | Vercel                |
| Repository          | GitHub                |
| Database berikutnya | PostgreSQL            |

## 9.1 Arsitektur

Arsitektur menggunakan pemisahan tanggung jawab:

1. Next.js App Router.
2. Authentication dan Authorization.
3. Validation.
4. Business Logic / Services.
5. Repository.
6. Database Adapter.

Frontend tidak boleh mengakses Google Sheets API secara langsung.

## 9.2 Repository Pattern

Setiap tabel memiliki repository tersendiri sesuai kebutuhan.

Repository Google Sheets dan PostgreSQL harus dapat mengikuti kontrak fungsi yang sama.

Business logic tidak boleh bergantung langsung pada implementasi database tertentu.

---

# 10. MIGRASI DATABASE

Migrasi ke PostgreSQL harus mempertahankan:

- Seluruh ID.
- Seluruh data.
- Riwayat siswa.
- Riwayat kelas.
- Riwayat penugasan guru.
- Riwayat absensi.
- Informasi lokasi dan materi pembelajaran.
- Audit log.
- Relasi antartabel.
- Identifier tahun ajaran pada sesi absensi.
- Aturan bisnis.

Urutan migrasi mengikuti ketergantungan relasi.

Setelah migrasi:

1. Validasi jumlah record.
2. Validasi ID.
3. Validasi foreign key.
4. Validasi effective dates.
5. Validasi aturan satu pertemuan per minggu.
6. Bandingkan statistik.
7. Uji seluruh fungsi.
8. Alihkan database melalui konfigurasi.

Hindari dual-write selama proses perpindahan.

---

# 11. DEPLOYMENT

## 11.1 GitHub

Repository GitHub menjadi tempat penyimpanan source code.

## 11.2 Vercel

Repository dihubungkan ke Vercel.

Setiap push ke branch production memicu build dan deployment otomatis sesuai konfigurasi.

## 11.3 Environment Variables

Konfigurasi penting:

- NODE_ENV.
- AUTH_SECRET.
- AUTH_GOOGLE_ID.
- AUTH_GOOGLE_SECRET.
- GOOGLE_SHEETS_SPREADSHEET_ID.
- GOOGLE_SERVICE_ACCOUNT_EMAIL.
- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.
- SCHOOL_TIMEZONE.
- APP_BASE_URL.

Nilai rahasia disimpan di konfigurasi Vercel, bukan di GitHub.

---

# 12. PENGUJIAN DAN KRITERIA PENERIMAAN

Pengujian mencakup:

- Unit Testing.
- Integration Testing.
- End-to-End Testing.
- Regression Testing.
- Pengujian keamanan.
- Pengujian integritas data.
- Pengujian Mobile First.

## 12.1 Kriteria Penerimaan Utama

Aplikasi dinyatakan siap digunakan apabila:

1. Administrator dan guru dapat login dengan benar.
2. Dashboard guru hanya menampilkan kelas tanggung jawabnya.
3. Administrator dapat mengelola data sekolah.
4. Tahun ajaran dihitung otomatis berdasarkan tanggal.
5. Kelas dapat digunakan lintas tahun ajaran.
6. Riwayat keanggotaan siswa dipertahankan.
7. Satu guru tidak dapat memiliki lebih dari dua penugasan kelas aktif secara bersamaan.
8. Guru dapat membuat absensi kelas yang menjadi tanggung jawabnya.
9. Satu guru dan kelas tidak dapat memiliki dua sesi dalam satu minggu kalender.
10. Pertemuan dapat dilaksanakan pada hari pengganti berdasarkan kesepakatan.
11. Lokasi pembelajaran tersimpan dengan benar.
12. Materi pembelajaran tersimpan dengan benar.
13. Status kehadiran dapat dikoreksi berkali-kali.
14. Perubahan status, lokasi, dan materi tercatat dalam audit.
15. Penghapusan absensi mengikuti prosedur dan hak akses.
16. Halaman publik berfungsi tanpa membocorkan data sensitif.
17. Daftar perhatian kehadiran menghitung Alpa dengan benar.
18. Persiapan pesan WhatsApp berjalan.
19. Dashboard menampilkan statistik yang benar.
20. Tampilan dapat digunakan dengan baik pada smartphone.
21. Backup dan pemulihan dapat diuji.
22. Deployment production berhasil.

---

# 13. TAHAPAN IMPLEMENTASI

Tahapan implementasi proyek:

| Tahap | Pekerjaan                                    |
| ----- | -------------------------------------------- |
| 1     | Persiapan proyek dan lingkungan pengembangan |
| 2     | Persiapan Google Sheets dan Service Account  |
| 3     | Fondasi backend dan repository               |
| 4     | Authentication dan Authorization             |
| 5     | Manajemen pengguna                           |
| 6     | Manajemen kelas dan penugasan guru           |
| 7     | Manajemen siswa dan keanggotaan kelas        |
| 8     | Modul absensi dan audit                      |
| 9     | Halaman publik, laporan, dan WhatsApp        |
| 10    | Pengujian akhir, finalisasi, dan deployment  |

Status implementasi pada tanggal dokumen ini:

- Tahap 1–5: Selesai.
- Tahap 6: Sedang berjalan.
- Tahap 7–10: Belum dimulai.

Status tersebut merupakan catatan progres proyek, bukan pernyataan bahwa seluruh fitur sudah selesai atau telah diuji.

---

# 14. HAL YANG MASIH PERLU DITENTUKAN

Hal teknis yang masih dapat ditetapkan selama implementasi:

1. Mekanisme penguncian dan pemulihan operasi multi-sheet pada Google Sheets.
2. Kebijakan retensi backup dan jumlah salinan yang disimpan.
3. Detail desain visual setelah tahap styling dimulai.
4. Detail penyajian informasi lokasi dan materi pada halaman publik.

Hal-hal tersebut tidak mengubah keputusan bisnis yang telah disepakati.

---

# 15. PRINSIP PENGEMBANGAN

Selama implementasi:

- Utamakan fungsi sebelum styling.
- Gunakan JavaScript.
- Jangan menambahkan tabel tanpa persetujuan.
- Jangan mengubah aturan bisnis tanpa persetujuan.
- Hindari library dan abstraksi yang tidak diperlukan.
- Kerjakan satu modul sampai berfungsi dan diuji.
- Jelaskan kendala relasi data sebelum mengambil keputusan.
- Jangan membuat fitur tambahan di luar ruang lingkup tanpa persetujuan.
- Pertahankan konsistensi antara PRD, DATABASE.md, dan implementasi kode.
- Jangan melakukan migrasi atau perubahan data produksi tanpa rencana dan backup.

---

# 16. STATUS DOKUMEN

**PRD versi 2.0**

Dokumen ini menjadi acuan kebutuhan produk Sistem Absensi Sekolah Terpusat.

Perubahan terhadap kebutuhan produk harus dicatat sebagai revisi spesifikasi agar tidak terjadi perbedaan antara kesepakatan dan implementasi.

Status proyek:

- PRD versi 2.0: Disiapkan.
- DATABASE.md versi 2.0: Disiapkan.
- Tahap implementasi: Tahap 6 sedang berjalan.

Dokumen ini harus diselaraskan dengan DATABASE.md dan dokumen arsitektur sebelum implementasi akhir.
