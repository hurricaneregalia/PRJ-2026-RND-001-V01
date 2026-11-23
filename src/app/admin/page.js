import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        <p>Halo, Admin</p>
        <p>Hari ini: Senin, 23 November 2026</p>
      </header>
      <section>
        <h2>Grafik Absensi Siswa</h2>
        <ul>
          <li>Hadir: 87%</li>
          <li>Izin: 5%</li>
          <li>Sakit: 4%</li>
          <li>Alfa: 4%</li>
        </ul>
      </section>
      <section>
        <h2>Statistik Utama</h2>
        <ul>
          <li>Total Siswa: 120</li>
          <li>Total Pengajar: 12</li>
          <li>Total Kelas: 8</li>
          <li>Tingkat Kehadiran Hari Ini: 92%</li>
        </ul>
      </section>

      <section>
        <h2>Daftar Kelas</h2>
        <ul>
          <li>
            Matematika A | Budi | 15 siswa | <Link href="tentukan-link-yang-cocok">detail kelas</Link>
          </li>
          <li>
            Bahasa Inggris B | Siti | 12 siswa | <Link href="tentukan-link-yang-cocok">detail kelas</Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>Daftar Guru</h2>
        <ul>
          <li>
            Budi | 2 kelas | <Link href="tentukan-link-yang-cocok">detail profile</Link>
          </li>
          <li>
            Siti | 1 kelas | <Link href="tentukan-link-yang-cocok">detail profile</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Tidak Hadir Tanpa Keterangan 3 Kali</h2>
        <ul>
          <li>
            Andi | Matematika A | Alpa 3 | <Link href="tentukan-link-yang-cocok">beri peringatan</Link>
          </li>
          <li>
            Citra | Bahasa Inggris B | Alpa 6 | <Link href="tentukan-link-yang-cocok">beri peringatan</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Akses Cepat</h2>
        <ul>
          <li>
            <Link href="/admin/siswa/tambah">Tambah Siswa</Link>
          </li>
          <li>
            <Link href="/admin/pengajar/tambah">Tambah Pengajar</Link>
          </li>
          <li>
            <Link href="/admin/kelas/tambah">Tambah Kelas</Link>
          </li>
          <li>
            <Link href="/admin/jadwal/tambah">Buat Jadwal</Link>
          </li>
          <li>
            <Link href="/admin/laporan">Lihat Laporan Absensi</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
