import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main>
      <nav>
        <ul>
          <li>
            <Link href="/admin/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/admin/users">Manajemen Pengguna</Link>
          </li>
          <li>
            <Link href="/admin/classes">Manajemen Kelas</Link>
          </li>
          <li>
            <Link href="/admin/assignments">Manajemen Guru</Link>
          </li>
          <li>
            <Link href="/admin/students">Manajemen Siswa</Link>
          </li>
        </ul>
      </nav>
      <h1>Dashboard Administrator</h1>
      <p>Data dummy statis.</p>
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
      <section>
        <h2>Kelas</h2>
        <p>
          Kelas 7A - Hadir 30, Sakit 2, Izin 1, Alpa 1, <Link href="#">detail kelas</Link>
        </p>
        <p>
          Kelas 7B - Hadir 25, Sakit 3, Izin 2, Alpa 2,<Link href="#">detail kelas</Link>
        </p>
        <p>
          Kelas 8A - Hadir 25, Sakit 5, Izin 2, Alpa 2,<Link href="#">detail kelas</Link>
        </p>
      </section>
      <section>
        <h2>Guru Aktif</h2>
        <p>
          Nama guru 1 - jumlah kelas, <Link href="/profile/id">detail guru</Link>
        </p>
        <p>
          Nama guru 2 - jumlah kelas, <Link href="/profile/id">detail guru</Link>
        </p>
        <p>
          Nama guru 3 - jumlah kelas, <Link href="/profile/id">detail guru</Link>
        </p>
      </section>
    </main>
  );
}
