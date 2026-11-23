import Link from "next/link";

export default function TeacherAttentionPage() {
  return (
    <main>
      <h1>Daftar Perhatian Kehadiran</h1>
      <p>Data dummy statis.</p>

      <nav>
        <Link href="/teacher/dashboard">Dashboard</Link>
        <Link href="/teacher/attendance">Absensi</Link>
        <Link href="/teacher/attendance/attention">Daftar Perhatian</Link>
        <Link href="/logout">Logout</Link>
      </nav>

      <section>
        <h2>Siswa Perhatian</h2>
        <ul>
          <li>Budi Santoso - Kelas 7A - Alpa: 3 - Siapkan laporan</li>
          <li>Ani Wijaya - Kelas 8A - Alpa: 4 - Siapkan laporan</li>
          <li>Citra Lestari - Kelas 9A - Alpa: 3 - Siapkan laporan</li>
        </ul>
      </section>

      <section>
        <h2>Persiapan WhatsApp</h2>
        <p>Nama siswa: Budi Santoso</p>
        <p>Nama orang tua: Ibu Siti</p>
        <p>Hubungan: Ibu</p>
        <p>Kelas: Kelas 7A</p>
        <p>Jumlah Alpa: 3</p>
        <p>Pratinjau pesan: Ibu Siti, mohon perhatian kehadiran Budi Santoso. Tautan: /kehadiran?student=STU-001</p>
        <p>Tautan publik: /kehadiran?student=STU-001</p>
        <button type="button">Buka WhatsApp</button>
      </section>
    </main>
  );
}
