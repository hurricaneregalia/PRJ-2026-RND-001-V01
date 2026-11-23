# DATABASE.md

# Sistem Absensi Sekolah Terpusat

**Versi:** 2.0  
**Tanggal:** 19 November 2026  
**Status:** Rancangan database untuk implementasi  
**Jumlah tabel:** 11

---

## 1. Prinsip Desain Database

1. Database menggunakan 11 tabel yang telah disepakati.
2. Setiap tabel memiliki primary key unik.
3. Relasi antartabel menggunakan foreign key secara konseptual.
4. Data master tidak boleh dihapus permanen melalui aplikasi.
5. Penghapusan permanen hanya berlaku untuk data absensi sesuai aturan audit.
6. Riwayat perubahan penting harus tersimpan dalam tabel audit.
7. Struktur kompatibel dengan Google Sheets dan dapat dimigrasikan ke PostgreSQL.
8. Validasi relasi dan aturan bisnis wajib dilakukan di backend.
9. Semua tanggal operasional sekolah menggunakan zona waktu `Asia/Jakarta`.
10. ID setiap record dibuat oleh backend.
11. Tahun ajaran dihitung otomatis berdasarkan tanggal, bukan dikelola melalui tabel tersendiri.
12. Kelas tetap berlaku lintas tahun ajaran.

## 2. Konvensi Tipe Data

| Tipe       | Keterangan                   |
| ---------- | ---------------------------- |
| VARCHAR(n) | Teks dengan panjang maksimum |
| TEXT       | Teks panjang                 |
| INTEGER    | Bilangan bulat               |
| DATE       | Tanggal                      |
| TIMESTAMP  | Tanggal dan waktu            |
| BOOLEAN    | Nilai benar/salah            |

Pada Google Sheets, nilai disimpan sebagai representasi teks atau angka yang konsisten. Backend bertanggung jawab melakukan konversi dan validasi.

## 3. Perhitungan Tahun Ajaran Otomatis

Tahun ajaran tidak memiliki tabel tersendiri.

Periode tahun ajaran ditentukan berdasarkan tanggal kalender Indonesia (`Asia/Jakarta`).

Aturan:

- Tahun ajaran dimulai pada 1 Juli.
- Tahun ajaran berakhir pada 30 Juni tahun berikutnya.
- Tanggal 1 Juli sampai 31 Desember menggunakan tahun kalender saat itu sebagai tahun awal.
- Tanggal 1 Januari sampai 30 Juni menggunakan tahun kalender sebelumnya sebagai tahun awal.

Contoh:

| Tanggal          | Tahun Ajaran |
| ---------------- | ------------ |
| 30 Juni 2026     | 2025/2026    |
| 1 Juli 2026      | 2026/2027    |
| 31 Desember 2026 | 2026/2027    |
| 1 Januari 2027   | 2026/2027    |
| 30 Juni 2027     | 2026/2027    |
| 1 Juli 2027      | 2027/2028    |

Identitas tahun ajaran menggunakan format:

`YYYY/YYYY+1`

Contoh: `2026/2027`.

Identitas tersebut disimpan pada `Attendance_Sessions.academic_year_id`.

Ketentuan:

1. Perhitungan dilakukan oleh backend.
2. Tahun ajaran ditentukan berdasarkan `attendance_date`, bukan tanggal ketika data dibuka atau diedit.
3. Riwayat absensi tetap menggunakan identitas tahun ajaran ketika sesi dibuat.
4. Tidak ada proses aktivasi atau penonaktifan tahun ajaran.
5. Tidak ada administrator yang membuat tahun ajaran secara manual.
6. Tidak ada ketergantungan pada `School_Information` untuk menentukan tahun ajaran.

## 4. Struktur 11 Tabel

### 4.1 Users

Menyimpan akun administrator dan guru.

| Kolom          | Tipe Data    | Constraint       | Keterangan           |
| -------------- | ------------ | ---------------- | -------------------- |
| user_id        | VARCHAR(36)  | PK, NOT NULL     | ID internal pengguna |
| auth_user_id   | VARCHAR(255) | UNIQUE, NOT NULL | Google OAuth `sub`   |
| username       | VARCHAR(100) | UNIQUE, NOT NULL | Nama pengguna        |
| email          | VARCHAR(255) | NOT NULL         | Email akun           |
| full_name      | VARCHAR(150) | NOT NULL         | Nama lengkap         |
| gender         | VARCHAR(20)  | NOT NULL         | Laki-laki/Perempuan  |
| role           | VARCHAR(20)  | NOT NULL         | Administrator/Guru   |
| account_status | VARCHAR(20)  | NOT NULL         | active/inactive      |
| created_at     | TIMESTAMP    | NOT NULL         | Waktu pembuatan      |
| updated_at     | TIMESTAMP    | NOT NULL         | Waktu pembaruan      |

Aturan:

- `auth_user_id` menyimpan Google `sub`, bukan email.
- Satu identitas Google hanya boleh terhubung ke satu akun.
- Role hanya Administrator atau Guru.
- Akun inactive tidak dapat mengakses sistem.
- Pengguna tidak dapat mengubah role atau status akunnya sendiri melalui akses biasa.
- Pengguna tidak dapat dihapus permanen.
- Email bukan identitas utama autentikasi karena dapat berubah.

### 4.2 Students

Menyimpan data induk siswa.

| Kolom           | Tipe Data    | Constraint   | Keterangan          |
| --------------- | ------------ | ------------ | ------------------- |
| student_id      | VARCHAR(36)  | PK, NOT NULL | ID permanen siswa   |
| student_number  | VARCHAR(50)  | NULL         | Nomor induk siswa   |
| full_name       | VARCHAR(150) | NOT NULL     | Nama lengkap        |
| gender          | VARCHAR(20)  | NOT NULL     | Laki-laki/Perempuan |
| parent_name     | VARCHAR(150) | NOT NULL     | Nama orang tua      |
| parent_relation | VARCHAR(10)  | NOT NULL     | Ibu/Ayah            |
| parent_whatsapp | VARCHAR(20)  | NOT NULL     | Nomor WhatsApp      |
| student_status  | VARCHAR(20)  | NOT NULL     | Status siswa        |
| created_at      | TIMESTAMP    | NOT NULL     | Waktu pembuatan     |
| updated_at      | TIMESTAMP    | NOT NULL     | Waktu pembaruan     |

Nilai `student_status`:

- active
- inactive
- graduated
- transferred

Aturan:

- `student_id` bersifat permanen dan tidak boleh berubah.
- `student_number` boleh kosong dan dapat diperbarui.
- Nomor WhatsApp disimpan dalam format internasional tanpa tanda `+`, misalnya `628123456789`.
- `parent_relation` hanya menerima Ibu atau Ayah.
- Jika relasi Ibu, sapaan WhatsApp menggunakan Ibu.
- Jika relasi Ayah, sapaan WhatsApp menggunakan Bapak.
- Satu nomor WhatsApp boleh digunakan oleh beberapa siswa.
- Perubahan informasi kontak orang tua harus mempertahankan snapshot historis melalui `Student_Contact_Logs`.
- Siswa tidak boleh dihapus permanen.

### 4.3 Classes

Menyimpan data kelas yang berlaku lintas tahun ajaran.

| Kolom        | Tipe Data    | Constraint   | Keterangan      |
| ------------ | ------------ | ------------ | --------------- |
| class_id     | VARCHAR(36)  | PK, NOT NULL | ID kelas        |
| class_name   | VARCHAR(100) | NOT NULL     | Nama kelas      |
| class_status | VARCHAR(20)  | NOT NULL     | Status kelas    |
| created_at   | TIMESTAMP    | NOT NULL     | Waktu pembuatan |
| updated_at   | TIMESTAMP    | NOT NULL     | Waktu pembaruan |

Nilai `class_status`:

- active
- inactive

Aturan:

- `class_id` bersifat permanen dan tetap digunakan lintas tahun ajaran.
- Kelas tidak terikat pada satu tahun ajaran.
- Nama kelas tidak boleh duplikat secara tidak sengaja.
- Kelas inactive tidak menerima penugasan atau keanggotaan baru.
- Kelas tidak boleh dihapus permanen.
- Perubahan nama kelas tidak mengubah ID kelas maupun riwayat absensi.

### 4.4 Class_Members

Menyimpan riwayat keanggotaan siswa dalam kelas.

| Kolom          | Tipe Data   | Constraint   | Keterangan       |
| -------------- | ----------- | ------------ | ---------------- |
| membership_id  | VARCHAR(36) | PK, NOT NULL | ID keanggotaan   |
| student_id     | VARCHAR(36) | FK, NOT NULL | ID siswa         |
| class_id       | VARCHAR(36) | FK, NOT NULL | ID kelas         |
| effective_from | DATE        | NOT NULL     | Tanggal mulai    |
| effective_to   | DATE        | NULL         | Tanggal berakhir |
| created_at     | TIMESTAMP   | NOT NULL     | Waktu pembuatan  |
| updated_at     | TIMESTAMP   | NOT NULL     | Waktu pembaruan  |

Relasi:

- FK `student_id` → `Students.student_id`
- FK `class_id` → `Classes.class_id`

Aturan:

- Satu siswa tidak boleh memiliki dua keanggotaan kelas yang periodenya bertumpang tindih.
- `effective_to` bersifat inklusif.
- `effective_to = NULL` berarti keanggotaan masih berlangsung.
- Tanggal mulai harus lebih kecil atau sama dengan tanggal berakhir jika tanggal berakhir diisi.
- Perpindahan kelas dilakukan dengan menutup keanggotaan lama dan membuat keanggotaan baru.
- Riwayat keanggotaan tidak dihapus.
- Satu siswa tetap menggunakan `student_id` yang sama sepanjang masa sekolahnya.
- Keanggotaan dapat berlangsung melintasi pergantian tahun ajaran jika siswa tetap berada di kelas yang sama.

### 4.5 Teacher_Assignments

Menyimpan riwayat tanggung jawab guru terhadap kelas.

| Kolom          | Tipe Data   | Constraint   | Keterangan       |
| -------------- | ----------- | ------------ | ---------------- |
| assignment_id  | VARCHAR(36) | PK, NOT NULL | ID penugasan     |
| user_id        | VARCHAR(36) | FK, NOT NULL | ID guru          |
| class_id       | VARCHAR(36) | FK, NOT NULL | ID kelas         |
| effective_from | DATE        | NOT NULL     | Tanggal mulai    |
| effective_to   | DATE        | NULL         | Tanggal berakhir |
| created_at     | TIMESTAMP   | NOT NULL     | Waktu pembuatan  |
| updated_at     | TIMESTAMP   | NOT NULL     | Waktu pembaruan  |

Relasi:

- FK `user_id` → `Users.user_id`
- FK `class_id` → `Classes.class_id`

Aturan:

- Hanya pengguna dengan role Guru yang boleh menerima penugasan.
- Guru inactive tidak boleh menerima penugasan baru.
- Satu kelas hanya boleh memiliki satu guru penanggung jawab pada waktu yang sama.
- Satu guru maksimal bertanggung jawab atas dua kelas secara bersamaan.
- Periode penugasan tidak boleh saling bertumpang tindih pada kelas yang sama.
- Penugasan dapat melintasi pergantian tahun ajaran.
- `effective_to` bersifat inklusif.
- `effective_to = NULL` berarti penugasan belum memiliki tanggal berakhir.
- Perubahan penanggung jawab dilakukan dengan menutup penugasan lama dan membuat penugasan baru.
- Validasi harus memeriksa seluruh periode penugasan, bukan hanya tanggal mulai.
- Riwayat penugasan tidak dihapus.

### 4.6 Attendance_Sessions

Menyimpan sesi absensi per kelas dan tanggal pertemuan.

| Kolom            | Tipe Data    | Constraint   | Keterangan                      |
| ---------------- | ------------ | ------------ | ------------------------------- |
| session_id       | VARCHAR(36)  | PK, NOT NULL | ID sesi absensi                 |
| class_id         | VARCHAR(36)  | FK, NOT NULL | ID kelas                        |
| teacher_user_id  | VARCHAR(36)  | FK, NOT NULL | Guru pembuat                    |
| academic_year_id | VARCHAR(9)   | NOT NULL     | Identitas tahun ajaran otomatis |
| attendance_date  | DATE         | NOT NULL     | Tanggal pertemuan               |
| location_type    | VARCHAR(20)  | NOT NULL     | IN_CLASS/OUTSIDE_CLASS          |
| location_name    | VARCHAR(150) | NOT NULL     | Nama lokasi, kosong untuk in-class |
| location_note    | TEXT         | NULL         | Catatan lokasi                  |
| lesson_material  | TEXT         | NOT NULL     | Materi pelajaran                |
| created_at       | TIMESTAMP    | NOT NULL     | Waktu pembuatan                 |
| updated_at       | TIMESTAMP    | NOT NULL     | Waktu pembaruan                 |

Relasi:

- FK `class_id` → `Classes.class_id`
- FK `teacher_user_id` → `Users.user_id`

Aturan:

1. Maksimal satu sesi pertemuan untuk kombinasi guru dan kelas dalam satu minggu kalender.
2. Minggu kalender dihitung Senin 00:00 sampai Minggu 23:59 menggunakan `Asia/Jakarta`.
3. Pertemuan dapat dilaksanakan pada hari apa pun dalam minggu tersebut berdasarkan kesepakatan guru dan sekolah.
4. Guru membuat absensi pada tanggal pertemuan yang benar-benar berlangsung.
5. Jika jadwal reguler bergeser, absensi dibuat pada tanggal pengganti.
6. Jika pertemuan dibatalkan dan belum ada absensi, guru dapat membuat absensi pada hari pengganti.
7. Tidak boleh ada sesi kedua untuk guru dan kelas yang sama dalam minggu kalender yang sama.
8. `attendance_date` ditentukan berdasarkan tanggal pertemuan aktual di `Asia/Jakarta`.
9. `academic_year_id` dihitung otomatis berdasarkan `attendance_date`.
10. `teacher_user_id` mencatat identitas guru yang benar-benar membuat sesi.
11. Guru hanya dapat membuat sesi untuk kelas yang penugasannya berlaku pada `attendance_date`.
12. `location_type` wajib diisi dengan nilai `IN_CLASS` atau `OUTSIDE_CLASS`; `location_name` wajib diisi untuk `OUTSIDE_CLASS` dan kosong untuk `IN_CLASS`.
13. Lokasi default adalah ruang kelas reguler.
14. Kegiatan dapat berlangsung di luar kelas atau di luar area sekolah.
15. `location_note` digunakan untuk memberikan penjelasan tambahan tentang lokasi.
16. `lesson_material` mencatat materi yang diajarkan pada pertemuan tersebut.
17. Materi pelajaran wajib diisi.
18. Lokasi dan materi dapat diedit setelah sesi dibuat.
19. Perubahan lokasi atau materi harus dicatat dalam `Attendance_Audit_Logs`.
20. Sesi dapat diedit menggunakan `session_id` yang sama.
21. Hanya guru pembuat atau administrator yang dapat mengedit sesi sesuai hak akses.
22. Sesi absensi merupakan data induk absensi yang dapat dihapus permanen melalui aplikasi dengan prosedur audit.

Catatan constraint:

Keunikan mingguan tidak cukup dijamin menggunakan `UNIQUE(class_id, attendance_date)`. Backend harus menghitung minggu kalender WIB dan memeriksa seluruh sesi yang sudah ada untuk kombinasi guru dan kelas yang sama.

### 4.7 Attendance_Records

Menyimpan status kehadiran setiap siswa dalam satu sesi.

| Kolom         | Tipe Data   | Constraint   | Keterangan           |
| ------------- | ----------- | ------------ | -------------------- |
| attendance_id | VARCHAR(36) | PK, NOT NULL | ID record absensi    |
| session_id    | VARCHAR(36) | FK, NOT NULL | ID sesi              |
| student_id    | VARCHAR(36) | FK, NOT NULL | ID siswa             |
| membership_id | VARCHAR(36) | FK, NOT NULL | ID keanggotaan kelas |
| status        | VARCHAR(20) | NOT NULL     | Status kehadiran     |
| created_at    | TIMESTAMP   | NOT NULL     | Waktu pembuatan      |
| updated_at    | TIMESTAMP   | NOT NULL     | Waktu pembaruan      |

Relasi:

- FK `session_id` → `Attendance_Sessions.session_id`
- FK `student_id` → `Students.student_id`
- FK `membership_id` → `Class_Members.membership_id`

Constraint:

- UNIQUE (`session_id`, `student_id`)

Nilai status:

- Hadir
- Sakit
- Izin
- Alpa

Aturan:

- Setiap siswa hanya memiliki satu record dalam satu sesi.
- Status default adalah Hadir.
- Guru dapat mengubah status siswa sesuai kondisi.
- Status dapat dikoreksi berkali-kali.
- Setiap perubahan status harus dicatat dalam `Attendance_Audit_Logs`.
- Perubahan menggunakan `attendance_id` yang sama.
- `student_id` harus sesuai dengan siswa pada `membership_id`.
- Keanggotaan harus berlaku pada `attendance_date`.
- Kelas pada `membership_id` harus sama dengan kelas pada sesi absensi.
- Data absensi yang tidak memiliki sesi tidak boleh dibuat.
- Jika sesi absensi tidak tersedia, kondisi tersebut tidak boleh dianggap sebagai Alpa.

### 4.8 Attendance_Audit_Logs

Menyimpan riwayat perubahan dan penghapusan data absensi.

| Kolom         | Tipe Data   | Constraint   | Keterangan             |
| ------------- | ----------- | ------------ | ---------------------- |
| audit_id      | VARCHAR(36) | PK, NOT NULL | ID audit               |
| session_id    | VARCHAR(36) | NOT NULL     | ID sesi historis       |
| attendance_id | VARCHAR(36) | NULL         | ID record historis     |
| actor_user_id | VARCHAR(36) | FK, NOT NULL | Pengguna pelaksana     |
| action_type   | VARCHAR(20) | NOT NULL     | UPDATE/DELETE          |
| old_data      | TEXT        | NOT NULL     | Data sebelum perubahan |
| new_data      | TEXT        | NULL         | Data sesudah perubahan |
| reason        | TEXT        | NULL         | Alasan perubahan       |
| changed_at    | TIMESTAMP   | NOT NULL     | Waktu perubahan        |

Relasi:

- FK `actor_user_id` → `Users.user_id`
- `session_id` bukan foreign key.
- `attendance_id` bukan foreign key.

Aturan:

- Mencatat UPDATE dan DELETE.
- Perubahan status kehadiran wajib dicatat.
- Perubahan lokasi dan materi pelajaran wajib dicatat.
- Penghapusan sesi dan record turunannya wajib dicatat.
- UPDATE menyimpan data sebelum dan sesudah perubahan.
- DELETE menyimpan snapshot data sebelum penghapusan.
- Penghapusan satu sesi menghasilkan:
  - Satu catatan audit tingkat sesi.
  - Satu catatan audit untuk setiap record siswa yang ikut dihapus.
- Audit harus berhasil disimpan sebelum perubahan atau penghapusan dilakukan.
- Jika audit gagal, operasi tidak boleh dilanjutkan.
- Audit bersifat append-only dan tidak dapat diedit atau dihapus melalui aplikasi.
- `session_id` dan `attendance_id` tetap disimpan sebagai ID historis agar audit tetap tersedia setelah data absensi dihapus.

### 4.9 Student_Contact_Logs

Menyimpan riwayat tindakan komunikasi guru kepada orang tua siswa.

| Kolom                | Tipe Data    | Constraint   | Keterangan              |
| -------------------- | ------------ | ------------ | ----------------------- |
| contact_log_id       | VARCHAR(36)  | PK, NOT NULL | ID log komunikasi       |
| student_id           | VARCHAR(36)  | FK, NOT NULL | ID siswa                |
| teacher_user_id      | VARCHAR(36)  | FK, NOT NULL | Guru pelaksana          |
| parent_name          | VARCHAR(150) | NOT NULL     | Snapshot nama orang tua |
| parent_relation      | VARCHAR(10)  | NOT NULL     | Snapshot hubungan       |
| destination_whatsapp | VARCHAR(20)  | NOT NULL     | Snapshot nomor tujuan   |
| period_start         | DATE         | NOT NULL     | Awal periode            |
| period_end           | DATE         | NOT NULL     | Akhir periode           |
| alpa_count           | INTEGER      | NOT NULL     | Jumlah Alpa             |
| public_url           | TEXT         | NOT NULL     | Tautan riwayat absensi  |
| action_status        | VARCHAR(30)  | NOT NULL     | Status tindakan         |
| created_at           | TIMESTAMP    | NOT NULL     | Waktu pembuatan         |

Relasi:

- FK `student_id` → `Students.student_id`
- FK `teacher_user_id` → `Users.user_id`

Nilai `action_status`:

- prepared
- whatsapp_open_requested

Aturan:

- Data kontak orang tua disimpan sebagai snapshot saat pesan disiapkan.
- Perubahan nomor WhatsApp siswa tidak mengubah riwayat komunikasi sebelumnya.
- Sistem menghitung siswa dengan minimal tiga Alpa dalam 30 hari berjalan.
- Pesan WhatsApp disiapkan otomatis, tetapi pengiriman dilakukan manual oleh guru.
- Aplikasi tidak boleh menyatakan pesan telah terkirim atau dibaca tanpa konfirmasi yang dapat dibuktikan.
- Tautan publik menampilkan data terbaru saat dibuka, bukan snapshot data absensi.
- Guru hanya dapat melakukan komunikasi untuk siswa dalam kelas yang menjadi tanggung jawabnya.

### 4.10 School_Information

Menyimpan informasi utama sekolah.

| Kolom           | Tipe Data    | Constraint   | Keterangan           |
| --------------- | ------------ | ------------ | -------------------- |
| school_id       | VARCHAR(36)  | PK, NOT NULL | ID informasi sekolah |
| school_name     | VARCHAR(200) | NOT NULL     | Nama sekolah         |
| school_address  | TEXT         | NOT NULL     | Alamat sekolah       |
| school_phone    | VARCHAR(20)  | NULL         | Telepon sekolah      |
| school_email    | VARCHAR(255) | NULL         | Email sekolah        |
| school_logo_url | TEXT         | NULL         | URL logo             |
| principal_name  | VARCHAR(150) | NULL         | Nama kepala sekolah  |
| created_at      | TIMESTAMP    | NOT NULL     | Waktu pembuatan      |
| updated_at      | TIMESTAMP    | NOT NULL     | Waktu pembaruan      |

Aturan:

- Tabel hanya memiliki satu baris data.
- Hanya administrator yang dapat mengakses dan mengubah informasi sekolah.
- Tidak ada kolom `active_academic_year_id`.
- Tahun ajaran tidak ditentukan oleh informasi sekolah.
- Informasi sekolah tidak boleh dihapus permanen.

### 4.11 Administrative_Audit_Logs

Menyimpan riwayat perubahan data administratif.

| Kolom          | Tipe Data    | Constraint   | Keterangan              |
| -------------- | ------------ | ------------ | ----------------------- |
| admin_audit_id | VARCHAR(36)  | PK, NOT NULL | ID audit                |
| actor_user_id  | VARCHAR(36)  | FK, NOT NULL | Administrator pelaksana |
| action_type    | VARCHAR(20)  | NOT NULL     | CREATE/UPDATE           |
| table_name     | VARCHAR(100) | NOT NULL     | Nama tabel              |
| record_id      | VARCHAR(36)  | NOT NULL     | ID record               |
| old_data       | TEXT         | NULL         | Data sebelum perubahan  |
| new_data       | TEXT         | NULL         | Data sesudah perubahan  |
| reason         | TEXT         | NULL         | Alasan perubahan        |
| created_at     | TIMESTAMP    | NOT NULL     | Waktu perubahan         |

Relasi:

- FK `actor_user_id` → `Users.user_id`

Aturan:

- Mencatat CREATE dan UPDATE pada data administratif.
- Berlaku untuk pengelolaan siswa, guru, kelas, penugasan, keanggotaan kelas, dan informasi sekolah.
- Tidak digunakan untuk mencatat perubahan absensi.
- Data audit bersifat append-only.
- Administrator tidak dapat mengubah atau menghapus riwayat audit melalui aplikasi.
- Penghapusan permanen data master tidak diperbolehkan.

## 5. Ringkasan Relasi Antartabel

| No. | Tabel Induk         | Tabel Anak                | Relasi |
| --- | ------------------- | ------------------------- | ------ |
| 1   | Users               | Teacher_Assignments       | 1:N    |
| 2   | Users               | Attendance_Sessions       | 1:N    |
| 3   | Users               | Attendance_Audit_Logs     | 1:N    |
| 4   | Users               | Student_Contact_Logs      | 1:N    |
| 5   | Users               | Administrative_Audit_Logs | 1:N    |
| 6   | Students            | Class_Members             | 1:N    |
| 7   | Students            | Attendance_Records        | 1:N    |
| 8   | Students            | Student_Contact_Logs      | 1:N    |
| 9   | Classes             | Class_Members             | 1:N    |
| 10  | Classes             | Teacher_Assignments       | 1:N    |
| 11  | Classes             | Attendance_Sessions       | 1:N    |
| 12  | Attendance_Sessions | Attendance_Records        | 1:N    |
| 13  | Class_Members       | Attendance_Records        | 1:N    |

Catatan:

- Tidak ada relasi ke tabel `Academic_Years` karena tabel tersebut tidak digunakan.
- `Attendance_Sessions.academic_year_id` merupakan identitas tahun ajaran hasil perhitungan otomatis.
- `Attendance_Audit_Logs.session_id` dan `attendance_id` merupakan referensi historis, bukan foreign key.

## 6. Aturan Constraint dan Validasi Global

### 6.1 Primary Key

Semua tabel menggunakan primary key dengan format `VARCHAR(36)`.

Backend menghasilkan ID unik, misalnya UUID.

ID tidak boleh berubah setelah record dibuat.

### 6.2 Foreign Key

Relasi wajib diperiksa backend ketika data dibuat atau diperbarui.

Pada PostgreSQL, foreign key diterapkan secara fisik.

Pada Google Sheets, pemeriksaan dilakukan melalui backend karena tidak tersedia mekanisme foreign key database.

### 6.3 Validasi Periode

Validasi periode berlaku pada:

- Keanggotaan siswa dalam kelas.
- Penugasan guru terhadap kelas.

Semua periode menggunakan aturan tanggal inklusif.

Jika satu periode berakhir pada 30 Juni, periode berikutnya dapat dimulai pada 1 Juli.

Dua periode yang berurutan tidak dianggap bertumpang tindih jika tanggal akhirnya 30 Juni dan tanggal awal berikutnya 1 Juli.

### 6.4 Validasi Penugasan Guru

Backend wajib memeriksa:

1. Akun guru aktif.
2. Role pengguna adalah Guru.
3. Kelas berstatus aktif.
4. Periode penugasan valid.
5. Kelas tidak memiliki guru lain dalam periode yang sama.
6. Guru tidak memiliki lebih dari dua kelas dalam periode yang sama.
7. Periode yang diperiksa mencakup seluruh tanggal efektif, bukan hanya tanggal mulai.

### 6.5 Validasi Absensi

Sebelum penyimpanan absensi, backend wajib memeriksa:

1. Akun guru aktif.
2. Guru memiliki penugasan yang berlaku untuk kelas pada `attendance_date`.
3. Tanggal pertemuan merupakan tanggal aktual pertemuan.
4. Belum terdapat sesi untuk guru dan kelas yang sama dalam minggu kalender WIB tersebut.
5. Minggu kalender dihitung Senin sampai Minggu.
6. Siswa memiliki keanggotaan kelas yang berlaku pada tanggal absensi.
7. Setiap siswa hanya memiliki satu record dalam sesi.
8. Status hanya Hadir, Sakit, Izin, atau Alpa.
9. `academic_year_id` sesuai hasil perhitungan otomatis berdasarkan `attendance_date`.
10. Lokasi dan materi pelajaran wajib tersedia.

### 6.6 Validasi Penghapusan

- Data master tidak dapat dihapus permanen.
- Hanya sesi absensi dan seluruh record turunannya yang dapat dihapus.
- Penghapusan harus dilakukan secara konsisten.
- Audit harus berhasil disimpan terlebih dahulu.
- Jika salah satu proses gagal, penghapusan tidak boleh meninggalkan data dalam kondisi tidak konsisten.

## 7. Indeks Database yang Direkomendasikan

Indeks berikut direkomendasikan untuk meningkatkan kecepatan pencarian dan laporan ketika menggunakan PostgreSQL.

| Tabel                     | Kolom Indeks                     | Tujuan                    |
| ------------------------- | -------------------------------- | ------------------------- |
| Users                     | auth_user_id                     | Pencarian akun OAuth      |
| Users                     | email                            | Pencarian akun            |
| Students                  | full_name                        | Pencarian siswa           |
| Students                  | student_number                   | Pencarian nomor induk     |
| Classes                   | class_name                       | Pencarian kelas           |
| Class_Members             | student_id                       | Riwayat kelas siswa       |
| Class_Members             | class_id                         | Daftar siswa dalam kelas  |
| Teacher_Assignments       | user_id                          | Penugasan guru            |
| Teacher_Assignments       | class_id                         | Penanggung jawab kelas    |
| Attendance_Sessions       | class_id, attendance_date        | Pencarian sesi kelas      |
| Attendance_Sessions       | teacher_user_id, attendance_date | Pencarian sesi guru       |
| Attendance_Sessions       | academic_year_id                 | Filter tahun ajaran       |
| Attendance_Records        | session_id                       | Daftar absensi sesi       |
| Attendance_Records        | student_id                       | Riwayat absensi siswa     |
| Attendance_Audit_Logs     | session_id                       | Riwayat perubahan sesi    |
| Attendance_Audit_Logs     | actor_user_id                    | Riwayat tindakan pengguna |
| Student_Contact_Logs      | student_id                       | Riwayat komunikasi siswa  |
| Administrative_Audit_Logs | table_name, record_id            | Riwayat perubahan data    |

Constraint UNIQUE yang telah ditentukan juga harus memiliki indeks unik pada PostgreSQL.

Pada Google Sheets, indeks tersebut tidak tersedia secara native. Backend harus menggunakan strategi pencarian yang sesuai dengan ukuran data.

## 8. Aturan Transaksi dan Konsistensi Data

Operasi berikut harus diperlakukan sebagai satu kesatuan proses.

### 8.1 Penyimpanan Absensi

1. Validasi guru dan kelas.
2. Validasi tanggal pertemuan dan penugasan guru.
3. Hitung minggu kalender WIB.
4. Periksa duplikasi sesi guru dan kelas dalam minggu tersebut.
5. Validasi keanggotaan siswa.
6. Hitung `academic_year_id` berdasarkan tanggal pertemuan.
7. Buat `Attendance_Sessions`.
8. Buat seluruh `Attendance_Records`.
9. Pastikan semua record berhasil disimpan.
10. Berikan konfirmasi keberhasilan.

Jika proses gagal, backend harus melakukan pemulihan agar tidak terdapat sesi tanpa seluruh record yang semestinya.

### 8.2 Pengubahan Absensi

1. Ambil data lama.
2. Validasi hak akses.
3. Siapkan snapshot data lama dan data baru.
4. Simpan audit.
5. Perbarui data absensi.
6. Konfirmasi keberhasilan.

Jika audit gagal, perubahan tidak boleh dilakukan.

### 8.3 Penghapusan Absensi

1. Validasi hak akses.
2. Minta alasan penghapusan.
3. Minta konfirmasi frasa yang ditentukan sistem.
4. Ambil snapshot sesi dan seluruh record siswa.
5. Simpan satu audit sesi.
6. Simpan audit setiap record siswa.
7. Hapus seluruh record anak.
8. Hapus sesi.
9. Konfirmasi keberhasilan.

Jika audit gagal, penghapusan tidak boleh dilakukan.

### 8.4 Perpindahan Keanggotaan Kelas

1. Validasi siswa dan kelas tujuan.
2. Ambil keanggotaan kelas saat ini.
3. Pastikan tanggal perpindahan valid.
4. Tutup keanggotaan lama dengan `effective_to`.
5. Buat keanggotaan baru dengan `effective_from`.
6. Pastikan tidak terjadi tumpang tindih periode.
7. Simpan audit administratif.
8. Pastikan perubahan berhasil.
9. Konfirmasi keberhasilan.

Jika proses gagal, backend harus memulihkan kondisi agar tidak terdapat siswa yang kehilangan keanggotaan atau memiliki keanggotaan ganda.

### 8.5 Pergantian Penanggung Jawab Kelas

1. Validasi guru pengganti.
2. Validasi kelas.
3. Validasi periode penugasan.
4. Tutup penugasan guru sebelumnya.
5. Buat penugasan baru.
6. Pastikan tidak ada tumpang tindih penugasan.
7. Pastikan guru tidak melampaui batas dua kelas.
8. Simpan audit administratif.
9. Konfirmasi keberhasilan.

Pergantian penanggung jawab tidak mengubah identitas guru pembuat pada sesi absensi yang sudah tersimpan.

### 8.6 Pergantian Tahun Ajaran

Tidak diperlukan proses pergantian tahun ajaran secara administratif.

Pada tanggal 1 Juli, tahun ajaran berubah secara otomatis berdasarkan tanggal kalender.

Dampaknya:

1. Tidak ada perubahan pada tabel `Classes`.
2. Tidak ada perubahan pada ID kelas.
3. Keanggotaan siswa tetap mengikuti periode efektifnya.
4. Penugasan guru tetap mengikuti periode efektifnya.
5. Absensi baru memperoleh `academic_year_id` berdasarkan tanggal pertemuan.
6. Riwayat absensi tahun sebelumnya tetap tersimpan dengan identitas tahun ajaran saat sesi dibuat.

## 9. Aturan Khusus Google Sheets

Google Sheets digunakan sebagai penyimpanan awal, bukan sebagai pengganti database relasional penuh.

Ketentuan implementasi:

1. Setiap tabel memiliki satu worksheet tersendiri.
2. Baris pertama berisi nama kolom.
3. Backend menjadi satu-satunya pihak yang melakukan perubahan data.
4. Frontend tidak mengakses Google Sheets secara langsung.
5. Kredensial Service Account hanya disimpan di server.
6. Validasi primary key, foreign key, UNIQUE, dan periode dilakukan backend.
7. Operasi multi-sheet harus memiliki mekanisme pengamanan terhadap perubahan bersamaan.
8. Audit disimpan sebelum operasi perubahan atau penghapusan dilakukan.
9. Data tanggal harus menggunakan format yang konsisten.
10. Jangan mengandalkan nomor baris spreadsheet sebagai identitas record.
11. Pemeriksaan duplikasi absensi mingguan harus dilakukan di backend.
12. Operasi yang melibatkan beberapa worksheet harus memiliki mekanisme pemulihan jika terjadi kegagalan.

Nama worksheet yang digunakan:

1. `Users`
2. `Students`
3. `Classes`
4. `Class_Members`
5. `Teacher_Assignments`
6. `Attendance_Sessions`
7. `Attendance_Records`
8. `Attendance_Audit_Logs`
9. `Student_Contact_Logs`
10. `School_Information`
11. `Administrative_Audit_Logs`

Tidak ada worksheet `Academic_Years`.

## 10. Persiapan Migrasi PostgreSQL

Struktur tabel dan nama kolom harus dipertahankan ketika migrasi.

Ketentuan migrasi:

- Pertahankan seluruh primary key.
- Pertahankan seluruh foreign key.
- Pertahankan nilai status.
- Pertahankan seluruh tanggal efektif.
- Pertahankan snapshot audit.
- Pertahankan ID historis pada `Attendance_Audit_Logs`.
- Terapkan constraint UNIQUE.
- Terapkan indeks pencarian.
- Terapkan validasi periode menggunakan constraint atau mekanisme database yang sesuai.
- Pertahankan `academic_year_id` pada `Attendance_Sessions`.
- Implementasikan perhitungan tahun ajaran otomatis di backend berdasarkan `attendance_date`.
- Jangan membuat tabel `Academic_Years`.

PostgreSQL dapat memperkuat validasi dengan composite foreign key, exclusion constraint, dan trigger jika diperlukan.

Khusus aturan satu sesi per guru dan kelas dalam satu minggu kalender, implementasi PostgreSQL harus menggunakan mekanisme yang menjamin keunikan mingguan secara konsisten.

Aturan bisnis tetap harus divalidasi di backend agar perilaku aplikasi konsisten pada kedua jenis penyimpanan.

## 11. Batasan dan Catatan Teknis

Beberapa aturan tidak dapat dijamin hanya menggunakan foreign key biasa.

### 11.1 Kesesuaian Siswa dan Membership

`Attendance_Records.student_id` harus sama dengan `Class_Members.student_id` yang dirujuk oleh `membership_id`.

Foreign key biasa tidak cukup untuk menjamin kesesuaian tersebut.

Solusi:

- Validasi backend pada Google Sheets.
- Composite foreign key atau mekanisme validasi tambahan pada PostgreSQL.

### 11.2 Kesesuaian Kelas dan Membership

Kelas pada `Class_Members` harus sama dengan kelas pada `Attendance_Sessions` yang dirujuk oleh record absensi.

Solusi:

- Validasi backend.
- Penguatan constraint PostgreSQL jika diperlukan.

### 11.3 Periode Tidak Bertumpang Tindih

Pengecekan periode harus memperhatikan seluruh record terkait, bukan hanya tanggal mulai.

Solusi:

- Validasi backend.
- Exclusion constraint atau mekanisme transaksi pada PostgreSQL.

### 11.4 Keunikan Absensi Mingguan

Satu guru hanya boleh membuat satu sesi untuk kelas yang sama dalam satu minggu kalender WIB.

Pengecekan harus menggunakan rentang Senin 00:00 sampai Minggu 23:59 berdasarkan `attendance_date`.

Pemeriksaan ini wajib dilakukan sebelum sesi dibuat dan harus terlindungi dari penyimpanan bersamaan.

### 11.5 Operasi Multi-Sheet

Google Sheets tidak menyediakan transaksi relasional seperti PostgreSQL.

Karena itu, operasi yang melibatkan beberapa worksheet harus memiliki mekanisme penguncian, validasi ulang, dan pemulihan apabila terjadi kegagalan.

Implementasi mekanisme tersebut tidak memerlukan tabel tambahan.

## 12. Checklist Finalisasi Database

- [x] Struktur terdiri dari 11 tabel.
- [x] Tabel `Academic_Years` dihilangkan.
- [x] Seluruh primary key ditentukan.
- [x] Seluruh foreign key ditentukan.
- [x] Unique constraint ditentukan.
- [x] Status dan enum bisnis ditentukan.
- [x] Aturan penghapusan ditentukan.
- [x] Aturan audit ditentukan.
- [x] Aturan periode efektif ditentukan.
- [x] Tahun ajaran dihitung otomatis.
- [x] Kelas berlaku lintas tahun ajaran.
- [x] Aturan absensi mingguan ditentukan.
- [x] Informasi lokasi dan materi pelajaran ditentukan.
- [x] Aturan migrasi PostgreSQL ditentukan.
- [x] Tidak ada penambahan tabel.

## 13. Status Dokumen

`DATABASE.md` versi 2.0 menjadi acuan desain database untuk tahap implementasi.

Setiap perubahan struktur tabel, penambahan kolom, penghapusan kolom, atau penambahan tabel harus mendapatkan persetujuan terlebih dahulu.

Perubahan implementasi yang tidak mengubah struktur database boleh dilakukan selama tetap mengikuti aturan bisnis dan relasi yang telah disepakati.
