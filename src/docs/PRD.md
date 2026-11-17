# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## SISTEM ABSENSI SEKOLAH TERPUSAT

**Identitas Dokumen**

| Informasi           | Keterangan                      |
| ------------------- | ------------------------------- |
| Project ID          | PRJ-2026-RND-001-V01            |
| Nama Produk         | Sistem Absensi Sekolah Terpusat |
| Dokumen             | Product Requirements Document   |
| Versi               | 1.0                             |
| Tanggal             | 17 November 2026                |
| Status              | Finalisasi spesifikasi produk   |
| Status Implementasi | Belum dimulai                   |
| Bahasa              | Indonesia                       |

---

# 1. PENDAHULUAN

## 1.1 Latar Belakang

Sekolah membutuhkan sistem absensi terpusat yang dapat digunakan administrator dan guru untuk mengelola kehadiran siswa secara digital.

Sistem harus menyediakan akses bagi siswa, orang tua, dan masyarakat untuk melihat informasi kehadiran tanpa harus memiliki akun.

Aplikasi dirancang agar mudah digunakan melalui smartphone, memiliki pembatasan akses berdasarkan peran, menyimpan riwayat perubahan, serta memungkinkan migrasi database pada masa mendatang.

## 1.2 Tujuan Produk

1. Memusatkan pengelolaan absensi sekolah.
2. Mempermudah guru melakukan pencatatan kehadiran.
3. Mempermudah administrator mengelola data sekolah.
4. Menyediakan informasi kehadiran yang dapat diakses publik.
5. Membantu guru mengidentifikasi siswa dengan ketidakhadiran Alpa berulang.
6. Menyediakan statistik kehadiran untuk administrator dan guru.
7. Mempertahankan riwayat data siswa, kelas, penugasan, dan absensi.
8. Menyiapkan arsitektur yang memungkinkan migrasi Google Spreadsheet ke PostgreSQL.

# 2. RUANG LINGKUP PRODUK

## 2.1 Fitur yang Termasuk

- Autentikasi administrator dan guru.
- Manajemen pengguna.
- Manajemen siswa.
- Manajemen kelas.
- Manajemen tahun ajaran.
- Manajemen keanggotaan siswa dalam kelas.
- Manajemen penugasan guru.
- Pembuatan dan pengelolaan absensi.
- Audit perubahan dan penghapusan absensi.
- Dashboard administrator.
- Dashboard guru.
- Halaman publik untuk pencarian absensi siswa.
- Daftar perhatian kehadiran.
- Persiapan pesan WhatsApp.
- Statistik dan grafik kehadiran.
- Pengelolaan informasi sekolah.
- Backup dan pemulihan data.

## 2.2 Fitur yang Tidak Termasuk

Hal-hal berikut tidak menjadi bagian dari ruang lingkup awal:

- Pengiriman WhatsApp otomatis melalui WhatsApp Business API.
- Sistem pendaftaran akun publik.
- Penghapusan permanen data siswa, guru, kelas, dan tahun ajaran.
- Sistem pembayaran sekolah.
- Sistem penilaian akademik.
- Sistem pengelolaan jadwal pelajaran.
- Aplikasi native Android atau iOS.
- Migrasi langsung ke PostgreSQL pada implementasi pertama.

# 3. PENGGUNA DAN HAK AKSES

Sistem memiliki tiga kategori pengguna.

## 3.1 Administrator

Administrator memiliki kewenangan untuk:

- Mengelola informasi sekolah.
- Mengelola tahun ajaran.
- Mengelola pengguna.
- Mengelola data guru.
- Mengelola data siswa.
- Mengelola kelas.
- Mengelola keanggotaan siswa.
- Mengelola penugasan guru.
- Melakukan kenaikan kelas.
- Melihat seluruh absensi.
- Mengedit dan menghapus seluruh absensi.
- Melihat audit log.
- Melihat dashboard dan statistik seluruh kelas aktif.

## 3.2 Guru

Guru memiliki kewenangan untuk:

- Melihat dashboard kelas yang menjadi tanggung jawabnya.
- Membuat absensi kelas yang menjadi tanggung jawabnya.
- Melihat absensi yang dibuatnya.
- Mengedit absensi yang dibuatnya sendiri.
- Menghapus absensi yang dibuatnya sendiri melalui prosedur konfirmasi.
- Melihat daftar perhatian kehadiran.
- Menyiapkan pesan WhatsApp untuk orang tua siswa.
- Melihat statistik kelas yang menjadi tanggung jawabnya.

Guru tidak memiliki menu untuk mengelola kelas lain atau absensi yang dibuat guru lain.

Setiap permintaan backend tetap diperiksa berdasarkan penugasan dan kepemilikan sesi absensi.

## 3.3 Publik

Publik terdiri dari:

- Siswa.
- Orang tua.
- Keluarga siswa.
- Masyarakat umum.

Publik dapat mencari siswa berdasarkan nama dan melihat riwayat absensi yang diizinkan.

Publik tidak membutuhkan login.

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
- Akun inactive harus kehilangan akses pada pemeriksaan permintaan terlindungi berikutnya atau sesuai mekanisme pembaruan sesi yang ditetapkan.

# 5. KEBUTUHAN FUNGSIONAL

## 5.1 Manajemen Informasi Sekolah

Administrator dapat mengelola:

- Nama sekolah.
- Alamat sekolah.
- Nomor telepon.
- Email sekolah.
- Logo sekolah.
- Nama kepala sekolah.
- Tahun ajaran aktif.

Tabel School_Information hanya memiliki satu baris data.

Hanya administrator yang dapat mengakses dan mengubah informasi sekolah.

## 5.2 Manajemen Tahun Ajaran

Administrator dapat:

- Membuat tahun ajaran.
- Menentukan tanggal mulai.
- Menentukan tanggal berakhir.
- Mengaktifkan tahun ajaran.
- Menonaktifkan tahun ajaran melalui pergantian tahun ajaran aktif.

Ketentuan:

1. Hanya satu tahun ajaran aktif.
2. Tahun ajaran berikutnya dapat dibuat sebelum tahun ajaran sekarang berakhir.
3. Tahun ajaran yang dibuat tidak otomatis menjadi aktif.
4. Periode tahun ajaran tidak boleh bertumpang tindih.
5. Tanggal mulai tidak boleh melewati tanggal berakhir.

### Sumber Kebenaran Tahun Ajaran Aktif

`School_Information.active_academic_year_id` merupakan satu-satunya sumber kebenaran untuk menentukan tahun ajaran aktif.

`Academic_Years.academic_year_status` tetap dipertahankan dan harus disinkronkan dengan acuan tersebut.

Pergantian tahun ajaran harus dikelola backend sebagai satu operasi yang konsisten.

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

- Satu kelas hanya memiliki satu guru penanggung jawab pada waktu yang sama.
- Satu guru maksimal bertanggung jawab atas dua kelas secara bersamaan.
- Guru yang sudah menangani dua kelas tidak muncul dalam pilihan penugasan baru.
- Guru inactive tidak dapat menerima penugasan baru.
- Penugasan menggunakan effective dates.
- Riwayat penugasan tidak boleh ditimpa.

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

Perubahan informasi kontak orang tua dicatat melalui Student_Contact_Logs dengan menyimpan snapshot data sebelumnya sesuai kebutuhan riwayat komunikasi.

## 5.6 Manajemen Kelas

Administrator dapat:

- Membuat kelas.
- Mengubah nama kelas.
- Mengaktifkan kelas.
- Menonaktifkan kelas.

Nama kelas boleh digunakan kembali pada tahun ajaran berbeda.

Setiap kelas memiliki class_id berbeda.

Kombinasi academic_year_id dan class_name harus unik.

Kelas tidak dapat dihapus permanen.

## 5.7 Keanggotaan Siswa dalam Kelas

Hubungan siswa dan kelas disimpan dalam Class_Members.

Ketentuan:

- Menggunakan effective dates.
- Riwayat kelas siswa dipertahankan.
- Satu siswa tidak boleh memiliki keanggotaan kelas yang bertumpang tindih.
- Perpindahan kelas tidak mengubah student_id.
- Keanggotaan lama ditutup dan keanggotaan baru dibuat.

## 5.8 Kenaikan Kelas

Administrator membuat tahun ajaran dan kelas baru terlebih dahulu.

Alur:

1. Administrator memilih kelas asal.
2. Administrator memilih kelas tujuan.
3. Sistem menampilkan seluruh siswa.
4. Semua siswa otomatis dicentang.
5. Siswa yang dicentang naik ke kelas tujuan.
6. Siswa yang tidak dicentang tetap pada tingkat kelas yang sama di tahun ajaran baru.
7. Administrator dapat mengubah kelas tujuan masing-masing siswa.
8. Sistem menampilkan preview.
9. Administrator melakukan konfirmasi.
10. Sistem memproses kenaikan kelas secara konsisten.

Ketentuan teknis:

- student_id tetap sama.
- Membership lama ditutup sehari sebelum tahun ajaran baru dimulai.
- Membership baru dimulai pada tanggal mulai tahun ajaran baru.
- Kegagalan operasi tidak boleh meninggalkan perubahan sebagian.

## 5.9 Pembuatan Absensi

Status absensi:

- Hadir
- Sakit
- Izin
- Alpa

Ketentuan:

1. Satu hari dihitung sebagai satu pertemuan.
2. Satu kelas hanya boleh memiliki satu sesi absensi per hari.
3. Tanggal absensi dibuat otomatis oleh backend.
4. Zona waktu menggunakan Asia/Jakarta.
5. Guru tidak memilih tanggal absensi secara manual.
6. Semua siswa otomatis berstatus Hadir.
7. Guru mengubah status siswa yang tidak hadir.
8. Data baru disimpan setelah proses dikonfirmasi.
9. Formulir yang belum disimpan tidak menghasilkan record absensi.
10. Jika sesi hari tersebut sudah tersedia, guru diarahkan ke sesi tersebut.

Kolom lokasi:

- location_name wajib diisi.
- location_note opsional.
- location_name memiliki nilai awal berupa ruang kelas reguler.

## 5.10 Pengeditan Absensi

- Guru dapat mengedit absensi yang dibuatnya sendiri.
- Administrator dapat mengedit seluruh absensi.
- Pengeditan menggunakan session_id yang sama.
- Tidak ada batas waktu pengeditan yang disepakati.
- Perubahan harus dicatat dalam Attendance_Audit_Logs.
- Jika audit gagal disimpan, perubahan dibatalkan.

## 5.11 Penghapusan Absensi

Hanya absensi yang boleh dihapus permanen.

Prosedur:

1. Pengguna menekan tombol hapus.
2. Sistem menampilkan dialog penghapusan permanen.
3. Pengguna memasukkan alasan.
4. Sistem menampilkan frasa konfirmasi yang diwajibkan.
5. Pengguna mengetik frasa tersebut.
6. Tombol konfirmasi hanya aktif jika frasa cocok.
7. Sistem menyimpan audit.
8. Setelah audit berhasil, sesi dan seluruh record siswa dihapus.

Penghapusan harus konsisten.

Jika audit gagal, penghapusan tidak dilanjutkan.

## 5.12 Audit Absensi

Attendance_Audit_Logs mencatat:

- UPDATE.
- DELETE.

CREATE tidak dicatat.

Ketika sesi dihapus:

- Satu audit untuk sesi absensi.
- Satu audit terpisah untuk setiap Attendance_Record yang dihapus.
- Snapshot seluruh data disimpan sebelum penghapusan.

ID sesi dan record dalam audit bersifat historis, bukan foreign key.

## 5.13 Halaman Publik

URL publik direncanakan menggunakan:

`/kehadiran`

Fitur:

- Pencarian berdasarkan nama siswa.
- Mendukung pencarian sebagian nama.
- Menampilkan seluruh hasil jika terdapat nama yang sama.
- Menampilkan kelas dan guru penanggung jawab.
- Menampilkan riwayat absensi.
- Menampilkan rekap Hadir, Sakit, Izin, dan Alpa.

Periode:

- Default 30 hari terakhir.
- Pengguna dapat memilih bulan Januari sampai Desember.

Informasi publik tidak boleh mencakup:

- Nomor WhatsApp.
- Data autentikasi.
- Informasi sensitif orang tua.
- Informasi administratif internal.

Siswa yang graduated atau transferred tetap dapat dicari untuk melihat riwayat kehadiran.

Tidak adanya sesi absensi bukan berarti siswa Alpa.

URL publik dapat dibagikan dan menggunakan query parameters untuk mempertahankan pencarian serta periode.

## 5.14 Daftar Perhatian Kehadiran

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

## 5.15 Integrasi WhatsApp

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

## 5.16 Dashboard Administrator

Menampilkan statistik seluruh kelas aktif pada tahun ajaran aktif.

Grafik:

- Komposisi Hadir, Sakit, Izin, Alpa.
- Tren kehadiran harian.
- Perbandingan antar kelas.
- Ringkasan masing-masing kelas.

## 5.17 Dashboard Guru

Menampilkan statistik kelas yang menjadi tanggung jawab guru.

Guru maksimal memiliki dua kelas yang ditugaskan secara bersamaan.

Grafik:

- Komposisi Hadir, Sakit, Izin, Alpa.
- Tren kehadiran harian.
- Ringkasan per kelas.

## 5.18 Aturan Perhitungan Statistik

- Data dihitung dari sesi dan record absensi yang tersimpan.
- Hari tanpa sesi tidak dihitung sebagai Alpa.
- Denominator menggunakan jumlah Attendance_Records yang valid.
- Statistik mengikuti tahun ajaran aktif.

Endpoint yang direncanakan:

- GET /api/dashboard/admin
- GET /api/dashboard/teacher

# 6. STRUKTUR DATABASE

Sistem menggunakan 12 tabel.

| No. | Tabel                     | Fungsi               |
| --- | ------------------------- | -------------------- |
| 1   | Users                     | Pengguna sistem      |
| 2   | Students                  | Data siswa           |
| 3   | Academic_Years            | Tahun ajaran         |
| 4   | Classes                   | Data kelas           |
| 5   | Class_Members             | Keanggotaan siswa    |
| 6   | Teacher_Assignments       | Penugasan guru       |
| 7   | Attendance_Sessions       | Sesi absensi         |
| 8   | Attendance_Records        | Data kehadiran siswa |
| 9   | Attendance_Audit_Logs     | Audit absensi        |
| 10  | Student_Contact_Logs      | Riwayat komunikasi   |
| 11  | School_Information        | Informasi sekolah    |
| 12  | Administrative_Audit_Logs | Audit administrasi   |

## 6.1 Primary Key dan Relasi Utama

- Users.user_id
- Students.student_id
- Academic_Years.academic_year_id
- Classes.class_id
- Class_Members.membership_id
- Teacher_Assignments.assignment_id
- Attendance_Sessions.session_id
- Attendance_Records.attendance_id
- Attendance_Audit_Logs.audit_id
- Student_Contact_Logs.contact_log_id
- School_Information.school_id
- Administrative_Audit_Logs.admin_audit_id

## 6.2 Relasi

- Users 1:N Teacher_Assignments.
- Users 1:N Attendance_Sessions.
- Users 1:N Attendance_Audit_Logs.
- Users 1:N Student_Contact_Logs.
- Users 1:N Administrative_Audit_Logs.
- Students 1:N Class_Members.
- Students 1:N Attendance_Records.
- Students 1:N Student_Contact_Logs.
- Academic_Years 1:N Classes.
- Classes 1:N Class_Members.
- Classes 1:N Teacher_Assignments.
- Classes 1:N Attendance_Sessions.
- Attendance_Sessions 1:N Attendance_Records.
- Class_Members 1:N Attendance_Records.

School_Information memiliki referensi ke tahun ajaran aktif.

Attendance_Audit_Logs menyimpan ID sesi dan record secara historis tanpa foreign key agar audit tetap tersedia setelah data absensi dihapus.

## 6.3 Constraint Penting

- UNIQUE Users.auth_user_id.
- UNIQUE Users.username.
- UNIQUE Classes(academic_year_id, class_name).
- UNIQUE Attendance_Sessions(class_id, attendance_date).
- UNIQUE Attendance_Records(session_id, student_id).
- Effective date membership tidak boleh tumpang tindih.
- Effective date penugasan harus memenuhi aturan satu guru per kelas dan maksimal dua kelas per guru.

Validasi konsistensi relasi dilakukan backend pada Google Sheets.

PostgreSQL nantinya dapat memperkuat integritas melalui foreign key, unique constraint, dan constraint tambahan.

# 7. PERSYARATAN ANTARMUKA

## 7.1 Pendekatan Mobile First

Aplikasi mengutamakan smartphone.

Ketentuan:

- Data ditampilkan dalam daftar vertikal.
- Menghindari tabel HTML tradisional sebagai tampilan utama.
- Tidak mengandalkan horizontal scrolling.
- Navigasi mudah digunakan.
- Formulir absensi menampilkan siswa satu per satu.
- Grafik responsif.
- Tampilan tablet dan desktop menyesuaikan setelah pengalaman mobile terpenuhi.

## 7.2 Komponen Reusable

Komponen yang direncanakan:

- DataList.
- SelectableList.
- AttendanceList.
- AttendanceForm.
- DetailView.
- Form.
- Dialog.
- Navigation.
- StatCard.
- AttendanceSummary.
- AttendanceChart.
- ClassComparisonChart.
- AttendanceTrendChart.

Komponen dibuat sesuai kebutuhan implementasi, bukan seluruhnya sekaligus.

## 7.3 Kebijakan Styling

Tahap awal tidak menggunakan:

- CSS custom.
- Tailwind CSS.
- daisyUI.
- React Icons.
- Lenis.
- Animasi tambahan.

Styling baru dilakukan setelah seluruh fungsi berjalan dengan baik dan mendapatkan persetujuan pemilik proyek.

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

# 9. TEKNOLOGI DAN ARSITEKTUR

| Komponen            | Teknologi             |
| ------------------- | --------------------- |
| Frontend            | Next.js 16 App Router |
| Backend             | Next.js Server-side   |
| Bahasa              | JavaScript            |
| Authentication      | Auth.js               |
| OAuth               | Google OAuth          |
| Database awal       | Google Spreadsheet    |
| Integrasi database  | Google Sheets API     |
| Validasi            | Zod                   |
| Hosting             | Vercel                |
| Repository          | GitHub                |
| Database berikutnya | PostgreSQL            |

## 9.1 Arsitektur

Frontend berkomunikasi dengan backend melalui API.

Backend terdiri dari:

- API Route Handlers.
- Authentication dan Authorization.
- Validation.
- Business Logic / Services.
- Repository.
- Database Adapter.

Frontend tidak boleh mengakses Google Sheets API secara langsung.

## 9.2 Repository Pattern

Setiap tabel memiliki repository tersendiri.

Repository Google Sheets dan PostgreSQL harus mengikuti kontrak fungsi yang sama.

Business logic tidak boleh bergantung langsung pada implementasi database tertentu.

# 10. MIGRASI DATABASE

Migrasi ke PostgreSQL harus mempertahankan:

- Seluruh ID.
- Seluruh data.
- Riwayat siswa.
- Riwayat kelas.
- Riwayat penugasan guru.
- Riwayat absensi.
- Audit log.
- Relasi antartabel.
- Aturan bisnis.

Urutan migrasi mengikuti ketergantungan relasi.

Setelah migrasi:

1. Validasi jumlah record.
2. Validasi ID.
3. Validasi foreign key.
4. Validasi effective dates.
5. Bandingkan statistik.
6. Uji seluruh fungsi.
7. Alihkan database melalui konfigurasi.

Hindari dual-write selama proses perpindahan.

# 11. DEPLOYMENT

## 11.1 GitHub

Repository GitHub menjadi tempat penyimpanan source code.

## 11.2 Vercel

Repository dihubungkan ke Vercel.

Setiap push ke branch production memicu build dan deployment otomatis.

Website menggunakan domain bawaan Vercel.

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
4. Pengelolaan tahun ajaran mengikuti aturan yang ditetapkan.
5. Kenaikan kelas berjalan konsisten.
6. Guru dapat membuat absensi kelasnya.
7. Satu kelas tidak dapat memiliki dua sesi absensi pada hari yang sama.
8. Pengeditan dan penghapusan absensi mengikuti hak akses.
9. Audit tersimpan dengan benar.
10. Halaman publik berfungsi tanpa membocorkan data sensitif.
11. Daftar perhatian kehadiran menghitung Alpa dengan benar.
12. Persiapan pesan WhatsApp berjalan.
13. Dashboard menampilkan statistik yang benar.
14. Tampilan dapat digunakan dengan baik pada smartphone.
15. Backup dan pemulihan dapat diuji.
16. Deployment production berhasil.

# 13. TAHAPAN IMPLEMENTASI

Target implementasi dibagi menjadi 12 tahap.

| Tahap | Pekerjaan                                        |
| ----- | ------------------------------------------------ |
| 1     | Persiapan Next.js, GitHub, Vercel                |
| 2     | Persiapan Google Spreadsheet dan Service Account |
| 3     | Google Sheets Repository dan fondasi backend     |
| 4     | Auth.js, Google OAuth, dan otorisasi             |
| 5     | Modul data master                                |
| 6     | Modul absensi                                    |
| 7     | Audit log                                        |
| 8     | Dashboard administrator dan guru                 |
| 9     | Halaman publik                                   |
| 10    | Daftar perhatian dan WhatsApp                    |
| 11    | Pengujian dan perbaikan                          |
| 12    | Finalisasi, styling, dan deployment production   |

Estimasi awal: 22–34 hari kerja.

Estimasi tersebut merupakan target perencanaan, bukan jaminan penyelesaian.

# 14. HAL YANG MASIH PERLU DITENTUKAN

Hal-hal berikut belum menjadi keputusan final:

1. Mekanisme pemilihan tahun pada halaman publik jika tersedia riwayat dari beberapa tahun ajaran.
2. Detail implementasi teknis penguncian dan pemulihan operasi multi-sheet pada Google Sheets.
3. Kebijakan retensi backup dan jumlah salinan yang disimpan.
4. Detail desain visual setelah tahap styling dimulai.

Hal-hal tersebut tidak mengubah keputusan bisnis yang telah disepakati.

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

---

# 16. STATUS DOKUMEN

**PRD versi 1.0**

Dokumen ini menjadi acuan utama pengembangan Sistem Absensi Sekolah Terpusat.

Perubahan terhadap kebutuhan produk harus dicatat sebagai revisi spesifikasi agar tidak terjadi perbedaan antara kesepakatan dan implementasi.

**Status proyek:**

- Finalisasi spesifikasi produk: Selesai.
- Penyusunan PRD versi 1.0: Selesai.
- Implementasi kode: Belum dimulai.
- Target implementasi: 12 tahap.
