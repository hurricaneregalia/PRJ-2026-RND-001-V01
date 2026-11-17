# DATABASE.md

# Sistem Absensi Sekolah Terpusat

**Versi:** 1.0  
**Tanggal:** 17 November 2026  
**Status:** Rancangan database  
**Jumlah tabel:** 12

---

## 1. Prinsip Desain Database

1. Menggunakan 12 tabel yang telah disepakati.
2. Setiap tabel memiliki primary key unik.
3. Relasi antartabel menggunakan foreign key secara konseptual.
4. Data master tidak boleh dihapus permanen.
5. Penghapusan permanen hanya berlaku untuk data absensi.
6. Riwayat perubahan penting harus tersimpan dalam tabel audit.
7. Struktur harus kompatibel dengan Google Sheets dan dapat dimigrasikan ke PostgreSQL.
8. Validasi relasi dan aturan bisnis wajib dilakukan di backend.
9. Semua tanggal operasional sekolah menggunakan zona waktu `Asia/Jakarta`.
10. ID setiap record dibuat oleh backend, bukan oleh pengguna.

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

## 3. Struktur 12 Tabel

### 3.1 Users

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

**Aturan:**

- `auth_user_id` menyimpan Google `sub`, bukan email.
- Satu identitas Google hanya boleh terhubung ke satu akun.
- Role hanya Administrator atau Guru.
- Akun inactive tidak dapat mengakses sistem.
- Pengguna tidak dapat mengubah role atau status akunnya sendiri melalui akses biasa.
- Pengguna tidak dapat dihapus permanen.
- Email bukan identitas utama autentikasi karena dapat berubah.

### 3.2 Students

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

**Nilai `student_status`:**

- active
- inactive
- graduated
- transferred

**Aturan:**

- `student_id` bersifat permanen dan tidak boleh berubah.
- `student_number` boleh kosong dan dapat diperbarui.
- Nomor WhatsApp disimpan dalam format internasional tanpa tanda `+`, misalnya `628123456789`.
- `parent_relation` hanya menerima Ibu atau Ayah.
- Jika relasi Ibu, sapaan WhatsApp menggunakan Ibu.
- Jika relasi Ayah, sapaan WhatsApp menggunakan Bapak.
- Satu nomor WhatsApp boleh digunakan oleh beberapa siswa.
- Perubahan informasi kontak orang tua harus mempertahankan snapshot historis melalui `Student_Contact_Logs`.
- Siswa tidak boleh dihapus permanen.

### 3.3 Academic_Years

Menyimpan periode tahun ajaran.

| Kolom                | Tipe Data   | Constraint   | Keterangan        |
| -------------------- | ----------- | ------------ | ----------------- |
| academic_year_id     | VARCHAR(36) | PK, NOT NULL | ID tahun ajaran   |
| academic_year_name   | VARCHAR(30) | NOT NULL     | Nama tahun ajaran |
| start_date           | DATE        | NOT NULL     | Tanggal mulai     |
| end_date             | DATE        | NOT NULL     | Tanggal selesai   |
| academic_year_status | VARCHAR(20) | NOT NULL     | active/inactive   |
| created_at           | TIMESTAMP   | NOT NULL     | Waktu pembuatan   |
| updated_at           | TIMESTAMP   | NOT NULL     | Waktu pembaruan   |

**Aturan:**

- `start_date` harus lebih kecil atau sama dengan `end_date`.
- Periode tahun ajaran tidak boleh saling bertumpang tindih.
- Tahun ajaran baru boleh dibuat sebelum periode dimulai.
- Pembuatan tahun ajaran tidak otomatis mengaktifkannya.
- Hanya satu tahun ajaran yang boleh aktif.
- Status aktif merupakan status turunan yang harus disinkronkan dengan `School_Information.active_academic_year_id`.
- Tidak boleh ada penghapusan permanen.

**Constraint logis:**

`start_date <= end_date`

Untuk dua tahun ajaran berbeda, periode tidak boleh memenuhi kondisi:

`periode_A.start_date <= periode_B.end_date AND periode_A.end_date >= periode_B.start_date`

### 3.4 Classes

Menyimpan data kelas pada setiap tahun ajaran.

| Kolom            | Tipe Data   | Constraint   | Keterangan      |
| ---------------- | ----------- | ------------ | --------------- |
| class_id         | VARCHAR(36) | PK, NOT NULL | ID kelas        |
| academic_year_id | VARCHAR(36) | FK, NOT NULL | Tahun ajaran    |
| class_name       | VARCHAR(50) | NOT NULL     | Nama kelas      |
| class_status     | VARCHAR(20) | NOT NULL     | Status kelas    |
| created_at       | TIMESTAMP   | NOT NULL     | Waktu pembuatan |
| updated_at       | TIMESTAMP   | NOT NULL     | Waktu pembaruan |

**Constraint:**

- FK `academic_year_id` → `Academic_Years.academic_year_id`
- UNIQUE (`academic_year_id`, `class_name`)

**Aturan:**

- Nama kelas tidak boleh duplikat dalam satu tahun ajaran.
- Nama kelas yang sama boleh digunakan pada tahun ajaran berbeda.
- Setiap kelas hanya terhubung ke satu tahun ajaran.
- Kelas tidak boleh dihapus permanen.

### 3.5 Class_Members

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

**Relasi:**

- FK `student_id` → `Students.student_id`
- FK `class_id` → `Classes.class_id`

**Aturan:**

- Satu siswa tidak boleh memiliki dua keanggotaan kelas yang periodenya bertumpang tindih.
- `effective_to` bersifat inklusif.
- `effective_to = NULL` berarti keanggotaan masih berlangsung.
- Tanggal mulai harus lebih kecil atau sama dengan tanggal berakhir jika tanggal berakhir diisi.
- Perpindahan kelas dilakukan dengan menutup keanggotaan lama dan membuat keanggotaan baru.
- Riwayat keanggotaan tidak dihapus.
- Satu siswa tetap menggunakan `student_id` yang sama sepanjang masa sekolahnya.

### 3.6 Teacher_Assignments

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

**Relasi:**

- FK `user_id` → `Users.user_id`
- FK `class_id` → `Classes.class_id`

**Aturan:**

- Hanya pengguna dengan role Guru yang boleh menerima penugasan.
- Guru inactive tidak boleh menerima penugasan baru.
- Satu kelas hanya boleh memiliki satu guru penanggung jawab pada waktu yang sama.
- Satu guru maksimal bertanggung jawab atas dua kelas secara bersamaan.
- Periode penugasan tidak boleh saling bertumpang tindih pada kelas yang sama.
- Perubahan penanggung jawab dilakukan dengan menutup penugasan lama dan membuat penugasan baru.
- Validasi harus memeriksa seluruh periode penugasan, bukan hanya tanggal mulai.
- Riwayat penugasan tidak dihapus.

### 3.7 Attendance_Sessions

Menyimpan sesi absensi per kelas dan tanggal.

| Kolom           | Tipe Data    | Constraint   | Keterangan      |
| --------------- | ------------ | ------------ | --------------- |
| session_id      | VARCHAR(36)  | PK, NOT NULL | ID sesi absensi |
| class_id        | VARCHAR(36)  | FK, NOT NULL | ID kelas        |
| teacher_user_id | VARCHAR(36)  | FK, NOT NULL | Guru pembuat    |
| attendance_date | DATE         | NOT NULL     | Tanggal absensi |
| location_name   | VARCHAR(150) | NOT NULL     | Nama lokasi     |
| location_note   | TEXT         | NULL         | Catatan lokasi  |
| created_at      | TIMESTAMP    | NOT NULL     | Waktu pembuatan |
| updated_at      | TIMESTAMP    | NOT NULL     | Waktu pembaruan |

**Relasi:**

- FK `class_id` → `Classes.class_id`
- FK `teacher_user_id` → `Users.user_id`

**Constraint:**

- UNIQUE (`class_id`, `attendance_date`)

**Aturan:**

- Satu kelas hanya boleh memiliki satu sesi absensi dalam satu hari.
- Tanggal absensi ditentukan otomatis oleh backend berdasarkan tanggal saat ini di zona waktu `Asia/Jakarta`.
- Guru tidak mengisi tanggal absensi secara manual.
- Guru hanya dapat membuat absensi untuk kelas yang sedang menjadi tanggung jawabnya.
- `teacher_user_id` mencatat identitas guru yang benar-benar membuat sesi.
- Identitas pembuat tidak berubah meskipun tanggung jawab kelas berpindah.
- `location_name` wajib diisi dan secara default menggunakan ruang kelas reguler.
- Sesi absensi yang sudah tersimpan dapat diedit menggunakan `session_id` yang sama.
- Hanya guru pembuat atau administrator yang dapat mengedit sesi.
- Sesi absensi merupakan satu-satunya data induk absensi yang dapat dihapus permanen melalui aplikasi.

### 3.8 Attendance_Records

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

**Relasi:**

- FK `session_id` → `Attendance_Sessions.session_id`
- FK `student_id` → `Students.student_id`
- FK `membership_id` → `Class_Members.membership_id`

**Constraint:**

- UNIQUE (`session_id`, `student_id`)

**Nilai status:**

- Hadir
- Sakit
- Izin
- Alpa

**Aturan:**

- Setiap siswa hanya memiliki satu record dalam satu sesi.
- Status default adalah Hadir.
- Guru mengubah status siswa yang tidak hadir sesuai kondisi.
- Record dibuat bersamaan dengan penyimpanan sesi absensi.
- Perubahan status menggunakan `attendance_id` yang sama.
- `student_id` harus sesuai dengan siswa pada `membership_id`.
- Keanggotaan harus berlaku pada `attendance_date`.
- Kelas pada `membership_id` harus sama dengan kelas pada sesi absensi.
- Data absensi yang tidak memiliki sesi tidak boleh dibuat.
- Jika sesi absensi tidak tersedia, kondisi tersebut tidak boleh dianggap sebagai Alpa.

### 3.9 Attendance_Audit_Logs

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

**Relasi:**

- FK `actor_user_id` → `Users.user_id`
- `session_id` bukan foreign key.
- `attendance_id` bukan foreign key.

**Aturan:**

- Mencatat UPDATE dan DELETE saja.
- Pembuatan sesi absensi tidak dicatat pada tabel ini.
- UPDATE menyimpan data sebelum dan sesudah perubahan.
- DELETE menyimpan snapshot data sebelum penghapusan.
- Penghapusan satu sesi menghasilkan:
  - Satu catatan audit tingkat sesi.
  - Satu catatan audit untuk setiap record siswa yang ikut dihapus.
- Audit harus berhasil disimpan sebelum perubahan atau penghapusan dilakukan.
- Jika audit gagal, operasi tidak boleh dilanjutkan.
- Audit bersifat append-only dan tidak dapat diedit atau dihapus melalui aplikasi.
- `session_id` dan `attendance_id` tetap disimpan sebagai ID historis agar audit tetap tersedia setelah data absensi dihapus.

### 3.10 Student_Contact_Logs

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

**Relasi:**

- FK `student_id` → `Students.student_id`
- FK `teacher_user_id` → `Users.user_id`

**Nilai `action_status`:**

- prepared
- whatsapp_open_requested

**Aturan:**

- Data kontak orang tua disimpan sebagai snapshot saat pesan disiapkan.
- Perubahan nomor WhatsApp siswa tidak mengubah riwayat komunikasi sebelumnya.
- Sistem menghitung siswa dengan minimal tiga Alpa dalam 30 hari berjalan.
- Pesan WhatsApp disiapkan secara otomatis, tetapi pengiriman dilakukan manual oleh guru.
- Aplikasi tidak boleh menyatakan pesan telah terkirim atau dibaca tanpa konfirmasi yang dapat dibuktikan.
- Tautan publik menampilkan data terbaru saat dibuka, bukan snapshot data absensi.
- Guru hanya dapat melakukan komunikasi untuk siswa dalam kelas yang menjadi tanggung jawabnya.

### 3.11 School_Information

Menyimpan informasi utama sekolah.

| Kolom                   | Tipe Data    | Constraint   | Keterangan           |
| ----------------------- | ------------ | ------------ | -------------------- |
| school_id               | VARCHAR(36)  | PK, NOT NULL | ID informasi sekolah |
| school_name             | VARCHAR(200) | NOT NULL     | Nama sekolah         |
| school_address          | TEXT         | NOT NULL     | Alamat sekolah       |
| school_phone            | VARCHAR(20)  | NULL         | Telepon sekolah      |
| school_email            | VARCHAR(255) | NULL         | Email sekolah        |
| school_logo_url         | TEXT         | NULL         | URL logo             |
| principal_name          | VARCHAR(150) | NULL         | Nama kepala sekolah  |
| active_academic_year_id | VARCHAR(36)  | FK, NOT NULL | Tahun ajaran aktif   |
| created_at              | TIMESTAMP    | NOT NULL     | Waktu pembuatan      |
| updated_at              | TIMESTAMP    | NOT NULL     | Waktu pembaruan      |

**Relasi:**

- FK `active_academic_year_id` → `Academic_Years.academic_year_id`

**Aturan:**

- Tabel hanya memiliki satu baris data.
- Hanya administrator yang dapat mengakses dan mengubah informasi sekolah.
- `active_academic_year_id` merupakan satu-satunya sumber kebenaran tahun ajaran aktif.
- Tahun ajaran yang ditunjuk wajib memiliki periode yang valid.
- Pergantian tahun ajaran dilakukan melalui satu operasi backend yang terkontrol.
- `Academic_Years.academic_year_status` harus disinkronkan dengan nilai pada tabel ini.
- Jika sinkronisasi gagal, pergantian tahun ajaran tidak boleh dilaporkan berhasil.
- Tidak boleh ada dua tahun ajaran berstatus aktif.

### 3.12 Administrative_Audit_Logs

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

**Relasi:**

- FK `actor_user_id` → `Users.user_id`

**Aturan:**

- Mencatat CREATE dan UPDATE pada data administratif.
- Berlaku untuk pengelolaan siswa, guru, kelas, tahun ajaran, penugasan, keanggotaan kelas, dan informasi sekolah.
- Tidak digunakan untuk mencatat perubahan absensi.
- Data audit bersifat append-only.
- Administrator tidak dapat mengubah atau menghapus riwayat audit melalui aplikasi.
- Penghapusan permanen data master tidak diperbolehkan.

---

## 4. Ringkasan Relasi Antartabel

| No. | Tabel Induk         | Tabel Anak                | Relasi                 |
| --- | ------------------- | ------------------------- | ---------------------- |
| 1   | Users               | Teacher_Assignments       | 1:N                    |
| 2   | Users               | Attendance_Sessions       | 1:N                    |
| 3   | Users               | Attendance_Audit_Logs     | 1:N                    |
| 4   | Users               | Student_Contact_Logs      | 1:N                    |
| 5   | Users               | Administrative_Audit_Logs | 1:N                    |
| 6   | Students            | Class_Members             | 1:N                    |
| 7   | Students            | Attendance_Records        | 1:N                    |
| 8   | Students            | Student_Contact_Logs      | 1:N                    |
| 9   | Academic_Years      | Classes                   | 1:N                    |
| 10  | Classes             | Class_Members             | 1:N                    |
| 11  | Classes             | Teacher_Assignments       | 1:N                    |
| 12  | Classes             | Attendance_Sessions       | 1:N                    |
| 13  | Attendance_Sessions | Attendance_Records        | 1:N                    |
| 14  | Class_Members       | Attendance_Records        | 1:N                    |
| 15  | Academic_Years      | School_Information        | 1:1 secara operasional |

**Catatan:** `Attendance_Audit_Logs.session_id` dan `attendance_id` merupakan referensi historis, bukan foreign key.

## 5. Aturan Constraint dan Validasi Global

### 5.1 Primary Key

Semua tabel menggunakan primary key dengan format `VARCHAR(36)`.

Backend menghasilkan ID unik, misalnya UUID.

ID tidak boleh berubah setelah record dibuat.

### 5.2 Foreign Key

Relasi wajib diperiksa backend ketika data dibuat atau diperbarui.

Pada PostgreSQL, foreign key diterapkan secara fisik.

Pada Google Sheets, pemeriksaan dilakukan melalui backend karena tidak tersedia mekanisme foreign key database.

### 5.3 Validasi Periode

Validasi periode berlaku pada:

- Tahun ajaran.
- Keanggotaan siswa dalam kelas.
- Penugasan guru terhadap kelas.

Semua periode menggunakan aturan tanggal inklusif.

Jika satu periode berakhir pada 30 Juni, periode berikutnya dapat dimulai pada 1 Juli.

### 5.4 Validasi Absensi

Sebelum penyimpanan absensi, backend wajib memeriksa:

1. Akun guru aktif.
2. Guru memiliki penugasan aktif untuk kelas tersebut.
3. Tanggal absensi sesuai tanggal saat ini di `Asia/Jakarta`.
4. Belum terdapat sesi absensi untuk kelas dan tanggal tersebut.
5. Siswa memiliki keanggotaan kelas yang berlaku pada tanggal absensi.
6. Setiap siswa hanya memiliki satu record dalam sesi.
7. Status hanya Hadir, Sakit, Izin, atau Alpa.

### 5.5 Validasi Penghapusan

- Data master tidak dapat dihapus permanen.
- Hanya sesi absensi dan seluruh record turunannya yang dapat dihapus.
- Penghapusan harus dilakukan secara konsisten.
- Audit harus berhasil disimpan terlebih dahulu.
- Jika salah satu proses gagal, penghapusan tidak boleh meninggalkan data dalam kondisi tidak konsisten.

## 6. Indeks Database yang Direkomendasikan

Indeks berikut direkomendasikan untuk meningkatkan kecepatan pencarian dan laporan ketika menggunakan PostgreSQL.

| Tabel                     | Kolom Indeks              | Tujuan                         |
| ------------------------- | ------------------------- | ------------------------------ |
| Users                     | auth_user_id              | Pencarian akun OAuth           |
| Users                     | email                     | Pencarian akun                 |
| Students                  | full_name                 | Pencarian siswa                |
| Students                  | student_number            | Pencarian nomor induk          |
| Classes                   | academic_year_id          | Filter kelas berdasarkan tahun |
| Class_Members             | student_id                | Riwayat kelas siswa            |
| Class_Members             | class_id                  | Daftar siswa dalam kelas       |
| Teacher_Assignments       | user_id                   | Penugasan guru                 |
| Teacher_Assignments       | class_id                  | Penanggung jawab kelas         |
| Attendance_Sessions       | class_id, attendance_date | Pencarian absensi harian       |
| Attendance_Sessions       | teacher_user_id           | Riwayat sesi guru              |
| Attendance_Records        | session_id                | Daftar absensi sesi            |
| Attendance_Records        | student_id                | Riwayat absensi siswa          |
| Attendance_Audit_Logs     | session_id                | Riwayat perubahan sesi         |
| Attendance_Audit_Logs     | actor_user_id             | Riwayat tindakan pengguna      |
| Student_Contact_Logs      | student_id                | Riwayat komunikasi siswa       |
| Administrative_Audit_Logs | table_name, record_id     | Riwayat perubahan data         |

Constraint UNIQUE yang telah ditentukan juga harus memiliki indeks unik pada PostgreSQL.

Pada Google Sheets, indeks tersebut tidak tersedia secara native. Backend harus menggunakan strategi pencarian yang sesuai dengan ukuran data.

## 7. Aturan Transaksi dan Konsistensi Data

Operasi berikut harus diperlakukan sebagai satu kesatuan proses.

### 7.1 Penyimpanan Absensi

1. Validasi guru dan kelas.
2. Validasi tanggal dan keanggotaan siswa.
3. Periksa duplikasi sesi.
4. Buat `Attendance_Sessions`.
5. Buat seluruh `Attendance_Records`.
6. Pastikan semua record berhasil disimpan.
7. Berikan konfirmasi keberhasilan.

Jika proses gagal, backend harus melakukan pemulihan agar tidak terdapat sesi tanpa seluruh record yang semestinya.

### 7.2 Pengubahan Absensi

1. Ambil data lama.
2. Validasi hak akses.
3. Siapkan snapshot data lama dan data baru.
4. Simpan audit.
5. Perbarui data absensi.
6. Konfirmasi keberhasilan.

Jika audit gagal, perubahan tidak boleh dilakukan.

### 7.3 Penghapusan Absensi

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

### 7.4 Kenaikan Kelas

1. Validasi tahun ajaran lama dan baru.
2. Validasi kelas tujuan.
3. Ambil seluruh anggota kelas sumber.
4. Terapkan pilihan siswa yang dicentang.
5. Siswa yang tidak dicentang tetap berada pada tingkat kelas yang sama di tahun ajaran baru.
6. Tutup keanggotaan lama.
7. Buat keanggotaan baru.
8. Pastikan seluruh perubahan berhasil.
9. Simpan audit administratif.
10. Konfirmasi keberhasilan.

Operasi harus konsisten dan tidak boleh meninggalkan sebagian siswa sudah dipindahkan sementara sebagian lainnya belum diproses akibat kegagalan operasi.

### 7.5 Pergantian Tahun Ajaran Aktif

1. Validasi tahun ajaran tujuan.
2. Pastikan tanggal periode valid dan tidak bertumpang tindih.
3. Ubah `School_Information.active_academic_year_id`.
4. Sinkronkan status seluruh record pada `Academic_Years`.
5. Simpan audit administratif.
6. Pastikan hanya satu tahun ajaran berstatus aktif.
7. Konfirmasi keberhasilan.

Jika terjadi kegagalan, operasi harus dipulihkan agar sumber kebenaran dan status turunannya tetap konsisten.

---

## 8. Aturan Khusus Google Sheets

Google Sheets digunakan sebagai penyimpanan awal, bukan sebagai pengganti database relasional penuh.

Ketentuan implementasi:

1. Setiap tabel memiliki satu worksheet tersendiri.
2. Baris pertama berisi nama kolom.
3. Backend menjadi satu-satunya pihak yang melakukan perubahan data.
4. Frontend tidak mengakses Google Sheets secara langsung.
5. Kredensial Service Account hanya disimpan di server.
6. Validasi primary key, foreign key, UNIQUE, dan periode dilakukan backend.
7. Operasi multi-sheet harus memiliki mekanisme pengamanan terhadap perubahan bersamaan.
8. Audit disimpan sebelum operasi perubahan atau penghapusan.
9. Data tanggal harus menggunakan format yang konsisten.
10. Jangan mengandalkan nomor baris spreadsheet sebagai identitas record.

Nama worksheet yang digunakan:

1. `Users`
2. `Students`
3. `Academic_Years`
4. `Classes`
5. `Class_Members`
6. `Teacher_Assignments`
7. `Attendance_Sessions`
8. `Attendance_Records`
9. `Attendance_Audit_Logs`
10. `Student_Contact_Logs`
11. `School_Information`
12. `Administrative_Audit_Logs`

## 9. Persiapan Migrasi PostgreSQL

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
- Pertahankan sumber kebenaran tahun ajaran aktif pada `School_Information.active_academic_year_id`.

PostgreSQL dapat memperkuat validasi dengan composite foreign key, exclusion constraint, dan trigger jika diperlukan.

Namun, aturan bisnis tetap harus divalidasi di backend agar perilaku aplikasi konsisten pada kedua jenis penyimpanan.

## 10. Batasan dan Catatan Teknis

Beberapa aturan tidak dapat dijamin hanya menggunakan foreign key biasa.

### 10.1 Kesesuaian Siswa dan Membership

`Attendance_Records.student_id` harus sama dengan `Class_Members.student_id` yang dirujuk oleh `membership_id`.

Foreign key biasa tidak cukup untuk menjamin kesesuaian tersebut.

Solusi:

- Validasi backend pada Google Sheets.
- Composite foreign key atau mekanisme validasi tambahan pada PostgreSQL.

### 10.2 Kesesuaian Kelas dan Membership

Kelas pada `Class_Members` harus sama dengan kelas pada `Attendance_Sessions` yang dirujuk oleh record absensi.

Solusi:

- Validasi backend.
- Penguatan constraint PostgreSQL jika diperlukan.

### 10.3 Periode Tidak Bertumpang Tindih

Pengecekan periode harus memperhatikan seluruh record terkait, bukan hanya tanggal mulai.

Solusi:

- Validasi backend.
- Exclusion constraint atau mekanisme transaksi pada PostgreSQL.

### 10.4 Operasi Multi-Sheet

Google Sheets tidak menyediakan transaksi relasional seperti PostgreSQL.

Karena itu, operasi yang melibatkan beberapa worksheet harus memiliki mekanisme penguncian, validasi ulang, dan pemulihan apabila terjadi kegagalan.

Implementasi mekanisme tersebut tidak memerlukan tabel tambahan.

---

## 11. Checklist Finalisasi Database

- [x] Struktur terdiri dari 12 tabel.
- [x] Seluruh primary key ditentukan.
- [x] Seluruh foreign key ditentukan.
- [x] Unique constraint ditentukan.
- [x] Status dan enum bisnis ditentukan.
- [x] Aturan penghapusan ditentukan.
- [x] Aturan audit ditentukan.
- [x] Aturan periode efektif ditentukan.
- [x] Aturan absensi ditentukan.
- [x] Sumber kebenaran tahun ajaran aktif ditentukan.
- [x] Aturan migrasi PostgreSQL ditentukan.
- [x] Tidak ada penambahan tabel.

## 12. Status Dokumen

`DATABASE.md` versi 1.0 menjadi acuan desain database untuk tahap implementasi.

Setiap perubahan struktur tabel, penambahan kolom, penghapusan kolom, atau penambahan tabel harus mendapatkan persetujuan terlebih dahulu.

Perubahan implementasi yang tidak mengubah struktur database boleh dilakukan selama tetap mengikuti aturan bisnis dan relasi yang telah disepakati.
