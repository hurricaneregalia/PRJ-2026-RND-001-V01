import Link from "next/link";

export default function TeacherDashboardPage() {
  return (
    <main>
      <h1>Dashboard Guru</h1>
      <p>Data dummy statis.</p>

      <nav>
        <ul>
          <li>
            <Link href="/profile">Nama guru</Link>
          </li>
          <li>
            <Link href="/logout">Logout</Link>
          </li>
        </ul>
      </nav>

      <section>
        <h2>Kelas</h2>
        <p>
          Kelas 7A - Hadir 30, Sakit 2, Izin 1, Alpa 1, <Link href="#">detail kelas</Link>
        </p>
        <p>
          Kelas 7B - Hadir 25, Sakit 3, Izin 2, Alpa 2,<Link href="#">detail kelas</Link>
        </p>
      </section>

      <section>
        <h2>Perhatian</h2>
        <p>
          Nama siswa 1 - Alpa 3, <Link href="#">tangani</Link>
        </p>
        <p>
          Nama siswa 2 - Alpa 4, <Link href="#">tangani</Link>
        </p>
        <p>
          Nama siswa 3 - Alpa 7, <Link href="#">tangani</Link>
        </p>
      </section>
      <section>
        <h2>Grafik statistik kehadiran</h2>
      </section>
      <section>
        <h2>Siswa</h2>
        <p>Total siswa aktif</p>
        <p>Total siswa hadir</p>
        <p>Total siswa sakit</p>
        <p>Total siswa izin</p>
        <p>Total siswa alpa</p>
      </section>
    </main>
  );
}
