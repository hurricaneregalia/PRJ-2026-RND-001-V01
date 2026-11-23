import { PUBLIC_DUMMY_STUDENTS } from "./public-dummy-data";

export default function PublicAttendancePage() {
  return (
    <main>
      <h1>Pencarian Kehadiran Siswa</h1>
      <p>Data yang ditampilkan masih dummy dan belum terhubung ke database.</p>

      <section>
        <h2>Pencarian</h2>
        <label htmlFor="publicSearch">Cari nama siswa</label>
        <input id="publicSearch" type="text" placeholder="Masukkan nama siswa" />
        <button type="button">Cari</button>
      </section>

      <section>
        <h2>Hasil Pencarian</h2>
        <ul>
          {PUBLIC_DUMMY_STUDENTS.map((item) => (
            <li key={item.student_id}>
              {item.student_name} ({item.student_id}) - {item.class_name} - {item.teacher_name}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Detail Siswa</h2>
        <p>Nama: Budi Santoso</p>
        <p>ID: STU-001</p>
        <p>Status: active</p>
        <p>Kelas: Kelas 7A</p>
        <p>Guru: Guru A</p>
      </section>

      <section>
        <h2>Rekap Kehadiran</h2>
        <p>Hadir: 1</p>
        <p>Sakit: 1</p>
        <p>Izin: 1</p>
        <p>Alpa: 1</p>
      </section>

      <section>
        <h2>Riwayat Absensi</h2>
        <ul>
          <li>2026-11-01 - Hadir</li>
          <li>2026-11-02 - Sakit</li>
          <li>2026-11-03 - Izin</li>
          <li>2026-11-04 - Alpa</li>
        </ul>
      </section>
    </main>
  );
}
